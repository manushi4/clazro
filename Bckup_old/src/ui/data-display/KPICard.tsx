/**
 * KPI Card Component (MD3)
 * Displays key performance indicators with trend
 *
 * Usage:
 * <KPICard
 *   label="Attendance"
 *   value="96%"
 *   trend="+2%"
 *   trendDirection="up"
 *   icon="check-circle"
 * />
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { T } from '../typography/T';
import { Colors, Spacing, BorderRadius, Shadows, Typography, Layout } from '../../theme/designSystem';

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: string;
  iconColor?: string;
  valueColor?: string;
  onPress?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  trend,
  trendDirection = 'neutral',
  icon,
  iconColor,
  valueColor,
  onPress,
}) => {
  // Trend color based on direction
  const trendColor = trendDirection === 'up' ? Colors.success :
                     trendDirection === 'down' ? Colors.error :
                     Colors.textSecondary;

  return (
    <View style={[styles.card, Shadows.resting]}>
      {/* Header with Icon */}
      <View style={styles.header}>
        <T variant="caption" color="textSecondary" weight="medium">
          {label}
        </T>
        {icon && (
          <IconButton
            icon={icon}
            size={Layout.iconSize.medium}
            iconColor={iconColor || Colors.primary}
            onPress={onPress}
            style={styles.iconButton}
          />
        )}
      </View>

      {/* Value */}
      <T variant="headline" weight="bold" style={[styles.value, { color: valueColor || Colors.textPrimary }]}>
        {value}
      </T>

      {/* Trend */}
      {trend && (
        <View style={styles.trendContainer}>
          <T variant="caption" weight="medium" style={{ color: trendColor }}>
            {trendDirection === 'up' && '▲ '}
            {trendDirection === 'down' && '▼ '}
            {trend}
          </T>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, // 12dp
    padding: Spacing.base,          // 16dp
    minHeight: 96,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  iconButton: {
    margin: 0,
    width: Layout.iconSize.medium + 8,
    height: Layout.iconSize.medium + 8,
  },
  value: {
    marginBottom: Spacing.xs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
