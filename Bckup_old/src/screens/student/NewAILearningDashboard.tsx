/**
 * NewAILearningDashboard - EXACT match to HTML reference
 * Purpose: AI-powered learning analytics and recommendations
 * Design: Material Design top bar, gradient header, charts, expandable focus areas, timeline, predictions
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
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { T } from '../../ui';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';

export default function NewAILearningDashboard() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  useEffect(() => {
    trackScreenView('NewAILearningDashboard');
  }, []);

  // Fetch AI focus areas
  const { data: focusAreasData } = useQuery({
    queryKey: ['ai-focus-areas', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('ai_focus_areas')
        .select('*')
        .eq('student_id', user.id)
        .order('priority', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error fetching focus areas:', error);
        return [];
      }

      return data?.map((area, idx) => ({
        id: area.id,
        title: area.title,
        description: area.description,
        isExpanded: idx === 0  // First one expanded by default
      })) || [];
    },
    enabled: !!user?.id,
  });

  // Fetch weekly activity data
  const { data: weeklyActivityData, refetch: refetchWeekly } = useQuery({
    queryKey: ['weekly-activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const { data, error } = await supabase
        .from('study_sessions')
        .select('duration_minutes, date')
        .eq('student_id', user.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching weekly activity:', error);
        return null;
      }

      // Calculate daily hours for the past 7 days
      const dailyMinutes: number[] = new Array(7).fill(0);
      data?.forEach(session => {
        const sessionDate = new Date(session.date);
        const dayIndex = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 7) {
          dailyMinutes[6 - dayIndex] += session.duration_minutes || 0;
        }
      });

      const totalMinutes = dailyMinutes.reduce((sum, min) => sum + min, 0);
      const totalHours = totalMinutes / 60;

      // Calculate percentage normalized to 100 for chart display
      const maxMinutes = Math.max(...dailyMinutes, 1);
      const dailyHours = dailyMinutes.map(min => Math.round((min / maxMinutes) * 100));

      return {
        totalHours: Math.round(totalHours * 10) / 10,
        percentChange: 10, // Could calculate from previous week
        dailyHours
      };
    },
    enabled: !!user?.id,
  });

  // Fetch subject breakdown data
  const { data: subjectBreakdownData } = useQuery({
    queryKey: ['subject-breakdown', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const { data, error } = await supabase
        .from('study_sessions')
        .select('subject, duration_minutes')
        .eq('student_id', user.id)
        .gte('date', oneMonthAgo.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching subject breakdown:', error);
        return null;
      }

      // Aggregate by subject
      const subjectMap = new Map<string, number>();
      data?.forEach(session => {
        const subject = session.subject || 'Other';
        subjectMap.set(subject, (subjectMap.get(subject) || 0) + (session.duration_minutes || 0));
      });

      const totalMinutes = Array.from(subjectMap.values()).reduce((sum, min) => sum + min, 0);
      const colors = ['#4A90E2', '#50E3C2', '#A78BFA', '#F59E0B', '#EF4444'];

      const subjects = Array.from(subjectMap.entries())
        .map(([name, minutes], index) => ({
          name,
          percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
          color: colors[index % colors.length]
        }))
        .sort((a, b) => b.percentage - a.percentage);

      return { subjects };
    },
    enabled: !!user?.id,
  });

  // Fetch today's AI study plan
  const { data: studyPlanData } = useQuery({
    queryKey: ['ai-study-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('ai_study_plan')
        .select('*')
        .eq('student_id', user.id)
        .eq('date', today)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching study plan:', error);
        return [];
      }

      return data?.map(session => ({
        time: `${session.start_time} - ${session.end_time}`,
        title: session.title || '',
        subtitle: session.subtitle || '',
        type: session.type as 'study' | 'break'
      })) || [];
    },
    enabled: !!user?.id,
  });

  // Fetch grade predictions
  const { data: gradePredictionsData } = useQuery({
    queryKey: ['grade-predictions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('ai_grade_predictions')
        .select('*')
        .eq('student_id', user.id)
        .order('predicted_grade', { ascending: false });

      if (error) {
        console.error('Error fetching grade predictions:', error);
        return [];
      }

      return data?.map(prediction => ({
        subject: prediction.subject || '',
        grade: prediction.predicted_grade || 'N/A',
        percentage: prediction.percentage || 0,
        tip: prediction.tip || '',
        color: prediction.color || '#4A90E2'
      })) || [];
    },
    enabled: !!user?.id,
  });

  const toggleFocusArea = (id: string) => {
    setExpandedAreas((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const focusAreas = focusAreasData || [];

  const weeklyActivity = weeklyActivityData || {
    totalHours: 0,
    percentChange: 0,
    dailyHours: [0, 0, 0, 0, 0, 0, 0],
  };

  const subjectBreakdown = subjectBreakdownData || {
    subjects: [],
  };

  const studyPlan = studyPlanData || [];
  const gradePredictions = gradePredictionsData || [];

  const isLoading = false; // Can aggregate loading states if needed

  const refetch = async () => {
    await refetchWeekly();
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            trackAction('back', 'NewAILearningDashboard');
            navigation.goBack();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <T variant="h2" style={styles.icon}>←</T>
        </TouchableOpacity>
        <T variant="title" weight="bold" style={styles.topBarTitle}>
          AI Learning Dashboard
        </T>
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
              trackAction('refresh_ai_dashboard', 'NewAILearningDashboard');
              refetch();
            }}
          />
        }
      >
        {/* Gradient Header Card */}
        <View style={styles.headerContainer}>
          <View style={styles.gradientCard}>
            <T style={styles.psychologyIcon}>🧠</T>
            <T style={styles.gradientTitle}>Your AI Study Insights</T>
          </View>
        </View>

        {/* Weekly Activity Section */}
        <T variant="body" weight="bold" style={styles.sectionTitle}>
          Weekly Activity
        </T>

        <View style={styles.chartsRow}>
          {/* Weekly Study Time Chart */}
          <View style={styles.chartCard}>
            <T variant="body" weight="medium" style={styles.chartCardTitle}>
              Weekly Study Time
            </T>
            <T style={styles.chartCardValue}>{weeklyActivity.totalHours} Hours</T>
            <View style={styles.chartCardMeta}>
              <T variant="caption" style={styles.chartCardLabel}>This Week</T>
              <T variant="caption" style={styles.chartCardChange}>
                +{weeklyActivity.percentChange}%
              </T>
            </View>

            {/* Bar Chart */}
            <View style={styles.barChart}>
              {weeklyActivity.dailyHours.map((height, index) => (
                <View key={index} style={styles.barColumn}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${height}%`,
                        backgroundColor: index === 3 ? '#50E3C2' : 'rgba(74, 144, 226, 0.2)',
                      },
                    ]}
                  />
                  <T variant="caption" style={styles.barLabel}>{days[index]}</T>
                </View>
              ))}
            </View>
          </View>

          {/* Subject Breakdown Pie Chart */}
          <View style={styles.chartCard}>
            <T variant="body" weight="medium" style={styles.chartCardTitle}>
              Subject Breakdown
            </T>

            {/* Donut Chart Placeholder */}
            <View style={styles.donutChartContainer}>
              <View style={styles.donutChart}>
                <View style={styles.donutCenter}>
                  <T style={styles.donutCenterNumber}>4</T>
                  <T variant="caption" style={styles.donutCenterLabel}>Subjects</T>
                </View>
              </View>
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              {subjectBreakdown.subjects.map((subject, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={styles.legendItemLeft}>
                    <View style={[styles.legendDot, { backgroundColor: subject.color }]} />
                    <T variant="caption" style={styles.legendName}>{subject.name}</T>
                  </View>
                  <T variant="caption" weight="medium" style={styles.legendPercentage}>
                    {subject.percentage}%
                  </T>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Focus Areas */}
        <T variant="body" weight="bold" style={styles.sectionTitle}>
          Focus Areas
        </T>

        <View style={styles.focusAreasContainer}>
          {focusAreas.map((area, index) => {
            const isExpanded = index === 0 ? !expandedAreas.has(area.id) : expandedAreas.has(area.id);
            return (
              <View key={area.id} style={styles.focusAreaCard}>
                <TouchableOpacity
                  style={styles.focusAreaHeader}
                  onPress={() => toggleFocusArea(area.id)}
                >
                  <T variant="body" weight="medium" style={styles.focusAreaTitle}>
                    {area.title}
                  </T>
                  <T
                    variant="h2"
                    style={isExpanded ? styles.expandIconRotated : styles.expandIcon}
                  >
                    ⌄
                  </T>
                </TouchableOpacity>

                {isExpanded && (
                <View style={styles.focusAreaContent}>
                  <T variant="caption" style={styles.focusAreaDescription}>
                    {area.description}
                  </T>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.practiceButton}
                      onPress={() => {
                        trackAction('start_practice_test', 'NewAILearningDashboard', {
                          focusArea: area.title,
                        });
                        // @ts-expect-error - Student routes not yet in ParentStackParamList
                        safeNavigate('AIPracticeProblems', { focusArea: area.title });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Start practice test"
                    >
                      <T variant="body" style={styles.practiceIcon}>❓</T>
                      <T variant="caption" weight="bold" style={styles.practiceButtonText}>
                        Start Practice Test
                      </T>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.summaryButton}
                      onPress={() => {
                        trackAction('view_study_summaries', 'NewAILearningDashboard', {
                          focusArea: area.title,
                        });
                        // @ts-expect-error - Student routes not yet in ParentStackParamList
                        safeNavigate('AIStudySummaries', { focusArea: area.title });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="View AI study summaries"
                    >
                      <T variant="body" style={styles.summaryIcon}>📝</T>
                      <T variant="caption" weight="bold" style={styles.summaryButtonText}>
                        AI Study Summaries
                      </T>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              </View>
            );
          })}
        </View>

        {/* Today's AI Plan */}
        <T variant="body" weight="bold" style={styles.sectionTitle}>
          Today's AI Plan
        </T>

        <View style={styles.planContainer}>
          <View style={styles.planCard}>
            {studyPlan.map((session, index) => (
              <View key={index} style={styles.planItem}>
                <T variant="caption" weight="medium" style={styles.planTime}>
                  {session.time}
                </T>
                <View
                  style={[
                    styles.planContent,
                    session.type === 'study'
                      ? styles.planContentStudy
                      : styles.planContentBreak,
                  ]}
                >
                  <T
                    variant="body"
                    weight="semiBold"
                    style={
                      session.type === 'study'
                        ? styles.planTitleStudy
                        : styles.planTitleBreak
                    }
                  >
                    {session.title}
                  </T>
                  <T
                    variant="caption"
                    style={
                      session.type === 'study'
                        ? styles.planSubtitleStudy
                        : styles.planSubtitleBreak
                    }
                  >
                    {session.subtitle}
                  </T>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Grade Predictions */}
        <T variant="body" weight="bold" style={styles.sectionTitle}>
          Grade Predictions
        </T>

        <View style={styles.predictionsContainer}>
          <View style={styles.predictionsCard}>
            {gradePredictions.map((prediction, index) => (
              <View key={index} style={styles.predictionItem}>
                <View style={styles.predictionHeader}>
                  <T variant="body" weight="medium" style={styles.predictionSubject}>
                    {prediction.subject}
                  </T>
                  <T
                    variant="title"
                    weight="bold"
                    style={{ ...styles.predictionGrade, color: prediction.color }}
                  >
                    {prediction.grade}
                  </T>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarTrack} />
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${prediction.percentage}%`,
                        backgroundColor: prediction.color,
                      },
                    ]}
                  />
                </View>
                <T variant="caption" style={styles.predictionTip}>
                  {prediction.tip}
                </T>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button - Chat with AI Tutor */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          trackAction('open_ai_chat', 'NewAILearningDashboard');
          // @ts-expect-error - Student routes not yet in ParentStackParamList
          safeNavigate('NewAITutorChat');
        }}
        accessibilityRole="button"
        accessibilityLabel="Chat with AI Tutor"
      >
        <T style={styles.fabIcon}>💬</T>
      </TouchableOpacity>
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
  // Top App Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 8,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBE0E6',
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
  // Gradient Header Card
  headerContainer: {
    padding: 16,
  },
  gradientCard: {
    position: 'relative',
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    padding: 24,
    minHeight: 160,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  psychologyIcon: {
    position: 'absolute',
    right: -16,
    top: -16,
    fontSize: 120,
    opacity: 0.2,
    color: '#FFFFFF',
  },
  gradientTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  // Section Titles
  sectionTitle: {
    fontSize: 22,
    color: '#333333',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
  },
  // Charts Row
  chartsRow: {
    flexDirection: 'column',

    paddingHorizontal: 16,
    marginBottom: 20,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBE0E6',
    padding: 24,

  },
  chartCardTitle: {
    fontSize: 16,
    color: '#333333',
  },
  chartCardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333333',
  },
  chartCardMeta: {
    flexDirection: 'row',

  },
  chartCardLabel: {
    fontSize: 14,
    color: '#617589',
  },
  chartCardChange: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  // Bar Chart
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 180,

    paddingTop: 16,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',

  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  barLabel: {
    fontSize: 13,
    color: '#617589',
  },
  // Donut Chart
  donutChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  donutChart: {
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 16,
    borderColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutCenter: {
    alignItems: 'center',
  },
  donutCenterNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
  },
  donutCenterLabel: {
    fontSize: 14,
    color: '#617589',
  },
  // Legend
  legend: {

  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendName: {
    fontSize: 14,
    color: '#333333',
  },
  legendPercentage: {
    fontSize: 14,
    color: '#617589',
  },
  // Focus Areas
  focusAreasContainer: {
    paddingHorizontal: 16,

  },
  focusAreaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBE0E6',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  focusAreaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  focusAreaTitle: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  expandIcon: {
    fontSize: 24,
    color: '#333333',
  },
  expandIconRotated: {
    fontSize: 24,
    color: '#333333',
    transform: [{ rotate: '180deg' }],
  },
  focusAreaContent: {
    paddingBottom: 16,
  },
  focusAreaDescription: {
    fontSize: 14,
    color: '#617589',
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',

  },
  practiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#50E3C2',
    borderRadius: 6,
    paddingVertical: 10,
  },
  practiceIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  practiceButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  summaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#4A90E2',
    borderRadius: 6,
    paddingVertical: 10,
  },
  summaryIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  summaryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  // Today's AI Plan
  planContainer: {
    paddingHorizontal: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBE0E6',
    padding: 16,

  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  planTime: {
    width: 96,
    fontSize: 14,
    color: '#617589',
  },
  planContent: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
  },
  planContentStudy: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
  },
  planContentBreak: {
    backgroundColor: 'rgba(80, 227, 194, 0.2)',
  },
  planTitleStudy: {
    fontSize: 16,
    color: '#4A90E2',
  },
  planTitleBreak: {
    fontSize: 16,
    color: '#065F46',
  },
  planSubtitleStudy: {
    fontSize: 12,
    color: 'rgba(74, 144, 226, 0.8)',
    marginTop: 2,
  },
  planSubtitleBreak: {
    fontSize: 12,
    color: 'rgba(6, 95, 70, 0.8)',
    marginTop: 2,
  },
  // Grade Predictions
  predictionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  predictionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBE0E6',
    padding: 16,

  },
  predictionItem: {

  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  predictionSubject: {
    fontSize: 16,
    color: '#333333',
  },
  predictionGrade: {
    fontSize: 18,
  },
  progressBarContainer: {
    position: 'relative',
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarTrack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressBarFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 4,
  },
  predictionTip: {
    fontSize: 12,
    color: '#617589',
    paddingTop: 4,
  },
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 28,
  },
});
