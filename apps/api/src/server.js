import Fastify from 'fastify';

const app = Fastify({ logger: true });

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

app.post('/run-demo', async () => {
  const timestamp = new Date().toISOString();

  events.push(
    {
      id: `event-${events.length + 1}`,
      type: 'task',
      message: 'Demo project task started by Project Manager Agent.',
      timestamp
    },
    {
      id: `event-${events.length + 2}`,
      type: 'agent',
      message: 'Architect, Backend, Frontend, QA, Security and DevOps agents queued.',
      timestamp: new Date().toISOString()
    }
  );

  return {
    success: true,
    message: 'Demo orchestration started.',
    agentsQueued: agents.length,
    events
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
