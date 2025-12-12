/**
 * AcademicReportsScreen - Shows completed exams grouped by subject
 * Real Supabase data (no mock data)
 */

import React, { useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card, Col, Row, T } from '../../ui';
import { trackScreenView } from '../../utils/navigationAnalytics';
import type { ParentStackParamList } from '../../types/navigation';
import { Spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<ParentStackParamList, 'AcademicReports'>;

interface GradeRecord {
  id: string;
  student_id: string;
  subject_code: string;
  exam_name: string;
  max_marks: number;
  obtained_marks: number;
  percentage: number | null;
  grade: string | null;
  exam_date: string | null;
}

const AcademicReportsScreen: React.FC<Props> = ({ route }) => {
  const { studentId } = route.params || {};

  React.useEffect(() => {
    trackScreenView('AcademicReports', { from: 'AcademicsDetail', studentId });
  }, [studentId]);

  const { data: gradeRecords = [], isLoading, error, refetch } = useQuery({
    queryKey: ['academic_reports', studentId],
    queryFn: async () => {
      console.log(`🔍 [AcademicReports] Fetching for ${studentId}`);
      const { data, error } = await supabase
        .from('gradebook')
        .select('*')
        .eq('student_id', studentId)
        .not('obtained_marks', 'is', null)
        .order('exam_date', { ascending: false });
      if (error) throw error;
      console.log('✅ [AcademicReports] Loaded', data?.length || 0, 'records');
      return (data || []) as GradeRecord[];
    },
    enabled: !!studentId,
  });

  const stats = useMemo(() => {
    if (!gradeRecords.length) return { total: 0, avg: 0, grade: 'N/A' };
    const validPercentages = gradeRecords.map(e => e.percentage).filter((p): p is number => p !== null);
    const avg = validPercentages.length > 0 ? validPercentages.reduce((sum, p) => sum + p, 0) / validPercentages.length : 0;
    let grade = 'F';
    if (avg >= 90) grade = 'A';
    else if (avg >= 80) grade = 'B';
    else if (avg >= 70) grade = 'C';
    else if (avg >= 60) grade = 'D';
    return { total: gradeRecords.length, avg: Math.round(avg), grade };
  }, [gradeRecords]);

  const renderItem = ({ item }: { item: GradeRecord }) => {
    const pct = item.percentage ? `${Math.round(item.percentage)}%` : 'N/A';
    const date = item.exam_date ? new Date(item.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date';
    return (
      <Card variant="elevated" style={styles.examCard}>
        <Row spaceBetween>
          <Col style={{ flex: 1 }}>
            <T variant="body" weight="bold">{item.exam_name}</T>
            <T variant="caption" color="textSecondary">{item.subject_code} • {date}</T>
          </Col>
          <Col>
            <T variant="title" weight="bold" color={(item.percentage || 0) >= 80 ? 'success' : (item.percentage || 0) >= 60 ? 'warning' : 'error'}>{pct}</T>
            <T variant="body">{item.grade || 'N/A'}</T>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <BaseScreen scrollable={false} loading={isLoading} error={error ? String(error) : null} empty={!gradeRecords.length} emptyBody="No grade records found" onRetry={refetch}>
      <Col style={{ padding: Spacing.LG, flex: 1 }}>
        <Card variant="elevated" style={styles.statsCard}>
          <T variant="headline" weight="bold" style={{ marginBottom: Spacing.MD }}>Academic Performance</T>
          <Row spaceBetween>
            <Col>
              <T variant="display" weight="bold" color="primary">{stats.total}</T>
              <T variant="caption" color="textSecondary">Total Exams</T>
            </Col>
            <Col>
              <T variant="display" weight="bold" color={stats.avg >= 80 ? 'success' : stats.avg >= 60 ? 'warning' : 'error'}>{stats.avg}%</T>
              <T variant="caption" color="textSecondary">Average</T>
            </Col>
            <Col>
              <T variant="display" weight="bold">{stats.grade}</T>
              <T variant="caption" color="textSecondary">Grade</T>
            </Col>
          </Row>
        </Card>
        <T variant="title" weight="bold" style={{ marginBottom: Spacing.MD, marginTop: Spacing.LG }}>All Exams</T>
        <FlatList data={gradeRecords} renderItem={renderItem} keyExtractor={(item) => item.id} contentContainerStyle={{ paddingBottom: Spacing.XL }} showsVerticalScrollIndicator={false} />
      </Col>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  statsCard: {
    padding: Spacing.LG,
    marginBottom: Spacing.LG,
  },
  examCard: {
    marginBottom: Spacing.SM,
    padding: Spacing.MD,
  },
});

export default AcademicReportsScreen;