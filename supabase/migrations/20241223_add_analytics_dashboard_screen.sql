-- ============================================================================
-- Migration: Add Admin Analytics Dynamic Screen Layouts
-- Date: 2024-12-23
-- Purpose: Configure widgets for the admin-analytics dynamic screen
-- Screen ID: admin-analytics
-- Target Role: admin
-- Note: Allowed roles are: student, teacher, parent, admin (no super_admin)
-- ============================================================================

-- Delete existing entries for clean setup (idempotent)
DELETE FROM screen_layouts WHERE screen_id = 'admin-analytics';

-- ============================================================================
-- Insert widget configurations for admin role
-- ============================================================================

-- KPI Grid Widget (position 1)
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
SELECT
  c.id,
  'admin',
  'admin-analytics',
  'analytics.kpi-grid',
  1,
  true,
  'expanded',
  '{"columns": 4, "showTrend": true, "showGrowth": true, "showIcon": true}'::jsonb
FROM customers c;

-- Trends Widget (position 2)
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
SELECT
  c.id,
  'admin',
  'admin-analytics',
  'analytics.trends',
  2,
  true,
  'expanded',
  '{"chartType": "line", "period": "week", "showLegend": true, "showDataPoints": true}'::jsonb
FROM customers c;

-- Engagement Widget (position 3)
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
SELECT
  c.id,
  'admin',
  'admin-analytics',
  'analytics.engagement',
  3,
  true,
  'standard',
  '{"showDAU": true, "showWAU": true, "showRetention": true}'::jsonb
FROM customers c;

-- Growth Widget (position 4)
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
SELECT
  c.id,
  'admin',
  'admin-analytics',
  'analytics.growth',
  4,
  true,
  'standard',
  '{"showOverallGrowth": true, "showTargets": true, "showTrendChart": true}'::jsonb
FROM customers c;

-- Comparisons Widget (position 5)
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
SELECT
  c.id,
  'admin',
  'admin-analytics',
  'analytics.comparisons',
  5,
  true,
  'expanded',
  '{"periods": ["week", "month", "quarter"], "showChange": true}'::jsonb
FROM customers c;

-- ============================================================================
-- Verify insertion
-- ============================================================================
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM screen_layouts WHERE screen_id = 'admin-analytics' AND role = 'admin';

  IF admin_count >= 5 THEN
    RAISE NOTICE 'Admin Analytics screen layouts created successfully: % widgets', admin_count;
  ELSE
    RAISE WARNING 'Expected at least 5 widgets, got %', admin_count;
  END IF;
END $$;
