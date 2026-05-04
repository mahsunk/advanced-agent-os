import { Agent, AgentResult, AgentTask } from '../agent-core/src/types.js';

export class ProjectManagerAgent implements Agent {
  id = 'project-manager-agent';
  role = 'project-manager' as const;
  description = 'Breaks product goals into executable engineering tasks.';

  async run(task: AgentTask): Promise<AgentResult> {
    return {
      taskId: task.id,
      agent: this.id,
      summary: `Project plan created for ${task.title}`,
      artifacts: [
        {
          type: 'plan',
          name: 'project-plan.md',
          content: `Goal: ${task.goal}\n\nExecution order: architecture, backend, frontend, QA, security, DevOps, review.`
        }
      ],
      nextTasks: [
        { id: `${task.id}-architecture`, title: 'Design architecture', role: 'architect', goal: task.goal },
        { id: `${task.id}-backend`, title: 'Design backend', role: 'backend', goal: task.goal },
        { id: `${task.id}-frontend`, title: 'Design frontend', role: 'frontend', goal: task.goal },
        { id: `${task.id}-qa`, title: 'Create QA plan', role: 'qa', goal: task.goal },
        { id: `${task.id}-security`, title: 'Review security risks', role: 'security', goal: task.goal },
        { id: `${task.id}-devops`, title: 'Prepare deployment plan', role: 'devops', goal: task.goal },
        { id: `${task.id}-review`, title: 'Review delivery', role: 'reviewer', goal: task.goal }
      ]
    };
  }
}
