/**
 * Modal Components Exports
 */

export { WebModal } from './WebModal';
export { WebModalHeader } from './WebModalHeader';
export { WebModalBody } from './WebModalBody';
export { WebModalFooter } from './WebModalFooter';
export { ConfirmDialog } from './ConfirmDialog';

// Hook
export { useWebModal } from '../../hooks/useWebModal';

// Types
export type {
  ModalSize,
  WebModalProps,
  ConfirmDialogProps,
  UseWebModalReturn,
  ModalHeaderProps,
  ModalBodyProps,
  ModalFooterProps,
} from '../../types/modal.types';
