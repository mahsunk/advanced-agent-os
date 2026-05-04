import { AgentRegistry } from '../agent-core/src/registry.js';
import { AgentResult, AgentTask } from '../agent-core/src/types.js';

export class TaskGraph {
  constructor(private readonly registry: AgentRegistry) {}

  async run(initialTasks: AgentTask[]): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    const queue = [...initialTasks];

    while (queue.length > 0) {
      const task = queue.shift()!;
      const agent = this.registry.get(task.role);

      if (!agent) {
        results.push({
          taskId: task.id,
          agent: 'system',
          summary: `No agent registered for role ${task.role}`,
          artifacts: []
        });
        continue;
      }

      const result = await agent.run(task);
      results.push(result);

      if (result.nextTasks?.length) {
        queue.push(...result.nextTasks);
      }
    }

    return results;
  }
}
