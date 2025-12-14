/**
 * AppNavigator - Phase 7: Enhanced Navigation & Routing System
 * Multi-role navigation with premium UI/UX design
 * Optimized for Material Design 3 with advanced theming
 * Manushi Coaching Platform
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
  BackHandler,
  Alert,
  Dimensions,
} from 'react-native';

// Import auth context
import { useAuth } from '../context/AuthContext';

// Import all dashboard screens
import ModernWelcomeScreen from '../screens/auth/ModernWelcomeScreen';
import UltraModernLoginScreen from '../screens/auth/UltraModernLoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import StudentLoginScreen from '../screens/student/StudentLoginScreen';
import StudentSignupScreen from '../screens/student/StudentSignupScreen';
import StudentOnboardingFlow from '../screens/student/StudentOnboardingFlow';
// import StudentDashboard from '../screens/dashboard/StudentDashboard'; // OLD - Using StudentNavigator instead
import StudentNavigator from './StudentNavigator'; // NEW - All 27 student screens with bottom tabs
import TeacherDashboard from '../screens/dashboard/TeacherDashboard';
import ParentDashboard from '../screens/dashboard/ParentDashboard';
import AdminDashboard from '../screens/dashboard/AdminDashboard';
import LiveClassScreen from '../screens/teacher/LiveClassScreen';

// Phase 29: Advanced Class Management
import AdvancedClassControlScreen from '../screens/teacher/AdvancedClassControlScreen';
import ClassPreparationScreen from '../screens/teacher/ClassPreparationScreen';

// Phase 30: Assessment & Assignment Management
import AssignmentCreatorScreen from '../screens/teacher/AssignmentCreatorScreen';
import AssessmentAnalyticsScreen from '../screens/teacher/AssessmentAnalyticsScreen';
import AssignmentGradingScreen from '../screens/teacher/AssignmentGradingScreen';

// Phase 31: Student Management & Communication
import StudentDetailScreen from '../screens/teacher/StudentDetailScreen';
import CommunicationHubScreen from '../screens/teacher/CommunicationHubScreen';
import AttendanceTrackingScreen from '../screens/teacher/AttendanceTrackingScreen';

// Phase 32: AI Teaching Assistant & Analytics
import AITeachingInsightsScreen from '../screens/teacher/AITeachingInsightsScreen';
import AutomatedAdminTasksScreen from '../screens/teacher/AutomatedAdminTasksScreen';

// Phase 46: Advanced Assignment & Question Management (Teacher Features)
import QuestionBankManagerScreen from '../screens/teacher/QuestionBankManagerScreen';

// Phase 47: AI-Powered Learning Intelligence & Advanced Analytics
// OLD STUDENT SCREENS - Moved to backup, using NEW screens from StudentNavigator instead
// import StudentAILearningDashboard from '../screens/student/StudentAILearningDashboard';
// import AITutorChatInterface from '../screens/student/AITutorChatInterface';
import TeacherAIAnalyticsDashboard from '../screens/teacher/TeacherAIAnalyticsDashboard';

// Phase 48: Immersive Learning & Advanced Collaboration
// OLD STUDENT SCREENS - Moved to backup, using NEW screens from StudentNavigator instead
// import VirtualClassroomInterface from '../screens/student/VirtualClassroomInterface';
// import GamifiedLearningHub from '../screens/student/GamifiedLearningHub';
// import PeerLearningNetwork from '../screens/student/PeerLearningNetwork';
// import LiveCollaborationStudio from '../screens/student/LiveCollaborationStudio';

// Phase 49: AI-Driven Professional Development & Certification Ecosystem
import TeacherProfessionalDevelopment from '../screens/teacher/TeacherProfessionalDevelopment';
import VoiceAIAssessmentSystem from '../screens/teacher/VoiceAIAssessmentSystem';

// Phase 50: Enterprise Intelligence & Scalability Platform
import EnterpriseIntelligenceSuite from '../screens/admin/EnterpriseIntelligenceSuite';
import PlatformScalabilityDashboard from '../screens/admin/PlatformScalabilityDashboard';
import AIAgentEcosystem from '../screens/admin/AIAgentEcosystem';

// Import student screens
// OLD STUDENT SCREENS - Moved to backup, using NEW screens from StudentNavigator instead
// import ClassDetailScreen from '../screens/student/ClassDetailScreen';
// import ScheduleScreen from '../screens/student/ScheduleScreen';
// import AssignmentDetailScreen from '../screens/student/AssignmentDetailScreen';
// import ProgressDetailScreen from '../screens/student/ProgressDetailScreen';
// import ActivityDetailScreen from '../screens/student/ActivityDetailScreen';
// import AIStudyScreen from '../screens/student/AIStudyScreen';
// import StudentLiveClassScreen from '../screens/student/StudentLiveClassScreen';
// import StudyLibraryScreen from '../screens/student/StudyLibraryScreen';
// import DoubtSubmissionScreen from '../screens/student/DoubtSubmissionScreen';

// Phase 43.1: Enhanced Student Features
// OLD STUDENT SCREENS - Moved to backup, using NEW screens from StudentNavigator instead
// import EnhancedScheduleScreen from '../screens/student/EnhancedScheduleScreen';

// Phase 43.2: AI Study Assistant Enhancement
// OLD STUDENT SCREENS - Moved to backup, using NEW screens from StudentNavigator instead
// import EnhancedAIStudyAssistantScreen from '../screens/student/EnhancedAIStudyAssistantScreen';

// Phase 44.1: Enhanced Live Class Participation
// OLD STUDENT SCREENS - Moved to backup, using NEW screens from StudentNavigator instead
// import EnhancedLiveClassParticipationScreen from '../screens/student/EnhancedLiveClassParticipationScreen';

// Phase 45: Enhanced Live Class Participation (Student Features)
// OLD STUDENT SCREENS - Moved to backup, using NEW screens from StudentNavigator instead
// import LiveClassParticipationScreen from '../screens/student/LiveClassParticipationScreen';

// Phase 33: Child Progress Monitoring (Parent Features)
import ChildProgressMonitoringScreen from '../screens/parent/ChildProgressMonitoringScreen';
import PerformanceAnalyticsScreen from '../screens/parent/PerformanceAnalyticsScreen';

// Phase 34: Financial Management (Parent Features)
import PaymentProcessingScreen from '../screens/parent/PaymentProcessingScreen';
import BillingInvoiceScreen from '../screens/parent/BillingInvoiceScreen';

// Phase 35: Communication & Engagement (Parent Features)
import TeacherCommunicationScreen from '../screens/parent/TeacherCommunicationScreen';
import CommunityEngagementScreen from '../screens/parent/CommunityEngagementScreen';

// Phase 36: Scheduling & Information Management (Parent Features)
import AcademicScheduleScreen from '../screens/parent/AcademicScheduleScreen';
import InformationHubScreen from '../screens/parent/InformationHubScreen';

// Phase 37: Advanced User Management (Admin Features)
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import OrganizationManagementScreen from '../screens/admin/OrganizationManagementScreen';

// Phase 38: System Configuration & Management (Admin Features)
import SystemSettingsScreen from '../screens/admin/SystemSettingsScreen';
import ContentManagementScreen from '../screens/admin/ContentManagementScreen';

// Phase 39: Advanced Analytics & Reporting (Admin Features)
import AdvancedAnalyticsScreen from '../screens/admin/AdvancedAnalyticsScreen';
import KPIDetailScreen from '../screens/admin/KPIDetailScreen';
import AlertDetailScreen from '../screens/admin/AlertDetailScreen';

// Phase 40: Financial Administration & Support (Admin Features)
import FinancialReportsScreen from '../screens/admin/FinancialReportsScreen';
import PaymentSettingsScreen from '../screens/admin/PaymentSettingsScreen';
import SupportCenterScreen from '../screens/admin/SupportCenterScreen';

// Phase 41: Operations & Compliance Management (Admin Features)
import OperationsManagementScreen from '../screens/admin/OperationsManagementScreen';
import ComplianceAuditScreen from '../screens/admin/ComplianceAuditScreen';
import StrategicPlanningScreen from '../screens/admin/StrategicPlanningScreen';

// Phase 76: Business Configuration
import BusinessConfigurationScreen from '../screens/admin/BusinessConfigurationScreen';

// Phase 79: Smart Enhancement & Optimization Engine
import Phase79ValidationScreen from '../screens/admin/Phase79ValidationScreen';

// Phase 80: Advanced Intelligence & Automation Suite
import Phase80ValidationScreen from '../screens/admin/Phase80ValidationScreen';

// Phase 77: Real-Time Collaboration & Communication Suite
import RealTimeMonitoringDashboard from '../screens/admin/RealTimeMonitoringDashboard';
// OLD STUDENT SCREENS - Moved to backup, using NEW screens from StudentNavigator instead
// import EnhancedInteractiveClassroomScreen from '../screens/student/EnhancedInteractiveClassroomScreen';
// import CollaborativeAssignmentWorkspace from '../screens/student/CollaborativeAssignmentWorkspace';

// Import common screens
import SettingsScreen from '../screens/common/SettingsScreen';
import NotificationScreen from '../screens/common/NotificationScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

// Import auth screens
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Import Parent Navigator with NEW dashboard
import ParentNavigator from './ParentNavigator';

// Import Admin Navigator with NEW AdminDashboardScreen
import AdminNavigator from './AdminNavigator';

// Import theme and styling
import { LightTheme } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';

const { width, height } = Dimensions.get('window');

export type UserRole = 'Student' | 'Teacher' | 'Parent' | 'Admin';
export type NavigationScreen = 
  | 'welcome' 
  | 'student-login'
  | 'login' 
  | 'register'
  | 'forgot-password' 
  | 'student-dashboard' 
  | 'teacher-dashboard' 
  | 'parent-dashboard' 
  | 'admin-dashboard'
  | 'business-configuration'
  | 'live-class'
  | 'class-control'
  | 'live-control'
  | 'start-class'
  | 'schedule-class'
  | 'settings'
  | 'profile'
  | 'notifications'
  | 'class-detail'
  | 'schedule'
  | 'assignment-detail'
  | 'progress-detail'
  | 'activity-detail'
  | 'ai-study'
  | 'student-live-class'
  | 'study-library'
  | 'submit-doubt'
  | 'create-assignment'
  | 'grade-assignment'
  | 'view-reports'
  | 'student-detail'
  | 'send-announcement'
  | 'take-attendance'
  | 'ai-insight'
  | 'ai-action'
  | 'child-progress'
  | 'download-reports'
  | 'make-payment'
  | 'financial-detail'
  | 'contact-teacher'
  | 'message-detail'
  | 'schedule-meeting'
  | 'community-hub'
  | 'view-timetable'
  | 'information-hub'
  | 'user-management'
  | 'organization-management'
  | 'system-settings'
  | 'content-management'
  | 'advanced-analytics'
  | 'kpi-detail'
  | 'alert-detail'
  | 'financial-reports'
  | 'payment-settings'
  | 'support-center'
  | 'operations-management'
  | 'compliance-audit'
  | 'strategic-planning'
  | 'live-class-participation'
  | 'question-bank'
  | 'student-ai-learning'
  | 'ai-tutor-chat'
  | 'teacher-ai-analytics'
  | 'virtual-classroom'
  | 'gamified-learning'
  | 'peer-learning'
  | 'live-collaboration'
  | 'teacher-professional-development'
  | 'voice-ai-assessment'
  | 'enterprise-intelligence-suite'
  | 'platform-scalability-dashboard'
  | 'ai-agent-ecosystem'
  | 'real-time-monitoring'
  | 'enhanced-interactive-classroom'
  | 'collaborative-assignment'
  | 'phase-79-validation'
  | 'phase-80-validation';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
}

export interface NavigationState {
  currentRoute: NavigationScreen;
  currentUser: User | null;
  previousRoute?: NavigationScreen;
  params?: any;
  isAuthenticated: boolean;
  drawerOpen: boolean;
  manualAuth?: boolean;
}

interface AppNavigatorProps {
  initialRoute?: NavigationScreen;
  initialUser?: User | null;
}

const ROLE_COLORS = {
  Student: {
    primary: '#6366F1',
    secondary: '#E0E7FF',
    accent: '#4F46E5',
    background: '#FAFAFC',
    gradient: ['#6366F1', '#8B5CF6'],
  },
  Teacher: {
    primary: '#059669',
    secondary: '#D1FAE5',
    accent: '#047857',
    background: '#FAFAFA',
    gradient: ['#059669', '#0891B2'],
  },
  Parent: {
    primary: '#7C3AED',
    secondary: '#EDE9FE',
    accent: '#6D28D9',
    background: '#FDFBFF',
    gradient: ['#7C3AED', '#DB2777'],
  },
  Admin: {
    primary: '#7C3AED',
    secondary: '#EDE9FE',
    accent: '#6D28D9',
    background: '#FDFBFF',
    gradient: ['#7C3AED', '#DB2777'],
  },
};

const NAVIGATION_ITEMS = {
  Student: [
    { id: 'dashboard', title: 'Dashboard', icon: '🏠', route: 'student-dashboard' as NavigationScreen },
    { id: 'schedule', title: 'My Schedule', icon: '📅', route: 'schedule' as NavigationScreen },
    { id: 'progress', title: 'Progress', icon: '📊', route: 'progress-detail' as NavigationScreen },
    { id: 'assignments', title: 'Assignments', icon: '📝', route: 'assignment-detail' as NavigationScreen },
    { id: 'library', title: 'Library', icon: '📚', route: 'study-library' as NavigationScreen },
    { id: 'interactive-classroom', title: 'Interactive Classroom', icon: '🎥', route: 'enhanced-interactive-classroom' as NavigationScreen },
    { id: 'collaborative-work', title: 'Collaborative Work', icon: '🤝', route: 'collaborative-assignment' as NavigationScreen },
  ],
  Teacher: [
    { id: 'dashboard', title: 'Dashboard', icon: '🏆', route: 'teacher-dashboard' as NavigationScreen },
    { id: 'classes', title: 'Live Classes', icon: '🎥', route: 'start-class' as NavigationScreen },
    { id: 'students', title: 'Students', icon: '👥', route: 'student-detail' as NavigationScreen },
    { id: 'assignments', title: 'Assignment Hub', icon: '📋', route: 'create-assignment' as NavigationScreen },
    { id: 'analytics', title: 'Analytics', icon: '📈', route: 'teacher-ai-analytics' as NavigationScreen },
    { id: 'professional-dev', title: 'Professional Development', icon: '🎓', route: 'teacher-professional-development' as NavigationScreen },
    { id: 'voice-assessment', title: 'Voice AI Assessment', icon: '🎙️', route: 'voice-ai-assessment' as NavigationScreen },
  ],
  Parent: [
    { id: 'dashboard', title: 'Dashboard', icon: '👨‍👩‍👧‍👦', route: 'parent-dashboard' as NavigationScreen },
    { id: 'children', title: 'Children', icon: '👶', route: 'parent-dashboard' as NavigationScreen },
    { id: 'progress', title: 'Child Progress', icon: '📊', route: 'child-progress' as NavigationScreen },
    { id: 'schedule', title: 'Academic Schedule', icon: '📅', route: 'view-timetable' as NavigationScreen },
    { id: 'analytics', title: 'Analytics', icon: '📈', route: 'download-reports' as NavigationScreen },
    { id: 'payment', title: 'Payments', icon: '💳', route: 'make-payment' as NavigationScreen },
    { id: 'billing', title: 'Billing & Invoices', icon: '🧾', route: 'financial-detail' as NavigationScreen },
    { id: 'teachers', title: 'Teacher Communication', icon: '👩‍🏫', route: 'contact-teacher' as NavigationScreen },
    { id: 'community', title: 'Community Hub', icon: '🤝', route: 'community-hub' as NavigationScreen },
    { id: 'information', title: 'Information Hub', icon: '📰', route: 'information-hub' as NavigationScreen },
  ],
  Admin: [
    { id: 'dashboard', title: 'Dashboard', icon: '⚙️', route: 'admin-dashboard' as NavigationScreen },
    { id: 'users', title: 'User Management', icon: '👥', route: 'user-management' as NavigationScreen },
    { id: 'organization', title: 'Organization', icon: '🏢', route: 'organization-management' as NavigationScreen },
    { id: 'settings', title: 'System Settings', icon: '🔧', route: 'system-settings' as NavigationScreen },
    { id: 'content', title: 'Content Management', icon: '📚', route: 'content-management' as NavigationScreen },
    { id: 'business', title: 'Business Configuration', icon: '🏪', route: 'business-configuration' as NavigationScreen },
    { id: 'analytics', title: 'Advanced Analytics', icon: '📊', route: 'advanced-analytics' as NavigationScreen },
    { id: 'kpis', title: 'KPI Analysis', icon: '🎯', route: 'kpi-detail' as NavigationScreen },
    { id: 'alerts', title: 'Alert Management', icon: '🚨', route: 'alert-detail' as NavigationScreen },
    { id: 'financial', title: 'Financial Reports', icon: '💰', route: 'financial-reports' as NavigationScreen },
    { id: 'payments', title: 'Payment Settings', icon: '💳', route: 'payment-settings' as NavigationScreen },
    { id: 'support', title: 'Support Center', icon: '🎧', route: 'support-center' as NavigationScreen },
    { id: 'operations', title: 'Operations Management', icon: '⚡', route: 'operations-management' as NavigationScreen },
    { id: 'compliance', title: 'Compliance & Audit', icon: '🛡️', route: 'compliance-audit' as NavigationScreen },
    { id: 'strategic', title: 'Strategic Planning', icon: '🎯', route: 'strategic-planning' as NavigationScreen },
    { id: 'enterprise-intelligence', title: 'Enterprise Intelligence', icon: '🧠', route: 'enterprise-intelligence-suite' as NavigationScreen },
    { id: 'platform-scalability', title: 'Platform Scalability', icon: '🚀', route: 'platform-scalability-dashboard' as NavigationScreen },
    { id: 'ai-agents', title: 'AI Agent Ecosystem', icon: '🤖', route: 'ai-agent-ecosystem' as NavigationScreen },
    { id: 'real-time-monitoring', title: 'Real-Time Monitoring', icon: '📊', route: 'real-time-monitoring' as NavigationScreen },
    { id: 'phase-79-validation', title: 'Phase 79 Validation', icon: '🔧', route: 'phase-79-validation' as NavigationScreen },
    { id: 'phase-80-validation', title: 'Phase 80 Intelligence', icon: '🧠', route: 'phase-80-validation' as NavigationScreen },
  ],
};

export const AppNavigator: React.FC<AppNavigatorProps> = ({
  initialRoute = 'student-login',
  initialUser = null,
}) => {
  // Use real Supabase authentication
  const { user: authUser, signIn: supabaseSignIn, signOut: supabaseSignOut, loading: authLoading } = useAuth();

  const [navState, setNavState] = useState<NavigationState>({
    currentRoute: initialRoute,
    currentUser: initialUser,
    previousRoute: undefined,
    params: {},
    isAuthenticated: !!initialUser,
    drawerOpen: false,
    manualAuth: false,
  });

  const [drawerAnimation] = useState(new Animated.Value(0));
  const [overlayAnimation] = useState(new Animated.Value(0));

  // Sync auth state with navigation state
  useEffect(() => {
    // Don't do anything while auth is still loading
    if (authLoading) {
      return;
    }

        if (authUser && !navState.isAuthenticated) {
      // User just logged in
      const role = authUser.user_metadata?.role || 'Student';
      const mockUser: User = {
        id: authUser.id,
        firstName: authUser.user_metadata?.full_name?.split(' ')[0] || 'User',
        lastName: authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        email: authUser.email || '',
        role: role as UserRole,
        isVerified: true,
      };

      const dashboardRoute: NavigationScreen = `${role.toLowerCase()}-dashboard` as NavigationScreen;
      console.log('dY"? [AppNavigator] User logged in, navigating to:', dashboardRoute);

      setNavState(prev => ({
        ...prev,
        previousRoute: undefined, // Clear previous route to prevent back to login
        currentUser: mockUser,
        currentRoute: dashboardRoute,
        isAuthenticated: true,
        manualAuth: false,
      }));
    } else if (!authUser && navState.isAuthenticated) {
      if (navState.manualAuth) {
        // Allow manual/bypass sessions to persist for testing
        return;
      }
      // User logged out
      console.log('dY"? [AppNavigator] User logged out, navigating to welcome');
      setNavState(prev => ({
        ...prev,
        currentUser: null,
        currentRoute: 'welcome',
        isAuthenticated: false,
        manualAuth: false,
      }));
    }
  }, [authUser, authLoading, navState.isAuthenticated, navState.manualAuth]);

  const navigate = (route: NavigationScreen, params?: any, user?: User) => {
    setNavState(prev => ({
      ...prev,
      previousRoute: prev.currentRoute,
      currentRoute: route,
      params: params || {},
      currentUser: user || prev.currentUser,
      isAuthenticated: !!(user || prev.currentUser),
      drawerOpen: false,
      manualAuth: prev.manualAuth,
    }));

    if (navState.drawerOpen) {
      closeDrawer();
    }
  };

  const openDrawer = () => {
    setNavState(prev => ({ ...prev, drawerOpen: true }));
    Animated.parallel([
      Animated.timing(drawerAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setNavState(prev => ({ ...prev, drawerOpen: false }));
    });
  };

  const handleLogin = async (email: string, password: string, role: UserRole) => {
    try {
      console.log('🔐 [AppNavigator] Attempting Supabase login:', { email, role });

      // Call REAL Supabase authentication
      const { error } = await supabaseSignIn(email, password);

      if (error) {
        console.error('🔐 [AppNavigator] Login failed:', error);
        Alert.alert('Login Error', error.message || 'Please check your credentials and try again.');
        return;
      }

      console.log('🔐 [AppNavigator] Login successful! Auth state will update automatically.');
      // Navigation will happen automatically via the useEffect above
    } catch (error: any) {
      console.error('🔐 [AppNavigator] Login exception:', error);
      Alert.alert('Login Error', error?.message || 'An unexpected error occurred. Please try again.');
    }
  };

  const handleStudentBypassLogin = (email: string) => {
    const mockStudent: User = {
      id: `student_${Date.now()}`,
      firstName: email?.split('@')[0] || 'Student',
      lastName: '',
      email: email || 'student@example.com',
      role: 'Student',
      isVerified: true,
    };

    setNavState(prev => ({
      ...prev,
      previousRoute: undefined, // Clear previous route to prevent back to login
      currentRoute: 'student-dashboard',
      params: {},
      currentUser: mockStudent,
      isAuthenticated: true,
      drawerOpen: false,
      manualAuth: true,
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            console.log('🔐 [AppNavigator] Logging out...');
            await supabaseSignOut();
            // State will be cleared automatically via useEffect
          },
        },
      ]
    );
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navState.drawerOpen) {
        closeDrawer();
        return true;
      }
      
      if (navState.currentRoute !== 'welcome' && navState.previousRoute) {
        navigate(navState.previousRoute);
        return true;
      }
      
      return false;
    });

    return () => backHandler.remove();
  }, [navState.drawerOpen, navState.currentRoute, navState.previousRoute]);

  const renderDrawer = () => {
    if (!navState.currentUser || !navState.drawerOpen) return null;

    const roleColors = ROLE_COLORS[navState.currentUser.role] || ROLE_COLORS.Student;
    const navItems = NAVIGATION_ITEMS[navState.currentUser.role] || NAVIGATION_ITEMS.Student;

    const drawerTranslate = drawerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [-width * 0.8, 0],
    });

    const overlayOpacity = overlayAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.5],
    });

    return (
      <>
        <Animated.View 
          style={[styles.drawerOverlay, { opacity: overlayOpacity }]}
        >
          <TouchableOpacity 
            style={styles.overlayTouchable} 
            onPress={closeDrawer}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View 
          style={[
            styles.drawer, 
            { 
              transform: [{ translateX: drawerTranslate }],
              backgroundColor: roleColors.primary,
            }
          ]}
        >
            <SafeAreaView style={styles.drawerHeader}>
              <View style={styles.userProfile}>
                <View style={[styles.avatar, { backgroundColor: roleColors.secondary }]}>
                  <Text style={[styles.avatarText, { color: roleColors.accent }]}>
                    {navState.currentUser.firstName.charAt(0)}{navState.currentUser.lastName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {navState.currentUser.firstName} {navState.currentUser.lastName}
                  </Text>
                  <View style={styles.roleContainer}>
                    <Text style={styles.userRole}>{navState.currentUser.role}</Text>
                    {navState.currentUser.isVerified && (
                      <Text style={styles.verifiedBadge}>✓ Verified</Text>
                    )}
                  </View>
                  <Text style={styles.userEmail}>{navState.currentUser.email}</Text>
                </View>
              </View>
            </SafeAreaView>

            <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
              <View style={styles.navSection}>
                <Text style={styles.sectionTitle}>Navigation</Text>
                {navItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.navItem,
                      navState.currentRoute === item.route && styles.navItemActive
                    ]}
                    onPress={() => navigate(item.route)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.navItemIcon}>{item.icon}</Text>
                    <Text style={[
                      styles.navItemText,
                      navState.currentRoute === item.route && styles.navItemTextActive
                    ]}>
                      {item.title}
                    </Text>
                    {navState.currentRoute === item.route && (
                      <View style={[styles.activeIndicator, { backgroundColor: roleColors.secondary }]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.navSection}>
                <Text style={styles.sectionTitle}>Account</Text>
                <TouchableOpacity style={styles.navItem} onPress={() => navigate('profile')}>
                  <Text style={styles.navItemIcon}>👤</Text>
                  <Text style={styles.navItemText}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigate('settings')}>
                  <Text style={styles.navItemIcon}>⚙️</Text>
                  <Text style={styles.navItemText}>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigate('notifications')}>
                  <Text style={styles.navItemIcon}>🔔</Text>
                  <Text style={styles.navItemText}>Notifications</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.drawerFooter}>
              <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
        </Animated.View>
      </>
    );
  };

  const renderHeader = () => {
    if (!navState.isAuthenticated || ['welcome', 'login', 'register', 'student-login', 'student-dashboard'].includes(navState.currentRoute)) {
      return null;
    }

    const roleColors = navState.currentUser ? ROLE_COLORS[navState.currentUser.role] : ROLE_COLORS.Student;

    return (
      <View style={[styles.header, { backgroundColor: roleColors.primary }]}>
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={openDrawer}
            activeOpacity={0.7}
          >
            <View style={styles.menuIcon}>
              <View style={[styles.menuLine, { backgroundColor: '#FFFFFF' }]} />
              <View style={[styles.menuLine, { backgroundColor: '#FFFFFF' }]} />
              <View style={[styles.menuLine, { backgroundColor: '#FFFFFF' }]} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Manushi Coaching</Text>
            <Text style={styles.headerSubtitle}>
              {navState.currentUser?.role} Portal
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigate('notifications')}
            activeOpacity={0.7}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  };

  const renderCurrentScreen = () => {
    console.log('🔍 [AppNavigator] Rendering screen:', navState.currentRoute, 'authLoading:', authLoading);

    switch (navState.currentRoute) {
      case 'welcome':
        return (
          <ModernWelcomeScreen
            onRoleSelect={(role: UserRole) => {
              console.log('🔍 [AppNavigator] Role selected:', role);
              navigate('login', { selectedRole: role });
            }}
          />
        );
      
      case 'login':
        return (
          <UltraModernLoginScreen
            role={navState.params?.selectedRole || 'Student'}
            onLogin={handleLogin}
            onForgotPassword={() => navigate('forgot-password')}
            onSignUp={() => navigate('register', navState.params)}
            onBackToRoleSelection={() => navigate('welcome')}
          />
        );

      case 'student-login':
        return (
          <StudentLoginScreen
            bypassAuth
            onSuccessOverride={handleStudentBypassLogin}
            onSignUp={() => navigate('student-signup')}
          />
        );

      case 'student-signup':
        return (
          <StudentSignupScreen
            onBackToLogin={() => navigate('student-login')}
            onSignupSuccess={() => navigate('student-onboarding')}
          />
        );

      case 'student-onboarding':
        return (
          <StudentOnboardingFlow
            navigation={undefined as any}
            route={undefined as any}
            isFirstTime={true}
            onComplete={() => navigate('student-dashboard')}
          />
        );

      case 'register':
        return (
          <RegisterScreen
            role={navState.params?.selectedRole || 'Student'}
            onRegister={async (userData, role) => {
              await new Promise(resolve => setTimeout(resolve, 1500));
              Alert.alert('success', 'Registration completed!', [
                { text: 'Login', onPress: () => navigate('login', { selectedRole: role }) }
              ]);
            }}
            onBackToLogin={() => navigate('login', navState.params)}
            onBackToRoleSelection={() => navigate('welcome')}
          />
        );
      
      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            onBackToLogin={() => navigate('login')}
            onResetSent={(email) => {
              console.log(`Password reset sent to: ${email}`);
              // Could store email in params for future use
            }}
          />
        );

      case 'student-dashboard':
        // NEW: Using StudentNavigator with 27 screens and bottom tabs (Home, Classes, Study, Progress, Connect)
        return <StudentNavigator />;

        // OLD: StudentDashboard (single screen) - replaced with StudentNavigator
        // return (
        //   <StudentDashboard
        //     studentName={navState.currentUser ? `${navState.currentUser.firstName} ${navState.currentUser.lastName}` : 'Alex Johnson'}
        //     onNavigate={(screen) => { ... }}
        //   />
        // );

      case 'teacher-dashboard':
        return (
          <TeacherDashboard
            teacherName={navState.currentUser ? `${navState.currentUser.firstName} ${navState.currentUser.lastName}` : 'Dr. Sarah Wilson'}
            onNavigate={(screen) => {
              if (screen === 'back' || screen === 'back-to-demo') {
                navigate(navState.previousRoute || 'welcome');
              } else if (screen === 'live-control' || screen === 'control-class') {
                navigate('class-control', { classId: '1' });
              } else if (screen === 'start-class' || screen === 'schedule-class') {
                navigate('start-class');
              } else if (screen === 'live-class') {
                navigate('live-class', { classId: '1' });
              } else if (screen === 'create-assignment') {
                navigate('create-assignment');
              } else if (screen === 'grade-assignment') {
                navigate('grade-assignment');
              } else if (screen === 'view-reports') {
                navigate('view-reports');
              } else if (screen === 'student-detail') {
                navigate('student-detail');
              } else if (screen === 'send-announcement') {
                navigate('send-announcement');
              } else if (screen === 'take-attendance') {
                navigate('take-attendance');
              } else if (screen === 'ai-insight') {
                navigate('ai-insight');
              } else if (screen === 'ai-action') {
                navigate('ai-action');
              } else if (screen === 'teacher-ai-analytics') {
                navigate('teacher-ai-analytics');
              } else if (screen === 'teacher-professional-development') {
                navigate('teacher-professional-development');
              } else if (screen === 'voice-ai-assessment') {
                navigate('voice-ai-assessment');
              } else if (screen === 'question-bank-manager') {
                navigate('question-bank', navState.params);
              } else if (screen === 'teacher-workflow-optimization') {
                navigate('teacher-dashboard');
              } else if (screen === 'enhanced-assignment-grading') {
                navigate('grade-assignment');
              } else if (screen === 'teacher-profile') {
                navigate('profile');
              } else if (screen === 'teacher-settings') {
                navigate('settings');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'live-class':
        return (
          <LiveClassScreen
            classId={navState.params?.classId || '1'}
            teacherName={navState.currentUser ? `${navState.currentUser.firstName} ${navState.currentUser.lastName}` : 'Dr. Sarah Wilson'}
            onNavigate={(screen) => {
              if (screen === 'teacher-dashboard') {
                navigate('teacher-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'class-control':
      case 'live-control':
        return (
          <AdvancedClassControlScreen
            classId={navState.params?.classId || '1'}
            teacherName={navState.currentUser ? `${navState.currentUser.firstName} ${navState.currentUser.lastName}` : 'Dr. Sarah Wilson'}
            onNavigate={(screen) => {
              if (screen === 'teacher-dashboard') {
                navigate('teacher-dashboard');
              } else if (screen === 'start-class') {
                navigate('start-class');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'start-class':
      case 'schedule-class':
        return (
          <ClassPreparationScreen
            teacherName={navState.currentUser ? `${navState.currentUser.firstName} ${navState.currentUser.lastName}` : 'Dr. Sarah Wilson'}
            onNavigate={(screen) => {
              if (screen === 'teacher-dashboard') {
                navigate('teacher-dashboard');
              } else if (screen === 'class-control') {
                navigate('class-control', { classId: '1' });
              } else if (screen === 'live-class') {
                navigate('live-class', { classId: '1' });
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'parent-dashboard':
        // NEW: Use ParentNavigator with React Navigation bottom tabs
        // This includes the NEW modern dashboard connected to Supabase
        return <ParentNavigator />;

      case 'admin-dashboard':
        // NEW: Use AdminNavigator with React Navigation stack
        // This includes the NEW AdminDashboardScreen with enhanced dashboard
        return <AdminNavigator />;

      case 'user-management':
        return (
          <UserManagementScreen
            adminId={navState.currentUser?.id || 'admin_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('admin-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'organization-management':
        return (
          <OrganizationManagementScreen
            adminId={navState.currentUser?.id || 'admin_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('admin-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'system-settings':
        return (
          <SystemSettingsScreen
            adminId={navState.currentUser?.id || 'admin_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('admin-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'content-management':
        return (
          <ContentManagementScreen
            adminId={navState.currentUser?.id || 'admin_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('admin-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'business-configuration':
        return (
          <BusinessConfigurationScreen
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('admin-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'advanced-analytics':
        return (
          <AdvancedAnalyticsScreen
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('admin-dashboard');
              } else if (screen === 'kpi-detail') {
                navigate('kpi-detail');
              } else if (screen === 'alert-detail') {
                navigate('alert-detail');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'kpi-detail':
        return (
          <KPIDetailScreen
            route={navState.params}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('advanced-analytics');
              } else if (screen === 'alert-detail') {
                navigate('alert-detail');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'alert-detail':
        return (
          <AlertDetailScreen
            route={navState.params}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('advanced-analytics');
              } else if (screen === 'kpi-detail') {
                navigate('kpi-detail');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'financial-reports':
        return (
          <FinancialReportsScreen
            adminId={navState.currentUser?.id || 'admin_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('admin-dashboard');
              } else if (screen === 'payment-settings') {
                navigate('payment-settings');
              } else if (screen === 'export-reports') {
                Alert.alert('Feature Coming Soon', 'Export functionality will be available soon!');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'payment-settings':
        return (
          <PaymentSettingsScreen
            adminId={navState.currentUser?.id || 'admin_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('financial-reports');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'support-center':
        return (
          <SupportCenterScreen
            adminId={navState.currentUser?.id || 'admin_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('admin-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'class-detail':
        return (
          <ClassDetailScreen
            classId={navState.params?.classId || '1'}
            autoJoin={navState.params?.autoJoin || false}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('student-dashboard');
              } else if (screen === 'student-live-class') {
                navigate('student-live-class', { classId: navState.params?.classId || '1' });
              } else if (screen === 'live-class-participation') {
                navigate('live-class-participation', { classId: navState.params?.classId || '1' });
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'schedule':
        return (
          <ScheduleScreen
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('student-dashboard');
              } else if (screen === 'class-detail') {
                navigate('class-detail', navState.params);
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'assignment-detail':
        return (
          <AssignmentDetailScreen
            assignmentId={navState.params?.assignmentId}
            viewAll={navState.params?.viewAll || false}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('student-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'progress-detail':
        return (
          <ProgressDetailScreen
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('student-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'activity-detail':
        return (
          <ActivityDetailScreen
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('student-dashboard');
              } else if (screen === 'AssignmentDetail') {
                navigate('assignment-detail', navState.params);
              } else if (screen === 'progress-detail') {
                navigate('progress-detail', navState.params);
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'ai-study':
        return (
          <AIStudyScreen
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('student-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'student-live-class':
        return (
          <StudentLiveClassScreen
            classId={navState.params?.classId || '1'}
            studentName={navState.currentUser ? `${navState.currentUser.firstName} ${navState.currentUser.lastName}` : 'Alex Johnson'}
            onNavigate={(screen) => {
              if (screen === 'student-dashboard') {
                navigate('student-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'study-library':
        return (
          <StudyLibraryScreen
            studentId={navState.currentUser?.id || 'student_123'}
            onNavigate={(screen) => {
              if (screen === 'student-dashboard') {
                navigate('student-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      // Phase 43.1: Enhanced Schedule Screen
      case 'EnhancedSchedule':
        return <EnhancedScheduleScreen onNavigate={(screen) => {
          if (screen === 'back') {
            navigate(navState.previousRoute || 'student-dashboard');
          } else {
            navigate(screen as any);
          }
        }} />;

      // Phase 43.1: Enhanced Study Library (using our new implementation)
      case 'StudyLibrary':
        return <StudyLibraryScreen onNavigate={(screen) => {
          if (screen === 'back') {
            navigate(navState.previousRoute || 'student-dashboard');
          } else {
            navigate(screen as any);
          }
        }} />;

      // Phase 43.2: Enhanced AI Study Assistant
      case 'EnhancedAIStudyAssistant':
        return <EnhancedAIStudyAssistantScreen onNavigate={(screen) => {
          if (screen === 'back') {
            navigate(navState.previousRoute || 'student-dashboard');
          } else {
            navigate(screen as any);
          }
        }} />;

      // Phase 44.1: Enhanced Live Class Participation
      case 'EnhancedLiveClassParticipation':
        return <EnhancedLiveClassParticipationScreen onNavigate={(screen) => {
          if (screen === 'back') {
            navigate(navState.previousRoute || 'student-dashboard');
          } else {
            navigate(screen as any);
          }
        }} />;

      case 'submit-doubt':
        return (
          <DoubtSubmissionScreen
            userId={navState.currentUser?.id || 'student_123'}
            userName={navState.currentUser ? `${navState.currentUser.firstName} ${navState.currentUser.lastName}` : 'Alex Johnson'}
            onNavigateBack={() => navigate('student-dashboard')}
            onNavigateToProfile={() => navigate('profile')}
            onNavigateToSettings={() => navigate('settings')}
          />
        );

      case 'create-assignment':
        return (
          <AssignmentCreatorScreen
            teacherId={navState.currentUser?.id || 'teacher_123'}
            onNavigate={(screen) => {
              if (screen === 'teacher-dashboard') {
                navigate('teacher-dashboard');
              } else if (screen === 'grade-assignment') {
                navigate('grade-assignment');
              } else if (screen === 'question-bank') {
                navigate('question-bank');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'grade-assignment':
        return (
          <AssignmentGradingScreen
            teacherId={navState.currentUser?.id || 'teacher_123'}
            onNavigate={(screen) => {
              if (screen === 'teacher-dashboard') {
                navigate('teacher-dashboard');
              } else if (screen === 'create-assignment') {
                navigate('create-assignment');
              } else if (screen === 'view-reports') {
                navigate('view-reports');
              } else if (screen === 'question-bank') {
                navigate('question-bank');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'view-reports':
        return (
          <AssessmentAnalyticsScreen
            teacherId={navState.currentUser?.id || 'teacher_123'}
            onNavigate={(screen) => {
              if (screen === 'teacher-dashboard') {
                navigate('teacher-dashboard');
              } else if (screen === 'create-assignment') {
                navigate('create-assignment');
              } else if (screen === 'grade-assignment') {
                navigate('grade-assignment');
              } else if (screen === 'question-bank') {
                navigate('question-bank');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'student-detail':
        return (
          <StudentDetailScreen
            studentId={navState.params?.studentId || 'student_123'}
            teacherId={navState.currentUser?.id || 'teacher_123'}
            onNavigate={(screen) => {
              if (screen === 'teacher-dashboard') {
                navigate('teacher-dashboard');
              } else if (screen === 'send-announcement') {
                navigate('send-announcement');
              } else if (screen === 'take-attendance') {
                navigate('take-attendance');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'send-announcement':
        return (
          <CommunicationHubScreen
            teacherId={navState.currentUser?.id || 'teacher_123'}
            onNavigate={(screen) => {
              if (screen === 'teacher-dashboard') {
                navigate('teacher-dashboard');
              } else if (screen === 'student-detail') {
                navigate('student-detail');
              } else if (screen === 'take-attendance') {
                navigate('take-attendance');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'take-attendance':
        return (
          <AttendanceTrackingScreen
            teacherId={navState.currentUser?.id || 'teacher_123'}
            onNavigate={(screen) => {
              if (screen === 'teacher-dashboard') {
                navigate('teacher-dashboard');
              } else if (screen === 'student-detail') {
                navigate('student-detail');
              } else if (screen === 'send-announcement') {
                navigate('send-announcement');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'ai-insight':
        return (
          <AITeachingInsightsScreen
            teacherId={navState.currentUser?.id || 'teacher_123'}
            onNavigate={(screen) => {
              if (screen === 'teacher-dashboard') {
                navigate('teacher-dashboard');
              } else if (screen === 'ai-action') {
                navigate('ai-action');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'ai-action':
        return (
          <AutomatedAdminTasksScreen
            onNavigate={(screen) => {
              if (screen === 'teacher-dashboard') {
                navigate('teacher-dashboard');
              } else if (screen === 'ai-insight') {
                navigate('ai-insight');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'child-progress':
        return (
          <ChildProgressMonitoringScreen
            parentId={navState.currentUser?.id || 'parent_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('parent-dashboard');
              } else if (screen === 'download-reports') {
                navigate('download-reports');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'download-reports':
        return (
          <PerformanceAnalyticsScreen
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('parent-dashboard');
              } else if (screen === 'child-progress') {
                navigate('child-progress');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'make-payment':
        return (
          <PaymentProcessingScreen
            parentId={navState.currentUser?.id || 'parent_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('parent-dashboard');
              } else if (screen === 'financial-detail') {
                navigate('financial-detail');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'financial-detail':
        return (
          <BillingInvoiceScreen
            parentId={navState.currentUser?.id || 'parent_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('parent-dashboard');
              } else if (screen === 'make-payment') {
                navigate('make-payment');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'contact-teacher':
        return (
          <TeacherCommunicationScreen
            parentId={navState.currentUser?.id || 'parent_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('parent-dashboard');
              } else if (screen === 'message-detail') {
                navigate('message-detail');
              } else if (screen === 'schedule-meeting') {
                navigate('schedule-meeting');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'community-hub':
        return (
          <CommunityEngagementScreen
            parentId={navState.currentUser?.id || 'parent_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('parent-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'message-detail':
      case 'schedule-meeting':
        return (
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonTitle}>{navState.currentRoute.charAt(0).toUpperCase() + navState.currentRoute.slice(1).replace('-', ' ')}</Text>
            <Text style={styles.comingSoonText}>This feature is coming soon!</Text>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigate('contact-teacher')}
            >
              <Text style={styles.backButtonText}>← Back to Teacher Communication</Text>
            </TouchableOpacity>
          </View>
        );

      case 'view-timetable':
        return (
          <AcademicScheduleScreen
            parentId={navState.currentUser?.id || 'parent_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('parent-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'information-hub':
        return (
          <InformationHubScreen
            parentId={navState.currentUser?.id || 'parent_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('parent-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'operations-management':
        return (
          <OperationsManagementScreen
            adminId={navState.currentUser?.id || 'admin_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('admin-dashboard');
              } else if (screen === 'compliance-audit') {
                navigate('compliance-audit');
              } else if (screen === 'strategic-planning') {
                navigate('strategic-planning');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'compliance-audit':
        return (
          <ComplianceAuditScreen
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('operations-management');
              } else if (screen === 'admin-dashboard') {
                navigate('admin-dashboard');
              } else if (screen === 'strategic-planning') {
                navigate('strategic-planning');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'strategic-planning':
        return (
          <StrategicPlanningScreen
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('operations-management');
              } else if (screen === 'admin-dashboard') {
                navigate('admin-dashboard');
              } else if (screen === 'compliance-audit') {
                navigate('compliance-audit');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'settings':
        return (
          <SettingsScreen />
        );

      case 'notifications':
        return (
          <NotificationScreen />
        );

      case 'profile':
        return (
          <ProfileScreen
            onNavigate={(screen) => {
              if (screen === 'back') {
                if (navState.currentUser) {
                  const dashboardRoute: NavigationScreen = `${navState.currentUser.role.toLowerCase()}-dashboard` as NavigationScreen;
                  navigate(dashboardRoute);
                }
              } else {
                navigate(screen as any);
              }
            }}
          />
        );

      case 'live-class-participation':
        return (
          <LiveClassParticipationScreen />
        );

      case 'question-bank':
        return (
          <QuestionBankManagerScreen />
        );

      // Phase 47: AI-Powered Learning Intelligence & Advanced Analytics
      case 'student-ai-learning':
        return (
          <StudentAILearningDashboard
            studentId={navState.currentUser?.id || 'student_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('student-dashboard');
              } else if (screen === 'ai-tutor-chat') {
                navigate('ai-tutor-chat');
              } else if (screen === 'virtual-classroom') {
                navigate('virtual-classroom');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'ai-tutor-chat':
        return (
          <AITutorChatInterface
            studentId={navState.currentUser?.id || 'student_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('student-ai-learning');
              } else if (screen === 'student-dashboard') {
                navigate('student-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'teacher-ai-analytics':
        return (
          <TeacherAIAnalyticsDashboard
            teacherId={navState.currentUser?.id || 'teacher_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('teacher-dashboard');
              } else if (screen === 'ai-insight') {
                navigate('ai-insight');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      // Phase 48: Immersive Learning & Advanced Collaboration
      case 'virtual-classroom':
        return (
          <VirtualClassroomInterface
            studentId={navState.currentUser?.id || 'student_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('student-ai-learning');
              } else if (screen === 'peer-learning') {
                navigate('peer-learning');
              } else if (screen === 'live-collaboration') {
                navigate('live-collaboration');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'gamified-learning':
        return (
          <GamifiedLearningHub
            studentId={navState.currentUser?.id || 'student_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('student-dashboard');
              } else if (screen === 'peer-learning') {
                navigate('peer-learning');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'peer-learning':
        return (
          <PeerLearningNetwork
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('student-dashboard');
              } else if (screen === 'live-collaboration') {
                navigate('live-collaboration');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'live-collaboration':
        return (
          <LiveCollaborationStudio
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('peer-learning');
              } else if (screen === 'virtual-classroom') {
                navigate('virtual-classroom');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      // Phase 49: AI-Driven Professional Development & Certification Ecosystem
      case 'teacher-professional-development':
        return (
          <TeacherProfessionalDevelopment
            teacherId={navState.currentUser?.id || 'teacher_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('teacher-dashboard');
              } else if (screen === 'voice-ai-assessment') {
                navigate('voice-ai-assessment');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'voice-ai-assessment':
        return (
          <VoiceAIAssessmentSystem
            teacherId={navState.currentUser?.id || 'teacher_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('teacher-dashboard');
              } else if (screen === 'teacher-professional-development') {
                navigate('teacher-professional-development');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      // Phase 50: Enterprise Intelligence & Scalability Platform
      case 'enterprise-intelligence-suite':
        return (
          <EnterpriseIntelligenceSuite
            adminId={navState.currentUser?.id || 'admin_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('admin-dashboard');
              } else if (screen === 'platform-scalability-dashboard') {
                navigate('platform-scalability-dashboard');
              } else if (screen === 'ai-agent-ecosystem') {
                navigate('ai-agent-ecosystem');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'platform-scalability-dashboard':
        return (
          <PlatformScalabilityDashboard
            adminId={navState.currentUser?.id || 'admin_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('admin-dashboard');
              } else if (screen === 'enterprise-intelligence-suite') {
                navigate('enterprise-intelligence-suite');
              } else if (screen === 'ai-agent-ecosystem') {
                navigate('ai-agent-ecosystem');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'ai-agent-ecosystem':
        return (
          <AIAgentEcosystem
            adminId={navState.currentUser?.id || 'admin_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('admin-dashboard');
              } else if (screen === 'enterprise-intelligence-suite') {
                navigate('enterprise-intelligence-suite');
              } else if (screen === 'platform-scalability-dashboard') {
                navigate('platform-scalability-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      // Phase 79: Smart Enhancement & Optimization Engine
      case 'phase-79-validation':
        return (
          <Phase79ValidationScreen
            adminId={navState.currentUser?.id || 'admin_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('admin-dashboard');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      // Phase 80: Advanced Intelligence & Automation Suite
      case 'phase-80-validation':
        return (
          <Phase80ValidationScreen />
        );

      // Phase 77: Real-Time Collaboration & Communication Suite
      case 'real-time-monitoring':
        return (
          <RealTimeMonitoringDashboard />
        );

      case 'enhanced-interactive-classroom':
        return (
          <EnhancedInteractiveClassroomScreen
            studentId={navState.currentUser?.id || 'student_123'}
            studentName={navState.currentUser ? `${navState.currentUser.firstName} ${navState.currentUser.lastName}` : 'Alex Johnson'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('student-dashboard');
              } else if (screen === 'collaborative-assignment') {
                navigate('collaborative-assignment');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      case 'collaborative-assignment':
        return (
          <CollaborativeAssignmentWorkspace
            studentId={navState.currentUser?.id || 'student_123'}
            assignmentId={navState.params?.assignmentId || 'assignment_123'}
            onNavigate={(screen) => {
              if (screen === 'back') {
                navigate('student-dashboard');
              } else if (screen === 'enhanced-interactive-classroom') {
                navigate('enhanced-interactive-classroom');
              } else {
                Alert.alert('Feature Coming Soon', `${screen} will be available in upcoming updates.`);
              }
            }}
          />
        );

      default:
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Screen not found</Text>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigate('welcome')}
            >
              <Text style={styles.backButtonText}>← Back to Welcome</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={navState.currentUser && ROLE_COLORS[navState.currentUser.role] ? ROLE_COLORS[navState.currentUser.role].primary : LightTheme.Primary}
        barStyle="light-content"
      />
      {renderHeader()}
      <View style={styles.screenContainer}>
        {renderCurrentScreen()}
      </View>
      {renderDrawer()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  screenContainer: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    height: 64,
  },
  menuButton: {
    padding: Spacing.SM,
    marginRight: Spacing.SM,
    borderRadius: 8,
  },
  menuIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  menuLine: {
    height: 3,
    width: '100%',
    borderRadius: 2,
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: Typography.titleLarge.fontSize,
    fontFamily: Typography.titleLarge.fontFamily,
    fontWeight: Typography.titleLarge.fontWeight,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  notificationButton: {
    position: 'relative',
    padding: Spacing.SM,
    borderRadius: 8,
  },
  notificationIcon: {
    fontSize: 22,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationCount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Drawer Styles
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 998,
  },
  overlayTouchable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.85,
    maxWidth: 340,
    zIndex: 999,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  drawerHeader: {
    backgroundColor: 'transparent',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.XL,
    paddingTop: Spacing.XXL,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.LG,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.titleLarge.fontSize,
    fontFamily: Typography.titleLarge.fontFamily,
    fontWeight: Typography.titleLarge.fontWeight,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userRole: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: '#FFFFFF',
    opacity: 0.95,
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: '#FFFFFF',
    opacity: 0.85,
  },

  // Navigation Styles
  drawerContent: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    marginTop: Spacing.LG,
    marginHorizontal: Spacing.SM,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  navSection: {
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.XL,
  },
  sectionTitle: {
    fontSize: Typography.labelLarge.fontSize,
    fontFamily: Typography.labelLarge.fontFamily,
    fontWeight: Typography.labelLarge.fontWeight,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.LG,
    borderRadius: 16,
    marginBottom: Spacing.XS,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: LightTheme.secondaryContainer,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  navItemIcon: {
    fontSize: 22,
    marginRight: Spacing.LG,
    width: 28,
    textAlign: 'center',
  },
  navItemText: {
    flex: 1,
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnSurface,
  },
  navItemTextActive: {
    color: LightTheme.OnSecondaryContainer,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    right: 16,
    width: 6,
    height: 24,
    borderRadius: 3,
  },

  // Footer Styles
  drawerFooter: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    marginHorizontal: Spacing.SM,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingVertical: Spacing.XL,
    paddingHorizontal: Spacing.XL,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.LG,
    backgroundColor: LightTheme.errorContainer,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: Spacing.LG,
  },
  logoutText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnErrorContainer,
    fontWeight: '600',
  },

  // Utility Styles
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.XXL,
    backgroundColor: LightTheme.Background,
  },
  comingSoonTitle: {
    fontSize: Typography.headlineMedium.fontSize,
    fontFamily: Typography.headlineMedium.fontFamily,
    fontWeight: Typography.headlineMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.LG,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.XXL,
  },
  backButton: {
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.XL,
    backgroundColor: LightTheme.Primary,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButtonText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.XXL,
    backgroundColor: LightTheme.Background,
  },
  errorText: {
    fontSize: Typography.titleLarge.fontSize,
    fontFamily: Typography.titleLarge.fontFamily,
    color: LightTheme.Error,
    marginBottom: Spacing.XXL,
    textAlign: 'center',
  },
});

export default AppNavigator;

