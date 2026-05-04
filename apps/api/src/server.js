import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => {
  return {
    status: 'ok',
    service: 'advanced-agent-os-api'
  };
});

app.get('/agents', async () => {
  return {
    agents: [
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
    ]
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
