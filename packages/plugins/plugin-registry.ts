export type AgentPlugin = {
  id: string;
  name: string;
  version: string;
  initialize(): Promise<void>;
};

export class PluginRegistry {
  private plugins = new Map<string, AgentPlugin>();

  register(plugin: AgentPlugin) {
    this.plugins.set(plugin.id, plugin);
  }

  async initializeAll() {
    for (const plugin of this.plugins.values()) {
      await plugin.initialize();
    }
  }

  list() {
    return [...this.plugins.values()];
  }
}
