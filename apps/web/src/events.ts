export type DashboardEvent = {
  id: string;
  type: 'task' | 'agent' | 'system';
  message: string;
  timestamp: string;
};

export const initialEvents: DashboardEvent[] = [
  {
    id: 'event-1',
    type: 'system',
    message: 'Advanced Agent OS dashboard initialized.',
    timestamp: new Date().toISOString()
  },
  {
    id: 'event-2',
    type: 'agent',
    message: 'Agent registry ready.',
    timestamp: new Date().toISOString()
  }
];
