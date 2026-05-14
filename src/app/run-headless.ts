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
    chalk.hex(theme.primary)(`Section: ${snapshot.activeSection ?? 'dashboard'}`),
    chalk.hex(theme.text)(snapshot.statusLine),
    ''
  ];

  if (snapshot.health && !snapshot.updatesOnly) {
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

  if (snapshot.health) {
    const updateTools = snapshot.health.toolAvailability.filter((tool) => tool.updateStatus);

    if (updateTools.length > 0) {
      lines.push(
        chalk.hex(theme.accent)('Updates'),
        ...updateTools.map((tool) => {
          const current = tool.version ?? 'n/a';
          const latest = tool.latestVersion ?? 'n/a';
          return `• ${tool.name}  ${current} -> ${latest}  ${tool.updateStatus}`;
        }),
        ''
      );
    }
  }

  if (snapshot.projects?.length) {
    lines.push(chalk.hex(theme.accent)(`Packages (${snapshot.projects.length})`));
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
    lines.push(chalk.hex(theme.accent)(`Cleanup (${snapshot.cleanupTargets.length})`));
    lines.push(`Potential reclaimable space: ${formatBytes(reclaimable)}`);
    lines.push(
      ...snapshot.cleanupTargets
        .slice(0, 5)
        .map((item) => `• ${item.kind}  ${item.recommendation}  ${formatBytes(item.sizeInBytes)}`)
    );
    lines.push('');
  }

  if (snapshot.cleanupExecution) {
    const { summary } = snapshot.cleanupExecution;
    lines.push(
      chalk.hex(theme.accent)(
        snapshot.cleanupExecution.dryRun ? 'Cleanup Dry Run' : 'Cleanup Summary'
      ),
      `Requested: ${summary.requestedCount}  Planned: ${summary.plannedCount}  Deleted: ${summary.deletedCount}  Failures: ${summary.failedCount}`,
      snapshot.cleanupExecution.dryRun
        ? `Estimated reclaimable: ${formatBytes(summary.reclaimedBytes)}`
        : `Reclaimed: ${formatBytes(summary.reclaimedBytes)}`
    );

    if (summary.failedCount > 0) {
      lines.push(
        ...snapshot.cleanupExecution.failed
          .slice(0, 5)
          .map((failure) => `• ${failure.target.kind}  ${failure.reason}`)
      );
    }

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
