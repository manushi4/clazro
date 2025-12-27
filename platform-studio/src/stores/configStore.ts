import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Role,
  TabConfig,
  ScreenWidgetConfig,
  ThemeConfig,
  CustomerBranding,
  DEFAULT_THEME,
  DEFAULT_BRANDING,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from "@/types";

// Customer type for multi-tenant support
export type Customer = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

// Layout settings for controlling widget appearance
export type LayoutSettings = {
  gap: number; // Space between widgets (px)
  containerStyle: "card" | "flat" | "seamless"; // card = separate boxes, flat = connected look, seamless = continuous flow
  showShadow: boolean;
  borderRadius: number;
  padding: number;
};

export const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
  gap: 12,
  containerStyle: "card",
  showShadow: true,
  borderRadius: 12,
  padding: 16,
};

// Screen layout type
export type ScreenLayout = {
  screen_id: string;
  widgets: ScreenWidgetConfig[];
  layoutSettings?: LayoutSettings;
};

// Complete config state
export type ConfigState = {
  // Current selection
  customerId: string | null;
  selectedRole: Role;

  // Available customers for multi-tenant support
  customers: Customer[];

  // Navigation (per role)
  tabs: Record<Role, TabConfig[]>;

  // Screen layouts (per role + screen)
  screenLayouts: Record<Role, Record<string, ScreenLayout>>;

  // Theme (shared across roles)
  theme: Omit<ThemeConfig, "customer_id">;

  // Branding (shared across roles)
  branding: Omit<CustomerBranding, "customer_id">;

  // Notification settings (shared across roles)
  notificationSettings: Omit<NotificationSettings, "customer_id">;

  // Draft status
  isDirty: boolean;
  lastSavedAt: string | null;

  // Actions
  setCustomerId: (id: string) => void;
  setSelectedRole: (role: Role) => void;
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;

  // Tab actions
  setTabs: (role: Role, tabs: TabConfig[]) => void;
  addTab: (role: Role, tab: TabConfig) => void;
  updateTab: (role: Role, tabId: string, updates: Partial<TabConfig>) => void;
  deleteTab: (role: Role, tabId: string) => void;
  reorderTabs: (role: Role, fromIndex: number, toIndex: number) => void;

  // Screen layout actions
  setScreenLayout: (role: Role, screenId: string, widgets: ScreenWidgetConfig[]) => void;
  addWidget: (role: Role, screenId: string, widget: ScreenWidgetConfig) => void;
  updateWidget: (role: Role, screenId: string, widgetId: string, updates: Partial<ScreenWidgetConfig>) => void;
  deleteWidget: (role: Role, screenId: string, widgetId: string) => void;
  reorderWidgets: (role: Role, screenId: string, fromIndex: number, toIndex: number) => void;
  setLayoutSettings: (role: Role, screenId: string, settings: Partial<LayoutSettings>) => void;

  // Theme actions
  setTheme: (theme: Partial<ThemeConfig>) => void;

  // Branding actions
  setBranding: (branding: Partial<CustomerBranding>) => void;

  // Notification settings actions
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;

  // Utility actions
  markDirty: () => void;
  markSaved: () => void;
  resetToDefaults: () => void;
};

// Default tabs for each role
const DEFAULT_STUDENT_TABS: TabConfig[] = [
  { tab_id: "home", customer_id: "", role: "student", label: "Home", icon: "home", order_index: 1, enabled: true, root_screen_id: "student-home" },
  { tab_id: "study", customer_id: "", role: "student", label: "Study", icon: "library", order_index: 2, enabled: true, root_screen_id: "study-hub" },
  { tab_id: "ask", customer_id: "", role: "student", label: "Ask", icon: "help", order_index: 3, enabled: true, root_screen_id: "doubts-home" },
  { tab_id: "progress", customer_id: "", role: "student", label: "Progress", icon: "trending-up", order_index: 4, enabled: true, root_screen_id: "progress-home" },
  { tab_id: "profile", customer_id: "", role: "student", label: "Profile", icon: "person", order_index: 5, enabled: true, root_screen_id: "profile-home" },
];

const DEFAULT_TEACHER_TABS: TabConfig[] = [
  { tab_id: "home", customer_id: "", role: "teacher", label: "Home", icon: "home", order_index: 1, enabled: true, root_screen_id: "teacher-home" },
  { tab_id: "teach", customer_id: "", role: "teacher", label: "Teach", icon: "school", order_index: 2, enabled: true, root_screen_id: "class-hub" },
  { tab_id: "assess", customer_id: "", role: "teacher", label: "Assess", icon: "clipboard-check", order_index: 3, enabled: true, root_screen_id: "grading-hub" },
  { tab_id: "connect", customer_id: "", role: "teacher", label: "Connect", icon: "message-text", order_index: 4, enabled: true, root_screen_id: "communication-hub" },
  { tab_id: "profile", customer_id: "", role: "teacher", label: "Profile", icon: "account", order_index: 5, enabled: true, root_screen_id: "profile-home" },
];

const DEFAULT_PARENT_TABS: TabConfig[] = [
  { tab_id: "home", customer_id: "", role: "parent", label: "Home", icon: "home", order_index: 1, enabled: true, root_screen_id: "parent-home" },
  { tab_id: "progress", customer_id: "", role: "parent", label: "Progress", icon: "trending-up", order_index: 2, enabled: true, root_screen_id: "child-progress-screen" },
  { tab_id: "schedule", customer_id: "", role: "parent", label: "Schedule", icon: "calendar", order_index: 3, enabled: true, root_screen_id: "schedule-screen" },
  { tab_id: "profile", customer_id: "", role: "parent", label: "Profile", icon: "person", order_index: 4, enabled: true, root_screen_id: "profile-home" },
];

const DEFAULT_ADMIN_TABS: TabConfig[] = [
  { tab_id: "home", customer_id: "", role: "admin", label: "Dashboard", icon: "home", order_index: 1, enabled: true, root_screen_id: "admin-home" },
  { tab_id: "users", customer_id: "", role: "admin", label: "Users", icon: "people", order_index: 2, enabled: true, root_screen_id: "admin-users" },
  { tab_id: "settings", customer_id: "", role: "admin", label: "Settings", icon: "settings", order_index: 3, enabled: true, root_screen_id: "profile-home" },
];

// Default screen layouts
const DEFAULT_STUDENT_HOME_WIDGETS: ScreenWidgetConfig[] = [
  { widget_id: "hero.greeting", position: 1, size: "standard", enabled: true },
  { widget_id: "schedule.today", position: 2, size: "compact", enabled: true },
  { widget_id: "actions.quick", position: 3, size: "standard", enabled: true },
  { widget_id: "assignments.pending", position: 4, size: "compact", enabled: true },
  { widget_id: "analytics.class-performance", position: 5, size: "standard", enabled: true, config: { maxItems: 6, showRank: true, showTrend: true, showClassAverage: true } },
  { widget_id: "doubts.inbox", position: 6, size: "compact", enabled: true },
  { widget_id: "progress.snapshot", position: 7, size: "standard", enabled: true },
];

// Tab 1: HOME - Daily overview, quick access, AI insights
const DEFAULT_TEACHER_HOME_WIDGETS: ScreenWidgetConfig[] = [
  { widget_id: "hero.greeting", position: 1, size: "compact", enabled: true },
  { widget_id: "teacher.stats-grid", position: 2, size: "standard", enabled: true },
  { widget_id: "schedule.today", position: 3, size: "standard", enabled: true },
  { widget_id: "schedule.upcoming-class", position: 4, size: "compact", enabled: true },
  { widget_id: "teacher.pending-grading", position: 5, size: "standard", enabled: true },
  { widget_id: "teacher.at-risk-students", position: 6, size: "standard", enabled: true },
  { widget_id: "teacher.ai-insights", position: 7, size: "expanded", enabled: true },
  { widget_id: "teacher.quick-actions", position: 8, size: "compact", enabled: true },
];

// Tab 2: TEACH - Classes, attendance, student management
const DEFAULT_TEACHER_CLASS_HUB_WIDGETS: ScreenWidgetConfig[] = [
  { widget_id: "teacher.classOverview", position: 1, size: "expanded", enabled: true },
  { widget_id: "class.cards", position: 2, size: "expanded", enabled: true },
  { widget_id: "teacher.attendanceHero", position: 3, size: "standard", enabled: true },
  { widget_id: "attendance.quick-mark", position: 4, size: "standard", enabled: true },
  { widget_id: "attendance.today-summary", position: 5, size: "compact", enabled: true },
  { widget_id: "attendance.trends", position: 6, size: "compact", enabled: true },
  { widget_id: "attendance.alerts", position: 7, size: "standard", enabled: true },
  { widget_id: "class.recentActivity", position: 8, size: "standard", enabled: true },
];

// Tab 3: ASSESS - Grading, assignments, student performance
const DEFAULT_TEACHER_GRADING_HUB_WIDGETS: ScreenWidgetConfig[] = [
  { widget_id: "teacher.grading-stats", position: 1, size: "standard", enabled: true },
  { widget_id: "teacher.submissions-list", position: 2, size: "expanded", enabled: true },
  { widget_id: "teacher.pending-grading", position: 3, size: "standard", enabled: true },
  { widget_id: "grading.recent", position: 4, size: "standard", enabled: true },
  { widget_id: "teacher.rubric-templates", position: 5, size: "standard", enabled: true },
  { widget_id: "teacher.create-assignment", position: 6, size: "compact", enabled: true },
  { widget_id: "teacher.grade-submission", position: 7, size: "standard", enabled: true },
  { widget_id: "analytics.class-performance", position: 8, size: "expanded", enabled: true },
];

// Tab 4: CONNECT - Messages, doubts, announcements, parent contact
const DEFAULT_TEACHER_COMMUNICATION_HUB_WIDGETS: ScreenWidgetConfig[] = [
  { widget_id: "teacher.messages-inbox", position: 1, size: "expanded", enabled: true },
  { widget_id: "teacher.doubts-inbox", position: 2, size: "standard", enabled: true },
  { widget_id: "teacher.announcements", position: 3, size: "standard", enabled: true },
  { widget_id: "teacher.parent-contacts", position: 4, size: "standard", enabled: true },
  { widget_id: "parent.notifications-preview", position: 5, size: "standard", enabled: true },
  { widget_id: "doubts.to-answer", position: 6, size: "standard", enabled: true },
];

// Tab 5: PROFILE - Calendar, leave, settings, personal management
const DEFAULT_TEACHER_PROFILE_WIDGETS: ScreenWidgetConfig[] = [
  { widget_id: "profile.card", position: 1, size: "standard", enabled: true },
  { widget_id: "teacher.calendar", position: 2, size: "expanded", enabled: true },
  { widget_id: "teacher.calendar-events", position: 3, size: "standard", enabled: true },
  { widget_id: "teacher.leave-request", position: 4, size: "standard", enabled: true },
  { widget_id: "teacher.substitute-manager", position: 5, size: "standard", enabled: true },
  { widget_id: "profile.stats", position: 6, size: "compact", enabled: true },
  { widget_id: "profile.achievements", position: 7, size: "compact", enabled: true },
  { widget_id: "settings.account", position: 8, size: "compact", enabled: true },
];

const DEFAULT_PARENT_HOME_WIDGETS: ScreenWidgetConfig[] = [
  { widget_id: "hero.greeting", position: 1, size: "standard", enabled: true },
  { widget_id: "child.selector", position: 2, size: "compact", enabled: true },
  { widget_id: "child.progress", position: 3, size: "standard", enabled: true },
  { widget_id: "child.schedule", position: 4, size: "compact", enabled: true },
  { widget_id: "feed.announcements", position: 5, size: "standard", enabled: true },
];

const DEFAULT_ADMIN_HOME_WIDGETS: ScreenWidgetConfig[] = [
  { widget_id: "hero.greeting", position: 1, size: "standard", enabled: true },
  { widget_id: "admin.stats", position: 2, size: "expanded", enabled: true },
  { widget_id: "admin.users", position: 3, size: "standard", enabled: true },
  { widget_id: "admin.alerts", position: 4, size: "compact", enabled: true },
];

// Helper to reorder array
function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}

// Create the store
export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      // Initial state
      customerId: null,
      selectedRole: "student",
      customers: [],

      tabs: {
        student: DEFAULT_STUDENT_TABS,
        teacher: DEFAULT_TEACHER_TABS,
        parent: DEFAULT_PARENT_TABS,
        admin: DEFAULT_ADMIN_TABS,
      },

      screenLayouts: {
        student: {
          "student-home": { screen_id: "student-home", widgets: DEFAULT_STUDENT_HOME_WIDGETS },
          "study-hub": { screen_id: "study-hub", widgets: [] },
          "doubts-home": { screen_id: "doubts-home", widgets: [] },
          "progress-home": { screen_id: "progress-home", widgets: [] },
          "profile-home": { screen_id: "profile-home", widgets: [] },
        },
        teacher: {
          // Tab 1: Home
          "teacher-home": { screen_id: "teacher-home", widgets: DEFAULT_TEACHER_HOME_WIDGETS },
          // Tab 2: Teach (class-hub)
          "class-hub": { screen_id: "class-hub", widgets: DEFAULT_TEACHER_CLASS_HUB_WIDGETS },
          "attendance-home": { screen_id: "attendance-home", widgets: [
            { widget_id: "media.banner", position: 1, size: "standard", enabled: true },
            { widget_id: "teacher.attendanceHero", position: 2, size: "expanded", enabled: true },
            { widget_id: "attendance.quick-mark", position: 3, size: "standard", enabled: true },
            { widget_id: "teacher.attendanceQuickActions", position: 4, size: "compact", enabled: true },
            { widget_id: "teacher.attendanceRecent", position: 5, size: "standard", enabled: true },
            { widget_id: "attendance.today-summary", position: 6, size: "compact", enabled: true },
            { widget_id: "attendance.trends", position: 7, size: "compact", enabled: true },
            { widget_id: "attendance.alerts", position: 8, size: "standard", enabled: true },
          ] },
          "teacher-class-detail": { screen_id: "teacher-class-detail", widgets: [
            { widget_id: "class.stats", position: 1, size: "standard", enabled: true },
            { widget_id: "class.activity", position: 2, size: "standard", enabled: true },
            { widget_id: "class.roster", position: 3, size: "expanded", enabled: true },
          ] },
          "class-roster": { screen_id: "class-roster", widgets: [
            { widget_id: "class.roster", position: 1, size: "expanded", enabled: true },
          ] },
          "students-screen": { screen_id: "students-screen", widgets: [
            { widget_id: "teacher.student-quick-actions", position: 1, size: "standard", enabled: true },
            { widget_id: "teacher.student-stats", position: 2, size: "standard", enabled: true },
            { widget_id: "analytics.class-performance", position: 3, size: "standard", enabled: true },
            { widget_id: "analytics.top-performers", position: 4, size: "standard", enabled: true },
            { widget_id: "teacher.at-risk-students", position: 5, size: "standard", enabled: true },
            { widget_id: "teacher.class-students", position: 6, size: "expanded", enabled: true },
          ] },
          // Tab 3: Assess (grading-hub)
          "grading-hub": { screen_id: "grading-hub", widgets: DEFAULT_TEACHER_GRADING_HUB_WIDGETS },
          // Tab 4: Connect (communication-hub)
          "communication-hub": { screen_id: "communication-hub", widgets: DEFAULT_TEACHER_COMMUNICATION_HUB_WIDGETS },
          "teacher-doubts": { screen_id: "teacher-doubts", widgets: [
            { widget_id: "teacher.doubts-inbox", position: 1, size: "expanded", enabled: true },
            { widget_id: "doubts.to-answer", position: 2, size: "standard", enabled: true },
          ] },
          "messages": { screen_id: "messages", widgets: [
            { widget_id: "teacher.messages-inbox", position: 1, size: "expanded", enabled: true },
            { widget_id: "teacher.quick-actions", position: 2, size: "compact", enabled: true },
          ] },
          "notifications": { screen_id: "notifications", widgets: [
            { widget_id: "parent.notifications-preview", position: 1, size: "expanded", enabled: true },
          ] },
          "announcements": { screen_id: "announcements", widgets: [
            { widget_id: "teacher.announcements", position: 1, size: "expanded", enabled: true },
          ] },
          // Tab 5: Profile
          "profile-home": { screen_id: "profile-home", widgets: DEFAULT_TEACHER_PROFILE_WIDGETS },
          "settings-home": { screen_id: "settings-home", widgets: [
            { widget_id: "settings.account", position: 1, size: "standard", enabled: true },
            { widget_id: "settings.notifications", position: 2, size: "standard", enabled: true },
            { widget_id: "settings.appearance", position: 3, size: "standard", enabled: true },
            { widget_id: "settings.about", position: 4, size: "standard", enabled: true },
            { widget_id: "settings.logout", position: 5, size: "compact", enabled: true },
          ] },
        },
        parent: {
          "parent-home": { screen_id: "parent-home", widgets: DEFAULT_PARENT_HOME_WIDGETS },
          "children-overview": { screen_id: "children-overview", widgets: [
            { widget_id: "hero.greeting", position: 1, size: "compact", enabled: true },
            { widget_id: "parent.children-overview", position: 2, size: "expanded", enabled: true },
            { widget_id: "parent.quick-actions", position: 3, size: "standard", enabled: true },
          ] },
          "child-detail": { screen_id: "child-detail", widgets: [
            { widget_id: "parent.child-stats", position: 1, size: "standard", enabled: true },
            { widget_id: "parent.attendance-summary", position: 2, size: "standard", enabled: true },
            { widget_id: "parent.performance-chart", position: 3, size: "expanded", enabled: true },
            { widget_id: "parent.subject-progress", position: 4, size: "standard", enabled: true },
            { widget_id: "parent.assignments-pending", position: 5, size: "standard", enabled: true },
            { widget_id: "parent.weak-areas", position: 6, size: "compact", enabled: true },
            { widget_id: "parent.quick-actions", position: 7, size: "compact", enabled: true },
          ] },
          "child-progress-screen": { screen_id: "child-progress-screen", widgets: [] },
          "schedule-screen": { screen_id: "schedule-screen", widgets: [] },
          "profile-home": { screen_id: "profile-home", widgets: [] },
          "attendance-overview": { screen_id: "attendance-overview", widgets: [
            { widget_id: "parent.children-overview", position: 1, size: "expanded", enabled: true },
            { widget_id: "parent.attendance-summary", position: 2, size: "standard", enabled: true },
            { widget_id: "parent.child-stats", position: 3, size: "standard", enabled: true },
            { widget_id: "parent.quick-actions", position: 4, size: "compact", enabled: true },
          ] },
          "child-attendance": { screen_id: "child-attendance", widgets: [
            { widget_id: "parent.child-stats", position: 1, size: "standard", enabled: true },
            { widget_id: "parent.attendance-summary", position: 2, size: "expanded", enabled: true },
            { widget_id: "parent.quick-actions", position: 3, size: "compact", enabled: true },
          ] },
          "child-progress-detail": { screen_id: "child-progress-detail", widgets: [
            { widget_id: "parent.child-progress", position: 1, size: "expanded", enabled: true },
            { widget_id: "parent.performance-chart", position: 2, size: "standard", enabled: true },
            { widget_id: "parent.subject-progress", position: 3, size: "expanded", enabled: true },
            { widget_id: "parent.weak-areas", position: 4, size: "standard", enabled: true },
          ] },
          "performance-detail": { screen_id: "performance-detail", widgets: [
            { widget_id: "parent.performance-chart", position: 1, size: "expanded", enabled: true },
            { widget_id: "parent.comparison-analytics", position: 2, size: "standard", enabled: true },
            { widget_id: "parent.ai-predictions", position: 3, size: "standard", enabled: true },
            { widget_id: "parent.ai-recommendations", position: 4, size: "standard", enabled: true },
          ] },
          "child-subjects": { screen_id: "child-subjects", widgets: [
            { widget_id: "parent.child-stats", position: 1, size: "compact", enabled: true },
            { widget_id: "parent.subject-progress", position: 2, size: "expanded", enabled: true },
            { widget_id: "parent.weak-areas", position: 3, size: "standard", enabled: true },
            { widget_id: "parent.quick-actions", position: 4, size: "compact", enabled: true },
          ] },
          "child-report-card": { screen_id: "child-report-card", widgets: [
            { widget_id: "parent.child-stats", position: 1, size: "compact", enabled: true },
            { widget_id: "parent.report-card-summary", position: 2, size: "expanded", enabled: true },
            { widget_id: "parent.subject-grades", position: 3, size: "expanded", enabled: true },
            { widget_id: "parent.teacher-remarks", position: 4, size: "standard", enabled: true },
          ] },
          "child-stats-detail": { screen_id: "child-stats-detail", widgets: [
            { widget_id: "parent.child-stats", position: 1, size: "compact", enabled: true },
            { widget_id: "parent.performance-chart", position: 2, size: "expanded", enabled: true },
            { widget_id: "parent.attendance-summary", position: 3, size: "standard", enabled: true },
            { widget_id: "parent.subject-progress", position: 4, size: "expanded", enabled: true },
            { widget_id: "parent.weak-areas", position: 5, size: "standard", enabled: true },
          ] },
          "child-weak-areas-detail": { screen_id: "child-weak-areas-detail", widgets: [
            { widget_id: "parent.child-stats", position: 1, size: "compact", enabled: true },
            { widget_id: "parent.weak-areas", position: 2, size: "expanded", enabled: true },
            { widget_id: "parent.subject-progress", position: 3, size: "standard", enabled: true },
            { widget_id: "parent.ai-recommendations", position: 4, size: "standard", enabled: true },
            { widget_id: "parent.quick-actions", position: 5, size: "compact", enabled: true },
          ] },
          "child-assignments": { screen_id: "child-assignments", widgets: [
            { widget_id: "parent.child-stats", position: 1, size: "compact", enabled: true },
            { widget_id: "parent.assignments-pending", position: 2, size: "expanded", enabled: true },
            { widget_id: "parent.subject-progress", position: 3, size: "standard", enabled: true },
            { widget_id: "parent.quick-actions", position: 4, size: "compact", enabled: true },
          ] },
          "notifications": { screen_id: "notifications", widgets: [
            { widget_id: "parent.notifications-preview", position: 1, size: "expanded", enabled: true },
            { widget_id: "parent.quick-actions", position: 2, size: "compact", enabled: true },
          ] },
          // notification-detail is a Fixed screen (not widget-based)
          "announcements": { screen_id: "announcements", widgets: [
            { widget_id: "parent.announcements", position: 1, size: "expanded", enabled: true },
            { widget_id: "parent.quick-actions", position: 2, size: "compact", enabled: true },
          ] },
          "messages": { screen_id: "messages", widgets: [
            { widget_id: "common.messages-list", position: 1, size: "expanded", enabled: true },
            { widget_id: "parent.quick-actions", position: 2, size: "compact", enabled: true },
          ] },
          "fees-overview": { screen_id: "fees-overview", widgets: [
            { widget_id: "parent.fee-summary", position: 1, size: "expanded", enabled: true },
            { widget_id: "parent.pending-fees", position: 2, size: "standard", enabled: true },
            { widget_id: "parent.payment-history", position: 3, size: "standard", enabled: true },
          ] },
          "payment-history": { screen_id: "payment-history", widgets: [
            { widget_id: "parent.payment-history", position: 1, size: "expanded", enabled: true },
            { widget_id: "parent.fee-summary", position: 2, size: "compact", enabled: true },
          ] },
          "teacher-contacts": { screen_id: "teacher-contacts", widgets: [
            { widget_id: "parent.teacher-list", position: 1, size: "expanded", enabled: true },
            { widget_id: "parent.quick-contact-actions", position: 2, size: "compact", enabled: true },
          ] },
          "ai-insights": { screen_id: "ai-insights", widgets: [
            { widget_id: "parent.ai-summary", position: 1, size: "expanded", enabled: true },
            { widget_id: "parent.ai-predictions", position: 2, size: "standard", enabled: true },
            { widget_id: "parent.ai-recommendations", position: 3, size: "standard", enabled: true },
            { widget_id: "parent.weak-areas", position: 4, size: "standard", enabled: true },
          ] },
          "ai-predictions": { screen_id: "ai-predictions", widgets: [
            { widget_id: "parent.child-stats", position: 1, size: "compact", enabled: true },
            { widget_id: "parent.ai-predictions", position: 2, size: "expanded", enabled: true },
            { widget_id: "parent.performance-chart", position: 3, size: "standard", enabled: true },
            { widget_id: "parent.ai-recommendations", position: 4, size: "standard", enabled: true },
          ] },
          "ai-recommendations": { screen_id: "ai-recommendations", widgets: [
            { widget_id: "parent.child-stats", position: 1, size: "compact", enabled: true },
            { widget_id: "parent.ai-recommendations", position: 2, size: "expanded", enabled: true },
            { widget_id: "parent.weak-areas", position: 3, size: "standard", enabled: true },
            { widget_id: "parent.ai-predictions", position: 4, size: "standard", enabled: true },
          ] },
          "ai-alerts": { screen_id: "ai-alerts", widgets: [
            { widget_id: "parent.child-stats", position: 1, size: "compact", enabled: true },
            { widget_id: "parent.ai-alerts", position: 2, size: "expanded", enabled: true },
            { widget_id: "parent.ai-predictions", position: 3, size: "standard", enabled: true },
            { widget_id: "parent.ai-recommendations", position: 4, size: "standard", enabled: true },
          ] },
          "comparison-analytics": { screen_id: "comparison-analytics", widgets: [
            { widget_id: "parent.child-stats", position: 1, size: "compact", enabled: true },
            { widget_id: "parent.comparison-analytics", position: 2, size: "expanded", enabled: true },
            { widget_id: "parent.performance-chart", position: 3, size: "standard", enabled: true },
            { widget_id: "parent.ai-predictions", position: 4, size: "standard", enabled: true },
          ] },
        },
        admin: {
          "admin-home": { screen_id: "admin-home", widgets: DEFAULT_ADMIN_HOME_WIDGETS },
          "admin-users": { screen_id: "admin-users", widgets: [] },
          "profile-home": { screen_id: "profile-home", widgets: [] },
        },
      },

      theme: { ...DEFAULT_THEME },
      branding: { ...DEFAULT_BRANDING },
      notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },

      isDirty: false,
      lastSavedAt: null,

      // Actions
      setCustomerId: (id) => set({ customerId: id }),
      setSelectedRole: (role) => set({ selectedRole: role }),
      setCustomers: (customers) => set({ customers }),
      addCustomer: (customer) =>
        set((state) => ({
          customers: [...state.customers, customer],
        })),

      // Tab actions
      setTabs: (role, tabs) =>
        set((state) => ({
          tabs: { ...state.tabs, [role]: tabs },
          isDirty: true,
        })),

      addTab: (role, tab) =>
        set((state) => ({
          tabs: { ...state.tabs, [role]: [...state.tabs[role], tab] },
          isDirty: true,
        })),

      updateTab: (role, tabId, updates) =>
        set((state) => ({
          tabs: {
            ...state.tabs,
            [role]: state.tabs[role].map((t) =>
              t.tab_id === tabId ? { ...t, ...updates } : t
            ),
          },
          isDirty: true,
        })),

      deleteTab: (role, tabId) =>
        set((state) => ({
          tabs: {
            ...state.tabs,
            [role]: state.tabs[role].filter((t) => t.tab_id !== tabId),
          },
          isDirty: true,
        })),

      reorderTabs: (role, fromIndex, toIndex) =>
        set((state) => {
          const reordered = arrayMove(state.tabs[role], fromIndex, toIndex);
          return {
            tabs: {
              ...state.tabs,
              [role]: reordered.map((t, i) => ({ ...t, order_index: i + 1 })),
            },
            isDirty: true,
          };
        }),

      // Screen layout actions
      setScreenLayout: (role, screenId, widgets) =>
        set((state) => ({
          screenLayouts: {
            ...state.screenLayouts,
            [role]: {
              ...state.screenLayouts[role],
              [screenId]: { screen_id: screenId, widgets },
            },
          },
          isDirty: true,
        })),

      addWidget: (role, screenId, widget) =>
        set((state) => {
          const current = state.screenLayouts[role][screenId]?.widgets || [];
          return {
            screenLayouts: {
              ...state.screenLayouts,
              [role]: {
                ...state.screenLayouts[role],
                [screenId]: {
                  screen_id: screenId,
                  widgets: [...current, widget],
                },
              },
            },
            isDirty: true,
          };
        }),

      updateWidget: (role, screenId, widgetId, updates) =>
        set((state) => {
          const current = state.screenLayouts[role][screenId]?.widgets || [];
          return {
            screenLayouts: {
              ...state.screenLayouts,
              [role]: {
                ...state.screenLayouts[role],
                [screenId]: {
                  screen_id: screenId,
                  widgets: current.map((w) =>
                    w.widget_id === widgetId ? { ...w, ...updates } : w
                  ),
                },
              },
            },
            isDirty: true,
          };
        }),

      deleteWidget: (role, screenId, widgetId) =>
        set((state) => {
          const current = state.screenLayouts[role][screenId]?.widgets || [];
          return {
            screenLayouts: {
              ...state.screenLayouts,
              [role]: {
                ...state.screenLayouts[role],
                [screenId]: {
                  screen_id: screenId,
                  widgets: current.filter((w) => w.widget_id !== widgetId),
                },
              },
            },
            isDirty: true,
          };
        }),

      reorderWidgets: (role, screenId, fromIndex, toIndex) =>
        set((state) => {
          const current = state.screenLayouts[role][screenId]?.widgets || [];
          const reordered = arrayMove(current, fromIndex, toIndex);
          return {
            screenLayouts: {
              ...state.screenLayouts,
              [role]: {
                ...state.screenLayouts[role],
                [screenId]: {
                  screen_id: screenId,
                  widgets: reordered.map((w, i) => ({ ...w, position: i + 1 })),
                },
              },
            },
            isDirty: true,
          };
        }),

      setLayoutSettings: (role, screenId, settings) =>
        set((state) => {
          const currentLayout = state.screenLayouts[role][screenId] || {
            screen_id: screenId,
            widgets: [],
          };
          return {
            screenLayouts: {
              ...state.screenLayouts,
              [role]: {
                ...state.screenLayouts[role],
                [screenId]: {
                  ...currentLayout,
                  layoutSettings: {
                    ...DEFAULT_LAYOUT_SETTINGS,
                    ...currentLayout.layoutSettings,
                    ...settings,
                  },
                },
              },
            },
            isDirty: true,
          };
        }),

      // Theme actions
      setTheme: (theme) =>
        set((state) => ({
          theme: { ...state.theme, ...theme },
          isDirty: true,
        })),

      // Branding actions
      setBranding: (branding) =>
        set((state) => ({
          branding: { ...state.branding, ...branding },
          isDirty: true,
        })),

      // Notification settings actions
      setNotificationSettings: (settings) =>
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, ...settings },
          isDirty: true,
        })),

      // Utility actions
      markDirty: () => set({ isDirty: true }),
      markSaved: () => set({ isDirty: false, lastSavedAt: new Date().toISOString() }),
      resetToDefaults: () =>
        set({
          tabs: {
            student: DEFAULT_STUDENT_TABS,
            teacher: DEFAULT_TEACHER_TABS,
            parent: DEFAULT_PARENT_TABS,
            admin: DEFAULT_ADMIN_TABS,
          },
          screenLayouts: {
            student: { "student-home": { screen_id: "student-home", widgets: DEFAULT_STUDENT_HOME_WIDGETS } },
            teacher: { "teacher-home": { screen_id: "teacher-home", widgets: DEFAULT_TEACHER_HOME_WIDGETS } },
            parent: { "parent-home": { screen_id: "parent-home", widgets: DEFAULT_PARENT_HOME_WIDGETS } },
            admin: { "admin-home": { screen_id: "admin-home", widgets: DEFAULT_ADMIN_HOME_WIDGETS } },
          },
          theme: { ...DEFAULT_THEME },
          branding: { ...DEFAULT_BRANDING },
          notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
          isDirty: false,
        }),
    }),
    {
      name: "platform-studio-config",
      partialize: (state) => ({
        customerId: state.customerId,
        customers: state.customers,
        tabs: state.tabs,
        screenLayouts: state.screenLayouts,
        theme: state.theme,
        branding: state.branding,
        notificationSettings: state.notificationSettings,
      }),
    }
  )
);

// Selectors for convenience
export const useCurrentTabs = () => {
  const { selectedRole, tabs } = useConfigStore();
  return tabs[selectedRole];
};

export const useCurrentScreenLayout = (screenId: string) => {
  const { selectedRole, screenLayouts } = useConfigStore();
  return screenLayouts[selectedRole][screenId]?.widgets || [];
};

export const useTheme = () => useConfigStore((state) => state.theme);
export const useBranding = () => useConfigStore((state) => state.branding);
export const useNotificationSettings = () => useConfigStore((state) => state.notificationSettings);
export const useIsDirty = () => useConfigStore((state) => state.isDirty);

export const useCurrentLayoutSettings = (screenId: string) => {
  const { selectedRole, screenLayouts } = useConfigStore();
  return screenLayouts[selectedRole][screenId]?.layoutSettings || DEFAULT_LAYOUT_SETTINGS;
};
