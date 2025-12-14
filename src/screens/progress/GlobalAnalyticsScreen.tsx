/**
 * GlobalAnalyticsScreen - Overall Analytics (Fixed Screen)
 * 
 * Bird's-eye view across all subjects and habits.
 * Uses theme, branding, and i18n throughout.
 * Works offline with cached data.
 * 
 * Per STUDENT_COMPLETE_SPEC.md - This is a detail/child screen under Progress tab.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { useAppTheme } from '../../theme/useAppTheme';
import { useBranding } from '../../context/BrandingContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useNetworkStatus } from '../../offline/networkStore';
import { useAnalyticsSnapshotQuery, SubjectSnapshot } from '../../hooks/queries/useAnalyticsSnapshotQuery';
import { AppText } from '../../ui/components/AppText';
import { AppCard } from '../../ui/components/AppCard';
import { OfflineBanner } from '../../offline/OfflineBanner';

type SubjectFilter = 'all' | string;

// Info Row Component
const InfoRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}> = ({ icon, label, value, trend, trendPositive = true, colors }) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={20} color={colors.onSurfaceVariant} />
    <View style={styles.infoContent}>
      <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>{label}</AppText>
    </View>
    <AppText style={[styles.infoValue, { color: colors.onSurface }]}>{value}</AppText>
    {trend && (
      <View style={[styles.trendChip, { backgroundColor: trendPositive ? `${colors.success}20` : `${colors.error}20` }]}>
        <AppText style={[styles.trendText, { color: trendPositive ? colors.success : colors.error }]}>
          {trend}
        </AppText>
      </View>
    )}
  </View>
);

// Progress Bar Component
const ProgressBar: React.FC<{
  percentage: number;
  color: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
}> = ({ percentage, color, colors }) => (
  <View style={styles.progressBarContainer}>
    <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceVariant }]}>
      <View style={[styles.progressBarFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} />
    </View>
    <AppText style={[styles.progressPercentage, { color: colors.onSurface }]}>{percentage}%</AppText>
  </View>
);

// Filter Chip Component
const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  icon: string;
  color?: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
}> = ({ label, active, onPress, icon, color, colors }) => (
  <TouchableOpacity
    style={[
      styles.filterChip,
      { backgroundColor: active ? colors.primary : colors.surfaceVariant },
    ]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={`Filter by ${label}`}
    accessibilityState={{ selected: active }}
  >
    <Icon
      name={icon}
      size={16}
      color={active ? colors.onPrimary : (color || colors.onSurfaceVariant)}
    />
    <AppText
      style={[
        styles.filterChipText,
        { color: active ? colors.onPrimary : colors.onSurfaceVariant },
      ]}
    >
      {label}
    </AppText>
  </TouchableOpacity>
);


// Streak Metric Row Component
const StreakMetricRow: React.FC<{
  icon: string;
  iconBgColor: string;
  iconColor: string;
  value: string;
  label: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
}> = ({ icon, iconBgColor, iconColor, value, label, colors }) => (
  <View style={styles.streakRow}>
    <View style={[styles.streakIcon, { backgroundColor: iconBgColor }]}>
      <Icon name={icon} size={24} color={iconColor} />
    </View>
    <View style={styles.streakContent}>
      <AppText style={[styles.streakValue, { color: colors.onSurface }]}>{value}</AppText>
      <AppText style={[styles.streakLabel, { color: colors.onSurfaceVariant }]}>{label}</AppText>
    </View>
  </View>
);

export const GlobalAnalyticsScreen: React.FC = () => {
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation('progress');
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = useNavigation();

  const [selectedSubject, setSelectedSubject] = useState<SubjectFilter>('all');

  // Fetch analytics data
  const { data: analytics, isLoading, error, refetch, isRefetching } = useAnalyticsSnapshotQuery();

  // Track screen view
  React.useEffect(() => {
    trackScreenView('global-analytics');
  }, [trackScreenView]);

  // Format study time
  const formatStudyTime = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  // Format trend
  const formatTrend = useCallback((minutes: number): string => {
    if (minutes === 0) return '';
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    const sign = minutes > 0 ? '+' : '-';
    if (hours > 0) return `${sign}${hours}h`;
    return `${sign}${mins}m`;
  }, []);

  // Get selected subject data
  const selectedSubjectData = useMemo((): SubjectSnapshot | null => {
    if (!analytics || selectedSubject === 'all') return null;
    return analytics.subjects.find(s => s.subjectId === selectedSubject) || null;
  }, [analytics, selectedSubject]);

  // Handle subject filter
  const handleSubjectFilter = useCallback((subjectId: string) => {
    trackEvent('analytics_filter_subject', 'interaction', { subject: subjectId });
    setSelectedSubject(subjectId);
  }, [trackEvent]);

  // Handle view subject details
  const handleViewSubjectDetails = useCallback(() => {
    if (selectedSubjectData) {
      trackEvent('analytics_view_subject_details', 'navigation', { subject: selectedSubjectData.subjectCode });
      // Navigate to subject analytics screen
      (navigation as any).navigate('subject-analytics', { subjectId: selectedSubjectData.subjectId });
    }
  }, [navigation, selectedSubjectData, trackEvent]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    trackEvent('analytics_refresh', 'interaction');
    refetch();
  }, [refetch, trackEvent]);

  // Loading state
  if (isLoading && !analytics) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <AppText style={{ color: colors.onSurfaceVariant }}>
            {t('common:loading', { defaultValue: 'Loading...' })}
          </AppText>
        </View>
      </View>
    );
  }

  // Error state
  if (error && !analytics) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.onSurface }]}>
            {t('errors.loadFailed', { defaultValue: 'Failed to load analytics' })}
          </AppText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
          >
            <AppText style={{ color: colors.onPrimary }}>
              {t('errors.retry', { defaultValue: 'Retry' })}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!isOnline && <OfflineBanner />}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <AppText style={[styles.heroTitle, { color: colors.onSurface }]}>
            {t('analyticsSnapshot.title', { defaultValue: 'Overall Progress' })}
          </AppText>
          <AppText style={[styles.heroSubtitle, { color: colors.onSurfaceVariant }]}>
            {t('analyticsSnapshot.subtitle', { defaultValue: 'See how you\'re doing across subjects' })}
          </AppText>
        </View>

        {/* This Week Overview Card */}
        <AppCard style={styles.card}>
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]}>
            {t('analyticsSnapshot.studyTime', { defaultValue: 'This Week' })}
          </AppText>
          <View style={styles.overviewContent}>
            <InfoRow
              icon="clock-outline"
              label={t('analyticsSnapshot.studyTime', { defaultValue: 'Study Time' })}
              value={formatStudyTime(analytics?.thisWeek.studyTimeMinutes || 0)}
              trend={formatTrend(analytics?.thisWeek.studyTimeTrend || 0)}
              trendPositive={(analytics?.thisWeek.studyTimeTrend || 0) >= 0}
              colors={colors}
            />
            <InfoRow
              icon="clipboard-check-outline"
              label={t('analyticsSnapshot.assignmentsDone', { defaultValue: 'Assignments Done' })}
              value={`${analytics?.thisWeek.assignmentsDone || 0} / ${analytics?.thisWeek.assignmentsTotal || 0}`}
              colors={colors}
            />
            <InfoRow
              icon="file-document-edit-outline"
              label={t('analyticsSnapshot.testsAttempted', { defaultValue: 'Tests Attempted' })}
              value={String(analytics?.thisWeek.testsAttempted || 0)}
              colors={colors}
            />
          </View>
        </AppCard>


        {/* Subject Filter Row */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <FilterChip
              label={t('subjects.viewAll', { defaultValue: 'All' })}
              icon="view-dashboard-outline"
              active={selectedSubject === 'all'}
              onPress={() => handleSubjectFilter('all')}
              colors={colors}
            />
            {analytics?.subjects.map((subject) => (
              <FilterChip
                key={subject.subjectId}
                label={subject.subjectName}
                icon={subject.icon || 'book-outline'}
                color={subject.color}
                active={selectedSubject === subject.subjectId}
                onPress={() => handleSubjectFilter(subject.subjectId)}
                colors={colors}
              />
            ))}
          </ScrollView>
        </View>

        {/* Subject Snapshot Card */}
        <AppCard style={styles.card}>
          {selectedSubject === 'all' ? (
            <View style={[styles.tipContainer, { backgroundColor: `${colors.primary}10` }]}>
              <Icon name="information-outline" size={24} color={colors.primary} />
              <AppText style={[styles.tipText, { color: colors.onSurfaceVariant }]}>
                {t('analyticsSnapshot.selectSubjectTip', { defaultValue: 'Select a subject to see detailed stats' })}
              </AppText>
            </View>
          ) : selectedSubjectData ? (
            <>
              <View style={styles.snapshotHeader}>
                <View style={[styles.subjectIcon, { backgroundColor: `${selectedSubjectData.color}20` }]}>
                  <Icon name={selectedSubjectData.icon || 'book-outline'} size={28} color={selectedSubjectData.color} />
                </View>
                <AppText style={[styles.snapshotTitle, { color: colors.onSurface }]}>
                  {selectedSubjectData.subjectName}
                </AppText>
              </View>

              <View style={styles.snapshotMetrics}>
                <View style={styles.metricRow}>
                  <AppText style={[styles.metricRowLabel, { color: colors.onSurfaceVariant }]}>
                    {t('subjects.mastery', { defaultValue: 'Mastery' })}
                  </AppText>
                  <ProgressBar
                    percentage={selectedSubjectData.mastery}
                    color={selectedSubjectData.color}
                    colors={colors}
                  />
                </View>

                <View style={styles.metricRow}>
                  <AppText style={[styles.metricRowLabel, { color: colors.onSurfaceVariant }]}>
                    {t('analyticsSnapshot.avgTestScore', { defaultValue: 'Average Test Score' })}
                  </AppText>
                  <AppText style={[styles.metricRowValue, { color: colors.onSurface }]}>
                    {selectedSubjectData.averageTestScore}%
                  </AppText>
                </View>

                <View style={styles.metricRow}>
                  <AppText style={[styles.metricRowLabel, { color: colors.onSurfaceVariant }]}>
                    {t('analyticsSnapshot.doubtsResolved', { defaultValue: 'Doubts Resolved' })}
                  </AppText>
                  <AppText style={[styles.metricRowValue, { color: colors.onSurface }]}>
                    {selectedSubjectData.doubtsResolved}
                  </AppText>
                </View>

                <View style={styles.metricRow}>
                  <AppText style={[styles.metricRowLabel, { color: colors.onSurfaceVariant }]}>
                    {t('analyticsSnapshot.completedTopics', { defaultValue: 'Completed Topics' })}
                  </AppText>
                  <AppText style={[styles.metricRowValue, { color: colors.onSurface }]}>
                    {selectedSubjectData.completedTopics} / {selectedSubjectData.totalTopics}
                  </AppText>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.viewDetailsButton, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]}
                onPress={handleViewSubjectDetails}
                activeOpacity={0.7}
              >
                <AppText style={[styles.viewDetailsText, { color: colors.primary }]}>
                  {t('actions.viewDetails', { defaultValue: 'View Details' })}
                </AppText>
                <Icon name="chevron-right" size={20} color={colors.primary} />
              </TouchableOpacity>
            </>
          ) : null}
        </AppCard>

        {/* Streak & Focus Card */}
        <AppCard style={styles.card}>
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]}>
            {t('analyticsSnapshot.streakFocus', { defaultValue: 'Streak & Focus' })}
          </AppText>
          <View style={styles.streakMetrics}>
            <StreakMetricRow
              icon="fire"
              iconBgColor={`${colors.success}20`}
              iconColor={colors.success}
              value={`${analytics?.streakFocus.studyStreak || 0} ${t('streak.days', { defaultValue: 'days' })}`}
              label={t('streak.current', { defaultValue: 'Study Streak' })}
              colors={colors}
            />
            <StreakMetricRow
              icon="timer-outline"
              iconBgColor={`${colors.primary}20`}
              iconColor={colors.primary}
              value={`${analytics?.streakFocus.averageFocusMinutes || 0} min`}
              label={t('analyticsSnapshot.avgFocusSession', { defaultValue: 'Avg Focus Session' })}
              colors={colors}
            />
            <StreakMetricRow
              icon="school-outline"
              iconBgColor={`${colors.warning}20`}
              iconColor={colors.warning}
              value={String(analytics?.streakFocus.guidedSessionsThisWeek || 0)}
              label={t('analyticsSnapshot.guidedSessions', { defaultValue: 'Guided Sessions' })}
              colors={colors}
            />
          </View>
        </AppCard>

        {/* Recommendations Card */}
        {analytics?.recommendations && analytics.recommendations.length > 0 && (
          <AppCard style={styles.card}>
            <AppText style={[styles.cardTitle, { color: colors.onSurface }]}>
              {t('analyticsSnapshot.recommendations', { defaultValue: 'Suggested Next Steps' })}
            </AppText>
            <View style={styles.recommendationsList}>
              {analytics.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationRow}>
                  <Icon name="arrow-right" size={18} color={colors.primary} />
                  <AppText style={[styles.recommendationText, { color: colors.onSurfaceVariant }]}>
                    {rec}
                  </AppText>
                </View>
              ))}
            </View>
          </AppCard>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  // Hero Section
  heroSection: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  // Cards
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  // Overview Content
  overviewContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Filter Section
  filterSection: {
    marginBottom: 16,
  },
  filterRow: {
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Tip Container
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
  },
  // Snapshot Card
  snapshotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  subjectIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  snapshotMetrics: {
    gap: 16,
  },
  metricRow: {
    gap: 8,
  },
  metricRowLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  metricRowValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  // Progress Bar
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  // Streak Card
  streakMetrics: {
    gap: 16,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakContent: {
    flex: 1,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  streakLabel: {
    fontSize: 14,
  },
  // Recommendations
  recommendationsList: {
    gap: 12,
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  // View Details Button
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 32,
  },
});

export default GlobalAnalyticsScreen;
