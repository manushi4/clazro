/**
 * useImpersonationUsersQuery - Query hook for fetching users available for impersonation
 *
 * Phase 3: Query Hook (per SCREEN_DEVELOPMENT_GUIDE.md)
 *
 * Features:
 * - Fetches users that can be impersonated (non-admin users)
 * - Search filtering by name/email
 * - Role filtering
 * - Pagination support
 * - Demo data fallback when no real data
 * - Uses useCustomerId() for RLS compliance
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

// =============================================================================
// TYPES
// =============================================================================

export type ImpersonatableUser = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'parent';
  avatar_url?: string;
  status: 'active' | 'pending' | 'suspended';
  last_active?: string;
  created_at: string;
};

export type ImpersonationUsersData = {
  users: ImpersonatableUser[];
  totalCount: number;
  hasMore: boolean;
};

export type UseImpersonationUsersQueryOptions = {
  searchQuery?: string;
  roleFilter?: 'student' | 'teacher' | 'parent' | 'all';
  limit?: number;
  offset?: number;
  enabled?: boolean;
};

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_USERS: ImpersonatableUser[] = [
  {
    id: 'demo-student-1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    role: 'student',
    status: 'active',
    last_active: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'demo-student-2',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    role: 'student',
    status: 'active',
    last_active: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
  {
    id: 'demo-teacher-1',
    name: 'Dr. Amit Kumar',
    email: 'amit.kumar@example.com',
    role: 'teacher',
    status: 'active',
    last_active: new Date(Date.now() - 1800000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
  },
  {
    id: 'demo-teacher-2',
    name: 'Mrs. Sunita Verma',
    email: 'sunita.verma@example.com',
    role: 'teacher',
    status: 'active',
    last_active: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 120).toISOString(),
  },
  {
    id: 'demo-parent-1',
    name: 'Mr. Rajesh Gupta',
    email: 'rajesh.gupta@example.com',
    role: 'parent',
    status: 'active',
    last_active: new Date(Date.now() - 43200000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    id: 'demo-parent-2',
    name: 'Mrs. Meera Singh',
    email: 'meera.singh@example.com',
    role: 'parent',
    status: 'active',
    last_active: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 75).toISOString(),
  },
];


// =============================================================================
// QUERY HOOK
// =============================================================================

export function useImpersonationUsersQuery(options: UseImpersonationUsersQueryOptions = {}) {
  const {
    searchQuery = '',
    roleFilter = 'all',
    limit = 20,
    offset = 0,
    enabled = true,
  } = options;

  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['admin', 'impersonation-users', customerId, { searchQuery, roleFilter, limit, offset }],
    queryFn: async (): Promise<ImpersonationUsersData> => {
      const supabase = getSupabaseClient();

      try {
        // Build query - exclude admin users (can't impersonate admins)
        let query = supabase
          .from('users')
          .select('id, full_name, email, role, avatar_url, status, last_active_at, created_at', { count: 'exact' })
          .eq('customer_id', customerId)
          .neq('role', 'admin')
          .neq('role', 'super_admin');

        // Apply role filter
        if (roleFilter !== 'all') {
          query = query.eq('role', roleFilter);
        }

        // Apply search filter
        if (searchQuery.trim()) {
          query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        }

        // Apply sorting and pagination
        query = query
          .order('full_name', { ascending: true })
          .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
          console.warn('[useImpersonationUsersQuery] Error fetching users, using demo data:', error);
          return filterDemoData(searchQuery, roleFilter, limit, offset);
        }

        // Map data to ImpersonatableUser type
        const users: ImpersonatableUser[] = (data || []).map(item => ({
          id: item.id,
          name: item.full_name || 'Unknown User',
          email: item.email || '',
          role: item.role as 'student' | 'teacher' | 'parent',
          avatar_url: item.avatar_url || undefined,
          status: (item.status || 'active') as 'active' | 'pending' | 'suspended',
          last_active: item.last_active_at || undefined,
          created_at: item.created_at,
        }));

        const totalCount = count || 0;
        const hasMore = offset + users.length < totalCount;

        // If no real data, return demo data
        if (users.length === 0 && offset === 0) {
          return filterDemoData(searchQuery, roleFilter, limit, offset);
        }

        return { users, totalCount, hasMore };
      } catch (error) {
        console.warn('[useImpersonationUsersQuery] Query failed, using demo data:', error);
        return filterDemoData(searchQuery, roleFilter, limit, offset);
      }
    },
    enabled: enabled && !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes cache
  });
}

// Helper to filter demo data
function filterDemoData(
  searchQuery: string,
  roleFilter: string,
  limit: number,
  offset: number
): ImpersonationUsersData {
  let filtered = [...DEMO_USERS];

  // Apply role filter
  if (roleFilter !== 'all') {
    filtered = filtered.filter(u => u.role === roleFilter);
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    );
  }

  // Apply pagination
  const paginated = filtered.slice(offset, offset + limit);

  return {
    users: paginated,
    totalCount: filtered.length,
    hasMore: offset + paginated.length < filtered.length,
  };
}

export default useImpersonationUsersQuery;
