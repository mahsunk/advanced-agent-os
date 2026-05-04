const DEFAULT_BLOCKED_PATTERNS = [
  /\brm\s+-rf\b/i,
  /\bsudo\b/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\bchmod\s+777\b/i,
  /\bcurl\b.+\|\s*(sh|bash)/i,
  /\bwget\b.+\|\s*(sh|bash)/i
];

export class SafeCommandRunner {
  constructor(options = {}) {
    this.allowRealExecution = options.allowRealExecution ?? process.env.ALLOW_REAL_COMMANDS === 'true';
    this.blockedPatterns = options.blockedPatterns ?? DEFAULT_BLOCKED_PATTERNS;
  }

  validate(command) {
    if (!command || typeof command !== 'string') {
      return { ok: false, reason: 'Command must be a non-empty string.' };
    }

    const blockedPattern = this.blockedPatterns.find(pattern => pattern.test(command));

    if (blockedPattern) {
      return {
        ok: false,
        reason: `Blocked unsafe command pattern: ${blockedPattern.toString()}`
      };
    }

    return { ok: true };
  }

  async run(command, context = {}) {
    const validation = this.validate(command);

    if (!validation.ok) {
      return {
        success: false,
        command,
        mode: 'blocked',
        stdout: '',
        stderr: validation.reason,
        exitCode: 1,
        context
      };
    }

    if (!this.allowRealExecution) {
      return {
        success: true,
        command,
        mode: 'dry-run',
        stdout: `Dry run only. Command validated but not executed: ${command}`,
        stderr: '',
        exitCode: 0,
        context
      };
    }

    return {
      success: false,
      command,
      mode: 'not-implemented',
      stdout: '',
      stderr: 'Real command execution is intentionally not implemented yet. Add a Docker-isolated executor first.',
      exitCode: 1,
      context
    };
  }
}
