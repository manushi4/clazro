# 🎭 Multi-Role Development Guide

> **Purpose:** Guide for teams developing Parent, Teacher, and Admin roles alongside the existing Student implementation  
> **Last Updated:** December 2024  
> **Status:** Ready for Team Use

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Directory Structure](#2-directory-structure)
3. [Role-Specific Development Paths](#3-role-specific-development-paths)
4. [Shared Infrastructure](#4-shared-infrastructure)
5. [Database Considerations](#5-database-considerations)
6. [Platform Studio Integration](#6-platform-studio-integration)
7. [Merging Code Guidelines](#7-merging-code-guidelines)
8. [Checklist for New Roles](#8-checklist-for-new-roles)

---

## 1. Architecture Overview

The app is designed for **multi-role support** from the ground up:

```
┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-ROLE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │ Student │  │ Parent  │  │ Teacher │  │  Admin  │           │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘           │
│       │            │            │            │                  │
│       └────────────┴────────────┴────────────┘                  │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────┐           │
│  │              SHARED INFRASTRUCTURE               │           │
│  │  • Theme System    • Branding Context           │           │
│  │  • Navigation      • Supabase Client            │           │
│  │  • Widget System   • Error Handling             │           │
│  │  • i18n            • Analytics                  │           │
│  └─────────────────────────────────────────────────┘           │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────┐           │
│  │              SUPABASE DATABASE                   │           │
│  │  All tables have `role` column for filtering     │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principle:** Each role has its own screens/widgets but shares core infrastructure.

---

## 2. Directory Structure

```
src/
├── screens/
│   ├── student/           # Student-specific screens (current)
│   │   ├── dashboard/
│   │   ├── study/
│   │   ├── doubts/
│   │   └── progress/
│   ├── parent/            # Parent-specific screens (new)
│   │   ├── dashboard/
│   │   ├── children/
│   │   ├── reports/
│   │   └── communication/
│   ├── teacher/           # Teacher-specific screens (new)
│   │   ├── dashboard/
│   │   ├── classes/
│   │   ├── grading/
│   │   └── content/
│   ├── admin/             # Admin-specific screens (new)
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── analytics/
│   │   └── settings/
│   └── common/            # Shared screens (settings, profile, etc.)
│       ├── settings/
│       ├── profile/
│       └── auth/
│
├── components/
│   └── widgets/
│       ├── dashboard/     # Student dashboard widgets (current)
│       ├── progress/      # Student progress widgets (current)
│       ├── parent/        # Parent-specific widgets (new)
│       │   ├── ChildProgressWidget.tsx
│       │   ├── AttendanceWidget.tsx
│       │   └── FeeStatusWidget.tsx
│       ├── teacher/       # Teacher-specific widgets (new)
│       │   ├── ClassOverviewWidget.tsx
│       │   ├── GradingQueueWidget.tsx
│       │   └── AttendanceWidget.tsx
│       ├── admin/         # Admin-specific widgets (new)
│       │   ├── SystemStatsWidget.tsx
│       │   ├── UserManagementWidget.tsx
│       │   └── RevenueWidget.tsx
│       └── shared/        # Widgets usable by multiple roles
│           ├── NotificationsWidget.tsx
│           └── CalendarWidget.tsx
│
├── hooks/
│   └── queries/
│       ├── student/       # Student queries (can move existing here)
│       ├── parent/        # Parent-specific queries (new)
│       ├── teacher/       # Teacher-specific queries (new)
│       ├── admin/         # Admin-specific queries (new)
│       └── shared/        # Shared queries
│
├── locales/
│   ├── en/
│   │   ├── dashboard.json    # Student dashboard (current)
│   │   ├── parent.json       # Parent translations (new)
│   │   ├── teacher.json      # Teacher translations (new)
│   │   └── admin.json        # Admin translations (new)
│   └── hi/
│       ├── dashboard.json
│       ├── parent.json
│       ├── teacher.json
│       └── admin.json
│
└── navigation/
    ├── DynamicTabNavigator.tsx  # Shared - filters by role
    ├── StudentNavigator.tsx     # Student-specific stacks
    ├── ParentNavigator.tsx      # Parent-specific stacks (new)
    ├── TeacherNavigator.tsx     # Teacher-specific stacks (new)
    └── AdminNavigator.tsx       # Admin-specific stacks (new)
```

---

## 3. Role-Specific Development Paths

### Student (Current - Reference Implementation)

| Category | Path |
|----------|------|
| Screens | `src/screens/student/` or `src/screens/progress/`, `src/screens/settings/` |
| Widgets | `src/components/widgets/dashboard/`, `src/components/widgets/progress/` |
| Queries | `src/hooks/queries/` |
| Locales | `src/locales/en/dashboard.json`, `src/locales/en/progress.json` |
| Registry | `src/config/widgetRegistry.ts` |

### Parent (New)

| Category | Path |
|----------|------|
| Screens | `src/screens/parent/` |
| Widgets | `src/components/widgets/parent/` |
| Queries | `src/hooks/queries/parent/` |
| Locales | `src/locales/en/parent.json`, `src/locales/hi/parent.json` |
| Registry | Add to `src/config/widgetRegistry.ts` with `roles: ['parent']` |

### Teacher (New)

| Category | Path |
|----------|------|
| Screens | `src/screens/teacher/` |
| Widgets | `src/components/widgets/teacher/` |
| Queries | `src/hooks/queries/teacher/` |
| Locales | `src/locales/en/teacher.json`, `src/locales/hi/teacher.json` |
| Registry | Add to `src/config/widgetRegistry.ts` with `roles: ['teacher']` |

### Admin (New)

| Category | Path |
|----------|------|
| Screens | `src/screens/admin/` |
| Widgets | `src/components/widgets/admin/` |
| Queries | `src/hooks/queries/admin/` |
| Locales | `src/locales/en/admin.json`, `src/locales/hi/admin.json` |
| Registry | Add to `src/config/widgetRegistry.ts` with `roles: ['admin']` |

---

## 4. Shared Infrastructure

These components are **role-agnostic** and should be used by all roles:

| Component | Location | Usage |
|-----------|----------|-------|
| `useAppTheme()` | `src/theme/useAppTheme.ts` | Theme colors/styles |
| `useBranding()` | `src/context/BrandingContext.tsx` | White-label branding |
| `useAnalytics()` | `src/hooks/useAnalytics.ts` | Event tracking |
| `useNetworkStatus()` | `src/offline/networkStore.ts` | Online/offline state |
| `usePermissions()` | `src/hooks/usePermissions.ts` | Permission checking |
| `AppText` | `src/ui/components/AppText.tsx` | Typography |
| `AppCard` | `src/ui/components/AppCard.tsx` | Card component |
| `BrandedHeader` | `src/components/branding/BrandedHeader.tsx` | Screen headers |
| `WidgetContainer` | `src/components/widgets/base/WidgetContainer.tsx` | Widget wrapper |
| `PermissionGate` | `src/components/auth/PermissionGate.tsx` | Permission UI |
| `OfflineBanner` | `src/offline/OfflineBanner.tsx` | Offline indicator |

---

## 5. Database Considerations

### Tables Already Support Multi-Role

All config tables have `role` column:

```sql
-- navigation_tabs: Different tabs per role
SELECT * FROM navigation_tabs WHERE customer_id = ? AND role = 'parent';

-- screen_layouts: Different widgets per role
SELECT * FROM screen_layouts WHERE customer_id = ? AND role = 'teacher';

-- role_permissions: Different permissions per role
SELECT * FROM role_permissions WHERE role = 'admin';
```

### Role-Specific Tables to Create

| Role | New Tables Needed |
|------|-------------------|
| **Parent** | `parent_children` (link parent to students), `parent_notifications` |
| **Teacher** | `teacher_classes`, `teacher_assignments`, `grading_queue` |
| **Admin** | `admin_audit_log`, `system_settings` |

### Shared Tables (Already Exist)

- `user_profiles` - Has `role` column
- `customers` - Customer/tenant data
- `customer_branding` - Branding per customer
- `customer_themes` - Theme per customer
- `notifications` - All user notifications

---

## 6. Platform Studio Integration

### Widget Registry Updates

When adding role-specific widgets, update both registries:

**Mobile App (`src/config/widgetRegistry.ts`):**
```typescript
export const WIDGET_REGISTRY = {
  // Student widgets
  'hero.greeting': {
    roles: ['student'],
    // ...
  },
  
  // Parent widgets (NEW)
  'parent.childProgress': {
    roles: ['parent'],
    component: 'ChildProgressWidget',
    category: 'parent',
    // ...
  },
  
  // Teacher widgets (NEW)
  'teacher.classOverview': {
    roles: ['teacher'],
    component: 'ClassOverviewWidget',
    category: 'teacher',
    // ...
  },
  
  // Shared widgets
  'notifications.preview': {
    roles: ['student', 'parent', 'teacher', 'admin'],
    // ...
  },
};
```

**Platform Studio (`platform-studio/src/config/widgetRegistry.ts`):**
```typescript
// Add same widgets with UI metadata for drag-drop builder
```

### Screen Registry Updates

**Platform Studio (`platform-studio/src/config/screenRegistry.ts`):**
```typescript
export const SCREEN_REGISTRY = {
  // Student screens (existing)
  'student-home': { roles: ['student'], ... },
  
  // Parent screens (NEW)
  'parent-home': { roles: ['parent'], type: 'dynamic', ... },
  'children-list': { roles: ['parent'], type: 'dynamic', ... },
  
  // Teacher screens (NEW)
  'teacher-home': { roles: ['teacher'], type: 'dynamic', ... },
  'class-management': { roles: ['teacher'], type: 'dynamic', ... },
  
  // Admin screens (NEW)
  'admin-home': { roles: ['admin'], type: 'dynamic', ... },
};
```

---

## 7. Merging Code Guidelines

### Safe Merge Checklist

When merging role-specific code into main codebase:

1. **No Conflicts Expected:**
   - Different folders for each role
   - Widget IDs are namespaced (`parent.`, `teacher.`, `admin.`)
   - Screen IDs are namespaced

2. **Files to Update (Carefully):**
   - `src/config/widgetRegistry.ts` - Add new widgets
   - `src/navigation/routeRegistry.ts` - Add new routes
   - `src/i18n/index.ts` - Add new locale namespaces
   - `platform-studio/src/config/widgetRegistry.ts` - Mirror mobile registry
   - `platform-studio/src/config/screenRegistry.ts` - Add new screens

3. **Files That Should NOT Conflict:**
   - All role-specific screens (different folders)
   - All role-specific widgets (different folders)
   - All role-specific queries (different folders)
   - All role-specific locales (different files)

### Git Branch Strategy

```
main
├── feature/student-app     # Current work
├── feature/parent-app      # Parent team
├── feature/teacher-app     # Teacher team
└── feature/admin-app       # Admin team
```

Merge order: `student` → `parent` → `teacher` → `admin`

---

## 8. Checklist for New Roles

### Parent Role Setup

- [ ] Create `src/screens/parent/` folder
- [ ] Create `src/components/widgets/parent/` folder
- [ ] Create `src/hooks/queries/parent/` folder
- [ ] Create `src/locales/en/parent.json`
- [ ] Create `src/locales/hi/parent.json`
- [ ] Add parent widgets to `widgetRegistry.ts`
- [ ] Add parent screens to `routeRegistry.ts`
- [ ] Add parent screens to Platform Studio `screenRegistry.ts`
- [ ] Create `ParentNavigator.tsx` if needed
- [ ] Add parent namespace to `i18n/index.ts`
- [ ] Create Supabase tables for parent-specific data
- [ ] Add parent permissions to `role_permissions` table

### Teacher Role Setup

- [ ] Create `src/screens/teacher/` folder
- [ ] Create `src/components/widgets/teacher/` folder
- [ ] Create `src/hooks/queries/teacher/` folder
- [ ] Create `src/locales/en/teacher.json`
- [ ] Create `src/locales/hi/teacher.json`
- [ ] Add teacher widgets to `widgetRegistry.ts`
- [ ] Add teacher screens to `routeRegistry.ts`
- [ ] Add teacher screens to Platform Studio `screenRegistry.ts`
- [ ] Create `TeacherNavigator.tsx` if needed
- [ ] Add teacher namespace to `i18n/index.ts`
- [ ] Create Supabase tables for teacher-specific data
- [ ] Add teacher permissions to `role_permissions` table

### Admin Role Setup

- [ ] Create `src/screens/admin/` folder
- [ ] Create `src/components/widgets/admin/` folder
- [ ] Create `src/hooks/queries/admin/` folder
- [ ] Create `src/locales/en/admin.json`
- [ ] Create `src/locales/hi/admin.json`
- [ ] Add admin widgets to `widgetRegistry.ts`
- [ ] Add admin screens to `routeRegistry.ts`
- [ ] Add admin screens to Platform Studio `screenRegistry.ts`
- [ ] Create `AdminNavigator.tsx` if needed
- [ ] Add admin namespace to `i18n/index.ts`
- [ ] Create Supabase tables for admin-specific data
- [ ] Add admin permissions to `role_permissions` table

---

## 📎 Related Documents

- [STUDENT_COMPLETE_SPEC.md](./STUDENT_COMPLETE_SPEC.md) - Student role reference
- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - System architecture
- [WIDGET_DEVELOPMENT_GUIDE.md](./WIDGET_DEVELOPMENT_GUIDE.md) - Widget creation guide
- [DB_SCHEMA_REFERENCE.md](./DB_SCHEMA_REFERENCE.md) - Database schema
- [PERMISSIONS_RBAC_SPEC.md](./PERMISSIONS_RBAC_SPEC.md) - Permission system

---

*Document created: December 2024*