import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, T } from '../../../ui';
import { Colors, Spacing } from '../../../theme/designSystem';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  color = Colors.primary,
}) => {
  return (
    <Card variant="elevated" style={styles.card}>
      <T variant="display" style={styles.icon}>{icon}</T>
      <T variant="h1" style={[styles.value, { color }]}>{value}</T>
      <T variant="caption" style={styles.label}>{label}</T>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    minWidth: 80,
    minHeight: 80,
    flex: 1,
  },
  icon: {
    marginBottom: Spacing.xs,
  },
  value: {
    marginBottom: Spacing.xs,
    fontWeight: '700',
  },
  label: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
