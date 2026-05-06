import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import {
  fetchEvents,
  fetchMemory,
  generateProject,
  runAgentChain,
  runAiDemo,
  runCommandTool,
  runDemoOrchestration,
  searchMemory,
  subscribeToEvents,
  type CommandResult,
  type GeneratedProjectResponse,
  type MemoryRecord
} from './api/client';
import { AgentCard } from './components/AgentCard';
import { EventFeed } from './components/EventFeed';
import type { DashboardEvent } from './events';
import { initialEvents } from './events';
import { dashboardState } from './state/dashboard-store';

function App() {
  const [events, setEvents] = useState<DashboardEvent[]>(initialEvents);
  const [memoryRecords, setMemoryRecords] = useState<MemoryRecord[]>([]);
  const [memoryQuery, setMemoryQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [isChainRunning, setIsChainRunning] = useState(false);
  const [isCommandRunning, setIsCommandRunning] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [projectName, setProjectName] = useState('Launch Site MVP');
  const [generatorPrompt, setGeneratorPrompt] = useState('Create a modern landing page for a small AI automation studio.');
  const [prompt, setPrompt] = useState('Create a short engineering plan for a multi-agent SaaS platform.');
  const [command, setCommand] = useState('npm run check');
  const [generatedProject, setGeneratedProject] = useState<GeneratedProjectResponse | undefined>();
  const [aiResult, setAiResult] = useState<string | undefined>();
  const [chainResult, setChainResult] = useState<unknown>();
  const [commandResult, setCommandResult] = useState<CommandResult | undefined>();

  async function refreshEvents() {
    try {
      const apiEvents = await fetchEvents();
      setEvents(apiEvents.length ? apiEvents : initialEvents);
    } catch {
      setEvents(initialEvents);
    }
  }

  async function refreshMemory() {
    try {
      const records = memoryQuery.trim()
        ? await searchMemory(memoryQuery.trim())
        : await fetchMemory();

      setMemoryRecords(records);
    } catch {
      setMemoryRecords([]);
    }
  }

  async function handleGenerateProject() {
    setIsGenerating(true);

    try {
      const response = await generateProject(generatorPrompt, projectName);
      setGeneratedProject(response);
      await refreshEvents();
      await refreshMemory();
    } catch (error) {
      setGeneratedProject({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate project.'
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRunDemo() {
    setIsRunning(true);

    try {
      await runDemoOrchestration();
      await refreshEvents();
    } finally {
      setIsRunning(false);
    }
  }

  async function handleRunAiDemo() {
    setIsAiRunning(true);

    try {
      const response = await runAiDemo(prompt);
      const runtimeError = [response.error, response.memoryError]
        .filter(Boolean)
        .join('\n');

      setAiResult(response.result?.content || runtimeError || 'No AI result returned.');
      await refreshEvents();
      await refreshMemory();
    } catch (error) {
      setAiResult(error instanceof Error ? error.message : 'Failed to run AI demo.');
    } finally {
      setIsAiRunning(false);
    }
  }

  async function handleRunAgentChain() {
    setIsChainRunning(true);

    try {
      const response = await runAgentChain(prompt);
      setChainResult(response.result ?? { error: response.error, memoryError: response.memoryError });
      await refreshEvents();
      await refreshMemory();
    } finally {
      setIsChainRunning(false);
    }
  }

  async function handleRunCommand() {
    setIsCommandRunning(true);

    try {
      const result = await runCommandTool(command, 'manual-operator');
      setCommandResult(result);
      await refreshEvents();
      await refreshMemory();
    } finally {
      setIsCommandRunning(false);
    }
  }

  useEffect(() => {
    refreshEvents();
    refreshMemory();

    const unsubscribe = subscribeToEvents(event => {
      setIsLiveConnected(true);
      setEvents(currentEvents => [event, ...currentEvents]);

      if (event.type === 'memory.created' || event.type === 'project.generation.completed') {
        refreshMemory();
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 1040, margin: '0 auto' }}>
      <header style={{ marginBottom: 32 }}>
        <h1>Advanced Agent OS</h1>
        <p>Realtime multi-agent orchestration dashboard.</p>
        <button onClick={handleRunDemo} disabled={isRunning}>
          {isRunning ? 'Running demo...' : 'Run Demo Orchestration'}
        </button>
      </header>

      <section style={{ marginBottom: 32, border: '1px solid #333', borderRadius: 8, padding: 18 }}>
        <h2>Project Generator</h2>
        <p>Generate a real Vite/React website file set, save the run to Supabase, and commit to GitHub when server env is configured.</p>
        <input
          value={projectName}
          onChange={event => setProjectName(event.target.value)}
          placeholder="Project name"
          style={{ width: '100%', padding: 10, marginBottom: 12 }}
        />
        <textarea
          value={generatorPrompt}
          onChange={event => setGeneratorPrompt(event.target.value)}
          rows={4}
          placeholder="Describe the website or app to generate..."
          style={{ width: '100%', padding: 12, marginBottom: 12 }}
        />
        <button onClick={handleGenerateProject} disabled={isGenerating || !generatorPrompt.trim()}>
          {isGenerating ? 'Generating project...' : 'Generate Website Project'}
        </button>

        {generatedProject ? (
          <div style={{ marginTop: 16 }}>
            <h3>{generatedProject.success ? generatedProject.project?.name ?? 'Generated project' : 'Generation failed'}</h3>
            {generatedProject.error ? <p>{generatedProject.error}</p> : null}
            {generatedProject.run?.agentSummary ? <p>{generatedProject.run.agentSummary}</p> : null}
            {generatedProject.github?.branchUrl ? (
              <p><a href={generatedProject.github.branchUrl} target="_blank" rel="noreferrer">Open generated GitHub branch</a></p>
            ) : null}
            {generatedProject.github?.message ? <p>{generatedProject.github.message}</p> : null}
            {generatedProject.github?.error ? <p>GitHub: {generatedProject.github.error}</p> : null}
            {generatedProject.persistenceError ? <p>Persistence: {generatedProject.persistenceError}</p> : null}
            {generatedProject.memoryError ? <p>Memory: {generatedProject.memoryError}</p> : null}
            {generatedProject.files?.length ? (
              <ul>
                {generatedProject.files.map(file => (
                  <li key={file.path}>{file.path} ({file.bytes} bytes)</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>AI Runtime</h2>
        <textarea
          value={prompt}
          onChange={event => setPrompt(event.target.value)}
          rows={4}
          style={{ width: '100%', padding: 12, marginBottom: 12 }}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleRunAiDemo} disabled={isAiRunning || !prompt.trim()}>
            {isAiRunning ? 'Running AI demo...' : 'Run AI Demo'}
          </button>
          <button onClick={handleRunAgentChain} disabled={isChainRunning || !prompt.trim()}>
            {isChainRunning ? 'Running agent chain...' : 'Run Agent Chain'}
          </button>
        </div>
        {aiResult ? (
          <pre style={{ whiteSpace: 'pre-wrap', border: '1px solid #333', borderRadius: 8, padding: 16, marginTop: 16 }}>
            {aiResult}
          </pre>
        ) : null}
        {chainResult ? (
          <pre style={{ whiteSpace: 'pre-wrap', border: '1px solid #333', borderRadius: 8, padding: 16, marginTop: 16 }}>
            {JSON.stringify(chainResult, null, 2)}
          </pre>
        ) : null}
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Command Runner</h2>
        <p>Commands are validated and dry-run by default. Real execution is intentionally disabled until Docker isolation is implemented.</p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <input
            value={command}
            onChange={event => setCommand(event.target.value)}
            placeholder="npm run check"
            style={{ flex: 1, padding: 10 }}
          />
          <button onClick={handleRunCommand} disabled={isCommandRunning || !command.trim()}>
            {isCommandRunning ? 'Validating...' : 'Validate Command'}
          </button>
        </div>
        {commandResult ? (
          <pre style={{ whiteSpace: 'pre-wrap', border: '1px solid #333', borderRadius: 8, padding: 16 }}>
            {JSON.stringify(commandResult, null, 2)}
          </pre>
        ) : null}
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Memory Explorer</h2>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <input
            value={memoryQuery}
            onChange={event => setMemoryQuery(event.target.value)}
            placeholder="Search memory..."
            style={{ flex: 1, padding: 10 }}
          />
          <button onClick={refreshMemory}>Search</button>
        </div>
        <p>Total memory records: {memoryRecords.length}</p>
        <div>
          {memoryRecords.map(record => (
            <article key={record.id} style={{ border: '1px solid #333', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <strong>{record.type}</strong>
              <p>{record.createdAt}</p>
              <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 180, overflow: 'auto' }}>{record.content}</pre>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>System Overview</h2>
        <p>Total agents: {dashboardState.agents.length}</p>
        <p>Total events: {events.length}</p>
        <p>Live stream: {isLiveConnected ? 'connected' : 'waiting'}</p>
        <p>Runtime: autonomous task graph + shared memory + project generation + tool execution.</p>
      </section>

      <section>
        <h2>Agents</h2>
        <div>
          {dashboardState.agents.map(agent => (
            <AgentCard
              key={agent.id}
              name={agent.name}
              role={agent.role}
              status={agent.status}
            />
          ))}
        </div>
      </section>

      <EventFeed events={events} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
