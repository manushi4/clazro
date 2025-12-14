/**
 * Parent Navigation
 * Bottom tab navigator with nested stacks - CORRECTED VERSION
 * Uses actual existing screen files from migration
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Menu } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useParentDashboard } from '../hooks/useParentDashboard';
import ErrorBoundary from '../components/ErrorBoundary';
import { BottomNavMD3 } from '../theme/bottomNav.md3';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { safeNavigate } from '../utils/navigationService';
import { trackAction } from '../utils/navigationAnalytics';

// ✨ NEW: Global Navigation Components
import { TopAppBar } from '../components/navigation/TopAppBar';
import { NavigationDrawer } from '../components/navigation/NavigationDrawer';
import NotificationsListScreen from '../screens/common/NotificationsListScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import HelpFeedbackScreen from '../screens/common/HelpFeedbackScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import LanguageSelectionScreen from '../screens/common/LanguageSelectionScreen';

// 📦 OLD SCREENS - Keep for now (also backed up in backup/screens/parent/)
// These will be gradually replaced with modern implementations
import EnhancedParentDashboardScreen from '../screens/parent/EnhancedParentDashboardScreen';
import ChildProgressMonitoringScreen from '../screens/parent/ChildProgressMonitoringScreen';
import PerformanceAnalyticsScreen from '../screens/parent/PerformanceAnalyticsScreen';
import AcademicScheduleScreen from '../screens/parent/AcademicScheduleScreen';
import TeacherCommunicationScreen from '../screens/parent/TeacherCommunicationScreen';
import CommunityEngagementScreen from '../screens/parent/CommunityEngagementScreen';
import BillingInvoiceScreen from '../screens/parent/BillingInvoiceScreen';
import PaymentProcessingScreen from '../screens/parent/PaymentProcessingScreen';
import InformationHubScreen from '../screens/parent/InformationHubScreen';

// NEW: Modern dashboard with real Supabase integration
import NewParentDashboard from '../screens/parent/NewParentDashboard';

// NEW: Modern Children Overview (replaces 4 old screens)
import ChildrenOverviewScreen from '../screens/parent/ChildrenOverviewScreen';

// NEW: Modern Messages Overview (replaces TeacherCommunication & CommunityEngagement screens)
import MessagesOverviewScreen from '../screens/parent/MessagesOverviewScreen';

// ✅ PHASE 1: Overview Tab Screens (6 screens)
import ChildDetailScreen from '../screens/parent/ChildDetailScreen';
import ChildrenListScreen from '../screens/parent/ChildrenListScreen';
import ActionItemsScreen from '../screens/parent/ActionItemsScreen';
import ActionItemDetailScreen from '../screens/parent/ActionItemDetailScreen';
import MessagesListScreen from '../screens/parent/MessagesListScreen';
import MessageDetailScreen from '../screens/parent/MessageDetailScreen';

// ✅ PHASE 2: Financial Tab Screens (4 screens)
import PaymentHistoryScreen from '../screens/parent/PaymentHistoryScreen';
import MakePaymentScreen from '../screens/parent/MakePaymentScreen';
import DiscountsScreen from '../screens/parent/DiscountsScreen';
import FeeStructureScreen from '../screens/parent/FeeStructureScreen';

// ✅ PHASE 3: Academic Tab Screens (6 screens)
import SubjectDetailScreen from '../screens/parent/SubjectDetailScreen';
import AssignmentsListScreen from '../screens/parent/AssignmentsListScreen';
import AssignmentDetailScreen from '../screens/parent/AssignmentDetailScreen';
import UpcomingExamsScreen from '../screens/parent/UpcomingExamsScreen';
import AcademicReportsScreen from '../screens/parent/AcademicReportsScreen';
import StudyRecommendationsScreen from '../screens/parent/StudyRecommendationsScreen';

// ✅ PHASE 2B & 3: Detail Screens (Hybrid Approach - MD3 Navigation Cards)
import AcademicsDetailScreen from '../screens/parent/AcademicsDetailScreen';
import BehaviorTrackingScreen from '../screens/parent/BehaviorTrackingScreen';
import GoalsAndMilestonesScreen from '../screens/parent/GoalsAndMilestonesScreen';
import StudentInsightsScreen from '../screens/parent/StudentInsightsScreen';

// ✅ PHASE 4: Communication Tab Screens (5 screens)
import ComposeMessageScreen from '../screens/parent/ComposeMessageScreen';
import ScheduleMeetingScreen from '../screens/parent/ScheduleMeetingScreen';
import TeacherListScreen from '../screens/parent/TeacherListScreen';
import MeetingsHistoryScreen from '../screens/parent/MeetingsHistoryScreen';
import NotificationsScreen from '../screens/parent/NotificationsScreen';

// ✅ PHASE 5: Info Tab Screens (5 screens)
import SchoolCalendarScreen from '../screens/parent/SchoolCalendarScreen';
import SchoolHandbookScreen from '../screens/parent/SchoolHandbookScreen';
import StaffDirectoryScreen from '../screens/parent/StaffDirectoryScreen';
import SchoolPoliciesScreen from '../screens/parent/SchoolPoliciesScreen';
import AnnouncementsScreen from '../screens/parent/AnnouncementsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Error Fallback Component
const ErrorFallback = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.errorContainer, { backgroundColor: theme.Background }]}>
      <Icon name="error-outline" size={64} color={theme.Error} />
      <Text style={[styles.errorTitle, { color: theme.OnSurface }]}>
        Something went wrong
      </Text>
      <Text style={[styles.errorMessage, { color: theme.OnSurfaceVariant }]}>
        We're sorry for the inconvenience. Please try again or contact support if the problem persists.
      </Text>
      <TouchableOpacity
        style={[styles.errorButton, { backgroundColor: theme.Primary }]}
        onPress={() => {
          // In a real app, this would trigger navigation or reload
          console.log('Error fallback - Try Again pressed');
        }}
      >
        <Text style={[styles.errorButtonText, { color: theme.OnPrimary }]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Home Stack (Dashboard)
function HomeStack() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  // ✨ NEW: Drawer state (MD3 modal drawer)
  const [drawerVisible, setDrawerVisible] = React.useState(false);

  // ✨ Navigation ref to pass to drawer
  const navigationRef = React.useRef<any>(null);

  // Get parent ID (fallback to test ID if not authenticated)
  const parentId = (user?.id && typeof user.id === 'string' && user.id !== 'undefined')
    ? user.id
    : '11111111-1111-1111-1111-111111111111';

  // Fetch real dashboard data for notifications count
  const { notifications } = useParentDashboard(parentId);
  const unreadCount = notifications.filter(n => !n.read_at).length;

  // Get profile info for drawer
  const userProfile = {
    name: user?.full_name || 'User',
    email: user?.email || 'user@example.com',
    initials: user?.full_name
      ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
      : 'U',
  };

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          // ✨ MD3-Compliant TopAppBar: ☰ + Title + 🔔 + ⋯
          header: (props) => {
            // Store navigation ref for drawer
            navigationRef.current = props.navigation;

            return (
              <TopAppBar
                title={props.options.title || props.route.name}
                leadingType={props.back !== undefined ? 'back' : 'menu'}
                onLeadingPress={() => {
                  if (props.back !== undefined) {
                    props.navigation.goBack();
                  } else {
                    setDrawerVisible(true); // Open drawer on ☰ tap
                  }
                }}
                notificationCount={unreadCount}
                onNotificationPress={() => props.navigation.navigate('NotificationsList' as any)}
                overflowMenuItems={[
                  {
                    label: 'Profile',
                    icon: 'account',
                    onPress: () => {
                      trackAction('view_profile', 'TopAppBar');
                      safeNavigate('Profile');
                    },
                  },
                  {
                    label: 'Settings',
                    icon: 'cog',
                    onPress: () => {
                      trackAction('view_settings', 'TopAppBar');
                      safeNavigate('Settings');
                    },
                  },
                  {
                    label: 'Help & Feedback',
                    icon: 'help-circle',
                    onPress: () => {
                      trackAction('view_help', 'TopAppBar');
                      safeNavigate('HelpFeedback');
                    },
                  },
                  {
                    label: 'Logout',
                    icon: 'logout',
                    destructive: true,
                    onPress: () => {
                      trackAction('logout_attempt', 'TopAppBar');
                      Alert.alert(
                        'Logout',
                        'Are you sure you want to logout?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Logout',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                console.log('🚪 [TopAppBar] Logging out...');

                                // Clear navigation state to return to role selection
                                await AsyncStorage.removeItem('NAVIGATION_STATE');

                                // Perform logout
                                await logout();

                                console.log('✅ [TopAppBar] Logged out successfully');

                                // The app will automatically show role selection screen
                                // because selectedRole will reset when AuthContext user becomes null
                              } catch (error) {
                                console.error('❌ [TopAppBar] Logout error:', error);
                                Alert.alert('Error', 'Failed to logout. Please try again.');
                              }
                            },
                          },
                        ]
                      );
                    },
                  },
                ]}
              />
            );
          },
        }}
      >
      <Stack.Screen
        name="NewDashboard"
        options={{
          title: 'Dashboard',
        }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <NewParentDashboard {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      {/* 📦 OLD SCREENS - Keep for now (will gradually replace) */}
      <Stack.Screen
        name="Dashboard"
        options={{ headerShown: false, title: 'Dashboard (Old)' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <EnhancedParentDashboardScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="InformationHub"
        options={{ title: 'Information Hub' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <InformationHubScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      {/* ✅ PHASE 1: Overview Tab Screens */}
      <Stack.Screen
        name="ChildDetail"
        options={{ title: 'Child Details' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <ChildDetailScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      {/* ✅ PHASE 2B & 3: Detail Screens (Hybrid Approach - Navigated from ChildDetail) */}
      <Stack.Screen
        name="AcademicsDetail"
        component={AcademicsDetailScreen as any}
        options={{ title: 'Academic Performance' }}
      />
      <Stack.Screen
        name="BehaviorTracking"
        options={{ title: 'Behavior Tracking' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <BehaviorTrackingScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="GoalsAndMilestones"
        options={{ title: 'Goals & Milestones' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <GoalsAndMilestonesScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="StudentInsights"
        options={{ title: 'AI Insights' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <StudentInsightsScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="ChildrenList"
        options={{ title: 'All Children' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <ChildrenListScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      {/* ✅ PHASE 3: Academic Screens (moved from ChildrenStack for navigation from ChildDetail) */}
      <Stack.Screen
        name="SubjectDetail"
        options={{ title: 'Subject Details', headerShown: false }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <SubjectDetailScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="AssignmentsList"
        options={{ title: 'All Assignments' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <AssignmentsListScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="TeacherList"
        options={{ title: 'Teachers' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <TeacherListScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="ActionItems"
        options={{ title: 'Action Items' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <ActionItemsScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="ActionItemDetail"
        options={{ title: 'Action Item Details' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <ActionItemDetailScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="MessagesList"
        options={{ title: 'All Messages' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <MessagesListScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="MessageDetail"
        options={{ title: 'Message Details' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <MessageDetailScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      {/* ✨ NEW: Global Screens */}
      <Stack.Screen
        name="NotificationsList"
        options={{ title: 'Notifications' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <NotificationsListScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Settings"
        options={{ title: 'Settings' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <SettingsScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="HelpFeedback"
        options={{ title: 'Help & Feedback', headerShown: true }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <HelpFeedbackScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Profile"
        options={{ title: 'My Profile' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <ProfileScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="LanguageSelection"
        options={{ title: 'Language' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <LanguageSelectionScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      {/* ✅ PHASE 5: Info Tab Screens */}
      <Stack.Screen
        name="SchoolCalendar"
        options={{ title: 'School Calendar' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <SchoolCalendarScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="SchoolHandbook"
        options={{ title: 'School Handbook' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <SchoolHandbookScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="StaffDirectory"
        options={{ title: 'Staff Directory' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <StaffDirectoryScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="SchoolPolicies"
        options={{ title: 'School Policies' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <SchoolPoliciesScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Announcements"
        options={{ title: 'School Announcements' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <AnnouncementsScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      {/* ✅ Assignment Detail Screen (moved from ChildrenStack) */}
      <Stack.Screen
        name="AssignmentDetail"
        options={{ title: 'Assignment Details' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <AssignmentDetailScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      {/* ✅ Upcoming Exams Screen (moved to HomeStack for navigation from AcademicsDetail) */}
      <Stack.Screen
        name="UpcomingExams"
        component={UpcomingExamsScreen as any}
        options={{ title: 'Upcoming Exams' }}
      />

      {/* ✅ Academic Reports Screen (moved to HomeStack for navigation from AcademicsDetail) */}
      <Stack.Screen
        name="AcademicReports"
        component={AcademicReportsScreen as any}
        options={{ title: "Academic Reports" }}
      />
    </Stack.Navigator>

      {/* ✨ MD3 Modal Navigation Drawer - Exact Ship-Ready Spec */}
      <NavigationDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        userProfile={userProfile}
        navigation={navigationRef.current}
        currentRoute={navigationRef.current?.getCurrentRoute?.()?.name}
        onLogout={async () => {
          try {
            console.log('🚪 [NavigationDrawer] Logging out...');

            // Clear navigation state to return to role selection
            await AsyncStorage.removeItem('NAVIGATION_STATE');

            // Perform logout
            await logout();

            console.log('✅ [NavigationDrawer] Logged out successfully');

            // Close drawer
            setDrawerVisible(false);

            // The app will automatically show role selection screen
            // because selectedRole will reset when AuthContext user becomes null
          } catch (error) {
            console.error('❌ [NavigationDrawer] Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        }}
      />
    </>
  );
}

// Children Progress Stack
function ChildrenStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
      }}
    >
      {/* ✅ NEW: Modern Children Overview Screen */}
      <Stack.Screen
        name="ChildProgress"
        options={{ title: 'Children Overview' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <ChildrenOverviewScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      {/* ✅ Child Detail Screen (navigated from Children Overview) */}
      <Stack.Screen
        name="ChildDetail"
        options={{ title: 'Child Details' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <ChildDetailScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="PerformanceAnalytics"
        options={{ title: 'Performance' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <PerformanceAnalyticsScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="AcademicSchedule"
        options={{ title: 'Schedule' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <AcademicScheduleScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      {/* ✅ PHASE 3: Academic Tab Screens (SubjectDetail, AssignmentsList, TeacherList, AssignmentDetail, UpcomingExams, AcademicReports moved to HomeStack) */}
      {/* <Stack.Screen */}
      {/*   name="AcademicReports" */}
      {/*   options={{ title: 'Academic Reports' }} */}
      {/* > */}
      {/*   {(props) => ( */}
      {/*     <ErrorBoundary fallback={<ErrorFallback />}> */}
      {/*       <AcademicReportsScreen {...props} /> */}
      {/*     </ErrorBoundary> */}
      {/*   )} */}
      {/* </Stack.Screen> */}
      <Stack.Screen
        name="StudyRecommendations"
        options={{ title: 'Study Recommendations' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <StudyRecommendationsScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Communication Stack
function CommunicationStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
      }}
    >
      {/* ✅ NEW: Modern Messages Overview Screen */}
      <Stack.Screen
        name="TeacherCommunication"
        options={{ title: 'Messages & Updates' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <MessagesOverviewScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      {/* 📦 OLD SCREENS - Kept for reference (replaced by MessagesOverviewScreen) */}
      {/* <Stack.Screen
        name="CommunityEngagement"
        options={{ title: 'Community' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <CommunityEngagementScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen> */}

      {/* ✅ PHASE 4: Communication Tab Screens */}
      <Stack.Screen
        name="ComposeMessage"
        options={{ title: 'Compose Message', headerShown: true }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <ComposeMessageScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="ScheduleMeeting"
        options={{ title: 'Schedule Meeting', headerShown: true }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <ScheduleMeetingScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="MeetingsHistory"
        options={{ title: 'Meetings History', headerShown: true }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <MeetingsHistoryScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Notifications"
        options={{ title: 'All Notifications' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <NotificationsScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Billing Stack
function BillingStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
      }}
    >
      {/* 📦 OLD SCREENS - Keep for now (will gradually replace) */}
      <Stack.Screen
        name="BillingInvoice"
        options={{ title: 'Billing & Invoices' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <BillingInvoiceScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="PaymentProcessing"
        options={{ title: 'Make Payment' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <PaymentProcessingScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>

      {/* ✅ PHASE 2: Financial Tab Screens */}
      <Stack.Screen
        name="PaymentHistory"
        options={{ title: 'Payment History' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <PaymentHistoryScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="MakePayment"
        options={{ title: 'Make Payment' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <MakePaymentScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Discounts"
        options={{ title: 'Discounts & Benefits' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <DiscountsScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="FeeStructure"
        options={{ title: 'Fee Structure' }}
      >
        {(props) => (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <FeeStructureScreen {...props} />
          </ErrorBoundary>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Main Parent Tab Navigator - MD3 Canonical
export default function ParentNavigator() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Calculate bottom padding with safe area (max of 16dp or safe area)
  const bottomPadding = Math.max(BottomNavMD3.insets.bottomMin, insets.bottom);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // ✅ MD3 EXACT COLORS
        tabBarActiveTintColor: BottomNavMD3.colors.active,      // #2563EB (primary)
        tabBarInactiveTintColor: BottomNavMD3.colors.inactive,  // #475569 (onSurfaceVariant)
        // ✅ PERFORMANCE OPTIMIZATIONS
        detachInactiveScreens: true,
        freezeOnBlur: true,
        lazy: true,
        // ✅ MD3 CANONICAL BOTTOM NAV STYLING
        tabBarStyle: {
          backgroundColor: BottomNavMD3.colors.container,        // #FFFFFF (surface)
          borderTopWidth: 1,
          borderTopColor: BottomNavMD3.colors.dividerTop,        // #E2E8F0
          height: BottomNavMD3.height,                           // 80dp (MD3 canonical)
          paddingBottom: bottomPadding,                          // Safe area aware
          paddingTop: 8,
          paddingHorizontal: BottomNavMD3.insets.horizontal,    // 16dp
          elevation: BottomNavMD3.elevation.rest,                // 1dp (not 8)
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,                                   // Minimal shadow
          shadowRadius: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          minHeight: BottomNavMD3.item.minTarget,                // ≥48dp tap target
        },
        // ✅ MD3 LABEL TYPOGRAPHY: 13sp/18/500
        tabBarLabelStyle: {
          fontSize: BottomNavMD3.item.label.size,                // 13sp
          fontWeight: BottomNavMD3.item.label.fontWeight,        // 500
          lineHeight: BottomNavMD3.item.label.lineHeight,        // 18sp
          fontFamily: 'System',
          marginTop: BottomNavMD3.item.gapIconLabel,             // 8dp gap
        },
        tabBarIconStyle: {
          marginTop: 8,
        },
        // ✅ ACTIVE INDICATOR STYLING (simulated with background)
        tabBarActiveBackgroundColor: `${BottomNavMD3.colors.active}1F`, // Primary @ 12% (1F hex)
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: ({ color, focused }) => (
            <Icon name="home" size={BottomNavMD3.item.icon} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Children"
        component={ChildrenStack}
        options={{
          tabBarLabel: 'Children',
          tabBarAccessibilityLabel: 'Children tab',
          tabBarIcon: ({ color, focused }) => (
            <Icon name="school" size={BottomNavMD3.item.icon} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Communication"
        component={CommunicationStack}
        options={{
          tabBarLabel: 'Messages',
          tabBarAccessibilityLabel: 'Messages tab',
          tabBarIcon: ({ color, focused }) => (
            <Icon name="chat" size={BottomNavMD3.item.icon} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Billing"
        component={BillingStack}
        options={{
          tabBarLabel: 'Fees',
          tabBarAccessibilityLabel: 'Fees and payments tab',
          tabBarIcon: ({ color, focused }) => (
            <Icon name="payment" size={BottomNavMD3.item.icon} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

