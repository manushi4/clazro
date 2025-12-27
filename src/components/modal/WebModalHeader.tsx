/**
 * WebModalHeader - Modal header component
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from '../../ui/components/AppText';
import { useAppTheme } from '../../theme/useAppTheme';
import type { ModalHeaderProps } from '../../types/modal.types';

export const WebModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  onClose,
  showCloseButton = true,
  children,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
      {children ? (
        <View style={styles.headerContent}>{children}</View>
      ) : (
        <View style={styles.headerContent}>
          {title && (
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {title}
            </AppText>
          )}
          {subtitle && (
            <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {subtitle}
            </AppText>
          )}
        </View>
      )}

      {showCloseButton && onClose && (
        <Pressable
          style={[styles.closeButton, { backgroundColor: colors.surfaceVariant }]}
          onPress={onClose}
          accessibilityLabel="Close modal"
          accessibilityRole="button"
        >
          <Icon name="close" size={20} color={colors.onSurfaceVariant} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WebModalHeader;
