/**
 * Logger Utility
 * Provides structured logging with different log levels and context tracking
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private minLevel: LogLevel;
  private enableColors: boolean;

  constructor() {
    // Set minimum log level from environment or default to INFO
    const envLevel = process.env.LOG_LEVEL?.toUpperCase() as LogLevel;
    this.minLevel = envLevel || LogLevel.INFO;
    this.enableColors = process.env.NODE_ENV !== 'production';
  }

  /**
   * Check if a log level should be logged based on minimum level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.minLevel);
    return currentLevelIndex >= minLevelIndex;
  }

  /**
   * Get color code for log level
   */
  private getColorCode(level: LogLevel): string {
    if (!this.enableColors) return '';
    
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    };
    return colors[level] || '';
  }

  /**
   * Get emoji for log level
   */
  private getEmoji(level: LogLevel): string {
    const emojis = {
      [LogLevel.DEBUG]: '🔍',
      [LogLevel.INFO]: 'ℹ️ ',
      [LogLevel.WARN]: '⚠️ ',
      [LogLevel.ERROR]: '❌',
    };
    return emojis[level] || '';
  }

  /**
   * Format log entry for console output
   */
  private formatConsoleOutput(entry: LogEntry): string {
    const colorCode = this.getColorCode(entry.level);
    const resetCode = this.enableColors ? '\x1b[0m' : '';
    const emoji = this.getEmoji(entry.level);
    
    let output = `${colorCode}${emoji} [${entry.timestamp}] ${entry.level}${resetCode}: ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      output += `\n   Context: ${JSON.stringify(entry.context, null, 2)}`;
    }
    
    if (entry.error) {
      output += `\n   Error: ${entry.error.name} - ${entry.error.message}`;
      if (entry.error.stack && this.minLevel === LogLevel.DEBUG) {
        output += `\n   Stack: ${entry.error.stack}`;
      }
    }
    
    return output;
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  /**
   * Write log to console
   */
  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const output = this.formatConsoleOutput(entry);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.DEBUG:
      case LogLevel.INFO:
      default:
        console.log(output);
        break;
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.writeLog(entry);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.writeLog(entry);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.writeLog(entry);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.writeLog(entry);
  }

  /**
   * Log contract interaction start
   */
  contractStart(method: string, params: LogContext): void {
    this.info(`Contract call started: ${method}`, params);
  }

  /**
   * Log contract interaction success
   */
  contractSuccess(method: string, result: LogContext): void {
    this.info(`Contract call succeeded: ${method}`, result);
  }

  /**
   * Log contract interaction failure
   */
  contractError(method: string, error: Error, params?: LogContext): void {
    this.error(`Contract call failed: ${method}`, error, params);
  }

  /**
   * Log HTTP request
   */
  httpRequest(method: string, path: string, context?: LogContext): void {
    this.info(`HTTP ${method} ${path}`, context);
  }

  /**
   * Log HTTP response
   */
  httpResponse(method: string, path: string, statusCode: number, duration: number): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const entry = this.createLogEntry(
      level,
      `HTTP ${method} ${path} - ${statusCode}`,
      { statusCode, duration: `${duration}ms` }
    );
    this.writeLog(entry);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default
export default logger;
