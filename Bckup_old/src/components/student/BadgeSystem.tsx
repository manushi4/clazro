import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  category: 'learning' | 'community' | 'achievement' | 'special' | 'milestone';
  points: number;
  requirements: {
    type: string;
    count: number;
    description: string;
  }[];
  progress?: {
    current: number;
    required: number;
    percentage: number;
  };
  unlockedAt?: Date;
  nextTier?: string;
  series?: string;
  isNew?: boolean;
}

export interface BadgeCollection {
  total: number;
  unlocked: number;
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  mythic: number;
  recentlyUnlocked: Badge[];
  inProgress: Badge[];
  nextToUnlock: Badge[];
}

interface BadgeSystemProps {
  badges: Badge[];
  onBadgeSelect?: (badge: Badge) => void;
  onShareBadge?: (badgeId: string) => void;
  showProgress?: boolean;
  enableNotifications?: boolean;
}

const MOCK_BADGES: Badge[] = [
  {
    id: 'first_question',
    name: 'Curious Mind',
    description: 'Asked your first question in the community',
    icon: '❓',
    rarity: 'common',
    category: 'learning',
    points: 10,
    requirements: [
      { type: 'questions_asked', count: 1, description: 'Ask 1 question' },
    ],
    unlockedAt: new Date('2024-01-10T14:30:00'),
  },
  {
    id: 'helpful_helper',
    name: 'Helpful Helper',
    description: 'Provided 10 helpful answers to community questions',
    icon: '🤝',
    rarity: 'rare',
    category: 'community',
    points: 50,
    requirements: [
      { type: 'helpful_answers', count: 10, description: 'Get 10 answers marked as helpful' },
    ],
    progress: { current: 7, required: 10, percentage: 70 },
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintained a 7-day learning streak',
    icon: '🔥',
    rarity: 'epic',
    category: 'achievement',
    points: 100,
    requirements: [
      { type: 'learning_streak', count: 7, description: 'Learn for 7 consecutive days' },
    ],
    unlockedAt: new Date('2024-01-15T09:00:00'),
    nextTier: 'month_master',
    series: 'Streak Master',
    isNew: true,
  },
  {
    id: 'math_virtuoso',
    name: 'Mathematics Virtuoso',
    description: 'Solved 100 mathematics problems correctly',
    icon: '🧮',
    rarity: 'legendary',
    category: 'special',
    points: 250,
    requirements: [
      { type: 'math_problems_solved', count: 100, description: 'Solve 100 math problems' },
    ],
    progress: { current: 87, required: 100, percentage: 87 },
  },
  {
    id: 'community_leader',
    name: 'Community Leader',
    description: 'Helped 50 different students with their questions',
    icon: '👑',
    rarity: 'mythic',
    category: 'community',
    points: 500,
    requirements: [
      { type: 'students_helped', count: 50, description: 'Help 50 different students' },
      { type: 'community_rating', count: 95, description: 'Maintain 95%+ community rating' },
    ],
    progress: { current: 23, required: 50, percentage: 46 },
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Logged in before 6 AM for 5 consecutive days',
    icon: '🌅',
    rarity: 'rare',
    category: 'milestone',
    points: 75,
    requirements: [
      { type: 'early_logins', count: 5, description: 'Log in before 6 AM for 5 days' },
    ],
    progress: { current: 2, required: 5, percentage: 40 },
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Achieved 100% accuracy on 20 practice sessions',
    icon: '✨',
    rarity: 'epic',
    category: 'achievement',
    points: 150,
    requirements: [
      { type: 'perfect_sessions', count: 20, description: 'Complete 20 sessions with 100% accuracy' },
    ],
    unlockedAt: new Date('2024-01-12T16:45:00'),
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Completed 10 timed challenges under 30 seconds each',
    icon: '⚡',
    rarity: 'rare',
    category: 'achievement',
    points: 80,
    requirements: [
      { type: 'speed_challenges', count: 10, description: 'Complete 10 challenges in under 30 seconds' },
    ],
    progress: { current: 6, required: 10, percentage: 60 },
  },
];

const RARITY_CONFIG = {
  common: { color: '#9E9E9E', label: 'Common', gradient: ['#BDBDBD', '#9E9E9E'] },
  rare: { color: '#2196F3', label: 'Rare', gradient: ['#64B5F6', '#2196F3'] },
  epic: { color: '#9C27B0', label: 'Epic', gradient: ['#BA68C8', '#9C27B0'] },
  legendary: { color: '#FF9800', label: 'Legendary', gradient: ['#FFB74D', '#FF9800'] },
  mythic: { color: '#F44336', label: 'Mythic', gradient: ['#E57373', '#F44336'] },
};

export default function BadgeSystem({
  badges = MOCK_BADGES,
  onBadgeSelect,
  onShareBadge,
  showProgress = true,
  enableNotifications = true,
}: BadgeSystemProps) {
  const { theme } = useTheme();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rarity' | 'points' | 'progress' | 'recent'>('rarity');
  const [animatedValues] = useState(() => 
    badges.reduce((acc, badge) => {
      acc[badge.id] = new Animated.Value(0);
      return acc;
    }, {} as { [key: string]: Animated.Value })
  );

  useEffect(() => {
    // Animate badge cards on mount
    badges.forEach((badge, index) => {
      Animated.timing(animatedValues[badge.id], {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    });
  }, [badges]);

  const getBadgeCollection = useCallback((): BadgeCollection => {
    const unlocked = badges.filter(b => b.unlockedAt);
    const recentlyUnlocked = unlocked
      .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
      .slice(0, 5);
    
    const inProgress = badges
      .filter(b => !b.unlockedAt && b.progress && b.progress.percentage > 0)
      .sort((a, b) => (b.progress?.percentage || 0) - (a.progress?.percentage || 0))
      .slice(0, 5);
    
    const nextToUnlock = badges
      .filter(b => !b.unlockedAt && (!b.progress || b.progress.percentage === 0))
      .slice(0, 5);

    return {
      total: badges.length,
      unlocked: unlocked.length,
      common: unlocked.filter(b => b.rarity === 'common').length,
      rare: unlocked.filter(b => b.rarity === 'rare').length,
      epic: unlocked.filter(b => b.rarity === 'epic').length,
      legendary: unlocked.filter(b => b.rarity === 'legendary').length,
      mythic: unlocked.filter(b => b.rarity === 'mythic').length,
      recentlyUnlocked,
      inProgress,
      nextToUnlock,
    };
  }, [badges]);

  const getFilteredBadges = useCallback(() => {
    let filtered = badges;

    if (filterRarity !== 'all') {
      filtered = filtered.filter(badge => badge.rarity === filterRarity);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(badge => badge.category === filterCategory);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rarity':
          const rarityOrder = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 };
          return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
        case 'points':
          return b.points - a.points;
        case 'progress':
          const aProgress = a.progress?.percentage || (a.unlockedAt ? 100 : 0);
          const bProgress = b.progress?.percentage || (b.unlockedAt ? 100 : 0);
          return bProgress - aProgress;
        case 'recent':
          const aTime = a.unlockedAt?.getTime() || 0;
          const bTime = b.unlockedAt?.getTime() || 0;
          return bTime - aTime;
        default:
          return 0;
      }
    });
  }, [badges, filterRarity, filterCategory, sortBy]);

  const handleBadgePress = (badge: Badge) => {
    setSelectedBadge(badge);
    setModalVisible(true);
    onBadgeSelect?.(badge);
  };

  const handleShareBadge = (badgeId: string) => {
    onShareBadge?.(badgeId);
    Alert.alert(
      'Badge Shared!',
      'Your achievement has been shared with the community.',
      [{ text: 'Great!' }]
    );
  };

  const getRarityColor = (rarity: Badge['rarity']) => {
    return RARITY_CONFIG[rarity]?.color || theme.primary;
  };

  const renderBadge = ({ item: badge }: { item: Badge }) => {
    const rarityConfig = RARITY_CONFIG[badge.rarity];
    const isUnlocked = !!badge.unlockedAt;
    const progress = badge.progress?.percentage || 0;

    return (
      <Animated.View
        style={[
          styles.badgeCard,
          {
            opacity: animatedValues[badge.id],
            transform: [{
              scale: animatedValues[badge.id].interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            }],
            backgroundColor: isUnlocked ? theme.Surface : theme.SurfaceVariant,
          }
        ]}
      >
        <TouchableOpacity
          style={styles.badgeContent}
          onPress={() => handleBadgePress(badge)}
          accessibilityRole="button"
          accessibilityLabel={`View badge: ${badge.name}`}
        >
          <View style={styles.badgeHeader}>
            <Text style={[styles.badgeIcon, { opacity: isUnlocked ? 1 : 0.6 }]}>
              {badge.icon}
            </Text>
            {badge.isNew && (
              <View style={[styles.newBadge, { backgroundColor: '#4CAF50' }]}>
                <Text style={[styles.newBadgeText, { color: theme.OnPrimary }]}>NEW</Text>
              </View>
            )}
          </View>

          <Text
            style={[
              styles.badgeName,
              {
                color: isUnlocked ? theme.OnSurface : theme.OnSurfaceVariant,
                fontWeight: isUnlocked ? 'bold' : 'normal',
              }
            ]}
            numberOfLines={2}
          >
            {badge.name}
          </Text>

          <View style={[styles.rarityBadge, { backgroundColor: rarityConfig.color }]}>
            <Text style={[styles.rarityText, { color: theme.OnPrimary }]}>
              {rarityConfig.label}
            </Text>
          </View>

          <Text
            style={[
              styles.badgePoints,
              {
                color: isUnlocked ? theme.primary : theme.OnSurfaceVariant,
              }
            ]}
          >
            {badge.points} pts
          </Text>

          {showProgress && badge.progress && !isUnlocked && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: theme.Outline }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: rarityConfig.color,
                      width: `${progress}%`,
                    }
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: theme.OnSurfaceVariant }]}>
                {badge.progress.current}/{badge.progress.required}
              </Text>
            </View>
          )}

          {isUnlocked && badge.unlockedAt && (
            <Text style={[styles.unlockedDate, { color: theme.OnSurfaceVariant }]}>
              Unlocked {badge.unlockedAt.toLocaleDateString()}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderCollectionStats = () => {
    const collection = getBadgeCollection();
    
    return (
      <View style={[styles.statsContainer, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.statsTitle, { color: theme.OnSurface }]}>
          Badge Collection
        </Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>
              {collection.unlocked}
            </Text>
            <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
              Unlocked
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.OnSurface }]}>
              {collection.total}
            </Text>
            <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
              Total
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: RARITY_CONFIG.legendary.color }]}>
              {collection.legendary}
            </Text>
            <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
              Legendary
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: RARITY_CONFIG.mythic.color }]}>
              {collection.mythic}
            </Text>
            <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
              Mythic
            </Text>
          </View>
        </View>

        <View style={styles.rarityBreakdown}>
          {Object.entries(RARITY_CONFIG).map(([rarity, config]) => {
            const count = collection[rarity as keyof BadgeCollection] as number;
            return (
              <View key={rarity} style={styles.rarityItem}>
                <View style={[styles.rarityDot, { backgroundColor: config.color }]} />
                <Text style={[styles.rarityCount, { color: theme.OnSurfaceVariant }]}>
                  {count} {config.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: theme.Surface }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.OnSurfaceVariant }]}>
            Rarity:
          </Text>
          {['all', ...Object.keys(RARITY_CONFIG)].map(rarity => (
            <TouchableOpacity
              key={rarity}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filterRarity === rarity 
                    ? theme.primary 
                    : theme.Surface,
                }
              ]}
              onPress={() => setFilterRarity(rarity)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: filterRarity === rarity 
                      ? theme.OnPrimary 
                      : theme.OnSurface,
                  }
                ]}
              >
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.OnSurfaceVariant }]}>
            Sort:
          </Text>
          {['rarity', 'points', 'progress', 'recent'].map(sort => (
            <TouchableOpacity
              key={sort}
              style={[
                styles.filterButton,
                {
                  backgroundColor: sortBy === sort 
                    ? theme.primary 
                    : theme.Surface,
                }
              ]}
              onPress={() => setSortBy(sort as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: sortBy === sort 
                      ? theme.OnPrimary 
                      : theme.OnSurface,
                  }
                ]}
              >
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderBadgeModal = () => (
    <Modal
      visible={modalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          {selectedBadge && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalBadgeIcon}>{selectedBadge.icon}</Text>
                <Text style={[styles.modalBadgeName, { color: theme.OnSurface }]}>
                  {selectedBadge.name}
                </Text>
                <View
                  style={[
                    styles.modalRarityBadge,
                    { backgroundColor: getRarityColor(selectedBadge.rarity) }
                  ]}
                >
                  <Text style={[styles.modalRarityText, { color: theme.OnPrimary }]}>
                    {RARITY_CONFIG[selectedBadge.rarity].label}
                  </Text>
                </View>
              </View>

              <Text style={[styles.modalDescription, { color: theme.OnSurfaceVariant }]}>
                {selectedBadge.description}
              </Text>

              <View style={styles.modalDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.OnSurfaceVariant }]}>
                    Points:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.primary }]}>
                    {selectedBadge.points}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.OnSurfaceVariant }]}>
                    Category:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.OnSurface }]}>
                    {selectedBadge.category.charAt(0).toUpperCase() + selectedBadge.category.slice(1)}
                  </Text>
                </View>

                {selectedBadge.series && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.OnSurfaceVariant }]}>
                      Series:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.OnSurface }]}>
                      {selectedBadge.series}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.requirementsSection}>
                <Text style={[styles.requirementsTitle, { color: theme.OnSurface }]}>
                  Requirements:
                </Text>
                {selectedBadge.requirements.map((req, index) => (
                  <Text key={index} style={[styles.requirementText, { color: theme.OnSurfaceVariant }]}>
                    • {req.description}
                  </Text>
                ))}
              </View>

              {selectedBadge.progress && !selectedBadge.unlockedAt && (
                <View style={styles.modalProgressSection}>
                  <Text style={[styles.modalProgressTitle, { color: theme.OnSurface }]}>
                    Progress:
                  </Text>
                  <View style={[styles.modalProgressBar, { backgroundColor: theme.SurfaceVariant }]}>
                    <View
                      style={[
                        styles.modalProgressFill,
                        {
                          backgroundColor: getRarityColor(selectedBadge.rarity),
                          width: `${selectedBadge.progress.percentage}%`,
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.modalProgressText, { color: theme.OnSurfaceVariant }]}>
                    {selectedBadge.progress.current} / {selectedBadge.progress.required} ({selectedBadge.progress.percentage}%)
                  </Text>
                </View>
              )}

              {selectedBadge.unlockedAt && (
                <Text style={[styles.modalUnlockedDate, { color: theme.OnSurfaceVariant }]}>
                  Unlocked on {selectedBadge.unlockedAt.toLocaleDateString()} at {selectedBadge.unlockedAt.toLocaleTimeString()}
                </Text>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.Surface }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.OnSurface }]}>
                    Close
                  </Text>
                </TouchableOpacity>

                {selectedBadge.unlockedAt && (
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: theme.primary }]}
                    onPress={() => {
                      handleShareBadge(selectedBadge.id);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalButtonText, { color: theme.OnPrimary }]}>
                      Share Badge
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.Outline }]}>
        <Text style={[styles.headerTitle, { color: theme.OnSurface }]}>
          Badge System
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.OnSurfaceVariant }]}>
          Collect badges by completing achievements
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCollectionStats()}
        {renderFilters()}

        <View style={styles.badgesGrid}>
          <FlatList
            data={getFilteredBadges()}
            renderItem={renderBadge}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.badgeRow}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        </View>
      </ScrollView>

      {renderBadgeModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  rarityBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  rarityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  rarityCount: {
    fontSize: 12,
  },
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badgesGrid: {
    padding: 16,
  },
  badgeRow: {
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '48%',
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  badgeContent: {
    padding: 16,
    alignItems: 'center',
  },
  badgeHeader: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeIcon: {
    fontSize: 32,
  },
  newBadge: {
    position: 'absolute',
    top: -4,
    right: -20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 32,
    lineHeight: 16,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgePoints: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
  },
  unlockedDate: {
    fontSize: 10,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalBadgeIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  modalBadgeName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalRarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modalRarityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
  },
  requirementsSection: {
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 18,
  },
  modalProgressSection: {
    marginBottom: 16,
  },
  modalProgressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  modalProgressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalUnlockedDate: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});