/**
 * KPI Card Component
 * Displays key performance indicator with icon, label, value, and trend
 * Used in Admin Dashboard for metrics like total users, revenue, etc.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { T } from '../../ui/typography/T';
import { Colors, Spacing, BorderRadius } from '../../theme/designSystem';
import { useTheme } from '../../context/ThemeContext';

export interface KPICardProps {
  icon: string;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  onPress?: () => void;
}

export const KPICard: React.FC<KPICardProps> = React.memo(({
  icon,
  label,
  value,
  trend,
  subtitle,
  onPress,
}) => {
  const { theme } = useTheme();

  const trendColor = trend
    ? trend.isPositive
      ? Colors.success
      : Colors.error
    : undefined;

  const trendIcon = trend
    ? trend.isPositive
      ? '📈'
      : '📉'
    : '';

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.Surface }]}
      onPress={onPress}
      mode="elevated"
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint="Tap to view details"
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: theme.SurfaceVariant }]}>
          <T variant="title" style={styles.icon}>
            {icon}
          </T>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Label */}
          <T variant="caption" color="textSecondary" style={styles.label}>
            {label}
          </T>

          {/* Value */}
          <T variant="headline" weight="bold" style={styles.value}>
            {value}
          </T>

          {/* Trend or Subtitle */}
          {trend ? (
            <View style={styles.trendContainer}>
              <T variant="caption" style={styles.trendText} color={trendColor as any}>
                {trendIcon} {trend.value > 0 ? '+' : ''}{trend.value}%
              </T>
            </View>
          ) : subtitle ? (
            <T variant="caption" color="textSecondary">
              {subtitle}
            </T>
          ) : null}
        </View>
      </View>
    </Card>
  );
});

KPICard.displayName = 'KPICard';

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.base,
  },
  content: {
    flexDirection: 'row',
    padding: Spacing.base,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  icon: {
    fontSize: 28,
  },
  mainContent: {
    flex: 1,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  value: {
    marginBottom: Spacing.xs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontWeight: '600',
  },
});
