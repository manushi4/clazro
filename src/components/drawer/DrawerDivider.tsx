/**
 * DrawerDivider Component
 * Horizontal separator line in drawer menu
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';

export const DrawerDivider: React.FC = () => {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: colors.outlineVariant },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 16,
  },
});
