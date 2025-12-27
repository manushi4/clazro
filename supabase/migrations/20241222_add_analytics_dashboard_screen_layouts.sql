-- ============================================================================
-- Migration: Add Analytics Dashboard Screen Layouts
-- Date: 2024-12-22
-- Purpose: Configure widgets for the analytics-dashboard dynamic screen
-- Screen ID: analytics-dashboard
-- Target Roles: admin, super_admin
-- Sprint: 7 - Analytics Dashboard
-- ============================================================================

-- Delete existing entries for clean setup (idempotent)
DELETE FROM screen_layouts WHERE screen_id = 'analytics-dashboard';

-- ============================================================================
-- Insert widget configurations for admin role
-- Note: Only admin role is allowed (no super_admin per database constraint)
-- ============================================================================

-- KPI Grid Widget (position 1) - Key performance indicators
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
SELECT c.id, 'admin', 'analytics-dashboard', 'analytics.kpi-grid', 1, true, 'standard',
  '{"columns": 2, "showTrend": true, "showGrowth": true, "showIcon": true, "limit": 6}'::jsonb
FROM customers c;

-- Trends Widget (position 2 - expanded for better visualization)
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
SELECT c.id, 'admin', 'analytics-dashboard', 'analytics.trends', 2, true, 'expanded',
  '{"metrics": ["users", "revenue", "engagement"], "defaultPeriod": "month", "showLegend": true, "showDataPoints": true, "showStatistics": true}'::jsonb
FROM customers c;

-- Engagement Widget (position 3) - DAU, WAU, retention metrics
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
SELECT c.id, 'admin', 'analytics-dashboard', 'analytics.engagement', 3, true, 'standard',
  '{"showDAU": true, "showWAU": true, "showRetention": true, "showRoleBreakdown": true, "showActivityTrend": true, "showTopUsers": true}'::jsonb
FROM customers c;

-- Growth Widget (position 4) - Growth metrics with targets
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
SELECT c.id, 'admin', 'analytics-dashboard', 'analytics.growth', 4, true, 'standard',
  '{"showTargets": true, "showTrendChart": true, "defaultPeriod": "month", "showHighlights": true}'::jsonb
FROM customers c;

-- Comparisons Widget (position 5) - Period-over-period comparisons
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
SELECT c.id, 'admin', 'analytics-dashboard', 'analytics.comparisons', 5, true, 'standard',
  '{"periods": ["week", "month", "quarter"], "showChange": true, "showTrendSummary": true, "defaultPeriod": "month"}'::jsonb
FROM customers c;

-- ============================================================================
-- Verify insertion
-- ============================================================================
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM screen_layouts WHERE screen_id = 'analytics-dashboard' AND role = 'admin';

  IF admin_count >= 5 THEN
    RAISE NOTICE 'Analytics Dashboard screen layouts created successfully: % admin widgets', admin_count;
  ELSE
    RAISE WARNING 'Expected at least 5 widgets for admin role, got %', admin_count;
  END IF;
END $$;
