# Database Templates for Dynamic Screens

Copy-paste SQL templates for common dynamic screen scenarios.

---

## Table of Contents

1. [Navigation Tab Templates](#navigation-tab-templates)
2. [Screen Layout Templates](#screen-layout-templates)
3. [Tab Screen Templates](#tab-screen-templates)
4. [Complete Dashboard Examples](#complete-dashboard-examples)
5. [Widget Configuration Examples](#widget-configuration-examples)
6. [Visibility Rules Examples](#visibility-rules-examples)
7. [Verification Queries](#verification-queries)

---

## Navigation Tab Templates

### Add Single Navigation Tab

```sql
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
  'ROLE_HERE',           -- 'student', 'parent', 'teacher', 'admin'
  'TAB_ID_HERE',         -- 'home', 'schedule', 'progress', 'profile'
  'TAB_LABEL_HERE',      -- 'Home', 'Schedule', 'Progress', 'Profile'
  'ICON_NAME_HERE',      -- 'home', 'calendar', 'chart-line', 'user'
  'SCREEN_ID_HERE',      -- 'student-home', 'parent-schedule', etc.
  ORDER_INDEX_HERE,      -- 1, 2, 3, 4, 5
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

### Add Complete Tab Set for Role

```sql
-- Complete tab set for a role
INSERT INTO navigation_tabs (customer_id, role, tab_id, label, icon, initial_route, order_index, enabled) VALUES
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'ROLE', 'home', 'Home', 'home', 'ROLE-home', 1, true),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'ROLE', 'schedule', 'Schedule', 'calendar', 'ROLE-schedule', 2, true),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'ROLE', 'progress', 'Progress', 'chart-line', 'ROLE-progress', 3, true),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'ROLE', 'profile', 'Profile', 'user', 'ROLE-profile', 4, true)
ON CONFLICT (customer_id, role, tab_id)
DO UPDATE SET
  label = EXCLUDED.label,
  icon = EXCLUDED.icon,
  initial_route = EXCLUDED.initial_route,
  order_index = EXCLUDED.order_index,
  enabled = EXCLUDED.enabled;
```

### Common Icons Reference

| Icon Name | Use For |
|-----------|---------|
| `home` | Home/Dashboard |
| `calendar` | Schedule/Timetable |
| `chart-line` | Progress/Analytics |
| `user` | Profile |
| `book-open` | Study/Library |
| `clipboard-list` | Assignments |
| `message-circle` | Doubts/Chat |
| `bell` | Notifications |
| `settings` | Settings |
| `credit-card` | Fees/Payments |
| `users` | Users/Students |

---

## Screen Layout Templates

### Add Single Widget

```sql
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
) VALUES (
  '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
  'ROLE_HERE',
  'SCREEN_ID_HERE',
  'WIDGET_ID_HERE',      -- e.g., 'parent.childOverview'
  POSITION_HERE,         -- 1, 2, 3...
  true,
  'SIZE_HERE',           -- 'compact', 'standard', 'expanded'
  '{"key": "value"}'::jsonb,
  NULL
)
ON CONFLICT (customer_id, role, screen_id, widget_id)
DO UPDATE SET
  position = EXCLUDED.position,
  enabled = EXCLUDED.enabled,
  size = EXCLUDED.size,
  custom_props = EXCLUDED.custom_props;
```

### Add Multiple Widgets to Screen

```sql
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props) VALUES
  -- Widget 1: Welcome/Header
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'ROLE', 'SCREEN_ID', 'category.widget1', 1, true, 'compact', '{}'),

  -- Widget 2: Quick Actions
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'ROLE', 'SCREEN_ID', 'category.widget2', 2, true, 'standard', '{"columns": 4}'),

  -- Widget 3: Main Content
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'ROLE', 'SCREEN_ID', 'category.widget3', 3, true, 'standard', '{"maxItems": 5}'),

  -- Widget 4: Secondary Content
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'ROLE', 'SCREEN_ID', 'category.widget4', 4, true, 'expanded', '{}'),

  -- Widget 5: Footer/Actions
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'ROLE', 'SCREEN_ID', 'category.widget5', 5, true, 'compact', '{}')
ON CONFLICT (customer_id, role, screen_id, widget_id)
DO UPDATE SET
  position = EXCLUDED.position,
  size = EXCLUDED.size,
  custom_props = EXCLUDED.custom_props;
```

---

## Tab Screen Templates

### Add Sub-Screen to Tab

```sql
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
  'ROLE_HERE',
  'PARENT_TAB_ID',       -- Tab this screen belongs to
  'SCREEN_ID_HERE',
  'SCREEN_LABEL_HERE',
  ORDER_INDEX_HERE,
  true
)
ON CONFLICT (customer_id, role, tab_id, screen_id)
DO UPDATE SET
  screen_label = EXCLUDED.screen_label,
  order_index = EXCLUDED.order_index,
  enabled = EXCLUDED.enabled;
```

---

## Complete Dashboard Examples

### Student Dashboard

```sql
-- Step 1: Navigation Tab
INSERT INTO navigation_tabs (customer_id, role, tab_id, label, icon, initial_route, order_index, enabled)
VALUES ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'student', 'home', 'Home', 'home', 'student-home', 1, true)
ON CONFLICT (customer_id, role, tab_id) DO UPDATE SET initial_route = EXCLUDED.initial_route;

-- Step 2: Screen Layouts
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props) VALUES
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'student', 'student-home', 'schedule.today', 1, true, 'standard', '{"showHeader": true}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'student', 'student-home', 'progress.weeklyStreak', 2, true, 'compact', '{}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'student', 'student-home', 'study.recentActivity', 3, true, 'standard', '{"maxItems": 5}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'student', 'student-home', 'assessment.upcoming', 4, true, 'standard', '{"maxItems": 3}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'student', 'student-home', 'actions.quickActions', 5, true, 'compact', '{"columns": 4}')
ON CONFLICT (customer_id, role, screen_id, widget_id) DO UPDATE SET position = EXCLUDED.position, custom_props = EXCLUDED.custom_props;
```

### Parent Dashboard

```sql
-- Step 1: Navigation Tab
INSERT INTO navigation_tabs (customer_id, role, tab_id, label, icon, initial_route, order_index, enabled)
VALUES ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'parent', 'home', 'Home', 'home', 'parent-home', 1, true)
ON CONFLICT (customer_id, role, tab_id) DO UPDATE SET initial_route = EXCLUDED.initial_route;

-- Step 2: Screen Layouts
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props) VALUES
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'parent', 'parent-home', 'parent.childOverview', 1, true, 'expanded', '{"layoutStyle": "cards"}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'parent', 'parent-home', 'parent.feesSummary', 2, true, 'standard', '{}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'parent', 'parent-home', 'parent.attendanceOverview', 3, true, 'standard', '{}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'parent', 'parent-home', 'parent.notificationsPreview', 4, true, 'compact', '{"maxItems": 3}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'parent', 'parent-home', 'parent.quickActions', 5, true, 'compact', '{"columns": 4}')
ON CONFLICT (customer_id, role, screen_id, widget_id) DO UPDATE SET position = EXCLUDED.position, custom_props = EXCLUDED.custom_props;
```

### Teacher Dashboard

```sql
-- Step 1: Navigation Tab
INSERT INTO navigation_tabs (customer_id, role, tab_id, label, icon, initial_route, order_index, enabled)
VALUES ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'home', 'Home', 'home', 'teacher-home', 1, true)
ON CONFLICT (customer_id, role, tab_id) DO UPDATE SET initial_route = EXCLUDED.initial_route;

-- Step 2: Screen Layouts
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props) VALUES
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'teacher-home', 'teacher.todayClasses', 1, true, 'standard', '{}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'teacher-home', 'teacher.assignmentsPending', 2, true, 'standard', '{"maxItems": 5}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'teacher-home', 'teacher.studentAttendance', 3, true, 'expanded', '{}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'teacher-home', 'teacher.performanceOverview', 4, true, 'standard', '{}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'teacher-home', 'actions.quickActions', 5, true, 'compact', '{"columns": 4}')
ON CONFLICT (customer_id, role, screen_id, widget_id) DO UPDATE SET position = EXCLUDED.position, custom_props = EXCLUDED.custom_props;
```

### Admin Dashboard

```sql
-- Step 1: Navigation Tab
INSERT INTO navigation_tabs (customer_id, role, tab_id, label, icon, initial_route, order_index, enabled)
VALUES ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'admin', 'home', 'Dashboard', 'layout-dashboard', 'admin-home', 1, true)
ON CONFLICT (customer_id, role, tab_id) DO UPDATE SET initial_route = EXCLUDED.initial_route;

-- Step 2: Screen Layouts
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props) VALUES
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'admin', 'admin-home', 'analytics.kpiGrid', 1, true, 'expanded', '{"columns": 4}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'admin', 'admin-home', 'admin.userStats', 2, true, 'standard', '{}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'admin', 'admin-home', 'finance.revenueChart', 3, true, 'expanded', '{}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'admin', 'admin-home', 'admin.recentActivity', 4, true, 'standard', '{"maxItems": 10}'),
  ('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'admin', 'admin-home', 'admin.quickActions', 5, true, 'compact', '{}')
ON CONFLICT (customer_id, role, screen_id, widget_id) DO UPDATE SET position = EXCLUDED.position, custom_props = EXCLUDED.custom_props;
```

---

## Widget Configuration Examples

### List Widget

```sql
-- For list-type widgets
custom_props = '{
  "maxItems": 5,
  "showIcon": true,
  "layoutStyle": "list"
}'::jsonb
```

### Cards Widget

```sql
-- For horizontal scrollable cards
custom_props = '{
  "layoutStyle": "cards",
  "cardWidth": 140,
  "showDescription": true
}'::jsonb
```

### Grid Widget

```sql
-- For grid layout
custom_props = '{
  "layoutStyle": "grid",
  "columns": 2,
  "showLabels": true
}'::jsonb
```

### Quick Actions Widget

```sql
-- For quick action buttons
custom_props = '{
  "columns": 4,
  "iconSize": 24,
  "showLabels": true
}'::jsonb
```

### Chart Widget

```sql
-- For chart widgets
custom_props = '{
  "chartType": "line",
  "showLegend": true,
  "period": "week"
}'::jsonb
```

### KPI Widget

```sql
-- For KPI/stats widgets
custom_props = '{
  "columns": 4,
  "showTrend": true,
  "showIcon": true
}'::jsonb
```

---

## Visibility Rules Examples

### Feature-Based Visibility

```sql
-- Only show if feature is enabled
visibility_rules = '{
  "type": "feature",
  "featureId": "ai.tutor",
  "operator": "enabled"
}'::jsonb
```

### Permission-Based Visibility

```sql
-- Only show if user has permission
visibility_rules = '{
  "type": "permission",
  "permissionId": "view_analytics",
  "operator": "has"
}'::jsonb
```

### Time-Based Visibility

```sql
-- Only show during specific hours
visibility_rules = '{
  "type": "time",
  "start": "08:00",
  "end": "18:00",
  "timezone": "Asia/Kolkata"
}'::jsonb
```

### Combined Rules (AND)

```sql
-- Must match ALL conditions
visibility_rules = '{
  "type": "and",
  "conditions": [
    {"type": "feature", "featureId": "premium", "operator": "enabled"},
    {"type": "permission", "permissionId": "view_premium", "operator": "has"}
  ]
}'::jsonb
```

### Combined Rules (OR)

```sql
-- Must match ANY condition
visibility_rules = '{
  "type": "or",
  "conditions": [
    {"type": "permission", "permissionId": "admin", "operator": "has"},
    {"type": "permission", "permissionId": "superuser", "operator": "has"}
  ]
}'::jsonb
```

---

## Verification Queries

### Check Navigation Tabs

```sql
SELECT tab_id, label, icon, initial_route, order_index, enabled
FROM navigation_tabs
WHERE customer_id = '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46'
  AND role = 'ROLE_HERE'
ORDER BY order_index;
```

### Check Screen Layouts

```sql
SELECT widget_id, position, enabled, size, custom_props
FROM screen_layouts
WHERE customer_id = '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46'
  AND role = 'ROLE_HERE'
  AND screen_id = 'SCREEN_ID_HERE'
ORDER BY position;
```

### Check Tab Screens

```sql
SELECT tab_id, screen_id, screen_label, order_index, enabled
FROM tab_screens
WHERE customer_id = '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46'
  AND role = 'ROLE_HERE'
ORDER BY tab_id, order_index;
```

### Count Widgets per Screen

```sql
SELECT screen_id, COUNT(*) as widget_count
FROM screen_layouts
WHERE customer_id = '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46'
  AND role = 'ROLE_HERE'
  AND enabled = true
GROUP BY screen_id
ORDER BY screen_id;
```

### Find Duplicate Positions

```sql
SELECT screen_id, position, COUNT(*) as count
FROM screen_layouts
WHERE customer_id = '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46'
GROUP BY screen_id, position
HAVING COUNT(*) > 1;
```

### Find Missing Widget IDs

```sql
-- Compare screen_layouts widget_ids against known widgets
SELECT DISTINCT widget_id
FROM screen_layouts
WHERE customer_id = '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46'
ORDER BY widget_id;
```

---

## Cleanup Queries

### Remove Widget from Screen

```sql
DELETE FROM screen_layouts
WHERE customer_id = '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46'
  AND role = 'ROLE_HERE'
  AND screen_id = 'SCREEN_ID_HERE'
  AND widget_id = 'WIDGET_ID_HERE';
```

### Disable Widget (Soft Delete)

```sql
UPDATE screen_layouts
SET enabled = false
WHERE customer_id = '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46'
  AND role = 'ROLE_HERE'
  AND screen_id = 'SCREEN_ID_HERE'
  AND widget_id = 'WIDGET_ID_HERE';
```

### Remove All Widgets from Screen

```sql
DELETE FROM screen_layouts
WHERE customer_id = '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46'
  AND screen_id = 'SCREEN_ID_HERE';
```

### Reorder Widgets

```sql
-- Update positions for a screen
UPDATE screen_layouts SET position = 1 WHERE screen_id = 'x' AND widget_id = 'widget.a';
UPDATE screen_layouts SET position = 2 WHERE screen_id = 'x' AND widget_id = 'widget.b';
UPDATE screen_layouts SET position = 3 WHERE screen_id = 'x' AND widget_id = 'widget.c';
```
