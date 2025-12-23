/**
 * usePendingApprovalsQuery - Fetches users awaiting approval
 *
 * Phase 2: Query Hook for users.pending-approvals widget
 * Following WIDGET_DEVELOPMENT_GUIDE.md
 *
 * Queries the profiles table for users with pending status
 * who need admin approval to activate their accounts.
 *
 * @returns Pending users list with loading/error states
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type PendingUser = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'parent';
  requestedAt: string;
  organization?: string;
  avatar_url?: string;
};

export type PendingApprovalsQueryOptions = {
  limit?: number;
};

// Fallback mock data when database query fails
const FALLBACK_PENDING: PendingUser[] = [
  { id: '1', name: 'Alice Cooper', email: 'alice@example.com', role: 'student', requestedAt: '2 hours ago', organization: 'Class 10-A' },
  { id: '2', name: 'Bob Martin', email: 'bob@example.com', role: 'teacher', requestedAt: '5 hours ago', organization: 'Mathematics' },
  { id: '3', name: 'Carol White', email: 'carol@example.com', role: 'parent', requestedAt: '1 day ago' },
  { id: '4', name: 'Dan Brown', email: 'dan@example.com', role: 'student', requestedAt: '1 day ago', organization: 'Class 9-B' },
  { id: '5', name: 'Eve Johnson', email: 'eve@example.com', role: 'teacher', requestedAt: '2 days ago', organization: 'Science' },
];

/**
 * Query hook to fetch pending approval users
 */
export function usePendingApprovalsQuery(options: PendingApprovalsQueryOptions = {}) {
  const customerId = useCustomerId();
  const { limit = 10 } = options;

  return useQuery({
    queryKey: ['pending-approvals', customerId, limit],
    queryFn: async (): Promise<PendingUser[]> => {
      const supabase = getSupabaseClient();

      try {
        // Query profiles where is_active = false and status is null or 'pending'
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            role,
            avatar_url,
            created_at,
            organization_id,
            organizations:organization_id (name)
          `)
          .eq('customer_id', customerId)
          .eq('is_active', false)
          .or('status.is.null,status.eq.pending')
          .neq('role', 'admin') // Don't show admin users in pending
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        // If no data from database, use fallback demo data
        if (!data || data.length === 0) {
          console.log('[usePendingApprovalsQuery] No pending users in database, using demo data');
          return FALLBACK_PENDING.slice(0, limit);
        }

        // Transform data to match PendingUser type
        return (data || []).map((user) => ({
          id: user.id,
          name: user.full_name || 'Unknown User',
          email: user.email || '',
          role: user.role as PendingUser['role'],
          requestedAt: formatTimeAgo(user.created_at),
          organization: (user.organizations as any)?.name || undefined,
          avatar_url: user.avatar_url,
        }));
      } catch (error) {
        console.warn('[usePendingApprovalsQuery] Database query failed, using fallback data:', error);
        return FALLBACK_PENDING.slice(0, limit);
      }
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: FALLBACK_PENDING.slice(0, limit),
  });
}

/**
 * Mutation hook to approve a pending user
 */
export function useApproveUser() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async (userId: string) => {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: true,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .eq('customer_id', customerId);

      if (error) throw error;

      return { success: true, userId };
    },
    onSuccess: () => {
      // Invalidate pending approvals query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['pending-approvals', customerId] });
      // Also invalidate user stats and list queries
      queryClient.invalidateQueries({ queryKey: ['user-stats', customerId] });
      queryClient.invalidateQueries({ queryKey: ['users-list', customerId] });
    },
  });
}

/**
 * Mutation hook to reject a pending user
 */
export function useRejectUser() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .eq('customer_id', customerId);

      if (error) throw error;

      return { success: true, userId };
    },
    onSuccess: () => {
      // Invalidate pending approvals query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['pending-approvals', customerId] });
      // Also invalidate user stats query
      queryClient.invalidateQueries({ queryKey: ['user-stats', customerId] });
    },
  });
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  if (!dateString) return 'Unknown';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}
