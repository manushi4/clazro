/**
 * useUpdateUser - Update User Mutation Hook
 *
 * Provides mutation for updating existing users in the admin panel:
 * - Update profile information
 * - Change role
 * - Update status (active/suspended)
 * - Modify permissions
 *
 * Widget ID: users.edit-form
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { addBreadcrumb, captureException } from '../../../error/errorReporting';
import { useCustomerId } from '../../config/useCustomerId';

// =============================================================================
// TYPES
// =============================================================================

export type UpdateUserInput = {
  userId: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: 'student' | 'teacher' | 'parent' | 'admin';
  className?: string;
  section?: string;
  rollNumber?: string;
  schoolName?: string;
  isActive?: boolean;
  status?: 'active' | 'pending' | 'suspended';
  avatarUrl?: string;
  language?: 'en' | 'hi';
  themeMode?: 'system' | 'light' | 'dark';
  metadata?: Record<string, unknown>;
};

export type UpdateUserResult = {
  success: boolean;
  message: string;
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
// UPDATE USER FUNCTION
// =============================================================================

async function updateUser(
  customerId: string,
  input: UpdateUserInput
): Promise<UpdateUserResult> {
  const supabase = getSupabaseClient();

  addBreadcrumb({
    category: 'admin',
    message: 'Update user started',
    level: 'info',
    data: { userId: input.userId },
  });

  try {
    // Validate required fields
    if (!input.userId) {
      return {
        success: false,
        message: 'User ID is required',
        error: 'VALIDATION_ERROR',
      };
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('id, user_id, email, first_name, last_name, role, is_active')
      .eq('customer_id', customerId)
      .eq('id', input.userId)
      .single();

    if (checkError || !existingUser) {
      return {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      };
    }

    // If email is being changed, check for duplicates
    if (input.email && input.email.toLowerCase() !== existingUser.email?.toLowerCase()) {
      const { data: emailCheck } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('customer_id', customerId)
        .eq('email', input.email.toLowerCase())
        .neq('id', input.userId)
        .maybeSingle();

      if (emailCheck) {
        return {
          success: false,
          message: 'A user with this email already exists',
          error: 'EMAIL_EXISTS',
        };
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.fullName) {
      updateData.first_name = input.fullName.split(' ')[0];
      updateData.last_name = input.fullName.split(' ').slice(1).join(' ') || null;
      updateData.display_name = input.fullName;
    }
    if (input.firstName !== undefined) updateData.first_name = input.firstName;
    if (input.lastName !== undefined) updateData.last_name = input.lastName;
    if (input.email !== undefined) updateData.email = input.email.toLowerCase();
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.className !== undefined) updateData.class_name_en = input.className;
    if (input.section !== undefined) updateData.section = input.section;
    if (input.rollNumber !== undefined) updateData.roll_number = input.rollNumber;
    if (input.schoolName !== undefined) updateData.school_name_en = input.schoolName;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;
    if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;
    if (input.language !== undefined) updateData.language = input.language;
    if (input.themeMode !== undefined) updateData.theme_mode = input.themeMode;

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('customer_id', customerId)
      .eq('id', input.userId)
      .select()
      .single();

    if (updateError) throw updateError;

    const fullName = [updatedUser.first_name, updatedUser.last_name]
      .filter(Boolean)
      .join(' ');

    addBreadcrumb({
      category: 'admin',
      message: 'User updated successfully',
      level: 'info',
      data: { userId: input.userId },
    });

    return {
      success: true,
      message: `User ${fullName} updated successfully`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName,
        role: updatedUser.role,
        isActive: updatedUser.is_active,
      },
    };
  } catch (error: any) {
    captureException(error, {
      tags: { action: 'update_user' },
      extra: { customerId, userId: input.userId },
    });

    return {
      success: false,
      message: error.message || 'Failed to update user',
      error: error.code || 'UNKNOWN_ERROR',
    };
  }
}

// =============================================================================
// HOOK
// =============================================================================

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: (input: UpdateUserInput) =>
      updateUser(customerId || '', input),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['user-stats'] });
        queryClient.invalidateQueries({ queryKey: ['users-list'] });
        queryClient.invalidateQueries({ queryKey: ['user-detail', variables.userId] });
        queryClient.invalidateQueries({ queryKey: ['recent-registrations'] });
      }
    },
    onError: (error: Error) => {
      addBreadcrumb({
        category: 'admin',
        message: 'Update user failed',
        level: 'error',
        data: { error: error.message },
      });
    },
  });
}
