export type AgentTask = {
  id: string;
  role: string;
  goal: string;
};

export class AgentRuntime {
  private queue: AgentTask[] = [];

  enqueue(task: AgentTask) {
    this.queue.push(task);
  }

  next() {
    return this.queue.shift();
  }
}
