import { randomUUID } from 'node:crypto';

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
const generatedProjects = [];
const generatedRuns = [];
const generatedFileChanges = [];

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

function isOpenSocket(socket) {
  return socket && typeof socket.send === 'function' && socket.readyState === 1;
}

function broadcast(event) {
  const payload = JSON.stringify(event);

  for (const socket of [...sockets]) {
    if (!isOpenSocket(socket)) {
      sockets.delete(socket);
      continue;
    }

    try {
      socket.send(payload);
    } catch (error) {
      app.log.warn({ error }, 'websocket broadcast failed');
      sockets.delete(socket);
    }
  }
}

function addEvent(event) {
  events.push(event);
  broadcast(event);
  return event;
}

function publicRuntimeState() {
  return {
    memoryProvider: process.env.SUPABASE_DATABASE_URL ? 'postgres' : 'in-memory',
    hasSupabaseDatabaseUrl: Boolean(process.env.SUPABASE_DATABASE_URL),
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    baseUrl: process.env.OPENAI_BASE_URL ?? null,
    model: process.env.DEFAULT_MODEL ?? null,
    hasGitHubToken: Boolean(process.env.GITHUB_TOKEN),
    githubRepository: process.env.GITHUB_REPOSITORY ?? null
  };
}

function slugify(value) {
  return String(value ?? 'generated-project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'generated-project';
}

function titleFromPrompt(prompt) {
  const cleaned = String(prompt ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);

  if (!cleaned) {
    return 'Generated Web Project';
  }

  return cleaned
    .split(' ')
    .slice(0, 8)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function jsString(value) {
  return JSON.stringify(String(value ?? ''));
}

function buildWebsiteFiles({ prompt, projectName, rootPath }) {
  const title = projectName || titleFromPrompt(prompt);
  const slug = slugify(title);
  const escapedPrompt = escapeHtml(prompt);
  const features = [
    'Responsive first screen with a clear offer',
    'Service cards generated from the project brief',
    'Conversion-focused call to action',
    'Clean Vite and React project structure'
  ];

  return [
    {
      path: `${rootPath}/package.json`,
      content: JSON.stringify({
        name: slug,
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'vite --host 0.0.0.0',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          '@vitejs/plugin-react': 'latest',
          vite: 'latest',
          typescript: 'latest',
          react: 'latest',
          'react-dom': 'latest',
          'lucide-react': 'latest'
        },
        devDependencies: {}
      }, null, 2) + '\n'
    },
    {
      path: `${rootPath}/index.html`,
      content: `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${escapeHtml(title)}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>\n`
    },
    {
      path: `${rootPath}/src/main.jsx`,
      content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';\n\nimport './styles.css';\n\nconst projectTitle = ${jsString(title)};\nconst projectPrompt = ${jsString(prompt)};\nconst features = ${JSON.stringify(features, null, 2)};\n\nfunction App() {\n  return (\n    <main>\n      <section className="hero">\n        <nav>\n          <strong>{projectTitle}</strong>\n          <a href="#contact">Start</a>\n        </nav>\n\n        <div className="heroGrid">\n          <div>\n            <p className="eyebrow"><Sparkles size={16} /> AI generated launch page</p>\n            <h1>{projectTitle}</h1>\n            <p className="lead">{projectPrompt}</p>\n            <div className="actions">\n              <a className="primary" href="#contact">Plan a launch <ArrowRight size={18} /></a>\n              <a className="secondary" href="#features">See details</a>\n            </div>\n          </div>\n\n          <aside className="panel">\n            <h2>Build Scope</h2>\n            <ul>\n              {features.map(feature => (\n                <li key={feature}><CheckCircle2 size={18} /> {feature}</li>\n              ))}\n            </ul>\n          </aside>\n        </div>\n      </section>\n\n      <section id="features" className="section">\n        <h2>What this site includes</h2>\n        <div className="cards">\n          {features.map((feature, index) => (\n            <article key={feature}>\n              <span>0{index + 1}</span>\n              <h3>{feature}</h3>\n              <p>Ready to customize with real copy, images, forms, and deployment settings.</p>\n            </article>\n          ))}\n        </div>\n      </section>\n\n      <section id="contact" className="cta">\n        <h2>Ready for the next iteration?</h2>\n        <p>Connect this generated project to GitHub, run a build, and deploy it as a Vercel preview.</p>\n        <a className="primary" href="mailto:hello@example.com">Contact team <ArrowRight size={18} /></a>\n      </section>\n    </main>\n  );\n}\n\nReactDOM.createRoot(document.getElementById('root')).render(<App />);\n`
    },
    {
      path: `${rootPath}/src/styles.css`,
      content: `:root {\n  color: #172026;\n  background: #f6f8f7;\n  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\n}\n\n* {\n  box-sizing: border-box;\n}\n\nbody {\n  margin: 0;\n}\n\na {\n  color: inherit;\n  text-decoration: none;\n}\n\nmain {\n  min-height: 100vh;\n}\n\n.hero {\n  min-height: 88vh;\n  padding: 28px;\n  background: linear-gradient(135deg, #f6f8f7 0%, #dceae4 48%, #f4d8be 100%);\n}\n\nnav {\n  align-items: center;\n  display: flex;\n  justify-content: space-between;\n  margin: 0 auto 72px;\n  max-width: 1120px;\n}\n\nnav strong {\n  font-size: 20px;\n}\n\nnav a, .secondary {\n  border: 1px solid rgba(23, 32, 38, 0.22);\n  border-radius: 8px;\n  padding: 10px 14px;\n}\n\n.heroGrid {\n  align-items: center;\n  display: grid;\n  gap: 40px;\n  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);\n  margin: 0 auto;\n  max-width: 1120px;\n}\n\n.eyebrow {\n  align-items: center;\n  display: inline-flex;\n  gap: 8px;\n  margin: 0 0 18px;\n  text-transform: uppercase;\n}\n\nh1 {\n  font-size: clamp(44px, 8vw, 92px);\n  line-height: 0.95;\n  margin: 0;\n  max-width: 850px;\n}\n\n.lead {\n  font-size: 22px;\n  line-height: 1.45;\n  max-width: 680px;\n}\n\n.actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n  margin-top: 30px;\n}\n\n.primary {\n  align-items: center;\n  background: #172026;\n  border-radius: 8px;\n  color: white;\n  display: inline-flex;\n  gap: 10px;\n  padding: 13px 18px;\n}\n\n.panel, article {\n  background: rgba(255, 255, 255, 0.72);\n  border: 1px solid rgba(23, 32, 38, 0.12);\n  border-radius: 8px;\n  padding: 24px;\n}\n\n.panel ul {\n  display: grid;\n  gap: 14px;\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n.panel li {\n  align-items: flex-start;\n  display: flex;\n  gap: 10px;\n}\n\n.section, .cta {\n  margin: 0 auto;\n  max-width: 1120px;\n  padding: 72px 28px;\n}\n\n.section h2, .cta h2 {\n  font-size: 40px;\n  margin: 0 0 28px;\n}\n\n.cards {\n  display: grid;\n  gap: 16px;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n}\n\narticle span {\n  color: #65756f;\n}\n\narticle h3 {\n  min-height: 72px;\n}\n\n.cta {\n  border-top: 1px solid rgba(23, 32, 38, 0.14);\n}\n\n.cta p {\n  font-size: 20px;\n  line-height: 1.5;\n  max-width: 720px;\n}\n\n@media (max-width: 820px) {\n  .heroGrid, .cards {\n    grid-template-columns: 1fr;\n  }\n\n  .hero {\n    padding: 20px;\n  }\n\n  nav {\n    margin-bottom: 48px;\n  }\n}\n`
    },
    {
      path: `${rootPath}/README.md`,
      content: `# ${title}\n\nGenerated by Advanced Agent OS Project Generator.\n\n## Prompt\n\n${prompt}\n\n## Run locally\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Build\n\n\`\`\`bash\nnpm run build\n\`\`\`\n`
    }
  ];
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

async function tryAddMemory(record, request) {
  try {
    return {
      memoryRecord: await addMemory(record),
      memoryError: null
    };
  } catch (error) {
    request?.log?.error({ error }, 'memory write failed');

    addEvent({
      id: `event-${events.length + 1}`,
      type: 'memory.error',
      message: `Memory write failed: ${error.message}`,
      timestamp: new Date().toISOString(),
      data: {
        error: error.message,
        ...publicRuntimeState()
      }
    });

    return {
      memoryRecord: null,
      memoryError: error.message
    };
  }
}

async function queryDatabase(query, values = []) {
  if (!memory.pool) {
    return null;
  }

  return memory.pool.query(query, values);
}

async function saveGeneratedProject({ project, run, files, github }, request) {
  try {
    if (memory.pool) {
      await queryDatabase(
        `insert into projects (id, name, prompt, status, github_repo, branch_name, metadata)
         values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
        [
          project.id,
          project.name,
          project.prompt,
          project.status,
          github?.repository ?? null,
          github?.branch ?? null,
          JSON.stringify(project.metadata ?? {})
        ]
      );

      await queryDatabase(
        `insert into project_runs (id, project_id, prompt, status, agent_summary, metadata)
         values ($1, $2, $3, $4, $5, $6::jsonb)`,
        [
          run.id,
          project.id,
          run.prompt,
          run.status,
          run.agentSummary,
          JSON.stringify(run.metadata ?? {})
        ]
      );

      for (const file of files) {
        await queryDatabase(
          `insert into file_changes (id, project_id, run_id, path, action, new_content, metadata)
           values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
          [
            randomUUID(),
            project.id,
            run.id,
            file.path,
            'create',
            file.content,
            JSON.stringify({ bytes: file.content.length })
          ]
        );
      }
    } else {
      generatedProjects.push(project);
      generatedRuns.push(run);
      generatedFileChanges.push(
        ...files.map(file => ({
          id: randomUUID(),
          projectId: project.id,
          runId: run.id,
          path: file.path,
          action: 'create',
          newContent: file.content
        }))
      );
    }

    return null;
  } catch (error) {
    request?.log?.error({ error }, 'generated project persistence failed');
    return error.message;
  }
}

async function githubRequest(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GITHUB_TOKEN is not configured. Generated files were saved in Supabase only.');
  }

  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers ?? {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message ?? `GitHub request failed with ${response.status}`);
  }

  return data;
}

async function commitGeneratedFilesToGitHub({ branch, files, request }) {
  const repository = process.env.GITHUB_REPOSITORY;

  if (!process.env.GITHUB_TOKEN || !repository) {
    return {
      enabled: false,
      repository: repository ?? null,
      branch,
      filesCommitted: 0,
      message: 'Set GITHUB_TOKEN and GITHUB_REPOSITORY on Render to enable automatic GitHub commits.'
    };
  }

  try {
    const repo = await githubRequest(`/repos/${repository}`);
    const baseBranch = process.env.GITHUB_BASE_BRANCH ?? repo.default_branch ?? 'main';
    const baseRef = await githubRequest(`/repos/${repository}/git/ref/heads/${baseBranch}`);

    try {
      await githubRequest(`/repos/${repository}/git/refs`, {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${branch}`,
          sha: baseRef.object.sha
        })
      });
    } catch (error) {
      if (!String(error.message).includes('Reference already exists')) {
        throw error;
      }
    }

    const commits = [];

    for (const file of files) {
      let existingSha = null;

      try {
        const existing = await githubRequest(
          `/repos/${repository}/contents/${encodeURIComponent(file.path).replaceAll('%2F', '/')}?ref=${branch}`
        );
        existingSha = existing.sha;
      } catch (error) {
        if (!String(error.message).includes('Not Found')) {
          throw error;
        }
      }

      const result = await githubRequest(
        `/repos/${repository}/contents/${encodeURIComponent(file.path).replaceAll('%2F', '/')}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            message: `Generate ${file.path}`,
            content: Buffer.from(file.content, 'utf8').toString('base64'),
            branch,
            ...(existingSha ? { sha: existingSha } : {})
          })
        }
      );

      commits.push(result.commit?.sha);
    }

    return {
      enabled: true,
      repository,
      branch,
      filesCommitted: files.length,
      commits,
      branchUrl: `https://github.com/${repository}/tree/${branch}`
    };
  } catch (error) {
    request?.log?.error({ error }, 'GitHub commit failed');

    return {
      enabled: true,
      repository,
      branch,
      filesCommitted: 0,
      error: error.message
    };
  }
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

async function runAgentStep(agentId, systemPrompt, userPrompt, request) {
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

    await tryAddMemory({
      type: 'agent-output',
      content: result.content,
      metadata: {
        agentId,
        model: result.model,
        usage: result.usage ?? null
      }
    }, request);

    return result.content;
  } catch (error) {
    providerErrorEvent(agentId, error);

    await tryAddMemory({
      type: 'agent-error',
      content: error.message,
      metadata: {
        agentId
      }
    }, request);

    throw error;
  }
}

app.get('/', async () => ({
  status: 'ok',
  service: 'advanced-agent-os'
}));

app.get('/health', async () => ({
  status: 'ok',
  service: 'advanced-agent-os-api'
}));

app.get('/debug/memory-state', async (request, reply) => {
  try {
    return {
      ...publicRuntimeState(),
      recordCount: (await memory.list()).length,
      socketCount: sockets.size
    };
  } catch (error) {
    request.log.error({ error }, 'memory state check failed');

    return reply.code(500).send({
      status: 'error',
      error: error.message,
      ...publicRuntimeState()
    });
  }
});

app.get('/test-memory', async (request, reply) => {
  const { memoryRecord, memoryError } = await tryAddMemory({
    type: 'manual-test',
    content: 'memory test',
    metadata: { source: 'debug' }
  }, request);

  if (memoryError) {
    return reply.code(500).send({
      success: false,
      error: memoryError,
      runtime: publicRuntimeState()
    });
  }

  return {
    success: true,
    memoryRecord,
    records: await memory.list()
  };
});

app.get('/test-groq', async (request, reply) => {
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
      error: error.message,
      runtime: publicRuntimeState()
    });
  }
});

app.get('/agents', async () => ({ agents }));

app.get('/events', async () => ({ events }));

app.get('/memory', async (request, reply) => {
  try {
    return { records: await memory.list() };
  } catch (error) {
    request.log.error({ error }, 'memory list failed');

    return reply.code(500).send({
      records: [],
      error: error.message,
      runtime: publicRuntimeState()
    });
  }
});

app.get('/memory/search', async (request, reply) => {
  const query = request.query?.q ?? '';

  try {
    return { records: query ? await memory.search(query) : await memory.list() };
  } catch (error) {
    request.log.error({ error }, 'memory search failed');

    return reply.code(500).send({
      records: [],
      error: error.message,
      runtime: publicRuntimeState()
    });
  }
});

app.get('/projects', async (request, reply) => {
  try {
    if (memory.pool) {
      const result = await queryDatabase(
        `select id, name, prompt, status, github_repo, branch_name, metadata, created_at
         from projects
         order by created_at desc
         limit 25`
      );

      return { projects: result.rows };
    }

    return { projects: [...generatedProjects].reverse().slice(0, 25) };
  } catch (error) {
    request.log.error({ error }, 'project list failed');
    return reply.code(500).send({ projects: [], error: error.message });
  }
});

app.get('/ws/events', { websocket: true }, connection => {
  const socket = connection?.socket ?? connection;

  if (!socket || typeof socket.send !== 'function') {
    app.log.warn('websocket connection did not expose a socket');
    return;
  }

  sockets.add(socket);

  socket.send(JSON.stringify({
    id: `event-${Date.now()}`,
    type: 'system',
    message: 'Connected to Advanced Agent OS live event stream.',
    timestamp: new Date().toISOString()
  }));

  socket.on('close', () => {
    sockets.delete(socket);
  });
});

app.post('/projects/generate', async (request, reply) => {
  const body = request.body ?? {};
  const prompt = String(body.prompt ?? '').trim();
  const requestedName = String(body.projectName ?? '').trim();

  if (!prompt) {
    return reply.code(400).send({
      success: false,
      error: 'Prompt is required.'
    });
  }

  const now = new Date();
  const suffix = now.toISOString().replace(/[-:]/g, '').slice(0, 12).toLowerCase();
  const name = requestedName || titleFromPrompt(prompt);
  const slug = `${slugify(name)}-${suffix}`;
  const rootPath = `${process.env.GENERATED_PROJECT_ROOT ?? 'generated'}/${slug}`;
  const branch = `codex/generated-${slug}`;
  const projectId = randomUUID();
  const runId = randomUUID();

  addEvent({
    id: `event-${events.length + 1}`,
    type: 'project.generation.started',
    message: `Project generation started: ${name}`,
    timestamp: now.toISOString(),
    data: { projectId, runId, prompt }
  });

  const files = buildWebsiteFiles({ prompt, projectName: name, rootPath });
  const github = await commitGeneratedFilesToGitHub({ branch, files, request });
  const project = {
    id: projectId,
    name,
    prompt,
    status: github.error ? 'generated_with_git_error' : 'generated',
    metadata: {
      slug,
      rootPath,
      fileCount: files.length
    },
    createdAt: now.toISOString()
  };
  const run = {
    id: runId,
    projectId,
    prompt,
    status: project.status,
    agentSummary: `Generated ${files.length} Vite/React files for ${name}.`,
    metadata: {
      github,
      files: files.map(file => ({ path: file.path, bytes: file.content.length }))
    }
  };
  const persistenceError = await saveGeneratedProject({ project, run, files, github }, request);

  const { memoryRecord, memoryError } = await tryAddMemory({
    type: 'project-generated',
    content: JSON.stringify({ project, run, github, files: files.map(file => file.path) }, null, 2),
    metadata: {
      projectId,
      runId,
      prompt,
      github
    }
  }, request);

  addEvent({
    id: `event-${events.length + 1}`,
    type: 'project.generation.completed',
    message: `Project generation completed: ${name}`,
    timestamp: new Date().toISOString(),
    data: {
      projectId,
      runId,
      fileCount: files.length,
      github,
      persistenceError,
      memoryError
    }
  });

  return {
    success: true,
    project,
    run,
    files: files.map(file => ({ path: file.path, bytes: file.content.length })),
    github,
    persistenceError,
    memoryRecord,
    memoryError,
    runtime: publicRuntimeState()
  };
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

  await tryAddMemory({
    type: 'tool-command-result',
    content: JSON.stringify(result, null, 2),
    metadata: {
      agentId,
      command,
      mode: result.mode,
      success: result.success
    }
  }, request);

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

    const { memoryRecord, memoryError } = await tryAddMemory({
      type: 'ai-demo-result',
      content: result.content,
      metadata: {
        agentId,
        prompt,
        model: result.model,
        usage: result.usage ?? null
      }
    }, request);

    addEvent({
      id: `event-${events.length + 1}`,
      type: 'task.completed',
      agentId,
      message: `Run AI Demo completed with model ${result.model}.`,
      timestamp: new Date().toISOString(),
      data: {
        model: result.model,
        memoryRecordId: memoryRecord?.id ?? null,
        memoryError
      }
    });

    return {
      success: true,
      prompt,
      result,
      memoryRecord,
      memoryError
    };
  } catch (error) {
    providerErrorEvent(agentId, error);

    const { memoryRecord, memoryError } = await tryAddMemory({
      type: 'ai-demo-error',
      content: error.message,
      metadata: {
        agentId,
        prompt
      }
    }, request);

    request.log.error({ error }, 'run-ai-demo failed');

    return {
      success: false,
      prompt,
      error: error.message,
      memoryRecord,
      memoryError,
      runtime: publicRuntimeState()
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
      goal,
      request
    );

    const architecture = await runAgentStep(
      'architect',
      'You are the Architect Agent. Convert the project plan into a technical architecture with modules and data flow.',
      projectPlan,
      request
    );

    const backendPlan = await runAgentStep(
      'backend',
      'You are the Backend Agent. Produce API, database and service implementation tasks from the architecture.',
      architecture,
      request
    );

    const frontendPlan = await runAgentStep(
      'frontend',
      'You are the Frontend Agent. Produce UI screens, components and state management tasks from the architecture.',
      architecture,
      request
    );

    const qaPlan = await runAgentStep(
      'qa',
      'You are the QA Agent. Review the backend and frontend plans and produce a practical test strategy.',
      `Backend plan:\n${backendPlan}\n\nFrontend plan:\n${frontendPlan}`,
      request
    );

    const finalResult = {
      goal,
      projectPlan,
      architecture,
      backendPlan,
      frontendPlan,
      qaPlan
    };

    const { memoryRecord, memoryError } = await tryAddMemory({
      type: 'agent-chain-artifact',
      content: JSON.stringify(finalResult, null, 2),
      metadata: {
        goal,
        agents: ['project-manager', 'architect', 'backend', 'frontend', 'qa']
      }
    }, request);

    addEvent({
      id: `event-${events.length + 1}`,
      type: 'artifact.created',
      message: 'Multi-agent chain completed and produced final execution artifact.',
      timestamp: new Date().toISOString(),
      data: {
        ...finalResult,
        memoryRecordId: memoryRecord?.id ?? null,
        memoryError
      }
    });

    addEvent({
      id: `event-${events.length + 1}`,
      type: 'task.completed',
      message: 'Multi-agent chain completed successfully.',
      timestamp: new Date().toISOString(),
      data: {
        goal,
        memoryRecordId: memoryRecord?.id ?? null,
        memoryError
      }
    });

    return {
      success: true,
      result: finalResult,
      memoryRecord,
      memoryError
    };
  } catch (error) {
    providerErrorEvent('agent-chain', error);

    const { memoryRecord, memoryError } = await tryAddMemory({
      type: 'agent-chain-error',
      content: error.message,
      metadata: {
        goal
      }
    }, request);

    request.log.error({ error }, 'run-agent-chain failed');

    return {
      success: false,
      error: error.message,
      memoryRecord,
      memoryError,
      runtime: publicRuntimeState()
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
