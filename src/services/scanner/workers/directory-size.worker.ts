import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parentPort, workerData } from 'node:worker_threads';

const getDirectorySize = async (targetPath: string): Promise<number> => {
  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  let total = 0;

  for (const entry of entries) {
    const entryPath = path.join(targetPath, entry.name);

    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      total += await getDirectorySize(entryPath);
      continue;
    }

    if (entry.isFile()) {
      const stats = await fs.stat(entryPath);
      total += stats.size;
    }
  }

  return total;
};

void getDirectorySize((workerData as { targetPath: string }).targetPath)
  .then((size) => {
    parentPort?.postMessage(size);
  })
  .catch(() => {
    parentPort?.postMessage(0);
  });
