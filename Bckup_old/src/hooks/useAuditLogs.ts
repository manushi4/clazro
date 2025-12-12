/**
 * Audit Logs React Query Hooks
 * Production-grade hooks for security compliance data fetching
 * Following ADMIN_IMPLEMENTATION_STRATEGY.md
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  AuditLog,
  AuditLogListItem,
  AuditLogFilters,
  AuditLogQueryResult,
  auditQueryKeys,
  createAuditSummary,
} from '../types/auditLogs';

/**
 * Fetch audit logs with filters
 * Real Supabase data with pagination and filtering
 */
export function useAuditLogs(filters: AuditLogFilters) {
  return useQuery({
    queryKey: auditQueryKeys.list(filters),
    queryFn: async (): Promise<AuditLogQueryResult> => {
      console.log('🔍 [useAuditLogs] Fetching audit logs:', filters);

      try {
        // Build query with filters
        let query = supabase
          .from('audit_logs')
          .select(
            `
            id,
            admin_id,
            action,
            target_id,
            target_type,
            changes,
            metadata,
            ip_address,
            user_agent,
            timestamp,
            created_at,
            profiles!inner(full_name)
          `,
            { count: 'exact' }
          )
          .order('timestamp', { ascending: false });

        // Apply filters
        if (filters.action) {
          query = query.eq('action', filters.action);
        }

        if (filters.admin_id) {
          query = query.eq('admin_id', filters.admin_id);
        }

        if (filters.target_type) {
          query = query.eq('target_type', filters.target_type);
        }

        if (filters.start_date) {
          query = query.gte('timestamp', filters.start_date);
        }

        if (filters.end_date) {
          query = query.lte('timestamp', filters.end_date);
        }

        if (filters.search) {
          // Search in action, changes, or metadata
          query = query.or(
            `action.ilike.%${filters.search}%,changes->>'full_name'.ilike.%${filters.search}%,changes->>'name'.ilike.%${filters.search}%`
          );
        }

        // Pagination
        const limit = filters.limit || 50;
        const offset = filters.offset || 0;
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
          console.error('❌ [useAuditLogs] Error fetching logs:', error);
          throw error;
        }

        // Transform to list items with summaries
        const logs: AuditLogListItem[] = (data || []).map((log: any) => {
          const auditLog: AuditLog = {
            ...log,
            admin_name: log.profiles?.full_name || 'Unknown Admin',
          };

          const listItem: AuditLogListItem = {
            id: log.id,
            admin_id: log.admin_id,
            admin_name: auditLog.admin_name || 'Unknown Admin',
            action: log.action,
            target_type: log.target_type,
            timestamp: log.timestamp,
            summary: createAuditSummary(auditLog),
          };
          return listItem;
        });

        console.log(`✅ [useAuditLogs] Fetched ${logs.length} logs (total: ${count || 0})`);

        return {
          logs,
          totalCount: count || 0,
          hasMore: (offset + limit) < (count || 0),
        };
      } catch (error) {
        console.error('❌ [useAuditLogs] Error:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds - audit logs should be fairly fresh
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch single audit log detail
 * Real Supabase data with full details
 */
export function useAuditLogDetail(logId: string) {
  return useQuery({
    queryKey: auditQueryKeys.detail(logId),
    queryFn: async (): Promise<AuditLog | null> => {
      console.log('🔍 [useAuditLogDetail] Fetching log detail:', logId);

      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select(
            `
            *,
            profiles!inner(full_name, email)
          `
          )
          .eq('id', logId)
          .single();

        if (error) {
          console.error('❌ [useAuditLogDetail] Error fetching log detail:', error);
          throw error;
        }

        if (!data) {
          console.log('⚠️ [useAuditLogDetail] Log not found');
          return null;
        }

        const log: AuditLog = {
          ...data,
          admin_name: data.profiles?.full_name || 'Unknown Admin',
        };

        console.log('✅ [useAuditLogDetail] Fetched log detail');
        return log;
      } catch (error) {
        console.error('❌ [useAuditLogDetail] Error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - detail is fairly static
    refetchOnWindowFocus: false,
    enabled: !!logId, // Only fetch if logId is provided
  });
}

/**
 * Fetch audit log statistics
 * Aggregated data for dashboard/compliance view
 */
export function useAuditLogStats() {
  return useQuery({
    queryKey: auditQueryKeys.stats(),
    queryFn: async () => {
      console.log('📊 [useAuditLogStats] Fetching audit stats');

      try {
        // Get total count
        const { count: totalCount, error: countError } = await supabase
          .from('audit_logs')
          .select('id', { count: 'exact', head: true });

        if (countError) throw countError;

        // Get count by action (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data: recentActions, error: actionsError } = await supabase
          .from('audit_logs')
          .select('action')
          .gte('timestamp', thirtyDaysAgo);

        if (actionsError) throw actionsError;

        // Count by action type
        const actionCounts = (recentActions || []).reduce((acc: Record<string, number>, log: any) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {});

        // Get recent critical actions (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const criticalActions = ['suspend_user', 'delete_user', 'delete_branch', 'enable_maintenance'];

        const { count: criticalCount, error: criticalError } = await supabase
          .from('audit_logs')
          .select('id', { count: 'exact', head: true })
          .in('action', criticalActions)
          .gte('timestamp', sevenDaysAgo);

        if (criticalError) throw criticalError;

        console.log('✅ [useAuditLogStats] Fetched audit stats');

        return {
          totalCount: totalCount || 0,
          recentCount: (recentActions || []).length,
          criticalCount: criticalCount || 0,
          actionCounts,
        };
      } catch (error) {
        console.error('❌ [useAuditLogStats] Error:', error);
        throw error;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });
}
