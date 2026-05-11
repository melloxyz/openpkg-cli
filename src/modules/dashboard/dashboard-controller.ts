import os from 'node:os';
import type { CleanupTargetRecord, CommandExecutionContext, CommandResult, DashboardDataSnapshot } from '../../types/index.js';
import { createAppContainer } from '../../core/container.js';
import { formatBytes } from '../../utils/format.js';
import { getDefaultProjectRoots } from '../../utils/filesystem.js';

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
      ...(projects ? { projects: projects.records } : {}),
      ...(cleanupTargets ? { cleanupTargets: cleanupTargets.records } : {}),
      ...(health ? { health } : {}),
      statusLine:
        projects || cleanupTargets || health
          ? 'Loaded cached snapshot. Run /scan for a live refresh.'
          : 'Ready. Press / to open the command palette.'
    };
  }

  async runCommand(commandInput: string): Promise<DashboardDataSnapshot> {
    const command = this.#container.commandRegistry.resolve(commandInput);

    if (!command) {
      return {
        roots: await this.#getRoots(),
        statusLine: `Unknown command: ${commandInput}`
      };
    }

    const context: CommandExecutionContext = {
      cwd: process.cwd(),
      homeDir: os.homedir()
    };

    const parsedCommand = this.#container.commandRegistry.parse(commandInput);
    const result = await command.execute(parsedCommand, context);

    return this.#applyCommandResult(result);
  }

  async deleteCleanupTargets(targets: CleanupTargetRecord[]): Promise<DashboardDataSnapshot> {
    if (targets.length === 0) {
      return {
        roots: await this.#getRoots(),
        statusLine: 'No cleanup targets selected.'
      };
    }

    const cleanupExecution = await this.#container.cleanupExecutor.deleteTargets(targets);
    const cleanupSummary = await this.#scanCleanup(await this.#getRoots(), 'force');
    const deletedCount = cleanupExecution.deleted.length;
    const failedCount = cleanupExecution.failed.length;
    const parts = [
      `Deleted ${deletedCount} target(s)`,
      `reclaimed ${formatBytes(cleanupExecution.reclaimedBytes)}`
    ];

    if (failedCount > 0) {
      parts.push(`${failedCount} failed`);
    }

    return {
      roots: cleanupSummary.roots,
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

  async refreshSection(section: DashboardDataSnapshot['activeSection']) {
    switch (section) {
      case 'projects':
        return this.runCommand('/projects');
      case 'cache':
        return this.runCommand('/cache');
      case 'cleanup':
        return this.runCommand('/cleanup');
      case 'doctor':
        return this.runCommand('/doctor');
      case 'settings':
        return {
          roots: await this.#getRoots(),
          activeSection: 'settings',
          statusLine: 'Settings panel refreshed.'
        } satisfies DashboardDataSnapshot;
      case 'overview':
      default:
        return this.runCommand('/scan');
    }
  }

  get commandRegistry() {
    return this.#container.commandRegistry;
  }

  async #applyCommandResult(result: CommandResult): Promise<DashboardDataSnapshot> {
    const roots = await this.#getRoots(result.scope);
    const cachePolicy = result.cachePolicy ?? 'force';
    let statusLine = result.message;
    let projects = undefined;
    let cleanupTargets = undefined;
    let health = undefined;
    let cleanupExecution = undefined;

    if (result.triggerProjectScan) {
      const summary = await this.#scanProjects(roots, cachePolicy);
      projects = summary.records;
      statusLine = `${statusLine} Found ${summary.records.length} project(s).`;
    }

    if (result.triggerCleanupScan) {
      const summary = await this.#scanCleanup(roots, cachePolicy);
      cleanupTargets = summary.records;
      statusLine = `Cleanup inventory ready with ${summary.records.length} target(s).`;
    }

    if (result.cleanupDeletionMode === 'safe') {
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
      health = await this.#scanHealth(cachePolicy);
      statusLine = `${result.message} ${
        Object.values(health.packageManagers).filter(Boolean).length
      } package managers detected.`;
    }

    return {
      roots,
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

  async #getRoots(scope: CommandResult['scope'] = 'developer-home') {
    if (scope === 'workspace') {
      return [process.cwd()];
    }

    return getDefaultProjectRoots(process.cwd());
  }
}
