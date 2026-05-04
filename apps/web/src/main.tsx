import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import { fetchEvents, runDemoOrchestration } from './api/client';
import { AgentCard } from './components/AgentCard';
import { EventFeed } from './components/EventFeed';
import type { DashboardEvent } from './events';
import { initialEvents } from './events';
import { dashboardState } from './state/dashboard-store';

function App() {
  const [events, setEvents] = useState<DashboardEvent[]>(initialEvents);
  const [isRunning, setIsRunning] = useState(false);

  async function refreshEvents() {
    try {
      const apiEvents = await fetchEvents();
      setEvents(apiEvents.length ? apiEvents : initialEvents);
    } catch {
      setEvents(initialEvents);
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

  useEffect(() => {
    refreshEvents();
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <header style={{ marginBottom: 32 }}>
        <h1>Advanced Agent OS</h1>
        <p>Realtime multi-agent orchestration dashboard.</p>
        <button onClick={handleRunDemo} disabled={isRunning}>
          {isRunning ? 'Running demo...' : 'Run Demo Orchestration'}
        </button>
      </header>

      <section style={{ marginBottom: 32 }}>
        <h2>System Overview</h2>
        <p>Total agents: {dashboardState.agents.length}</p>
        <p>Total events: {events.length}</p>
        <p>Runtime: autonomous task graph + shared memory + tool execution.</p>
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
