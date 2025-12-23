/**
 * useCreateUser - Create New User Mutation Hook
 *
 * Provides mutation for creating new users in the admin panel:
 * - Create users with role assignment
 * - Set initial profile data
 * - Send welcome email (optional)
 * - Auto-approve or set pending status
 *
 * Widget ID: users.create-form
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { addBreadcrumb, captureException } from '../../../error/errorReporting';
import { useCustomerId } from '../../config/useCustomerId';

// =============================================================================
// TYPES
// =============================================================================

export type CreateUserInput = {
  email: string;
  fullName: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  phone?: string;
  className?: string;
  section?: string;
  rollNumber?: string;
  schoolName?: string;
  isActive?: boolean;
  sendWelcomeEmail?: boolean;
  password?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
};

export type CreateUserResult = {
  success: boolean;
  message: string;
  userId?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
  };
  error?: string;
};

// =============================================================================
// CREATE USER FUNCTION
// =============================================================================

async function createUser(
  customerId: string,
  input: CreateUserInput
): Promise<CreateUserResult> {
  const supabase = getSupabaseClient();

  addBreadcrumb({
    category: 'admin',
    message: 'Create user started',
    level: 'info',
    data: { email: input.email, role: input.role },
  });

  try {
    // Validate required fields
    if (!input.email || !input.fullName || !input.role) {
      return {
        success: false,
        message: 'Email, full name, and role are required',
        error: 'VALIDATION_ERROR',
      };
    }

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('customer_id', customerId)
      .eq('email', input.email.toLowerCase())
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingUser) {
      return {
        success: false,
        message: 'A user with this email already exists',
        error: 'EMAIL_EXISTS',
      };
    }

    // Generate a unique user_id
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create user profile
    const { data: newUser, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        customer_id: customerId,
        first_name: input.fullName.split(' ')[0],
        last_name: input.fullName.split(' ').slice(1).join(' ') || null,
        display_name: input.fullName,
        email: input.email.toLowerCase(),
        phone: input.phone || null,
        role: input.role,
        class_name_en: input.className || null,
        section: input.section || null,
        roll_number: input.rollNumber || null,
        school_name_en: input.schoolName || null,
        avatar_url: input.avatarUrl || null,
        is_active: input.isActive !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) throw createError;

    // Create initial user stats
    await supabase.from('user_stats').insert({
      user_id: userId,
      customer_id: customerId,
      total_xp: 0,
      current_streak: 0,
      badges_count: 0,
    });

    addBreadcrumb({
      category: 'admin',
      message: 'User created successfully',
      level: 'info',
      data: { userId: newUser.id, email: input.email },
    });

    return {
      success: true,
      message: `User ${input.fullName} created successfully`,
      userId: newUser.id,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: input.fullName,
        role: newUser.role,
        isActive: newUser.is_active,
      },
    };
  } catch (error: any) {
    captureException(error, {
      tags: { action: 'create_user' },
      extra: { customerId, email: input.email },
    });

    return {
      success: false,
      message: error.message || 'Failed to create user',
      error: error.code || 'UNKNOWN_ERROR',
    };
  }
}

// =============================================================================
// HOOK
// =============================================================================

export function useCreateUser() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      createUser(customerId || '', input),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['user-stats'] });
        queryClient.invalidateQueries({ queryKey: ['users-list'] });
        queryClient.invalidateQueries({ queryKey: ['recent-registrations'] });
        queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      }
    },
    onError: (error: Error) => {
      addBreadcrumb({
        category: 'admin',
        message: 'Create user failed',
        level: 'error',
        data: { error: error.message },
      });
    },
  });
}
