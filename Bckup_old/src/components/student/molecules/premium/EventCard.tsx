/**
 * EventCard Component - Premium Minimal Design
 * Purpose: Display class/event cards with status badges
 * Used in: NewStudentDashboard, NewScheduleScreen
 */

import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Card, Badge, T } from '../../../../ui';

interface EventCardProps {
  title: string;
  subject: string;
  time: Date;
  status: 'live' | 'upcoming' | 'ended';
  onPress: () => void;
  accessibilityLabel: string;
}

export const EventCard: React.FC<EventCardProps> = ({
  title,
  subject,
  time,
  status,
  onPress,
  accessibilityLabel,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'live':
        return { icon: '🔴', text: 'LIVE', color: '#EF4444' as const };
      case 'upcoming':
        return { icon: '🔵', text: 'UPCOMING', color: '#3B82F6' as const };
      case 'ended':
        return { icon: '⚪', text: 'ENDED', color: '#9CA3AF' as const };
    }
  };

  const statusConfig = getStatusConfig();
  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to view class details"
      style={styles.container}
    >
      <Card style={styles.card}>
        <View style={styles.content}>
          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <T variant="caption" weight="semiBold" style={{ color: statusConfig.color }}>
              {statusConfig.text}
            </T>
          </View>

          {/* Class Info */}
          <T variant="body" weight="semiBold" style={styles.title} numberOfLines={1}>
            {title}
          </T>
          <T variant="caption" style={styles.subject} numberOfLines={1}>
            {subject}
          </T>
          <T variant="caption" style={styles.time}>
            {formattedTime}
          </T>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    minWidth: 160,
    width: 160,
  },
  card: {
    padding: 0,
    height: '100%',
  },
  content: {
    padding: 16,
    gap: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    marginTop: 4,
  },
  subject: {
    color: '#6B7280',
  },
  time: {
    color: '#9CA3AF',
  },
});
