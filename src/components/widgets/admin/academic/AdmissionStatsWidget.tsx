import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { WidgetProps } from '../../../../types/widget.types';
import { useAppTheme } from '../../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAdmissionStatsQuery } from '../../../../hooks/queries/admin/useAdmissionStatsQuery';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../../error/errorReporting';

const WIDGET_ID = 'admin.admission-stats';

// Progress bar component for program breakdown
const ProgramBar: React.FC<{
  program: string;
  admitted: number;
  percentage: number;
  color: string;
  onPress?: () => void;
}> = ({ program, admitted, percentage, color, onPress }) => {
  const { colors, borderRadius } = useAppTheme();
  
  return (
    <TouchableOpacity 
      style={styles.programRow} 
      onPress={onPress}
      accessibilityLabel={`${program}: ${admitted} admitted, ${percentage}%`}
    >
      <AppText style={[styles.programName, { color: colors.onSurface }]}>{program}</AppText>
      <View style={[styles.programBarContainer, { backgroundColor: colors.surfaceVariant }]}>
        <View 
          style={[
            styles.programBarFill, 
            { 
              width: `${Math.min(percentage, 100)}%`, 
              backgroundColor: color,
              borderRadius: borderRadius.small,
            }
          ]} 
        />
      </View>
      <AppText style={[styles.programStats, { color: colors.onSurfaceVariant }]}>
        {admitted} ({percentage}%)
      </AppText>
    </TouchableOpacity>
  );
};

export const AdmissionStatsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');
  const { trackWidgetEvent } = useAnalytics();
  const renderStart = useRef(Date.now());

  // Config options with defaults
  const showConversionRate = config?.showConversionRate !== false;
  const showProgramBreakdown = config?.showProgramBreakdown !== false;
  const showPendingFollowUp = config?.showPendingFollowUp !== false;
  const showAddButton = config?.showAddButton !== false;
  const showTrends = config?.showTrends !== false;

  const { data, isLoading, error, refetch } = useAdmissionStatsQuery();

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
    // Navigate to admissions dashboard for comprehensive analytics
    onNavigate?.('admissions-dashboard', {});
  };

  const handleInquiriesTap = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'inquiries_tap' });
    onNavigate?.('admissions-list', { status: 'inquiry' });
  };

  const handleAdmittedTap = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'admitted_tap' });
    onNavigate?.('admissions-list', { status: 'admitted' });
  };

  const handleConversionTap = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'conversion_tap' });
    onNavigate?.('admissions-list', {});
  };

  const handleProgramTap = (program: string) => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'program_tap', program });
    onNavigate?.('admissions-list', { program });
  };

  const handlePendingFollowUpTap = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'pending_followup_tap' });
    onNavigate?.('admissions-list', { status: 'follow-up' });
  };

  const handleAddInquiry = () => {
    trackWidgetEvent(WIDGET_ID, 'click', { action: 'add_inquiry' });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_add_inquiry`,
      level: 'info',
    });
    onNavigate?.('admission-create');
  };

  // Program colors
  const programColors = [colors.primary, colors.tertiary, colors.secondary, colors.warning];

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="school" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.admissionStats.title', { defaultValue: 'Admissions' })}
            </AppText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.admissionStats.states.loading', { defaultValue: 'Loading...' })}
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
            <Icon name="school" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.admissionStats.title', { defaultValue: 'Admissions' })}
            </AppText>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t('widgets.admissionStats.states.error', { defaultValue: 'Failed to load data' })}
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
            <Icon name="school" size={20} color={colors.primary} />
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {t('widgets.admissionStats.title', { defaultValue: 'Admissions' })}
            </AppText>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="account-school-outline" size={48} color={colors.outline} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t('widgets.admissionStats.states.empty', { defaultValue: 'No admission data available' })}
          </AppText>
        </View>
      </View>
    );
  }

  const { 
    period, 
    totalInquiries, 
    totalAdmitted, 
    conversionRate, 
    inquiriesTrend, 
    admittedTrend, 
    conversionTrend,
    byProgram, 
    pendingFollowUps 
  } = data;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="school" size={20} color={colors.primary} />
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.admissionStats.title', { defaultValue: 'Admissions' })} - {period}
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
        {/* Inquiries Card */}
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
          onPress={handleInquiriesTap}
          accessibilityLabel={`${totalInquiries} inquiries`}
        >
          <AppText style={[styles.statValue, { color: colors.onSurface }]}>
            {totalInquiries}
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.admissionStats.inquiries', { defaultValue: 'Inquiries' })}
          </AppText>
          {showTrends && (
            <View style={styles.trendRow}>
              <Icon
                name={inquiriesTrend >= 0 ? 'trending-up' : 'trending-down'}
                size={12}
                color={inquiriesTrend >= 0 ? colors.success : colors.error}
              />
              <AppText
                style={[
                  styles.trendText,
                  { color: inquiriesTrend >= 0 ? colors.success : colors.error },
                ]}
              >
                {inquiriesTrend >= 0 ? '+' : ''}{inquiriesTrend}%
              </AppText>
            </View>
          )}
        </TouchableOpacity>

        {/* Admitted Card */}
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
          onPress={handleAdmittedTap}
          accessibilityLabel={`${totalAdmitted} admitted`}
        >
          <AppText style={[styles.statValue, { color: colors.onSurface }]}>
            {totalAdmitted}
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t('widgets.admissionStats.admitted', { defaultValue: 'Admitted' })}
          </AppText>
          {showTrends && (
            <View style={styles.trendRow}>
              <Icon
                name={admittedTrend >= 0 ? 'trending-up' : 'trending-down'}
                size={12}
                color={admittedTrend >= 0 ? colors.success : colors.error}
              />
              <AppText
                style={[
                  styles.trendText,
                  { color: admittedTrend >= 0 ? colors.success : colors.error },
                ]}
              >
                {admittedTrend >= 0 ? '+' : ''}{admittedTrend}%
              </AppText>
            </View>
          )}
        </TouchableOpacity>

        {/* Conversion Rate Card */}
        {showConversionRate && (
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
            onPress={handleConversionTap}
            accessibilityLabel={`${conversionRate}% conversion rate`}
          >
            <AppText style={[styles.statValue, { color: colors.onSurface }]}>
              {conversionRate}%
            </AppText>
            <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              {t('widgets.admissionStats.conversion', { defaultValue: 'Conversion' })}
            </AppText>
            {showTrends && (
              <View style={styles.trendRow}>
                <Icon
                  name={conversionTrend >= 0 ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={conversionTrend >= 0 ? colors.success : colors.error}
                />
                <AppText
                  style={[
                    styles.trendText,
                    { color: conversionTrend >= 0 ? colors.success : colors.error },
                  ]}
                >
                  {conversionTrend >= 0 ? '+' : ''}{conversionTrend}%
                </AppText>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Program Breakdown */}
      {showProgramBreakdown && byProgram.length > 0 && (
        <View style={[styles.programSection, { borderTopColor: colors.outlineVariant }]}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t('widgets.admissionStats.byProgram', { defaultValue: 'By Program' })}:
          </AppText>
          <View style={styles.programList}>
            {byProgram.map((program, index) => (
              <ProgramBar
                key={program.program}
                program={program.program}
                admitted={program.admitted}
                percentage={program.percentage}
                color={programColors[index % programColors.length]}
                onPress={() => handleProgramTap(program.program)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Pending Follow-ups */}
      {showPendingFollowUp && pendingFollowUps > 0 && (
        <TouchableOpacity
          style={[styles.pendingSection, { backgroundColor: `${colors.warning}15`, borderRadius: borderRadius.medium }]}
          onPress={handlePendingFollowUpTap}
          accessibilityLabel={`${pendingFollowUps} inquiries pending follow-up`}
        >
          <Icon name="clock-outline" size={16} color={colors.warning} />
          <AppText style={[styles.pendingText, { color: colors.warning }]}>
            {pendingFollowUps} {t('widgets.admissionStats.pendingFollowUp', { defaultValue: 'inquiries pending follow-up' })}
          </AppText>
          <AppText style={[styles.viewLink, { color: colors.warning }]}>
            [{t('common:actions.view', { defaultValue: 'View' })}]
          </AppText>
        </TouchableOpacity>
      )}

      {/* Add New Inquiry Button */}
      {showAddButton && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.medium }]}
          onPress={handleAddInquiry}
          accessibilityLabel={t('widgets.admissionStats.addNewInquiry', { defaultValue: 'Add New Inquiry' })}
          accessibilityRole="button"
        >
          <Icon name="plus" size={18} color={colors.primary} />
          <AppText style={[styles.addButtonText, { color: colors.primary }]}>
            {t('widgets.admissionStats.addNewInquiry', { defaultValue: 'Add New Inquiry' })}
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '500',
  },
  programSection: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  programList: {
    gap: 8,
  },
  programRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  programName: {
    fontSize: 12,
    fontWeight: '500',
    width: 60,
  },
  programBarContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  programBarFill: {
    height: '100%',
  },
  programStats: {
    fontSize: 11,
    width: 70,
    textAlign: 'right',
  },
  pendingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    marginTop: 12,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  viewLink: {
    fontSize: 12,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    marginTop: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
