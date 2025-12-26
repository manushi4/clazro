import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type UpdateProfilePayload = {
  userId: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  language?: string;
  theme_mode?: 'system' | 'light' | 'dark';
};

/**
 * Update user profile information
 */
export function useUpdateProfile() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const supabase = getSupabaseClient();
      const { userId, ...updates } = payload;

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[useUpdateProfile] Error:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });
}

/**
 * Update user avatar
 */
export function useUpdateAvatar() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, avatarUrl }: { userId: string; avatarUrl: string }) => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[useUpdateAvatar] Error:', error);
        throw new Error(`Failed to update avatar: ${error.message}`);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', variables.userId] });
    },
  });
}

/**
 * Update user preferences (language, theme)
 */
export function useUpdatePreferences() {
  const customerId = useCustomerId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      language,
      theme_mode
    }: {
      userId: string;
      language?: string;
      theme_mode?: 'system' | 'light' | 'dark';
    }) => {
      const supabase = getSupabaseClient();

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (language !== undefined) updates.language = language;
      if (theme_mode !== undefined) updates.theme_mode = theme_mode;

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('customer_id', customerId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[useUpdatePreferences] Error:', error);
        throw new Error(`Failed to update preferences: ${error.message}`);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', variables.userId] });
    },
  });
}
