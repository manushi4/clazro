/**
 * Confirm Dialog Utility - v1.0
 *
 * Production-grade confirmation dialogs for destructive admin actions
 * Part of ADMIN_IMPLEMENTATION_STRATEGY.md Phase 0
 *
 * Features:
 * - Promise-based confirmation (async/await support)
 * - Customizable title, message, and button labels
 * - Destructive action styling (red buttons)
 * - Cancel support
 * - TypeScript strict mode compliance
 *
 * Usage:
 * ```typescript
 * import { confirmDestructiveAction, confirmAction } from '@/utils/confirmDialog';
 *
 * // Destructive action (red styling)
 * const confirmed = await confirmDestructiveAction({
 *   title: 'Delete User',
 *   message: 'Are you sure you want to delete this user? This action cannot be undone.',
 *   confirmText: 'Delete',
 *   cancelText: 'Cancel',
 * });
 *
 * if (confirmed) {
 *   // Proceed with deletion
 *   await deleteUser(userId);
 * }
 *
 * // Regular confirmation
 * const confirmed = await confirmAction({
 *   title: 'Send Notification',
 *   message: 'Send notification to 500 parents?',
 * });
 * ```
 */

import { Alert } from 'react-native';

export interface ConfirmDialogOptions {
  /**
   * Dialog title
   */
  title: string;

  /**
   * Dialog message/body text
   */
  message: string;

  /**
   * Text for confirm button
   * @default "Confirm"
   */
  confirmText?: string;

  /**
   * Text for cancel button
   * @default "Cancel"
   */
  cancelText?: string;

  /**
   * Whether this is a destructive action (affects button styling)
   * @default false
   */
  destructive?: boolean;
}

/**
 * Show confirmation dialog and return user's choice
 *
 * @param options - Dialog configuration
 * @returns Promise that resolves to true if confirmed, false if cancelled
 */
export function showConfirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  const {
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    destructive = false,
  } = options;

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText,
          style: 'cancel',
          onPress: () => {
            console.log(`❌ [Confirm] User cancelled: ${title}`);
            resolve(false);
          },
        },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => {
            console.log(`✅ [Confirm] User confirmed: ${title}`);
            resolve(true);
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          console.log(`❌ [Confirm] Dialog dismissed: ${title}`);
          resolve(false);
        },
      }
    );
  });
}

/**
 * Convenience wrapper for destructive actions (delete, suspend, etc.)
 *
 * @param options - Dialog configuration (destructive=true by default)
 * @returns Promise that resolves to true if confirmed, false if cancelled
 */
export async function confirmDestructiveAction(
  options: Omit<ConfirmDialogOptions, 'destructive'>
): Promise<boolean> {
  return showConfirmDialog({
    ...options,
    destructive: true,
  });
}

/**
 * Convenience wrapper for regular actions (send notification, export data, etc.)
 *
 * @param options - Dialog configuration (destructive=false by default)
 * @returns Promise that resolves to true if confirmed, false if cancelled
 */
export async function confirmAction(
  options: Omit<ConfirmDialogOptions, 'destructive'>
): Promise<boolean> {
  return showConfirmDialog({
    ...options,
    destructive: false,
  });
}

/**
 * Pre-configured confirmation dialogs for common admin actions
 */
export const CommonConfirmations = {
  /**
   * Confirm user deletion
   */
  deleteUser: (userName: string) =>
    confirmDestructiveAction({
      title: 'Delete User',
      message: `Are you sure you want to permanently delete ${userName}? This action cannot be undone.`,
      confirmText: 'Delete',
    }),

  /**
   * Confirm user suspension
   */
  suspendUser: (userName: string) =>
    confirmDestructiveAction({
      title: 'Suspend User',
      message: `Suspend ${userName}'s account? They will not be able to log in until unsuspended.`,
      confirmText: 'Suspend',
    }),

  /**
   * Confirm unsuspend user
   */
  unsuspendUser: (userName: string) =>
    confirmAction({
      title: 'Unsuspend User',
      message: `Restore access for ${userName}?`,
      confirmText: 'Unsuspend',
    }),

  /**
   * Confirm password reset
   */
  resetPassword: (userName: string) =>
    confirmAction({
      title: 'Reset Password',
      message: `Send password reset email to ${userName}?`,
      confirmText: 'Send Email',
    }),

  /**
   * Confirm role change
   */
  changeRole: (userName: string, newRole: string) =>
    confirmAction({
      title: 'Change User Role',
      message: `Change ${userName}'s role to ${newRole}?`,
      confirmText: 'Change Role',
    }),

  /**
   * Confirm branch deletion
   */
  deleteBranch: (branchName: string) =>
    confirmDestructiveAction({
      title: 'Delete Branch',
      message: `Delete ${branchName}? All associated data will be archived.`,
      confirmText: 'Delete',
    }),

  /**
   * Confirm bulk notification
   */
  sendBulkNotification: (recipientCount: number) =>
    confirmAction({
      title: 'Send Notification',
      message: `Send notification to ${recipientCount} recipients?`,
      confirmText: 'Send',
    }),

  /**
   * Confirm data export
   */
  exportData: (dataType: string) =>
    confirmAction({
      title: 'Export Data',
      message: `Export ${dataType} to CSV? This may take a few moments.`,
      confirmText: 'Export',
    }),

  /**
   * Confirm fee waiver approval
   */
  approveFeeWaiver: (amount: number) =>
    confirmAction({
      title: 'Approve Fee Waiver',
      message: `Approve fee waiver of ₹${amount}?`,
      confirmText: 'Approve',
    }),

  /**
   * Confirm fee waiver rejection
   */
  rejectFeeWaiver: () =>
    confirmDestructiveAction({
      title: 'Reject Fee Waiver',
      message: 'Reject this fee waiver request?',
      confirmText: 'Reject',
    }),

  /**
   * Confirm payment refund
   */
  refundPayment: (amount: number) =>
    confirmDestructiveAction({
      title: 'Process Refund',
      message: `Refund ₹${amount}? This action cannot be undone.`,
      confirmText: 'Refund',
    }),

  /**
   * Confirm ticket escalation
   */
  escalateTicket: () =>
    confirmAction({
      title: 'Escalate Ticket',
      message: 'Escalate this support ticket to higher priority?',
      confirmText: 'Escalate',
    }),

  /**
   * Confirm ticket resolution
   */
  resolveTicket: () =>
    confirmAction({
      title: 'Resolve Ticket',
      message: 'Mark this support ticket as resolved?',
      confirmText: 'Resolve',
    }),

  /**
   * Confirm maintenance mode
   */
  enableMaintenanceMode: () =>
    confirmDestructiveAction({
      title: 'Enable Maintenance Mode',
      message: 'Enable maintenance mode? All users will be logged out.',
      confirmText: 'Enable',
    }),
};
