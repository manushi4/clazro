/**
 * Supabase Client Configuration for React Native
 *
 * This module initializes and configures the Supabase client for use in React Native applications.
 * It includes AsyncStorage integration for session persistence and proper error handling.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/env.config';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase credentials not found in .env file!');
  console.error('Expected SUPABASE_URL and SUPABASE_ANON_KEY');
} else {
  console.log('✅ Supabase client initialized');
  console.log('📡 URL:', SUPABASE_URL);
}

/**
 * Supabase client instance configured for React Native
 * Uses AsyncStorage for session persistence across app restarts
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native
  },
  global: {
    headers: {
      'X-Client-Info': `react-native-${Platform.OS}`,
    },
  },
});

/**
 * Authentication helper functions
 */
export const authHelpers = {
  /**
   * Get the current authenticated user
   * @returns Promise with user data or null
   */
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  /**
   * Get the current session
   * @returns Promise with session data or null
   */
  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  /**
   * Sign in with email and password
   * @param email - User email
   * @param password - User password
   * @returns Promise with session data
   */
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Sign up with email and password
   * @param email - User email
   * @param password - User password
   * @param metadata - Additional user metadata
   * @returns Promise with session data
   */
  signUp: async (email: string, password: string, metadata?: Record<string, any>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Sign out the current user
   * @returns Promise
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Send password reset email
   * @param email - User email
   * @returns Promise
   */
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  /**
   * Update user password
   * @param newPassword - New password
   * @returns Promise
   */
  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },

  /**
   * Listen to authentication state changes
   * @param callback - Function to call on auth state change
   * @returns Unsubscribe function
   */
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  },
};

/**
 * Database helper functions
 */
export const dbHelpers = {
  /**
   * Check if the database connection is healthy
   * @returns Promise<boolean>
   */
  checkConnection: async (): Promise<boolean> => {
    try {
      const { error } = await supabase.from('parents').select('count', { count: 'exact', head: true });
      return !error;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  },

  /**
   * Get the current user's parent ID
   * @returns Promise with parent_id or null
   */
  getCurrentParentId: async (): Promise<string | null> => {
    try {
      const user = await authHelpers.getCurrentUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('parents')
        .select('parent_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data?.parent_id || null;
    } catch (error) {
      console.error('Error getting parent ID:', error);
      return null;
    }
  },
};

/**
 * Storage helper functions
 */
export const storageHelpers = {
  /**
   * Upload a file to Supabase storage
   * @param bucket - Storage bucket name
   * @param path - File path in bucket
   * @param file - File to upload
   * @returns Promise with file URL
   */
  uploadFile: async (bucket: string, path: string, file: Blob | File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return data;
  },

  /**
   * Get public URL for a file
   * @param bucket - Storage bucket name
   * @param path - File path in bucket
   * @returns Public URL string
   */
  getPublicUrl: (bucket: string, path: string): string => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Delete a file from storage
   * @param bucket - Storage bucket name
   * @param path - File path in bucket
   * @returns Promise
   */
  deleteFile: async (bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  },
};

export default supabase;
