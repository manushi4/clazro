/**
 * Teacher Navigation
 * Bottom tab navigator with nested stacks - CORRECTED VERSION
 * Uses actual existing screen files from migration
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

// Actual Screen Imports (verified to exist)
import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import LiveClassScreen from '../screens/teacher/LiveClassScreen';
import AdvancedClassControlScreen from '../screens/teacher/AdvancedClassControlScreen';
import ClassPreparationScreen from '../screens/teacher/ClassPreparationScreen';
import AssignmentCreatorScreen from '../screens/teacher/AssignmentCreatorScreen';
import AssignmentGradingScreen from '../screens/teacher/AssignmentGradingScreen';
import EnhancedAssignmentGradingScreen from '../screens/teacher/EnhancedAssignmentGradingScreen';
import AttendanceTrackingScreen from '../screens/teacher/AttendanceTrackingScreen';
import QuestionBankManagementScreen from '../screens/teacher/QuestionBankManagementScreen';
import QuestionBankManagerScreen from '../screens/teacher/QuestionBankManagerScreen';
import VoiceAIAssessmentSystem from '../screens/teacher/VoiceAIAssessmentSystem';
import StudentDetailScreen from '../screens/teacher/StudentDetailScreen';
import TeacherAIAnalyticsDashboard from '../screens/teacher/TeacherAIAnalyticsDashboard';
import AssessmentAnalyticsScreen from '../screens/teacher/AssessmentAnalyticsScreen';
import EnhancedAssessmentAnalyticsScreen from '../screens/teacher/EnhancedAssessmentAnalyticsScreen';
import AITeachingInsightsScreen from '../screens/teacher/AITeachingInsightsScreen';
import CommunicationHubScreen from '../screens/teacher/CommunicationHubScreen';
import TeacherWorkflowOptimizationScreen from '../screens/teacher/TeacherWorkflowOptimizationScreen';
import TeacherProfessionalDevelopment from '../screens/teacher/TeacherProfessionalDevelopment';
import AutomatedAdminTasksScreen from '../screens/teacher/AutomatedAdminTasksScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack (Dashboard)
function HomeStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="TeacherDashboard"
        component={TeacherDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AITeachingInsights"
        component={AITeachingInsightsScreen}
        options={{ title: 'AI Insights' }}
      />
      <Stack.Screen
        name="WorkflowOptimization"
        component={TeacherWorkflowOptimizationScreen}
        options={{ title: 'Workflow Optimizer' }}
      />
    </Stack.Navigator>
  );
}

// Classes Stack
function ClassesStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
      }}
    >
      <Stack.Screen
        name="LiveClass"
        component={LiveClassScreen}
        options={{ title: 'Live Classes' }}
      />
      <Stack.Screen
        name="AdvancedClassControl"
        component={AdvancedClassControlScreen}
        options={{ title: 'Class Control', headerShown: false }}
      />
      <Stack.Screen
        name="ClassPreparation"
        component={ClassPreparationScreen}
        options={{ title: 'Prepare Class' }}
      />
      <Stack.Screen
        name="Attendance"
        component={AttendanceTrackingScreen}
        options={{ title: 'Attendance' }}
      />
      <Stack.Screen
        name="AssignmentCreator"
        component={AssignmentCreatorScreen}
        options={{ title: 'Create Assignment' }}
      />
      <Stack.Screen
        name="AssignmentGrading"
        component={AssignmentGradingScreen}
        options={{ title: 'Grade Assignments' }}
      />
      <Stack.Screen
        name="EnhancedGrading"
        component={EnhancedAssignmentGradingScreen}
        options={{ title: 'Smart Grading' }}
      />
      <Stack.Screen
        name="QuestionBank"
        component={QuestionBankManagementScreen}
        options={{ title: 'Question Bank' }}
      />
      <Stack.Screen
        name="QuestionManager"
        component={QuestionBankManagerScreen}
        options={{ title: 'Manage Questions' }}
      />
      <Stack.Screen
        name="VoiceAssessment"
        component={VoiceAIAssessmentSystem}
        options={{ title: 'Voice Assessment' }}
      />
    </Stack.Navigator>
  );
}

// Students Stack
function StudentsStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
      }}
    >
      <Stack.Screen
        name="StudentDetail"
        component={StudentDetailScreen}
        options={{ title: 'Students' }}
      />
      <Stack.Screen
        name="Communication"
        component={CommunicationHubScreen}
        options={{ title: 'Communication' }}
      />
    </Stack.Navigator>
  );
}

// Analytics Stack
function AnalyticsStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
      }}
    >
      <Stack.Screen
        name="AIAnalytics"
        component={TeacherAIAnalyticsDashboard}
        options={{ title: 'AI Analytics' }}
      />
      <Stack.Screen
        name="AssessmentAnalytics"
        component={AssessmentAnalyticsScreen}
        options={{ title: 'Assessment Data' }}
      />
      <Stack.Screen
        name="EnhancedAnalytics"
        component={EnhancedAssessmentAnalyticsScreen}
        options={{ title: 'Advanced Analytics' }}
      />
    </Stack.Navigator>
  );
}

// More Stack (Professional Development, Settings, etc.)
function MoreStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.Surface },
        headerTintColor: theme.OnSurface,
      }}
    >
      <Stack.Screen
        name="ProfessionalDevelopment"
        component={TeacherProfessionalDevelopment}
        options={{ title: 'Professional Development' }}
      />
      <Stack.Screen
        name="AutomatedTasks"
        component={AutomatedAdminTasksScreen}
        options={{ title: 'Automated Tasks' }}
      />
    </Stack.Navigator>
  );
}

// Main Teacher Tab Navigator
export default function TeacherNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
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
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Classes"
        component={ClassesStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="class" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Students"
        component={StudentsStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="analytics" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="menu" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
