/**
 * useAdminAuth - Admin authentication mutation hook
 * Sprint 1 - Admin Phase 1
 * 
 * Handles admin login with email/password, verifies admin role,
 * checks account status, and logs admin sessions.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { useAuthStore } from '../../../stores/authStore';
import { addBreadcrumb, captureException } from '../../../error/errorReporting';

type LoginCredentials = {
  email: string;
  password: string;
};

type LoginResponse = {
  user: any;
  session: any;
  profile: {
    role: string;
    is_active: boolean;
    two_factor_enabled: boolean;
    full_name?: string;
  };
  requires2FA: boolean;
};

export const useAdminAuth = () => {
  const queryClient = useQueryClient();
  const { setUser, setSession, setRole } = useAuthStore();

  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: async ({ email, password }: LoginCredentials) => {
      addBreadcrumb({
        category: 'auth',
        message: 'Admin login attempt',
        level: 'info',
        data: { email },
      });

      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        addBreadcrumb({
          category: 'auth',
          message: 'Admin auth failed',
          level: 'error',
          data: { error: authError.message },
        });
        throw new Error(authError.message || 'Authentication failed');
      }

      if (!authData.user) {
        throw new Error('No user returned from authentication');
      }

      // 2. Verify admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_active, two_factor_enabled, full_name, status')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error('Failed to fetch user profile');
      }

      // 3. Check if user has admin privileges
      if (!['admin', 'super_admin'].includes(profile.role)) {
        await supabase.auth.signOut();
        addBreadcrumb({
          category: 'auth',
          message: 'Non-admin login attempt rejected',
          level: 'warning',
          data: { role: profile.role },
        });
        throw new Error('Access denied. Admin privileges required.');
      }

      // 4. Check if account is active
      if (!profile.is_active || profile.status === 'suspended') {
        await supabase.auth.signOut();
        throw new Error('Account is suspended. Please contact support.');
      }

      // 5. Log admin session
      try {
        await supabase.from('admin_sessions').insert({
          admin_id: authData.user.id,
          ip_address: null, // Would be set server-side
          user_agent: null, // Would be set server-side
          started_at: new Date().toISOString(),
        });
      } catch (sessionError) {
        // Non-blocking - log but don't fail login
        console.warn('Failed to log admin session:', sessionError);
      }

      // 6. Log to audit
      try {
        await supabase.from('audit_logs').insert({
          action: 'admin_login',
          entity_type: 'admin_user',
          entity_id: authData.user.id,
          details: { email, login_time: new Date().toISOString() },
          performed_by: authData.user.id,
        });
      } catch (auditError) {
        // Non-blocking
        console.warn('Failed to log audit:', auditError);
      }

      addBreadcrumb({
        category: 'auth',
        message: 'Admin login successful',
        level: 'info',
        data: { userId: authData.user.id, role: profile.role },
      });

      return {
        user: authData.user,
        session: authData.session,
        profile: {
          role: profile.role,
          is_active: profile.is_active,
          two_factor_enabled: profile.two_factor_enabled || false,
          full_name: profile.full_name,
        },
        requires2FA: profile.two_factor_enabled || false,
      };
    },
    onSuccess: (data) => {
      setUser(data.user);
      setSession(data.session);
      setRole(data.profile.role as any);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (error) => {
      captureException(error, {
        tags: { action: 'admin_login' },
      });
    },
  });
};

export default useAdminAuth;
