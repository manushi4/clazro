/**
 * Error Logger Utility
 * Comprehensive error logging system to help debug issues and prevent loops
 */

export interface ErrorLog {
  timestamp: string;
  errorType: 'AUTH' | 'DATABASE' | 'NETWORK' | 'VALIDATION' | 'UI' | 'UNKNOWN';
  location: string; // File/Component name
  operation: string; // Function/Operation being performed
  message: string;
  details: any;
  stack?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory

  /**
   * Log an error with full context
   */
  log(error: Partial<ErrorLog> & { message: string; location: string; operation: string }) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      errorType: error.errorType || 'UNKNOWN',
      location: error.location,
      operation: error.operation,
      message: error.message,
      details: error.details || {},
      stack: error.stack,
      userId: error.userId,
      metadata: error.metadata,
    };

    // Add to in-memory logs
    this.logs.push(errorLog);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console log with formatting
    this.consoleLog(errorLog);
  }

  /**
   * Log authentication errors
   */
  logAuth(operation: string, error: any, context?: Record<string, any>) {
    this.log({
      errorType: 'AUTH',
      location: 'AuthContext/AuthService',
      operation,
      message: error?.message || String(error),
      details: {
        error,
        context,
        errorCode: error?.code,
        errorStatus: error?.status,
      },
      stack: error?.stack,
    });
  }

  /**
   * Log database errors
   */
  logDatabase(location: string, operation: string, error: any, query?: string) {
    this.log({
      errorType: 'DATABASE',
      location,
      operation,
      message: error?.message || String(error),
      details: {
        error,
        query,
        errorCode: error?.code,
        hint: error?.hint,
        detail: error?.detail,
      },
      stack: error?.stack,
    });
  }

  /**
   * Log network errors
   */
  logNetwork(location: string, operation: string, error: any, request?: any) {
    this.log({
      errorType: 'NETWORK',
      location,
      operation,
      message: error?.message || String(error),
      details: {
        error,
        request,
        status: error?.status,
        statusText: error?.statusText,
      },
      stack: error?.stack,
    });
  }

  /**
   * Log validation errors
   */
  logValidation(location: string, field: string, error: string, value?: any) {
    this.log({
      errorType: 'VALIDATION',
      location,
      operation: `Validate ${field}`,
      message: error,
      details: {
        field,
        value,
      },
    });
  }

  /**
   * Log UI errors
   */
  logUI(location: string, operation: string, error: any) {
    this.log({
      errorType: 'UI',
      location,
      operation,
      message: error?.message || String(error),
      details: {
        error,
      },
      stack: error?.stack,
    });
  }

  /**
   * Get all logs
   */
  getAllLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * Get logs by type
   */
  getLogsByType(type: ErrorLog['errorType']): ErrorLog[] {
    return this.logs.filter(log => log.errorType === type);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 10): ErrorLog[] {
    return this.logs.slice(-count);
  }

  /**
   * Search logs
   */
  searchLogs(query: string): ErrorLog[] {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(log =>
      log.message.toLowerCase().includes(lowerQuery) ||
      log.location.toLowerCase().includes(lowerQuery) ||
      log.operation.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    console.log('🗑️ [ErrorLogger] All logs cleared');
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Print formatted error summary
   */
  printSummary() {
    console.log('\n==================== ERROR LOG SUMMARY ====================');
    console.log(`Total Errors: ${this.logs.length}`);

    const byType = this.logs.reduce((acc, log) => {
      acc[log.errorType] = (acc[log.errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nErrors by Type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log('\nRecent Errors (Last 5):');
    this.getRecentLogs(5).forEach((log, index) => {
      console.log(`\n${index + 1}. [${log.errorType}] ${log.location} - ${log.operation}`);
      console.log(`   Message: ${log.message}`);
      console.log(`   Time: ${log.timestamp}`);
    });
    console.log('\n============================================================\n');
  }

  /**
   * Console log with pretty formatting
   */
  private consoleLog(errorLog: ErrorLog) {
    const emoji = this.getErrorEmoji(errorLog.errorType);
    const timestamp = new Date(errorLog.timestamp).toLocaleTimeString();

    console.group(`${emoji} [${errorLog.errorType}] ${errorLog.location} - ${timestamp}`);
    console.log(`Operation: ${errorLog.operation}`);
    console.log(`Message: ${errorLog.message}`);

    if (errorLog.details && Object.keys(errorLog.details).length > 0) {
      console.log('Details:', errorLog.details);
    }

    if (errorLog.stack) {
      console.log('Stack:', errorLog.stack);
    }

    if (errorLog.metadata) {
      console.log('Metadata:', errorLog.metadata);
    }

    console.groupEnd();
  }

  /**
   * Get emoji for error type
   */
  private getErrorEmoji(type: ErrorLog['errorType']): string {
    const emojiMap = {
      AUTH: '🔐',
      DATABASE: '🗄️',
      NETWORK: '🌐',
      VALIDATION: '✅',
      UI: '🎨',
      UNKNOWN: '❓',
    };
    return emojiMap[type] || '❓';
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Export helper functions for easy use
export const logAuthError = (operation: string, error: any, context?: Record<string, any>) =>
  errorLogger.logAuth(operation, error, context);

export const logDatabaseError = (location: string, operation: string, error: any, query?: string) =>
  errorLogger.logDatabase(location, operation, error, query);

export const logNetworkError = (location: string, operation: string, error: any, request?: any) =>
  errorLogger.logNetwork(location, operation, error, request);

export const logValidationError = (location: string, field: string, error: string, value?: any) =>
  errorLogger.logValidation(location, field, error, value);

export const logUIError = (location: string, operation: string, error: any) =>
  errorLogger.logUI(location, operation, error);
