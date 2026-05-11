import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Worker } from 'node:worker_threads';

const getDirectorySizeInline = async (targetPath: string): Promise<number> => {
  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  let total = 0;

  for (const entry of entries) {
    const entryPath = path.join(targetPath, entry.name);

    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      total += await getDirectorySizeInline(entryPath);
      continue;
    }

    if (entry.isFile()) {
      const stats = await fs.stat(entryPath);
      total += stats.size;
    }
  }

  return total;
};

const resolveWorkerUrl = async () => {
  const jsUrl = new URL('./workers/directory-size.worker.js', import.meta.url);

  try {
    await fs.access(jsUrl);
    return jsUrl;
  } catch {
    return undefined;
  }
};

export class DirectorySizeService {
  async getDirectorySize(targetPath: string): Promise<number> {
    const workerUrl = await resolveWorkerUrl();

    if (!workerUrl) {
      return getDirectorySizeInline(targetPath);
    }

    return new Promise<number>((resolve) => {
      const worker = new Worker(workerUrl, {
        workerData: { targetPath }
      });

      worker.once('message', (value) => resolve(value as number));
      worker.once('error', () => {
        void getDirectorySizeInline(targetPath).then(resolve);
      });
      worker.once('exit', (code) => {
        if (code !== 0) {
          void getDirectorySizeInline(targetPath).then(resolve);
        }
      });
    });
  }
}
