/**
 * DoubtsHomeScreen - Complete doubts tracking & management
 * Purpose: View, filter, and manage all student doubts
 * Design: Framer design system with status tracking, filters, and search
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card, Chip, Row, T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<any, 'DoubtsHomeScreen'>;

// Data Types
type DoubtStatus = 'pending' | 'answered';
type DoubtSource = 'teacher' | 'ai' | 'peer';
type StatusTab = 'pending' | 'answered' | 'all';

interface DoubtItem {
  id: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  chapterName?: string;
  status: DoubtStatus;
  source: DoubtSource;
  repliesCount: number;
  askedAtLabel: string;
  lastUpdatedLabel: string;
}

interface DoubtsSummary {
  totalPending: number;
  totalAnswered: number;
  avgResponseTimeLabel: string;
}

// Mock Data
const MOCK_DOUBTS: DoubtItem[] = [
  {
    id: 'doubt_math_linear_eq_1',
    title: 'Stuck on Q4 of Algebra worksheet (linear equations).',
    subjectName: 'Mathematics',
    subjectCode: 'MATH',
    chapterName: 'Linear equations',
    status: 'pending',
    source: 'teacher',
    repliesCount: 0,
    askedAtLabel: '2h ago',
    lastUpdatedLabel: '2h ago',
  },
  {
    id: 'doubt_physics_friction_1',
    title: 'Why does normal reaction change on an inclined plane?',
    subjectName: 'Physics',
    subjectCode: 'PHYS',
    chapterName: 'Friction',
    status: 'answered',
    source: 'teacher',
    repliesCount: 1,
    askedAtLabel: '5h ago',
    lastUpdatedLabel: '3h ago',
  },
  {
    id: 'doubt_chem_equilibrium_1',
    title: 'Confused about Le Chatelier principle example in notes.',
    subjectName: 'Chemistry',
    subjectCode: 'CHEM',
    chapterName: 'Equilibrium',
    status: 'pending',
    source: 'ai',
    repliesCount: 1,
    askedAtLabel: 'Yesterday',
    lastUpdatedLabel: '22h ago',
  },
  {
    id: 'doubt_bio_cell_1',
    title: 'How does mitochondria produce ATP in detail?',
    subjectName: 'Biology',
    subjectCode: 'BIO',
    chapterName: 'Cell structure',
    status: 'answered',
    source: 'teacher',
    repliesCount: 2,
    askedAtLabel: '2 days ago',
    lastUpdatedLabel: '1 day ago',
  },
  {
    id: 'doubt_math_calculus_1',
    title: 'Integration by parts - which function to choose as u?',
    subjectName: 'Mathematics',
    subjectCode: 'MATH',
    chapterName: 'Calculus',
    status: 'pending',
    source: 'peer',
    repliesCount: 0,
    askedAtLabel: '4h ago',
    lastUpdatedLabel: '4h ago',
  },
];

// Custom hook for mock data
function useDoubtsMock() {
  const doubts = MOCK_DOUBTS;

  const totalPending = doubts.filter(d => d.status === 'pending').length;
  const totalAnswered = doubts.filter(d => d.status === 'answered').length;

  const summary: DoubtsSummary = {
    totalPending,
    totalAnswered,
    avgResponseTimeLabel: '4h 20m',
  };

  return { doubts, summary };
}

export default function DoubtsHomeScreen({ navigation }: Props) {
  const { doubts, summary } = useDoubtsMock();

  // State
  const [statusTab, setStatusTab] = useState<StatusTab>('pending');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | DoubtSource>('all');

  // Track screen view on mount
  useEffect(() => {
    trackScreenView('DoubtsHomeScreen');
  }, []);

  // Extract unique subjects from doubts
  const subjects = useMemo(() => {
    const uniqueSubjects = new Set(doubts.map(d => d.subjectCode));
    return ['all', ...Array.from(uniqueSubjects)];
  }, [doubts]);

  // Filtering logic
  const baseList = useMemo(
    () => (statusTab === 'all'
      ? doubts
      : doubts.filter(d => d.status === statusTab)),
    [doubts, statusTab]
  );

  const filteredDoubts = useMemo(
    () => baseList.filter(d => {
      if (subjectFilter !== 'all' && d.subjectCode !== subjectFilter) return false;
      if (sourceFilter !== 'all' && d.source !== sourceFilter) return false;
      return true;
    }),
    [baseList, subjectFilter, sourceFilter]
  );

  // Handle filter changes with tracking
  const handleStatusChange = (newStatus: StatusTab) => {
    setStatusTab(newStatus);
    trackAction('doubts_filter_change', 'DoubtsHomeScreen', {
      statusTab: newStatus,
      subjectFilter,
      sourceFilter
    });
  };

  const handleSubjectChange = (subject: string) => {
    setSubjectFilter(subject);
    trackAction('doubts_filter_change', 'DoubtsHomeScreen', {
      statusTab,
      subjectFilter: subject,
      sourceFilter
    });
  };

  const handleSourceChange = (source: 'all' | DoubtSource) => {
    setSourceFilter(source);
    trackAction('doubts_filter_change', 'DoubtsHomeScreen', {
      statusTab,
      subjectFilter,
      sourceFilter: source
    });
  };

  // Handle doubt card tap
  const handleDoubtTap = (doubtId: string) => {
    trackAction('view_doubt_detail', 'DoubtsHomeScreen', { doubtId });
    // @ts-expect-error
    navigation.navigate('DoubtDetailScreen', { doubtId });
  };

  // Handle ask new doubt
  const handleAskNewDoubt = () => {
    trackAction('ask_new_doubt', 'DoubtsHomeScreen');
    // @ts-expect-error
    navigation.navigate('NewDoubtSubmission');
  };

  // Get subject label for chip
  const getSubjectLabel = (code: string) => {
    if (code === 'all') return 'All';
    const subjectMap: Record<string, string> = {
      MATH: 'Math',
      PHYS: 'Physics',
      CHEM: 'Chemistry',
      BIO: 'Biology',
    };
    return subjectMap[code] || code;
  };

  // Get source icon
  const getSourceIcon = (source: DoubtSource) => {
    const sourceIcons: Record<DoubtSource, string> = {
      teacher: '👨‍🏫',
      ai: '🤖',
      peer: '👥',
    };
    return sourceIcons[source];
  };

  // Render doubt card
  const renderDoubtCard = ({ item }: { item: DoubtItem }) => {
    const statusColor = item.status === 'answered' ? '#22C55E' : '#F59E0B';
    const statusBg = item.status === 'answered' ? '#DCFCE7' : '#FEF3C7';
    const statusLabel = item.status === 'answered' ? 'Answered' : 'Pending';

    return (
      <TouchableOpacity
        style={styles.doubtCard}
        onPress={() => handleDoubtTap(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`View doubt: ${item.title}`}
      >
        <View style={styles.doubtCardHeader}>
          <T variant="body" weight="semiBold" style={styles.doubtTitle} numberOfLines={2}>
            {item.title}
          </T>
        </View>

        <View style={styles.doubtCardMeta}>
          <T variant="caption" style={styles.metaText}>
            {item.subjectName}
          </T>
          {item.chapterName && (
            <>
              <T variant="caption" style={styles.metaDivider}>•</T>
              <T variant="caption" style={styles.metaText}>
                Chapter: {item.chapterName}
              </T>
            </>
          )}
        </View>

        <View style={styles.doubtCardFooter}>
          <View style={styles.footerLeft}>
            <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
              <T variant="caption" weight="semiBold" style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </T>
            </View>
            <T variant="caption" style={styles.footerText}>
              {item.askedAtLabel}
            </T>
            <T variant="caption" style={styles.footerText}>
              {getSourceIcon(item.source)} {item.source === 'teacher' ? 'Teacher' : item.source === 'ai' ? 'AI' : 'Peer'}
            </T>
          </View>

          {item.repliesCount > 0 && (
            <View style={styles.repliesBadge}>
              <T variant="caption" style={styles.repliesText}>
                💬 {item.repliesCount}
              </T>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <T variant="h1" weight="bold" style={styles.headerTitle}>
              Doubts
            </T>
            <T variant="body" style={styles.headerCaption}>
              Track your questions and see teacher/AI replies
            </T>
          </View>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => {
              trackAction('open_doubts_explore', 'DoubtsHomeScreen');
              // @ts-expect-error
              navigation.navigate('DoubtsExploreScreen');
            }}
            accessibilityRole="button"
            accessibilityLabel="Explore solved doubts"
          >
            <T variant="caption" weight="semiBold" style={styles.exploreButtonText}>
              🔍 Explore
            </T>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredDoubts}
        renderItem={renderDoubtCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Overview Card */}
            <Card style={styles.overviewCard}>
              <T variant="title" weight="bold" style={styles.overviewTitle}>
                Overview
              </T>
              <View style={styles.overviewStats}>
                <View style={styles.statRow}>
                  <T variant="body" style={styles.statBullet}>•</T>
                  <T variant="body" style={styles.statText}>
                    {summary.totalPending} pending doubts
                  </T>
                </View>
                <View style={styles.statRow}>
                  <T variant="body" style={styles.statBullet}>•</T>
                  <T variant="body" style={styles.statText}>
                    {summary.totalAnswered} answered doubts
                  </T>
                </View>
                <View style={styles.statRow}>
                  <T variant="body" style={styles.statBullet}>•</T>
                  <T variant="body" style={styles.statText}>
                    Avg response time: {summary.avgResponseTimeLabel}
                  </T>
                </View>
              </View>
            </Card>

            {/* Status Tabs */}
            <View style={styles.statusTabsRow}>
              <TouchableOpacity
                style={[
                  styles.statusTab,
                  statusTab === 'pending' && styles.statusTabActive,
                ]}
                onPress={() => handleStatusChange('pending')}
                accessibilityRole="button"
                accessibilityLabel="Show pending doubts"
              >
                <T
                  variant="body"
                  weight={statusTab === 'pending' ? 'bold' : 'medium'}
                  style={[
                    styles.statusTabText,
                    statusTab === 'pending' && styles.statusTabTextActive,
                  ]}
                >
                  Pending
                </T>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusTab,
                  statusTab === 'answered' && styles.statusTabActive,
                ]}
                onPress={() => handleStatusChange('answered')}
                accessibilityRole="button"
                accessibilityLabel="Show answered doubts"
              >
                <T
                  variant="body"
                  weight={statusTab === 'answered' ? 'bold' : 'medium'}
                  style={[
                    styles.statusTabText,
                    statusTab === 'answered' && styles.statusTabTextActive,
                  ]}
                >
                  Answered
                </T>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusTab,
                  statusTab === 'all' && styles.statusTabActive,
                ]}
                onPress={() => handleStatusChange('all')}
                accessibilityRole="button"
                accessibilityLabel="Show all doubts"
              >
                <T
                  variant="body"
                  weight={statusTab === 'all' ? 'bold' : 'medium'}
                  style={[
                    styles.statusTabText,
                    statusTab === 'all' && styles.statusTabTextActive,
                  ]}
                >
                  All
                </T>
              </TouchableOpacity>
            </View>

            {/* Filter Section */}
            <View style={styles.filtersSection}>
              {/* Subject Chips */}
              <T variant="caption" weight="semiBold" style={styles.filterLabel}>
                Subject
              </T>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsRow}
                contentContainerStyle={styles.chipsContent}
              >
                {subjects.map((subject) => (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.filterChip,
                      subjectFilter === subject && styles.filterChipActive,
                    ]}
                    onPress={() => handleSubjectChange(subject)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${getSubjectLabel(subject)}`}
                  >
                    <T
                      variant="caption"
                      weight={subjectFilter === subject ? 'bold' : 'medium'}
                      style={[
                        styles.filterChipText,
                        subjectFilter === subject && styles.filterChipTextActive,
                      ]}
                    >
                      {getSubjectLabel(subject)}
                    </T>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Source Chips */}
              <T variant="caption" weight="semiBold" style={[styles.filterLabel, { marginTop: 12 }]}>
                Source
              </T>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsRow}
                contentContainerStyle={styles.chipsContent}
              >
                {(['all', 'teacher', 'ai', 'peer'] as const).map((source) => (
                  <TouchableOpacity
                    key={source}
                    style={[
                      styles.filterChip,
                      sourceFilter === source && styles.filterChipActive,
                    ]}
                    onPress={() => handleSourceChange(source)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${source}`}
                  >
                    <T
                      variant="caption"
                      weight={sourceFilter === source ? 'bold' : 'medium'}
                      style={[
                        styles.filterChipText,
                        sourceFilter === source && styles.filterChipTextActive,
                      ]}
                    >
                      {source === 'all' ? 'All' : source.charAt(0).toUpperCase() + source.slice(1)}
                    </T>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        }
        ListEmptyComponent={
          <Card style={styles.emptyStateCard}>
            <T variant="title" weight="bold" style={styles.emptyTitle}>
              No doubts here
            </T>
            <T variant="body" style={styles.emptySubtitle}>
              Try changing filters or ask a new doubt
            </T>
          </Card>
        }
      />

      {/* Ask New Doubt CTA */}
      <TouchableOpacity
        style={styles.askDoubtButton}
        onPress={handleAskNewDoubt}
        accessibilityRole="button"
        accessibilityLabel="Ask new doubt"
      >
        <T variant="body" weight="bold" style={styles.askDoubtButtonText}>
          ❓ Ask new doubt
        </T>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Header
  header: {
    padding: 16,
    paddingTop: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  exploreButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D5BFF',
  },
  exploreButtonText: {
    fontSize: 13,
    color: '#2D5BFF',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerTitle: {
    fontSize: 28,
    color: '#111827',
    marginBottom: 4,
  },
  headerCaption: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Overview Card
  overviewCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewTitle: {
    fontSize: 18,
    color: '#111827',
    marginBottom: 12,
  },
  overviewStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBullet: {
    fontSize: 16,
    color: '#2D5BFF',
    marginRight: 8,
  },
  statText: {
    fontSize: 14,
    color: '#374151',
  },
  // Status Tabs
  statusTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusTabActive: {
    backgroundColor: '#2D5BFF',
    borderColor: '#2D5BFF',
  },
  statusTabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusTabTextActive: {
    color: '#FFFFFF',
  },
  // Filters Section
  filtersSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexGrow: 0,
  },
  chipsContent: {
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#EBF4FF',
    borderColor: '#2D5BFF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#2D5BFF',
  },
  // Doubt List
  doubtCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  doubtCardHeader: {
    marginBottom: 8,
  },
  doubtTitle: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 22,
  },
  doubtCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  metaDivider: {
    fontSize: 13,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  doubtCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  repliesBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  repliesText: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Empty State
  emptyStateCard: {
    margin: 16,
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Ask Doubt CTA
  askDoubtButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#2D5BFF',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#2D5BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  askDoubtButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
