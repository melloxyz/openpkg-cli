import { z } from 'zod';

export const projectManifestSchema = z.object({
  name: z.string().optional(),
  dependencies: z.record(z.string(), z.string()).optional(),
  devDependencies: z.record(z.string(), z.string()).optional()
});

export type ProjectManifest = z.infer<typeof projectManifestSchema>;
