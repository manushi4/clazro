import { supabase } from '../lib/supabase';
import type { AuditLog } from '../types/admin';

/**
 * Audit event types for all destructive admin actions
 */
export enum AuditEventType {
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  FEE_WAIVED = 'fee_waived',
  FEE_REFUNDED = 'fee_refunded',
  BULK_MESSAGE_SENT = 'bulk_message_sent',
  ANNOUNCEMENT_CREATED = 'announcement_created',
  ANNOUNCEMENT_DELETED = 'announcement_deleted',
  SETTINGS_CHANGED = 'settings_changed',
  ROLE_CHANGED = 'role_changed',
}

/**
 * Audit event payload
 */
interface AuditEventPayload {
  action: AuditEventType;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event to the database
 * @param payload - Audit event data
 * @throws Error if logging fails
 */
export const logAuditEvent = async (
  payload: AuditEventPayload
): Promise<void> => {
  try {
    console.log('📝 [AuditLogger] Logging event:', payload.action, payload.entityType, payload.entityId);

    const { error } = await supabase.from('audit_logs').insert({
      action: payload.action,
      entity_type: payload.entityType,
      entity_id: payload.entityId,
      details: payload.details,
      ip_address: payload.ipAddress || null,
      user_agent: payload.userAgent || null,
    });

    if (error) {
      console.error('❌ [AuditLogger] Failed to log event:', error);
      throw new Error(`Failed to log audit event: ${error.message}`);
    }

    console.log('✅ [AuditLogger] Event logged successfully');
  } catch (error) {
    console.error('❌ [AuditLogger] Unexpected error:', error);
    throw error;
  }
};

/**
 * Fetch audit logs with filtering and pagination
 */
export const fetchAuditLogs = async (options?: {
  adminId?: string;
  entityType?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLog[]> => {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.adminId) {
    query = query.eq('admin_id', options.adminId);
  }

  if (options?.entityType) {
    query = query.eq('entity_type', options.entityType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ [AuditLogger] Failed to fetch logs:', error);
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  return data as AuditLog[];
};
