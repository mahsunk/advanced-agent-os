import React from 'react';
import ReactDOM from 'react-dom/client';

import { AgentCard } from './components/AgentCard';
import { EventFeed } from './components/EventFeed';
import { initialEvents } from './events';
import { dashboardState } from './state/dashboard-store';

function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <header style={{ marginBottom: 32 }}>
        <h1>Advanced Agent OS</h1>
        <p>Realtime multi-agent orchestration dashboard.</p>
      </header>

      <section style={{ marginBottom: 32 }}>
        <h2>System Overview</h2>
        <p>Total agents: {dashboardState.agents.length}</p>
        <p>Total events: {initialEvents.length}</p>
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

      <EventFeed events={initialEvents} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
