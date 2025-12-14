/**
 * Sentry Configuration - Sprint 0: Observability
 *
 * Purpose: Error tracking and performance monitoring
 * - Capture errors with correlation IDs
 * - Track performance metrics
 * - Monitor API calls
 * - Alert on production issues
 *
 * Setup Instructions:
 * 1. Install: npm install @sentry/react-native
 * 2. Run wizard: npx @sentry/wizard -i reactNative -p android,ios
 * 3. Add SENTRY_DSN to .env file
 * 4. Import and call initSentry() in App.tsx
 *
 * Integration Points:
 * - useSecureRPC: Automatically tags errors with correlation IDs
 * - Navigation: Track screen views
 * - API calls: Monitor performance
 */

import * as Sentry from '@sentry/react-native';

// Global correlation ID for request tracing
declare global {
  var correlationId: string | undefined;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SENTRY_CONFIG = {
  // Required: Get from Sentry dashboard
  dsn: process.env.SENTRY_DSN || '',

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release versioning (set during build)
  release: process.env.SENTRY_RELEASE,

  // Performance monitoring
  tracesSampleRate: __DEV__ ? 0.1 : 1.0, // 10% in dev, 100% in prod

  // Enable debug logging in dev
  debug: __DEV__,

  // Attach stacktraces to messages
  attachStacktrace: true,

  // Enable native crash reporting
  enableNative: true,

  // Auto session tracking
  enableAutoSessionTracking: true,

  // Session tracking interval (30 seconds)
  sessionTrackingIntervalMillis: 30000,
};

// ============================================================================
// INITIALIZATION
// ============================================================================

export function initSentry() {
  if (!SENTRY_CONFIG.dsn) {
    console.warn('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    ...SENTRY_CONFIG,

    // Before send hook - enrich events
    beforeSend(event, hint) {
      // Add correlation ID if available
      const correlationId = global.correlationId || generateCorrelationId();

      event.tags = {
        ...event.tags,
        correlationId,
      };

      event.contexts = {
        ...event.contexts,
        correlation: {
          id: correlationId,
        },
      };

      // In development, log errors to console
      if (__DEV__) {
        console.error('[Sentry] Captured error:', event);
        console.error('[Sentry] Original error:', hint.originalException);
      }

      return event;
    },

    // Integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        // Enable automatic performance monitoring
        tracingOrigins: ['localhost', /^\//],

        // Track navigation
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
      }),
    ],
  });

  console.log('[Sentry] Initialized successfully');
}

// ============================================================================
// ERROR CAPTURE
// ============================================================================

/**
 * Capture an exception with additional context
 */
export function captureException(
  error: Error,
  context?: Record<string, any>,
  level: Sentry.SeverityLevel = 'error'
) {
  const correlationId = global.correlationId || generateCorrelationId();

  Sentry.captureException(error, {
    level,
    extra: context,
    tags: {
      correlationId,
      ...context?.tags,
    },
  });

  console.error(`[Sentry] Captured exception [${correlationId}]:`, error.message);

  if (context) {
    console.error('[Sentry] Context:', context);
  }
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) {
  const correlationId = global.correlationId || generateCorrelationId();

  Sentry.captureMessage(message, {
    level,
    extra: context,
    tags: {
      correlationId,
      ...context?.tags,
    },
  });

  console.log(`[Sentry] Captured message [${correlationId}]:`, message);
}

// ============================================================================
// USER CONTEXT
// ============================================================================

/**
 * Set user context for error tracking
 */
export function setSentryUser(userId: string, email?: string, role?: string) {
  Sentry.setUser({
    id: userId,
    email,
    role,
  });

  console.log('[Sentry] User context set:', userId);
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
  console.log('[Sentry] User context cleared');
}

// ============================================================================
// CORRELATION ID MANAGEMENT
// ============================================================================

/**
 * Generate a new correlation ID
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Set correlation ID for current request/action
 */
export function setCorrelationId(id: string) {
  global.correlationId = id;

  Sentry.setTag('correlationId', id);
  Sentry.setContext('correlation', {
    id,
    timestamp: new Date().toISOString(),
  });

  console.log('[Sentry] Correlation ID set:', id);
}

/**
 * Clear correlation ID (after request completes)
 */
export function clearCorrelationId() {
  global.correlationId = undefined;
  console.log('[Sentry] Correlation ID cleared');
}

/**
 * Get current correlation ID
 */
export function getCorrelationId(): string {
  return global.correlationId || generateCorrelationId();
}

// ============================================================================
// BREADCRUMBS
// ============================================================================

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data: {
      ...data,
      correlationId: getCorrelationId(),
    },
    level,
  });
}

/**
 * Track navigation breadcrumb
 */
export function trackNavigation(screenName: string, params?: any) {
  addBreadcrumb(`Navigate to ${screenName}`, 'navigation', { params }, 'info');
}

/**
 * Track API call breadcrumb
 */
export function trackAPICall(
  method: string,
  endpoint: string,
  status: number,
  duration: number
) {
  addBreadcrumb(
    `${method} ${endpoint} - ${status}`,
    'api',
    {
      method,
      endpoint,
      status,
      duration,
    },
    status >= 400 ? 'error' : 'info'
  );
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  const transaction = Sentry.startTransaction({
    name,
    op,
    tags: {
      correlationId: getCorrelationId(),
    },
  });

  return transaction;
}

/**
 * Measure async operation performance
 */
export async function measurePerformance<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const transaction = startTransaction(name, 'function');

  try {
    const result = await operation();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('unknown_error');
    throw error;
  } finally {
    transaction.finish();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  init: initSentry,
  captureException,
  captureMessage,
  setSentryUser,
  clearSentryUser,
  setCorrelationId,
  clearCorrelationId,
  getCorrelationId,
  generateCorrelationId,
  addBreadcrumb,
  trackNavigation,
  trackAPICall,
  startTransaction,
  measurePerformance,
};

/**
 * USAGE EXAMPLES:
 *
 * 1. Initialize in App.tsx:
 * ```typescript
 * import { initSentry } from './config/sentry';
 * initSentry();
 * ```
 *
 * 2. Capture errors:
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureException(error, { operation: 'riskyOperation', userId });
 * }
 * ```
 *
 * 3. Track with correlation ID:
 * ```typescript
 * const correlationId = generateCorrelationId();
 * setCorrelationId(correlationId);
 * try {
 *   await apiCall();
 * } finally {
 *   clearCorrelationId();
 * }
 * ```
 *
 * 4. Set user context:
 * ```typescript
 * setSentryUser(user.id, user.email, user.role);
 * ```
 *
 * 5. Track performance:
 * ```typescript
 * const result = await measurePerformance('fetchUsers', async () => {
 *   return await supabase.from('users').select('*');
 * });
 * ```
 */
