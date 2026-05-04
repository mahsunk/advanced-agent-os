export type LogLevel = 'info' | 'warn' | 'error';

export class TelemetryLogger {
  log(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
    console.log(
      JSON.stringify({
        level,
        message,
        metadata,
        timestamp: new Date().toISOString()
      })
    );
  }

  info(message: string, metadata?: Record<string, unknown>) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>) {
    this.log('error', message, metadata);
  }
}
