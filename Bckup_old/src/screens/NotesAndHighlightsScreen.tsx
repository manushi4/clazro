import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInUp, FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BaseScreen } from '../shared/components/BaseScreen';
import { Card, Chip, Row, T } from '../ui';
import { Colors, Spacing, BorderRadius } from '../theme/designSystem';
import { trackScreenView, trackAction } from '../utils/navigationAnalytics';

type Props = NativeStackScreenProps<any, 'NotesAndHighlightsScreen'>;
type TabKey = 'notes' | 'highlights' | 'doubts';

interface BaseCollectionItem {
  id: string;
  title: string;
  subject: string;
  type: TabKey;
  created_at: string;
  updated_at: string;
  student_id: string;
}

interface NoteItem extends BaseCollectionItem {
  type: 'notes';
  itemCount: number;
}

interface HighlightItem extends BaseCollectionItem {
  type: 'highlights';
  excerpt: string;
  sourceTitle: string;
  fromResource: boolean;
}

interface DoubtItem extends BaseCollectionItem {
  type: 'doubts';
  doubtTitle: string;
}

type CollectionItem = NoteItem | HighlightItem | DoubtItem;

const TAB_LABELS: Record<TabKey, string> = {
  notes: 'Notes',
  highlights: 'Highlights',
  doubts: 'From doubts',
};

// Framer Design Colors
const FRAMER_COLORS = {
  background: '#F7F7F7',
  cardBg: '#FFFFFF',
  primary: '#2D5BFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  iconBg: 'rgba(45, 91, 255, 0.15)',
  chipBg: '#F3F4F6',
  chipText: '#374151',
  chipSelectedBg: '#2D5BFF',
  chipSelectedText: '#FFFFFF',
  searchBg: '#F9FAFB',
};

// Mock data matching the spec
const MOCK_COLLECTIONS: CollectionItem[] = [
  {
    id: 'n1',
    title: 'Algebra formula shortcuts',
    subject: 'Mathematics',
    type: 'notes',
    itemCount: 3,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    student_id: 'student_123',
  },
  {
    id: 'n2',
    title: 'Key mistakes from last test',
    subject: 'Mixed',
    type: 'notes',
    itemCount: 1,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    student_id: 'student_123',
  },
  {
    id: 'h1',
    title: 'Optics highlights',
    subject: 'Physics',
    type: 'highlights',
    sourceTitle: 'Concept: Linear equations and graphs',
    excerpt: 'Light travels in straight lines. Reflection: angle of incidence = angle of reflection',
    fromResource: true,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
    student_id: 'student_123',
  },
  {
    id: 'h2',
    title: 'Cell division process',
    subject: 'Biology',
    type: 'highlights',
    sourceTitle: 'Chapter: Cell Biology',
    excerpt: 'Mitosis phases: Prophase, Metaphase, Anaphase, Telophase (PMAT)',
    fromResource: false,
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 345600000).toISOString(),
    student_id: 'student_123',
  },
  {
    id: 'd1',
    title: 'Quadratic equation doubt',
    subject: 'Mathematics',
    type: 'doubts',
    doubtTitle: 'Why does normal reaction change in circular motion?',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    student_id: 'student_123',
  },
];

// Animated Card Component with Framer-style press and hover effect
const AnimatedPressableCard = ({ children, onPress, delay = 0, ...props }: any) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
    translateY.value = withSpring(2, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
  };

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify().stiffness(120).damping(15)}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        {...props}
      >
        <Animated.View style={animatedStyle}>
          {children}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

// Icon Container Component (Framer style)
const IconContainer = ({ iconName, color = FRAMER_COLORS.primary }: { iconName: string; color?: string }) => (
  <View style={[styles.iconContainer, { backgroundColor: `${color}26` }]}>
    <Icon name={iconName} size={18} color={color} />
  </View>
);

// Collection Card for Notes Tab
const CollectionCard = ({ item, onPress, delay }: { item: NoteItem; onPress: () => void; delay: number }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return 'This week';
  };

  return (
    <AnimatedPressableCard delay={delay} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${item.title}`}>
      <View style={styles.collectionCard}>
        <Row style={{ alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <IconContainer iconName="description" />
          <T style={styles.cardLabel}>{item.title}</T>
        </Row>
        <View style={{ flex: 1, marginBottom: 12 }}>
          <T style={styles.cardTitle}>{item.title}</T>
          <T style={styles.cardSubtitle}>{item.subject}</T>
        </View>
        <T style={styles.cardMeta}>
          {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'} • Updated: {formatDate(item.updated_at)}
        </T>
      </View>
    </AnimatedPressableCard>
  );
};

// Highlight Card for Highlights Tab
const HighlightCard = ({ item, onPress, delay }: { item: HighlightItem; onPress: () => void; delay: number }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <AnimatedPressableCard delay={delay} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${item.sourceTitle}`}>
      <View style={styles.collectionCard}>
        <Row style={{ alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <IconContainer iconName="highlight" color="#F59E0B" />
          <T style={styles.cardLabel}>Highlight</T>
        </Row>
        <View style={{ flex: 1, marginBottom: 12 }}>
          <T style={styles.cardTitle}>{item.sourceTitle}</T>
          <T style={styles.cardSubtitle}>{item.subject}</T>
          <T style={styles.cardExcerpt} numberOfLines={2}>{item.excerpt}</T>
        </View>
        <Row style={{ alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <T style={styles.cardMeta}>{formatDate(item.updated_at)}</T>
          {item.fromResource && (
            <View style={styles.miniChip}>
              <T style={styles.miniChipText}>From resource</T>
            </View>
          )}
        </Row>
      </View>
    </AnimatedPressableCard>
  );
};

// Doubt Snippet Card for Doubts Tab
const DoubtSnippetCard = ({ item, onPress, delay }: { item: DoubtItem; onPress: () => void; delay: number }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <AnimatedPressableCard delay={delay} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${item.doubtTitle}`}>
      <View style={styles.collectionCard}>
        <Row style={{ alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <IconContainer iconName="help-outline" color="#EF4444" />
          <T style={styles.cardLabel}>Doubt</T>
        </Row>
        <View style={{ flex: 1, marginBottom: 12 }}>
          <T style={styles.cardTitle}>{item.doubtTitle}</T>
          <T style={styles.cardSubtitle}>{item.subject}</T>
        </View>
        <T style={styles.cardMeta}>Saved: {formatDate(item.updated_at)}</T>
      </View>
    </AnimatedPressableCard>
  );
};

export default function NotesAndHighlightsScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('notes');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    trackScreenView('NotesAndHighlightsScreen');
  }, []);

  // Calculate totals from all mock data
  const totals = useMemo(() => {
    return MOCK_COLLECTIONS.reduce(
      (acc, item) => {
        acc[item.type] += 1;
        return acc;
      },
      { notes: 0, highlights: 0, doubts: 0 } as Record<TabKey, number>
    );
  }, []);

  // Filter mock data by active tab
  const collections = useMemo(() => {
    return MOCK_COLLECTIONS.filter((item) => item.type === activeTab);
  }, [activeTab]);

  const filteredCollections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return collections.filter((item) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q)
      );
    });
  }, [collections, searchQuery]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    trackAction('notes_tab_change', 'NotesAndHighlightsScreen', { tab });
  };

  const handleOpenCollection = (item: CollectionItem) => {
    trackAction('open_collection', 'NotesAndHighlightsScreen', { id: item.id, type: item.type });
    navigation.navigate('NoteDetailScreen' as any, { noteId: item.id, noteType: item.type });
  };

  const allEmpty = totals.notes === 0 && totals.highlights === 0 && totals.doubts === 0;

  // Tab-specific empty state messages
  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'notes':
        return 'Nothing saved here yet. Create a note during class to see it here.';
      case 'highlights':
        return 'Highlight any resource to see it here.';
      case 'doubts':
        return 'Nothing saved here yet. Save a doubt response to see it here.';
    }
  };

  return (
    <BaseScreen backgroundColor={FRAMER_COLORS.background}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <Animated.View entering={FadeIn.duration(400)}>
            <Row style={styles.topBar}>
              <Pressable onPress={() => navigation.goBack?.()} accessibilityRole="button" accessibilityLabel="Back">
                <Icon name="arrow-back" size={24} color={FRAMER_COLORS.textPrimary} />
              </Pressable>
              <T style={styles.headerTitle}>Notes & highlights</T>
              <View style={{ width: 24 }} />
            </Row>
          </Animated.View>

          {/* Hero Card with Framer Design */}
          <Animated.View entering={FadeInUp.delay(100).springify().stiffness(120).damping(15)}>
            <View style={styles.heroCard}>
              <T style={styles.workspaceLabel}>Workspace</T>
              <T style={styles.heroTitle}>All saved notes in one place</T>
              <T style={styles.heroSubtitle}>
                Capture concepts, highlights, and doubt snippets together.
              </T>
              <View style={styles.statRow}>
                <Animated.View entering={FadeInUp.delay(200).springify().stiffness(120).damping(15)} style={styles.statBox}>
                  <T style={styles.statLabel}>Notes</T>
                  <T style={styles.statValue}>{totals.notes}</T>
                </Animated.View>
                <Animated.View entering={FadeInUp.delay(250).springify().stiffness(120).damping(15)} style={styles.statBox}>
                  <T style={styles.statLabel}>Highlights</T>
                  <T style={styles.statValue}>{totals.highlights}</T>
                </Animated.View>
                <Animated.View entering={FadeInUp.delay(300).springify().stiffness(120).damping(15)} style={styles.statBox}>
                  <T style={styles.statLabel}>From doubts</T>
                  <T style={styles.statValue}>{totals.doubts}</T>
                </Animated.View>
              </View>
            </View>
          </Animated.View>

          {/* Tabs with Counts */}
          <Animated.View entering={FadeInUp.delay(350).springify().stiffness(120).damping(15)}>
            <Row style={styles.tabsRow}>
              {(Object.keys(TAB_LABELS) as TabKey[]).map((tab, index) => (
                <Animated.View
                  key={tab}
                  entering={FadeInUp.delay(400 + index * 50).springify().stiffness(120).damping(15)}
                >
                  <Pressable
                    style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
                    onPress={() => handleTabChange(tab)}
                    accessibilityRole="button"
                  >
                    <T style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                      {TAB_LABELS[tab]} ({totals[tab]})
                    </T>
                  </Pressable>
                </Animated.View>
              ))}
            </Row>
          </Animated.View>

          {/* Search Bar */}
          <Animated.View entering={FadeInUp.delay(500).springify().stiffness(120).damping(15)}>
            <View style={styles.searchCard}>
              <Icon name="search" size={20} color={FRAMER_COLORS.textTertiary} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search notes..."
                placeholderTextColor={FRAMER_COLORS.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                accessibilityLabel="Search notes"
              />
            </View>
          </Animated.View>

          {/* Snapshot Card */}
          <Animated.View entering={FadeInUp.delay(550).springify().stiffness(120).damping(15)}>
            <View style={styles.snapshotCard}>
              <T style={styles.sectionTitle}>Snapshot</T>
              <T style={styles.sectionSubtitle}>
                Stay organized across notes, highlights, and doubt snippets.
              </T>

              {allEmpty ? (
                <T style={styles.emptyText}>
                  No items yet. Add a note during class, highlight a resource, or save a doubt response.
                </T>
              ) : (
                <>
                  <Row style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <T style={styles.bulletText}>Total notes: {totals.notes}</T>
                  </Row>
                  <Row style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <T style={styles.bulletText}>Total highlights: {totals.highlights}</T>
                  </Row>
                  <Row style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <T style={styles.bulletText}>From doubts: {totals.doubts}</T>
                  </Row>
                  <Row style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <T style={styles.bulletText}>Active tab: {TAB_LABELS[activeTab]}</T>
                  </Row>
                </>
              )}
            </View>
          </Animated.View>

          {/* Collections Header */}
          <Animated.View entering={FadeInUp.delay(600).springify().stiffness(120).damping(15)}>
            <View style={styles.sectionHeader}>
              <T style={styles.sectionTitle}>
                {activeTab === 'notes' && 'Collections'}
                {activeTab === 'highlights' && 'Highlights'}
                {activeTab === 'doubts' && 'From doubts'}
              </T>
              <T style={styles.sectionSubtitle}>
                {activeTab === 'notes' && 'Tap any collection to open details.'}
                {activeTab === 'highlights' && 'Tap any highlight to view full content.'}
                {activeTab === 'doubts' && 'Tap to jump back to the original doubt.'}
              </T>
            </View>
          </Animated.View>

          {/* Collection Items */}
          {filteredCollections.length === 0 ? (
            <Animated.View entering={FadeInUp.delay(650).springify().stiffness(120).damping(15)}>
              <View style={styles.emptyCard}>
                <T style={styles.emptyText}>{getEmptyMessage()}</T>
              </View>
            </Animated.View>
          ) : (
            filteredCollections.map((item, index) => {
              const delay = 650 + index * 80;
              const onPress = () => handleOpenCollection(item);

              if (item.type === 'notes') {
                return <CollectionCard key={item.id} item={item} onPress={onPress} delay={delay} />;
              } else if (item.type === 'highlights') {
                return <HighlightCard key={item.id} item={item} onPress={onPress} delay={delay} />;
              } else {
                return <DoubtSnippetCard key={item.id} item={item} onPress={onPress} delay={delay} />;
              }
            })
          )}
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
  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
  },
  heroCard: {
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
  workspaceLabel: {
    fontSize: 12,
    color: FRAMER_COLORS.textSecondary,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    marginTop: 6,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  statLabel: {
    fontSize: 12,
    color: FRAMER_COLORS.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginTop: 4,
  },
  tabsRow: {
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: FRAMER_COLORS.chipBg,
  },
  tabChipActive: {
    backgroundColor: FRAMER_COLORS.chipSelectedBg,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: FRAMER_COLORS.chipText,
  },
  tabTextActive: {
    color: FRAMER_COLORS.chipSelectedText,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
    padding: 0,
  },
  snapshotCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: FRAMER_COLORS.textSecondary,
    marginTop: 4,
  },
  bulletRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FRAMER_COLORS.primary,
    marginRight: 8,
  },
  bulletText: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  collectionCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 12,
    color: FRAMER_COLORS.textSecondary,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: FRAMER_COLORS.textSecondary,
  },
  cardExcerpt: {
    fontSize: 12,
    color: FRAMER_COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  cardMeta: {
    fontSize: 11,
    color: FRAMER_COLORS.textTertiary,
  },
  miniChip: {
    backgroundColor: FRAMER_COLORS.chipBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniChipText: {
    fontSize: 10,
    color: FRAMER_COLORS.chipText,
    fontWeight: '500',
  },
});
