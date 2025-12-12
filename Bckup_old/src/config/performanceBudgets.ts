/**
 * Performance Budgets - Sprint 0: Performance Monitoring
 *
 * Purpose: Define and enforce performance SLOs
 * - API response time budgets
 * - Screen load time budgets
 * - List rendering budgets
 * - Export/job time budgets
 *
 * Usage:
 * ```typescript
 * const result = await monitorAPICall(
 *   () => supabase.from('users').select('*'),
 *   'users_list',
 *   'read'
 * );
 * ```
 *
 * Integration:
 * - Sentry: Automatic alerts on budget violations
 * - Console: Warnings in development
 * - Analytics: Track performance trends
 */

import { captureMessage, addBreadcrumb } from './sentry';

// ============================================================================
// BUDGET DEFINITIONS
// ============================================================================

export const PERFORMANCE_BUDGETS = {
  /**
   * API Response Times (p95)
   * Based on Sprint 0 SLO requirements
   */
  api: {
    read: 300, // ms - SELECT queries
    write: 500, // ms - INSERT/UPDATE/DELETE via RPC
    list: 400, // ms - List queries with pagination
    aggregate: 800, // ms - Complex aggregations/reports
  },

  /**
   * Screen Load Times
   * From user interaction to first meaningful paint
   */
  screen: {
    firstContent: 1000, // ms - Time to first content visible
    interactive: 2000, // ms - Time to interactive (buttons work)
    fullyLoaded: 3000, // ms - Time to all data loaded
  },

  /**
   * List Performance
   * For FlatList/ScrollView rendering
   */
  list: {
    itemsPerPage: 20, // Default page size
    maxItemsBeforeFilter: 1000, // Show "add filters" prompt
    renderBudget: 16, // ms per item (60fps = 16.67ms)
    initialLoadBudget: 500, // ms for first page
  },

  /**
   * Export/Job Performance
   * For long-running tasks
   */
  export: {
    small: 5000, // < 1k rows - 5 seconds
    medium: 30000, // < 10k rows - 30 seconds
    large: 180000, // < 100k rows - 3 minutes
    xlarge: 600000, // < 1M rows - 10 minutes
  },

  /**
   * RPC Performance
   * For secure-write-rpc calls
   */
  rpc: {
    suspend_user: 500,
    delete_user: 500,
    assign_ticket: 300,
    resolve_ticket: 300,
    record_payment: 800,
    update_setting: 300,
  },

  /**
   * Database Query Limits
   * Prevent accidental full table scans
   */
  query: {
    maxRowsWithoutPagination: 100,
    maxRowsPerPage: 50,
    defaultPageSize: 20,
  },
} as const;

// ============================================================================
// BUDGET CHECKING
// ============================================================================

interface BudgetCheckResult {
  pass: boolean;
  actual: number;
  budget: number;
  violation?: string;
  severity?: 'warning' | 'error' | 'critical';
}

/**
 * Check if a metric exceeds its budget
 */
export function checkBudget(
  metric: string,
  actual: number,
  budget: number
): BudgetCheckResult {
  const pass = actual <= budget;

  if (!pass) {
    const overBy = actual - budget;
    const percentOver = ((overBy / budget) * 100).toFixed(1);

    // Determine severity
    let severity: 'warning' | 'error' | 'critical';
    if (actual > budget * 2) {
      severity = 'critical'; // 200%+ over budget
    } else if (actual > budget * 1.5) {
      severity = 'error'; // 150%+ over budget
    } else {
      severity = 'warning'; // Over budget but < 150%
    }

    return {
      pass: false,
      actual,
      budget,
      violation: `${metric} exceeded budget by ${overBy}ms (${percentOver}% over). Actual: ${actual}ms, Budget: ${budget}ms`,
      severity,
    };
  }

  return { pass: true, actual, budget };
}

// ============================================================================
// API MONITORING
// ============================================================================

/**
 * Monitor an API call and check against budget
 */
export async function monitorAPICall<T>(
  fn: () => Promise<T>,
  endpoint: string,
  type: keyof typeof PERFORMANCE_BUDGETS.api
): Promise<T> {
  const start = performance.now();
  const budget = PERFORMANCE_BUDGETS.api[type];

  try {
    const result = await fn();
    const duration = performance.now() - start;

    const check = checkBudget(`API ${type}: ${endpoint}`, duration, budget);

    if (!check.pass) {
      // Log to console in development
      if (__DEV__) {
        console.warn(`⚠️ [Performance] ${check.violation}`);
      }

      // Send to Sentry (will be sampled in production)
      captureMessage(check.violation!, check.severity!, {
        endpoint,
        type,
        duration,
        budget,
      });

      // Add breadcrumb for debugging
      addBreadcrumb(
        check.violation!,
        'performance',
        { endpoint, type, duration, budget },
        check.severity!
      );
    } else if (__DEV__) {
      console.log(`✅ [Performance] ${endpoint} completed in ${duration.toFixed(0)}ms (budget: ${budget}ms)`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ [Performance] ${endpoint} failed after ${duration.toFixed(0)}ms`, error);
    throw error;
  }
}

// ============================================================================
// SCREEN MONITORING
// ============================================================================

/**
 * Monitor screen load performance
 */
export function monitorScreenLoad(
  screenName: string,
  phase: keyof typeof PERFORMANCE_BUDGETS.screen,
  duration: number
) {
  const budget = PERFORMANCE_BUDGETS.screen[phase];
  const check = checkBudget(`Screen ${phase}: ${screenName}`, duration, budget);

  if (!check.pass) {
    if (__DEV__) {
      console.warn(`⚠️ [Performance] ${check.violation}`);
    }

    captureMessage(check.violation!, check.severity!, {
      screenName,
      phase,
      duration,
      budget,
    });
  } else if (__DEV__) {
    console.log(`✅ [Performance] ${screenName} ${phase} in ${duration.toFixed(0)}ms`);
  }
}

// ============================================================================
// RPC MONITORING
// ============================================================================

/**
 * Monitor RPC call performance
 */
export async function monitorRPC<T>(
  action: keyof typeof PERFORMANCE_BUDGETS.rpc,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const budget = PERFORMANCE_BUDGETS.rpc[action];

  try {
    const result = await fn();
    const duration = performance.now() - start;

    const check = checkBudget(`RPC ${action}`, duration, budget);

    if (!check.pass) {
      if (__DEV__) {
        console.warn(`⚠️ [Performance] ${check.violation}`);
      }

      captureMessage(check.violation!, check.severity!, {
        action,
        duration,
        budget,
      });
    }

    return result;
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// LIST RENDERING MONITORING
// ============================================================================

/**
 * Check if list size exceeds recommendations
 */
export function checkListSize(listName: string, itemCount: number) {
  const { maxItemsBeforeFilter } = PERFORMANCE_BUDGETS.list;

  if (itemCount > maxItemsBeforeFilter) {
    const message = `List "${listName}" has ${itemCount} items (> ${maxItemsBeforeFilter}). Consider adding filters or pagination.`;

    if (__DEV__) {
      console.warn(`⚠️ [Performance] ${message}`);
    }

    return {
      shouldShowFilterPrompt: true,
      message,
    };
  }

  return {
    shouldShowFilterPrompt: false,
  };
}

/**
 * Monitor FlatList render time
 */
export function monitorListRender(
  listName: string,
  itemCount: number,
  renderTime: number
) {
  const { renderBudget } = PERFORMANCE_BUDGETS.list;
  const avgRenderTime = renderTime / itemCount;

  if (avgRenderTime > renderBudget) {
    const message = `List "${listName}" renders ${avgRenderTime.toFixed(1)}ms per item (budget: ${renderBudget}ms). Consider using React.memo or optimizing components.`;

    if (__DEV__) {
      console.warn(`⚠️ [Performance] ${message}`);
    }

    addBreadcrumb(message, 'performance', {
      listName,
      itemCount,
      avgRenderTime,
      renderBudget,
    }, 'warning');
  }
}

// ============================================================================
// EXPORT/JOB MONITORING
// ============================================================================

/**
 * Get export budget based on row count
 */
export function getExportBudget(rowCount: number): number {
  if (rowCount < 1000) return PERFORMANCE_BUDGETS.export.small;
  if (rowCount < 10000) return PERFORMANCE_BUDGETS.export.medium;
  if (rowCount < 100000) return PERFORMANCE_BUDGETS.export.large;
  return PERFORMANCE_BUDGETS.export.xlarge;
}

/**
 * Monitor export/job performance
 */
export async function monitorExport<T>(
  jobName: string,
  rowCount: number,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const budget = getExportBudget(rowCount);

  try {
    const result = await fn();
    const duration = performance.now() - start;

    const check = checkBudget(`Export ${jobName}`, duration, budget);

    if (!check.pass) {
      if (__DEV__) {
        console.warn(`⚠️ [Performance] ${check.violation}`);
      }

      captureMessage(check.violation!, check.severity!, {
        jobName,
        rowCount,
        duration,
        budget,
      });
    } else if (__DEV__) {
      console.log(`✅ [Performance] Export ${jobName} completed in ${(duration / 1000).toFixed(1)}s`);
    }

    return result;
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// BUDGET VIOLATION HANDLING
// ============================================================================

/**
 * Track budget violations over time
 */
const violations = new Map<string, number>();

export function trackViolation(metric: string) {
  const count = violations.get(metric) || 0;
  violations.set(metric, count + 1);

  // Alert if same metric violates repeatedly
  if (count >= 5) {
    captureMessage(
      `Repeated performance violation: ${metric} has exceeded budget ${count + 1} times`,
      'error',
      { metric, violationCount: count + 1 }
    );
  }
}

/**
 * Get violation report
 */
export function getViolationReport(): Record<string, number> {
  return Object.fromEntries(violations);
}

/**
 * Clear violation tracking
 */
export function clearViolations() {
  violations.clear();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  budgets: PERFORMANCE_BUDGETS,
  checkBudget,
  monitorAPICall,
  monitorScreenLoad,
  monitorRPC,
  checkListSize,
  monitorListRender,
  monitorExport,
  getExportBudget,
  trackViolation,
  getViolationReport,
  clearViolations,
};

/**
 * USAGE EXAMPLES:
 *
 * 1. Monitor API call:
 * ```typescript
 * const users = await monitorAPICall(
 *   () => supabase.from('users').select('*'),
 *   'users_list',
 *   'read'
 * );
 * ```
 *
 * 2. Monitor screen load:
 * ```typescript
 * const startTime = Date.now();
 * // ... load data ...
 * monitorScreenLoad('Dashboard', 'firstContent', Date.now() - startTime);
 * ```
 *
 * 3. Monitor RPC:
 * ```typescript
 * const result = await monitorRPC('suspend_user', () =>
 *   suspendUser(userId, reason)
 * );
 * ```
 *
 * 4. Check list size:
 * ```typescript
 * const { shouldShowFilterPrompt } = checkListSize('Users', users.length);
 * if (shouldShowFilterPrompt) {
 *   // Show "Add filters" prompt
 * }
 * ```
 *
 * 5. Monitor export:
 * ```typescript
 * const csv = await monitorExport('payments_report', 5000, () =>
 *   generatePaymentsCSV()
 * );
 * ```
 */
