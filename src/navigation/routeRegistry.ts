import { DynamicScreen } from "./DynamicScreen";
import { SettingsScreen, LanguageSelectionScreen } from "../screens/settings";
import { EditProfileScreen, HelpFeedbackScreen } from "../screens/profile";
import { GlobalAnalyticsScreen, SubjectAnalyticsScreen, GamifiedHubScreen, SubjectProgressScreen, SubjectPerformanceScreen, SubjectDetailScreen, SubjectReportScreen } from "../screens/progress";
import { NotificationDetailScreen } from "../screens/notifications";
import { AnnouncementDetailScreen } from "../screens/announcements";
import { FeeDetailScreen, FeePaymentScreen, PaymentDetailScreen } from "../screens/fees";
import { ChildStatsScreen, ChildWeakAreaScreen, AssignmentDetailScreen, TeacherDetailScreen, AiInsightDetailScreen, PredictionDetailScreen, ComparisonDetailsScreen } from "../screens/parent";
import { MessageDetailScreen, ComposeMessageScreen } from "../screens/messages";
import { DoubtDetailScreen, DoubtSubmitScreen } from "../screens/doubts";
import { ClassDetailScreen, LiveClassScreen } from "../screens/schedule";
import { TestDetailScreen, TestAttemptScreen, TestResultScreen, TestReviewScreen } from "../screens/tests";
import { AITutorScreen } from "../screens/ai";
import { 
  LoginAdminScreen, 
  TwoFactorSetupScreen, 
  PasswordResetScreen, 
  AdminDashboardScreen, 
  UserManagementScreen, 
  UserDetailScreen,
  UserImpersonationScreen,
  UserCreateScreen,
  FinanceDashboardScreen,
  FinanceReportsScreen,
  AnalyticsDashboardScreen,
  ContentManagementScreen,
  OrgManagementScreen,
  SystemSettingsScreen,
  AuditLogsScreen,
  AdminProfileScreen,
  StudentFeeDetailScreen,
  StudentFeesListScreen,
  MonthlyFeeReportScreen,
  TeacherPayrollDetailScreen,
  PayrollProcessingScreen,
  BatchDetailScreen,
  StudentAttendanceDetailScreen,
  AdmissionDetailScreen,
  AdmissionCreateScreen,
} from "../screens/admin";

export type RouteDefinition = {
  screenId: string;
  component: React.ComponentType<any>;
};

const registry: Record<string, RouteDefinition> = {
  // Dynamic screens (widget-based)
  "home.dashboard": { screenId: "home.dashboard", component: DynamicScreen },
  "student-home": { screenId: "student-home", component: DynamicScreen },
  "parent-home": { screenId: "parent-home", component: DynamicScreen },
  "teacher-home": { screenId: "teacher-home", component: DynamicScreen },
  "study.library": { screenId: "study.library", component: DynamicScreen },
  "study-hub": { screenId: "study-hub", component: DynamicScreen },
  "ask.doubts": { screenId: "ask.doubts", component: DynamicScreen },
  "doubts-home": { screenId: "doubts-home", component: DynamicScreen },
  "assignments-home": { screenId: "assignments-home", component: DynamicScreen },
  "test-center": { screenId: "test-center", component: DynamicScreen },
  "progress.analytics": { screenId: "progress.analytics", component: DynamicScreen },
  "progress-home": { screenId: "progress-home", component: DynamicScreen },
  "admin.panel": { screenId: "admin.panel", component: DynamicScreen },
  
  // Profile screen (widget-based)
  "profile.home": { screenId: "profile.home", component: DynamicScreen },
  "profile-home": { screenId: "profile-home", component: DynamicScreen },
  
  // Parent screens (widget-based)
  "child-progress-screen": { screenId: "child-progress-screen", component: DynamicScreen },
  "schedule-screen": { screenId: "schedule-screen", component: DynamicScreen },
  "children-overview": { screenId: "children-overview", component: DynamicScreen },
  "child-detail": { screenId: "child-detail", component: DynamicScreen },
  "attendance-overview": { screenId: "attendance-overview", component: DynamicScreen },
  "child-attendance": { screenId: "child-attendance", component: DynamicScreen },
  "child-progress-detail": { screenId: "child-progress-detail", component: DynamicScreen },
  "ChildProgressDetail": { screenId: "ChildProgressDetail", component: DynamicScreen },
  "performance-detail": { screenId: "performance-detail", component: DynamicScreen },
  "PerformanceDetail": { screenId: "PerformanceDetail", component: DynamicScreen },
  "child-subjects": { screenId: "child-subjects", component: DynamicScreen },
  "ChildSubjects": { screenId: "ChildSubjects", component: DynamicScreen },
  "child-report-card": { screenId: "child-report-card", component: DynamicScreen },
  "ChildReportCard": { screenId: "ChildReportCard", component: DynamicScreen },
  "child-stats-detail": { screenId: "child-stats-detail", component: DynamicScreen },
  "ChildStatsDetail": { screenId: "ChildStatsDetail", component: DynamicScreen },
  "child-weak-areas-detail": { screenId: "child-weak-areas-detail", component: DynamicScreen },
  "ChildWeakAreasDetail": { screenId: "ChildWeakAreasDetail", component: DynamicScreen },
  
  // Child assignments (Dynamic screen - parent viewing child's assignments)
  "child-assignments": { screenId: "child-assignments", component: DynamicScreen },
  "ChildAssignments": { screenId: "ChildAssignments", component: DynamicScreen },
  
  // Assignment detail (Fixed screen - parent viewing child's assignment details)
  "assignment-detail": { screenId: "assignment-detail", component: AssignmentDetailScreen },
  "AssignmentDetail": { screenId: "AssignmentDetail", component: AssignmentDetailScreen },
  
  // Child stats (Fixed screen - comprehensive child statistics)
  "child-stats": { screenId: "child-stats", component: ChildStatsScreen },
  "ChildStats": { screenId: "ChildStats", component: ChildStatsScreen },
  
  // Child weak area (Fixed screen - detailed weak areas with practice)
  "child-weak-area": { screenId: "child-weak-area", component: ChildWeakAreaScreen },
  "ChildWeakArea": { screenId: "ChildWeakArea", component: ChildWeakAreaScreen },
  
  // Multi-role screens (widget-based)
  "notifications": { screenId: "notifications", component: DynamicScreen },
  "announcements": { screenId: "announcements", component: DynamicScreen },
  
  // Messages (Dynamic screen - multi-role messaging)
  "messages": { screenId: "messages", component: DynamicScreen },
  "Messages": { screenId: "Messages", component: DynamicScreen },
  
  // Message detail (Fixed screen - view message thread)
  "message-detail": { screenId: "message-detail", component: MessageDetailScreen },
  "MessageDetail": { screenId: "MessageDetail", component: MessageDetailScreen },
  
  // Compose message (Fixed screen - create/reply to messages)
  "compose-message": { screenId: "compose-message", component: ComposeMessageScreen },
  "ComposeMessage": { screenId: "ComposeMessage", component: ComposeMessageScreen },
  
  // Teacher contacts (Dynamic screen - parent viewing teacher contacts)
  "teacher-contacts": { screenId: "teacher-contacts", component: DynamicScreen },
  "TeacherContacts": { screenId: "TeacherContacts", component: DynamicScreen },
  
  // Teacher detail (Fixed screen - parent viewing teacher profile)
  "teacher-detail": { screenId: "teacher-detail", component: TeacherDetailScreen },
  "TeacherDetail": { screenId: "TeacherDetail", component: TeacherDetailScreen },
  
  // AI Insights (Dynamic screen - parent viewing AI-powered insights)
  "ai-insights": { screenId: "ai-insights", component: DynamicScreen },
  "AiInsights": { screenId: "AiInsights", component: DynamicScreen },
  
  // AI Insight detail (Fixed screen - parent viewing AI insight details)
  "ai-insight-detail": { screenId: "ai-insight-detail", component: AiInsightDetailScreen },
  "AiInsightDetail": { screenId: "AiInsightDetail", component: AiInsightDetailScreen },
  
  // AI Predictions (Dynamic screen - parent viewing AI predictions for child)
  "ai-predictions": { screenId: "ai-predictions", component: DynamicScreen },
  "AiPredictions": { screenId: "AiPredictions", component: DynamicScreen },
  
  // Prediction detail (Fixed screen - parent viewing AI prediction details)
  "prediction-detail": { screenId: "prediction-detail", component: PredictionDetailScreen },
  "PredictionDetail": { screenId: "PredictionDetail", component: PredictionDetailScreen },
  
  // AI Recommendations (Dynamic screen - parent viewing AI recommendations for child)
  "ai-recommendations": { screenId: "ai-recommendations", component: DynamicScreen },
  "AiRecommendations": { screenId: "AiRecommendations", component: DynamicScreen },
  
  // AI Alerts (Dynamic screen - parent viewing AI alerts for child)
  "ai-alerts": { screenId: "ai-alerts", component: DynamicScreen },
  "AiAlerts": { screenId: "AiAlerts", component: DynamicScreen },
  
  // Comparison Analytics (Dynamic screen - parent viewing comparison analytics)
  "comparison-analytics": { screenId: "comparison-analytics", component: DynamicScreen },
  "ComparisonAnalytics": { screenId: "ComparisonAnalytics", component: DynamicScreen },
  
  // Comparison Details (Fixed screen - parent viewing detailed comparison analytics)
  "comparison-details": { screenId: "comparison-details", component: ComparisonDetailsScreen },
  "ComparisonDetails": { screenId: "ComparisonDetails", component: ComparisonDetailsScreen },
  
  // Fee screens (widget-based)
  "fees-overview": { screenId: "fees-overview", component: DynamicScreen },
  "FeesOverview": { screenId: "FeesOverview", component: DynamicScreen },
  "payment-history": { screenId: "payment-history", component: DynamicScreen },
  "PaymentHistory": { screenId: "PaymentHistory", component: DynamicScreen },
  
  // Notification detail (Fixed screen)
  "notification-detail": { screenId: "notification-detail", component: NotificationDetailScreen },
  "NotificationDetail": { screenId: "NotificationDetail", component: NotificationDetailScreen },
  
  // Announcement detail (Fixed screen)
  "announcement-detail": { screenId: "announcement-detail", component: AnnouncementDetailScreen },
  "AnnouncementDetail": { screenId: "AnnouncementDetail", component: AnnouncementDetailScreen },
  
  // Fee detail (Fixed screen)
  "fee-detail": { screenId: "fee-detail", component: FeeDetailScreen },
  "FeeDetail": { screenId: "FeeDetail", component: FeeDetailScreen },
  
  // Fee payment (Fixed screen)
  "fee-payment": { screenId: "fee-payment", component: FeePaymentScreen },
  "FeePayment": { screenId: "FeePayment", component: FeePaymentScreen },
  
  // Payment detail (Fixed screen)
  "payment-detail": { screenId: "payment-detail", component: PaymentDetailScreen },
  "PaymentDetail": { screenId: "PaymentDetail", component: PaymentDetailScreen },
  
  // Fixed screens (not widget-based)
  // Settings screen - multiple aliases for compatibility
  "settings": { screenId: "settings", component: SettingsScreen },
  "Settings": { screenId: "Settings", component: SettingsScreen },
  "LanguageSelection": { screenId: "LanguageSelection", component: LanguageSelectionScreen },
  "language-selection": { screenId: "language-selection", component: LanguageSelectionScreen },
  
  // Profile screens
  "edit-profile": { screenId: "edit-profile", component: EditProfileScreen },
  "EditProfile": { screenId: "EditProfile", component: EditProfileScreen },
  "help-feedback": { screenId: "help-feedback", component: HelpFeedbackScreen },
  "HelpFeedback": { screenId: "HelpFeedback", component: HelpFeedbackScreen },
  
  // Progress screens (fixed)
  "global-analytics": { screenId: "global-analytics", component: GlobalAnalyticsScreen },
  "GlobalAnalytics": { screenId: "GlobalAnalytics", component: GlobalAnalyticsScreen },
  "subject-analytics": { screenId: "subject-analytics", component: SubjectAnalyticsScreen },
  "SubjectAnalytics": { screenId: "SubjectAnalytics", component: SubjectAnalyticsScreen },
  "gamified-hub": { screenId: "gamified-hub", component: GamifiedHubScreen },
  "GamifiedHub": { screenId: "GamifiedHub", component: GamifiedHubScreen },
  
  // Subject progress (Fixed screen - parent viewing child's subject detail)
  "subject-progress": { screenId: "subject-progress", component: SubjectProgressScreen },
  "SubjectProgress": { screenId: "SubjectProgress", component: SubjectProgressScreen },
  
  // Subject performance (Fixed screen - parent viewing child's subject performance analytics)
  "subject-performance": { screenId: "subject-performance", component: SubjectPerformanceScreen },
  "SubjectPerformance": { screenId: "SubjectPerformance", component: SubjectPerformanceScreen },
  
  // Subject detail (Fixed screen - comprehensive subject details)
  "subject-detail": { screenId: "subject-detail", component: SubjectDetailScreen },
  "SubjectDetail": { screenId: "SubjectDetail", component: SubjectDetailScreen },
  
  // Subject report (Fixed screen - detailed subject report with grades, tests, attendance)
  "subject-report": { screenId: "subject-report", component: SubjectReportScreen },
  "SubjectReport": { screenId: "SubjectReport", component: SubjectReportScreen },
  
  // Doubt detail (Fixed screen - view doubt details and teacher response)
  "doubt-detail": { screenId: "doubt-detail", component: DoubtDetailScreen },
  "DoubtDetail": { screenId: "DoubtDetail", component: DoubtDetailScreen },
  
  // Doubt submit (Fixed screen - submit a new doubt)
  "doubt-submit": { screenId: "doubt-submit", component: DoubtSubmitScreen },
  "DoubtSubmit": { screenId: "DoubtSubmit", component: DoubtSubmitScreen },
  
  // Class detail (Fixed screen - view class/period details)
  "class-detail": { screenId: "class-detail", component: ClassDetailScreen },
  "ClassDetail": { screenId: "ClassDetail", component: ClassDetailScreen },

  // Live class (Fixed screen - view and join live class)
  "live-class": { screenId: "live-class", component: LiveClassScreen },
  "LiveClass": { screenId: "LiveClass", component: LiveClassScreen },

  // Test detail (Fixed screen - view test details and start test)
  "test-detail": { screenId: "test-detail", component: TestDetailScreen },
  "TestDetail": { screenId: "TestDetail", component: TestDetailScreen },

  // Test attempt (Fixed screen - take test with questions and timer)
  "test-attempt": { screenId: "test-attempt", component: TestAttemptScreen },
  "TestAttempt": { screenId: "TestAttempt", component: TestAttemptScreen },

  // Test result (Fixed screen - show test results after submission)
  "test-result": { screenId: "test-result", component: TestResultScreen },
  "TestResult": { screenId: "TestResult", component: TestResultScreen },

  // Test review (Fixed screen - review answers after test)
  "test-review": { screenId: "test-review", component: TestReviewScreen },
  "TestReview": { screenId: "TestReview", component: TestReviewScreen },

  // AI Tutor (Fixed screen - AI-powered tutoring chat)
  "ai-tutor": { screenId: "ai-tutor", component: AITutorScreen },
  "AITutor": { screenId: "AITutor", component: AITutorScreen },

  // Settings home (Dynamic screen - widget-based settings)
  "settings-home": { screenId: "settings-home", component: DynamicScreen },
  "SettingsHome": { screenId: "SettingsHome", component: DynamicScreen },

  // Admin screens (Fixed - Sprint 1)
  "login-admin": { screenId: "login-admin", component: LoginAdminScreen },
  "LoginAdmin": { screenId: "LoginAdmin", component: LoginAdminScreen },
  "2fa-setup": { screenId: "2fa-setup", component: TwoFactorSetupScreen },
  "TwoFactorSetup": { screenId: "TwoFactorSetup", component: TwoFactorSetupScreen },
  "password-reset": { screenId: "password-reset", component: PasswordResetScreen },
  "PasswordReset": { screenId: "PasswordReset", component: PasswordResetScreen },

  // Admin dashboard (Dynamic screen - widget-based)
  "admin-home": { screenId: "admin-home", component: AdminDashboardScreen },
  "AdminHome": { screenId: "AdminHome", component: AdminDashboardScreen },

  // Admin User Management (Dynamic screen - widget-based)
  "users-management": { screenId: "users-management", component: UserManagementScreen },
  "UsersManagement": { screenId: "UsersManagement", component: UserManagementScreen },

  // Admin User Detail (Dynamic screen - widget-based)
  "users-detail": { screenId: "users-detail", component: UserDetailScreen },
  "UsersDetail": { screenId: "UsersDetail", component: UserDetailScreen },

  // Admin User Create (Dynamic screen - widget-based)
  "users-create": { screenId: "users-create", component: UserCreateScreen },
  "UsersCreate": { screenId: "UsersCreate", component: UserCreateScreen },

  // Admin User Impersonation (Fixed screen - complex interaction)
  "user-impersonation": { screenId: "user-impersonation", component: UserImpersonationScreen },
  "UserImpersonation": { screenId: "UserImpersonation", component: UserImpersonationScreen },

  // Admin Finance Dashboard (Dynamic screen - widget-based)
  "finance-dashboard": { screenId: "finance-dashboard", component: FinanceDashboardScreen },
  "FinanceDashboard": { screenId: "FinanceDashboard", component: FinanceDashboardScreen },

  // Admin Finance Reports (Dynamic screen - widget-based)
  "finance-reports": { screenId: "finance-reports", component: FinanceReportsScreen },
  "FinanceReports": { screenId: "FinanceReports", component: FinanceReportsScreen },

  // Admin Analytics Dashboard (Dynamic screen - widget-based)
  "analytics-dashboard": { screenId: "analytics-dashboard", component: AnalyticsDashboardScreen },
  "AnalyticsDashboard": { screenId: "AnalyticsDashboard", component: AnalyticsDashboardScreen },

  // Admin Content Management (Dynamic screen - widget-based)
  "content-management": { screenId: "content-management", component: ContentManagementScreen },
  "ContentManagement": { screenId: "ContentManagement", component: ContentManagementScreen },

  // Admin Organization Management (Dynamic screen - widget-based)
  "org-management": { screenId: "org-management", component: OrgManagementScreen },
  "OrgManagement": { screenId: "OrgManagement", component: OrgManagementScreen },

  // Admin System Settings (Dynamic screen - widget-based)
  "system-settings": { screenId: "system-settings", component: SystemSettingsScreen },
  "SystemSettings": { screenId: "SystemSettings", component: SystemSettingsScreen },

  // Admin Audit Logs (Dynamic screen - widget-based)
  "audit-logs": { screenId: "audit-logs", component: AuditLogsScreen },
  "AuditLogs": { screenId: "AuditLogs", component: AuditLogsScreen },

  // Admin Profile (Dynamic screen - widget-based)
  "admin-profile": { screenId: "admin-profile", component: AdminProfileScreen },
  "AdminProfile": { screenId: "AdminProfile", component: AdminProfileScreen },

  // Admin Student Fee Detail (Fixed screen - Phase 2 Fees Module)
  "student-fee-detail": { screenId: "student-fee-detail", component: StudentFeeDetailScreen },
  "StudentFeeDetail": { screenId: "StudentFeeDetail", component: StudentFeeDetailScreen },

  // Admin Student Fees List (Fixed screen - Phase 2 Fees Module)
  "student-fees-list": { screenId: "student-fees-list", component: StudentFeesListScreen },
  "StudentFeesList": { screenId: "StudentFeesList", component: StudentFeesListScreen },

  // Admin Monthly Fee Report (Fixed screen - Phase 2 Fees Module)
  "monthly-fee-report": { screenId: "monthly-fee-report", component: MonthlyFeeReportScreen },
  "MonthlyFeeReport": { screenId: "MonthlyFeeReport", component: MonthlyFeeReportScreen },

  // Admin Teacher Payroll Detail (Fixed screen - Phase 3 Payroll Module)
  "teacher-payroll-detail": { screenId: "teacher-payroll-detail", component: TeacherPayrollDetailScreen },
  "TeacherPayrollDetail": { screenId: "TeacherPayrollDetail", component: TeacherPayrollDetailScreen },

  // Admin Payroll Processing (Fixed screen - Phase 3 Payroll Module)
  "payroll-processing": { screenId: "payroll-processing", component: PayrollProcessingScreen },
  "PayrollProcessing": { screenId: "PayrollProcessing", component: PayrollProcessingScreen },

  // Admin Batch Detail (Fixed screen - Phase 4 Academic Module)
  "batch-detail": { screenId: "batch-detail", component: BatchDetailScreen },
  "BatchDetail": { screenId: "BatchDetail", component: BatchDetailScreen },

  // Admin Student Attendance Detail (Fixed screen - Phase 4 Academic Module)
  "student-attendance-detail": { screenId: "student-attendance-detail", component: StudentAttendanceDetailScreen },
  "StudentAttendanceDetail": { screenId: "StudentAttendanceDetail", component: StudentAttendanceDetailScreen },

  // Admin Admission Detail (Fixed screen - Phase 5 Admissions Module)
  "admission-detail": { screenId: "admission-detail", component: AdmissionDetailScreen },
  "AdmissionDetail": { screenId: "AdmissionDetail", component: AdmissionDetailScreen },

  // Admin Admission Create (Fixed screen - Phase 5 Admissions Module)
  "admission-create": { screenId: "admission-create", component: AdmissionCreateScreen },
  "AdmissionCreate": { screenId: "AdmissionCreate", component: AdmissionCreateScreen },
};

export function resolveScreen(screenId: string) {
  return registry[screenId] ?? registry["home.dashboard"];
}

export function getRouteRegistry() {
  return registry;
}
