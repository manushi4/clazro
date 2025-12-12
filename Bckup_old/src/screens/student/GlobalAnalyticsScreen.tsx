/**
 * GlobalAnalyticsScreen - Overall Analytics
 * Purpose: Bird's-eye view across all subjects and habits
 * Design: Complete Framer design system with overview cards and subject filters
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Row, T, Button } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';

type Props = NativeStackScreenProps<any, 'GlobalAnalyticsScreen'>;

type SubjectFilter = 'all' | 'math' | 'physics' | 'chemistry' | 'english' | 'biology';

interface AnalyticsData {
  thisWeek: {
    studyTime: number; // in minutes
    assignmentsDone: number;
    assignmentsTotal: number;
    testsAttempted: number;
    trendVsLastWeek: number; // in minutes, can be negative
  };
  subjects: {
    [key: string]: {
      mastery: number; // percentage
      averageTestScore: number; // percentage
      doubtsResolved: number;
      completedTopics: number;
      totalTopics: number;
    };
  };
  streak: {
    studyStreak: number; // days
    averageFocusSession: number; // minutes
    guidedSessionsThisWeek: number;
  };
  recommendations: string[];
}

// Framer Design Colors
const FRAMER_COLORS = {
  background: '#F7F7F7',
  cardBg: '#FFFFFF',
  primary: '#2D5BFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  chipBg: '#F3F4F6',
  chipText: '#374151',
  chipSelectedBg: '#2D5BFF',
  chipSelectedText: '#FFFFFF',
  progressBg: '#E5E7EB',
  progressFill: '#2D5BFF',
  // Subject colors
  mathColor: '#2D5BFF',
  physicsColor: '#F59E0B',
  chemistryColor: '#22C55E',
  englishColor: '#EC4899',
  biologyColor: '#8B5CF6',
};

const SUBJECT_LABELS: Record<SubjectFilter, string> = {
  all: 'All',
  math: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry',
  english: 'English',
  biology: 'Biology',
};

const SUBJECT_ICONS: Record<SubjectFilter, string> = {
  all: 'dashboard',
  math: 'calculate',
  physics: 'science',
  chemistry: 'biotech',
  english: 'menu-book',
  biology: 'eco',
};

const SUBJECT_COLORS: Record<SubjectFilter, string> = {
  all: FRAMER_COLORS.primary,
  math: FRAMER_COLORS.mathColor,
  physics: FRAMER_COLORS.physicsColor,
  chemistry: FRAMER_COLORS.chemistryColor,
  english: FRAMER_COLORS.englishColor,
  biology: FRAMER_COLORS.biologyColor,
};

// Info Row Component
const InfoRow = ({ icon, label, value, trend }: {
  icon: string;
  label: string;
  value: string;
  trend?: string;
}) => (
  <Row style={styles.infoRow}>
    <Icon name={icon} size={20} color={FRAMER_COLORS.textSecondary} />
    <View style={{ flex: 1 }}>
      <T style={styles.infoLabel}>{label}</T>
    </View>
    <T style={styles.infoValue}>{value}</T>
    {trend && (
      <View style={[styles.trendChip, { backgroundColor: `${FRAMER_COLORS.success}1A` }]}>
        <T style={StyleSheet.flatten([styles.trendText, { color: FRAMER_COLORS.success }])}>{trend}</T>
      </View>
    )}
  </Row>
);

// Progress Bar Component
const ProgressBar = ({ percentage, color = FRAMER_COLORS.progressFill }: {
  percentage: number;
  color?: string;
}) => (
  <View style={styles.progressBarContainer}>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
    </View>
    <T style={styles.progressPercentage}>{percentage}%</T>
  </View>
);

// Filter Chip Component
const FilterChip = ({ label, active, onPress, icon }: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon: string;
}) => (
  <Pressable
    style={[styles.filterChip, active && styles.filterChipActive]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`Filter by ${label}`}
  >
    <Icon name={icon} size={16} color={active ? FRAMER_COLORS.chipSelectedText : FRAMER_COLORS.chipText} />
    <T style={StyleSheet.flatten([styles.filterChipText, active && styles.filterChipTextActive])}>
      {label}
    </T>
  </Pressable>
);

export default function GlobalAnalyticsScreen({ navigation }: Props) {
  const [selectedSubject, setSelectedSubject] = useState<SubjectFilter>('all');

  useEffect(() => {
    trackScreenView('GlobalAnalyticsScreen');
  }, []);

  // Fetch analytics data
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      // TODO: Replace with real Supabase queries
      // For now, returning mock data structure
      const mockData: AnalyticsData = {
        thisWeek: {
          studyTime: 320, // 5h 20m
          assignmentsDone: 3,
          assignmentsTotal: 4,
          testsAttempted: 1,
          trendVsLastWeek: 60, // +1h
        },
        subjects: {
          math: {
            mastery: 72,
            averageTestScore: 78,
            doubtsResolved: 6,
            completedTopics: 8,
            totalTopics: 12,
          },
          physics: {
            mastery: 65,
            averageTestScore: 71,
            doubtsResolved: 4,
            completedTopics: 5,
            totalTopics: 10,
          },
          chemistry: {
            mastery: 80,
            averageTestScore: 85,
            doubtsResolved: 2,
            completedTopics: 7,
            totalTopics: 9,
          },
          english: {
            mastery: 88,
            averageTestScore: 90,
            doubtsResolved: 1,
            completedTopics: 10,
            totalTopics: 11,
          },
          biology: {
            mastery: 70,
            averageTestScore: 75,
            doubtsResolved: 5,
            completedTopics: 6,
            totalTopics: 10,
          },
        },
        streak: {
          studyStreak: 4,
          averageFocusSession: 22,
          guidedSessionsThisWeek: 3,
        },
        recommendations: [
          'Complete 1 more assignment to stay on track',
          'Practice Physics problems to improve mastery',
          'Review weak topics in Mathematics',
        ],
      };
      return mockData;
    },
  });

  // Format study time
  const formatStudyTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format trend
  const formatTrend = (minutes: number): string => {
    if (minutes === 0) return '';
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    const sign = minutes > 0 ? '+' : '-';
    if (hours > 0) return `${sign}${hours}h vs last week`;
    return `${sign}${mins}m vs last week`;
  };

  // Get subject data
  const subjectData = useMemo(() => {
    if (!analytics || selectedSubject === 'all') return null;
    return analytics.subjects[selectedSubject];
  }, [analytics, selectedSubject]);

  if (!analytics) {
    return (
      <BaseScreen loading={isLoading} error={error} backgroundColor={FRAMER_COLORS.background}>
        <View />
      </BaseScreen>
    );
  }

  return (
    <BaseScreen loading={isLoading} error={error} backgroundColor={FRAMER_COLORS.background}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.container}>
          {/* Hero / Header */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.heroSection}>
            <T style={styles.heroTitle}>Overall progress</T>
            <T style={styles.heroSubtitle}>See how you're doing across subjects.</T>
          </Animated.View>

          {/* This Week Overview Card */}
          <Animated.View entering={FadeInUp.delay(100).springify().stiffness(120).damping(15)} style={styles.overviewCard}>
            <T style={styles.cardTitle}>This week</T>
            <View style={styles.overviewContent}>
              <InfoRow
                icon="schedule"
                label="Study time"
                value={formatStudyTime(analytics.thisWeek.studyTime)}
                trend={formatTrend(analytics.thisWeek.trendVsLastWeek)}
              />
              <InfoRow
                icon="assignment-turned-in"
                label="Assignments done"
                value={`${analytics.thisWeek.assignmentsDone} / ${analytics.thisWeek.assignmentsTotal}`}
              />
              <InfoRow
                icon="quiz"
                label="Tests attempted"
                value={analytics.thisWeek.testsAttempted.toString()}
              />
            </View>
          </Animated.View>

          {/* Subject Filter Row */}
          <Animated.View entering={FadeInUp.delay(200).springify().stiffness(120).damping(15)} style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {(['all', 'math', 'physics', 'chemistry', 'english', 'biology'] as SubjectFilter[]).map((subject) => (
                <FilterChip
                  key={subject}
                  label={SUBJECT_LABELS[subject]}
                  icon={SUBJECT_ICONS[subject]}
                  active={selectedSubject === subject}
                  onPress={() => {
                    trackAction('filter_subject', 'GlobalAnalyticsScreen', { subject });
                    setSelectedSubject(subject);
                  }}
                />
              ))}
            </ScrollView>
          </Animated.View>

          {/* Subject Snapshot Card */}
          <Animated.View entering={FadeInUp.delay(300).springify().stiffness(120).damping(15)} style={styles.snapshotCard}>
            {selectedSubject === 'all' ? (
              <View style={styles.tipContainer}>
                <Icon name="info-outline" size={24} color={FRAMER_COLORS.primary} />
                <T style={styles.tipText}>Select a subject to see detailed stats.</T>
              </View>
            ) : (
              <>
                <View style={styles.snapshotHeader}>
                  <View style={[styles.subjectIcon, { backgroundColor: `${SUBJECT_COLORS[selectedSubject]}26` }]}>
                    <Icon name={SUBJECT_ICONS[selectedSubject]} size={28} color={SUBJECT_COLORS[selectedSubject]} />
                  </View>
                  <T style={styles.snapshotTitle}>{SUBJECT_LABELS[selectedSubject]}</T>
                </View>

                <View style={styles.snapshotMetrics}>
                  <View style={styles.metricRow}>
                    <T style={styles.metricRowLabel}>Mastery</T>
                    <ProgressBar percentage={subjectData?.mastery || 0} color={SUBJECT_COLORS[selectedSubject]} />
                  </View>

                  <View style={styles.metricRow}>
                    <T style={styles.metricRowLabel}>Average test score</T>
                    <T style={styles.metricRowValue}>{subjectData?.averageTestScore}%</T>
                  </View>

                  <View style={styles.metricRow}>
                    <T style={styles.metricRowLabel}>Doubts resolved</T>
                    <T style={styles.metricRowValue}>{subjectData?.doubtsResolved}</T>
                  </View>

                  <View style={styles.metricRow}>
                    <T style={styles.metricRowLabel}>Completed topics</T>
                    <T style={styles.metricRowValue}>
                      {subjectData?.completedTopics} / {subjectData?.totalTopics}
                    </T>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewDetailsButton}
                  onPress={() => {
                    trackAction('view_subject_analytics', 'GlobalAnalyticsScreen', { subject: selectedSubject });
                    navigation.navigate('SubjectAnalyticsScreen', { subjectCode: selectedSubject.toUpperCase() } as any);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="View detailed subject analytics"
                >
                  <T style={styles.viewDetailsText}>View Details</T>
                  <Icon name="chevron-right" size={20} color={FRAMER_COLORS.primary} />
                </TouchableOpacity>
              </>
            )}
          </Animated.View>

          {/* Streak & Habits Card */}
          <Animated.View entering={FadeInUp.delay(400).springify().stiffness(120).damping(15)} style={styles.streakCard}>
            <T style={styles.cardTitle}>Streak & focus</T>
            <View style={styles.streakMetrics}>
              <Row style={styles.streakRow}>
                <View style={[styles.streakIcon, { backgroundColor: `${FRAMER_COLORS.success}26` }]}>
                  <Icon name="local-fire-department" size={24} color={FRAMER_COLORS.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <T style={styles.streakValue}>{analytics.streak.studyStreak} days</T>
                  <T style={styles.streakLabel}>Study streak</T>
                </View>
              </Row>

              <Row style={styles.streakRow}>
                <View style={[styles.streakIcon, { backgroundColor: `${FRAMER_COLORS.primary}26` }]}>
                  <Icon name="timer" size={24} color={FRAMER_COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <T style={styles.streakValue}>{analytics.streak.averageFocusSession} min</T>
                  <T style={styles.streakLabel}>Average focus session</T>
                </View>
              </Row>

              <Row style={styles.streakRow}>
                <View style={[styles.streakIcon, { backgroundColor: `${FRAMER_COLORS.warning}26` }]}>
                  <Icon name="school" size={24} color={FRAMER_COLORS.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <T style={styles.streakValue}>{analytics.streak.guidedSessionsThisWeek}</T>
                  <T style={styles.streakLabel}>Guided sessions this week</T>
                </View>
              </Row>
            </View>
          </Animated.View>

          {/* Recommendations Card */}
          <Animated.View entering={FadeInUp.delay(500).springify().stiffness(120).damping(15)} style={styles.recommendationsCard}>
            <T style={styles.cardTitle}>Suggested next steps</T>
            <View style={styles.recommendationsList}>
              {analytics.recommendations.map((rec, index) => (
                <Row key={index} style={styles.recommendationRow}>
                  <Icon name="arrow-forward" size={18} color={FRAMER_COLORS.primary} />
                  <T style={styles.recommendationText}>{rec}</T>
                </Row>
              ))}
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Hero
  heroSection: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 4,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 16,
    color: FRAMER_COLORS.textSecondary,
    lineHeight: 24,
  },
  // Overview Card
  overviewCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 16,
  },
  overviewContent: {
    gap: 12,
  },
  infoRow: {
    gap: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
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
    marginBottom: 20,
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
    backgroundColor: FRAMER_COLORS.chipBg,
  },
  filterChipActive: {
    backgroundColor: FRAMER_COLORS.chipSelectedBg,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: FRAMER_COLORS.chipText,
  },
  filterChipTextActive: {
    color: FRAMER_COLORS.chipSelectedText,
  },
  // Snapshot Card
  snapshotCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: `${FRAMER_COLORS.primary}0D`,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
  },
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
    color: FRAMER_COLORS.textPrimary,
  },
  snapshotMetrics: {
    gap: 16,
  },
  metricRow: {
    gap: 8,
  },
  metricRowLabel: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    marginBottom: 4,
  },
  metricRowValue: {
    fontSize: 18,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
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
    backgroundColor: FRAMER_COLORS.progressBg,
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
    color: FRAMER_COLORS.textPrimary,
    minWidth: 40,
    textAlign: 'right',
  },
  // Streak Card
  streakCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  streakMetrics: {
    gap: 16,
  },
  streakRow: {
    gap: 16,
    alignItems: 'center',
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakValue: {
    fontSize: 20,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 2,
  },
  streakLabel: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
  },
  // Recommendations Card
  recommendationsCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationRow: {
    gap: 12,
    alignItems: 'flex-start',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    lineHeight: 20,
  },
  // Metric Card (unused for now but keeping for future)
  metricCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
  },
  metricLabel: {
    fontSize: 12,
    color: FRAMER_COLORS.textSecondary,
    textAlign: 'center',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FRAMER_COLORS.primary,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: FRAMER_COLORS.primary,
  },
});
