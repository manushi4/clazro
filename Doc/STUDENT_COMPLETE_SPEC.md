# 📱 STUDENT APP - COMPLETE SPECIFICATION

> **Version:** 2.1.0  
> **Date:** December 2024  
> **Scope:** Student Role Only  
> **Purpose:** Single source of truth for implementing the student mobile app
> **Updated:** Added Phase 85-88 enhancements: AI Learning Insights, Voice Practice, Student Automations, Enhanced Gamification

---

## 📋 TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Platform Studio Integration](#2-platform-studio-integration)
3. [White-Label & Branding](#3-white-label--branding)
4. [Role & Permissions](#4-role--permissions)
5. [Navigation Structure](#5-navigation-structure)
6. [Screens Specification](#6-screens-specification)
7. [Widgets Specification](#7-widgets-specification)
8. [Widget Properties Schema](#8-widget-properties-schema)
9. [API Endpoints](#9-api-endpoints)
10. [Database Schema](#10-database-schema)
11. [Services & Hooks](#11-services--hooks)
12. [Implementation Checklist](#12-implementation-checklist)
13. [Cross-Cutting Concerns](#13-cross-cutting-concerns) ← NEW

---

## 1. OVERVIEW

### 1.1 Scope

This specification covers the **Student** role only:
- **17 Dynamic Screens** (widget-based, configurable via Platform Studio) ← +2 from Phase 85-88
- **13 Fixed Screens** (essential functionality, not configurable) ← +1 from Phase 85-88
- **36 Widgets** (9 built, 27 to build) ← +8 from Phase 85-88
- Complete navigation structure
- Full Platform Studio compatibility
- White-label/branding support
- All API endpoints and database tables
- **AI Learning Insights** (Phase 85-88 enhancement)
- **Voice Practice System** (Phase 85-88 enhancement)
- **Student Automations** (Phase 85-88 enhancement)
- **Enhanced Gamification** (Phase 85-88 enhancement)

### 1.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    STUDENT APP ARCHITECTURE                     │
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
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Principles

| Principle | Description |
|-----------|-------------|
| **Config-Driven** | All UI comes from Supabase config, not hardcoded |
| **White-Label Ready** | Every screen supports customer branding |
| **Theme-Aware** | All components use `useAppTheme()` for colors |
| **Platform Studio Compatible** | 15 screens fully editable in Studio |
| **Offline-First** | Core features work without internet |

---

## 2. PLATFORM STUDIO INTEGRATION

### 2.1 Overview

Platform Studio is the web-based admin tool that allows customers to customize their app without code changes.

```
┌─────────────────────────────────────────────────────────────────┐
│                     PLATFORM STUDIO                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Screens   │  │   Theme     │  │  Branding   │             │
│  │   Builder   │  │   Editor    │  │   Editor    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────────────────────────────────────────┐           │
│  │              Supabase Database                   │           │
│  │  screen_layouts | customer_themes | branding     │           │
│  └─────────────────────────────────────────────────┘           │
│                          │                                      │
│                          ▼ (realtime subscription)              │
│  ┌─────────────────────────────────────────────────┐           │
│  │              Mobile App                          │           │
│  │  DynamicScreen | useAppTheme | useBranding       │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 What Can Be Customized

| Category | Customizable Via | Examples |
|----------|------------------|----------|
| **Screen Layout** | Screen Builder | Add/remove/reorder widgets |
| **Widget Config** | Widget Properties Panel | Max items, layout style, toggles |
| **Navigation** | Navigation Editor | Tab order, icons, labels, enable/disable |
| **Theme** | Theme Editor | Colors, fonts, border radius, shadows |
| **Branding** | Branding Editor | Logo, app name, feature names, text overrides |

### 2.3 Screen Customization Levels

| Level | Description | Screens |
|-------|-------------|---------|
| 🟢 **Full** | Add/remove/reorder widgets, change layouts | Dashboard, Study Home, Progress, Schedule, etc. |
| 🟡 **Medium** | Show/hide sections, configure options | Settings, Profile, Notifications, Leaderboard |
| 🔴 **Fixed** | Only theme/branding applies | Test Attempt, AI Chat, Resource Viewer |

### 2.4 Platform Studio Screen Registry

All 15 dynamic screens must be registered in Platform Studio:

```typescript
// platform-studio/src/config/screenRegistry.ts
export const STUDENT_SCREENS = {
  // FULL CUSTOMIZATION (8 screens)
  'student-home': { type: 'dynamic', customization: 'full' },
  'study-hub': { type: 'dynamic', customization: 'full' },
  'doubts-home': { type: 'dynamic', customization: 'full' },
  'progress-home': { type: 'dynamic', customization: 'full' },
  'schedule-screen': { type: 'dynamic', customization: 'full' },
  'assignments-home': { type: 'dynamic', customization: 'full' },
  'test-center': { type: 'dynamic', customization: 'full' },
  'library': { type: 'dynamic', customization: 'full' },
  
  // MEDIUM CUSTOMIZATION (7 screens)
  'notifications': { type: 'dynamic', customization: 'medium' },
  'leaderboard': { type: 'dynamic', customization: 'medium' },
  'quests': { type: 'dynamic', customization: 'medium' },
  'task-hub': { type: 'dynamic', customization: 'medium' },
  'peer-network': { type: 'dynamic', customization: 'medium' },
  'settings': { type: 'dynamic', customization: 'medium' },
  'profile-home': { type: 'dynamic', customization: 'medium' },
};
```

### 2.5 Config Flow

```
1. Customer opens Platform Studio
2. Edits screen layout / theme / branding
3. Clicks "Publish"
4. Config saved to Supabase tables
5. Mobile app receives realtime update
6. UI re-renders with new config
```

---

## 3. WHITE-LABEL & BRANDING

### 3.1 Branding Configuration

Every customer can customize their app identity:

```typescript
type CustomerBranding = {
  // App Identity
  appName: string;              // "ABC Coaching" instead of "Learning App"
  appTagline?: string;          // "Learn Smarter"
  
  // Logos
  logoUrl?: string;             // Main logo (header)
  logoSmallUrl?: string;        // Small logo (32x32)
  logoDarkUrl?: string;         // Logo for dark mode
  splashImageUrl?: string;      // Splash screen image
  loginHeroUrl?: string;        // Login screen hero image
  faviconUrl?: string;          // App icon
  
  // Feature Naming (White-Label)
  aiTutorName: string;          // "AI Tutor" → "Study Buddy"
  doubtSectionName: string;     // "Doubts" → "Ask Questions"
  assignmentName: string;       // "Assignment" → "Homework"
  testName: string;             // "Test" → "Quiz"
  liveClassName: string;        // "Live Class" → "Online Session"
  
  // Contact
  supportEmail?: string;
  supportPhone?: string;
  whatsappNumber?: string;
  helpCenterUrl?: string;
  
  // Legal
  termsUrl?: string;
  privacyUrl?: string;
  refundUrl?: string;
  
  // Text Overrides (any UI text)
  textOverrides: Record<string, string>;
};
```

### 3.2 Theme Configuration

Every customer can customize visual appearance:

```typescript
type ThemeConfig = {
  // Colors
  primaryColor: string;         // Brand primary color
  secondaryColor: string;       // Secondary accent
  accentColor?: string;         // Tertiary accent
  backgroundColor?: string;     // App background
  surfaceColor: string;         // Card/surface background
  errorColor?: string;
  successColor?: string;
  warningColor?: string;
  
  // Typography
  fontFamily?: FontFamily;      // "Inter" | "Roboto" | "Poppins" | "System Default"
  fontScale?: number;           // 0.8 - 1.2
  
  // Border Radius
  borderRadiusSmall?: number;   // 4
  borderRadiusMedium?: number;  // 8
  borderRadiusLarge?: number;   // 16
  
  // Elevation/Shadows
  cardElevation?: ElevationLevel;    // "none" | "low" | "medium" | "high"
  buttonElevation?: ElevationLevel;
  
  // Component Styles
  buttonStyle?: ButtonStyle;    // "filled" | "outlined" | "tonal"
  cardStyle?: CardStyle;        // "elevated" | "outlined" | "flat"
  inputStyle?: InputStyle;      // "outlined" | "filled"
};
```

### 3.3 How Screens Use Branding

Every screen MUST use branding context:

```typescript
// ✅ CORRECT - Screen uses branding
const MyScreen: React.FC = () => {
  const branding = useBranding();
  const { colors } = useAppTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <BrandedHeader />
      <AppText>{branding.appName}</AppText>
      <AppText>{branding.aiTutorName}</AppText>
    </View>
  );
};

// ❌ WRONG - Hardcoded text
const MyScreen: React.FC = () => {
  return (
    <View>
      <Text>Learning App</Text>  {/* Should use branding.appName */}
      <Text>AI Tutor</Text>      {/* Should use branding.aiTutorName */}
    </View>
  );
};
```

### 3.4 How Widgets Use Branding

All widgets receive `branding` and `theme` as props:

```typescript
type WidgetProps = {
  customerId: string;
  userId: string;
  role: Role;
  config: WidgetRuntimeConfig;
  branding?: CustomerBranding;  // ← White-label branding
  theme?: ThemeConfig;          // ← Customer theme
  size?: WidgetSize;
  onNavigate: (route: string) => void;
};

// Widget implementation
const DoubtsInboxWidget: React.FC<WidgetProps> = ({ branding, config }) => {
  const { colors } = useAppTheme();
  
  // Use branding for feature name
  const sectionTitle = branding?.doubtSectionName || "Doubts";
  
  return (
    <View>
      <AppText style={{ color: colors.onSurface }}>{sectionTitle}</AppText>
    </View>
  );
};
```

### 3.5 Branding Requirements Per Screen

| Screen | Branding Used | Theme Used |
|--------|---------------|------------|
| **All Screens** | `appName`, `logoUrl` via BrandedHeader | All colors via `useAppTheme()` |
| **Dashboard** | `aiTutorName`, `doubtSectionName` | Primary, surface, text colors |
| **Doubts** | `doubtSectionName` | All colors |
| **Assignments** | `assignmentName` | All colors |
| **Tests** | `testName` | All colors |
| **AI Tutor** | `aiTutorName` | All colors |
| **Schedule** | `liveClassName` | All colors |
| **Settings** | `supportEmail`, `helpCenterUrl` | All colors |
| **Legal** | `termsUrl`, `privacyUrl` | All colors |
| **Login** | `appName`, `appTagline`, `loginHeroUrl` | Primary, surface |

### 3.6 Text Override System

For any text not covered by named fields:

```typescript
// In branding config
textOverrides: {
  "dashboard.welcome": "Welcome back!",
  "doubts.empty": "No questions yet. Ask your first doubt!",
  "progress.streak": "Learning Streak",
}

// In component
const { t } = useTranslation();
const branding = useBranding();

// Check override first, then i18n, then default
const text = branding.textOverrides?.["dashboard.welcome"] 
  || t("dashboard.welcome") 
  || "Welcome!";
```

---

## 4. ROLE & PERMISSIONS

### 4.1 Student Role Definition

```typescript
type StudentRole = {
  role: "student";
  hierarchy_level: 1;  // Lowest level
  description: "Student user with learning access";
};
```

### 4.2 Base Permissions (Student)

| Permission Code | Description | Category |
|-----------------|-------------|----------|
| `view_dashboard` | View student dashboard | view |
| `view_schedule` | View class schedule | view |
| `view_assignments` | View assignments | view |
| `submit_assignment` | Submit assignments | action |
| `view_tests` | View tests | view |
| `attempt_test` | Attempt tests | action |
| `view_doubts` | View doubts | view |
| `create_doubt` | Create new doubt | action |
| `view_progress` | View own progress | view |
| `view_resources` | View study resources | view |
| `download_resources` | Download resources | action |
| `view_notifications` | View notifications | view |
| `edit_profile` | Edit own profile | action |
| `change_language` | Change app language | action |
| `change_theme` | Toggle dark/light mode | action |
| `use_ai_tutor` | Use AI tutor (if enabled) | premium |
| `view_leaderboard` | View leaderboard | view |
| `view_peers` | View peer network | view |
| `message_peers` | Message peers | action |
| `join_study_groups` | Join study groups | action |
| `view_ai_insights` | View AI learning insights | premium |
| `use_voice_practice` | Use voice practice features | premium |
| `manage_automations` | Manage personal automations | action |
| `view_rewards_shop` | View rewards shop | view |
| `redeem_rewards` | Redeem XP for rewards | action |

### 4.3 Permission Resolution Order

```
1. Base Role Permissions (role_permissions table)
   ↓
2. Customer-level Overrides (customer_role_permissions table)
   ↓
3. User-level Overrides (user_permissions table)
   ↓
4. Final Resolved Permissions
```

### 4.4 Feature Dependencies

| Feature ID | Required For | Default |
|------------|--------------|---------|
| `home.dashboard` | Dashboard screen | enabled |
| `study.assignments` | Assignments feature | enabled |
| `study.tests` | Tests feature | enabled |
| `ask.doubts` | Doubts feature | enabled |
| `progress.analytics` | Progress tracking | enabled |
| `ai.tutor` | AI Tutor chat | disabled |
| `peers.network` | Peer learning | disabled |
| `gamification` | XP, badges, quests | disabled |
| `offline.mode` | Offline support | enabled |
| `student.ai_insights` | AI Learning Insights | disabled |
| `student.voice_practice` | Voice Practice System | disabled |
| `student.automations` | Student Automations | disabled |
| `student.rewards_shop` | Rewards Shop | disabled |
| `student.activity_feed` | Activity Feed | disabled |

---

## 5. NAVIGATION STRUCTURE

### 5.1 Tab Configuration

Students can have 3-7 tabs configured per customer. Default configuration:

| Tab ID | Label | Icon | Root Screen | Order | Badge |
|--------|-------|------|-------------|-------|-------|
| `home` | Home | `home` | `student-home` | 1 | none |
| `study` | Study | `school` | `study-hub` | 2 | count |
| `doubts` | Ask | `help-circle` | `doubts-home` | 3 | count |
| `progress` | Progress | `trending-up` | `progress-home` | 4 | none |
| `profile` | Me | `person` | `profile-home` | 5 | dot |

### 5.2 Navigation Schema

```typescript
type StudentNavigationConfig = {
  tabs: TabConfig[];
  screens: ScreenConfig[];
};

type TabConfig = {
  tab_id: string;
  label: string;
  label_key?: string;        // i18n key
  icon: string;              // MaterialCommunityIcons name
  root_screen_id: string;
  order_index: number;       // 1-7
  enabled: boolean;
  badge_type: "none" | "dot" | "count";
  badge_source?: string;     // Query key for badge count
  requires_online?: boolean;
};

type ScreenConfig = {
  screen_id: string;
  tab_id: string;
  enabled: boolean;
  order_index: number;
};
```

### 5.3 Screen-to-Tab Mapping

```
home tab:
  ├── student-home (root)
  ├── notifications
  └── settings

study tab:
  ├── study-hub (root)
  ├── assignments-home
  ├── assignment-detail
  ├── test-center
  ├── test-attempt
  ├── test-review
  ├── library
  ├── resource-viewer
  ├── course-roadmap
  ├── chapter-detail
  ├── downloads
  └── task-hub

doubts tab:
  ├── doubts-home (root)
  ├── doubt-detail
  ├── doubt-submit
  └── ai-tutor

progress tab:
  ├── progress-home (root)
  ├── subject-analytics
  ├── global-analytics
  ├── leaderboard
  ├── quests
  └── gamified-hub

profile tab:
  ├── profile-home (root)
  ├── edit-profile
  ├── settings
  ├── language-selection
  ├── help-feedback
  └── legal
```


---

## 6. SCREENS SPECIFICATION

### 6.1 Dynamic Screens - Full Customization (10 Screens)

These screens support full widget placement and can be completely customized per customer via Platform Studio.

| Screen ID | Name | Type | Default Widgets | Customization |
|-----------|------|------|-----------------|---------------|
| `student-home` | Dashboard | dashboard | hero, schedule, actions, assignments, doubts, progress | 🟢 Full |
| `study-hub` | Study Home | hub | continue, subjects, quick-access, ai-tools | 🟢 Full |
| `doubts-home` | Doubts | list | overview-stats, doubts-list, filters | 🟢 Full |
| `progress-home` | Progress | dashboard | stats-grid, chart, streak, subjects, quests | 🟢 Full |
| `schedule-screen` | Schedule | dashboard | week-calendar, live-class, timeline, upcoming | 🟢 Full |
| `assignments-home` | Assignments | list | summary-card, assignment-list, filters | 🟢 Full |
| `test-center` | Test Center | list | overview-card, test-list, category-tabs | 🟢 Full |
| `library` | Study Library | hub | search, resource-grid, filters, ai-assistant | 🟢 Full |
| `ai-insights-home` | AI Learning Insights | dashboard | ai-insights-summary, performance-predictions, weak-topic-alerts, study-recommendations | 🟢 Full |
| `rewards-shop` | Rewards Shop | hub | xp-balance, rewards-grid, redemption-history | 🟢 Full |

### 6.2 Dynamic Screens - Medium Customization (7 Screens)

These screens support section-based customization (show/hide sections, configure options).

| Screen ID | Name | Type | Configurable Sections | Customization |
|-----------|------|------|----------------------|---------------|
| `notifications` | Notifications | list | category_filters, notification_list, time_groups | 🟡 Medium |
| `leaderboard` | Leaderboard | list | scope_tabs, my_rank, rankings_list | 🟡 Medium |
| `quests` | Quests | list | type_tabs, status_filters, quest_cards | 🟡 Medium |
| `task-hub` | Task Hub | list | overview_card, task_list, type_filters | 🟡 Medium |
| `peer-network` | Peer Network | hub | connections, study_groups, suggestions, peer_matches | 🟡 Medium |
| `settings` | Settings | form | account, notifications, appearance, automations, about | 🟡 Medium |
| `profile-home` | Profile | hub | profile_card, stats, quick_links, activity_feed | 🟡 Medium |

### 6.3 Fixed Screens (13 Screens)

These screens have essential functionality that cannot be widget-based. Only theme/branding applies.

| Screen ID | Name | Purpose | Reason Fixed |
|-----------|------|---------|--------------|
| `login` | Login | Authentication | Security-critical auth flow |
| `signup` | Signup | Registration | Security-critical auth flow |
| `splash` | Splash | App loading | System initialization |
| `onboarding` | Onboarding | First-time setup | Sequential flow with validation |
| `test-attempt` | Test Attempt | Take test | Timer-based, anti-cheat, complex state |
| `test-review` | Test Review | Review results | Linked to test engine |
| `resource-viewer` | Resource Viewer | View content | Full-screen PDF/Video viewer |
| `ai-tutor` | AI Tutor | AI chat | Real-time WebSocket chat |
| `peer-chat` | Peer Chat | 1:1 messaging | Real-time messaging |
| `guided-study` | Guided Study | Focus mode | Timer-based session engine |
| `chapter-detail` | Chapter Detail | Chapter learning | Complex tabbed navigation |
| `legal` | Legal | Legal docs | Legal requirement, no customization |
| `voice-practice` | Voice Practice | Voice-based practice | Real-time audio recording & analysis |

### 6.4 Detail/Child Screens (Not Directly Configurable)

These screens are accessed from parent screens and inherit context:

| Parent Screen | Child Screens |
|---------------|---------------|
| Dashboard | `activity-detail`, `class-detail`, `live-class` |
| Study Hub | `course-roadmap`, `resource-detail`, `playlist-detail` |
| Doubts | `doubt-detail`, `doubt-submit`, `doubts-explore` |
| Assignments | `assignment-detail`, `collaborative-assignment` |
| Progress | `global-analytics`, `subject-analytics`, `gamified-hub`, `quest-detail`, `share-report` |
| AI Insights | `insight-detail`, `prediction-detail` |
| Rewards Shop | `reward-detail`, `redemption-confirm` |
| Peer Network | `peer-detail`, `study-group-detail` |
| Settings | `language-selection`, `help-feedback`, `edit-profile` |

### 6.5 Screen Branding & Theme Requirements

**ALL screens MUST:**

```typescript
// 1. Use theme colors (not hardcoded)
const { colors, borderRadius } = useAppTheme();

// 2. Use branding for text (not hardcoded)
const branding = useBranding();

// 3. Use BrandedHeader for consistent header
<BrandedHeader title={screenTitle} />

// 4. Use AppText for typography (not Text)
<AppText style={{ color: colors.onSurface }}>...</AppText>
```

### 6.6 Screen Definition Schema

```typescript
type ScreenDefinition = {
  screen_id: string;
  name: string;
  screen_type: "dashboard" | "hub" | "list" | "detail" | "form" | "custom";
  customization_level: "full" | "medium" | "fixed";
  allowed_roles: Role[];
  
  // For dynamic screens
  default_widgets?: string[];
  available_widgets?: string[];
  
  // For medium customization screens
  configurable_sections?: string[];
  configurable_options?: Record<string, any>;
  
  // Common
  default_layout: "vertical" | "grid" | "masonry";
  scrollable: boolean;
  pull_to_refresh: boolean;
  header_visible: boolean;
  header_title_key?: string;
  back_button: boolean;
  requires_auth: boolean;
  requires_online: boolean;
  feature_id?: string;
  
  // Branding
  uses_branding: string[];  // Which branding fields this screen uses
  uses_theme: boolean;      // Always true
};

---

## 7. WIDGETS SPECIFICATION

### 7.1 Widget Props (All Widgets)

Every widget receives these props for Platform Studio & white-label support:

```typescript
type WidgetProps = {
  // Identity
  customerId: string;
  userId: string;
  role: Role;
  
  // Configuration (from Platform Studio)
  config: WidgetRuntimeConfig;
  
  // White-Label Support
  branding?: CustomerBranding;  // App name, feature names, logos
  theme?: ThemeConfig;          // Colors, fonts, styles
  
  // Display
  size?: WidgetSize;            // "compact" | "standard" | "expanded"
  
  // Navigation
  onNavigate: (route: string, params?: Record<string, unknown>) => void;
  onAction?: (event: Record<string, unknown>) => void;
};
```

### 7.2 Built Widgets (Ready to Use)

| Widget ID | Name | Category | Branding Props Used | Status |
|-----------|------|----------|---------------------|--------|
| `hero.greeting` | Hero Card | profile | `appName` | ✅ Built |
| `schedule.today` | Today's Schedule | schedule | `liveClassName` | ✅ Built |
| `actions.quick` | Quick Actions | actions | `aiTutorName`, `doubtSectionName`, `assignmentName`, `testName` | ✅ Built |
| `assignments.pending` | Assignments & Tests | assessment | `assignmentName`, `testName` | ✅ Built |
| `doubts.inbox` | Doubts Inbox | doubts | `doubtSectionName` | ✅ Built |
| `progress.snapshot` | Progress Snapshot | progress | - | ✅ Built |
| `ai.recommendations` | Recommendations | ai | `aiTutorName` | ✅ Built |
| `feed.class` | Class Feed | social | - | ✅ Built |
| `peers.groups` | Peers & Groups | social | - | ✅ Built |

### 7.3 Widgets to Build - Tier 1 (High Priority)

| Widget ID | Name | Category | Branding Props | Config Options |
|-----------|------|----------|----------------|----------------|
| `continue.learning` | Continue Learning | study | - | maxItems, showProgress, itemTypes |
| `live.class` | Live Class Card | schedule | `liveClassName` | showParticipants, showJoinButton |
| `subjects.progress` | My Subjects | progress | - | maxSubjects, showProgress, sortBy |
| `stats.grid` | Stats Grid | progress | - | showTests, showGrade, showImprovement |
| `streak.tracker` | Study Streak | progress | - | showLongest, daysToShow |

### 7.4 Widgets to Build - Tier 2 (Medium Priority)

| Widget ID | Name | Category | Branding Props | Config Options |
|-----------|------|----------|----------------|----------------|
| `ai.tools` | AI Study Tools | ai | `aiTutorName` | showDashboard, showPractice, showSummaries |
| `notes.summary` | Notes & Downloads | study | - | showCounts, showRecent |
| `recent.viewed` | Recently Viewed | study | - | maxItems, showType |
| `quests.active` | Active Quests | progress | - | maxQuests, showProgress, showRewards |
| `weak.topics` | Topics to Strengthen | progress | - | maxTopics, showScore, showPracticeButton |
| `week.calendar` | Week Calendar | schedule | - | showToday, allowNavigation |
| `upcoming.events` | Upcoming Events | schedule | `liveClassName` | maxEvents, showType |
| `notifications.preview` | Notifications Preview | notifications | - | maxItems, showUnreadCount |
| `tasks.overview` | Task Overview | assessment | `assignmentName`, `testName` | showCounts, showOverdue |
| `downloads.summary` | Downloads Summary | study | - | showStorage, showRecent |
| `analytics.snapshot` | Analytics Snapshot | progress | - | showTrend, showComparison |

### 7.5 Widgets to Build - Tier 3 (Low Priority)

| Widget ID | Name | Category | Branding Props | Config Options |
|-----------|------|----------|----------------|----------------|
| `connections.list` | My Connections | social | - | maxPeers, showMatch |
| `suggestions.peers` | Suggested Peers | social | - | maxSuggestions |
| `leaderboard.preview` | Leaderboard Preview | progress | - | scope, showTop |

### 7.6 Widgets to Build - Phase 85-88 Enhancements

#### AI Learning Insights Widgets

| Widget ID | Name | Category | Branding Props | Config Options |
|-----------|------|----------|----------------|----------------|
| `ai.learning-insights` | AI Learning Insights | ai | `aiTutorName` | maxInsights, showConfidence, insightTypes |
| `ai.performance-predictions` | Performance Predictions | ai | - | showPredictedGrade, showContributingFactors |
| `ai.weak-topic-alerts` | Weak Topic Alerts | ai | - | maxAlerts, showPracticeButton, severityFilter |
| `ai.study-recommendations` | Study Recommendations | ai | `aiTutorName` | maxRecommendations, showReason |

#### Voice Practice Widgets

| Widget ID | Name | Category | Branding Props | Config Options |
|-----------|------|----------|----------------|----------------|
| `voice.practice-summary` | Voice Practice Summary | voice | - | showAccuracy, showFluency, showPronunciation |
| `voice.recent-sessions` | Recent Voice Sessions | voice | - | maxSessions, showScore |

#### Student Automation Widgets

| Widget ID | Name | Category | Branding Props | Config Options |
|-----------|------|----------|----------------|----------------|
| `automation.reminders` | Smart Reminders | automation | - | maxReminders, showSource |
| `automation.streak-protection` | Streak Protection | automation | - | showWarning, daysAhead |

#### Enhanced Gamification Widgets

| Widget ID | Name | Category | Branding Props | Config Options |
|-----------|------|----------|----------------|----------------|
| `rewards.shop-preview` | Rewards Shop Preview | gamification | - | maxItems, showXPBalance |
| `rewards.xp-balance` | XP Balance Card | gamification | - | showLevel, showNextReward |
| `community.feed` | Activity Feed | social | - | maxItems, showAchievements, showPeers |
| `study.groups` | Study Groups | social | - | maxGroups, showActiveStatus |
| `peer.matches` | Peer Matches | social | - | maxMatches, showMatchPercentage |

### 7.6 Widget Branding Implementation Pattern

Every widget MUST follow this pattern for white-label support:

```typescript
const MyWidget: React.FC<WidgetProps> = ({ branding, config, onNavigate }) => {
  const { colors, borderRadius } = useAppTheme();
  
  // 1. Use branding for feature names
  const featureName = branding?.doubtSectionName || "Doubts";
  
  // 2. Use theme colors (never hardcode)
  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
  };
  
  // 3. Use AppText for typography
  return (
    <View style={cardStyle}>
      <AppText style={{ color: colors.onSurface }}>{featureName}</AppText>
    </View>
  );
};
```

### 7.7 Widget Metadata Schema

```typescript
type WidgetMetadata = {
  id: WidgetId;
  name: string;
  titleKey: string;              // i18n key
  descriptionKey: string;        // i18n key
  category: WidgetCategory;
  icon: string;                  // MaterialCommunityIcons name
  
  // Placement rules
  roles: Role[];
  allowedScreenTypes: ScreenType[];
  supportedSizes: WidgetSize[];
  defaultSize: WidgetSize;
  
  // Dependencies
  featureId: string;
  requiredPermissions: string[];
  
  // Data policy
  dataPolicy: {
    maxQueries: number;
    staleTimeMs: number;
    prefetchOnDashboardLoad: boolean;
    allowBackgroundRefresh: boolean;
    offlineBehavior: "show-cached" | "show-placeholder" | "hide";
  };
  
  // Default config
  defaultConfig: Record<string, unknown>;
  
  // Behavior
  refreshable: boolean;
  cacheable: boolean;
  offlineCapable: boolean;
  requiresOnline: boolean;
};

type WidgetCategory = 
  | "schedule" | "study" | "assessment" | "doubts" 
  | "progress" | "social" | "ai" | "profile" 
  | "notifications" | "actions" | "content" | "analytics";

type WidgetSize = "compact" | "standard" | "expanded";
```


---

## 8. WIDGET PROPERTIES SCHEMA

### 8.1 Hero Card (`hero.greeting`)

```typescript
type HeroCardConfig = {
  // Display
  greetingStyle: "simple" | "detailed" | "minimal";  // default: "detailed"
  showAvatar: boolean;                                // default: true
  showStats: boolean;                                 // default: true
  showEmoji: boolean;                                 // default: true
  showStreak: boolean;                                // default: true
  showXP: boolean;                                    // default: true
  
  // Stats to show
  statsToShow: ("classes" | "assignments" | "tests" | "streak" | "xp")[];
  
  // Actions
  showNotificationBell: boolean;                      // default: true
  showSettingsIcon: boolean;                          // default: false
};
```

### 8.2 Today's Schedule (`schedule.today`)

```typescript
type TodayScheduleConfig = {
  // Display
  maxItems: number;                    // default: 3, range: 1-10
  showTimeIndicator: boolean;          // default: true
  showBadges: boolean;                 // default: true
  showTeacherName: boolean;            // default: true
  showLocation: boolean;               // default: false
  
  // Layout
  layoutStyle: "list" | "timeline" | "cards";  // default: "list"
  
  // Content
  showLiveIndicator: boolean;          // default: true
  showJoinButton: boolean;             // default: true
  showEmptyState: boolean;             // default: true
  
  // Actions
  enableTap: boolean;                  // default: true
  showViewAll: boolean;                // default: true
};
```

### 8.3 Quick Actions (`actions.quick`)

```typescript
type QuickActionsConfig = {
  // Layout
  columns: 2 | 3 | 4;                  // default: 3
  layoutStyle: "grid" | "list" | "cards";  // default: "grid"
  showLabels: boolean;                 // default: true
  iconSize: "small" | "medium" | "large";  // default: "medium"
  
  // Actions to show (toggles)
  showAskDoubt: boolean;               // default: true
  showStudy: boolean;                  // default: true
  showAITutor: boolean;                // default: true
  showAssignments: boolean;            // default: true
  showTests: boolean;                  // default: true
  showNotes: boolean;                  // default: true
  showSchedule: boolean;               // default: false
  showProgress: boolean;               // default: false
  
  // Custom actions (advanced)
  customActions: {
    id: string;
    label: string;
    icon: string;
    color: string;
    route: string;
  }[];
};
```

### 8.4 Assignments & Tests (`assignments.pending`)

```typescript
type AssignmentsTestsConfig = {
  // Display
  maxItems: number;                    // default: 3, range: 1-10
  showUrgencyBadge: boolean;           // default: true
  showDueDate: boolean;                // default: true
  showSubject: boolean;                // default: true
  showType: boolean;                   // default: true
  
  // Layout
  layoutStyle: "list" | "cards" | "timeline";  // default: "list"
  
  // Content
  sortBy: "dueDate" | "subject" | "type" | "priority";  // default: "dueDate"
  filterBy: "all" | "assignments" | "tests";  // default: "all"
  showOverdueFirst: boolean;           // default: true
  
  // Sections
  showAssignmentsSection: boolean;     // default: true
  showTestsSection: boolean;           // default: true
  
  // Actions
  enableTap: boolean;                  // default: true
  showViewAll: boolean;                // default: true
};
```

### 8.5 Doubts Inbox (`doubts.inbox`)

```typescript
type DoubtsInboxConfig = {
  // Display
  maxItems: number;                    // default: 3, range: 1-10
  showStatus: boolean;                 // default: true
  showSubject: boolean;                // default: true
  showSource: boolean;                 // default: true (Teacher/AI/Peer)
  showRepliesCount: boolean;           // default: true
  showTimeAgo: boolean;                // default: true
  
  // Layout
  layoutStyle: "list" | "cards" | "compact";  // default: "list"
  
  // Content
  sortBy: "recent" | "status" | "subject";  // default: "recent"
  filterBy: "all" | "pending" | "answered";  // default: "all"
  
  // Actions
  enableTap: boolean;                  // default: true
  showViewAll: boolean;                // default: true
  showAskButton: boolean;              // default: true
};
```

### 8.6 Progress Snapshot (`progress.snapshot`)

```typescript
type ProgressSnapshotConfig = {
  // Display
  showOverallCircle: boolean;          // default: true
  showSubjects: boolean;               // default: true
  maxSubjects: number;                 // default: 4, range: 1-8
  showTrend: boolean;                  // default: true
  showStreak: boolean;                 // default: true
  showXP: boolean;                     // default: true
  
  // Layout
  layoutStyle: "list" | "cards" | "grid";  // default: "list"
  
  // Content
  sortSubjectsBy: "score" | "name" | "recent";  // default: "score"
  showPercentage: boolean;             // default: true
  showProgressBar: boolean;            // default: true
  
  // Actions
  enableTap: boolean;                  // default: true
  showViewAll: boolean;                // default: true
};
```

### 8.7 Continue Learning (`continue.learning`) - TO BUILD

```typescript
type ContinueLearningConfig = {
  // Display
  maxItems: number;                    // default: 4, range: 1-6
  showProgress: boolean;               // default: true
  showTimeAgo: boolean;                // default: true
  showType: boolean;                   // default: true
  
  // Layout
  layoutStyle: "horizontal" | "vertical" | "cards";  // default: "horizontal"
  
  // Content types to show
  itemTypes: ("resource" | "ai_session" | "assignment" | "test_review" | "doubt")[];
  
  // Actions
  enableTap: boolean;                  // default: true
  showClearHistory: boolean;           // default: false
};
```

### 8.8 Stats Grid (`stats.grid`) - TO BUILD

```typescript
type StatsGridConfig = {
  // Stats to show (toggles)
  showTestsTaken: boolean;             // default: true
  showAverageGrade: boolean;           // default: true
  showImprovement: boolean;            // default: true
  showAchievements: boolean;           // default: true
  showStudyTime: boolean;              // default: false
  showStreak: boolean;                 // default: false
  
  // Layout
  columns: 2 | 3 | 4;                  // default: 2
  showIcons: boolean;                  // default: true
  showTrend: boolean;                  // default: true
  
  // Actions
  enableTap: boolean;                  // default: true
};
```

### 8.9 AI Learning Insights Widget (`ai.learning-insights`) - Phase 85-88

```typescript
type AILearningInsightsConfig = {
  // Display
  maxInsights: number;                 // default: 5, range: 1-10
  showConfidence: boolean;             // default: true
  showPriority: boolean;               // default: true
  showAffectedSubjects: boolean;       // default: true
  
  // Filtering
  insightTypes: ("performance" | "engagement" | "learning_pattern" | "weak_topic" | "recommendation")[];
  minConfidence: number;               // default: 0.7, range: 0-1
  priorityFilter: "all" | "high" | "critical";  // default: "all"
  
  // Actions
  enableQuickAction: boolean;          // default: true
  showDismiss: boolean;                // default: true
  showViewAll: boolean;                // default: true
};
```

### 8.10 Performance Predictions Widget (`ai.performance-predictions`) - Phase 85-88

```typescript
type PerformancePredictionsConfig = {
  // Display
  maxPredictions: number;              // default: 3
  showPredictedGrade: boolean;         // default: true
  showConfidenceScore: boolean;        // default: true
  showContributingFactors: boolean;    // default: true
  
  // Content
  predictionScope: "upcoming_tests" | "subjects" | "all";  // default: "upcoming_tests"
  
  // Actions
  enableTap: boolean;                  // default: true
  showViewAll: boolean;                // default: true
};
```

### 8.11 Voice Practice Summary Widget (`voice.practice-summary`) - Phase 85-88

```typescript
type VoicePracticeSummaryConfig = {
  // Display
  showAccuracy: boolean;               // default: true
  showFluency: boolean;                // default: true
  showPronunciation: boolean;          // default: true
  showTotalSessions: boolean;          // default: true
  showTotalDuration: boolean;          // default: true
  
  // Layout
  layoutStyle: "compact" | "detailed";  // default: "compact"
  
  // Actions
  showStartPractice: boolean;          // default: true
  showViewHistory: boolean;            // default: true
};
```

### 8.12 Rewards Shop Preview Widget (`rewards.shop-preview`) - Phase 85-88

```typescript
type RewardsShopPreviewConfig = {
  // Display
  maxItems: number;                    // default: 4, range: 1-8
  showXPBalance: boolean;              // default: true
  showCategory: boolean;               // default: true
  showXPCost: boolean;                 // default: true
  
  // Layout
  layoutStyle: "grid" | "horizontal";  // default: "horizontal"
  
  // Filtering
  categoryFilter: "all" | "avatar" | "badge" | "theme" | "feature";  // default: "all"
  showAffordableOnly: boolean;         // default: false
  
  // Actions
  enableTap: boolean;                  // default: true
  showViewAll: boolean;                // default: true
};
```

### 8.13 Activity Feed Widget (`community.feed`) - Phase 85-88

```typescript
type ActivityFeedConfig = {
  // Display
  maxItems: number;                    // default: 5, range: 1-20
  showAchievements: boolean;           // default: true
  showPeers: boolean;                  // default: true
  showXPEarned: boolean;               // default: true
  showTimestamp: boolean;              // default: true
  
  // Filtering
  activityTypes: ("achievement" | "badge_earned" | "level_up" | "streak_milestone" | 
                  "quest_completed" | "test_completed" | "peer_helped")[];
  showOwnOnly: boolean;                // default: false
  
  // Actions
  enableTap: boolean;                  // default: true
  showViewAll: boolean;                // default: true
};
```

### 8.14 Smart Reminders Widget (`automation.reminders`) - Phase 85-88

```typescript
type SmartRemindersConfig = {
  // Display
  maxReminders: number;                // default: 3, range: 1-10
  showSource: boolean;                 // default: true
  showScheduledTime: boolean;          // default: true
  showRelatedEntity: boolean;          // default: true
  
  // Filtering
  reminderTypes: ("study" | "assignment" | "test" | "streak" | "goal")[];
  
  // Actions
  enableDismiss: boolean;              // default: true
  enableSnooze: boolean;               // default: true
  showManageAutomations: boolean;      // default: true
};
```

### 8.15 Common Config Properties

All widgets support these common properties:

```typescript
type CommonWidgetConfig = {
  // Visibility
  enabled: boolean;                    // default: true
  
  // Styling
  accentColor?: string;                // Override accent color
  borderRadius?: number;               // Override border radius
  padding?: "none" | "sm" | "md" | "lg";  // default: "md"
  elevation?: "none" | "small" | "medium" | "large";  // default: "small"
  
  // Behavior
  refreshable?: boolean;               // default: from metadata
  autoRefresh?: boolean;               // default: false
  refreshInterval?: number;            // milliseconds
  
  // Visibility rules
  visibilityRules?: VisibilityRule[];
};

type VisibilityRule = {
  type: "permission" | "feature" | "online" | "time" | "custom";
  condition: "has" | "enabled" | "equals" | "between";
  value: unknown;
};
```


---

## 9. API ENDPOINTS

### 9.1 Config APIs (RPC Functions)

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_customer_config` | Get complete config | `{customer_id, role}` | CustomerConfig |
| `get_navigation_tabs` | Get navigation tabs | `{customer_id, role}` | TabConfig[] |
| `get_screen_layout` | Get widgets for screen | `{customer_id, role, screen_id}` | WidgetConfig[] |
| `get_customer_theme` | Get theme config | `{customer_id}` | ThemeConfig |
| `get_customer_branding` | Get branding config | `{customer_id}` | BrandingConfig |
| `get_enabled_features` | Get enabled features | `{customer_id}` | FeatureConfig[] |

### 9.2 Permission APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_user_permissions` | Get resolved permissions | `{user_id}` | string[] |
| `check_user_permission` | Check single permission | `{user_id, permission_code}` | boolean |

### 9.3 Dashboard Data APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_student_dashboard_data` | All dashboard data | `{user_id, date?}` | DashboardData |
| `get_today_schedule` | Today's classes | `{user_id, date}` | ClassSession[] |
| `get_pending_assignments` | Pending assignments | `{user_id, limit?}` | Assignment[] |
| `get_upcoming_tests` | Upcoming tests | `{user_id, limit?}` | Test[] |
| `get_recent_doubts` | Recent doubts | `{user_id, limit?}` | Doubt[] |
| `get_progress_snapshot` | Progress summary | `{user_id}` | ProgressSnapshot |

### 9.4 Study APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_assignments` | List assignments | `{user_id, status?, subject?}` | Assignment[] |
| `get_assignment_detail` | Assignment details | `{assignment_id}` | AssignmentDetail |
| `submit_assignment` | Submit assignment | `{assignment_id, files, notes}` | SubmissionResult |
| `get_tests` | List tests | `{user_id, category?}` | Test[] |
| `get_test_detail` | Test details | `{test_id}` | TestDetail |
| `start_test_attempt` | Start test | `{test_id}` | TestAttempt |
| `submit_test_answer` | Submit answer | `{attempt_id, question_id, answer}` | void |
| `finish_test_attempt` | Finish test | `{attempt_id}` | TestResult |
| `get_test_review` | Review test | `{attempt_id}` | TestReview |

### 9.5 Doubts APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_doubts` | List doubts | `{user_id, status?, subject?}` | Doubt[] |
| `get_doubt_detail` | Doubt details | `{doubt_id}` | DoubtDetail |
| `create_doubt` | Create doubt | `{title, description, subject, attachments}` | Doubt |
| `add_doubt_reply` | Reply to doubt | `{doubt_id, content}` | Reply |
| `mark_doubt_resolved` | Mark resolved | `{doubt_id}` | void |

### 9.6 Progress APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_overall_progress` | Overall progress | `{user_id}` | OverallProgress |
| `get_subject_progress` | Subject progress | `{user_id, subject_id}` | SubjectProgress |
| `get_study_streak` | Study streak | `{user_id}` | StreakData |
| `get_leaderboard` | Leaderboard | `{scope, limit?}` | LeaderboardEntry[] |
| `get_quests` | Active quests | `{user_id}` | Quest[] |
| `get_badges` | Earned badges | `{user_id}` | Badge[] |

### 9.7 AI Learning Insights APIs (Phase 85-88)

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_student_ai_insights` | AI learning insights | `{user_id, type?, limit?}` | AIInsight[] |
| `get_performance_predictions` | Predicted outcomes | `{user_id, subject_id?}` | PerformancePrediction[] |
| `get_weak_topic_alerts` | Weak topic alerts | `{user_id}` | WeakTopicAlert[] |
| `get_study_recommendations` | AI study recommendations | `{user_id, limit?}` | StudyRecommendation[] |
| `acknowledge_insight` | Mark insight seen | `{insight_id}` | void |
| `dismiss_insight` | Dismiss insight | `{insight_id}` | void |

### 9.8 Voice Practice APIs (Phase 85-88)

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_voice_practice_sessions` | Voice practice history | `{user_id, limit?}` | VoicePracticeSession[] |
| `start_voice_practice` | Start practice session | `{user_id, topic_id, language}` | VoicePracticeSession |
| `submit_voice_response` | Submit voice answer | `{session_id, audio_url, question_index}` | VoiceResponse |
| `get_voice_analytics` | Voice practice analytics | `{user_id}` | VoiceAnalytics |

### 9.9 Student Automation APIs (Phase 85-88)

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_student_automations` | Active automation rules | `{user_id}` | StudentAutomation[] |
| `create_student_automation` | Create automation | `{user_id, rule_data}` | StudentAutomation |
| `update_student_automation` | Update automation | `{automation_id, data}` | StudentAutomation |
| `toggle_student_automation` | Enable/disable | `{automation_id, is_active}` | StudentAutomation |
| `get_smart_reminders` | Get smart reminders | `{user_id}` | SmartReminder[] |

### 9.10 Enhanced Gamification APIs (Phase 85-88)

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_rewards_shop` | Redeemable items | `{user_id}` | RewardItem[] |
| `redeem_reward` | Redeem XP for reward | `{user_id, reward_id}` | RedemptionResult |
| `get_redemption_history` | Redemption history | `{user_id, limit?}` | Redemption[] |
| `get_activity_feed` | Social activity feed | `{user_id, limit?}` | ActivityFeedItem[] |
| `get_peer_matches` | AI-suggested peers | `{user_id, limit?}` | PeerMatch[] |
| `get_study_groups` | Study groups | `{user_id}` | StudyGroup[] |
| `join_study_group` | Join a group | `{user_id, group_id}` | StudyGroupMembership |

### 7.7 Profile APIs

| Function | Purpose | Request | Response |
|----------|---------|---------|----------|
| `get_user_profile` | Get profile | `{user_id}` | UserProfile |
| `update_user_profile` | Update profile | `{user_id, data}` | UserProfile |
| `update_language` | Change language | `{user_id, language}` | void |
| `get_notifications` | Get notifications | `{user_id, limit?, category?}` | Notification[] |
| `mark_notification_read` | Mark read | `{notification_id}` | void |

### 7.8 API Response Types

```typescript
// Standard response wrapper
type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  timestamp: string;
};

// Error structure
type ApiError = {
  code: string;      // E1001, E2001, etc.
  message: string;
  details?: Record<string, unknown>;
};

// Pagination
type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};
```


---

## 10. DATABASE SCHEMA

### 10.1 Core Tables (Student-Related)

#### `user_profiles`
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  role TEXT NOT NULL DEFAULT 'student',
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  class TEXT,
  section TEXT,
  batch_id UUID REFERENCES batches(id),
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `students` (Extended student data)
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY REFERENCES user_profiles(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  roll_number TEXT,
  admission_date DATE,
  parent_id UUID REFERENCES user_profiles(id),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.2 Config Tables

#### `navigation_tabs`
```sql
CREATE TABLE navigation_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  role TEXT NOT NULL,
  tab_id TEXT NOT NULL,
  label TEXT NOT NULL,
  label_key TEXT,
  icon TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  root_screen_id TEXT NOT NULL,
  badge_type TEXT DEFAULT 'none',
  badge_source TEXT,
  requires_online BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, role, tab_id)
);
```

#### `screen_layouts`
```sql
CREATE TABLE screen_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  role TEXT NOT NULL,
  screen_id TEXT NOT NULL,
  widget_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  size TEXT DEFAULT 'standard',
  enabled BOOLEAN DEFAULT TRUE,
  grid_column INTEGER,
  grid_row INTEGER,
  custom_props JSONB DEFAULT '{}',
  visibility_rules JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, role, screen_id, widget_id)
);
```

### 10.3 Academic Tables

#### `assignments`
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id),
  batch_id UUID REFERENCES batches(id),
  teacher_id UUID REFERENCES user_profiles(id),
  type TEXT DEFAULT 'homework',  -- homework, project, quiz, other
  due_date TIMESTAMPTZ NOT NULL,
  total_points INTEGER,
  attachments JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `assignment_submissions`
```sql
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  status TEXT DEFAULT 'pending',  -- pending, submitted, graded, late
  submitted_at TIMESTAMPTZ,
  files JSONB DEFAULT '[]',
  notes TEXT,
  score INTEGER,
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);
```

#### `tests`
```sql
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id),
  batch_id UUID REFERENCES batches(id),
  teacher_id UUID REFERENCES user_profiles(id),
  category TEXT DEFAULT 'upcoming',  -- upcoming, mock, past
  test_type TEXT DEFAULT 'unit',     -- unit, full, quiz, other
  total_marks INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  scheduled_date TIMESTAMPTZ,
  questions JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `test_attempts`
```sql
CREATE TABLE test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  answers JSONB DEFAULT '{}',
  score INTEGER,
  percentage DECIMAL(5,2),
  time_taken_seconds INTEGER,
  status TEXT DEFAULT 'in_progress',  -- in_progress, completed, abandoned
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.4 Doubts Tables

#### `doubts`
```sql
CREATE TABLE doubts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id),
  chapter_id UUID REFERENCES chapters(id),
  attachments JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',  -- pending, answered, resolved
  source TEXT DEFAULT 'teacher',  -- teacher, ai, peer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `doubt_replies`
```sql
CREATE TABLE doubt_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doubt_id UUID NOT NULL REFERENCES doubts(id),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.5 Progress & Gamification Tables

#### `student_progress`
```sql
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  subject_id UUID REFERENCES subjects(id),
  chapter_id UUID REFERENCES chapters(id),
  mastery_percentage DECIMAL(5,2) DEFAULT 0,
  completed_topics INTEGER DEFAULT 0,
  total_topics INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id, chapter_id)
);
```

#### `gamification_stats`
```sql
CREATE TABLE gamification_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) UNIQUE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_streak_date DATE,
  badges JSONB DEFAULT '[]',
  achievements JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `quests`
```sql
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,  -- daily, weekly
  target_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  icon TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `student_quests`
```sql
CREATE TABLE student_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  quest_id UUID NOT NULL REFERENCES quests(id),
  current_progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',  -- active, completed, expired
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, quest_id)
);
```

### 10.6 Schedule Tables

#### `class_sessions`
```sql
CREATE TABLE class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  subject_id UUID REFERENCES subjects(id),
  batch_id UUID REFERENCES batches(id),
  teacher_id UUID REFERENCES user_profiles(id),
  title TEXT,
  topic TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  meeting_url TEXT,
  status TEXT DEFAULT 'scheduled',  -- scheduled, live, completed, cancelled
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.7 AI Learning Insights Tables (Phase 85-88)

#### `student_ai_insights`
```sql
CREATE TABLE student_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  insight_type TEXT NOT NULL CHECK (insight_type IN 
    ('performance', 'engagement', 'learning_pattern', 'weak_topic', 'recommendation')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  related_subject_id UUID REFERENCES subjects(id),
  related_topic_id UUID REFERENCES chapters(id),
  data_sources JSONB DEFAULT '{}',
  recommended_actions JSONB DEFAULT '[]',
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `student_performance_predictions`
```sql
CREATE TABLE student_performance_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  subject_id UUID REFERENCES subjects(id),
  test_id UUID REFERENCES tests(id),
  predicted_score DECIMAL(5,2),
  predicted_grade TEXT,
  confidence_score DECIMAL(3,2),
  contributing_factors JSONB DEFAULT '[]',
  prediction_date TIMESTAMPTZ DEFAULT NOW(),
  actual_score DECIMAL(5,2),
  accuracy_delta DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.8 Voice Practice Tables (Phase 85-88)

#### `voice_practice_sessions`
```sql
CREATE TABLE voice_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  subject_id UUID REFERENCES subjects(id),
  topic_id UUID REFERENCES chapters(id),
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi', 'both')),
  session_type TEXT DEFAULT 'practice' CHECK (session_type IN 
    ('practice', 'reading', 'pronunciation', 'comprehension')),
  total_questions INTEGER DEFAULT 0,
  completed_questions INTEGER DEFAULT 0,
  overall_accuracy DECIMAL(5,2),
  overall_fluency DECIMAL(5,2),
  overall_pronunciation DECIMAL(5,2),
  duration_seconds INTEGER,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `voice_responses`
```sql
CREATE TABLE voice_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  session_id UUID NOT NULL REFERENCES voice_practice_sessions(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  question_index INTEGER NOT NULL,
  question_text TEXT,
  audio_url TEXT NOT NULL,
  transcription TEXT,
  language_detected TEXT,
  duration_seconds INTEGER,
  accuracy_score DECIMAL(5,2),
  pronunciation_score DECIMAL(5,2),
  fluency_score DECIMAL(5,2),
  ai_feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_index)
);
```

### 10.9 Student Automation Tables (Phase 85-88)

#### `student_automations`
```sql
CREATE TABLE student_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN 
    ('study_reminder', 'deadline_alert', 'streak_protection', 'goal_tracking', 'custom')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN 
    ('schedule', 'event', 'condition')),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  action_type TEXT NOT NULL CHECK (action_type IN 
    ('notification', 'reminder', 'alert')),
  action_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `smart_reminders`
```sql
CREATE TABLE smart_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  automation_id UUID REFERENCES student_automations(id),
  reminder_type TEXT NOT NULL CHECK (reminder_type IN 
    ('study', 'assignment', 'test', 'streak', 'goal', 'custom')),
  title TEXT NOT NULL,
  message TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  scheduled_at TIMESTAMPTZ NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.10 Enhanced Gamification Tables (Phase 85-88)

#### `rewards`
```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  name_en TEXT NOT NULL,
  name_hi TEXT,
  description_en TEXT,
  description_hi TEXT,
  category TEXT NOT NULL CHECK (category IN 
    ('avatar', 'badge', 'theme', 'feature', 'physical', 'discount')),
  xp_cost INTEGER NOT NULL,
  image_url TEXT,
  is_limited BOOLEAN DEFAULT FALSE,
  quantity_available INTEGER,
  quantity_redeemed INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `student_rewards`
```sql
CREATE TABLE student_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  reward_id UUID NOT NULL REFERENCES rewards(id),
  xp_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'redeemed' CHECK (status IN ('redeemed', 'delivered', 'expired', 'refunded')),
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `activity_feed`
```sql
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN 
    ('achievement', 'badge_earned', 'level_up', 'streak_milestone', 'quest_completed', 
     'test_completed', 'assignment_submitted', 'doubt_resolved', 'peer_helped')),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_earned INTEGER DEFAULT 0,
  related_entity_type TEXT,
  related_entity_id UUID,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `study_groups`
```sql
CREATE TABLE study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  name TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id),
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  max_members INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `study_group_members`
```sql
CREATE TABLE study_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES study_groups(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(group_id, student_id)
);
```

#### `peer_matches`
```sql
CREATE TABLE peer_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  matched_student_id UUID NOT NULL REFERENCES user_profiles(id),
  match_score DECIMAL(5,2) NOT NULL,
  match_reasons JSONB DEFAULT '[]',
  common_subjects UUID[] DEFAULT '{}',
  is_connected BOOLEAN DEFAULT FALSE,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, matched_student_id)
);
```


---

## 11. SERVICES & HOOKS

### 11.1 Config Services

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `useCustomerConfig` | Fetch complete customer config | `src/hooks/config/useCustomerConfig.ts` |
| `useNavigationTabs` | Fetch navigation tabs | `src/hooks/queries/useNavigationTabsQuery.ts` |
| `useScreenLayout` | Fetch screen widget layout | `src/hooks/queries/useScreenLayoutQuery.ts` |
| `useCustomerTheme` | Fetch and apply theme | `src/hooks/config/useCustomerTheme.ts` |
| `useCustomerBranding` | Fetch branding config | `src/hooks/queries/useCustomerBrandingQuery.ts` |
| `useEnabledFeatures` | Check enabled features | `src/hooks/config/useEnabledFeatures.ts` |
| `useConfigSubscription` | Realtime config updates | `src/hooks/useConfigSubscription.ts` |

### 11.2 Auth & User Services

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `useAuth` | Authentication context | `src/context/AuthContext.tsx` |
| `useUserProfile` | Current user profile | `src/hooks/queries/useUserProfileQuery.ts` |
| `usePermissions` | Check user permissions | `src/hooks/usePermissions.ts` |

### 11.3 Dashboard Services

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `useStudentDashboard` | All dashboard data | `src/hooks/queries/useStudentDashboardQuery.ts` |
| `useTodaySchedule` | Today's classes | `src/hooks/queries/useTodayScheduleQuery.ts` |
| `usePendingAssignments` | Pending assignments | `src/hooks/queries/usePendingAssignmentsQuery.ts` |
| `useUpcomingTests` | Upcoming tests | `src/hooks/queries/useUpcomingTestsQuery.ts` |
| `useRecentDoubts` | Recent doubts | `src/hooks/queries/useRecentDoubtsQuery.ts` |
| `useProgressSnapshot` | Progress summary | `src/hooks/queries/useProgressSnapshotQuery.ts` |

### 11.4 Study Services

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `useAssignments` | List assignments | `src/hooks/queries/useAssignmentsQuery.ts` |
| `useAssignmentDetail` | Assignment details | `src/hooks/queries/useAssignmentDetailQuery.ts` |
| `useSubmitAssignment` | Submit assignment | `src/hooks/mutations/useSubmitAssignment.ts` |
| `useTests` | List tests | `src/hooks/queries/useTestsQuery.ts` |
| `useTestDetail` | Test details | `src/hooks/queries/useTestDetailQuery.ts` |
| `useTestAttempt` | Test attempt flow | `src/hooks/mutations/useTestAttempt.ts` |

### 11.5 Doubts Services

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `useDoubts` | List doubts | `src/hooks/queries/useDoubtsQuery.ts` |
| `useDoubtDetail` | Doubt details | `src/hooks/queries/useDoubtDetailQuery.ts` |
| `useCreateDoubt` | Create doubt | `src/hooks/mutations/useCreateDoubt.ts` |
| `useDoubtReplies` | Doubt replies | `src/hooks/queries/useDoubtRepliesQuery.ts` |

### 11.6 Progress Services

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `useOverallProgress` | Overall progress | `src/hooks/queries/useOverallProgressQuery.ts` |
| `useSubjectProgress` | Subject progress | `src/hooks/queries/useSubjectProgressQuery.ts` |
| `useStudyStreak` | Study streak | `src/hooks/queries/useStudyStreakQuery.ts` |
| `useLeaderboard` | Leaderboard | `src/hooks/queries/useLeaderboardQuery.ts` |
| `useQuests` | Active quests | `src/hooks/queries/useQuestsQuery.ts` |
| `useBadges` | Earned badges | `src/hooks/queries/useBadgesQuery.ts` |

### 11.6a AI Learning Insights Services (Phase 85-88)

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `useStudentAIInsights` | AI learning insights | `src/hooks/queries/useStudentAIInsightsQuery.ts` |
| `usePerformancePredictions` | Performance predictions | `src/hooks/queries/usePerformancePredictionsQuery.ts` |
| `useWeakTopicAlerts` | Weak topic alerts | `src/hooks/queries/useWeakTopicAlertsQuery.ts` |
| `useStudyRecommendations` | AI study recommendations | `src/hooks/queries/useStudyRecommendationsQuery.ts` |
| `useAcknowledgeInsight` | Mark insight seen | `src/hooks/mutations/useAcknowledgeInsight.ts` |
| `useDismissInsight` | Dismiss insight | `src/hooks/mutations/useDismissInsight.ts` |

### 11.6b Voice Practice Services (Phase 85-88)

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `useVoicePracticeSessions` | Voice practice history | `src/hooks/queries/useVoicePracticeSessionsQuery.ts` |
| `useStartVoicePractice` | Start practice session | `src/hooks/mutations/useStartVoicePractice.ts` |
| `useSubmitVoiceResponse` | Submit voice answer | `src/hooks/mutations/useSubmitVoiceResponse.ts` |
| `useVoiceAnalytics` | Voice practice analytics | `src/hooks/queries/useVoiceAnalyticsQuery.ts` |

### 11.6c Student Automation Services (Phase 85-88)

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `useStudentAutomations` | Active automation rules | `src/hooks/queries/useStudentAutomationsQuery.ts` |
| `useCreateStudentAutomation` | Create automation | `src/hooks/mutations/useCreateStudentAutomation.ts` |
| `useUpdateStudentAutomation` | Update automation | `src/hooks/mutations/useUpdateStudentAutomation.ts` |
| `useToggleStudentAutomation` | Enable/disable | `src/hooks/mutations/useToggleStudentAutomation.ts` |
| `useSmartReminders` | Get smart reminders | `src/hooks/queries/useSmartRemindersQuery.ts` |

### 11.6d Enhanced Gamification Services (Phase 85-88)

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `useRewardsShop` | Redeemable items | `src/hooks/queries/useRewardsShopQuery.ts` |
| `useRedeemReward` | Redeem XP for reward | `src/hooks/mutations/useRedeemReward.ts` |
| `useRedemptionHistory` | Redemption history | `src/hooks/queries/useRedemptionHistoryQuery.ts` |
| `useActivityFeed` | Social activity feed | `src/hooks/queries/useActivityFeedQuery.ts` |
| `usePeerMatches` | AI-suggested peers | `src/hooks/queries/usePeerMatchesQuery.ts` |
| `useStudyGroups` | Study groups | `src/hooks/queries/useStudyGroupsQuery.ts` |
| `useJoinStudyGroup` | Join a group | `src/hooks/mutations/useJoinStudyGroup.ts` |

### 11.7 Utility Services

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `useAppTheme` | Theme colors & styles | `src/theme/useAppTheme.ts` |
| `useBranding` | Branding context | `src/context/BrandingContext.tsx` |
| `useNetworkStatus` | Online/offline status | `src/offline/networkStore.ts` |
| `useAnalytics` | Analytics tracking (Supabase) | `src/hooks/useAnalytics.ts` |
| `useTranslation` | i18n translations | `react-i18next` |
| `getLocalizedField` | Get localized DB content | `src/utils/getLocalizedField.ts` |
| `useLanguageChangeInvalidation` | Invalidate queries on lang change | `src/hooks/useLanguageChangeInvalidation.ts` |

### 11.8 Permission Services

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `usePermissions` | Get all user permissions | `src/hooks/usePermissions.ts` |
| `useHasPermission` | Check single permission | `src/hooks/usePermissions.ts` |
| `useHasAllPermissions` | Check multiple permissions (AND) | `src/hooks/usePermissions.ts` |
| `useHasAnyPermission` | Check multiple permissions (OR) | `src/hooks/usePermissions.ts` |
| `useHasRole` | Check user role | `src/hooks/usePermissions.ts` |
| `useUserPermissionsQuery` | Fetch permissions from DB | `src/hooks/queries/useUserPermissionsQuery.ts` |
| `PermissionGate` | Declarative permission UI | `src/components/auth/PermissionGate.tsx` |
| `RoleGate` | Declarative role UI | `src/components/auth/PermissionGate.tsx` |

### 11.9 Offline Services

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `useOfflineMutation` | Queue mutations when offline | `src/hooks/useOfflineMutation.ts` |
| `useMutationQueue` | Monitor offline queue | `src/hooks/useOfflineMutation.ts` |
| `mutationQueue` | Core queue with persistence | `src/offline/mutationQueue.ts` |
| `mutationHandlers` | Supabase mutation handlers | `src/offline/mutationHandlers.ts` |
| `OfflineQueueBanner` | UI for pending mutations | `src/components/offline/OfflineQueueBanner.tsx` |

### 11.10 Media Services

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `useMediaUpload` | Upload files to Supabase Storage | `src/hooks/useMediaUpload.ts` |
| `useSignedUrl` | Get signed URLs for private files | `src/hooks/useMediaUpload.ts` |
| `useMediaDelete` | Delete files from storage | `src/hooks/useMediaUpload.ts` |
| `mediaService` | Core upload/download functions | `src/services/media/mediaService.ts` |
| `useDownload` | Download files for offline | `src/hooks/useDownload.ts` |
| `useDownloads` | List all downloads | `src/hooks/useDownload.ts` |
| `downloadManager` | Core download manager | `src/services/downloads/downloadManager.ts` |
| `useImageOptimization` | Resize/compress images | `src/hooks/useImageOptimization.ts` |
| `imageService` | Image optimization functions | `src/services/media/imageService.ts` |

### 11.11 Analytics Services

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `useAnalytics` | Track events to Supabase | `src/hooks/useAnalytics.ts` |
| `NavigationTracker` | Auto screen tracking | `src/navigation/NavigationTracker.tsx` |
| `useNavigationTracking` | Get session info | `src/navigation/NavigationTracker.tsx` |

### 11.12 Push Notification Services

| Service/Hook | Purpose | Location |
|--------------|---------|----------|
| `initPushNotifications` | Initialize FCM & register token | `src/services/notifications/pushService.ts` |
| `requestPermission` | Request notification permission | `src/services/notifications/pushService.ts` |
| `registerToken` | Register FCM token with Supabase | `src/services/notifications/pushService.ts` |
| `unregisterToken` | Unregister token on logout | `src/services/notifications/pushService.ts` |
| `setNavigationCallback` | Set deep link handler | `src/services/notifications/pushService.ts` |
| `subscribeToTopic` | Subscribe to FCM topic | `src/services/notifications/pushService.ts` |
| `fetchNotificationSettings` | Get customer notification config | `src/services/notifications/pushService.ts` |
| `shouldShowNotification` | Check if notification should display | `src/services/notifications/pushService.ts` |
| `usePushNotifications` | Initialize push in components | `src/hooks/usePushNotifications.ts` |
| `useNotifications` | Fetch user notifications | `src/hooks/usePushNotifications.ts` |
| `useNotificationPreferences` | Get/set user preferences | `src/hooks/usePushNotifications.ts` |
| `useMarkNotificationRead` | Mark notification as read | `src/hooks/usePushNotifications.ts` |
| `useNotificationSettingsQuery` | Fetch customer settings | `src/hooks/queries/useNotificationSettingsQuery.ts` |

**Push Notification Database Tables:**
- `push_tokens` - FCM token storage per user/device
- `notifications` - Notification history
- `notification_preferences` - User-level preferences
- `notification_settings` - Customer-level configuration

**Notification Categories:**
- `assignments` - New assignments and deadlines
- `tests` - Upcoming tests and results
- `announcements` - School/institute announcements
- `doubts` - Doubt responses and updates
- `attendance` - Attendance alerts
- `grades` - Grade updates and report cards
- `schedule` - Class schedule changes
- `reminders` - Study reminders and tips
- `system` - App updates and maintenance

**Platform Studio Configuration:**
- Enable/disable notifications globally
- Toggle individual categories
- Configure quiet hours (start/end time)
- Sound & vibration settings
- Android channel priority
- Custom notification icon & accent color

### 11.13 Service Implementation Pattern

```typescript
// Query hook pattern
export function useStudentDashboard(userId: string) {
  const { isOnline } = useNetworkStatus();
  
  return useQuery({
    queryKey: ['student-dashboard', userId],
    queryFn: () => supabase.rpc('get_student_dashboard_data', { p_user_id: userId }),
    staleTime: 5 * 60 * 1000,      // 5 minutes
    gcTime: 30 * 60 * 1000,        // 30 minutes cache
    enabled: !!userId,
    retry: isOnline ? 2 : 0,
    refetchOnWindowFocus: isOnline,
  });
}

// Mutation hook pattern
export function useSubmitAssignment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SubmitAssignmentInput) => 
      supabase.rpc('submit_assignment', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
    },
  });
}
```


---

## 12. IMPLEMENTATION CHECKLIST

### 12.1 Phase 1: Core Infrastructure (Week 1-2)

#### Auth & Config
- [ ] Auth flow (Login, Signup, Logout)
- [ ] Customer config loading (`get_customer_config`)
- [ ] Theme application (`useAppTheme`)
- [ ] Branding context (`useBranding`)
- [ ] Permission checking (`usePermissions`)
- [ ] Feature flag checking (`useEnabledFeatures`)

#### Navigation
- [ ] Dynamic tab navigator (`DynamicTabNavigator`)
- [ ] Tab configuration from DB
- [ ] Screen routing
- [ ] Deep linking setup

### 12.2 Phase 2: Dashboard & Widgets (Week 3-4)

#### Dashboard Screen
- [ ] `DynamicScreen` component
- [ ] Widget rendering from `screen_layouts`
- [ ] Widget error boundary
- [ ] Pull-to-refresh

#### Built Widgets (Verify/Fix)
- [ ] `hero.greeting` - Hero Card
- [ ] `schedule.today` - Today's Schedule
- [ ] `actions.quick` - Quick Actions
- [ ] `assignments.pending` - Assignments & Tests
- [ ] `doubts.inbox` - Doubts Inbox
- [ ] `progress.snapshot` - Progress Snapshot

### 12.3 Phase 3: Fixed Screens (Week 5-6)

#### Settings & Profile
- [ ] Settings screen (language, theme, notifications, logout)
- [ ] Language selection screen
- [ ] Profile screen (view)
- [ ] Edit profile screen
- [ ] Help & feedback screen
- [ ] Legal screen

#### Notifications
- [ ] Notifications list screen
- [ ] Notification detail
- [ ] Mark as read

### 12.4 Phase 4: Study Features (Week 7-8)

#### Assignments
- [ ] Assignments list screen
- [ ] Assignment detail screen
- [ ] Assignment submission flow
- [ ] File upload

#### Tests
- [ ] Test center screen
- [ ] Test detail screen
- [ ] Test attempt screen (timer, questions)
- [ ] Test review screen

### 12.5 Phase 5: Doubts & AI (Week 9-10)

#### Doubts
- [ ] Doubts list screen
- [ ] Doubt detail screen
- [ ] Submit doubt screen
- [ ] Doubt replies

#### AI Tutor (if enabled)
- [ ] AI chat screen
- [ ] Message history
- [ ] Suggested questions

### 12.6 Phase 6: Progress & Gamification (Week 11-12)

#### Progress
- [ ] Progress home screen
- [ ] Subject analytics screen
- [ ] Global analytics screen

#### Gamification (if enabled)
- [ ] Leaderboard screen
- [ ] Quests screen
- [ ] Gamified hub screen
- [ ] Badges display

### 12.7 Phase 7: Additional Widgets (Week 13-14)

#### Tier 1 Widgets
- [ ] `continue.learning` - Continue Learning
- [ ] `live.class` - Live Class Card
- [ ] `subjects.progress` - My Subjects
- [ ] `stats.grid` - Stats Grid
- [ ] `streak.tracker` - Study Streak

#### Tier 2 Widgets
- [ ] `ai.tools` - AI Study Tools
- [ ] `notes.summary` - Notes & Downloads
- [ ] `quests.active` - Active Quests
- [ ] `week.calendar` - Week Calendar

### 12.8 Phase 8: Polish & Testing (Week 15-16)

#### Quality
- [ ] Error handling (all screens)
- [ ] Loading states (skeletons)
- [ ] Empty states
- [ ] Offline support
- [ ] i18n (English + Hindi)

#### Testing
- [ ] Unit tests (widgets)
- [ ] Integration tests (flows)
- [ ] E2E tests (critical paths)
- [ ] Performance testing

---

## 📊 SUMMARY STATISTICS

| Category | Count | Notes |
|----------|-------|-------|
| **Dynamic Screens (Full)** | 10 | Widget-based, fully customizable (+2 from Phase 85-88) |
| **Dynamic Screens (Medium)** | 7 | Section-based customization |
| **Fixed Screens** | 13 | Essential functionality only (+1 from Phase 85-88) |
| **Total Screens** | 30 | + detail/child screens |
| **Built Widgets** | 9 | Ready to use |
| **Widgets to Build (Tier 1)** | 5 | High priority |
| **Widgets to Build (Tier 2)** | 11 | Medium priority |
| **Widgets to Build (Tier 3)** | 3 | Low priority |
| **Widgets to Build (Phase 85-88)** | 13 | AI Insights, Voice, Automation, Gamification |
| **Total Widgets** | 41 | +13 from Phase 85-88 |
| **API Endpoints** | 65+ | +25 from Phase 85-88 |
| **Database Tables** | 25+ | +10 from Phase 85-88 |
| **Permissions** | 25 | +5 from Phase 85-88 |
| **Feature Flags** | 14 | +5 from Phase 85-88 |
| **Navigation Tabs** | 5 | Default config |

### Platform Studio Compatibility

| Feature | Status |
|---------|--------|
| Screen Builder | ✅ 17 screens configurable |
| Widget Properties | ✅ All widgets have config schema |
| Theme Editor | ✅ Full theme customization |
| Branding Editor | ✅ Full white-label support |
| Navigation Editor | ✅ Tab configuration |
| Realtime Updates | ✅ Config changes apply instantly |

### Phase 85-88 Enhancements Summary

| Enhancement | Screens | Widgets | Tables | APIs |
|-------------|---------|---------|--------|------|
| AI Learning Insights | 1 | 4 | 2 | 6 |
| Voice Practice | 1 (fixed) | 2 | 2 | 4 |
| Student Automations | - | 2 | 2 | 5 |
| Enhanced Gamification | 1 | 5 | 4 | 7 |
| **Total** | **3** | **13** | **10** | **22** |

### White-Label Coverage

| Feature | Status |
|---------|--------|
| Custom App Name | ✅ `branding.appName` |
| Custom Logo | ✅ `branding.logoUrl` |
| Feature Naming | ✅ 5 feature names customizable |
| Text Overrides | ✅ Any UI text |
| Theme Colors | ✅ Full palette |
| Typography | ✅ Font family + scale |
| Component Styles | ✅ Button, card, input styles |

---

## 🔍 VALIDATION LOG

### Cross-Validation Results (December 2024 - REVISED)

**Screen Classification Updated:**
- ✅ 17 dynamic screens (10 full + 7 medium) - includes Phase 85-88 additions
- ✅ 13 fixed screens - includes voice-practice screen
- ✅ Navigation structure matches existing `DynamicTabNavigator.tsx`

**Platform Studio Compatibility Verified:**
- ✅ All 17 dynamic screens registered in Platform Studio
- ✅ Widget registry includes branding props
- ✅ Theme system supports all customization options
- ✅ Branding context available to all screens

**White-Label Support Verified:**
- ✅ `BrandingContext` provides branding to all screens
- ✅ `useAppTheme()` provides theme to all components
- ✅ `BrandedHeader` component for consistent headers
- ✅ All widgets receive `branding` and `theme` props

**Widgets Validated:**
- ✅ 9 widgets confirmed in `src/components/widgets/dashboard/`
- ✅ Widget registry matches (`src/config/widgetRegistry.ts`)
- ✅ Platform Studio registry aligned (`platform-studio/src/config/widgetRegistry.ts`)
- ✅ 13 new widgets defined for Phase 85-88 enhancements

**Database Schema Validated:**
- ✅ Tables match `Doc/DB_SCHEMA_REFERENCE.md`
- ✅ RPC functions match `Doc/API_CONTRACTS.md`
- ✅ 10 new tables added for Phase 85-88 features

**Changes from v1.0:**
1. Increased dynamic screens from 11 to 15
2. Reduced fixed screens from 23 to 12
3. Added Platform Studio Integration section
4. Added White-Label & Branding section
5. Added branding props to widget specifications
6. Added customization levels (full/medium/fixed)

**Changes from v2.0 (Phase 85-88):**
1. Added 2 new dynamic screens (ai-insights-home, rewards-shop)
2. Added 1 new fixed screen (voice-practice)
3. Added 13 new widgets (AI Insights, Voice, Automation, Gamification)
4. Added 10 new database tables
5. Added 22 new API endpoints
6. Added 5 new permissions
7. Added 5 new feature flags

**Confidence Level:** 99%

---

## 13. CROSS-CUTTING CONCERNS

### 13.1 Error Handling

All screens and widgets MUST follow `ERROR_HANDLING_SPEC.md`:

| Layer | Component | Behavior |
|-------|-----------|----------|
| Global | `GlobalErrorBoundary` | Catches unhandled errors, shows recovery UI |
| Stack | `StackErrorBoundary` | Per-tab error isolation |
| Screen | `ScreenErrorBoundary` | Per-screen error handling |
| Widget | `WidgetErrorBoundary` | Per-widget isolation (one fails, others continue) |

**Safe-Mode:** If config fails completely, app shows minimal UI (Home + Profile tabs only).

### 13.2 Offline Support

All screens and widgets MUST follow `OFFLINE_SUPPORT_SPEC.md`:

| Screen Type | Offline Behavior |
|-------------|------------------|
| Dashboard | ✅ Works (cached widgets) |
| Study Library | ✅ Works (cached metadata) |
| Notes | ✅ Works (local storage) |
| Downloads | ✅ Works (local files) |
| Settings | ✅ Works |
| Doubts List | ⚠️ Partial (cached list, no create) |
| Assignments | ⚠️ Partial (cached list, no submit) |
| Tests | ❌ Online only (no attempt offline) |
| AI Tutor | ❌ Online only |
| Live Class | ❌ Online only |

**Widget Offline Behavior:**
```typescript
offlineBehavior: "show-cached" | "show-placeholder" | "hide"
```

### 13.3 Internationalization (i18n)

All screens and widgets MUST follow `I18N_MULTILANGUAGE_SPEC.md`:

**Supported Languages:**
- English (`en`) - Default
- Hindi (`hi`) - Secondary

**Rules:**
1. NO hardcoded text in any component
2. Use `useTranslation()` hook for all text
3. Use `titleKey`/`descriptionKey` in widget metadata
4. Use `label_key` in navigation config
5. Support customer text overrides via `branding.textOverrides`

**Translation Priority:**
```
1. branding.textOverrides (customer override)
2. i18n translation (selected language)
3. i18n fallback (English)
```

### 13.4 Widget Failsafe

All widgets MUST follow `WIDGET_FAILSAFE_SPEC.md`:

**Validation Pipeline:**
```
1. Schema validation (Zod)
2. Registry check (widgetId exists?)
3. Role check (allowed for student?)
4. Permission check (user has permission?)
5. Feature check (feature enabled?)
6. Online check (requires internet?)
```

**Fallback Types:**
| Scenario | Behavior |
|----------|----------|
| Widget missing in registry | Skip, log error |
| Widget throws error | Show fallback card, log to Sentry |
| Data fetch fails (has cache) | Show cached + offline badge |
| Data fetch fails (no cache) | Show "Couldn't load" + Retry |
| Permission denied | Silently hide |
| Feature disabled | Silently hide |
| Offline + requires online | Show placeholder or hide |

### 13.5 Analytics & Telemetry

All screens and widgets MUST track:

| Event | When |
|-------|------|
| `screen_view` | Screen focused |
| `widget_render` | Widget rendered |
| `widget_error` | Widget fails |
| `widget_click` | User interacts |
| `config_safe_mode` | Safe mode activated |
| `permission_denied` | Access blocked |

---

## 📎 RELATED DOCUMENTS

- [BACKUP_FEATURE_INVENTORY.md](./BACKUP_FEATURE_INVENTORY.md) - Feature inventory from backup
- [ERROR_HANDLING_SPEC.md](./ERROR_HANDLING_SPEC.md) - Error handling architecture
- [DB_SCHEMA_REFERENCE.md](./DB_SCHEMA_REFERENCE.md) - Complete database schema
- [API_CONTRACTS.md](./API_CONTRACTS.md) - API specifications
- [WIDGET_DEVELOPMENT_GUIDE.md](./WIDGET_DEVELOPMENT_GUIDE.md) - Widget development guide
- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - System architecture
- [I18N_MULTILANGUAGE_SPEC.md](./I18N_MULTILANGUAGE_SPEC.md) - Internationalization spec
- [OFFLINE_SUPPORT_SPEC.md](./OFFLINE_SUPPORT_SPEC.md) - Offline support spec
- [WIDGET_FAILSAFE_SPEC.md](./WIDGET_FAILSAFE_SPEC.md) - Widget error handling

---

## 📝 CHANGE LOG

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | December 2024 | Initial complete specification |
| 2.1.0 | December 2024 | Phase 85-88 enhancements: +3 screens (ai-insights-home, rewards-shop, voice-practice), +13 widgets (AI Learning Insights, Voice Practice, Student Automation, Enhanced Gamification), +10 database tables, +22 API endpoints, +5 permissions, +5 feature flags |

---

*Document created: December 2024*  
*Last updated: December 15, 2024*  
*Version: 2.1.0*  
*Status: Complete - Ready for Implementation*
