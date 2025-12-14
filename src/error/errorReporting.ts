/**
 * Error Reporting Utilities
 * Per ERROR_HANDLING_SPEC.md and WIDGET_FAILSAFE_SPEC.md
 * 
 * Provides error reporting and breadcrumb tracking for debugging.
 * Ready for Sentry integration.
 */

type BreadcrumbLevel = "debug" | "info" | "warning" | "error" | "fatal";

type Breadcrumb = {
  category: string;
  message: string;
  level: BreadcrumbLevel;
  data?: Record<string, unknown>;
  timestamp?: number;
};

type ErrorContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: {
    id?: string;
    email?: string;
    role?: string;
  };
};

// Store breadcrumbs in memory (Sentry will handle this when integrated)
const breadcrumbs: Breadcrumb[] = [];
const MAX_BREADCRUMBS = 100;

/**
 * Add a breadcrumb for debugging
 * Breadcrumbs help trace the user's path before an error occurred
 */
export const addBreadcrumb = (breadcrumb: Breadcrumb) => {
  const crumb = {
    ...breadcrumb,
    timestamp: breadcrumb.timestamp || Date.now(),
  };

  breadcrumbs.push(crumb);

  // Keep only last N breadcrumbs
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }

  // Log in development
  if (__DEV__) {
    const levelColors: Record<BreadcrumbLevel, string> = {
      debug: "\x1b[90m",
      info: "\x1b[36m",
      warning: "\x1b[33m",
      error: "\x1b[31m",
      fatal: "\x1b[35m",
    };
    const color = levelColors[breadcrumb.level] || "\x1b[0m";
    console.log(
      `${color}[Breadcrumb] ${breadcrumb.category}: ${breadcrumb.message}\x1b[0m`,
      breadcrumb.data || ""
    );
  }

  // TODO: When Sentry is integrated:
  // Sentry.addBreadcrumb({
  //   category: breadcrumb.category,
  //   message: breadcrumb.message,
  //   level: breadcrumb.level,
  //   data: breadcrumb.data,
  // });
};

/**
 * Capture an exception and send to error tracking service
 */
export const captureException = (error: Error, context?: ErrorContext) => {
  // Log in development
  if (__DEV__) {
    console.error("[Error Captured]", error.message, {
      stack: error.stack,
      ...context,
    });
  }

  // TODO: When Sentry is integrated:
  // Sentry.captureException(error, {
  //   tags: context?.tags,
  //   extra: context?.extra,
  //   user: context?.user,
  // });
};

/**
 * Capture a message (non-error event)
 */
export const captureMessage = (
  message: string,
  level: BreadcrumbLevel = "info",
  context?: ErrorContext
) => {
  if (__DEV__) {
    console.log(`[Message] ${level}: ${message}`, context);
  }

  // TODO: When Sentry is integrated:
  // Sentry.captureMessage(message, level);
};

/**
 * Set user context for error tracking
 */
export const setUser = (user: { id: string; email?: string; role?: string } | null) => {
  if (__DEV__) {
    console.log("[Error Reporting] User set:", user);
  }

  // TODO: When Sentry is integrated:
  // Sentry.setUser(user);
};

/**
 * Set custom tags for error tracking
 */
export const setTags = (tags: Record<string, string>) => {
  if (__DEV__) {
    console.log("[Error Reporting] Tags set:", tags);
  }

  // TODO: When Sentry is integrated:
  // Object.entries(tags).forEach(([key, value]) => {
  //   Sentry.setTag(key, value);
  // });
};

/**
 * Get all breadcrumbs (for debugging)
 */
export const getBreadcrumbs = () => [...breadcrumbs];

/**
 * Clear all breadcrumbs
 */
export const clearBreadcrumbs = () => {
  breadcrumbs.length = 0;
};

/**
 * Widget-specific error reporting helper
 */
export const reportWidgetError = (
  widgetId: string,
  error: Error,
  context?: {
    screenId?: string;
    customerId?: string;
    userId?: string;
    config?: Record<string, unknown>;
  }
) => {
  addBreadcrumb({
    category: "widget",
    message: `widget_error: ${widgetId}`,
    level: "error",
    data: { widgetId, errorMessage: error.message, ...context },
  });

  captureException(error, {
    tags: {
      widget: widgetId,
      screen: context?.screenId || "unknown",
    },
    extra: {
      widgetId,
      ...context,
    },
  });
};

export default {
  addBreadcrumb,
  captureException,
  captureMessage,
  setUser,
  setTags,
  getBreadcrumbs,
  clearBreadcrumbs,
  reportWidgetError,
};
