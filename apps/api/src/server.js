import Fastify from 'fastify';
import websocket from '@fastify/websocket';

import { InMemoryStore } from '../../../packages/memory/in-memory-store.js';
import { OpenAiCompatibleProvider } from '../../../packages/providers/openai-provider.js';
import { SafeCommandRunner } from '../../../packages/tools/safe-command-runner.js';

const app = Fastify({ logger: true });
await app.register(websocket);

const provider = new OpenAiCompatibleProvider();
const memory = new InMemoryStore();
const commandRunner = new SafeCommandRunner();

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

function addMemory(record) {
  const storedRecord = memory.add(record);

  addEvent({
    id: `event-${events.length + 1}`,
    type: 'memory.created',
    message: `Memory record created: ${storedRecord.type}`,
    timestamp: new Date().toISOString(),
    data: storedRecord
  });

  return storedRecord;
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

  addMemory({
    type: 'agent-output',
    content: result.content,
    metadata: {
      agentId,
      model: result.model
    }
  });

  return result.content;
}

app.get('/', async () => {
  return {
    status: 'ok',
    service: 'advanced-agent-os-api',
    health: '/health'
  };
});

app.get('/health', async () => {
  return {
    status: 'ok',
    service: 'advanced-agent-os-api'
  };
});

app.get('/debug/routes', async () => {
  return {
    routes: [
      'GET /',
      'GET /health',
      'GET /debug/routes',
      'GET /test-run-demo',
      'GET /agents',
      'GET /events',
      'GET /memory',
      'GET /memory/search?q=query',
      'POST /tools/run-command',
      'POST /run-demo',
      'POST /run-ai-demo',
      'POST /run-agent-chain',
      'WS /ws/events'
    ]
  };
});

app.get('/test-run-demo', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/run-demo'
  });

  try {
    return JSON.parse(response.body);
  } catch {
    return {
      statusCode: response.statusCode,
      body: response.body
    };
  }
});

app.get('/agents', async () => {
  return { agents };
});

app.get('/events', async () => {
  return { events };
});

app.get('/memory', async () => {
  return { records: memory.list() };
});

app.get('/memory/search', async request => {
  const query = request.query?.q ?? '';
  return { records: query ? memory.search(query) : memory.list() };
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

app.post('/tools/run-command', async request => {
  const body = request.body ?? {};
  const command = body.command ?? '';
  const agentId = body.agentId ?? 'manual-operator';

  const result = await commandRunner.run(command, { agentId });

  addEvent({
    id: `event-${events.length + 1}`,
    type: 'tool.command',
    agentId,
    message: `Command tool completed in ${result.mode} mode.`,
    timestamp: new Date().toISOString(),
    data: result
  });

  addMemory({
    type: 'tool-command-result',
    content: JSON.stringify(result, null, 2),
    metadata: {
      agentId,
      command,
      mode: result.mode,
      success: result.success
    }
  });

  return result;
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

  addMemory({
    type: 'ai-demo-result',
    content: result.content,
    metadata: {
      prompt,
      model: result.model
    }
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

  addMemory({
    type: 'agent-chain-artifact',
    content: JSON.stringify(finalResult, null, 2),
    metadata: {
      goal,
      agents: ['project-manager', 'architect', 'backend', 'frontend', 'qa']
    }
  });

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

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

app.listen({ port, host })
  .then(() => {
    console.log(`API server started on ${host}:${port}`);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
