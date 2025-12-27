---
name: dynamic-screen-generator
description: |
  Create dynamic (widget-based) screens following the 5-phase development workflow.
  Use this skill when creating dashboard screens, home screens, hub screens, or any screen
  that renders widgets from the screen_layouts database table.

  Triggers:
  - "create a dynamic screen for..."
  - "create dashboard for [role]"
  - "add widget screen..."
  - "create home screen for..."
  - User asks for screens that: display widgets, are configurable via Platform Studio,
    show dashboards, lists, or profile pages.

  This skill uses Supabase MCP tools (mcp__supabase__execute_sql) for all database operations.
  Dynamic screens require NO custom code - just database configuration.
---

# Dynamic Screen Generator

Create widget-based screens that are fully configurable through Platform Studio.

## CRITICAL RULES

1. **NEVER SKIP ANY PHASE** - All 5 phases must be completed in order
2. **USE SUPABASE MCP ONLY** - Use `mcp__supabase__execute_sql` for all database operations
3. **SCREEN ID MUST MATCH** - Screen ID must be identical across all tables and registries
4. **VERIFY WIDGET EXISTS** - Check widgetRegistry before adding to screen_layouts

---

## WHEN TO USE DYNAMIC SCREENS

| Choose Dynamic Screen | Choose Fixed Screen |
|-----------------------|---------------------|
| Dashboard/home screens | Complex forms, wizards |
| Widget-based layouts | Specialized UI interactions |
| Configurable via Platform Studio | Auth flows (login, register) |
| Per-customer customization needed | Fixed layout required |
| Fast development (config only) | Custom component logic |

---

## 5-PHASE WORKFLOW

```
PHASE 1: Planning & Widget Selection
    ↓
PHASE 2: Database Setup (Supabase MCP)
    ↓
PHASE 3: Route Registration
    ↓
PHASE 4: Platform Studio Integration
    ↓
PHASE 5: Testing & Verification
```

---

## PHASE 1: Planning & Widget Selection

### Required Decisions

| Decision | Options | Example |
|----------|---------|---------|
| Screen ID | `<role>-<purpose>[-<detail>]` | `parent-home`, `student-dashboard` |
| Target Role | admin, teacher, parent, student | `parent` |
| Screen Type | dashboard, hub, list, profile | `dashboard` |
| Navigation | New tab or sub-screen | `new tab` |
| Widgets | List from widgetRegistry | `['parent.childOverview', 'parent.feesSummary']` |

### Screen ID Convention

```
Format: <role>-<purpose>[-<detail>]

Examples:
- student-home       (Student main dashboard)
- parent-home        (Parent main dashboard)
- teacher-home       (Teacher main dashboard)
- admin-home         (Admin main dashboard)
- child-progress     (Parent viewing child's progress)
- schedule-screen    (Schedule for any role)
- profile-home       (Profile page)
```

### Widget Selection Checklist

Before adding widgets to screen:

```
[ ] Widget ID exists in src/config/widgetRegistry.ts
[ ] Widget supports target role (check allowedRoles)
[ ] Widget works with screen type (dashboard, hub, etc.)
[ ] No duplicate widget IDs on same screen
[ ] Widget positions are sequential (1, 2, 3...)
```

---

## PHASE 2: Database Setup (Supabase MCP)

### ALWAYS Use Supabase MCP Tools

```
All Operations (SELECT, INSERT, UPDATE, DELETE):
→ mcp__supabase__execute_sql
```

### Step 2.1: Add Navigation Tab (if new tab needed)

Use `mcp__supabase__execute_sql`:

```sql
-- Add new navigation tab
INSERT INTO navigation_tabs (
  customer_id,
  role,
  tab_id,
  label,
  icon,
  initial_route,
  order_index,
  enabled
) VALUES (
  '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
  '<role>',           -- 'student', 'parent', 'teacher', 'admin'
  '<tab-id>',         -- 'home', 'schedule', 'progress', etc.
  '<Label>',          -- 'Home', 'Schedule', etc.
  '<icon-name>',      -- 'home', 'calendar', 'chart-line', etc.
  '<screen-id>',      -- MUST match screen_layouts.screen_id
  <order>,            -- 1, 2, 3, etc.
  true
)
ON CONFLICT (customer_id, role, tab_id)
DO UPDATE SET
  label = EXCLUDED.label,
  icon = EXCLUDED.icon,
  initial_route = EXCLUDED.initial_route,
  order_index = EXCLUDED.order_index,
  enabled = EXCLUDED.enabled;
```

### Step 2.2: Add Tab Screen (if sub-screen of tab)

For screens that appear within a tab's stack (not the main tab screen):

```sql
-- Add sub-screen to tab
INSERT INTO tab_screens (
  customer_id,
  role,
  tab_id,
  screen_id,
  screen_label,
  order_index,
  enabled
) VALUES (
  '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
  '<role>',
  '<parent-tab-id>',  -- Tab this screen belongs to
  '<screen-id>',      -- This screen's ID
  '<Screen Label>',
  <order>,
  true
)
ON CONFLICT (customer_id, role, tab_id, screen_id)
DO UPDATE SET
  screen_label = EXCLUDED.screen_label,
  order_index = EXCLUDED.order_index,
  enabled = EXCLUDED.enabled;
```

### Step 2.3: Add Screen Layouts (Widgets)

**CRITICAL**: This is where widgets are assigned to the screen.

```sql
-- Add widgets to screen
INSERT INTO screen_layouts (
  customer_id,
  role,
  screen_id,
  widget_id,
  position,
  enabled,
  size,
  custom_props,
  visibility_rules
) VALUES
  -- Widget 1
  (
    '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    '<role>',
    '<screen-id>',
    '<widget.id>',        -- e.g., 'parent.childOverview'
    1,                    -- Position (order on screen)
    true,
    'standard',           -- 'compact', 'standard', 'expanded'
    '{"maxItems": 5, "showIcon": true}'::jsonb,
    NULL
  ),
  -- Widget 2
  (
    '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    '<role>',
    '<screen-id>',
    '<widget.id2>',
    2,
    true,
    'compact',
    '{"layoutStyle": "cards"}'::jsonb,
    NULL
  ),
  -- Widget 3
  (
    '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
    '<role>',
    '<screen-id>',
    '<widget.id3>',
    3,
    true,
    'standard',
    '{}'::jsonb,
    NULL
  )
ON CONFLICT (customer_id, role, screen_id, widget_id)
DO UPDATE SET
  position = EXCLUDED.position,
  enabled = EXCLUDED.enabled,
  size = EXCLUDED.size,
  custom_props = EXCLUDED.custom_props,
  visibility_rules = EXCLUDED.visibility_rules;
```

### screen_layouts Table Schema Reference

| Column | Type | Description |
|--------|------|-------------|
| `customer_id` | UUID | Customer/tenant ID |
| `role` | TEXT | User role (student, parent, teacher, admin) |
| `screen_id` | TEXT | Screen identifier (MUST match route) |
| `widget_id` | TEXT | Widget identifier from widgetRegistry |
| `position` | INT | Order on screen (1, 2, 3...) |
| `enabled` | BOOL | Whether widget is visible |
| `size` | TEXT | Widget size: compact, standard, expanded |
| `custom_props` | JSONB | Widget configuration overrides |
| `visibility_rules` | JSONB | Conditional visibility logic |

### Widget Size Guidelines

| Size | Height | Use Case |
|------|--------|----------|
| `compact` | ~80-120px | Quick stats, single metric, action buttons |
| `standard` | ~150-250px | Lists, cards, medium content |
| `expanded` | ~300-400px | Charts, detailed views, large content |

### Common Widget IDs by Category

```
Student Widgets:
- schedule.today
- progress.weekly
- study.recentActivity
- assessment.upcoming
- doubts.recent

Parent Widgets:
- parent.childOverview
- parent.feesSummary
- parent.attendanceOverview
- parent.notificationsPreview
- parent.quickActions

Teacher Widgets:
- teacher.todayClasses
- teacher.assignmentsPending
- teacher.studentAttendance
- teacher.performanceOverview

Admin Widgets:
- admin.kpiGrid
- admin.userStats
- admin.revenueOverview
- admin.systemHealth
- analytics.kpiGrid
- finance.revenueChart
```

---

## PHASE 3: Route Registration

### Add to routeRegistry.ts

Location: `src/navigation/routeRegistry.ts`

```typescript
import { DynamicScreen } from "../screens/DynamicScreen";

const registry: Record<string, RouteDefinition> = {
  // ... existing entries

  // Dynamic screen - uses DynamicScreen component
  "<screen-id>": { screenId: "<screen-id>", component: DynamicScreen },

  // Add PascalCase alias if needed for navigation
  "<ScreenName>": { screenId: "<ScreenName>", component: DynamicScreen },
};
```

**Important**: Dynamic screens ALWAYS use `DynamicScreen` component - never create custom components.

---

## PHASE 4: Platform Studio Integration

### Add to Platform Studio Screen Registry

Location: `platform-studio/src/config/screenRegistry.ts`

```typescript
export const SCREENS = [
  // ... existing screens

  {
    screenId: "<screen-id>",
    name: "<Screen Display Name>",
    description: "<Brief description>",
    role: "<role>",
    type: "<dashboard|hub|list|profile>",
    icon: "<lucide-icon-name>",
    allowedWidgets: ["<category>.*", "<specific.widget>"],
  },
];
```

### allowedWidgets Patterns

```typescript
// Allow all widgets from category
allowedWidgets: ["parent.*"]

// Allow specific widgets
allowedWidgets: ["parent.childOverview", "parent.feesSummary"]

// Allow from multiple categories
allowedWidgets: ["parent.*", "schedule.*", "actions.*"]

// Allow all widgets (admin screens)
allowedWidgets: ["*"]
```

---

## PHASE 5: Testing & Verification

### E2E Checklist

```
[ ] DATABASE VERIFICATION
    [ ] navigation_tabs has entry (if new tab)
    [ ] screen_layouts has all widget entries
    [ ] Widget IDs match widgetRegistry exactly
    [ ] Positions are sequential (no gaps)

[ ] MOBILE APP
    [ ] Screen loads without errors
    [ ] All widgets render correctly
    [ ] Widget order matches position values
    [ ] Pull-to-refresh works
    [ ] Offline mode shows cached widgets

[ ] PLATFORM STUDIO
    [ ] Screen appears in screen list
    [ ] Can drag-drop widgets
    [ ] Widget properties panel shows config options
    [ ] Save updates database correctly

[ ] WIDGET CONFIGS
    [ ] custom_props applied correctly
    [ ] Size (compact/standard/expanded) respected
    [ ] visibility_rules work (if any)

[ ] NAVIGATION
    [ ] Tab navigation works (if new tab)
    [ ] Widget navigation targets work
    [ ] Back button behavior correct

[ ] ANALYTICS
    [ ] screen_view event fires
    [ ] Widget interaction events fire
```

### Verification Queries

Run these to verify setup:

```sql
-- Check navigation tab exists
SELECT * FROM navigation_tabs
WHERE customer_id = '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46'
  AND role = '<role>'
  AND initial_route = '<screen-id>';

-- Check screen layouts
SELECT widget_id, position, enabled, size, custom_props
FROM screen_layouts
WHERE customer_id = '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46'
  AND role = '<role>'
  AND screen_id = '<screen-id>'
ORDER BY position;

-- Verify widget count
SELECT COUNT(*) as widget_count
FROM screen_layouts
WHERE screen_id = '<screen-id>'
  AND enabled = true;
```

---

## QUICK REFERENCE: File Locations

| File Type | Location |
|-----------|----------|
| Route Registry | `src/navigation/routeRegistry.ts` |
| DynamicScreen Component | `src/screens/DynamicScreen.tsx` |
| Widget Registry | `src/config/widgetRegistry.ts` |
| Platform Studio Screens | `platform-studio/src/config/screenRegistry.ts` |

---

## COMMON PATTERNS

### Pattern 1: New Role Dashboard

Creating a complete dashboard for a new role:

```sql
-- 1. Create Home tab
INSERT INTO navigation_tabs (customer_id, role, tab_id, label, icon, initial_route, order_index, enabled)
VALUES ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'newrole', 'home', 'Home', 'home', 'newrole-home', 1, true);

-- 2. Add widgets to dashboard
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props) VALUES
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'newrole', 'newrole-home', 'newrole.welcome', 1, true, 'compact', '{}'),
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'newrole', 'newrole-home', 'newrole.quickActions', 2, true, 'standard', '{"columns": 4}'),
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'newrole', 'newrole-home', 'newrole.stats', 3, true, 'expanded', '{}');
```

### Pattern 2: Add Sub-Screen to Existing Tab

```sql
-- Add progress detail screen under existing Progress tab
INSERT INTO tab_screens (customer_id, role, tab_id, screen_id, screen_label, order_index, enabled)
VALUES ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'student', 'progress', 'subject-analytics', 'Subject Details', 1, true);

-- Add widgets to sub-screen
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props) VALUES
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'student', 'subject-analytics', 'progress.subjectChart', 1, true, 'expanded', '{}'),
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'student', 'subject-analytics', 'progress.topicList', 2, true, 'standard', '{}');
```

### Pattern 3: Conditional Widget Visibility

```sql
-- Widget only visible for premium users
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props, visibility_rules)
VALUES (
  '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
  'student',
  'student-home',
  'ai.tutor',
  5,
  true,
  'standard',
  '{}',
  '{"type": "feature", "featureId": "ai.tutor", "operator": "enabled"}'::jsonb
);
```

---

## TROUBLESHOOTING

### Screen Not Loading

1. Check `screen_id` matches exactly in:
   - `navigation_tabs.initial_route` OR `tab_screens.screen_id`
   - `screen_layouts.screen_id`
   - `routeRegistry.ts` key

2. Verify `DynamicScreen` is used in route registry (not custom component)

### Widgets Not Appearing

1. Check widget_id exists in `widgetRegistry.ts`
2. Verify `enabled = true` in screen_layouts
3. Check role matches between screen_layouts and user role
4. Verify customer_id matches

### Widget Order Wrong

1. Check position values are sequential (1, 2, 3...)
2. No duplicate positions for same screen
3. Run: `SELECT widget_id, position FROM screen_layouts WHERE screen_id = 'x' ORDER BY position`

### Platform Studio Not Showing Screen

1. Add screen to `platform-studio/src/config/screenRegistry.ts`
2. Verify `role` matches in screen definition
3. Check `allowedWidgets` includes widgets you want to add

---

## REFERENCES

- **Database Templates**: See `references/database-templates.md` for copy-paste SQL
- **Full Guide**: See `Doc/SCREEN_DEVELOPMENT_GUIDE.md` for comprehensive documentation
- **Widget Guide**: See `Doc/WIDGET_DEVELOPMENT_GUIDE.md` for widget creation
