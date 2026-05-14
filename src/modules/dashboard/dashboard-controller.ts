import os from 'node:os';
import type {
  CleanupTargetRecord,
  CommandExecutionContext,
  CommandResult,
  DashboardDataSnapshot,
  OperationProgress,
  SettingsSnapshot,
  ScanProgress,
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

const formatScanProgressDetail = (progress: ScanProgress) => {
  const progressLine =
    progress.phase === 'discovering'
      ? `${progress.visited}/${progress.total} root(s), ${progress.matched} match(es)`
      : `${progress.visited}/${progress.total} item(s) processed`;

  return progress.currentPath ? `${progressLine} • ${progress.currentPath}` : progressLine;
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
      settings: await this.#buildSettingsSnapshot('developer-home', roots, {
        projectsLoaded: projects?.records.length ?? 0,
        cleanupLoaded: cleanupTargets?.records.length ?? 0,
        healthLoaded: Boolean(health)
      }),
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

    const cleanupExecution = await this.#container.cleanupExecutor.deleteTargets(targets, {
      onProgress: (progress) => {
        onProgress?.({
          label:
            progress.phase === 'deleting'
              ? 'Deleting selected targets'
              : 'Finalizing cleanup execution',
          current: progress.current,
          total: Math.max(1, progress.total),
          detail: progress.currentPath ?? `${progress.current}/${progress.total} target(s)`
        });
      }
    });

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
      dashboard: `/scan --scope=${scope}`,
      packages: `/projects --scope=${scope}`,
      cleanup: `/cleanup --scope=${scope}`,
      scripts: '/doctor',
      search: '/help'
    };

    if (section === 'settings' || section === 'registry' || section === 'scripts' || section === 'search') {
      const roots = await this.#getRoots(scope);
      return {
        roots,
        scope,
        activeSection: section,
        settings: await this.#buildSettingsSnapshot(scope, roots),
        ...(section === 'search' ? { helpLines: this.getHelpLines() } : {}),
        statusLine:
          section === 'settings'
            ? 'Settings panel refreshed.'
            : section === 'registry'
              ? 'Registry panel refreshed.'
            : section === 'scripts'
              ? 'Scripts panel refreshed.'
              : 'Search panel refreshed.'
      } satisfies DashboardDataSnapshot;
    }

    return this.runCommand(commandMap[section ?? 'dashboard'] ?? `/scan --scope=${scope}`, {
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
    const scope = result.scope ?? options.scopeOverride ?? 'developer-home';
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
    const takeStage = () => {
      currentStage += 1;
      return currentStage;
    };

    const pushStage = (label: string, detail?: string) => {
      const stageSlot = takeStage();
      options.onProgress?.({
        label,
        current: stageSlot,
        total: Math.max(1, totalStages),
        ...(detail ? { detail } : {})
      });
    };

    const forwardScanProgress = (stageSlot: number, label: string, progress: ScanProgress) => {
      const ratio =
        progress.total <= 0 ? 1 : Math.max(0, Math.min(progress.visited / progress.total, 1));
      const phaseLabel =
        progress.phase === 'discovering'
          ? `${label}: discovering`
          : progress.phase === 'sizing'
            ? `${label}: sizing`
            : label;

      options.onProgress?.({
        label: phaseLabel,
        current: stageSlot - 1 + ratio,
        total: Math.max(1, totalStages),
        detail: formatScanProgressDetail(progress)
      });
    };

    if (result.triggerProjectScan) {
      const stageSlot = takeStage();
      options.onProgress?.({
        label: 'Scanning projects',
        current: stageSlot - 1,
        total: Math.max(1, totalStages),
        detail: `${roots.length} root(s)`
      });
      const summary = await this.#scanProjects(roots, cachePolicy, (progress) =>
        forwardScanProgress(stageSlot, 'Scanning projects', progress)
      );
      projects = summary.records;
      statusLine = `${statusLine} Found ${summary.records.length} project(s).`;
    }

    if (result.triggerCleanupScan) {
      const stageSlot = takeStage();
      options.onProgress?.({
        label: 'Scanning cleanup targets',
        current: stageSlot - 1,
        total: Math.max(1, totalStages),
        detail: `${roots.length} root(s)`
      });
      const summary = await this.#scanCleanup(roots, cachePolicy, (progress) =>
        forwardScanProgress(stageSlot, 'Scanning cleanup targets', progress)
      );
      cleanupTargets = summary.records;
      statusLine = `Cleanup inventory ready with ${summary.records.length} target(s).`;
    }

    if (result.cleanupDryRun) {
      const stageSlot = takeStage();
      options.onProgress?.({
        label: 'Previewing safe cleanup targets',
        current: stageSlot - 1,
        total: Math.max(1, totalStages)
      });
      const previewCandidates =
        cleanupTargets?.filter((target) => target.recommendation === 'safe') ??
        (await this.#scanCleanup(roots, 'force')).records.filter(
          (target) => target.recommendation === 'safe'
        );
      cleanupExecution = await this.#container.cleanupExecutor.previewTargets(previewCandidates, {
        onProgress: (progress) => {
          const ratio =
            progress.total <= 0 ? 1 : Math.max(0, Math.min(progress.current / progress.total, 1));
          options.onProgress?.({
            label:
              progress.phase === 'validating'
                ? 'Previewing safe cleanup targets'
                : 'Finalizing cleanup preview',
            current: stageSlot - 1 + ratio,
            total: Math.max(1, totalStages),
            detail:
              progress.currentPath ?? `${progress.current}/${Math.max(1, progress.total)} target(s)`
          });
        }
      });
      const plannedCount = cleanupExecution.planned?.length ?? 0;
      statusLine = `Dry-run preview: ${plannedCount} safe target(s), ${formatBytes(
        cleanupExecution.reclaimedBytes
      )} reclaimable. No files deleted.`;

      if (cleanupExecution.failed.length > 0) {
        statusLine = `${statusLine} ${cleanupExecution.failed.length} target(s) failed validation.`;
      }
    }

    if (result.cleanupDeletionMode === 'safe') {
      const stageSlot = takeStage();
      options.onProgress?.({
        label: 'Deleting safe cleanup targets',
        current: stageSlot - 1,
        total: Math.max(1, totalStages)
      });
      const deletionCandidates =
        cleanupTargets?.filter((target) => target.recommendation === 'safe') ??
        (await this.#scanCleanup(roots, 'force')).records.filter(
          (target) => target.recommendation === 'safe'
        );
      cleanupExecution = await this.#container.cleanupExecutor.deleteTargets(deletionCandidates, {
        onProgress: (progress) => {
          const ratio =
            progress.total <= 0 ? 1 : Math.max(0, Math.min(progress.current / progress.total, 1));
          options.onProgress?.({
            label:
              progress.phase === 'deleting'
                ? 'Deleting safe cleanup targets'
                : 'Finalizing cleanup deletion',
            current: stageSlot - 1 + ratio,
            total: Math.max(1, totalStages),
            detail:
              progress.currentPath ?? `${progress.current}/${Math.max(1, progress.total)} target(s)`
          });
        }
      });
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
      health = await this.#scanHealth(cachePolicy, result.updateFetchPolicy);
      statusLine = result.updatesOnly
        ? `${result.message} ${
            health.toolAvailability.filter((tool) => tool.updateStatus).length
          } tool(s) inspected for updates.`
        : `${result.message} ${
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
      ...(result.updatesOnly ? { updatesOnly: true } : {}),
      ...(result.showHelp ? { helpLines: this.getHelpLines() } : {}),
      ...(result.targetSection === 'settings'
        ? { settings: await this.#buildSettingsSnapshot(scope, roots) }
        : {}),
      statusLine
    };
  }

  async #scanProjects(
    roots: string[],
    cachePolicy: CommandResult['cachePolicy'],
    onProgress?: (progress: ScanProgress) => void
  ) {
    if (cachePolicy === 'prefer-cache') {
      const cached = await this.#container.scanCache.getProjectSummary(roots);
      if (cached) {
        return cached;
      }
    }

    const summary = await this.#container.projectScanner.scan(
      roots,
      onProgress ? { onProgress } : {}
    );
    await this.#container.scanCache.setProjectSummary(summary);
    return summary;
  }

  async #scanCleanup(
    roots: string[],
    cachePolicy: CommandResult['cachePolicy'],
    onProgress?: (progress: ScanProgress) => void
  ) {
    if (cachePolicy === 'prefer-cache') {
      const cached = await this.#container.scanCache.getCleanupSummary(roots);
      if (cached) {
        return cached;
      }
    }

    const summary = await this.#container.cleanupScanner.scan(
      roots,
      onProgress ? { onProgress } : {}
    );
    await this.#container.scanCache.setCleanupSummary(summary);
    return summary;
  }

  async #scanHealth(
    cachePolicy: CommandResult['cachePolicy'],
    updateFetchPolicy: CommandResult['updateFetchPolicy'] = 'auto'
  ) {
    if (cachePolicy === 'prefer-cache') {
      const cached = await this.#container.scanCache.getHealthSnapshot();
      if (cached) {
        return cached;
      }
    }

    const snapshot = await this.#container.environmentService.getHealthSnapshot();
    const cachedUpdates = await this.#container.scanCache.getEnvironmentUpdatesSnapshot();
    const updates =
      updateFetchPolicy === 'force'
        ? await this.#container.environmentUpdatesService.getSnapshot()
        : updateFetchPolicy === 'auto'
          ? cachedUpdates ?? (await this.#container.environmentUpdatesService.getSnapshot())
          : cachedUpdates;

    const mergedSnapshot = this.#container.environmentUpdatesService.mergeHealthSnapshot(
      snapshot,
      updates
    );

    if (updates?.tools.some((tool) => tool.fetchState === 'ok')) {
      await this.#container.scanCache.setEnvironmentUpdatesSnapshot(updates);
    }

    await this.#container.scanCache.setHealthSnapshot(mergedSnapshot);
    return mergedSnapshot;
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

  async #buildSettingsSnapshot(
    scope: ScanScope,
    roots: string[],
    cacheState?: SettingsSnapshot['cacheState']
  ): Promise<SettingsSnapshot> {
    const [projectSummary, cleanupSummary, healthSnapshot] = cacheState
      ? [undefined, undefined, undefined]
      : await Promise.all([
          this.#container.scanCache.getProjectSummary(roots),
          this.#container.scanCache.getCleanupSummary(roots),
          this.#container.scanCache.getHealthSnapshot()
        ]);

    return {
      scope,
      roots,
      availableCommands: this.#container.commandRegistry.getAll().map((command) => ({
        name: command.name,
        description: command.description,
        aliases: command.aliases ?? [],
        ...(command.usage ? { usage: command.usage } : {})
      })),
      cacheState: cacheState ?? {
        projectsLoaded: projectSummary?.records.length ?? 0,
        cleanupLoaded: cleanupSummary?.records.length ?? 0,
        healthLoaded: Boolean(healthSnapshot)
      }
    };
  }
}
