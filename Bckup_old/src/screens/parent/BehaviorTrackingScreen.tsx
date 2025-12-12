/**
 * BehaviorTrackingScreen - PHASE 3B: Behavioral Tracking
 *
 * Displays comprehensive behavioral tracking with:
 * - Weekly behavioral summary
 * - Positive/concern points
 * - Category breakdown (participation, homework, behavior, punctuality)
 * - Teacher notes and feedback
 * - Improvements and concerns lists
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Badge } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import type { ParentStackParamList } from '../../types/navigation';
import { trackScreenView } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<ParentStackParamList, 'BehaviorTracking'>;

interface BehaviorLog {
  id: string;
  student_id: string;
  log_date: string;
  week_start: string;
  positive_points: number;
  concern_points: number;
  participation_score: number;
  homework_score: number;
  behavior_score: number;
  punctuality_score: number;
  teacher_notes: string | null;
  improvements: string[] | null;
  concerns: string[] | null;
  created_at: string;
}

const BehaviorTrackingScreen: React.FC<Props> = ({ route }) => {
  const { childId, childName } = route.params;

  useEffect(() => {
    trackScreenView('BehaviorTracking', { from: 'ChildDetail', childId });
  }, [childId]);

  // Fetch behavior logs
  const {
    data: behaviorLogs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['behaviorLogs', childId],
    queryFn: async () => {
      console.log('📊 [BehaviorTracking] Fetching behavior logs...');
      const { data, error } = await supabase
        .from('student_behavior_logs')
        .select('*')
        .eq('student_id', childId)
        .order('log_date', { ascending: false });

      if (error) {
        console.error('❌ [BehaviorTracking] Error fetching logs:', error);
        throw error;
      }

      console.log('✅ [BehaviorTracking] Loaded', data?.length || 0, 'behavior logs');
      return data as BehaviorLog[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get current week summary
  const currentWeekLog = useMemo(() => {
    if (behaviorLogs.length === 0) return null;
    return behaviorLogs[0]; // Latest log
  }, [behaviorLogs]);

  // Calculate overall score
  const overallScore = useMemo(() => {
    if (!currentWeekLog) return 0;
    const avg = (
      (currentWeekLog.participation_score || 0) +
      (currentWeekLog.homework_score || 0) +
      (currentWeekLog.behavior_score || 0) +
      (currentWeekLog.punctuality_score || 0)
    ) / 4;
    return Math.round(avg * 10); // Convert to percentage
  }, [currentWeekLog]);

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 8) return Colors.success;
    if (score >= 6) return Colors.warning;
    return Colors.error;
  };

  // Get overall performance level
  const getPerformanceLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: Colors.success };
    if (score >= 70) return { label: 'Good', color: Colors.primary };
    if (score >= 60) return { label: 'Satisfactory', color: Colors.warning };
    return { label: 'Needs Improvement', color: Colors.error };
  };

  const performanceLevel = getPerformanceLevel(overallScore);

  return (
    <BaseScreen
      scrollable={true}
      loading={isLoading}
      error={error ? 'Failed to load behavior data' : null}
      empty={!isLoading && behaviorLogs.length === 0}
      emptyBody="No behavior tracking data available for this student"
      onRetry={refetch}
    >
      <Col sx={{ p: 'md' }} gap="md">
        {/* Header Section */}
        <Card variant="elevated">
          <CardContent>
            <T variant="title" weight="bold" style={{ marginBottom: Spacing.xs }}>
              📊 Behavior Tracking
            </T>
            <T variant="body" color="textSecondary" style={{ marginBottom: Spacing.md }}>
              Behavioral progress for {childName || 'student'}
            </T>

            {currentWeekLog && (
              <View>
                {/* Overall Score */}
                <View style={styles.scoreBox}>
                  <T variant="display" weight="bold" style={{ fontSize: 48, color: performanceLevel.color }}>
                    {overallScore}%
                  </T>
                  <T variant="body" color="textSecondary">Overall Behavior Score</T>
                  <Badge
                    variant={overallScore >= 70 ? 'success' : overallScore >= 60 ? 'warning' : 'error'}
                    label={performanceLevel.label}
                    style={{ marginTop: Spacing.xs }}
                  />
                </View>

                {/* Points Summary */}
                <Row spaceBetween style={{ marginTop: Spacing.md }}>
                  <View style={[styles.pointsBox, { backgroundColor: Colors.successLight }]}>
                    <T variant="display" weight="bold" color="success" style={{ fontSize: 32 }}>
                      +{currentWeekLog.positive_points || 0}
                    </T>
                    <T variant="caption" color="textSecondary">Positive Points</T>
                  </View>
                  <View style={[styles.pointsBox, { backgroundColor: Colors.errorLight }]}>
                    <T variant="display" weight="bold" color="error" style={{ fontSize: 32 }}>
                      -{currentWeekLog.concern_points || 0}
                    </T>
                    <T variant="caption" color="textSecondary">Concern Points</T>
                  </View>
                </Row>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        {currentWeekLog && (
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.md }}>
                Category Breakdown
              </T>

              <Col gap="md">
                {/* Participation */}
                <View>
                  <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                    <T variant="body">Participation</T>
                    <T variant="body" weight="semiBold" style={{ color: getScoreColor(currentWeekLog.participation_score || 0) }}>
                      {currentWeekLog.participation_score || 0}/10
                    </T>
                  </Row>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${(currentWeekLog.participation_score || 0) * 10}%`,
                          backgroundColor: getScoreColor(currentWeekLog.participation_score || 0),
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Homework */}
                <View>
                  <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                    <T variant="body">Homework</T>
                    <T variant="body" weight="semiBold" style={{ color: getScoreColor(currentWeekLog.homework_score || 0) }}>
                      {currentWeekLog.homework_score || 0}/10
                    </T>
                  </Row>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${(currentWeekLog.homework_score || 0) * 10}%`,
                          backgroundColor: getScoreColor(currentWeekLog.homework_score || 0),
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Behavior */}
                <View>
                  <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                    <T variant="body">Behavior</T>
                    <T variant="body" weight="semiBold" style={{ color: getScoreColor(currentWeekLog.behavior_score || 0) }}>
                      {currentWeekLog.behavior_score || 0}/10
                    </T>
                  </Row>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${(currentWeekLog.behavior_score || 0) * 10}%`,
                          backgroundColor: getScoreColor(currentWeekLog.behavior_score || 0),
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Punctuality */}
                <View>
                  <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                    <T variant="body">Punctuality</T>
                    <T variant="body" weight="semiBold" style={{ color: getScoreColor(currentWeekLog.punctuality_score || 0) }}>
                      {currentWeekLog.punctuality_score || 0}/10
                    </T>
                  </Row>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${(currentWeekLog.punctuality_score || 0) * 10}%`,
                          backgroundColor: getScoreColor(currentWeekLog.punctuality_score || 0),
                        },
                      ]}
                    />
                  </View>
                </View>
              </Col>
            </CardContent>
          </Card>
        )}

        {/* Teacher Notes */}
        {currentWeekLog?.teacher_notes && (
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                📝 Teacher's Note
              </T>
              <T variant="body" color="textSecondary">
                {currentWeekLog.teacher_notes}
              </T>
            </CardContent>
          </Card>
        )}

        {/* Improvements */}
        {currentWeekLog?.improvements && currentWeekLog.improvements.length > 0 && (
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm, color: Colors.success }}>
                ✅ Improvements
              </T>
              <Col gap="xs">
                {currentWeekLog.improvements.map((improvement, index) => (
                  <Row key={index} style={{ alignItems: 'flex-start' }}>
                    <T variant="body" color="success" style={{ marginRight: Spacing.xs }}>•</T>
                    <T variant="body" color="textSecondary" style={{ flex: 1 }}>
                      {improvement}
                    </T>
                  </Row>
                ))}
              </Col>
            </CardContent>
          </Card>
        )}

        {/* Concerns */}
        {currentWeekLog?.concerns && currentWeekLog.concerns.length > 0 && (
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm, color: Colors.warning }}>
                ⚠️ Areas of Concern
              </T>
              <Col gap="xs">
                {currentWeekLog.concerns.map((concern, index) => (
                  <Row key={index} style={{ alignItems: 'flex-start' }}>
                    <T variant="body" color="warning" style={{ marginRight: Spacing.xs }}>•</T>
                    <T variant="body" color="textSecondary" style={{ flex: 1 }}>
                      {concern}
                    </T>
                  </Row>
                ))}
              </Col>
            </CardContent>
          </Card>
        )}

        {/* Weekly History */}
        {behaviorLogs.length > 1 && (
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.md }}>
                📅 Weekly History
              </T>
              <Col gap="sm">
                {behaviorLogs.slice(0, 4).map((log, index) => {
                  const weekScore = Math.round(
                    ((log.participation_score || 0) +
                      (log.homework_score || 0) +
                      (log.behavior_score || 0) +
                      (log.punctuality_score || 0)) /
                      4 *
                      10
                  );
                  const level = getPerformanceLevel(weekScore);

                  return (
                    <Row key={log.id} spaceBetween centerV style={styles.historyItem}>
                      <Col flex={1}>
                        <T variant="body" weight="semiBold">
                          {index === 0 ? 'This Week' : `${index + 1} Week${index === 1 ? '' : 's'} Ago`}
                        </T>
                        <T variant="caption" color="textSecondary">
                          {new Date(log.log_date).toLocaleDateString()}
                        </T>
                      </Col>
                      <View style={{ alignItems: 'flex-end' }}>
                        <T variant="title" weight="bold" style={{ fontSize: 20, color: level.color }}>
                          {weekScore}%
                        </T>
                        <T variant="caption" color="textSecondary">{level.label}</T>
                      </View>
                    </Row>
                  );
                })}
              </Col>
            </CardContent>
          </Card>
        )}
      </Col>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  scoreBox: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  pointsBox: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    marginHorizontal: Spacing.xs,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  historyItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
});

export default BehaviorTrackingScreen;
