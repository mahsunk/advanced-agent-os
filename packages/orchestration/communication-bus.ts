export type AgentEvent = {
  source: string;
  target?: string;
  type: string;
  payload: unknown;
  createdAt: number;
};

export class CommunicationBus {
  private events: AgentEvent[] = [];

  publish(event: AgentEvent) {
    this.events.push(event);
  }

  consume(target?: string) {
    if (!target) {
      return this.events;
    }

    return this.events.filter(
      event => !event.target || event.target === target
    );
  }
}
