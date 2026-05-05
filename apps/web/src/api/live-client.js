const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export async function fetchJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }

  return response.json();
}

export async function postJson(path, payload = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }

  return response.json();
}

export function subscribeToLiveEvents({ onEvent, onStatus }) {
  onStatus?.('waiting');

  const socket = new WebSocket(`${WS_BASE_URL}/ws/events`);

  socket.onopen = () => {
    onStatus?.('connected');
  };

  socket.onmessage = message => {
    try {
      onEvent?.(JSON.parse(message.data));
    } catch {
      // Ignore malformed websocket payloads.
    }
  };

  socket.onerror = () => {
    onStatus?.('error');
  };

  socket.onclose = () => {
    onStatus?.('waiting');
  };

  return () => socket.close();
}

export async function refreshRuntimeState() {
  const [events, memory] = await Promise.all([
    fetchJson('/events'),
    fetchJson('/memory')
  ]);

  return {
    events: events.events ?? [],
    memoryRecords: memory.records ?? []
  };
}

export async function runActionAndRefresh(path, payload = {}) {
  const result = await postJson(path, payload);
  const runtimeState = await refreshRuntimeState();

  return {
    result,
    ...runtimeState
  };
}
