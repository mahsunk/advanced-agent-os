export type ToolExecution = {
  tool: string;
  input: unknown;
};

export class ToolRunner {
  async execute(execution: ToolExecution) {
    return {
      success: true,
      tool: execution.tool,
      output: `Executed tool: ${execution.tool}`
    };
  }
}
