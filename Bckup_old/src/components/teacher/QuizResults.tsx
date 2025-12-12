/**
 * QuizResults - Quiz results display and analysis
 * Phase 19: Polling & Quiz Integration
 * Shows detailed quiz results with student performance analytics
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { QuizQuestion } from './QuickQuizCreator';

export interface QuizResponse {
  studentId: string;
  studentName: string;
  answers: { questionId: string; answer: string; isCorrect: boolean; points: number }[];
  totalScore: number;
  totalPossible: number;
  completedAt: Date;
  timeSpent: number; // in seconds
}

export interface QuizResultsProps {
  quizTitle: string;
  questions: QuizQuestion[];
  responses: QuizResponse[];
  isActive: boolean;
  timeRemaining?: number;
  visible?: boolean;
  onClose?: () => void;
  onEndQuiz?: () => void;
  onExportResults?: () => void;
}

type ViewMode = 'overview' | 'questions' | 'students';

const QuizResults: React.FC<QuizResultsProps> = ({
  quizTitle,
  questions,
  responses,
  isActive,
  timeRemaining,
  visible = false,
  onClose,
  onEndQuiz,
  onExportResults,
}) => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  const getStyles = (theme: any) => StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    modalContainer: {
      backgroundColor: theme.Surface,
      borderRadius: 16,
      padding: 24,
      width: '95%',
      maxWidth: 700,
      maxHeight: '95%',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },

    // Inline results styles (when not in modal)
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
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },

    headerLeft: {
      flex: 1,
      marginRight: 16,
    },

    quizTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.OnSurface,
      marginBottom: 8,
    },

    quizInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
    },

    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    infoText: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      fontWeight: '500',
    },

    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: isActive ? theme.primaryContainer : theme.SurfaceVariant,
    },

    statusText: {
      fontSize: 11,
      fontWeight: '600',
      color: isActive ? theme.OnPrimaryContainer : theme.OnSurfaceVariant,
    },

    timerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.errorContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },

    timerText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.OnErrorContainer,
      marginLeft: 4,
    },

    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.SurfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },

    viewTabs: {
      flexDirection: 'row',
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
      padding: 4,
      marginBottom: 20,
    },

    viewTab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
    },

    activeTab: {
      backgroundColor: theme.primary,
    },

    tabText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.OnSurfaceVariant,
    },

    activeTabText: {
      color: theme.OnPrimary,
      fontWeight: '600',
    },

    // Overview styles
    overviewContainer: {
      gap: 16,
    },

    statsGrid: {
      flexDirection: 'row',
      gap: 12,
    },

    statCard: {
      flex: 1,
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },

    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.OnSurface,
      marginBottom: 4,
    },

    statLabel: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
    },

    performanceChart: {
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
      padding: 16,
    },

    chartTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnSurface,
      marginBottom: 12,
    },

    gradeDistribution: {
      gap: 8,
    },

    gradeBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    gradeLabel: {
      fontSize: 12,
      color: theme.OnSurface,
      width: 40,
    },

    gradeBarContainer: {
      flex: 1,
      height: 20,
      backgroundColor: theme.Surface,
      borderRadius: 10,
      overflow: 'hidden',
    },

    gradeBarFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 10,
    },

    gradeCount: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      minWidth: 20,
      textAlign: 'right',
    },

    // Questions view styles
    questionSelector: {
      flexDirection: 'row',
      marginBottom: 16,
      gap: 8,
    },

    questionTab: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: theme.SurfaceVariant,
      minWidth: 40,
      alignItems: 'center',
    },

    activeQuestionTab: {
      backgroundColor: theme.primaryContainer,
    },

    questionTabText: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      fontWeight: '500',
    },

    activeQuestionTabText: {
      color: theme.OnPrimaryContainer,
      fontWeight: '600',
    },

    questionAnalysis: {
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
      padding: 16,
    },

    questionText: {
      fontSize: 14,
      color: theme.OnSurface,
      marginBottom: 12,
      fontWeight: '500',
    },

    answerOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.Outline,
    },

    answerText: {
      fontSize: 13,
      color: theme.OnSurface,
      flex: 1,
    },

    correctAnswer: {
      fontWeight: '600',
      color: theme.primary,
    },

    answerStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    answerCount: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      minWidth: 30,
      textAlign: 'right',
    },

    answerPercentage: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
      minWidth: 40,
      textAlign: 'right',
    },

    // Students view styles
    studentsList: {
      flex: 1,
    },

    studentItem: {
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },

    studentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },

    studentName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnSurface,
    },

    studentScore: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.primary,
    },

    studentStats: {
      flexDirection: 'row',
      gap: 16,
    },

    studentStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    studentStatText: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
    },

    // Actions
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },

    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 6,
    },

    primaryButton: {
      backgroundColor: theme.primary,
    },

    secondaryButton: {
      backgroundColor: theme.SurfaceVariant,
    },

    dangerButton: {
      backgroundColor: theme.errorContainer,
    },

    buttonText: {
      fontSize: 14,
      fontWeight: '600',
    },

    primaryButtonText: {
      color: theme.OnPrimary,
    },

    secondaryButtonText: {
      color: theme.OnSurfaceVariant,
    },

    dangerButtonText: {
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
  });

  const styles = getStyles(theme);

  // Calculate statistics
  const totalPossibleScore = questions.reduce((sum, q) => sum + q.points, 0);
  const averageScore = responses.length > 0 
    ? responses.reduce((sum, r) => sum + r.totalScore, 0) / responses.length 
    : 0;
  const averagePercentage = totalPossibleScore > 0 ? (averageScore / totalPossibleScore) * 100 : 0;
  const completionRate = responses.length;

  // Grade distribution
  const getGradeDistribution = () => {
    const grades = { 'A (90-100%)': 0, 'B (80-89%)': 0, 'C (70-79%)': 0, 'D (60-69%)': 0, 'F (<60%)': 0 };
    responses.forEach(response => {
      const percentage = totalPossibleScore > 0 ? (response.totalScore / response.totalPossible) * 100 : 0;
      if (percentage >= 90) grades['A (90-100%)']++;
      else if (percentage >= 80) grades['B (80-89%)']++;
      else if (percentage >= 70) grades['C (70-79%)']++;
      else if (percentage >= 60) grades['D (60-69%)']++;
      else grades['F (<60%)']++;
    });
    return grades;
  };

  const gradeDistribution = getGradeDistribution();

  // Question analysis
  const getQuestionAnalysis = (questionIndex: number) => {
    const question = questions[questionIndex];
    const answerCounts: { [key: string]: number } = {};
    let totalAnswers = 0;

    responses.forEach(response => {
      const answer = response.answers.find(a => a.questionId === question.id);
      if (answer) {
        answerCounts[answer.answer] = (answerCounts[answer.answer] || 0) + 1;
        totalAnswers++;
      }
    });

    return { answerCounts, totalAnswers };
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      {/* Statistics */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{responses.length}</Text>
          <Text style={styles.statLabel}>Responses</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{averagePercentage.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Average Score</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{questions.length}</Text>
          <Text style={styles.statLabel}>Questions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalPossibleScore}</Text>
          <Text style={styles.statLabel}>Total Points</Text>
        </View>
      </View>

      {/* Grade Distribution */}
      {responses.length > 0 && (
        <View style={styles.performanceChart}>
          <Text style={styles.chartTitle}>Grade Distribution</Text>
          <View style={styles.gradeDistribution}>
            {Object.entries(gradeDistribution).map(([grade, count]) => (
              <View key={grade} style={styles.gradeBar}>
                <Text style={styles.gradeLabel}>{grade.charAt(0)}</Text>
                <View style={styles.gradeBarContainer}>
                  <View 
                    style={[
                      styles.gradeBarFill, 
                      { 
                        width: responses.length > 0 ? `${(count / responses.length) * 100}%` : '0%' 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.gradeCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderQuestions = () => {
    if (questions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="quiz" size={48} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No questions available</Text>
        </View>
      );
    }

    const { answerCounts, totalAnswers } = getQuestionAnalysis(selectedQuestionIndex);
    const currentQuestion = questions[selectedQuestionIndex];

    return (
      <View>
        {/* Question Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.questionSelector}
        >
          {questions.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.questionTab,
                selectedQuestionIndex === index && styles.activeQuestionTab
              ]}
              onPress={() => setSelectedQuestionIndex(index)}
            >
              <Text style={[
                styles.questionTabText,
                selectedQuestionIndex === index && styles.activeQuestionTabText
              ]}>
                {index + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Question Analysis */}
        <View style={styles.questionAnalysis}>
          <Text style={styles.questionText}>
            {selectedQuestionIndex + 1}. {currentQuestion.question}
          </Text>
          
          {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
            <>
              {currentQuestion.options.map((option, index) => {
                const count = answerCounts[option] || 0;
                const percentage = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;
                const isCorrect = option === currentQuestion.correctAnswer;
                
                return (
                  <View key={index} style={styles.answerOption}>
                    <Text style={[
                      styles.answerText,
                      isCorrect && styles.correctAnswer
                    ]}>
                      {option} {isCorrect && '✓'}
                    </Text>
                    <View style={styles.answerStats}>
                      <Text style={styles.answerCount}>{count}</Text>
                      <Text style={styles.answerPercentage}>{percentage.toFixed(1)}%</Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
          
          {(currentQuestion.type === 'true-false' || currentQuestion.type === 'short-answer') && (
            <View style={styles.answerOption}>
              <Text style={[styles.answerText, styles.correctAnswer]}>
                Correct Answer: {currentQuestion.correctAnswer}
              </Text>
              <View style={styles.answerStats}>
                <Text style={styles.answerCount}>
                  {Object.values(answerCounts).reduce((sum, count) => sum + count, 0)} responses
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderStudents = () => {
    if (responses.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="people" size={48} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>
            No responses yet.{'\n'}Results will appear as students complete the quiz.
          </Text>
        </View>
      );
    }

    const sortedResponses = [...responses].sort((a, b) => b.totalScore - a.totalScore);

    return (
      <FlatList
        data={sortedResponses}
        keyExtractor={(item) => item.studentId}
        renderItem={({ item, index }) => {
          const percentage = item.totalPossible > 0 ? (item.totalScore / item.totalPossible) * 100 : 0;
          const correctAnswers = item.answers.filter(a => a.isCorrect).length;
          
          return (
            <View style={styles.studentItem}>
              <View style={styles.studentHeader}>
                <Text style={styles.studentName}>
                  #{index + 1} {item.studentName}
                </Text>
                <Text style={styles.studentScore}>
                  {item.totalScore}/{item.totalPossible} ({percentage.toFixed(1)}%)
                </Text>
              </View>
              <View style={styles.studentStats}>
                <View style={styles.studentStat}>
                  <Icon name="check-circle" size={12} color={theme.OnSurfaceVariant} />
                  <Text style={styles.studentStatText}>
                    {correctAnswers}/{questions.length} correct
                  </Text>
                </View>
                <View style={styles.studentStat}>
                  <Icon name="timer" size={12} color={theme.OnSurfaceVariant} />
                  <Text style={styles.studentStatText}>
                    {formatTime(item.timeSpent)}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        style={styles.studentsList}
      />
    );
  };

  const renderContent = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.quizTitle}>🧠 {quizTitle}</Text>
          <View style={styles.quizInfo}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {isActive ? 'ACTIVE' : 'COMPLETED'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="quiz" size={14} color={theme.OnSurfaceVariant} />
              <Text style={styles.infoText}>{questions.length} questions</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="group" size={14} color={theme.OnSurfaceVariant} />
              <Text style={styles.infoText}>{responses.length} responses</Text>
            </View>
            
            {isActive && timeRemaining && timeRemaining > 0 && (
              <View style={styles.timerContainer}>
                <Icon name="timer" size={12} color={theme.OnErrorContainer} />
                <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
              </View>
            )}
          </View>
        </View>
        
        {visible && onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close results"
          >
            <Icon name="close" size={16} color={theme.OnSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* View Tabs */}
      <View style={styles.viewTabs}>
        {(['overview', 'questions', 'students'] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.viewTab,
              viewMode === mode && styles.activeTab
            ]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[
              styles.tabText,
              viewMode === mode && styles.activeTabText
            ]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'questions' && renderQuestions()}
        {viewMode === 'students' && renderStudents()}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {onExportResults && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={onExportResults}
            accessibilityLabel="Export quiz results"
          >
            <Icon name="file-download" size={16} color={theme.OnSurfaceVariant} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Export</Text>
          </TouchableOpacity>
        )}
        
        {isActive && onEndQuiz && (
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={onEndQuiz}
            accessibilityLabel="End quiz"
          >
            <Icon name="stop" size={16} color={theme.OnErrorContainer} />
            <Text style={[styles.buttonText, styles.dangerButtonText]}>End Quiz</Text>
          </TouchableOpacity>
        )}
        
        {!isActive && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={onClose}
            accessibilityLabel="Close results"
          >
            <Icon name="check" size={16} color={theme.OnPrimary} />
            <Text style={[styles.buttonText, styles.primaryButtonText]}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  if (visible) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {renderContent()}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

export default QuizResults;