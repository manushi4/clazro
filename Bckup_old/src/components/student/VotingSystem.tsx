import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface VotableItem {
  id: string;
  type: 'question' | 'answer' | 'comment';
  title?: string;
  content: string;
  authorId: string;
  authorName: string;
  authorLevel: 'Beginner' | 'Intermediate' | 'Expert' | 'Mentor';
  createdAt: Date;
  votes: {
    upvotes: number;
    downvotes: number;
    userVote?: 'up' | 'down' | null;
  };
  tags?: string[];
  isBestAnswer?: boolean;
  isModerated?: boolean;
  reportCount?: number;
}

export interface VoteHistory {
  id: string;
  itemId: string;
  itemType: 'question' | 'answer' | 'comment';
  voteType: 'up' | 'down';
  timestamp: Date;
  reason?: string;
}

export interface ModerationAction {
  id: string;
  itemId: string;
  action: 'approve' | 'reject' | 'flag' | 'remove';
  moderatorId: string;
  moderatorName: string;
  reason: string;
  timestamp: Date;
}

interface VotingSystemProps {
  items: VotableItem[];
  currentUserId: string;
  onVote: (itemId: string, voteType: 'up' | 'down') => void;
  onReport: (itemId: string, reason: string) => void;
  onMarkBestAnswer?: (itemId: string) => void;
  showModeration?: boolean;
  allowReporting?: boolean;
  voteHistory?: VoteHistory[];
}

const MOCK_ITEMS: VotableItem[] = [
  {
    id: 'q1',
    type: 'question',
    title: 'How to solve quadratic equations using the discriminant?',
    content: 'I understand the basic quadratic formula, but I\'m confused about how the discriminant (b²-4ac) helps determine the nature of roots. Can someone explain this step by step?',
    authorId: 'student1',
    authorName: 'Emma Wilson',
    authorLevel: 'Beginner',
    createdAt: new Date('2024-01-15T10:00:00'),
    votes: {
      upvotes: 12,
      downvotes: 1,
      userVote: null,
    },
    tags: ['algebra', 'quadratic', 'discriminant'],
  },
  {
    id: 'a1',
    type: 'answer',
    content: 'The discriminant tells us about the roots without actually solving! If Δ > 0: two distinct real roots, Δ = 0: one repeated root, Δ < 0: two complex roots. For example, in x²-4x+3=0, Δ=16-12=4>0, so two real roots exist.',
    authorId: 'mentor1',
    authorName: 'Dr. Sarah Chen',
    authorLevel: 'Mentor',
    createdAt: new Date('2024-01-15T10:15:00'),
    votes: {
      upvotes: 18,
      downvotes: 0,
      userVote: 'up',
    },
    isBestAnswer: true,
  },
  {
    id: 'a2',
    type: 'answer',
    content: 'Think of the discriminant as a "preview" of what your roots will look like. I always visualize it on a graph - when Δ > 0, the parabola crosses the x-axis twice, when Δ = 0, it just touches once, and when Δ < 0, it doesn\'t touch at all.',
    authorId: 'student2',
    authorName: 'Alex Rodriguez',
    authorLevel: 'Intermediate',
    createdAt: new Date('2024-01-15T10:30:00'),
    votes: {
      upvotes: 8,
      downvotes: 2,
      userVote: null,
    },
  },
  {
    id: 'c1',
    type: 'comment',
    content: 'Great explanation! Could you also show how this applies to word problems?',
    authorId: 'student3',
    authorName: 'Maya Patel',
    authorLevel: 'Beginner',
    createdAt: new Date('2024-01-15T10:45:00'),
    votes: {
      upvotes: 3,
      downvotes: 0,
      userVote: null,
    },
  },
];

const REPORT_REASONS = [
  'Inappropriate content',
  'Spam or promotional',
  'Incorrect information',
  'Plagiarism',
  'Off-topic discussion',
  'Harassment or abuse',
  'Copyright violation',
  'Other',
];

export default function VotingSystem({
  items = MOCK_ITEMS,
  currentUserId = 'current_user',
  onVote,
  onReport,
  onMarkBestAnswer,
  showModeration = false,
  allowReporting = true,
  voteHistory = [],
}: VotingSystemProps) {
  const { theme } = useTheme();
  const [votableItems, setVotableItems] = useState<VotableItem[]>(items);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VotableItem | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'votes' | 'recent' | 'controversial'>('votes');
  const [filterBy, setFilterBy] = useState<'all' | 'question' | 'answer' | 'comment'>('all');
  const [showVoteAnimation, setShowVoteAnimation] = useState<{ [key: string]: 'up' | 'down' | null }>({});

  useEffect(() => {
    setVotableItems(items);
  }, [items]);

  const handleVote = useCallback((itemId: string, voteType: 'up' | 'down') => {
    const animationValue = new Animated.Value(0);
    
    setShowVoteAnimation(prev => ({ ...prev, [itemId]: voteType }));
    
    Animated.sequence([
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animationValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowVoteAnimation(prev => ({ ...prev, [itemId]: null }));
    });

    setVotableItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      
      const currentVote = item.votes.userVote;
      let newUpvotes = item.votes.upvotes;
      let newDownvotes = item.votes.downvotes;
      let newUserVote: 'up' | 'down' | null = null;

      if (currentVote === voteType) {
        // Remove existing vote
        if (voteType === 'up') {
          newUpvotes--;
        } else {
          newDownvotes--;
        }
        newUserVote = null;
      } else {
        // Add or change vote
        if (currentVote === 'up') newUpvotes--;
        if (currentVote === 'down') newDownvotes--;
        
        if (voteType === 'up') {
          newUpvotes++;
        } else {
          newDownvotes++;
        }
        newUserVote = voteType;
      }

      return {
        ...item,
        votes: {
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          userVote: newUserVote,
        }
      };
    }));

    onVote(itemId, voteType);
  }, [onVote]);

  const handleReport = useCallback(() => {
    if (!selectedItem || !selectedReportReason) return;
    
    onReport(selectedItem.id, selectedReportReason);
    setReportModalVisible(false);
    setSelectedItem(null);
    setSelectedReportReason(null);
    
    Alert.alert(
      'Report Submitted',
      'Thank you for helping maintain our community standards. Our moderation team will review this content.',
      [{ text: 'OK' }]
    );
  }, [selectedItem, selectedReportReason, onReport]);

  const handleMarkBestAnswer = useCallback((itemId: string) => {
    if (!onMarkBestAnswer) return;
    
    Alert.alert(
      'Mark as Best Answer',
      'Are you sure you want to mark this as the best answer? This will help other students find the most helpful response.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Best',
          onPress: () => {
            setVotableItems(prev => prev.map(item => ({
              ...item,
              isBestAnswer: item.id === itemId ? true : false,
            })));
            onMarkBestAnswer(itemId);
          },
        },
      ]
    );
  }, [onMarkBestAnswer]);

  const getScoreColor = (upvotes: number, downvotes: number) => {
    const score = upvotes - downvotes;
    if (score > 5) return '#4CAF50'; // Green for highly upvoted
    if (score > 0) return theme.primary; // Primary for positive
    if (score === 0) return theme.OnSurfaceVariant; // Neutral
    return theme.error; // Red for negative
  };

  const getAuthorLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return '#4CAF50';
      case 'Intermediate': return '#FF9800';
      case 'Expert': return '#9C27B0';
      case 'Mentor': return '#F44336';
      default: return theme.OnSurface;
    }
  };

  const getSortedAndFilteredItems = () => {
    let filtered = votableItems;
    
    if (filterBy !== 'all') {
      filtered = filtered.filter(item => item.type === filterBy);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'votes':
          const scoreA = a.votes.upvotes - a.votes.downvotes;
          const scoreB = b.votes.upvotes - b.votes.downvotes;
          return scoreB - scoreA;
        case 'recent':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'controversial':
          const controversyA = Math.min(a.votes.upvotes, a.votes.downvotes);
          const controversyB = Math.min(b.votes.upvotes, b.votes.downvotes);
          return controversyB - controversyA;
        default:
          return 0;
      }
    });
  };

  const renderVoteButtons = (item: VotableItem) => {
    const score = item.votes.upvotes - item.votes.downvotes;
    const scoreColor = getScoreColor(item.votes.upvotes, item.votes.downvotes);
    
    return (
      <View style={styles.voteContainer}>
        <TouchableOpacity
          style={[
            styles.voteButton,
            {
              backgroundColor: item.votes.userVote === 'up' 
                ? theme.primaryContainer 
                : theme.Surface,
            }
          ]}
          onPress={() => handleVote(item.id, 'up')}
          accessibilityRole="button"
          accessibilityLabel={`Upvote ${item.type}`}
        >
          <Text
            style={[
              styles.voteIcon,
              {
                color: item.votes.userVote === 'up' 
                  ? theme.OnPrimaryContainer 
                  : theme.OnSurfaceVariant,
              }
            ]}
          >
            ▲
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.voteScore,
            { color: scoreColor, fontWeight: score !== 0 ? 'bold' : 'normal' }
          ]}
        >
          {score > 0 ? '+' : ''}{score}
        </Text>

        <TouchableOpacity
          style={[
            styles.voteButton,
            {
              backgroundColor: item.votes.userVote === 'down' 
                ? theme.errorContainer 
                : theme.Surface,
            }
          ]}
          onPress={() => handleVote(item.id, 'down')}
          accessibilityRole="button"
          accessibilityLabel={`Downvote ${item.type}`}
        >
          <Text
            style={[
              styles.voteIcon,
              {
                color: item.votes.userVote === 'down' 
                  ? theme.OnErrorContainer 
                  : theme.OnSurfaceVariant,
              }
            ]}
          >
            ▼
          </Text>
        </TouchableOpacity>
        
        {showVoteAnimation[item.id] && (
          <Animated.View style={styles.voteAnimation}>
            <Text style={styles.voteAnimationText}>
              {showVoteAnimation[item.id] === 'up' ? '+1' : '-1'}
            </Text>
          </Animated.View>
        )}
      </View>
    );
  };

  const renderItem = ({ item }: { item: VotableItem }) => (
    <View style={[styles.itemContainer, { backgroundColor: theme.Surface }]}>
      <View style={styles.itemHeader}>
        <View style={styles.authorInfo}>
          <Text style={[styles.authorName, { color: theme.OnSurface }]}>
            {item.authorName}
          </Text>
          <View
            style={[
              styles.authorLevel,
              { backgroundColor: getAuthorLevelColor(item.authorLevel) }
            ]}
          >
            <Text style={[styles.authorLevelText, { color: theme.OnPrimary }]}>
              {item.authorLevel}
            </Text>
          </View>
          <Text style={[styles.timestamp, { color: theme.OnSurfaceVariant }]}>
            {item.createdAt.toLocaleDateString()} {item.createdAt.toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.itemActions}>
          {item.isBestAnswer && (
            <View style={[styles.bestAnswerBadge, { backgroundColor: '#4CAF50' }]}>
              <Text style={[styles.bestAnswerText, { color: theme.OnPrimary }]}>
                ✓ Best Answer
              </Text>
            </View>
          )}
          
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: item.type === 'question' ? theme.primaryContainer :
                                item.type === 'answer' ? theme.secondaryContainer :
                                theme.SurfaceVariant,
              }
            ]}
          >
            <Text
              style={[
                styles.typeText,
                {
                  color: item.type === 'question' ? theme.OnPrimaryContainer :
                         item.type === 'answer' ? theme.OnSecondaryContainer :
                         theme.OnSurfaceVariant,
                }
              ]}
            >
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {item.title && (
        <Text style={[styles.itemTitle, { color: theme.OnSurface }]}>
          {item.title}
        </Text>
      )}

      <Text style={[styles.itemContent, { color: theme.OnSurface }]}>
        {item.content}
      </Text>

      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.map(tag => (
            <View key={tag} style={[styles.tag, { backgroundColor: theme.primaryContainer }]}>
              <Text style={[styles.tagText, { color: theme.OnPrimaryContainer }]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.itemFooter}>
        {renderVoteButtons(item)}

        <View style={styles.actionButtons}>
          {item.type === 'answer' && onMarkBestAnswer && !item.isBestAnswer && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.secondaryContainer }]}
              onPress={() => handleMarkBestAnswer(item.id)}
              accessibilityRole="button"
              accessibilityLabel="Mark as best answer"
            >
              <Text style={[styles.actionButtonText, { color: theme.OnSecondaryContainer }]}>
                ✓ Best Answer
              </Text>
            </TouchableOpacity>
          )}

          {allowReporting && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.errorContainer }]}
              onPress={() => {
                setSelectedItem(item);
                setReportModalVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Report content"
            >
              <Text style={[styles.actionButtonText, { color: theme.OnErrorContainer }]}>
                ⚠ Report
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {item.isModerated && (
        <View style={[styles.moderationBadge, { backgroundColor: theme.warningContainer }]}>
          <Text style={[styles.moderationText, { color: theme.OnWarningContainer }]}>
            🔍 Under Review
          </Text>
        </View>
      )}
    </View>
  );

  const renderFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: theme.Surface }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.OnSurfaceVariant }]}>
            Sort by:
          </Text>
          {['votes', 'recent', 'controversial'].map(sort => (
            <TouchableOpacity
              key={sort}
              style={[
                styles.filterButton,
                {
                  backgroundColor: sortBy === sort ? theme.primary : theme.Surface,
                }
              ]}
              onPress={() => setSortBy(sort as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: sortBy === sort ? theme.OnPrimary : theme.OnSurface,
                  }
                ]}
              >
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.OnSurfaceVariant }]}>
            Filter:
          </Text>
          {['all', 'question', 'answer', 'comment'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filterBy === filter ? theme.primary : theme.Surface,
                }
              ]}
              onPress={() => setFilterBy(filter as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: filterBy === filter ? theme.OnPrimary : theme.OnSurface,
                  }
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderReportModal = () => (
    <Modal
      visible={reportModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setReportModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.Outline }]}>
            <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
              Report Content
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setReportModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close report modal"
            >
              <Text style={[styles.closeButtonText, { color: theme.primary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={[styles.reportDescription, { color: theme.OnSurfaceVariant }]}>
              Help us maintain a safe and helpful learning environment. Please select the reason for reporting this content:
            </Text>

            {REPORT_REASONS.map(reason => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonButton,
                  {
                    backgroundColor: selectedReportReason === reason 
                      ? theme.primaryContainer 
                      : theme.Surface,
                    borderColor: selectedReportReason === reason 
                      ? theme.primary 
                      : theme.Outline,
                  }
                ]}
                onPress={() => setSelectedReportReason(reason)}
                accessibilityRole="button"
                accessibilityLabel={`Report for ${reason}`}
              >
                <Text
                  style={[
                    styles.reasonText,
                    {
                      color: selectedReportReason === reason 
                        ? theme.OnPrimaryContainer 
                        : theme.OnSurface,
                    }
                  ]}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.Surface }]}
              onPress={() => setReportModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: theme.OnSurface }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                {
                  backgroundColor: selectedReportReason ? theme.error : theme.Surface,
                }
              ]}
              onPress={handleReport}
              disabled={!selectedReportReason}
            >
              <Text
                style={[
                  styles.modalButtonText,
                  {
                    color: selectedReportReason ? theme.OnError : theme.OnSurfaceVariant,
                  }
                ]}
              >
                Submit Report
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.Outline }]}>
        <Text style={[styles.headerTitle, { color: theme.OnSurface }]}>
          Community Voting
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.OnSurfaceVariant }]}>
          {getSortedAndFilteredItems().length} items
        </Text>
      </View>

      {renderFilters()}

      <FlatList
        data={getSortedAndFilteredItems()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.itemsList}
        contentContainerStyle={styles.itemsContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.OnSurfaceVariant }]}>
              No items match your current filters
            </Text>
          </View>
        }
      />

      {renderReportModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  filtersContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersScroll: {
    paddingHorizontal: 16,
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
  itemsList: {
    flex: 1,
  },
  itemsContent: {
    padding: 16,
  },
  itemContainer: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  authorLevel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  authorLevelText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  bestAnswerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  bestAnswerText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
  },
  itemContent: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  voteButton: {
    width: 40,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  voteIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  voteScore: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 4,
    minWidth: 30,
    textAlign: 'center',
  },
  voteAnimation: {
    position: 'absolute',
    right: -20,
    top: '50%',
  },
  voteAnimationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moderationBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  moderationText: {
    fontSize: 12,
    fontWeight: 'bold',
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
  modalContent: {
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
  reportDescription: {
    fontSize: 16,
    lineHeight: 22,
    margin: 20,
    marginBottom: 16,
  },
  reasonButton: {
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  reasonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 12,
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