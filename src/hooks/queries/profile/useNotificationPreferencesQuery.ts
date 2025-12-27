import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type NotificationPreferences = {
  id: string;
  user_id: string;
  customer_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  assignments_enabled: boolean;
  tests_enabled: boolean;
  doubts_enabled: boolean;
  schedule_enabled: boolean;
  announcements_enabled: boolean;
  promotions_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
};

// Default preferences when none exist
const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'id' | 'user_id' | 'customer_id' | 'created_at' | 'updated_at'> = {
  push_enabled: true,
  email_enabled: true,
  sms_enabled: false,
  assignments_enabled: true,
  tests_enabled: true,
  doubts_enabled: true,
  schedule_enabled: true,
  announcements_enabled: true,
  promotions_enabled: false,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
};

/**
 * Query notification preferences for a user
 */
export function useNotificationPreferencesQuery(userId: string | null) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['notification-preferences', customerId, userId],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, return defaults
          return {
            ...DEFAULT_PREFERENCES,
            user_id: userId,
            customer_id: customerId,
          } as NotificationPreferences;
        }
        throw error;
      }

      return data as NotificationPreferences;
    },
    enabled: !!customerId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export type UpdateNotificationPreferencesPayload = {
  userId: string;
  push_enabled?: boolean;
  email_enabled?: boolean;
  sms_enabled?: boolean;
  assignments_enabled?: boolean;
  tests_enabled?: boolean;
  doubts_enabled?: boolean;
  schedule_enabled?: boolean;
  announcements_enabled?: boolean;
  promotions_enabled?: boolean;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
};

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateNotificationPreferencesPayload) => {
      const supabase = getSupabaseClient();
      const { userId, ...updates } = payload;

      // Try to update first
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('notification_preferences')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('customer_id', customerId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: userId,
            customer_id: customerId,
            ...DEFAULT_PREFERENCES,
            ...updates,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', customerId, variables.userId] });
    },
  });
}
