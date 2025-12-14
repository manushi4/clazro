import type {
  CustomerConfig,
  NavigationConfig,
  ThemeConfig,
} from "../types/config.types";
import type { FeatureToggle } from "../types/feature.types";
import type { PermissionSet } from "../types/permission.types";
import type { DashboardConfig, WidgetLayoutItem } from "../types/widget.types";
import { DEFAULT_BRANDING } from "../types/branding.types";

const BASE_CUSTOMER_ID = "dev-customer";
const BASE_CUSTOMER_SLUG = "dev-school";

// Supabase customer ID - used for API queries
export const DEFAULT_CUSTOMER_ID = "2b1195ab-1a06-4c94-8e5f-c7c318e7fc46";

export const DEFAULT_THEME: ThemeConfig = {
  primaryColor: "#2D6CF6",
  secondaryColor: "#F4B400",
  surfaceColor: "#FFFFFF",
  logoUrl: undefined,
  roundness: 12,
  status: "active",
};

export const DEFAULT_FEATURES: FeatureToggle[] = [
  { featureId: "home.dashboard", enabled: true },
  { featureId: "study.library", enabled: true },
  { featureId: "study.assignments", enabled: true },
  { featureId: "study.tests", enabled: true },
  { featureId: "study.notes", enabled: true },
  { featureId: "ask.doubts", enabled: true },
  { featureId: "ai.tutor", enabled: true },
  { featureId: "progress.analytics", enabled: true },
  { featureId: "progress.gamification", enabled: true },
  { featureId: "peers.network", enabled: true },
  { featureId: "teacher.liveClass", enabled: true },
  { featureId: "parent.dashboard", enabled: true },
  { featureId: "admin.dashboard", enabled: true },
  { featureId: "app.settings", enabled: true },
  { featureId: "app.help", enabled: true },
  { featureId: "app.legal", enabled: true },
];

export const DEFAULT_NAVIGATION_TABS: NavigationConfig["tabs"] = [
  {
    tabId: "HomeTab",
    role: "student",
    label: "Home",
    icon: "home",
    initialRoute: "home.dashboard",
    orderIndex: 0,
    enabled: true,
    featureId: "home.dashboard",
  },
  {
    tabId: "StudyTab",
    role: "student",
    label: "Study",
    icon: "book",
    initialRoute: "study.library",
    orderIndex: 1,
    enabled: true,
    featureId: "study.library",
  },
  {
    tabId: "AskTab",
    role: "student",
    label: "Ask",
    icon: "chat",
    initialRoute: "ask.doubts",
    orderIndex: 2,
    enabled: true,
    featureId: "ask.doubts",
  },
  {
    tabId: "ProgressTab",
    role: "student",
    label: "Progress",
    icon: "chart",
    initialRoute: "progress.analytics",
    orderIndex: 3,
    enabled: true,
    featureId: "progress.analytics",
  },
  {
    tabId: "SettingsTab",
    role: "student",
    label: "Settings",
    icon: "settings",
    initialRoute: "settings",
    orderIndex: 4,
    enabled: true,
    featureId: "app.settings",
  },
];

export const DEFAULT_NAVIGATION_SCREENS: NavigationConfig["screens"] = [
  {
    screenId: "home.dashboard",
    tabId: "HomeTab",
    orderIndex: 0,
    enabled: true,
    featureId: "home.dashboard",
  },
  {
    screenId: "home.schedule",
    tabId: "HomeTab",
    orderIndex: 1,
    enabled: true,
    featureId: "home.dashboard",
  },
  {
    screenId: "study.library",
    tabId: "StudyTab",
    orderIndex: 0,
    enabled: true,
    featureId: "study.library",
  },
  {
    screenId: "study.library.alt",
    tabId: "StudyTab",
    orderIndex: 1,
    enabled: true,
    featureId: "study.library",
  },
  {
    screenId: "study.assignments",
    tabId: "StudyTab",
    orderIndex: 2,
    enabled: true,
    featureId: "study.assignments",
  },
  {
    screenId: "study.tests",
    tabId: "StudyTab",
    orderIndex: 3,
    enabled: true,
    featureId: "study.tests",
  },
  {
    screenId: "ask.doubts",
    tabId: "AskTab",
    orderIndex: 0,
    enabled: true,
    featureId: "ask.doubts",
  },
  {
    screenId: "ask.ai",
    tabId: "AskTab",
    orderIndex: 1,
    enabled: true,
    featureId: "ai.tutor",
  },
  {
    screenId: "progress.analytics",
    tabId: "ProgressTab",
    orderIndex: 0,
    enabled: true,
    featureId: "progress.analytics",
  },
  // Settings screens (dedicated Settings tab)
  {
    screenId: "settings",
    tabId: "SettingsTab",
    orderIndex: 0,
    enabled: true,
    featureId: "app.settings",
  },
  {
    screenId: "LanguageSelection",
    tabId: "SettingsTab",
    orderIndex: 1,
    enabled: true,
    featureId: "app.settings",
  },
];

export const DEFAULT_NAVIGATION: NavigationConfig = {
  tabs: DEFAULT_NAVIGATION_TABS,
  screens: DEFAULT_NAVIGATION_SCREENS,
};

const STUDENT_DASHBOARD_LAYOUT: WidgetLayoutItem[] = [
  { widgetId: "home.dashboard.heroCard", orderIndex: 0, enabled: true },
  { widgetId: "home.dashboard.todaySchedule", orderIndex: 1, enabled: true },
  { widgetId: "home.dashboard.quickActions", orderIndex: 2, enabled: true },
  { widgetId: "home.dashboard.assignmentsTests", orderIndex: 3, enabled: true },
  { widgetId: "home.dashboard.doubtsInbox", orderIndex: 4, enabled: true },
  { widgetId: "home.dashboard.progressSnapshot", orderIndex: 5, enabled: true },
  { widgetId: "home.dashboard.recommendations", orderIndex: 6, enabled: true },
];

export const DEFAULT_DASHBOARD_WIDGETS: DashboardConfig[] = [
  {
    role: "student",
    layout: STUDENT_DASHBOARD_LAYOUT,
  },
];

export const DEFAULT_PERMISSIONS: PermissionSet[] = [
  {
    role: "student",
    permissions: [
      "feature.view",
      "doubts.view",
      "doubts.create",
      "assignments.view",
      "tests.view",
      "ai.tutor.use",
      "progress.view",
      "schedule.view",
      "liveclass.join",
      "library.view",
      "notes.view",
      "notes.create",
    ],
  },
  {
    role: "teacher",
    permissions: [
      "feature.view",
      "doubts.view",
      "doubts.respond",
      "assignments.view",
      "assignments.create",
      "assignments.edit",
      "assignments.manage",
      "tests.view",
      "tests.create",
      "tests.manage",
      "liveclass.join",
      "liveclass.host",
      "analytics.view",
      "schedule.view",
      "schedule.manage",
      "progress.view",
      "progress.view.all",
    ],
  },
  {
    role: "parent",
    permissions: [
      "feature.view",
      "progress.view",
      "schedule.view",
      "assignments.view",
      "tests.view",
    ],
  },
  {
    role: "admin",
    permissions: [
      "feature.view",
      "feature.manage",
      "permissions.manage",
      "config.view",
      "config.manage",
      "theme.manage",
      "analytics.view",
      "analytics.export",
      "doubts.view",
      "doubts.respond",
      "assignments.view",
      "assignments.manage",
      "tests.view",
      "tests.manage",
      "schedule.view",
      "schedule.manage",
      "progress.view",
      "progress.view.all",
      "liveclass.join",
      "liveclass.host",
    ],
  },
];

export const DEFAULT_CONFIG: CustomerConfig = {
  customer: {
    id: BASE_CUSTOMER_ID,
    name: "Dev School",
    slug: BASE_CUSTOMER_SLUG,
    status: "active",
  },
  features: DEFAULT_FEATURES,
  navigation: DEFAULT_NAVIGATION,
  dashboard: DEFAULT_DASHBOARD_WIDGETS,
  theme: DEFAULT_THEME,
  branding: DEFAULT_BRANDING,
  permissions: DEFAULT_PERMISSIONS,
  version: 1,
};

export const STATIC_NAVIGATION: NavigationConfig = DEFAULT_NAVIGATION;
export const STATIC_DASHBOARD: DashboardConfig[] = DEFAULT_DASHBOARD_WIDGETS;

const SAFE_MODE_THEME: ThemeConfig = {
  primaryColor: "#1D4ED8",
  secondaryColor: "#6B7280",
  surfaceColor: "#FFFFFF",
  roundness: 8,
  status: "active",
};

const SAFE_MODE_DASHBOARD: DashboardConfig[] = [
  {
    role: "student",
    layout: [
      { widgetId: "home.dashboard.heroCard", orderIndex: 0, enabled: true },
      { widgetId: "home.dashboard.todaySchedule", orderIndex: 1, enabled: true },
    ],
  },
];

export const SAFE_MODE_CONFIG: CustomerConfig = {
  customer: {
    id: "safe-mode",
    name: "Safe Mode",
    slug: "safe",
    status: "active",
  },
  features: [
    { featureId: "home.dashboard", enabled: true },
    { featureId: "app.settings", enabled: true },
  ],
  navigation: {
    tabs: DEFAULT_NAVIGATION_TABS,
    screens: DEFAULT_NAVIGATION_SCREENS,
  },
  dashboard: SAFE_MODE_DASHBOARD,
  theme: SAFE_MODE_THEME,
  branding: DEFAULT_BRANDING,
  permissions: [
    {
      role: "student",
      permissions: ["feature.view"],
    },
  ],
  version: 1,
};
