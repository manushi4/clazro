/**
 * Snackbar Utility - v1.0
 *
 * Production-grade toast/snackbar notifications for admin actions
 * Part of ADMIN_IMPLEMENTATION_STRATEGY.md Phase 0
 *
 * Features:
 * - Success, error, warning, and info notifications
 * - Customizable duration
 * - Action button support
 * - Queue management (show one at a time)
 * - TypeScript strict mode compliance
 *
 * Usage:
 * ```typescript
 * import { showSuccess, showError, showWarning, showInfo } from '@/utils/snackbar';
 *
 * // Success notification
 * showSuccess('User deleted successfully');
 *
 * // Error notification
 * showError('Failed to delete user');
 *
 * // With custom duration
 * showSuccess('Password reset email sent', 5000);
 *
 * // With action button
 * showSuccess('User suspended', 4000, {
 *   label: 'Undo',
 *   onPress: () => unsuspendUser(userId),
 * });
 * ```
 */

import { Alert, ToastAndroid, Platform } from 'react-native';

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarAction {
  label: string;
  onPress: () => void;
}

export interface SnackbarOptions {
  /**
   * Message to display
   */
  message: string;

  /**
   * Type of notification (affects styling)
   */
  type: SnackbarType;

  /**
   * Duration in milliseconds
   * @default 3000
   */
  duration?: number;

  /**
   * Optional action button
   */
  action?: SnackbarAction;
}

/**
 * Message queue for managing multiple snackbars
 */
const messageQueue: SnackbarOptions[] = [];
let isShowingMessage = false;

/**
 * Process the next message in the queue
 */
function processQueue() {
  if (isShowingMessage || messageQueue.length === 0) {
    return;
  }

  const nextMessage = messageQueue.shift();
  if (nextMessage) {
    isShowingMessage = true;
    showSnackbarInternal(nextMessage);

    // Reset after duration
    setTimeout(() => {
      isShowingMessage = false;
      processQueue();
    }, nextMessage.duration || 3000);
  }
}

/**
 * Internal function to show snackbar
 * Uses ToastAndroid on Android, Alert on iOS
 */
function showSnackbarInternal(options: SnackbarOptions) {
  const { message, type, duration = 3000, action } = options;

  // Add emoji prefix based on type
  const emoji = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }[type];

  const prefixedMessage = `${emoji} ${message}`;

  console.log(`[Snackbar] ${type.toUpperCase()}: ${message}`);

  if (Platform.OS === 'android') {
    // Use ToastAndroid on Android
    const toastDuration = duration > 3000 ? ToastAndroid.LONG : ToastAndroid.SHORT;
    ToastAndroid.show(prefixedMessage, toastDuration);

    // If there's an action, show it as a button alert
    if (action) {
      setTimeout(() => {
        Alert.alert(
          'Action Available',
          message,
          [
            {
              text: 'Dismiss',
              style: 'cancel',
            },
            {
              text: action.label,
              onPress: action.onPress,
            },
          ]
        );
      }, 100);
    }
  } else {
    // Use Alert on iOS (simpler, but works)
    Alert.alert(
      emoji,
      message,
      action
        ? [
            {
              text: 'Dismiss',
              style: 'cancel',
            },
            {
              text: action.label,
              onPress: action.onPress,
            },
          ]
        : [
            {
              text: 'OK',
              style: 'default',
            },
          ],
      { cancelable: true }
    );
  }
}

/**
 * Show snackbar with custom options
 */
export function showSnackbar(options: SnackbarOptions) {
  messageQueue.push(options);
  processQueue();
}

/**
 * Show success snackbar
 *
 * @param message - Success message to display
 * @param duration - Duration in milliseconds (default: 3000)
 * @param action - Optional action button
 */
export function showSuccess(
  message: string,
  duration?: number,
  action?: SnackbarAction
) {
  showSnackbar({
    message,
    type: 'success',
    duration,
    action,
  });
}

/**
 * Show error snackbar
 *
 * @param message - Error message to display
 * @param duration - Duration in milliseconds (default: 4000)
 * @param action - Optional action button
 */
export function showError(
  message: string,
  duration?: number,
  action?: SnackbarAction
) {
  showSnackbar({
    message,
    type: 'error',
    duration: duration || 4000, // Errors show longer by default
    action,
  });
}

/**
 * Show warning snackbar
 *
 * @param message - Warning message to display
 * @param duration - Duration in milliseconds (default: 3000)
 * @param action - Optional action button
 */
export function showWarning(
  message: string,
  duration?: number,
  action?: SnackbarAction
) {
  showSnackbar({
    message,
    type: 'warning',
    duration,
    action,
  });
}

/**
 * Show info snackbar
 *
 * @param message - Info message to display
 * @param duration - Duration in milliseconds (default: 3000)
 * @param action - Optional action button
 */
export function showInfo(
  message: string,
  duration?: number,
  action?: SnackbarAction
) {
  showSnackbar({
    message,
    type: 'info',
    duration,
    action,
  });
}

/**
 * Pre-configured snackbar messages for common admin actions
 */
export const CommonSnackbars = {
  // User Management
  userDeleted: () => showSuccess('User deleted successfully'),
  userSuspended: () => showSuccess('User suspended'),
  userUnsuspended: () => showSuccess('User unsuspended'),
  passwordResetSent: () => showSuccess('Password reset email sent'),
  roleChanged: () => showSuccess('User role updated'),

  // Branch Management
  branchCreated: () => showSuccess('Branch created successfully'),
  branchUpdated: () => showSuccess('Branch updated'),
  branchDeleted: () => showSuccess('Branch deleted'),

  // Financial Operations
  feeWaiverApproved: () => showSuccess('Fee waiver approved'),
  feeWaiverRejected: () => showSuccess('Fee waiver rejected'),
  refundProcessed: () => showSuccess('Refund processed successfully'),

  // Notifications
  notificationSent: (count: number) => showSuccess(`Notification sent to ${count} recipients`),
  announcementCreated: () => showSuccess('Announcement created'),
  announcementDeleted: () => showSuccess('Announcement deleted'),

  // Support
  ticketAssigned: () => showSuccess('Ticket assigned'),
  ticketEscalated: () => showSuccess('Ticket escalated'),
  ticketResolved: () => showSuccess('Ticket resolved'),

  // System
  settingsSaved: () => showSuccess('Settings saved'),
  featureToggled: () => showSuccess('Feature flag updated'),
  dataExported: () => showSuccess('Data exported successfully'),

  // Errors
  operationFailed: () => showError('Operation failed. Please try again.'),
  networkError: () => showError('Network error. Check your connection.'),
  permissionDenied: () => showError('Permission denied'),
  validationError: (field: string) => showError(`Invalid ${field}`),

  // Warnings
  unsavedChanges: () => showWarning('You have unsaved changes'),
  maintenanceMode: () => showWarning('System is in maintenance mode'),
  lowPermissions: () => showWarning('Some features are restricted'),
};
