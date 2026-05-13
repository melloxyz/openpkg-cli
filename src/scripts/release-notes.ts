import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { buildReleaseNotes } from '../utils/release-notes.js';

type ScriptOptions = {
  changelogPath: string;
  packageJsonPath: string;
  tag: string;
};

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

const readOptionValue = (value: string | undefined, flag: string): string => {
  if (!value) {
    throw new Error(`Missing value for ${flag}.`);
  }

  return value;
};

const parseArgs = (): ScriptOptions => {
  const options: ScriptOptions = {
    changelogPath: resolve(repoRoot, 'CHANGELOG.md'),
    packageJsonPath: resolve(repoRoot, 'package.json'),
    tag: process.env.GITHUB_REF_NAME ?? ''
  };

  for (let index = 2; index < process.argv.length; index += 1) {
    const argument = process.argv[index];

    if (!argument) {
      continue;
    }

    if (argument === '--tag') {
      options.tag = readOptionValue(process.argv[index + 1], '--tag');
      index += 1;
      continue;
    }

    if (argument.startsWith('--tag=')) {
      options.tag = argument.slice('--tag='.length);
      continue;
    }

    if (argument === '--changelog') {
      options.changelogPath = resolve(
        repoRoot,
        readOptionValue(process.argv[index + 1], '--changelog')
      );
      index += 1;
      continue;
    }

    if (argument.startsWith('--changelog=')) {
      options.changelogPath = resolve(repoRoot, argument.slice('--changelog='.length));
      continue;
    }

    if (argument === '--package-json') {
      options.packageJsonPath = resolve(
        repoRoot,
        readOptionValue(process.argv[index + 1], '--package-json')
      );
      index += 1;
      continue;
    }

    if (argument.startsWith('--package-json=')) {
      options.packageJsonPath = resolve(repoRoot, argument.slice('--package-json='.length));
      continue;
    }
  }

  if (!options.tag) {
    throw new Error('A release tag is required. Pass --tag vX.X.X or set GITHUB_REF_NAME.');
  }

  return options;
};

const main = async () => {
  const options = parseArgs();
  const packageJson = JSON.parse(await readFile(options.packageJsonPath, 'utf8')) as {
    version?: string;
  };

  if (!packageJson.version) {
    throw new Error(`Package version not found in ${options.packageJsonPath}.`);
  }

  const changelog = await readFile(options.changelogPath, 'utf8');
  const notes = buildReleaseNotes({
    changelog,
    tag: options.tag,
    packageVersion: packageJson.version
  });

  process.stdout.write(`${notes.trimEnd()}\n`);
};

void main();
