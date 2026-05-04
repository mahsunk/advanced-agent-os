import type { DashboardEvent } from '../events';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function fetchEvents(): Promise<DashboardEvent[]> {
  const response = await fetch(`${API_BASE_URL}/events`);

  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }

  const data = await response.json();
  return data.events ?? [];
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
