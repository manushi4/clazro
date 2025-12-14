/**
 * Audit Logs Data Contracts
 * Production-grade types and Zod schemas for security compliance
 * Following ADMIN_IMPLEMENTATION_STRATEGY.md
 */

import { z } from 'zod';

/**
 * Audit Action Types
 */
export type AuditAction =
  | 'suspend_user'
  | 'unsuspend_user'
  | 'delete_user'
  | 'reset_password'
  | 'change_role'
  | 'export_financial_report'
  | 'export_audit_logs'
  | 'create_branch'
  | 'update_branch'
  | 'delete_branch'
  | 'enable_maintenance'
  | 'disable_maintenance'
  | 'assign_ticket'
  | 'escalate_ticket'
  | 'resolve_ticket'
  | 'toggle_feature'
  | 'unlock_account'
  | 'update_rbac';

/**
 * Target Types for Audit Logs
 */
export type AuditTargetType =
  | 'user'
  | 'branch'
  | 'report'
  | 'ticket'
  | 'feature'
  | 'account'
  | 'rbac'
  | 'system';

/**
 * Audit Log Entry Interface
 */
export interface AuditLog {
  id: string;
  admin_id: string;
  admin_name?: string; // Joined from profiles
  action: AuditAction;
  target_id?: string;
  target_type?: AuditTargetType;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  created_at: string;
}

/**
 * Audit Log List Item (for table view)
 */
export interface AuditLogListItem {
  id: string;
  admin_id: string;
  admin_name: string;
  action: AuditAction;
  target_type?: AuditTargetType;
  timestamp: string;
  summary: string; // Human-readable summary
}

/**
 * Audit Log Filters
 */
export interface AuditLogFilters {
  action?: AuditAction;
  admin_id?: string;
  target_type?: AuditTargetType;
  start_date?: string;
  end_date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Audit Log Query Result
 */
export interface AuditLogQueryResult {
  logs: AuditLogListItem[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Zod Schemas for Validation
 */

export const AuditActionSchema = z.enum([
  'suspend_user',
  'unsuspend_user',
  'delete_user',
  'reset_password',
  'change_role',
  'export_financial_report',
  'export_audit_logs',
  'create_branch',
  'update_branch',
  'delete_branch',
  'enable_maintenance',
  'disable_maintenance',
  'assign_ticket',
  'escalate_ticket',
  'resolve_ticket',
  'toggle_feature',
  'unlock_account',
  'update_rbac',
]);

export const AuditTargetTypeSchema = z.enum([
  'user',
  'branch',
  'report',
  'ticket',
  'feature',
  'account',
  'rbac',
  'system',
]);

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  admin_id: z.string().uuid(),
  admin_name: z.string().optional(),
  action: AuditActionSchema,
  target_id: z.string().uuid().optional(),
  target_type: AuditTargetTypeSchema.optional(),
  changes: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  timestamp: z.string().datetime(),
  created_at: z.string().datetime(),
});

export const AuditLogListItemSchema = z.object({
  id: z.string().uuid(),
  admin_id: z.string().uuid(),
  admin_name: z.string(),
  action: AuditActionSchema,
  target_type: AuditTargetTypeSchema.optional(),
  timestamp: z.string().datetime(),
  summary: z.string(),
});

export const AuditLogFiltersSchema = z.object({
  action: AuditActionSchema.optional(),
  admin_id: z.string().uuid().optional(),
  target_type: AuditTargetTypeSchema.optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

/**
 * Query Keys (for React Query)
 */
export const auditQueryKeys = {
  all: ['audit_logs'] as const,
  list: (filters: AuditLogFilters) => [...auditQueryKeys.all, 'list', filters] as const,
  detail: (id: string) => [...auditQueryKeys.all, 'detail', id] as const,
  stats: () => [...auditQueryKeys.all, 'stats'] as const,
};

/**
 * Helper Functions
 */

/**
 * Get human-readable action label
 */
export function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    suspend_user: 'Suspended User',
    unsuspend_user: 'Unsuspended User',
    delete_user: 'Deleted User',
    reset_password: 'Reset Password',
    change_role: 'Changed User Role',
    export_financial_report: 'Exported Financial Reports',
    export_audit_logs: 'Exported Audit Logs',
    create_branch: 'Created Branch',
    update_branch: 'Updated Branch',
    delete_branch: 'Deleted Branch',
    enable_maintenance: 'Enabled Maintenance Mode',
    disable_maintenance: 'Disabled Maintenance Mode',
    assign_ticket: 'Assigned Support Ticket',
    escalate_ticket: 'Escalated Support Ticket',
    resolve_ticket: 'Resolved Support Ticket',
    toggle_feature: 'Toggled Feature Flag',
    unlock_account: 'Unlocked Account',
    update_rbac: 'Updated RBAC Permissions',
  };
  return labels[action] || action;
}

/**
 * Get action color for badge
 */
export function getActionColor(action: AuditAction): string {
  // Critical actions (red)
  if (['suspend_user', 'delete_user', 'delete_branch', 'enable_maintenance'].includes(action)) {
    return '#F44336';
  }

  // Warning actions (orange)
  if (['reset_password', 'change_role', 'escalate_ticket', 'toggle_feature'].includes(action)) {
    return '#FF9800';
  }

  // Success actions (green)
  if (['unsuspend_user', 'resolve_ticket', 'unlock_account'].includes(action)) {
    return '#4CAF50';
  }

  // Informational (blue)
  return '#2196F3';
}

/**
 * Get target type icon
 */
export function getTargetTypeIcon(targetType?: AuditTargetType): string {
  if (!targetType) return '📋';

  const icons: Record<AuditTargetType, string> = {
    user: '👤',
    branch: '🏫',
    report: '📊',
    ticket: '🎫',
    feature: '⚙️',
    account: '🔒',
    rbac: '🛡️',
    system: '⚡',
  };
  return icons[targetType] || '📋';
}

/**
 * Format timestamp for display
 */
export function formatAuditTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 hour ago
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}m ago`;
  }

  // Less than 24 hours ago
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}h ago`;
  }

  // Less than 7 days ago
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}d ago`;
  }

  // Format as date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Create audit log summary
 */
export function createAuditSummary(log: AuditLog): string {
  const adminName = log.admin_name || 'Admin';
  const actionLabel = getActionLabel(log.action);
  const timestamp = formatAuditTimestamp(log.timestamp);

  let summary = `${adminName} ${actionLabel.toLowerCase()}`;

  // Add target info if available
  if (log.changes?.full_name) {
    summary += ` "${log.changes.full_name}"`;
  } else if (log.changes?.name) {
    summary += ` "${log.changes.name}"`;
  } else if (log.metadata?.period) {
    summary += ` (${log.metadata.period})`;
  }

  summary += ` · ${timestamp}`;

  return summary;
}

/**
 * Export audit logs to CSV format
 */
export function exportAuditLogsToCSV(logs: AuditLog[]): string {
  const headers = [
    'Timestamp',
    'Admin',
    'Action',
    'Target Type',
    'IP Address',
    'Changes',
  ].join(',');

  const rows = logs.map((log) =>
    [
      log.timestamp,
      log.admin_name || log.admin_id,
      getActionLabel(log.action),
      log.target_type || '',
      log.ip_address || '',
      log.changes ? JSON.stringify(log.changes) : '',
    ]
      .map((field) => `"${field}"`)
      .join(',')
  );

  return [headers, ...rows].join('\n');
}
