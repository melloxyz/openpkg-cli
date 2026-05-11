import boxen from 'boxen';
import chalk from 'chalk';
import { createAppContainer } from '../core/container.js';
import { getDefaultProjectRoots } from '../utils/filesystem.js';
import { formatBytes } from '../utils/format.js';
import { renderBrandTitle, theme } from '../shared/theme.js';
import type {
  CleanupTargetRecord,
  EnvironmentHealthSnapshot,
  NavigationSection,
  ProjectRecord
} from '../types/index.js';

const container = createAppContainer();

export const runHeadlessCli = async (commandInput: string): Promise<void> => {
  const command = container.commandRegistry.resolve(commandInput);

  if (!command) {
    process.stdout.write(
      `${boxen(`Unknown command: ${commandInput}\nTry /help`, {
        borderStyle: 'round',
        borderColor: theme.danger,
        padding: 1
      })}\n`
    );
    return;
  }

  let activeSection: NavigationSection = 'overview';
  let projects: ProjectRecord[] = [];
  let cleanupTargets: CleanupTargetRecord[] = [];
  let health: EnvironmentHealthSnapshot | undefined;

  const result = await command.execute(container.commandRegistry.parse(commandInput), {
    cwd: process.cwd(),
    homeDir: process.env.USERPROFILE ?? process.cwd()
  });

  if (result.targetSection) {
    activeSection = result.targetSection;
  }

  const roots = await getDefaultProjectRoots(process.cwd());

  if (result.triggerProjectScan) {
    const summary = await container.projectScanner.scan(roots);
    projects = summary.records;
  }

  if (result.triggerCleanupScan) {
    const summary = await container.cleanupScanner.scan(roots);
    cleanupTargets = summary.records;
  }

  if (result.triggerDoctorScan) {
    health = await container.environmentService.getHealthSnapshot();
  }

  const statusLine = result.message;

  const lines = [
    renderBrandTitle('OpenPgk'),
    '',
    chalk.hex(theme.primary)(`Section: ${activeSection}`),
    chalk.hex(theme.text)(statusLine),
    ''
  ];

  if (health) {
    lines.push(
      chalk.hex(theme.text)(`Node: ${health.nodeVersion}`),
      chalk.hex(theme.text)(
        `Package Managers: ${Object.entries(health.packageManagers)
          .map(([name, enabled]) => `${name}:${enabled ? 'ok' : 'missing'}`)
          .join('  ')}`
      ),
      ''
    );
  }

  if (projects.length > 0) {
    lines.push(chalk.hex(theme.accent)(`Projects (${projects.length})`));
    lines.push(
      ...projects
        .slice(0, 5)
        .map((project) => `• ${project.name}  ${project.framework}  ${project.packageManager}`)
    );
    lines.push('');
  }

  if (cleanupTargets.length > 0) {
    const reclaimable = cleanupTargets.reduce((total, item) => total + (item.sizeInBytes ?? 0), 0);
    lines.push(chalk.hex(theme.accent)(`Cleanup Targets (${cleanupTargets.length})`));
    lines.push(`Potential reclaimable space: ${formatBytes(reclaimable)}`);
    lines.push(
      ...cleanupTargets
        .slice(0, 5)
        .map((item) => `• ${item.kind}  ${item.recommendation}  ${formatBytes(item.sizeInBytes)}`)
    );
  }

  process.stdout.write(
    `${boxen(lines.join('\n'), {
      borderStyle: 'round',
      borderColor: theme.panelBorder,
      padding: 1
    })}\n`
  );
};
