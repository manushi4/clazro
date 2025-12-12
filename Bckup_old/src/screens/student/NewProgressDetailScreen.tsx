/**
 * NewProgressDetailScreen - EXACT match to HTML reference
 * Purpose: Student progress with grades, performance metrics, and trends
 * Design: Material Design top bar, stats grid, chart, streak tracker
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { T } from '../../ui';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';

type Props = NativeStackScreenProps<any, 'NewProgressDetailScreen'>;

interface ProgressData {
  overall_grade: number;
  attendance_rate: number;
  assignments_completed: number;
  assignments_total: number;
  subjects: Array<{
    name: string;
    average_grade: number;
  }>;
  recent_grades: Array<{
    assignment_title: string;
    subject: string;
    grade: number;
    total_points: number;
    graded_at: string;
    rank?: number;
  }>;
}

interface StreakDay {
  day: string;
  completed: boolean;
  isToday: boolean;
}

export default function NewProgressDetailScreen({ navigation }: Props) {
  const { user } = useAuth();

  useEffect(() => {
    trackScreenView('NewProgressDetailScreen');
  }, []);

  // Fetch progress data
  const { data: progress, isLoading, refetch } = useQuery({
    queryKey: ['student-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');

      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          assignments(title, subject, total_points, due_date)
        `)
        .eq('student_id', user.id)
        .eq('status', 'graded')
        .not('grade', 'is', null)
        .order('graded_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      const totalSubmissions = submissions?.length || 0;
      const totalGrade = submissions?.reduce((sum, sub) => sum + (sub.grade || 0), 0) || 0;
      const totalPoints = submissions?.reduce(
        (sum, sub) => sum + ((sub.assignments as any)?.total_points || 0),
        0
      ) || 0;

      const overallGrade = totalPoints > 0 ? (totalGrade / totalPoints) * 100 : 88;

      const subjectMap = new Map<string, number[]>();
      submissions?.forEach(sub => {
        const assignment = sub.assignments as any;
        const subject = assignment?.subject || 'Unknown';
        if (!subjectMap.has(subject)) subjectMap.set(subject, []);
        const percentage = assignment.total_points > 0
          ? ((sub.grade || 0) / assignment.total_points) * 100
          : 0;
        subjectMap.get(subject)!.push(percentage);
      });

      const subjects = Array.from(subjectMap.entries()).map(([name, grades]) => ({
        name,
        average_grade: grades.reduce((sum, g) => sum + g, 0) / grades.length,
      }));

      const recentGrades = submissions?.slice(0, 2).map((sub, idx) => ({
        assignment_title: (sub.assignments as any)?.title || 'Untitled',
        subject: (sub.assignments as any)?.subject || 'Unknown',
        grade: sub.grade || 0,
        total_points: (sub.assignments as any)?.total_points || 100,
        graded_at: sub.graded_at || sub.submitted_at || '',
        rank: idx === 0 ? 2 : 18,
      })) || [];

      return {
        overall_grade: overallGrade,
        attendance_rate: 88,
        assignments_completed: totalSubmissions || 12,
        assignments_total: 15,
        subjects: subjects.length > 0 ? subjects : [
          { name: 'Mathematics', average_grade: 95 },
          { name: 'Physics', average_grade: 88 },
          { name: 'History', average_grade: 76 },
          { name: 'Literature', average_grade: 65 },
        ],
        recent_grades: recentGrades.length > 0 ? recentGrades : [
          {
            assignment_title: 'Quantum Mechanics',
            subject: 'Physics',
            grade: 92,
            total_points: 100,
            graded_at: 'Jun 15, 2024',
            rank: 2,
          },
          {
            assignment_title: 'The Renaissance',
            subject: 'History',
            grade: 74,
            total_points: 100,
            graded_at: 'Jun 12, 2024',
            rank: 18,
          },
        ],
      } as ProgressData;
    },
    enabled: !!user?.id,
  });

  const streakDays: StreakDay[] = [
    { day: 'M', completed: true, isToday: false },
    { day: 'T', completed: false, isToday: false },
    { day: 'W', completed: true, isToday: false },
    { day: 'T', completed: true, isToday: false },
    { day: 'F', completed: true, isToday: false },
    { day: 'S', completed: false, isToday: true },
    { day: 'S', completed: false, isToday: false },
  ];

  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return '#28A745'; // success
    if (grade >= 75) return '#FFC107'; // warning
    return '#DC3545'; // danger
  };

  const getGradeLetter = (grade: number): string => {
    if (grade >= 90) return 'A';
    if (grade >= 75) return 'B+';
    if (grade >= 65) return 'C';
    return 'D';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top App Bar - Material Design Standard */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            trackAction('back', 'NewProgressDetailScreen');
            navigation.goBack();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <T variant="h2" style={styles.icon}>←</T>
        </TouchableOpacity>
        <T variant="title" weight="bold" style={styles.topBarTitle}>My Progress</T>
        <TouchableOpacity
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <T variant="h2" style={styles.icon}>⋮</T>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              trackAction('refresh_progress', 'NewProgressDetailScreen');
              refetch();
            }}
          />
        }
      >
        <View style={styles.content}>
          {/* Performance Header */}
          <View style={styles.performanceHeader}>
            <T style={styles.overallGrade}>
              {progress?.overall_grade.toFixed(0) || 88}%
            </T>
            <View style={styles.badgesRow}>
              <View style={styles.gradeBadge}>
                <T variant="caption" style={styles.badgeIcon}>🎓</T>
                <T variant="caption" weight="medium" style={styles.gradeBadgeText}>
                  Grade: {getGradeLetter(progress?.overall_grade || 88)}
                </T>
              </View>
              <View style={styles.rankBadge}>
                <T variant="caption" style={styles.badgeIcon}>🏆</T>
                <T variant="caption" weight="medium" style={styles.rankBadgeText}>
                  Rank: #5/30
                </T>
              </View>
            </View>
          </View>

          {/* Floating Stats - 2x2 Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <T variant="caption" style={styles.statLabel}>Tests Taken</T>
              <T style={styles.statValue}>{progress?.assignments_completed || 12}</T>
            </View>
            <View style={styles.statCard}>
              <T variant="caption" style={styles.statLabel}>Average Grade</T>
              <T style={styles.statValue}>{getGradeLetter(progress?.overall_grade || 88)}</T>
            </View>
            <View style={styles.statCard}>
              <T variant="caption" style={styles.statLabel}>Improvement</T>
              <T style={styles.statValueSuccess}>+5%</T>
            </View>
            <View style={styles.statCard}>
              <T variant="caption" style={styles.statLabel}>Achievements</T>
              <T style={styles.statValue}>8</T>
            </View>
          </View>

          {/* Gamified Learning Hub Card */}
          <TouchableOpacity
            style={styles.gamifiedHubCard}
            onPress={() => {
              trackAction('view_gamified_hub', 'NewProgressDetailScreen');
              // @ts-expect-error
              navigation.navigate('NewGamifiedLearningHub');
            }}
            accessibilityRole="button"
            accessibilityLabel="Open Gamified Learning Hub"
          >
            <View style={styles.gamifiedHubIconContainer}>
              <T style={styles.gamifiedHubIcon}>🎮</T>
            </View>
            <View style={styles.gamifiedHubContent}>
              <T variant="body" weight="bold" style={styles.gamifiedHubTitle}>
                Gamified Learning Hub
              </T>
              <T variant="caption" style={styles.gamifiedHubSubtitle}>
                View XP, badges, leaderboard & challenges
              </T>
            </View>
            <T style={styles.gamifiedHubArrow}>→</T>
          </TouchableOpacity>

          {/* Performance Chart Placeholder */}
          <TouchableOpacity
            style={styles.chartCard}
            onPress={() => {
              trackAction('view_detailed_analytics', 'NewProgressDetailScreen');
              // @ts-expect-error
              navigation.navigate('GlobalAnalyticsScreen');
            }}
            accessibilityRole="button"
            accessibilityLabel="View detailed analytics"
          >
            <T variant="body" weight="semiBold" style={styles.chartTitle}>
              6-Month Performance Trend
            </T>
            <View style={styles.chartSubtitle}>
              <T variant="caption" style={styles.chartPeriod}>Last 6 months</T>
              <T variant="caption" weight="medium" style={styles.chartImprovement}>+5.0%</T>
            </View>
            <View style={styles.chartPlaceholder}>
              <T variant="h1" style={styles.chartEmoji}>📈</T>
              <T variant="caption" style={styles.chartPlaceholderText}>
                Tap to view detailed analytics
              </T>
            </View>
          </TouchableOpacity>

          {/* Study Streak Tracker */}
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <T variant="body" weight="semiBold" style={styles.streakTitle}>
                Study Streak
              </T>
              <View style={styles.longestStreak}>
                <T variant="caption" style={styles.longestStreakLabel}>Longest: </T>
                <T variant="caption" weight="bold" style={styles.longestStreakValue}>21 days</T>
              </View>
            </View>
            <View style={styles.streakDays}>
              {streakDays.map((item, index) => (
                <View key={index} style={styles.streakDayItem}>
                  <T
                    variant="caption"
                    style={item.isToday ? styles.streakDayLabelToday : styles.streakDayLabel}
                  >
                    {item.day}
                  </T>
                  <View
                    style={[
                      styles.streakDayCircle,
                      item.completed && styles.streakDayCompleted,
                      item.isToday && styles.streakDayToday,
                      !item.completed && !item.isToday && styles.streakDayEmpty,
                    ]}
                  >
                    {item.completed && (
                      <T variant="caption" style={styles.streakCheckmark}>✓</T>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Tests */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <T variant="body" weight="semiBold" style={styles.sectionTitle}>
                Recent Tests
              </T>
              <TouchableOpacity
                onPress={() => {
                  trackAction('view_all_tests', 'NewProgressDetailScreen');
                  // @ts-expect-error - Cross-tab navigation to Study
                  navigation.navigate('Study', { screen: 'TestCenterScreen' });
                }}
                accessibilityRole="button"
                accessibilityLabel="View all tests"
              >
                <T variant="caption" weight="medium" style={styles.viewAllLink}>View all →</T>
              </TouchableOpacity>
            </View>
            <View style={styles.testsList}>
              {progress?.recent_grades.map((test, index) => {
                const percentage = (test.grade / test.total_points) * 100;
                const gradeColor = getGradeColor(percentage);
                const gradeLetter = getGradeLetter(percentage);

                return (
                  <View key={index} style={styles.testCard}>
                    <View style={styles.testCardHeader}>
                      <View>
                        <T variant="body" weight="semiBold" style={styles.testSubject}>
                          {test.subject}
                        </T>
                        <T variant="caption" style={styles.testTitle}>
                          {test.assignment_title}
                        </T>
                      </View>
                      <T style={{ ...styles.testGrade, color: gradeColor }}>
                        {percentage.toFixed(0)}%
                      </T>
                    </View>
                    <View style={styles.testCardFooter}>
                      <View style={styles.testBadges}>
                        <View style={[styles.testBadge, { backgroundColor: `${gradeColor}33` }]}>
                          <T variant="caption" weight="medium" style={{ ...styles.testBadgeText, color: gradeColor }}>
                            Grade: {gradeLetter}
                          </T>
                        </View>
                        <View style={styles.rankBadgeSmall}>
                          <T variant="caption" weight="medium" style={styles.rankBadgeSmallText}>
                            Rank: #{test.rank}/30
                          </T>
                        </View>
                      </View>
                      <T variant="caption" style={styles.testDate}>{test.graded_at}</T>
                    </View>
                    <TouchableOpacity
                      style={styles.viewDetailsButton}
                      onPress={() => {
                        trackAction('view_test_review', 'NewProgressDetailScreen', { testId: index });
                        // @ts-expect-error - Cross-tab navigation to Study
                        navigation.navigate('Study', { screen: 'TestReviewScreen', params: { testId: `test-${index}` } });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="View test review"
                    >
                      <T variant="caption" weight="semiBold" style={styles.viewDetailsText}>
                        View Details
                      </T>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Subject Performance */}
          <View style={styles.section}>
            <T variant="body" weight="semiBold" style={styles.sectionTitle}>
              Subject Performance
            </T>
            <View style={styles.subjectsCard}>
              {progress?.subjects.map((subject, index) => {
                const barColor = getGradeColor(subject.average_grade);

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.subjectItem}
                    onPress={() => {
                      trackAction('view_subject_analytics', 'NewProgressDetailScreen', { subject: subject.name });
                      // @ts-expect-error
                      navigation.navigate('SubjectAnalyticsScreen', { subjectName: subject.name });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${subject.name} analytics`}
                  >
                    <View style={styles.subjectHeader}>
                      <T variant="caption" weight="medium" style={styles.subjectName}>
                        {subject.name}
                      </T>
                      <T variant="caption" weight="medium" style={styles.subjectGrade}>
                        {subject.average_grade.toFixed(0)}%
                      </T>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${subject.average_grade}%`,
                            backgroundColor: barColor,
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Quick Actions - Quests, Leaderboard, Share */}
          <View style={styles.section}>
            <T variant="body" weight="semiBold" style={styles.sectionTitle}>
              Quick Actions
            </T>

            {/* Quests Card */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                trackAction('open_quests', 'NewProgressDetailScreen');
                // @ts-expect-error
                navigation.navigate('QuestsScreen');
              }}
              accessibilityRole="button"
              accessibilityLabel="Open quests"
            >
              <View style={styles.quickActionIconContainer}>
                <T style={styles.quickActionIcon}>🎯</T>
              </View>
              <View style={styles.quickActionContent}>
                <T variant="body" weight="semiBold" style={styles.quickActionTitle}>Quests</T>
                <T variant="caption" style={styles.quickActionSubtitle}>Complete challenges & earn rewards</T>
              </View>
              <T style={styles.quickActionArrow}>→</T>
            </TouchableOpacity>

            {/* Leaderboard Card */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                trackAction('open_leaderboard', 'NewProgressDetailScreen');
                // @ts-expect-error
                navigation.navigate('LeaderboardScreen');
              }}
              accessibilityRole="button"
              accessibilityLabel="View leaderboard"
            >
              <View style={styles.quickActionIconContainer}>
                <T style={styles.quickActionIcon}>🏆</T>
              </View>
              <View style={styles.quickActionContent}>
                <T variant="body" weight="semiBold" style={styles.quickActionTitle}>Leaderboard</T>
                <T variant="caption" style={styles.quickActionSubtitle}>See your class ranking</T>
              </View>
              <T style={styles.quickActionArrow}>→</T>
            </TouchableOpacity>

            {/* Share Progress Card */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                trackAction('share_progress', 'NewProgressDetailScreen');
                // @ts-expect-error
                navigation.navigate('ShareProgressReportScreen');
              }}
              accessibilityRole="button"
              accessibilityLabel="Share progress report"
            >
              <View style={styles.quickActionIconContainer}>
                <T style={styles.quickActionIcon}>📊</T>
              </View>
              <View style={styles.quickActionContent}>
                <T variant="body" weight="semiBold" style={styles.quickActionTitle}>Share Report</T>
                <T variant="caption" style={styles.quickActionSubtitle}>Share your progress with parents</T>
              </View>
              <T style={styles.quickActionArrow}>→</T>
            </TouchableOpacity>
          </View>

          {/* Active Quests Preview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <T variant="body" weight="semiBold" style={styles.sectionTitle}>
                Active Quests
              </T>
              <TouchableOpacity
                onPress={() => {
                  trackAction('view_all_quests', 'NewProgressDetailScreen');
                  // @ts-expect-error
                  navigation.navigate('QuestsScreen');
                }}
                accessibilityRole="button"
                accessibilityLabel="View all quests"
              >
                <T variant="caption" weight="medium" style={styles.viewAllLink}>View all →</T>
              </TouchableOpacity>
            </View>

            {/* Quest Preview Row 1 */}
            <TouchableOpacity
              style={styles.questPreviewCard}
              onPress={() => {
                trackAction('view_quest_detail', 'NewProgressDetailScreen', { questId: 'quest-1' });
                // @ts-expect-error
                navigation.navigate('QuestDetailScreen', { questId: 'quest-1' });
              }}
              accessibilityRole="button"
              accessibilityLabel="View quest: Complete 5 Assignments"
            >
              <View style={styles.questIconContainer}>
                <T style={styles.questIcon}>📝</T>
              </View>
              <View style={styles.questContent}>
                <T variant="body" weight="semiBold" style={styles.questTitle}>Complete 5 Assignments</T>
                <View style={styles.questProgressRow}>
                  <View style={styles.questProgressBar}>
                    <View style={[styles.questProgressFill, { width: '60%' }]} />
                  </View>
                  <T variant="caption" style={styles.questProgressText}>3/5</T>
                </View>
                <T variant="caption" style={styles.questReward}>🏆 +50 XP</T>
              </View>
            </TouchableOpacity>

            {/* Quest Preview Row 2 */}
            <TouchableOpacity
              style={styles.questPreviewCard}
              onPress={() => {
                trackAction('view_quest_detail', 'NewProgressDetailScreen', { questId: 'quest-2' });
                // @ts-expect-error
                navigation.navigate('QuestDetailScreen', { questId: 'quest-2' });
              }}
              accessibilityRole="button"
              accessibilityLabel="View quest: 7-Day Study Streak"
            >
              <View style={styles.questIconContainer}>
                <T style={styles.questIcon}>🔥</T>
              </View>
              <View style={styles.questContent}>
                <T variant="body" weight="semiBold" style={styles.questTitle}>7-Day Study Streak</T>
                <View style={styles.questProgressRow}>
                  <View style={styles.questProgressBar}>
                    <View style={[styles.questProgressFill, { width: '71%' }]} />
                  </View>
                  <T variant="caption" style={styles.questProgressText}>5/7</T>
                </View>
                <T variant="caption" style={styles.questReward}>🏆 +100 XP</T>
              </View>
            </TouchableOpacity>
          </View>

          {/* Weak Topics - Need Practice */}
          <View style={styles.section}>
            <T variant="body" weight="semiBold" style={styles.sectionTitle}>
              Topics to Strengthen
            </T>
            <T variant="caption" style={styles.sectionSubtitle}>
              Areas where you can improve your performance
            </T>

            {/* Weak Topic 1 */}
            <TouchableOpacity
              style={styles.weakTopicCard}
              onPress={() => {
                trackAction('practice_weak_topic', 'NewProgressDetailScreen', { topic: 'Quadratic Equations' });
                // @ts-expect-error - Cross-tab navigation to Study
                navigation.navigate('Study', { screen: 'NewEnhancedAIStudy', params: { topicId: 'quadratic-equations' } });
              }}
              accessibilityRole="button"
              accessibilityLabel="Practice Quadratic Equations"
            >
              <View style={styles.weakTopicHeader}>
                <View>
                  <T variant="body" weight="semiBold" style={styles.weakTopicTitle}>Quadratic Equations</T>
                  <T variant="caption" style={styles.weakTopicSubject}>Mathematics</T>
                </View>
                <View style={styles.weakTopicScoreBadge}>
                  <T variant="caption" weight="bold" style={styles.weakTopicScore}>62%</T>
                </View>
              </View>
              <View style={styles.weakTopicFooter}>
                <T variant="caption" style={styles.weakTopicHint}>💡 Practice with AI tutor</T>
                <View style={styles.weakTopicButton}>
                  <T variant="caption" weight="semiBold" style={styles.weakTopicButtonText}>Practice Now</T>
                </View>
              </View>
            </TouchableOpacity>

            {/* Weak Topic 2 */}
            <TouchableOpacity
              style={styles.weakTopicCard}
              onPress={() => {
                trackAction('practice_weak_topic', 'NewProgressDetailScreen', { topic: 'Thermodynamics' });
                // @ts-expect-error - Cross-tab navigation to Study
                navigation.navigate('Study', { screen: 'NewEnhancedAIStudy', params: { topicId: 'thermodynamics' } });
              }}
              accessibilityRole="button"
              accessibilityLabel="Practice Thermodynamics"
            >
              <View style={styles.weakTopicHeader}>
                <View>
                  <T variant="body" weight="semiBold" style={styles.weakTopicTitle}>Thermodynamics</T>
                  <T variant="caption" style={styles.weakTopicSubject}>Physics</T>
                </View>
                <View style={styles.weakTopicScoreBadge}>
                  <T variant="caption" weight="bold" style={styles.weakTopicScore}>58%</T>
                </View>
              </View>
              <View style={styles.weakTopicFooter}>
                <T variant="caption" style={styles.weakTopicHint}>💡 Practice with AI tutor</T>
                <View style={styles.weakTopicButton}>
                  <T variant="caption" weight="semiBold" style={styles.weakTopicButtonText}>Practice Now</T>
                </View>
              </View>
            </TouchableOpacity>

            {/* Weak Topic 3 */}
            <TouchableOpacity
              style={styles.weakTopicCard}
              onPress={() => {
                trackAction('practice_weak_topic', 'NewProgressDetailScreen', { topic: 'Organic Chemistry' });
                // @ts-expect-error - Cross-tab navigation to Study
                navigation.navigate('Study', { screen: 'NewEnhancedAIStudy', params: { topicId: 'organic-chemistry' } });
              }}
              accessibilityRole="button"
              accessibilityLabel="Practice Organic Chemistry"
            >
              <View style={styles.weakTopicHeader}>
                <View>
                  <T variant="body" weight="semiBold" style={styles.weakTopicTitle}>Organic Chemistry</T>
                  <T variant="caption" style={styles.weakTopicSubject}>Chemistry</T>
                </View>
                <View style={styles.weakTopicScoreBadge}>
                  <T variant="caption" weight="bold" style={styles.weakTopicScore}>55%</T>
                </View>
              </View>
              <View style={styles.weakTopicFooter}>
                <T variant="caption" style={styles.weakTopicHint}>💡 Practice with AI tutor</T>
                <View style={styles.weakTopicButton}>
                  <T variant="caption" weight="semiBold" style={styles.weakTopicButtonText}>Practice Now</T>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  // Top App Bar - Material Design Standard
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  icon: {
    fontSize: 24,
    color: '#333333',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  content: {
    padding: 16,

    paddingBottom: 32,
  },
  // Performance Header
  performanceHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  overallGrade: {
    fontSize: 36,
    fontWeight: '700',
    color: '#333333',
  },
  badgesRow: {
    flexDirection: 'row',

    marginTop: 8,
  },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    height: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
  },
  badgeIcon: {
    fontSize: 16,
  },
  gradeBadgeText: {
    fontSize: 14,
    color: '#4A90E2',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    height: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  rankBadgeText: {
    fontSize: 14,
    color: '#FFC107',
  },
  // Floating Stats - 2x2 Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
  },
  statValueSuccess: {
    fontSize: 28,
    fontWeight: '700',
    color: '#28A745',
  },
  // Gamified Learning Hub Card
  gamifiedHubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  gamifiedHubIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gamifiedHubIcon: {
    fontSize: 32,
  },
  gamifiedHubContent: {
    flex: 1,

  },
  gamifiedHubTitle: {
    fontSize: 16,
    color: '#333333',
  },
  gamifiedHubSubtitle: {
    fontSize: 13,
    color: '#757575',
  },
  gamifiedHubArrow: {
    fontSize: 24,
    color: '#4A90E2',
  },
  // Performance Chart
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    color: '#333333',
  },
  chartSubtitle: {
    flexDirection: 'row',
    alignItems: 'baseline',

    marginTop: 4,
  },
  chartPeriod: {
    fontSize: 14,
    color: '#757575',
  },
  chartImprovement: {
    fontSize: 14,
    color: '#28A745',
  },
  chartPlaceholder: {
    height: 180,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,

  },
  chartEmoji: {
    fontSize: 48,
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: '#757575',
  },
  // Study Streak Tracker
  streakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakTitle: {
    fontSize: 16,
    color: '#333333',
  },
  longestStreak: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  longestStreakLabel: {
    fontSize: 14,
    color: '#757575',
  },
  longestStreakValue: {
    fontSize: 14,
    color: '#4A90E2',
  },
  streakDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakDayItem: {
    alignItems: 'center',

  },
  streakDayLabel: {
    fontSize: 12,
    color: '#757575',
  },
  streakDayLabelToday: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333333',
  },
  streakDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakDayCompleted: {
    backgroundColor: '#28A745',
  },
  streakDayToday: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  streakDayEmpty: {
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  streakCheckmark: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  // Sections
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#333333',
    paddingHorizontal: 8,
  },
  viewAllLink: {
    fontSize: 14,
    color: '#4A90E2',
  },
  // Recent Tests
  testsList: {

  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  testCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  testSubject: {
    fontSize: 16,
    color: '#333333',
  },
  testTitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  testGrade: {
    fontSize: 24,
    fontWeight: '700',
  },
  testCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  testBadges: {
    flexDirection: 'row',

  },
  testBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  testBadgeText: {
    fontSize: 12,
  },
  rankBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  rankBadgeSmallText: {
    fontSize: 12,
    color: '#FFC107',
  },
  testDate: {
    fontSize: 12,
    color: '#757575',
  },
  viewDetailsButton: {
    marginTop: 16,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  // Subject Performance
  subjectsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  subjectItem: {

  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subjectName: {
    fontSize: 14,
    color: '#333333',
  },
  subjectGrade: {
    fontSize: 14,
    color: '#333333',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Quick Action Cards
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionContent: {
    flex: 1,
    marginLeft: 16,
  },
  quickActionTitle: {
    fontSize: 16,
    color: '#333333',
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  quickActionArrow: {
    fontSize: 20,
    color: '#757575',
  },
  // Quest Preview Cards
  questPreviewCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  questIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questIcon: {
    fontSize: 28,
  },
  questContent: {
    flex: 1,
    marginLeft: 16,
  },
  questTitle: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  questProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  questProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  questProgressFill: {
    height: '100%',
    backgroundColor: '#FFC107',
    borderRadius: 3,
  },
  questProgressText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
  },
  questReward: {
    fontSize: 12,
    color: '#4A90E2',
  },
  // Weak Topics Section
  sectionSubtitle: {
    fontSize: 13,
    color: '#757575',
    paddingHorizontal: 8,
    marginTop: -8,
    marginBottom: 12,
  },
  weakTopicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  weakTopicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  weakTopicTitle: {
    fontSize: 16,
    color: '#333333',
  },
  weakTopicSubject: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  weakTopicScoreBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  weakTopicScore: {
    fontSize: 14,
    color: '#F59E0B',
  },
  weakTopicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weakTopicHint: {
    fontSize: 12,
    color: '#757575',
  },
  weakTopicButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  weakTopicButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
  },
});
