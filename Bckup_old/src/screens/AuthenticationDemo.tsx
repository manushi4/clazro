/**
 * AuthenticationDemo - Showcases Phase 2 authentication screens
 * Interactive demo for testing authentication flows
 * Error-free React Native 0.81+ implementation
 * Manushi Coaching Platform
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { ModernWelcomeScreen } from './auth/ModernWelcomeScreen';
import { UltraModernLoginScreen } from './auth/UltraModernLoginScreen';
import { RegisterScreen } from './auth/RegisterScreen';
import { StudentDashboard } from './dashboard/StudentDashboard';
import { TeacherDashboard } from './dashboard/TeacherDashboard';
import { ParentDashboard } from './dashboard/ParentDashboard';
import { AdminDashboard } from './dashboard/AdminDashboard';
import CoachingButton from '../components/core/CoachingButton';
import DashboardCard from '../components/core/DashboardCard';
import { LightTheme } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';

type UserRole = 'Student' | 'Teacher' | 'Parent' | 'Admin';
type AuthScreen = 'demo' | 'welcome' | 'login' | 'register' | 'student-dashboard' | 'teacher-dashboard' | 'parent-dashboard' | 'admin-dashboard';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  grade?: string;
  subjects?: string;
  childName?: string;
  organization?: string;
}

export const AuthenticationDemo: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('demo');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [demoStats, setDemoStats] = useState({
    welcomeViews: 0,
    loginAttempts: 0,
    registrations: 0,
    roleSelections: { Student: 0, Teacher: 0, Parent: 0, Admin: 0 },
  });

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setCurrentScreen('login');
    setDemoStats(prev => ({
      ...prev,
      roleSelections: {
        ...prev.roleSelections,
        [role]: prev.roleSelections[role] + 1,
      },
    }));
  };

  const handleLogin = async (email: string, password: string, role: UserRole) => {
    setDemoStats(prev => ({ ...prev, loginAttempts: prev.loginAttempts + 1 }));
    
    // Simulate login process and navigate to role-specific dashboard
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (role === 'Student') {
          setCurrentScreen('student-dashboard');
        } else if (role === 'Teacher') {
          setCurrentScreen('teacher-dashboard');
        } else if (role === 'Parent') {
          setCurrentScreen('parent-dashboard');
        } else if (role === 'Admin') {
          setCurrentScreen('admin-dashboard');
        } else {
          Alert.alert(
            'Demo Login Successful! 🎉',
            `Welcome back, ${role}!\n\nEmail: ${email}\n\nAll role dashboards are now implemented in Phase 3-6!`,
            [
              { text: 'Back to Demo', onPress: () => setCurrentScreen('demo') }
            ]
          );
        }
        resolve();
      }, 1000);
    });
  };

  const handleRegister = async (userData: RegistrationData, role: UserRole) => {
    setDemoStats(prev => ({ ...prev, registrations: prev.registrations + 1 }));
    
    // Simulate registration process
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        Alert.alert(
          'Demo Registration Successful! 🎉',
          `Account created for ${userData.firstName} ${userData.lastName}!\n\nRole: ${role}\nEmail: ${userData.email}\n\nThis is a demo - no actual account was created.`,
          [
            { text: 'Back to Demo', onPress: () => setCurrentScreen('demo') }
          ]
        );
        resolve();
      }, 1500);
    });
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password Demo',
      'In a real app, this would send a password reset email.',
      [{ text: 'OK' }]
    );
  };

  const resetDemo = () => {
    setCurrentScreen('demo');
    setSelectedRole(null);
    setDemoStats({
      welcomeViews: 0,
      loginAttempts: 0,
      registrations: 0,
      roleSelections: { Student: 0, Teacher: 0, Parent: 0, Admin: 0 },
    });
  };

  const renderDemoScreen = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>✨ Modern Authentication UI</Text>
          <Text style={styles.subtitle}>
            Experience glassmorphism, animations, and cutting-edge design
          </Text>
        </View>

        <View style={styles.demoSection}>
          <Text style={styles.sectionTitle}>Authentication Flow</Text>
          
          <DashboardCard
            title="Welcome Screen"
            subtitle="Role selection interface"
            onPress={() => {
              setCurrentScreen('welcome');
              setDemoStats(prev => ({ ...prev, welcomeViews: prev.welcomeViews + 1 }));
            }}
          >
            <Text style={styles.cardDescription}>
              Choose from Student, Teacher, Parent, or Admin roles
            </Text>
          </DashboardCard>

          <DashboardCard
            title="Login Screen"
            subtitle="Role-based authentication"
            onPress={() => {
              setSelectedRole('Student');
              setCurrentScreen('login');
            }}
          >
            <Text style={styles.cardDescription}>
              Ultra-modern login with enhanced typography and optimized performance
            </Text>
          </DashboardCard>

          <DashboardCard
            title="Registration Screen"
            subtitle="Multi-step account creation"
            onPress={() => {
              setSelectedRole('Teacher');
              setCurrentScreen('register');
            }}
          >
            <Text style={styles.cardDescription}>
              Comprehensive registration with role-specific fields
            </Text>
          </DashboardCard>

          <DashboardCard
            title="✨ Student Dashboard (Phase 3)"
            subtitle="Complete coaching interface"
            onPress={() => {
              setSelectedRole('Student');
              setCurrentScreen('student-dashboard');
            }}
          >
            <Text style={styles.cardDescription}>
              Full student experience: Today's schedule, progress tracking, AI recommendations, quick actions
            </Text>
          </DashboardCard>

          <DashboardCard
            title="🏆 Teacher Dashboard (Phase 4)"
            subtitle="Advanced teaching management"
            onPress={() => {
              setSelectedRole('Teacher');
              setCurrentScreen('teacher-dashboard');
            }}
          >
            <Text style={styles.cardDescription}>
              Complete teacher toolkit: Live class control, student management, assignment hub, AI assistance
            </Text>
          </DashboardCard>

          <DashboardCard
            title="👨‍👩‍👧‍👦 Parent Dashboard (Phase 5)"
            subtitle="Comprehensive child monitoring"
            onPress={() => {
              setSelectedRole('Parent');
              setCurrentScreen('parent-dashboard');
            }}
          >
            <Text style={styles.cardDescription}>
              Full parent experience: Child overview, progress tracking, financial management, digital monitoring
            </Text>
          </DashboardCard>

          <DashboardCard
            title="⚙️ Admin Dashboard (Phase 6)"
            subtitle="Complete system administration"
            onPress={() => {
              setSelectedRole('Admin');
              setCurrentScreen('admin-dashboard');
            }}
          >
            <Text style={styles.cardDescription}>
              Full admin control: Executive KPIs, operations center, financial dashboard, analytics engine
            </Text>
          </DashboardCard>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Demo Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{demoStats.welcomeViews}</Text>
              <Text style={styles.statLabel}>Welcome Views</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{demoStats.loginAttempts}</Text>
              <Text style={styles.statLabel}>Login Attempts</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{demoStats.registrations}</Text>
              <Text style={styles.statLabel}>Registrations</Text>
            </View>
          </View>

          <View style={styles.roleStats}>
            <Text style={styles.roleStatsTitle}>Role Selection Stats:</Text>
            {Object.entries(demoStats.roleSelections).map(([role, count]) => (
              <Text key={role} style={styles.roleStatItem}>
                {role}: {count} selections
              </Text>
            ))}
          </View>

          <CoachingButton
            title="🔄 Reset Demo Stats"
            variant="secondary"
            size="medium"
            onPress={resetDemo}
            style={styles.resetButton}
          />
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Features Demonstrated</Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✨ Phase 2: Ultra-modern authentication UI</Text>
            <Text style={styles.featureItem}>🎭 Advanced glassmorphism and animations</Text>
            <Text style={styles.featureItem}>⚡ Performance-optimized animations</Text>
            <Text style={styles.featureItem}>💎 Enhanced typography and theming</Text>
            <Text style={styles.featureItem}>🏆 Phase 3: Complete Student Dashboard</Text>
            <Text style={styles.featureItem}>📚 Today's schedule with live class integration</Text>
            <Text style={styles.featureItem}>📊 Visual progress tracking and analytics</Text>
            <Text style={styles.featureItem}>🤖 AI-powered study recommendations</Text>
            <Text style={styles.featureItem}>🎯 Phase 4: Advanced Teacher Dashboard</Text>
            <Text style={styles.featureItem}>🎮 Live class control center with attendance</Text>
            <Text style={styles.featureItem}>👥 Student management and progress monitoring</Text>
            <Text style={styles.featureItem}>📝 Assignment hub with grading automation</Text>
            <Text style={styles.featureItem}>🤖 AI teaching assistant and insights</Text>
            <Text style={styles.featureItem}>👨‍👩‍👧‍👦 Phase 5: Complete Parent Dashboard</Text>
            <Text style={styles.featureItem}>📊 Child overview with attendance and grades</Text>
            <Text style={styles.featureItem}>💰 Financial management with fee tracking</Text>
            <Text style={styles.featureItem}>💬 Communication hub for teacher interactions</Text>
            <Text style={styles.featureItem}>📱 Digital monitoring and screen time insights</Text>
            <Text style={styles.featureItem}>⚙️ Phase 6: Advanced Admin Dashboard</Text>
            <Text style={styles.featureItem}>📊 Executive KPIs and system health monitoring</Text>
            <Text style={styles.featureItem}>🏢 Operations center with user management</Text>
            <Text style={styles.featureItem}>💰 Financial dashboard with revenue tracking</Text>
            <Text style={styles.featureItem}>📈 Analytics engine with performance metrics</Text>
            <Text style={styles.featureItem}>🎯 Complete 4-role coaching platform</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // Render current screen
  switch (currentScreen) {
    case 'welcome':
      return <ModernWelcomeScreen onRoleSelect={handleRoleSelect} />;
    
    case 'login':
      return (
        <UltraModernLoginScreen
          role={selectedRole || 'Student'}
          onLogin={handleLogin}
          onForgotPassword={handleForgotPassword}
          onSignUp={() => setCurrentScreen('register')}
          onBackToRoleSelection={() => setCurrentScreen('welcome')}
        />
      );
    
    case 'register':
      return (
        <RegisterScreen
          role={selectedRole || 'Student'}
          onRegister={handleRegister}
          onBackToLogin={() => setCurrentScreen('login')}
          onBackToRoleSelection={() => setCurrentScreen('welcome')}
        />
      );

    case 'student-dashboard':
      return (
        <StudentDashboard
          studentName="Alex Johnson"
          onNavigate={(screen) => {
            // Handle navigation to specific features
            if (screen === 'back' || screen === 'back-to-demo') {
              setCurrentScreen('demo');
            } else {
              Alert.alert(
                'Feature Coming Soon',
                `${screen} feature will be implemented in upcoming phases.`,
                [{ text: 'OK' }]
              );
            }
          }}
        />
      );

    case 'teacher-dashboard':
      return (
        <TeacherDashboard
          teacherName="Dr. Sarah Wilson"
          onNavigate={(screen) => {
            // Handle navigation to specific features
            if (screen === 'back' || screen === 'back-to-demo') {
              setCurrentScreen('demo');
            } else {
              Alert.alert(
                'Feature Coming Soon',
                `${screen} feature will be implemented in upcoming phases.`,
                [{ text: 'OK' }]
              );
            }
          }}
        />
      );

    case 'parent-dashboard':
      return (
        <ParentDashboard
          parentName="Jennifer Johnson"
          onNavigate={(screen) => {
            // Handle navigation to specific features
            if (screen === 'back' || screen === 'back-to-demo') {
              setCurrentScreen('demo');
            } else {
              Alert.alert(
                'Feature Coming Soon',
                `${screen} feature will be implemented in upcoming phases.`,
                [{ text: 'OK' }]
              );
            }
          }}
        />
      );

    case 'admin-dashboard':
      return (
        <AdminDashboard
          adminName="Dr. Michael Rodriguez"
          onNavigate={(screen) => {
            // Handle navigation to specific features
            if (screen === 'back' || screen === 'back-to-demo') {
              setCurrentScreen('demo');
            } else {
              Alert.alert(
                'Feature Coming Soon',
                `${screen} feature will be implemented in upcoming phases.`,
                [{ text: 'OK' }]
              );
            }
          }}
        />
      );
    
    default:
      return renderDemoScreen();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.LG,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.XL,
  },
  title: {
    fontSize: Typography.headlineLarge.fontSize,
    fontFamily: Typography.headlineLarge.fontFamily,
    fontWeight: Typography.headlineLarge.fontWeight,
    color: LightTheme.Primary,
    textAlign: 'center',
    marginBottom: Spacing.SM,
  },
  subtitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  demoSection: {
    marginBottom: Spacing.XL,
  },
  sectionTitle: {
    fontSize: Typography.titleLarge.fontSize,
    fontFamily: Typography.titleLarge.fontFamily,
    fontWeight: Typography.titleLarge.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  cardDescription: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: Typography.bodyMedium.lineHeight,
  },
  statsSection: {
    marginBottom: Spacing.XL,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.LG,
  },
  statCard: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: 12,
    padding: Spacing.MD,
    alignItems: 'center',
    flex: 0.3,
  },
  statNumber: {
    fontSize: Typography.headlineSmall.fontSize,
    fontFamily: Typography.headlineSmall.fontFamily,
    fontWeight: Typography.headlineSmall.fontWeight,
    color: LightTheme.Primary,
    marginBottom: Spacing.XS,
  },
  statLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  roleStats: {
    backgroundColor: LightTheme.Surface,
    borderRadius: 12,
    padding: Spacing.MD,
    marginBottom: Spacing.MD,
  },
  roleStatsTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  roleStatItem: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  resetButton: {
    alignSelf: 'center',
  },
  featuresSection: {
    marginBottom: Spacing.LG,
  },
  featureList: {
    backgroundColor: LightTheme.Surface,
    borderRadius: 12,
    padding: Spacing.MD,
  },
  featureItem: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    lineHeight: Typography.bodyMedium.lineHeight,
  },
});

export default AuthenticationDemo;