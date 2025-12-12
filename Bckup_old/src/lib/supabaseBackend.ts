/**
 * Supabase Client Configuration
 * Centralized Supabase client for all services
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase URL or Anon Key. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'eduplatform-services',
    },
  },
});

/**
 * Helper function to handle Supabase errors consistently
 */
export function handleSupabaseError(error: any, context: string): never {
  console.error(`Supabase error in ${context}:`, error);

  const errorMessage = error?.message || 'An unknown error occurred';
  const errorCode = error?.code || 'UNKNOWN_ERROR';

  throw new Error(`${context}: ${errorMessage} (Code: ${errorCode})`);
}

/**
 * Type-safe query builder helper
 */
export type SupabaseClient = typeof supabase;

export default supabase;
