import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
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
import {useNavigation, useRoute} from '@react-navigation/native';

import {useTheme} from '../../context/ThemeContext';
import {useAuth} from '../../context/AuthContext';

// Import Supabase services
import { getAssignmentById, getAssignmentSubmissions, gradeSubmission } from '../../services/assignmentsService';
import { getProfileById } from '../../services/profileService';

const {width} = Dimensions.get('window');

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  content: string;
  attachments: string[];
  status: 'submitted' | 'grading' | 'graded' | 'returned';
  grade?: number;
  maxPoints: number;
  feedback?: string;
  plagiarismScore?: number;
  plagiarismSources?: PlagiarismSource[];
  rubricScores?: RubricScore[];
}

interface PlagiarismSource {
  id: string;
  source: string;
  url?: string;
  similarity: number;
  matchedText: string;
  originalText: string;
  type: 'internet' | 'academic' | 'student_work';
  verified: boolean;
}

interface RubricScore {
  criterion: string;
  score: number;
  maxScore: number;
  comment: string;
}

interface FeedbackTemplate {
  id: string;
  name: string;
  category: 'positive' | 'constructive' | 'general';
  content: string;
  tags: string[];
  usage: number;
}

interface AIFeedbackSuggestion {
  type: 'grammar' | 'content' | 'structure' | 'improvement';
  suggestion: string;
  confidence: number;
  explanation: string;
}

const EnhancedAssignmentGradingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {theme} = useTheme();
  const {user} = useAuth();

  // Loading and notification states
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [activeTab, setActiveTab] = useState<'submissions' | 'grading' | 'plagiarism' | 'analytics'>('submissions');
  const [loading, setLoading] = useState(false);
  const [feedbackTemplates, setFeedbackTemplates] = useState<FeedbackTemplate[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AIFeedbackSuggestion[]>([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
  const [gradingCriteria, setGradingCriteria] = useState([
    {name: 'Content Quality', weight: 40},
    {name: 'Organization', weight: 25},
    {name: 'Grammar & Style', weight: 20},
    {name: 'Originality', weight: 15},
  ]);

  const assignmentInfo = route.params || {
    title: 'Calculus Assignment #3',
    subject: 'Mathematics',
    dueDate: '2024-12-25',
    maxPoints: 100,
  };

  // Lifecycle functions
  const initializeScreen = useCallback(async () => {
    try {
      setIsLoading(true);
      await loadGradingData();
      setIsLoading(false);
    } catch (error) {
      showSnackbar('Failed to load grading data');
      setIsLoading(false);
    }
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return backHandler;
  }, [navigation]);

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

  const loadGradingData = async () => {
    setLoading(true);

    try {
      const assignmentId = route.params?.assignmentId || route.params?.id;

      if (!assignmentId) {
        showSnackbar('Assignment ID not provided');
        setLoading(false);
        return;
      }

      // Fetch assignment submissions from Supabase
      const submissionsResult = await getAssignmentSubmissions(assignmentId);

      if (!submissionsResult.success) {
        throw new Error(submissionsResult.error || 'Failed to load submissions');
      }

      const submissionsData = submissionsResult.data || [];

      // Transform submissions to UI format
      const transformedSubmissions: Submission[] = [];

      for (const submission of submissionsData) {
        // Fetch student profile
        const studentProfile = await getProfileById(submission.student_id);
        const studentData = studentProfile.data;

        // Parse content if it's JSON
        let content = '';
        let attachments: string[] = [];

        if (submission.content) {
          try {
            const parsedContent = typeof submission.content === 'string'
              ? JSON.parse(submission.content)
              : submission.content;

            content = parsedContent.text || parsedContent.content || '';
            attachments = parsedContent.attachments || [];
          } catch (err) {
            content = submission.content?.toString() || '';
          }
        }

        transformedSubmissions.push({
          id: submission.id,
          studentId: submission.student_id,
          studentName: studentData?.full_name || 'Unknown Student',
          submittedAt: submission.submitted_at || submission.created_at,
          content,
          attachments,
          status: (submission.status || 'submitted') as 'submitted' | 'grading' | 'graded' | 'returned',
          grade: submission.grade || undefined,
          maxPoints: assignmentInfo.maxPoints || 100,
          feedback: submission.feedback || undefined,
          plagiarismScore: 0, // Placeholder - would need plagiarism service
          plagiarismSources: [],
          rubricScores: [],
        });
      }

      setSubmissions(transformedSubmissions);

      // Set default feedback templates
      setFeedbackTemplates([
        {
          id: '1',
          name: 'Excellent Work',
          category: 'positive',
          content: 'Outstanding work! Your solution demonstrates excellent understanding of the concepts and shows clear logical reasoning.',
          tags: ['excellent', 'understanding', 'logical'],
          usage: 45,
        },
        {
          id: '2',
          name: 'Calculation Error',
          category: 'constructive',
          content: 'Your approach is correct, but there appears to be a calculation error in step {step}. Please review your arithmetic and try again.',
          tags: ['calculation', 'error', 'review'],
          usage: 67,
        },
        {
          id: '3',
          name: 'Missing Steps',
          category: 'constructive',
          content: 'Good start, but your solution is missing some important steps. Please show your work more clearly, especially for {topic}.',
          tags: ['missing', 'steps', 'clarity'],
          usage: 34,
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error loading grading data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load grading data';
      showSnackbar(errorMessage);
      setLoading(false);
    }
  };

  const generateAIFeedback = (submission: Submission) => {
    setLoading(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      setAiSuggestions([
        {
          type: 'content',
          suggestion: 'The student demonstrates good understanding of calculus fundamentals but could benefit from more detailed explanations in step 3.',
          confidence: 0.85,
          explanation: 'Based on the solution structure and mathematical reasoning.',
        },
        {
          type: 'grammar',
          suggestion: 'Consider pointing out the run-on sentence in paragraph 2 for improved clarity.',
          confidence: 0.92,
          explanation: 'Grammatical analysis detected complex sentence structure.',
        },
        {
          type: 'improvement',
          suggestion: 'Suggest including a visual graph to better illustrate the derivative concept.',
          confidence: 0.78,
          explanation: 'Visual aids would enhance understanding for this type of problem.',
        },
      ]);
      setLoading(false);
    }, 2000);
  };

  const runPlagiarismCheck = (submission: Submission) => {
    setLoading(true);
    
    // Simulate plagiarism analysis
    setTimeout(() => {
      Alert.alert(
        'Plagiarism Check Complete',
        `Analysis found ${submission.plagiarismScore}% similarity across ${submission.plagiarismSources?.length || 0} sources.`
      );
      setLoading(false);
    }, 3000);
  };

  const saveGrade = async (submission: Submission) => {
    try {
      if (!user?.id) {
        showSnackbar('User not authenticated');
        return;
      }

      setLoading(true);

      // Save grade to Supabase
      const result = await gradeSubmission(submission.id, {
        grade: submission.grade || 0,
        feedback: submission.feedback || '',
        graded_by: user.id,
        graded_at: new Date().toISOString(),
        status: 'graded',
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save grade');
      }

      // Update local state
      const updatedSubmissions = submissions.map(sub =>
        sub.id === submission.id
          ? {...submission, status: 'graded' as const}
          : sub
      );
      setSubmissions(updatedSubmissions);

      showSnackbar('Grade saved successfully!');
      setCurrentSubmission(null);
      setLoading(false);

    } catch (error) {
      console.error('Error saving grade:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save grade';
      showSnackbar(errorMessage);
      setLoading(false);
    }
  };

  const getPlagiarismColor = (score: number) => {
    if (score < 15) return '#4CAF50';
    if (score < 30) return '#FF9800';
    return '#F44336';
  };

  const renderSubmissionCard = ({item, index}: {item: Submission; index: number}) => (
    <Animated.View
      entering={FadeInUp.delay(index * 100)}
      style={[styles.submissionCard, {backgroundColor: theme.Surface}]}
    >
      <TouchableOpacity
        style={styles.submissionContent}
        onPress={() => setCurrentSubmission(item)}
        activeOpacity={0.7}
      >
        <View style={styles.submissionHeader}>
          <Text style={[styles.studentName, {color: theme.OnSurface}]}>
            {item.studentName}
          </Text>
          <View style={styles.submissionMeta}>
            <View style={[
              styles.statusBadge,
              {backgroundColor: item.status === 'graded' ? '#4CAF50' : theme.Primary}
            ]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
            {item.plagiarismScore !== undefined && (
              <View style={[
                styles.plagiarismBadge,
                {backgroundColor: getPlagiarismColor(item.plagiarismScore)}
              ]}>
                <Text style={styles.plagiarismText}>{item.plagiarismScore}%</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={[styles.submissionDate, {color: theme.OnSurfaceVariant}]}>
          Submitted: {new Date(item.submittedAt).toLocaleString()}
        </Text>

        <Text
          style={[styles.contentPreview, {color: theme.OnSurfaceVariant}]}
          numberOfLines={3}
        >
          {item.content}
        </Text>

        <View style={styles.submissionFooter}>
          {item.grade !== undefined ? (
            <Text style={[styles.gradeText, {color: theme.Primary}]}>
              Grade: {item.grade}/{item.maxPoints}
            </Text>
          ) : (
            <Text style={[styles.ungradedText, {color: theme.OnSurfaceVariant}]}>
              Not graded
            </Text>
          )}
          
          <View style={styles.attachmentInfo}>
            <Icon name="attachment" size={14} color={theme.OnSurfaceVariant} />
            <Text style={[styles.attachmentCount, {color: theme.OnSurfaceVariant}]}>
              {item.attachments.length}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderPlagiarismSource = ({item}: {item: PlagiarismSource}) => (
    <View style={[styles.sourceCard, {backgroundColor: theme.SurfaceVariant}]}>
      <View style={styles.sourceHeader}>
        <Text style={[styles.sourceName, {color: theme.OnSurface}]}>
          {item.source}
        </Text>
        <View style={[
          styles.similarityBadge,
          {backgroundColor: getPlagiarismColor(item.similarity)}
        ]}>
          <Text style={styles.similarityText}>{item.similarity}%</Text>
        </View>
      </View>
      
      <View style={styles.textComparison}>
        <View style={styles.textSection}>
          <Text style={[styles.textLabel, {color: theme.OnSurfaceVariant}]}>
            Student Text:
          </Text>
          <Text style={[styles.matchedText, {color: theme.OnSurface}]}>
            "{item.matchedText}"
          </Text>
        </View>
        
        <View style={styles.textSection}>
          <Text style={[styles.textLabel, {color: theme.OnSurfaceVariant}]}>
            Source Text:
          </Text>
          <Text style={[styles.originalText, {color: theme.OnSurface}]}>
            "{item.originalText}"
          </Text>
        </View>
      </View>

      <View style={styles.sourceFooter}>
        <View style={styles.sourceType}>
          <Icon 
            name={item.type === 'internet' ? 'public' : item.type === 'academic' ? 'school' : 'people'} 
            size={14} 
            color={theme.Primary} 
          />
          <Text style={[styles.typeText, {color: theme.Primary}]}>
            {item.type.replace('_', ' ')}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.verifyButton,
            {backgroundColor: item.verified ? '#4CAF50' : theme.Outline}
          ]}
          onPress={() => {
            // Toggle verification
            Alert.alert('Verification', item.verified ? 'Mark as unverified?' : 'Mark as verified?');
          }}
        >
          <Icon 
            name={item.verified ? 'verified' : 'help'} 
            size={14} 
            color={item.verified ? '#fff' : theme.OnSurface} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFeedbackTemplate = ({item}: {item: FeedbackTemplate}) => (
    <TouchableOpacity
      style={[styles.templateCard, {backgroundColor: theme.Surface}]}
      onPress={() => {
        // Insert template into feedback
        setShowTemplatesModal(false);
        Alert.alert('Template Applied', `"${item.name}" template has been applied to feedback.`);
      }}
    >
      <View style={styles.templateHeader}>
        <Text style={[styles.templateName, {color: theme.OnSurface}]}>
          {item.name}
        </Text>
        <View style={[
          styles.categoryBadge,
          {backgroundColor: item.category === 'positive' ? '#4CAF50' : '#FF9800'}
        ]}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      
      <Text style={[styles.templateContent, {color: theme.OnSurfaceVariant}]}>
        {item.content}
      </Text>
      
      <View style={styles.templateFooter}>
        <Text style={[styles.usageText, {color: theme.OnSurfaceVariant}]}>
          Used {item.usage} times
        </Text>
        <View style={styles.templateTags}>
          {item.tags.slice(0, 2).map((tag, index) => (
            <Text key={index} style={[styles.templateTag, {color: theme.Primary}]}>
              #{tag}
            </Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGradingInterface = () => {
    if (!currentSubmission) return null;

    return (
      <ScrollView style={styles.gradingContent}>
        <View style={[styles.gradingHeader, {backgroundColor: theme.Surface}]}>
          <Text style={[styles.gradingTitle, {color: theme.OnSurface}]}>
            Grading: {currentSubmission.studentName}
          </Text>
          <TouchableOpacity
            style={[styles.aiButton, {backgroundColor: theme.Primary}]}
            onPress={() => generateAIFeedback(currentSubmission)}
          >
            <Icon name="auto-awesome" size={16} color={theme.OnPrimary} />
            <Text style={[styles.aiButtonText, {color: theme.OnPrimary}]}>
              AI Assist
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submission Content */}
        <View style={[styles.contentSection, {backgroundColor: theme.Surface}]}>
          <Text style={[styles.sectionTitle, {color: theme.OnSurface}]}>
            Submission Content
          </Text>
          <ScrollView style={styles.contentScroll} nestedScrollEnabled>
            <Text style={[styles.submissionText, {color: theme.OnSurface}]}>
              {currentSubmission.content}
            </Text>
          </ScrollView>
        </View>

        {/* Rubric Grading */}
        <View style={[styles.rubricSection, {backgroundColor: theme.Surface}]}>
          <Text style={[styles.sectionTitle, {color: theme.OnSurface}]}>
            Rubric Scoring
          </Text>
          {gradingCriteria.map((criterion, index) => (
            <View key={index} style={styles.criterionRow}>
              <View style={styles.criterionInfo}>
                <Text style={[styles.criterionName, {color: theme.OnSurface}]}>
                  {criterion.name}
                </Text>
                <Text style={[styles.criterionWeight, {color: theme.OnSurfaceVariant}]}>
                  Weight: {criterion.weight}%
                </Text>
              </View>
              <View style={styles.scoreInput}>
                <TextInput
                  style={[styles.scoreField, {
                    borderColor: theme.Outline,
                    color: theme.OnSurface
                  }]}
                  placeholder="0"
                  placeholderTextColor={theme.OnSurfaceVariant}
                  keyboardType="numeric"
                />
                <Text style={[styles.maxScore, {color: theme.OnSurfaceVariant}]}>
                  / {Math.round(currentSubmission.maxPoints * criterion.weight / 100)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <View style={[styles.aiSection, {backgroundColor: theme.Surface}]}>
            <Text style={[styles.sectionTitle, {color: theme.OnSurface}]}>
              AI Feedback Suggestions
            </Text>
            {aiSuggestions.map((suggestion, index) => (
              <View key={index} style={[styles.suggestionCard, {backgroundColor: theme.SurfaceVariant}]}>
                <View style={styles.suggestionHeader}>
                  <View style={[styles.suggestionType, {backgroundColor: theme.PrimaryContainer}]}>
                    <Text style={[styles.suggestionTypeText, {color: theme.OnPrimaryContainer}]}>
                      {suggestion.type}
                    </Text>
                  </View>
                  <Text style={[styles.confidenceText, {color: theme.Primary}]}>
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </Text>
                </View>
                <Text style={[styles.suggestionText, {color: theme.OnSurface}]}>
                  {suggestion.suggestion}
                </Text>
                <Text style={[styles.explanationText, {color: theme.OnSurfaceVariant}]}>
                  {suggestion.explanation}
                </Text>
                <TouchableOpacity
                  style={[styles.applySuggestionButton, {backgroundColor: theme.Primary}]}
                  onPress={() => {
                    Alert.alert('Applied', 'Suggestion has been added to feedback.');
                  }}
                >
                  <Text style={[styles.applySuggestionText, {color: theme.OnPrimary}]}>
                    Apply Suggestion
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Feedback Section */}
        <View style={[styles.feedbackSection, {backgroundColor: theme.Surface}]}>
          <View style={styles.feedbackHeader}>
            <Text style={[styles.sectionTitle, {color: theme.OnSurface}]}>
              Feedback
            </Text>
            <TouchableOpacity
              style={[styles.templateButton, {backgroundColor: theme.Outline}]}
              onPress={() => setShowTemplatesModal(true)}
            >
              <Icon name="library-books" size={16} color={theme.OnSurface} />
              <Text style={[styles.templateButtonText, {color: theme.OnSurface}]}>
                Templates
              </Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[styles.feedbackInput, {
              borderColor: theme.Outline,
              color: theme.OnSurface
            }]}
            placeholder="Enter detailed feedback for the student..."
            placeholderTextColor={theme.OnSurfaceVariant}
            multiline
            numberOfLines={6}
            value={currentSubmission.feedback}
            onChangeText={(text) => {
              setCurrentSubmission(prev => prev ? {...prev, feedback: text} : null);
            }}
          />
        </View>

        {/* Final Grade */}
        <View style={[styles.gradeSection, {backgroundColor: theme.Surface}]}>
          <Text style={[styles.sectionTitle, {color: theme.OnSurface}]}>
            Final Grade
          </Text>
          <View style={styles.gradeInput}>
            <TextInput
              style={[styles.gradeField, {
                borderColor: theme.Outline,
                color: theme.OnSurface
              }]}
              placeholder="0"
              placeholderTextColor={theme.OnSurfaceVariant}
              keyboardType="numeric"
              value={currentSubmission.grade?.toString()}
              onChangeText={(text) => {
                setCurrentSubmission(prev => 
                  prev ? {...prev, grade: parseInt(text) || 0} : null
                );
              }}
            />
            <Text style={[styles.maxGrade, {color: theme.OnSurfaceVariant}]}>
              / {currentSubmission.maxPoints}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: theme.Outline}]}
            onPress={() => setCurrentSubmission(null)}
          >
            <Text style={[styles.actionButtonText, {color: theme.OnSurface}]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: theme.Primary}]}
            onPress={() => saveGrade(currentSubmission)}
          >
            <Text style={[styles.actionButtonText, {color: theme.OnPrimary}]}>
              Save Grade
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{height: 50}} />
      </ScrollView>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'submissions':
        return (
          <FlatList
            data={submissions}
            renderItem={renderSubmissionCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.submissionsList}
            showsVerticalScrollIndicator={false}
          />
        );

      case 'grading':
        return renderGradingInterface();

      case 'plagiarism':
        return (
          <ScrollView style={styles.plagiarismContent}>
            <Text style={[styles.sectionTitle, {color: theme.OnSurface}]}>
              Plagiarism Analysis
            </Text>
            {currentSubmission?.plagiarismSources ? (
              <FlatList
                data={currentSubmission.plagiarismSources}
                renderItem={renderPlagiarismSource}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            ) : (
              <Text style={[styles.emptyText, {color: theme.OnSurfaceVariant}]}>
                Select a submission to view plagiarism analysis.
              </Text>
            )}
          </ScrollView>
        );

      case 'analytics':
        return (
          <ScrollView style={styles.analyticsContent}>
            <Text style={[styles.sectionTitle, {color: theme.OnSurface}]}>
              Grading Analytics
            </Text>
            <View style={[styles.analyticsCard, {backgroundColor: theme.Surface}]}>
              <Text style={[styles.analyticsTitle, {color: theme.OnSurface}]}>
                Assignment Statistics
              </Text>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, {color: theme.OnSurfaceVariant}]}>
                  Total Submissions:
                </Text>
                <Text style={[styles.statValue, {color: theme.Primary}]}>
                  {submissions.length}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, {color: theme.OnSurfaceVariant}]}>
                  Graded:
                </Text>
                <Text style={[styles.statValue, {color: theme.Primary}]}>
                  {submissions.filter(s => s.status === 'graded').length}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, {color: theme.OnSurfaceVariant}]}>
                  Average Grade:
                </Text>
                <Text style={[styles.statValue, {color: theme.Primary}]}>
                  {submissions.filter(s => s.grade).reduce((sum, s) => sum + (s.grade || 0), 0) / 
                   submissions.filter(s => s.grade).length || 0}/100
                </Text>
              </View>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: theme.Background}]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.Surface} />
        <Appbar.Header elevated style={{ backgroundColor: theme.Primary }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={assignmentInfo.title} subtitle="Loading..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.Primary} />
          <Text style={[styles.loadingText, {color: theme.OnSurfaceVariant}]}>
            Loading grading data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.Background}]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.Surface} />

      {/* Header */}
      <Appbar.Header elevated style={{ backgroundColor: theme.Primary }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title={assignmentInfo.title}
          subtitle={`${assignmentInfo.subject} • Due: ${assignmentInfo.dueDate}`}
        />
        <Appbar.Action
          icon="download"
          onPress={() => {
            Alert.alert('Export', 'Export grades to CSV or Excel?');
          }}
        />
      </Appbar.Header>

      {/* Tab Bar */}
      <View style={[styles.tabBar, {backgroundColor: theme.Surface}]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <TouchableOpacity
            style={[
              styles.tab,
              {backgroundColor: activeTab === 'submissions' ? theme.Primary : 'transparent'}
            ]}
            onPress={() => setActiveTab('submissions')}
          >
            <Icon 
              name="assignment" 
              size={18} 
              color={activeTab === 'submissions' ? theme.OnPrimary : theme.OnSurface} 
            />
            <Text style={[
              styles.tabText,
              {color: activeTab === 'submissions' ? theme.OnPrimary : theme.OnSurface}
            ]}>
              Submissions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              {backgroundColor: activeTab === 'grading' ? theme.Primary : 'transparent'}
            ]}
            onPress={() => setActiveTab('grading')}
          >
            <Icon 
              name="grade" 
              size={18} 
              color={activeTab === 'grading' ? theme.OnPrimary : theme.OnSurface} 
            />
            <Text style={[
              styles.tabText,
              {color: activeTab === 'grading' ? theme.OnPrimary : theme.OnSurface}
            ]}>
              Grading
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              {backgroundColor: activeTab === 'plagiarism' ? theme.Primary : 'transparent'}
            ]}
            onPress={() => setActiveTab('plagiarism')}
          >
            <Icon 
              name="search" 
              size={18} 
              color={activeTab === 'plagiarism' ? theme.OnPrimary : theme.OnSurface} 
            />
            <Text style={[
              styles.tabText,
              {color: activeTab === 'plagiarism' ? theme.OnPrimary : theme.OnSurface}
            ]}>
              Plagiarism
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              {backgroundColor: activeTab === 'analytics' ? theme.Primary : 'transparent'}
            ]}
            onPress={() => setActiveTab('analytics')}
          >
            <Icon 
              name="analytics" 
              size={18} 
              color={activeTab === 'analytics' ? theme.OnPrimary : theme.OnSurface} 
            />
            <Text style={[
              styles.tabText,
              {color: activeTab === 'analytics' ? theme.OnPrimary : theme.OnSurface}
            ]}>
              Analytics
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.Primary} />
            <Text style={[styles.loadingText, {color: theme.OnSurface}]}>
              Processing...
            </Text>
          </View>
        )}
        {renderContent()}
      </View>

      {/* Feedback Templates Modal */}
      <Modal visible={showTemplatesModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, {backgroundColor: theme.Surface}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: theme.OnSurface}]}>
                Feedback Templates
              </Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowTemplatesModal(false)}
              >
                <Icon name="close" size={24} color={theme.OnSurface} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={feedbackTemplates}
              renderItem={renderFeedbackTemplate}
              keyExtractor={item => item.id}
              style={styles.templatesList}
            />
          </View>
        </View>
      </Modal>

      {/* Snackbar for notifications */}
      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </View>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerAction: {
    padding: 8,
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
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    gap: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  submissionsList: {
    padding: 16,
  },
  submissionCard: {
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submissionContent: {
    padding: 16,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  submissionMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  plagiarismBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  plagiarismText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  submissionDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  contentPreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  submissionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  ungradedText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attachmentCount: {
    fontSize: 12,
  },
  gradingContent: {
    flex: 1,
  },
  gradingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  gradingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contentSection: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  contentScroll: {
    maxHeight: 150,
  },
  submissionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  rubricSection: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  criterionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  criterionInfo: {
    flex: 1,
  },
  criterionName: {
    fontSize: 14,
    fontWeight: '500',
  },
  criterionWeight: {
    fontSize: 12,
  },
  scoreInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    width: 60,
    textAlign: 'center',
  },
  maxScore: {
    fontSize: 14,
  },
  aiSection: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  suggestionTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  suggestionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  applySuggestionButton: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  applySuggestionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  feedbackSection: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  templateButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  gradeSection: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 80,
    textAlign: 'center',
  },
  maxGrade: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  plagiarismContent: {
    padding: 16,
  },
  sourceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceName: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  similarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  similarityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  textComparison: {
    marginBottom: 12,
  },
  textSection: {
    marginBottom: 8,
  },
  textLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  matchedText: {
    fontSize: 12,
    fontStyle: 'italic',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  originalText: {
    fontSize: 12,
    fontStyle: 'italic',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 8,
    borderRadius: 4,
  },
  sourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  verifyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsContent: {
    padding: 16,
  },
  analyticsCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 50,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalClose: {
    padding: 4,
  },
  templatesList: {
    padding: 20,
  },
  templateCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  templateContent: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageText: {
    fontSize: 10,
  },
  templateTags: {
    flexDirection: 'row',
    gap: 8,
  },
  templateTag: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default EnhancedAssignmentGradingScreen;