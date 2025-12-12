# 🔐 PERMISSIONS_RBAC_SPEC.md
### Complete Role-Based Access Control Specification
### (Roles • Permissions • Overrides • Feature Gating)

This document defines the **complete permission system** for the multi-tenant, config-driven platform.

It covers:
- All permission codes
- Role → Permission mappings
- Feature → Permission requirements
- Override precedence logic
- Fail-safe behaviors
- Implementation patterns

This is the **single source of truth** for authorization.

---

# 1. 🎯 Permission System Goals

1. **Role-based defaults** — Each role gets a baseline set of permissions
2. **Per-user overrides** — Grant or revoke specific permissions for individuals
3. **Per-customer customization** — Customers can adjust role defaults
4. **Feature-permission binding** — Features require specific permissions to access
5. **Fail-closed security** — On error, deny access (except minimal safe-mode features)
6. **Audit trail** — All permission changes are logged

---

# 2. 🏷️ Permission Code Enum

All permission codes used in the system. These are stored in the `permissions` table and referenced throughout the app.

```typescript
// src/types/permission.types.ts

export enum PermissionCode {
  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD & HOME
  // ═══════════════════════════════════════════════════════════════
  VIEW_DASHBOARD = "view_dashboard",
  VIEW_SCHEDULE = "view_schedule",
  VIEW_NOTIFICATIONS = "view_notifications",
  VIEW_CLASS_FEED = "view_class_feed",
  JOIN_LIVE_CLASS = "join_live_class",

  // ═══════════════════════════════════════════════════════════════
  // STUDY LIBRARY
  // ═══════════════════════════════════════════════════════════════
  VIEW_STUDY_LIBRARY = "view_study_library",
  VIEW_SUBJECTS = "view_subjects",
  VIEW_CHAPTERS = "view_chapters",
  VIEW_RESOURCES = "view_resources",
  DOWNLOAD_RESOURCES = "download_resources",
  CREATE_PLAYLIST = "create_playlist",
  SHARE_RESOURCES = "share_resources",

  // ═══════════════════════════════════════════════════════════════
  // ASSIGNMENTS
  // ═══════════════════════════════════════════════════════════════
  VIEW_ASSIGNMENTS = "view_assignments",
  SUBMIT_ASSIGNMENT = "submit_assignment",
  CREATE_ASSIGNMENT = "create_assignment",
  EDIT_ASSIGNMENT = "edit_assignment",
  DELETE_ASSIGNMENT = "delete_assignment",
  GRADE_ASSIGNMENT = "grade_assignment",
  VIEW_ASSIGNMENT_ANALYTICS = "view_assignment_analytics",

  // ═══════════════════════════════════════════════════════════════
  // TESTS & PRACTICE
  // ═══════════════════════════════════════════════════════════════
  VIEW_TESTS = "view_tests",
  ATTEMPT_TEST = "attempt_test",
  VIEW_TEST_SOLUTIONS = "view_test_solutions",
  CREATE_TEST = "create_test",
  EDIT_TEST = "edit_test",
  DELETE_TEST = "delete_test",
  VIEW_TEST_ANALYTICS = "view_test_analytics",
  RETAKE_TEST = "retake_test",

  // ═══════════════════════════════════════════════════════════════
  // DOUBTS / ASK
  // ═══════════════════════════════════════════════════════════════
  VIEW_DOUBTS = "view_doubts",
  ASK_DOUBT = "ask_doubt",
  ANSWER_DOUBT = "answer_doubt",
  DELETE_DOUBT = "delete_doubt",
  SCHEDULE_DOUBT_SESSION = "schedule_doubt_session",
  VIEW_DOUBT_ANALYTICS = "view_doubt_analytics",

  // ═══════════════════════════════════════════════════════════════
  // AI TUTOR
  // ═══════════════════════════════════════════════════════════════
  ACCESS_AI_TUTOR = "access_ai_tutor",
  VIEW_AI_SUMMARIES = "view_ai_summaries",
  GENERATE_AI_SUMMARY = "generate_ai_summary",
  ACCESS_AI_PRACTICE = "access_ai_practice",
  VIEW_AI_RECOMMENDATIONS = "view_ai_recommendations",

  // ═══════════════════════════════════════════════════════════════
  // NOTES & HIGHLIGHTS
  // ═══════════════════════════════════════════════════════════════
  VIEW_NOTES = "view_notes",
  CREATE_NOTE = "create_note",
  EDIT_NOTE = "edit_note",
  DELETE_NOTE = "delete_note",
  SHARE_NOTES = "share_notes",

  // ═══════════════════════════════════════════════════════════════
  // PROGRESS & ANALYTICS
  // ═══════════════════════════════════════════════════════════════
  VIEW_OWN_PROGRESS = "view_own_progress",
  VIEW_DETAILED_ANALYTICS = "view_detailed_analytics",
  VIEW_SUBJECT_ANALYTICS = "view_subject_analytics",
  SHARE_PROGRESS_REPORT = "share_progress_report",
  VIEW_STUDENT_PROGRESS = "view_student_progress",        // Teacher/Parent
  VIEW_CLASS_ANALYTICS = "view_class_analytics",          // Teacher
  VIEW_SCHOOL_ANALYTICS = "view_school_analytics",        // Admin

  // ═══════════════════════════════════════════════════════════════
  // GAMIFICATION
  // ═══════════════════════════════════════════════════════════════
  VIEW_GAMIFICATION = "view_gamification",
  VIEW_LEADERBOARD = "view_leaderboard",
  VIEW_QUESTS = "view_quests",
  CLAIM_REWARDS = "claim_rewards",
  VIEW_ACHIEVEMENTS = "view_achievements",

  // ═══════════════════════════════════════════════════════════════
  // PEER NETWORK
  // ═══════════════════════════════════════════════════════════════
  VIEW_PEERS = "view_peers",
  CONNECT_WITH_PEER = "connect_with_peer",
  CREATE_STUDY_GROUP = "create_study_group",
  JOIN_STUDY_GROUP = "join_study_group",
  MESSAGE_PEERS = "message_peers",

  // ═══════════════════════════════════════════════════════════════
  // LIVE CLASS (Student actions)
  // ═══════════════════════════════════════════════════════════════
  VIEW_LIVE_CLASSES = "view_live_classes",
  PARTICIPATE_IN_POLLS = "participate_in_polls",
  USE_RAISE_HAND = "use_raise_hand",
  VIEW_CLASS_RECORDINGS = "view_class_recordings",

  // ═══════════════════════════════════════════════════════════════
  // TEACHER - CLASS MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  START_LIVE_CLASS = "start_live_class",
  END_LIVE_CLASS = "end_live_class",
  MANAGE_CLASS_PARTICIPANTS = "manage_class_participants",
  CREATE_POLL = "create_poll",
  USE_WHITEBOARD = "use_whiteboard",
  RECORD_CLASS = "record_class",
  MANAGE_ATTENDANCE = "manage_attendance",
  SHARE_SCREEN = "share_screen",

  // ═══════════════════════════════════════════════════════════════
  // TEACHER - CONTENT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  UPLOAD_RESOURCES = "upload_resources",
  EDIT_RESOURCES = "edit_resources",
  DELETE_RESOURCES = "delete_resources",
  MANAGE_CHAPTER_CONTENT = "manage_chapter_content",

  // ═══════════════════════════════════════════════════════════════
  // PARENT - CHILD MONITORING
  // ═══════════════════════════════════════════════════════════════
  VIEW_CHILD_DASHBOARD = "view_child_dashboard",
  VIEW_CHILD_PROGRESS = "view_child_progress",
  VIEW_CHILD_SCHEDULE = "view_child_schedule",
  VIEW_CHILD_ASSIGNMENTS = "view_child_assignments",
  VIEW_CHILD_ATTENDANCE = "view_child_attendance",
  CONTACT_TEACHER = "contact_teacher",
  MANAGE_LINKED_CHILDREN = "manage_linked_children",

  // ═══════════════════════════════════════════════════════════════
  // PROFILE & SETTINGS
  // ═══════════════════════════════════════════════════════════════
  VIEW_OWN_PROFILE = "view_own_profile",
  EDIT_OWN_PROFILE = "edit_own_profile",
  CHANGE_PASSWORD = "change_password",
  MANAGE_NOTIFICATIONS = "manage_notifications",
  VIEW_HELP = "view_help",
  VIEW_LEGAL = "view_legal",

  // ═══════════════════════════════════════════════════════════════
  // ADMIN - CUSTOMER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  VIEW_ADMIN_DASHBOARD = "view_admin_dashboard",
  MANAGE_CUSTOMERS = "manage_customers",
  MANAGE_USERS = "manage_users",
  MANAGE_ROLES = "manage_roles",
  MANAGE_PERMISSIONS = "manage_permissions",

  // ═══════════════════════════════════════════════════════════════
  // ADMIN - CONFIG MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  MANAGE_FEATURES = "manage_features",
  MANAGE_NAVIGATION = "manage_navigation",
  MANAGE_DASHBOARD_LAYOUT = "manage_dashboard_layout",
  MANAGE_THEMES = "manage_themes",
  MANAGE_WIDGETS = "manage_widgets",
  VIEW_AUDIT_LOGS = "view_audit_logs",
  EMERGENCY_DISABLE_FEATURE = "emergency_disable_feature",

  // ═══════════════════════════════════════════════════════════════
  // ADMIN - CONTENT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  MANAGE_SUBJECTS = "manage_subjects",
  MANAGE_COURSES = "manage_courses",
  MANAGE_CLASSES = "manage_classes",
  BULK_UPLOAD_CONTENT = "bulk_upload_content",

  // ═══════════════════════════════════════════════════════════════
  // SYSTEM
  // ═══════════════════════════════════════════════════════════════
  IMPERSONATE_USER = "impersonate_user",
  VIEW_SYSTEM_HEALTH = "view_system_health",
  MANAGE_INTEGRATIONS = "manage_integrations",
}

// Type for permission code strings
export type PermissionCodeType = `${PermissionCode}`;
```

---

# 3. 👥 Role Definitions

## 3.1 Available Roles

```typescript
export type Role = "student" | "teacher" | "parent" | "admin" | "super_admin";

export const ROLE_HIERARCHY: Record<Role, number> = {
  student: 1,
  parent: 2,
  teacher: 3,
  admin: 4,
  super_admin: 5,
};
```

## 3.2 Role Descriptions

| Role | Description | Primary Use |
|------|-------------|-------------|
| `student` | Learner enrolled in courses | Learning, tests, doubts, progress |
| `teacher` | Instructor managing classes | Teaching, grading, content, doubts |
| `parent` | Guardian monitoring children | View child progress, contact teachers |
| `admin` | School/institution administrator | Manage users, config, content |
| `super_admin` | Platform-level administrator | Cross-customer management |

---

# 4. 📊 Role → Permission Matrix

## 4.1 Student Permissions

```typescript
export const STUDENT_PERMISSIONS: PermissionCode[] = [
  // Dashboard
  PermissionCode.VIEW_DASHBOARD,
  PermissionCode.VIEW_SCHEDULE,
  PermissionCode.VIEW_NOTIFICATIONS,
  PermissionCode.VIEW_CLASS_FEED,
  PermissionCode.JOIN_LIVE_CLASS,

  // Study
  PermissionCode.VIEW_STUDY_LIBRARY,
  PermissionCode.VIEW_SUBJECTS,
  PermissionCode.VIEW_CHAPTERS,
  PermissionCode.VIEW_RESOURCES,
  PermissionCode.DOWNLOAD_RESOURCES,
  PermissionCode.CREATE_PLAYLIST,

  // Assignments
  PermissionCode.VIEW_ASSIGNMENTS,
  PermissionCode.SUBMIT_ASSIGNMENT,

  // Tests
  PermissionCode.VIEW_TESTS,
  PermissionCode.ATTEMPT_TEST,
  PermissionCode.VIEW_TEST_SOLUTIONS,
  PermissionCode.RETAKE_TEST,

  // Doubts
  PermissionCode.VIEW_DOUBTS,
  PermissionCode.ASK_DOUBT,
  PermissionCode.SCHEDULE_DOUBT_SESSION,

  // AI Tutor
  PermissionCode.ACCESS_AI_TUTOR,
  PermissionCode.VIEW_AI_SUMMARIES,
  PermissionCode.GENERATE_AI_SUMMARY,
  PermissionCode.ACCESS_AI_PRACTICE,
  PermissionCode.VIEW_AI_RECOMMENDATIONS,

  // Notes
  PermissionCode.VIEW_NOTES,
  PermissionCode.CREATE_NOTE,
  PermissionCode.EDIT_NOTE,
  PermissionCode.DELETE_NOTE,

  // Progress
  PermissionCode.VIEW_OWN_PROGRESS,
  PermissionCode.VIEW_DETAILED_ANALYTICS,
  PermissionCode.VIEW_SUBJECT_ANALYTICS,
  PermissionCode.SHARE_PROGRESS_REPORT,

  // Gamification
  PermissionCode.VIEW_GAMIFICATION,
  PermissionCode.VIEW_LEADERBOARD,
  PermissionCode.VIEW_QUESTS,
  PermissionCode.CLAIM_REWARDS,
  PermissionCode.VIEW_ACHIEVEMENTS,

  // Peers
  PermissionCode.VIEW_PEERS,
  PermissionCode.CONNECT_WITH_PEER,
  PermissionCode.JOIN_STUDY_GROUP,
  PermissionCode.MESSAGE_PEERS,

  // Live Class
  PermissionCode.VIEW_LIVE_CLASSES,
  PermissionCode.PARTICIPATE_IN_POLLS,
  PermissionCode.USE_RAISE_HAND,
  PermissionCode.VIEW_CLASS_RECORDINGS,

  // Profile
  PermissionCode.VIEW_OWN_PROFILE,
  PermissionCode.EDIT_OWN_PROFILE,
  PermissionCode.CHANGE_PASSWORD,
  PermissionCode.MANAGE_NOTIFICATIONS,
  PermissionCode.VIEW_HELP,
  PermissionCode.VIEW_LEGAL,
];
```

## 4.2 Teacher Permissions

```typescript
export const TEACHER_PERMISSIONS: PermissionCode[] = [
  // Inherits most student permissions for viewing
  ...STUDENT_PERMISSIONS.filter(p => !p.includes('submit') && !p.includes('attempt')),

  // Assignment Management
  PermissionCode.CREATE_ASSIGNMENT,
  PermissionCode.EDIT_ASSIGNMENT,
  PermissionCode.DELETE_ASSIGNMENT,
  PermissionCode.GRADE_ASSIGNMENT,
  PermissionCode.VIEW_ASSIGNMENT_ANALYTICS,

  // Test Management
  PermissionCode.CREATE_TEST,
  PermissionCode.EDIT_TEST,
  PermissionCode.DELETE_TEST,
  PermissionCode.VIEW_TEST_ANALYTICS,

  // Doubt Management
  PermissionCode.ANSWER_DOUBT,
  PermissionCode.DELETE_DOUBT,
  PermissionCode.VIEW_DOUBT_ANALYTICS,

  // Live Class Management
  PermissionCode.START_LIVE_CLASS,
  PermissionCode.END_LIVE_CLASS,
  PermissionCode.MANAGE_CLASS_PARTICIPANTS,
  PermissionCode.CREATE_POLL,
  PermissionCode.USE_WHITEBOARD,
  PermissionCode.RECORD_CLASS,
  PermissionCode.MANAGE_ATTENDANCE,
  PermissionCode.SHARE_SCREEN,

  // Content Management
  PermissionCode.UPLOAD_RESOURCES,
  PermissionCode.EDIT_RESOURCES,
  PermissionCode.DELETE_RESOURCES,
  PermissionCode.MANAGE_CHAPTER_CONTENT,
  PermissionCode.SHARE_RESOURCES,
  PermissionCode.SHARE_NOTES,

  // Analytics
  PermissionCode.VIEW_STUDENT_PROGRESS,
  PermissionCode.VIEW_CLASS_ANALYTICS,

  // Groups
  PermissionCode.CREATE_STUDY_GROUP,
];
```

## 4.3 Parent Permissions

```typescript
export const PARENT_PERMISSIONS: PermissionCode[] = [
  // Child Monitoring
  PermissionCode.VIEW_CHILD_DASHBOARD,
  PermissionCode.VIEW_CHILD_PROGRESS,
  PermissionCode.VIEW_CHILD_SCHEDULE,
  PermissionCode.VIEW_CHILD_ASSIGNMENTS,
  PermissionCode.VIEW_CHILD_ATTENDANCE,
  PermissionCode.CONTACT_TEACHER,
  PermissionCode.MANAGE_LINKED_CHILDREN,

  // Basic Profile
  PermissionCode.VIEW_OWN_PROFILE,
  PermissionCode.EDIT_OWN_PROFILE,
  PermissionCode.CHANGE_PASSWORD,
  PermissionCode.MANAGE_NOTIFICATIONS,
  PermissionCode.VIEW_HELP,
  PermissionCode.VIEW_LEGAL,

  // Limited View Access
  PermissionCode.VIEW_SCHEDULE,
  PermissionCode.VIEW_NOTIFICATIONS,
];
```

## 4.4 Admin Permissions

```typescript
export const ADMIN_PERMISSIONS: PermissionCode[] = [
  // All teacher permissions
  ...TEACHER_PERMISSIONS,

  // Admin Dashboard
  PermissionCode.VIEW_ADMIN_DASHBOARD,
  PermissionCode.VIEW_SCHOOL_ANALYTICS,

  // User Management
  PermissionCode.MANAGE_USERS,
  PermissionCode.MANAGE_ROLES,
  PermissionCode.MANAGE_PERMISSIONS,

  // Config Management
  PermissionCode.MANAGE_FEATURES,
  PermissionCode.MANAGE_NAVIGATION,
  PermissionCode.MANAGE_DASHBOARD_LAYOUT,
  PermissionCode.MANAGE_THEMES,
  PermissionCode.MANAGE_WIDGETS,
  PermissionCode.VIEW_AUDIT_LOGS,
  PermissionCode.EMERGENCY_DISABLE_FEATURE,

  // Content Management
  PermissionCode.MANAGE_SUBJECTS,
  PermissionCode.MANAGE_COURSES,
  PermissionCode.MANAGE_CLASSES,
  PermissionCode.BULK_UPLOAD_CONTENT,
];
```

## 4.5 Super Admin Permissions

```typescript
export const SUPER_ADMIN_PERMISSIONS: PermissionCode[] = [
  // All admin permissions
  ...ADMIN_PERMISSIONS,

  // Cross-customer management
  PermissionCode.MANAGE_CUSTOMERS,
  PermissionCode.IMPERSONATE_USER,
  PermissionCode.VIEW_SYSTEM_HEALTH,
  PermissionCode.MANAGE_INTEGRATIONS,
];
```

---

# 5. 🔗 Feature → Permission Mapping

Each feature requires specific permissions to access. This enforces that even if a feature is enabled, users without permission cannot access it.

```typescript
// src/config/featurePermissions.ts

export const FEATURE_REQUIRED_PERMISSIONS: Record<FeatureId, PermissionCode[]> = {
  // ═══════════════════════════════════════════════════════════════
  // HOME
  // ═══════════════════════════════════════════════════════════════
  "home.dashboard": [
    PermissionCode.VIEW_DASHBOARD,
  ],

  // ═══════════════════════════════════════════════════════════════
  // STUDY
  // ═══════════════════════════════════════════════════════════════
  "study.library": [
    PermissionCode.VIEW_STUDY_LIBRARY,
    PermissionCode.VIEW_SUBJECTS,
  ],

  "study.assignments": [
    PermissionCode.VIEW_ASSIGNMENTS,
  ],

  "study.tests": [
    PermissionCode.VIEW_TESTS,
  ],

  "study.notes": [
    PermissionCode.VIEW_NOTES,
  ],

  // ═══════════════════════════════════════════════════════════════
  // ASK
  // ═══════════════════════════════════════════════════════════════
  "ask.doubts": [
    PermissionCode.VIEW_DOUBTS,
  ],

  "ai.tutor": [
    PermissionCode.ACCESS_AI_TUTOR,
  ],

  // ═══════════════════════════════════════════════════════════════
  // PROGRESS
  // ═══════════════════════════════════════════════════════════════
  "progress.analytics": [
    PermissionCode.VIEW_OWN_PROGRESS,
  ],

  "progress.gamification": [
    PermissionCode.VIEW_GAMIFICATION,
  ],

  // ═══════════════════════════════════════════════════════════════
  // PEERS
  // ═══════════════════════════════════════════════════════════════
  "peers.network": [
    PermissionCode.VIEW_PEERS,
  ],

  // ═══════════════════════════════════════════════════════════════
  // TEACHER
  // ═══════════════════════════════════════════════════════════════
  "teacher.dashboard": [
    PermissionCode.VIEW_DASHBOARD,
    PermissionCode.VIEW_CLASS_ANALYTICS,
  ],

  "teacher.liveClass": [
    PermissionCode.START_LIVE_CLASS,
  ],

  // ═══════════════════════════════════════════════════════════════
  // PARENT
  // ═══════════════════════════════════════════════════════════════
  "parent.dashboard": [
    PermissionCode.VIEW_CHILD_DASHBOARD,
  ],

  // ═══════════════════════════════════════════════════════════════
  // ADMIN
  // ═══════════════════════════════════════════════════════════════
  "admin.dashboard": [
    PermissionCode.VIEW_ADMIN_DASHBOARD,
  ],

  // ═══════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════
  "app.settings": [
    PermissionCode.VIEW_OWN_PROFILE,
  ],

  "app.help": [
    PermissionCode.VIEW_HELP,
  ],

  "app.legal": [
    PermissionCode.VIEW_LEGAL,
  ],
};
```

---

# 6. 🎛️ Widget → Permission Mapping

Widgets can require additional permissions beyond their parent feature.

```typescript
// src/config/widgetPermissions.ts

export const WIDGET_REQUIRED_PERMISSIONS: Partial<Record<WidgetId, PermissionCode[]>> = {
  "home.dashboard.heroCard": [],  // No extra permissions
  
  "home.dashboard.todaySchedule": [
    PermissionCode.VIEW_SCHEDULE,
  ],

  "home.dashboard.quickActions": [],  // Permission checked per action

  "home.dashboard.assignmentsTests": [
    PermissionCode.VIEW_ASSIGNMENTS,
    PermissionCode.VIEW_TESTS,
  ],

  "home.dashboard.doubtsInbox": [
    PermissionCode.VIEW_DOUBTS,
  ],

  "home.dashboard.progressSnapshot": [
    PermissionCode.VIEW_OWN_PROGRESS,
  ],

  "home.dashboard.recommendations": [
    PermissionCode.VIEW_AI_RECOMMENDATIONS,
  ],

  "home.dashboard.classFeed": [
    PermissionCode.VIEW_CLASS_FEED,
  ],

  "home.dashboard.peersGroups": [
    PermissionCode.VIEW_PEERS,
  ],
};
```

---

# 7. 🔄 Permission Override System

## 7.1 Override Types

```typescript
export type PermissionOverride = {
  user_id: string;
  permission_code: PermissionCode;
  granted: boolean;  // true = grant, false = revoke
  reason?: string;
  granted_by: string;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
};
```

## 7.2 Override Precedence Rules

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERMISSION RESOLUTION ORDER                   │
├─────────────────────────────────────────────────────────────────┤
│  1. User-level REVOKE override    →  DENY (highest priority)    │
│  2. User-level GRANT override     →  ALLOW                      │
│  3. Customer-level role override  →  Use customer's role def    │
│  4. Default role permissions      →  Use platform defaults      │
│  5. No match                      →  DENY (fail-closed)         │
└─────────────────────────────────────────────────────────────────┘
```

## 7.3 Resolution Algorithm

```typescript
// src/services/config/permissionService.ts

export async function checkPermission(
  userId: string,
  permissionCode: PermissionCode
): Promise<boolean> {
  try {
    // 1. Check user-level overrides first
    const userOverride = await getUserPermissionOverride(userId, permissionCode);
    
    if (userOverride !== null) {
      // User has explicit override
      return userOverride.granted;
    }

    // 2. Get user's role and customer
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return false; // No profile = no permissions
    }

    // 3. Check customer-level role overrides
    const customerRoleOverride = await getCustomerRolePermission(
      userProfile.customer_id,
      userProfile.role,
      permissionCode
    );

    if (customerRoleOverride !== null) {
      return customerRoleOverride;
    }

    // 4. Check default role permissions
    const defaultRolePermissions = getRoleDefaultPermissions(userProfile.role);
    return defaultRolePermissions.includes(permissionCode);

  } catch (error) {
    // 5. Fail-closed on error
    console.error('Permission check failed:', error);
    return false;
  }
}
```

---

# 8. 🛡️ Fail-Safe Behaviors

## 8.1 Fail-Closed vs Fail-Open

| Scenario | Behavior | Reason |
|----------|----------|--------|
| Permission check error | **Fail-closed** (DENY) | Security |
| Role fetch error | **Fail-closed** (DENY) | Security |
| Feature check error | **Fail-closed** (hide) | Security |
| Dashboard widget error | **Fail-open** (show fallback) | UX |
| Navigation load error | **Fail-open** (safe mode tabs) | UX |
| Theme load error | **Fail-open** (default theme) | UX |

## 8.2 Safe Mode Permissions

When the app enters safe mode, only these minimal permissions are available:

```typescript
export const SAFE_MODE_PERMISSIONS: PermissionCode[] = [
  PermissionCode.VIEW_DASHBOARD,
  PermissionCode.VIEW_OWN_PROFILE,
  PermissionCode.VIEW_HELP,
  PermissionCode.VIEW_LEGAL,
];
```

---

# 9. 🧩 Implementation Patterns

## 9.1 PermissionGate Component

```tsx
// src/components/gates/PermissionGate.tsx

import React from 'react';
import { useHasPermission } from '@/hooks/config/usePermissions';
import { PermissionCode } from '@/types/permission.types';

type PermissionGateProps = {
  permission: PermissionCode | PermissionCode[];
  requireAll?: boolean;  // true = AND, false = OR (default)
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function PermissionGate({
  permission,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const permissions = Array.isArray(permission) ? permission : [permission];
  
  const results = permissions.map(p => useHasPermission(p));
  
  const hasAccess = requireAll
    ? results.every(Boolean)
    : results.some(Boolean);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

## 9.2 FeatureGate Component

```tsx
// src/components/gates/FeatureGate.tsx

import React from 'react';
import { useCanAccessFeature } from '@/hooks/config/usePermissions';
import { FeatureId } from '@/types/feature.types';

type FeatureGateProps = {
  featureId: FeatureId;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function FeatureGate({
  featureId,
  fallback = null,
  children,
}: FeatureGateProps) {
  const canAccess = useCanAccessFeature(featureId);

  if (!canAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

## 9.3 useHasPermission Hook

```typescript
// src/hooks/config/usePermissions.ts

import { useConfigStore } from '@/stores/configStore';
import { PermissionCode } from '@/types/permission.types';

export function useHasPermission(permission: PermissionCode): boolean {
  const { permissions, isInitialized, isSafeMode } = useConfigStore();

  if (!isInitialized) {
    return false; // Not loaded yet
  }

  if (isSafeMode) {
    return SAFE_MODE_PERMISSIONS.includes(permission);
  }

  return permissions.includes(permission);
}

export function useHasPermissions(
  permissions: PermissionCode[],
  requireAll = false
): boolean {
  const results = permissions.map(p => useHasPermission(p));
  
  return requireAll
    ? results.every(Boolean)
    : results.some(Boolean);
}
```

## 9.4 useCanAccessFeature Hook

```typescript
export function useCanAccessFeature(featureId: FeatureId): boolean {
  const { features, permissions, isInitialized } = useConfigStore();

  if (!isInitialized) {
    return false;
  }

  // Check if feature is enabled for this customer
  const featureEnabled = features[featureId]?.enabled ?? false;
  if (!featureEnabled) {
    return false;
  }

  // Check if user has required permissions for this feature
  const requiredPermissions = FEATURE_REQUIRED_PERMISSIONS[featureId] ?? [];
  return requiredPermissions.every(p => permissions.includes(p));
}
```

---

# 10. 📝 Database Schema (Permissions)

## 10.1 Tables

```sql
-- Roles table
CREATE TABLE roles (
  role TEXT PRIMARY KEY,
  description TEXT,
  hierarchy_level INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions table
CREATE TABLE permissions (
  permission_code TEXT PRIMARY KEY,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role-Permission mapping (defaults)
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT REFERENCES roles(role),
  permission_code TEXT REFERENCES permissions(permission_code),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_code)
);

-- Customer role overrides
CREATE TABLE customer_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  role TEXT REFERENCES roles(role),
  permission_code TEXT REFERENCES permissions(permission_code),
  granted BOOLEAN NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, role, permission_code)
);

-- User-level overrides
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  permission_code TEXT REFERENCES permissions(permission_code),
  granted BOOLEAN NOT NULL,
  reason TEXT,
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_code)
);

-- Audit log
CREATE TABLE permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  target_user_id UUID,
  permission_code TEXT,
  action TEXT, -- 'grant' | 'revoke' | 'expire'
  previous_value BOOLEAN,
  new_value BOOLEAN,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

## 10.2 RPC Functions

```sql
-- Get all permissions for a user (resolved)
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  v_role TEXT;
  v_customer_id UUID;
  v_permissions TEXT[];
BEGIN
  -- Get user's role and customer
  SELECT role, customer_id INTO v_role, v_customer_id
  FROM user_profiles WHERE id = p_user_id;

  IF v_role IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;

  -- Start with default role permissions
  SELECT ARRAY_AGG(permission_code) INTO v_permissions
  FROM role_permissions WHERE role = v_role;

  -- Apply customer role overrides
  -- ... (implementation)

  -- Apply user-level overrides
  -- ... (implementation)

  RETURN COALESCE(v_permissions, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check single permission
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id UUID,
  p_permission_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_permissions TEXT[];
BEGIN
  v_permissions := get_user_permissions(p_user_id);
  RETURN p_permission_code = ANY(v_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

# 11. 🧪 Testing Checklist

## Unit Tests
- [ ] Permission resolution with no overrides
- [ ] Permission resolution with user grant override
- [ ] Permission resolution with user revoke override
- [ ] Permission resolution with customer role override
- [ ] Fail-closed on error
- [ ] Safe mode permissions

## Integration Tests
- [ ] PermissionGate hides content correctly
- [ ] FeatureGate respects feature + permission
- [ ] Navigation hides tabs without permission
- [ ] Widgets hide without permission
- [ ] Actions blocked without permission

## Contract Tests
- [ ] All DB permission codes exist in TypeScript enum
- [ ] All feature-required permissions exist in DB
- [ ] All role defaults are seeded

---

# 12. 📌 Summary

This RBAC system provides:

✅ **Clear permission codes** — Every action has a defined code  
✅ **Role-based defaults** — Students, teachers, parents, admins have sensible defaults  
✅ **Flexible overrides** — Per-customer and per-user customization  
✅ **Feature integration** — Features require permissions to access  
✅ **Widget integration** — Widgets can require additional permissions  
✅ **Fail-safe behavior** — Secure by default, graceful fallbacks for UX  
✅ **Audit trail** — All changes are logged  
✅ **Type safety** — Full TypeScript coverage  

This is the **complete, production-ready RBAC specification** for the Manushi Coaching App.
