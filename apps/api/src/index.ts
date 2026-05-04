import { AgentRegistry } from '../../../packages/agent-core/src/registry.js';
import { FrontendAgent } from '../../../packages/agents/frontend-agent.js';
import { BackendAgent } from '../../../packages/agents/backend-agent.js';

async function bootstrap() {
  const registry = new AgentRegistry();

  registry.register(new FrontendAgent());
  registry.register(new BackendAgent());

  console.log('Advanced Agent OS started');
  console.log('Registered agents:', registry.list().map(a => a.id));
}

bootstrap();
