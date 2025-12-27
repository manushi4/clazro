---
name: fixed-screen-generator
description: |
  Create fixed (non-widget-based) screens following the 8-phase development workflow.
  Use this skill when creating admin screens, detail screens, forms, or any screen that requires
  custom React components rather than widget-based dynamic screens.

  Triggers:
  - "create a fixed screen for..."
  - "create [ScreenName]Screen"
  - "add detail screen for..."
  - "create form screen..."
  - User asks for screens that need: complex forms, specialized UI, auth flows,
    detail views, wizards, or any screen not suitable for widget composition.

  This skill uses Supabase MCP tools (mcp__supabase__apply_migration, mcp__supabase__execute_sql)
  for all database operations. NEVER create migration files manually.
---

# Fixed Screen Generator

Create production-ready fixed screens following the 8-phase development workflow.

## CRITICAL RULES

1. **NEVER SKIP ANY PHASE** - All 8 phases must be completed in order
2. **USE SUPABASE MCP ONLY** - Use `mcp__supabase__apply_migration` for DDL, `mcp__supabase__execute_sql` for queries
3. **CORRECT RLS PATTERN** - Always use `user_profiles WHERE user_id = auth.uid()::text`
4. **ALL 4 STATES REQUIRED** - Every screen must handle: Loading, Error, Empty, Success

---

## 8-PHASE WORKFLOW

```
PHASE 1: Planning & Analysis
    ↓
PHASE 2: Database Setup (Supabase MCP)
    ↓
PHASE 3: Query/Mutation Hooks
    ↓
PHASE 4: Screen Component
    ↓
PHASE 5: Route Registration
    ↓
PHASE 6: Translations (i18n)
    ↓
PHASE 7: Navigation Integration
    ↓
PHASE 8: Testing & Verification
```

---

## PHASE 1: Planning & Analysis

### Required Decisions

| Decision | Options | Example |
|----------|---------|---------|
| Screen ID | `<category>-<purpose>[-<detail>]` | `student-fee-detail` |
| Category | admin, fees, payroll, academic, admissions | `fees` |
| Screen Type | detail, list, form, wizard, dashboard | `detail` |
| Roles | admin, teacher, parent, student | `['admin', 'parent']` |
| Data Source | existing table or new table | `student_fees` |
| Navigation From | which widgets/screens link here | `StudentFeesDashboardWidget` |

### Naming Conventions

```
Screen ID:     student-fee-detail (kebab-case)
Screen File:   StudentFeeDetailScreen.tsx (PascalCase + Screen)
Hook File:     useStudentFeeDetailQuery.ts (camelCase with use prefix)
Route Alias:   StudentFeeDetail (PascalCase, no Screen suffix)
```

---

## PHASE 2: Database Setup (Supabase MCP)

### ALWAYS Use Supabase MCP Tools

```
DDL Operations (CREATE, ALTER, DROP):
→ mcp__supabase__apply_migration

DML Operations (SELECT, INSERT, UPDATE, DELETE):
→ mcp__supabase__execute_sql
```

### Migration Template

Use `mcp__supabase__apply_migration` with this pattern:

```sql
-- Migration: YYYYMMDD_create_<table_name>.sql
-- Purpose: <description>

-- 1. CREATE TABLE
CREATE TABLE IF NOT EXISTS <table_name> (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy (REQUIRED)
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Ownership (if applicable)
  user_id TEXT NOT NULL,  -- References user_profiles.user_id

  -- Localized content (for user-facing text)
  title_en TEXT NOT NULL,
  title_hi TEXT,
  description_en TEXT,
  description_hi TEXT,

  -- Domain-specific columns
  -- ... add your columns here ...

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE INDEXES
CREATE INDEX idx_<table>_customer ON <table_name>(customer_id);
CREATE INDEX idx_<table>_user ON <table_name>(user_id);
CREATE INDEX idx_<table>_status ON <table_name>(status);

-- 3. ENABLE RLS (CRITICAL)
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICY (CORRECT PATTERN)
CREATE POLICY "<table>_tenant_isolation" ON <table_name>
  FOR ALL USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles
      WHERE user_id = auth.uid()::text
    )
  );

-- 5. CREATE updated_at TRIGGER
CREATE TRIGGER <table>_updated_at
  BEFORE UPDATE ON <table_name>
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Seed Sample Data

Use `mcp__supabase__execute_sql`:

```sql
INSERT INTO <table_name> (customer_id, user_id, title_en, title_hi, ...)
SELECT
  '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
  up.user_id,
  'Sample Title',
  'नमूना शीर्षक',
  ...
FROM user_profiles up
WHERE up.role = 'admin'
LIMIT 5;
```

---

## PHASE 3: Query/Mutation Hooks

### File Location

```
src/hooks/queries/admin/use<Entity>Query.ts      (for queries)
src/hooks/mutations/admin/use<Action><Entity>.ts (for mutations)
```

### Query Hook Template

See `references/hook-patterns.md` for complete template.

```typescript
// src/hooks/queries/admin/use<Entity>Query.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../services/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export type <Entity>Type = {
  id: string;
  title_en: string;
  title_hi?: string;
  // ... fields matching table schema
};

export function use<Entity>Query(entityId: string) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["<entity>", customerId, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("<table_name>")
        .select("*")
        .eq("customer_id", customerId)
        .eq("id", entityId)
        .single();

      if (error) throw error;
      return data as <Entity>Type;
    },
    staleTime: 2 * 60 * 1000,  // 2 minutes
    enabled: !!customerId && !!entityId,
  });
}
```

### Export from Index

Add to `src/hooks/queries/admin/index.ts`:

```typescript
export { use<Entity>Query } from './use<Entity>Query';
```

---

## PHASE 4: Screen Component

### File Location

```
src/screens/<category>/<ScreenName>Screen.tsx
```

### Screen Template

See `references/screen-template.md` for complete template with all patterns.

### Required Imports

```typescript
import React, { useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";
import { useBranding } from "../../context/BrandingContext";

// Analytics & Error Tracking
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";

// Localization
import { getLocalizedField } from "../../utils/getLocalizedField";

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Data Hooks
import { use<Entity>Query } from "../../hooks/queries/admin/use<Entity>Query";
```

### Required 4 States

```typescript
// 1. LOADING STATE
if (isLoading) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("common:status.loading")}
        </AppText>
      </View>
    </SafeAreaView>
  );
}

// 2. ERROR STATE
if (error) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        <Icon name="alert-circle-outline" size={64} color={colors.error} />
        <AppText style={[styles.errorTitle, { color: colors.error }]}>
          {t("common:errors.title")}
        </AppText>
        <AppText style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
          {t("screens.<screenId>.states.error")}
        </AppText>
        <AppButton
          title={t("common:actions.retry")}
          onPress={() => refetch()}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}

// 3. EMPTY STATE
if (!data) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        <Icon name="inbox-outline" size={64} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("screens.<screenId>.states.empty")}
        </AppText>
      </View>
    </SafeAreaView>
  );
}

// 4. SUCCESS STATE
return (
  <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
    <OfflineBanner />
    {/* Screen content here */}
  </SafeAreaView>
);
```

### Export from Index

Add to `src/screens/<category>/index.ts`:

```typescript
export { <ScreenName>Screen } from './<ScreenName>Screen';
```

---

## PHASE 5: Route Registration

### Add to routeRegistry.ts

Location: `src/navigation/routeRegistry.ts`

1. Add import at top:

```typescript
import { <ScreenName>Screen } from "../screens/<category>";
```

2. Add route entries:

```typescript
const registry: Record<string, RouteDefinition> = {
  // ... existing entries

  // <Category> - <ScreenName> (Fixed screen)
  "<screen-id>": { screenId: "<screen-id>", component: <ScreenName>Screen },
  "<ScreenName>": { screenId: "<ScreenName>", component: <ScreenName>Screen },
};
```

---

## PHASE 6: Translations (i18n)

### English Translations

Location: `src/locales/en/admin.json` (or appropriate namespace)

```json
{
  "screens": {
    "<screenId>": {
      "title": "Screen Title",
      "subtitle": "Screen description",
      "sections": {
        "main": "Main Section",
        "details": "Details"
      },
      "labels": {
        "field1": "Field 1",
        "field2": "Field 2"
      },
      "actions": {
        "save": "Save",
        "cancel": "Cancel",
        "edit": "Edit"
      },
      "states": {
        "loading": "Loading...",
        "empty": "No data available",
        "error": "Failed to load data"
      },
      "messages": {
        "saveSuccess": "Saved successfully",
        "saveFailed": "Failed to save"
      }
    }
  }
}
```

### Hindi Translations

Location: `src/locales/hi/admin.json`

```json
{
  "screens": {
    "<screenId>": {
      "title": "स्क्रीन शीर्षक",
      "subtitle": "स्क्रीन विवरण",
      "sections": {
        "main": "मुख्य अनुभाग",
        "details": "विवरण"
      },
      "labels": {
        "field1": "फ़ील्ड 1",
        "field2": "फ़ील्ड 2"
      },
      "actions": {
        "save": "सहेजें",
        "cancel": "रद्द करें",
        "edit": "संपादित करें"
      },
      "states": {
        "loading": "लोड हो रहा है...",
        "empty": "कोई डेटा उपलब्ध नहीं",
        "error": "डेटा लोड करने में विफल"
      },
      "messages": {
        "saveSuccess": "सफलतापूर्वक सहेजा गया",
        "saveFailed": "सहेजने में विफल"
      }
    }
  }
}
```

---

## PHASE 7: Navigation Integration

### Update Parent Widget/Screen

Add navigation call in the widget/screen that links to this screen:

```typescript
// In widget
onNavigate?.('<screen-id>', { entityId: item.id });

// In screen
navigation.navigate('<screen-id>', { entityId: item.id });
```

### Handle Route Params

In the screen component:

```typescript
const route = useRoute<any>();
const { entityId, mode } = route.params || {};

// Use entityId in query
const { data, isLoading, error } = use<Entity>Query(entityId);
```

---

## PHASE 8: Testing & Verification

### E2E Checklist

```
[ ] LOADING STATE
    [ ] Shows ActivityIndicator
    [ ] Shows loading text

[ ] ERROR STATE
    [ ] Shows error icon
    [ ] Shows error message
    [ ] Retry button works

[ ] EMPTY STATE
    [ ] Shows empty icon
    [ ] Shows guidance text

[ ] SUCCESS STATE
    [ ] All data displays correctly
    [ ] Localized fields use getLocalizedField()
    [ ] Static text uses t()

[ ] OFFLINE MODE
    [ ] OfflineBanner appears when offline
    [ ] Cached data shows when offline
    [ ] Mutations blocked with alert

[ ] NAVIGATION
    [ ] Back button works
    [ ] Navigation from parent works
    [ ] Route params received correctly

[ ] i18n
    [ ] English displays correctly
    [ ] Hindi displays correctly
    [ ] Language switch updates screen

[ ] ANALYTICS
    [ ] trackScreenView fires on mount
    [ ] trackEvent fires on actions
    [ ] Breadcrumbs logged

[ ] PERFORMANCE
    [ ] Initial render < 200ms
    [ ] Data fetch < 500ms
```

---

## QUICK REFERENCE: File Locations

| File Type | Location |
|-----------|----------|
| Screen Component | `src/screens/<category>/<ScreenName>Screen.tsx` |
| Screen Index | `src/screens/<category>/index.ts` |
| Query Hook | `src/hooks/queries/admin/use<Entity>Query.ts` |
| Mutation Hook | `src/hooks/mutations/admin/use<Action><Entity>.ts` |
| Hook Index | `src/hooks/queries/admin/index.ts` |
| Route Registry | `src/navigation/routeRegistry.ts` |
| EN Translations | `src/locales/en/admin.json` |
| HI Translations | `src/locales/hi/admin.json` |

---

## REFERENCES

- **Screen Template**: See `references/screen-template.md` for complete screen component template
- **Hook Patterns**: See `references/hook-patterns.md` for query/mutation hook templates
- **Full Guide**: See `Doc/SCREEN_DEVELOPMENT_GUIDE.md` for comprehensive documentation

---

## TROUBLESHOOTING

### RLS Policy Blocking Data

```sql
-- Check if user has profile entry
SELECT * FROM user_profiles WHERE user_id = 'your-user-id';

-- If missing, create entry
INSERT INTO user_profiles (user_id, customer_id, role, ...)
VALUES ('your-user-id', 'customer-id', 'admin', ...);
```

### Screen Not Navigating

1. Check routeRegistry.ts has both kebab-case and PascalCase entries
2. Verify screen is exported from category index.ts
3. Check import statement in routeRegistry.ts

### Data Not Loading

1. Verify RLS policy uses correct pattern: `user_profiles WHERE user_id = auth.uid()::text`
2. Check customer_id matches between tables
3. Verify query hook is enabled and has valid params
