/**
 * LeaderboardScreen - Gamified Rankings
 * Purpose: Show rankings by XP in class/school/global scopes
 * Design: Complete Framer design with scope tabs and medal icons
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, FlatList } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Row, T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type LeaderboardScope = 'class' | 'school' | 'global';

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  isCurrentUser: boolean;
}

interface LeaderboardData {
  myRank: number;
  myXP: number;
  percentile: number; // e.g., 20 means "Top 20%"
  entries: LeaderboardEntry[];
}

// Framer Design Colors
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
  gold: '#F59E0B',
  silver: '#9CA3AF',
  bronze: '#CD7F32',
  highlightBg: '#EFF6FF',
  youBadgeBg: '#2D5BFF',
  youBadgeText: '#FFFFFF',
};

const SCOPE_LABELS: Record<LeaderboardScope, string> = {
  class: 'Class',
  school: 'School',
  global: 'Global',
};

// Scope Tab Component
const ScopeTab = ({ label, active, onPress }: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    style={[styles.scopeTab, active && styles.scopeTabActive]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`Filter by ${label}`}
  >
    <T style={StyleSheet.flatten([styles.scopeTabText, active && styles.scopeTabTextActive])}>
      {label}
    </T>
  </Pressable>
);

// Medal Emoji
const getMedalEmoji = (rank: number): string => {
  if (rank === 1) return '🏆';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
};

// Leaderboard Row Component
const LeaderboardRow = ({ entry, index }: { entry: LeaderboardEntry; index: number }) => {
  const medal = getMedalEmoji(entry.rank);

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).springify().stiffness(120).damping(15)}
      style={[styles.leaderboardRow, entry.isCurrentUser && styles.leaderboardRowHighlight]}
    >
      <View style={styles.rankContainer}>
        {medal ? (
          <T style={styles.medalEmoji}>{medal}</T>
        ) : (
          <T style={styles.rankNumber}>#{entry.rank}</T>
        )}
      </View>

      <View style={styles.rowContent}>
        <Row style={styles.rowHeader}>
          <T style={styles.rowName}>{entry.name}</T>
          {entry.isCurrentUser && (
            <View style={styles.youBadge}>
              <T style={styles.youBadgeText}>You</T>
            </View>
          )}
        </Row>
        <T style={styles.rowXP}>{entry.xp.toLocaleString()} XP</T>
      </View>
    </Animated.View>
  );
};

export default function LeaderboardScreen() {
  const [activeScope, setActiveScope] = useState<LeaderboardScope>('class');

  useEffect(() => {
    trackScreenView('LeaderboardScreen');
  }, []);

  // Fetch leaderboard data
  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['leaderboard', activeScope],
    queryFn: async () => {
      // TODO: Replace with real Supabase queries
      const mockData: Record<LeaderboardScope, LeaderboardData> = {
        class: {
          myRank: 5,
          myXP: 1240,
          percentile: 20,
          entries: [
            { rank: 1, name: 'Raj Kumar', xp: 2100, isCurrentUser: false },
            { rank: 2, name: 'Priya Sharma', xp: 1980, isCurrentUser: false },
            { rank: 3, name: 'Amit Singh', xp: 1850, isCurrentUser: false },
            { rank: 4, name: 'Neha Patel', xp: 1640, isCurrentUser: false },
            { rank: 5, name: 'You', xp: 1240, isCurrentUser: true },
            { rank: 6, name: 'Rohan Gupta', xp: 1180, isCurrentUser: false },
            { rank: 7, name: 'Anjali Verma', xp: 1050, isCurrentUser: false },
            { rank: 8, name: 'Vikram Reddy', xp: 980, isCurrentUser: false },
            { rank: 9, name: 'Sneha Joshi', xp: 920, isCurrentUser: false },
            { rank: 10, name: 'Arjun Mehta', xp: 860, isCurrentUser: false },
          ],
        },
        school: {
          myRank: 28,
          myXP: 1240,
          percentile: 15,
          entries: [
            { rank: 1, name: 'Aarav Kapoor', xp: 3200, isCurrentUser: false },
            { rank: 2, name: 'Ishita Desai', xp: 3050, isCurrentUser: false },
            { rank: 3, name: 'Kabir Shah', xp: 2890, isCurrentUser: false },
            { rank: 25, name: 'Meera Khan', xp: 1320, isCurrentUser: false },
            { rank: 26, name: 'Dev Nair', xp: 1285, isCurrentUser: false },
            { rank: 27, name: 'Tara Bose', xp: 1260, isCurrentUser: false },
            { rank: 28, name: 'You', xp: 1240, isCurrentUser: true },
            { rank: 29, name: 'Rahul Iyer', xp: 1210, isCurrentUser: false },
            { rank: 30, name: 'Pooja Rao', xp: 1180, isCurrentUser: false },
          ],
        },
        global: {
          myRank: 4582,
          myXP: 1240,
          percentile: 35,
          entries: [
            { rank: 1, name: 'Alex Chen', xp: 8500, isCurrentUser: false },
            { rank: 2, name: 'Maria Garcia', xp: 8200, isCurrentUser: false },
            { rank: 3, name: 'Yuki Tanaka', xp: 7950, isCurrentUser: false },
            { rank: 4580, name: 'Sarah Johnson', xp: 1255, isCurrentUser: false },
            { rank: 4581, name: 'Omar Ali', xp: 1248, isCurrentUser: false },
            { rank: 4582, name: 'You', xp: 1240, isCurrentUser: true },
            { rank: 4583, name: 'Liu Wei', xp: 1232, isCurrentUser: false },
            { rank: 4584, name: 'Emma Brown', xp: 1220, isCurrentUser: false },
          ],
        },
      };
      return mockData[activeScope];
    },
  });

  // Footer info based on scope
  const getFooterInfo = (): string => {
    switch (activeScope) {
      case 'class':
        return 'Class leaderboard updates daily.';
      case 'school':
        return 'School leaderboard updates daily.';
      case 'global':
        return 'Global leaderboard is approximate (mock).';
      default:
        return '';
    }
  };

  if (!leaderboard) {
    return (
      <BaseScreen loading={isLoading} error={error} backgroundColor={FRAMER_COLORS.background}>
        <View />
      </BaseScreen>
    );
  }

  return (
    <BaseScreen loading={isLoading} error={error} backgroundColor={FRAMER_COLORS.background}>
      <View style={styles.container}>
        {/* Hero / Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.heroSection}>
          <T style={styles.heroTitle}>Leaderboard</T>
          <T style={styles.heroSubtitle}>Compare your progress with others.</T>
        </Animated.View>

        {/* Scope Tabs */}
        <Animated.View entering={FadeInUp.delay(100).springify().stiffness(120).damping(15)} style={styles.scopeSection}>
          <Row style={styles.scopeTabs}>
            {(['class', 'school', 'global'] as LeaderboardScope[]).map((scope) => (
              <ScopeTab
                key={scope}
                label={SCOPE_LABELS[scope]}
                active={activeScope === scope}
                onPress={() => {
                  trackAction('change_scope', 'LeaderboardScreen', { scope });
                  setActiveScope(scope);
                }}
              />
            ))}
          </Row>
        </Animated.View>

        {/* My Rank Card */}
        <Animated.View entering={FadeInUp.delay(200).springify().stiffness(120).damping(15)} style={styles.myRankCard}>
          <Row style={styles.myRankHeader}>
            <View style={styles.myRankIcon}>
              <Icon name="emoji-events" size={28} color={FRAMER_COLORS.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <T style={styles.myRankStatement}>
                You are #{leaderboard.myRank} in {activeScope}
              </T>
              <T style={styles.myRankXP}>{leaderboard.myXP.toLocaleString()} XP</T>
            </View>
            <View style={styles.percentileChip}>
              <T style={styles.percentileText}>Top {leaderboard.percentile}%</T>
            </View>
          </Row>
        </Animated.View>

        {/* Leaderboard List */}
        <Animated.View entering={FadeInUp.delay(300).springify().stiffness(120).damping(15)} style={styles.listCard}>
          <FlatList
            data={leaderboard.entries}
            keyExtractor={(item) => `${item.rank}-${item.name}`}
            renderItem={({ item, index }) => <LeaderboardRow entry={item} index={index} />}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </Animated.View>

        {/* Scope Info Footer */}
        <Animated.View entering={FadeInUp.delay(400).springify().stiffness(120).damping(15)} style={styles.footerSection}>
          <Icon name="info-outline" size={16} color={FRAMER_COLORS.textTertiary} />
          <T style={styles.footerText}>{getFooterInfo()}</T>
        </Animated.View>
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
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
  // Scope Tabs
  scopeSection: {
    marginBottom: 20,
  },
  scopeTabs: {
    gap: 8,
  },
  scopeTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: FRAMER_COLORS.chipBg,
    alignItems: 'center',
  },
  scopeTabActive: {
    backgroundColor: FRAMER_COLORS.chipSelectedBg,
  },
  scopeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: FRAMER_COLORS.chipText,
  },
  scopeTabTextActive: {
    color: FRAMER_COLORS.chipSelectedText,
  },
  // My Rank Card
  myRankCard: {
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
  myRankHeader: {
    gap: 16,
    alignItems: 'center',
  },
  myRankIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: `${FRAMER_COLORS.gold}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myRankStatement: {
    fontSize: 16,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 4,
  },
  myRankXP: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
  },
  percentileChip: {
    backgroundColor: `${FRAMER_COLORS.primary}1A`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  percentileText: {
    fontSize: 12,
    fontWeight: '600',
    color: FRAMER_COLORS.primary,
  },
  // Leaderboard List
  listCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  leaderboardRowHighlight: {
    backgroundColor: FRAMER_COLORS.highlightBg,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  medalEmoji: {
    fontSize: 24,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: FRAMER_COLORS.textSecondary,
  },
  rowContent: {
    flex: 1,
  },
  rowHeader: {
    gap: 8,
    alignItems: 'center',
    marginBottom: 2,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
  },
  youBadge: {
    backgroundColor: FRAMER_COLORS.youBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: FRAMER_COLORS.youBadgeText,
  },
  rowXP: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  // Footer
  footerSection: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 12,
    color: FRAMER_COLORS.textTertiary,
    flex: 1,
  },
});
