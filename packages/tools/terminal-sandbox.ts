export type TerminalCommand = {
  command: string;
  cwd?: string;
  timeoutMs?: number;
};

export type TerminalResult = {
  command: string;
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
};

export class TerminalSandbox {
  async run(input: TerminalCommand): Promise<TerminalResult> {
    return {
      command: input.command,
      success: false,
      stdout: '',
      stderr: 'Terminal execution is disabled until a safe sandbox adapter is configured.',
      exitCode: 126
    };
  }
}
