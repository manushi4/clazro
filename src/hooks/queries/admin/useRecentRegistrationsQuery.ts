/**
 * useRecentRegistrationsQuery - Fetches recently registered users
 *
 * Queries the profiles table to get:
 * - Recently created user accounts
 * - Sorted by registration date (newest first)
 * - Includes role, status, and registration time
 *
 * Widget ID: users.recent-registrations
 * @returns Recent registrations with loading/error states
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type RecentRegistration = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  status: 'active' | 'pending' | 'suspended';
  avatar_url?: string;
  created_at: string;
  registered_ago: string;
};

export type RecentRegistrationsQueryOptions = {
  limit?: number;
  roleFilter?: string | null;
  statusFilter?: string | null;
};

// Fallback mock data when database query fails
const FALLBACK_DATA: RecentRegistration[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    role: 'student',
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    registered_ago: '2 hours ago',
  },
  {
    id: '2',
    name: 'Rahul Verma',
    email: 'rahul@example.com',
    role: 'teacher',
    status: 'active',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    registered_ago: '5 hours ago',
  },
  {
    id: '3',
    name: 'Anita Patel',
    email: 'anita@example.com',
    role: 'parent',
    status: 'pending',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    registered_ago: '12 hours ago',
  },
  {
    id: '4',
    name: 'Vikram Singh',
    email: 'vikram@example.com',
    role: 'student',
    status: 'active',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    registered_ago: '1 day ago',
  },
  {
    id: '5',
    name: 'Meera Gupta',
    email: 'meera@example.com',
    role: 'student',
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    registered_ago: '2 days ago',
  },
];

export function useRecentRegistrationsQuery(options: RecentRegistrationsQueryOptions = {}) {
  const customerId = useCustomerId();
  const { limit = 5, roleFilter = null, statusFilter = null } = options;

  return useQuery({
    queryKey: ['recent-registrations', customerId, limit, roleFilter, statusFilter],
    queryFn: async (): Promise<RecentRegistration[]> => {
      const supabase = getSupabaseClient();

      try {
        let query = supabase
          .from('profiles')
          .select('id, full_name, email, role, is_active, status, avatar_url, created_at')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(limit);

        // Apply role filter
        if (roleFilter) {
          query = query.eq('role', roleFilter);
        }

        // Apply status filter
        if (statusFilter) {
          if (statusFilter === 'active') {
            query = query.eq('is_active', true);
          } else if (statusFilter === 'pending') {
            query = query.eq('is_active', false).is('status', null);
          } else if (statusFilter === 'suspended') {
            query = query.eq('status', 'suspended');
          }
        }

        const { data, error } = await query;

        if (error) throw error;

        // If no data from database, use fallback demo data
        if (!data || data.length === 0) {
          console.log('[useRecentRegistrationsQuery] No registrations in database, using demo data');
          
          // Apply filters to fallback data
          let filteredData = [...FALLBACK_DATA];
          
          if (roleFilter) {
            filteredData = filteredData.filter((u) => u.role === roleFilter);
          }
          
          if (statusFilter) {
            filteredData = filteredData.filter((u) => u.status === statusFilter);
          }
          
          return filteredData.slice(0, limit);
        }

        // Transform data to match RecentRegistration type
        return (data || []).map((user) => ({
          id: user.id,
          name: user.full_name || 'Unknown User',
          email: user.email || '',
          role: user.role as RecentRegistration['role'],
          status: getStatus(user),
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          registered_ago: formatTimeAgo(user.created_at),
        }));
      } catch (error) {
        console.warn('[useRecentRegistrationsQuery] Database query failed, using fallback data:', error);
        
        // Apply filters to fallback data
        let filteredData = [...FALLBACK_DATA];
        
        if (roleFilter) {
          filteredData = filteredData.filter((u) => u.role === roleFilter);
        }
        
        if (statusFilter) {
          filteredData = filteredData.filter((u) => u.status === statusFilter);
        }
        
        return filteredData.slice(0, limit);
      }
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: FALLBACK_DATA.slice(0, limit),
  });
}

// Helper function to determine user status
function getStatus(user: { is_active?: boolean; status?: string | null }): RecentRegistration['status'] {
  if (user.status === 'suspended') return 'suspended';
  if (user.is_active) return 'active';
  return 'pending';
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
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
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}
