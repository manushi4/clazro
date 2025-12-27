/**
 * ConfirmDialog - Confirmation dialog for destructive actions
 */

import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../ui/components/AppText';
import { useAppTheme } from '../../theme/useAppTheme';
import { WebModal } from './WebModal';
import type { ConfirmDialogProps } from '../../types/modal.types';

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  confirmType = 'primary',
  onConfirm,
  onCancel,
  loading = false,
  icon,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation('common');

  const getConfirmColor = () => {
    switch (confirmType) {
      case 'danger':
        return colors.error;
      case 'warning':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    switch (confirmType) {
      case 'danger':
        return 'alert-circle';
      case 'warning':
        return 'alert';
      default:
        return 'help-circle';
    }
  };

  const confirmColor = getConfirmColor();

  return (
    <WebModal
      visible={visible}
      onClose={onCancel}
      size="sm"
      showCloseButton={false}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${confirmColor}15` }]}>
          <Icon name={getIcon()} size={32} color={confirmColor} />
        </View>

        {/* Title */}
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {title}
        </AppText>

        {/* Message */}
        <AppText style={[styles.message, { color: colors.onSurfaceVariant }]}>
          {message}
        </AppText>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Pressable
            style={[
              styles.button,
              styles.cancelButton,
              { borderColor: colors.outline },
            ]}
            onPress={onCancel}
            disabled={loading}
          >
            <AppText style={[styles.buttonText, { color: colors.onSurface }]}>
              {cancelText || t('actions.cancel', { defaultValue: 'Cancel' })}
            </AppText>
          </Pressable>

          <Pressable
            style={[
              styles.button,
              styles.confirmButton,
              { backgroundColor: confirmColor },
              loading && styles.buttonLoading,
            ]}
            onPress={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <AppText style={[styles.buttonText, styles.confirmButtonText]}>
                {confirmText || t('actions.confirm', { defaultValue: 'Confirm' })}
              </AppText>
            )}
          </Pressable>
        </View>
      </View>
    </WebModal>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  confirmButton: {},
  buttonLoading: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
  },
});

export default ConfirmDialog;
