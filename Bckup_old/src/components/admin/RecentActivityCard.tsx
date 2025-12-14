/**
 * Recent Activity Card Component
 * Displays last N admin actions from audit logs
 * Each row tappable to view audit detail
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Card } from 'react-native-paper';
import { T } from '../../ui/typography/T';
import { Spacing, BorderRadius } from '../../theme/designSystem';
import { useTheme } from '../../context/ThemeContext';

export interface ActivityEvent {
  id: string;
  action: string;
  actorName: string;
  timestamp: string;
  summary: string;
}

export interface RecentActivityCardProps {
  events: ActivityEvent[];
  loading: boolean;
  onViewAll?: () => void;
  onEventPress?: (eventId: string) => void;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = React.memo(({
  events,
  loading,
  onViewAll,
  onEventPress,
}) => {
  const { theme } = useTheme();

  if (loading) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.Surface }]} mode="outlined">
        <View style={styles.content}>
          <T variant="body" color="textSecondary">Loading recent activity...</T>
        </View>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.Surface }]} mode="outlined">
        <View style={styles.content}>
          <T variant="body" weight="semiBold">Recent Activity</T>
          <T variant="caption" color="textSecondary">No recent activity</T>
        </View>
      </Card>
    );
  }

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.Surface }]}
      mode="outlined"
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Recent Activity List"
    >
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <T variant="body" weight="semiBold">Recent Activity</T>
          {onViewAll && (
            <Pressable onPress={onViewAll} hitSlop={8}>
              <T variant="caption" color="textSecondary">All →</T>
            </Pressable>
          )}
        </View>

        {/* Activity List */}
        <View style={styles.eventsList}>
          {events.map((event) => (
            <Pressable
              key={event.id}
              onPress={() => onEventPress?.(event.id)}
              style={styles.eventRow}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Activity: ${event.summary}`}
            >
              <View style={styles.eventContent}>
                <T variant="caption" numberOfLines={1}>
                  • {event.summary}
                </T>
                <T variant="caption" color="textSecondary" style={styles.timestamp}>
                  {event.timestamp} · {event.actorName}
                </T>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </Card>
  );
});

RecentActivityCard.displayName = 'RecentActivityCard';

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
  eventsList: {
    gap: Spacing.sm,
  },
  eventRow: {
    paddingVertical: Spacing.xs,
  },
  eventContent: {
    gap: 2,
  },
  timestamp: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});
