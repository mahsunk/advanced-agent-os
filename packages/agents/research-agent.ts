import { Agent, AgentResult, AgentTask } from '../agent-core/src/types.js';

export class ResearchAgent implements Agent {
  id = 'research-agent';
  role = 'research' as const;
  description = 'Researches technical options, risks and implementation patterns.';

  async run(task: AgentTask): Promise<AgentResult> {
    return {
      taskId: task.id,
      agent: this.id,
      summary: `Research completed for ${task.title}`,
      artifacts: [
        {
          type: 'report',
          name: 'research-notes.md',
          content: `Research goal: ${task.goal}\n\nCompare alternatives, constraints, risks and implementation patterns before coding.`
        }
      ]
    };
  }
}
