# 👨‍👩‍👧 PARENT APP - COMPLETE SPECIFICATION

> **Version:** 1.1.0
> **Date:** December 2024 (Updated: Dec 11, 2024)
> **Scope:** Parent Role Only
> **Purpose:** Single source of truth for implementing the parent mobile app
> **Reference:** Based on STUDENT_COMPLETE_SPEC.md structure
> **Status:** Validated & Aligned with Codebase

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

This specification covers the **Parent** role:
- **12 Dynamic Screens** (widget-based, configurable via Platform Studio)
- **8 Fixed Screens** (essential functionality, not configurable)
- **24 Widgets** (5 built, 19 to build)
- Complete navigation structure
- Full Platform Studio compatibility
- White-label/branding support
- All API endpoints and database tables

### 1.2 Current Implementation Status

| Component | Total | Built | Remaining |
|-----------|-------|-------|-----------|
| Screens | 20 | 3 | 17 |
| Widgets | 24 | 5 | 19 |
| Query Hooks | 8 | 5 | 3 |
| Mutation Hooks | 4 | 0 | 4 |
| DB Tables | 8 | 4 | 4 |
| Permissions | 19 | 5 | 14 |

**Built Components:**
- Screens: `ParentDashboardScreen`, `ChildrenListScreen`, `ChildDetailScreen`
- Widgets: `ChildrenOverviewWidget`, `ChildProgressWidget`, `AttendanceWidget`, `FeeStatusWidget`, `ParentNotificationsWidget`
- Hooks: `useChildrenQuery`, `useChildProgressQuery`, `useChildAttendanceQuery`, `useFeeStatusQuery`, `useParentNotificationsQuery`


### 1.3 Parent Role Purpose

Parents need to:
- **Monitor** their children's academic progress in real-time
- **Track** attendance, assignments, tests, and behavior
- **Communicate** with teachers and school administration
- **Manage** fee payments and financial records
- **Receive** AI-powered insights and predictions about their child
- **Stay informed** via automated notifications and reports

### 1.4 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARENT APP ARCHITECTURE                      │
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
│  │                   PARENT-SPECIFIC DATA                      ││
│  │  parent_children | attendance_records | fee_records         ││
│  │  parent_notifications | child_progress_snapshots            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.5 Key Principles

| Principle | Description |
|-----------|-------------|
| **Child-Centric** | All data viewed through lens of linked children |
| **Multi-Child Support** | Parents can have multiple children linked |
| **AI-Powered Insights** | Predictions, recommendations, early warnings |
| **Automated Communication** | WhatsApp, SMS, Email, Push notifications |
| **Config-Driven** | All UI comes from Supabase config |
| **White-Label Ready** | Every screen supports customer branding |
| **Theme-Aware** | All components use `useAppTheme()` |

---

## 2. NAMING CONVENTIONS

### 2.1 Widget IDs

Parent widgets use two naming patterns based on context:

| Pattern | Usage | Example |
|---------|-------|---------|
| `child.*` | Widgets showing child-specific data | `child.progress`, `child.schedule`, `child.attendance` |
| `parent.*` | Widgets for parent-specific actions/views | `parent.fee-alerts`, `parent.messages-inbox` |

**Registry Widget IDs (Platform Studio):**
```typescript
// Child-centric widgets (showing child data)
"child.progress"      // Child's learning progress
"child.schedule"      // Child's class schedule
"child.attendance"    // Child's attendance record
"child.selector"      // Switch between children

// Parent action widgets
"parent.fee-summary"  // Fee overview
"parent.messages"     // Message inbox
"parent.quick-actions" // Action buttons
```

**Component File Names (React Native):**
```
ChildrenOverviewWidget.tsx  → exports as ChildrenOverviewWidget
ChildProgressWidget.tsx     → exports as ChildProgressWidget
AttendanceWidget.tsx        → exports as AttendanceWidget
FeeStatusWidget.tsx         → exports as FeeStatusWidget
```

### 2.2 Screen IDs

| Pattern | Example | Description |
|---------|---------|-------------|
| `parent-home` | Parent dashboard | Role-specific home |
| `child-progress-screen` | Child progress view | Child-specific screens |
| `profile-home` | Profile hub | Shared screens (multi-role) |
| `schedule-screen` | Schedule view | Shared screens (multi-role) |

### 2.3 Hook Names

| Type | Pattern | Example |
|------|---------|---------|
| Query | `use<Entity>Query` | `useChildrenQuery`, `useChildProgressQuery` |
| Mutation | `use<Action>` | `useSendMessage`, `useInitiatePayment` |

### 2.4 File Structure

```
src/
├── screens/parent/
│   ├── index.ts                    # Barrel export
│   ├── ParentDashboardScreen.tsx   # PascalCase
│   └── ChildDetailScreen.tsx
├── components/widgets/parent/
│   ├── index.ts
│   ├── ChildrenOverviewWidget.tsx  # PascalCase + Widget suffix
│   └── ChildProgressWidget.tsx
├── hooks/queries/parent/
│   ├── index.ts
│   ├── useChildrenQuery.ts         # camelCase + Query suffix
│   └── useChildProgressQuery.ts
└── hooks/mutations/parent/
    ├── index.ts
    └── useSendMessage.ts           # camelCase (action name)
```

---

## 3. PLATFORM STUDIO INTEGRATION

### 3.1 Parent Screen Registry

**Currently Registered in Platform Studio:**
```typescript
// platform-studio/src/config/screenRegistry.ts
// EXISTING (2 screens)
'parent-home': { screen_type: 'dashboard', allowed_roles: ['parent'] },
'child-progress-screen': { screen_type: 'hub', allowed_roles: ['parent'] },

// SHARED SCREENS (accessible by parent)
'schedule-screen': { allowed_roles: ['student', 'teacher', 'parent'] },
'progress-home': { allowed_roles: ['student', 'parent'] },
'profile-home': { allowed_roles: ['student', 'teacher', 'parent', 'admin'] },
```

**TO ADD (10 screens):**
```typescript
export const PARENT_SCREENS_TO_ADD = {
  // FULL CUSTOMIZATION (4 screens to add)
  'children-overview': { type: 'dynamic', customization: 'full' },
  'academic-home': { type: 'dynamic', customization: 'full' },
  'communication-hub': { type: 'dynamic', customization: 'full' },
  'fee-management': { type: 'dynamic', customization: 'full' },

  // MEDIUM CUSTOMIZATION (6 screens to add)
  'child-detail': { type: 'dynamic', customization: 'medium' },
  'attendance-view': { type: 'dynamic', customization: 'medium' },
  'notifications-parent': { type: 'dynamic', customization: 'medium' },
  'ai-insights': { type: 'dynamic', customization: 'medium' },
  'settings-parent': { type: 'dynamic', customization: 'medium' },
  'analytics-home': { type: 'dynamic', customization: 'medium' },
};
```

### 3.2 What Can Be Customized

| Category | Customizable Via | Examples |
|----------|------------------|----------|
| **Screen Layout** | Screen Builder | Add/remove/reorder widgets |
| **Widget Config** | Widget Properties Panel | Max children shown, chart types |
| **Navigation** | Navigation Editor | Tab order, icons, labels |
| **Theme** | Theme Editor | Colors, fonts, border radius |
| **Branding** | Branding Editor | Logo, app name, feature names |

---

## 4. WHITE-LABEL & BRANDING

### 4.1 Parent-Specific Branding Fields

```typescript
type ParentBrandingExtensions = {
  // Feature Naming for Parents
  childSectionName: string;       // "My Children" → "My Wards"
  attendanceSectionName: string;  // "Attendance" → "Presence"
  feeSectionName: string;         // "Fees" → "Payments"
  reportCardName: string;         // "Report Card" → "Progress Report"
  
  // Parent-specific text
  parentWelcomeMessage?: string;
  parentSupportEmail?: string;
  parentHelplineNumber?: string;
};
```

---

## 5. ROLE & PERMISSIONS

### 5.1 Parent Role Definition

```typescript
type ParentRole = {
  role: "parent";
  hierarchy_level: 2;  // Above student, below teacher
  description: "Parent/Guardian with child monitoring access";
};
```

### 5.2 Base Permissions (Parent)

| Permission Code | Description | Category |
|-----------------|-------------|----------|
| `view_children` | View linked children list | view |
| `view_child_progress` | View child's academic progress | view |
| `view_child_attendance` | View child's attendance | view |
| `view_child_assignments` | View child's assignments | view |
| `view_child_tests` | View child's test results | view |
| `view_child_doubts` | View child's doubts | view |
| `view_child_behavior` | View behavior reports | view |
| `view_fees` | View fee status | view |
| `make_payment` | Make fee payments | action |
| `view_fee_history` | View payment history | view |
| `message_teacher` | Message teachers | action |
| `view_announcements` | View school announcements | view |
| `view_notifications` | View notifications | view |
| `view_reports` | View AI-generated reports | view |
| `view_ai_insights` | View AI predictions | premium |
| `edit_profile` | Edit own profile | action |
| `manage_children` | Add/remove linked children | action |
| `download_reports` | Download progress reports | action |
| `schedule_meeting` | Schedule parent-teacher meeting | action |

### 5.3 Feature Dependencies

| Feature ID | Required For | Default |
|------------|--------------|---------|
| `parent.dashboard` | Parent dashboard | enabled |
| `parent.children` | Children management | enabled |
| `parent.attendance` | Attendance tracking | enabled |
| `parent.academics` | Academic monitoring | enabled |
| `parent.fees` | Fee management | enabled |
| `parent.communication` | Teacher messaging | enabled |
| `parent.ai_insights` | AI predictions | disabled |
| `parent.reports` | Automated reports | enabled |
| `parent.notifications` | Push notifications | enabled |

---

## 6. NAVIGATION STRUCTURE

### 6.1 Tab Configuration

Parents have 4 tabs in current implementation. Configuration in `navigation_tabs`:

**CURRENT CONFIGURATION (in DB):**
| Tab ID | Label | Icon | Root Screen | Order | Badge |
|--------|-------|------|-------------|-------|-------|
| `home` | Home | `home` | `parent-home` | 1 | none |
| `progress` | Progress | `trending-up` | `child-progress-screen` | 2 | none |
| `schedule` | Schedule | `calendar` | `schedule-screen` | 3 | none |
| `profile` | Profile | `person` | `profile-home` | 4 | none |

**TARGET CONFIGURATION (expand to 5 tabs):**
| Tab ID | Label | Icon | Root Screen | Order | Badge |
|--------|-------|------|-------------|-------|-------|
| `home` | Home | `home` | `parent-home` | 1 | dot |
| `children` | Children | `people` | `children-overview` | 2 | none |
| `academics` | Academics | `school` | `academic-home` | 3 | count |
| `fees` | Fees | `wallet` | `fee-management` | 4 | count |
| `profile` | Me | `person` | `profile-home` | 5 | none |

### 6.2 Screen-to-Tab Mapping

**Current Implementation:**
```
home tab:
  ├── parent-home (root)
  └── (notifications, settings - to add)

progress tab:
  ├── child-progress-screen (root)
  └── (child-detail, attendance - to add)

schedule tab:
  └── schedule-screen (root) - shared with student/teacher

profile tab:
  └── profile-home (root) - shared with all roles
```

**Target Implementation:**
```
home tab:
  ├── parent-home (root)
  ├── notifications-parent
  ├── ai-insights
  └── settings-parent

children tab:
  ├── children-overview (root)
  ├── child-detail
  ├── child-progress
  ├── child-attendance
  └── child-behavior

academics tab:
  ├── academic-home (root)
  ├── assignments-view
  ├── tests-view
  ├── report-card
  ├── subject-detail
  └── analytics-home

fees tab:
  ├── fee-management (root)
  ├── payment-history
  ├── make-payment
  └── receipts

profile tab:
  ├── profile-home (root)
  ├── edit-profile
  ├── communication-hub
  ├── settings-parent
  └── help-support
```

---

## 7. SCREENS SPECIFICATION

### 7.1 Dynamic Screens - Full Customization (6 Screens)

| Screen ID | Name | Type | Default Widgets | Customization |
|-----------|------|------|-----------------|---------------|
| `parent-home` | Parent Dashboard | dashboard | children-overview, attendance-summary, fee-alerts, notifications-preview, ai-insights-preview | 🟢 Full |
| `children-overview` | Children Overview | hub | children-cards, quick-stats, recent-activity | 🟢 Full |j
| `academic-home` | Academic Home | dashboard | performance-summary, assignments-pending, tests-upcoming, weak-areas | 🟢 Full |
| `communication-hub` | Communication Hub | hub | messages-inbox, announcements, teacher-contacts | 🟢 Full |
| `fee-management` | Fee Management | dashboard | fee-summary, pending-fees, payment-history-preview | 🟢 Full |
| `analytics-home` | Analytics Dashboard | dashboard | performance-chart, comparison-analytics, recommendations | 🟢 Full |

### 7.2 Dynamic Screens - Medium Customization (6 Screens)

| Screen ID | Name | Type | Configurable Sections | Customization |
|-----------|------|------|----------------------|---------------|
| `child-detail` | Child Detail | detail | profile_card, stats_grid, quick_actions, recent_activity | 🟡 Medium |
| `attendance-view` | Attendance View | list | calendar_view, summary_stats, attendance_list | 🟡 Medium |
| `notifications-parent` | Notifications | list | category_filters, notification_list, time_groups | 🟡 Medium |
| `ai-insights` | AI Insights | dashboard | predictions, recommendations, alerts | 🟡 Medium |
| `settings-parent` | Settings | form | account, notifications, children, about | 🟡 Medium |
| `profile-parent` | Profile | hub | profile_card, linked_children, quick_links | 🟡 Medium |

### 7.3 Fixed Screens (8 Screens)

| Screen ID | Name | Purpose | Reason Fixed |
|-----------|------|---------|--------------|
| `login-parent` | Login | Authentication | Security-critical auth flow |
| `signup-parent` | Signup | Registration | Security-critical auth flow |
| `splash` | Splash | App loading | System initialization |
| `onboarding-parent` | Onboarding | First-time setup | Sequential flow, child linking |
| `make-payment` | Make Payment | Payment flow | Payment gateway integration |
| `teacher-chat` | Teacher Chat | 1:1 messaging | Real-time messaging |
| `report-viewer` | Report Viewer | View PDF reports | Full-screen document viewer |
| `legal` | Legal | Legal docs | Legal requirement |

### 7.4 Detail/Child Screens (Not Directly Configurable)

| Parent Screen | Child Screens |
|---------------|---------------|
| Children Overview | `child-detail`, `add-child`, `child-settings` |
| Child Detail | `child-progress`, `child-attendance`, `child-behavior`, `child-doubts` |
| Academic Home | `assignments-view`, `tests-view`, `report-card`, `subject-detail` |
| Fee Management | `payment-history`, `make-payment`, `receipt-detail`, `fee-breakdown` |
| Communication Hub | `message-detail`, `teacher-profile`, `schedule-meeting` |
| AI Insights | `prediction-detail`, `recommendation-detail`, `alert-detail` |

---

## 8. WIDGETS SPECIFICATION

### 8.1 Widget Props (All Parent Widgets)

```typescript
type ParentWidgetProps = {
  // Identity
  customerId: string;
  userId: string;
  role: 'parent';
  
  // Parent-specific
  childrenIds: string[];           // Linked children
  selectedChildId?: string;        // Currently selected child (if applicable)
  
  // Configuration
  config: WidgetRuntimeConfig;
  branding?: CustomerBranding;
  theme?: ThemeConfig;
  size?: WidgetSize;
  
  // Navigation
  onNavigate: (route: string, params?: Record<string, unknown>) => void;
  onSelectChild?: (childId: string) => void;
};
```

### 8.2 Dashboard Widgets (Tier 1 - High Priority)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `parent.children-overview` | Children Overview | children | Cards for each child with quick stats |
| `parent.attendance-summary` | Attendance Summary | attendance | Today's attendance status for all children |
| `parent.fee-alerts` | Fee Alerts | fees | Pending fees with due dates |
| `parent.notifications-preview` | Notifications Preview | notifications | Recent notifications |
| `parent.ai-insights-preview` | AI Insights Preview | ai | Key predictions and alerts |
| `parent.quick-actions` | Quick Actions | actions | Pay fees, Message teacher, View reports |

### 8.3 Child Monitoring Widgets (Tier 1)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `parent.child-progress` | Child Progress | progress | Selected child's overall progress |
| `parent.child-stats` | Child Stats Grid | stats | XP, streak, tests, assignments |
| `parent.recent-activity` | Recent Activity | activity | Child's recent learning activities |
| `parent.weak-areas` | Weak Areas | progress | Topics needing attention |
| `parent.performance-chart` | Performance Chart | analytics | 6-month performance trend |

### 8.4 Academic Widgets (Tier 2)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `parent.assignments-pending` | Pending Assignments | academics | Child's pending assignments |
| `parent.tests-upcoming` | Upcoming Tests | academics | Scheduled tests |
| `parent.tests-results` | Test Results | academics | Recent test scores |
| `parent.subject-progress` | Subject Progress | academics | Per-subject progress bars |
| `parent.report-card-preview` | Report Card Preview | academics | Latest grades summary |

### 8.5 Communication Widgets (Tier 2)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `parent.messages-inbox` | Messages Inbox | communication | Recent messages from teachers |
| `parent.announcements` | Announcements | communication | School announcements |
| `parent.teacher-contacts` | Teacher Contacts | communication | Quick contact list |

### 8.6 Financial Widgets (Tier 2)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `parent.fee-summary` | Fee Summary | fees | Total due, paid, pending |
| `parent.pending-fees` | Pending Fees List | fees | List of pending fee items |
| `parent.payment-history` | Payment History | fees | Recent payments |

### 8.7 AI-Powered Widgets (Tier 3 - Premium)

| Widget ID | Name | Category | Description |
|-----------|------|----------|-------------|
| `parent.ai-predictions` | Performance Predictions | ai | Exam score forecasts |
| `parent.ai-recommendations` | AI Recommendations | ai | Personalized suggestions |
| `parent.ai-alerts` | Predictive Alerts | ai | Early warning system |
| `parent.comparison-analytics` | Comparison Analytics | ai | Peer benchmarking (anonymized) |

---

## 9. WIDGET PROPERTIES SCHEMA

### 9.1 Children Overview (`parent.children-overview`)

```typescript
type ChildrenOverviewConfig = {
  // Display
  layoutStyle: "cards" | "list" | "grid";     // default: "cards"
  showAvatar: boolean;                         // default: true
  showClass: boolean;                          // default: true
  showAttendanceToday: boolean;                // default: true
  showQuickStats: boolean;                     // default: true
  
  // Stats to show per child
  statsToShow: ("attendance" | "assignments" | "tests" | "streak" | "xp")[];
  
  // Actions
  enableTap: boolean;                          // default: true
  showViewAll: boolean;                        // default: false (if >3 children)
};
```

### 9.2 Attendance Summary (`parent.attendance-summary`)

```typescript
type AttendanceSummaryConfig = {
  // Display
  showTodayStatus: boolean;                    // default: true
  showWeekSummary: boolean;                    // default: true
  showMonthPercentage: boolean;                // default: true
  showCalendarPreview: boolean;                // default: false
  
  // Layout
  layoutStyle: "compact" | "detailed";         // default: "compact"
  
  // Per-child or aggregate
  viewMode: "per-child" | "aggregate";         // default: "per-child"
  
  // Actions
  enableTap: boolean;                          // default: true
  showViewDetails: boolean;                    // default: true
};
```

### 9.3 Fee Alerts (`parent.fee-alerts`)

```typescript
type FeeAlertsConfig = {
  // Display
  maxItems: number;                            // default: 3
  showDueDate: boolean;                        // default: true
  showAmount: boolean;                         // default: true
  showUrgencyBadge: boolean;                   // default: true
  showChildName: boolean;                      // default: true (if multi-child)
  
  // Filtering
  showOverdueOnly: boolean;                    // default: false
  daysAheadToShow: number;                     // default: 30
  
  // Actions
  showPayNowButton: boolean;                   // default: true
  enableTap: boolean;                          // default: true
};
```

### 9.4 Child Progress (`parent.child-progress`)

```typescript
type ChildProgressConfig = {
  // Display
  showOverallPercentage: boolean;              // default: true
  showSubjectBreakdown: boolean;               // default: true
  maxSubjects: number;                         // default: 5
  showTrend: boolean;                          // default: true
  showComparisonToClass: boolean;              // default: false (premium)
  
  // Chart
  chartType: "bar" | "radar" | "progress-bars"; // default: "progress-bars"
  
  // Actions
  enableTap: boolean;                          // default: true
  showViewDetails: boolean;                    // default: true
};
```

### 9.5 AI Insights Preview (`parent.ai-insights-preview`)

```typescript
type AIInsightsPreviewConfig = {
  // Display
  maxInsights: number;                         // default: 3
  showPredictions: boolean;                    // default: true
  showRecommendations: boolean;                // default: true
  showAlerts: boolean;                         // default: true
  
  // Priority
  priorityFilter: "all" | "high" | "critical"; // default: "all"
  
  // Actions
  enableTap: boolean;                          // default: true
  showViewAll: boolean;                        // default: true
};
```

### 9.6 Quick Actions (`parent.quick-actions`)

```typescript
type ParentQuickActionsConfig = {
  // Layout
  columns: 2 | 3 | 4;                          // default: 3
  layoutStyle: "grid" | "list";                // default: "grid"
  showLabels: boolean;                         // default: true
  iconSize: "small" | "medium" | "large";      // default: "medium"
  
  // Actions to show
  showPayFees: boolean;                        // default: true
  showMessageTeacher: boolean;                 // default: true
  showViewReports: boolean;                    // default: true
  showViewAttendance: boolean;                 // default: true
  showScheduleMeeting: boolean;                // default: false
  showDownloadReports: boolean;                // default: false
  
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

### 9.7 Performance Chart (`parent.performance-chart`)

```typescript
type PerformanceChartConfig = {
  // Chart settings
  chartType: "line" | "bar" | "area";          // default: "line"
  timeRange: "3months" | "6months" | "1year";  // default: "6months"
  showDataPoints: boolean;                     // default: true
  showTrendLine: boolean;                      // default: true
  
  // Data
  metricToShow: "overall" | "tests" | "assignments"; // default: "overall"
  showMultipleChildren: boolean;               // default: false
  
  // Comparison
  showClassAverage: boolean;                   // default: false (premium)
  
  // Actions
  enableTap: boolean;                          // default: true
};
```

### 9.8 Messages Inbox (`parent.messages-inbox`)

```typescript
type MessagesInboxConfig = {
  // Display
  maxItems: number;                            // default: 5
  showUnreadBadge: boolean;                    // default: true
  showSenderAvatar: boolean;                   // default: true
  showPreview: boolean;                        // default: true
  showTimestamp: boolean;                      // default: true
  
  // Filtering
  filterBy: "all" | "unread" | "teachers" | "admin"; // default: "all"
  
  // Actions
  enableTap: boolean;                          // default: true
  showComposeButton: boolean;                  // default: true
  showViewAll: boolean;                        // default: true
};
```

---

## 10. API ENDPOINTS

### 10.1 Parent-Specific RPC Functions

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_parent_dashboard` | All dashboard data | `{parent_id}` | ParentDashboardData |
| `get_linked_children` | Get parent's children | `{parent_id}` | Child[] |
| `get_child_progress` | Child's progress | `{child_id}` | ChildProgress |
| `get_child_attendance` | Child's attendance | `{child_id, month?}` | AttendanceRecord[] |
| `get_child_assignments` | Child's assignments | `{child_id, status?}` | Assignment[] |
| `get_child_tests` | Child's test results | `{child_id}` | TestResult[] |
| `get_child_behavior` | Behavior reports | `{child_id}` | BehaviorReport[] |

### 10.2 Fee Management APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_fee_summary` | Fee overview | `{parent_id}` | FeeSummary |
| `get_pending_fees` | Pending fees | `{parent_id}` | FeeRecord[] |
| `get_payment_history` | Payment history | `{parent_id, limit?}` | Payment[] |
| `initiate_payment` | Start payment | `{fee_ids[], method}` | PaymentSession |
| `verify_payment` | Verify payment | `{payment_id, txn_id}` | PaymentResult |
| `get_fee_receipt` | Get receipt | `{payment_id}` | ReceiptData |

### 10.3 Communication APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_parent_messages` | Get messages | `{parent_id, filter?}` | Message[] |
| `send_message_to_teacher` | Send message | `{teacher_id, content}` | Message |
| `get_announcements` | Get announcements | `{customer_id}` | Announcement[] |
| `get_teacher_contacts` | Teacher list | `{child_id}` | Teacher[] |
| `schedule_meeting` | Schedule PTM | `{teacher_id, slot}` | Meeting |

### 10.4 AI Insights APIs (Premium)

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_ai_predictions` | Performance predictions | `{child_id}` | Prediction[] |
| `get_ai_recommendations` | Study recommendations | `{child_id}` | Recommendation[] |
| `get_ai_alerts` | Predictive alerts | `{parent_id}` | Alert[] |
| `get_comparison_analytics` | Peer comparison | `{child_id}` | ComparisonData |

### 10.5 Notification APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_parent_notifications` | Get notifications | `{parent_id, limit?}` | Notification[] |
| `mark_notification_read` | Mark as read | `{notification_id}` | void |
| `get_notification_preferences` | Get preferences | `{parent_id}` | Preferences |
| `update_notification_preferences` | Update prefs | `{parent_id, prefs}` | Preferences |

---

## 11. DATABASE SCHEMA

### 11.1 Core Parent Tables

#### `parent_children` (Already Created)
```sql
CREATE TABLE parent_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  parent_user_id TEXT NOT NULL,
  child_user_id TEXT NOT NULL,
  relationship TEXT DEFAULT 'parent' CHECK (relationship IN ('parent', 'guardian', 'other')),
  is_primary BOOLEAN DEFAULT true,
  can_view_progress BOOLEAN DEFAULT true,
  can_view_attendance BOOLEAN DEFAULT true,
  can_view_fees BOOLEAN DEFAULT true,
  can_communicate_teacher BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, parent_user_id, child_user_id)
);
```

#### `parent_notifications` (Already Created)
```sql
CREATE TABLE parent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  parent_user_id TEXT NOT NULL,
  child_user_id TEXT,
  notification_type TEXT NOT NULL CHECK (notification_type IN 
    ('attendance', 'grade', 'fee', 'announcement', 'progress', 'behavior', 'event')),
  title_en TEXT NOT NULL,
  title_hi TEXT,
  message_en TEXT,
  message_hi TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `fee_records` (Already Created)
```sql
CREATE TABLE fee_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_user_id TEXT NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN 
    ('tuition', 'exam', 'transport', 'library', 'lab', 'other')),
  title_en TEXT NOT NULL,
  title_hi TEXT,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  paid_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN 
    ('pending', 'partial', 'paid', 'overdue', 'waived')),
  payment_method TEXT,
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `attendance_records` (Already Created)
```sql
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_user_id TEXT NOT NULL,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN 
    ('present', 'absent', 'late', 'excused', 'half_day')),
  check_in_time TIME,
  check_out_time TIME,
  reason TEXT,
  marked_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, student_user_id, attendance_date)
);
```

### 11.2 Additional Tables to Create

#### `parent_teacher_messages`
```sql
CREATE TABLE parent_teacher_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  parent_user_id TEXT NOT NULL,
  teacher_user_id TEXT NOT NULL,
  child_user_id TEXT,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('parent', 'teacher')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `behavior_reports`
```sql
CREATE TABLE behavior_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_user_id TEXT NOT NULL,
  reported_by UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN 
    ('positive', 'concern', 'incident', 'achievement')),
  title_en TEXT NOT NULL,
  title_hi TEXT,
  description_en TEXT,
  description_hi TEXT,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  action_taken TEXT,
  parent_notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `ai_insights_parent`
```sql
CREATE TABLE ai_insights_parent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  child_user_id TEXT NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN 
    ('prediction', 'recommendation', 'alert', 'trend')),
  category TEXT NOT NULL CHECK (category IN 
    ('academic', 'attendance', 'behavior', 'engagement', 'career')),
  title_en TEXT NOT NULL,
  title_hi TEXT,
  description_en TEXT,
  description_hi TEXT,
  confidence_score DECIMAL(3,2),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  action_items JSONB DEFAULT '[]',
  valid_until TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `payment_transactions`
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  parent_user_id TEXT NOT NULL,
  fee_record_ids UUID[] NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN 
    ('upi', 'card', 'netbanking', 'wallet', 'cash', 'cheque')),
  gateway_txn_id TEXT,
  gateway_response JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN 
    ('pending', 'processing', 'success', 'failed', 'refunded')),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

---

## 12. SERVICES & HOOKS

### 12.1 Parent-Specific Hooks

| Hook | Purpose | Location |
|------|---------|----------|
| `useLinkedChildren` | Get parent's linked children | `src/hooks/queries/parent/useChildrenQuery.ts` |
| `useChildProgress` | Get child's progress | `src/hooks/queries/parent/useChildProgressQuery.ts` |
| `useChildAttendance` | Get child's attendance | `src/hooks/queries/parent/useChildAttendanceQuery.ts` |
| `useFeeStatus` | Get fee status | `src/hooks/queries/parent/useFeeStatusQuery.ts` |
| `useParentNotifications` | Get notifications | `src/hooks/queries/parent/useParentNotificationsQuery.ts` |
| `useParentMessages` | Get messages | `src/hooks/queries/parent/useParentMessagesQuery.ts` |
| `useAIInsights` | Get AI insights | `src/hooks/queries/parent/useAIInsightsQuery.ts` |
| `useBehaviorReports` | Get behavior reports | `src/hooks/queries/parent/useBehaviorReportsQuery.ts` |

### 12.2 Parent Mutations

| Hook | Purpose | Location |
|------|---------|----------|
| `useSendMessage` | Send message to teacher | `src/hooks/mutations/parent/useSendMessage.ts` |
| `useInitiatePayment` | Start payment | `src/hooks/mutations/parent/useInitiatePayment.ts` |
| `useMarkNotificationRead` | Mark notification read | `src/hooks/mutations/parent/useMarkNotificationRead.ts` |
| `useScheduleMeeting` | Schedule PTM | `src/hooks/mutations/parent/useScheduleMeeting.ts` |

### 12.3 Shared Hooks (Reused from Student)

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
// src/hooks/queries/parent/useChildrenQuery.ts
export function useLinkedChildren(parentId: string) {
  return useQuery({
    queryKey: ['parent-children', parentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parent_children')
        .select(`
          *,
          child:user_profiles!child_user_id(
            user_id, first_name, last_name, avatar_url, 
            class_name_en, class_name_hi, section
          )
        `)
        .eq('parent_user_id', parentId);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!parentId,
  });
}
```

---

## 13. IMPLEMENTATION CHECKLIST

### 13.1 Phase 1: Core Infrastructure (Week 1)

#### Database & Config
- [x] Create `parent_children` table
- [x] Create `parent_notifications` table
- [x] Create `fee_records` table
- [x] Create `attendance_records` table
- [ ] Create `parent_teacher_messages` table
- [ ] Create `behavior_reports` table
- [ ] Create `ai_insights_parent` table
- [ ] Create `payment_transactions` table
- [ ] Add parent navigation tabs to DB
- [ ] Add parent screen layouts to DB
- [ ] Add parent permissions to `role_permissions`

#### Folder Structure
- [x] Create `src/screens/parent/` folder
- [x] Create `src/components/widgets/parent/` folder
- [x] Create `src/hooks/queries/parent/` folder
- [ ] Create `src/hooks/mutations/parent/` folder
- [x] Create `src/locales/en/parent.json` (exists, needs content)
- [ ] Create `src/locales/hi/parent.json`

### 13.2 Phase 2: Core Queries & Hooks (Week 2)

- [x] `useChildrenQuery` - Fetch linked children
- [x] `useChildProgressQuery` - Child's academic progress
- [x] `useChildAttendanceQuery` - Attendance records
- [x] `useFeeStatusQuery` - Fee payment status
- [x] `useParentNotificationsQuery` - Parent notifications
- [ ] `useParentDashboard` - Aggregated dashboard data
- [ ] `useParentMessagesQuery` - Messages from teachers
- [ ] `useBehaviorReportsQuery` - Behavior reports

### 13.3 Phase 3: Dashboard Widgets (Week 3)

#### Tier 1 Widgets (Must Have)
- [x] `ChildrenOverviewWidget` - Children cards with stats
- [x] `AttendanceWidget` - Today's attendance
- [x] `FeeStatusWidget` - Pending fees
- [x] `ParentNotificationsWidget` - Recent notifications
- [ ] `QuickActionsWidget` - Quick action buttons

### 13.4 Phase 4: Child Monitoring (Week 4)

#### Child Detail Widgets
- [x] `ChildProgressWidget` - Progress overview
- [ ] `ChildStatsWidget` - Stats grid
- [ ] `RecentActivityWidget` - Activity feed
- [ ] `WeakAreasWidget` - Topics needing attention

#### Screens
- [x] `ChildrenListScreen` - List of children
- [x] `ChildDetailScreen` - Single child detail

### 13.5 Phase 5: Academic Features (Week 5)

#### Widgets
- [ ] `parent.assignments-pending` - Pending assignments
- [ ] `parent.tests-upcoming` - Upcoming tests
- [ ] `parent.tests-results` - Test results
- [ ] `parent.subject-progress` - Subject-wise progress
- [ ] `parent.performance-chart` - Performance trend

#### Screens
- [ ] `AcademicHomeScreen` - Academic dashboard
- [ ] `AssignmentsViewScreen` - Assignments list
- [ ] `TestsViewScreen` - Tests list
- [ ] `ReportCardScreen` - Report card view

### 13.6 Phase 6: Fee Management (Week 6)

#### Widgets
- [ ] `parent.fee-summary` - Fee overview
- [ ] `parent.pending-fees` - Pending fees list
- [ ] `parent.payment-history` - Payment history

#### Screens
- [ ] `FeeManagementScreen` - Fee dashboard
- [ ] `PaymentHistoryScreen` - Payment history
- [ ] `MakePaymentScreen` - Payment flow (Fixed)

#### Integration
- [ ] Razorpay payment gateway integration
- [ ] Receipt generation

### 13.7 Phase 7: Communication (Week 7)

#### Widgets
- [ ] `parent.messages-inbox` - Messages inbox
- [ ] `parent.announcements` - Announcements
- [ ] `parent.teacher-contacts` - Teacher contacts

#### Screens
- [ ] `CommunicationHubScreen` - Communication dashboard
- [ ] `TeacherChatScreen` - 1:1 chat (Fixed)
- [ ] `MessageDetailScreen` - Message detail

### 13.8 Phase 8: AI Insights (Week 8 - Premium)

#### Widgets
- [ ] `parent.ai-insights-preview` - Insights preview
- [ ] `parent.ai-predictions` - Predictions
- [ ] `parent.ai-recommendations` - Recommendations
- [ ] `parent.ai-alerts` - Alerts
- [ ] `parent.comparison-analytics` - Peer comparison

#### Screens
- [ ] `AIInsightsScreen` - AI dashboard
- [ ] `PredictionDetailScreen` - Prediction detail

### 13.9 Phase 9: Polish & Testing (Week 9-10)

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

### 14.1 Multi-Child Support

All parent screens must handle multiple children:

```typescript
// Child selector component
const ChildSelector: React.FC<{
  children: Child[];
  selectedId: string;
  onSelect: (id: string) => void;
}> = ({ children, selectedId, onSelect }) => {
  // Horizontal scroll of child avatars
  // "All Children" option for aggregate views
};

// Usage in widgets
const ChildProgressWidget: React.FC<ParentWidgetProps> = ({ 
  childrenIds, 
  selectedChildId 
}) => {
  // If selectedChildId is set, show that child
  // If "all", show aggregate or list view
};
```

### 14.2 Real-Time Updates

Parents should receive real-time updates for:
- Attendance marked
- New grades/test results
- Fee payment confirmations
- New messages from teachers
- Behavior reports

```typescript
// Supabase realtime subscription
useEffect(() => {
  const subscription = supabase
    .channel('parent-updates')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'attendance_records',
      filter: `student_user_id=in.(${childrenIds.join(',')})`,
    }, handleAttendanceUpdate)
    .subscribe();
    
  return () => subscription.unsubscribe();
}, [childrenIds]);
```

### 14.3 Notification Categories

| Category | Trigger | Priority |
|----------|---------|----------|
| `attendance` | Child marked absent/late | High |
| `grade` | New test result | Normal |
| `fee` | Fee due/overdue | High |
| `announcement` | School announcement | Normal |
| `progress` | Weekly progress report | Low |
| `behavior` | Behavior incident | High |
| `event` | Upcoming event/PTM | Normal |

### 14.4 Offline Support

| Feature | Offline Behavior |
|---------|------------------|
| Dashboard | ✅ Works (cached data) |
| Children List | ✅ Works (cached) |
| Attendance View | ✅ Works (cached) |
| Fee Status | ⚠️ Partial (cached, no payment) |
| Messages | ⚠️ Partial (cached, no send) |
| Payments | ❌ Online only |
| AI Insights | ❌ Online only |

### 14.5 Analytics Events

| Event | When |
|-------|------|
| `parent_screen_view` | Screen focused |
| `parent_child_selected` | Child switched |
| `parent_fee_payment_initiated` | Payment started |
| `parent_fee_payment_completed` | Payment success |
| `parent_message_sent` | Message sent |
| `parent_report_downloaded` | Report downloaded |

---

## 📊 SUMMARY STATISTICS

| Category | Total | Built | Remaining | Notes |
|----------|-------|-------|-----------|-------|
| **Dynamic Screens (Full)** | 6 | 1 | 5 | Widget-based, fully customizable |
| **Dynamic Screens (Medium)** | 6 | 2 | 4 | Section-based customization |
| **Fixed Screens** | 8 | 0 | 8 | Essential functionality only |
| **Total Screens** | 20 | 3 | 17 | + detail/child screens |
| **Widgets (Tier 1)** | 6 | 5 | 1 | Dashboard widgets |
| **Widgets (Tier 2)** | 14 | 0 | 14 | Academic, Comms, Financial |
| **Widgets (Tier 3)** | 4 | 0 | 4 | AI/Premium |
| **Total Widgets** | 24 | 5 | 19 | |
| **Query Hooks** | 8 | 5 | 3 | |
| **Mutation Hooks** | 4 | 0 | 4 | |
| **API Endpoints** | 25+ | - | - | RPC functions |
| **Database Tables** | 8 | 4 | 4 | |
| **Permissions** | 19 | 5 | 14 | |
| **Navigation Tabs** | 4 | 4 | 0 | Current config |

### Platform Studio Compatibility

| Feature | Status |
|---------|--------|
| Screen Builder | ✅ 12 screens configurable |
| Widget Properties | ✅ All widgets have config schema |
| Theme Editor | ✅ Full theme customization |
| Branding Editor | ✅ Full white-label support |
| Navigation Editor | ✅ Tab configuration |
| Realtime Updates | ✅ Config changes apply instantly |

### Comparison with Student App

| Metric | Student | Parent |
|--------|---------|--------|
| Dynamic Screens | 15 | 12 |
| Fixed Screens | 12 | 8 |
| Total Widgets | 28 | 24 |
| Unique Features | Learning, Tests, AI Tutor | Fee Payment, Child Monitoring, Teacher Communication |

---

## 📎 RELATED DOCUMENTS

- [STUDENT_COMPLETE_SPEC.md](./STUDENT_COMPLETE_SPEC.md) - Student role reference
- [Multi-Role Development Guide.md](./Multi-Role%20Development%20Guide.md) - Multi-role architecture
- [DB_SCHEMA_REFERENCE.md](./DB_SCHEMA_REFERENCE.md) - Database schema
- [WIDGET_DEVELOPMENT_GUIDE.md](./WIDGET_DEVELOPMENT_GUIDE.md) - Widget creation guide
- [PERMISSIONS_RBAC_SPEC.md](./PERMISSIONS_RBAC_SPEC.md) - Permission system

---

*Document created: December 2024*
*Last validated: December 11, 2024*
*Status: Validated & Aligned with Codebase*

### Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2024 | Initial specification |
| 1.1.0 | Dec 11, 2024 | Validated against codebase - added naming conventions, updated implementation status, fixed section numbers, aligned with Platform Studio registry |
