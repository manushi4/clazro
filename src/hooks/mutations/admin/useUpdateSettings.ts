/**
 * useUpdateSettings - Settings Update Mutation Hook
 *
 * Provides mutations for updating various system and user settings:
 * - Notification preferences
 * - Theme and appearance settings
 * - Language preferences
 * - Privacy settings
 *
 * Sprint: 9 - Settings + Audit
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { addBreadcrumb, captureException } from '../../../error/errorReporting';
import { useCustomerId } from '../../config/useCustomerId';

// =============================================================================
// TYPES
// =============================================================================

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';

export type NotificationCategory = {
  id: string;
  enabled: boolean;
  channels: NotificationChannel[];
};

export type NotificationSettingsInput = {
  notifications_enabled?: boolean;
  categories?: NotificationCategory[];
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string; // HH:MM format
  quiet_hours_end?: string; // HH:MM format
  sound_enabled?: boolean;
  vibration_enabled?: boolean;
};

export type AppearanceSettingsInput = {
  theme_mode?: 'system' | 'light' | 'dark';
  language?: 'en' | 'hi';
  font_size?: 'small' | 'medium' | 'large';
  compact_mode?: boolean;
};

export type PrivacySettingsInput = {
  profile_visible?: boolean;
  show_online_status?: boolean;
  allow_analytics?: boolean;
};

export type UpdateSettingsInput = {
  userId: string;
  notification?: NotificationSettingsInput;
  appearance?: AppearanceSettingsInput;
  privacy?: PrivacySettingsInput;
};

export type UpdateSettingsResult = {
  success: boolean;
  message: string;
  updatedAt: string;
  error?: string;
};

// =============================================================================
// UPDATE NOTIFICATION SETTINGS
// =============================================================================

async function updateNotificationSettings(
  customerId: string,
  userId: string,
  settings: NotificationSettingsInput
): Promise<UpdateSettingsResult> {
  const supabase = getSupabaseClient();

  addBreadcrumb({
    category: 'settings',
    message: 'Updating notification settings',
    level: 'info',
    data: { userId, settingsKeys: Object.keys(settings) },
  });

  try {
    const { error } = await supabase
      .from('notification_settings')
      .upsert({
        customer_id: customerId,
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'customer_id,user_id',
      });

    if (error) throw error;

    return {
      success: true,
      message: 'Notification settings updated successfully',
      updatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    captureException(error, { userId, settingsType: 'notification' });
    return {
      success: false,
      message: 'Failed to update notification settings',
      updatedAt: new Date().toISOString(),
      error: error.message,
    };
  }
}

// =============================================================================
// UPDATE APPEARANCE SETTINGS
// =============================================================================

async function updateAppearanceSettings(
  customerId: string,
  userId: string,
  settings: AppearanceSettingsInput
): Promise<UpdateSettingsResult> {
  const supabase = getSupabaseClient();

  addBreadcrumb({
    category: 'settings',
    message: 'Updating appearance settings',
    level: 'info',
    data: { userId, settingsKeys: Object.keys(settings) },
  });

  try {
    // Update user_profiles table with appearance preferences
    const updateData: Record<string, unknown> = {};

    if (settings.theme_mode) updateData.theme_mode = settings.theme_mode;
    if (settings.language) updateData.language = settings.language;
    if (settings.font_size) updateData.font_size = settings.font_size;
    if (settings.compact_mode !== undefined) updateData.compact_mode = settings.compact_mode;

    const { error } = await supabase
      .from('user_profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('customer_id', customerId);

    if (error) throw error;

    return {
      success: true,
      message: 'Appearance settings updated successfully',
      updatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    captureException(error, { userId, settingsType: 'appearance' });
    return {
      success: false,
      message: 'Failed to update appearance settings',
      updatedAt: new Date().toISOString(),
      error: error.message,
    };
  }
}

// =============================================================================
// UPDATE PRIVACY SETTINGS
// =============================================================================

async function updatePrivacySettings(
  customerId: string,
  userId: string,
  settings: PrivacySettingsInput
): Promise<UpdateSettingsResult> {
  const supabase = getSupabaseClient();

  addBreadcrumb({
    category: 'settings',
    message: 'Updating privacy settings',
    level: 'info',
    data: { userId, settingsKeys: Object.keys(settings) },
  });

  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        profile_visible: settings.profile_visible,
        show_online_status: settings.show_online_status,
        allow_analytics: settings.allow_analytics,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('customer_id', customerId);

    if (error) throw error;

    return {
      success: true,
      message: 'Privacy settings updated successfully',
      updatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    captureException(error, { userId, settingsType: 'privacy' });
    return {
      success: false,
      message: 'Failed to update privacy settings',
      updatedAt: new Date().toISOString(),
      error: error.message,
    };
  }
}

// =============================================================================
// COMBINED UPDATE SETTINGS MUTATION
// =============================================================================

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async (input: UpdateSettingsInput): Promise<UpdateSettingsResult> => {
      if (!customerId) {
        return {
          success: false,
          message: 'Customer ID not available',
          updatedAt: new Date().toISOString(),
          error: 'Missing customer context',
        };
      }

      const results: UpdateSettingsResult[] = [];

      // Update notification settings if provided
      if (input.notification) {
        const result = await updateNotificationSettings(customerId, input.userId, input.notification);
        results.push(result);
        if (!result.success) return result;
      }

      // Update appearance settings if provided
      if (input.appearance) {
        const result = await updateAppearanceSettings(customerId, input.userId, input.appearance);
        results.push(result);
        if (!result.success) return result;
      }

      // Update privacy settings if provided
      if (input.privacy) {
        const result = await updatePrivacySettings(customerId, input.userId, input.privacy);
        results.push(result);
        if (!result.success) return result;
      }

      return {
        success: true,
        message: `Successfully updated ${results.length} setting(s)`,
        updatedAt: new Date().toISOString(),
      };
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['user-profile', variables.userId] });
        queryClient.invalidateQueries({ queryKey: ['notification-settings', variables.userId] });
        queryClient.invalidateQueries({ queryKey: ['user-settings', variables.userId] });

        addBreadcrumb({
          category: 'settings',
          message: 'Settings updated successfully',
          level: 'info',
          data: { userId: variables.userId },
        });
      }
    },
    onError: (error: Error, variables) => {
      captureException(error, {
        userId: variables.userId,
        operation: 'updateSettings',
      });
    },
  });
}

// =============================================================================
// INDIVIDUAL SETTING MUTATIONS
// =============================================================================

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async ({ userId, settings }: { userId: string; settings: NotificationSettingsInput }) => {
      if (!customerId) throw new Error('Customer ID not available');
      return updateNotificationSettings(customerId, userId, settings);
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['notification-settings', variables.userId] });
      }
    },
  });
}

export function useUpdateAppearanceSettings() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async ({ userId, settings }: { userId: string; settings: AppearanceSettingsInput }) => {
      if (!customerId) throw new Error('Customer ID not available');
      return updateAppearanceSettings(customerId, userId, settings);
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['user-profile', variables.userId] });
      }
    },
  });
}

export function useUpdatePrivacySettings() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: async ({ userId, settings }: { userId: string; settings: PrivacySettingsInput }) => {
      if (!customerId) throw new Error('Customer ID not available');
      return updatePrivacySettings(customerId, userId, settings);
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['user-profile', variables.userId] });
      }
    },
  });
}
