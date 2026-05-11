import os from 'node:os';
import type {
  CleanupTargetRecord,
  CommandExecutionContext,
  EnvironmentHealthSnapshot,
  NavigationSection,
  ProjectRecord
} from '../../types/index.js';
import { getDefaultProjectRoots } from '../../utils/filesystem.js';
import { createAppContainer } from '../../core/container.js';

export class DashboardController {
  readonly #container = createAppContainer();

  async runCommand(
    commandInput: string,
    handlers: {
      setSection: (value: NavigationSection) => void;
      setStatus: (value: string) => void;
      setProjects: (value: ProjectRecord[]) => void;
      setCleanupTargets: (value: CleanupTargetRecord[]) => void;
      setHealth: (value: EnvironmentHealthSnapshot) => void;
    }
  ): Promise<void> {
    const command = this.#container.commandRegistry.resolve(commandInput);

    if (!command) {
      handlers.setStatus(`Unknown command: ${commandInput}`);
      return;
    }

    const context: CommandExecutionContext = {
      cwd: process.cwd(),
      homeDir: os.homedir()
    };

    const result = await command.execute(
      this.#container.commandRegistry.parse(commandInput),
      context
    );
    handlers.setStatus(result.message);

    if (result.targetSection) {
      handlers.setSection(result.targetSection);
    }

    const roots = await getDefaultProjectRoots(process.cwd());

    if (result.triggerProjectScan) {
      const summary = await this.#container.projectScanner.scan(roots);
      handlers.setProjects(summary.records);
      handlers.setStatus(`${result.message} Found ${summary.records.length} project(s).`);
    }

    if (result.triggerCleanupScan) {
      const summary = await this.#container.cleanupScanner.scan(roots);
      handlers.setCleanupTargets(summary.records);
      handlers.setStatus(`Cleanup scan ready with ${summary.records.length} target(s).`);
    }

    if (result.triggerDoctorScan) {
      const health = await this.#container.environmentService.getHealthSnapshot();
      handlers.setHealth(health);
      handlers.setStatus(
        `${result.message} ${Object.values(health.packageManagers).filter(Boolean).length} package managers detected.`
      );
    }
  }

  get commandRegistry() {
    return this.#container.commandRegistry;
  }
}
