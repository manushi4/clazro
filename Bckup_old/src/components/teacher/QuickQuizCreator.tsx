/**
 * QuickQuizCreator - Quick quiz creation interface
 * Phase 19: Polling & Quiz Integration
 * Allows teachers to create quick quizzes during class
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  timeLimit?: number;
  showResultsImmediately: boolean;
}

interface QuickQuizCreatorProps {
  visible: boolean;
  onClose: () => void;
  onCreateQuiz: (quiz: Quiz) => void;
  isTeacherView?: boolean;
}

const QuickQuizCreator: React.FC<QuickQuizCreatorProps> = ({
  visible,
  onClose,
  onCreateQuiz,
  isTeacherView = false,
}) => {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<QuizQuestion>>({
    question: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1,
  });
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [timeLimit, setTimeLimit] = useState(300); // 5 minutes default
  const [showResultsImmediately, setShowResultsImmediately] = useState(true);

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
      maxWidth: 600,
      maxHeight: '95%',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.Outline,
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.OnSurface,
    },

    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.SurfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },

    scrollContent: {
      flexGrow: 1,
    },

    section: {
      marginBottom: 24,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.OnSurface,
      marginBottom: 12,
    },

    titleInput: {
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.OnSurface,
    },

    questionCard: {
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },

    questionInput: {
      backgroundColor: theme.Surface,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.OnSurface,
      textAlignVertical: 'top',
      minHeight: 60,
      marginBottom: 12,
    },

    typeSelector: {
      flexDirection: 'row',
      marginBottom: 16,
    },

    typeButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: theme.Surface,
      marginRight: 8,
      alignItems: 'center',
    },

    typeButtonActive: {
      backgroundColor: theme.primaryContainer,
    },

    typeButtonText: {
      fontSize: 12,
      color: theme.OnSurface,
      fontWeight: '500',
    },

    typeButtonTextActive: {
      color: theme.OnPrimaryContainer,
      fontWeight: '600',
    },

    optionsContainer: {
      marginBottom: 12,
    },

    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },

    correctIndicator: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },

    correctIndicatorActive: {
      backgroundColor: theme.primary,
    },

    optionInput: {
      flex: 1,
      backgroundColor: theme.Surface,
      borderRadius: 6,
      padding: 8,
      fontSize: 14,
      color: theme.OnSurface,
    },

    shortAnswerInput: {
      backgroundColor: theme.Surface,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.OnSurface,
      marginBottom: 12,
    },

    pointsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    pointsLabel: {
      fontSize: 14,
      color: theme.OnSurface,
    },

    pointsInput: {
      backgroundColor: theme.Surface,
      borderRadius: 6,
      padding: 8,
      width: 60,
      textAlign: 'center',
      fontSize: 14,
      color: theme.OnSurface,
    },

    questionActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },

    actionButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 4,
    },

    addButton: {
      backgroundColor: theme.primaryContainer,
    },

    cancelButton: {
      backgroundColor: theme.SurfaceVariant,
    },

    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },

    addButtonText: {
      color: theme.OnPrimaryContainer,
    },

    cancelButtonText: {
      color: theme.OnSurfaceVariant,
    },

    questionsContainer: {
      marginBottom: 16,
    },

    addQuestionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryContainer,
      borderRadius: 8,
      padding: 12,
      gap: 8,
    },

    addQuestionText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnPrimaryContainer,
    },

    existingQuestion: {
      backgroundColor: theme.Surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },

    existingQuestionText: {
      fontSize: 14,
      color: theme.OnSurface,
      marginBottom: 4,
    },

    existingQuestionMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    questionType: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      fontWeight: '500',
    },

    questionPoints: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '600',
    },

    deleteQuestionButton: {
      marginLeft: 8,
      padding: 4,
    },

    settingsContainer: {
      gap: 16,
    },

    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    settingLabel: {
      fontSize: 14,
      color: theme.OnSurface,
      flex: 1,
    },

    timeLimitContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    timeLimitInput: {
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 6,
      padding: 8,
      width: 80,
      textAlign: 'center',
      fontSize: 14,
      color: theme.OnSurface,
    },

    timeLimitUnit: {
      fontSize: 14,
      color: theme.OnSurface,
    },

    buttonsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },

    button: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },

    primaryButton: {
      backgroundColor: theme.primary,
    },

    secondaryButton: {
      backgroundColor: theme.SurfaceVariant,
    },

    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },

    primaryButtonText: {
      color: theme.OnPrimary,
    },

    secondaryButtonText: {
      color: theme.OnSurfaceVariant,
    },

    disabledButton: {
      opacity: 0.5,
    },

    helpText: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      fontStyle: 'italic',
      marginTop: 4,
    },
  });

  const styles = getStyles(theme);

  const resetCurrentQuestion = useCallback(() => {
    setCurrentQuestion({
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
    });
  }, []);

  const addQuestion = useCallback(() => {
    if (!currentQuestion.question?.trim()) {
      Alert.alert('Validation Error', 'Please enter a question.');
      return;
    }

    if (currentQuestion.type === 'multiple-choice') {
      const validOptions = currentQuestion.options?.filter(opt => opt.trim()) || [];
      if (validOptions.length < 2) {
        Alert.alert('Validation Error', 'Please provide at least 2 options for multiple choice questions.');
        return;
      }
      if (!currentQuestion.correctAnswer?.trim()) {
        Alert.alert('Validation Error', 'Please select the correct answer.');
        return;
      }
    } else if (!currentQuestion.correctAnswer?.trim()) {
      Alert.alert('Validation Error', 'Please enter the correct answer.');
      return;
    }

    const newQuestion: QuizQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: currentQuestion.question!.trim(),
      type: currentQuestion.type!,
      options: currentQuestion.type === 'multiple-choice' 
        ? currentQuestion.options?.filter(opt => opt.trim()).map(opt => opt.trim())
        : undefined,
      correctAnswer: currentQuestion.correctAnswer!.trim(),
      points: currentQuestion.points || 1,
    };

    setQuestions([...questions, newQuestion]);
    resetCurrentQuestion();
  }, [currentQuestion, questions, resetCurrentQuestion]);

  const removeQuestion = useCallback((index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  }, [questions]);

  const updateCurrentQuestionOption = useCallback((index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  }, [currentQuestion]);

  const setCorrectOption = useCallback((option: string) => {
    setCurrentQuestion({ ...currentQuestion, correctAnswer: option });
  }, [currentQuestion]);

  const validateQuiz = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a quiz title.');
      return false;
    }

    if (questions.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one question.');
      return false;
    }

    return true;
  }, [title, questions]);

  const handleCreateQuiz = useCallback(() => {
    if (!validateQuiz()) return;

    const quiz: Quiz = {
      id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      questions,
      timeLimit: hasTimeLimit ? timeLimit : undefined,
      showResultsImmediately,
    };

    onCreateQuiz(quiz);
    
    // Reset form
    setTitle('');
    setQuestions([]);
    resetCurrentQuestion();
    setHasTimeLimit(false);
    setTimeLimit(300);
    setShowResultsImmediately(true);
    
    onClose();
  }, [title, questions, hasTimeLimit, timeLimit, showResultsImmediately, validateQuiz, onCreateQuiz, resetCurrentQuestion, onClose]);

  if (!isTeacherView) {
    return null;
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🧠 Create Quick Quiz</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close quiz creator"
            >
              <Icon name="close" size={20} color={theme.OnSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Quiz Title */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quiz Title</Text>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter quiz title..."
                placeholderTextColor={theme.OnSurfaceVariant}
                maxLength={100}
              />
            </View>

            {/* Existing Questions */}
            {questions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Questions ({questions.length}) - {totalPoints} points total
                </Text>
                <View style={styles.questionsContainer}>
                  {questions.map((question, index) => (
                    <View key={question.id} style={styles.existingQuestion}>
                      <Text style={styles.existingQuestionText}>
                        {index + 1}. {question.question}
                      </Text>
                      <View style={styles.existingQuestionMeta}>
                        <Text style={styles.questionType}>
                          {question.type.replace('-', ' ')} • {question.points} point{question.points !== 1 ? 's' : ''}
                        </Text>
                        <TouchableOpacity
                          style={styles.deleteQuestionButton}
                          onPress={() => removeQuestion(index)}
                        >
                          <Icon name="delete" size={16} color={theme.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Add Question */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Question</Text>
              <View style={styles.questionCard}>
                <TextInput
                  style={styles.questionInput}
                  value={currentQuestion.question}
                  onChangeText={(text) => setCurrentQuestion({ ...currentQuestion, question: text })}
                  placeholder="Enter your question..."
                  placeholderTextColor={theme.OnSurfaceVariant}
                  multiline
                  maxLength={200}
                />

                {/* Question Type Selector */}
                <View style={styles.typeSelector}>
                  {(['multiple-choice', 'true-false', 'short-answer'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        currentQuestion.type === type && styles.typeButtonActive
                      ]}
                      onPress={() => setCurrentQuestion({ 
                        ...currentQuestion, 
                        type,
                        options: type === 'multiple-choice' ? ['', '', '', ''] : 
                                type === 'true-false' ? ['True', 'False'] : undefined,
                        correctAnswer: ''
                      })}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        currentQuestion.type === type && styles.typeButtonTextActive
                      ]}>
                        {type.replace('-', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Options for Multiple Choice */}
                {currentQuestion.type === 'multiple-choice' && (
                  <View style={styles.optionsContainer}>
                    {(currentQuestion.options || []).map((option, index) => (
                      <View key={index} style={styles.optionRow}>
                        <TouchableOpacity
                          style={[
                            styles.correctIndicator,
                            currentQuestion.correctAnswer === option && styles.correctIndicatorActive
                          ]}
                          onPress={() => setCorrectOption(option)}
                        >
                          {currentQuestion.correctAnswer === option && (
                            <Icon name="check" size={12} color={theme.OnPrimary} />
                          )}
                        </TouchableOpacity>
                        <TextInput
                          style={styles.optionInput}
                          value={option}
                          onChangeText={(value) => updateCurrentQuestionOption(index, value)}
                          placeholder={`Option ${index + 1}`}
                          placeholderTextColor={theme.OnSurfaceVariant}
                          maxLength={100}
                        />
                      </View>
                    ))}
                  </View>
                )}

                {/* True/False Selection */}
                {currentQuestion.type === 'true-false' && (
                  <View style={styles.optionsContainer}>
                    {['True', 'False'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.optionRow,
                          { paddingVertical: 8 }
                        ]}
                        onPress={() => setCorrectOption(option)}
                      >
                        <View style={[
                          styles.correctIndicator,
                          currentQuestion.correctAnswer === option && styles.correctIndicatorActive
                        ]}>
                          {currentQuestion.correctAnswer === option && (
                            <Icon name="check" size={12} color={theme.OnPrimary} />
                          )}
                        </View>
                        <Text style={styles.typeButtonText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Short Answer */}
                {currentQuestion.type === 'short-answer' && (
                  <TextInput
                    style={styles.shortAnswerInput}
                    value={currentQuestion.correctAnswer}
                    onChangeText={(text) => setCurrentQuestion({ ...currentQuestion, correctAnswer: text })}
                    placeholder="Enter the correct answer..."
                    placeholderTextColor={theme.OnSurfaceVariant}
                    maxLength={100}
                  />
                )}

                {/* Points */}
                <View style={styles.pointsContainer}>
                  <Text style={styles.pointsLabel}>Points:</Text>
                  <TextInput
                    style={styles.pointsInput}
                    value={currentQuestion.points?.toString() || '1'}
                    onChangeText={(text) => {
                      const points = parseInt(text) || 1;
                      if (points >= 1 && points <= 10) {
                        setCurrentQuestion({ ...currentQuestion, points });
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>

                {/* Question Actions */}
                <View style={styles.questionActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={resetCurrentQuestion}
                  >
                    <Icon name="clear" size={14} color={theme.OnSurfaceVariant} />
                    <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Clear</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.addButton]}
                    onPress={addQuestion}
                  >
                    <Icon name="add" size={14} color={theme.OnPrimaryContainer} />
                    <Text style={[styles.actionButtonText, styles.addButtonText]}>Add Question</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Quiz Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quiz Settings</Text>
              <View style={styles.settingsContainer}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Set time limit</Text>
                  <Switch
                    value={hasTimeLimit}
                    onValueChange={setHasTimeLimit}
                    trackColor={{ 
                      false: theme.Outline, 
                      true: theme.primaryContainer 
                    }}
                    thumbColor={hasTimeLimit ? theme.primary : theme.OnSurface}
                  />
                </View>

                {hasTimeLimit && (
                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Time limit</Text>
                    <View style={styles.timeLimitContainer}>
                      <TextInput
                        style={styles.timeLimitInput}
                        value={Math.floor(timeLimit / 60).toString()}
                        onChangeText={(value) => {
                          const minutes = parseInt(value) || 0;
                          if (minutes >= 1 && minutes <= 60) {
                            setTimeLimit(minutes * 60);
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                      <Text style={styles.timeLimitUnit}>minutes</Text>
                    </View>
                  </View>
                )}

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Show results immediately</Text>
                  <Switch
                    value={showResultsImmediately}
                    onValueChange={setShowResultsImmediately}
                    trackColor={{ 
                      false: theme.Outline, 
                      true: theme.primaryContainer 
                    }}
                    thumbColor={showResultsImmediately ? theme.primary : theme.OnSurface}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}
            >
              <Icon name="cancel" size={20} color={theme.OnSurfaceVariant} />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button, 
                styles.primaryButton,
                (!title.trim() || questions.length === 0) && styles.disabledButton
              ]}
              onPress={handleCreateQuiz}
              disabled={!title.trim() || questions.length === 0}
            >
              <Icon name="quiz" size={20} color={theme.OnPrimary} />
              <Text style={[styles.buttonText, styles.primaryButtonText]}>Create Quiz</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default QuickQuizCreator;