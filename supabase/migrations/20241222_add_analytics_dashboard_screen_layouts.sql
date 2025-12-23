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
-- ============================================================================
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
VALUES
  -- KPI Grid Widget (position 1) - Key performance indicators
  ('demo-customer-id', 'admin', 'analytics-dashboard', 'analytics.kpi-grid', 1, true, 'standard',
   '{"columns": 2, "showTrend": true, "showGrowth": true, "showIcon": true, "limit": 6}'::jsonb),
  
  -- Trends Widget (position 2 - expanded for better visualization)
  ('demo-customer-id', 'admin', 'analytics-dashboard', 'analytics.trends', 2, true, 'expanded',
   '{"metrics": ["users", "revenue", "engagement"], "defaultPeriod": "month", "showLegend": true, "showDataPoints": true, "showStatistics": true}'::jsonb),
  
  -- Engagement Widget (position 3) - DAU, WAU, retention metrics
  ('demo-customer-id', 'admin', 'analytics-dashboard', 'analytics.engagement', 3, true, 'standard',
   '{"showDAU": true, "showWAU": true, "showRetention": true, "showRoleBreakdown": true, "showActivityTrend": true, "showTopUsers": true}'::jsonb),
  
  -- Growth Widget (position 4) - Growth metrics with targets
  ('demo-customer-id', 'admin', 'analytics-dashboard', 'analytics.growth', 4, true, 'standard',
   '{"showTargets": true, "showTrendChart": true, "defaultPeriod": "month", "showHighlights": true}'::jsonb),
  
  -- Comparisons Widget (position 5) - Period-over-period comparisons
  ('demo-customer-id', 'admin', 'analytics-dashboard', 'analytics.comparisons', 5, true, 'standard',
   '{"periods": ["week", "month", "quarter"], "showChange": true, "showTrendSummary": true, "defaultPeriod": "month"}'::jsonb);

-- ============================================================================
-- Insert widget configurations for super_admin role (same layout with extended access)
-- ============================================================================
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
VALUES
  -- KPI Grid Widget (position 1)
  ('demo-customer-id', 'super_admin', 'analytics-dashboard', 'analytics.kpi-grid', 1, true, 'standard',
   '{"columns": 2, "showTrend": true, "showGrowth": true, "showIcon": true, "limit": 8}'::jsonb),
  
  -- Trends Widget (position 2 - expanded)
  ('demo-customer-id', 'super_admin', 'analytics-dashboard', 'analytics.trends', 2, true, 'expanded',
   '{"metrics": ["users", "revenue", "engagement", "content"], "defaultPeriod": "month", "showLegend": true, "showDataPoints": true, "showStatistics": true}'::jsonb),
  
  -- Engagement Widget (position 3)
  ('demo-customer-id', 'super_admin', 'analytics-dashboard', 'analytics.engagement', 3, true, 'standard',
   '{"showDAU": true, "showWAU": true, "showMAU": true, "showRetention": true, "showRoleBreakdown": true, "showActivityTrend": true, "showTopUsers": true}'::jsonb),
  
  -- Growth Widget (position 4)
  ('demo-customer-id', 'super_admin', 'analytics-dashboard', 'analytics.growth', 4, true, 'standard',
   '{"showTargets": true, "showTrendChart": true, "defaultPeriod": "month", "showHighlights": true, "showAllMetrics": true}'::jsonb),
  
  -- Comparisons Widget (position 5)
  ('demo-customer-id', 'super_admin', 'analytics-dashboard', 'analytics.comparisons', 5, true, 'standard',
   '{"periods": ["week", "month", "quarter", "year"], "showChange": true, "showTrendSummary": true, "defaultPeriod": "month"}'::jsonb);

-- ============================================================================
-- Verify insertion
-- ============================================================================
DO $$
DECLARE
  admin_count INTEGER;
  super_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM screen_layouts WHERE screen_id = 'analytics-dashboard' AND role = 'admin';
  SELECT COUNT(*) INTO super_admin_count FROM screen_layouts WHERE screen_id = 'analytics-dashboard' AND role = 'super_admin';
  
  IF admin_count = 5 AND super_admin_count = 5 THEN
    RAISE NOTICE 'Analytics Dashboard screen layouts created successfully: % admin widgets, % super_admin widgets', admin_count, super_admin_count;
  ELSE
    RAISE WARNING 'Expected 5 widgets per role, got admin=%, super_admin=%', admin_count, super_admin_count;
  END IF;
END $$;
