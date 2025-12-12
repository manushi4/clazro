/**
 * PollManager - Unified polls and quizzes management
 * Phase 19: Polling & Quiz Integration
 * Manages active polls/quizzes with real-time updates and controls
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { PollQuestion } from './LivePollCreator';
import { Quiz, QuizQuestion } from './QuickQuizCreator';
import { PollResults } from './PollResults';
import { QuizResults, QuizResponse } from './QuizResults';

export interface ActivePoll {
  id: string;
  question: PollQuestion;
  responses: { studentId: string; studentName: string; selectedOptions: string[]; timestamp: Date }[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
}

export interface ActiveQuiz {
  id: string;
  quiz: Quiz;
  responses: QuizResponse[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
}

interface PollManagerProps {
  activePolls: ActivePoll[];
  activeQuizzes: ActiveQuiz[];
  onEndPoll: (pollId: string) => void;
  onEndQuiz: (quizId: string) => void;
  onSharePollResults: (pollId: string) => void;
  onExportQuizResults: (quizId: string) => void;
  isTeacherView?: boolean;
}

type ViewMode = 'polls' | 'quizzes';
type ItemType = 'poll' | 'quiz';

const PollManager: React.FC<PollManagerProps> = ({
  activePolls,
  activeQuizzes,
  onEndPoll,
  onEndQuiz,
  onSharePollResults,
  onExportQuizResults,
  isTeacherView = false,
}) => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('polls');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.OnSurface,
    },

    viewTabs: {
      flexDirection: 'row',
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
      padding: 4,
      marginBottom: 16,
    },

    viewTab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },

    activeTab: {
      backgroundColor: theme.primary,
    },

    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.OnSurfaceVariant,
    },

    activeTabText: {
      color: theme.OnPrimary,
      fontWeight: '600',
    },

    itemsList: {
      gap: 12,
    },

    itemCard: {
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },

    itemHeader: {
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    itemHeaderLeft: {
      flex: 1,
      marginRight: 12,
    },

    itemTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnSurface,
      marginBottom: 4,
    },

    itemSubtitle: {
      fontSize: 13,
      color: theme.OnSurfaceVariant,
      lineHeight: 18,
    },

    itemMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 6,
    },

    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    metaText: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
      fontWeight: '500',
    },

    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme.primaryContainer,
    },

    inactiveBadge: {
      backgroundColor: theme.Outline,
    },

    statusText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.OnPrimaryContainer,
    },

    inactiveStatusText: {
      color: theme.OnSurface,
    },

    expandButton: {
      padding: 8,
    },

    itemContent: {
      borderTopWidth: 1,
      borderTopColor: theme.Outline,
      backgroundColor: theme.Surface,
    },

    itemActions: {
      flexDirection: 'row',
      padding: 12,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: theme.Outline,
    },

    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      gap: 4,
    },

    primaryAction: {
      backgroundColor: theme.primaryContainer,
    },

    secondaryAction: {
      backgroundColor: theme.SurfaceVariant,
    },

    dangerAction: {
      backgroundColor: theme.errorContainer,
    },

    actionText: {
      fontSize: 12,
      fontWeight: '600',
    },

    primaryActionText: {
      color: theme.OnPrimaryContainer,
    },

    secondaryActionText: {
      color: theme.OnSurfaceVariant,
    },

    dangerActionText: {
      color: theme.OnErrorContainer,
    },

    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },

    emptyIcon: {
      color: theme.OnSurfaceVariant,
      marginBottom: 8,
    },

    emptyText: {
      fontSize: 14,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
    },

    emptySubtext: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
      marginTop: 4,
      opacity: 0.8,
    },

    disabledContainer: {
      opacity: 0.6,
    },

    disabledMessage: {
      textAlign: 'center',
      color: theme.OnSurfaceVariant,
      fontSize: 14,
      fontStyle: 'italic',
      padding: 16,
    },
  });

  const styles = getStyles(theme);

  const toggleItemExpansion = useCallback((id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const calculateTimeElapsed = useCallback((startTime: Date): string => {
    const elapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [currentTime]);

  const calculateTimeRemaining = useCallback((quiz: Quiz, startTime: Date): number | undefined => {
    if (!quiz.timeLimit) return undefined;
    const elapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
    const remaining = quiz.timeLimit - elapsed;
    return Math.max(0, remaining);
  }, [currentTime]);

  const formatTimeRemaining = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const handleEndPoll = useCallback((pollId: string) => {
    Alert.alert(
      'End Poll',
      'Are you sure you want to end this poll? Students will no longer be able to vote.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Poll', 
          style: 'destructive', 
          onPress: () => onEndPoll(pollId) 
        },
      ]
    );
  }, [onEndPoll]);

  const handleEndQuiz = useCallback((quizId: string) => {
    Alert.alert(
      'End Quiz',
      'Are you sure you want to end this quiz? Students will no longer be able to submit answers.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Quiz', 
          style: 'destructive', 
          onPress: () => onEndQuiz(quizId) 
        },
      ]
    );
  }, [onEndQuiz]);

  const renderPollItem = (poll: ActivePoll) => {
    const isExpanded = expandedItems.has(poll.id);
    const timeElapsed = calculateTimeElapsed(poll.startTime);
    const timeRemaining = poll.question.timeLimit ? 
      Math.max(0, poll.question.timeLimit - Math.floor((currentTime.getTime() - poll.startTime.getTime()) / 1000)) : 
      undefined;

    // Calculate results for display
    const results = poll.question.options.map(option => {
      const count = poll.responses.filter(r => r.selectedOptions.includes(option)).length;
      const percentage = poll.responses.length > 0 ? (count / poll.responses.length) * 100 : 0;
      return { option, count, percentage };
    });

    return (
      <View key={poll.id} style={styles.itemCard}>
        <TouchableOpacity 
          style={styles.itemHeader}
          onPress={() => toggleItemExpansion(poll.id)}
        >
          <View style={styles.itemHeaderLeft}>
            <Text style={styles.itemTitle}>📊 {poll.question.question}</Text>
            <Text style={styles.itemSubtitle}>
              {poll.question.options.length} options • {poll.question.allowMultiple ? 'Multiple choice' : 'Single choice'}
            </Text>
            <View style={styles.itemMeta}>
              <View style={styles.metaItem}>
                <Icon name="timer" size={12} color={theme.OnSurfaceVariant} />
                <Text style={styles.metaText}>{timeElapsed}</Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="group" size={12} color={theme.OnSurfaceVariant} />
                <Text style={styles.metaText}>{poll.responses.length} responses</Text>
              </View>
              {timeRemaining !== undefined && timeRemaining > 0 && (
                <View style={styles.metaItem}>
                  <Icon name="hourglass-empty" size={12} color={theme.OnSurfaceVariant} />
                  <Text style={styles.metaText}>{formatTimeRemaining(timeRemaining)} left</Text>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, !poll.isActive && styles.inactiveBadge]}>
            <Text style={[styles.statusText, !poll.isActive && styles.inactiveStatusText]}>
              {poll.isActive ? 'LIVE' : 'ENDED'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => toggleItemExpansion(poll.id)}
          >
            <Icon 
              name={isExpanded ? 'expand-less' : 'expand-more'} 
              size={20} 
              color={theme.OnSurfaceVariant} 
            />
          </TouchableOpacity>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.itemContent}>
            <PollResults
              question={poll.question.question}
              results={results}
              totalResponses={poll.responses.length}
              isActive={poll.isActive}
              timeRemaining={timeRemaining}
              allowMultiple={poll.question.allowMultiple}
            />
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryAction]}
                onPress={() => onSharePollResults(poll.id)}
              >
                <Icon name="share" size={14} color={theme.OnSurfaceVariant} />
                <Text style={[styles.actionText, styles.secondaryActionText]}>Share</Text>
              </TouchableOpacity>
              
              {poll.isActive && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.dangerAction]}
                  onPress={() => handleEndPoll(poll.id)}
                >
                  <Icon name="stop" size={14} color={theme.OnErrorContainer} />
                  <Text style={[styles.actionText, styles.dangerActionText]}>End Poll</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderQuizItem = (quiz: ActiveQuiz) => {
    const isExpanded = expandedItems.has(quiz.id);
    const timeElapsed = calculateTimeElapsed(quiz.startTime);
    const timeRemaining = calculateTimeRemaining(quiz.quiz, quiz.startTime);
    const totalPoints = quiz.quiz.questions.reduce((sum, q) => sum + q.points, 0);

    return (
      <View key={quiz.id} style={styles.itemCard}>
        <TouchableOpacity 
          style={styles.itemHeader}
          onPress={() => toggleItemExpansion(quiz.id)}
        >
          <View style={styles.itemHeaderLeft}>
            <Text style={styles.itemTitle}>🧠 {quiz.quiz.title}</Text>
            <Text style={styles.itemSubtitle}>
              {quiz.quiz.questions.length} questions • {totalPoints} points total
            </Text>
            <View style={styles.itemMeta}>
              <View style={styles.metaItem}>
                <Icon name="timer" size={12} color={theme.OnSurfaceVariant} />
                <Text style={styles.metaText}>{timeElapsed}</Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="group" size={12} color={theme.OnSurfaceVariant} />
                <Text style={styles.metaText}>{quiz.responses.length} responses</Text>
              </View>
              {timeRemaining !== undefined && timeRemaining > 0 && (
                <View style={styles.metaItem}>
                  <Icon name="hourglass-empty" size={12} color={theme.OnSurfaceVariant} />
                  <Text style={styles.metaText}>{formatTimeRemaining(timeRemaining)} left</Text>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, !quiz.isActive && styles.inactiveBadge]}>
            <Text style={[styles.statusText, !quiz.isActive && styles.inactiveStatusText]}>
              {quiz.isActive ? 'ACTIVE' : 'ENDED'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => toggleItemExpansion(quiz.id)}
          >
            <Icon 
              name={isExpanded ? 'expand-less' : 'expand-more'} 
              size={20} 
              color={theme.OnSurfaceVariant} 
            />
          </TouchableOpacity>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.itemContent}>
            <QuizResults
              quizTitle={quiz.quiz.title}
              questions={quiz.quiz.questions}
              responses={quiz.responses}
              isActive={quiz.isActive}
              timeRemaining={timeRemaining}
            />
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryAction]}
                onPress={() => onExportQuizResults(quiz.id)}
              >
                <Icon name="file-download" size={14} color={theme.OnSurfaceVariant} />
                <Text style={[styles.actionText, styles.secondaryActionText]}>Export</Text>
              </TouchableOpacity>
              
              {quiz.isActive && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.dangerAction]}
                  onPress={() => handleEndQuiz(quiz.id)}
                >
                  <Icon name="stop" size={14} color={theme.OnErrorContainer} />
                  <Text style={[styles.actionText, styles.dangerActionText]}>End Quiz</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = (type: 'polls' | 'quizzes') => (
    <View style={styles.emptyState}>
      <Icon 
        name={type === 'polls' ? 'poll' : 'quiz'} 
        size={48} 
        style={styles.emptyIcon} 
      />
      <Text style={styles.emptyText}>
        No active {type} at the moment
      </Text>
      <Text style={styles.emptySubtext}>
        {type === 'polls' 
          ? 'Create a poll to engage with your students' 
          : 'Create a quiz to test student knowledge'
        }
      </Text>
    </View>
  );

  if (!isTeacherView) {
    return (
      <View style={[styles.container, styles.disabledContainer]}>
        <Text style={styles.disabledMessage}>
          Poll and quiz management is only available for teachers
        </Text>
      </View>
    );
  }

  const activeCount = viewMode === 'polls' 
    ? activePolls.filter(p => p.isActive).length
    : activeQuizzes.filter(q => q.isActive).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Polls & Quizzes</Text>
      </View>

      {/* View Tabs */}
      <View style={styles.viewTabs}>
        <TouchableOpacity
          style={[styles.viewTab, viewMode === 'polls' && styles.activeTab]}
          onPress={() => setViewMode('polls')}
        >
          <Icon 
            name="poll" 
            size={16} 
            color={viewMode === 'polls' ? theme.OnPrimary : theme.OnSurfaceVariant} 
          />
          <Text style={[
            styles.tabText,
            viewMode === 'polls' && styles.activeTabText
          ]}>
            Polls ({activePolls.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewTab, viewMode === 'quizzes' && styles.activeTab]}
          onPress={() => setViewMode('quizzes')}
        >
          <Icon 
            name="quiz" 
            size={16} 
            color={viewMode === 'quizzes' ? theme.OnPrimary : theme.OnSurfaceVariant} 
          />
          <Text style={[
            styles.tabText,
            viewMode === 'quizzes' && styles.activeTabText
          ]}>
            Quizzes ({activeQuizzes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.itemsList}>
          {viewMode === 'polls' ? (
            activePolls.length > 0 ? (
              activePolls.map(renderPollItem)
            ) : (
              renderEmptyState('polls')
            )
          ) : (
            activeQuizzes.length > 0 ? (
              activeQuizzes.map(renderQuizItem)
            ) : (
              renderEmptyState('quizzes')
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default PollManager;