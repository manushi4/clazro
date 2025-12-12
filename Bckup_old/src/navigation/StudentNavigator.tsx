/**
 * Student Navigation - Clean 5-Tab Structure
 * Bottom tab navigator with nested stacks
 * Tabs: Home, Study, Ask, Progress, Profile
 * Updated: 2025-01-27 (Cleanup Phase 5)
 */

import React, { useEffect } from 'react';
import { TouchableOpacity, BackHandler } from 'react-native';
import { NavigationContainer, useNavigation, useNavigationState } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

// ==========================================
// SCREEN IMPORTS - Organized by Tab
// ==========================================

// Home Tab Screens
import NewStudentDashboard from '../screens/student/NewStudentDashboard';
import NewEnhancedSchedule from '../screens/student/NewEnhancedSchedule';
import NewActivityDetail from '../screens/student/NewActivityDetail';
import NotificationsScreen from '../screens/student/NotificationsScreen';
import ClassFeedScreen from '../screens/student/ClassFeedScreen';
import NewClassDetailScreen from '../screens/student/NewClassDetailScreen';
import NewEnhancedLiveClass from '../screens/student/NewEnhancedLiveClass';
import NewInteractiveClassroom from '../screens/student/NewInteractiveClassroom';
import ClassChat from '../screens/student/ClassChat';
import ClassNotes from '../screens/student/ClassNotes';
import Whiteboard from '../screens/student/Whiteboard';

// Study Tab Screens
import StudyHomeScreen from '../screens/student/StudyHomeScreen';
import NewStudyLibraryScreen from '../screens/student/NewStudyLibraryScreen';
import CourseRoadmapScreen from '../screens/student/CourseRoadmapScreen';
import ChapterDetailScreen from '../screens/student/ChapterDetailScreen';
import ResourceDetailScreen from '../screens/student/ResourceDetailScreen';
import ResourceViewerScreen from '../screens/student/ResourceViewerScreen';
import PlaylistsView from '../screens/student/PlaylistsView';
import PlaylistDetailScreen from '../screens/student/PlaylistDetailScreen';
import AddToPlaylistModal from '../screens/student/AddToPlaylistModal';
import AssignmentsHomeScreen from '../screens/student/AssignmentsHomeScreen';
import AssignmentsList from '../screens/student/AssignmentsList';
import NewAssignmentDetailScreen from '../screens/student/NewAssignmentDetailScreen';
import NewCollaborativeAssignment from '../screens/student/NewCollaborativeAssignment';
import TaskHubScreen from '../screens/student/TaskHubScreen';
import TaskDetailScreen from '../screens/student/TaskDetailScreen';
import GuidedStudySessionScreen from '../screens/student/GuidedStudySessionScreen';
import TestCenterScreen from '../screens/student/TestCenterScreen';
import TestAttemptScreen from '../screens/student/TestAttemptScreen';
import TestReviewScreen from '../screens/student/TestReviewScreen';
import NewAILearningDashboard from '../screens/student/NewAILearningDashboard';
import NewEnhancedAIStudy from '../screens/student/NewEnhancedAIStudy';
import NewAITutorChat from '../screens/student/NewAITutorChat';
import AIPracticeProblems from '../screens/student/AIPracticeProblems';
import PracticeProblemDetail from '../screens/student/PracticeProblemDetail';
import AIStudySummaries from '../screens/student/AIStudySummaries';
import SummaryDetail from '../screens/student/SummaryDetail';
import NotesAndHighlightsScreen from '../screens/NotesAndHighlightsScreen';
import NoteDetailScreen from '../screens/NoteDetailScreen';
import DownloadsManagerScreen from '../screens/student/DownloadsManagerScreen';

// Ask Tab Screens
import DoubtsHomeScreen from '../screens/student/DoubtsHomeScreen';
import NewSimpleDoubt from '../screens/student/NewSimpleDoubt';
import NewDoubtSubmission from '../screens/student/NewDoubtSubmission';
import DoubtDetailScreen from '../screens/student/DoubtDetailScreen';
import DoubtsExploreScreen from '../screens/student/DoubtsExploreScreen';

// Progress Tab Screens
import NewProgressDetailScreen from '../screens/student/NewProgressDetailScreen';
import GlobalAnalyticsScreen from '../screens/student/GlobalAnalyticsScreen';
import SubjectAnalyticsScreen from '../screens/student/SubjectAnalyticsScreen';
import NewGamifiedLearningHub from '../screens/student/NewGamifiedLearningHub';
import QuestsScreen from '../screens/student/QuestsScreen';
import QuestDetailScreen from '../screens/student/QuestDetailScreen';
import LeaderboardScreen from '../screens/student/LeaderboardScreen';
import ShareProgressReportScreen from '../screens/student/ShareProgressReportScreen';

// Profile Tab Screens
import StudentProfileScreen from '../screens/student/StudentProfileScreen';
import StudentOnboardingFlow from '../screens/student/StudentOnboardingFlow';
import EditOnboardingScreen from '../screens/student/EditOnboardingScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import HelpFeedbackScreen from '../screens/common/HelpFeedbackScreen';
import LegalScreen from '../screens/student/LegalScreen';
import NewPeerLearningNetwork from '../screens/student/NewPeerLearningNetwork';
import PeerDetail from '../screens/student/PeerDetail';
import PeerChatScreen from '../screens/student/PeerChatScreen';
import StudyGroupDetailScreen from '../screens/student/StudyGroupDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ==========================================
// HOME STACK (16 screens)
// Root: NewStudentDashboard
// Purpose: Dashboard, daily schedule, live classes
// ==========================================
function HomeStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="NewStudentDashboard"
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="NewStudentDashboard"
        component={NewStudentDashboard}
        options={{ headerShown: false, title: 'Dashboard' }}
      />
      <Stack.Screen
        name="NewEnhancedSchedule"
        component={NewEnhancedSchedule}
        options={{ headerShown: false, title: 'Schedule' }}
      />
      <Stack.Screen
        name="NewActivityDetail"
        component={NewActivityDetail}
        options={{ headerShown: false, title: 'Activity' }}
      />
      <Stack.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
        options={{ headerShown: false, title: 'Notifications' }}
      />
      <Stack.Screen
        name="ClassFeedScreen"
        component={ClassFeedScreen}
        options={{ headerShown: false, title: 'Class Feed' }}
      />
      <Stack.Screen
        name="NewClassDetailScreen"
        component={NewClassDetailScreen}
        options={{ headerShown: false, title: 'Class Details' }}
      />
      <Stack.Screen
        name="NewEnhancedLiveClass"
        component={NewEnhancedLiveClass}
        options={{ headerShown: false, title: 'Live Class' }}
      />
      <Stack.Screen
        name="NewInteractiveClassroom"
        component={NewInteractiveClassroom}
        options={{ headerShown: false, title: 'Interactive Class' }}
      />
      <Stack.Screen
        name="ClassChat"
        component={ClassChat}
        options={{ headerShown: false, title: 'Class Chat' }}
      />
      <Stack.Screen
        name="ClassNotes"
        component={ClassNotes}
        options={{ headerShown: false, title: 'Class Notes' }}
      />
      <Stack.Screen
        name="Whiteboard"
        component={Whiteboard}
        options={{ headerShown: false, title: 'Whiteboard' }}
      />
      {/* Cross-stack screens accessible from Home */}
      <Stack.Screen
        name="PeerChatScreen"
        component={PeerChatScreen}
        options={{ headerShown: false, title: 'Peer Chat' }}
      />
      <Stack.Screen
        name="DoubtDetailScreen"
        component={DoubtDetailScreen}
        options={{ headerShown: false, title: 'Doubt Details' }}
      />
      <Stack.Screen
        name="ResourceViewerScreen"
        component={ResourceViewerScreen}
        options={{ headerShown: false, title: 'Resource Viewer' }}
      />
      <Stack.Screen
        name="PlaylistDetail"
        component={PlaylistDetailScreen}
        options={{ headerShown: false, title: 'Playlist' }}
      />
      <Stack.Screen
        name="NewAITutorChat"
        component={NewAITutorChat}
        options={{ headerShown: false, title: 'AI Tutor' }}
      />
    </Stack.Navigator>
  );
}

// ==========================================
// STUDY STACK (32 screens)
// Root: StudyHomeScreen
// Purpose: All learning activities - library, assignments, tests, AI practice
// ==========================================
function StudyStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="StudyHomeScreen"
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
        headerShadowVisible: false,
      }}
    >
      {/* Root Screen */}
      <Stack.Screen
        name="StudyHomeScreen"
        component={StudyHomeScreen}
        options={{ headerShown: false, title: 'Study' }}
      />

      {/* Library & Resources (8) */}
      <Stack.Screen
        name="NewStudyLibraryScreen"
        component={NewStudyLibraryScreen}
        options={{ headerShown: false, title: 'Study Library' }}
      />
      <Stack.Screen
        name="CourseRoadmapScreen"
        component={CourseRoadmapScreen}
        options={{ headerShown: false, title: 'Course Roadmap' }}
      />
      <Stack.Screen
        name="ChapterDetailScreen"
        component={ChapterDetailScreen}
        options={{ headerShown: false, title: 'Chapter Detail' }}
      />
      <Stack.Screen
        name="ResourceDetailScreen"
        component={ResourceDetailScreen}
        options={{ headerShown: false, title: 'Resource Detail' }}
      />
      <Stack.Screen
        name="ResourceViewerScreen"
        component={ResourceViewerScreen}
        options={{ headerShown: false, title: 'Resource Viewer' }}
      />
      <Stack.Screen
        name="PlaylistsView"
        component={PlaylistsView}
        options={{ headerShown: false, title: 'Playlists' }}
      />
      <Stack.Screen
        name="PlaylistDetail"
        component={PlaylistDetailScreen}
        options={{ headerShown: false, title: 'Playlist Details' }}
      />
      <Stack.Screen
        name="AddToPlaylistModal"
        component={AddToPlaylistModal}
        options={{ headerShown: false, title: 'Add to Playlist', presentation: 'modal' }}
      />

      {/* Assignments & Tasks (7) */}
      <Stack.Screen
        name="AssignmentsHomeScreen"
        component={AssignmentsHomeScreen}
        options={{ headerShown: false, title: 'Assignments' }}
      />
      <Stack.Screen
        name="AssignmentsList"
        component={AssignmentsList}
        options={{ headerShown: false, title: 'Assignments List' }}
      />
      <Stack.Screen
        name="NewAssignmentDetailScreen"
        component={NewAssignmentDetailScreen}
        options={{ headerShown: false, title: 'Assignment' }}
      />
      <Stack.Screen
        name="NewCollaborativeAssignment"
        component={NewCollaborativeAssignment}
        options={{ headerShown: false, title: 'Collaborative Work' }}
      />
      <Stack.Screen
        name="TaskHubScreen"
        component={TaskHubScreen}
        options={{ headerShown: false, title: 'Task Hub' }}
      />
      <Stack.Screen
        name="TaskDetailScreen"
        component={TaskDetailScreen}
        options={{ headerShown: false, title: 'Task Details' }}
      />
      <Stack.Screen
        name="GuidedStudySessionScreen"
        component={GuidedStudySessionScreen}
        options={{ headerShown: false, title: 'Study Session' }}
      />

      {/* Tests (3) */}
      <Stack.Screen
        name="TestCenterScreen"
        component={TestCenterScreen}
        options={{ headerShown: false, title: 'Test Center' }}
      />
      <Stack.Screen
        name="TestAttemptScreen"
        component={TestAttemptScreen}
        options={{ headerShown: false, title: 'Test' }}
      />
      <Stack.Screen
        name="TestReviewScreen"
        component={TestReviewScreen}
        options={{ headerShown: false, title: 'Test Review' }}
      />

      {/* AI Learning (8) */}
      <Stack.Screen
        name="NewAILearningDashboard"
        component={NewAILearningDashboard}
        options={{ headerShown: false, title: 'AI Learning' }}
      />
      <Stack.Screen
        name="NewEnhancedAIStudy"
        component={NewEnhancedAIStudy}
        options={{ headerShown: false, title: 'AI Study' }}
      />
      <Stack.Screen
        name="NewAITutorChat"
        component={NewAITutorChat}
        options={{ headerShown: false, title: 'AI Tutor' }}
      />
      <Stack.Screen
        name="AIPracticeProblems"
        component={AIPracticeProblems}
        options={{ headerShown: false, title: 'AI Practice' }}
      />
      <Stack.Screen
        name="PracticeProblemDetail"
        component={PracticeProblemDetail}
        options={{ headerShown: false, title: 'Practice Problem' }}
      />
      <Stack.Screen
        name="AIStudySummaries"
        component={AIStudySummaries}
        options={{ headerShown: false, title: 'AI Summaries' }}
      />
      <Stack.Screen
        name="SummaryDetail"
        component={SummaryDetail}
        options={{ headerShown: false, title: 'Summary' }}
      />

      {/* Notes & Downloads (4) */}
      <Stack.Screen
        name="NotesAndHighlightsScreen"
        component={NotesAndHighlightsScreen}
        options={{ headerShown: false, title: 'Notes & Highlights' }}
      />
      <Stack.Screen
        name="NoteDetailScreen"
        component={NoteDetailScreen}
        options={{ headerShown: false, title: 'Note Detail' }}
      />
      <Stack.Screen
        name="DownloadsManagerScreen"
        component={DownloadsManagerScreen}
        options={{ headerShown: false, title: 'Downloads' }}
      />
    </Stack.Navigator>
  );
}

// ==========================================
// ASK STACK (7 screens)
// Root: DoubtsHomeScreen
// Purpose: Ask doubts, AI tutor help, explore solved doubts
// ==========================================
function AskStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="DoubtsHomeScreen"
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="DoubtsHomeScreen"
        component={DoubtsHomeScreen}
        options={{ headerShown: false, title: 'My Doubts' }}
      />
      <Stack.Screen
        name="NewSimpleDoubt"
        component={NewSimpleDoubt}
        options={{ headerShown: false, title: 'Quick Doubt' }}
      />
      <Stack.Screen
        name="NewDoubtSubmission"
        component={NewDoubtSubmission}
        options={{ headerShown: false, title: 'Submit Doubt' }}
      />
      <Stack.Screen
        name="DoubtDetailScreen"
        component={DoubtDetailScreen}
        options={{ headerShown: false, title: 'Doubt Details' }}
      />
      <Stack.Screen
        name="DoubtsExploreScreen"
        component={DoubtsExploreScreen}
        options={{ headerShown: false, title: 'Explore Doubts' }}
      />
      <Stack.Screen
        name="NewAITutorChat"
        component={NewAITutorChat}
        options={{ headerShown: false, title: 'AI Tutor' }}
      />
    </Stack.Navigator>
  );
}

// ==========================================
// PROGRESS STACK (8 screens)
// Root: NewProgressDetailScreen
// Purpose: Track progress, analytics, gamification
// ==========================================
function ProgressStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="NewProgressDetailScreen"
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="NewProgressDetailScreen"
        component={NewProgressDetailScreen}
        options={{ headerShown: false, title: 'My Progress' }}
      />
      <Stack.Screen
        name="GlobalAnalyticsScreen"
        component={GlobalAnalyticsScreen}
        options={{ headerShown: false, title: 'Analytics' }}
      />
      <Stack.Screen
        name="SubjectAnalyticsScreen"
        component={SubjectAnalyticsScreen}
        options={{ headerShown: false, title: 'Subject Analytics' }}
      />
      <Stack.Screen
        name="NewGamifiedLearningHub"
        component={NewGamifiedLearningHub}
        options={{ headerShown: false, title: 'Learning Hub' }}
      />
      <Stack.Screen
        name="QuestsScreen"
        component={QuestsScreen}
        options={{ headerShown: false, title: 'Quests' }}
      />
      <Stack.Screen
        name="QuestDetailScreen"
        component={QuestDetailScreen}
        options={{ headerShown: false, title: 'Quest Details' }}
      />
      <Stack.Screen
        name="LeaderboardScreen"
        component={LeaderboardScreen}
        options={{ headerShown: false, title: 'Leaderboard' }}
      />
      <Stack.Screen
        name="ShareProgressReportScreen"
        component={ShareProgressReportScreen}
        options={{ headerShown: false, title: 'Share Progress' }}
      />
    </Stack.Navigator>
  );
}

// ==========================================
// PROFILE STACK (11 screens)
// Root: StudentProfileScreen
// Purpose: Profile, settings, peer connections, study groups
// ==========================================
function ProfileStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="StudentProfileScreen"
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
        headerShadowVisible: false,
      }}
    >
      {/* Profile & Settings (6) */}
      <Stack.Screen
        name="StudentProfileScreen"
        component={StudentProfileScreen}
        options={{ headerShown: false, title: 'Profile' }}
      />
      <Stack.Screen
        name="StudentOnboardingFlow"
        component={StudentOnboardingFlow}
        options={{ headerShown: false, title: 'Onboarding' }}
      />
      <Stack.Screen
        name="EditOnboardingScreen"
        component={EditOnboardingScreen}
        options={{ headerShown: false, title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ headerShown: false, title: 'Settings' }}
      />
      <Stack.Screen
        name="HelpAndSupportScreen"
        component={HelpFeedbackScreen}
        options={{ headerShown: false, title: 'Help & Support' }}
      />
      <Stack.Screen
        name="LegalScreen"
        component={LegalScreen}
        options={{ headerShown: false, title: 'Legal' }}
      />

      {/* Peer & Groups (5) */}
      <Stack.Screen
        name="NewPeerLearningNetwork"
        component={NewPeerLearningNetwork}
        options={{ headerShown: false, title: 'Peer Network' }}
      />
      <Stack.Screen
        name="PeerDetail"
        component={PeerDetail}
        options={{ headerShown: false, title: 'Peer Profile' }}
      />
      <Stack.Screen
        name="PeerChatScreen"
        component={PeerChatScreen}
        options={{ headerShown: false, title: 'Chat' }}
      />
      <Stack.Screen
        name="StudyGroupDetailScreen"
        component={StudyGroupDetailScreen}
        options={{ headerShown: false, title: 'Study Group' }}
      />
    </Stack.Navigator>
  );
}

// ==========================================
// MAIN TAB NAVIGATOR - 5 TABS
// Home | Study | Ask | Progress | Profile
// ==========================================
function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.OnSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.Surface,
          borderTopColor: theme.Outline,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarButton: (props) => {
          return (
            <TouchableOpacity
              {...props}
              onPress={(e) => {
                if (props.onPress) {
                  props.onPress(e);
                }
              }}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          },
        })}
      />
      <Tab.Screen
        name="Study"
        component={StudyStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="library-books" size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Study' }],
            });
          },
        })}
      />
      <Tab.Screen
        name="Ask"
        component={AskStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="help-outline" size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Ask' }],
            });
          },
        })}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="trending-up" size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Progress' }],
            });
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Profile' }],
            });
          },
        })}
      />
    </Tab.Navigator>
  );
}

// ==========================================
// EXPORT WITH NAVIGATION CONTAINER
// Wrap TabNavigator in NavigationContainer for standalone usage
// ==========================================
export default function StudentNavigator() {
  const navigationRef = React.useRef<any>(null);
  const [currentTab, setCurrentTab] = React.useState<string>('Home');

  useEffect(() => {
    const backAction = () => {
      if (navigationRef.current) {
        const state = navigationRef.current.getRootState();
        if (state) {
          // Get current tab route
          const currentTabRoute = state.routes[state.index];
          const currentTabName = currentTabRoute?.name;
          const currentTabState = currentTabRoute?.state;

          console.log('🔙 [Back Handler] Current tab (state):', currentTabName);
          console.log('🔙 [Back Handler] Tab state full:', JSON.stringify(currentTabState, null, 2));

          // Check if we can go back - use React Navigation's canGoBack
          const canGoBack = navigationRef.current.canGoBack();
          console.log('🔙 [Back Handler] Can go back?', canGoBack);

          if (canGoBack) {
            // There's a screen to go back to
            console.log('🔙 [Back Handler] Going back');
            navigationRef.current.goBack();
            return true;
          }

          // If we can't go back and we're on a non-Home tab, go to Home tab
          if (currentTabName && currentTabName !== 'Home') {
            console.log('🔙 [Back Handler] Going to Home tab');
            navigationRef.current.navigate('Home');
            return true;
          }

          console.log('🔙 [Back Handler] On Home tab root, allowing exit');
        }
      }
      // If on Home tab root, allow default behavior (exit app)
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentTab]);

  const handleStateChange = () => {
    if (navigationRef.current) {
      const state = navigationRef.current.getRootState();
      if (state) {
        const route = state.routes[state.index];
        setCurrentTab(route?.name || 'Home');
      }
    }
  };

  return (
    <NavigationContainer
      independent={true}
      ref={navigationRef}
      onStateChange={handleStateChange}
    >
      <TabNavigator />
    </NavigationContainer>
  );
}
