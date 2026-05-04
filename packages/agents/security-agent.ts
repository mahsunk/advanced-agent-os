import { Agent, AgentResult, AgentTask } from '../agent-core/src/types.js';

export class SecurityAgent implements Agent {
  id = 'security-agent';
  role = 'security' as const;
  description = 'Analyzes risks and validates secure architecture decisions.';

  async run(task: AgentTask): Promise<AgentResult> {
    return {
      taskId: task.id,
      agent: this.id,
      summary: `Security review completed for ${task.title}`,
      artifacts: [
        {
          type: 'report',
          name: 'security-report.md',
          content: 'Enable JWT validation, rate limiting, audit logging and secret isolation.'
        }
      ]
    };
  }
}
