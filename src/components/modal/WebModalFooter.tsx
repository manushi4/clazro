/**
 * WebModalFooter - Modal footer component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import type { ModalFooterProps } from '../../types/modal.types';

export const WebModalFooter: React.FC<ModalFooterProps> = ({
  children,
  style,
  align = 'right',
}) => {
  const { colors } = useAppTheme();

  const alignStyle =
    align === 'left' ? styles.alignLeft :
    align === 'center' ? styles.alignCenter :
    align === 'space-between' ? styles.alignSpaceBetween :
    styles.alignRight;

  return (
    <View style={[
      styles.footer,
      { borderTopColor: colors.outlineVariant },
      alignStyle,
      style,
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  alignLeft: {
    justifyContent: 'flex-start',
  },
  alignCenter: {
    justifyContent: 'center',
  },
  alignRight: {
    justifyContent: 'flex-end',
  },
  alignSpaceBetween: {
    justifyContent: 'space-between',
  },
});

export default WebModalFooter;
