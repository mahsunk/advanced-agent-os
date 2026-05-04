import { Agent, AgentRole } from './types.js';

export class AgentRegistry {
  private agents = new Map<AgentRole, Agent>();

  register(agent: Agent) {
    this.agents.set(agent.role, agent);
  }

  get(role: AgentRole) {
    return this.agents.get(role);
  }

  list() {
    return [...this.agents.values()];
  }
}
