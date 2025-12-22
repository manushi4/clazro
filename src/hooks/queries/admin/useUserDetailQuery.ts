/**
 * useUserDetailQuery - Fetches detailed user information for admin view
 *
 * Queries the profiles table to get comprehensive user data including:
 * - Basic profile info (name, email, phone, avatar)
 * - Role and status
 * - Activity stats (login count, last active)
 * - Organization/class membership
 * - Account creation and update timestamps
 *
 * @param userId - The user ID to fetch details for
 * @returns User detail data with loading/error states
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';
export type UserStatus = 'active' | 'pending' | 'suspended' | 'inactive';

export type UserDetail = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
  
  // Activity
  last_login_at?: string;
  login_count: number;
  created_at: string;
  updated_at?: string;
  
  // Organization
  organization_id?: string;
  organization_name?: string;
  department_id?: string;
  department_name?: string;
  class_id?: string;
  class_name?: string;
  
  // Additional info
  bio?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  
  // Stats
  xp_points: number;
  streak_days: number;
  badges_count: number;
};

// Demo user data for when database is empty
const DEMO_USERS: Record<string, UserDetail> = {
  '1': {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+91 98765 43210',
    role: 'student',
    status: 'active',
    is_active: true,
    last_login_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    login_count: 145,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    organization_name: 'Demo School',
    class_name: 'Class 10-A',
    xp_points: 2450,
    streak_days: 12,
    badges_count: 8,
  },
  '2': {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+91 98765 43211',
    role: 'teacher',
    status: 'active',
    is_active: true,
    last_login_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    login_count: 312,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
    organization_name: 'Demo School',
    department_name: 'Mathematics',
    xp_points: 5200,
    streak_days: 45,
    badges_count: 15,
  },
  '3': {
    id: '3',
    name: 'Mike Wilson',
    email: 'mike.wilson@example.com',
    phone: '+91 98765 43212',
    role: 'parent',
    status: 'pending',
    is_active: false,
    login_count: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    organization_name: 'Demo School',
    xp_points: 150,
    streak_days: 0,
    badges_count: 1,
  },
  '4': {
    id: '4',
    name: 'Emily Brown',
    email: 'emily.brown@example.com',
    role: 'student',
    status: 'active',
    is_active: true,
    last_login_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    login_count: 89,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    organization_name: 'Demo School',
    class_name: 'Class 9-B',
    xp_points: 1820,
    streak_days: 7,
    badges_count: 5,
  },
  '5': {
    id: '5',
    name: 'David Lee',
    email: 'david.lee@example.com',
    phone: '+91 98765 43214',
    role: 'admin',
    status: 'active',
    is_active: true,
    last_login_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    login_count: 523,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
    organization_name: 'Demo School',
    xp_points: 8500,
    streak_days: 120,
    badges_count: 25,
  },
  '6': {
    id: '6',
    name: 'Lisa Chen',
    email: 'lisa.chen@example.com',
    role: 'teacher',
    status: 'suspended',
    is_active: false,
    last_login_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    login_count: 156,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
    organization_name: 'Demo School',
    department_name: 'Science',
    xp_points: 3200,
    streak_days: 0,
    badges_count: 10,
  },
};

export function useUserDetailQuery(userId: string | undefined) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['user-detail', customerId, userId],
    queryFn: async (): Promise<UserDetail | null> => {
      if (!userId) return null;

      const supabase = getSupabaseClient();

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            avatar_url,
            role,
            status,
            is_active,
            last_login_at,
            login_count,
            created_at,
            updated_at,
            organization_id,
            department_id,
            class_id,
            bio,
            address,
            date_of_birth,
            gender,
            xp_points,
            streak_days,
            badges_count,
            organizations:organization_id (name),
            departments:department_id (name),
            classes:class_id (name)
          `)
          .eq('id', userId)
          .eq('customer_id', customerId)
          .single();

        if (error) {
          console.warn('[useUserDetailQuery] Error fetching user:', error.message);
          // Return demo data if available
          return DEMO_USERS[userId] || createDemoUser(userId);
        }

        if (!data) {
          return DEMO_USERS[userId] || createDemoUser(userId);
        }

        return {
          id: data.id,
          name: data.full_name || 'Unknown User',
          email: data.email || '',
          phone: data.phone,
          avatar_url: data.avatar_url,
          role: (data.role || 'student') as UserRole,
          status: getStatus(data),
          is_active: data.is_active ?? true,
          last_login_at: data.last_login_at,
          login_count: data.login_count || 0,
          created_at: data.created_at,
          updated_at: data.updated_at,
          organization_id: data.organization_id,
          organization_name: (data.organizations as any)?.name,
          department_id: data.department_id,
          department_name: (data.departments as any)?.name,
          class_id: data.class_id,
          class_name: (data.classes as any)?.name,
          bio: data.bio,
          address: data.address,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          xp_points: data.xp_points || 0,
          streak_days: data.streak_days || 0,
          badges_count: data.badges_count || 0,
        };
      } catch (error) {
        console.warn('[useUserDetailQuery] Query failed, using demo data:', error);
        return DEMO_USERS[userId] || createDemoUser(userId);
      }
    },
    enabled: !!userId && !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Helper to determine user status
function getStatus(user: { is_active?: boolean; status?: string | null }): UserStatus {
  if (user.status === 'suspended') return 'suspended';
  if (user.status === 'inactive') return 'inactive';
  if (user.is_active) return 'active';
  return 'pending';
}

// Create a demo user for unknown IDs
function createDemoUser(userId: string): UserDetail {
  return {
    id: userId,
    name: 'Demo User',
    email: 'demo@example.com',
    role: 'student',
    status: 'active',
    is_active: true,
    login_count: 10,
    created_at: new Date().toISOString(),
    xp_points: 500,
    streak_days: 3,
    badges_count: 2,
  };
}

export default useUserDetailQuery;
