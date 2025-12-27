/**
 * DynamicTabNavigator - Web Version
 * Uses sidebar navigation instead of bottom tabs
 */

import React, { useMemo, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEnabledTabs, useTabScreens, useFeatures } from "../hooks/config";
import { usePermissions } from "../hooks/config/usePermissions";
import type { Role } from "../types/permission.types";
import { useTranslation } from "react-i18next";
import { StackErrorBoundaryWrapper } from "../error/StackErrorBoundary";
import { ScreenErrorBoundaryWrapper } from "../error/ScreenErrorBoundary";
import { useAnalytics } from "../hooks/useAnalytics";
import { useAppTheme } from "../theme/useAppTheme";
import { useBranding } from "../context/BrandingContext";
import { resolveScreen } from "./routeRegistry";
import { DynamicScreen } from "./DynamicScreen";
import { useUnreadNotificationCount } from "../hooks/queries/useNotificationQuery";
import { useDemoUser } from "../hooks/useDemoUser";
import { useResponsiveContext } from "../context/ResponsiveContext";
import { WebLayout, WebTopNav, WebSidebar } from "./components";
import { AppText } from "../ui/components/AppText";

// Import all screen components (same as mobile)
import { SettingsScreen, LanguageSelectionScreen } from "../screens/settings";
import { EditProfileScreen, HelpFeedbackScreen } from "../screens/profile";
import { GlobalAnalyticsScreen, SubjectAnalyticsScreen, SubjectProgressScreen, SubjectPerformanceScreen, SubjectDetailScreen, SubjectReportScreen } from "../screens/progress";
import { NotificationDetailScreen } from "../screens/notifications";
import { AnnouncementDetailScreen } from "../screens/announcements";
import { FeeDetailScreen, FeePaymentScreen, PaymentDetailScreen } from "../screens/fees";
import { ChildStatsScreen, ChildWeakAreaScreen, AssignmentDetailScreen, TeacherDetailScreen, AiInsightDetailScreen, PredictionDetailScreen, ComparisonDetailsScreen } from "../screens/parent";
import { MessageDetailScreen, ComposeMessageScreen } from "../screens/messages";
import { DoubtDetailScreen, DoubtSubmitScreen } from "../screens/doubts";
import { ClassDetailScreen, LiveClassScreen, LiveClassesListScreen } from "../screens/schedule";
import { TestDetailScreen, TestAttemptScreen, TestResultScreen, TestReviewScreen } from "../screens/tests";
import { AITutorScreen } from "../screens/ai";
import {
  LoginAdminScreen,
  TwoFactorSetupScreen,
  UserDetailScreen,
  UserImpersonationScreen,
  UserCreateScreen,
  FinanceReportsScreen,
  ContentManagementScreen,
  OrgManagementScreen,
  AuditLogsScreen,
  AdminProfileScreen,
  StudentFeeDetailScreen,
  StudentFeesListScreen,
  MonthlyFeeReportScreen,
  FeeReportsScreen,
  TeacherPayrollDetailScreen,
  TeacherPayrollListScreen,
  PayrollProcessingScreen,
  BatchDetailScreen,
  BatchListScreen,
  BatchAnalyticsScreen,
  BatchStudentsScreen,
  StudentAttendanceDetailScreen,
  AbsentStudentsListScreen,
  AttendanceDashboardScreen,
  AbsentListScreen,
  AdmissionDetailScreen,
  AdmissionCreateScreen,
  AdmissionsListScreen,
  AdmissionsDashboardScreen,
} from "../screens/admin";

// Common screens (same as mobile version)
const COMMON_SCREENS = [
  { screenId: "settings", component: SettingsScreen },
  { screenId: "language-selection", component: LanguageSelectionScreen },
  { screenId: "edit-profile", component: EditProfileScreen },
  { screenId: "help-feedback", component: HelpFeedbackScreen },
  { screenId: "global-analytics", component: GlobalAnalyticsScreen },
  { screenId: "subject-analytics", component: SubjectAnalyticsScreen },
  { screenId: "notifications", component: DynamicScreen },
  { screenId: "help", component: DynamicScreen },
  { screenId: "about", component: DynamicScreen },
  { screenId: "children-overview", component: DynamicScreen },
  { screenId: "child-detail", component: DynamicScreen },
  { screenId: "attendance-overview", component: DynamicScreen },
  { screenId: "child-attendance", component: DynamicScreen },
  { screenId: "child-progress-detail", component: DynamicScreen },
  { screenId: "performance-detail", component: DynamicScreen },
  { screenId: "child-subjects", component: DynamicScreen },
  { screenId: "child-report-card", component: DynamicScreen },
  { screenId: "announcements", component: DynamicScreen },
  { screenId: "fees-overview", component: DynamicScreen },
  { screenId: "payment-history", component: DynamicScreen },
  { screenId: "notification-detail", component: NotificationDetailScreen },
  { screenId: "announcement-detail", component: AnnouncementDetailScreen },
  { screenId: "fee-detail", component: FeeDetailScreen },
  { screenId: "fee-payment", component: FeePaymentScreen },
  { screenId: "payment-detail", component: PaymentDetailScreen },
  { screenId: "subject-progress", component: SubjectProgressScreen },
  { screenId: "subject-performance", component: SubjectPerformanceScreen },
  { screenId: "subject-detail", component: SubjectDetailScreen },
  { screenId: "subject-report", component: SubjectReportScreen },
  { screenId: "child-stats-detail", component: DynamicScreen },
  { screenId: "child-stats", component: ChildStatsScreen },
  { screenId: "child-weak-areas-detail", component: DynamicScreen },
  { screenId: "child-weak-area", component: ChildWeakAreaScreen },
  { screenId: "child-assignments", component: DynamicScreen },
  { screenId: "assignment-detail", component: AssignmentDetailScreen },
  { screenId: "messages", component: DynamicScreen },
  { screenId: "message-detail", component: MessageDetailScreen },
  { screenId: "compose-message", component: ComposeMessageScreen },
  { screenId: "teacher-contacts", component: DynamicScreen },
  { screenId: "teacher-detail", component: TeacherDetailScreen },
  { screenId: "ai-insights", component: DynamicScreen },
  { screenId: "ai-insight-detail", component: AiInsightDetailScreen },
  { screenId: "ai-predictions", component: DynamicScreen },
  { screenId: "prediction-detail", component: PredictionDetailScreen },
  { screenId: "ai-recommendations", component: DynamicScreen },
  { screenId: "ai-alerts", component: DynamicScreen },
  { screenId: "comparison-analytics", component: DynamicScreen },
  { screenId: "comparison-details", component: ComparisonDetailsScreen },
  { screenId: "study-hub", component: DynamicScreen },
  { screenId: "doubts-home", component: DynamicScreen },
  { screenId: "doubt-detail", component: DoubtDetailScreen },
  { screenId: "doubt-submit", component: DoubtSubmitScreen },
  { screenId: "class-detail", component: ClassDetailScreen },
  { screenId: "live-class", component: LiveClassScreen },
  { screenId: "live-classes-list", component: LiveClassesListScreen },
  { screenId: "assignments-home", component: DynamicScreen },
  { screenId: "progress-home", component: DynamicScreen },
  { screenId: "profile-home", component: DynamicScreen },
  { screenId: "schedule-screen", component: DynamicScreen },
  { screenId: "test-center", component: DynamicScreen },
  { screenId: "test-detail", component: TestDetailScreen },
  { screenId: "test-attempt", component: TestAttemptScreen },
  { screenId: "test-result", component: TestResultScreen },
  { screenId: "test-review", component: TestReviewScreen },
  { screenId: "ai-tutor", component: AITutorScreen },
  { screenId: "settings-home", component: DynamicScreen },
  { screenId: "login-admin", component: LoginAdminScreen },
  { screenId: "2fa-setup", component: TwoFactorSetupScreen },
  { screenId: "users-detail", component: UserDetailScreen },
  { screenId: "users-create", component: UserCreateScreen },
  { screenId: "user-impersonation", component: UserImpersonationScreen },
  { screenId: "finance-reports", component: FinanceReportsScreen },
  { screenId: "content-management", component: ContentManagementScreen },
  { screenId: "org-management", component: OrgManagementScreen },
  { screenId: "audit-logs", component: AuditLogsScreen },
  { screenId: "admin-profile", component: AdminProfileScreen },
  { screenId: "student-fees-list", component: StudentFeesListScreen },
  { screenId: "student-fee-detail", component: StudentFeeDetailScreen },
  { screenId: "monthly-fee-report", component: MonthlyFeeReportScreen },
  { screenId: "fee-reports", component: FeeReportsScreen },
  { screenId: "teacher-payroll-list", component: TeacherPayrollListScreen },
  { screenId: "teacher-payroll-detail", component: TeacherPayrollDetailScreen },
  { screenId: "payroll-processing", component: PayrollProcessingScreen },
  { screenId: "batch-list", component: BatchListScreen },
  { screenId: "batch-detail", component: BatchDetailScreen },
  { screenId: "batch-analytics", component: BatchAnalyticsScreen },
  { screenId: "batch-students", component: BatchStudentsScreen },
  { screenId: "student-attendance-detail", component: StudentAttendanceDetailScreen },
  { screenId: "absent-students-list", component: AbsentStudentsListScreen },
  { screenId: "attendance-dashboard", component: AttendanceDashboardScreen },
  { screenId: "absent-list", component: AbsentListScreen },
  { screenId: "admission-detail", component: AdmissionDetailScreen },
  { screenId: "admission-create", component: AdmissionCreateScreen },
  { screenId: "admissions-list", component: AdmissionsListScreen },
  { screenId: "admissions-dashboard", component: AdmissionsDashboardScreen },
];

// Icon mapping (same as mobile)
const iconMap: Record<string, string> = {
  home: "home",
  library: "book-open-variant",
  book: "book-open-variant",
  help: "help-circle",
  chat: "chat",
  "trending-up": "chart-line",
  chart: "chart-line",
  person: "account",
  user: "account",
  star: "star",
  settings: "cog",
  calendar: "calendar",
  school: "school",
  people: "account-group",
  notifications: "bell",
  search: "magnify",
  bookmark: "bookmark",
  heart: "heart",
  message: "message",
  folder: "folder",
  document: "file-document",
  wallet: "wallet",
  credit: "credit-card",
  bank: "bank",
  money: "cash",
};

type DynamicTabNavigatorProps = {
  role: Role;
};

const Stack = createNativeStackNavigator();

export const DynamicTabNavigator: React.FC<DynamicTabNavigatorProps> = ({ role }) => {
  const tabs = useEnabledTabs(role);
  const { has } = usePermissions(role);
  const features = useFeatures();
  const { colors } = useAppTheme();
  const { t } = useTranslation("common");
  const { trackTabChange, trackNavigation } = useAnalytics();
  const { userId } = useDemoUser();
  const { data: unreadCount = 0 } = useUnreadNotificationCount(userId);
  const { isMobile } = useResponsiveContext();

  const [activeTabId, setActiveTabId] = useState<string>('');

  const enabledTabs = useMemo(
    () =>
      tabs.filter((tab) => {
        if (tab.requiredPermissions && tab.requiredPermissions.some((code) => !has(code))) return false;
        return true;
      }),
    [tabs, has]
  );

  // Set initial active tab
  React.useEffect(() => {
    if (enabledTabs.length > 0 && !activeTabId) {
      setActiveTabId(enabledTabs[0].tabId);
    }
  }, [enabledTabs, activeTabId]);

  const handleTabPress = (tabId: string) => {
    setActiveTabId(tabId);
    trackTabChange(tabId);
  };

  // Get screens for active tab
  const activeTab = enabledTabs.find(t => t.tabId === activeTabId);
  const tabScreens = useTabScreens(role, activeTabId);

  const enabledScreens = useMemo(() => {
    const filtered = tabScreens.filter((s) => {
      if (s.requiredPermissions && s.requiredPermissions.some((code) => !has(code))) return false;
      return true;
    });

    if (filtered.length === 0 && activeTab?.initialRoute) {
      return [{ screenId: activeTab.initialRoute, tabId: activeTabId, orderIndex: 0, enabled: true }];
    }

    return filtered;
  }, [tabScreens, has, activeTab, activeTabId]);

  // Show loading state
  if (enabledTabs.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText variant="bodyMedium" style={{ marginTop: 16, color: colors.onSurfaceVariant }}>
            Loading...
          </AppText>
        </View>
      </View>
    );
  }

  const sidebarTabs = enabledTabs.map(tab => ({
    tabId: tab.tabId,
    label: tab.label || t(`tabs.${tab.tabId}`, { defaultValue: tab.tabId }),
    icon: (tab as any).icon || 'home',
  }));

  return (
    <WebLayout
      topNav={<WebTopNav notificationCount={unreadCount} />}
      sidebar={
        <WebSidebar
          tabs={sidebarTabs}
          activeTabId={activeTabId}
          onTabPress={handleTabPress}
          iconMap={iconMap}
        />
      }
    >
      <StackErrorBoundaryWrapper scope={`stack:${activeTabId}`}>
        <Stack.Navigator>
          {/* Tab-specific screens */}
          {enabledScreens.map((screen) => (
            <Stack.Screen
              key={screen.screenId}
              name={screen.screenId}
              options={{ headerShown: false }}
            >
              {({ route }) => (
                <ScreenErrorBoundaryWrapper screenId={screen.screenId}>
                  {(() => {
                    const resolved = resolveScreen(screen.screenId);
                    const Component = resolved?.component ?? DynamicScreen;
                    const screenIdToUse = (route.params as { screenId?: string })?.screenId ?? screen.screenId;
                    return (
                      <Component
                        screenId={screenIdToUse}
                        role={role}
                        onFocused={() => trackNavigation(screen.screenId, { tabId: activeTabId })}
                      />
                    );
                  })()}
                </ScreenErrorBoundaryWrapper>
              )}
            </Stack.Screen>
          ))}
          {/* Common screens */}
          {COMMON_SCREENS.map((screen) => (
            <Stack.Screen
              key={screen.screenId}
              name={screen.screenId}
              options={{ headerShown: false }}
            >
              {({ route, navigation }) => (
                <ScreenErrorBoundaryWrapper screenId={screen.screenId}>
                  <screen.component
                    screenId={screen.screenId}
                    role={role}
                    navigation={navigation}
                    route={route}
                    onFocused={() => trackNavigation(screen.screenId, { tabId: activeTabId })}
                  />
                </ScreenErrorBoundaryWrapper>
              )}
            </Stack.Screen>
          ))}
        </Stack.Navigator>
      </StackErrorBoundaryWrapper>
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
});

export default DynamicTabNavigator;
