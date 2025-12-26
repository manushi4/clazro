import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppTheme } from '../../theme/useAppTheme';
import { AppText } from '../../ui/components/AppText';
import { getLocalizedField } from '../../utils/getLocalizedField';
import { OfflineBanner } from '../../offline/OfflineBanner';
import { useAttendanceReportsQuery } from '../../hooks/queries/teacher/useAttendanceReportsQuery';

const SCREEN_WIDTH = Dimensions.get('window').width;

type DateRange = 'week' | 'month' | 'quarter';

export function AttendanceReportsScreen() {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('teacher');
  const navigation = useNavigation();

  const [dateRange, setDateRange] = useState<DateRange>('month');

  const { data, isLoading, error } = useAttendanceReportsQuery({ dateRange });

  const trends = data?.trends || [];
  const classComparison = data?.classComparison || [];
  const summary = data?.summary;

  // Get max rate for chart scaling
  const maxRate = useMemo(() => {
    if (!trends.length) return 100;
    return Math.max(...trends.map(t => t.rate), 100);
  }, [trends]);

  const getBarColor = (rate: number) => {
    if (rate >= 90) return colors.success;
    if (rate >= 75) return colors.warning;
    return colors.error;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return 'minus';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return colors.success;
    if (trend === 'down') return colors.error;
    return colors.onSurfaceVariant;
  };

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t('screens.attendanceReports.title', { defaultValue: 'Attendance Reports' })}
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Date Range Selector */}
        <View style={[styles.rangeSelector, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
          {(['week', 'month', 'quarter'] as DateRange[]).map(range => (
            <TouchableOpacity
              key={range}
              style={[
                styles.rangeButton,
                dateRange === range && { backgroundColor: colors.primary },
                { borderRadius: borderRadius.medium }
              ]}
              onPress={() => setDateRange(range)}
            >
              <AppText style={[
                styles.rangeText,
                { color: dateRange === range ? colors.onPrimary : colors.onSurfaceVariant }
              ]}>
                {t(`screens.attendanceReports.${range}`, { defaultValue: range.charAt(0).toUpperCase() + range.slice(1) })}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        {summary && (
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
              <View style={[styles.summaryIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Icon name="percent" size={20} color={colors.primary} />
              </View>
              <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
                {summary.overallRate}%
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                {t('screens.attendanceReports.overallRate', { defaultValue: 'Overall Rate' })}
              </AppText>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
              <View style={[styles.summaryIcon, { backgroundColor: `${colors.success}15` }]}>
                <Icon name="account-group" size={20} color={colors.success} />
              </View>
              <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
                {summary.totalStudents}
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                {t('screens.attendanceReports.totalStudents', { defaultValue: 'Total Students' })}
              </AppText>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
              <View style={[styles.summaryIcon, { backgroundColor: `${colors.error}15` }]}>
                <Icon name="alert-circle" size={20} color={colors.error} />
              </View>
              <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
                {summary.lowAttendanceCount}
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                {t('screens.attendanceReports.atRisk', { defaultValue: 'At Risk' })}
              </AppText>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
              <View style={[styles.summaryIcon, { backgroundColor: `${colors.warning}15` }]}>
                <Icon name="star" size={20} color={colors.warning} />
              </View>
              <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
                {summary.perfectAttendanceCount}
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                {t('screens.attendanceReports.perfect', { defaultValue: 'Perfect' })}
              </AppText>
            </View>
          </View>
        )}

        {/* Trends Chart */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
          <View style={styles.sectionHeader}>
            <Icon name="chart-line" size={20} color={colors.primary} />
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t('screens.attendanceReports.trendsTitle', { defaultValue: 'Attendance Trends' })}
            </AppText>
          </View>

          <View style={styles.chartContainer}>
            {trends.slice(-14).map((point, index) => {
              const height = (point.rate / maxRate) * 100;
              return (
                <View key={index} style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${height}%`,
                        backgroundColor: getBarColor(point.rate),
                        borderRadius: 4,
                      },
                    ]}
                  />
                  <AppText style={[styles.barLabel, { color: colors.onSurfaceVariant }]}>
                    {getDayLabel(point.date)}
                  </AppText>
                </View>
              );
            })}
          </View>

          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>90%+</AppText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
              <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>75-90%</AppText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
              <AppText style={[styles.legendText, { color: colors.onSurfaceVariant }]}>&lt;75%</AppText>
            </View>
          </View>
        </View>

        {/* Class Comparison */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
          <View style={styles.sectionHeader}>
            <Icon name="compare" size={20} color={colors.primary} />
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t('screens.attendanceReports.classComparison', { defaultValue: 'Class Comparison' })}
            </AppText>
          </View>

          {classComparison.map((cls, index) => (
            <View
              key={cls.class_id}
              style={[
                styles.classRow,
                index < classComparison.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant }
              ]}
            >
              <View style={styles.classInfo}>
                <AppText style={[styles.classNameText, { color: colors.onSurface }]}>
                  {getLocalizedField(cls, 'class_name')}
                </AppText>
                <AppText style={[styles.classStudents, { color: colors.onSurfaceVariant }]}>
                  {cls.total_students} {t('screens.attendanceReports.students', { defaultValue: 'students' })}
                </AppText>
              </View>

              <View style={styles.classStats}>
                <View style={styles.rateColumn}>
                  <AppText style={[styles.rateLabel, { color: colors.onSurfaceVariant }]}>
                    {t('screens.attendanceReports.avg', { defaultValue: 'Avg' })}
                  </AppText>
                  <AppText style={[styles.rateValue, { color: getBarColor(cls.average_rate) }]}>
                    {cls.average_rate.toFixed(1)}%
                  </AppText>
                </View>

                <View style={styles.rateColumn}>
                  <AppText style={[styles.rateLabel, { color: colors.onSurfaceVariant }]}>
                    {t('screens.attendanceReports.today', { defaultValue: 'Today' })}
                  </AppText>
                  <AppText style={[styles.rateValue, { color: getBarColor(cls.today_rate) }]}>
                    {cls.today_rate.toFixed(1)}%
                  </AppText>
                </View>

                <Icon
                  name={getTrendIcon(cls.trend)}
                  size={20}
                  color={getTrendColor(cls.trend)}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]}
            onPress={() => navigation.navigate('AttendanceHistory' as never)}
          >
            <Icon name="history" size={20} color={colors.onPrimary} />
            <AppText style={[styles.actionText, { color: colors.onPrimary }]}>
              {t('screens.attendanceReports.viewHistory', { defaultValue: 'View History' })}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error, borderRadius: borderRadius.medium }]}
            onPress={() => navigation.navigate('AttendanceAlerts' as never)}
          >
            <Icon name="alert" size={20} color={colors.onError} />
            <AppText style={[styles.actionText, { color: colors.onError }]}>
              {t('screens.attendanceReports.viewAlerts', { defaultValue: 'View Alerts' })}
            </AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  rangeSelector: {
    flexDirection: 'row',
    padding: 4,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rangeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    padding: 16,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 14,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 9,
    marginTop: 6,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  classInfo: {
    flex: 1,
  },
  classNameText: {
    fontSize: 15,
    fontWeight: '500',
  },
  classStudents: {
    fontSize: 12,
    marginTop: 2,
  },
  classStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rateColumn: {
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  rateValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
