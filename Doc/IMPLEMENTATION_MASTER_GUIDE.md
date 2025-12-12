# 🚀 Universal Widget Implementation - MASTER GUIDE

> **This is your SINGLE source of truth. Follow this document step-by-step.**

**Key Architecture Change:** Widgets are universal. Any widget can be placed on any screen, any tab, any position. Tab count is dynamic (1-10).

---

## 📋 Table of Contents

1. [Pre-Implementation Checklist](#pre-implementation-checklist)
2. [Folder Structure](#folder-structure)
3. [Phase 0: Foundation Types](#phase-0-foundation-types)
4. [Phase 1: Database Schema](#phase-1-database-schema)
5. [Phase 2: Widget Registry](#phase-2-widget-registry)
6. [Phase 3: Screen Registry](#phase-3-screen-registry)
7. [Phase 4: Config Services](#phase-4-config-services)
8. [Phase 5: Dynamic Navigation](#phase-5-dynamic-navigation)
9. [Phase 6: Dynamic Screens](#phase-6-dynamic-screens)
10. [Phase 7: Widget Implementation](#phase-7-widget-implementation)
11. [Phase 8: Permission Engine](#phase-8-permission-engine)
12. [Phase 9: Theme System](#phase-9-theme-system)
13. [Phase 10: Admin Dashboard](#phase-10-admin-dashboard)
14. [Phase 11: Testing & Validation](#phase-11-testing-validation)

---

## ✅ Pre-Implementation Checklist

Before starting, verify:

- [ ] React Native 0.80+ installed
- [ ] Supabase project created
- [ ] TanStack React Query 5.x available
- [ ] Zod 3.x available
- [ ] Zustand 5.x available
- [ ] Git branch created: `feature/universal-widgets`

---

## 📁 Folder Structure

```
src/
├── config/
│   ├── widgetRegistry.ts        # All widgets + metadata
│   ├── screenRegistry.ts        # All screens
│   ├── featureRegistry.ts       # All features
│   ├── defaultConfig.ts         # Fallback configs
│   └── constants.ts
│
├── widgets/                     # Universal widgets
│   ├── schedule/
│   │   ├── TodayScheduleWidget.tsx
│   │   ├── WeeklyScheduleWidget.tsx
│   │   └── index.ts
│   ├── study/
│   │   ├── RecentLibraryWidget.tsx
│   │   ├── FavoritesWidget.tsx
│   │   └── index.ts
│   ├── assessment/
│   │   ├── PendingAssignmentsWidget.tsx
│   │   ├── UpcomingTestsWidget.tsx
│   │   └── index.ts
│   ├── doubts/
│   │   ├── DoubtsInboxWidget.tsx
│   │   ├── QuickAskWidget.tsx
│   │   └── index.ts
│   ├── progress/
│   │   ├── ProgressSnapshotWidget.tsx
│   │   ├── StreakWidget.tsx
│   │   └── index.ts
│   ├── social/
│   │   ├── StudyGroupsWidget.tsx
│   │   ├── LeaderboardWidget.tsx
│   │   └── index.ts
│   ├── ai/
│   │   ├── AITutorWidget.tsx
│   │   ├── RecommendationsWidget.tsx
│   │   └── index.ts
│   ├── profile/
│   │   ├── ProfileSummaryWidget.tsx
│   │   └── index.ts
│   ├── common/
│   │   ├── HeroGreetingWidget.tsx
│   │   ├── QuickActionsWidget.tsx
│   │   ├── NotificationsWidget.tsx
│   │   └── index.ts
│   └── base/
│       ├── WidgetContainer.tsx
│       ├── WidgetErrorBoundary.tsx
│       ├── WidgetSkeleton.tsx
│       ├── WidgetOfflinePlaceholder.tsx
│       └── index.ts
│
├── screens/
│   ├── DynamicScreen.tsx        # Universal screen renderer
│   ├── ScreenPlaceholder.tsx
│   ├── detail/                  # Detail screens (non-widget)
│   │   ├── ClassDetailScreen.tsx
│   │   ├── ResourceViewerScreen.tsx
│   │   └── DoubtDetailScreen.tsx
│   └── index.ts
│
├── navigation/
│   ├── DynamicNavigator.tsx     # Builds tabs from config
│   ├── DynamicTabBar.tsx
│   ├── NavigationErrorBoundary.tsx
│   ├── resolvers/
│   │   ├── resolveTab.ts
│   │   └── resolveScreen.ts
│   └── index.ts
│
├── services/
│   ├── config/
│   │   ├── configService.ts
│   │   ├── navigationService.ts
│   │   ├── screenLayoutService.ts
│   │   ├── themeService.ts
│   │   ├── brandingService.ts      # NEW: White-label service
│   │   └── permissionService.ts
│   └── index.ts
│
├── hooks/
│   ├── config/
│   │   ├── useCustomerConfig.ts
│   │   ├── useNavigationTabs.ts
│   │   ├── useScreenLayout.ts
│   │   ├── usePermissions.ts
│   │   ├── useCustomerTheme.ts
│   │   └── useCustomerBranding.ts  # NEW: White-label hook
│   └── index.ts
│
├── stores/
│   ├── configStore.ts
│   ├── permissionStore.ts
│   └── index.ts
│
├── types/
│   ├── widget.types.ts
│   ├── screen.types.ts
│   ├── navigation.types.ts
│   ├── config.types.ts
│   ├── permission.types.ts
│   ├── theme.types.ts
│   └── branding.types.ts           # NEW: White-label types
│
└── validation/
    ├── widgetSchemas.ts
    ├── screenSchemas.ts
    └── configSchemas.ts
```


---

## 🏗️ Phase 0: Foundation Types

### Step 0.1: Widget Types

**File: `src/types/widget.types.ts`**

```typescript
// Widget identification
export type WidgetId = string;

export type WidgetCategory = 
  | "schedule" | "study" | "assessment" | "doubts" 
  | "progress" | "social" | "ai" | "profile" 
  | "notifications" | "actions" | "content" | "analytics";

export type WidgetSize = "compact" | "standard" | "expanded";

// Props passed to every widget
export type WidgetProps = {
  customerId: string;
  userId: string;
  role: "student" | "teacher" | "parent" | "admin";
  screenId: string;
  tabId: string;
  position: number;
  size: WidgetSize;
  config: Record<string, unknown>;
  onNavigate: (route: string, params?: any) => void;
  onAction?: (event: WidgetActionEvent) => void;
  onRefresh?: () => void;
};

export type WidgetActionEvent = {
  type: string;
  widgetId: WidgetId;
  data?: unknown;
};

// Widget metadata
export type WidgetMetadata = {
  id: WidgetId;
  name: string;
  description: string;
  category: WidgetCategory;
  allowedRoles: Array<"student" | "teacher" | "parent" | "admin">;
  allowedScreenTypes: Array<"dashboard" | "hub" | "list" | "detail" | "any">;
  supportedSizes: WidgetSize[];
  defaultSize: WidgetSize;
  minHeight?: number;
  maxHeight?: number;
  requiredFeatureId?: string;
  requiredPermissions?: string[];
  dependencies?: WidgetId[];
  dataPolicy: WidgetDataPolicy;
  defaultConfig: Record<string, unknown>;
  refreshable: boolean;
  cacheable: boolean;
  offlineCapable: boolean;
  requiresOnline?: boolean;
};

export type WidgetDataPolicy = {
  maxQueries: number;
  staleTimeMs: number;
  cacheKey: (props: WidgetProps) => string[];
  prefetchOnScreenLoad: boolean;
  allowBackgroundRefresh: boolean;
  offlineBehavior: "show-cached" | "show-placeholder" | "hide";
};

// Widget component type
export type WidgetComponent = (props: WidgetProps) => JSX.Element;

// Registry entry
export type WidgetRegistryEntry = {
  component: WidgetComponent;
  metadata: WidgetMetadata;
};
```

### Step 0.2: Screen Types

**File: `src/types/screen.types.ts`**

```typescript
export type ScreenId = string;

export type ScreenType = "dashboard" | "hub" | "list" | "detail" | "custom";

export type ScreenLayout = "vertical" | "grid" | "masonry";

// Screen definition (global)
export type ScreenDefinition = {
  screenId: ScreenId;
  name: string;
  screenType: ScreenType;
  allowedRoles: Array<"student" | "teacher" | "parent" | "admin">;
  defaultLayout: ScreenLayout;
  scrollable: boolean;
  pullToRefresh: boolean;
  headerVisible: boolean;
};

// Screen layout config (per customer)
export type ScreenLayoutConfig = {
  screenId: ScreenId;
  customerId: string;
  role: string;
  tabId: string;
  screenType: ScreenType;
  title?: string;
  titleKey?: string;
  widgets: ScreenWidgetConfig[];
  layout: ScreenLayout;
  padding: "none" | "sm" | "md" | "lg";
  gap: "none" | "sm" | "md" | "lg";
  scrollable: boolean;
  pullToRefresh: boolean;
  headerVisible: boolean;
};

// Widget placement on screen
export type ScreenWidgetConfig = {
  widgetId: string;
  position: number;
  size: "compact" | "standard" | "expanded";
  enabled: boolean;
  gridColumn?: number;
  gridRow?: number;
  customProps?: Record<string, unknown>;
  visibilityRules?: VisibilityRule[];
};

export type VisibilityRule = {
  type: "permission" | "feature" | "online" | "time" | "custom";
  condition: string;
  value: any;
};
```

### Step 0.3: Branding Types

**File: `src/types/branding.types.ts`**

```typescript
export type CustomerBranding = {
  customerId: string;
  
  // App Identity
  appName: string;
  appTagline?: string;
  
  // Logos & Assets
  logoUrl?: string;
  logoSmallUrl?: string;
  logoDarkUrl?: string;
  splashImageUrl?: string;
  loginHeroUrl?: string;
  faviconUrl?: string;
  
  // Feature Naming (for white-labeling)
  aiTutorName: string;
  doubtSectionName: string;
  assignmentName: string;
  testName: string;
  liveClassName: string;
  
  // Contact Info
  supportEmail?: string;
  supportPhone?: string;
  whatsappNumber?: string;
  helpCenterUrl?: string;
  
  // Legal Links
  termsUrl?: string;
  privacyUrl?: string;
  refundUrl?: string;
  
  // Flexible Text Overrides
  textOverrides: Record<string, string>;
};

// Default branding (fallback)
export const DEFAULT_BRANDING: CustomerBranding = {
  customerId: '',
  appName: 'Learning App',
  aiTutorName: 'AI Tutor',
  doubtSectionName: 'Ask Doubts',
  assignmentName: 'Assignment',
  testName: 'Test',
  liveClassName: 'Live Class',
  textOverrides: {},
};
```

### Step 0.4: Navigation Types

**File: `src/types/navigation.types.ts`**

```typescript
export type TabId = string;

export type TabConfig = {
  tabId: TabId;
  customerId: string;
  role: string;
  label: string;
  labelKey?: string;
  icon: string;
  orderIndex: number;
  enabled: boolean;
  rootScreenId: string;
  screens: string[];
  badge?: TabBadgeConfig;
  requiresOnline?: boolean;
  requiredPermission?: string;
  requiredFeature?: string;
};

export type TabBadgeConfig = {
  type: "count" | "dot" | "none";
  source?: string;
};

export type NavigationConfig = {
  customerId: string;
  role: string;
  tabs: TabConfig[];
};
```

---

## 🗄️ Phase 1: Database Schema

### Step 1.1: Core Tables

**File: `supabase/migrations/001_core_tables.sql`**

```sql
-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  subscription_tier TEXT DEFAULT 'basic',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  role TEXT NOT NULL,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer features
CREATE TABLE customer_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  feature_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  emergency_disabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, feature_id)
);
```

### Step 1.2: Navigation Tables

**File: `supabase/migrations/002_navigation_tables.sql`**

```sql
-- Navigation tabs (1-10 per customer)
CREATE TABLE navigation_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  role TEXT NOT NULL,
  tab_id TEXT NOT NULL,
  label TEXT NOT NULL,
  label_key TEXT,
  icon TEXT NOT NULL,
  order_index INT NOT NULL CHECK (order_index >= 1 AND order_index <= 10),
  enabled BOOLEAN DEFAULT true,
  root_screen_id TEXT NOT NULL,
  badge_type TEXT DEFAULT 'none',
  badge_source TEXT,
  requires_online BOOLEAN DEFAULT false,
  required_permission TEXT,
  required_feature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, role, tab_id)
);

-- Navigation screens
CREATE TABLE navigation_screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  role TEXT NOT NULL,
  tab_id TEXT NOT NULL,
  screen_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  order_index INT DEFAULT 0,
  UNIQUE(customer_id, role, tab_id, screen_id)
);

CREATE INDEX idx_nav_tabs_customer_role ON navigation_tabs(customer_id, role);
CREATE INDEX idx_nav_screens_customer_role ON navigation_screens(customer_id, role, tab_id);
```

### Step 1.3: Branding Table

**File: `supabase/migrations/003_branding_table.sql`**

```sql
-- Customer branding (white-label)
CREATE TABLE customer_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) UNIQUE,
  
  -- App Identity
  app_name TEXT DEFAULT 'Learning App',
  app_tagline TEXT,
  
  -- Logos & Assets
  logo_url TEXT,
  logo_small_url TEXT,
  logo_dark_url TEXT,
  splash_image_url TEXT,
  login_hero_url TEXT,
  favicon_url TEXT,
  
  -- Feature Naming
  ai_tutor_name TEXT DEFAULT 'AI Tutor',
  doubt_section_name TEXT DEFAULT 'Ask Doubts',
  assignment_name TEXT DEFAULT 'Assignment',
  test_name TEXT DEFAULT 'Test',
  live_class_name TEXT DEFAULT 'Live Class',
  
  -- Contact Info
  support_email TEXT,
  support_phone TEXT,
  whatsapp_number TEXT,
  help_center_url TEXT,
  
  -- Legal Links
  terms_url TEXT,
  privacy_url TEXT,
  refund_url TEXT,
  
  -- Flexible Text Overrides
  text_overrides JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_branding_customer ON customer_branding(customer_id);
```

### Step 1.4: Screen Layout Tables

**File: `supabase/migrations/004_screen_layout_tables.sql`**

```sql
-- Widget definitions (global reference)
CREATE TABLE widget_definitions (
  widget_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  allowed_roles TEXT[] DEFAULT ARRAY['student', 'teacher', 'parent', 'admin'],
  allowed_screen_types TEXT[] DEFAULT ARRAY['any'],
  supported_sizes TEXT[] DEFAULT ARRAY['compact', 'standard', 'expanded'],
  default_size TEXT DEFAULT 'standard',
  default_props JSONB DEFAULT '{}',
  required_feature_id TEXT,
  required_permissions TEXT[],
  refreshable BOOLEAN DEFAULT true,
  offline_capable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screen definitions (global reference)
CREATE TABLE screen_definitions (
  screen_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  screen_type TEXT NOT NULL,
  allowed_roles TEXT[] DEFAULT ARRAY['student', 'teacher', 'parent', 'admin'],
  default_layout TEXT DEFAULT 'vertical',
  scrollable BOOLEAN DEFAULT true,
  pull_to_refresh BOOLEAN DEFAULT true,
  header_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screen layouts (per customer - THE CORE TABLE)
CREATE TABLE screen_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  role TEXT NOT NULL,
  screen_id TEXT NOT NULL,
  widget_id TEXT NOT NULL,
  position INT NOT NULL,
  size TEXT DEFAULT 'standard',
  enabled BOOLEAN DEFAULT true,
  grid_column INT,
  grid_row INT,
  custom_props JSONB DEFAULT '{}',
  visibility_rules JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, role, screen_id, widget_id)
);

CREATE INDEX idx_screen_layouts_lookup ON screen_layouts(customer_id, role, screen_id);
```


---

## 🧩 Phase 2: Widget Registry

### Step 2.1: Create Widget Registry

**File: `src/config/widgetRegistry.ts`**

```typescript
import { WidgetRegistryEntry, WidgetId } from '../types/widget.types';

// Import all widgets
import { TodayScheduleWidget } from '../widgets/schedule/TodayScheduleWidget';
import { WeeklyScheduleWidget } from '../widgets/schedule/WeeklyScheduleWidget';
import { DoubtsInboxWidget } from '../widgets/doubts/DoubtsInboxWidget';
import { QuickAskWidget } from '../widgets/doubts/QuickAskWidget';
import { PendingAssignmentsWidget } from '../widgets/assessment/PendingAssignmentsWidget';
import { UpcomingTestsWidget } from '../widgets/assessment/UpcomingTestsWidget';
import { ProgressSnapshotWidget } from '../widgets/progress/ProgressSnapshotWidget';
import { HeroGreetingWidget } from '../widgets/common/HeroGreetingWidget';
import { QuickActionsWidget } from '../widgets/common/QuickActionsWidget';
// ... import all widgets

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
        cacheKey: (props) => ['schedule', 'today', props.userId],
        prefetchOnScreenLoad: true,
        allowBackgroundRefresh: true,
        offlineBehavior: "show-cached",
      },
      defaultConfig: {},
      refreshable: true,
      cacheable: true,
      offlineCapable: true,
    },
  },

  "schedule.weekly": {
    component: WeeklyScheduleWidget,
    metadata: {
      id: "schedule.weekly",
      name: "Weekly Calendar",
      description: "Weekly calendar view",
      category: "schedule",
      allowedRoles: ["student", "teacher", "parent"],
      allowedScreenTypes: ["any"],
      supportedSizes: ["standard", "expanded"],
      defaultSize: "expanded",
      requiredPermissions: ["view_schedule"],
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 300000,
        cacheKey: (props) => ['schedule', 'weekly', props.userId],
        prefetchOnScreenLoad: false,
        allowBackgroundRefresh: true,
        offlineBehavior: "show-cached",
      },
      defaultConfig: {},
      refreshable: true,
      cacheable: true,
      offlineCapable: true,
    },
  },

  "doubts.inbox": {
    component: DoubtsInboxWidget,
    metadata: {
      id: "doubts.inbox",
      name: "Doubts Inbox",
      description: "Recent doubts and status",
      category: "doubts",
      allowedRoles: ["student", "teacher"],
      allowedScreenTypes: ["any"],
      supportedSizes: ["compact", "standard"],
      defaultSize: "standard",
      requiredFeatureId: "ask.doubts",
      requiredPermissions: ["view_doubts"],
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 120000,
        cacheKey: (props) => ['doubts', 'inbox', props.userId],
        prefetchOnScreenLoad: true,
        allowBackgroundRefresh: true,
        offlineBehavior: "show-cached",
      },
      defaultConfig: { limit: 5 },
      refreshable: true,
      cacheable: true,
      offlineCapable: true,
    },
  },

  "hero.greeting": {
    component: HeroGreetingWidget,
    metadata: {
      id: "hero.greeting",
      name: "Hero Greeting",
      description: "Welcome card with user stats",
      category: "profile",
      allowedRoles: ["student", "teacher", "parent", "admin"],
      allowedScreenTypes: ["dashboard"],
      supportedSizes: ["standard"],
      defaultSize: "standard",
      dataPolicy: {
        maxQueries: 1,
        staleTimeMs: 300000,
        cacheKey: (props) => ['user', 'summary', props.userId],
        prefetchOnScreenLoad: true,
        allowBackgroundRefresh: true,
        offlineBehavior: "show-cached",
      },
      defaultConfig: {},
      refreshable: false,
      cacheable: true,
      offlineCapable: true,
    },
  },

  "actions.quick": {
    component: QuickActionsWidget,
    metadata: {
      id: "actions.quick",
      name: "Quick Actions",
      description: "Quick action buttons",
      category: "actions",
      allowedRoles: ["student", "teacher", "parent", "admin"],
      allowedScreenTypes: ["dashboard", "hub"],
      supportedSizes: ["standard"],
      defaultSize: "standard",
      dataPolicy: {
        maxQueries: 0,
        staleTimeMs: Infinity,
        cacheKey: () => [],
        prefetchOnScreenLoad: false,
        allowBackgroundRefresh: false,
        offlineBehavior: "show-cached",
      },
      defaultConfig: {},
      refreshable: false,
      cacheable: false,
      offlineCapable: true,
    },
  },

  // ... add all 60+ widgets
};

// Helper functions
export function getWidget(widgetId: WidgetId): WidgetRegistryEntry | undefined {
  return widgetRegistry[widgetId];
}

export function getWidgetsByCategory(category: string): WidgetRegistryEntry[] {
  return Object.values(widgetRegistry).filter(
    entry => entry.metadata.category === category
  );
}

export function getWidgetsForRole(role: string): WidgetRegistryEntry[] {
  return Object.values(widgetRegistry).filter(
    entry => entry.metadata.allowedRoles.includes(role as any)
  );
}
```

---

## 📱 Phase 3: Screen Registry

### Step 3.1: Create Screen Registry

**File: `src/config/screenRegistry.ts`**

```typescript
import { ScreenDefinition } from '../types/screen.types';
import { DynamicScreen } from '../screens/DynamicScreen';
import { ClassDetailScreen } from '../screens/detail/ClassDetailScreen';
import { ResourceViewerScreen } from '../screens/detail/ResourceViewerScreen';
import { DoubtDetailScreen } from '../screens/detail/DoubtDetailScreen';
// ... import all screens

// Screen definitions
export const screenDefinitions: Record<string, ScreenDefinition> = {
  "student-home": {
    screenId: "student-home",
    name: "Student Home",
    screenType: "dashboard",
    allowedRoles: ["student"],
    defaultLayout: "vertical",
    scrollable: true,
    pullToRefresh: true,
    headerVisible: true,
  },
  "teacher-home": {
    screenId: "teacher-home",
    name: "Teacher Home",
    screenType: "dashboard",
    allowedRoles: ["teacher"],
    defaultLayout: "vertical",
    scrollable: true,
    pullToRefresh: true,
    headerVisible: true,
  },
  "study-hub": {
    screenId: "study-hub",
    name: "Study Hub",
    screenType: "hub",
    allowedRoles: ["student"],
    defaultLayout: "vertical",
    scrollable: true,
    pullToRefresh: true,
    headerVisible: true,
  },
  "doubts-home": {
    screenId: "doubts-home",
    name: "Doubts",
    screenType: "hub",
    allowedRoles: ["student", "teacher"],
    defaultLayout: "vertical",
    scrollable: true,
    pullToRefresh: true,
    headerVisible: true,
  },
  // ... add all screens
};

// Screen component registry
export const screenRegistry: Record<string, React.ComponentType<any>> = {
  // Dynamic screens (widget-based)
  "student-home": DynamicScreen,
  "teacher-home": DynamicScreen,
  "parent-home": DynamicScreen,
  "study-hub": DynamicScreen,
  "doubts-home": DynamicScreen,
  "progress-home": DynamicScreen,
  "profile-home": DynamicScreen,
  "schedule-screen": DynamicScreen,
  
  // Detail screens (non-widget)
  "class-detail": ClassDetailScreen,
  "resource-viewer": ResourceViewerScreen,
  "doubt-detail": DoubtDetailScreen,
  "assignment-detail": AssignmentDetailScreen,
  "test-attempt": TestAttemptScreen,
  // ... add all screens
};

export function getScreen(screenId: string): React.ComponentType<any> | undefined {
  return screenRegistry[screenId];
}

export function getScreenDefinition(screenId: string): ScreenDefinition | undefined {
  return screenDefinitions[screenId];
}
```


---

## 🔧 Phase 4: Config Services

### Step 4.1: Screen Layout Service

**File: `src/services/config/screenLayoutService.ts`**

```typescript
import { supabase } from '../supabaseClient';
import { ScreenLayoutConfig, ScreenWidgetConfig } from '../../types/screen.types';
import { DEFAULT_SCREEN_LAYOUTS } from '../../config/defaultConfig';

export async function fetchScreenLayout(
  customerId: string,
  role: string,
  screenId: string
): Promise<ScreenLayoutConfig> {
  try {
    const { data, error } = await supabase
      .from('screen_layouts')
      .select('*')
      .eq('customer_id', customerId)
      .eq('role', role)
      .eq('screen_id', screenId)
      .eq('enabled', true)
      .order('position', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      // Return default layout
      return getDefaultScreenLayout(screenId, role);
    }

    const widgets: ScreenWidgetConfig[] = data.map(row => ({
      widgetId: row.widget_id,
      position: row.position,
      size: row.size,
      enabled: row.enabled,
      gridColumn: row.grid_column,
      gridRow: row.grid_row,
      customProps: row.custom_props,
      visibilityRules: row.visibility_rules,
    }));

    return {
      screenId,
      customerId,
      role,
      tabId: '', // Filled by caller
      screenType: 'dashboard',
      widgets,
      layout: 'vertical',
      padding: 'md',
      gap: 'md',
      scrollable: true,
      pullToRefresh: true,
      headerVisible: true,
    };
  } catch (error) {
    console.error('Failed to fetch screen layout:', error);
    return getDefaultScreenLayout(screenId, role);
  }
}

function getDefaultScreenLayout(screenId: string, role: string): ScreenLayoutConfig {
  return DEFAULT_SCREEN_LAYOUTS[`${screenId}-${role}`] || DEFAULT_SCREEN_LAYOUTS['fallback'];
}
```

### Step 4.2: Navigation Service

**File: `src/services/config/navigationService.ts`**

```typescript
import { supabase } from '../supabaseClient';
import { TabConfig, NavigationConfig } from '../../types/navigation.types';
import { FALLBACK_TABS } from '../../config/defaultConfig';

export async function fetchNavigationTabs(
  customerId: string,
  role: string
): Promise<TabConfig[]> {
  try {
    const { data, error } = await supabase
      .from('navigation_tabs')
      .select('*')
      .eq('customer_id', customerId)
      .eq('role', role)
      .eq('enabled', true)
      .order('order_index', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return FALLBACK_TABS;
    }

    return data.map(row => ({
      tabId: row.tab_id,
      customerId: row.customer_id,
      role: row.role,
      label: row.label,
      labelKey: row.label_key,
      icon: row.icon,
      orderIndex: row.order_index,
      enabled: row.enabled,
      rootScreenId: row.root_screen_id,
      screens: [], // Fetched separately if needed
      badge: row.badge_type !== 'none' ? {
        type: row.badge_type,
        source: row.badge_source,
      } : undefined,
      requiresOnline: row.requires_online,
      requiredPermission: row.required_permission,
      requiredFeature: row.required_feature,
    }));
  } catch (error) {
    console.error('Failed to fetch navigation tabs:', error);
    return FALLBACK_TABS;
  }
}
```

---

## 🧭 Phase 5: Dynamic Navigation

### Step 5.1: Dynamic Navigator

**File: `src/navigation/DynamicNavigator.tsx`**

```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useNavigationTabs } from '../hooks/config/useNavigationTabs';
import { useAuth } from '../hooks/useAuth';
import { DynamicTabBar } from './DynamicTabBar';
import { NavigationErrorBoundary } from './NavigationErrorBoundary';
import { getScreen } from '../config/screenRegistry';
import { ScreenPlaceholder } from '../screens/ScreenPlaceholder';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export function DynamicNavigator() {
  const { customerId, role } = useAuth();
  const { data: tabs, isLoading, error } = useNavigationTabs(customerId, role);

  if (isLoading) {
    return <NavigationSkeleton />;
  }

  if (error || !tabs || tabs.length === 0) {
    return <FallbackNavigator />;
  }

  return (
    <NavigationErrorBoundary>
      <NavigationContainer>
        <Tab.Navigator
          tabBar={(props) => <DynamicTabBar {...props} tabs={tabs} />}
          screenOptions={{ headerShown: false }}
        >
          {tabs.map((tab) => (
            <Tab.Screen
              key={tab.tabId}
              name={tab.tabId}
              options={{
                tabBarLabel: tab.label,
                tabBarIcon: ({ color }) => (
                  <TabIcon name={tab.icon} color={color} />
                ),
              }}
            >
              {() => <TabStack tab={tab} />}
            </Tab.Screen>
          ))}
        </Tab.Navigator>
      </NavigationContainer>
    </NavigationErrorBoundary>
  );
}

function TabStack({ tab }: { tab: TabConfig }) {
  const RootScreen = getScreen(tab.rootScreenId) || ScreenPlaceholder;

  return (
    <Stack.Navigator>
      <Stack.Screen
        name={tab.rootScreenId}
        component={RootScreen}
        initialParams={{ screenId: tab.rootScreenId, tabId: tab.tabId }}
        options={{ headerShown: false }}
      />
      {/* Add other screens in this tab's stack */}
    </Stack.Navigator>
  );
}
```

---

## 📱 Phase 6: Dynamic Screens

### Step 6.1: Dynamic Screen Component

**File: `src/screens/DynamicScreen.tsx`**

```tsx
import React from 'react';
import { ScrollView, View, RefreshControl } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useScreenLayout } from '../hooks/config/useScreenLayout';
import { useAuth } from '../hooks/useAuth';
import { widgetRegistry } from '../config/widgetRegistry';
import { WidgetErrorBoundary } from '../widgets/base/WidgetErrorBoundary';
import { WidgetContainer } from '../widgets/base/WidgetContainer';
import { WidgetSkeleton } from '../widgets/base/WidgetSkeleton';
import { ScreenFallback } from './ScreenFallback';
import { checkVisibilityRules } from '../utils/visibilityRules';
import { usePermissions } from '../hooks/config/usePermissions';
import { useFeatures } from '../hooks/config/useFeatures';

export function DynamicScreen() {
  const route = useRoute();
  const { screenId, tabId } = route.params as { screenId: string; tabId: string };
  const { customerId, userId, role } = useAuth();
  const { permissions } = usePermissions();
  const { features } = useFeatures();
  const navigation = useNavigation();

  const {
    data: layout,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useScreenLayout(customerId, role, screenId);

  if (isLoading) {
    return <ScreenSkeleton />;
  }

  if (error || !layout) {
    return <ScreenFallback screenId={screenId} onRetry={refetch} />;
  }

  // Filter and sort widgets
  const enabledWidgets = layout.widgets
    .filter(w => w.enabled)
    .filter(w => {
      const entry = widgetRegistry[w.widgetId];
      if (!entry) return false;
      
      // Check role
      if (!entry.metadata.allowedRoles.includes(role)) return false;
      
      // Check permissions
      if (entry.metadata.requiredPermissions) {
        const hasAll = entry.metadata.requiredPermissions.every(p => permissions.includes(p));
        if (!hasAll) return false;
      }
      
      // Check feature
      if (entry.metadata.requiredFeatureId) {
        if (!features[entry.metadata.requiredFeatureId]?.enabled) return false;
      }
      
      // Check visibility rules
      if (w.visibilityRules && w.visibilityRules.length > 0) {
        if (!checkVisibilityRules(w.visibilityRules, { permissions, features })) return false;
      }
      
      return true;
    })
    .sort((a, b) => a.position - b.position);

  const handleNavigate = (routeName: string, params?: any) => {
    navigation.navigate(routeName, params);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: getPadding(layout.padding), gap: getGap(layout.gap) }}
      refreshControl={
        layout.pullToRefresh ? (
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        ) : undefined
      }
    >
      {enabledWidgets.map((widgetConfig) => {
        const entry = widgetRegistry[widgetConfig.widgetId];
        if (!entry) return null;

        const { component: WidgetComponent, metadata } = entry;

        return (
          <WidgetErrorBoundary
            key={widgetConfig.widgetId}
            widgetId={widgetConfig.widgetId}
            screenId={screenId}
          >
            <WidgetContainer metadata={metadata} size={widgetConfig.size}>
              <WidgetComponent
                customerId={customerId}
                userId={userId}
                role={role}
                screenId={screenId}
                tabId={tabId}
                position={widgetConfig.position}
                size={widgetConfig.size}
                config={widgetConfig.customProps || {}}
                onNavigate={handleNavigate}
              />
            </WidgetContainer>
          </WidgetErrorBoundary>
        );
      })}

      {enabledWidgets.length === 0 && (
        <EmptyScreenMessage screenId={screenId} />
      )}
    </ScrollView>
  );
}
```

---

## ✅ Phase Completion Checklist

### Phase 0-3: Foundation
- [ ] All types defined
- [ ] Database tables created
- [ ] Widget registry with 60+ widgets
- [ ] Screen registry with all screens

### Phase 4-6: Core System
- [ ] Config services working
- [ ] Dynamic navigation (1-10 tabs)
- [ ] Dynamic screens rendering widgets

### Phase 7-9: Features
- [ ] All widgets implemented
- [ ] Permission engine working
- [ ] Theme system working

### Phase 10: Platform Studio
- [ ] Next.js project setup
- [ ] Drag & drop builder (dnd-kit)
- [ ] Live mobile preview (React Native Web)
- [ ] Publish system with validation
- [ ] Real-time sync to mobile
- [ ] Debug console with logging
- [ ] Template system
- [ ] Version history & rollback

### Phase 11: Testing & Hardening
- [ ] Full test coverage
- [ ] E2E tests
- [ ] Load tests

---

## 🎨 Phase 10: Platform Studio

**See:** `PLATFORM_STUDIO_TECHNICAL_SPEC.md` for complete technical specification.

### Step 10.1: Project Setup

**File: `studio/package.json`**

```json
{
  "name": "platform-studio",
  "dependencies": {
    "next": "^14.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@dnd-kit/core": "^6.0.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^5.0.0",
    "zod": "^3.0.0",
    "react-native-web": "^0.19.0"
  }
}
```

### Step 10.2: Branding Service

**File: `src/services/config/brandingService.ts`**

```typescript
import { supabase } from '../supabaseClient';
import { CustomerBranding, DEFAULT_BRANDING } from '../../types/branding.types';

export async function fetchCustomerBranding(customerId: string): Promise<CustomerBranding> {
  try {
    const { data, error } = await supabase
      .rpc('get_customer_branding', { p_customer_id: customerId });

    if (error) throw error;
    if (!data) return { ...DEFAULT_BRANDING, customerId };

    return {
      customerId,
      appName: data.app_name,
      appTagline: data.app_tagline,
      logoUrl: data.logo_url,
      logoSmallUrl: data.logo_small_url,
      logoDarkUrl: data.logo_dark_url,
      splashImageUrl: data.splash_image_url,
      loginHeroUrl: data.login_hero_url,
      aiTutorName: data.ai_tutor_name,
      doubtSectionName: data.doubt_section_name,
      assignmentName: data.assignment_name,
      testName: data.test_name,
      liveClassName: data.live_class_name,
      supportEmail: data.support_email,
      supportPhone: data.support_phone,
      whatsappNumber: data.whatsapp_number,
      helpCenterUrl: data.help_center_url,
      termsUrl: data.terms_url,
      privacyUrl: data.privacy_url,
      textOverrides: data.text_overrides || {},
    };
  } catch (error) {
    console.error('Failed to fetch branding:', error);
    return { ...DEFAULT_BRANDING, customerId };
  }
}
```

### Step 10.3: Branding Hook

**File: `src/hooks/config/useCustomerBranding.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchCustomerBranding } from '../../services/config/brandingService';
import { CustomerBranding, DEFAULT_BRANDING } from '../../types/branding.types';

export function useCustomerBranding(customerId: string) {
  return useQuery<CustomerBranding>({
    queryKey: ['customer-branding', customerId],
    queryFn: () => fetchCustomerBranding(customerId),
    staleTime: 30 * 60 * 1000, // 30 minutes
    placeholderData: { ...DEFAULT_BRANDING, customerId },
  });
}

// Helper hook for getting branded text
export function useBrandedText(key: string, fallback: string): string {
  const { customerId } = useAuth();
  const { data: branding } = useCustomerBranding(customerId);
  
  // Check text overrides first
  if (branding?.textOverrides?.[key]) {
    return branding.textOverrides[key];
  }
  
  // Check specific branding fields
  const brandingMap: Record<string, keyof CustomerBranding> = {
    'ai_tutor': 'aiTutorName',
    'doubts': 'doubtSectionName',
    'assignment': 'assignmentName',
    'test': 'testName',
    'live_class': 'liveClassName',
  };
  
  if (brandingMap[key] && branding?.[brandingMap[key]]) {
    return branding[brandingMap[key]] as string;
  }
  
  return fallback;
}
```

### Step 10.4: Real-Time Config Subscription

**File: `src/hooks/config/useConfigSubscription.ts`**

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';

export function useConfigSubscription(customerId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = supabase
      .channel(`config-${customerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'config_change_events',
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          console.log('Config changed:', payload);
          
          // Invalidate all config queries
          queryClient.invalidateQueries({ queryKey: ['customer-config', customerId] });
          queryClient.invalidateQueries({ queryKey: ['screen-layout', customerId] });
          queryClient.invalidateQueries({ queryKey: ['navigation-tabs', customerId] });
          queryClient.invalidateQueries({ queryKey: ['customer-theme', customerId] });
          queryClient.invalidateQueries({ queryKey: ['customer-branding', customerId] });
          
          // Optional: Show toast
          showToast('App configuration updated!');
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [customerId, queryClient]);
}
```

---

## 🎯 Summary

This implementation guide provides:

✅ **Universal widgets** — Any widget, any screen  
✅ **Dynamic tabs** — 1-10 tabs per customer  
✅ **Type-safe** — Full TypeScript coverage  
✅ **Fallback-safe** — Defaults at every level  
✅ **Scalable** — Add widgets without breaking existing  

**Key Principle:** The UI is 100% config-driven. Zero hardcoding for customer-specific behavior.

```
End of IMPLEMENTATION_MASTER_GUIDE.md
```
