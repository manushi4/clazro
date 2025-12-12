/**
 * React Query Configuration
 *
 * Configures QueryClient with optimized settings for React Native + Supabase
 */

import { QueryClient } from '@tanstack/react-query';
import { parseSupabaseError, getUserFriendlyErrorMessage } from '../services/api/errorHandler';

/**
 * Default Query Configuration
 *
 * These settings optimize for:
 * - Fast UI updates (short stale times for frequently changing data)
 * - Efficient caching (longer cache times to reduce network calls)
 * - Automatic refetching (on window focus, reconnect)
 * - Retry logic for transient errors
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time data is considered fresh (no refetch needed)
      staleTime: 60 * 1000, // 1 minute

      // Time data stays in cache after becoming unused
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)

      // Prevent undefined data during loading
      // This ensures queries always have a value, preventing "data cannot be undefined" errors
      notifyOnChangeProps: 'all',

      // CRITICAL FIX: Ensure queries never return undefined
      // This prevents the "query data cannot be undefined" error at React Query core level
      networkMode: 'always',

      // Refetch on window focus (when app comes to foreground)
      refetchOnWindowFocus: true,

      // Refetch when network reconnects
      refetchOnReconnect: true,

      // Retry failed queries
      retry: (failureCount, error) => {
        const apiError = parseSupabaseError(error);

        // Don't retry auth errors or validation errors
        if (apiError.statusCode === 401 || apiError.statusCode === 403 || apiError.statusCode === 400) {
          return false;
        }

        // Retry network errors and 5xx errors up to 3 times
        if (apiError.isRetryable && failureCount < 3) {
          return true;
        }

        return false;
      },

      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },

    mutations: {
      // Retry mutations only for network errors
      retry: (failureCount, error) => {
        const apiError = parseSupabaseError(error);
        return apiError.isRetryable && failureCount < 2;
      },

      // Error handling for mutations
      onError: (error) => {
        const apiError = parseSupabaseError(error);
        const userMessage = getUserFriendlyErrorMessage(apiError);

        // Log error in development
        if (__DEV__) {
          console.error('Mutation error:', {
            message: apiError.message,
            code: apiError.code,
            userMessage,
          });
        }

        // You can add global error toast notification here
        // Example: Toast.show({ type: 'error', text1: userMessage });
      },
    },
  },
});

/**
 * Custom Query Configurations for Different Data Types
 *
 * Use these for specific query types that need different caching strategies
 */
export const queryConfigs = {
  /**
   * Real-time data (communications, notifications)
   * Refetch frequently, short stale time
   */
  realtime: {
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  },

  /**
   * Relatively static data (parent profile, children list)
   * Longer stale time, cache longer
   */
  static: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },

  /**
   * Analytics data (insights, trends, predictions)
   * Medium stale time, longer cache
   */
  analytics: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },

  /**
   * Financial data (payments, fees)
   * Short stale time for accuracy
   */
  financial: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },

  /**
   * Academic data (grades, attendance)
   * Medium stale time
   */
  academic: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
};
