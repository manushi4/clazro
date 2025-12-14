# 👩‍🏫 TEACHER APP - COMPLETE SPECIFICATION

> **Version:** 1.0.0
> **Date:** December 2024
> **Scope:** Teacher Role Only
> **Purpose:** Single source of truth for implementing the teacher mobile app
> **Reference:** Based on STUDENT_COMPLETE_SPEC.md and PARENT_COMPLETE_SPEC.md structure
> **Status:** Initial Draft

---

## 📋 TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Naming Conventions](#2-naming-conventions)
3. [Platform Studio Integration](#3-platform-studio-integration)
4. [White-Label & Branding](#4-white-label--branding)
5. [Role & Permissions](#5-role--permissions)
6. [Navigation Structure](#6-navigation-structure)
7. [Screens Specification](#7-screens-specification)
8. [Widgets Specification](#8-widgets-specification)
9. [Widget Properties Schema](#9-widget-properties-schema)
10. [API Endpoints](#10-api-endpoints)
11. [Database Schema](#11-database-schema)
12. [Services & Hooks](#12-services--hooks)
13. [Implementation Checklist](#13-implementation-checklist)
14. [Cross-Cutting Concerns](#14-cross-cutting-concerns)

---

## 1. OVERVIEW

### 1.1 Scope

This specification covers the **Teacher** role:
- **14 Dynamic Screens** (widget-based, configurable via Platform Studio)
- **10 Fixed Screens** (essential functionality, not configurable)
- **28 Widgets** (0 built, 28 to build)
- Complete navigation structure
- Full Platform Studio compatibility
- White-label/branding support
- All API endpoints and database tables

### 1.2 Current Implementation Status

| Component | Total | Built | Remaining |
|-----------|-------|-------|-----------|
| Screens | 24 | 0 | 24 |
| Widgets | 28 | 0 | 28 |
| Query Hooks | 12 | 0 | 12 |
| Mutation Hooks | 10 | 0 | 10 |
| DB Tables | 10 | 2 | 8 |
| Permissions | 22 | 6 | 16 |

**Built Components:**
- Types: `teacher.types.ts` (from Bckup_old reference)
- Service: `teacherDashboardService.ts` (from Bckup_old reference)

### 1.3 Teacher Role Purpose

Teachers need to:
- **Manage Classes** - Create, schedule, and host live sessions
- **Create Content** - Assignments, tests, study materials
- **Grade & Evaluate** - Grade submissions, provide feedback
- **Track Attendance** - Mark and monitor student attendance
- **Monitor Progress** - View individual and class-wide analytics
- **Communicate** - Message students and parents
- **Identify At-Risk Students** - Early intervention support
- **Access AI Tools** - AI-powered grading assistance and analytics

### 1.4 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEACHER APP ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Platform Studio ──publish──> Supabase DB ──realtime──> Mobile  │
│       │                           │                       │     │
│       ▼                           ▼                       ▼     │
│  Config Editor              screen_layouts          DynamicScreen│
│  Theme Editor               navigation_tabs         Widgets     │
│  Branding Editor            customer_themes         Theme       │
│  Screen Builder             customer_branding       Branding    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   TEACHER-SPECIFIC DATA                     ││
│  │  teachers | assignments | assignment_submissions | tests    ││
│  │  live_sessions | attendance | teacher_classes | gradebook   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.5 Key Principles

| Principle | Description |
|-----------|-------------|
| **Class-Centric** | All data organized around assigned classes/batches |
| **Efficiency-First** | Minimize taps for common tasks (attendance, grading) |
| **Real-Time Updates** | Live class features, instant sync |
| **Offline-Capable** | Core features work without internet |
| **AI-Enhanced** | Smart grading, analytics, at-risk detection |
| **Config-Driven** | All UI comes from Supabase config |
| **White-Label Ready** | Every screen supports customer branding |
| **Theme-Aware** | All components use `useAppTheme()` |

---

## 2. NAMING CONVENTIONS

### 2.1 Widget IDs

Teacher widgets use the `teacher.*` naming pattern:

| Pattern | Usage | Example |
|---------|-------|---------|
| `teacher.*` | Teacher-specific widgets | `teacher.stats-grid`, `teacher.upcoming-classes` |
| `class.*` | Class-related widgets | `class.roster`, `class.attendance` |
| `grading.*` | Grading-related widgets | `grading.pending`, `grading.recent` |

**Registry Widget IDs (Platform Studio):**
```typescript
// Dashboard widgets
"teacher.hero-card"         // Teacher greeting & stats
"teacher.stats-grid"        // Quick statistics
"teacher.upcoming-classes"  // Next classes
"teacher.pending-grading"   // Submissions to grade
"teacher.at-risk-students"  // Students needing attention
"teacher.quick-actions"     // Action buttons

// Class management widgets
"class.roster"              // Student list
"class.attendance-today"    // Today's attendance
"class.recent-activity"     // Class activity feed

// Grading widgets
"grading.pending-list"      // Pending submissions
"grading.recent-grades"     // Recently graded
```

**Component File Names (React Native):**
```
TeacherHeroWidget.tsx       → exports as TeacherHeroWidget
TeacherStatsWidget.tsx      → exports as TeacherStatsWidget
UpcomingClassesWidget.tsx   → exports as UpcomingClassesWidget
PendingGradingWidget.tsx    → exports as PendingGradingWidget
```

### 2.2 Screen IDs

| Pattern | Example | Description |
|---------|---------|-------------|
| `teacher-home` | Teacher dashboard | Role-specific home |
| `class-*` | `class-detail`, `class-roster` | Class-specific screens |
| `grading-*` | `grading-hub`, `grading-detail` | Grading screens |
| `attendance-*` | `attendance-mark`, `attendance-reports` | Attendance screens |
| `live-*` | `live-class-host`, `live-class-settings` | Live class screens |

### 2.3 Hook Names

| Type | Pattern | Example |
|------|---------|---------|
| Query | `use<Entity>Query` | `useTeacherDashboardQuery`, `useClassRosterQuery` |
| Mutation | `use<Action>` | `useGradeSubmission`, `useMarkAttendance` |

### 2.4 File Structure

```
src/
├── screens/teacher/
│   ├── index.ts                    # Barrel export
│   ├── TeacherDashboardScreen.tsx  # PascalCase
│   ├── ClassDetailScreen.tsx
│   ├── GradingHubScreen.tsx
│   └── AttendanceMarkScreen.tsx
├── components/widgets/teacher/
│   ├── index.ts
│   ├── TeacherHeroWidget.tsx       # PascalCase + Widget suffix
│   ├── TeacherStatsWidget.tsx
│   └── UpcomingClassesWidget.tsx
├── hooks/queries/teacher/
│   ├── index.ts
│   ├── useTeacherDashboardQuery.ts # camelCase + Query suffix
│   └── useClassRosterQuery.ts
└── hooks/mutations/teacher/
    ├── index.ts
    ├── useGradeSubmission.ts       # camelCase (action name)
    └── useMarkAttendance.ts
```

---

## 3. PLATFORM STUDIO INTEGRATION

### 3.1 Teacher Screen Registry

**TO ADD (All screens are new):**
```typescript
// platform-studio/src/config/screenRegistry.ts
export const TEACHER_SCREENS = {
  // FULL CUSTOMIZATION (6 screens)
  'teacher-home': { type: 'dynamic', customization: 'full', allowed_roles: ['teacher'] },
  'class-hub': { type: 'dynamic', customization: 'full', allowed_roles: ['teacher'] },
  'grading-hub': { type: 'dynamic', customization: 'full', allowed_roles: ['teacher'] },
  'attendance-hub': { type: 'dynamic', customization: 'full', allowed_roles: ['teacher'] },
  'communication-hub': { type: 'dynamic', customization: 'full', allowed_roles: ['teacher'] },
  'analytics-home': { type: 'dynamic', customization: 'full', allowed_roles: ['teacher'] },

  // MEDIUM CUSTOMIZATION (8 screens)
  'class-detail': { type: 'dynamic', customization: 'medium', allowed_roles: ['teacher'] },
  'student-detail-teacher': { type: 'dynamic', customization: 'medium', allowed_roles: ['teacher'] },
  'assignment-create': { type: 'dynamic', customization: 'medium', allowed_roles: ['teacher'] },
  'test-create': { type: 'dynamic', customization: 'medium', allowed_roles: ['teacher'] },
  'attendance-mark': { type: 'dynamic', customization: 'medium', allowed_roles: ['teacher'] },
  'attendance-reports': { type: 'dynamic', customization: 'medium', allowed_roles: ['teacher'] },
  'notifications-teacher': { type: 'dynamic', customization: 'medium', allowed_roles: ['teacher'] },
  'profile-teacher': { type: 'dynamic', customization: 'medium', allowed_roles: ['teacher'] },
};
```

### 3.2 What Can Be Customized

| Category | Customizable Via | Examples |
|----------|------------------|----------|
| **Screen Layout** | Screen Builder | Add/remove/reorder widgets |
| **Widget Config** | Widget Properties Panel | Max items, layout style, toggles |
| **Navigation** | Navigation Editor | Tab order, icons, labels |
| **Theme** | Theme Editor | Colors, fonts, border radius |
| **Branding** | Branding Editor | Logo, app name, feature names |

---

## 4. WHITE-LABEL & BRANDING

### 4.1 Teacher-Specific Branding Fields

```typescript
type TeacherBrandingExtensions = {
  // Feature Naming for Teachers
  classSectionName: string;         // "Classes" → "Batches"
  assignmentSectionName: string;    // "Assignments" → "Homework"
  gradingSectionName: string;       // "Grading" → "Evaluation"
  attendanceSectionName: string;    // "Attendance" → "Roll Call"
  liveClassSectionName: string;     // "Live Class" → "Online Session"

  // Teacher-specific text
  teacherWelcomeMessage?: string;
  teacherSupportEmail?: string;
  teacherHelplineNumber?: string;
};
```

### 4.2 Branding Requirements Per Screen

| Screen | Branding Used | Theme Used |
|--------|---------------|------------|
| **All Screens** | `appName`, `logoUrl` via BrandedHeader | All colors via `useAppTheme()` |
| **Dashboard** | `teacherWelcomeMessage` | Primary, surface, text colors |
| **Classes** | `classSectionName` | All colors |
| **Assignments** | `assignmentSectionName` | All colors |
| **Grading** | `gradingSectionName` | All colors |
| **Attendance** | `attendanceSectionName` | All colors |
| **Live Class** | `liveClassSectionName` | All colors |

---

## 5. ROLE & PERMISSIONS

### 5.1 Teacher Role Definition

```typescript
type TeacherRole = {
  role: "teacher";
  hierarchy_level: 3;  // Above student and parent
  description: "Teacher with class management and grading access";
};
```

### 5.2 Base Permissions (Teacher)

| Permission Code | Description | Category |
|-----------------|-------------|----------|
| `view_dashboard` | View teacher dashboard | view |
| `view_classes` | View assigned classes | view |
| `manage_classes` | Manage class settings | action |
| `view_students` | View student list | view |
| `view_student_progress` | View individual progress | view |
| `view_assignments` | View assignments | view |
| `create_assignment` | Create new assignments | action |
| `edit_assignment` | Edit own assignments | action |
| `delete_assignment` | Delete own assignments | action |
| `view_submissions` | View assignment submissions | view |
| `grade_submission` | Grade student submissions | action |
| `view_tests` | View tests | view |
| `create_test` | Create new tests | action |
| `edit_test` | Edit own tests | action |
| `manage_test` | Manage test settings | action |
| `view_attendance` | View attendance records | view |
| `mark_attendance` | Mark student attendance | action |
| `generate_attendance_report` | Generate reports | action |
| `host_live_class` | Host live sessions | action |
| `join_live_class` | Join as co-host | action |
| `message_students` | Message students | action |
| `message_parents` | Message parents | action |
| `view_analytics` | View class analytics | view |
| `export_reports` | Export data/reports | action |

### 5.3 Feature Dependencies

| Feature ID | Required For | Default |
|------------|--------------|---------|
| `teacher.dashboard` | Teacher dashboard | enabled |
| `teacher.classes` | Class management | enabled |
| `teacher.assignments` | Assignment creation | enabled |
| `teacher.grading` | Grading interface | enabled |
| `teacher.tests` | Test creation | enabled |
| `teacher.attendance` | Attendance marking | enabled |
| `teacher.liveClass` | Live class hosting | enabled |
| `teacher.communication` | Messaging | enabled |
| `teacher.analytics` | Analytics dashboard | enabled |
| `teacher.ai_grading` | AI-assisted grading | disabled |

---

## 6. NAVIGATION STRUCTURE

### 6.1 Tab Configuration

Teachers have 5 tabs. Configuration in `navigation_tabs`:

| Tab ID | Label | Icon | Root Screen | Order | Badge |
|--------|-------|------|-------------|-------|-------|
| `home` | Home | `home` | `teacher-home` | 1 | dot |
| `classes` | Classes | `school` | `class-hub` | 2 | none |
| `grading` | Grading | `clipboard-check` | `grading-hub` | 3 | count |
| `schedule` | Schedule | `calendar` | `schedule-screen` | 4 | none |
| `profile` | Me | `person` | `profile-teacher` | 5 | none |

### 6.2 Screen-to-Tab Mapping

```
home tab:
  ├── teacher-home (root)
  ├── notifications-teacher
  ├── analytics-home
  └── settings-teacher

classes tab:
  ├── class-hub (root)
  ├── class-detail
  ├── class-roster
  ├── student-detail-teacher
  ├── attendance-mark
  └── attendance-reports

grading tab:
  ├── grading-hub (root)
  ├── assignment-detail-teacher
  ├── submission-detail
  ├── grade-submission
  ├── test-results
  └── bulk-grading

schedule tab:
  ├── schedule-screen (root) - shared with all roles
  ├── live-class-host
  ├── live-class-settings
  └── session-detail

profile tab:
  ├── profile-teacher (root)
  ├── edit-profile
  ├── communication-hub
  ├── settings-teacher
  └── help-support
```

---

## 7. SCREENS SPECIFICATION

### 7.1 Dynamic Screens - Full Customization (6 Screens)

| Screen ID | Name | Type | Default Widgets | Customization |
|-----------|------|------|-----------------|---------------|
| `teacher-home` | Teacher Dashboard | dashboard | hero-card, stats-grid, upcoming-classes, pending-grading, at-risk-students, quick-actions | 🟢 Full |
| `class-hub` | Classes Hub | hub | class-cards, class-stats, recent-activity | 🟢 Full |
| `grading-hub` | Grading Hub | dashboard | grading-stats, pending-submissions, recent-grades, rubric-templates | 🟢 Full |
| `attendance-hub` | Attendance Hub | dashboard | today-attendance, attendance-stats, alerts, quick-mark | 🟢 Full |
| `communication-hub` | Communication Hub | hub | messages-inbox, announcements, parent-contacts, templates | 🟢 Full |
| `analytics-home` | Analytics Dashboard | dashboard | class-performance, student-trends, comparison, recommendations | 🟢 Full |

### 7.2 Dynamic Screens - Medium Customization (8 Screens)

| Screen ID | Name | Type | Configurable Sections | Customization |
|-----------|------|------|----------------------|---------------|
| `class-detail` | Class Detail | detail | roster_preview, stats_summary, recent_activity, quick_actions | 🟡 Medium |
| `student-detail-teacher` | Student Detail | detail | profile_card, progress_summary, attendance_summary, recent_submissions | 🟡 Medium |
| `assignment-create` | Create Assignment | form | basic_info, questions, rubric, settings | 🟡 Medium |
| `test-create` | Create Test | form | basic_info, questions, settings, time_limits | 🟡 Medium |
| `attendance-mark` | Mark Attendance | list | class_selector, student_list, quick_actions, summary | 🟡 Medium |
| `attendance-reports` | Attendance Reports | dashboard | period_selector, stats, charts, alerts | 🟡 Medium |
| `notifications-teacher` | Notifications | list | category_filters, notification_list, time_groups | 🟡 Medium |
| `profile-teacher` | Profile | hub | profile_card, stats, classes, quick_links | 🟡 Medium |

### 7.3 Fixed Screens (10 Screens)

| Screen ID | Name | Purpose | Reason Fixed |
|-----------|------|---------|--------------|
| `login-teacher` | Login | Authentication | Security-critical auth flow |
| `signup-teacher` | Signup | Registration | Security-critical auth flow |
| `splash` | Splash | App loading | System initialization |
| `onboarding-teacher` | Onboarding | First-time setup | Sequential flow |
| `live-class-host` | Live Class Host | Host live session | Complex real-time WebRTC |
| `live-class-settings` | Live Class Settings | Configure session | Pre-session setup |
| `grade-submission` | Grade Submission | Grade individual work | Complex grading interface |
| `bulk-grading` | Bulk Grading | Grade multiple at once | Specialized workflow |
| `whiteboard` | Whiteboard | Interactive teaching | Real-time canvas |
| `legal` | Legal | Legal docs | Legal requirement |

### 7.4 Detail/Child Screens (Not Directly Configurable)

| Parent Screen | Child Screens |
|---------------|---------------|
| Class Hub | `class-detail`, `class-roster`, `class-settings`, `add-students` |
| Class Detail | `student-detail-teacher`, `attendance-mark`, `attendance-history` |
| Grading Hub | `assignment-detail-teacher`, `submission-detail`, `submission-compare` |
| Assignment Create | `add-questions`, `rubric-editor`, `preview-assignment` |
| Test Create | `question-bank`, `test-preview`, `test-settings` |
| Communication Hub | `message-detail`, `compose-message`, `announcement-create` |
| Analytics | `class-analytics`, `student-analytics`, `export-report` |

---

## 8. WIDGETS SPECIFICATION

### 8.1 Widget Props (All Teacher Widgets)

```typescript
type TeacherWidgetProps = {
  // Identity
  customerId: string;
  userId: string;
  role: 'teacher';

  // Teacher-specific
  teacherId: string;
  assignedClasses: string[];        // Class IDs teacher is assigned to
  selectedClassId?: string;         // Currently selected class (if applicable)

  // Configuration
  config: WidgetRuntimeConfig;
  branding?: CustomerBranding;
  theme?: ThemeConfig;
  size?: WidgetSize;

  // Navigation
  onNavigate: (route: string, params?: Record<string, unknown>) => void;
  onSelectClass?: (classId: string) => void;
};
```

### 8.2 Dashboard Widgets (Tier 1 - High Priority)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `teacher.hero-card` | Teacher Hero | profile | Greeting, today's stats, notifications |
| `teacher.stats-grid` | Stats Grid | stats | Classes, students, pending grading, attendance |
| `teacher.upcoming-classes` | Upcoming Classes | schedule | Next scheduled classes |
| `teacher.pending-grading` | Pending Grading | grading | Submissions awaiting grades |
| `teacher.at-risk-students` | At-Risk Students | alerts | Students needing attention |
| `teacher.quick-actions` | Quick Actions | actions | Create assignment, host class, mark attendance |

### 8.3 Class Management Widgets (Tier 1)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `class.cards` | Class Cards | classes | Cards for each assigned class |
| `class.roster` | Class Roster | classes | Student list for selected class |
| `class.stats` | Class Stats | stats | Class-level statistics |
| `class.recent-activity` | Recent Activity | activity | Recent class activities |
| `class.attendance-today` | Today's Attendance | attendance | Quick attendance status |

### 8.4 Grading Widgets (Tier 1)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `grading.pending-list` | Pending Submissions | grading | List of ungraded work |
| `grading.recent` | Recent Grades | grading | Recently graded submissions |
| `grading.stats` | Grading Stats | stats | Grading statistics |
| `grading.rubric-templates` | Rubric Templates | grading | Quick access to rubrics |

### 8.5 Attendance Widgets (Tier 2)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `attendance.today-summary` | Today's Summary | attendance | Attendance overview for today |
| `attendance.quick-mark` | Quick Mark | attendance | Fast attendance marking |
| `attendance.alerts` | Attendance Alerts | alerts | Low attendance warnings |
| `attendance.trends` | Attendance Trends | analytics | Historical attendance chart |

### 8.6 Communication Widgets (Tier 2)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `teacher.messages-inbox` | Messages Inbox | communication | Recent messages |
| `teacher.announcements` | Announcements | communication | Announcements list |
| `teacher.parent-contacts` | Parent Contacts | communication | Quick parent contact |
| `teacher.message-templates` | Message Templates | communication | Reusable templates |

### 8.7 Analytics Widgets (Tier 3)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `analytics.class-performance` | Class Performance | analytics | Overall class metrics |
| `analytics.student-comparison` | Student Comparison | analytics | Compare student progress |
| `analytics.trends` | Performance Trends | analytics | Historical trends chart |
| `analytics.predictions` | AI Predictions | ai | Performance predictions |

---

## 9. WIDGET PROPERTIES SCHEMA

### 9.1 Teacher Hero Card (`teacher.hero-card`)

```typescript
type TeacherHeroConfig = {
  // Display
  greetingStyle: "simple" | "detailed" | "minimal";  // default: "detailed"
  showAvatar: boolean;                                // default: true
  showTodayStats: boolean;                           // default: true
  showQuickSummary: boolean;                         // default: true

  // Stats to show
  statsToShow: ("classes" | "students" | "pending" | "attendance")[];

  // Actions
  showNotificationBell: boolean;                     // default: true
  showSettingsIcon: boolean;                         // default: false
};
```

### 9.2 Stats Grid (`teacher.stats-grid`)

```typescript
type TeacherStatsGridConfig = {
  // Stats to show (toggles)
  showTotalClasses: boolean;          // default: true
  showTotalStudents: boolean;         // default: true
  showPendingGrading: boolean;        // default: true
  showTodayAttendance: boolean;       // default: true
  showUpcomingSessions: boolean;      // default: false
  showAveragePerformance: boolean;    // default: false

  // Layout
  columns: 2 | 3 | 4;                 // default: 2
  showIcons: boolean;                 // default: true
  showTrend: boolean;                 // default: true

  // Actions
  enableTap: boolean;                 // default: true
};
```

### 9.3 Upcoming Classes (`teacher.upcoming-classes`)

```typescript
type UpcomingClassesConfig = {
  // Display
  maxItems: number;                   // default: 3, range: 1-10
  showTimeIndicator: boolean;         // default: true
  showSubject: boolean;               // default: true
  showBatch: boolean;                 // default: true
  showStudentCount: boolean;          // default: true

  // Layout
  layoutStyle: "list" | "timeline" | "cards";  // default: "list"

  // Content
  showJoinButton: boolean;            // default: true
  showLiveIndicator: boolean;         // default: true
  showEmptyState: boolean;            // default: true

  // Actions
  enableTap: boolean;                 // default: true
  showViewAll: boolean;               // default: true
};
```

### 9.4 Pending Grading (`teacher.pending-grading`)

```typescript
type PendingGradingConfig = {
  // Display
  maxItems: number;                   // default: 5, range: 1-20
  showStudent: boolean;               // default: true
  showAssignment: boolean;            // default: true
  showSubmittedDate: boolean;         // default: true
  showUrgencyBadge: boolean;          // default: true

  // Layout
  layoutStyle: "list" | "cards" | "compact";  // default: "list"

  // Sorting
  sortBy: "submitted_date" | "due_date" | "assignment" | "class";  // default: "submitted_date"

  // Actions
  enableTap: boolean;                 // default: true
  showViewAll: boolean;               // default: true
  showBulkGrade: boolean;             // default: false
};
```

### 9.5 At-Risk Students (`teacher.at-risk-students`)

```typescript
type AtRiskStudentsConfig = {
  // Display
  maxItems: number;                   // default: 5
  showSeverityBadge: boolean;         // default: true
  showRiskType: boolean;              // default: true
  showSuggestedAction: boolean;       // default: true
  showPhoto: boolean;                 // default: true

  // Filtering
  severityFilter: "all" | "critical" | "high" | "medium";  // default: "all"
  riskTypeFilter: "all" | "attendance" | "performance" | "behavior";  // default: "all"

  // Actions
  enableTap: boolean;                 // default: true
  showContactParent: boolean;         // default: true
  showViewAll: boolean;               // default: true
};
```

### 9.6 Quick Actions (`teacher.quick-actions`)

```typescript
type TeacherQuickActionsConfig = {
  // Layout
  columns: 2 | 3 | 4;                 // default: 3
  layoutStyle: "grid" | "list";       // default: "grid"
  showLabels: boolean;                // default: true
  iconSize: "small" | "medium" | "large";  // default: "medium"

  // Actions to show
  showCreateAssignment: boolean;      // default: true
  showCreateTest: boolean;            // default: true
  showHostClass: boolean;             // default: true
  showMarkAttendance: boolean;        // default: true
  showGradeWork: boolean;             // default: true
  showViewAnalytics: boolean;         // default: false
  showSendMessage: boolean;           // default: false

  // Custom actions
  customActions: {
    id: string;
    label: string;
    icon: string;
    color: string;
    route: string;
  }[];
};
```

### 9.7 Class Cards (`class.cards`)

```typescript
type ClassCardsConfig = {
  // Display
  layoutStyle: "cards" | "list" | "grid";  // default: "cards"
  showStudentCount: boolean;          // default: true
  showSubject: boolean;               // default: true
  showSchedule: boolean;              // default: true
  showTodayAttendance: boolean;       // default: true
  showPendingWork: boolean;           // default: false

  // Actions
  enableTap: boolean;                 // default: true
  showQuickMark: boolean;             // default: false
};
```

### 9.8 Attendance Quick Mark (`attendance.quick-mark`)

```typescript
type AttendanceQuickMarkConfig = {
  // Display
  showClassSelector: boolean;         // default: true
  showStudentPhotos: boolean;         // default: true
  showStudentRoll: boolean;           // default: true

  // Interaction
  markingMethod: "tap" | "swipe" | "both";  // default: "tap"
  defaultStatus: "present" | "none";  // default: "none"
  showMarkAllPresent: boolean;        // default: true

  // Summary
  showLiveCount: boolean;             // default: true
  showSubmitButton: boolean;          // default: true
};
```

---

## 10. API ENDPOINTS

### 10.1 Dashboard APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_teacher_dashboard` | All dashboard data | `{teacher_id}` | TeacherDashboardData |
| `get_teacher_stats` | Quick statistics | `{teacher_id}` | TeacherStats |
| `get_upcoming_classes` | Upcoming sessions | `{teacher_id, limit?}` | LiveSession[] |
| `get_pending_grading` | Submissions to grade | `{teacher_id, limit?}` | Submission[] |
| `get_at_risk_students` | At-risk students | `{teacher_id}` | StudentAtRisk[] |
| `get_recent_activity` | Recent activities | `{teacher_id, limit?}` | Activity[] |

### 10.2 Class Management APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_teacher_classes` | Get assigned classes | `{teacher_id}` | Class[] |
| `get_class_detail` | Class details | `{class_id}` | ClassDetail |
| `get_class_roster` | Students in class | `{class_id}` | Student[] |
| `get_class_stats` | Class statistics | `{class_id}` | ClassStats |
| `add_student_to_class` | Add student | `{class_id, student_id}` | void |
| `remove_student_from_class` | Remove student | `{class_id, student_id}` | void |

### 10.3 Assignment & Grading APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_assignments` | List assignments | `{teacher_id, status?}` | Assignment[] |
| `create_assignment` | Create assignment | `{assignment_data}` | Assignment |
| `update_assignment` | Update assignment | `{assignment_id, data}` | Assignment |
| `delete_assignment` | Delete assignment | `{assignment_id}` | void |
| `get_submissions` | Get submissions | `{assignment_id}` | Submission[] |
| `grade_submission` | Grade single | `{submission_id, grade_data}` | Submission |
| `bulk_grade` | Grade multiple | `{grades[]}` | Submission[] |
| `get_rubrics` | Get rubrics | `{teacher_id}` | Rubric[] |
| `create_rubric` | Create rubric | `{rubric_data}` | Rubric |

### 10.4 Test Management APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_tests` | List tests | `{teacher_id, status?}` | Test[] |
| `create_test` | Create test | `{test_data}` | Test |
| `update_test` | Update test | `{test_id, data}` | Test |
| `get_test_results` | Get results | `{test_id}` | TestResult[] |
| `get_question_bank` | Question bank | `{teacher_id, subject?}` | Question[] |
| `add_to_question_bank` | Save question | `{question_data}` | Question |

### 10.5 Attendance APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_attendance` | Get records | `{class_id, date}` | Attendance[] |
| `mark_attendance` | Mark single | `{student_id, class_id, date, status}` | Attendance |
| `bulk_mark_attendance` | Mark multiple | `{class_id, date, records[]}` | Attendance[] |
| `get_attendance_report` | Generate report | `{class_id, period}` | AttendanceReport |
| `get_attendance_alerts` | Get alerts | `{teacher_id}` | AttendanceAlert[] |
| `acknowledge_alert` | Ack alert | `{alert_id}` | void |
| `resolve_alert` | Resolve alert | `{alert_id, notes}` | void |

### 10.6 Live Class APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `create_live_session` | Schedule session | `{session_data}` | LiveSession |
| `start_live_session` | Start session | `{session_id}` | LiveSession |
| `end_live_session` | End session | `{session_id}` | LiveSession |
| `get_session_participants` | Participants | `{session_id}` | Participant[] |
| `create_breakout_room` | Create room | `{session_id, room_data}` | BreakoutRoom |
| `save_whiteboard` | Save whiteboard | `{session_id, canvas_data}` | void |
| `get_session_recording` | Get recording | `{session_id}` | Recording |

### 10.7 Communication APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_teacher_messages` | Get messages | `{teacher_id, filter?}` | Message[] |
| `send_message` | Send message | `{recipient_id, content}` | Message |
| `send_bulk_message` | Bulk message | `{recipients[], content}` | Message[] |
| `create_announcement` | Create announcement | `{announcement_data}` | Announcement |
| `get_message_templates` | Get templates | `{teacher_id}` | Template[] |
| `save_message_template` | Save template | `{template_data}` | Template |

### 10.8 Analytics APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_class_analytics` | Class analytics | `{class_id, period}` | ClassAnalytics |
| `get_student_analytics` | Student analytics | `{student_id}` | StudentAnalytics |
| `get_teacher_performance` | Teacher metrics | `{teacher_id}` | TeacherPerformance |
| `get_comparison_data` | Compare students | `{class_id}` | ComparisonData |
| `export_report` | Export data | `{type, filters}` | ReportFile |

---

## 11. DATABASE SCHEMA

### 11.1 Core Teacher Tables

#### `teachers`
```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  employee_id TEXT,
  department TEXT,
  subject_specialization TEXT,
  qualification TEXT,
  experience_years INTEGER,
  date_of_joining DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  profile_picture_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, user_id)
);
```

#### `teacher_classes` (Assignment of teachers to classes/batches)
```sql
CREATE TABLE teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  subject_id UUID REFERENCES subjects(id),
  is_class_teacher BOOLEAN DEFAULT false,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, teacher_id, class_id, subject_id)
);
```

### 11.2 Assignment Tables

#### `assignments` (Already exists, enhanced)
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  class_id UUID REFERENCES classes(id),
  subject_id UUID REFERENCES subjects(id),
  title_en TEXT NOT NULL,
  title_hi TEXT,
  description_en TEXT,
  description_hi TEXT,
  assignment_type TEXT DEFAULT 'homework' CHECK (assignment_type IN
    ('homework', 'quiz', 'test', 'project', 'exam')),
  due_date TIMESTAMPTZ NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 100,
  attachment_urls JSONB DEFAULT '[]',
  rubric_id UUID REFERENCES assignment_rubrics(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `assignment_submissions` (Already exists, enhanced)
```sql
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  assignment_id UUID NOT NULL REFERENCES assignments(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  submission_text TEXT,
  attachment_urls JSONB DEFAULT '[]',
  submitted_at TIMESTAMPTZ,
  score INTEGER,
  percentage DECIMAL(5,2),
  feedback TEXT,
  feedback_attachments JSONB DEFAULT '[]',
  rubric_scores JSONB,
  graded_by UUID REFERENCES teachers(id),
  graded_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN
    ('pending', 'submitted', 'late', 'graded', 'returned')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);
```

#### `assignment_rubrics`
```sql
CREATE TABLE assignment_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  name_en TEXT NOT NULL,
  name_hi TEXT,
  description_en TEXT,
  description_hi TEXT,
  criteria JSONB NOT NULL DEFAULT '[]',
  is_template BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 11.3 Attendance Tables

#### `attendance_records` (Already exists)
```sql
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  class_id UUID REFERENCES classes(id),
  session_id UUID REFERENCES live_sessions(id),
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN
    ('present', 'absent', 'late', 'excused', 'half_day')),
  check_in_time TIME,
  check_out_time TIME,
  reason TEXT,
  marked_by UUID REFERENCES teachers(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, student_id, class_id, attendance_date)
);
```

#### `attendance_alerts`
```sql
CREATE TABLE attendance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  class_id UUID REFERENCES classes(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN
    ('low_attendance', 'consecutive_absences', 'pattern_detected', 'at_risk')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  threshold_value DECIMAL(5,2),
  current_value DECIMAL(5,2),
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES teachers(id),
  acknowledged_at TIMESTAMPTZ,
  is_resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 11.4 Live Session Tables

#### `live_sessions`
```sql
CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  subject_id UUID REFERENCES subjects(id),
  title_en TEXT NOT NULL,
  title_hi TEXT,
  description_en TEXT,
  description_hi TEXT,
  scheduled_start_at TIMESTAMPTZ NOT NULL,
  scheduled_end_at TIMESTAMPTZ,
  actual_start_at TIMESTAMPTZ,
  actual_end_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  meeting_link TEXT,
  meeting_id TEXT,
  passcode TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN
    ('scheduled', 'live', 'ended', 'cancelled')),
  recording_url TEXT,
  participant_count INTEGER DEFAULT 0,
  is_recorded BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `breakout_rooms`
```sql
CREATE TABLE breakout_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_sessions(id),
  room_name TEXT NOT NULL,
  room_number INTEGER,
  max_participants INTEGER DEFAULT 10,
  topic TEXT,
  created_by UUID NOT NULL REFERENCES teachers(id),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `whiteboard_data`
```sql
CREATE TABLE whiteboard_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_sessions(id),
  page_number INTEGER DEFAULT 1,
  canvas_data JSONB NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 11.5 Communication Tables

#### `teacher_messages`
```sql
CREATE TABLE teacher_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('teacher', 'parent', 'student', 'admin')),
  recipient_id UUID NOT NULL,
  recipient_role TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  related_student_id UUID REFERENCES user_profiles(id),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  thread_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `teacher_announcements`
```sql
CREATE TABLE teacher_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  class_id UUID REFERENCES classes(id),
  target_type TEXT NOT NULL CHECK (target_type IN
    ('class', 'all_classes', 'specific_students', 'parents')),
  target_ids UUID[] DEFAULT '{}',
  title_en TEXT NOT NULL,
  title_hi TEXT,
  content_en TEXT NOT NULL,
  content_hi TEXT,
  attachments JSONB DEFAULT '[]',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  publish_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 11.6 Performance & Analytics Tables

#### `teacher_performance_summary` (View)
```sql
CREATE OR REPLACE VIEW teacher_performance_summary AS
SELECT
  t.id AS teacher_id,
  t.full_name,
  COUNT(DISTINCT a.id) AS total_assignments,
  COUNT(DISTINCT ls.id) AS total_sessions,
  AVG(EXTRACT(EPOCH FROM (asub.graded_at - asub.submitted_at)) / 3600) AS avg_grading_time_hours,
  ROUND(AVG(CASE WHEN ar.status = 'present' THEN 100.0 ELSE 0 END), 2) AS avg_attendance_percentage,
  ROUND(COUNT(CASE WHEN asub.status = 'graded' THEN 1 END)::numeric /
        NULLIF(COUNT(CASE WHEN asub.status = 'submitted' THEN 1 END), 0) * 100, 2) AS completion_rate
FROM teachers t
LEFT JOIN assignments a ON a.teacher_id = t.id
LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id
LEFT JOIN live_sessions ls ON ls.teacher_id = t.id
LEFT JOIN teacher_classes tc ON tc.teacher_id = t.id
LEFT JOIN attendance_records ar ON ar.class_id = tc.class_id
GROUP BY t.id, t.full_name;
```

---

## 12. SERVICES & HOOKS

### 12.1 Teacher-Specific Query Hooks

| Hook | Purpose | Location |
|------|---------|----------|
| `useTeacherDashboard` | Dashboard data | `src/hooks/queries/teacher/useTeacherDashboardQuery.ts` |
| `useTeacherClasses` | Assigned classes | `src/hooks/queries/teacher/useTeacherClassesQuery.ts` |
| `useClassRoster` | Class student list | `src/hooks/queries/teacher/useClassRosterQuery.ts` |
| `usePendingGrading` | Ungraded submissions | `src/hooks/queries/teacher/usePendingGradingQuery.ts` |
| `useTeacherAssignments` | Teacher's assignments | `src/hooks/queries/teacher/useTeacherAssignmentsQuery.ts` |
| `useAtRiskStudents` | At-risk student list | `src/hooks/queries/teacher/useAtRiskStudentsQuery.ts` |
| `useAttendanceRecords` | Attendance data | `src/hooks/queries/teacher/useAttendanceRecordsQuery.ts` |
| `useUpcomingSessions` | Upcoming live classes | `src/hooks/queries/teacher/useUpcomingSessionsQuery.ts` |
| `useTeacherMessages` | Messages | `src/hooks/queries/teacher/useTeacherMessagesQuery.ts` |
| `useTeacherAnalytics` | Analytics data | `src/hooks/queries/teacher/useTeacherAnalyticsQuery.ts` |
| `useClassAnalytics` | Class-level analytics | `src/hooks/queries/teacher/useClassAnalyticsQuery.ts` |
| `useStudentProgress` | Individual student progress | `src/hooks/queries/teacher/useStudentProgressQuery.ts` |

### 12.2 Teacher Mutations

| Hook | Purpose | Location |
|------|---------|----------|
| `useCreateAssignment` | Create assignment | `src/hooks/mutations/teacher/useCreateAssignment.ts` |
| `useGradeSubmission` | Grade submission | `src/hooks/mutations/teacher/useGradeSubmission.ts` |
| `useBulkGrade` | Grade multiple | `src/hooks/mutations/teacher/useBulkGrade.ts` |
| `useMarkAttendance` | Mark attendance | `src/hooks/mutations/teacher/useMarkAttendance.ts` |
| `useBulkMarkAttendance` | Mark multiple | `src/hooks/mutations/teacher/useBulkMarkAttendance.ts` |
| `useCreateLiveSession` | Schedule session | `src/hooks/mutations/teacher/useCreateLiveSession.ts` |
| `useStartSession` | Start live class | `src/hooks/mutations/teacher/useStartSession.ts` |
| `useSendMessage` | Send message | `src/hooks/mutations/teacher/useSendMessage.ts` |
| `useCreateAnnouncement` | Create announcement | `src/hooks/mutations/teacher/useCreateAnnouncement.ts` |
| `useAcknowledgeAlert` | Acknowledge alert | `src/hooks/mutations/teacher/useAcknowledgeAlert.ts` |

### 12.3 Shared Hooks (Reused)

| Hook | Purpose | Notes |
|------|---------|-------|
| `useAppTheme` | Theme colors & styles | Same as student |
| `useBranding` | Branding context | Same as student |
| `useNetworkStatus` | Online/offline status | Same as student |
| `useAnalytics` | Analytics tracking | Same as student |
| `useTranslation` | i18n translations | Same as student |
| `usePermissions` | Permission checking | Same as student |

### 12.4 Hook Implementation Pattern

```typescript
// src/hooks/queries/teacher/useTeacherDashboardQuery.ts
export function useTeacherDashboard(teacherId: string) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['teacher-dashboard', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_teacher_dashboard', { p_teacher_id: teacherId });

      if (error) throw error;
      return data as TeacherDashboard;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!teacherId,
    retry: isOnline ? 2 : 0,
  });
}

// src/hooks/mutations/teacher/useGradeSubmission.ts
export function useGradeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GradeSubmissionInput) => {
      const { error } = await supabase
        .rpc('grade_submission', data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pending-grading'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}
```

---

## 13. IMPLEMENTATION CHECKLIST

### 13.1 Phase 1: Core Infrastructure (Week 1-2)

#### Database & Config
- [ ] Create `teachers` table
- [ ] Create `teacher_classes` table
- [ ] Create `assignment_rubrics` table
- [ ] Create `attendance_alerts` table
- [ ] Create `live_sessions` table
- [ ] Create `breakout_rooms` table
- [ ] Create `whiteboard_data` table
- [ ] Create `teacher_messages` table
- [ ] Create `teacher_announcements` table
- [ ] Create `teacher_performance_summary` view
- [ ] Add teacher navigation tabs to DB
- [ ] Add teacher screen layouts to DB
- [ ] Add teacher permissions to `role_permissions`

#### Folder Structure
- [ ] Create `src/screens/teacher/` folder
- [ ] Create `src/components/widgets/teacher/` folder
- [ ] Create `src/hooks/queries/teacher/` folder
- [ ] Create `src/hooks/mutations/teacher/` folder
- [ ] Create `src/types/teacher.types.ts`
- [ ] Create `src/locales/en/teacher.json`
- [ ] Create `src/locales/hi/teacher.json`

### 13.2 Phase 2: Dashboard & Core Widgets (Week 3-4)

#### Dashboard Screen
- [ ] `TeacherDashboardScreen` component
- [ ] `useTeacherDashboard` query hook

#### Tier 1 Widgets (Dashboard)
- [ ] `TeacherHeroWidget` - Hero card
- [ ] `TeacherStatsWidget` - Stats grid
- [ ] `UpcomingClassesWidget` - Upcoming classes
- [ ] `PendingGradingWidget` - Pending grading
- [ ] `AtRiskStudentsWidget` - At-risk students
- [ ] `TeacherQuickActionsWidget` - Quick actions

### 13.3 Phase 3: Class Management (Week 5-6)

#### Screens
- [ ] `ClassHubScreen` - Classes list
- [ ] `ClassDetailScreen` - Single class view
- [ ] `ClassRosterScreen` - Student list
- [ ] `StudentDetailTeacherScreen` - Student detail

#### Widgets
- [ ] `ClassCardsWidget` - Class cards
- [ ] `ClassRosterWidget` - Roster preview
- [ ] `ClassStatsWidget` - Class statistics
- [ ] `ClassActivityWidget` - Recent activity

#### Hooks
- [ ] `useTeacherClasses` - Get assigned classes
- [ ] `useClassRoster` - Get class students
- [ ] `useClassStats` - Get class statistics

### 13.4 Phase 4: Grading System (Week 7-8)

#### Screens
- [ ] `GradingHubScreen` - Grading dashboard
- [ ] `SubmissionDetailScreen` - View submission
- [ ] `GradeSubmissionScreen` - Grade interface (Fixed)
- [ ] `BulkGradingScreen` - Bulk grading (Fixed)

#### Widgets
- [ ] `PendingSubmissionsWidget` - Pending list
- [ ] `RecentGradesWidget` - Recent grades
- [ ] `GradingStatsWidget` - Grading stats
- [ ] `RubricTemplatesWidget` - Quick rubrics

#### Hooks
- [ ] `usePendingGrading` - Pending submissions
- [ ] `useGradeSubmission` - Grade mutation
- [ ] `useBulkGrade` - Bulk grade mutation
- [ ] `useRubrics` - Get rubrics

### 13.5 Phase 5: Attendance System (Week 9-10)

#### Screens
- [ ] `AttendanceHubScreen` - Attendance dashboard
- [ ] `AttendanceMarkScreen` - Mark attendance
- [ ] `AttendanceReportsScreen` - Reports view

#### Widgets
- [ ] `TodayAttendanceWidget` - Today's status
- [ ] `AttendanceQuickMarkWidget` - Fast marking
- [ ] `AttendanceAlertsWidget` - Alerts list
- [ ] `AttendanceTrendsWidget` - Trends chart

#### Hooks
- [ ] `useAttendanceRecords` - Get attendance
- [ ] `useMarkAttendance` - Mark single
- [ ] `useBulkMarkAttendance` - Mark bulk
- [ ] `useAttendanceAlerts` - Get alerts

### 13.6 Phase 6: Live Class System (Week 11-12)

#### Screens
- [ ] `LiveClassHostScreen` - Host session (Fixed)
- [ ] `LiveClassSettingsScreen` - Configure session (Fixed)
- [ ] `WhiteboardScreen` - Interactive whiteboard (Fixed)
- [ ] `SessionDetailScreen` - Session info

#### Hooks
- [ ] `useUpcomingSessions` - Get upcoming
- [ ] `useCreateLiveSession` - Create session
- [ ] `useStartSession` - Start session
- [ ] `useEndSession` - End session

#### Integration
- [ ] WebRTC video integration
- [ ] Whiteboard canvas integration
- [ ] Screen sharing setup
- [ ] Recording functionality

### 13.7 Phase 7: Communication (Week 13-14)

#### Screens
- [ ] `CommunicationHubScreen` - Messages dashboard
- [ ] `MessageDetailScreen` - Message thread
- [ ] `ComposeMessageScreen` - New message
- [ ] `AnnouncementCreateScreen` - Create announcement

#### Widgets
- [ ] `MessagesInboxWidget` - Inbox preview
- [ ] `AnnouncementsWidget` - Announcements list
- [ ] `ParentContactsWidget` - Quick contacts
- [ ] `MessageTemplatesWidget` - Templates

#### Hooks
- [ ] `useTeacherMessages` - Get messages
- [ ] `useSendMessage` - Send mutation
- [ ] `useCreateAnnouncement` - Announcement mutation

### 13.8 Phase 8: Analytics & Polish (Week 15-16)

#### Screens
- [ ] `AnalyticsHomeScreen` - Analytics dashboard
- [ ] `ClassAnalyticsScreen` - Class analytics
- [ ] `StudentAnalyticsScreen` - Student analytics

#### Widgets
- [ ] `ClassPerformanceWidget` - Performance chart
- [ ] `StudentComparisonWidget` - Compare students
- [ ] `TrendsWidget` - Historical trends
- [ ] `AIPredictionsWidget` - AI insights

#### Quality
- [ ] Error handling (all screens)
- [ ] Loading states (skeletons)
- [ ] Empty states
- [ ] Offline support
- [ ] i18n (English + Hindi)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

---

## 14. CROSS-CUTTING CONCERNS

### 14.1 Offline Support

| Feature | Offline Behavior |
|---------|------------------|
| Dashboard | ✅ Works (cached widgets) |
| Class Roster | ✅ Works (cached data) |
| View Attendance | ✅ Works (cached) |
| Mark Attendance | ⚠️ Queued (syncs when online) |
| View Submissions | ✅ Works (cached) |
| Grade Submission | ⚠️ Queued (syncs when online) |
| Live Class | ❌ Online only |
| Send Message | ⚠️ Queued |
| Create Assignment | ⚠️ Draft saved locally |
| Analytics | ❌ Online only |

### 14.2 i18n Considerations

Teachers interact with content in both languages:
- UI text: Always from i18n files
- Assignments: Created in both EN/HI
- Announcements: Created in both EN/HI
- Student names: Display as stored

```typescript
// Teacher creates assignment
const createAssignment = {
  title_en: "Math Assignment 1",
  title_hi: "गणित असाइनमेंट 1",
  description_en: "Complete exercises...",
  description_hi: "अभ्यास पूरा करें...",
};
```

### 14.3 Real-Time Features

| Feature | Real-Time Requirement |
|---------|----------------------|
| Live Class | WebRTC video, chat |
| Attendance Marking | Instant sync |
| Grading Updates | Push to student |
| Message Notifications | Instant delivery |
| Alert Updates | Background refresh |

### 14.4 Permission Gates

```typescript
// Example permission checks
<PermissionGate permission="create_assignment">
  <CreateAssignmentButton />
</PermissionGate>

<PermissionGate permission="grade_submission">
  <GradeButton />
</PermissionGate>

<PermissionGate permission="host_live_class">
  <HostClassButton />
</PermissionGate>
```

### 14.5 Analytics Events

| Event | When |
|-------|------|
| `teacher_screen_view` | Screen focused |
| `teacher_class_selected` | Class switched |
| `teacher_attendance_marked` | Attendance saved |
| `teacher_assignment_created` | Assignment published |
| `teacher_submission_graded` | Grade saved |
| `teacher_live_session_started` | Session started |
| `teacher_message_sent` | Message sent |

---

## 📊 SUMMARY STATISTICS

| Category | Total | Built | Remaining | Notes |
|----------|-------|-------|-----------|-------|
| **Dynamic Screens (Full)** | 6 | 0 | 6 | Widget-based, fully customizable |
| **Dynamic Screens (Medium)** | 8 | 0 | 8 | Section-based customization |
| **Fixed Screens** | 10 | 0 | 10 | Essential functionality only |
| **Total Screens** | 24 | 0 | 24 | + detail/child screens |
| **Widgets (Tier 1)** | 14 | 0 | 14 | Dashboard, class, grading |
| **Widgets (Tier 2)** | 8 | 0 | 8 | Attendance, communication |
| **Widgets (Tier 3)** | 6 | 0 | 6 | Analytics, AI |
| **Total Widgets** | 28 | 0 | 28 | |
| **Query Hooks** | 12 | 0 | 12 | |
| **Mutation Hooks** | 10 | 0 | 10 | |
| **API Endpoints** | 40+ | - | - | RPC functions |
| **Database Tables** | 10 | 2 | 8 | |
| **Permissions** | 22 | 6 | 16 | |
| **Navigation Tabs** | 5 | 0 | 5 | |

### Platform Studio Compatibility

| Feature | Status |
|---------|--------|
| Screen Builder | ✅ 14 screens configurable |
| Widget Properties | ✅ All widgets have config schema |
| Theme Editor | ✅ Full theme customization |
| Branding Editor | ✅ Full white-label support |
| Navigation Editor | ✅ Tab configuration |
| Realtime Updates | ✅ Config changes apply instantly |

### Comparison with Other Roles

| Metric | Student | Parent | Teacher |
|--------|---------|--------|---------|
| Dynamic Screens | 15 | 12 | 14 |
| Fixed Screens | 12 | 8 | 10 |
| Total Widgets | 28 | 24 | 28 |
| Unique Features | Learning, Tests, AI Tutor | Fee Payment, Child Monitoring | Class Management, Grading, Live Class |

---

## 📎 RELATED DOCUMENTS

- [STUDENT_COMPLETE_SPEC.md](./STUDENT_COMPLETE_SPEC.md) - Student role reference
- [PARENT_COMPLETE_SPEC.md](./PARENT_COMPLETE_SPEC.md) - Parent role reference
- [Multi-Role Development Guide.md](./Multi-Role%20Development%20Guide.md) - Multi-role architecture
- [DB_SCHEMA_REFERENCE.md](./DB_SCHEMA_REFERENCE.md) - Database schema
- [WIDGET_DEVELOPMENT_GUIDE.md](./WIDGET_DEVELOPMENT_GUIDE.md) - Widget creation guide
- [SCREEN_DEVELOPMENT_GUIDE.md](./SCREEN_DEVELOPMENT_GUIDE.md) - Screen creation guide
- [PERMISSIONS_RBAC_SPEC.md](./PERMISSIONS_RBAC_SPEC.md) - Permission system

---

*Document created: December 2024*
*Last validated: December 13, 2024*
*Status: Initial Draft - Pending Validation*

### Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 13, 2024 | Initial specification based on Bckup_old teacher services and UX research |
