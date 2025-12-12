/**
 * AIStudySummaries - Premium Minimal Design
 * Purpose: AI-generated study summaries for topics
 * Used in: StudentNavigator (AssignmentsStack) - from NewAIStudyScreen
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card } from '../../ui/surfaces/Card';
import { T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';

type Props = NativeStackScreenProps<any, 'AIStudySummaries'>;

interface StudySummary {
  id: string;
  subject: string;
  topic: string;
  summary: string;
  key_points: string[];
  created_at: string;
  word_count: number;
}

export default function AIStudySummaries({ navigation }: Props) {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  React.useEffect(() => {
    trackScreenView('AIStudySummaries');
  }, []);

  // Fetch study summaries from database
  const { data: summaries, isLoading, error, refetch } = useQuery({
    queryKey: ['study-summaries', user?.id, selectedSubject],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');

      let query = supabase
        .from('study_summaries')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (selectedSubject) {
        query = query.eq('subject', selectedSubject);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(summary => ({
        id: summary.id,
        subject: summary.subject || 'General',
        topic: summary.topic || 'Study Topic',
        summary: summary.summary || 'Summary not available',
        key_points: summary.key_points || [],
        created_at: summary.created_at,
        word_count: summary.summary ? summary.summary.split(' ').length : 0,
      })) as StudySummary[];
    },
    enabled: !!user?.id,
  });

  // Get unique subjects for filter
  const subjects = summaries
    ? [...new Set(summaries.map(s => s.subject))].sort()
    : [];

  const handleSummaryPress = (summary: StudySummary) => {
    trackAction('view_summary', 'AIStudySummaries', {
      summaryId: summary.id,
      subject: summary.subject,
    });

    navigation.navigate('SummaryDetail', { summaryId: summary.id });
  };

  const handleGenerateSummary = () => {
    trackAction('generate_summary', 'AIStudySummaries', {
      subject: selectedSubject || 'all',
    });

    Alert.alert(
      '✨ AI Summary Generation',
      'AI-powered summary creation launching soon!\n\n🚀 Coming features:\n✓ Auto-summarize chapters\n✓ Extract key points instantly\n✓ Generate topic-wise notes\n✓ Convert PDFs to summaries\n\nCurrent options:\n\n📚 Browse existing summaries above\n🔄 Refresh to see new summaries\n📝 Request summaries via "Submit Doubt"\n💬 Ask AI Tutor to explain topics',
      [
        { text: 'Got it' },
        { text: 'Refresh List', onPress: () => refetch() }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <BaseScreen
      scrollable={false}
      loading={isLoading}
      error={error ? 'Failed to load study summaries' : null}
      empty={!summaries || summaries.length === 0}
      emptyMessage="No summaries available. Generate your first one!"
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <T variant="h2" weight="bold">
            Study Summaries
          </T>
          <T variant="body" style={styles.subtitle}>
            AI-generated summaries of your study topics
          </T>
        </Card>

        {/* Subject Filter */}
        {subjects.length > 1 && (
          <Card style={styles.filterCard}>
            <T variant="caption" style={styles.filterLabel}>
              Filter by Subject
            </T>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !selectedSubject && styles.filterChipActive,
                ]}
                onPress={() => {
                  trackAction('filter_subject', 'AIStudySummaries', { subject: 'all' });
                  setSelectedSubject(null);
                }}
                accessibilityRole="button"
                accessibilityLabel="Show all subjects"
              >
                <T
                  variant="caption"
                  weight="semiBold"
                  style={!selectedSubject && styles.filterTextActive}
                >
                  All
                </T>
              </TouchableOpacity>
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={[
                    styles.filterChip,
                    selectedSubject === subject && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    trackAction('filter_subject', 'AIStudySummaries', { subject });
                    setSelectedSubject(subject);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${subject}`}
                >
                  <T
                    variant="caption"
                    weight="semiBold"
                    style={selectedSubject === subject && styles.filterTextActive}
                  >
                    {subject}
                  </T>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card>
        )}

        {/* Generate Button */}
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateSummary}
          accessibilityRole="button"
          accessibilityLabel="Generate new study summary"
        >
          <T variant="body" weight="semiBold" style={styles.generateText}>
            ✨ Generate New Summary
          </T>
        </TouchableOpacity>

        {/* Summaries List */}
        {summaries && summaries.length > 0 && (
          <View style={styles.summariesList}>
            {summaries.map((summary) => (
              <TouchableOpacity
                key={summary.id}
                onPress={() => handleSummaryPress(summary)}
                accessibilityRole="button"
                accessibilityLabel={`View summary: ${summary.topic}`}
              >
                <Card style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <View style={styles.subjectBadge}>
                      <T variant="caption" weight="semiBold" style={styles.subjectText}>
                        {summary.subject}
                      </T>
                    </View>
                    <T variant="caption" style={styles.date}>
                      {formatDate(summary.created_at)}
                    </T>
                  </View>

                  <T variant="title" weight="semiBold" style={styles.topic}>
                    {summary.topic}
                  </T>

                  <T variant="caption" style={styles.summaryPreview} numberOfLines={3}>
                    {summary.summary}
                  </T>

                  <View style={styles.summaryFooter}>
                    <T variant="caption" style={styles.wordCount}>
                      📄 {summary.word_count} words
                    </T>
                    {summary.key_points.length > 0 && (
                      <T variant="caption" style={styles.keyPointsCount}>
                        📌 {summary.key_points.length} key points
                      </T>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    padding: 20,
    marginBottom: 16,

  },
  subtitle: {
    color: '#6B7280',
  },
  filterCard: {
    padding: 16,
    marginBottom: 16,

  },
  filterLabel: {
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterScroll: {

  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  generateButton: {
    padding: 16,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateText: {
    color: '#FFFFFF',
  },
  summariesList: {

    marginBottom: 32,
  },
  summaryCard: {
    padding: 16,

  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
  },
  subjectText: {
    color: '#1E40AF',
  },
  date: {
    color: '#9CA3AF',
  },
  topic: {
    marginBottom: 4,
  },
  summaryPreview: {
    color: '#6B7280',
    lineHeight: 20,
  },
  summaryFooter: {
    flexDirection: 'row',

    marginTop: 4,
  },
  wordCount: {
    color: '#9CA3AF',
  },
  keyPointsCount: {
    color: '#9CA3AF',
  },
});
