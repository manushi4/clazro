# 🧱 WIDGET_SYSTEM_SPEC.md  
## Universal Widget System for Config-Driven, Composable UI

This document describes the **universal widget system** used to build **any screen, any tab, any layout** in a **config-driven, multi-tenant** way.

**Key Principle:** Every UI function is a widget. Widgets can be placed anywhere - any tab, any screen, any position. There are no fixed layouts.

---

## 1. 🎯 Goals

1. **Universal placement** — Any widget can be placed on any screen, any tab, any position
2. **Dynamic tabs** — Support 1-10 tabs per customer (not fixed to 5)
3. **Composable screens** — Every screen is a container of widgets assembled from config
4. **Self-contained widgets** — Each widget handles its own data, loading, errors
5. **Clear contracts** — Props, data policy, error handling standardized
6. **Performance budgets** — Per-widget render times and query limits
7. **Zero hardcoding** — No assumptions about where widgets appear

---

## 2. 🧩 Core Concepts & Types

All types live under `src/types/widget.types.ts`.

### 2.1 `WidgetId`

A **string identifier** for each widget, globally unique.

**Naming Convention:** `<category>.<function>`

Examples:
- `schedule.today` — Today's schedule
- `schedule.weekly` — Weekly calendar view
- `doubts.inbox` — Recent doubts list
- `doubts.quick-ask` — Quick doubt submission form
- `assignments.pending` — Pending assignments
- `assignments.submitted` — Submitted assignments
- `tests.upcoming` — Upcoming tests
- `tests.results` — Test results summary
- `progress.snapshot` — Progress overview
- `progress.subject-wise` — Subject-wise analytics
- `ai.tutor-chat` — AI tutor interface
- `ai.recommendations` — AI-powered recommendations
- `peers.groups` — Study groups
- `peers.leaderboard` — Leaderboard widget
- `library.recent` — Recently accessed resources
- `library.favorites` — Favorite resources
- `profile.summary` — User profile summary
- `notifications.recent` — Recent notifications
- `feed.class` — Class activity feed
- `hero.greeting` — Hero card with greeting
- `actions.quick` — Quick action buttons


### 2.2 `WidgetProps`

Standard props passed into **every** widget component:

```ts
export type WidgetProps = {
  // Context
  customerId: string;
  userId: string;
  role: "student" | "teacher" | "parent" | "admin";
  
  // Placement info
  screenId: string;        // Which screen this widget is on
  tabId: string;           // Which tab this screen belongs to
  position: number;        // Order position on the screen
  
  // Configuration
  config: WidgetRuntimeConfig;     // Layout-level custom props from DB
  size: "compact" | "standard" | "expanded";  // Widget size variant
  
  // Branding (WHITE-LABEL SUPPORT)
  branding: CustomerBranding;      // Logo, text overrides, feature names
  theme: CustomerTheme;            // Colors, fonts, radius
  
  // Actions
  onNavigate: (route: string, params?: any) => void;
  onAction?: (event: WidgetActionEvent) => void;
  onRefresh?: () => void;
};

// Branding type
export type CustomerBranding = {
  appName: string;
  logoUrl: string;
  logoSmallUrl: string;
  aiTutorName: string;
  doubtSectionName: string;
  assignmentName: string;
  testName: string;
  liveClassName: string;
  textOverrides: Record<string, string>;
};
```

### 2.3 `WidgetComponent`

Signature for any widget component:

```ts
export type WidgetComponent = (props: WidgetProps) => JSX.Element;
```

### 2.4 `WidgetMetadata`

Describes what a widget **is** and what it **requires**:

```ts
export type WidgetMetadata = {
  id: WidgetId;
  name: string;
  description: string;
  category: WidgetCategory;
  
  // Placement rules
  allowedRoles: Array<"student" | "teacher" | "parent" | "admin">;
  allowedScreenTypes: Array<"dashboard" | "list" | "detail" | "hub" | "any">;
  
  // Size variants
  supportedSizes: Array<"compact" | "standard" | "expanded">;
  defaultSize: "compact" | "standard" | "expanded";
  minHeight?: number;
  maxHeight?: number;
  
  // Dependencies
  requiredFeatureId?: FeatureId;
  requiredPermissions?: PermissionCode[];
  dependencies?: WidgetId[];  // Other widgets this depends on
  
  // Data policy
  dataPolicy: WidgetDataPolicy;
  defaultConfig: WidgetDefaultConfig;
  
  // Behavior
  refreshable: boolean;
  cacheable: boolean;
  offlineCapable: boolean;
};

export type WidgetCategory = 
  | "schedule"
  | "study"
  | "assessment"
  | "doubts"
  | "progress"
  | "social"
  | "ai"
  | "profile"
  | "notifications"
  | "actions"
  | "content"
  | "analytics";
```

### 2.5 `WidgetDataPolicy`

Defines how a widget interacts with data & performance:

```ts
export type WidgetDataPolicy = {
  maxQueries: number;              // Max queries per render
  staleTimeMs: number;             // React Query stale time
  cacheKey: (props: WidgetProps) => string[];
  prefetchOnScreenLoad: boolean;   // Prefetch when screen mounts
  allowBackgroundRefresh: boolean;
  offlineBehavior: "show-cached" | "show-placeholder" | "hide";
};
```

---

## 3. 🗄 Universal Widget Registry

The **registry** is the central mapping from `WidgetId` → implementation.

Location: `src/config/widgetRegistry.ts`

### 3.1 Structure

```ts
import { WidgetComponent, WidgetMetadata, WidgetId } from "../types/widget.types";

type WidgetRegistryEntry = {
  component: WidgetComponent;
  metadata: WidgetMetadata;
};

export const widgetRegistry: Record<WidgetId, WidgetRegistryEntry> = {
  // Schedule widgets
  "schedule.today": {
    component: TodayScheduleWidget,
    metadata: {
      id: "schedule.today",
      name: "Today's Schedule",
      description: "Shows today's classes and events",
      category: "schedule",
      allowedRoles: ["student", "teacher", "parent"],
      allowedScreenTypes: ["any"],
      supportedSizes: ["compact", "standard", "expanded"],
      defaultSize: "standard",
      requiredPermissions: ["view_schedule"],
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 60000,
        prefetchOnScreenLoad: true,
        allowBackgroundRefresh: true,
        offlineBehavior: "show-cached",
      },
      refreshable: true,
      cacheable: true,
      offlineCapable: true,
    },
  },
  
  // Doubts widgets
  "doubts.inbox": {
    component: DoubtsInboxWidget,
    metadata: {
      id: "doubts.inbox",
      name: "Doubts Inbox",
      description: "Recent doubts and their status",
      category: "doubts",
      allowedRoles: ["student", "teacher"],
      allowedScreenTypes: ["any"],
      supportedSizes: ["compact", "standard"],
      defaultSize: "standard",
      requiredFeatureId: "ask.doubts",
      requiredPermissions: ["view_doubts"],
      // ...
    },
  },
  
  // ... all other widgets
};
```

### 3.2 Registry Rules

1. Every widget **must** be registered to be used
2. Widget IDs in DB **must match** registry keys
3. Registry is **global**, not per customer
4. Widgets can be used on **any screen** that matches `allowedScreenTypes`
5. Role filtering happens at runtime based on `allowedRoles`


---

## 4. 📐 Screen Layout System

Every screen is a **container of widgets** defined by configuration.

### 4.1 Screen Layout Config

```ts
export type ScreenLayoutConfig = {
  screenId: string;
  customerId: string;
  role: string;
  tabId: string;
  
  // Screen metadata
  screenType: "dashboard" | "list" | "detail" | "hub" | "custom";
  title?: string;
  titleKey?: string;  // i18n key
  
  // Widget composition
  widgets: ScreenWidgetConfig[];
  
  // Layout options
  layout: "vertical" | "grid" | "masonry";
  padding: "none" | "sm" | "md" | "lg";
  gap: "none" | "sm" | "md" | "lg";
  
  // Behavior
  scrollable: boolean;
  pullToRefresh: boolean;
  headerVisible: boolean;
};

export type ScreenWidgetConfig = {
  widgetId: WidgetId;
  position: number;           // Order on screen
  size: "compact" | "standard" | "expanded";
  enabled: boolean;
  
  // Grid layout options (if layout = "grid")
  gridColumn?: number;        // 1-12 column span
  gridRow?: number;           // Row span
  
  // Custom props for this instance
  customProps?: Record<string, unknown>;
  
  // Visibility rules
  visibleWhen?: VisibilityRule[];
};

export type VisibilityRule = {
  type: "permission" | "feature" | "online" | "time" | "custom";
  condition: string;
  value: any;
};
```

### 4.2 Example: Student Home Screen

```json
{
  "screenId": "student-home",
  "customerId": "school-abc",
  "role": "student",
  "tabId": "home",
  "screenType": "dashboard",
  "layout": "vertical",
  "widgets": [
    { "widgetId": "hero.greeting", "position": 1, "size": "standard" },
    { "widgetId": "schedule.today", "position": 2, "size": "compact" },
    { "widgetId": "actions.quick", "position": 3, "size": "standard" },
    { "widgetId": "assignments.pending", "position": 4, "size": "compact" },
    { "widgetId": "doubts.inbox", "position": 5, "size": "compact" },
    { "widgetId": "progress.snapshot", "position": 6, "size": "standard" },
    { "widgetId": "ai.recommendations", "position": 7, "size": "standard", "visibleWhen": [{ "type": "feature", "condition": "enabled", "value": "ai.tutor" }] }
  ]
}
```

### 4.3 Example: Teacher Dashboard (Different Widgets)

```json
{
  "screenId": "teacher-home",
  "customerId": "school-abc",
  "role": "teacher",
  "tabId": "home",
  "screenType": "dashboard",
  "widgets": [
    { "widgetId": "hero.greeting", "position": 1, "size": "standard" },
    { "widgetId": "schedule.today", "position": 2, "size": "expanded" },
    { "widgetId": "doubts.inbox", "position": 3, "size": "standard" },
    { "widgetId": "analytics.class-performance", "position": 4, "size": "expanded" },
    { "widgetId": "assignments.to-grade", "position": 5, "size": "standard" }
  ]
}
```

### 4.4 Example: Custom "Study Hub" Screen

```json
{
  "screenId": "study-hub",
  "customerId": "school-abc",
  "role": "student",
  "tabId": "study",
  "screenType": "hub",
  "widgets": [
    { "widgetId": "library.recent", "position": 1, "size": "standard" },
    { "widgetId": "library.favorites", "position": 2, "size": "compact" },
    { "widgetId": "assignments.pending", "position": 3, "size": "standard" },
    { "widgetId": "tests.upcoming", "position": 4, "size": "standard" },
    { "widgetId": "notes.recent", "position": 5, "size": "compact" }
  ]
}
```

---

## 5. 🧭 Dynamic Tab System

Tabs are **fully configurable** per customer. No fixed number.

### 5.1 Tab Configuration

```ts
export type TabConfig = {
  tabId: string;
  customerId: string;
  role: string;
  
  // Display
  label: string;
  labelKey?: string;  // i18n key
  icon: string;
  
  // Position
  orderIndex: number;  // 1-10
  enabled: boolean;
  
  // Content
  rootScreenId: string;  // Which screen to show
  screens: string[];     // All screens accessible from this tab
  
  // Behavior
  badge?: TabBadgeConfig;
  requiresOnline?: boolean;
};

export type TabBadgeConfig = {
  type: "count" | "dot" | "none";
  source?: string;  // Query key for count
};
```

### 5.2 Example: 3-Tab Configuration

```json
{
  "customerId": "coaching-xyz",
  "role": "student",
  "tabs": [
    {
      "tabId": "home",
      "label": "Home",
      "icon": "home",
      "orderIndex": 1,
      "rootScreenId": "student-home",
      "screens": ["student-home", "class-detail", "notifications"]
    },
    {
      "tabId": "learn",
      "label": "Learn",
      "icon": "school",
      "orderIndex": 2,
      "rootScreenId": "study-hub",
      "screens": ["study-hub", "library", "resource-viewer", "assignments", "tests"]
    },
    {
      "tabId": "profile",
      "label": "Profile",
      "icon": "person",
      "orderIndex": 3,
      "rootScreenId": "profile-home",
      "screens": ["profile-home", "settings", "help"]
    }
  ]
}
```

### 5.3 Example: 7-Tab Configuration

```json
{
  "customerId": "school-abc",
  "role": "student",
  "tabs": [
    { "tabId": "home", "label": "Home", "icon": "home", "orderIndex": 1, "rootScreenId": "student-home" },
    { "tabId": "schedule", "label": "Schedule", "icon": "calendar", "orderIndex": 2, "rootScreenId": "schedule-screen" },
    { "tabId": "study", "label": "Study", "icon": "library", "orderIndex": 3, "rootScreenId": "study-hub" },
    { "tabId": "ask", "label": "Ask", "icon": "help", "orderIndex": 4, "rootScreenId": "doubts-home" },
    { "tabId": "progress", "label": "Progress", "icon": "trending-up", "orderIndex": 5, "rootScreenId": "progress-home" },
    { "tabId": "social", "label": "Peers", "icon": "people", "orderIndex": 6, "rootScreenId": "peers-home" },
    { "tabId": "profile", "label": "Me", "icon": "person", "orderIndex": 7, "rootScreenId": "profile-home" }
  ]
}
```


---

## 6. 🎨 Widget Rendering Pipeline

### 6.1 Screen Renderer

The `DynamicScreen` component renders any screen from config:

```tsx
function DynamicScreen({ screenId }: { screenId: string }) {
  const { customerId, userId, role } = useAuth();
  const { data: layout } = useScreenLayout(screenId, customerId, role);
  const branding = useCustomerBranding(customerId);  // WHITE-LABEL
  const theme = useCustomerTheme(customerId);        // THEME
  const navigation = useNavigation();
  
  if (!layout) return <ScreenSkeleton />;
  
  const enabledWidgets = layout.widgets
    .filter(w => w.enabled)
    .filter(w => checkVisibilityRules(w.visibleWhen))
    .sort((a, b) => a.position - b.position);
  
  return (
    <ScreenContainer
      layout={layout.layout}
      padding={layout.padding}
      scrollable={layout.scrollable}
      pullToRefresh={layout.pullToRefresh}
      theme={theme}  // Apply customer theme
    >
      {enabledWidgets.map(widgetConfig => {
        const entry = widgetRegistry[widgetConfig.widgetId];
        if (!entry) return <WidgetNotFound key={widgetConfig.widgetId} />;
        
        const { component: WidgetComponent, metadata } = entry;
        
        // Check role access
        if (!metadata.allowedRoles.includes(role)) return null;
        
        // Check permissions
        if (metadata.requiredPermissions) {
          const hasPermission = checkPermissions(metadata.requiredPermissions);
          if (!hasPermission) return null;
        }
        
        return (
          <WidgetErrorBoundary key={widgetConfig.widgetId} widgetId={widgetConfig.widgetId}>
            <WidgetContainer
              metadata={metadata}
              size={widgetConfig.size}
              gridColumn={widgetConfig.gridColumn}
              theme={theme}
            >
              <WidgetComponent
                customerId={customerId}
                userId={userId}
                role={role}
                screenId={screenId}
                tabId={layout.tabId}
                position={widgetConfig.position}
                config={widgetConfig.customProps || {}}
                size={widgetConfig.size}
                branding={branding}  // Pass branding to every widget
                theme={theme}        // Pass theme to every widget
                onNavigate={(route, params) => navigation.navigate(route, params)}
              />
            </WidgetContainer>
          </WidgetErrorBoundary>
        );
      })}
    </ScreenContainer>
  );
}
```

### 6.2 Widget Container

Provides consistent wrapper for all widgets:

```tsx
function WidgetContainer({ 
  metadata, 
  size, 
  gridColumn,
  children 
}: WidgetContainerProps) {
  const theme = useTheme();
  
  return (
    <View style={[
      styles.container,
      { borderRadius: theme.roundness },
      size === "compact" && styles.compact,
      size === "expanded" && styles.expanded,
      gridColumn && { gridColumn: `span ${gridColumn}` },
    ]}>
      {metadata.refreshable && <RefreshIndicator />}
      {children}
    </View>
  );
}
```

---

## 7. 📚 Complete Widget Catalog

All available widgets organized by category:

### 7.1 Schedule Widgets
| Widget ID | Name | Sizes | Roles |
|-----------|------|-------|-------|
| `schedule.today` | Today's Schedule | compact, standard, expanded | all |
| `schedule.weekly` | Weekly Calendar | standard, expanded | all |
| `schedule.upcoming-class` | Next Class Card | compact | student, teacher |
| `schedule.live-now` | Live Classes Now | compact, standard | all |

### 7.2 Study/Content Widgets
| Widget ID | Name | Sizes | Roles |
|-----------|------|-------|-------|
| `library.recent` | Recently Accessed | compact, standard | student |
| `library.favorites` | Favorites | compact, standard | student |
| `library.subjects` | Subject Grid | standard, expanded | student |
| `library.continue` | Continue Learning | compact, standard | student |
| `content.featured` | Featured Content | standard | all |

### 7.3 Assessment Widgets
| Widget ID | Name | Sizes | Roles |
|-----------|------|-------|-------|
| `assignments.pending` | Pending Assignments | compact, standard | student |
| `assignments.submitted` | Submitted | compact | student |
| `assignments.to-grade` | To Grade | standard | teacher |
| `tests.upcoming` | Upcoming Tests | compact, standard | student |
| `tests.results` | Recent Results | compact, standard | student |
| `tests.analytics` | Test Analytics | expanded | student, teacher |

### 7.4 Doubts Widgets
| Widget ID | Name | Sizes | Roles |
|-----------|------|-------|-------|
| `doubts.inbox` | Doubts Inbox | compact, standard | student, teacher |
| `doubts.quick-ask` | Quick Ask Form | compact | student |
| `doubts.answered` | Recently Answered | compact | student |
| `doubts.to-answer` | To Answer | standard | teacher |

### 7.5 Progress Widgets
| Widget ID | Name | Sizes | Roles |
|-----------|------|-------|-------|
| `progress.snapshot` | Progress Overview | compact, standard | student, parent |
| `progress.subject-wise` | Subject Analytics | standard, expanded | student |
| `progress.streak` | Streak & XP | compact | student |
| `progress.goals` | Learning Goals | standard | student |
| `progress.weak-areas` | Weak Areas | standard | student |

### 7.6 Social Widgets
| Widget ID | Name | Sizes | Roles |
|-----------|------|-------|-------|
| `peers.groups` | Study Groups | compact, standard | student |
| `peers.leaderboard` | Leaderboard | compact, standard | student |
| `peers.suggestions` | Peer Suggestions | compact | student |
| `feed.class` | Class Feed | standard, expanded | all |
| `feed.announcements` | Announcements | compact, standard | all |

### 7.7 AI Widgets
| Widget ID | Name | Sizes | Roles |
|-----------|------|-------|-------|
| `ai.tutor-chat` | AI Tutor | expanded | student |
| `ai.recommendations` | AI Recommendations | standard | student |
| `ai.summary` | AI Summary | compact, standard | student |
| `ai.practice` | AI Practice | standard | student |

### 7.8 Profile & Utility Widgets
| Widget ID | Name | Sizes | Roles |
|-----------|------|-------|-------|
| `profile.summary` | Profile Card | compact, standard | all |
| `profile.stats` | User Stats | compact | all |
| `notifications.recent` | Notifications | compact, standard | all |
| `actions.quick` | Quick Actions | standard | all |
| `hero.greeting` | Hero Greeting | standard | all |

### 7.9 Teacher-Specific Widgets
| Widget ID | Name | Sizes | Roles |
|-----------|------|-------|-------|
| `analytics.class-performance` | Class Performance | expanded | teacher |
| `analytics.attendance` | Attendance Overview | standard | teacher |
| `class.roster` | Class Roster | standard | teacher |
| `class.live-controls` | Live Class Controls | expanded | teacher |

### 7.10 Parent-Specific Widgets
| Widget ID | Name | Sizes | Roles |
|-----------|------|-------|-------|
| `child.progress` | Child Progress | standard, expanded | parent |
| `child.schedule` | Child Schedule | standard | parent |
| `child.attendance` | Attendance | compact | parent |
| `child.selector` | Child Selector | compact | parent |

### 7.11 Admin Widgets
| Widget ID | Name | Sizes | Roles |
|-----------|------|-------|-------|
| `admin.stats` | Platform Stats | expanded | admin |
| `admin.users` | User Overview | standard | admin |
| `admin.config` | Config Status | compact | admin |
| `admin.alerts` | System Alerts | compact | admin |


---

## 8. 🛡 Widget Safety & Fallbacks

### 8.1 Error Boundary Per Widget

Every widget is wrapped in an error boundary:

```tsx
<WidgetErrorBoundary widgetId={widgetId}>
  <ActualWidget />
</WidgetErrorBoundary>
```

**Behavior on error:**
- Show fallback card: "This section couldn't be loaded"
- Log to Sentry with widgetId, screenId, customerId
- Other widgets continue rendering normally
- Offer "Retry" button

### 8.2 Missing Widget Handling

If widgetId not found in registry:
- Log `widget_missing_in_registry` error
- Render placeholder: "Widget not available"
- Continue with other widgets
- Never crash the screen

### 8.3 Permission-Based Hiding

If user lacks required permissions:
- Widget is silently hidden (not shown)
- No error displayed
- Log `widget_permission_hidden` for analytics

### 8.4 Offline Behavior

Based on `metadata.offlineBehavior`:
- `show-cached`: Show cached data with "Offline" badge
- `show-placeholder`: Show "Available when online" message
- `hide`: Remove widget from screen entirely

---

## 9. ⚡ Performance Rules

### 9.1 Per-Widget Budgets

| Metric | Budget |
|--------|--------|
| Max queries per widget | 2 |
| Max render time | 100ms |
| Max bundle size per widget | 50KB |
| Skeleton display time | <200ms |

### 9.2 Prefetching Strategy

Widgets with `prefetchOnScreenLoad: true`:
- Data fetched when screen mounts
- Parallel fetching for all prefetch widgets
- Cached for subsequent renders

### 9.3 Lazy Loading

Widgets below the fold:
- Render skeleton initially
- Fetch data when scrolled into view
- Use Intersection Observer pattern

---

## 10. 🧪 Testing Guidelines

### 10.1 Unit Tests
- Widget renders with mock data
- Widget handles loading state
- Widget handles error state
- Widget respects size variants

### 10.2 Integration Tests
- Screen renders correct widgets from config
- Widget order matches config
- Hidden widgets don't render
- Permission gating works

### 10.3 Contract Tests
- All widgetIds in DB exist in registry
- All widgets have required metadata
- Widget props match WidgetProps type

---

## 11. 📌 Summary

The Universal Widget System provides:

✅ **Any widget, anywhere** — No dashboard-only limitation  
✅ **Dynamic tabs** — 1-10 tabs per customer  
✅ **Composable screens** — Build any layout from widgets  
✅ **Role-aware** — Widgets filter by role automatically  
✅ **Permission-aware** — Fine-grained access control  
✅ **Size variants** — Compact, standard, expanded  
✅ **Offline-capable** — Per-widget offline behavior  
✅ **Safe rendering** — Error boundaries prevent cascading failures  
✅ **Performance budgets** — Enforced limits per widget  

**Key Principle:** The UI is 100% config-driven. Every screen is just a container of widgets assembled from database configuration.

```
End of WIDGET_SYSTEM_SPEC.md
```
