import Fastify from 'fastify';
import websocket from '@fastify/websocket';

import { InMemoryStore } from '../../../packages/memory/in-memory-store.js';
import { PostgresMemoryStore } from '../../../packages/memory/postgres-memory-store.js';
import { OpenAiCompatibleProvider } from '../../../packages/providers/openai-provider.js';
import { SafeCommandRunner } from '../../../packages/tools/safe-command-runner.js';

const app = Fastify({ logger: true });

app.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return reply.code(204).send();
  }
});

await app.register(websocket);
 

const PORT = process.env.PORT || 3000;
const provider = new OpenAiCompatibleProvider();
const memory = process.env.SUPABASE_DATABASE_URL
  ? new PostgresMemoryStore(process.env.SUPABASE_DATABASE_URL)
  : new InMemoryStore();
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
  return event;
}

async function addMemory(record) {
  const storedRecord = await memory.add({
    ...record,
    metadata: {
      provider: provider.name,
      ...record.metadata
    }
  });

  addEvent({
    id: `event-${events.length + 1}`,
    type: 'memory.created',
    message: `Memory record created: ${storedRecord.type}`,
    timestamp: new Date().toISOString(),
    data: storedRecord
  });

  return storedRecord;
}

function providerCompletedEvent(agentId, result) {
  return addEvent({
    id: `event-${events.length + 1}`,
    type: 'provider.completed',
    agentId,
    message: `AI provider responded with model ${result.model}.`,
    timestamp: new Date().toISOString(),
    data: {
      provider: provider.name,
      model: result.model,
      usage: result.usage ?? null
    }
  });
}

function providerErrorEvent(agentId, error) {
  return addEvent({
    id: `event-${events.length + 1}`,
    type: 'provider.error',
    agentId,
    message: `AI provider failed for ${agentId}: ${error.message}`,
    timestamp: new Date().toISOString(),
    data: {
      provider: provider.name,
      error: error.message
    }
  });
}

async function runAgentStep(agentId, systemPrompt, userPrompt) {
  addEvent({
    id: `event-${events.length + 1}`,
    type: 'agent.started',
    agentId,
    message: `${agentId} started.`,
    timestamp: new Date().toISOString()
  });

  try {
    const result = await provider.complete([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    providerCompletedEvent(agentId, result);

    addEvent({
      id: `event-${events.length + 1}`,
      type: 'agent.completed',
      agentId,
      message: `${agentId} completed using ${result.model}.`,
      timestamp: new Date().toISOString(),
      data: result
    });

    await addMemory({
      type: 'agent-output',
      content: result.content,
      metadata: {
        agentId,
        model: result.model,
        usage: result.usage ?? null
      }
    });

    return result.content;
  } catch (error) {
    providerErrorEvent(agentId, error);

    await addMemory({
      type: 'agent-error',
      content: error.message,
      metadata: {
        agentId
      }
    });

    throw error;
  }
}

app.get('/', async () => {
  return {
    status: 'ok',
    service: 'advanced-agent-os'
  };
});

app.get('/health', async () => {
  return {
    status: 'ok',
    service: 'advanced-agent-os-api'
  };
});

app.get('/debug/memory-state', async () => {
  return {
    provider: process.env.SUPABASE_DATABASE_URL ? 'postgres' : 'in-memory',
    recordCount: (await memory.list()).length,
    hasSupabaseDatabaseUrl: Boolean(process.env.SUPABASE_DATABASE_URL),
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    baseUrl: process.env.OPENAI_BASE_URL ?? null,
    model: process.env.DEFAULT_MODEL ?? null
  };
});

app.get('/test-memory', async () => {
  const memoryRecord = await addMemory({
    type: 'manual-test',
    content: 'memory test',
    metadata: { source: 'debug' }
  });

  return {
    success: true,
    memoryRecord,
    records: await memory.list()
  };
});

app.get('/test-groq', async (req, reply) => {
  try {
    const result = await provider.complete([
      {
        role: 'user',
        content: 'Say hello from Groq'
      }
    ]);

    return {
      success: true,
      result
    };
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: error.message
    });
  }
});

app.get('/agents', async () => {
  return { agents };
});

app.get('/events', async () => {
  return { events };
});

app.get('/memory', async () => {
  return { records: await memory.list() };
});

app.get('/memory/search', async request => {
  const query = request.query?.q ?? '';
  return { records: query ? await memory.search(query) : await memory.list() };
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

  await addMemory({
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
  const agentId = 'project-manager';

  addEvent({
    id: `event-${events.length + 1}`,
    type: 'task.started',
    agentId,
    message: 'AI demo task started by Project Manager Agent.',
    timestamp: new Date().toISOString(),
    data: { prompt }
  });

  try {
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

    providerCompletedEvent(agentId, result);

    const memoryRecord = await addMemory({
      type: 'ai-demo-result',
      content: result.content,
      metadata: {
        agentId,
        prompt,
        model: result.model,
        usage: result.usage ?? null
      }
    });

    addEvent({
      id: `event-${events.length + 1}`,
      type: 'task.completed',
      agentId,
      message: `Run AI Demo completed with model ${result.model}.`,
      timestamp: new Date().toISOString(),
      data: {
        model: result.model,
        memoryRecordId: memoryRecord.id
      }
    });

    return {
      success: true,
      prompt,
      result,
      memoryRecord
    };
  } catch (error) {
    providerErrorEvent(agentId, error);

    const memoryRecord = await addMemory({
      type: 'ai-demo-error',
      content: error.message,
      metadata: {
        agentId,
        prompt
      }
    });

    request.log.error({ error }, 'run-ai-demo failed');

    return {
      success: false,
      prompt,
      error: error.message,
      memoryRecord
    };
  }
});

app.post('/run-agent-chain', async request => {
  const body = request.body ?? {};
  const goal = body.prompt ?? 'Build a production-ready AI SaaS dashboard.';

  addEvent({
    id: `event-${events.length + 1}`,
    type: 'task.started',
    message: 'Multi-agent chain started.',
    timestamp: new Date().toISOString(),
    data: { goal }
  });

  try {
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

    const memoryRecord = await addMemory({
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
      data: {
        ...finalResult,
        memoryRecordId: memoryRecord.id
      }
    });

    addEvent({
      id: `event-${events.length + 1}`,
      type: 'task.completed',
      message: 'Multi-agent chain completed successfully.',
      timestamp: new Date().toISOString(),
      data: {
        goal,
        memoryRecordId: memoryRecord.id
      }
    });

    return {
      success: true,
      result: finalResult,
      memoryRecord
    };
  } catch (error) {
    providerErrorEvent('agent-chain', error);

    const memoryRecord = await addMemory({
      type: 'agent-chain-error',
      content: error.message,
      metadata: {
        goal
      }
    });

    request.log.error({ error }, 'run-agent-chain failed');

    return {
      success: false,
      error: error.message,
      memoryRecord
    };
  }
});

app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => {
    console.log(`API listening on ${PORT}`);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
