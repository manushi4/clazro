import { ScreenDefinition } from "@/types";

// All available screens
export const screenRegistry: Record<string, ScreenDefinition> = {
  // Student screens
  "student-home": {
    screen_id: "student-home",
    name: "Student Home",
    screen_type: "dashboard",
    allowed_roles: ["student"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },
  "study-hub": {
    screen_id: "study-hub",
    name: "Study Hub",
    screen_type: "hub",
    allowed_roles: ["student"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },
  "schedule-screen": {
    screen_id: "schedule-screen",
    name: "Schedule",
    screen_type: "hub",
    allowed_roles: ["student", "teacher", "parent"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },
  "doubts-home": {
    screen_id: "doubts-home",
    name: "Doubts",
    screen_type: "hub",
    allowed_roles: ["student", "teacher"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },
  "progress-home": {
    screen_id: "progress-home",
    name: "Progress",
    screen_type: "hub",
    allowed_roles: ["student", "parent"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },
  "profile-home": {
    screen_id: "profile-home",
    name: "Profile",
    screen_type: "hub",
    allowed_roles: ["student", "teacher", "parent", "admin"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: false,
    header_visible: true,
  },

  "tests-home": {
    screen_id: "tests-home",
    name: "Tests",
    screen_type: "hub",
    allowed_roles: ["student"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },
  "assignments-home": {
    screen_id: "assignments-home",
    name: "Assignments",
    screen_type: "hub",
    allowed_roles: ["student"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },
  "social-home": {
    screen_id: "social-home",
    name: "Social",
    screen_type: "hub",
    allowed_roles: ["student"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },

  // Teacher screens
  "teacher-home": {
    screen_id: "teacher-home",
    name: "Teacher Home",
    screen_type: "dashboard",
    allowed_roles: ["teacher"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },
  "classes-screen": {
    screen_id: "classes-screen",
    name: "My Classes",
    screen_type: "hub",
    allowed_roles: ["teacher"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },
  "students-screen": {
    screen_id: "students-screen",
    name: "Students",
    screen_type: "hub",
    allowed_roles: ["teacher"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },
  "teacher-doubts": {
    screen_id: "teacher-doubts",
    name: "Student Doubts",
    screen_type: "hub",
    allowed_roles: ["teacher"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },

  // Parent screens
  "parent-home": {
    screen_id: "parent-home",
    name: "Parent Home",
    screen_type: "dashboard",
    allowed_roles: ["parent"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },
  "children-overview": {
    screen_id: "children-overview",
    name: "My Children",
    screen_type: "hub",
    allowed_roles: ["parent"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },
  "child-detail": {
    screen_id: "child-detail",
    name: "Child Detail",
    screen_type: "detail",
    allowed_roles: ["parent"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },
  "child-progress-screen": {
    screen_id: "child-progress-screen",
    name: "Child Progress",
    screen_type: "hub",
    allowed_roles: ["parent"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },

  // Admin screens
  "admin-home": {
    screen_id: "admin-home",
    name: "Admin Dashboard",
    screen_type: "dashboard",
    allowed_roles: ["admin"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },
  "admin-users": {
    screen_id: "admin-users",
    name: "User Management",
    screen_type: "hub",
    allowed_roles: ["admin"],
    default_layout: "vertical",
    scrollable: true,
    pull_to_refresh: true,
    header_visible: true,
  },
};

// Helper functions
export function getScreen(screenId: string): ScreenDefinition | undefined {
  return screenRegistry[screenId];
}

export function getScreensForRole(role: string): ScreenDefinition[] {
  return Object.values(screenRegistry).filter((s) =>
    s.allowed_roles.includes(role as any)
  );
}

export function getAllScreens(): ScreenDefinition[] {
  return Object.values(screenRegistry);
}

// Default root screens per role
export const DEFAULT_ROOT_SCREENS: Record<string, string> = {
  student: "student-home",
  teacher: "teacher-home",
  parent: "parent-home",
  admin: "admin-home",
};
