/**
 * Confirm Dialog Component
 *
 * Reusable confirmation dialog for destructive actions
 * - Prevents accidental deletions/suspensions
 * - Consistent UX across admin screens
 * - Accessible with proper labels
 *
 * Usage:
 * ```tsx
 * const { showConfirm } = useConfirmDialog();
 *
 * const handleDelete = async () => {
 *   const confirmed = await showConfirm({
 *     title: 'Delete User',
 *     message: 'Are you sure you want to delete this user? This action cannot be undone.',
 *     confirmText: 'Delete',
 *     confirmColor: 'error',
 *   });
 *
 *   if (confirmed) {
 *     // Proceed with deletion
 *   }
 * };
 * ```
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Portal, Dialog, Button, Paragraph } from 'react-native-paper';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'error' | 'warning';
  destructive?: boolean;
}

interface ConfirmDialogContextType {
  showConfirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return context;
};

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const showConfirm = useCallback((opts: ConfirmDialogOptions): Promise<boolean> => {
    setOptions(opts);
    setVisible(true);

    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setVisible(false);
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    setVisible(false);
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const getButtonColor = (): string | undefined => {
    if (!options) return undefined;

    switch (options.confirmColor) {
      case 'error':
        return '#B00020'; // Material Design error color
      case 'warning':
        return '#F57C00'; // Material Design warning color
      case 'primary':
      default:
        return undefined; // Use theme primary
    }
  };

  const buttonColor = getButtonColor();

  return (
    <ConfirmDialogContext.Provider value={{ showConfirm }}>
      {children}
      <Portal>
        <Dialog visible={visible} onDismiss={handleCancel}>
          <Dialog.Title>{options?.title}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{options?.message}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCancel} mode="text">
              {options?.cancelText || 'Cancel'}
            </Button>
            {buttonColor ? (
              <Button
                onPress={handleConfirm}
                mode="contained"
                buttonColor={buttonColor}
              >
                {options?.confirmText || 'Confirm'}
              </Button>
            ) : (
              <Button onPress={handleConfirm} mode="contained">
                {options?.confirmText || 'Confirm'}
              </Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ConfirmDialogContext.Provider>
  );
};

/**
 * Hook for common destructive action patterns
 */
export const useDestructiveAction = () => {
  const { showConfirm } = useConfirmDialog();

  const confirmDelete = useCallback(
    (itemName: string, itemType: string = 'item') =>
      showConfirm({
        title: `Delete ${itemType}`,
        message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'error',
        destructive: true,
      }),
    [showConfirm]
  );

  const confirmSuspend = useCallback(
    (userName: string) =>
      showConfirm({
        title: 'Suspend User',
        message: `Are you sure you want to suspend "${userName}"? They will lose access immediately.`,
        confirmText: 'Suspend',
        confirmColor: 'warning',
      }),
    [showConfirm]
  );

  const confirmUnsuspend = useCallback(
    (userName: string) =>
      showConfirm({
        title: 'Unsuspend User',
        message: `Are you sure you want to restore access for "${userName}"?`,
        confirmText: 'Unsuspend',
        confirmColor: 'primary',
      }),
    [showConfirm]
  );

  const confirmResetPassword = useCallback(
    (userEmail: string) =>
      showConfirm({
        title: 'Reset Password',
        message: `Send password reset email to "${userEmail}"?`,
        confirmText: 'Send Email',
        confirmColor: 'primary',
      }),
    [showConfirm]
  );

  const confirmRoleChange = useCallback(
    (userName: string, oldRole: string, newRole: string) =>
      showConfirm({
        title: 'Change User Role',
        message: `Change "${userName}" from ${oldRole} to ${newRole}? This will update their permissions immediately.`,
        confirmText: 'Change Role',
        confirmColor: 'warning',
      }),
    [showConfirm]
  );

  return {
    confirmDelete,
    confirmSuspend,
    confirmUnsuspend,
    confirmResetPassword,
    confirmRoleChange,
  };
};
