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

// Screen layout type
export type ScreenLayout = {
  screen_id: string;
  widgets: ScreenWidgetConfig[];
};

// Complete config state
export type ConfigState = {
  // Current selection
  customerId: string | null;
  selectedRole: Role;

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
  { tab_id: "classes", customer_id: "", role: "teacher", label: "Classes", icon: "school", order_index: 2, enabled: true, root_screen_id: "classes-screen" },
  { tab_id: "students", customer_id: "", role: "teacher", label: "Students", icon: "people", order_index: 3, enabled: true, root_screen_id: "students-screen" },
  { tab_id: "doubts", customer_id: "", role: "teacher", label: "Doubts", icon: "help", order_index: 4, enabled: true, root_screen_id: "teacher-doubts" },
  { tab_id: "profile", customer_id: "", role: "teacher", label: "Profile", icon: "person", order_index: 5, enabled: true, root_screen_id: "profile-home" },
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
  { widget_id: "doubts.inbox", position: 5, size: "compact", enabled: true },
  { widget_id: "progress.snapshot", position: 6, size: "standard", enabled: true },
];

const DEFAULT_TEACHER_HOME_WIDGETS: ScreenWidgetConfig[] = [
  { widget_id: "hero.greeting", position: 1, size: "standard", enabled: true },
  { widget_id: "schedule.today", position: 2, size: "standard", enabled: true },
  { widget_id: "analytics.class-performance", position: 3, size: "expanded", enabled: true },
  { widget_id: "doubts.to-answer", position: 4, size: "standard", enabled: true },
  { widget_id: "assignments.to-grade", position: 5, size: "compact", enabled: true },
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
          "teacher-home": { screen_id: "teacher-home", widgets: DEFAULT_TEACHER_HOME_WIDGETS },
          "classes-screen": { screen_id: "classes-screen", widgets: [] },
          "students-screen": { screen_id: "students-screen", widgets: [] },
          "teacher-doubts": { screen_id: "teacher-doubts", widgets: [] },
          "profile-home": { screen_id: "profile-home", widgets: [] },
        },
        parent: {
          "parent-home": { screen_id: "parent-home", widgets: DEFAULT_PARENT_HOME_WIDGETS },
          "child-progress-screen": { screen_id: "child-progress-screen", widgets: [] },
          "schedule-screen": { screen_id: "schedule-screen", widgets: [] },
          "profile-home": { screen_id: "profile-home", widgets: [] },
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
