/**
 * Modal Types
 */

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface WebModalProps {
  /** Whether modal is visible */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal subtitle */
  subtitle?: string;
  /** Modal size */
  size?: ModalSize;
  /** Show close button */
  showCloseButton?: boolean;
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Header content (overrides title/subtitle) */
  header?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Modal content */
  children: React.ReactNode;
  /** Style overrides */
  style?: object;
  /** Content style overrides */
  contentStyle?: object;
}

export interface ConfirmDialogProps {
  /** Whether dialog is visible */
  visible: boolean;
  /** Title */
  title: string;
  /** Message */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm action type */
  confirmType?: 'primary' | 'danger' | 'warning';
  /** Confirm handler */
  onConfirm: () => void;
  /** Cancel handler */
  onCancel: () => void;
  /** Loading state */
  loading?: boolean;
  /** Icon name */
  icon?: string;
}

export interface UseWebModalReturn {
  /** Whether modal is open */
  isOpen: boolean;
  /** Open the modal */
  open: () => void;
  /** Close the modal */
  close: () => void;
  /** Toggle the modal */
  toggle: () => void;
}

export interface ModalHeaderProps {
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  children?: React.ReactNode;
}

export interface ModalBodyProps {
  children: React.ReactNode;
  style?: object;
  scrollable?: boolean;
  padding?: number;
}

export interface ModalFooterProps {
  children: React.ReactNode;
  style?: object;
  align?: 'left' | 'center' | 'right' | 'space-between';
}
