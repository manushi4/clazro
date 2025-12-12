/**
 * Reusable Dashboard Card Component
 * Use this for all card-based content
 */

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';
import { Colors, BorderRadius, Shadows, Spacing } from '../../theme/designSystem';

interface DashboardCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  mode?: 'elevated' | 'outlined' | 'contained';
  onPress?: () => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  children,
  style,
  mode = 'elevated',
  onPress,
}) => {
  return (
    <PaperCard
      style={[styles.card, style]}
      mode={mode}
      onPress={onPress}
    >
      {children}
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
    overflow: 'hidden',
  },
});
