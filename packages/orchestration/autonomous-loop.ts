import { AgentTask } from '../agent-core/src/types.js';

export type AutonomousLoopOptions = {
  maxIterations?: number;
};

export class AutonomousLoop {
  async execute(
    seedTask: AgentTask,
    callback: (task: AgentTask, iteration: number) => Promise<void>,
    options?: AutonomousLoopOptions
  ) {
    const maxIterations = options?.maxIterations ?? 5;

    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      await callback(seedTask, iteration);
    }
  }
}
