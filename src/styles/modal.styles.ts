/**
 * Modal Styles
 */

import { StyleSheet, Dimensions } from 'react-native';
import type { ModalSize } from '../types/modal.types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Modal sizes in pixels
export const MODAL_SIZES: Record<ModalSize, number> = {
  sm: 400,
  md: 560,
  lg: 720,
  xl: 960,
  full: screenWidth,
};

// Max height as percentage of screen
export const MODAL_MAX_HEIGHT = screenHeight * 0.9;

export const createModalStyles = (colors: {
  background: string;
  surface: string;
  surfaceVariant: string;
  primary: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  error: string;
  warning: string;
}) => StyleSheet.create({
  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  // Modal container
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    maxHeight: MODAL_MAX_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
  },

  containerFull: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },

  headerContent: {
    flex: 1,
    marginRight: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
  },

  subtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Body
  body: {
    padding: 24,
    maxHeight: MODAL_MAX_HEIGHT - 140, // Account for header and footer
  },

  bodyScrollable: {
    flexGrow: 0,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    gap: 12,
  },

  footerLeft: {
    justifyContent: 'flex-start',
  },

  footerCenter: {
    justifyContent: 'center',
  },

  footerRight: {
    justifyContent: 'flex-end',
  },

  footerSpaceBetween: {
    justifyContent: 'space-between',
  },

  // Buttons
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  buttonPrimary: {
    backgroundColor: colors.primary,
  },

  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.outline,
  },

  buttonDanger: {
    backgroundColor: colors.error,
  },

  buttonWarning: {
    backgroundColor: colors.warning,
  },

  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  buttonTextPrimary: {
    color: '#FFFFFF',
  },

  buttonTextSecondary: {
    color: colors.onSurface,
  },

  // Confirm dialog
  confirmContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },

  confirmIcon: {
    marginBottom: 16,
  },

  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: 8,
  },

  confirmMessage: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },

  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
});

export default createModalStyles;
