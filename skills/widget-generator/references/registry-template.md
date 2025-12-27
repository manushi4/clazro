# Mobile App Registry Template

## Widget Registry Entry

Location: `src/config/widgetRegistry.ts`

```typescript
import { {WidgetName}Widget } from "../components/widgets/{category}/{WidgetName}Widget";

// Add to the registry object:
"{widget.id}": {
  component: {WidgetName}Widget,
  metadata: {
    // === IDENTITY ===
    id: "{widget.id}",
    titleKey: "dashboard:widgets.{widgetKey}.title",
    descriptionKey: "dashboard:widgets.{widgetKey}.subtitle",
    category: "{category}",

    // === ACCESS CONTROL ===
    featureId: "{feature.id}",
    roles: ["student", "teacher", "parent", "admin"],
    requiredPermissions: [],

    // === SIZE VARIANTS ===
    supportedSizes: ["compact", "standard", "expanded"],
    defaultSize: "standard",

    // === DATA POLICY ===
    dataPolicy: {
      maxQueries: 1,
      staleTimeMs: 60000,  // 1 minute
      prefetchOnDashboardLoad: true,
      allowBackgroundRefresh: true,
      offlineBehavior: "show-cached",
    },

    // === DEFAULT CONFIG ===
    defaultConfig: {
      maxItems: 5,
      showIcon: true,
      layoutStyle: "list",
      showViewAll: true,
    },

    // === BEHAVIOR FLAGS ===
    refreshable: true,
    cacheable: true,
    offlineCapable: true,
  },
},
```

## Using buildMetadata Helper

If your project has a `buildMetadata` helper function:

```typescript
"{widget.id}": {
  component: {WidgetName}Widget,
  metadata: buildMetadata(
    "{widget.id}",
    "dashboard:widgets.{widgetKey}.title",
    "dashboard:widgets.{widgetKey}.subtitle",
    "{feature.id}",
    ["{role1}", "{role2}"]
  ),
},
```

## Metadata Fields Reference

### Identity Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Widget ID (must match registry key) |
| `titleKey` | string | Yes | i18n key for title |
| `descriptionKey` | string | No | i18n key for description |
| `category` | WidgetCategory | Yes | Widget category |

### Access Control

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `featureId` | string | - | Required feature ID |
| `roles` | Role[] | all | Allowed user roles |
| `requiredPermissions` | string[] | [] | Required permission codes |

### Size Variants

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `supportedSizes` | WidgetSize[] | all | Supported size variants |
| `defaultSize` | WidgetSize | "standard" | Default size |
| `minHeight` | string | - | Minimum height hint |

### Data Policy

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxQueries` | number | 2 | Max queries per render |
| `staleTimeMs` | number | 60000 | React Query stale time |
| `prefetchOnDashboardLoad` | boolean | false | Prefetch when screen mounts |
| `allowBackgroundRefresh` | boolean | true | Allow background updates |
| `offlineBehavior` | string | "show-cached" | Offline behavior |

### Behavior Flags

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `refreshable` | boolean | true | Can be manually refreshed |
| `cacheable` | boolean | true | Data can be cached |
| `offlineCapable` | boolean | true | Works offline |
| `requiresOnline` | boolean | false | Requires internet |
| `deprecated` | boolean | false | Widget is deprecated |

## Widget Categories

```typescript
type WidgetCategory =
  | "schedule"      // Calendar, timetable, classes
  | "study"         // Library, content, notes
  | "assessment"    // Assignments, tests, quizzes
  | "doubts"        // Q&A, ask teacher
  | "progress"      // Analytics, streaks, goals
  | "social"        // Peers, leaderboard
  | "ai"            // AI tutor, recommendations
  | "profile"       // User profile widgets
  | "notifications" // Notification widgets
  | "actions"       // Quick action widgets
  | "content"       // Content display widgets
  | "analytics"     // Analytics/reporting
  | "parent"        // Parent-specific
  | "admin";        // Admin dashboard
```

## Default Config Patterns

### Display Widget
```typescript
defaultConfig: {
  maxItems: 5,
  showIcon: true,
  showDate: true,
  layoutStyle: "list",
  showViewAll: true,
}
```

### Stats Widget
```typescript
defaultConfig: {
  showTrend: true,
  showPercentage: true,
  compactMode: false,
}
```

### Action Widget
```typescript
defaultConfig: {
  columns: 4,
  showLabels: true,
  iconSize: "medium",
}
```

### Preview Widget
```typescript
defaultConfig: {
  maxItems: 3,
  showViewAll: true,
  previewMode: true,
}
```

## Import Statement Pattern

Add import at top of `widgetRegistry.ts`:

```typescript
// Existing imports
import { ExistingWidget } from "../components/widgets/category/ExistingWidget";

// Add new import
import { {WidgetName}Widget } from "../components/widgets/{category}/{WidgetName}Widget";
```

## Export from Widget Index

If category has an `index.ts`, add export:

`src/components/widgets/{category}/index.ts`:
```typescript
export { {WidgetName}Widget } from "./{WidgetName}Widget";
```

## Widget Icon Mapping

If your project uses an icon mapping, add to `WidgetContainer.tsx`:

```typescript
const WIDGET_ICONS: Record<string, string> = {
  // Existing icons
  "schedule.today": "calendar-today",
  "progress.weekly": "chart-line",

  // Add new widget icon
  "{widget.id}": "{icon-name}",
};
```

Icon names are from `MaterialCommunityIcons`.

## Offline Behavior Options

| Value | Description |
|-------|-------------|
| `"show-cached"` | Show cached data with offline badge |
| `"show-placeholder"` | Show "Available when online" |
| `"hide"` | Hide widget when offline |
