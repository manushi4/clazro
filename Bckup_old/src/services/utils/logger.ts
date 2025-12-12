/**
 * Logging utility service for the coaching platform
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = __DEV__;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context,
      error
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    if (this.isDevelopment) {
      this.outputToConsole(entry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const contextStr = entry.context ? JSON.stringify(entry.context) : '';
    const fullMessage = `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message} ${contextStr}`;

    switch (entry.level) {
      case 'debug':
        console.debug(fullMessage);
        break;
      case 'info':
        console.info(fullMessage);
        break;
      case 'warn':
        console.warn(fullMessage);
        if (entry.error) console.warn(entry.error);
        break;
      case 'error':
        console.error(fullMessage);
        if (entry.error) console.error(entry.error);
        break;
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('debug', message, context);
    this.addLog(entry);
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('info', message, context);
    this.addLog(entry);
  }

  warn(message: string, context?: Record<string, any>, error?: Error): void {
    const entry = this.createLogEntry('warn', message, context, error);
    this.addLog(entry);
  }

  error(message: string, contextOrError?: Record<string, any> | unknown, error?: Error): void {
    // Handle flexible parameter: if second param looks like an Error, treat it as such
    let context: Record<string, any> | undefined;
    let errorParam: Error | undefined;

    if (contextOrError instanceof Error) {
      errorParam = contextOrError;
    } else if (contextOrError && typeof contextOrError === 'object') {
      context = contextOrError as Record<string, any>;
      errorParam = error;
    }

    const entry = this.createLogEntry('error', message, context, errorParam);
    this.addLog(entry);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (!level) return [...this.logs];
    return this.logs.filter(log => log.level === level);
  }

  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
