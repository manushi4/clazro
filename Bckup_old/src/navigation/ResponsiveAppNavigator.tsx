/**
 * ResponsiveAppNavigator - Phase 8: Responsive Navigation System
 * Multi-device navigation with adaptive layouts
 * Material Design 3 breakpoint system implementation
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
} from 'react-native';

// Import responsive utilities
import { 
  useResponsiveDesign, 
  WindowSizeClass,
  ResponsiveSpacing,
  ResponsiveTypography,
  ResponsiveNavigation,
  ResponsiveLayout,
  ResponsiveRender,
  DeviceInfo 
} from '../utils/ResponsiveUtils';

// Import all dashboard screens
import ModernWelcomeScreen from '../screens/auth/ModernWelcomeScreen';
import UltraModernLoginScreen from '../screens/auth/UltraModernLoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import StudentDashboard from '../screens/dashboard/StudentDashboard';
import TeacherDashboard from '../screens/dashboard/TeacherDashboard';
import ParentDashboard from '../screens/dashboard/ParentDashboard';
import AdminDashboard from '../screens/dashboard/AdminDashboard';
import NotificationScreen from '../screens/common/NotificationScreen';
import DesignSystemTest from '../screens/test/DesignSystemTest';

// Import theme and styling
import { LightTheme } from '../theme/colors';
import { Typography } from '../theme/typography';

export type UserRole = 'Student' | 'Teacher' | 'Parent' | 'Admin';
export type NavigationScreen = 
  | 'welcome' 
  | 'login' 
  | 'register' 
  | 'student-dashboard' 
  | 'teacher-dashboard' 
  | 'parent-dashboard' 
  | 'admin-dashboard'
  | 'settings'
  | 'profile'
  | 'notifications'
  | 'design-system-test';

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
}

interface ResponsiveAppNavigatorProps {
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
    primary: '#DC2626',
    secondary: '#FEE2E2',
    accent: '#B91C1C',
    background: '#FFFAFA',
    gradient: ['#DC2626', '#EA580C'],
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
    { id: 'schedule', title: 'My Schedule', icon: '📅', route: 'student-dashboard' as NavigationScreen },
    { id: 'progress', title: 'Progress', icon: '📊', route: 'student-dashboard' as NavigationScreen },
    { id: 'assignments', title: 'Assignments', icon: '📝', route: 'student-dashboard' as NavigationScreen },
    { id: 'library', title: 'Library', icon: '📚', route: 'student-dashboard' as NavigationScreen },
  ],
  Teacher: [
    { id: 'dashboard', title: 'Dashboard', icon: '🏆', route: 'teacher-dashboard' as NavigationScreen },
    { id: 'classes', title: 'Live Classes', icon: '🎥', route: 'teacher-dashboard' as NavigationScreen },
    { id: 'students', title: 'Students', icon: '👥', route: 'teacher-dashboard' as NavigationScreen },
    { id: 'assignments', title: 'Assignment Hub', icon: '📋', route: 'teacher-dashboard' as NavigationScreen },
    { id: 'analytics', title: 'Analytics', icon: '📈', route: 'teacher-dashboard' as NavigationScreen },
  ],
  Parent: [
    { id: 'dashboard', title: 'Dashboard', icon: '👨‍👩‍👧‍👦', route: 'parent-dashboard' as NavigationScreen },
    { id: 'children', title: 'Children', icon: '👶', route: 'parent-dashboard' as NavigationScreen },
    { id: 'progress', title: 'Progress', icon: '📊', route: 'parent-dashboard' as NavigationScreen },
    { id: 'finances', title: 'Finances', icon: '💰', route: 'parent-dashboard' as NavigationScreen },
    { id: 'communication', title: 'Messages', icon: '💬', route: 'parent-dashboard' as NavigationScreen },
  ],
  Admin: [
    { id: 'dashboard', title: 'Dashboard', icon: '⚙️', route: 'admin-dashboard' as NavigationScreen },
    { id: 'operations', title: 'Operations', icon: '🏢', route: 'admin-dashboard' as NavigationScreen },
    { id: 'financial', title: 'Financial', icon: '💰', route: 'admin-dashboard' as NavigationScreen },
    { id: 'analytics', title: 'Analytics', icon: '📈', route: 'admin-dashboard' as NavigationScreen },
    { id: 'system', title: 'System Health', icon: '🔧', route: 'admin-dashboard' as NavigationScreen },
  ],
};

export const ResponsiveAppNavigator: React.FC<ResponsiveAppNavigatorProps> = ({
  initialRoute = 'welcome',
  initialUser = null,
}) => {
  const deviceInfo = useResponsiveDesign();
  const [navState, setNavState] = useState<NavigationState>({
    currentRoute: initialRoute,
    currentUser: initialUser,
    previousRoute: undefined,
    params: {},
    isAuthenticated: !!initialUser,
    drawerOpen: false,
  });

  const [drawerAnimation] = useState(new Animated.Value(0));
  const [overlayAnimation] = useState(new Animated.Value(0));
  
  // Get responsive styles
  const spacing = ResponsiveSpacing.getSpacing(deviceInfo);
  const navigationLayout = ResponsiveNavigation.getNavigationLayout(deviceInfo);
  const contentPadding = ResponsiveLayout.getContentPadding(deviceInfo);

  const navigate = (route: NavigationScreen, params?: any, user?: User) => {
    setNavState(prev => ({
      ...prev,
      previousRoute: prev.currentRoute,
      currentRoute: route,
      params: params || {},
      currentUser: user || prev.currentUser,
      isAuthenticated: !!(user || prev.currentUser),
      drawerOpen: false,
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: `user_${Date.now()}`,
        firstName: role === 'Student' ? 'Alex' : role === 'Teacher' ? 'Dr. Sarah' : role === 'Parent' ? 'Jennifer' : 'Dr. Michael',
        lastName: role === 'Student' ? 'Johnson' : role === 'Teacher' ? 'Wilson' : role === 'Parent' ? 'Johnson' : 'Rodriguez',
        email,
        role,
        isVerified: true,
      };

      const dashboardRoute: NavigationScreen = `${role.toLowerCase()}-dashboard` as NavigationScreen;
      navigate(dashboardRoute, {}, mockUser);
    } catch (error) {
      Alert.alert('Login Error', 'Please try again.');
    }
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
          onPress: () => {
            setNavState(prev => ({
              ...prev,
              currentUser: null,
              isAuthenticated: false,
              currentRoute: 'welcome',
              drawerOpen: false,
            }));
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

  // Responsive Navigation Rail (for Medium screens)
  const renderNavigationRail = () => {
    if (!navState.currentUser || navigationLayout !== 'rail') return null;

    const roleColors = ROLE_COLORS[navState.currentUser.role];
    const navItems = NAVIGATION_ITEMS[navState.currentUser.role];

    return (
      <View style={[styles.navigationRail, { backgroundColor: roleColors.primary }]}>
        <SafeAreaView style={styles.railContent}>
          {/* User Avatar */}
          <View style={[styles.railAvatar, { backgroundColor: roleColors.secondary }]}>
            <Text style={[styles.railAvatarText, { color: roleColors.accent }]}>
              {navState.currentUser.firstName.charAt(0)}{navState.currentUser.lastName.charAt(0)}
            </Text>
          </View>

          {/* Navigation Items */}
          <ScrollView style={styles.railNavigation} showsVerticalScrollIndicator={false}>
            {navItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.railNavItem,
                  navState.currentRoute === item.route && { backgroundColor: roleColors.secondary }
                ]}
                onPress={() => navigate(item.route)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.railNavIcon,
                  navState.currentRoute === item.route && { fontSize: ResponsiveTypography.getScaledSize(28, deviceInfo) }
                ]}>
                  {item.icon}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Logout */}
          <TouchableOpacity style={styles.railLogout} onPress={handleLogout}>
            <Text style={styles.railNavIcon}>🚪</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  };

  // Enhanced drawer for large screens (persistent navigation)
  const renderPersistentDrawer = () => {
    if (!navState.currentUser || navigationLayout !== 'drawer') return null;

    const roleColors = ROLE_COLORS[navState.currentUser.role];
    const navItems = NAVIGATION_ITEMS[navState.currentUser.role];

    return (
      <View style={[styles.persistentDrawer, { backgroundColor: roleColors.primary }]}>
        <SafeAreaView style={styles.persistentDrawerContent}>
          {/* User Profile */}
          <View style={styles.persistentUserProfile}>
            <View style={[styles.persistentAvatar, { backgroundColor: roleColors.secondary }]}>
              <Text style={[styles.persistentAvatarText, { color: roleColors.accent }]}>
                {navState.currentUser.firstName.charAt(0)}{navState.currentUser.lastName.charAt(0)}
              </Text>
            </View>
            <View style={styles.persistentUserInfo}>
              <Text style={[styles.persistentUserName, { fontSize: ResponsiveTypography.getScaledSize(18, deviceInfo) }]}>
                {navState.currentUser.firstName} {navState.currentUser.lastName}
              </Text>
              <Text style={[styles.persistentUserRole, { fontSize: ResponsiveTypography.getScaledSize(14, deviceInfo) }]}>
                {navState.currentUser.role}
              </Text>
            </View>
          </View>

          {/* Navigation Items */}
          <ScrollView style={styles.persistentNavigation} showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <Text style={[styles.persistentSectionTitle, { fontSize: ResponsiveTypography.getScaledSize(12, deviceInfo) }]}>
                NAVIGATION
              </Text>
              {navItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.persistentNavItem,
                    navState.currentRoute === item.route && { backgroundColor: roleColors.secondary }
                  ]}
                  onPress={() => navigate(item.route)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.persistentNavIcon, { fontSize: ResponsiveTypography.getScaledSize(20, deviceInfo) }]}>
                    {item.icon}
                  </Text>
                  <Text style={[
                    styles.persistentNavText,
                    { fontSize: ResponsiveTypography.getScaledSize(16, deviceInfo) },
                    navState.currentRoute === item.route && { fontWeight: '600', color: roleColors.accent }
                  ]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Logout */}
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}>
            <TouchableOpacity style={styles.persistentLogout} onPress={handleLogout}>
              <Text style={[styles.persistentNavIcon, { fontSize: ResponsiveTypography.getScaledSize(18, deviceInfo) }]}>🚪</Text>
              <Text style={[styles.persistentLogoutText, { fontSize: ResponsiveTypography.getScaledSize(16, deviceInfo) }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  };

  // Mobile drawer (same as before but responsive)
  const renderMobileDrawer = () => {
    if (!navState.currentUser || !navState.drawerOpen || navigationLayout !== 'bottom') return null;

    const roleColors = ROLE_COLORS[navState.currentUser.role];
    const navItems = NAVIGATION_ITEMS[navState.currentUser.role];

    const drawerTranslate = drawerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [-deviceInfo.dimensions.width * 0.85, 0],
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
            styles.mobileDrawer, 
            { 
              transform: [{ translateX: drawerTranslate }],
              backgroundColor: roleColors.primary,
              width: deviceInfo.dimensions.width * 0.85,
              maxWidth: deviceInfo.isTablet ? 380 : 340,
            }
          ]}
        >
          <SafeAreaView style={styles.mobileDrawerContent}>
            {/* User Profile */}
            <View style={[styles.mobileUserProfile, { paddingHorizontal: spacing.xl, paddingVertical: spacing.xl }]}>
              <View style={[styles.mobileAvatar, { backgroundColor: roleColors.secondary }]}>
                <Text style={[styles.mobileAvatarText, { color: roleColors.accent }]}>
                  {navState.currentUser.firstName.charAt(0)}{navState.currentUser.lastName.charAt(0)}
                </Text>
              </View>
              <View style={styles.mobileUserInfo}>
                <Text style={[styles.mobileUserName, { fontSize: ResponsiveTypography.getScaledSize(18, deviceInfo) }]}>
                  {navState.currentUser.firstName} {navState.currentUser.lastName}
                </Text>
                <Text style={[styles.mobileUserRole, { fontSize: ResponsiveTypography.getScaledSize(14, deviceInfo) }]}>
                  {navState.currentUser.role}
                </Text>
              </View>
            </View>

            {/* Navigation Items */}
            <ScrollView style={styles.mobileNavigation} showsVerticalScrollIndicator={false}>
              <View style={{ paddingHorizontal: spacing.lg }}>
                {navItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.mobileNavItem}
                    onPress={() => navigate(item.route)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.mobileNavIcon, { fontSize: ResponsiveTypography.getScaledSize(22, deviceInfo) }]}>
                      {item.icon}
                    </Text>
                    <Text style={[styles.mobileNavText, { fontSize: ResponsiveTypography.getScaledSize(16, deviceInfo) }]}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Logout */}
            <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}>
              <TouchableOpacity style={styles.mobileLogout} onPress={handleLogout}>
                <Text style={[styles.mobileNavIcon, { fontSize: ResponsiveTypography.getScaledSize(18, deviceInfo) }]}>🚪</Text>
                <Text style={[styles.mobileLogoutText, { fontSize: ResponsiveTypography.getScaledSize(16, deviceInfo) }]}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </>
    );
  };

  // Responsive header
  const renderHeader = () => {
    if (!navState.isAuthenticated || ['welcome', 'login', 'register'].includes(navState.currentRoute)) {
      return null;
    }

    const roleColors = navState.currentUser ? ROLE_COLORS[navState.currentUser.role] : ROLE_COLORS.Student;
    const showMenuButton = navigationLayout === 'bottom';

    return (
      <View style={[styles.header, { backgroundColor: roleColors.primary }]}>
        <SafeAreaView style={[styles.headerContent, { paddingHorizontal: contentPadding.horizontal }]}>
          {showMenuButton && (
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
          )}

          <View style={styles.headerTitle}>
            <Text style={[styles.headerTitleText, { fontSize: ResponsiveTypography.getScaledSize(20, deviceInfo) }]}>
              Manushi Coaching
            </Text>
            {ResponsiveRender.forCompact(deviceInfo, (
              <Text style={[styles.headerSubtitle, { fontSize: ResponsiveTypography.getScaledSize(12, deviceInfo) }]}>
                {navState.currentUser?.role} Portal
              </Text>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigate('notifications')}
            activeOpacity={0.7}
          >
            <Text style={[styles.notificationIcon, { fontSize: ResponsiveTypography.getScaledSize(22, deviceInfo) }]}>🔔</Text>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  };

  // Main content with responsive wrapper
  const renderMainContent = () => {
    const maxContentWidth = ResponsiveLayout.getMaxContentWidth(deviceInfo);
    
    return (
      <View style={[
        styles.mainContent,
        maxContentWidth && { maxWidth: maxContentWidth, alignSelf: 'center' }
      ]}>
        {renderCurrentScreen()}
      </View>
    );
  };

  const renderCurrentScreen = () => {
    switch (navState.currentRoute) {
      case 'welcome':
        return (
          <ModernWelcomeScreen 
            onRoleSelect={(role: UserRole) => {
              navigate('login', { selectedRole: role });
            }} 
          />
        );
      
      case 'login':
        return (
          <UltraModernLoginScreen
            role={navState.params?.selectedRole || 'Student'}
            onLogin={handleLogin}
            onForgotPassword={() => navigate('forgotPassword')}
            onSignUp={() => navigate('register', navState.params)}
            onBackToRoleSelection={() => navigate('welcome')}
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

      case 'student-dashboard':
        return (
          <StudentDashboard
            studentName={navState.currentUser ? `${navState.currentUser.firstName} ${navState.currentUser.lastName}` : 'Alex Johnson'}
            onNavigate={(screen) => {
              if (screen === 'back-to-demo') {
                navigate('welcome');
              } else if (screen === 'progress-tracking') {
                navigate('progress-detail', { studentId: navState.currentUser?.id || '1' });
              } else if (screen === 'assignment-help') {
                navigate('assignment-help');
              } else if (screen === 'doubt-submission') {
                navigate('doubt-submission');
              } else if (screen === 'study-materials') {
                navigate('study-library');
              } else if (screen === 'practice-tests') {
                navigate('practice-tests');
              } else if (screen === 'live-classes') {
                navigate('student-live-class', { classId: '1' });
              } else if (screen === 'performance-analytics') {
                navigate('performance-analytics');
              } else if (screen === 'ai-tutor') {
                navigate('ai-tutor-chat');
              } else if (screen === 'study-planner') {
                navigate('study-planner');
              } else if (screen === 'notifications') {
                navigate('notification-screen');
              } else if (screen === 'settings') {
                navigate('settings-screen');
              } else {
                // Navigate to existing screens or show informative message
                navigate('student-dashboard');
              }
            }}
          />
        );

      case 'teacher-dashboard':
        return (
          <TeacherDashboard
            teacherName={navState.currentUser ? `${navState.currentUser.firstName} ${navState.currentUser.lastName}` : 'Dr. Sarah Wilson'}
            onNavigate={(screen) => {
              if (screen === 'back-to-demo') {
                navigate('welcome');
              } else if (screen === 'start-class') {
                navigate('start-class');
              } else if (screen === 'live-class') {
                navigate('live-class', { classId: '1' });
              } else if (screen === 'grade-assignments') {
                navigate('grade-assignment');
              } else if (screen === 'view-reports') {
                navigate('view-reports');
              } else if (screen === 'take-attendance') {
                navigate('take-attendance');
              } else if (screen === 'send-announcement') {
                navigate('send-announcement');
              } else if (screen === 'class-management') {
                navigate('class-management');
              } else if (screen === 'student-analytics') {
                navigate('student-analytics');
              } else if (screen === 'assignment-grading') {
                navigate('assignment-grading');
              } else if (screen === 'professional-development') {
                navigate('teacher-professional-development');
              } else if (screen === 'ai-insights') {
                navigate('ai-insight');
              } else if (screen === 'performance-tracking') {
                navigate('teacher-performance-tracking');
              } else if (screen === 'notifications') {
                navigate('notification-screen');
              } else if (screen === 'settings') {
                navigate('settings-screen');
              } else {
                // Navigate to teacher dashboard for unhandled screens
                navigate('teacher-dashboard');
              }
            }}
          />
        );

      case 'parent-dashboard':
        return (
          <ParentDashboard
            parentName={navState.currentUser ? `${navState.currentUser.firstName} ${navState.currentUser.lastName}` : 'Jennifer Johnson'}
            onNavigate={(screen) => {
              if (screen === 'back-to-demo') {
                navigate('welcome');
              } else if (screen === 'child-progress') {
                navigate('child-progress');
              } else if (screen === 'parent-communication') {
                navigate('parent-communication');
              } else if (screen === 'fee-management') {
                navigate('fee-management');
              } else if (screen === 'attendance-monitoring') {
                navigate('attendance-monitoring');
              } else if (screen === 'teacher-meetings') {
                navigate('teacher-meetings');
              } else if (screen === 'academic-calendar') {
                navigate('academic-calendar');
              } else if (screen === 'homework-tracking') {
                navigate('homework-tracking');
              } else if (screen === 'performance-reports') {
                navigate('performance-reports');
              } else if (screen === 'child-profile') {
                navigate('child-profile');
              } else if (screen === 'notifications') {
                navigate('notification-screen');
              } else if (screen === 'settings') {
                navigate('settings-screen');
              } else {
                // Navigate to parent dashboard for unhandled screens
                navigate('parent-dashboard');
              }
            }}
          />
        );

      case 'admin-dashboard':
        return (
          <AdminDashboard
            adminName={navState.currentUser ? `${navState.currentUser.firstName} ${navState.currentUser.lastName}` : 'Dr. Michael Rodriguez'}
            onNavigate={(screen) => {
              if (screen === 'back-to-demo') {
                navigate('welcome');
              } else if (screen === 'user-management') {
                navigate('user-management');
              } else if (screen === 'organization-management') {
                navigate('organization-management');
              } else if (screen === 'system-settings') {
                navigate('system-settings');
              } else if (screen === 'advanced-analytics') {
                navigate('advanced-analytics');
              } else if (screen === 'feature-validation') {
                navigate('admin-feature-validation');
              } else if (screen === 'automation-center') {
                navigate('automation-center');
              } else if (screen === 'kpi-monitoring') {
                navigate('kpi-monitoring');
              } else if (screen === 'alert-center') {
                navigate('alert-center');
              } else if (screen === 'data-management') {
                navigate('data-management');
              } else if (screen === 'integration-hub') {
                navigate('integration-hub');
              } else if (screen === 'audit-logs') {
                navigate('audit-logs');
              } else if (screen === 'notifications') {
                navigate('notification-screen');
              } else if (screen === 'settings') {
                navigate('settings-screen');
              } else {
                // Navigate to admin dashboard for unhandled screens
                navigate('admin-dashboard');
              }
            }}
          />
        );

      case 'design-system-test':
        return <DesignSystemTest />;

      case 'profile':
      case 'notifications':
        return (
          <NotificationScreen 
            onNavigate={navigate}
            currentUser={navState.currentUser}
          />
        );
      
      case 'settings':
        return (
          <View style={[styles.comingSoonContainer, { padding: spacing.XXL }]}>
            <Text style={[
              styles.comingSoonTitle, 
              { fontSize: ResponsiveTypography.getScaledSize(24, deviceInfo) }
            ]}>
              Settings
            </Text>
            <Text style={[
              styles.comingSoonText,
              { fontSize: ResponsiveTypography.getScaledSize(16, deviceInfo) }
            ]}>
              Settings screen is available! Configure your preferences and account settings.
            </Text>
            <TouchableOpacity 
              style={[styles.backButton, { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg }]}
              onPress={() => {
                if (navState.currentUser) {
                  const dashboardRoute: NavigationScreen = `${navState.currentUser.role.toLowerCase()}-dashboard` as NavigationScreen;
                  navigate(dashboardRoute);
                }
              }}
            >
              <Text style={[styles.backButtonText, { fontSize: ResponsiveTypography.getScaledSize(16, deviceInfo) }]}>
                ← Back to Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return (
          <View style={[styles.errorContainer, { padding: spacing.XXL }]}>
            <Text style={[styles.errorText, { fontSize: ResponsiveTypography.getScaledSize(20, deviceInfo) }]}>
              Screen not found
            </Text>
            <TouchableOpacity 
              style={[styles.backButton, { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg }]}
              onPress={() => navigate('welcome')}
            >
              <Text style={[styles.backButtonText, { fontSize: ResponsiveTypography.getScaledSize(16, deviceInfo) }]}>
                ← Back to Welcome
              </Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={navState.currentUser ? ROLE_COLORS[navState.currentUser.role].primary : LightTheme.Primary}
        barStyle="light-content"
      />
      
      <View style={styles.appLayout}>
        {/* Persistent Navigation for Large Screens */}
        {renderPersistentDrawer()}
        
        {/* Navigation Rail for Medium Screens */}
        {renderNavigationRail()}
        
        {/* Main Content Area */}
        <View style={styles.contentArea}>
          {renderHeader()}
          {renderMainContent()}
        </View>
        
        {/* Mobile Drawer for Small Screens */}
        {renderMobileDrawer()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  appLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  contentArea: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    width: '100%',
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
    paddingVertical: 12,
    height: 64,
  },
  menuButton: {
    padding: 12,
    marginRight: 12,
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
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  notificationButton: {
    position: 'relative',
    padding: 12,
    borderRadius: 8,
  },
  notificationIcon: {
    color: '#FFFFFF',
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

  // Navigation Rail Styles (Medium screens)
  navigationRail: {
    width: 88,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  railContent: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
  },
  railAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  railAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  railNavigation: {
    flex: 1,
  },
  railNavItem: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  railNavIcon: {
    fontSize: 24,
  },
  railLogout: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Persistent Drawer Styles (Large screens)
  persistentDrawer: {
    width: 280,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  persistentDrawerContent: {
    flex: 1,
  },
  persistentUserProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  persistentAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  persistentAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  persistentUserInfo: {
    flex: 1,
  },
  persistentUserName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  persistentUserRole: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  persistentNavigation: {
    flex: 1,
    paddingTop: 16,
  },
  persistentSectionTitle: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  persistentNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  persistentNavIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  persistentNavText: {
    color: '#FFFFFF',
    flex: 1,
  },
  persistentLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  persistentLogoutText: {
    color: '#FFFFFF',
    marginLeft: 16,
  },

  // Mobile Drawer Styles
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
  mobileDrawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  mobileDrawerContent: {
    flex: 1,
  },
  mobileUserProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  mobileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mobileAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mobileUserInfo: {
    flex: 1,
  },
  mobileUserName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mobileUserRole: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  mobileNavigation: {
    flex: 1,
    paddingTop: 16,
  },
  mobileNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  mobileNavIcon: {
    marginRight: 16,
    width: 28,
    textAlign: 'center',
  },
  mobileNavText: {
    color: '#FFFFFF',
    flex: 1,
  },
  mobileLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  mobileLogoutText: {
    color: '#FFFFFF',
    marginLeft: 16,
  },

  // Utility Styles
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LightTheme.Background,
  },
  comingSoonTitle: {
    fontWeight: 'bold',
    color: LightTheme.OnSurface,
    marginBottom: 16,
    textAlign: 'center',
  },
  comingSoonText: {
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: LightTheme.Primary,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButtonText: {
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LightTheme.Background,
  },
  errorText: {
    color: LightTheme.Error,
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default ResponsiveAppNavigator;