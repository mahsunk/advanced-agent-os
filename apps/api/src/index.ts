import { AgentRegistry } from '../../../packages/agent-core/src/registry.js';
import { TaskGraph } from '../../../packages/orchestration/task-graph.js';

import { FrontendAgent } from '../../../packages/agents/frontend-agent.js';
import { BackendAgent } from '../../../packages/agents/backend-agent.js';
import { QaAgent } from '../../../packages/agents/qa-agent.js';
import { DevOpsAgent } from '../../../packages/agents/devops-agent.js';
import { SecurityAgent } from '../../../packages/agents/security-agent.js';
import { ReviewerAgent } from '../../../packages/agents/reviewer-agent.js';
import { ArchitectAgent } from '../../../packages/agents/architect-agent.js';
import { ProjectManagerAgent } from '../../../packages/agents/project-manager-agent.js';

async function bootstrap() {
  const registry = new AgentRegistry();

  registry.register(new ProjectManagerAgent());
  registry.register(new ArchitectAgent());
  registry.register(new FrontendAgent());
  registry.register(new BackendAgent());
  registry.register(new QaAgent());
  registry.register(new DevOpsAgent());
  registry.register(new SecurityAgent());
  registry.register(new ReviewerAgent());

  const graph = new TaskGraph(registry);

  const results = await graph.run([
    {
      id: 'project-1',
      title: 'AI SaaS Platform',
      role: 'project-manager',
      goal: 'Create scalable AI SaaS platform with dashboard and API.'
    }
  ]);

  console.log('Advanced Agent OS started');
  console.log(JSON.stringify(results, null, 2));
}

bootstrap();
