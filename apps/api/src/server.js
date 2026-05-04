import Fastify from 'fastify';
import websocket from '@fastify/websocket';

import { OpenAiCompatibleProvider } from '../../../packages/providers/openai-provider.js';

const app = Fastify({ logger: true });
await app.register(websocket);

const provider = new OpenAiCompatibleProvider();

const agents = [
  'project-manager',
  'architect',
  'frontend',
  'backend',
  'qa',
  'security',
  'devops',
  'research',
  'reviewer',
  'docs'
];

const events = [
  {
    id: 'api-event-1',
    type: 'system',
    message: 'Advanced Agent OS API initialized.',
    timestamp: new Date().toISOString()
  }
];

const sockets = new Set();

function broadcast(event) {
  for (const socket of sockets) {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify(event));
    }
  }
}

function addEvent(event) {
  events.push(event);
  broadcast(event);
}

async function runAgentStep(agentId, systemPrompt, userPrompt) {
  addEvent({
    id: `event-${events.length + 1}`,
    type: 'agent',
    agentId,
    message: `${agentId} started.`,
    timestamp: new Date().toISOString()
  });

  const result = await provider.complete([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);

  addEvent({
    id: `event-${events.length + 1}`,
    type: 'agent',
    agentId,
    message: `${agentId} completed using ${result.model}.`,
    timestamp: new Date().toISOString(),
    data: result
  });

  return result.content;
}

app.get('/health', async () => {
  return {
    status: 'ok',
    service: 'advanced-agent-os-api'
  };
});

app.get('/agents', async () => {
  return { agents };
});

app.get('/events', async () => {
  return { events };
});

app.get('/ws/events', { websocket: true }, connection => {
  sockets.add(connection.socket);

  connection.socket.send(JSON.stringify({
    id: `event-${Date.now()}`,
    type: 'system',
    message: 'Connected to Advanced Agent OS live event stream.',
    timestamp: new Date().toISOString()
  }));

  connection.socket.on('close', () => {
    sockets.delete(connection.socket);
  });
});

app.post('/run-demo', async () => {
  const timestamp = new Date().toISOString();

  addEvent({
    id: `event-${events.length + 1}`,
    type: 'task',
    message: 'Demo project task started by Project Manager Agent.',
    timestamp
  });

  addEvent({
    id: `event-${events.length + 1}`,
    type: 'agent',
    message: 'Architect, Backend, Frontend, QA, Security and DevOps agents queued.',
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    message: 'Demo orchestration started.',
    agentsQueued: agents.length,
    events
  };
});

app.post('/run-ai-demo', async request => {
  const body = request.body ?? {};
  const prompt = body.prompt ?? 'Create a short architecture plan for an AI SaaS dashboard.';

  addEvent({
    id: `event-${events.length + 1}`,
    type: 'task',
    message: 'AI demo task started by Project Manager Agent.',
    timestamp: new Date().toISOString()
  });

  const result = await provider.complete([
    {
      role: 'system',
      content: 'You are the Project Manager Agent inside Advanced Agent OS. Return a concise engineering plan.'
    },
    {
      role: 'user',
      content: prompt
    }
  ]);

  addEvent({
    id: `event-${events.length + 1}`,
    type: 'agent',
    message: `AI provider responded with model ${result.model}.`,
    timestamp: new Date().toISOString(),
    data: result
  });

  return {
    success: true,
    prompt,
    result
  };
});

app.post('/run-agent-chain', async request => {
  const body = request.body ?? {};
  const goal = body.prompt ?? 'Build a production-ready AI SaaS dashboard.';

  addEvent({
    id: `event-${events.length + 1}`,
    type: 'task',
    message: 'Multi-agent chain started.',
    timestamp: new Date().toISOString(),
    data: { goal }
  });

  const projectPlan = await runAgentStep(
    'project-manager',
    'You are the Project Manager Agent. Break the user goal into a concise engineering execution plan.',
    goal
  );

  const architecture = await runAgentStep(
    'architect',
    'You are the Architect Agent. Convert the project plan into a technical architecture with modules and data flow.',
    projectPlan
  );

  const backendPlan = await runAgentStep(
    'backend',
    'You are the Backend Agent. Produce API, database and service implementation tasks from the architecture.',
    architecture
  );

  const frontendPlan = await runAgentStep(
    'frontend',
    'You are the Frontend Agent. Produce UI screens, components and state management tasks from the architecture.',
    architecture
  );

  const qaPlan = await runAgentStep(
    'qa',
    'You are the QA Agent. Review the backend and frontend plans and produce a practical test strategy.',
    `Backend plan:\n${backendPlan}\n\nFrontend plan:\n${frontendPlan}`
  );

  const finalResult = {
    goal,
    projectPlan,
    architecture,
    backendPlan,
    frontendPlan,
    qaPlan
  };

  addEvent({
    id: `event-${events.length + 1}`,
    type: 'artifact.created',
    message: 'Multi-agent chain completed and produced final execution artifact.',
    timestamp: new Date().toISOString(),
    data: finalResult
  });

  return {
    success: true,
    result: finalResult
  };
});

app.listen({ port: 3000, host: '0.0.0.0' })
  .then(() => {
    console.log('API server started on port 3000');
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
