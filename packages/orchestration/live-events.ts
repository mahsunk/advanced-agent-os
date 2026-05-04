export type LiveAgentEventType =
  | 'task.created'
  | 'task.started'
  | 'task.completed'
  | 'task.failed'
  | 'agent.message'
  | 'artifact.created';

export type LiveAgentEvent = {
  id: string;
  type: LiveAgentEventType;
  agentId?: string;
  taskId?: string;
  message: string;
  data?: unknown;
  createdAt: string;
};

export class LiveEventStream {
  private events: LiveAgentEvent[] = [];

  emit(event: Omit<LiveAgentEvent, 'createdAt'>) {
    const fullEvent: LiveAgentEvent = {
      ...event,
      createdAt: new Date().toISOString()
    };

    this.events.push(fullEvent);
    return fullEvent;
  }

  list() {
    return this.events;
  }
}
