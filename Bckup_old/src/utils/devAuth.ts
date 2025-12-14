/**
 * Development Authentication Helper
 * Auto-login for testing without going through login flow
 * ⚠️ FOR DEVELOPMENT ONLY - REMOVE IN PRODUCTION
 */

import { supabase } from '../lib/supabase';

/**
 * Auto-login as test user for development
 * This bypasses login screen and sets up proper auth session
 * @param role - 'admin' or 'parent' (defaults to 'admin' for testing)
 */
export const devAutoLogin = async (role: 'admin' | 'parent' = 'admin'): Promise<boolean> => {
  try {
    console.log(`🔐 [DevAuth] Attempting auto-login as ${role}...`);

    // Check if already logged in
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      console.log('✅ [DevAuth] Already logged in:', session.user.email);
      return true;
    }

    // Determine credentials based on role
    const credentials = role === 'admin'
      ? {
          email: 'admin@manushi.com',
          password: 'Admin123!', // Change this to your actual admin password
        }
      : {
          email: 'test.parent@example.com',
          password: 'TestParent123!', // Change this to your actual test password
        };

    // Try to sign in with credentials
    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error) {
      console.error(`❌ [DevAuth] Auto-login failed:`, error.message);
      console.log(`💡 [DevAuth] Please create test ${role}: ${credentials.email}`);
      console.log(`💡 [DevAuth] Or update credentials in src/utils/devAuth.ts`);
      return false;
    }

    console.log(`✅ [DevAuth] Auto-login successful as ${role}:`, data.user.email);
    console.log('👤 [DevAuth] User ID:', data.user.id);

    return true;
  } catch (err) {
    console.error('❌ [DevAuth] Exception:', err);
    return false;
  }
};

/**
 * Set auth session manually using the test parent ID
 * This creates a mock session for testing RLS policies
 */
export const devSetMockSession = async (): Promise<void> => {
  try {
    console.log('🔧 [DevAuth] Setting mock session for testing...');

    // Note: This won't actually work for RLS because Supabase validates JWT tokens
    // We need real authentication or service role key
    console.warn('⚠️ [DevAuth] Mock sessions don\'t bypass RLS - use real login');
  } catch (err) {
    console.error('❌ [DevAuth] Failed to set mock session:', err);
  }
};
