import React from 'react';
import boxen from 'boxen';
import chalk from 'chalk';
import { render } from 'ink';
import { OpenPgkApp } from './app/OpenPgkApp.js';
import { runHeadlessCli } from './app/run-headless.js';
import { renderBrandTitle, theme } from './shared/theme.js';

const bootstrap = async () => {
  const argv = process.argv.slice(2);

  if (argv.length > 0) {
    await runHeadlessCli(argv.join(' '));
    return;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    const message = [
      renderBrandTitle('OpenPgk'),
      '',
      chalk.hex(theme.text)('Interactive mode requires a TTY-enabled terminal.'),
      chalk.hex(theme.muted)('Try `openpgk /doctor` or run `pnpm dev` in your terminal.')
    ].join('\n');

    process.stdout.write(
      `${boxen(message, {
        borderStyle: 'round',
        borderColor: theme.panelBorder,
        padding: 1
      })}\n`
    );
    return;
  }

  render(<OpenPgkApp />);
};

void bootstrap();
