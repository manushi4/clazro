/**
 * usePasswordReset - Password Reset Mutation Hook
 *
 * Handles password reset request via Supabase Auth
 * Sends a password reset email to the specified address
 */

import { useMutation } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { addBreadcrumb, captureException } from "../../../error/errorReporting";

// =============================================================================
// TYPES
// =============================================================================

export type PasswordResetInput = {
  email: string;
};

export type PasswordResetResult = {
  success: boolean;
  message: string;
};

// =============================================================================
// MUTATION FUNCTION
// =============================================================================

async function requestPasswordReset(
  input: PasswordResetInput
): Promise<PasswordResetResult> {
  const supabase = getSupabaseClient();

  addBreadcrumb({
    category: "auth",
    message: "Password reset requested",
    level: "info",
    data: { email: input.email },
  });

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      // Redirect URL after password reset (configure in Supabase dashboard)
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
    });

    if (error) {
      // Don't expose whether email exists for security
      // Always return success to prevent email enumeration
      if (error.message.includes("rate limit")) {
        throw new Error("Too many requests. Please try again later.");
      }
      
      // Log the actual error but return generic success
      addBreadcrumb({
        category: "auth",
        message: "Password reset error (hidden from user)",
        level: "warning",
        data: { error: error.message },
      });
    }

    // Always return success to prevent email enumeration attacks
    return {
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
    };
  } catch (error: any) {
    captureException(error, {
      tags: { action: "password_reset" },
      extra: { email: input.email },
    });

    // Re-throw rate limit errors
    if (error.message.includes("rate limit") || error.message.includes("Too many")) {
      throw error;
    }

    // For other errors, still return success to prevent enumeration
    return {
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
    };
  }
}

// =============================================================================
// HOOK
// =============================================================================

export function usePasswordReset() {
  return useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (data) => {
      addBreadcrumb({
        category: "auth",
        message: "Password reset email sent",
        level: "info",
      });
    },
    onError: (error: Error) => {
      addBreadcrumb({
        category: "auth",
        message: "Password reset failed",
        level: "error",
        data: { error: error.message },
      });
    },
  });
}

export default usePasswordReset;
