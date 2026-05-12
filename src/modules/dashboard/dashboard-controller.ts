import os from 'node:os';
import type {
  CleanupTargetRecord,
  CommandExecutionContext,
  CommandResult,
  DashboardDataSnapshot,
  OperationProgress,
  ScanScope
} from '../../types/index.js';
import { createAppContainer } from '../../core/container.js';
import { formatBytes } from '../../utils/format.js';
import { getDefaultProjectRoots, getMachineScanRoots } from '../../utils/filesystem.js';

type ProgressListener = (progress: OperationProgress | undefined) => void;

type RunOptions = {
  onProgress?: ProgressListener;
  scopeOverride?: ScanScope;
};

export class DashboardController {
  readonly #container = createAppContainer();

  async hydrateFromCache(): Promise<DashboardDataSnapshot> {
    const roots = await this.#getRoots();
    const [projects, cleanupTargets, health] = await Promise.all([
      this.#container.scanCache.getProjectSummary(roots),
      this.#container.scanCache.getCleanupSummary(roots),
      this.#container.scanCache.getHealthSnapshot()
    ]);

    return {
      roots,
      scope: 'developer-home',
      ...(projects ? { projects: projects.records } : {}),
      ...(cleanupTargets ? { cleanupTargets: cleanupTargets.records } : {}),
      ...(health ? { health } : {}),
      statusLine:
        projects || cleanupTargets || health
          ? 'Loaded cached snapshot. Run /scan for a live refresh.'
          : 'Ready. Press / to open the command palette.'
    };
  }

  async runCommand(commandInput: string, options: RunOptions = {}): Promise<DashboardDataSnapshot> {
    const command = this.#container.commandRegistry.resolve(commandInput);

    if (!command) {
      return {
        roots: await this.#getRoots(options.scopeOverride),
        scope: options.scopeOverride ?? 'developer-home',
        statusLine: `Unknown command: ${commandInput}`
      };
    }

    const context: CommandExecutionContext = {
      cwd: process.cwd(),
      homeDir: os.homedir()
    };

    const parsedCommand = this.#container.commandRegistry.parse(commandInput);
    const result = await command.execute(parsedCommand, context);

    return this.#applyCommandResult(result, options);
  }

  async deleteCleanupTargets(
    targets: CleanupTargetRecord[],
    scope: ScanScope = 'developer-home',
    onProgress?: ProgressListener
  ): Promise<DashboardDataSnapshot> {
    if (targets.length === 0) {
      return {
        roots: await this.#getRoots(scope),
        scope,
        statusLine: 'No cleanup targets selected.'
      };
    }

    onProgress?.({
      label: 'Deleting selected targets',
      current: 0,
      total: Math.max(1, targets.length),
      detail: `Preparing ${targets.length} target(s)`
    });

    const cleanupExecution = await this.#container.cleanupExecutor.deleteTargets(targets);

    onProgress?.({
      label: 'Refreshing cleanup inventory',
      current: targets.length,
      total: Math.max(1, targets.length + 1),
      detail: 'Rebuilding candidate list'
    });

    const cleanupSummary = await this.#scanCleanup(await this.#getRoots(scope), 'force');
    const deletedCount = cleanupExecution.deleted.length;
    const failedCount = cleanupExecution.failed.length;
    const parts = [
      `Deleted ${deletedCount} target(s)`,
      `reclaimed ${formatBytes(cleanupExecution.reclaimedBytes)}`
    ];

    if (failedCount > 0) {
      parts.push(`${failedCount} failed`);
    }

    onProgress?.(undefined);

    return {
      roots: cleanupSummary.roots,
      scope,
      cleanupTargets: cleanupSummary.records,
      cleanupExecution,
      activeSection: 'cleanup',
      statusLine: `${parts.join(', ')}.`
    };
  }

  getHelpLines() {
    return this.#container.commandRegistry.getAll().map((command) => {
      const aliases = command.aliases?.length ? ` (${command.aliases.join(', ')})` : '';
      return `/${command.name}${aliases}  ${command.description}`;
    });
  }

  async refreshSection(
    section: DashboardDataSnapshot['activeSection'],
    scope: ScanScope = 'developer-home',
    onProgress?: ProgressListener
  ) {
    const commandMap: Record<string, string> = {
      overview: `/scan --scope=${scope}`,
      projects: `/projects --scope=${scope}`,
      cache: `/cache --scope=${scope}`,
      cleanup: `/cleanup --scope=${scope}`,
      doctor: '/doctor'
    };

    if (section === 'settings') {
      return {
        roots: await this.#getRoots(scope),
        scope,
        activeSection: 'settings',
        statusLine: 'Settings panel refreshed.'
      } satisfies DashboardDataSnapshot;
    }

    return this.runCommand(commandMap[section ?? 'overview'] ?? `/scan --scope=${scope}`, {
      scopeOverride: scope,
      ...(onProgress ? { onProgress } : {})
    });
  }

  get commandRegistry() {
    return this.#container.commandRegistry;
  }

  async #applyCommandResult(
    result: CommandResult,
    options: RunOptions = {}
  ): Promise<DashboardDataSnapshot> {
    const scope = options.scopeOverride ?? result.scope ?? 'developer-home';
    const roots = await this.#getRoots(scope);
    const cachePolicy = result.cachePolicy ?? 'force';
    let statusLine = result.message;
    let projects = undefined;
    let cleanupTargets = undefined;
    let health = undefined;
    let cleanupExecution = undefined;

    const totalStages =
      Number(Boolean(result.triggerProjectScan)) +
      Number(Boolean(result.triggerCleanupScan)) +
      Number(Boolean(result.triggerDoctorScan)) +
      Number(Boolean(result.cleanupDryRun)) +
      Number(Boolean(result.cleanupDeletionMode === 'safe'));
    let currentStage = 0;

    const pushStage = (label: string, detail?: string) => {
      currentStage += 1;
      options.onProgress?.({
        label,
        current: currentStage,
        total: Math.max(1, totalStages),
        ...(detail ? { detail } : {})
      });
    };

    if (result.triggerProjectScan) {
      pushStage('Scanning projects', `${roots.length} root(s)`);
      const summary = await this.#scanProjects(roots, cachePolicy);
      projects = summary.records;
      statusLine = `${statusLine} Found ${summary.records.length} project(s).`;
    }

    if (result.triggerCleanupScan) {
      pushStage('Scanning cleanup targets', `${roots.length} root(s)`);
      const summary = await this.#scanCleanup(roots, cachePolicy);
      cleanupTargets = summary.records;
      statusLine = `Cleanup inventory ready with ${summary.records.length} target(s).`;
    }

    if (result.cleanupDryRun) {
      pushStage('Previewing safe cleanup targets');
      const previewCandidates =
        cleanupTargets?.filter((target) => target.recommendation === 'safe') ??
        (await this.#scanCleanup(roots, 'force')).records.filter(
          (target) => target.recommendation === 'safe'
        );
      cleanupExecution = await this.#container.cleanupExecutor.previewTargets(previewCandidates);
      const plannedCount = cleanupExecution.planned?.length ?? 0;
      statusLine = `Dry-run preview: ${plannedCount} safe target(s), ${formatBytes(
        cleanupExecution.reclaimedBytes
      )} reclaimable. No files deleted.`;

      if (cleanupExecution.failed.length > 0) {
        statusLine = `${statusLine} ${cleanupExecution.failed.length} target(s) failed validation.`;
      }
    }

    if (result.cleanupDeletionMode === 'safe') {
      pushStage('Deleting safe cleanup targets');
      const deletionCandidates =
        cleanupTargets?.filter((target) => target.recommendation === 'safe') ??
        (await this.#scanCleanup(roots, 'force')).records.filter(
          (target) => target.recommendation === 'safe'
        );
      cleanupExecution = await this.#container.cleanupExecutor.deleteTargets(deletionCandidates);
      const refreshedCleanup = await this.#scanCleanup(roots, 'force');
      cleanupTargets = refreshedCleanup.records;
      statusLine = `Deleted ${cleanupExecution.deleted.length} safe target(s), reclaimed ${formatBytes(
        cleanupExecution.reclaimedBytes
      )}.`;

      if (cleanupExecution.failed.length > 0) {
        statusLine = `${statusLine} ${cleanupExecution.failed.length} target(s) failed.`;
      }
    }

    if (result.triggerDoctorScan) {
      pushStage('Collecting diagnostics');
      health = await this.#scanHealth(cachePolicy);
      statusLine = `${result.message} ${
        Object.values(health.packageManagers).filter(Boolean).length
      } package managers detected.`;
    }

    options.onProgress?.(undefined);

    return {
      roots,
      scope,
      ...(projects ? { projects } : {}),
      ...(cleanupTargets ? { cleanupTargets } : {}),
      ...(health ? { health } : {}),
      ...(result.targetSection ? { activeSection: result.targetSection } : {}),
      ...(cleanupExecution ? { cleanupExecution } : {}),
      ...(result.showHelp ? { helpLines: this.getHelpLines() } : {}),
      statusLine
    };
  }

  async #scanProjects(roots: string[], cachePolicy: CommandResult['cachePolicy']) {
    if (cachePolicy === 'prefer-cache') {
      const cached = await this.#container.scanCache.getProjectSummary(roots);
      if (cached) {
        return cached;
      }
    }

    const summary = await this.#container.projectScanner.scan(roots);
    await this.#container.scanCache.setProjectSummary(summary);
    return summary;
  }

  async #scanCleanup(roots: string[], cachePolicy: CommandResult['cachePolicy']) {
    if (cachePolicy === 'prefer-cache') {
      const cached = await this.#container.scanCache.getCleanupSummary(roots);
      if (cached) {
        return cached;
      }
    }

    const summary = await this.#container.cleanupScanner.scan(roots);
    await this.#container.scanCache.setCleanupSummary(summary);
    return summary;
  }

  async #scanHealth(cachePolicy: CommandResult['cachePolicy']) {
    if (cachePolicy === 'prefer-cache') {
      const cached = await this.#container.scanCache.getHealthSnapshot();
      if (cached) {
        return cached;
      }
    }

    const snapshot = await this.#container.environmentService.getHealthSnapshot();
    await this.#container.scanCache.setHealthSnapshot(snapshot);
    return snapshot;
  }

  async #getRoots(scope: ScanScope = 'developer-home') {
    if (scope === 'workspace') {
      return [process.cwd()];
    }

    if (scope === 'machine') {
      return getMachineScanRoots();
    }

    return getDefaultProjectRoots(process.cwd());
  }
}
