import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useStudentFeesSummaryQuery } from '../../../../hooks/queries/admin/useStudentFeesSummaryQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';

const WIDGET_ID = 'admin.student-fees-dashboard';

// Format currency with abbreviation (Indian format)
const formatCurrency = (amount: number, abbreviate: boolean = true): string => {
  if (abbreviate) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const StudentFeesDashboardWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const showCollectionRate = config?.showCollectionRate !== false;
  const showTodayStats = config?.showTodayStats !== false;
  const showOverdue = config?.showOverdue !== false;
  const enableReminder = config?.enableReminder !== false;
  const cardStyle = (config?.cardStyle as 'compact' | 'detailed') || 'detailed';

  const { data, isLoading, error, refetch } = useStudentFeesSummaryQuery();

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, 'render', {
      size,
      loadTime: Date.now() - renderStart.current,
    });
  }, []);

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'view_all' });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_view_all`,
      level: 'info',
    });
    onNavigate?.('student-fees-list');
  };

  const handlePendingTap = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'pending_tap' });
    onNavigate?.('student-fees-list', { filter: 'pending' });
  };

  const handleOverdueTap = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'overdue_tap' });
    onNavigate?.('student-fees-list', { filter: 'overdue' });
  };

  const handleSendReminder = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'send_reminder' });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_send_reminder`,
      level: 'info',
    });
    onNavigate?.('compose-message', { mode: 'fee-reminder', filter: 'overdue' });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="cash-multiple" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.studentFees.title', { defaultValue: 'Fee Collection' })}
            </AppText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('common:states.loading', { defaultValue: 'Loading...' })}
          </AppText>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="cash-multiple" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.studentFees.title', { defaultValue: 'Fee Collection' })}
            </AppText>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('common:states.error', { defaultValue: 'Failed to load data' })}
          </AppText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primaryContainer }]}
            onPress={() => refetch()}
            accessibilityLabel={t('common:actions.retry', { defaultValue: 'Retry' })}
            accessibilityRole="button"
          >
            <AppText style={{ color: colors.primary }}>
              {t('common:actions.retry', { defaultValue: 'Retry' })}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state
  if (!data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="cash-multiple" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.studentFees.title', { defaultValue: 'Fee Collection' })}
            </AppText>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="cash-remove" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.studentFees.states.empty', { defaultValue: 'No fee data available' })}
          </AppText>
        </View>
      </View>
    );
  }

  const isPositiveTrend = (data.trend || 0) >= 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="cash-multiple" size={20} color={colors.primary} />
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.studentFees.title', { defaultValue: 'Fee Collection' })}
          </AppText>
        </View>
        <TouchableOpacity
          onPress={handleViewAll}
          accessibilityLabel={t('common:actions.viewAll', { defaultValue: 'View All' })}
          accessibilityRole="button"
        >
          <AppText style={[styles.viewAll, { color: colors.primary }]}>
            {t('common:actions.viewAll', { defaultValue: 'View All' })}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        {/* Collected Card */}
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: `${colors.success}15`, borderRadius: borderRadius.medium }]}
          onPress={handleViewAll}
          accessibilityLabel={`${t('widgets.studentFees.collected', { defaultValue: 'Collected' })}: ${formatCurrency(data.totalCollected)}`}
        >
          <AppText style={[styles.statAmount, { color: colors.success }]}>
            {formatCurrency(data.totalCollected)}
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.studentFees.collected', { defaultValue: 'Collected' })}
          </AppText>
          {isPositiveTrend && (
            <View style={styles.trendContainer}>
              <Icon name="trending-up" size={12} color={colors.success} />
              <AppText style={[styles.trendText, { color: colors.success }]}>
                {data.trend}%
              </AppText>
            </View>
          )}
        </TouchableOpacity>

        {/* Pending Card */}
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: `${colors.warning}15`, borderRadius: borderRadius.medium }]}
          onPress={handlePendingTap}
          accessibilityLabel={`${t('widgets.studentFees.pending', { defaultValue: 'Pending' })}: ${formatCurrency(data.totalPending)}, ${data.pendingStudentCount} students`}
        >
          <AppText style={[styles.statAmount, { color: colors.warning }]}>
            {formatCurrency(data.totalPending)}
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.studentFees.pending', { defaultValue: 'Pending' })}
          </AppText>
          <AppText style={[styles.statSubLabel, { color: colors.onSurfaceVariant }]}>
            {data.pendingStudentCount} {t('widgets.studentFees.students', { defaultValue: 'students' })}
          </AppText>
        </TouchableOpacity>

        {/* Overdue Card */}
        {showOverdue && (
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: `${colors.error}15`, borderRadius: borderRadius.medium }]}
            onPress={handleOverdueTap}
            accessibilityLabel={`${t('widgets.studentFees.overdue', { defaultValue: 'Overdue' })}: ${formatCurrency(data.totalOverdue)}, ${data.overdueStudentCount} students`}
          >
            <AppText style={[styles.statAmount, { color: colors.error }]}>
              {formatCurrency(data.totalOverdue)}
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.studentFees.overdue', { defaultValue: 'Overdue' })}
            </AppText>
            <AppText style={[styles.statSubLabel, { color: colors.onSurfaceVariant }]}>
              {data.overdueStudentCount} {t('widgets.studentFees.students', { defaultValue: 'students' })}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Collection Rate Progress Bar */}
      {showCollectionRate && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <AppText style={[styles.progressLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.studentFees.collectionRate', { defaultValue: 'Collection Rate' })}:
            </AppText>
            <AppText style={[styles.progressValue, { color: colors.primary }]}>
              {data.collectionRate}%
            </AppText>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: data.collectionRate >= 80 ? colors.success : 
                                   data.collectionRate >= 60 ? colors.warning : colors.error,
                  width: `${Math.min(data.collectionRate, 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Today's Stats */}
      {showTodayStats && (
        <View style={[styles.todaySection, { borderTopColor: colors.outlineVariant }]}>
          <Icon name="calendar-today" size={16} color={colors.primary} />
          <AppText style={[styles.todayText, { color: colors.onSurface }]}>
            {t('widgets.studentFees.today', { defaultValue: 'Today' })}: {formatCurrency(data.todayCollection)}{' '}
            {t('widgets.studentFees.collectedFrom', { defaultValue: 'collected from' })}{' '}
            {data.todayStudentCount} {t('widgets.studentFees.students', { defaultValue: 'students' })}
          </AppText>
        </View>
      )}

      {/* Send Reminder Button */}
      {enableReminder && data.overdueStudentCount > 0 && (
        <TouchableOpacity
          style={[styles.reminderButton, { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.medium }]}
          onPress={handleSendReminder}
          accessibilityLabel={t('widgets.studentFees.sendReminder', { defaultValue: 'Send Reminder to Defaulters' })}
          accessibilityRole="button"
        >
          <Icon name="email-outline" size={18} color={colors.primary} />
          <AppText style={[styles.reminderText, { color: colors.primary }]}>
            {t('widgets.studentFees.sendReminder', { defaultValue: 'Send Reminder to Defaulters' })}
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  statSubLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  todaySection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  todayText: {
    fontSize: 12,
    flex: 1,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  reminderText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
