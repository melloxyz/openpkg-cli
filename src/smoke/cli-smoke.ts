import { spawn } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

type SmokeMode = 'all' | 'local' | 'package';

type ProcessResult = {
  stdout: string;
  stderr: string;
};

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const distCli = join(repoRoot, 'dist', 'cli.js');
const ansiPattern = new RegExp(String.raw`\u001B\[[0-?]*[ -/]*[@-~]`, 'g');

const stripAnsi = (value: string) => value.replace(ansiPattern, '');

const normalizeOutput = (value: string) => stripAnsi(value).replace(/\r\n/g, '\n').trim();

const runProcess = (
  command: string,
  args: string[],
  options: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  } = {}
) =>
  new Promise<ProcessResult>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? repoRoot,
      env: {
        ...process.env,
        ...options.env
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });

    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          [
            `Command failed (${command} ${args.join(' ')})`,
            `Exit code: ${code ?? 'unknown'}`,
            stderr.trim() ? `Stderr:\n${stderr.trim()}` : undefined,
            stdout.trim() ? `Stdout:\n${stdout.trim()}` : undefined
          ]
            .filter(Boolean)
            .join('\n')
        )
      );
    });
  });

const runNodeCli = (args: string[]) => runProcess(process.execPath, [distCli, ...args]);

const getPnpmCommand = () => {
  const npmExecPath = process.env.npm_execpath;

  if (npmExecPath) {
    return {
      command: process.execPath,
      argsPrefix: [npmExecPath]
    };
  }

  return {
    command: 'corepack',
    argsPrefix: ['pnpm']
  };
};

const runPnpm = (
  args: string[],
  options: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  } = {}
) => {
  const pnpm = getPnpmCommand();
  const processOptions: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  } = {};

  if (options.cwd) {
    processOptions.cwd = options.cwd;
  }

  if (options.env) {
    processOptions.env = options.env;
  }

  return runProcess(pnpm.command, [...pnpm.argsPrefix, ...args], processOptions);
};

const ensureOutputContains = (output: string, needle: string, label: string) => {
  if (!output.includes(needle)) {
    throw new Error(`${label} output did not include "${needle}".\n\n${output}`);
  }
};

const createTempProject = async () => {
  const projectDir = await mkdtemp(join(tmpdir(), 'openpkg-smoke-project-'));
  await writeFile(
    join(projectDir, 'package.json'),
    JSON.stringify(
      {
        name: 'openpkg-smoke-project',
        private: true,
        version: '0.0.0'
      },
      null,
      2
    )
  );

  return projectDir;
};

const findSingleTarball = async (directory: string) => {
  const tarballs = (await readdir(directory)).filter((entry) => entry.endsWith('.tgz'));
  const [tarball] = tarballs;

  if (tarballs.length !== 1 || !tarball) {
    throw new Error(`Expected exactly one tarball in ${directory}, found ${tarballs.length}.`);
  }

  return join(directory, tarball);
};

const buildProject = async () => {
  process.stdout.write('Building project...\n');
  await runPnpm(['build']);
};

const smokeLocalBuild = async () => {
  await buildProject();

  process.stdout.write('Checking dist/cli.js /help...\n');
  const { stdout } = await runNodeCli(['/help']);
  const output = normalizeOutput(stdout);

  ensureOutputContains(output, 'OpenPkg', 'Local build');
  ensureOutputContains(output, 'Command reference loaded.', 'Local build');
  ensureOutputContains(output, '/help', 'Local build');
  ensureOutputContains(output, '/scan', 'Local build');
};

const packTarball = async (): Promise<{
  tarball: string;
  cleanup: () => Promise<void>;
}> => {
  const destination = await mkdtemp(join(tmpdir(), 'openpkg-smoke-pack-'));

  try {
    await runPnpm(['pack', '--pack-destination', destination], {
      env: {
        npm_config_ignore_scripts: 'true'
      }
    });

    return {
      tarball: await findSingleTarball(destination),
      cleanup: async () => {
        await rm(destination, { recursive: true, force: true });
      }
    };
  } catch {
    await rm(destination, { recursive: true, force: true });

    await runPnpm(['pack'], {
      env: {
        npm_config_ignore_scripts: 'true'
      }
    });

    const tarball = await findSingleTarball(repoRoot);

    return {
      tarball,
      cleanup: async () => {
        await rm(tarball, { force: true });
      }
    };
  }
};

const smokePackagedTarball = async (tarball: string) => {
  const projectDir = await createTempProject();
  const extractDir = await mkdtemp(join(projectDir, 'package-'));

  try {
    process.stdout.write('Offline pnpm install unavailable; unpacking tarball locally...\n');
    await runProcess('tar', ['-xf', tarball, '-C', extractDir]);

    const packageRoot = join(extractDir, 'package');
    const packageJson = JSON.parse(
      await readFile(join(packageRoot, 'package.json'), 'utf8')
    ) as { bin?: Record<string, string> | string };

    await symlink(join(repoRoot, 'node_modules'), join(packageRoot, 'node_modules'), 'junction');

    for (const binary of ['openpkg', 'opkg']) {
      const binTarget =
        typeof packageJson.bin === 'string'
          ? packageJson.bin
          : packageJson.bin?.[binary] ?? './dist/cli.js';
      const outputPath = join(packageRoot, binTarget);

      process.stdout.write(`Checking packaged bin ${binary} /help...\n`);
      const { stdout } = await runProcess(process.execPath, [outputPath, '/help'], {
        cwd: packageRoot
      });
      const output = normalizeOutput(stdout);

      ensureOutputContains(output, 'OpenPkg', `Packaged bin ${binary}`);
      ensureOutputContains(output, 'Command reference loaded.', `Packaged bin ${binary}`);
      ensureOutputContains(output, '/help', `Packaged bin ${binary}`);
      ensureOutputContains(output, '/scan', `Packaged bin ${binary}`);
    }
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
};

const smokePackageInstall = async ({ buildFirst }: { buildFirst: boolean }) => {
  if (buildFirst) {
    await buildProject();
  }

  process.stdout.write('Packing local tarball...\n');
  const { tarball, cleanup } = await packTarball();
  const projectDir = await createTempProject();

  try {
    process.stdout.write('Installing package into temp project...\n');
    try {
      await runPnpm(['add', '--offline', '--ignore-scripts', pathToFileURL(tarball).href], {
        cwd: projectDir
      });

      for (const binary of ['openpkg', 'opkg']) {
        process.stdout.write(`Checking installed bin ${binary} /help...\n`);
        const { stdout } = await runPnpm(['exec', binary, '/help'], {
          cwd: projectDir
        });
        const output = normalizeOutput(stdout);

        ensureOutputContains(output, 'OpenPkg', `Installed bin ${binary}`);
        ensureOutputContains(output, 'Command reference loaded.', `Installed bin ${binary}`);
        ensureOutputContains(output, '/help', `Installed bin ${binary}`);
        ensureOutputContains(output, '/scan', `Installed bin ${binary}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (!message.includes('ERR_PNPM_NO_OFFLINE_META')) {
        throw error;
      }

      await smokePackagedTarball(tarball);
    }
  } finally {
    await rm(projectDir, { recursive: true, force: true });
    await cleanup();
  }
};

const parseMode = (): SmokeMode => {
  const mode = process.argv[2] ?? 'all';

  if (mode === 'all' || mode === 'local' || mode === 'package') {
    return mode;
  }

  throw new Error(`Unknown smoke mode: ${mode}`);
};

const main = async () => {
  const mode = parseMode();

  if (mode === 'all') {
    await smokeLocalBuild();
    await smokePackageInstall({ buildFirst: false });
    return;
  }

  if (mode === 'local') {
    await smokeLocalBuild();
    return;
  }

  await smokePackageInstall({ buildFirst: true });
};

void main();
