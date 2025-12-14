# Widget Development Guide

This guide explains how to create, configure, and sync widgets across the Mobile App, Platform Studio, and Database.

---

## 🚀 Quick Start: Complete Widget Creation Checklist

Use this checklist when creating a new widget from scratch. It covers all required steps including localization and dark mode support.

### Phase 1: Database Setup (if widget needs dynamic content)

```sql
-- 1. Create content table with localized columns
CREATE TABLE my_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  title_en TEXT NOT NULL,
  title_hi TEXT,
  description_en TEXT,
  description_hi TEXT,
  -- other fields...
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Insert sample data with both languages
INSERT INTO my_content (customer_id, title_en, title_hi) VALUES
  ('your-customer-id', 'English Title', 'हिंदी शीर्षक');
```

### Phase 2: Query Hook

Create `src/hooks/queries/useMyContentQuery.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';

export function useMyContentQuery() {
  const customerId = useCustomerId();
  
  return useQuery({
    queryKey: ['my-content', customerId],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('my_content')
        .select('*')
        .eq('customer_id', customerId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5,
  });
}
```

### Phase 3: Widget Component

Create `src/components/widgets/category/MyWidget.tsx`:

```tsx
import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import { useMyContentQuery } from "../../../hooks/queries/useMyContentQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

export const MyWidget: React.FC<WidgetProps> = ({ config, onNavigate }) => {
  // 1. Theme colors (auto dark mode support)
  const { colors } = useAppTheme();
  
  // 2. Translations for static UI text
  const { t } = useTranslation("dashboard");
  
  // 3. Fetch localized content from database
  const { data, isLoading, error } = useMyContentQuery();

  // 4. Loading state
  if (isLoading) {
    return <ActivityIndicator color={colors.primary} />;
  }

  // 5. Empty state with translated text
  if (!data?.length) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.surfaceVariant }]}>
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.myWidget.states.empty")}
        </AppText>
      </View>
    );
  }

  // 6. Render with localized content
  return (
    <View style={styles.container}>
      {data.map(item => (
        <View key={item.id} style={[styles.item, { backgroundColor: colors.surfaceVariant }]}>
          {/* Dynamic content - use getLocalizedField */}
          <AppText style={{ color: colors.onSurface }}>
            {getLocalizedField(item, 'title')}
          </AppText>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 8 },
  item: { padding: 12, borderRadius: 10 },
  empty: { padding: 20, alignItems: "center" },
});
```

### Phase 4: Translations

Add to `src/locales/en/dashboard.json`:
```json
{
  "widgets": {
    "myWidget": {
      "title": "My Widget",
      "subtitle": "Widget description",
      "states": { "empty": "No items", "loading": "Loading..." },
      "actions": { "viewAll": "View All" }
    }
  }
}
```

Add to `src/locales/hi/dashboard.json`:
```json
{
  "widgets": {
    "myWidget": {
      "title": "मेरा विजेट",
      "subtitle": "विजेट विवरण",
      "states": { "empty": "कोई आइटम नहीं", "loading": "लोड हो रहा है..." },
      "actions": { "viewAll": "सभी देखें" }
    }
  }
}
```

### Phase 5: Register Widget

Add to `src/config/widgetRegistry.ts`:
```typescript
"my.widget": {
  component: MyWidget,
  metadata: {
    id: "my.widget",
    titleKey: "dashboard:widgets.myWidget.title",
    category: "content",
    featureId: "my.feature",
    roles: ["student"],
    dataPolicy: { maxQueries: 1, staleTimeMs: 60000 },
  },
},
```

### Phase 6: Platform Studio

Add to `platform-studio/src/config/widgetRegistry.ts`:
```typescript
"my.widget": {
  id: "my.widget",
  name: "My Widget",
  category: "content",
  icon: "star",
  allowedRoles: ["student"],
},
```

### Phase 7: Database Screen Layout

```sql
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled)
VALUES ('your-customer-id', 'student', 'student-home', 'my.widget', 5, true);
```

### ✅ Verification Checklist

#### Mobile App
- [ ] Widget renders with theme colors (no hardcoded colors)
- [ ] Dark mode works automatically
- [ ] Content shows in Hindi when language is changed
- [ ] Static UI text uses `t()` translation keys
- [ ] Dynamic content uses `getLocalizedField()`
- [ ] Loading/empty/error states are handled
- [ ] Navigation routes are registered (if using `onNavigate`)

#### Platform Studio Sync (CRITICAL)
- [ ] Widget appears in Platform Studio widget palette
- [ ] Config schema added to `WIDGET_CONFIGS` in `WidgetPropertiesPanel.tsx`
- [ ] Layout options match what widget supports (e.g., only `list`/`grid` if widget doesn't support `cards`)
- [ ] Config keys match exactly between Platform Studio and mobile widget
- [ ] Default values are identical in both places
- [ ] Widget added to `LAYOUT_STYLE_WIDGETS` if it supports layout styles
- [ ] Widget-specific layout options added to `WIDGET_LAYOUT_OPTIONS` if needed
- [ ] Preview component added to `DevicePreview.tsx`

#### Database
- [ ] Widget added to `screen_layouts` table
- [ ] `custom_props` JSON has valid values for all config keys

#### Testing
- [ ] Change config in Platform Studio → Save → Pull to refresh in mobile → Changes reflect
- [ ] Toggle boolean options → Widget shows/hides elements correctly
- [ ] Change layout style → Widget renders correct layout

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      WIDGET SYSTEM FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Platform Studio ──save──> Supabase DB ──realtime──> Mobile App │
│       │                        │                         │      │
│       ▼                        ▼                         ▼      │
│  DevicePreview          screen_layouts            DynamicScreen │
│  (HTML/CSS)             (widget configs)         (React Native) │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Widget ID Convention

Use dot notation: `category.name`
- `hero.greeting` - Hero greeting card
- `schedule.today` - Today's schedule
- `actions.quick` - Quick action buttons
- `progress.snapshot` - Progress overview
- `doubts.inbox` - Doubts list
- `assignments.pending` - Pending assignments

**Important:** Widget ID must be IDENTICAL across all 3 places:
1. Mobile App widget registry
2. Platform Studio widget registry
3. Database `screen_layouts.widget_id`

---

## Step 1: Create Mobile App Widget

### 1.1 Create Widget Component

Location: `src/components/widgets/{category}/MyWidget.tsx`

```tsx
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export const MyWidget: React.FC<WidgetProps> = ({ 
  config,      // Config from Platform Studio (custom_props)
  onNavigate,  // Navigation callback
  branding,    // Customer branding
  theme,       // Customer theme
  userId,      // Current user ID
  role,        // Current user role
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("dashboard");

  // Read config options with defaults
  const maxItems = (config?.maxItems as number) || 3;
  const showIcon = config?.showIcon !== false;
  const layoutStyle = (config?.layoutStyle as string) || "list";

  // Handle tap actions
  const handleItemPress = (itemId: string) => {
    onNavigate?.(`my-widget/${itemId}`);
  };

  return (
    <View style={styles.container}>
      {/* Widget content */}
      <TouchableOpacity onPress={() => handleItemPress("123")}>
        <AppText style={{ color: colors.onSurface }}>
          {t("widgets.myWidget.title")}
        </AppText>
      </TouchableOpacity>
    </View>
  );
};
```

### ⚠️ CRITICAL: Navigation Route Registration

**If your widget uses `onNavigate()`, the target route MUST be registered in the navigator.**

#### Step 1: Register in Route Registry
Location: `src/navigation/routeRegistry.ts`
```typescript
const registry: Record<string, RouteDefinition> = {
  // Add your route
  "my-screen": { screenId: "my-screen", component: MyScreen },
};
```

#### Step 2: Add to Common Screens (if accessible from any tab)
Location: `src/navigation/DynamicTabNavigator.tsx`
```typescript
const COMMON_SCREENS = [
  { screenId: "settings", component: SettingsScreen },
  { screenId: "my-screen", component: MyScreen },  // Add here
];
```

#### Common Navigation Patterns
```typescript
// Navigate to existing screen
onNavigate?.("settings");

// Navigate with params
onNavigate?.("assignment-detail", { id: "123" });

// Navigate to screen that doesn't exist yet - will show "Coming Soon" alert
onNavigate?.("future-feature");
```

#### Verification
- [ ] Route is registered in `routeRegistry.ts`
- [ ] If accessible from any tab, added to `COMMON_SCREENS`
- [ ] Test navigation works from widget

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
});
```

### 1.2 WidgetProps Interface (Complete)

Per [WIDGET_SYSTEM_SPEC.md](./WIDGET_SYSTEM_SPEC.md):

```typescript
// src/types/widget.types.ts
export type WidgetProps = {
  // === CONTEXT ===
  customerId: string;           // Current customer/tenant ID
  userId: string;               // Current user ID
  role: Role;                   // "student" | "teacher" | "parent" | "admin"
  
  // === PLACEMENT INFO ===
  screenId?: string;            // Which screen this widget is on
  tabId?: string;               // Which tab this screen belongs to
  position?: number;            // Order position on the screen
  
  // === CONFIGURATION ===
  config: WidgetRuntimeConfig;  // Layout-level custom props from DB (custom_props)
  size?: WidgetSize;            // "compact" | "standard" | "expanded"
  
  // === BRANDING (WHITE-LABEL) ===
  branding?: CustomerBranding;  // Logo, text overrides, feature names
  theme?: ThemeConfig;          // Colors, fonts, radius
  
  // === ACTIONS ===
  onNavigate: (route: string, params?: Record<string, unknown>) => void;
  onAction?: (event: WidgetActionEvent) => void;  // Custom widget actions
  onRefresh?: () => void;       // Manual refresh trigger
};

// Branding type for white-label support
export type CustomerBranding = {
  appName: string;              // "SchoolX Learning"
  logoUrl: string;              // Main logo URL
  logoSmallUrl: string;         // Small/icon logo
  aiTutorName: string;          // "Ask Guru" / "Study Buddy"
  doubtSectionName: string;     // "Ask Doubts" / "Get Help"
  assignmentName: string;       // "Homework" / "Assignment"
  testName: string;             // "Quiz" / "Test" / "Assessment"
  liveClassName: string;        // "Live Class" / "Online Session"
  textOverrides: Record<string, string>;  // Any custom text overrides
};

// Theme config for styling
export type ThemeConfig = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  errorColor: string;
  fontFamily: string;
  roundness: number;
  cardElevation: "none" | "small" | "medium" | "large";
};
```

### 1.3 WidgetMetadata Interface (Complete)

Every widget needs metadata for the registry:

```typescript
export type WidgetMetadata = {
  // === IDENTITY ===
  id: WidgetId;                 // "my.widget" - must match registry key
  name?: string;                // "My Widget" - display name
  titleKey?: string;            // "dashboard:widgets.myWidget.title" - i18n key
  description?: string;         // Human-readable description
  descriptionKey?: string;      // i18n key for description
  category: WidgetCategory;     // "schedule" | "study" | "assessment" | etc.
  
  // === PLACEMENT RULES ===
  roles: Role[];                // ["student", "teacher", "parent", "admin"]
  allowedScreenTypes?: Array<"dashboard" | "list" | "detail" | "hub" | "any">;
  
  // === SIZE VARIANTS ===
  supportedSizes?: WidgetSize[];  // ["compact", "standard", "expanded"]
  defaultSize?: WidgetSize;       // "standard"
  minHeight?: "xs" | "sm" | "md" | "lg";
  maxHeight?: number;
  
  // === DEPENDENCIES ===
  featureId: FeatureId;           // Required feature ID
  requiredPermissions?: PermissionCode[];  // ["view_schedule", "edit_schedule"]
  dependencies?: WidgetId[];      // Other widgets this depends on
  
  // === DATA POLICY ===
  dataPolicy: WidgetDataPolicy;
  defaultConfig: WidgetDefaultConfig;
  
  // === BEHAVIOR FLAGS ===
  refreshable?: boolean;          // Can be manually refreshed
  cacheable?: boolean;            // Data can be cached
  offlineCapable?: boolean;       // Works offline
  requiresOnline?: boolean;       // Requires internet connection
  
  // === VERSIONING ===
  deprecated?: boolean;           // Widget is deprecated
  replacementId?: WidgetId;       // Replacement widget ID
  version?: string;               // Widget version
};

export type WidgetDataPolicy = {
  maxQueries: number;             // Max queries per render (budget: 2)
  staleTimeMs: number;            // React Query stale time
  cacheKey?: (props: WidgetProps) => string[];
  prefetchOnDashboardLoad?: boolean;  // Prefetch when screen mounts
  allowBackgroundRefresh?: boolean;
  offlineBehavior?: "show-cached" | "show-placeholder" | "hide";
};

export type WidgetCategory = 
  | "schedule"      // Schedule/calendar widgets
  | "study"         // Study/content widgets
  | "assessment"    // Assignments/tests widgets
  | "doubts"        // Doubts/Q&A widgets
  | "progress"      // Progress/analytics widgets
  | "social"        // Social/peer widgets
  | "ai"            // AI-powered widgets
  | "profile"       // Profile/settings widgets
  | "notifications" // Notification widgets
  | "actions"       // Quick action widgets
  | "content"       // Content display widgets
  | "analytics";    // Analytics/reporting widgets
```

### 1.4 Register in Widget Registry

Location: `src/config/widgetRegistry.ts`

```typescript
import { MyWidget } from "../components/widgets/category/MyWidget";

const registry: Record<WidgetId, WidgetRegistryEntry> = {
  // ... existing widgets
  
  "my.widget": {
    component: MyWidget,
    metadata: {
      id: "my.widget",
      titleKey: "dashboard:widgets.myWidget.title",
      descriptionKey: "dashboard:widgets.myWidget.subtitle",
      category: "content",
      featureId: "feature.id",
      roles: ["student", "teacher"],
      supportedSizes: ["compact", "standard", "expanded"],
      defaultSize: "standard",
      requiredPermissions: ["view_content"],
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 60000,
        prefetchOnDashboardLoad: true,
        allowBackgroundRefresh: true,
        offlineBehavior: "show-cached",
      },
      defaultConfig: {
        maxItems: 3,
        showIcon: true,
        layoutStyle: "list",
      },
      refreshable: true,
      cacheable: true,
      offlineCapable: true,
    },
  },
};

// Or use the helper function for simpler cases:
"my.widget": {
  component: MyWidget,
  metadata: buildMetadata(
    "my.widget",
    "dashboard:widgets.myWidget.title",
    "dashboard:widgets.myWidget.subtitle",
    "feature.id"
  ),
},
```

### 1.4 Add Icon Mapping

Location: `src/components/widgets/base/WidgetContainer.tsx`

```typescript
const WIDGET_ICONS: Record<string, string> = {
  // ... existing icons
  "my.widget": "star-outline",  // MaterialCommunityIcons name
};
```

---

## Step 1.5: Theming - Using Theme Colors (CRITICAL)

**All widgets MUST use theme colors from `useAppTheme()` instead of hardcoded colors.**

This ensures widgets automatically update when the customer changes their theme in Platform Studio.

### 1.5.1 Available Theme Colors

```typescript
const { colors, borderRadius, elevation, componentStyles } = useAppTheme();

// Primary colors
colors.primary          // Main brand color
colors.onPrimary        // Text on primary
colors.primaryContainer // Light primary background
colors.secondary        // Secondary brand color
colors.tertiary         // Accent color

// Status colors (from Platform Studio theme)
colors.success          // Success states (green)
colors.warning          // Warning states (orange)
colors.error            // Error states (red)
colors.info             // Info states (blue)

// Surface colors
colors.surface          // Card backgrounds
colors.surfaceVariant   // Subtle backgrounds
colors.background       // Screen background
colors.onSurface        // Text on surface
colors.onSurfaceVariant // Secondary text
colors.outline          // Borders

// Border radius
borderRadius.small      // 4px default
borderRadius.medium     // 8px default
borderRadius.large      // 16px default
```

### 1.5.2 DO: Use Theme Colors

```tsx
import { useAppTheme } from "../../../theme/useAppTheme";

export const MyWidget: React.FC<WidgetProps> = ({ config }) => {
  const { colors, borderRadius } = useAppTheme();

  // ✅ CORRECT - Use theme colors
  const CATEGORY_COLORS: Record<string, string> = {
    Mathematics: colors.primary,
    Physics: colors.success,
    Chemistry: colors.warning,
    English: colors.tertiary,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.card, { 
        backgroundColor: colors.surfaceVariant,
        borderRadius: borderRadius.medium,
      }]}>
        <Icon name="star" size={18} color={colors.warning} />
        <AppText style={{ color: colors.onSurface }}>Title</AppText>
        <AppText style={{ color: colors.onSurfaceVariant }}>Subtitle</AppText>
      </View>
      
      {/* Status badges */}
      <View style={{ backgroundColor: colors.successContainer }}>
        <AppText style={{ color: colors.success }}>Completed</AppText>
      </View>
      <View style={{ backgroundColor: colors.warningContainer }}>
        <AppText style={{ color: colors.warning }}>Pending</AppText>
      </View>
      <View style={{ backgroundColor: colors.errorContainer }}>
        <AppText style={{ color: colors.error }}>Overdue</AppText>
      </View>
    </View>
  );
};
```

### 1.5.3 DON'T: Hardcode Colors

```tsx
// ❌ WRONG - Hardcoded colors won't update with theme
const CATEGORY_COLORS = {
  Mathematics: "#6366F1",  // ❌ Hardcoded
  Physics: "#10B981",      // ❌ Hardcoded
};

<Icon name="star" size={18} color="#F59E0B" />  // ❌ Hardcoded
<View style={{ borderRadius: 12 }}>             // ❌ Hardcoded
```

### 1.5.4 Color Mapping Pattern

For widgets with multiple categories/types, create a color map inside the component:

```tsx
export const MyWidget: React.FC<WidgetProps> = ({ config }) => {
  const { colors } = useAppTheme();

  // Define color map INSIDE component to access theme colors
  const TYPE_COLORS: Record<string, string> = {
    class: colors.primary,
    lab: colors.success,
    assignment: colors.warning,
    test: colors.error,
    live: colors.tertiary,
  };

  // For actions/buttons with backgrounds
  const getActionColor = (colorKey: string) => {
    const colorMap: Record<string, string> = {
      primary: colors.primary,
      secondary: colors.secondary,
      tertiary: colors.tertiary,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
    };
    return colorMap[colorKey] || colors.primary;
  };

  // Use with opacity for backgrounds
  const bgColor = `${TYPE_COLORS[item.type]}15`; // 15 = ~9% opacity
};
```

### 1.5.5 Theme-Aware Styling Checklist

Every widget MUST use theme for:
- ✅ Text colors (`colors.onSurface`, `colors.onSurfaceVariant`)
- ✅ Background colors (`colors.surface`, `colors.surfaceVariant`)
- ✅ Icon colors (`colors.primary`, `colors.success`, etc.)
- ✅ Border colors (`colors.outline`, `colors.outlineVariant`)
- ✅ Status colors (`colors.success`, `colors.warning`, `colors.error`)
- ✅ Border radius (`borderRadius.small`, `borderRadius.medium`, `borderRadius.large`)

---

## Step 2: Platform Studio Configuration

### ⚠️ CRITICAL: Config Schema Sync Rules

**The config options in Platform Studio MUST match what the mobile widget supports.**

Common issues and how to avoid them:

#### Issue 1: Layout Style Mismatch
Platform Studio shows `["list", "cards", "grid", "timeline"]` but widget only supports `["list", "grid"]`.

**Solution:** Add widget-specific layout options in `WidgetPropertiesPanel.tsx`:
```typescript
// Widget-specific layout options
const WIDGET_LAYOUT_OPTIONS: Record<string, string[]> = {
  "profile.quickLinks": ["list", "grid"],
  "profile.card": ["horizontal", "vertical"],
  "schedule.today": ["list", "timeline", "cards"],
  default: ["list", "cards", "grid", "timeline"],
};
```

#### Issue 2: Config Key Mismatch
Platform Studio saves `custom_props.showEditProfile` but widget reads `config.editProfileVisible`.

**Solution:** Use IDENTICAL keys in both places:
```typescript
// Platform Studio schema
{ key: "showEditProfile", label: "Show Edit Profile", type: "boolean", default: true }

// Mobile widget
const showEditProfile = config?.showEditProfile !== false;
```

#### Issue 3: Default Value Mismatch
Platform Studio default is `"cards"` but widget defaults to `"list"`.

**Solution:** Match defaults in both places:
```typescript
// Platform Studio
{ key: "layoutStyle", type: "select", options: ["list", "grid"], default: "list" }

// Mobile widget
const layoutStyle = (config?.layoutStyle as "list" | "grid") || "list";
```

#### Verification Checklist
- [ ] All config keys in Platform Studio schema exist in mobile widget
- [ ] Layout style options match what widget actually renders
- [ ] Default values are identical in both places
- [ ] Boolean conditions use same logic (`!== false` vs `=== true`)

---

### 2.1 Register Widget Metadata

Location: `platform-studio/src/config/widgetRegistry.ts`

```typescript
export const widgetRegistry: Record<string, WidgetMetadata> = {
  // ... existing widgets
  
  "my.widget": {
    id: "my.widget",
    name: "My Widget",
    description: "Description of what this widget does",
    category: "category",  // schedule, study, progress, etc.
    icon: "star",
    allowedRoles: ["student", "teacher", "parent"],
    allowedScreenTypes: ["dashboard", "hub"],
    supportedSizes: ["compact", "standard", "expanded"],
    defaultSize: "standard",
    requiredFeatureId: "feature.id",  // Optional
  },
};
```

### 2.2 Add Config Schema

Location: `platform-studio/src/components/builder/WidgetPropertiesPanel.tsx`

```typescript
const WIDGET_CONFIGS: Record<string, WidgetConfigSchema> = {
  // ... existing configs
  
  "my.widget": {
    sections: [
      {
        title: "Display",
        icon: "📊",
        fields: [
          { 
            key: "maxItems", 
            label: "Max Items", 
            type: "number", 
            min: 1, 
            max: 10, 
            default: 3 
          },
          { 
            key: "layoutStyle", 
            label: "Layout", 
            type: "select", 
            options: ["list", "grid", "cards"], 
            default: "list" 
          },
          { 
            key: "showIcon", 
            label: "Show Icons", 
            type: "boolean", 
            default: true 
          },
        ],
      },
      {
        title: "Actions",
        icon: "⚡",
        fields: [
          { 
            key: "enableTap", 
            label: "Enable Tap", 
            type: "boolean", 
            default: true 
          },
          { 
            key: "showViewAll", 
            label: "Show View All", 
            type: "boolean", 
            default: true 
          },
        ],
      },
    ],
  },
};
```

### 2.3 Add Preview Component

Location: `platform-studio/src/components/preview/DevicePreview.tsx`

```typescript
// Add to WIDGET_TITLES
const WIDGET_TITLES: Record<string, { title: string; subtitle: string }> = {
  // ... existing
  "my.widget": { title: "My Widget", subtitle: "Widget description" },
};

// Add to WIDGET_ICONS
const WIDGET_ICONS: Record<string, string> = {
  // ... existing
  "my.widget": "⭐",
};

// Add case in WidgetContent switch
function WidgetContent({ widgetId, theme, props, size }) {
  switch (widgetId) {
    // ... existing cases
    case "my.widget":
      return <MyWidgetPreview theme={theme} props={props} />;
  }
}

// Create preview component
function MyWidgetPreview({ theme, props }: any) {
  const textColor = theme.text_color || "#1C1B1F";
  const bgVariant = theme.background_color || "#F5F5F5";
  
  const maxItems = (props.maxItems as number) || 3;
  const showIcon = props.showIcon !== false;

  return (
    <div className="space-y-1.5">
      {[1, 2, 3].slice(0, maxItems).map((i) => (
        <div key={i} className="p-2 rounded-lg" style={{ backgroundColor: bgVariant }}>
          {showIcon && <span>⭐</span>}
          <span className="text-[8px]" style={{ color: textColor }}>Item {i}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## Step 3: Database Configuration

Per [DB_SCHEMA_REFERENCE.md](./DB_SCHEMA_REFERENCE.md):

### 3.1 Screen Layout Schema (Complete)

The `screen_layouts` table stores widget placement per customer/role/screen:

```typescript
// ScreenWidgetConfig - what gets stored in DB
export type ScreenWidgetConfig = {
  // === IDENTITY ===
  id: string;                   // UUID primary key
  customer_id: string;          // Customer/tenant ID
  role: string;                 // "student" | "teacher" | "parent" | "admin"
  screen_id: string;            // Which screen (e.g., "student-home")
  widget_id: string;            // Widget ID (must match registry)
  
  // === PLACEMENT ===
  position: number;             // Order on screen (1, 2, 3...)
  size: WidgetSize;             // "compact" | "standard" | "expanded"
  enabled: boolean;             // Is widget visible?
  
  // === GRID LAYOUT (optional) ===
  grid_column?: number;         // Column span (1-12) for grid layouts
  grid_row?: number;            // Row span for grid layouts
  
  // === CUSTOM CONFIGURATION ===
  custom_props?: Record<string, unknown>;  // Widget-specific config
  
  // === VISIBILITY RULES ===
  visibility_rules?: VisibilityRule[];     // Conditional visibility
  
  // === TIMESTAMPS ===
  created_at: string;
  updated_at: string;
};

// Visibility rules for conditional display
export type VisibilityRule = {
  type: "permission" | "feature" | "online" | "time" | "custom";
  condition: string;            // "enabled" | "disabled" | "equals" | etc.
  value: any;                   // The value to check against
};
```

### 3.2 Add Widget to Screen

Via Platform Studio (recommended) or SQL:

```sql
INSERT INTO screen_layouts (
  customer_id,
  role,
  screen_id,
  widget_id,
  position,
  size,
  enabled,
  custom_props,
  visibility_rules
) VALUES (
  'customer-uuid',
  'student',
  'student-home',
  'my.widget',
  7,
  'standard',
  true,
  '{"maxItems": 5, "showIcon": true, "layoutStyle": "cards"}',
  '[{"type": "feature", "condition": "enabled", "value": "my-feature"}]'
);
```

### 3.3 Custom Props Examples

```json
// Display options
{
  "maxItems": 5,              // Number of items to show
  "showIcon": true,           // Show/hide icons
  "showDate": true,           // Show/hide dates
  "showBadge": true,          // Show/hide badges
  "layoutStyle": "cards",     // "list" | "grid" | "cards"
  "columns": 2,               // Grid columns
  "itemHeight": 80            // Item height in pixels
}

// Content options
{
  "title": "Custom Title",    // Override widget title
  "subtitle": "Custom Sub",   // Override subtitle
  "emptyMessage": "Nothing",  // Custom empty state message
  "filterBy": "recent",       // Data filter
  "sortBy": "date",           // Sort order
  "sortDirection": "desc"     // "asc" | "desc"
}

// Behavior options
{
  "enableTap": true,          // Enable item tap
  "showViewAll": true,        // Show "View All" button
  "autoRefresh": true,        // Auto-refresh data
  "refreshInterval": 60000,   // Refresh interval (ms)
  "enableSwipe": true,        // Enable swipe actions
  "enablePullToRefresh": true // Enable pull-to-refresh
}

// Styling options
{
  "accentColor": "#6366F1",   // Custom accent color
  "borderRadius": 12,         // Custom border radius
  "padding": "md",            // "none" | "sm" | "md" | "lg"
  "elevation": "small"        // "none" | "small" | "medium" | "large"
}
```

### 3.4 Visibility Rules Examples

```json
// Show only if user has permission
[{"type": "permission", "condition": "has", "value": "assignments.view"}]

// Show only if feature is enabled
[{"type": "feature", "condition": "enabled", "value": "ai.tutor"}]

// Show only when online
[{"type": "online", "condition": "equals", "value": true}]

// Show during specific time
[{"type": "time", "condition": "between", "value": {"start": "08:00", "end": "18:00"}}]

// Multiple conditions (AND)
[
  {"type": "feature", "condition": "enabled", "value": "premium"},
  {"type": "permission", "condition": "has", "value": "premium.access"}
]
```

### 3.5 Screen IDs

Widgets can be placed on ANY screen:
- `student-home`, `teacher-home`, `parent-home`, `admin-home`
- `study-hub`, `doubts-home`, `progress-home`, `profile-home`
- Any custom screen defined in navigation tabs

---

## Step 4: Internationalization (i18n)

Per [I18N_MULTILANGUAGE_SPEC.md](./I18N_MULTILANGUAGE_SPEC.md):

### 4.1 Translation Key Structure

Use hierarchical keys: `namespace:section.widget.property`

```
dashboard:widgets.myWidget.title
dashboard:widgets.myWidget.states.loading
dashboard:widgets.myWidget.actions.viewAll
```

### 4.2 Add Translation Files

Location: `src/i18n/locales/en/dashboard.json`

```json
{
  "widgets": {
    "myWidget": {
      "title": "My Widget",
      "subtitle": "Widget description",
      "states": {
        "loading": "Loading...",
        "empty": "No items to display",
        "error": "Failed to load data",
        "offline": "Available when online"
      },
      "actions": {
        "viewAll": "View All",
        "retry": "Try Again",
        "refresh": "Refresh"
      },
      "labels": {
        "count_one": "{{count}} item",
        "count_other": "{{count}} items"
      }
    }
  }
}
```

Location: `src/i18n/locales/hi/dashboard.json`

```json
{
  "widgets": {
    "myWidget": {
      "title": "मेरा विजेट",
      "subtitle": "विजेट विवरण",
      "states": {
        "loading": "लोड हो रहा है...",
        "empty": "प्रदर्शित करने के लिए कोई आइटम नहीं",
        "error": "डेटा लोड करने में विफल",
        "offline": "ऑनलाइन होने पर उपलब्ध"
      },
      "actions": {
        "viewAll": "सभी देखें",
        "retry": "पुनः प्रयास करें",
        "refresh": "रीफ्रेश करें"
      },
      "labels": {
        "count_one": "{{count}} आइटम",
        "count_other": "{{count}} आइटम"
      }
    }
  }
}
```

### 4.3 Use Translations in Widget

```tsx
import { useTranslation } from "react-i18next";

const { t, i18n } = useTranslation("dashboard");
const isRTL = i18n.dir() === "rtl";

// Basic translation
<AppText>{t("widgets.myWidget.title")}</AppText>

// Pluralization
<AppText>{t("widgets.myWidget.labels.count", { count: items.length })}</AppText>

// Conditional text
<AppText>
  {isLoading 
    ? t("widgets.myWidget.states.loading")
    : t("widgets.myWidget.title")
  }
</AppText>

// RTL-aware styling
<View style={[styles.container, isRTL && styles.rtl]}>
```

### 4.4 Date/Time Localization

```tsx
import { formatRelativeTime, formatDate } from "../../../utils/dateUtils";

// Relative time ("2 hours ago" / "2 घंटे पहले")
<AppText>{formatRelativeTime(item.createdAt, i18n.language)}</AppText>

// Formatted date
<AppText>{formatDate(item.dueDate, i18n.language)}</AppText>
```

### 4.5 Number/Currency Formatting

```tsx
// Numbers with locale-specific formatting
const formattedScore = new Intl.NumberFormat(i18n.language).format(score);

// Currency (if applicable)
const formattedPrice = new Intl.NumberFormat(i18n.language, {
  style: "currency",
  currency: "INR"
}).format(price);
```

### 4.6 Customer Text Overrides (White-Label)

Per I18N spec, customer branding can override translations:

```tsx
import { useBranding } from "../../../context/BrandingContext";

const { branding } = useBranding();

// Check for customer override first
const title = branding?.textOverrides?.["widget_title"] || t("widgets.myWidget.title");
```

---

## Step 5: Navigation

### 5.1 Widget Navigation Callback

```tsx
// In your widget
const handlePress = (itemId: string) => {
  onNavigate?.("my-route", { id: itemId });
  // or
  onNavigate?.(`detail/${itemId}`);
};
```

### 5.2 Route Mapping in DynamicScreen

Location: `src/navigation/DynamicScreen.tsx`

```typescript
const routeMap: Record<string, { screen: string; params?: any }> = {
  // Add your routes
  "my-route": { screen: "MyDetailScreen" },
  "detail": { screen: "DetailScreen" },
};
```

### 5.3 Navigation Flow

```
Widget tap → onNavigate("route/123") → DynamicScreen.handleWidgetNavigate
    → routeMap lookup → navigation.navigate(screen, params)
    → If screen doesn't exist → "Coming Soon" alert
```

---

## Step 6: Offline Support

Per [OFFLINE_SUPPORT_SPEC.md](./OFFLINE_SUPPORT_SPEC.md):

### 6.1 Data Caching with React Query

```tsx
import { useNetworkStatus } from "../../../offline/networkStore";

const { isOnline } = useNetworkStatus();

const { data, isLoading, error } = useQuery({
  queryKey: ["my-widget-data", userId],
  queryFn: fetchMyWidgetData,
  staleTime: 1000 * 60 * 60,  // 1 hour for offline-friendly
  gcTime: 30 * 60 * 1000,     // 30 minutes cache
  enabled: isOnline || !!cachedData,  // Allow cached data offline
  retry: isOnline ? 2 : 0,    // No retries when offline
});
```

### 6.2 Offline Behavior Options

Widget metadata defines offline behavior:

```typescript
metadata: {
  requiresOnline: false,  // Can work offline
  offlineBehavior: "show-cached", // Options: "show-cached" | "show-placeholder" | "hide"
  dataPolicy: {
    prefetchOnDashboardLoad: true,
    allowBackgroundRefresh: true,
    staleTimeMs: 60 * 60 * 1000,  // 1 hour
  },
}
```

### 6.3 Handle Offline States in Widget

```tsx
const { isOnline } = useNetworkStatus();

// Show cached data with offline badge
if (!isOnline && data) {
  return (
    <View>
      <OfflineBadge />
      {/* Render cached data */}
    </View>
  );
}

// No cached data and offline
if (!isOnline && !data) {
  return <WidgetOfflinePlaceholder message="Available when online" />;
}
```

### 6.4 Offline Rules by Widget Type

| Widget Type | Offline Behavior |
|-------------|------------------|
| Dashboard widgets | Show cached + badge |
| Study Library | Show cached metadata |
| Notes | Always available (local) |
| Live Classes | Show "Requires internet" |
| AI Tutor | Show "Requires internet" |
| Doubts list | Show cached, disable create |

### 6.5 Offline Mutation Queue

For widgets that need to submit data when offline, use the mutation queue:

```tsx
import { useOfflineMutation } from "../../../hooks/useOfflineMutation";

const { mutate, isLoading, isQueued, isOnline } = useOfflineMutation('submit_assignment', {
  onSuccess: () => Toast.show({ type: 'success', text1: 'Submitted!' }),
  onQueued: () => Toast.show({ type: 'info', text1: 'Saved offline, will sync when online' }),
  onError: (err) => Toast.show({ type: 'error', text1: err.message }),
});

const handleSubmit = async () => {
  await mutate({
    assignmentId: '123',
    studentId: userId,
    answers: [...],
    submittedAt: new Date().toISOString(),
  });
};

// Show queue status
{isQueued && <Text>Queued for sync</Text>}
```

**Registered mutation types:**
- `submit_assignment` - Submit assignment answers
- `create_doubt` - Create a new doubt
- `update_note` / `create_note` - Note operations
- `add_highlight` - Add text highlight
- `mark_resource_completed` - Mark resource as done
- `update_profile` - Update user profile
- `generic_insert` / `generic_update` - Generic operations

### 6.6 Offline Queue Banner

Add the banner to show pending mutations:

```tsx
import { OfflineQueueBanner } from "../../../components/offline/OfflineQueueBanner";

// In your screen/layout
<OfflineQueueBanner showWhenOnline={true} />
```

---

## Step 7: Error Handling & Failsafes

Per [WIDGET_FAILSAFE_SPEC.md](./WIDGET_FAILSAFE_SPEC.md):

### 7.1 Widget Error Boundary

All widgets are automatically wrapped in `WidgetErrorBoundary`:

```tsx
// Automatic in DynamicScreen.tsx - you don't need to add this
<WidgetErrorBoundary 
  widgetId={widget.widget_id}
  screenId={screenId}
  onError={handleWidgetError}
>
  <WidgetComponent {...props} />
</WidgetErrorBoundary>
```

**Behavior on error:**
1. Catch the error (React error boundary)
2. Log to Sentry with full context
3. Log analytics event `widget_render_error`
4. Show fallback card with "Retry" button
5. Other widgets continue rendering

### 7.2 Handle Data Loading States

Every widget MUST handle these states:

```tsx
export const MyWidget: React.FC<WidgetProps> = ({ config, onNavigate }) => {
  const { data, isLoading, error, refetch } = useMyWidgetData();
  
  // 1. Loading state - Show skeleton
  if (isLoading) {
    return <WidgetSkeleton />;
  }
  
  // 2. Error state - Show error with retry
  if (error) {
    return (
      <WidgetErrorState 
        error={error}
        onRetry={() => refetch()}
        fallbackMessage={t("widgets.myWidget.states.error")}
      />
    );
  }
  
  // 3. Empty state - Show helpful message
  if (!data?.length) {
    return (
      <WidgetEmptyState 
        icon="📭"
        message={t("widgets.myWidget.states.empty")}
        action={config?.showCreateButton ? { 
          label: t("common:actions.create"), 
          onPress: () => onNavigate?.("create") 
        } : undefined}
      />
    );
  }
  
  // 4. Success state - Render content
  return <WidgetContent data={data} />;
};
```

### 7.3 Graceful Degradation

```tsx
// Fallback to mock/cached data if API fails
const displayData = data?.length ? data : CACHED_DATA || MOCK_DATA;

// Disable interactive features if offline or no permission
const { isOnline } = useNetworkStatus();
const canInteract = isOnline && hasPermission("feature.interact");

<TouchableOpacity 
  disabled={!canInteract}
  onPress={canInteract ? handlePress : undefined}
  style={[styles.item, !canInteract && styles.disabled]}
>
  {/* content */}
</TouchableOpacity>
```

### 7.4 Error Reporting (Sentry Integration)

Per [ERROR_HANDLING_SPEC.md](./ERROR_HANDLING_SPEC.md):

```tsx
import { addBreadcrumb, captureException } from "../../../error/errorReporting";

// Add breadcrumbs for debugging
const handleItemPress = (itemId: string) => {
  addBreadcrumb({
    category: "widget",
    message: `${widgetId}_item_tap`,
    level: "info",
    data: { widgetId, itemId, position: index },
  });
  
  onNavigate?.(`detail/${itemId}`);
};

// Capture exceptions with context
const handleError = (error: Error, context: string) => {
  addBreadcrumb({
    category: "widget",
    message: `${widgetId}_${context}`,
    level: "error",
    data: { widgetId, config, userId },
  });
  
  captureException(error, {
    tags: { widget: widgetId, context },
    extra: { config, userId, screenId },
  });
};
```

### 7.5 Widget Failsafe Levels

| Level | Scenario | Behavior |
|-------|----------|----------|
| 1 | Component throws | WidgetErrorBoundary shows error card |
| 2 | Data fetch fails | Show error state with retry button |
| 3 | Config invalid | Use default config values |
| 4 | Critical error | Hide widget, log to analytics |

### 7.6 Widget Requirements Checklist

Every widget MUST:
- ✅ Handle loading state (show skeleton)
- ✅ Handle error state (show inline error)
- ✅ Handle empty state (show "No data" message)
- ✅ Be self-contained (own data fetching)
- ✅ Respect size prop (compact/standard/expanded)
- ✅ Support refresh if `refreshable: true`

Every widget must NOT:
- ❌ Throw errors in render
- ❌ Assume data is always present
- ❌ Assume network is available
- ❌ Import other widgets directly
- ❌ Have side effects in render

---

## Step 8: Analytics & Performance

Per [ANALYTICS_TELEMETRY_SPEC.md](./ANALYTICS_TELEMETRY_SPEC.md):

### 8.1 Widget Analytics Events

```tsx
import { useAnalytics } from "../../../hooks/useAnalytics";

const { trackWidgetEvent } = useAnalytics();

// Track widget render
useEffect(() => {
  trackWidgetEvent(widgetId, "render", {
    size: config?.size || "standard",
    itemCount: data?.length || 0,
  });
}, []);

// Track widget interactions
const handleItemPress = (itemId: string, index: number) => {
  trackWidgetEvent(widgetId, "click", {
    action: "item_tap",
    itemId,
    position: index,
  });
  onNavigate?.(`detail/${itemId}`);
};

// Track data load success/failure
useEffect(() => {
  if (data) {
    trackWidgetEvent(widgetId, "data_loaded", {
      loadTime: Date.now() - startTime,
      itemCount: data.length,
    });
  }
}, [data]);

useEffect(() => {
  if (error) {
    trackWidgetEvent(widgetId, "error", {
      errorType: error.name,
      errorMessage: error.message,
    });
  }
}, [error]);
```

### 8.2 Required Analytics Events

| Event | When | Properties |
|-------|------|------------|
| `widget_render` | Widget mounts | widgetId, size, screenId |
| `widget_visible` | Scrolled into view | widgetId, position |
| `widget_click` | User interaction | widgetId, action, itemId |
| `widget_data_loaded` | Data fetch success | widgetId, loadTime, itemCount |
| `widget_error` | Any error | widgetId, errorType, errorMessage |

### 8.3 Performance Monitoring

```tsx
// Monitor render performance
const renderStart = useRef(performance.now());

useEffect(() => {
  const renderTime = performance.now() - renderStart.current;
  
  // Log slow renders (>100ms budget per WIDGET_FAILSAFE_SPEC)
  if (renderTime > 100) {
    addBreadcrumb({
      category: "performance",
      message: "slow_widget_render",
      level: "warning",
      data: { widgetId, renderTime: Math.round(renderTime) },
    });
  }
}, []);
```

### 8.4 Performance Budgets

Per WIDGET_FAILSAFE_SPEC:

| Metric | Budget |
|--------|--------|
| Widget render time | <100ms |
| Widget data fetch | <500ms |
| Skeleton display | <200ms |
| Error boundary catch | <50ms |

---

## Step 9: Media Uploads in Widgets

For widgets that need file uploads (assignments, doubts, profile):

### 9.1 Using Media Upload Hook

```tsx
import { useMediaUpload, BUCKETS } from "../../../hooks/useMediaUpload";

const { upload, isUploading, progress, error } = useMediaUpload({
  bucket: BUCKETS.USER_UPLOADS,
  resourceType: 'attachment',
  resourceId: assignmentId,
});

const handleFilePick = async () => {
  const result = await launchImageLibrary({ mediaType: 'mixed' });
  if (result.assets?.[0]) {
    const uploadResult = await upload({
      uri: result.assets[0].uri!,
      name: result.assets[0].fileName || 'file',
      type: result.assets[0].type,
    });
    
    if (uploadResult.success) {
      // Use uploadResult.path for the file reference
    }
  }
};

// Show upload progress
{isUploading && <ProgressBar progress={progress} />}
```

### 9.2 Image Optimization Before Upload

```tsx
import { useImageOptimization, IMAGE_PRESETS } from "../../../hooks/useImageOptimization";

const { optimize, isOptimizing } = useImageOptimization();

const handleImagePick = async () => {
  const result = await launchImageLibrary({ mediaType: 'photo' });
  if (result.assets?.[0]) {
    // Optimize before upload (reduces file size)
    const optimized = await optimize(result.assets[0].uri!, 'medium');
    
    if (optimized) {
      await upload({
        uri: optimized.uri,
        name: optimized.name,
        type: 'image/jpeg',
      });
    }
  }
};
```

**Image Presets:**
- `thumbnail` - 150x150, 70% quality
- `avatar` - 200x200, 80% quality
- `preview` - 400x400, 75% quality
- `medium` - 800x800, 80% quality (recommended)
- `large` - 1200x1200, 85% quality
- `full` - 1920x1920, 90% quality

### 9.3 Storage Buckets

| Bucket | Public | Max Size | Allowed Types |
|--------|--------|----------|---------------|
| `study-pdfs` | No | 50MB | PDF |
| `class-recordings` | No | 500MB | MP4, MOV |
| `thumbnails` | Yes | 5MB | JPEG, PNG, WebP |
| `user-uploads` | No | 10MB | JPEG, PNG, PDF |
| `avatars` | Yes | 2MB | JPEG, PNG |
| `school-branding` | Yes | 5MB | JPEG, PNG, SVG |

---

## Step 10: Testing

### 10.1 Unit Testing Widget Component

```tsx
// __tests__/MyWidget.test.tsx
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { MyWidget } from "../MyWidget";
import { TestProviders } from "../../../test/TestProviders";

const mockConfig = {
  maxItems: 3,
  showIcon: true,
  layoutStyle: "list",
};

const mockOnNavigate = jest.fn();

describe("MyWidget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    // Mock loading state
    jest.spyOn(require("../hooks/useMyWidgetData"), "useMyWidgetData")
      .mockReturnValue({ isLoading: true, data: null, error: null });
    
    const { getByTestId } = render(
      <TestProviders>
        <MyWidget config={mockConfig} onNavigate={mockOnNavigate} />
      </TestProviders>
    );
    
    expect(getByTestId("widget-skeleton")).toBeTruthy();
  });

  it("renders error state with retry", () => {
    const mockRefetch = jest.fn();
    jest.spyOn(require("../hooks/useMyWidgetData"), "useMyWidgetData")
      .mockReturnValue({ 
        isLoading: false, 
        data: null, 
        error: new Error("Network error"),
        refetch: mockRefetch 
      });
    
    const { getByText } = render(
      <TestProviders>
        <MyWidget config={mockConfig} onNavigate={mockOnNavigate} />
      </TestProviders>
    );
    
    expect(getByText("Failed to load data")).toBeTruthy();
    fireEvent.press(getByText("Try Again"));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("renders empty state", () => {
    jest.spyOn(require("../hooks/useMyWidgetData"), "useMyWidgetData")
      .mockReturnValue({ isLoading: false, data: [], error: null });
    
    const { getByText } = render(
      <TestProviders>
        <MyWidget config={mockConfig} onNavigate={mockOnNavigate} />
      </TestProviders>
    );
    
    expect(getByText("No items to display")).toBeTruthy();
  });

  it("renders data and respects maxItems config", () => {
    const mockData = [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }];
    jest.spyOn(require("../hooks/useMyWidgetData"), "useMyWidgetData")
      .mockReturnValue({ isLoading: false, data: mockData, error: null });
    
    const { getAllByTestId } = render(
      <TestProviders>
        <MyWidget config={{ maxItems: 2 }} onNavigate={mockOnNavigate} />
      </TestProviders>
    );
    
    expect(getAllByTestId("widget-item")).toHaveLength(2);
  });

  it("calls onNavigate when item pressed", () => {
    const mockData = [{ id: "123", title: "Test Item" }];
    jest.spyOn(require("../hooks/useMyWidgetData"), "useMyWidgetData")
      .mockReturnValue({ isLoading: false, data: mockData, error: null });
    
    const { getByTestId } = render(
      <TestProviders>
        <MyWidget config={mockConfig} onNavigate={mockOnNavigate} />
      </TestProviders>
    );
    
    fireEvent.press(getByTestId("widget-item-0"));
    expect(mockOnNavigate).toHaveBeenCalledWith("detail/123");
  });
});
```

### 10.2 Integration Testing with Platform Studio

```typescript
// platform-studio/__tests__/widget-config.test.ts
import { render, fireEvent } from "@testing-library/react";
import { WidgetPropertiesPanel } from "../components/builder/WidgetPropertiesPanel";

describe("Widget Configuration", () => {
  it("updates widget config when properties change", () => {
    const mockOnConfigChange = jest.fn();
    
    const { getByLabelText } = render(
      <WidgetPropertiesPanel 
        widgetId="my.widget"
        config={{}}
        onConfigChange={mockOnConfigChange}
      />
    );
    
    fireEvent.change(getByLabelText("Max Items"), { target: { value: "5" } });
    
    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ maxItems: 5 })
    );
  });

  it("validates config constraints", () => {
    const { getByLabelText, getByText } = render(
      <WidgetPropertiesPanel 
        widgetId="my.widget"
        config={{}}
        onConfigChange={jest.fn()}
      />
    );
    
    // Try to set value outside allowed range
    fireEvent.change(getByLabelText("Max Items"), { target: { value: "100" } });
    
    expect(getByText("Maximum value is 10")).toBeTruthy();
  });
});
```

### 9.3 E2E Testing Widget Sync

```typescript
// e2e/widget-sync.test.ts
import { test, expect } from "@playwright/test";

test.describe("Widget Config Sync", () => {
  test("widget config syncs from Platform Studio to mobile app", async ({ page }) => {
    // 1. Open Platform Studio
    await page.goto("/studio/screens");
    
    // 2. Select widget and change config
    await page.click('[data-testid="widget-my.widget"]');
    await page.fill('[data-testid="config-maxItems"]', "5");
    await page.click('[data-testid="save-button"]');
    
    // 3. Verify success message
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    
    // 4. Verify database update via API
    const response = await page.request.get('/api/screen-layout/student-home');
    const layout = await response.json();
    const widget = layout.widgets.find(w => w.widget_id === 'my.widget');
    expect(widget.custom_props.maxItems).toBe(5);
  });

  test("widget handles offline gracefully", async ({ page, context }) => {
    // Load page first
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="widget-my.widget"]');
    
    // Go offline
    await context.setOffline(true);
    
    // Verify offline indicator
    await expect(page.locator('[data-testid="offline-badge"]')).toBeVisible();
    
    // Verify cached data still shows
    await expect(page.locator('[data-testid="widget-my.widget"]')).toBeVisible();
  });
});
```

---

## Step 10: Real-Time Sync

### 10.1 How Sync Works

1. **Platform Studio saves** → Updates `screen_layouts` table
2. **Triggers change event** → Inserts into `config_change_events`
3. **Mobile app subscription** → `useConfigSubscription` hook listens
4. **Query invalidation** → React Query refetches data
5. **Widget re-renders** → Shows new config

### 10.2 Subscription Hook

Location: `src/hooks/useConfigSubscription.ts`

```typescript
// Already set up - listens for:
// - "layout_updated" → Invalidates screen-layout queries
// - "theme_updated" → Invalidates theme queries
// - "branding_updated" → Invalidates branding queries
```

---

## Step 11: Visibility Rules

### 11.1 Configure in Database

```json
{
  "visibility_rules": [
    {
      "type": "permission",
      "value": "assignments.view"
    },
    {
      "type": "feature",
      "value": "assignments"
    },
    {
      "type": "online",
      "value": true
    }
  ]
}
```

### 11.2 Visibility Check

Location: `src/utils/checkVisibilityRules.ts`

```typescript
// Automatically checked in DynamicScreen before rendering widget
const isVisible = checkVisibilityRules(widget.visibilityRules, {
  permissions: userPermissions,
  enabledFeatures: enabledFeatureIds,
  isOnline: networkStatus,
});
```

---

## Config Property Types (Complete Reference)

### Basic Types

| Type | Example | Platform Studio UI | Description |
|------|---------|-------------------|-------------|
| `boolean` | `showIcon: true` | Toggle switch | On/off flags |
| `number` | `maxItems: 5` | Slider/input | Numeric values |
| `string` | `title: "Hello"` | Text input | Text values |
| `select` | `layout: "grid"` | Dropdown | Single selection |
| `multiselect` | `tags: ["a","b"]` | Multi-select | Multiple selection |
| `color` | `accent: "#6366F1"` | Color picker | Color values |

### Field Configuration Schema

```typescript
type ConfigField = {
  key: string;              // Property key in custom_props
  label: string;            // Display label
  type: ConfigFieldType;    // Field type
  default?: any;            // Default value
  
  // Number constraints
  min?: number;             // Minimum value
  max?: number;             // Maximum value
  step?: number;            // Step increment
  
  // Select options
  options?: string[] | { value: string; label: string }[];
  
  // String constraints
  maxLength?: number;       // Max string length
  pattern?: string;         // Regex pattern
  placeholder?: string;     // Placeholder text
  
  // Conditional display
  showWhen?: {              // Show field conditionally
    field: string;
    value: any;
  };
  
  // Validation
  required?: boolean;       // Is required?
  helpText?: string;        // Help tooltip
};
```

### Common Config Patterns

```typescript
// Display section
{
  title: "Display",
  icon: "📊",
  fields: [
    { key: "maxItems", label: "Max Items", type: "number", min: 1, max: 20, default: 5 },
    { key: "columns", label: "Columns", type: "select", options: ["1", "2", "3"], default: "2" },
    { key: "showIcon", label: "Show Icons", type: "boolean", default: true },
    { key: "showDate", label: "Show Dates", type: "boolean", default: true },
    { key: "showBadge", label: "Show Badges", type: "boolean", default: true },
    { key: "layoutStyle", label: "Layout", type: "select", options: ["list", "grid", "cards"], default: "list" },
  ],
}

// Content section
{
  title: "Content",
  icon: "📝",
  fields: [
    { key: "title", label: "Custom Title", type: "string", maxLength: 50, placeholder: "Widget Title" },
    { key: "subtitle", label: "Subtitle", type: "string", maxLength: 100 },
    { key: "emptyMessage", label: "Empty State", type: "string", default: "No items" },
    { key: "filterBy", label: "Filter", type: "select", options: ["all", "recent", "favorites"] },
    { key: "sortBy", label: "Sort By", type: "select", options: ["date", "name", "priority"] },
  ],
}

// Behavior section
{
  title: "Behavior",
  icon: "⚡",
  fields: [
    { key: "enableTap", label: "Enable Tap", type: "boolean", default: true },
    { key: "showViewAll", label: "Show View All", type: "boolean", default: true },
    { key: "autoRefresh", label: "Auto Refresh", type: "boolean", default: false },
    { key: "refreshInterval", label: "Refresh (sec)", type: "number", min: 30, max: 300, showWhen: { field: "autoRefresh", value: true } },
  ],
}

// Styling section
{
  title: "Styling",
  icon: "🎨",
  fields: [
    { key: "accentColor", label: "Accent Color", type: "color" },
    { key: "borderRadius", label: "Border Radius", type: "number", min: 0, max: 24, default: 12 },
    { key: "padding", label: "Padding", type: "select", options: ["none", "sm", "md", "lg"], default: "md" },
    { key: "elevation", label: "Shadow", type: "select", options: ["none", "small", "medium", "large"], default: "small" },
  ],
}
```

### Reading Config in Widget

```tsx
export const MyWidget: React.FC<WidgetProps> = ({ config }) => {
  // Always provide defaults for safety
  const maxItems = (config?.maxItems as number) ?? 5;
  const showIcon = config?.showIcon !== false;  // Default true
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const accentColor = (config?.accentColor as string) || colors.primary;
  const title = (config?.title as string) || t("widgets.myWidget.title");
  
  // Conditional features
  const enableTap = config?.enableTap !== false;
  const showViewAll = config?.showViewAll !== false;
  
  // ...
};
```

---

## Complete Example: Announcements Widget

### Mobile App Component

```tsx
// src/components/widgets/feed/AnnouncementsWidget.tsx
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const MOCK_ANNOUNCEMENTS = [
  { id: "1", title: "Exam Schedule Released", date: "Today", priority: "high" },
  { id: "2", title: "Holiday Notice", date: "Yesterday", priority: "normal" },
];

export const AnnouncementsWidget: React.FC<WidgetProps> = ({ config, onNavigate }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("dashboard");

  const maxItems = (config?.maxItems as number) || 3;
  const showDate = config?.showDate !== false;
  const showPriority = config?.showPriority !== false;

  return (
    <View style={styles.container}>
      {MOCK_ANNOUNCEMENTS.slice(0, maxItems).map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.item, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => onNavigate?.(`announcement/${item.id}`)}
        >
          <Icon name="bullhorn" size={18} color={colors.primary} />
          <View style={styles.content}>
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              {item.title}
            </AppText>
            {showDate && (
              <AppText style={[styles.date, { color: colors.onSurfaceVariant }]}>
                {item.date}
              </AppText>
            )}
          </View>
          {showPriority && item.priority === "high" && (
            <View style={[styles.badge, { backgroundColor: "#FEE2E2" }]}>
              <AppText style={{ color: "#DC2626", fontSize: 10 }}>Important</AppText>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 8 },
  item: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, gap: 10 },
  content: { flex: 1 },
  title: { fontSize: 13, fontWeight: "600" },
  date: { fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
});
```

### Registry Entry

```typescript
// src/config/widgetRegistry.ts
"feed.announcements": {
  component: AnnouncementsWidget,
  metadata: buildMetadata("feed.announcements", "dashboard:widgets.announcements.title", "dashboard:widgets.announcements.subtitle", "announcements"),
},
```

### Platform Studio Config

```typescript
// platform-studio/src/components/builder/WidgetPropertiesPanel.tsx
"feed.announcements": {
  sections: [
    {
      title: "Display",
      icon: "📢",
      fields: [
        { key: "maxItems", label: "Max Items", type: "number", min: 1, max: 10, default: 3 },
        { key: "showDate", label: "Show Date", type: "boolean", default: true },
        { key: "showPriority", label: "Show Priority Badge", type: "boolean", default: true },
      ],
    },
  ],
},
```

---

## Troubleshooting

### Widget not appearing
1. Check widget ID matches in all 3 places
2. Verify `enabled: true` in database
3. Check role permissions in widget metadata
4. Check visibility rules

### Config not syncing
1. Verify `config_change_events` is being triggered
2. Check `useConfigSubscription` is active in AppContent
3. Verify query keys match between subscription and query

### Icons showing as boxes
1. Run `npm run android:clean && npm run android:fast`
2. Verify font files in `android/app/src/main/assets/fonts/`

### Navigation not working
1. Check route is mapped in `DynamicScreen.handleWidgetNavigate`
2. Verify target screen exists in navigation stack

---

## Widget Development Checklist

Use this checklist to ensure your widget is production-ready:

### ✅ Pre-Development
- [ ] Widget ID follows `category.name` convention
- [ ] Feature requirements defined
- [ ] UI/UX mockups approved
- [ ] Data source identified (API/mock)
- [ ] Offline behavior specified

### ✅ Mobile App Implementation
- [ ] Widget component created with `WidgetProps`
- [ ] Config properties read from `config?.propertyName`
- [ ] Navigation calls `onNavigate?.(route, params)`
- [ ] Loading state shows skeleton
- [ ] Error state shows retry option
- [ ] Empty state shows helpful message
- [ ] Offline behavior implemented
- [ ] Component registered in `widgetRegistry.ts`
- [ ] Icon added to `WIDGET_ICONS`

### ✅ Platform Studio Implementation
- [ ] Widget metadata added to registry
- [ ] Config schema defined in `WidgetPropertiesPanel`
- [ ] Preview component created in `DevicePreview`
- [ ] Widget titles/icons added to preview
- [ ] All config options have preview support

### ✅ Internationalization & Localization
- [ ] English translations added (`en/dashboard.json`)
- [ ] Hindi translations added (`hi/dashboard.json`)
- [ ] Static UI text uses `t()` translation keys
- [ ] Dynamic content uses `getLocalizedField()` helper
- [ ] Database table has `_en` and `_hi` columns
- [ ] Query hook created in `src/hooks/queries/`
- [ ] Pluralization handled correctly
- [ ] Date/time formatting localized

### ✅ Dark Mode Support
- [ ] All colors from `useAppTheme()` (no hardcoded colors)
- [ ] Text uses `colors.onSurface` / `colors.onSurfaceVariant`
- [ ] Backgrounds use `colors.surface` / `colors.surfaceVariant`
- [ ] Icons use theme colors (`colors.primary`, etc.)
- [ ] Borders use `colors.outline` / `colors.outlineVariant`
- [ ] Status colors use `colors.success`, `colors.warning`, `colors.error`

### ✅ Error Handling (per WIDGET_FAILSAFE_SPEC)
- [ ] Widget wrapped in error boundary (automatic)
- [ ] Loading states shown
- [ ] Error states with retry option
- [ ] Empty states with helpful message
- [ ] Graceful degradation for missing data
- [ ] Error reporting with breadcrumbs

### ✅ Offline Support (per OFFLINE_SUPPORT_SPEC)
- [ ] Offline behavior defined in metadata
- [ ] Cached data shown when offline
- [ ] Offline indicators displayed
- [ ] Network status checked
- [ ] Appropriate stale times set

### ✅ Analytics (per ANALYTICS_TELEMETRY_SPEC)
- [ ] `widget_render` event tracked
- [ ] `widget_click` events tracked
- [ ] `widget_error` events tracked
- [ ] `widget_data_loaded` events tracked
- [ ] Performance monitoring added

### ✅ Testing
- [ ] Unit tests for loading state
- [ ] Unit tests for error state
- [ ] Unit tests for empty state
- [ ] Unit tests for data rendering
- [ ] Unit tests for config options
- [ ] Integration tests for Platform Studio
- [ ] E2E tests for sync behavior

### ✅ Database Configuration
- [ ] Widget added to screen layouts
- [ ] Correct `widget_id` used
- [ ] Position set appropriately
- [ ] Default config values set
- [ ] Visibility rules configured

### ✅ Performance (per WIDGET_FAILSAFE_SPEC)
- [ ] Render time < 100ms
- [ ] Data fetch < 500ms
- [ ] Memory usage optimized
- [ ] No unnecessary re-renders

### ✅ Documentation
- [ ] Widget documented in this guide
- [ ] Config options documented
- [ ] Navigation routes documented
- [ ] Known limitations noted

---

## Step 12: Localized Content from Database

Widgets that display dynamic content (assignments, classes, subjects, etc.) must use localized database fields instead of translation keys.

### 12.1 When to Use What

| Content Type | Approach | Example |
|--------------|----------|---------|
| Static UI text | `t()` translation keys | Button labels, headers, empty states |
| Dynamic content | Database columns | Assignment titles, subject names |

### 12.2 Database Column Convention

Content tables use language-suffixed columns:

```sql
-- subjects table
title_en        TEXT NOT NULL,
title_hi        TEXT,
description_en  TEXT,
description_hi  TEXT,
```

### 12.3 Helper Function

Location: `src/utils/getLocalizedField.ts`

```typescript
import i18n from '../i18n';

/**
 * Get localized field from an object with language-suffixed properties
 */
export function getLocalizedField<T extends Record<string, any>>(
  item: T,
  field: string,
  fallbackLang: string = 'en'
): string {
  const currentLang = i18n.language || 'en';
  const langField = `${field}_${currentLang}`;
  const fallbackField = `${field}_${fallbackLang}`;
  
  return item[langField] || item[fallbackField] || '';
}
```

### 12.4 Widget Implementation

```tsx
import { getLocalizedField } from '../../../utils/getLocalizedField';

export const AssignmentsWidget: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation('dashboard');
  const { data: assignments } = useAssignmentsQuery();
  
  return (
    <View>
      {/* Static UI text - use t() */}
      <AppText>{t('widgets.assignments.title')}</AppText>
      
      {/* Dynamic content - use getLocalizedField() */}
      {assignments?.map(item => (
        <View key={item.id}>
          <AppText>{getLocalizedField(item, 'title')}</AppText>
          <AppText>{getLocalizedField(item.subject, 'title')}</AppText>
        </View>
      ))}
      
      {/* Empty state - use t() */}
      {!assignments?.length && (
        <AppText>{t('widgets.assignments.states.empty')}</AppText>
      )}
    </View>
  );
};
```

### 12.5 Query Invalidation on Language Change

When user changes language, content queries should be invalidated to re-render with new language:

```typescript
// In AppContent.tsx or a dedicated hook
useEffect(() => {
  const handleLanguageChange = () => {
    queryClient.invalidateQueries({ queryKey: ['assignments'] });
    queryClient.invalidateQueries({ queryKey: ['classes'] });
    queryClient.invalidateQueries({ queryKey: ['subjects'] });
    queryClient.invalidateQueries({ queryKey: ['doubts'] });
    queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
  };
  
  i18n.on('languageChanged', handleLanguageChange);
  return () => i18n.off('languageChanged', handleLanguageChange);
}, [queryClient]);
```

### 12.6 Localized Content Tables

See [DB_SCHEMA_REFERENCE.md](./DB_SCHEMA_REFERENCE.md#-8-localized-content-tables) for complete schema:

- `subjects` - Subject names and descriptions
- `classes` - Class/schedule entries
- `assignments` - Assignment titles and instructions
- `tests` - Test titles and descriptions
- `doubts` - Student questions
- `quick_actions` - Quick action button labels

---

## Step 13: Dark Mode Support

All widgets automatically support dark mode through the theme system. No special code is needed if you follow the theming guidelines in Step 1.5.

### 13.1 How Dark Mode Works

1. User selects theme mode in Settings (System/Light/Dark)
2. `themeStore` persists preference to AsyncStorage
3. `useAppTheme()` returns appropriate colors based on mode
4. Widgets using theme colors automatically update

### 13.2 Theme Mode Options

| Mode | Behavior |
|------|----------|
| `system` | Follows device dark/light mode setting |
| `light` | Always light mode |
| `dark` | Always dark mode |

### 13.3 Customer Dark Mode Colors

Customers can customize dark mode colors in Platform Studio:

| Light Color | Dark Color |
|-------------|------------|
| `primary_color` | `dark_primary_color` |
| `secondary_color` | `dark_secondary_color` |
| `accent_color` | `dark_accent_color` |
| `background_color` | `dark_background_color` |
| `surface_color` | `dark_surface_color` |
| `text_color` | `dark_text_color` |

### 13.4 Widget Dark Mode Checklist

Widgets automatically support dark mode if they:

- ✅ Use `colors.surface` for backgrounds (not hardcoded white)
- ✅ Use `colors.onSurface` for text (not hardcoded black)
- ✅ Use `colors.surfaceVariant` for secondary backgrounds
- ✅ Use `colors.outline` for borders
- ✅ Use `colors.primary`, `colors.success`, etc. for accents
- ✅ Use `borderRadius.medium` instead of hardcoded values

### 13.5 Testing Dark Mode

1. Open Settings → Appearance → Select "Dark"
2. Verify all widgets render correctly
3. Check text is readable (sufficient contrast)
4. Check icons are visible
5. Check borders/separators are visible
6. Test with "System" mode by changing device settings

### 13.6 Widget Container Borders

`WidgetContainer` automatically adds subtle borders in dark mode for better visual separation:

```tsx
// In WidgetContainer.tsx
const containerStyle = {
  borderWidth: 1,
  borderColor: colors.outlineVariant,
};
```

---

## Related Documentation

- [WIDGET_SYSTEM_SPEC.md](./WIDGET_SYSTEM_SPEC.md) - Widget system architecture
- [WIDGET_FAILSAFE_SPEC.md](./WIDGET_FAILSAFE_SPEC.md) - Error handling & failsafes
- [I18N_MULTILANGUAGE_SPEC.md](./I18N_MULTILANGUAGE_SPEC.md) - Translations & localization
- [OFFLINE_SUPPORT_SPEC.md](./OFFLINE_SUPPORT_SPEC.md) - Offline capabilities
- [ERROR_HANDLING_SPEC.md](./ERROR_HANDLING_SPEC.md) - Global error handling
- [ANALYTICS_TELEMETRY_SPEC.md](./ANALYTICS_TELEMETRY_SPEC.md) - Analytics events
- [DB_SCHEMA_REFERENCE.md](./DB_SCHEMA_REFERENCE.md) - Database schema
- [PLATFORM_STUDIO_TECHNICAL_SPEC.md](./PLATFORM_STUDIO_TECHNICAL_SPEC.md) - Platform Studio
- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - System architecture


---

## Step 8: Implementing Layout Styles

Widgets that display lists of items should support multiple layout styles configurable from Platform Studio.

### 8.1 Supported Layout Styles

| Style | Description | Best For |
|-------|-------------|----------|
| `list` | Vertical list (default) | Most widgets, detailed items |
| `cards` | Horizontal scrollable cards | Featured items, quick browse |
| `grid` | 2-column grid | Compact overview, many items |
| `timeline` | Vertical timeline with line | Chronological items, schedules |

### 8.2 Widgets Supporting Layout Styles

These widgets support layout style customization:
- `schedule.today` - Today's Schedule
- `doubts.inbox` - Doubts Inbox
- `assignments.pending` - Assignments & Tests
- `progress.snapshot` - Progress Snapshot (subjects section)

### 8.3 Implementation Pattern

```tsx
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

export const MyWidget: React.FC<WidgetProps> = ({ config }) => {
  const { colors } = useAppTheme();
  
  // Read layout style from config
  const layoutStyle = (config?.layoutStyle as string) || "list";
  
  // Render based on layout style
  return (
    <View style={styles.container}>
      {/* Cards layout - horizontal scroll */}
      {layoutStyle === "cards" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {items.map((item, index) => (
            <TouchableOpacity key={item.id} style={[styles.cardItem, { backgroundColor: colors.surfaceVariant }]}>
              {/* Card content */}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Grid layout - 2 columns */}
      {layoutStyle === "grid" && (
        <View style={styles.gridContainer}>
          {items.map((item, index) => (
            <TouchableOpacity key={item.id} style={[styles.gridItem, { backgroundColor: colors.surfaceVariant }]}>
              {/* Grid item content */}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Timeline layout */}
      {layoutStyle === "timeline" && (
        <View style={styles.timelineContainer}>
          <View style={[styles.timelineLine, { backgroundColor: colors.outline }]} />
          {items.map((item, index) => (
            <View key={item.id} style={styles.timelineItem}>
              <View style={[styles.timelineDot, { borderColor: colors.primary }]} />
              <TouchableOpacity style={[styles.timelineContent, { backgroundColor: colors.surfaceVariant }]}>
                {/* Timeline item content */}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Default list layout */}
      {(layoutStyle === "list" || !["cards", "grid", "timeline"].includes(layoutStyle)) && (
        <View style={styles.listContainer}>
          {items.map((item, index) => (
            <TouchableOpacity key={item.id} style={[styles.listItem, { backgroundColor: colors.surfaceVariant }]}>
              {/* List item content */}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};
```

### 8.4 Required Styles

```tsx
const styles = StyleSheet.create({
  container: { gap: 12 },
  
  // Layout containers
  listContainer: { gap: 8 },
  cardsContainer: { gap: 12, paddingRight: 4 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timelineContainer: { position: "relative", paddingLeft: 16 },
  timelineLine: { position: "absolute", left: 5, top: 8, bottom: 8, width: 2, borderRadius: 1 },
  
  // List item
  listItem: { padding: 12, borderRadius: 10, gap: 8 },
  
  // Card item - fixed width for horizontal scroll
  cardItem: { width: 140, padding: 14, borderRadius: 12, alignItems: "center", gap: 8 },
  
  // Grid item - 48% width for 2 columns with gap
  gridItem: { width: "48%", padding: 10, borderRadius: 10, gap: 6 },
  
  // Timeline item
  timelineItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, backgroundColor: "#fff", marginRight: 8, marginTop: 4, marginLeft: -8 },
  timelineContent: { flex: 1, padding: 10, borderRadius: 8 },
});
```

### 8.5 Platform Studio Configuration

Add to `WidgetPropertiesPanel.tsx` LAYOUT_STYLE_WIDGETS array:

```typescript
const LAYOUT_STYLE_WIDGETS = [
  "schedule.today",
  "doubts.inbox",
  "assignments.pending",
  "progress.snapshot",
];
```

The Layout Style selector automatically appears in the Layout tab for these widgets.

### 8.6 DevicePreview Support

Each widget's preview component in `DevicePreview.tsx` must also render different layouts:

```tsx
function ScheduleContent({ theme, props }) {
  const layoutStyle = (props.layoutStyle as string) || "list";
  
  if (layoutStyle === "cards") {
    return (
      <div className="flex gap-2 overflow-x-auto">
        {items.map((item, i) => (
          <div key={i} className="flex-shrink-0 w-24 p-2 rounded-xl">
            {/* Card preview */}
          </div>
        ))}
      </div>
    );
  }
  
  // ... other layouts
}
```

### 8.7 Layout Style Checklist

When adding layout style support to a widget:

- [ ] Import `ScrollView` from react-native
- [ ] Read `layoutStyle` from config with "list" default
- [ ] Add container styles for each layout type
- [ ] Add item styles for each layout type
- [ ] Implement conditional rendering for each layout
- [ ] Update DevicePreview component
- [ ] Add widget ID to LAYOUT_STYLE_WIDGETS array
- [ ] Test all 4 layouts in Platform Studio preview
- [ ] Test all 4 layouts in mobile app


---

## 9. Push Notifications Integration

Widgets can integrate with the push notification system to show notification badges, trigger notifications, or respond to notification taps.

### 9.1 Notification Badge in Widgets

Show unread notification count in widgets:

```tsx
import { useNotifications } from "../../../hooks/usePushNotifications";

export const MyWidget: React.FC<WidgetProps> = ({ config, onNavigate }) => {
  const { colors } = useAppTheme();
  const { data: notifications } = useNotifications();
  
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onNavigate("notifications")}>
        <Icon name="bell" size={24} color={colors.onSurface} />
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <AppText style={styles.badgeText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </AppText>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};
```

### 9.2 Notification-Aware Widgets

Widgets can filter data based on notification type:

```tsx
import { useNotifications } from "../../../hooks/usePushNotifications";

export const AssignmentsWidget: React.FC<WidgetProps> = ({ config }) => {
  const { data: notifications } = useNotifications();
  
  // Get assignment-related notifications
  const assignmentNotifications = notifications?.filter(
    n => n.notification_type === "assignments" && !n.is_read
  ) || [];

  // Show indicator if there are new assignment notifications
  const hasNewAssignments = assignmentNotifications.length > 0;

  return (
    <View>
      {hasNewAssignments && (
        <View style={styles.newIndicator}>
          <AppText>{assignmentNotifications.length} new</AppText>
        </View>
      )}
      {/* Rest of widget */}
    </View>
  );
};
```

### 9.3 Deep Linking from Notifications

When a notification is tapped, the app navigates to the relevant screen. Widgets should handle incoming navigation params:

```tsx
// In your screen component
import { useRoute } from "@react-navigation/native";

export const AssignmentDetailScreen = () => {
  const route = useRoute();
  const { assignmentId, fromNotification } = route.params || {};

  // If opened from notification, mark as read
  useEffect(() => {
    if (fromNotification && assignmentId) {
      // Mark related notification as read
      markNotificationRead(assignmentId);
    }
  }, [fromNotification, assignmentId]);

  // ... rest of screen
};
```

### 9.4 Customer Notification Settings

Widgets can check if their notification category is enabled:

```tsx
import { useNotificationSettingsQuery } from "../../../hooks/queries/useNotificationSettingsQuery";

export const DoubtsWidget: React.FC<WidgetProps> = ({ customerId }) => {
  const { data: settings } = useNotificationSettingsQuery(customerId);
  
  // Check if doubts notifications are enabled
  const doubtsNotificationsEnabled = settings?.categories?.doubts ?? true;

  return (
    <View>
      {/* Widget content */}
      {!doubtsNotificationsEnabled && (
        <AppText style={styles.hint}>
          Enable notifications to get updates on your doubts
        </AppText>
      )}
    </View>
  );
};
```

### 9.5 Notification Categories Reference

| Category | Widget Use Case |
|----------|-----------------|
| `assignments` | AssignmentsWidget, TasksWidget |
| `tests` | TestsWidget, UpcomingTestsWidget |
| `announcements` | AnnouncementsWidget, FeedWidget |
| `doubts` | DoubtsInboxWidget |
| `attendance` | AttendanceWidget |
| `grades` | GradesWidget, ProgressWidget |
| `schedule` | TodayScheduleWidget, CalendarWidget |
| `reminders` | RemindersWidget, StudyStreakWidget |
| `system` | SystemAlertsWidget |

### 9.6 Platform Studio Notification Settings

The Platform Studio includes a Notifications page (`/studio/notifications`) where customers can configure:

- **Global Toggle**: Enable/disable all notifications
- **Category Toggles**: Enable/disable specific notification types
- **Quiet Hours**: Set time range when notifications are silenced
- **Sound & Vibration**: Toggle audio/haptic feedback
- **Android Settings**: Channel priority, badge count, grouping
- **Branding**: Custom notification icon and accent color

These settings are stored in the `notification_settings` table and fetched by the mobile app via `fetchNotificationSettings()`.

---

## 10. Related Documentation

- [STUDENT_COMPLETE_SPEC.md](./STUDENT_COMPLETE_SPEC.md) - Complete student app specification
- [WIDGET_SYSTEM_SPEC.md](./WIDGET_SYSTEM_SPEC.md) - Widget system architecture
- [WIDGET_FAILSAFE_SPEC.md](./WIDGET_FAILSAFE_SPEC.md) - Widget error handling
- [I18N_MULTILANGUAGE_SPEC.md](./I18N_MULTILANGUAGE_SPEC.md) - Internationalization
- [DB_SCHEMA_REFERENCE.md](./DB_SCHEMA_REFERENCE.md) - Database schema
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Implementation progress

---

*Document created: December 2024*  
*Last updated: December 2024*
