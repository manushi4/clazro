/**
 * DoubtsExploreScreen - Search and browse solved doubts
 * Purpose: Explore solved doubts from other students
 * Design: Framer design system with search, filters, and cards
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card, T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';

type Props = NativeStackScreenProps<any, 'DoubtsExploreScreen'>;

type RouteParams = {
  subjectCode?: string;
  chapterName?: string;
  query?: string;
};

// Data Types
type DoubtExploreDifficulty = 'easy' | 'medium' | 'hard';
type DifficultyFilter = 'all' | DoubtExploreDifficulty;

interface DoubtExploreItem {
  id: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  chapterName?: string;
  difficulty: DoubtExploreDifficulty;
  answerCount: number;
  lastUpdatedLabel: string;
}

// Framer Colors
const FRAMER_COLORS = {
  background: '#F7F7F7',
  cardBg: '#FFFFFF',
  primary: '#2D5BFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  chipBg: '#F3F4F6',
  chipText: '#374151',
  chipSelectedBg: '#2D5BFF',
  chipSelectedText: '#FFFFFF',
  difficultyEasy: '#22C55E',
  difficultyMedium: '#F59E0B',
  difficultyHard: '#EF4444',
};

// Mock Data
const MOCK_EXPLORE_DOUBTS: DoubtExploreItem[] = [
  {
    id: 'explore_physics_friction_1',
    title: 'Why does normal reaction change on an inclined plane?',
    subjectName: 'Physics',
    subjectCode: 'PHYS',
    chapterName: 'Friction',
    difficulty: 'medium',
    answerCount: 2,
    lastUpdatedLabel: '3h ago',
  },
  {
    id: 'explore_chem_equilibrium_1',
    title: 'Confused about Le Chatelier principle example in notes.',
    subjectName: 'Chemistry',
    subjectCode: 'CHEM',
    chapterName: 'Equilibrium',
    difficulty: 'medium',
    answerCount: 1,
    lastUpdatedLabel: 'Yesterday',
  },
  {
    id: 'explore_math_linear_eq_1',
    title: 'Alternate method to solve linear equations word problem 3?',
    subjectName: 'Mathematics',
    subjectCode: 'MATH',
    chapterName: 'Linear equations',
    difficulty: 'easy',
    answerCount: 3,
    lastUpdatedLabel: '2 days ago',
  },
  {
    id: 'explore_bio_cell_1',
    title: 'How does ATP synthase work in mitochondria?',
    subjectName: 'Biology',
    subjectCode: 'BIO',
    chapterName: 'Cell respiration',
    difficulty: 'hard',
    answerCount: 4,
    lastUpdatedLabel: '5h ago',
  },
  {
    id: 'explore_math_calculus_1',
    title: 'Quick trick for integration by parts selection?',
    subjectName: 'Mathematics',
    subjectCode: 'MATH',
    chapterName: 'Calculus',
    difficulty: 'medium',
    answerCount: 2,
    lastUpdatedLabel: '1 day ago',
  },
];

// Custom hook for mock data
function useExploreDoubtsMock() {
  return { doubts: MOCK_EXPLORE_DOUBTS };
}

export default function DoubtsExploreScreen({ route, navigation }: Props) {
  const params = (route.params as RouteParams) || {};
  const { doubts } = useExploreDoubtsMock();

  // State
  const [query, setQuery] = useState(params.query ?? '');
  const [subjectFilter, setSubjectFilter] = useState<string>(params.subjectCode ?? 'all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');

  // Track screen view on mount
  useEffect(() => {
    trackScreenView('DoubtsExploreScreen', {
      initialSubject: params.subjectCode,
      initialQuery: params.query,
    });
  }, []);

  // Extract unique subjects from doubts
  const subjects = useMemo(() => {
    const uniqueSubjects = new Set(doubts.map(d => d.subjectCode));
    return ['all', ...Array.from(uniqueSubjects)];
  }, [doubts]);

  // Filtering logic
  const filteredDoubts = useMemo(
    () =>
      doubts.filter(d => {
        if (subjectFilter !== 'all' && d.subjectCode !== subjectFilter) return false;
        if (difficultyFilter !== 'all' && d.difficulty !== difficultyFilter) return false;
        if (query.trim()) {
          const q = query.trim().toLowerCase();
          if (
            !d.title.toLowerCase().includes(q) &&
            !(d.chapterName ?? '').toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return true;
      }),
    [doubts, subjectFilter, difficultyFilter, query]
  );

  // Handle filter changes with tracking
  const handleSubjectChange = (subject: string) => {
    setSubjectFilter(subject);
    trackAction('doubts_explore_filter_change', 'DoubtsExploreScreen', {
      subjectFilter: subject,
      difficultyFilter,
      hasQuery: query.length > 0,
    });
  };

  const handleDifficultyChange = (difficulty: DifficultyFilter) => {
    setDifficultyFilter(difficulty);
    trackAction('doubts_explore_filter_change', 'DoubtsExploreScreen', {
      subjectFilter,
      difficultyFilter: difficulty,
      hasQuery: query.length > 0,
    });
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.trim().length > 2) {
      trackAction('doubts_explore_search', 'DoubtsExploreScreen', { query: text.trim() });
    }
  };

  // Handle doubt card tap
  const handleDoubtTap = (doubtId: string) => {
    trackAction('view_explore_doubt_detail', 'DoubtsExploreScreen', { doubtId });
    safeNavigate('DoubtDetailScreen', { doubtId });
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

  // Get difficulty color
  const getDifficultyColor = (difficulty: DoubtExploreDifficulty) => {
    const colorMap: Record<DoubtExploreDifficulty, string> = {
      easy: FRAMER_COLORS.difficultyEasy,
      medium: FRAMER_COLORS.difficultyMedium,
      hard: FRAMER_COLORS.difficultyHard,
    };
    return colorMap[difficulty];
  };

  // Render doubt card
  const renderDoubtCard = ({ item, index }: { item: DoubtExploreItem; index: number }) => {
    const difficultyColor = getDifficultyColor(item.difficulty);
    const difficultyBg = `${difficultyColor}20`;

    return (
      <View>
        <TouchableOpacity
          style={styles.doubtCard}
          onPress={() => handleDoubtTap(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`View doubt: ${item.title}`}
          activeOpacity={0.7}
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
                  {item.chapterName}
                </T>
              </>
            )}
          </View>

          <View style={styles.doubtCardFooter}>
            <View style={styles.footerLeft}>
              <View style={[styles.difficultyPill, { backgroundColor: difficultyBg }]}>
                <T variant="caption" weight="semiBold" style={[styles.difficultyText, { color: difficultyColor }]}>
                  {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                </T>
              </View>
              <T variant="caption" style={styles.footerText}>
                {item.answerCount} answer{item.answerCount !== 1 ? 's' : ''}
              </T>
              <T variant="caption" style={styles.footerText}>
                {item.lastUpdatedLabel}
              </T>
            </View>

            <Icon name="chevron-right" size={20} color={FRAMER_COLORS.textTertiary} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <T variant="h1" weight="bold" style={styles.headerTitle}>
          Explore Doubts
        </T>
        <T variant="body" style={styles.headerCaption}>
          Search solved doubts from other students
        </T>
      </View>

      <FlatList
        data={filteredDoubts}
        renderItem={renderDoubtCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Search Card */}
            <View>
              <Card style={styles.searchCard}>
                <View style={styles.searchInputContainer}>
                  <Icon name="search" size={20} color={FRAMER_COLORS.textTertiary} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search doubts by keyword or chapter..."
                    placeholderTextColor={FRAMER_COLORS.textTertiary}
                    value={query}
                    onChangeText={handleSearch}
                    returnKeyType="search"
                  />
                  {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                      <Icon name="close" size={18} color={FRAMER_COLORS.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            </View>

            {/* Filters Section */}
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

              {/* Difficulty Chips */}
              <T variant="caption" weight="semiBold" style={[styles.filterLabel, { marginTop: 12 }]}>
                Difficulty
              </T>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsRow}
                contentContainerStyle={styles.chipsContent}
              >
                {(['all', 'easy', 'medium', 'hard'] as DifficultyFilter[]).map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty}
                    style={[
                      styles.filterChip,
                      difficultyFilter === difficulty && styles.filterChipActive,
                    ]}
                    onPress={() => handleDifficultyChange(difficulty)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${difficulty}`}
                  >
                    <T
                      variant="caption"
                      weight={difficultyFilter === difficulty ? 'bold' : 'medium'}
                      style={[
                        styles.filterChipText,
                        difficultyFilter === difficulty && styles.filterChipTextActive,
                      ]}
                    >
                      {difficulty === 'all' ? 'All' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </T>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Results Count */}
            {filteredDoubts.length > 0 && (
              <View style={styles.resultsCount}>
                <T variant="caption" style={styles.resultsCountText}>
                  {filteredDoubts.length} doubt{filteredDoubts.length !== 1 ? 's' : ''} found
                </T>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View>
            <Card style={styles.emptyStateCard}>
              <Icon name="search-off" size={48} color={FRAMER_COLORS.textTertiary} style={styles.emptyIcon} />
              <T variant="title" weight="bold" style={styles.emptyTitle}>
                No doubts found
              </T>
              <T variant="body" style={styles.emptySubtitle}>
                {query.trim()
                  ? `No results for "${query.trim()}". Try different keywords.`
                  : 'Try changing filters to see more doubts'}
              </T>
            </Card>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FRAMER_COLORS.background,
  },
  // Header
  header: {
    padding: 16,
    paddingTop: 24,
    backgroundColor: FRAMER_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 4,
  },
  headerCaption: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Search Card
  searchCard: {
    margin: 16,
    marginTop: 8,
    padding: 0,
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: FRAMER_COLORS.textPrimary,
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  // Filters Section
  filtersSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 12,
    color: FRAMER_COLORS.textSecondary,
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
    backgroundColor: FRAMER_COLORS.chipBg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: FRAMER_COLORS.chipSelectedBg,
    borderColor: FRAMER_COLORS.chipSelectedBg,
  },
  filterChipText: {
    fontSize: 13,
    color: FRAMER_COLORS.chipText,
  },
  filterChipTextActive: {
    color: FRAMER_COLORS.chipSelectedText,
  },
  // Results Count
  resultsCount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCountText: {
    fontSize: 13,
    color: FRAMER_COLORS.textTertiary,
  },
  // Doubt Card
  doubtCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
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
    color: FRAMER_COLORS.textPrimary,
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
    color: FRAMER_COLORS.textSecondary,
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
  difficultyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
  },
  footerText: {
    fontSize: 12,
    color: FRAMER_COLORS.textTertiary,
  },
  // Empty State
  emptyStateCard: {
    margin: 16,
    padding: 40,
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    textAlign: 'center',
  },
});
