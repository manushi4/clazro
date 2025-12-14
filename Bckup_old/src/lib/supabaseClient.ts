/**
 * Supabase Client Utilities
 * Re-exports supabase client and provides error handling
 */

import { supabase } from './supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Re-export supabase client
export { supabase };

/**
 * Handle Supabase errors consistently
 * @param error - Supabase error object
 * @param context - Context string for logging
 */
export function handleSupabaseError(error: PostgrestError, context: string): never {
  console.error(`[Supabase Error - ${context}]:`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });

  throw new Error(`Database error in ${context}: ${error.message}`);
}

/**
 * Check if error is "not found" (PGRST116)
 */
export function isNotFoundError(error: PostgrestError): boolean {
  return error.code === 'PGRST116';
}

export default supabase;
