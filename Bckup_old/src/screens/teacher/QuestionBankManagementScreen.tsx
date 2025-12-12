import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  BackHandler,
} from 'react-native';
import { Appbar, Portal, Snackbar } from 'react-native-paper';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeOut, SlideInUp, SlideInDown, ZoomIn, BounceIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';

import {useTheme} from '../../context/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import * as QuestionBankService from '../../services/questionBankService';

const {width} = Dimensions.get('window');

interface Question {
  id: string;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false' | 'fill_blank';
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  usageCount: number;
  rating: number;
  points: number;
  timeLimit?: number;
}

interface QuestionBank {
  id: string;
  name: string;
  description: string;
  subject: string;
  questionCount: number;
  createdBy: string;
  isPublic: boolean;
  tags: string[];
}

interface FilterOptions {
  subject: string;
  difficulty: string;
  type: string;
  topic: string;
  tags: string[];
}

const QuestionBankManagementScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {theme} = useTheme();
  const {user} = useAuth();

  // Loading and notification states
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [activeTab, setActiveTab] = useState<'browse' | 'my_questions' | 'create' | 'import'>('browse');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    subject: 'all',
    difficulty: 'all',
    type: 'all',
    topic: 'all',
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: 'multiple_choice',
    subject: 'Mathematics',
    difficulty: 'medium',
    points: 5,
    options: ['', '', '', ''],
    tags: [],
  });

  // Lifecycle functions
  const initializeScreen = useCallback(async () => {
    try {
      setIsLoading(true);
      await loadQuestionBankData();
      setIsLoading(false);
    } catch (error) {
      showSnackbar('Failed to load question bank data');
      setIsLoading(false);
    }
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedQuestions.length > 0) {
        Alert.alert(
          'Discard Selection',
          `You have ${selectedQuestions.length} questions selected. Are you sure you want to go back?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => navigation.goBack(),
            },
          ]
        );
        return true;
      }
      return false;
    });
    return backHandler;
  }, [selectedQuestions.length, navigation]);

  const cleanup = useCallback(() => {
    // Cleanup function for component unmount
  }, []);

  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  // Initialize screen on mount
  useEffect(() => {
    initializeScreen();
    const backHandler = setupBackHandler();
    return () => {
      backHandler.remove();
      cleanup();
    };
  }, [initializeScreen, setupBackHandler, cleanup]);

  useEffect(() => {
    if (!isLoading) {
      loadQuestionBankData();
    }
  }, [filters, searchQuery]);

  const loadQuestionBankData = async () => {
    setLoading(true);
    
    // Mock data - replace with actual API calls
    setTimeout(() => {
      setQuestions([
        {
          id: '1',
          question: 'What is the derivative of x�?',
          type: 'multiple_choice',
          subject: 'Mathematics',
          difficulty: 'medium',
          topic: 'Calculus',
          options: ['2x', 'x�', '2x�', 'x'],
          correctAnswer: 0,
          explanation: 'Using the power rule: d/dx(x�) = 2x� = 2x',
          tags: ['derivatives', 'calculus', 'power-rule'],
          createdBy: 'Dr. Smith',
          createdAt: '2024-12-15',
          usageCount: 45,
          rating: 4.8,
          points: 5,
          timeLimit: 120,
        },
        {
          id: '2',
          question: 'Explain the concept of photosynthesis and its significance in the ecosystem.',
          type: 'essay',
          subject: 'Biology',
          difficulty: 'hard',
          topic: 'Plant Biology',
          explanation: 'Should cover light-dependent and light-independent reactions, importance to food chain, oxygen production.',
          tags: ['photosynthesis', 'plants', 'ecosystem'],
          createdBy: 'Prof. Johnson',
          createdAt: '2024-12-14',
          usageCount: 23,
          rating: 4.6,
          points: 15,
          timeLimit: 1800,
        },
        {
          id: '3',
          question: 'The mitochondria is known as the _____ of the cell.',
          type: 'fill_blank',
          subject: 'Biology',
          difficulty: 'easy',
          topic: 'Cell Biology',
          correctAnswer: 'powerhouse',
          tags: ['cell-biology', 'organelles'],
          createdBy: 'Ms. Davis',
          createdAt: '2024-12-13',
          usageCount: 67,
          rating: 4.9,
          points: 3,
          timeLimit: 60,
        },
      ]);

      setQuestionBanks([
        {
          id: '1',
          name: 'JEE Mathematics Question Bank',
          description: 'Comprehensive collection of JEE-level mathematics questions',
          subject: 'Mathematics',
          questionCount: 1250,
          createdBy: 'Dr. Sharma',
          isPublic: true,
          tags: ['jee', 'mathematics', 'competitive'],
        },
        {
          id: '2',
          name: 'NEET Biology Essentials',
          description: 'Essential biology questions for NEET preparation',
          subject: 'Biology',
          questionCount: 890,
          createdBy: 'Prof. Kumar',
          isPublic: true,
          tags: ['neet', 'biology', 'medical'],
        },
      ]);

      setLoading(false);
    }, 1000);
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         question.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         question.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSubject = filters.subject === 'all' || question.subject === filters.subject;
    const matchesDifficulty = filters.difficulty === 'all' || question.difficulty === filters.difficulty;
    const matchesType = filters.type === 'all' || question.type === filters.type;
    const matchesTopic = filters.topic === 'all' || question.topic === filters.topic;

    return matchesSearch && matchesSubject && matchesDifficulty && matchesType && matchesTopic;
  });

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const addToAssignment = () => {
    if (selectedQuestions.length === 0) {
      Alert.alert('No Selection', 'Please select at least one question to add to assignment.');
      return;
    }

    Alert.alert(
      'Questions Added',
      `Successfully added ${selectedQuestions.length} questions to your assignment.`,
      [
        {
          text: 'Continue Adding',
          style: 'default',
          onPress: () => setSelectedQuestions([]),
        },
        {
          text: 'Done',
          style: 'default',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const createNewQuestion = () => {
    if (!newQuestion.question?.trim()) {
      Alert.alert('Invalid Question', 'Please enter a question text.');
      return;
    }

    const question: Question = {
      id: Date.now().toString(),
      question: newQuestion.question,
      type: newQuestion.type || 'multiple_choice',
      subject: newQuestion.subject || 'Mathematics',
      difficulty: newQuestion.difficulty || 'medium',
      topic: newQuestion.topic || '',
      options: newQuestion.options,
      correctAnswer: newQuestion.correctAnswer,
      explanation: newQuestion.explanation,
      tags: newQuestion.tags || [],
      createdBy: user?.name || 'Current User',
      createdAt: new Date().toISOString().split('T')[0],
      usageCount: 0,
      rating: 0,
      points: newQuestion.points || 5,
      timeLimit: newQuestion.timeLimit,
    };

    setQuestions(prev => [question, ...prev]);
    setNewQuestion({
      type: 'multiple_choice',
      subject: 'Mathematics',
      difficulty: 'medium',
      points: 5,
      options: ['', '', '', ''],
      tags: [],
    });
    setShowCreateModal(false);
    
    Alert.alert('success', 'Question created successfully!');
  };

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: theme.Primary }}>
      <Appbar.BackAction onPress={() => navigation.goBack()} />
      <Appbar.Content
        title="Question Bank"
        subtitle={`${filteredQuestions.length} questions available`}
      />
      <Appbar.Action
        icon="upload"
        onPress={() => {
          Alert.alert('Import Questions', 'Import questions from file (Excel, CSV, JSON)');
        }}
      />
      <Appbar.Action
        icon={selectedQuestions.length > 0 ? 'check-all' : 'bookmark-outline'}
        onPress={() => {
          if (selectedQuestions.length > 0) {
            showSnackbar(`${selectedQuestions.length} questions selected`);
          } else {
            showSnackbar('Browse and select questions to add to assignments');
          }
        }}
      />
    </Appbar.Header>
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return theme.Primary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'radio-button-checked';
      case 'short_answer': return 'short-text';
      case 'essay': return 'article';
      case 'true_false': return 'check-box';
      case 'fill_blank': return 'text-fields';
      default: return 'help';
    }
  };

  const renderTabButton = (tabId: string, label: string, icon: string, badge?: number) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        {
          backgroundColor: activeTab === tabId ? theme.Primary : 'transparent',
          borderColor: theme.Primary,
        }
      ]}
      onPress={() => setActiveTab(tabId as any)}
    >
      <View style={styles.tabContent}>
        <Icon 
          name={icon} 
          size={18} 
          color={activeTab === tabId ? theme.OnPrimary : theme.Primary} 
        />
        {badge && badge > 0 && (
          <View style={[styles.badge, {backgroundColor: theme.Error}]}>
            <Text style={[styles.badgeText, {color: theme.OnError}]}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text style={[
        styles.tabButtonText,
        {color: activeTab === tabId ? theme.OnPrimary : theme.Primary}
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderQuestion = ({item, index}: {item: Question; index: number}) => {
    const isSelected = selectedQuestions.includes(item.id);
    
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 100)}
        style={[
          styles.questionCard,
          {
            backgroundColor: theme.Surface,
            borderColor: isSelected ? theme.Primary : 'transparent',
            borderWidth: isSelected ? 2 : 0,
          }
        ]}
      >
        <TouchableOpacity
          style={styles.questionContent}
          onPress={() => toggleQuestionSelection(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.questionHeader}>
            <View style={styles.questionMeta}>
              <View style={[styles.difficultyBadge, {backgroundColor: getDifficultyColor(item.difficulty)}]}>
                <Text style={styles.badgeText}>{item.difficulty.toUpperCase()}</Text>
              </View>
              <View style={[styles.typeBadge, {backgroundColor: theme.SecondaryContainer}]}>
                <Icon 
                  name={getTypeIcon(item.type)} 
                  size={12} 
                  color={theme.OnSecondaryContainer} 
                />
                <Text style={[styles.typeText, {color: theme.OnSecondaryContainer}]}>
                  {item.type.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <View style={styles.questionActions}>
              <Text style={[styles.pointsText, {color: theme.Primary}]}>
                {item.points} pts
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  {
                    backgroundColor: isSelected ? theme.Primary : theme.Outline,
                  }
                ]}
                onPress={() => toggleQuestionSelection(item.id)}
              >
                <Icon 
                  name={isSelected ? 'check' : 'add'} 
                  size={16} 
                  color={isSelected ? theme.OnPrimary : theme.OnSurface} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.questionText, {color: theme.OnSurface}]}>
            {item.question}
          </Text>

          <View style={styles.questionDetails}>
            <Text style={[styles.subjectText, {color: theme.Primary}]}>
              {item.subject} " {item.topic}
            </Text>
            <Text style={[styles.usageText, {color: theme.OnSurfaceVariant}]}>
              Used {item.usageCount} times "  {item.rating.toFixed(1)}
            </Text>
          </View>

          {item.options && item.options.length > 0 && (
            <View style={styles.optionsPreview}>
              <Text style={[styles.optionsLabel, {color: theme.OnSurfaceVariant}]}>
                Options:
              </Text>
              {item.options.slice(0, 2).map((option, index) => (
                <Text key={index} style={[styles.optionText, {color: theme.OnSurfaceVariant}]}>
                  {String.fromCharCode(65 + index)}. {option}
                </Text>
              ))}
              {item.options.length > 2 && (
                <Text style={[styles.moreOptionsText, {color: theme.Primary}]}>
                  +{item.options.length - 2} more options
                </Text>
              )}
            </View>
          )}

          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, {backgroundColor: theme.PrimaryContainer}]}>
                <Text style={[styles.tagText, {color: theme.OnPrimaryContainer}]}>
                  #{tag}
                </Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={[styles.moreTagsText, {color: theme.Primary}]}>
                +{item.tags.length - 3}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderQuestionBank = ({item}: {item: QuestionBank}) => (
    <View style={[styles.bankCard, {backgroundColor: theme.Surface}]}>
      <View style={styles.bankHeader}>
        <Text style={[styles.bankName, {color: theme.OnSurface}]}>
          {item.name}
        </Text>
        <View style={styles.bankMeta}>
          {item.isPublic && (
            <Icon name="public" size={16} color={theme.Primary} />
          )}
        </View>
      </View>
      <Text style={[styles.bankDescription, {color: theme.OnSurfaceVariant}]}>
        {item.description}
      </Text>
      <View style={styles.bankStats}>
        <Text style={[styles.bankCount, {color: theme.Primary}]}>
          {item.questionCount} questions
        </Text>
        <Text style={[styles.bankSubject, {color: theme.OnSurfaceVariant}]}>
          {item.subject}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.accessButton, {backgroundColor: theme.Primary}]}
        onPress={() => {
          // Load questions from this bank
          Alert.alert('Loading', `Loading questions from ${item.name}...`);
        }}
      >
        <Text style={[styles.accessButtonText, {color: theme.OnPrimary}]}>
          Browse Questions
        </Text>
        <Icon name="arrow-forward" size={16} color={theme.OnPrimary} />
      </TouchableOpacity>
    </View>
  );

  const renderCreateQuestionForm = () => (
    <ScrollView style={styles.createForm}>
      <Text style={[styles.formTitle, {color: theme.OnSurface}]}>
        Create New Question
      </Text>

      <View style={styles.formSection}>
        <Text style={[styles.formLabel, {color: theme.OnSurface}]}>
          Question Type
        </Text>
        <View style={styles.typeSelector}>
          {[
            {type: 'multiple_choice', label: 'Multiple Choice', icon: 'radio-button-checked'},
            {type: 'short_answer', label: 'Short Answer', icon: 'short-text'},
            {type: 'essay', label: 'Essay', icon: 'article'},
            {type: 'true_false', label: 'True/False', icon: 'check-box'},
            {type: 'fill_blank', label: 'Fill in Blank', icon: 'text-fields'},
          ].map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.typeOption,
                {
                  backgroundColor: newQuestion.type === option.type 
                    ? theme.PrimaryContainer 
                    : theme.SurfaceVariant,
                }
              ]}
              onPress={() => setNewQuestion(prev => ({...prev, type: option.type as any}))}
            >
              <Icon 
                name={option.icon} 
                size={20} 
                color={newQuestion.type === option.type 
                  ? theme.OnPrimaryContainer 
                  : theme.OnSurfaceVariant} 
              />
              <Text style={[
                styles.typeOptionText,
                {color: newQuestion.type === option.type 
                  ? theme.OnPrimaryContainer 
                  : theme.OnSurfaceVariant}
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={[styles.formLabel, {color: theme.OnSurface}]}>
          Question Text *
        </Text>
        <TextInput
          style={[styles.questionInput, {
            borderColor: theme.Outline,
            color: theme.OnSurface
          }]}
          placeholder="Enter your question here..."
          placeholderTextColor={theme.OnSurfaceVariant}
          value={newQuestion.question}
          onChangeText={(text) => setNewQuestion(prev => ({...prev, question: text}))}
          multiline
          numberOfLines={3}
        />
      </View>

      {newQuestion.type === 'multiple_choice' && (
        <View style={styles.formSection}>
          <Text style={[styles.formLabel, {color: theme.OnSurface}]}>
            Answer Options
          </Text>
          {newQuestion.options?.map((option, index) => (
            <View key={index} style={styles.optionInput}>
              <Text style={[styles.optionLabel, {color: theme.OnSurface}]}>
                {String.fromCharCode(65 + index)}.
              </Text>
              <TextInput
                style={[styles.optionField, {
                  borderColor: theme.Outline,
                  color: theme.OnSurface
                }]}
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                placeholderTextColor={theme.OnSurfaceVariant}
                value={option}
                onChangeText={(text) => {
                  const newOptions = [...(newQuestion.options || [])];
                  newOptions[index] = text;
                  setNewQuestion(prev => ({...prev, options: newOptions}));
                }}
              />
              <TouchableOpacity
                style={[
                  styles.correctButton,
                  {
                    backgroundColor: newQuestion.correctAnswer === index 
                      ? theme.Primary 
                      : theme.Outline
                  }
                ]}
                onPress={() => setNewQuestion(prev => ({...prev, correctAnswer: index}))}
              >
                <Icon 
                  name="check" 
                  size={16} 
                  color={newQuestion.correctAnswer === index 
                    ? theme.OnPrimary 
                    : theme.OnSurface} 
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.formRow}>
        <View style={[styles.formSection, {flex: 1, marginRight: 8}]}>
          <Text style={[styles.formLabel, {color: theme.OnSurface}]}>
            Subject
          </Text>
          <TextInput
            style={[styles.formInput, {
              borderColor: theme.Outline,
              color: theme.OnSurface
            }]}
            placeholder="Mathematics"
            placeholderTextColor={theme.OnSurfaceVariant}
            value={newQuestion.subject}
            onChangeText={(text) => setNewQuestion(prev => ({...prev, subject: text}))}
          />
        </View>
        <View style={[styles.formSection, {flex: 1, marginLeft: 8}]}>
          <Text style={[styles.formLabel, {color: theme.OnSurface}]}>
            Topic
          </Text>
          <TextInput
            style={[styles.formInput, {
              borderColor: theme.Outline,
              color: theme.OnSurface
            }]}
            placeholder="Calculus"
            placeholderTextColor={theme.OnSurfaceVariant}
            value={newQuestion.topic}
            onChangeText={(text) => setNewQuestion(prev => ({...prev, topic: text}))}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.createButton, {backgroundColor: theme.Primary}]}
        onPress={createNewQuestion}
      >
        <Text style={[styles.createButtonText, {color: theme.OnPrimary}]}>
          Create Question
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'browse':
        return (
          <View style={styles.browseContent}>
            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, {
                  borderColor: theme.Outline,
                  color: theme.OnSurface
                }]}
                placeholder="Search questions, topics, tags..."
                placeholderTextColor={theme.OnSurfaceVariant}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity
                style={[styles.filterButton, {backgroundColor: theme.Primary}]}
                onPress={() => setShowFilterModal(true)}
              >
                <Icon name="filter-list" size={20} color={theme.OnPrimary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={theme.Primary} style={styles.loading} />
            ) : (
              <FlatList
                data={filteredQuestions}
                renderItem={renderQuestion}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.questionsList}
              />
            )}

            {selectedQuestions.length > 0 && (
              <View style={[styles.selectionFooter, {backgroundColor: theme.Surface}]}>
                <Text style={[styles.selectionCount, {color: theme.OnSurface}]}>
                  {selectedQuestions.length} questions selected
                </Text>
                <TouchableOpacity
                  style={[styles.addButton, {backgroundColor: theme.Primary}]}
                  onPress={addToAssignment}
                >
                  <Text style={[styles.addButtonText, {color: theme.OnPrimary}]}>
                    Add to Assignment
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 'my_questions':
        return (
          <View style={styles.myQuestionsContent}>
            <FlatList
              data={questions.filter(q => q.createdBy === user?.name)}
              renderItem={renderQuestion}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.questionsList}
              ListEmptyComponent={
                <Text style={[styles.emptyText, {color: theme.OnSurfaceVariant}]}>
                  You haven't created any questions yet.
                </Text>
              }
            />
          </View>
        );

      case 'create':
        return renderCreateQuestionForm();

      case 'import':
        return (
          <View style={styles.importContent}>
            <Text style={[styles.sectionTitle, {color: theme.OnSurface}]}>
              Question Banks
            </Text>
            <FlatList
              data={questionBanks}
              renderItem={renderQuestionBank}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.banksList}
            />
          </View>
        );

      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: theme.Background}]}>
        <StatusBar backgroundColor={theme.Primary} barStyle="light-content" />
        <Appbar.Header elevated style={{ backgroundColor: theme.Primary }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Question Bank" subtitle="Loading..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.Primary} />
          <Text style={[styles.loadingText, {color: theme.OnSurfaceVariant}]}>
            Loading question bank...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.Background}]}>
      <StatusBar backgroundColor={theme.Primary} barStyle="light-content" />

      {renderAppBar()}

      {/* Tab Bar */}
      <View style={[styles.tabBar, {backgroundColor: theme.Surface}]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {renderTabButton('browse', 'Browse', 'search')}
          {renderTabButton('my_questions', 'My Questions', 'folder', questions.filter(q => q.createdBy === user?.name).length)}
          {renderTabButton('create', 'Create', 'add')}
          {renderTabButton('import', 'Banks', 'library-books')}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'OK',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  tabBar: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 80,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabButtonText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  browseContent: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    marginTop: 50,
  },
  questionsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  questionCard: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionContent: {
    padding: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  questionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  questionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '500',
  },
  usageText: {
    fontSize: 10,
  },
  optionsPreview: {
    marginVertical: 8,
  },
  optionsLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
  },
  optionText: {
    fontSize: 10,
    marginBottom: 2,
  },
  moreOptionsText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 9,
  },
  moreTagsText: {
    fontSize: 9,
    fontStyle: 'italic',
  },
  selectionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  myQuestionsContent: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 50,
  },
  createForm: {
    flex: 1,
    padding: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  typeSelector: {
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  questionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    height: 80,
  },
  optionInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 20,
  },
  optionField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  correctButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  createButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  importContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  banksList: {
    paddingBottom: 20,
  },
  bankCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bankName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  bankMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  bankDescription: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  bankStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bankCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bankSubject: {
    fontSize: 12,
  },
  accessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  accessButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default QuestionBankManagementScreen;