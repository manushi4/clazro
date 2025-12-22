import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTeacherPayrollQuery } from '../../../../hooks/queries/admin/useTeacherPayrollQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';
import { format } from 'date-fns';

const WIDGET_ID = 'admin.teacher-payroll';

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

// Get current month name
const getCurrentMonthName = (): string => {
  return format(new Date(), 'MMMM');
};

export const TeacherPayrollWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const showProgress = config?.showProgress !== false;
  const showNextDue = config?.showNextDue !== false;
  const showProcessButton = config?.showProcessButton !== false;
  const alertOnOverdue = config?.alertOnOverdue !== false;

  const { data, isLoading, error, refetch } = useTeacherPayrollQuery();

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
    onNavigate?.('teacher-payroll-list', { month: format(new Date(), 'yyyy-MM') });
  };

  const handlePaidTap = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'paid_tap' });
    onNavigate?.('teacher-payroll-list', { filter: 'paid', month: format(new Date(), 'yyyy-MM') });
  };

  const handlePendingTap = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'pending_tap' });
    onNavigate?.('teacher-payroll-list', { filter: 'pending', month: format(new Date(), 'yyyy-MM') });
  };

  const handleProcessSalaries = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'process_salaries' });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_process_salaries`,
      level: 'info',
    });
    onNavigate?.('payroll-processing', { month: format(new Date(), 'yyyy-MM') });
  };

  const handleNextDueTap = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'next_due_tap' });
    onNavigate?.('teacher-payroll-list', { filter: 'due-soon', month: format(new Date(), 'yyyy-MM') });
  };

  const handleTeacherTap = (teacherId: string, teacherName: string) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'teacher_tap', teacherId });
    onNavigate?.('teacher-payroll-detail', { teacherId, month: format(new Date(), 'yyyy-MM') });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="account-tie" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.teacherPayroll.title', { defaultValue: 'Teacher Payroll' })} - {getCurrentMonthName()}
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
            <Icon name="account-tie" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.teacherPayroll.title', { defaultValue: 'Teacher Payroll' })}
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
            <Icon name="account-tie" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.teacherPayroll.title', { defaultValue: 'Teacher Payroll' })}
            </AppText>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="account-off" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.teacherPayroll.states.empty', { defaultValue: 'No payroll data available' })}
          </AppText>
        </View>
      </View>
    );
  }

  const hasOverdue = data.overduePayments && data.overduePayments.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="account-tie" size={20} color={colors.primary} />
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.teacherPayroll.title', { defaultValue: 'Teacher Payroll' })} - {getCurrentMonthName()}
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

      {/* Total Payroll */}
      <View style={styles.totalSection}>
        <AppText style={[styles.totalLabel, { color: colors.onSurfaceVariant }]}>
          {t('widgets.teacherPayroll.totalPayroll', { defaultValue: 'Total Payroll' })}:
        </AppText>
        <AppText style={[styles.totalAmount, { color: colors.primary }]}>
          {formatCurrency(data.totalPayroll)}
        </AppText>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        {/* Paid Card */}
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: `${colors.success}15`, borderRadius: borderRadius.medium }]}
          onPress={handlePaidTap}
          accessibilityLabel={`${t('widgets.teacherPayroll.paid', { defaultValue: 'Paid' })}: ${formatCurrency(data.paidAmount)}, ${data.paidCount} teachers`}
        >
          <Icon name="check-circle" size={20} color={colors.success} />
          <AppText style={[styles.statAmount, { color: colors.success }]}>
            {formatCurrency(data.paidAmount)}
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.teacherPayroll.paid', { defaultValue: 'Paid' })} ({data.paidCount})
          </AppText>
        </TouchableOpacity>

        {/* Pending Card */}
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: `${colors.warning}15`, borderRadius: borderRadius.medium }]}
          onPress={handlePendingTap}
          accessibilityLabel={`${t('widgets.teacherPayroll.pending', { defaultValue: 'Pending' })}: ${formatCurrency(data.pendingAmount)}, ${data.pendingCount} teachers`}
        >
          <Icon name="clock-outline" size={20} color={colors.warning} />
          <AppText style={[styles.statAmount, { color: colors.warning }]}>
            {formatCurrency(data.pendingAmount)}
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.teacherPayroll.pending', { defaultValue: 'Pending' })} ({data.pendingCount})
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      {showProgress && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <AppText style={[styles.progressLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.teacherPayroll.progress', { defaultValue: 'Progress' })}:
            </AppText>
            <AppText style={[styles.progressValue, { color: colors.primary }]}>
              {data.progressPercentage}% {t('widgets.teacherPayroll.paidLabel', { defaultValue: 'paid' })}
            </AppText>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: data.progressPercentage >= 80 ? colors.success : 
                                   data.progressPercentage >= 50 ? colors.warning : colors.error,
                  width: `${Math.min(data.progressPercentage, 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Next Payment Due */}
      {showNextDue && data.nextPaymentDue && (
        <TouchableOpacity 
          style={[styles.nextDueSection, { borderTopColor: colors.outlineVariant }]}
          onPress={handleNextDueTap}
          accessibilityLabel={`Next payment due: ${data.nextPaymentDue.date}, ${formatCurrency(data.nextPaymentDue.amount)}`}
        >
          <Icon name="calendar-clock" size={16} color={colors.primary} />
          <AppText style={[styles.nextDueText, { color: colors.onSurface }]}>
            {t('widgets.teacherPayroll.nextDue', { defaultValue: 'Next Payment Due' })}: {data.nextPaymentDue.date} ({formatCurrency(data.nextPaymentDue.amount)})
          </AppText>
        </TouchableOpacity>
      )}

      {/* Overdue Alert */}
      {alertOnOverdue && hasOverdue && (
        <View style={[styles.alertSection, { backgroundColor: `${colors.error}15`, borderRadius: borderRadius.medium }]}>
          <Icon name="alert" size={16} color={colors.error} />
          <AppText style={[styles.alertText, { color: colors.error }]}>
            {data.overduePayments.length} {t('widgets.teacherPayroll.overdueAlert', { defaultValue: 'payments overdue' })}
          </AppText>
        </View>
      )}

      {/* Pending Teachers List */}
      {data.pendingTeachers && data.pendingTeachers.length > 0 && (
        <View style={[styles.pendingListSection, { borderTopColor: colors.outlineVariant }]}>
          <AppText style={[styles.pendingListTitle, { color: colors.onSurfaceVariant }]}>
            {t('widgets.teacherPayroll.pendingTeachers', { defaultValue: 'Pending Teachers' })}
          </AppText>
          {data.pendingTeachers.slice(0, 3).map((teacher, index) => (
            <TouchableOpacity
              key={teacher.id}
              style={[
                styles.pendingTeacherRow,
                index < Math.min(data.pendingTeachers.length, 3) - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.outlineVariant,
                },
              ]}
              onPress={() => handleTeacherTap(teacher.id, teacher.name)}
              accessibilityLabel={`${teacher.name}, ${formatCurrency(teacher.amount)}`}
            >
              <View style={styles.pendingTeacherInfo}>
                <AppText style={[styles.pendingTeacherName, { color: colors.onSurface }]} numberOfLines={1}>
                  {teacher.name}
                </AppText>
                <AppText style={[styles.pendingTeacherDue, { color: colors.onSurfaceVariant }]}>
                  Due: {teacher.dueDate}
                </AppText>
              </View>
              <View style={styles.pendingTeacherAmount}>
                <AppText style={[styles.pendingTeacherAmountText, { color: colors.warning }]}>
                  {formatCurrency(teacher.amount)}
                </AppText>
                <Icon name="chevron-right" size={16} color={colors.onSurfaceVariant} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Process Salaries Button */}
      {showProcessButton && data.pendingCount > 0 && (
        <TouchableOpacity
          style={[styles.processButton, { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.medium }]}
          onPress={handleProcessSalaries}
          accessibilityLabel={t('widgets.teacherPayroll.processSalaries', { defaultValue: 'Process Pending Salaries' })}
          accessibilityRole="button"
        >
          <Icon name="credit-card-outline" size={18} color={colors.primary} />
          <AppText style={[styles.processText, { color: colors.primary }]}>
            {t('widgets.teacherPayroll.processSalaries', { defaultValue: 'Process Pending Salaries' })}
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
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
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
  totalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 13,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
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
    fontSize: 13,
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
  nextDueSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  nextDueText: {
    fontSize: 12,
    flex: 1,
  },
  alertSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
    marginBottom: 8,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '500',
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
    gap: 8,
  },
  processText: {
    fontSize: 13,
    fontWeight: '500',
  },
  pendingListSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 8,
  },
  pendingListTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  pendingTeacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  pendingTeacherInfo: {
    flex: 1,
  },
  pendingTeacherName: {
    fontSize: 13,
    fontWeight: '500',
  },
  pendingTeacherDue: {
    fontSize: 11,
    marginTop: 2,
  },
  pendingTeacherAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingTeacherAmountText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
