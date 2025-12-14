import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface LeaderboardUser {
  id: string;
  userName: string;
  avatar: string;
  rank: number;
  previousRank: number;
  points: number;
  level: number;
  badges: number;
  achievements: number;
  weeklyPoints: number;
  monthlyPoints: number;
  streak: number;
  specializations: string[];
  joinedDate: Date;
  isCurrentUser?: boolean;
}

export interface LeaderboardPeriod {
  key: 'all_time' | 'monthly' | 'weekly' | 'daily';
  label: string;
}

export interface LeaderboardCategory {
  key: 'overall' | 'subject_specific' | 'helpful_answers' | 'questions_asked' | 'streak';
  label: string;
  description: string;
}

interface LeaderBoardProps {
  users?: LeaderboardUser[];
  currentUserId: string;
  onUserSelect?: (userId: string) => void;
  onChallengeUser?: (userId: string) => void;
  showUserProfiles?: boolean;
  allowChallenges?: boolean;
}

const MOCK_LEADERBOARD_USERS: LeaderboardUser[] = [
  {
    id: 'user1',
    userName: 'MathWizard Sarah',
    avatar: '👑',
    rank: 1,
    previousRank: 1,
    points: 45780,
    level: 28,
    badges: 47,
    achievements: 23,
    weeklyPoints: 2340,
    monthlyPoints: 8760,
    streak: 89,
    specializations: ['Mathematics', 'Physics', 'Statistics'],
    joinedDate: new Date('2023-08-15'),
  },
  {
    id: 'user2',
    userName: 'PhysicsExplorer Mike',
    avatar: '🚀',
    rank: 2,
    previousRank: 3,
    points: 42150,
    level: 26,
    badges: 41,
    achievements: 19,
    weeklyPoints: 1890,
    monthlyPoints: 7420,
    streak: 67,
    specializations: ['Physics', 'Chemistry', 'Engineering'],
    joinedDate: new Date('2023-09-02'),
  },
  {
    id: 'user3',
    userName: 'CodeMaster Emma',
    avatar: '💻',
    rank: 3,
    previousRank: 2,
    points: 39870,
    level: 24,
    badges: 38,
    achievements: 21,
    weeklyPoints: 1650,
    monthlyPoints: 6890,
    streak: 45,
    specializations: ['Computer Science', 'Mathematics', 'Logic'],
    joinedDate: new Date('2023-07-20'),
  },
  {
    id: 'current_user',
    userName: 'You',
    avatar: '🎯',
    rank: 47,
    previousRank: 52,
    points: 15890,
    level: 12,
    badges: 8,
    achievements: 5,
    weeklyPoints: 320,
    monthlyPoints: 1240,
    streak: 7,
    specializations: ['Mathematics', 'Physics'],
    joinedDate: new Date('2024-01-10'),
    isCurrentUser: true,
  },
  // Add more mock users for a complete leaderboard
  ...Array.from({ length: 96 }, (_, i) => ({
    id: `user${i + 4}`,
    userName: `Student${i + 4}`,
    avatar: ['🎓', '📚', '🔬', '🧮', '💡', '⚡', '🌟', '🏆'][i % 8],
    rank: i + 4,
    previousRank: i + Math.floor(Math.random() * 6) - 2,
    points: Math.floor(Math.random() * 35000) + 1000,
    level: Math.floor(Math.random() * 20) + 5,
    badges: Math.floor(Math.random() * 30) + 1,
    achievements: Math.floor(Math.random() * 15) + 1,
    weeklyPoints: Math.floor(Math.random() * 500) + 50,
    monthlyPoints: Math.floor(Math.random() * 2000) + 200,
    streak: Math.floor(Math.random() * 60) + 1,
    specializations: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'].slice(0, Math.floor(Math.random() * 3) + 1),
    joinedDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
  })),
];

const LEADERBOARD_PERIODS: LeaderboardPeriod[] = [
  { key: 'all_time', label: 'All Time' },
  { key: 'monthly', label: 'This Month' },
  { key: 'weekly', label: 'This Week' },
  { key: 'daily', label: 'Today' },
];

const LEADERBOARD_CATEGORIES: LeaderboardCategory[] = [
  { 
    key: 'overall', 
    label: 'Overall Points', 
    description: 'Total points earned across all activities' 
  },
  { 
    key: 'helpful_answers', 
    label: 'Helpful Answers', 
    description: 'Points from answers marked as helpful' 
  },
  { 
    key: 'questions_asked', 
    label: 'Quality Questions', 
    description: 'Points from well-received questions' 
  },
  { 
    key: 'streak', 
    label: 'Learning Streak', 
    description: 'Consecutive days of learning activity' 
  },
  { 
    key: 'subject_specific', 
    label: 'Subject Expert', 
    description: 'Points within specific subjects' 
  },
];

export default function LeaderBoard({
  users = MOCK_LEADERBOARD_USERS,
  currentUserId = 'current_user',
  onUserSelect,
  onChallengeUser,
  showUserProfiles = true,
  allowChallenges = true,
}: LeaderBoardProps) {
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod['key']>('all_time');
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory['key']>('overall');
  const [refreshing, setRefreshing] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNearMe, setShowNearMe] = useState(false);

  const currentUser = users.find(u => u.id === currentUserId);
  const currentUserRank = currentUser?.rank || 0;

  const getFilteredUsers = useCallback(() => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.specializations.some(spec => 
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    if (showNearMe && currentUserRank > 0) {
      const nearbyRange = 10;
      filtered = filtered.filter(user => 
        Math.abs(user.rank - currentUserRank) <= nearbyRange
      );
    }

    // Sort based on selected period and category
    return filtered.sort((a, b) => {
      switch (selectedCategory) {
        case 'overall':
          return selectedPeriod === 'weekly' ? b.weeklyPoints - a.weeklyPoints :
                 selectedPeriod === 'monthly' ? b.monthlyPoints - a.monthlyPoints :
                 b.points - a.points;
        case 'streak':
          return b.streak - a.streak;
        case 'helpful_answers':
        case 'questions_asked':
        case 'subject_specific':
        default:
          return b.points - a.points;
      }
    }).map((user, index) => ({ ...user, rank: index + 1 }));
  }, [users, searchQuery, showNearMe, currentUserRank, selectedPeriod, selectedCategory]);

  const getRankChange = (user: LeaderboardUser) => {
    const change = user.previousRank - user.rank;
    if (change > 0) return `↗ +${change}`;
    if (change < 0) return `↘ ${change}`;
    return '→ 0';
  };

  const getRankChangeColor = (user: LeaderboardUser) => {
    const change = user.previousRank - user.rank;
    if (change > 0) return '#4CAF50';
    if (change < 0) return '#F44336';
    return theme.OnSurfaceVariant;
  };

  const getTrophyIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🏆';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank <= 10 ? '🏅' : '🎯';
    }
  };

  const getPointsForPeriod = (user: LeaderboardUser) => {
    switch (selectedPeriod) {
      case 'weekly': return user.weeklyPoints;
      case 'monthly': return user.monthlyPoints;
      case 'daily': return Math.floor(user.weeklyPoints / 7);
      default: return user.points;
    }
  };

  const handleUserPress = (user: LeaderboardUser) => {
    if (showUserProfiles) {
      setSelectedUser(user);
      setUserModalVisible(true);
    }
    onUserSelect?.(user.id);
  };

  const handleChallenge = (userId: string) => {
    onChallengeUser?.(userId);
    setUserModalVisible(false);
  };

  const renderUser = ({ item: user, index }: { item: LeaderboardUser; index: number }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        {
          backgroundColor: user.isCurrentUser 
            ? theme.primaryContainer 
            : theme.Surface,
        }
      ]}
      onPress={() => handleUserPress(user)}
      accessibilityRole="button"
      accessibilityLabel={`View profile for ${user.userName}, rank ${user.rank}`}
    >
      <View style={styles.rankSection}>
        <Text style={styles.trophyIcon}>{getTrophyIcon(user.rank)}</Text>
        <Text
          style={[
            styles.rankNumber,
            {
              color: user.rank <= 3 ? '#FFD700' : theme.OnSurface,
              fontWeight: user.rank <= 3 ? 'bold' : 'normal',
            }
          ]}
        >
          #{user.rank}
        </Text>
        <Text
          style={[
            styles.rankChange,
            { color: getRankChangeColor(user) }
          ]}
        >
          {getRankChange(user)}
        </Text>
      </View>

      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userAvatar}>{user.avatar}</Text>
          <View style={styles.userDetails}>
            <Text
              style={[
                styles.userName,
                {
                  color: user.isCurrentUser 
                    ? theme.OnPrimaryContainer 
                    : theme.OnSurface,
                  fontWeight: user.isCurrentUser ? 'bold' : '600',
                }
              ]}
            >
              {user.userName}
            </Text>
            <Text
              style={[
                styles.userLevel,
                {
                  color: user.isCurrentUser 
                    ? theme.OnPrimaryContainer 
                    : theme.OnSurfaceVariant,
                }
              ]}
            >
              Level {user.level} • {user.streak} day streak
            </Text>
          </View>
        </View>

        <View style={styles.specializationsRow}>
          {user.specializations.slice(0, 2).map(spec => (
            <View
              key={spec}
              style={[
                styles.specTag,
                {
                  backgroundColor: user.isCurrentUser 
                    ? theme.primary 
                    : theme.primaryContainer,
                }
              ]}
            >
              <Text
                style={[
                  styles.specText,
                  {
                    color: user.isCurrentUser 
                      ? theme.OnPrimary 
                      : theme.OnPrimaryContainer,
                  }
                ]}
              >
                {spec}
              </Text>
            </View>
          ))}
          {user.specializations.length > 2 && (
            <Text
              style={[
                styles.moreSpecs,
                {
                  color: user.isCurrentUser 
                    ? theme.OnPrimaryContainer 
                    : theme.OnSurfaceVariant,
                }
              ]}
            >
              +{user.specializations.length - 2}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.pointsSection}>
        <Text
          style={[
            styles.pointsNumber,
            {
              color: user.isCurrentUser 
                ? theme.OnPrimaryContainer 
                : theme.primary,
            }
          ]}
        >
          {getPointsForPeriod(user).toLocaleString()}
        </Text>
        <Text
          style={[
            styles.pointsLabel,
            {
              color: user.isCurrentUser 
                ? theme.OnPrimaryContainer 
                : theme.OnSurfaceVariant,
            }
          ]}
        >
          points
        </Text>
        <View style={styles.achievementsRow}>
          <Text
            style={[
              styles.achievementText,
              {
                color: user.isCurrentUser 
                  ? theme.OnPrimaryContainer 
                  : theme.OnSurfaceVariant,
              }
            ]}
          >
            🏆 {user.badges} • ⭐ {user.achievements}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: theme.Surface }]}>
      <TextInput
        style={[
          styles.searchInput,
          { backgroundColor: theme.SurfaceVariant, color: theme.OnSurface }
        ]}
        placeholder="Search users..."
        placeholderTextColor={theme.OnSurfaceVariant}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.OnSurfaceVariant }]}>
            Period:
          </Text>
          {LEADERBOARD_PERIODS.map(period => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedPeriod === period.key 
                    ? theme.primary 
                    : theme.Surface,
                }
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: selectedPeriod === period.key 
                      ? theme.OnPrimary 
                      : theme.OnSurface,
                  }
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.OnSurfaceVariant }]}>
            Category:
          </Text>
          {LEADERBOARD_CATEGORIES.slice(0, 3).map(category => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedCategory === category.key 
                    ? theme.primary 
                    : theme.Surface,
                }
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: selectedCategory === category.key 
                      ? theme.OnPrimary 
                      : theme.OnSurface,
                  }
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            {
              backgroundColor: showNearMe ? theme.primaryContainer : theme.Surface,
            }
          ]}
          onPress={() => setShowNearMe(!showNearMe)}
          accessibilityRole="button"
          accessibilityLabel="Show users near my rank"
        >
          <Text
            style={[
              styles.toggleButtonText,
              {
                color: showNearMe ? theme.OnPrimaryContainer : theme.OnSurface,
              }
            ]}
          >
            🎯 Show Near Me ({currentUserRank ? `#${currentUserRank}` : 'Unranked'})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUserModal = () => (
    <Modal
      visible={userModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setUserModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.userModalContent, { backgroundColor: theme.background }]}>
          {selectedUser && (
            <>
              <View style={[styles.modalHeader, { borderBottomColor: theme.Outline }]}>
                <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
                  User Profile
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setUserModalVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close user profile"
                >
                  <Text style={[styles.closeButtonText, { color: theme.primary }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.profileHeader}>
                  <Text style={styles.profileAvatar}>{selectedUser.avatar}</Text>
                  <Text style={[styles.profileName, { color: theme.OnSurface }]}>
                    {selectedUser.userName}
                  </Text>
                  <View style={styles.profileRank}>
                    <Text style={styles.profileTrophy}>{getTrophyIcon(selectedUser.rank)}</Text>
                    <Text style={[styles.profileRankText, { color: theme.primary }]}>
                      Rank #{selectedUser.rank}
                    </Text>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { backgroundColor: theme.Surface }]}>
                    <Text style={[styles.statNumber, { color: theme.primary }]}>
                      {selectedUser.points.toLocaleString()}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
                      Total Points
                    </Text>
                  </View>

                  <View style={[styles.statCard, { backgroundColor: theme.Surface }]}>
                    <Text style={[styles.statNumber, { color: '#FF9800' }]}>
                      {selectedUser.level}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
                      Level
                    </Text>
                  </View>

                  <View style={[styles.statCard, { backgroundColor: theme.Surface }]}>
                    <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                      {selectedUser.streak}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
                      Day Streak
                    </Text>
                  </View>

                  <View style={[styles.statCard, { backgroundColor: theme.Surface }]}>
                    <Text style={[styles.statNumber, { color: '#9C27B0' }]}>
                      {selectedUser.badges}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.OnSurfaceVariant }]}>
                      Badges
                    </Text>
                  </View>
                </View>

                <View style={styles.profileSection}>
                  <Text style={[styles.profileSectionTitle, { color: theme.OnSurface }]}>
                    Specializations
                  </Text>
                  <View style={styles.profileSpecs}>
                    {selectedUser.specializations.map(spec => (
                      <View
                        key={spec}
                        style={[styles.profileSpecTag, { backgroundColor: theme.primaryContainer }]}
                      >
                        <Text style={[styles.profileSpecText, { color: theme.OnPrimaryContainer }]}>
                          {spec}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.profileSection}>
                  <Text style={[styles.profileSectionTitle, { color: theme.OnSurface }]}>
                    Recent Activity
                  </Text>
                  <Text style={[styles.activityText, { color: theme.OnSurfaceVariant }]}>
                    Weekly Points: {selectedUser.weeklyPoints.toLocaleString()}
                  </Text>
                  <Text style={[styles.activityText, { color: theme.OnSurfaceVariant }]}>
                    Monthly Points: {selectedUser.monthlyPoints.toLocaleString()}
                  </Text>
                  <Text style={[styles.activityText, { color: theme.OnSurfaceVariant }]}>
                    Member since: {selectedUser.joinedDate.toLocaleDateString()}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.Surface }]}
                  onPress={() => setUserModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.OnSurface }]}>
                    Close
                  </Text>
                </TouchableOpacity>

                {allowChallenges && !selectedUser.isCurrentUser && (
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: theme.primary }]}
                    onPress={() => handleChallenge(selectedUser.id)}
                  >
                    <Text style={[styles.modalButtonText, { color: theme.OnPrimary }]}>
                      Challenge
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
          Leaderboard
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.OnSurfaceVariant }]}>
          {getFilteredUsers().length} active learners
        </Text>
      </View>

      {renderFilters()}

      <FlatList
        data={getFilteredUsers()}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        style={styles.usersList}
        contentContainerStyle={styles.usersContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 1000);
            }}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.OnSurfaceVariant }]}>
              No users found matching your criteria
            </Text>
          </View>
        }
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      {renderUserModal()}
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
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  filtersRow: {
    marginBottom: 12,
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
  toggleRow: {
    alignItems: 'flex-start',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  usersList: {
    flex: 1,
  },
  usersContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rankSection: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  trophyIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  rankChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userLevel: {
    fontSize: 14,
  },
  specializationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  specText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreSpecs: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  pointsSection: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  pointsNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pointsLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  achievementsRow: {
    alignItems: 'center',
  },
  achievementText: {
    fontSize: 12,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    maxHeight: 400,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
  },
  profileAvatar: {
    fontSize: 48,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  profileRank: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileTrophy: {
    fontSize: 20,
    marginRight: 8,
  },
  profileRankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  profileSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  profileSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  profileSpecTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  profileSpecText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activityText: {
    fontSize: 14,
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});