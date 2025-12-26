import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { AppText } from '../../../ui/components/AppText';
import { getLocalizedField } from '../../../utils/getLocalizedField';
import {
  useRecentAttendanceQuery,
  getRelativeTime,
  RecentAttendanceRecord,
} from '../../../hooks/queries/teacher/useRecentAttendanceQuery';

export const AttendanceRecentWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const maxItems = (config?.maxItems as number) || 5;

  const { data, isLoading, error, refetch } = useRecentAttendanceQuery({ limit: maxItems });

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t('widgets.attendanceRecent.states.loading', { defaultValue: 'Loading...' })}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t('widgets.attendanceRecent.states.error', { defaultValue: 'Failed to load' })}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>Retry</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data?.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="clipboard-text-off-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t('widgets.attendanceRecent.states.empty', { defaultValue: 'No recent attendance' })}
        </AppText>
      </View>
    );
  }

  const getRateColor = (rate: number): string => {
    if (rate >= 90) return '#4CAF50';
    if (rate >= 75) return '#FF9800';
    return '#F44336';
  };

  const renderItem = ({ item }: { item: RecentAttendanceRecord }) => (
    <TouchableOpacity
      style={[
        styles.recordItem,
        { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
      ]}
      onPress={() => onNavigate?.('AttendanceMark', { classId: item.class_id, date: item.date })}
      activeOpacity={0.7}
    >
      <View style={styles.recordLeft}>
        <View style={[styles.classIcon, { backgroundColor: `${colors.primary}15` }]}>
          <Icon name="google-classroom" size={20} color={colors.primary} />
        </View>
        <View style={styles.recordInfo}>
          <AppText style={[styles.className, { color: colors.onSurface }]} numberOfLines={1}>
            {getLocalizedField(item, 'class_name')}
          </AppText>
          <View style={styles.recordMeta}>
            <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
              {item.date === new Date().toISOString().split('T')[0]
                ? t('widgets.attendanceRecent.today', { defaultValue: 'Today' })
                : item.date}
            </AppText>
            <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
              {' '}{getRelativeTime(item.marked_at)}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.recordRight}>
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Icon name="check" size={12} color="#4CAF50" />
            <AppText style={[styles.statText, { color: '#4CAF50' }]}>{item.present}</AppText>
          </View>
          <View style={styles.statBadge}>
            <Icon name="close" size={12} color="#F44336" />
            <AppText style={[styles.statText, { color: '#F44336' }]}>{item.absent}</AppText>
          </View>
          {item.late > 0 && (
            <View style={styles.statBadge}>
              <Icon name="clock" size={12} color="#FF9800" />
              <AppText style={[styles.statText, { color: '#FF9800' }]}>{item.late}</AppText>
            </View>
          )}
        </View>
        <View
          style={[
            styles.rateBadge,
            { backgroundColor: `${getRateColor(item.rate)}15` },
          ]}
        >
          <AppText style={[styles.rateText, { color: getRateColor(item.rate) }]}>
            {item.rate.toFixed(0)}%
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      <TouchableOpacity
        style={[styles.viewAllBtn, { borderColor: colors.outline }]}
        onPress={() => onNavigate?.('AttendanceHistory')}
      >
        <AppText style={[styles.viewAllText, { color: colors.primary }]}>
          {t('widgets.attendanceRecent.viewAll', { defaultValue: 'View All History' })}
        </AppText>
        <Icon name="chevron-right" size={18} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  stateContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  classIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInfo: {
    flex: 1,
  },
  className: {
    fontSize: 14,
    fontWeight: '600',
  },
  recordMeta: {
    flexDirection: 'row',
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
  },
  recordRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
