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
const sockets = new Set();

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

const events = [{
  id: 'api-event-1',
  type: 'system',
  message: 'Advanced Agent OS API initialized.',
  timestamp: new Date().toISOString()
}];

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

function broadcast(event) {
  const payload = JSON.stringify(event);

  for (const socket of [...sockets]) {
    if (!socket || socket.readyState !== 1) {
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

function slugify(value) {
  return String(value ?? 'generated-project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'generated-project';
}

function titleFromPrompt(prompt) {
  const cleaned = String(prompt ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);

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

function parseMetadata(metadata) {
  if (!metadata) {
    return {};
  }

  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }

  return metadata;
}

function projectPreviewUrl(projectId) {
  return `/projects/${projectId}/preview`;
}

function buildWebsiteFiles({ prompt, projectName, rootPath }) {
  const title = projectName || titleFromPrompt(prompt);
  const slug = slugify(title);
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
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`
    },
    {
      path: `${rootPath}/src/main.jsx`,
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

import './styles.css';

const projectTitle = ${JSON.stringify(title)};
const projectPrompt = ${JSON.stringify(prompt)};
const features = ${JSON.stringify(features, null, 2)};

function App() {
  return (
    <main>
      <section className="hero">
        <nav>
          <strong>{projectTitle}</strong>
          <a href="#contact">Start</a>
        </nav>
        <div className="heroGrid">
          <div>
            <p className="eyebrow"><Sparkles size={16} /> AI generated launch page</p>
            <h1>{projectTitle}</h1>
            <p className="lead">{projectPrompt}</p>
            <div className="actions">
              <a className="primary" href="#contact">Plan a launch <ArrowRight size={18} /></a>
              <a className="secondary" href="#features">See details</a>
            </div>
          </div>
          <aside className="panel">
            <h2>Build Scope</h2>
            <ul>
              {features.map(feature => (
                <li key={feature}><CheckCircle2 size={18} /> {feature}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
      <section id="features" className="section">
        <h2>What this site includes</h2>
        <div className="cards">
          {features.map((feature, index) => (
            <article key={feature}>
              <span>0{index + 1}</span>
              <h3>{feature}</h3>
              <p>Ready to customize with real copy, images, forms, and deployment settings.</p>
            </article>
          ))}
        </div>
      </section>
      <section id="contact" className="cta">
        <h2>Ready for the next iteration?</h2>
        <p>Connect this generated project to GitHub, run a build, and deploy it as a Vercel preview.</p>
        <a className="primary" href="mailto:hello@example.com">Contact team <ArrowRight size={18} /></a>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
`
    },
    {
      path: `${rootPath}/src/styles.css`,
      content: `:root { color: #172026; background: #f6f8f7; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
* { box-sizing: border-box; }
body { margin: 0; }
a { color: inherit; text-decoration: none; }
main { min-height: 100vh; }
.hero { min-height: 88vh; padding: 28px; background: linear-gradient(135deg, #f6f8f7 0%, #dceae4 48%, #f4d8be 100%); }
nav { align-items: center; display: flex; justify-content: space-between; margin: 0 auto 72px; max-width: 1120px; }
nav strong { font-size: 20px; }
nav a, .secondary { border: 1px solid rgba(23, 32, 38, 0.22); border-radius: 8px; padding: 10px 14px; }
.heroGrid { align-items: center; display: grid; gap: 40px; grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr); margin: 0 auto; max-width: 1120px; }
.eyebrow { align-items: center; display: inline-flex; gap: 8px; margin: 0 0 18px; text-transform: uppercase; }
h1 { font-size: clamp(44px, 8vw, 92px); line-height: 0.95; margin: 0; max-width: 850px; }
.lead { font-size: 22px; line-height: 1.45; max-width: 680px; }
.actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
.primary { align-items: center; background: #172026; border-radius: 8px; color: white; display: inline-flex; gap: 10px; padding: 13px 18px; }
.panel, article { background: rgba(255, 255, 255, 0.72); border: 1px solid rgba(23, 32, 38, 0.12); border-radius: 8px; padding: 24px; }
.panel ul { display: grid; gap: 14px; list-style: none; margin: 0; padding: 0; }
.panel li { align-items: flex-start; display: flex; gap: 10px; }
.section, .cta { margin: 0 auto; max-width: 1120px; padding: 72px 28px; }
.section h2, .cta h2 { font-size: 40px; margin: 0 0 28px; }
.cards { display: grid; gap: 16px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
article span { color: #65756f; }
article h3 { min-height: 72px; }
.cta { border-top: 1px solid rgba(23, 32, 38, 0.14); }
.cta p { font-size: 20px; line-height: 1.5; max-width: 720px; }
@media (max-width: 820px) { .heroGrid, .cards { grid-template-columns: 1fr; } .hero { padding: 20px; } nav { margin-bottom: 48px; } }
`
    },
    {
      path: `${rootPath}/README.md`,
      content: `# ${title}

Generated by Advanced Agent OS Project Generator.

## Prompt

${prompt}

## Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`
`
    }
  ];
}

async function queryDatabase(query, values = []) {
  if (!memory.pool) {
    return null;
  }

  return memory.pool.query(query, values);
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
    return { memoryRecord: await addMemory(record), memoryError: null };
  } catch (error) {
    request?.log?.error({ error }, 'memory write failed');
    addEvent({
      id: `event-${events.length + 1}`,
      type: 'memory.error',
      message: `Memory write failed: ${error.message}`,
      timestamp: new Date().toISOString(),
      data: { error: error.message, ...publicRuntimeState() }
    });

    return { memoryRecord: null, memoryError: error.message };
  }
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
        [run.id, project.id, run.prompt, run.status, run.agentSummary, JSON.stringify(run.metadata ?? {})]
      );

      for (const file of files) {
        await queryDatabase(
          `insert into file_changes (id, project_id, run_id, path, action, new_content, metadata)
           values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
          [randomUUID(), project.id, run.id, file.path, 'create', file.content, JSON.stringify({ bytes: file.content.length })]
        );
      }
    } else {
      generatedProjects.push(project);
      generatedRuns.push(run);
      generatedFileChanges.push(...files.map(file => ({
        id: randomUUID(),
        projectId: project.id,
        runId: run.id,
        path: file.path,
        action: 'create',
        newContent: file.content,
        metadata: { bytes: file.content.length }
      })));
    }

    return null;
  } catch (error) {
    request?.log?.error({ error }, 'generated project persistence failed');
    return error.message;
  }
}

function mapProject(row) {
  return {
    id: row.id,
    name: row.name,
    prompt: row.prompt,
    status: row.status,
    githubRepo: row.github_repo ?? row.githubRepo ?? null,
    branchName: row.branch_name ?? row.branchName ?? null,
    metadata: parseMetadata(row.metadata),
    createdAt: row.created_at ?? row.createdAt ?? null,
    previewUrl: projectPreviewUrl(row.id)
  };
}

function mapRun(row) {
  return {
    id: row.id,
    projectId: row.project_id ?? row.projectId,
    prompt: row.prompt,
    status: row.status,
    agentSummary: row.agent_summary ?? row.agentSummary ?? '',
    metadata: parseMetadata(row.metadata),
    createdAt: row.created_at ?? row.createdAt ?? null
  };
}

function mapFileChange(row, includeContent = false) {
  const metadata = parseMetadata(row.metadata);
  const content = row.new_content ?? row.newContent ?? '';
  const file = {
    id: row.id,
    projectId: row.project_id ?? row.projectId,
    runId: row.run_id ?? row.runId,
    path: row.path,
    action: row.action,
    bytes: metadata.bytes ?? content.length,
    metadata,
    createdAt: row.created_at ?? row.createdAt ?? null
  };

  return includeContent ? { ...file, content } : file;
}

async function getGeneratedProjectBundle(projectId) {
  if (memory.pool) {
    const projectResult = await queryDatabase(
      `select id, name, prompt, status, github_repo, branch_name, metadata, created_at
       from projects
       where id = $1
       limit 1`,
      [projectId]
    );

    if (!projectResult.rows.length) {
      return null;
    }

    const runsResult = await queryDatabase(
      `select id, project_id, prompt, status, agent_summary, metadata, created_at
       from project_runs
       where project_id = $1
       order by created_at desc`,
      [projectId]
    );
    const filesResult = await queryDatabase(
      `select id, project_id, run_id, path, action, new_content, metadata, created_at
       from file_changes
       where project_id = $1
       order by path asc`,
      [projectId]
    );

    return {
      project: mapProject(projectResult.rows[0]),
      runs: runsResult.rows.map(mapRun),
      files: filesResult.rows.map(row => mapFileChange(row, true))
    };
  }

  const project = generatedProjects.find(item => item.id === projectId);

  if (!project) {
    return null;
  }

  return {
    project: mapProject(project),
    runs: generatedRuns.filter(run => run.projectId === projectId).map(mapRun),
    files: generatedFileChanges
      .filter(file => file.projectId === projectId)
      .map(file => mapFileChange(file, true))
      .sort((left, right) => left.path.localeCompare(right.path))
  };
}

function validateGeneratedFiles(files) {
  const byPath = new Map(files.map(file => [file.path, file]));
  const findFile = suffix => files.find(file => file.path.endsWith(suffix));
  const packageFile = findFile('/package.json') ?? byPath.get('package.json');
  const indexFile = findFile('/index.html') ?? byPath.get('index.html');
  const mainFile = findFile('/src/main.jsx') ?? byPath.get('src/main.jsx');
  const stylesFile = findFile('/src/styles.css') ?? byPath.get('src/styles.css');
  const readmeFile = findFile('/README.md') ?? byPath.get('README.md');
  const checks = [];

  checks.push({
    name: 'package-json-present',
    passed: Boolean(packageFile),
    message: packageFile ? 'package.json exists.' : 'package.json is missing.'
  });

  if (packageFile) {
    try {
      const parsed = JSON.parse(packageFile.content);
      checks.push({
        name: 'package-json-valid',
        passed: Boolean(parsed.scripts?.dev && parsed.scripts?.build && parsed.dependencies?.react),
        message: 'package.json parses and includes React/Vite scripts.'
      });
    } catch (error) {
      checks.push({
        name: 'package-json-valid',
        passed: false,
        message: `package.json is invalid JSON: ${error.message}`
      });
    }
  }

  checks.push({
    name: 'index-entrypoint',
    passed: Boolean(indexFile?.content.includes('/src/main.jsx')),
    message: indexFile ? 'index.html points at the React entrypoint.' : 'index.html is missing.'
  });
  checks.push({
    name: 'react-entrypoint',
    passed: Boolean(mainFile?.content.includes('ReactDOM.createRoot') && mainFile?.content.includes("import './styles.css'")),
    message: mainFile ? 'src/main.jsx mounts React and imports CSS.' : 'src/main.jsx is missing.'
  });
  checks.push({
    name: 'styles-present',
    passed: Boolean(stylesFile?.content.length > 200),
    message: stylesFile ? 'src/styles.css contains generated styling.' : 'src/styles.css is missing.'
  });
  checks.push({
    name: 'readme-present',
    passed: Boolean(readmeFile?.content.includes('Generated by Advanced Agent OS')),
    message: readmeFile ? 'README.md documents the generated project.' : 'README.md is missing.'
  });

  return {
    success: checks.every(check => check.passed),
    checks,
    checkedAt: new Date().toISOString()
  };
}

function buildProjectPreviewHtml(project, files) {
  const metadata = parseMetadata(project.metadata);
  const fileItems = files
    .map(file => `<li><code>${escapeHtml(file.path)}</code><span>${Number(file.bytes ?? file.content?.length ?? 0).toLocaleString()} bytes</span></li>`)
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(project.name)} Preview</title>
    <style>
      :root { color: #172026; background: #f6f8f7; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; }
      main { min-height: 100vh; }
      .hero { min-height: 70vh; padding: 28px; background: linear-gradient(135deg, #f6f8f7 0%, #dceae4 52%, #f4d8be 100%); }
      .wrap { margin: 0 auto; max-width: 1120px; }
      nav { align-items: center; display: flex; justify-content: space-between; margin-bottom: 72px; }
      h1 { font-size: clamp(42px, 8vw, 88px); line-height: .96; margin: 0; max-width: 900px; }
      .lead { font-size: 22px; line-height: 1.45; max-width: 760px; }
      .pill { border: 1px solid rgba(23,32,38,.2); border-radius: 999px; display: inline-block; padding: 8px 12px; }
      .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
      .button { background: #172026; border-radius: 8px; color: white; display: inline-block; padding: 13px 18px; text-decoration: none; }
      .ghost { border: 1px solid rgba(23,32,38,.22); border-radius: 8px; color: inherit; display: inline-block; padding: 13px 18px; text-decoration: none; }
      section { margin: 0 auto; max-width: 1120px; padding: 56px 28px; }
      ul { display: grid; gap: 10px; list-style: none; padding: 0; }
      li { align-items: center; background: white; border: 1px solid rgba(23,32,38,.12); border-radius: 8px; display: flex; justify-content: space-between; padding: 12px 14px; }
      code { white-space: normal; word-break: break-word; }
      @media (max-width: 720px) { nav, li { align-items: flex-start; flex-direction: column; gap: 10px; } .hero { padding: 20px; } }
    </style>
  </head>
  <body>
    <main>
      <div class="hero">
        <div class="wrap">
          <nav>
            <strong>${escapeHtml(project.name)}</strong>
            <span class="pill">${escapeHtml(project.status)}</span>
          </nav>
          <h1>${escapeHtml(project.name)}</h1>
          <p class="lead">${escapeHtml(project.prompt)}</p>
          <div class="actions">
            <a class="button" href="/projects/${project.id}/files">Inspect files</a>
            <a class="ghost" href="/projects/${project.id}">Project JSON</a>
          </div>
        </div>
      </div>
      <section>
        <p class="pill">${escapeHtml(metadata.rootPath ?? 'generated project')}</p>
        <h2>Generated file set</h2>
        <ul>${fileItems}</ul>
      </section>
    </main>
  </body>
</html>`;
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
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseRef.object.sha })
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
    return { enabled: true, repository, branch, filesCommitted: 0, error: error.message };
  }
}

function providerCompletedEvent(agentId, result) {
  return addEvent({
    id: `event-${events.length + 1}`,
    type: 'provider.completed',
    agentId,
    message: `AI provider responded with model ${result.model}.`,
    timestamp: new Date().toISOString(),
    data: { provider: provider.name, model: result.model, usage: result.usage ?? null }
  });
}

function providerErrorEvent(agentId, error) {
  return addEvent({
    id: `event-${events.length + 1}`,
    type: 'provider.error',
    agentId,
    message: `AI provider failed for ${agentId}: ${error.message}`,
    timestamp: new Date().toISOString(),
    data: { provider: provider.name, error: error.message }
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
      metadata: { agentId, model: result.model, usage: result.usage ?? null }
    }, request);

    return result.content;
  } catch (error) {
    providerErrorEvent(agentId, error);
    await tryAddMemory({ type: 'agent-error', content: error.message, metadata: { agentId } }, request);
    throw error;
  }
}

app.get('/', async () => ({ status: 'ok', service: 'advanced-agent-os' }));
app.get('/health', async () => ({ status: 'ok', service: 'advanced-agent-os-api' }));
app.get('/agents', async () => ({ agents }));
app.get('/events', async () => ({ events }));

app.get('/debug/memory-state', async (request, reply) => {
  try {
    return {
      ...publicRuntimeState(),
      recordCount: (await memory.list()).length,
      socketCount: sockets.size
    };
  } catch (error) {
    request.log.error({ error }, 'memory state check failed');
    return reply.code(500).send({ status: 'error', error: error.message, ...publicRuntimeState() });
  }
});

app.get('/test-memory', async (request, reply) => {
  const { memoryRecord, memoryError } = await tryAddMemory({
    type: 'manual-test',
    content: 'memory test',
    metadata: { source: 'debug' }
  }, request);

  if (memoryError) {
    return reply.code(500).send({ success: false, error: memoryError, runtime: publicRuntimeState() });
  }

  return { success: true, memoryRecord, records: await memory.list() };
});

app.get('/test-groq', async (request, reply) => {
  try {
    const result = await provider.complete([{ role: 'user', content: 'Say hello from Groq' }]);
    return { success: true, result };
  } catch (error) {
    return reply.code(500).send({ success: false, error: error.message, runtime: publicRuntimeState() });
  }
});

app.get('/memory', async (request, reply) => {
  try {
    return { records: await memory.list() };
  } catch (error) {
    request.log.error({ error }, 'memory list failed');
    return reply.code(500).send({ records: [], error: error.message, runtime: publicRuntimeState() });
  }
});

app.get('/memory/search', async (request, reply) => {
  const query = request.query?.q ?? '';

  try {
    return { records: query ? await memory.search(query) : await memory.list() };
  } catch (error) {
    request.log.error({ error }, 'memory search failed');
    return reply.code(500).send({ records: [], error: error.message, runtime: publicRuntimeState() });
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
      return { projects: result.rows.map(mapProject) };
    }

    return { projects: [...generatedProjects].reverse().slice(0, 25).map(mapProject) };
  } catch (error) {
    request.log.error({ error }, 'project list failed');
    return reply.code(500).send({ projects: [], error: error.message });
  }
});

app.get('/projects/:projectId/files/content', async (request, reply) => {
  try {
    const bundle = await getGeneratedProjectBundle(request.params.projectId);

    if (!bundle) {
      return reply.code(404).send({ success: false, error: 'Project not found.' });
    }

    const requestedPath = String(request.query?.path ?? '').trim();

    if (!requestedPath) {
      return reply.code(400).send({ success: false, error: 'Query parameter "path" is required.' });
    }

    const file = bundle.files.find(item => item.path === requestedPath);

    if (!file) {
      return reply.code(404).send({ success: false, error: 'File not found.' });
    }

    return { success: true, project: bundle.project, file };
  } catch (error) {
    request.log.error({ error }, 'generated file content failed');
    return reply.code(500).send({ success: false, error: error.message });
  }
});

app.get('/projects/:projectId/files', async (request, reply) => {
  try {
    const bundle = await getGeneratedProjectBundle(request.params.projectId);

    if (!bundle) {
      return reply.code(404).send({ success: false, error: 'Project not found.' });
    }

    return {
      success: true,
      project: bundle.project,
      files: bundle.files.map(({ content, ...summary }) => summary)
    };
  } catch (error) {
    request.log.error({ error }, 'generated file list failed');
    return reply.code(500).send({ success: false, error: error.message });
  }
});

app.post('/projects/:projectId/validate', async (request, reply) => {
  try {
    const bundle = await getGeneratedProjectBundle(request.params.projectId);

    if (!bundle) {
      return reply.code(404).send({ success: false, error: 'Project not found.' });
    }

    const validation = validateGeneratedFiles(bundle.files);
    await tryAddMemory({
      type: 'project-validation',
      content: JSON.stringify({ projectId: bundle.project.id, validation }, null, 2),
      metadata: { projectId: bundle.project.id, success: validation.success }
    }, request);

    return { success: validation.success, project: bundle.project, validation };
  } catch (error) {
    request.log.error({ error }, 'project validation failed');
    return reply.code(500).send({ success: false, error: error.message });
  }
});

app.get('/projects/:projectId/preview', async (request, reply) => {
  try {
    const bundle = await getGeneratedProjectBundle(request.params.projectId);

    if (!bundle) {
      return reply.code(404).type('text/html').send('<h1>Project not found</h1>');
    }

    return reply.type('text/html').send(buildProjectPreviewHtml(bundle.project, bundle.files));
  } catch (error) {
    request.log.error({ error }, 'project preview failed');
    return reply.code(500).type('text/html').send(`<h1>Preview failed</h1><p>${escapeHtml(error.message)}</p>`);
  }
});

app.get('/projects/:projectId', async (request, reply) => {
  try {
    const bundle = await getGeneratedProjectBundle(request.params.projectId);

    if (!bundle) {
      return reply.code(404).send({ success: false, error: 'Project not found.' });
    }

    return {
      success: true,
      project: bundle.project,
      runs: bundle.runs,
      files: bundle.files.map(({ content, ...summary }) => summary)
    };
  } catch (error) {
    request.log.error({ error }, 'project detail failed');
    return reply.code(500).send({ success: false, error: error.message });
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
  socket.on('close', () => sockets.delete(socket));
});

app.post('/projects/generate', async (request, reply) => {
  const body = request.body ?? {};
  const prompt = String(body.prompt ?? '').trim();
  const requestedName = String(body.projectName ?? '').trim();

  if (!prompt) {
    return reply.code(400).send({ success: false, error: 'Prompt is required.' });
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
  const validation = validateGeneratedFiles(files.map(file => ({
    ...file,
    id: randomUUID(),
    projectId,
    runId,
    action: 'create',
    metadata: { bytes: file.content.length }
  })));
  const github = await commitGeneratedFilesToGitHub({ branch, files, request });
  const project = {
    id: projectId,
    name,
    prompt,
    status: github.error ? 'generated_with_git_error' : 'generated',
    metadata: { slug, rootPath, fileCount: files.length },
    previewUrl: projectPreviewUrl(projectId),
    createdAt: now.toISOString()
  };
  const run = {
    id: runId,
    projectId,
    prompt,
    status: project.status,
    agentSummary: `Generated ${files.length} Vite/React files for ${name}.`,
    metadata: { github, files: files.map(file => ({ path: file.path, bytes: file.content.length })) }
  };
  const persistenceError = await saveGeneratedProject({ project, run, files, github }, request);
  const { memoryRecord, memoryError } = await tryAddMemory({
    type: 'project-generated',
    content: JSON.stringify({ project, run, github, files: files.map(file => file.path) }, null, 2),
    metadata: { projectId, runId, prompt, github }
  }, request);

  addEvent({
    id: `event-${events.length + 1}`,
    type: 'project.generation.completed',
    message: `Project generation completed: ${name}`,
    timestamp: new Date().toISOString(),
    data: { projectId, runId, fileCount: files.length, validation, github, persistenceError, memoryError }
  });

  return {
    success: true,
    project,
    run,
    files: files.map(file => ({ path: file.path, bytes: file.content.length })),
    validation,
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
    metadata: { agentId, command, mode: result.mode, success: result.success }
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

  return { success: true, message: 'Demo orchestration started.', agentsQueued: agents.length, events };
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
      { role: 'system', content: 'You are the Project Manager Agent inside Advanced Agent OS. Return a concise engineering plan.' },
      { role: 'user', content: prompt }
    ]);
    providerCompletedEvent(agentId, result);
    const { memoryRecord, memoryError } = await tryAddMemory({
      type: 'ai-demo-result',
      content: result.content,
      metadata: { agentId, prompt, model: result.model, usage: result.usage ?? null }
    }, request);
    addEvent({
      id: `event-${events.length + 1}`,
      type: 'task.completed',
      agentId,
      message: `Run AI Demo completed with model ${result.model}.`,
      timestamp: new Date().toISOString(),
      data: { model: result.model, memoryRecordId: memoryRecord?.id ?? null, memoryError }
    });

    return { success: true, prompt, result, memoryRecord, memoryError };
  } catch (error) {
    providerErrorEvent(agentId, error);
    const { memoryRecord, memoryError } = await tryAddMemory({
      type: 'ai-demo-error',
      content: error.message,
      metadata: { agentId, prompt }
    }, request);
    request.log.error({ error }, 'run-ai-demo failed');

    return { success: false, prompt, error: error.message, memoryRecord, memoryError, runtime: publicRuntimeState() };
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
    const finalResult = { goal, projectPlan, architecture, backendPlan, frontendPlan, qaPlan };
    const { memoryRecord, memoryError } = await tryAddMemory({
      type: 'agent-chain-artifact',
      content: JSON.stringify(finalResult, null, 2),
      metadata: { goal, agents: ['project-manager', 'architect', 'backend', 'frontend', 'qa'] }
    }, request);
    addEvent({
      id: `event-${events.length + 1}`,
      type: 'artifact.created',
      message: 'Multi-agent chain completed and produced final execution artifact.',
      timestamp: new Date().toISOString(),
      data: { ...finalResult, memoryRecordId: memoryRecord?.id ?? null, memoryError }
    });
    addEvent({
      id: `event-${events.length + 1}`,
      type: 'task.completed',
      message: 'Multi-agent chain completed successfully.',
      timestamp: new Date().toISOString(),
      data: { goal, memoryRecordId: memoryRecord?.id ?? null, memoryError }
    });

    return { success: true, result: finalResult, memoryRecord, memoryError };
  } catch (error) {
    providerErrorEvent('agent-chain', error);
    const { memoryRecord, memoryError } = await tryAddMemory({
      type: 'agent-chain-error',
      content: error.message,
      metadata: { goal }
    }, request);
    request.log.error({ error }, 'run-agent-chain failed');

    return { success: false, error: error.message, memoryRecord, memoryError, runtime: publicRuntimeState() };
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
