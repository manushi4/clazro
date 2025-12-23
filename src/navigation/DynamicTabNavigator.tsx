import React, { useMemo } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
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
import { BrandedHeader } from "../components/branding/BrandedHeader";
import { useUnreadNotificationCount } from "../hooks/queries/useNotificationQuery";
import { useDemoUser } from "../hooks/useDemoUser";
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
import {
  TrendsDetailScreen,
  GrowthDetailScreen,
  EngagementDetailScreen,
  ComparisonsDetailScreen,
  UserAnalyticsScreen,
  RevenueAnalyticsScreen,
  SessionsAnalyticsScreen,
  ContentAnalyticsScreen,
  AttendanceAnalyticsScreen,
  GradeAnalyticsScreen,
  PendingWorkAnalyticsScreen,
} from "../screens/admin/analytics";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Common screens available from any tab (not widget-based)
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
  // Parent screens (accessible via widget navigation)
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
  // Fixed screens (accessible via widget navigation)
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
  // Student screens (accessible via widget navigation)
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
  // Test center (accessible via widget navigation)
  { screenId: "test-center", component: DynamicScreen },
  // Test detail (accessible via widget navigation)
  { screenId: "test-detail", component: TestDetailScreen },
  // Test attempt (accessible from test detail)
  { screenId: "test-attempt", component: TestAttemptScreen },
  // Test result (accessible from test attempt after submission)
  { screenId: "test-result", component: TestResultScreen },
  // Test review (accessible from test result)
  { screenId: "test-review", component: TestReviewScreen },
  // AI Tutor (accessible from dashboard widgets)
  { screenId: "ai-tutor", component: AITutorScreen },
  // Settings home (dynamic widget-based settings screen)
  { screenId: "settings-home", component: DynamicScreen },
  // Admin screens (Sprint 1) - auth flow screens only
  { screenId: "login-admin", component: LoginAdminScreen },
  { screenId: "2fa-setup", component: TwoFactorSetupScreen },
  // Admin screens (Sprint 2-9) - secondary screens accessible from tab navigation
  // NOTE: Tab root screens (admin-home, users-management, finance-dashboard, analytics-dashboard, system-settings)
  // are NOT included here to avoid duplicate screen registration error
  { screenId: "users-detail", component: UserDetailScreen },
  { screenId: "users-create", component: UserCreateScreen },
  { screenId: "user-impersonation", component: UserImpersonationScreen },
  { screenId: "finance-reports", component: FinanceReportsScreen },
  { screenId: "content-management", component: ContentManagementScreen },
  { screenId: "org-management", component: OrgManagementScreen },
  { screenId: "audit-logs", component: AuditLogsScreen },
  { screenId: "admin-profile", component: AdminProfileScreen },
  // Admin Fees screens (Phase 2)
  { screenId: "student-fees-list", component: StudentFeesListScreen },
  { screenId: "student-fee-detail", component: StudentFeeDetailScreen },
  { screenId: "monthly-fee-report", component: MonthlyFeeReportScreen },
  { screenId: "fee-reports", component: FeeReportsScreen },
  // Admin Payroll screens (Phase 3)
  { screenId: "teacher-payroll-list", component: TeacherPayrollListScreen },
  { screenId: "teacher-payroll-detail", component: TeacherPayrollDetailScreen },
  { screenId: "payroll-processing", component: PayrollProcessingScreen },
  // Admin Academic screens (Phase 4)
  { screenId: "batch-list", component: BatchListScreen },
  { screenId: "batch-detail", component: BatchDetailScreen },
  { screenId: "batch-analytics", component: BatchAnalyticsScreen },
  { screenId: "batch-students", component: BatchStudentsScreen },
  { screenId: "student-attendance-detail", component: StudentAttendanceDetailScreen },
  { screenId: "absent-students-list", component: AbsentStudentsListScreen },
  { screenId: "attendance-dashboard", component: AttendanceDashboardScreen },
  { screenId: "absent-list", component: AbsentListScreen },
  // Admin Admissions screens (Phase 5)
  { screenId: "admission-detail", component: AdmissionDetailScreen },
  { screenId: "admission-create", component: AdmissionCreateScreen },
  { screenId: "admissions-list", component: AdmissionsListScreen },
  { screenId: "admissions-dashboard", component: AdmissionsDashboardScreen },
  // Admin Analytics Detail screens (Sprint 7)
  { screenId: "trends-detail", component: TrendsDetailScreen },
  { screenId: "growth-detail", component: GrowthDetailScreen },
  { screenId: "engagement-detail", component: EngagementDetailScreen },
  { screenId: "comparisons-detail", component: ComparisonsDetailScreen },
  // Dedicated metric analytics screens (each metric type has its own screen)
  { screenId: "user-analytics", component: UserAnalyticsScreen },
  { screenId: "revenue-analytics", component: RevenueAnalyticsScreen },
  { screenId: "sessions-analytics", component: SessionsAnalyticsScreen },
  { screenId: "content-analytics", component: ContentAnalyticsScreen },
  { screenId: "attendance-analytics", component: AttendanceAnalyticsScreen },
  { screenId: "grade-analytics", component: GradeAnalyticsScreen },
  { screenId: "pending-work-analytics", component: PendingWorkAnalyticsScreen },
];

// Map icon names from DB to MaterialCommunityIcons
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
  // Additional icons from Platform Studio
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
  camera: "camera",
  image: "image",
  video: "video",
  music: "music",
  download: "download",
  upload: "upload",
  share: "share",
  link: "link",
  lock: "lock",
  unlock: "lock-open",
  eye: "eye",
  "eye-off": "eye-off",
  edit: "pencil",
  delete: "delete",
  add: "plus",
  remove: "minus",
  check: "check",
  close: "close",
  menu: "menu",
  more: "dots-horizontal",
  refresh: "refresh",
  filter: "filter",
  sort: "sort",
  grid: "view-grid",
  list: "view-list",
  map: "map",
  location: "map-marker",
  phone: "phone",
  email: "email",
  globe: "web",
  wifi: "wifi",
  bluetooth: "bluetooth",
  battery: "battery",
  flash: "flash",
  sun: "white-balance-sunny",
  moon: "moon-waning-crescent",
  cloud: "cloud",
  rain: "weather-rainy",
  snow: "weather-snowy",
  wind: "weather-windy",
  fire: "fire",
  water: "water",
  leaf: "leaf",
  flower: "flower",
  tree: "tree",
  mountain: "terrain",
  beach: "beach",
  city: "city",
  car: "car",
  bus: "bus",
  train: "train",
  plane: "airplane",
  ship: "ferry",
  bicycle: "bicycle",
  walk: "walk",
  run: "run",
  gym: "dumbbell",
  food: "food",
  coffee: "coffee",
  wine: "glass-wine",
  beer: "beer",
  cake: "cake",
  gift: "gift",
  shopping: "shopping",
  cart: "cart",
  wallet: "wallet",
  credit: "credit-card",
  bank: "bank",
  money: "cash",
  percent: "percent",
  tag: "tag",
  ticket: "ticket",
  trophy: "trophy",
  medal: "medal",
  crown: "crown",
  flag: "flag",
  target: "target",
  puzzle: "puzzle",
  game: "gamepad-variant",
  dice: "dice-multiple",
  chess: "chess-knight",
  paint: "palette",
  brush: "brush",
  scissors: "content-cut",
  ruler: "ruler",
  compass: "compass",
  calculator: "calculator",
  code: "code-tags",
  terminal: "console",
  bug: "bug",
  robot: "robot",
  alien: "alien",
  ghost: "ghost",
  skull: "skull",
  paw: "paw",
  cat: "cat",
  dog: "dog",
  bird: "bird",
  fish: "fish",
  bug2: "ladybug",
  spider: "spider",
  snake: "snake",
  turtle: "turtle",
  rabbit: "rabbit",
  bear: "teddy-bear",
  elephant: "elephant",
  lion: "panda",
  monkey: "emoticon-happy",
};

type DynamicTabNavigatorProps = {
  role: Role;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabStack: React.FC<{ role: Role; tabId: string }> = ({ role, tabId }) => {
  const screens = useTabScreens(role, tabId);
  const tabs = useEnabledTabs(role);
  const { has } = usePermissions(role);
  const features = useFeatures();
  const enabledFeatureIds = new Set(features.filter((f) => f.enabled).map((f) => f.featureId));
  const { trackNavigation } = useAnalytics();

  // Get the root screen for this tab from tabs config
  const currentTab = tabs.find((t) => t.tabId === tabId);
  const rootScreenId = currentTab?.initialRoute;

  // Debug logging
  if (__DEV__) {
    console.log(`[TabStack] tabId=${tabId}, rootScreenId=${rootScreenId}, screens from config=${screens.length}`);
  }

  const enabledScreens = useMemo(() => {
    const filtered = screens.filter((s) => {
      if (s.requiredPermissions && s.requiredPermissions.some((code) => !has(code))) return false;
      return true;
    });
    
    // If no screens from config, create a default screen using the tab's root screen
    if (filtered.length === 0 && rootScreenId) {
      if (__DEV__) {
        console.log(`[TabStack] Using rootScreenId as default: ${rootScreenId}`);
      }
      return [{ screenId: rootScreenId, tabId, orderIndex: 0, enabled: true }];
    }
    
    return filtered;
  }, [screens, has, rootScreenId, tabId]);

  return (
    <StackErrorBoundaryWrapper scope={`stack:${tabId}`}>
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
                  if (__DEV__) {
                    console.log(`[TabStack] Rendering screen: ${screen.screenId}, resolved:`, resolved?.screenId);
                  }
                  const Component = resolved?.component ?? DynamicScreen;
                  const screenIdToUse = (route.params as { screenId?: string })?.screenId ?? screen.screenId;
                  return (
                    <Component
                      screenId={screenIdToUse}
                      role={role}
                      onFocused={() => trackNavigation(screen.screenId, { tabId })}
                    />
                  );
                })()}
              </ScreenErrorBoundaryWrapper>
            )}
          </Stack.Screen>
        ))}
        {/* Common screens accessible from any tab */}
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
                  onFocused={() => trackNavigation(screen.screenId, { tabId })}
                />
              </ScreenErrorBoundaryWrapper>
            )}
          </Stack.Screen>
        ))}
      </Stack.Navigator>
    </StackErrorBoundaryWrapper>
  );
};

export const DynamicTabNavigator: React.FC<DynamicTabNavigatorProps> = ({ role }) => {
  const tabs = useEnabledTabs(role);
  const { has } = usePermissions(role);
  const features = useFeatures();
  const { colors } = useAppTheme();
  const branding = useBranding();
  const enabledFeatureIds = new Set(features.filter((f) => f.enabled).map((f) => f.featureId));
  const useStaticNav = process.env.USE_DYNAMIC_NAV === "false";
  const { t } = useTranslation("common");
  const { trackTabChange } = useAnalytics();
  const { userId } = useDemoUser();
  const { data: unreadCount = 0 } = useUnreadNotificationCount(userId);

  const enabledTabs = useMemo(
    () =>
      tabs.filter((tab) => {
        // Skip feature check for now
        // if (!useStaticNav && tab.featureId && !enabledFeatureIds.has(tab.featureId)) return false;
        if (tab.requiredPermissions && tab.requiredPermissions.some((code) => !has(code))) return false;
        return true;
      }),
    [tabs, has]
  );

  const staticTabs = [
    { tabId: "HomeTab", label: "Home", icon: "home" },
    { tabId: "StudyTab", label: "Study", icon: "book" },
    { tabId: "AskTab", label: "Ask", icon: "help" },
    { tabId: "ProgressTab", label: "Progress", icon: "chart" },
    { tabId: "SettingsTab", label: "Settings", icon: "settings" },
  ];

  const tabsToRender = useStaticNav ? staticTabs : enabledTabs;

  // Show loading state while tabs are being fetched
  if (tabsToRender.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <BrandedHeader notificationCount={unreadCount} />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Branded Header */}
      <BrandedHeader notificationCount={unreadCount} />
      
      {/* Tab Navigator */}
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.outlineVariant,
            paddingBottom: 4,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
        }}
      >
        {tabsToRender.map((tab) => {
          const iconName = iconMap[(tab as any).icon || "home"] || "circle";
          // Use label from database directly, fall back to translation only if no label
          const tabLabel = tab.label || t(`tabs.${tab.tabId}`, { defaultValue: tab.tabId });
          return (
            <Tab.Screen
              key={tab.tabId}
              name={tab.tabId}
              options={{
                title: tabLabel,
                tabBarIcon: ({ color, size }) => (
                  <Icon name={iconName} size={size} color={color} />
                ),
              }}
              listeners={{
                tabPress: () => trackTabChange(tab.tabId),
              }}
            >
              {() => <TabStack role={role} tabId={tab.tabId} />}
            </Tab.Screen>
          );
        })}
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
