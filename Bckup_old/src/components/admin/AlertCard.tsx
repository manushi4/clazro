/**
 * Alert Card Component
 * Displays system alerts, warnings, and notifications
 * Used in Admin Dashboard for important system messages
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, IconButton } from 'react-native-paper';
import { T } from '../../ui/typography/T';
import { Colors, Spacing } from '../../theme/designSystem';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'success';

export interface AlertCardProps {
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp?: string;
  onDismiss?: () => void;
  onPress?: () => void;
}

const SEVERITY_CONFIG: Record<AlertSeverity, {
  icon: string;
  color: string;
  backgroundColor: string;
}> = {
  info: {
    icon: 'ℹ️',
    color: Colors.info,
    backgroundColor: `${Colors.info}15`,
  },
  warning: {
    icon: '⚠️',
    color: Colors.warning,
    backgroundColor: `${Colors.warning}15`,
  },
  error: {
    icon: '❌',
    color: Colors.error,
    backgroundColor: `${Colors.error}15`,
  },
  success: {
    icon: '✅',
    color: Colors.success,
    backgroundColor: `${Colors.success}15`,
  },
};

export const AlertCard: React.FC<AlertCardProps> = React.memo(({
  severity,
  title,
  message,
  timestamp,
  onDismiss,
  onPress,
}) => {
  const config = SEVERITY_CONFIG[severity];

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: config.backgroundColor,
          borderLeftColor: config.color,
          borderLeftWidth: 4,
        },
      ]}
      onPress={onPress}
      mode="outlined"
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${severity} alert: ${title}`}
      accessibilityHint="Tap to view details"
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <T variant="title" style={styles.icon}>
            {config.icon}
          </T>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Title */}
          <T variant="body" weight="semiBold" style={styles.title} color={config.color as any}>
            {title}
          </T>

          {/* Message */}
          <T variant="caption" color="textSecondary" style={styles.message}>
            {message}
          </T>

          {/* Timestamp */}
          {timestamp && (
            <T variant="caption" color="textSecondary" style={styles.timestamp}>
              {timestamp}
            </T>
          )}
        </View>

        {/* Dismiss Button */}
        {onDismiss && (
          <IconButton
            icon="close"
            size={20}
            onPress={onDismiss}
            style={styles.dismissButton}
          />
        )}
      </View>
    </Card>
  );
});

AlertCard.displayName = 'AlertCard';

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.base,
  },
  content: {
    flexDirection: 'row',
    padding: Spacing.base,
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  icon: {
    fontSize: 24,
  },
  mainContent: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  message: {
    marginBottom: Spacing.xs,
  },
  timestamp: {
    fontStyle: 'italic',
  },
  dismissButton: {
    marginTop: -8,
    marginRight: -8,
  },
});
