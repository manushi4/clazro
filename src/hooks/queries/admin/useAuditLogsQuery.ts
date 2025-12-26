import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'view'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'settings_change';

export type AuditEntityType =
  | 'user'
  | 'student'
  | 'teacher'
  | 'parent'
  | 'class'
  | 'assignment'
  | 'content'
  | 'fee'
  | 'payment'
  | 'settings'
  | 'report';

export type AuditLog = {
  id: string;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  details: Record<string, unknown>;
  performed_by: string;
  performer_name?: string;
  performer_email?: string;
  performer_role?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
};

export type UseAuditLogsQueryOptions = {
  action?: AuditAction;
  entityType?: AuditEntityType;
  performedBy?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};

export const AUDIT_ACTION_CONFIG: Record<AuditAction, { icon: string; color: string; label: string }> = {
  create: { icon: 'plus-circle', color: 'success', label: 'Created' },
  update: { icon: 'pencil', color: 'warning', label: 'Updated' },
  delete: { icon: 'trash-can', color: 'error', label: 'Deleted' },
  login: { icon: 'login', color: 'primary', label: 'Logged In' },
  logout: { icon: 'logout', color: 'secondary', label: 'Logged Out' },
  view: { icon: 'eye', color: 'tertiary', label: 'Viewed' },
  export: { icon: 'download', color: 'primary', label: 'Exported' },
  import: { icon: 'upload', color: 'primary', label: 'Imported' },
  approve: { icon: 'check-circle', color: 'success', label: 'Approved' },
  reject: { icon: 'close-circle', color: 'error', label: 'Rejected' },
  settings_change: { icon: 'cog', color: 'warning', label: 'Settings Changed' },
};

export const AUDIT_ENTITY_CONFIG: Record<AuditEntityType, { icon: string; label: string }> = {
  user: { icon: 'account', label: 'User' },
  student: { icon: 'school', label: 'Student' },
  teacher: { icon: 'account-tie', label: 'Teacher' },
  parent: { icon: 'account-child', label: 'Parent' },
  class: { icon: 'google-classroom', label: 'Class' },
  assignment: { icon: 'clipboard-text', label: 'Assignment' },
  content: { icon: 'file-document', label: 'Content' },
  fee: { icon: 'currency-inr', label: 'Fee' },
  payment: { icon: 'credit-card', label: 'Payment' },
  settings: { icon: 'cog', label: 'Settings' },
  report: { icon: 'chart-bar', label: 'Report' },
};

export function useAuditLogsQuery(options?: UseAuditLogsQueryOptions) {
  const customerId = useCustomerId();
  const { action, entityType, performedBy, startDate, endDate, limit = 50, offset = 0 } = options || {};

  return useQuery({
    queryKey: ['audit-logs', customerId, { action, entityType, performedBy, startDate, endDate, limit, offset }],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          entity_type,
          entity_id,
          details,
          performed_by,
          ip_address,
          user_agent,
          created_at
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (action) {
        query = query.eq('action', action);
      }

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      if (performedBy) {
        query = query.eq('performed_by', performedBy);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Enrich with performer info if needed
      const logs = (data || []) as AuditLog[];

      return {
        logs,
        hasMore: logs.length === limit,
        total: logs.length,
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60, // 1 minute - audit logs change frequently
  });
}

// Helper function to format audit log for display
export function formatAuditLogMessage(log: AuditLog): string {
  const actionConfig = AUDIT_ACTION_CONFIG[log.action];
  const entityConfig = AUDIT_ENTITY_CONFIG[log.entity_type];

  return `${actionConfig.label} ${entityConfig.label}${log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ''}`;
}

// Helper function to get relative time
export function getAuditLogRelativeTime(createdAt: string): string {
  const now = new Date();
  const logDate = new Date(createdAt);
  const diffMs = now.getTime() - logDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return logDate.toLocaleDateString();
}
