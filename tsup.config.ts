import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    cli: 'src/cli.tsx',
    'workers/directory-size.worker': 'src/services/scanner/workers/directory-size.worker.ts'
  },
  target: 'node20',
  format: ['esm'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  banner: {
    js: '#!/usr/bin/env node'
  },
  outDir: 'dist'
});
