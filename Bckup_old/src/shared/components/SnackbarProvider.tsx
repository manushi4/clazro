/**
 * Snackbar Provider - Global Toast Notifications
 *
 * Centralized snackbar system for success/error/info messages
 * - Consistent UX across the app
 * - Auto-dismiss with configurable duration
 * - Action buttons support
 * - Queuing for multiple messages
 *
 * Usage:
 * ```tsx
 * const { showSuccess, showError, showInfo } = useSnackbar();
 *
 * // Success message
 * showSuccess('User suspended successfully');
 *
 * // Error with details
 * showError('Failed to delete user', 'User has active dependencies');
 *
 * // With action button
 * showInfo('Changes saved', {
 *   action: { label: 'Undo', onPress: handleUndo }
 * });
 * ```
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar } from 'react-native-paper';
import { StyleSheet } from 'react-native';

type SnackbarType = 'success' | 'error' | 'info' | 'warning';

interface SnackbarOptions {
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface SnackbarMessage {
  id: string;
  type: SnackbarType;
  message: string;
  details?: string;
  options?: SnackbarOptions;
}

interface SnackbarContextType {
  showSuccess: (message: string, options?: SnackbarOptions) => void;
  showError: (message: string, details?: string, options?: SnackbarOptions) => void;
  showInfo: (message: string, options?: SnackbarOptions) => void;
  showWarning: (message: string, options?: SnackbarOptions) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return context;
};

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<SnackbarMessage[]>([]);
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<SnackbarMessage | null>(null);

  const show = useCallback(
    (type: SnackbarType, message: string, details?: string, options?: SnackbarOptions) => {
      const id = Date.now().toString() + Math.random().toString(36);
      const newMessage: SnackbarMessage = {
        id,
        type,
        message,
        ...(details !== undefined && { details }),
        ...(options !== undefined && { options }),
      };

      setQueue((prev) => [...prev, newMessage]);
    },
    []
  );

  const showSuccess = useCallback(
    (message: string, options?: SnackbarOptions) => {
      show('success', message, undefined, options);
    },
    [show]
  );

  const showError = useCallback(
    (message: string, details?: string, options?: SnackbarOptions) => {
      show('error', message, details, options);
    },
    [show]
  );

  const showInfo = useCallback(
    (message: string, options?: SnackbarOptions) => {
      show('info', message, undefined, options);
    },
    [show]
  );

  const showWarning = useCallback(
    (message: string, options?: SnackbarOptions) => {
      show('warning', message, undefined, options);
    },
    [show]
  );

  // Process queue
  React.useEffect(() => {
    if (queue.length > 0 && !visible && !current) {
      const next = queue[0];
      if (next) {
        setCurrent(next);
        setVisible(true);
        setQueue((prev) => prev.slice(1));
      }
    }
  }, [queue, visible, current]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    // Clear current after animation completes
    setTimeout(() => setCurrent(null), 200);
  }, []);

  const getBackgroundColor = () => {
    if (!current) return undefined;

    switch (current.type) {
      case 'success':
        return '#4CAF50'; // Material Design success green
      case 'error':
        return '#B00020'; // Material Design error red
      case 'warning':
        return '#F57C00'; // Material Design warning orange
      case 'info':
      default:
        return '#2196F3'; // Material Design info blue
    }
  };

  const getMessage = () => {
    if (!current) return '';
    return current.details ? `${current.message}\n${current.details}` : current.message;
  };

  const duration = current?.options?.duration || 4000;
  const backgroundColor = getBackgroundColor();

  return (
    <SnackbarContext.Provider value={{ showSuccess, showError, showInfo, showWarning }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={handleDismiss}
        duration={duration}
        {...(current?.options?.action ? { action: current.options.action } : {})}
        style={[styles.snackbar, backgroundColor ? { backgroundColor } : {}]}
      >
        {getMessage()}
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 16,
  },
});

/**
 * Hook for common admin action feedback
 */
export const useAdminFeedback = () => {
  const { showSuccess, showError } = useSnackbar();

  const userSuspended = useCallback(
    (userName: string) => showSuccess(`${userName} has been suspended`),
    [showSuccess]
  );

  const userUnsuspended = useCallback(
    (userName: string) => showSuccess(`${userName}'s access has been restored`),
    [showSuccess]
  );

  const userDeleted = useCallback(
    (userName: string) => showSuccess(`${userName} has been deleted`),
    [showSuccess]
  );

  const passwordResetSent = useCallback(
    (userEmail: string) => showSuccess(`Password reset email sent to ${userEmail}`),
    [showSuccess]
  );

  const roleChanged = useCallback(
    (userName: string, newRole: string) =>
      showSuccess(`${userName}'s role changed to ${newRole}`),
    [showSuccess]
  );

  const actionFailed = useCallback(
    (action: string, error?: string) => {
      showError(`Failed to ${action}`, error);
    },
    [showError]
  );

  const csvExported = useCallback(
    (fileName: string) => showSuccess(`${fileName} exported successfully`),
    [showSuccess]
  );

  return {
    userSuspended,
    userUnsuspended,
    userDeleted,
    passwordResetSent,
    roleChanged,
    actionFailed,
    csvExported,
  };
};
