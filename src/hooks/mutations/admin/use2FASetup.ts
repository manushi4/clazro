/**
 * use2FASetup - Two-Factor Authentication Setup Hook
 * Sprint 1 - Admin Phase 1
 *
 * Handles 2FA setup flow:
 * 1. Generate TOTP secret and QR code URL
 * 2. Verify TOTP code from authenticator app
 * 3. Store secret and enable 2FA for user
 * 4. Generate backup codes
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { addBreadcrumb, captureException } from '../../../error/errorReporting';

// =============================================================================
// TYPES
// =============================================================================

type Setup2FAResponse = {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
};

type Verify2FAParams = {
  userId: string;
  code: string;
  secret: string;
};

type Verify2FAResponse = {
  success: boolean;
  backupCodes: string[];
};

type Disable2FAParams = {
  userId: string;
  code: string;
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate a random base32 secret for TOTP
 * In production, use a proper TOTP library like 'otplib'
 */
function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 16; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

/**
 * Generate backup codes for account recovery
 */
function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase() +
                 '-' +
                 Math.random().toString(36).substring(2, 6).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Generate QR code URL for authenticator apps
 */
function generateQRCodeUrl(secret: string, email: string, issuer: string): string {
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
}

/**
 * Verify TOTP code (mock implementation)
 * In production, use 'otplib' to verify: authenticator.verify({ token, secret })
 */
function verifyTOTPCode(code: string, secret: string): boolean {
  // Mock verification - accepts any 6-digit code for demo
  // In production: return authenticator.verify({ token: code, secret });
  return code.length === 6 && /^\d+$/.test(code);
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to generate 2FA setup (secret + QR code)
 */
export const useGenerate2FA = () => {
  return useMutation<Setup2FAResponse, Error, { userId: string; email: string; appName: string }>({
    mutationFn: async ({ userId, email, appName }) => {
      addBreadcrumb({
        category: '2fa',
        message: '2FA setup initiated',
        level: 'info',
        data: { userId },
      });

      // Generate secret
      const secret = generateTOTPSecret();
      const qrCodeUrl = generateQRCodeUrl(secret, email, appName);
      const backupCodes = generateBackupCodes(8);

      // Store pending secret (not enabled yet)
      const { error } = await supabase
        .from('admin_users')
        .upsert({
          user_id: userId,
          two_factor_secret: secret,
          two_factor_enabled: false,
          two_factor_backup_codes: backupCodes,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        addBreadcrumb({
          category: '2fa',
          message: '2FA secret storage failed',
          level: 'error',
          data: { error: error.message },
        });
        throw new Error('Failed to initialize 2FA setup');
      }

      return { secret, qrCodeUrl, backupCodes };
    },
    onError: (error) => {
      captureException(error, {
        tags: { action: '2fa_generate' },
      });
    },
  });
};

/**
 * Hook to verify 2FA code and enable 2FA
 */
export const useVerify2FA = () => {
  const queryClient = useQueryClient();

  return useMutation<Verify2FAResponse, Error, Verify2FAParams>({
    mutationFn: async ({ userId, code, secret }) => {
      addBreadcrumb({
        category: '2fa',
        message: '2FA verification attempt',
        level: 'info',
        data: { userId },
      });

      // Verify the TOTP code
      const isValid = verifyTOTPCode(code, secret);

      if (!isValid) {
        addBreadcrumb({
          category: '2fa',
          message: '2FA verification failed - invalid code',
          level: 'warning',
          data: { userId },
        });
        throw new Error('Invalid verification code');
      }

      // Enable 2FA in database
      const { data, error } = await supabase
        .from('admin_users')
        .update({
          two_factor_enabled: true,
          two_factor_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select('two_factor_backup_codes')
        .single();

      if (error) {
        addBreadcrumb({
          category: '2fa',
          message: '2FA enable failed',
          level: 'error',
          data: { error: error.message },
        });
        throw new Error('Failed to enable 2FA');
      }

      // Log to audit
      try {
        await supabase.from('audit_logs').insert({
          action: '2fa_enabled',
          entity_type: 'admin_user',
          entity_id: userId,
          details: { enabled_at: new Date().toISOString() },
          performed_by: userId,
        });
      } catch (auditError) {
        console.warn('Failed to log 2FA audit:', auditError);
      }

      addBreadcrumb({
        category: '2fa',
        message: '2FA enabled successfully',
        level: 'info',
        data: { userId },
      });

      return {
        success: true,
        backupCodes: data?.two_factor_backup_codes || [],
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'profile'] });
    },
    onError: (error) => {
      captureException(error, {
        tags: { action: '2fa_verify' },
      });
    },
  });
};

/**
 * Hook to disable 2FA (requires valid code)
 */
export const useDisable2FA = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, Disable2FAParams>({
    mutationFn: async ({ userId, code }) => {
      addBreadcrumb({
        category: '2fa',
        message: '2FA disable attempt',
        level: 'info',
        data: { userId },
      });

      // Get current secret to verify code
      const { data: adminUser, error: fetchError } = await supabase
        .from('admin_users')
        .select('two_factor_secret')
        .eq('user_id', userId)
        .single();

      if (fetchError || !adminUser?.two_factor_secret) {
        throw new Error('2FA is not enabled for this account');
      }

      // Verify the code before disabling
      const isValid = verifyTOTPCode(code, adminUser.two_factor_secret);

      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Disable 2FA
      const { error } = await supabase
        .from('admin_users')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          two_factor_backup_codes: null,
          two_factor_verified_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        throw new Error('Failed to disable 2FA');
      }

      // Log to audit
      try {
        await supabase.from('audit_logs').insert({
          action: '2fa_disabled',
          entity_type: 'admin_user',
          entity_id: userId,
          details: { disabled_at: new Date().toISOString() },
          performed_by: userId,
        });
      } catch (auditError) {
        console.warn('Failed to log 2FA audit:', auditError);
      }

      addBreadcrumb({
        category: '2fa',
        message: '2FA disabled successfully',
        level: 'info',
        data: { userId },
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'profile'] });
    },
    onError: (error) => {
      captureException(error, {
        tags: { action: '2fa_disable' },
      });
    },
  });
};

/**
 * Hook to verify 2FA code during login
 */
export const useVerify2FALogin = () => {
  return useMutation<{ success: boolean }, Error, { userId: string; code: string }>({
    mutationFn: async ({ userId, code }) => {
      addBreadcrumb({
        category: '2fa',
        message: '2FA login verification',
        level: 'info',
        data: { userId },
      });

      // Get secret
      const { data: adminUser, error: fetchError } = await supabase
        .from('admin_users')
        .select('two_factor_secret, two_factor_backup_codes')
        .eq('user_id', userId)
        .single();

      if (fetchError || !adminUser?.two_factor_secret) {
        throw new Error('2FA is not configured');
      }

      // Check if it's a backup code
      const backupCodes = adminUser.two_factor_backup_codes || [];
      const isBackupCode = backupCodes.includes(code);

      if (isBackupCode) {
        // Remove used backup code
        const updatedCodes = backupCodes.filter((c: string) => c !== code);
        await supabase
          .from('admin_users')
          .update({ two_factor_backup_codes: updatedCodes })
          .eq('user_id', userId);

        return { success: true };
      }

      // Verify TOTP code
      const isValid = verifyTOTPCode(code, adminUser.two_factor_secret);

      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_2fa_at: new Date().toISOString() })
        .eq('user_id', userId);

      return { success: true };
    },
    onError: (error) => {
      captureException(error, {
        tags: { action: '2fa_login_verify' },
      });
    },
  });
};

export default {
  useGenerate2FA,
  useVerify2FA,
  useDisable2FA,
  useVerify2FALogin,
};
