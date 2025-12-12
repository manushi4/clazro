/**
 * System Health Card Component
 * Displays live system status metrics (uptime, sessions, queue, database)
 * Auto-refreshes every 60s via React Query refetchInterval
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Card } from 'react-native-paper';
import { T } from '../../ui/typography/T';
import { Colors, Spacing, BorderRadius } from '../../theme/designSystem';
import { useTheme } from '../../context/ThemeContext';

export interface SystemHealthData {
  uptime: string;
  activeSessions: number;
  queueBacklog: number;
  databaseStatus: 'healthy' | 'degraded' | 'down';
  apiLatency: number;
}

export interface SystemHealthCardProps {
  data: SystemHealthData | undefined;
  loading: boolean;
  onViewDetails?: () => void;
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = React.memo(({
  data,
  loading,
  onViewDetails,
}) => {
  const { theme } = useTheme();

  if (loading) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.Surface }]} mode="outlined">
        <View style={styles.content}>
          <T variant="body" color="textSecondary">Loading system health...</T>
        </View>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const statusColor = data.databaseStatus === 'healthy' ? Colors.success :
                      data.databaseStatus === 'degraded' ? Colors.warning : Colors.error;

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.Surface }]}
      mode="outlined"
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="System Health Status"
    >
      <Pressable onPress={onViewDetails} style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <T variant="body" weight="semiBold">System Health</T>
          {onViewDetails && (
            <T variant="caption" color="textSecondary">View →</T>
          )}
        </View>

        {/* Metrics List */}
        <View style={styles.metricsList}>
          <View style={styles.metricRow}>
            <T variant="caption" color="textSecondary">• API Uptime:</T>
            <T variant="caption" weight="semiBold">{data.uptime}%</T>
          </View>

          <View style={styles.metricRow}>
            <T variant="caption" color="textSecondary">• Active Sessions:</T>
            <T variant="caption" weight="semiBold">{data.activeSessions} now</T>
          </View>

          <View style={styles.metricRow}>
            <T variant="caption" color="textSecondary">• Queue Backlog:</T>
            <T variant="caption" weight="semiBold">{data.queueBacklog} alerts</T>
          </View>

          <View style={styles.metricRow}>
            <T variant="caption" color="textSecondary">• DB Status:</T>
            <T variant="caption" weight="semiBold" color={statusColor as any}>
              {data.databaseStatus === 'healthy' ? '✓ Healthy' :
               data.databaseStatus === 'degraded' ? '⚠ Degraded' : '✗ Down'}
            </T>
          </View>
        </View>
      </Pressable>
    </Card>
  );
});

SystemHealthCard.displayName = 'SystemHealthCard';

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  metricsList: {
    gap: Spacing.xs,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
