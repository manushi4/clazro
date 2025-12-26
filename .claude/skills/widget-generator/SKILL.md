---
name: widget-generator
description: |
  Generate complete widgets for the CoComplete platform following the 9-phase development workflow.
  Use this skill when:
  - User asks to "create a widget", "add a widget", "generate widget", or "build widget"
  - User wants to add a new configurable UI component to the mobile app
  - User needs a reusable component that appears on dashboard screens
  - User mentions widget IDs like "category.name" format

  This skill generates all required files: database migrations, query hooks, widget components,
  translations (English + Hindi), mobile registry entries, Platform Studio registry entries,
  database screen layout insertions, app fallback layouts, and Platform Studio screen configurations.
---

# Widget Generator

Generate complete, production-ready widgets following all 9 phases.

## 🚨 CRITICAL UPDATES (Dec 2024)

**MANDATORY CHANGES - READ BEFORE PROCEEDING:**

1. **NEVER SKIP PHASES** ❌
   - OLD: "Skip Phase 1 if using existing data"
   - NEW: Execute ALL 7 phases every time, no exceptions

2. **SUPABASE MCP ONLY** ✅
   - OLD: Write migration files
   - NEW: Use `mcp__supabase__apply_migration` and `mcp__supabase__execute_sql`

3. **CORRECT RLS POLICY** ✅
   - OLD: `user_roles WHERE user_id = auth.uid()` ❌ WRONG!
   - NEW: `user_profiles WHERE user_id = auth.uid()::text` ✅ CORRECT!
   - The `user_roles` table doesn't exist - always use `user_profiles`
   - auth.uid() returns UUID - cast to ::text to match user_id column

4. **RLS TROUBLESHOOTING** 🔍
   - If widget shows "No data available", user needs user_profiles entry
   - See "Troubleshooting RLS Issues" section at end of this guide

---

## Quick Start - Gather Requirements

Before generating, collect:

| Input | Required | Example |
|-------|----------|---------|
| Widget ID | Yes | `progress.weekly`, `parent.feesSummary` |
| Purpose | Yes | "Shows weekly progress with chart" |
| Target Roles | Yes | `["student", "parent"]` |
| Data Source | Depends | New table or existing query |
| Target Screen | Yes | `student-home`, `parent-home` |

## Execution Phases

**CRITICAL RULES:**
1. **NEVER SKIP ANY PHASE** - Execute all 9 phases even if data exists
2. **USE SUPABASE MCP ONLY** - Use `mcp__supabase__apply_migration` and `mcp__supabase__execute_sql`
3. **CORRECT RLS POLICY** - Always use `user_profiles` table (not user_roles)
4. **VERIFY EACH PHASE** - Confirm completion before moving to next phase
5. **ALWAYS ADD FALLBACK** - Phase 8 ensures widget works when database is unavailable

**Phase Overview:**
| Phase | Description | File/Location |
|-------|-------------|---------------|
| 1 | Database Setup | Supabase MCP |
| 2 | Query Hook | `src/hooks/queries/{role}/` |
| 3 | Widget Component | `src/components/widgets/{category}/` |
| 4 | Translations | `src/locales/en/` + `src/locales/hi/` |
| 5 | Mobile App Registry | `src/config/widgetRegistry.ts` |
| 6 | Platform Studio Registry | `platform-studio/src/config/widgetRegistry.ts` |
| 7 | Database Screen Layout | Supabase `screen_layouts` table |
| 8 | App Fallback Layout | `src/services/config/configService.ts` |
| 9 | Platform Studio Screen | `platform-studio/src/config/screenRegistry.ts` |

---

### PHASE 1: Database Setup

**ALWAYS CREATE TABLE** - Use Supabase MCP tool `mcp__supabase__apply_migration`

```typescript
// Step 1: Create table with correct RLS policy
mcp__supabase__apply_migration({
  name: "create_{table_name}_table",
  query: `
    -- Table creation
    CREATE TABLE IF NOT EXISTS {table_name} (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

      -- Localized content (REQUIRED for user-facing text)
      title_en TEXT NOT NULL,
      title_hi TEXT,
      description_en TEXT,
      description_hi TEXT,

      -- Domain-specific fields here
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_{table_name}_customer ON {table_name}(customer_id);

    -- RLS (CRITICAL - use user_profiles NOT user_roles)
    ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "{table_name}_tenant_isolation" ON {table_name}
      FOR ALL USING (
        customer_id IN (
          SELECT customer_id
          FROM user_profiles
          WHERE user_id = auth.uid()::text
        )
      );
  `
})
```

```typescript
// Step 2: Seed sample data
mcp__supabase__execute_sql({
  query: `
    INSERT INTO {table_name} (customer_id, title_en, title_hi, status)
    VALUES
      ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'Sample Item 1', 'नमूना आइटम 1', 'active'),
      ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'Sample Item 2', 'नमूना आइटम 2', 'active'),
      ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'Sample Item 3', 'नमूना आइटम 3', 'active')
    ON CONFLICT DO NOTHING;
  `
})
```

**RLS POLICY RULES:**
- ✅ CORRECT: `user_profiles WHERE user_id = auth.uid()::text`
- ❌ WRONG: `user_roles WHERE user_id = auth.uid()` (table doesn't exist!)
- user_id is TEXT type, so cast auth.uid() to text with `::text`

**Checklist:**
- [ ] Table created using `mcp__supabase__apply_migration`
- [ ] RLS uses `user_profiles` table
- [ ] auth.uid() cast to ::text
- [ ] Sample data inserted using `mcp__supabase__execute_sql`

---

### PHASE 2: Query Hook

Create: `src/hooks/queries/{role}/use{EntityName}Query.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type {EntityName} = {
  id: string;
  customer_id: string;
  title_en: string;
  title_hi?: string;
  // Add fields matching database
};

export function use{EntityName}Query(options?: { limit?: number }) {
  const customerId = useCustomerId();
  const limit = options?.limit || 10;

  return useQuery({
    queryKey: ['{entity-name}', customerId, { limit }],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('{table_name}')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as {EntityName}[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5,  // 5 minutes
  });
}
```

**Add export to:** `src/hooks/queries/{role}/index.ts`

---

### PHASE 3: Widget Component

Create: `src/components/widgets/{category}/{WidgetName}Widget.tsx`

```tsx
import React from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { getLocalizedField } from "../../../utils/getLocalizedField";
import { AppText } from "../../../ui/components/AppText";
import { use{EntityName}Query } from "../../../hooks/queries/{role}/use{EntityName}Query";

export const {WidgetName}Widget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");

  // === CONFIG (with defaults) ===
  const maxItems = (config?.maxItems as number) || 5;
  const showIcon = config?.showIcon !== false;
  const layoutStyle = (config?.layoutStyle as "list" | "cards" | "grid") || "list";

  // === DATA ===
  const { data, isLoading, error, refetch } = use{EntityName}Query({ limit: maxItems });

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.{widgetKey}.states.error", { defaultValue: "Failed to load" })}
        </AppText>
        <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.error }]}>
          <AppText style={{ color: colors.onError, fontSize: 12 }}>Retry</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // === EMPTY STATE ===
  if (!data?.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="inbox-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.{widgetKey}.states.empty", { defaultValue: "No items" })}
        </AppText>
      </View>
    );
  }

  // === SUCCESS STATE ===
  return (
    <View style={styles.container}>
      {data.slice(0, maxItems).map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => onNavigate?.("{detail-route}", { id: item.id })}
          style={[styles.item, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
        >
          {showIcon && (
            <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
              <Icon name="star" size={18} color={colors.primary} />
            </View>
          )}
          <View style={styles.content}>
            <AppText style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
              {getLocalizedField(item, 'title')}
            </AppText>
          </View>
          <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 8 },
  stateContainer: { padding: 20, borderRadius: 12, alignItems: "center", gap: 8 },
  retryBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginTop: 4 },
  item: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: "500" },
});
```

**Critical Rules:**
- NO hardcoded colors - always use `colors.*`
- Static UI → `t("key")`
- Database content → `getLocalizedField(item, 'field')`
- All 4 states: loading, error, empty, success

---

### PHASE 4: Translations

**English:** `src/locales/en/dashboard.json` (merge into existing)

```json
{
  "widgets": {
    "{widgetKey}": {
      "title": "{Widget Title}",
      "subtitle": "{Widget description}",
      "states": {
        "loading": "Loading...",
        "empty": "No items yet",
        "error": "Failed to load"
      },
      "actions": {
        "viewAll": "View All"
      }
    }
  }
}
```

**Hindi:** `src/locales/hi/dashboard.json` (merge into existing)

```json
{
  "widgets": {
    "{widgetKey}": {
      "title": "{विजेट शीर्षक}",
      "subtitle": "{विजेट विवरण}",
      "states": {
        "loading": "लोड हो रहा है...",
        "empty": "अभी तक कोई आइटम नहीं",
        "error": "लोड करने में विफल"
      },
      "actions": {
        "viewAll": "सभी देखें"
      }
    }
  }
}
```

---

### PHASE 5: Mobile App Registry

Add to: `src/config/widgetRegistry.ts`

```typescript
import { {WidgetName}Widget } from "../components/widgets/{category}/{WidgetName}Widget";

// Add to registry:
"{widget.id}": {
  component: {WidgetName}Widget,
  metadata: {
    id: "{widget.id}",
    titleKey: "dashboard:widgets.{widgetKey}.title",
    descriptionKey: "dashboard:widgets.{widgetKey}.subtitle",
    category: "{category}",
    featureId: "{feature.id}",
    roles: ["{role1}", "{role2}"],
    supportedSizes: ["compact", "standard", "expanded"],
    defaultSize: "standard",
    dataPolicy: {
      maxQueries: 1,
      staleTimeMs: 60000,
      prefetchOnDashboardLoad: true,
      offlineBehavior: "show-cached",
    },
    defaultConfig: {
      maxItems: 5,
      showIcon: true,
      layoutStyle: "list",
    },
    refreshable: true,
    cacheable: true,
    offlineCapable: true,
  },
},
```

---

### PHASE 6: Platform Studio Registry

**File 1:** `platform-studio/src/config/widgetRegistry.ts`

```typescript
"{widget.id}": {
  id: "{widget.id}",
  name: "{Widget Display Name}",
  description: "{Brief description}",
  category: "{category}",
  icon: "{lucide-icon-name}",
  allowedRoles: ["{role1}", "{role2}"],
  allowedScreenTypes: ["dashboard", "hub"],
  supportedSizes: ["compact", "standard", "expanded"],
  defaultSize: "standard",
},
```

**File 2:** `platform-studio/src/components/builder/WidgetPropertiesPanel.tsx`

Add to `WIDGET_CONFIGS`:

```typescript
"{widget.id}": {
  sections: [
    {
      title: "Display",
      icon: "layout",
      fields: [
        { key: "maxItems", label: "Max Items", type: "number", min: 1, max: 20, default: 5 },
        { key: "layoutStyle", label: "Layout", type: "select", options: ["list", "cards", "grid"], default: "list" },
        { key: "showIcon", label: "Show Icons", type: "boolean", default: true },
      ],
    },
  ],
},
```

**CRITICAL SYNC RULES:**
- Widget ID must match EXACTLY across mobile + Platform Studio + database
- Config keys must match EXACTLY (e.g., `maxItems` not `max_items`)
- Default values must be IDENTICAL

---

### PHASE 7: Database Screen Layout

**ALWAYS ADD TO DATABASE** - Use Supabase MCP tool `mcp__supabase__execute_sql`

```typescript
// Insert widget into screen_layouts table
mcp__supabase__execute_sql({
  query: `
    INSERT INTO screen_layouts (
      customer_id,
      role,
      screen_id,
      widget_id,
      position,
      enabled,
      size,
      custom_props
    ) VALUES (
      '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
      '{role}',
      '{screen_id}',
      '{widget.id}',
      {position},
      true,
      'standard',
      '{
        "showIcon": true,
        "maxItems": 5
      }'::jsonb
    )
    ON CONFLICT (customer_id, role, screen_id, widget_id)
    DO UPDATE SET
      position = EXCLUDED.position,
      custom_props = EXCLUDED.custom_props;
  `
})
```

**Common Screen IDs:**
- Admin: `admin-home`, `admin-dashboard`, `admin-finance-home`
- Teacher: `teacher-home`, `teacher-dashboard`
- Parent: `parent-home`, `parent-dashboard`
- Student: `student-home`, `dashboard`

**Checklist:**
- [ ] Widget added to appropriate screen using MCP
- [ ] custom_props match defaultConfig from mobile registry
- [ ] ON CONFLICT clause prevents duplicates

---

### PHASE 8: Mobile App Screen Layout (configService.ts)

**MANDATORY: Add widget to mobile app's DEFAULT_SCREEN_LAYOUTS**

This ensures the widget appears on the screen even when database is unavailable.

**File:** `src/services/config/configService.ts`

**Steps:**
1. Open `src/services/config/configService.ts`
2. Find `DEFAULT_SCREEN_LAYOUTS` object
3. Locate the target screen (e.g., `"teacher-home"`)
4. Add widget entry with correct position

```typescript
// Example for teacher-home screen:
"teacher-home": [
  { widgetId: "teacher.hero-card", position: 1, size: "expanded", enabled: true, customProps: { ... } },
  { widgetId: "teacher.stats-grid", position: 2, size: "standard", enabled: true, customProps: { ... } },
  { widgetId: "teacher.upcoming-classes", position: 3, size: "standard", enabled: true, customProps: { maxItems: 5 } },
  // ADD NEW WIDGET HERE:
  { widgetId: "{widget.id}", position: 4, size: "standard", enabled: true, customProps: { maxItems: 5, showProgress: true } },
],
```

**Screen ID Mapping:**
| Role | Screen ID | File Location |
|------|-----------|---------------|
| Admin | `admin-home` | Line ~160 |
| Teacher | `teacher-home` | Line ~182 |
| Parent | `parent-home` | Line ~200 |
| Student | `student-home` | Line ~140 |
| Student | `dashboard` | Line ~150 |

**IMPORTANT Rules:**
- Position must be sequential (1, 2, 3, 4...)
- `customProps` must match `defaultConfig` from Phase 5
- `size` must match `defaultSize` from Phase 5
- Use `enabled: true` for the widget to appear

**Checklist:**
- [ ] Opened `src/services/config/configService.ts`
- [ ] Found correct screen in `DEFAULT_SCREEN_LAYOUTS`
- [ ] Added widget with correct position number
- [ ] `customProps` match Phase 5 `defaultConfig`

---

### PHASE 9: Platform Studio Screen Builder

**MANDATORY: Add widget to Platform Studio's configStore defaults**

This makes the widget appear in Platform Studio's screen builder when editing screens.

**File:** `platform-studio/src/stores/configStore.ts`

**Steps:**
1. Open `platform-studio/src/stores/configStore.ts`
2. Find `initialScreenLayouts` or `DEFAULT_LAYOUTS` object
3. Locate the target screen and role
4. Add widget to the widgets array

```typescript
// Example structure:
const initialScreenLayouts = {
  teacher: {
    "teacher-home": {
      widgets: [
        { widget_id: "teacher.hero-card", position: 1, size: "expanded", config: {} },
        { widget_id: "teacher.stats-grid", position: 2, size: "standard", config: {} },
        // ADD NEW WIDGET HERE:
        { widget_id: "{widget.id}", position: 4, size: "standard", config: { maxItems: 5 } },
      ],
    },
  },
};
```

**If configStore doesn't have default layouts**, add to screenRegistry.ts instead:

**File:** `platform-studio/src/config/screenRegistry.ts`

```typescript
"{screen_id}": {
  screen_id: "{screen_id}",
  name: "{Screen Name}",
  // ... other properties ...
  defaultWidgets: [
    { widget_id: "{widget.id}", position: 4, size: "standard", config: { maxItems: 5 } },
  ],
},
```

**Platform Studio Widget Visibility Rules:**
1. Widget must be registered in `platform-studio/src/config/widgetRegistry.ts` (Phase 6)
2. Widget `category` should be "schedule" or "study" (expanded by default)
3. Widget `allowedRoles` must include the selected role
4. User must select correct role in Platform Studio dropdown

**CRITICAL Category Note:**
```typescript
// Use "schedule" category for teacher widgets (expanded by default):
"teacher.pending-grading": {
  category: "schedule",  // NOT "assessment" - assessment is collapsed!
  allowedRoles: ["teacher"],
  // ...
}
```

**Checklist:**
- [ ] Widget added to configStore or screenRegistry defaults
- [ ] Widget category is "schedule" or "study" (visible by default)
- [ ] `allowedRoles` includes target role
- [ ] Verified by selecting role in Platform Studio and checking widget palette

---

## Verification Checklist

After all 9 phases, verify:

### Mobile App
- [ ] Widget renders with theme colors
- [ ] Dark mode works
- [ ] Hindi translations display
- [ ] Loading/error/empty states work
- [ ] Navigation works
- [ ] Widget appears on target screen (from fallback layout)

### Platform Studio Sync
- [ ] Widget appears in widget palette
- [ ] Properties panel shows config options
- [ ] Preview updates on config change
- [ ] Save changes reflect in mobile app
- [ ] Widget appears in screen's default widgets (if added)

### Database
- [ ] RLS allows correct role access
- [ ] Localized data returns correctly

### Fallback Behavior
- [ ] Widget works when database is unavailable
- [ ] Demo data displays correctly
- [ ] Fallback layout matches database layout

---

## Widget ID Convention

Format: `{category}.{name}`

| Category | Use For |
|----------|---------|
| schedule | Calendar, timetable |
| study | Library, content, notes |
| assessment | Assignments, tests |
| progress | Analytics, streaks |
| doubts | Q&A, questions |
| ai | AI tutor, recommendations |
| actions | Quick action buttons |
| profile | User profile |
| parent | Parent-specific |
| admin | Admin dashboard |
| finance | Financial widgets |

**Examples:** `schedule.today`, `progress.weekly`, `parent.childOverview`, `admin.userStats`

---

## Common Hindi Translations

| English | Hindi |
|---------|-------|
| Loading... | लोड हो रहा है... |
| No items | कोई आइटम नहीं |
| View All | सभी देखें |
| Retry | पुनः प्रयास करें |
| Today | आज |
| Pending | लंबित |
| Completed | पूर्ण |
| Progress | प्रगति |
| Attendance | उपस्थिति |
| Performance | प्रदर्शन |

---

## Theme Colors Reference

```typescript
const { colors } = useAppTheme();

// Text
colors.onSurface        // Primary text
colors.onSurfaceVariant // Secondary text

// Backgrounds
colors.surface          // Card background
colors.surfaceVariant   // Item background

// Brand/Status
colors.primary          // Primary actions
colors.success          // Success (green)
colors.warning          // Warning (orange)
colors.error            // Error (red)

// Opacity backgrounds
`${colors.primary}15`   // 15 = ~9% opacity
```

---

## Troubleshooting RLS Issues

If widget shows **"No data available"** or **"No metrics available"**:

### Issue: RLS Policy Blocking Access

**Symptoms:**
- Widget shows empty state
- Database has data when queried directly
- No errors in console

**Root Cause:** User doesn't have entry in `user_profiles` table

**Fix:**
```typescript
// Step 1: Find the logged-in user's ID
mcp__supabase__execute_sql({
  query: `SELECT id, email FROM auth.users LIMIT 5;`
})

// Step 2: Check if user exists in user_profiles
mcp__supabase__execute_sql({
  query: `
    SELECT user_id, customer_id, role, display_name
    FROM user_profiles
    WHERE customer_id = '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46';
  `
})

// Step 3: If user missing, create profile entry
mcp__supabase__execute_sql({
  query: `
    INSERT INTO user_profiles (
      user_id,
      customer_id,
      first_name,
      last_name,
      display_name,
      email,
      role,
      is_active
    ) VALUES (
      '{actual_user_id}',  -- Replace with auth.users.id or custom ID
      '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
      'User',
      'Name',
      '{display_name}',
      '{email}',
      '{role}',  -- admin, teacher, parent, or student
      true
    );
  `
})
```

**Alternative: Temporarily disable RLS for testing**
```typescript
// ONLY FOR DEBUGGING - Re-enable after testing!
mcp__supabase__execute_sql({
  query: `ALTER TABLE {table_name} DISABLE ROW LEVEL SECURITY;`
})

// After confirming widget works, re-enable:
mcp__supabase__execute_sql({
  query: `ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;`
})
```

---

## Reference Documents

For detailed patterns, see:
- `C:\comeplete\Doc\WIDGET_DEVELOPMENT_GUIDE.md` - Complete development guide
- `C:\comeplete\Doc\SCREEN_DEVELOPMENT_GUIDE.md` - Screen creation guide
- `C:\comeplete\skills\widget-generator\references\` - Additional templates
