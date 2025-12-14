/**
 * Navigation Type Definitions
 * Type-safe navigation for React Navigation 7.x
 */

import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Auth Stack
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  StudentSignupScreen: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  RoleSelection: undefined;
  OnboardingStudent: undefined;
  OnboardingTeacher: undefined;
};

// Student Stack
export type StudentStackParamList = {
  StudentDashboard: undefined;
  StudentProfile: undefined;
  StudentDoubt: undefined;
  DoubtDetail: { doubtId: string };
  StudentAssignments: undefined;
  AssignmentDetail: { assignmentId: string; studentId: string };
  AssignmentSubmission: { assignmentId: string };
  StudentClasses: undefined;
  ClassDetail: { classId: string };
  JoinLiveClass: { classId: string; sessionId: string };
  StudentTests: undefined;
  TestDetail: { testId: string };
  TakeTest: { testId: string };
  StudentPerformance: undefined;
  StudentLeaderboard: undefined;
  StudentQA: undefined;
  QADetail: { questionId: string };
  AskQuestion: undefined;
  StudentResources: undefined;
  ResourceDetail: { resourceId: string };
  StudentAttendance: undefined;
  StudentChat: { recipientId?: string };
  StudentNotifications: undefined;
  StudentSettings: undefined;
  EditStudentProfile: undefined;
  NotesAndHighlightsScreen: undefined;
};

// Teacher Stack
export type TeacherStackParamList = {
  TeacherDashboard: undefined;
  TeacherProfile: undefined;
  TeacherClasses: undefined;
  ClassManagement: { classId: string };
  CreateClass: undefined;
  LiveClassControl: { sessionId: string };
  TeacherAssignments: undefined;
  CreateAssignment: { classId?: string };
  AssignmentGrading: { assignmentId: string };
  TeacherTests: undefined;
  CreateTest: { classId?: string };
  TestResults: { testId: string };
  TeacherAttendance: undefined;
  MarkAttendance: { classId: string; sessionId: string };
  TeacherStudents: undefined;
  StudentProgress: { studentId: string };
  TeacherResources: undefined;
  UploadResource: undefined;
  TeacherAnalytics: undefined;
  TeacherChat: { recipientId?: string };
  TeacherNotifications: undefined;
  TeacherSettings: undefined;
  EditTeacherProfile: undefined;
};

// Admin Stack
export type AdminStackParamList = {
  AdminDashboard: undefined;
  UserManagement: undefined;
  StudentManagement: undefined;
  TeacherManagement: undefined;
  ParentManagement: undefined;
  CreateUser: { role: 'student' | 'teacher' | 'parent' | 'admin' };
  EditUser: { userId: string; role: string };
  ClassManagementAdmin: undefined;
  CreateClassAdmin: undefined;
  CourseManagement: undefined;
  CreateCourse: undefined;
  PaymentManagement: undefined;
  PaymentDetail: { paymentId: string };
  SubscriptionManagement: undefined;
  AnalyticsAdmin: undefined;
  ReportsAdmin: undefined;
  ContentManagement: undefined;
  NotificationManagement: undefined;
  SendNotification: undefined;
  SettingsAdmin: undefined;
  SystemConfig: undefined;
  RolePermissions: undefined;
  AuditLogs: undefined;
  SupportTickets: undefined;
  TicketDetail: { ticketId: string };
  DatabaseManagement: undefined;
  APIConfig: undefined;
  IntegrationManagement: undefined;
  BackupRestore: undefined;
};

// Parent Stack
export type ParentStackParamList = {
  // Existing screens
  ParentDashboard: undefined;
  ParentProfile: undefined;
  ChildrenManagement: undefined;
  AddChild: undefined;
  ChildProgress: { childId: string };
  ChildAttendance: { childId: string };
  ChildTests: { childId: string };
  ParentChat: { recipientId?: string };
  TeacherCommunication: { teacherId: string };
  ParentNotifications: undefined;
  ParentSettings: undefined;
  EditParentProfile: undefined;
  ParentReports: { childId: string };
  ParentFeedback: undefined;

  // Dashboard screens (Home Stack)
  NewDashboard: undefined;
  Dashboard: undefined;
  InformationHub: undefined;

  // ✅ PHASE 1: Overview Tab Screens (6 screens)
  ChildDetail: { childId: string; childName?: string };
  ChildrenList: undefined;
  ActionItems: undefined;
  ActionItemDetail: { itemId: string };
  MessagesList: undefined;
  MessageDetail: { messageId: string };

  // ✅ PHASE 2B & 3: Detail Screens (Hybrid Approach - MD3 Navigation Cards)
  AcademicsDetail: { childId: string; childName?: string };
  BehaviorTracking: { childId: string; childName?: string };
  GoalsAndMilestones: { childId: string; childName?: string };
  StudentInsights: { childId: string; childName?: string };

  // ✅ PHASE 2: Financial Tab Screens (4 screens)
  PaymentHistory: undefined;
  MakePayment: { amount?: number; description?: string };
  Discounts: undefined;
  FeeStructure: { studentId?: string };

  // ✅ PHASE 3: Academic Tab Screens (6 screens)
  SubjectDetail: { studentId: string; subject: string };
  AssignmentsList: { studentId: string };
  AssignmentDetail: { assignmentId: string; studentId: string };
  UpcomingExams: { studentId?: string };
  AcademicReports: { studentId: string };
  StudyRecommendations: { studentId: string };

  // ✅ PHASE 4: Communication Tab Screens (5 screens)
  ComposeMessage: { recipientId?: string; subject?: string };
  ScheduleMeeting: { teacherId?: string };
  TeacherList: { studentId?: string };
  MeetingsHistory: undefined;
  Notifications: undefined;

  // ✅ PHASE 5: Info Tab Screens (5 screens)
  SchoolCalendar: undefined;
  SchoolHandbook: undefined;
  StaffDirectory: undefined;
  SchoolPolicies: undefined;
  Announcements: undefined;

  // ✨ NEW: Global Screens (TopAppBar navigation)
  NotificationsList: undefined;
  Settings: undefined;
  HelpFeedback: undefined;
  Profile: undefined;
  LanguageSelection: undefined;

  // Billing/Payment screens (Billing Stack)
  BillingInvoice: undefined;
  PaymentProcessing: undefined;

  // Academic/Performance screens (Children Stack)
  PerformanceAnalytics: undefined;
  AcademicSchedule: undefined;

  // Communication screens (Communication Stack)
  CommunityEngagement: undefined;
};

// Profile Stack
export type ProfileStackParamList = {
  StudentOnboardingFlow: undefined;
  StudentProfileScreen: undefined;
  EditOnboardingScreen: undefined;
  SettingsScreen: undefined;
  HelpAndSupportScreen: undefined;
  LegalScreen: {
    docType: 'terms' | 'privacy';
  };
};

// Bottom Tab Navigators
export type StudentTabParamList = {
  Home: undefined;
  Classes: undefined;
  Study: undefined;
  Progress: undefined;
  Connect: undefined;
  Profile: undefined;
};

export type TeacherTabParamList = {
  Home: undefined;
  Classes: undefined;
  Students: undefined;
  Analytics: undefined;
  More: undefined;
};

export type ParentTabParamList = {
  Home: undefined;
  Children: undefined;
  Reports: undefined;
  Messages: undefined;
  More: undefined;
};

// Root Stack (Main App Navigator)
export type RootStackParamList = {
  // Auth flow
  Auth: NavigatorScreenParams<AuthStackParamList>;

  // Main role-based flows
  StudentMain: NavigatorScreenParams<StudentTabParamList>;
  TeacherMain: NavigatorScreenParams<TeacherTabParamList>;
  AdminMain: NavigatorScreenParams<AdminStackParamList>;
  ParentMain: NavigatorScreenParams<ParentTabParamList>;

  // Common screens (accessible from any role)
  Settings: undefined;
  Profile: undefined;
  Help: undefined;
  Notifications: undefined;

  // Demo screens (development only)
  SplashScreen: undefined;
  AuthenticationDemo: undefined;
  DesignSystemDemo: undefined;
};

// Screen Props Types (for use in components)
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type StudentStackScreenProps<T extends keyof StudentStackParamList> =
  NativeStackScreenProps<StudentStackParamList, T>;

export type TeacherStackScreenProps<T extends keyof TeacherStackParamList> =
  NativeStackScreenProps<TeacherStackParamList, T>;

export type AdminStackScreenProps<T extends keyof AdminStackParamList> =
  NativeStackScreenProps<AdminStackParamList, T>;

export type ParentStackScreenProps<T extends keyof ParentStackParamList> =
  NativeStackScreenProps<ParentStackParamList, T>;

export type StudentTabScreenProps<T extends keyof StudentTabParamList> =
  BottomTabScreenProps<StudentTabParamList, T>;

export type TeacherTabScreenProps<T extends keyof TeacherTabParamList> =
  BottomTabScreenProps<TeacherTabParamList, T>;

export type ParentTabScreenProps<T extends keyof ParentTabParamList> =
  BottomTabScreenProps<ParentTabParamList, T>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;

// Declare global navigation types for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
