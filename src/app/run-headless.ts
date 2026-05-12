import boxen from 'boxen';
import chalk from 'chalk';
import { DashboardController } from '../modules/dashboard/dashboard-controller.js';
import { formatBytes } from '../utils/format.js';
import { renderBrandTitle, theme } from '../shared/theme.js';

const controller = new DashboardController();

export const runHeadlessCli = async (commandInput: string): Promise<void> => {
  const snapshot = await controller.runCommand(commandInput);

  const lines = [
    renderBrandTitle('OpenPkg'),
    '',
    chalk.hex(theme.primary)(`Section: ${snapshot.activeSection ?? 'overview'}`),
    chalk.hex(theme.text)(snapshot.statusLine),
    ''
  ];

  if (snapshot.health) {
    lines.push(
      chalk.hex(theme.text)(`Node: ${snapshot.health.nodeVersion}`),
      chalk.hex(theme.text)(
        `Tools: ${snapshot.health.toolAvailability
          .map((tool) => `${tool.name}:${tool.available ? 'ok' : 'missing'}`)
          .join('  ')}`
      ),
      ''
    );
  }

  if (snapshot.projects?.length) {
    lines.push(chalk.hex(theme.accent)(`Projects (${snapshot.projects.length})`));
    lines.push(
      ...snapshot.projects
        .slice(0, 5)
        .map(
          (project) =>
            `• ${project.name}  ${project.framework}  ${project.packageManager}  ${project.activityStatus}`
        )
    );
    lines.push('');
  }

  if (snapshot.cleanupTargets?.length) {
    const reclaimable = snapshot.cleanupTargets.reduce(
      (total, item) => total + (item.sizeInBytes ?? 0),
      0
    );
    lines.push(chalk.hex(theme.accent)(`Cleanup Targets (${snapshot.cleanupTargets.length})`));
    lines.push(`Potential reclaimable space: ${formatBytes(reclaimable)}`);
    lines.push(
      ...snapshot.cleanupTargets
        .slice(0, 5)
        .map((item) => `• ${item.kind}  ${item.recommendation}  ${formatBytes(item.sizeInBytes)}`)
    );
    lines.push('');
  }

  if (snapshot.cleanupExecution) {
    const plannedCount = snapshot.cleanupExecution.planned?.length ?? 0;
    const deletedCount = snapshot.cleanupExecution.deleted.length;
    const failedCount = snapshot.cleanupExecution.failed.length;
    lines.push(
      chalk.hex(theme.accent)(
        snapshot.cleanupExecution.dryRun ? 'Cleanup Dry Run' : 'Cleanup Summary'
      ),
      snapshot.cleanupExecution.dryRun
        ? `Planned: ${plannedCount} target(s), ${formatBytes(
            snapshot.cleanupExecution.reclaimedBytes
          )} estimated reclaimable.`
        : `Deleted: ${deletedCount} target(s), ${formatBytes(
            snapshot.cleanupExecution.reclaimedBytes
          )} reclaimed.`,
      `Failures: ${failedCount}`
    );
    lines.push('');
  }

  if (snapshot.helpLines?.length) {
    lines.push(chalk.hex(theme.primary)('Commands'));
    lines.push(...snapshot.helpLines.slice(0, 8));
  }

  process.stdout.write(
    `${boxen(lines.join('\n'), {
      borderStyle: 'round',
      borderColor: theme.panelBorder,
      padding: 1
    })}\n`
  );
};
