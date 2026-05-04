import { Agent, AgentResult, AgentTask } from '../agent-core/src/types.js';

export class DocsAgent implements Agent {
  id = 'docs-agent';
  role = 'docs' as const;
  description = 'Generates technical documentation and onboarding guides.';

  async run(task: AgentTask): Promise<AgentResult> {
    return {
      taskId: task.id,
      agent: this.id,
      summary: `Documentation generated for ${task.title}`,
      artifacts: [
        {
          type: 'doc',
          name: 'documentation.md',
          content: `System documentation for: ${task.goal}`
        }
      ]
    };
  }
}
