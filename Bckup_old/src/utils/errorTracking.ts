/**
 * Error Tracking & Monitoring - Sprint 0: Observability
 *
 * Purpose: Centralized error tracking with Sentry
 * - Track errors with context
 * - Correlation IDs for distributed tracing
 * - Error taxonomy for categorization
 * - User context for debugging
 * - Performance monitoring
 *
 * Usage:
 * ```typescript
 * import { trackError, generateCorrelationId } from '@/utils/errorTracking';
 *
 * try {
 *   const correlationId = generateCorrelationId();
 *   await someOperation();
 * } catch (error) {
 *   trackError(error, { correlationId, operation: 'someOperation' });
 * }
 * ```
 */

// NOTE: Uncomment and install when ready to use Sentry
// import * as Sentry from '@sentry/react-native';

/**
 * Error Type Taxonomy
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  PERMISSION = 'PERMISSION',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  RATE_LIMIT = 'RATE_LIMIT',
  AUTHENTICATION = 'AUTHENTICATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error Severity Levels
 */
export enum ErrorSeverity {
  FATAL = 'fatal',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Application Error Class
 */
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public correlationId: string,
    public severity: ErrorSeverity = ErrorSeverity.ERROR,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      correlationId: this.correlationId,
      severity: this.severity,
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}

/**
 * Generate a unique correlation ID for request tracing
 */
let currentCorrelationId: string | null = null;

export function generateCorrelationId(): string {
  // Use crypto.randomUUID if available (modern environments)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    currentCorrelationId = crypto.randomUUID();
  } else {
    // Fallback: generate UUID v4
    currentCorrelationId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  return currentCorrelationId;
}

export function getCorrelationId(): string {
  return currentCorrelationId || generateCorrelationId();
}

export function clearCorrelationId(): void {
  currentCorrelationId = null;
}

/**
 * Initialize error tracking (call once at app startup)
 */
export function initializeErrorTracking() {
  if (__DEV__) {
    console.log('🔍 [ErrorTracking] Initializing in development mode');
    // In development, just log to console
    return;
  }

  // TODO: Uncomment when Sentry is installed and configured
  /*
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN_HERE',
    environment: __DEV__ ? 'development' : 'production',

    // Performance Monitoring
    tracesSampleRate: 0.2, // 20% of transactions

    // Session Replay (for debugging)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of errors

    // Release tracking
    release: 'com.packagecheck.dev@' + APP_VERSION,
    dist: BUILD_NUMBER,

    // Integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
      }),
    ],

    // Before send hook (scrub sensitive data)
    beforeSend(event, hint) {
      // Remove sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      if (event.request?.headers?.['Authorization']) {
        event.request.headers['Authorization'] = '[Filtered]';
      }

      // Add correlation ID if available
      if (currentCorrelationId) {
        event.tags = {
          ...event.tags,
          correlation_id: currentCorrelationId,
        };
      }

      return event;
    },
  });
  */

  console.log('✅ [ErrorTracking] Initialized (Sentry disabled in development)');
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, role: string, email?: string) {
  if (__DEV__) {
    console.log('🔍 [ErrorTracking] User context:', { userId, role, email });
    return;
  }

  // TODO: Uncomment when Sentry is installed
  /*
  Sentry.setUser({
    id: userId,
    role,
    email,
  });
  */
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  if (__DEV__) {
    console.log('🔍 [ErrorTracking] Clearing user context');
    return;
  }

  // TODO: Uncomment when Sentry is installed
  // Sentry.setUser(null);
}

/**
 * Track an error with context
 */
export function trackError(
  error: Error | AppError | unknown,
  context?: Record<string, any>
) {
  // Ensure we have a correlation ID
  const correlationId = context?.correlationId || getCorrelationId();

  // Determine error type and severity
  let errorType = ErrorType.UNKNOWN;
  let severity = ErrorSeverity.ERROR;

  if (error instanceof AppError) {
    errorType = error.type;
    severity = error.severity;
  } else if (error instanceof Error) {
    // Infer error type from error message/name
    errorType = inferErrorType(error);
  }

  // Log to console in development
  if (__DEV__) {
    console.error('❌ [ErrorTracking]', {
      type: errorType,
      severity,
      correlationId,
      error,
      context,
    });
    return;
  }

  // TODO: Uncomment when Sentry is installed
  /*
  Sentry.captureException(error, {
    level: severity,
    tags: {
      error_type: errorType,
      correlation_id: correlationId,
    },
    extra: {
      ...context,
      timestamp: new Date().toISOString(),
    },
  });
  */
}

/**
 * Track a custom message/warning
 */
export function trackMessage(
  message: string,
  severity: ErrorSeverity = ErrorSeverity.INFO,
  context?: Record<string, any>
) {
  const correlationId = context?.correlationId || getCorrelationId();

  if (__DEV__) {
    console.log(`[ErrorTracking] ${severity.toUpperCase()}:`, message, context);
    return;
  }

  // TODO: Uncomment when Sentry is installed
  /*
  Sentry.captureMessage(message, {
    level: severity,
    tags: {
      correlation_id: correlationId,
    },
    extra: context,
  });
  */
}

/**
 * Add breadcrumb for debugging trail
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: ErrorSeverity = ErrorSeverity.INFO,
  data?: Record<string, any>
) {
  if (__DEV__) {
    console.log(`🍞 [Breadcrumb] ${category}:`, message, data);
    return;
  }

  // TODO: Uncomment when Sentry is installed
  /*
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
  */
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, operation: string) {
  if (__DEV__) {
    const startTime = Date.now();
    return {
      finish: () => {
        const duration = Date.now() - startTime;
        console.log(`⏱️ [Performance] ${name} took ${duration}ms`);
      },
    };
  }

  // TODO: Uncomment when Sentry is installed
  /*
  const transaction = Sentry.startTransaction({
    name,
    op: operation,
  });

  return transaction;
  */

  return {
    finish: () => {},
  };
}

/**
 * Helper: Infer error type from Error object
 */
function inferErrorType(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (message.includes('network') || message.includes('fetch failed')) {
    return ErrorType.NETWORK;
  }

  if (
    message.includes('permission') ||
    message.includes('unauthorized') ||
    message.includes('forbidden')
  ) {
    return ErrorType.PERMISSION;
  }

  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorType.VALIDATION;
  }

  if (message.includes('database') || message.includes('query')) {
    return ErrorType.DATABASE;
  }

  if (message.includes('rate limit') || message.includes('too many requests')) {
    return ErrorType.RATE_LIMIT;
  }

  if (message.includes('not found') || name.includes('notfound')) {
    return ErrorType.NOT_FOUND;
  }

  if (message.includes('conflict') || message.includes('already exists')) {
    return ErrorType.CONFLICT;
  }

  if (
    message.includes('auth') ||
    message.includes('token') ||
    message.includes('session')
  ) {
    return ErrorType.AUTHENTICATION;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Error boundary helper
 */
export function logErrorBoundary(error: Error, errorInfo: { componentStack: string }) {
  trackError(error, {
    errorBoundary: true,
    componentStack: errorInfo.componentStack,
  });
}
