export type PluginManifest = {
  name: string;
  version: string;
  commands?: string[];
};

export class PluginManager {
  async loadInstalledPlugins(): Promise<PluginManifest[]> {
    return [];
  }
}
