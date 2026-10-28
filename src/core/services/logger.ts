
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export class LoggerService {
  private sessionCorrelationId: string;

  constructor() {
    this.sessionCorrelationId = crypto.randomUUID();
  }

  private format(level: LogLevel, message: string, context?: any): any[] {
    return [
      `%c[${new Date().toISOString()}] [${level}] [${this.sessionCorrelationId}]`,
      this.getStyle(level),
      message,
      context || ''
    ];
  }

  private getStyle(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return 'color: gray;';
      case LogLevel.INFO: return 'color: blue;';
      case LogLevel.WARN: return 'color: orange;';
      case LogLevel.ERROR: return 'color: red; font-weight: bold;';
      default: return '';
    }
  }

  debug(message: string, context?: any) { console.debug(...this.format(LogLevel.DEBUG, message, context)); }
  info(message: string, context?: any) { console.info(...this.format(LogLevel.INFO, message, context)); }
  warn(message: string, context?: any) { console.warn(...this.format(LogLevel.WARN, message, context)); }
  error(message: string, context?: any) { console.error(...this.format(LogLevel.ERROR, message, context)); }
}

export const Logger = new LoggerService();
