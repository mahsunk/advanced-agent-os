import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>Advanced Agent OS</h1>
      <p>Realtime multi-agent orchestration dashboard.</p>

      <div>
        <h2>Agents</h2>
        <ul>
          <li>Project Manager Agent</li>
          <li>Architect Agent</li>
          <li>Frontend Agent</li>
          <li>Backend Agent</li>
          <li>QA Agent</li>
          <li>Security Agent</li>
          <li>DevOps Agent</li>
          <li>Research Agent</li>
        </ul>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
