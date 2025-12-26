/**
 * DrawerSectionHeader Component
 * Section title in drawer menu
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { AppText } from '../../ui/components/AppText';

type Props = {
  label: string;
};

export const DrawerSectionHeader: React.FC<Props> = ({ label }) => {
  const { colors } = useAppTheme();

  if (!label) return null;

  return (
    <View style={styles.container}>
      <AppText
        style={[styles.label, { color: colors.onSurfaceVariant }]}
      >
        {label.toUpperCase()}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});
