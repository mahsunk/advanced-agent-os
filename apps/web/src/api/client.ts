import type { DashboardEvent } from '../events';

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000')
  .replace(/^\s*VITE_API_URL\s*=\s*/i, '')
  .replace(/\/+$/, '');
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

async function readResponseBody(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export type MemoryRecord = {
  id: string;
  type: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type CommandResult = {
  success: boolean;
  command: string;
  mode: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  context: Record<string, unknown>;
};

export type GeneratedProjectFile = {
  path: string;
  bytes: number;
};

export type GeneratedProjectResponse = {
  success: boolean;
  project?: {
    id: string;
    name: string;
    prompt: string;
    status: string;
    metadata?: Record<string, unknown>;
    createdAt?: string;
  };
  run?: {
    id: string;
    projectId: string;
    prompt: string;
    status: string;
    agentSummary: string;
    metadata?: Record<string, unknown>;
  };
  files?: GeneratedProjectFile[];
  github?: {
    enabled: boolean;
    repository?: string | null;
    branch?: string;
    filesCommitted?: number;
    branchUrl?: string;
    message?: string;
    error?: string;
  };
  persistenceError?: string | null;
  memoryError?: string | null;
  error?: string;
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

export async function generateProject(prompt: string, projectName?: string): Promise<GeneratedProjectResponse> {
  const response = await fetch(`${API_BASE_URL}/projects/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt, projectName })
  });

  const data = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(typeof data === 'string' ? data : data.error ?? 'Failed to generate project');
  }

  return data as GeneratedProjectResponse;
}

export async function runCommandTool(command: string, agentId = 'manual-operator'): Promise<CommandResult> {
  const response = await fetch(`${API_BASE_URL}/tools/run-command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ command, agentId })
  });

  const data = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(typeof data === 'string' ? data : 'Failed to run command tool');
  }

  return data as CommandResult;
}

export async function runDemoOrchestration() {
  const response = await fetch(`${API_BASE_URL}/run-demo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  const data = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(typeof data === 'string' ? data : 'Failed to run demo orchestration');
  }

  return data;
}

export async function runAiDemo(prompt: string) {
  const response = await fetch(`${API_BASE_URL}/run-ai-demo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  });

  const data = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(typeof data === 'string' ? data : 'Failed to run AI demo');
  }

  return data;
}

export async function runAgentChain(prompt: string) {
  const response = await fetch(`${API_BASE_URL}/run-agent-chain`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  });

  const data = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(typeof data === 'string' ? data : 'Failed to run agent chain');
  }

  return data;
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
