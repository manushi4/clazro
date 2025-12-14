/**
 * Admin role types
 */
export type AdminRole =
  | 'super_admin'
  | 'branch_admin'
  | 'finance_admin'
  | 'academic_coordinator'
  | 'compliance_admin';

/**
 * Admin permission types
 */
export type AdminPermission =
  | 'user_management'
  | 'fee_management'
  | 'system_settings'
  | 'analytics_view'
  | 'audit_logs_view'
  | 'announcements'
  | 'bulk_operations'
  | 'compliance_reports';

/**
 * Admin user profile from Supabase
 */
export interface AdminProfile {
  id: string;
  user_id: string;
  role: AdminRole;
  permissions: AdminPermission[];
  branch_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
