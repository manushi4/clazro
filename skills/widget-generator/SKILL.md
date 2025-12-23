---
name: widget-generator
description: |
  Generate complete widgets for the CoComplete platform following the 7-phase development workflow.
  Use this skill when:
  - User asks to "create a widget", "add a widget", "generate widget", or "build widget"
  - User wants to add a new configurable UI component to the mobile app
  - User needs a reusable component that appears on dashboard screens
  - User mentions widget IDs like "category.name" format

  This skill generates all required files: database migrations, query hooks, widget components,
  translations (English + Hindi), mobile registry entries, Platform Studio registry entries,
  and database screen layout insertions. Follows project conventions for theming, i18n,
  offline support, error handling, and RBAC.
---

# Widget Generator

Generate complete widgets for the CoComplete platform following all 7 phases.

## Quick Start

When user requests a widget, gather these inputs:

1. **Widget ID** (required): Format `category.name` (e.g., `schedule.upcoming`, `progress.weekly`)
2. **Widget Purpose**: What data does it display? What actions does it support?
3. **Target Roles**: Which roles see this widget? (student, teacher, parent, admin)
4. **Data Source**: Does it need a new database table or use existing data?
5. **Target Screen**: Which screen should it appear on? (e.g., student-home, parent-home)

## Execution Workflow

Execute phases in order. Skip Phase 1 if widget uses existing data.

### Phase 1: Database Setup (If New Data Needed)

**Skip if:** Widget uses existing tables or mock data.

Create migration file: `supabase/migrations/YYYYMMDD_create_{table_name}.sql`

See [references/database-template.md](references/database-template.md) for:
- Table schema with localized columns (`_en`, `_hi`)
- Multi-tenant isolation (`customer_id`)
- RLS policies for role-based access
- Indexes for performance
- Seed data for testing

**Checklist:**
- [ ] Table has `customer_id` foreign key
- [ ] Localized columns have `_en` and `_hi` suffixes
- [ ] RLS enabled with role-appropriate policies
- [ ] Indexes on `customer_id` and frequently queried columns

### Phase 2: Query Hook

Create hook: `src/hooks/queries/{role}/use{EntityName}Query.ts`

See [references/query-hook-template.md](references/query-hook-template.md) for:
- TanStack Query pattern with proper caching
- Customer ID filtering
- Offline-first configuration
- TypeScript types

**Checklist:**
- [ ] Query key includes `customerId`
- [ ] `staleTime` set appropriately (default 5 minutes)
- [ ] `enabled` checks for required params
- [ ] Exported from `src/hooks/queries/{role}/index.ts`

### Phase 3: Widget Component

Create widget: `src/components/widgets/{category}/{WidgetName}Widget.tsx`

See [references/widget-component-template.md](references/widget-component-template.md) for:
- Complete WidgetProps interface usage
- Theme colors via `useAppTheme()`
- Translations via `useTranslation()`
- Localized content via `getLocalizedField()`
- All 4 states: loading, error, empty, success
- Navigation via `onNavigate` callback
- Config reading with defaults

**Critical Requirements:**
- [ ] NO hardcoded colors - use `colors.primary`, `colors.surface`, etc.
- [ ] Static UI uses `t("key")` for translations
- [ ] Dynamic content uses `getLocalizedField(item, 'field')`
- [ ] Loading state shows `ActivityIndicator`
- [ ] Error state shows retry button
- [ ] Empty state shows helpful message
- [ ] Config values have fallback defaults

### Phase 4: Translations

Add to both files:

**English:** `src/locales/en/dashboard.json`
**Hindi:** `src/locales/hi/dashboard.json`

See [references/translation-template.md](references/translation-template.md) for:
- Widget translation structure
- Required keys: title, subtitle, states, actions
- Hindi translations pattern

**Structure:**
```json
{
  "widgets": {
    "{widgetKey}": {
      "title": "...",
      "subtitle": "...",
      "states": { "loading": "...", "empty": "...", "error": "..." },
      "actions": { "viewAll": "...", "retry": "..." }
    }
  }
}
```

### Phase 5: Mobile App Registry

Add to: `src/config/widgetRegistry.ts`

See [references/registry-template.md](references/registry-template.md) for:
- Complete registry entry with metadata
- Data policy configuration
- Default config values

**Critical Sync Points:**
- Widget ID must match Platform Studio exactly
- `defaultConfig` values must match Platform Studio defaults
- `roles` array must include all allowed roles

### Phase 6: Platform Studio Registry

**Two files to update:**

1. **Widget Registry:** `platform-studio/src/config/widgetRegistry.ts`
2. **Config Schema:** `platform-studio/src/components/builder/WidgetPropertiesPanel.tsx`

See [references/platform-studio-template.md](references/platform-studio-template.md) for:
- Widget metadata entry
- Config schema with sections and fields
- Preview component (optional)

**Critical Sync Points:**
- [ ] Widget ID matches mobile registry exactly
- [ ] Config keys match mobile widget's expected props
- [ ] Default values are identical to mobile
- [ ] Layout options only include what widget supports

### Phase 7: Database Screen Layout

Insert widget into screen: Execute SQL or use Platform Studio UI.

```sql
INSERT INTO screen_layouts (
  customer_id, role, screen_id, widget_id, position, enabled, size, custom_props
) VALUES (
  '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',  -- Demo customer
  '{role}',
  '{screen_id}',
  '{widget_id}',
  {position},
  true,
  'standard',
  '{}'::jsonb
);
```

## Verification Checklist

After completing all phases, verify:

### Mobile App
- [ ] Widget renders with theme colors (toggle dark mode)
- [ ] Hindi translations show when language changed
- [ ] Loading/error/empty states display correctly
- [ ] Navigation works (no "Coming Soon" alerts for valid routes)
- [ ] Offline mode shows cached data or appropriate message

### Platform Studio Sync
- [ ] Widget appears in widget palette
- [ ] Dragging to screen works
- [ ] Properties panel shows correct config options
- [ ] Preview updates when config changes
- [ ] Save → Pull to refresh → Mobile shows changes

### Database
- [ ] RLS policies allow correct role access
- [ ] Localized data returns correctly
- [ ] Customer isolation works

## Common Widget Patterns

### Data Display Widget (List/Cards/Grid)
```
Query hook → Fetch data → Render in layout style → Handle tap → Navigate
```

### Stats/Summary Widget
```
Query hook → Aggregate data → Display metrics → Optional drill-down
```

### Action Widget (Quick Actions)
```
Static config → Render action buttons → Handle tap → Navigate or trigger action
```

### Preview Widget (Shows subset of larger list)
```
Query hook with limit → Render preview → "View All" button → Navigate to full list
```

## File Naming Conventions

| Type | Location | Naming |
|------|----------|--------|
| Widget Component | `src/components/widgets/{category}/` | `{PascalCase}Widget.tsx` |
| Query Hook | `src/hooks/queries/{role}/` | `use{Entity}Query.ts` |
| Mutation Hook | `src/hooks/mutations/{role}/` | `use{Action}.ts` |
| Migration | `supabase/migrations/` | `YYYYMMDD_{description}.sql` |
| Translations | `src/locales/{lang}/` | `dashboard.json` or namespace |

## Widget ID Convention

Format: `{category}.{name}`

**Categories:**
- `schedule` - Calendar, timetable, classes
- `study` - Library, content, notes
- `assessment` - Assignments, tests, quizzes
- `progress` - Analytics, streaks, goals
- `doubts` - Q&A, ask teacher
- `ai` - AI tutor, recommendations
- `social` - Peers, leaderboard
- `actions` - Quick action buttons
- `profile` - User profile widgets
- `parent` - Parent-specific widgets
- `admin` - Admin dashboard widgets
- `finance` - Financial widgets

**Examples:**
- `schedule.today` - Today's schedule
- `progress.weekly` - Weekly progress
- `parent.childOverview` - Parent's child summary
- `admin.userStats` - Admin user statistics

## Error Handling

If any phase fails:
1. Report the specific error
2. Suggest fix
3. Do NOT proceed to next phase until fixed
4. Offer to rollback changes if needed

## References

- [Database Template](references/database-template.md) - SQL migration patterns
- [Query Hook Template](references/query-hook-template.md) - TanStack Query patterns
- [Widget Component Template](references/widget-component-template.md) - React Native widget
- [Translation Template](references/translation-template.md) - i18n structure
- [Registry Template](references/registry-template.md) - Mobile app registry
- [Platform Studio Template](references/platform-studio-template.md) - Platform Studio files
