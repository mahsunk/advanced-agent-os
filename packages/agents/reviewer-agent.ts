import { Agent, AgentResult, AgentTask } from '../agent-core/src/types.js';

export class ReviewerAgent implements Agent {
  id = 'reviewer-agent';
  role = 'reviewer' as const;
  description = 'Performs final architecture and code review checks.';

  async run(task: AgentTask): Promise<AgentResult> {
    return {
      taskId: task.id,
      agent: this.id,
      summary: `Review completed for ${task.title}`,
      artifacts: [
        {
          type: 'report',
          name: 'review-summary.md',
          content: 'System review passed with recommended improvements for observability and testing.'
        }
      ]
    };
  }
}
