/**
 * Offline Queue Banner
 * Shows pending mutations count and sync status
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useMutationQueue } from '../../hooks/useOfflineMutation';
import { useAppTheme } from '../../theme/useAppTheme';

type OfflineQueueBannerProps = {
  /** Show even when online with pending items */
  showWhenOnline?: boolean;
};

export const OfflineQueueBanner: React.FC<OfflineQueueBannerProps> = ({
  showWhenOnline = true,
}) => {
  const { colors } = useAppTheme();
  const { pendingCount, failedCount, isOnline, retry, clearCompleted } = useMutationQueue();

  // Don't show if nothing pending and online
  if (pendingCount === 0 && failedCount === 0 && isOnline) {
    return null;
  }

  // Don't show if online and showWhenOnline is false
  if (isOnline && !showWhenOnline && pendingCount === 0) {
    return null;
  }

  const backgroundColor = !isOnline
    ? colors.warning
    : failedCount > 0
      ? colors.error
      : colors.primary;

  const message = !isOnline
    ? `Offline • ${pendingCount} pending`
    : failedCount > 0
      ? `${failedCount} failed • Tap to retry`
      : `Syncing ${pendingCount} items...`;

  const iconName = !isOnline ? 'cloud-off-outline' : failedCount > 0 ? 'alert-circle' : 'cloud-sync';

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor }]}
      onPress={isOnline ? retry : undefined}
      activeOpacity={isOnline ? 0.7 : 1}
      accessibilityRole="button"
      accessibilityLabel={message}
    >
      <Icon name={iconName} size={18} color="#fff" style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
      {failedCount > 0 && isOnline && (
        <TouchableOpacity onPress={clearCompleted} style={styles.clearButton}>
          <Icon name="close" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  clearButton: {
    padding: 4,
  },
});

export default OfflineQueueBanner;
