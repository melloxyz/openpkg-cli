import path from 'node:path';
import { Worker } from 'node:worker_threads';

export class DirectorySizeService {
  async getDirectorySize(targetPath: string): Promise<number> {
    const workerPath = new URL('./workers/directory-size.worker.js', import.meta.url);

    return new Promise<number>((resolve, reject) => {
      const worker = new Worker(workerPath, {
        workerData: { targetPath }
      });

      worker.once('message', (value) => resolve(value as number));
      worker.once('error', reject);
      worker.once('exit', (code) => {
        if (code !== 0) {
          reject(
            new Error(`Size worker exited with code ${code} for ${path.basename(targetPath)}`)
          );
        }
      });
    });
  }
}
