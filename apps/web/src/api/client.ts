import type { DashboardEvent } from '../events';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export type MemoryRecord = {
  id: string;
  type: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export async function fetchEvents(): Promise<DashboardEvent[]> {
  const response = await fetch(`${API_BASE_URL}/events`);

  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }

  const data = await response.json();
  return data.events ?? [];
}

export async function fetchMemory(): Promise<MemoryRecord[]> {
  const response = await fetch(`${API_BASE_URL}/memory`);

  if (!response.ok) {
    throw new Error('Failed to fetch memory');
  }

  const data = await response.json();
  return data.records ?? [];
}

export async function searchMemory(query: string): Promise<MemoryRecord[]> {
  const response = await fetch(`${API_BASE_URL}/memory/search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error('Failed to search memory');
  }

  const data = await response.json();
  return data.records ?? [];
}

export async function runDemoOrchestration() {
  const response = await fetch(`${API_BASE_URL}/run-demo`, {
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error('Failed to run demo orchestration');
  }

  return response.json();
}

export async function runAiDemo(prompt: string) {
  const response = await fetch(`${API_BASE_URL}/run-ai-demo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    throw new Error('Failed to run AI demo');
  }

  return response.json();
}

export async function runAgentChain(prompt: string) {
  const response = await fetch(`${API_BASE_URL}/run-agent-chain`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    throw new Error('Failed to run agent chain');
  }

  return response.json();
}

export function subscribeToEvents(onEvent: (event: DashboardEvent) => void) {
  const socket = new WebSocket(`${WS_BASE_URL}/ws/events`);

  socket.onmessage = message => {
    try {
      onEvent(JSON.parse(message.data));
    } catch {
      // Ignore malformed websocket messages.
    }
  };

  return () => {
    socket.close();
  };
}
