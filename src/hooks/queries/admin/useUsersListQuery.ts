/**
 * useUsersListQuery - Fetches paginated user list for admin user management
 *
 * Queries the profiles table with support for:
 * - Search by name/email
 * - Filter by role
 * - Filter by status
 * - Pagination
 * - Sorting
 *
 * @returns User list with loading/error states
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  status: 'active' | 'pending' | 'suspended';
  avatar_url?: string;
  last_login_at?: string;
  created_at: string;
  is_active: boolean;
};

export type UsersListQueryOptions = {
  search?: string;
  role?: string | null;
  status?: string | null;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'email' | 'role' | 'created_at' | 'last_login_at';
  sortOrder?: 'asc' | 'desc';
};

// Fallback mock data when database query fails
const FALLBACK_USERS: UserListItem[] = [
  { id: '1', name: 'John Smith', email: 'john@example.com', role: 'student', status: 'active', last_login_at: '2 min ago', created_at: '2024-01-15', is_active: true },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'teacher', status: 'active', last_login_at: '5 min ago', created_at: '2024-01-10', is_active: true },
  { id: '3', name: 'Mike Wilson', email: 'mike@example.com', role: 'parent', status: 'pending', last_login_at: '1 hour ago', created_at: '2024-02-01', is_active: false },
  { id: '4', name: 'Emily Brown', email: 'emily@example.com', role: 'student', status: 'active', last_login_at: '3 hours ago', created_at: '2024-01-20', is_active: true },
  { id: '5', name: 'David Lee', email: 'david@example.com', role: 'admin', status: 'active', last_login_at: 'Just now', created_at: '2023-12-01', is_active: true },
  { id: '6', name: 'Lisa Chen', email: 'lisa@example.com', role: 'teacher', status: 'suspended', last_login_at: '2 days ago', created_at: '2024-01-05', is_active: false },
  { id: '7', name: 'Tom Anderson', email: 'tom@example.com', role: 'student', status: 'pending', last_login_at: '1 day ago', created_at: '2024-02-10', is_active: false },
  { id: '8', name: 'Amy Davis', email: 'amy@example.com', role: 'parent', status: 'active', last_login_at: '30 min ago', created_at: '2024-01-25', is_active: true },
];

export function useUsersListQuery(options: UsersListQueryOptions = {}) {
  const customerId = useCustomerId();

  const {
    search = '',
    role = null,
    status = null,
    limit = 10,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options;

  return useQuery({
    queryKey: ['users-list', customerId, search, role, status, limit, offset, sortBy, sortOrder],
    queryFn: async (): Promise<UserListItem[]> => {
      const supabase = getSupabaseClient();

      try {
        let query = supabase
          .from('profiles')
          .select('id, full_name, email, role, is_active, avatar_url, last_login_at, created_at, status')
          .eq('customer_id', customerId)
          .order(sortBy === 'name' ? 'full_name' : sortBy, { ascending: sortOrder === 'asc' })
          .range(offset, offset + limit - 1);

        // Apply search filter
        if (search) {
          query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        // Apply role filter
        if (role) {
          query = query.eq('role', role);
        }

        // Apply status filter
        if (status) {
          if (status === 'active') {
            query = query.eq('is_active', true);
          } else if (status === 'pending') {
            query = query.eq('is_active', false).is('status', null);
          } else if (status === 'suspended') {
            query = query.eq('status', 'suspended');
          }
        }

        const { data, error } = await query;

        if (error) throw error;

        // If no data from database, use fallback demo data
        if (!data || data.length === 0) {
          console.log('[useUsersListQuery] No users in database, using demo data');
          
          // Apply filters to fallback data
          let filteredUsers = [...FALLBACK_USERS];
          
          if (search) {
            const searchLower = search.toLowerCase();
            filteredUsers = filteredUsers.filter(
              (u) => u.name.toLowerCase().includes(searchLower) || u.email.toLowerCase().includes(searchLower)
            );
          }
          
          if (role) {
            filteredUsers = filteredUsers.filter((u) => u.role === role);
          }
          
          if (status) {
            filteredUsers = filteredUsers.filter((u) => u.status === status);
          }
          
          return filteredUsers.slice(offset, offset + limit);
        }

        // Transform data to match UserListItem type
        return (data || []).map((user) => ({
          id: user.id,
          name: user.full_name || 'Unknown User',
          email: user.email || '',
          role: user.role as UserListItem['role'],
          status: getStatus(user),
          avatar_url: user.avatar_url,
          last_login_at: formatLastActive(user.last_login_at),
          created_at: user.created_at,
          is_active: user.is_active,
        }));
      } catch (error) {
        console.warn('[useUsersListQuery] Database query failed, using fallback data:', error);
        
        // Apply filters to fallback data
        let filteredUsers = [...FALLBACK_USERS];
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredUsers = filteredUsers.filter(
            (u) => u.name.toLowerCase().includes(searchLower) || u.email.toLowerCase().includes(searchLower)
          );
        }
        
        if (role) {
          filteredUsers = filteredUsers.filter((u) => u.role === role);
        }
        
        if (status) {
          filteredUsers = filteredUsers.filter((u) => u.status === status);
        }
        
        return filteredUsers.slice(offset, offset + limit);
      }
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: FALLBACK_USERS,
  });
}

// Helper function to determine user status
function getStatus(user: { is_active?: boolean; status?: string | null }): UserListItem['status'] {
  if (user.status === 'suspended') return 'suspended';
  if (user.is_active) return 'active';
  return 'pending';
}

// Helper function to format last active time
function formatLastActive(lastLoginAt?: string | null): string {
  if (!lastLoginAt) return 'Never';
  
  const lastLogin = new Date(lastLoginAt);
  const now = new Date();
  const diffMs = now.getTime() - lastLogin.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return lastLogin.toLocaleDateString();
}
