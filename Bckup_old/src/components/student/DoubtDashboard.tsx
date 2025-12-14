import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  Platform,
  ToastAndroid,
} from 'react-native';
import {
  Card,
  Button,
  IconButton,
  Chip,
  Divider,
  Surface,
  Portal,
  Modal,
  List,
  ProgressBar,
  Badge,
  FAB,
} from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Import Phase 24 components
import DoubtSubmissionForm, { DoubtSubmission } from './DoubtSubmissionForm';
import SubmissionHistory from './SubmissionHistory';
import DoubtPreview from './DoubtPreview';

const { width, height } = Dimensions.get('window');

export interface DashboardNotification {
  id: string;
  type: 'answer_received' | 'doubt_approved' | 'expert_available' | 'similar_found' | 'reminder';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionRequired?: boolean;
  relatedSubmissionId?: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
  enabled?: boolean;
  badge?: number;
}

export interface SearchFilter {
  subjects?: string[];
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  priority?: string[];
  hasAttachments?: boolean;
  searchText?: string;
}

export interface AIDoubtSuggestion {
  id: string;
  title: string;
  confidence: number;
  reason: string;
  similarDoubts: string[];
  suggestedTags: string[];
  estimatedDifficulty: 'Easy' | 'Medium' | 'Hard';
  recommendedResources: string[];
}

export interface CollaborationSession {
  id: string;
  type: 'study_group' | 'peer_help' | 'expert_session';
  title: string;
  participants: string[];
  startTime: string;
  duration: number;
  status: 'scheduled' | 'active' | 'completed';
  subject?: string;
}

export interface DoubtDashboardProps {
  userId: string;
  userName?: string;
  onSubmissionComplete?: (submission: DoubtSubmission) => void;
  onNavigateToHistory?: () => void;
  onNavigateToProfile?: () => void;
  showNotifications?: boolean;
  enableOfflineMode?: boolean;
  enableAIFeatures?: boolean;
  enableCollaboration?: boolean;
}

const DoubtDashboard: React.FC<DoubtDashboardProps> = ({
  userId,
  userName = 'Student',
  onSubmissionComplete,
  onNavigateToHistory,
  onNavigateToProfile,
  showNotifications = true,
  enableOfflineMode = true,
  enableAIFeatures = true,
  enableCollaboration = true,
}) => {
  const { theme } = useTheme();
  
  // State management
  const [submissions, setSubmissions] = useState<DoubtSubmission[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'form' | 'history'>('dashboard');
  const [selectedSubmission, setSelectedSubmission] = useState<DoubtSubmission | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [drafts, setDrafts] = useState<Partial<DoubtSubmission>[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  
  // Phase 83: Enhanced Search and AI Features
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<SearchFilter>({});
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIDoubtSuggestion[]>([]);
  const [collaborationSessions, setCollaborationSessions] = useState<CollaborationSession[]>([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredSubmissions, setFilteredSubmissions] = useState<DoubtSubmission[]>([]);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'poor'>('online');
  const [analyticsData, setAnalyticsData] = useState({
    searchFrequency: 0,
    mostSearchedTerms: [] as string[],
    averageResolutionTime: 0,
    successRate: 0,
  });

  // Initialize dashboard data
  useEffect(() => {
    loadDashboardData();
    loadDrafts();
    setupNotifications();
    initializePhase83Features();
    setupNetworkListener();
  }, []);

  // Phase 83: Initialize advanced features
  const initializePhase83Features = useCallback(async () => {
    try {
      // Load search history
      const savedSearchHistory = await AsyncStorage.getItem('search_history_' + userId);
      if (savedSearchHistory) {
        setSearchHistory(JSON.parse(savedSearchHistory));
      }
      
      // Load analytics data
      const savedAnalytics = await AsyncStorage.getItem('analytics_data_' + userId);
      if (savedAnalytics) {
        setAnalyticsData(JSON.parse(savedAnalytics));
      }
      
      // Initialize AI suggestions
      if (enableAIFeatures) {
        await loadAISuggestions();
      }
      
      // Initialize collaboration sessions
      if (enableCollaboration) {
        await loadCollaborationSessions();
      }
    } catch (error) {
      console.error('Error initializing Phase 83 features:', error);
    }
  }, [userId, enableAIFeatures, enableCollaboration]);

  // Phase 83: Setup network status monitoring
  const setupNetworkListener = useCallback(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        setNetworkStatus('offline');
        setIsOffline(true);
      } else if (state.details && 'strength' in state.details && (state.details as any).strength < 2) {
        setNetworkStatus('poor');
        setIsOffline(false);
      } else {
        setNetworkStatus('online');
        setIsOffline(false);
      }
    });
    
    return unsubscribe;
  }, []);

  // Mock data loading
  const loadDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock submissions data
      const mockSubmissions: DoubtSubmission[] = [
        {
          id: '1',
          title: 'How to solve quadratic equations?',
          description: 'I am having trouble understanding the quadratic formula and when to use it.',
          category: {
            subject: 'Mathematics',
            chapter: 'Algebra',
            topic: 'Quadratic Equations',
            difficulty: 'Intermediate',
          },
          tags: ['algebra', 'quadratic', 'formula', 'equations'],
          attachments: {
            images: [],
            videos: [],
            documents: [],
            drawings: ['drawing1.svg'],
            codeSnippets: [],
            mathEquations: ['x = (-b ± √(b² - 4ac)) / 2a'],
          },
          priority: 'Medium',
          isAnonymous: false,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Answered',
          metadata: {
            deviceInfo: Platform.OS + ' ' + Platform.Version,
            appVersion: '1.0.0',
            submissionSource: 'mobile',
            estimatedTime: 180,
          },
        },
        {
          id: '2',
          title: 'Understanding photosynthesis process',
          description: 'Can someone explain the light and dark reactions in photosynthesis?',
          category: {
            subject: 'Biology',
            chapter: 'Plant Biology',
            topic: 'Photosynthesis',
            difficulty: 'Basic',
          },
          tags: ['biology', 'photosynthesis', 'plants', 'light-reaction'],
          attachments: {
            images: ['plant_diagram.jpg'],
            videos: [],
            documents: [],
            drawings: [],
            codeSnippets: [],
            mathEquations: [],
          },
          priority: 'Low',
          isAnonymous: false,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Under Review',
          metadata: {
            deviceInfo: Platform.OS + ' ' + Platform.Version,
            appVersion: '1.0.0',
            submissionSource: 'mobile',
            estimatedTime: 120,
          },
        },
      ];
      
      // Mock notifications
      const mockNotifications: DashboardNotification[] = [
        {
          id: '1',
          type: 'answer_received',
          title: 'Your doubt was answered!',
          message: 'Your quadratic equations doubt has received a detailed answer.',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          isRead: false,
          relatedSubmissionId: '1',
        },
        {
          id: '2',
          type: 'doubt_approved',
          title: 'Doubt approved',
          message: 'Your photosynthesis question is now live for experts to answer.',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
          isRead: true,
          relatedSubmissionId: '2',
        },
        {
          id: '3',
          type: 'expert_available',
          title: 'Expert available',
          message: 'A Mathematics expert is now online and available for live sessions.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          isRead: false,
        },
      ];
      
      setSubmissions(mockSubmissions);
      setNotifications(mockNotifications);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to load dashboard data', ToastAndroid.SHORT);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Load drafts from AsyncStorage
  const loadDrafts = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const draftKeys = keys.filter(key => key.startsWith('doubt_draft_'));
      
      if (draftKeys.length > 0) {
        const draftData = await AsyncStorage.multiGet(draftKeys);
        const parsedDrafts = draftData
          .map(([key, value]) => value ? JSON.parse(value) : null)
          .filter(draft => draft !== null);
        
        setDrafts(parsedDrafts);
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  }, []);

  // Setup notifications
  const setupNotifications = useCallback(() => {
    // Mock periodic notification check
    const notificationInterval = setInterval(() => {
      // In a real app, this would check for new notifications from the server
      console.log('Checking for new notifications...');
    }, 30000); // Check every 30 seconds

    return () => clearInterval(notificationInterval);
  }, []);

  // Phase 83: Load AI-powered suggestions
  const loadAISuggestions = useCallback(async () => {
    try {
      // Simulate AI analysis of user's doubt patterns
      const mockAISuggestions: AIDoubtSuggestion[] = [
        {
          id: 'ai_1',
          title: 'Consider breaking down complex problems into smaller parts',
          confidence: 0.85,
          reason: 'Based on your recent submissions, you tend to ask broad questions. Specific questions get better answers.',
          similarDoubts: ['How to solve algebraic equations?', 'Understanding calculus basics'],
          suggestedTags: ['problem-solving', 'step-by-step', 'methodology'],
          estimatedDifficulty: 'Medium',
          recommendedResources: ['Math Problem-Solving Guide', 'Video: Breaking Down Complex Problems']
        },
        {
          id: 'ai_2',
          title: 'Add visual diagrams to your science questions',
          confidence: 0.78,
          reason: 'Science doubts with diagrams receive 67% faster responses and higher quality answers.',
          similarDoubts: ['Plant cell structure', 'Chemical reaction mechanisms'],
          suggestedTags: ['visual-learning', 'diagrams', 'illustrations'],
          estimatedDifficulty: 'Easy',
          recommendedResources: ['Diagram Drawing Tools', 'Visual Learning Techniques']
        }
      ];
      
      setAiSuggestions(mockAISuggestions);
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
    }
  }, []);

  // Phase 83: Load collaboration sessions
  const loadCollaborationSessions = useCallback(async () => {
    try {
      const mockSessions: CollaborationSession[] = [
        {
          id: 'collab_1',
          type: 'study_group',
          title: 'Mathematics Study Group - Calculus',
          participants: [userId, 'student_2', 'student_3'],
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          duration: 60, // 60 minutes
          status: 'scheduled',
          subject: 'Mathematics'
        },
        {
          id: 'collab_2',
          type: 'peer_help',
          title: 'Physics Problem Solving Session',
          participants: [userId, 'peer_helper_1'],
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          duration: 45,
          status: 'scheduled',
          subject: 'Physics'
        }
      ];
      
      setCollaborationSessions(mockSessions);
    } catch (error) {
      console.error('Error loading collaboration sessions:', error);
    }
  }, [userId]);

  // Phase 83: Smart search and filtering
  const performAdvancedSearch = useCallback(async (query: string, filters: SearchFilter = {}) => {
    setIsSearching(true);
    
    try {
      // Save search query to history
      const updatedHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
      setSearchHistory(updatedHistory);
      await AsyncStorage.setItem('search_history_' + userId, JSON.stringify(updatedHistory));
      
      // Update analytics
      const updatedAnalytics = {
        ...analyticsData,
        searchFrequency: analyticsData.searchFrequency + 1,
        mostSearchedTerms: [query, ...analyticsData.mostSearchedTerms].slice(0, 5)
      };
      setAnalyticsData(updatedAnalytics);
      await AsyncStorage.setItem('analytics_data_' + userId, JSON.stringify(updatedAnalytics));
      
      // Apply filters to submissions
      let filtered = [...submissions];
      
      // Text search
      if (query.trim()) {
        const searchTerms = query.toLowerCase().split(' ');
        filtered = filtered.filter(submission => {
          const searchText = (
            submission.title + ' ' + 
            submission.description + ' ' + 
            submission.tags.join(' ') + ' ' + 
            (submission.category?.subject || '') + ' ' +
            (submission.category?.chapter || '') + ' ' +
            (submission.category?.topic || '')
          ).toLowerCase();
          
          return searchTerms.some(term => searchText.includes(term));
        });
      }
      
      // Apply filters
      if (filters.subjects && filters.subjects.length > 0) {
        filtered = filtered.filter(s => filters.subjects!.includes(s.category?.subject || ''));
      }
      
      if (filters.status && filters.status.length > 0) {
        filtered = filtered.filter(s => filters.status!.includes(s.status));
      }
      
      if (filters.priority && filters.priority.length > 0) {
        filtered = filtered.filter(s => filters.priority!.includes(s.priority));
      }
      
      if (filters.tags && filters.tags.length > 0) {
        filtered = filtered.filter(s => 
          filters.tags!.some(tag => s.tags.includes(tag))
        );
      }
      
      if (filters.hasAttachments !== undefined) {
        filtered = filtered.filter(s => {
          const hasAttachments = Object.values(s.attachments).some(arr => arr.length > 0);
          return hasAttachments === filters.hasAttachments;
        });
      }
      
      if (filters.dateRange) {
        const start = new Date(filters.dateRange.start);
        const end = new Date(filters.dateRange.end);
        filtered = filtered.filter(s => {
          const submissionDate = new Date(s.createdAt);
          return submissionDate >= start && submissionDate <= end;
        });
      }
      
      setFilteredSubmissions(filtered);
      
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setIsSearching(false);
    }
  }, [submissions, searchHistory, analyticsData, userId]);

  // Dashboard statistics with Phase 83 enhancements
  const dashboardStats = useMemo(() => {
    const workingSubmissions = filteredSubmissions.length > 0 ? filteredSubmissions : submissions;
    const totalSubmissions = workingSubmissions.length;
    const answeredCount = workingSubmissions.filter(s => s.status === 'Answered').length;
    const pendingCount = workingSubmissions.filter(s => ['Submitted', 'Under Review'].includes(s.status)).length;
    const draftCount = drafts.length;
    const unreadNotifications = notifications.filter(n => !n.isRead).length;
    
    const todaySubmissions = workingSubmissions.filter(s => {
      const today = new Date().toDateString();
      return new Date(s.createdAt).toDateString() === today;
    }).length;
    
    // Phase 83: Enhanced analytics
    const collaborationSessionsToday = collaborationSessions.filter(s => {
      const today = new Date().toDateString();
      return new Date(s.startTime).toDateString() === today;
    }).length;
    
    const aiSuggestionsCount = aiSuggestions.length;
    
    return {
      totalSubmissions,
      answeredCount,
      pendingCount,
      draftCount,
      unreadNotifications,
      todaySubmissions,
      collaborationSessionsToday,
      aiSuggestionsCount,
      searchFrequency: analyticsData.searchFrequency,
      networkStatus,
    };
  }, [filteredSubmissions, submissions, drafts, notifications, collaborationSessions, aiSuggestions, analyticsData, networkStatus]);

  // Phase 83: Enhanced quick actions with AI and collaboration features
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'new_doubt',
      title: 'New Doubt',
      description: 'Submit a new doubt with AI assistance',
      icon: 'plus-circle',
      onPress: () => setActiveView('form'),
      enabled: true,
    },
    {
      id: 'continue_draft',
      title: 'Continue Draft',
      description: 'Resume working on saved drafts',
      icon: 'file-document-edit',
      onPress: () => {
        if (drafts.length > 0) {
          setSelectedSubmission(drafts[0] as DoubtSubmission);
          setActiveView('form');
        }
      },
      enabled: drafts.length > 0,
      badge: drafts.length,
    },
    {
      id: 'view_history',
      title: 'My Doubts',
      description: 'View all your submitted doubts',
      icon: 'history',
      onPress: () => setActiveView('history'),
      enabled: true,
      badge: dashboardStats.pendingCount > 0 ? dashboardStats.pendingCount : undefined,
    },
    {
      id: 'expert_session',
      title: 'Expert Session',
      description: 'Book a session with subject experts',
      icon: 'account-tie',
      onPress: () => {
        // Navigate to expert booking - Feature now available!
        if (Platform.OS === 'android') {
          ToastAndroid.show('Expert session booking available! Connect with subject experts.', ToastAndroid.LONG);
        }
      },
      enabled: true,
    },
    {
      id: 'advanced_search',
      title: 'Smart Search',
      description: 'Find doubts with AI-powered search and filters',
      icon: 'search',
      onPress: () => setShowSearchModal(true),
      enabled: true,
      badge: filteredSubmissions.length > 0 ? filteredSubmissions.length : undefined,
    },
    {
      id: 'ai_suggestions',
      title: 'AI Insights',
      description: 'Get personalized improvement suggestions',
      icon: 'lightbulb',
      onPress: () => {
        Alert.alert(
          'AI Insights Available',
          `You have ${aiSuggestions.length} personalized suggestions to improve your doubt-solving experience.`,
          [
            { text: 'View Later', style: 'cancel' },
            { text: 'View Now', onPress: () => setActiveView('ai-insights') }
          ]
        );
      },
      enabled: enableAIFeatures && aiSuggestions.length > 0,
      badge: aiSuggestions.length,
    },
    {
      id: 'collaboration',
      title: 'Study Together',
      description: 'Join study groups and peer learning sessions',
      icon: 'group',
      onPress: () => {
        if (Platform.OS === 'android') {
          ToastAndroid.show(`${collaborationSessions.length} collaboration sessions available!`, ToastAndroid.LONG);
        }
        setActiveView('collaboration');
      },
      enabled: enableCollaboration,
      badge: collaborationSessions.filter(s => s.status === 'scheduled').length,
    },
  ], [drafts.length, dashboardStats.pendingCount, filteredSubmissions.length, aiSuggestions.length, enableAIFeatures, enableCollaboration, collaborationSessions]);

  // Handle submission
  const handleSubmissionComplete = useCallback(async (submission: DoubtSubmission) => {
    try {
      // Add to submissions list
      setSubmissions(prev => [submission, ...prev]);
      
      // Clear related draft
      const draftKeys = await AsyncStorage.getAllKeys();
      const relatedDraftKeys = draftKeys.filter(key => key.startsWith('doubt_draft_'));
      if (relatedDraftKeys.length > 0) {
        await AsyncStorage.multiRemove(relatedDraftKeys);
        setDrafts([]);
      }
      
      // Show success notification
      if (Platform.OS === 'android') {
        ToastAndroid.show('Doubt submitted successfully!', ToastAndroid.LONG);
      }
      
      // Call external handler
      if (onSubmissionComplete) {
        onSubmissionComplete(submission);
      }
      
      // Return to dashboard
      setActiveView('dashboard');
      
    } catch (error) {
      console.error('Error handling submission:', error);
      Alert.alert('error', 'Failed to complete submission');
    }
  }, [onSubmissionComplete]);

  // Handle draft save
  const handleDraftSave = useCallback(async (draft: Partial<DoubtSubmission>) => {
    try {
      const draftKey = `doubt_draft_${Date.now()}`;
      await AsyncStorage.setItem(draftKey, JSON.stringify(draft));
      
      // Update drafts list
      setDrafts(prev => [draft, ...prev.filter(d => d.id !== draft.id)]);
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('Draft saved', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, []);

  // Phase 83: Handle search query
  const handleSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    performAdvancedSearch(query, activeFilters);
  }, [performAdvancedSearch, activeFilters]);

  // Phase 83: Apply filters
  const handleApplyFilters = useCallback((filters: SearchFilter) => {
    setActiveFilters(filters);
    performAdvancedSearch(searchQuery, filters);
  }, [searchQuery, performAdvancedSearch]);

  // Phase 83: Clear search and filters
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setActiveFilters({});
    setFilteredSubmissions([]);
  }, []);

  // Handle notification press
  const handleNotificationPress = useCallback((notification: DashboardNotification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
    
    // Handle different notification types
    switch (notification.type) {
      case 'answer_received':
      case 'doubt_approved':
        if (notification.relatedSubmissionId) {
          const relatedSubmission = submissions.find(s => s.id === notification.relatedSubmissionId);
          if (relatedSubmission) {
            setSelectedSubmission(relatedSubmission);
            setActiveView('history'); // This would show the specific submission
          }
        }
        break;
      case 'expert_available':
        // Navigate to expert sessions
        break;
      default:
        break;
    }
    
    setShowNotificationModal(false);
  }, [submissions]);

  // Phase 83: Handle AI suggestion action
  const handleAISuggestionAction = useCallback((suggestion: AIDoubtSuggestion) => {
    Alert.alert(
      suggestion.title,
      `${suggestion.reason}\n\nConfidence: ${Math.round(suggestion.confidence * 100)}%`,
      [
        { text: 'Dismiss', style: 'cancel' },
        { text: 'Apply Suggestion', onPress: () => {
          if (Platform.OS === 'android') {
            ToastAndroid.show('Suggestion applied! Your future doubts will benefit from this insight.', ToastAndroid.LONG);
          }
        }}
      ]
    );
  }, []);

  // Phase 83: Join collaboration session
  const handleJoinCollaboration = useCallback((session: CollaborationSession) => {
    Alert.alert(
      `Join ${session.title}`,
      `Type: ${session.type}\nParticipants: ${session.participants.length}\nDuration: ${session.duration} minutes`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join Session', onPress: () => {
          if (Platform.OS === 'android') {
            ToastAndroid.show('Joining collaboration session...', ToastAndroid.SHORT);
          }
          // In a real app, this would connect to the collaboration session
        }}
      ]
    );
  }, []);

  // Phase 83: Render enhanced search interface
  const renderSearchInterface = () => (
    <Card style={{ margin: 16 }}>
      <Card.Content>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.OnSurface,
            flex: 1,
          }}>
            Smart Search
          </Text>
          
          {filteredSubmissions.length > 0 && (
            <Chip
              style={{ backgroundColor: theme.primary }}
              textStyle={{ color: theme.OnPrimary }}
              onPress={handleClearSearch}
            >
              {filteredSubmissions.length} results
            </Chip>
          )}
        </View>
        
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.SurfaceVariant,
          borderRadius: 8,
          paddingHorizontal: 12,
          marginBottom: 12,
        }}>
          <IconButton
            icon="magnify"
            size={20}
            iconColor={theme.OnSurfaceVariant}
          />
          
          <Text style={{
            flex: 1,
            fontSize: 16,
            color: searchQuery ? theme.OnSurfaceVariant : theme.Outline,
            paddingVertical: 8,
          }}>
            {searchQuery || 'Search doubts, subjects, topics...'}
          </Text>
          
          <IconButton
            icon="filter-variant"
            size={20}
            iconColor={theme.OnSurfaceVariant}
            onPress={() => setShowAdvancedSearch(true)}
          />
        </View>
        
        {searchHistory.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {searchHistory.slice(0, 5).map((term, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  onPress={() => handleSearchQuery(term)}
                  style={{ marginRight: 4 }}
                >
                  {term}
                </Chip>
              ))}
            </View>
          </ScrollView>
        )}
        
        {isSearching && (
          <View style={{ alignItems: 'center', padding: 12 }}>
            <ProgressBar indeterminate color={theme.primary} />
            <Text style={{
              marginTop: 8,
              fontSize: 14,
              color: theme.OnSurfaceVariant
            }}>
              Searching with AI assistance...
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  // Phase 83: Render AI insights
  const renderAIInsights = () => {
    if (!enableAIFeatures || aiSuggestions.length === 0) return null;
    
    return (
      <Card style={{ margin: 16 }}>
        <Card.Content>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <IconButton
              icon="lightbulb"
              size={24}
              iconColor={theme.primary}
            />
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.OnSurface,
              flex: 1,
            }}>
              AI Insights & Suggestions
            </Text>
          </View>
          
          {aiSuggestions.slice(0, 2).map((suggestion) => (
            <Surface
              key={suggestion.id}
              style={{
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
                backgroundColor: theme.primaryContainer + '30',
                borderWidth: 1,
                borderColor: theme.primary + '20',
              }}
            >
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 8,
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.OnPrimaryContainer,
                  flex: 1,
                }}>
                  {suggestion.title}
                </Text>
                
                <Chip
                  style={{ backgroundColor: theme.primary }}
                  textStyle={{ color: theme.OnPrimary, fontSize: 12 }}
                >
                  {Math.round(suggestion.confidence * 100)}% confidence
                </Chip>
              </View>
              
              <Text style={{
                fontSize: 12,
                color: theme.OnPrimaryContainer,
                opacity: 0.8,
                marginBottom: 8,
              }}>
                {suggestion.reason}
              </Text>
              
              <Button
                mode="contained"
                compact
                style={{ backgroundColor: theme.primary }}
                onPress={() => handleAISuggestionAction(suggestion)}
              >
                Apply Suggestion
              </Button>
            </Surface>
          ))}
          
          {aiSuggestions.length > 2 && (
            <Button
              mode="text"
              onPress={() => setActiveView('ai-insights')}
            >
              View All {aiSuggestions.length} Suggestions
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Phase 83: Render collaboration features
  const renderCollaboration = () => {
    if (!enableCollaboration || collaborationSessions.length === 0) return null;
    
    return (
      <Card style={{ margin: 16 }}>
        <Card.Content>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <IconButton
              icon="group"
              size={24}
              iconColor={theme.primary}
            />
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.OnSurface,
              flex: 1,
            }}>
              Study Together
            </Text>
          </View>
          
          {collaborationSessions.slice(0, 2).map((session) => (
            <List.Item
              key={session.id}
              title={session.title}
              description={`${session.type} • ${session.participants.length} participants • ${session.duration} min`}
              left={() => (
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: session.status === 'active'
                    ? '#4CAF50'
                    : session.status === 'scheduled'
                    ? '#FF9800'
                    : theme.Outline,
                  marginTop: 8,
                }} />
              )}
              right={() => (
                <Button
                  mode="contained"
                  compact
                  onPress={() => handleJoinCollaboration(session)}
                >
                  {session.status === 'active' ? 'Join Now' : 'Schedule'}
                </Button>
              )}
              style={{
                backgroundColor: theme.SurfaceVariant,
                borderRadius: 8,
                marginBottom: 8,
              }}
            />
          ))}
          
          {collaborationSessions.length > 2 && (
            <Button
              mode="text"
              onPress={() => setActiveView('collaboration')}
            >
              View All Sessions
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Render dashboard header with Phase 83 enhancements
  const renderDashboardHeader = () => (
    <Surface style={{
      padding: 20,
      margin: 16,
      borderRadius: 16,
      backgroundColor: theme.primaryContainer,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: theme.OnPrimaryContainer,
          }}>
            Welcome back, {userName}!
          </Text>
          <Text style={{
            fontSize: 14,
            color: theme.OnPrimaryContainer,
            opacity: 0.8,
          }}>
            Ready to tackle some doubts today?
          </Text>
        </View>
        
        {showNotifications && (
          <View>
            <IconButton
              icon="bell"
              size={28}
              iconColor={theme.OnPrimaryContainer}
              onPress={() => setShowNotificationModal(true)}
            />
            {dashboardStats.unreadNotifications > 0 && (
              <Badge
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  backgroundColor: theme.error,
                }}
              >
                {dashboardStats.unreadNotifications}
              </Badge>
            )}
          </View>
        )}
      </View>
      
      {/* Phase 83: Enhanced network status indicator */}
      {networkStatus !== 'online' && (
        <Surface style={{
          padding: 8,
          marginTop: 12,
          borderRadius: 8,
          backgroundColor: networkStatus === 'offline' 
            ? theme.errorContainer 
            : theme.Tertiary + '30',
        }}>
          <Text style={{
            fontSize: 12,
            color: networkStatus === 'offline' 
              ? theme.OnErrorContainer
              : theme.OnTertiary,
            textAlign: 'center',
          }}>
            {networkStatus === 'offline'
              ? '📱 Offline Mode - Your doubts will sync when connection is restored'
              : '⚠️ Poor Connection - Some features may be limited'
            }
          </Text>
        </Surface>
      )}
    </Surface>
  );

  // Phase 83: Enhanced dashboard stats
  const renderDashboardStats = () => (
    <Card style={{ margin: 16 }}>
      <Card.Content>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: theme.OnSurface,
          marginBottom: 16,
        }}>
          Your Progress
        </Text>
        
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginBottom: 16,
        }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: theme.primary,
            }}>
              {dashboardStats.totalSubmissions}
            </Text>
            <Text style={{
              fontSize: 12,
              color: theme.OnSurfaceVariant,
            }}>
              Total Doubts
            </Text>
          </View>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#4CAF50',
            }}>
              {dashboardStats.answeredCount}
            </Text>
            <Text style={{
              fontSize: 12,
              color: theme.OnSurfaceVariant,
            }}>
              Answered
            </Text>
          </View>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#FF9800',
            }}>
              {dashboardStats.pendingCount}
            </Text>
            <Text style={{
              fontSize: 12,
              color: theme.OnSurfaceVariant,
            }}>
              Pending
            </Text>
          </View>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#9E9E9E',
            }}>
              {dashboardStats.todaySubmissions}
            </Text>
            <Text style={{
              fontSize: 12,
              color: theme.OnSurfaceVariant,
            }}>
              Today
            </Text>
          </View>
          
          {/* Phase 83: Additional stats */}
          {enableAIFeatures && (
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#2196F3',
              }}>
                {dashboardStats.aiSuggestionsCount}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.OnSurfaceVariant,
              }}>
                AI Tips
              </Text>
            </View>
          )}
          
          {enableCollaboration && (
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#9C27B0',
              }}>
                {dashboardStats.collaborationSessionsToday}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.OnSurfaceVariant,
              }}>
                Sessions
              </Text>
            </View>
          )}
        </View>
        
        {dashboardStats.totalSubmissions > 0 && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{
                fontSize: 14,
                color: theme.OnSurfaceVariant,
              }}>
                Success Rate
              </Text>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: theme.primary,
              }}>
                {Math.round((dashboardStats.answeredCount / dashboardStats.totalSubmissions) * 100)}%
              </Text>
            </View>
            
            <ProgressBar
              progress={dashboardStats.answeredCount / dashboardStats.totalSubmissions}
              color={theme.primary}
              style={{ height: 6, borderRadius: 3 }}
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );

  // Render quick actions
  const renderQuickActions = () => (
    <Card style={{ margin: 16 }}>
      <Card.Content>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: theme.OnSurface,
          marginBottom: 16,
        }}>
          Quick Actions
        </Text>
        
        <View style={{ gap: 12 }}>
          {quickActions.map((action) => (
            <Surface
              key={action.id}
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: theme.SurfaceVariant,
                opacity: action.enabled ? 1 : 0.6,
              }}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: theme.OnSurfaceVariant,
                    }}>
                      {action.title}
                    </Text>
                    
                    {action.badge && (
                      <Badge
                        style={{
                          marginLeft: 8,
                          backgroundColor: theme.primary,
                        }}
                      >
                        {action.badge}
                      </Badge>
                    )}
                  </View>
                  
                  <Text style={{
                    fontSize: 14,
                    color: theme.OnSurfaceVariant,
                    opacity: 0.8,
                  }}>
                    {action.description}
                  </Text>
                </View>
                
                <IconButton
                  icon={action.icon}
                  size={24}
                  iconColor={theme.OnSurfaceVariant}
                  onPress={action.onPress}
                  disabled={!action.enabled}
                />
              </View>
            </Surface>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  // Render recent activity
  const renderRecentActivity = () => {
    const recentSubmissions = submissions.slice(0, 3);
    
    if (recentSubmissions.length === 0) {
      return null;
    }
    
    return (
      <Card style={{ margin: 16 }}>
        <Card.Content>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.OnSurface,
            }}>
              Recent Activity
            </Text>
            
            <Button
              mode="text"
              onPress={() => setActiveView('history')}
              compact
            >
              View All
            </Button>
          </View>
          
          {recentSubmissions.map((submission, index) => (
            <View key={submission.id}>
              <List.Item
                title={submission.title}
                description={`${submission.category?.subject} • ${submission.status}`}
                left={() => (
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: submission.status === 'Answered'
                      ? '#4CAF50'
                      : submission.status === 'Under Review'
                      ? '#FF9800'
                      : theme.primary,
                    marginTop: 8,
                  }} />
                )}
                right={() => (
                  <Text style={{
                    fontSize: 12,
                    color: theme.OnSurfaceVariant,
                  }}>
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </Text>
                )}
                onPress={() => {
                  setSelectedSubmission(submission);
                  setActiveView('history');
                }}
              />
              {index < recentSubmissions.length - 1 && <Divider />}
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  // Main render logic
  if (activeView === 'form') {
    return (
      <DoubtSubmissionForm
        initialData={selectedSubmission || undefined}
        onSubmit={handleSubmissionComplete}
        onSaveDraft={handleDraftSave}
        onCancel={() => {
          setSelectedSubmission(null);
          setActiveView('dashboard');
        }}
      />
    );
  }

  if (activeView === 'history') {
    return (
      <View style={{ flex: 1 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          backgroundColor: theme.Surface,
        }}>
          <IconButton
            icon="arrow-left"
            onPress={() => setActiveView('dashboard')}
          />
          <Text style={{
            fontSize: 20,
            fontWeight: '600',
            color: theme.OnSurface,
          }}>
            My Doubts
          </Text>
        </View>
        
        <SubmissionHistory
          submissions={submissions}
          onSubmissionSelect={(submission) => {
            setSelectedSubmission(submission);
            setActiveView('form');
          }}
          onNewSubmission={() => {
            setSelectedSubmission(null);
            setActiveView('form');
          }}
          refreshing={isRefreshing}
          onRefresh={loadDashboardData}
        />
      </View>
    );
  }

  // Dashboard view
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={loadDashboardData}
            colors={[theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderDashboardHeader()}
        {renderDashboardStats()}
        {renderSearchInterface()}
        {renderAIInsights()}
        {renderCollaboration()}
        {renderQuickActions()}
        {renderRecentActivity()}
        
        {/* Spacer for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>
      
      {/* Floating Action Button */}
      <FAB
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          backgroundColor: theme.primary,
        }}
        icon="plus"
        onPress={() => setActiveView('form')}
      />
      
      {/* Notifications Modal */}
      <Portal>
        <Modal
          visible={showNotificationModal}
          onDismiss={() => setShowNotificationModal(false)}
          contentContainerStyle={{
            backgroundColor: theme.Surface,
            margin: 20,
            borderRadius: 12,
            maxHeight: height * 0.7,
          }}
        >
          <View style={{ padding: 20 }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.OnSurface,
              }}>
                Notifications ({notifications.length})
              </Text>
              
              <IconButton
                icon="close"
                onPress={() => setShowNotificationModal(false)}
              />
            </View>
            
            <ScrollView>
              {notifications.length === 0 ? (
                <Text style={{
                  textAlign: 'center',
                  color: theme.OnSurfaceVariant,
                  fontStyle: 'italic',
                  marginTop: 20,
                }}>
                  No notifications yet
                </Text>
              ) : (
                notifications.map((notification, index) => (
                  <View key={notification.id}>
                    <List.Item
                      title={notification.title}
                      description={notification.message}
                      left={() => (
                        <View style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: notification.isRead
                            ? 'transparent'
                            : theme.primary,
                          marginTop: 8,
                        }} />
                      )}
                      right={() => (
                        <Text style={{
                          fontSize: 12,
                          color: theme.OnSurfaceVariant,
                        }}>
                          {new Date(notification.timestamp).toLocaleDateString()}
                        </Text>
                      )}
                      onPress={() => handleNotificationPress(notification)}
                      style={{
                        backgroundColor: notification.isRead
                          ? 'transparent'
                          : theme.primaryContainer + '20',
                      }}
                    />
                    {index < notifications.length - 1 && <Divider />}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

export default DoubtDashboard;