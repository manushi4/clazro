/**
 * Push Notifications Hook
 * 
 * Provides React hooks for push notification management.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient, DEMO_CUSTOMER_ID } from '../lib/supabaseClient';
import { useDemoUser } from './useDemoUser';
import {
  initPushNotifications,
  requestPermission,
  checkPermission,
  setNavigationCallback,
  subscribeToTopic,
  unsubscribeFromTopic,
  unregisterToken,
  getToken,
} from '../services/notifications/pushService';

export type Notification = {
  id: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  notification_type: string;
  category: string;
  is_read: boolean;
  read_at: string | null;
  sent_at: string;
  image_url: string | null;
  action_url: string | null;
};

export type NotificationPreferences = {
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
  quiet_hours_start: string;
  quiet_hours_end: string;
};

/**
 * Hook to initialize and manage push notifications
 */
export const usePushNotifications = () => {
  const { userId } = useDemoUser();
  const navigation = useNavigation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Set up navigation callback for deep linking
  useEffect(() => {
    setNavigationCallback((screen, params) => {
      try {
        // @ts-ignore - dynamic navigation
        navigation.navigate(screen, params);
      } catch (error) {
        console.warn('[usePushNotifications] Navigation failed:', screen, error);
      }
    });
  }, [navigation]);

  // Initialize push notifications
  useEffect(() => {
    const init = async () => {
      if (!userId || isInitialized) return;

      try {
        await initPushNotifications(userId);
        const permission = await checkPermission();
        setHasPermission(permission);
        
        if (permission) {
          const fcmToken = await getToken();
          setToken(fcmToken);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('[usePushNotifications] Init failed:', error);
      }
    };

    init();
  }, [userId, isInitialized]);

  // Request permission manually
  const requestNotificationPermission = useCallback(async () => {
    const granted = await requestPermission();
    setHasPermission(granted);
    
    if (granted && userId) {
      const fcmToken = await getToken();
      setToken(fcmToken);
    }
    
    return granted;
  }, [userId]);

  // Subscribe to customer topic
  const subscribeToCustomer = useCallback(async () => {
    await subscribeToTopic(`customer_${DEMO_CUSTOMER_ID}`);
  }, []);

  // Unsubscribe on logout
  const cleanup = useCallback(async () => {
    if (userId && token) {
      await unregisterToken(userId, token);
    }
    await unsubscribeFromTopic(`customer_${DEMO_CUSTOMER_ID}`);
  }, [userId, token]);

  return {
    isInitialized,
    hasPermission,
    token,
    requestPermission: requestNotificationPermission,
    subscribeToCustomer,
    cleanup,
  };
};

/**
 * Hook to fetch user notifications
 */
export const useNotifications = (limit: number = 50) => {
  const { userId } = useDemoUser();

  return useQuery({
    queryKey: ['notifications', userId, limit],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Hook to get unread notification count
 */
export const useUnreadCount = () => {
  const { userId } = useDemoUser();

  return useQuery({
    queryKey: ['notifications-unread-count', userId],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Hook to mark notification as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const { userId } = useDemoUser();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', userId] });
    },
  });
};

/**
 * Hook to mark all notifications as read
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const { userId } = useDemoUser();

  return useMutation({
    mutationFn: async () => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', userId] });
    },
  });
};

/**
 * Hook to manage notification preferences
 */
export const useNotificationPreferences = () => {
  const { userId } = useDemoUser();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data as NotificationPreferences | null;
    },
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('notification_preferences').upsert(
        {
          user_id: userId,
          customer_id: DEMO_CUSTOMER_ID,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', userId] });
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updatePreferences: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};

export default usePushNotifications;
