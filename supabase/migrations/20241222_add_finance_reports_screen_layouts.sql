-- ============================================================================
-- Migration: Add Finance Reports Screen Layouts
-- Date: 2024-12-22
-- Purpose: Configure widgets for the finance-reports dynamic screen
-- Screen ID: finance-reports
-- Target Roles: admin, super_admin
-- ============================================================================

-- Delete existing entries for clean setup (idempotent)
DELETE FROM screen_layouts WHERE screen_id = 'finance-reports';

-- ============================================================================
-- Insert widget configurations for admin role
-- ============================================================================
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
VALUES
  -- Revenue Summary Widget (position 1)
  ('demo-customer-id', 'admin', 'finance-reports', 'finance.revenue-summary', 1, true, 'standard',
   '{"showTrend": true, "showBreakdown": true, "defaultPeriod": "month", "showPeriodSelector": true}'::jsonb),
  
  -- Expense Summary Widget (position 2)
  ('demo-customer-id', 'admin', 'finance-reports', 'finance.expense-summary', 2, true, 'standard',
   '{"showTrend": true, "showCategories": true, "defaultPeriod": "month", "showPeriodSelector": true}'::jsonb),
  
  -- Net Profit Widget (position 3)
  ('demo-customer-id', 'admin', 'finance-reports', 'finance.net-profit', 3, true, 'standard',
   '{"showMargin": true, "showComparison": true, "defaultPeriod": "month", "showTrendIndicator": true}'::jsonb),
  
  -- Monthly Chart Widget (position 4 - expanded for better visualization)
  ('demo-customer-id', 'admin', 'finance-reports', 'finance.monthly-chart', 4, true, 'expanded',
   '{"months": 6, "showLegend": true, "showGrid": true, "showDataPoints": true}'::jsonb),
  
  -- Category Breakdown Widget (position 5)
  ('demo-customer-id', 'admin', 'finance-reports', 'finance.category-breakdown', 5, true, 'standard',
   '{"showPercentages": true, "showLegend": true, "type": "revenue", "showTypeSelector": true}'::jsonb),
  
  -- Collection Rate Widget (position 6)
  ('demo-customer-id', 'admin', 'finance-reports', 'finance.collection-rate', 6, true, 'standard',
   '{"showProgressBar": true, "showAmounts": true, "thresholdGood": 80, "thresholdWarning": 60, "showPeriodSelector": true}'::jsonb),
  
  -- Transactions Widget (position 7)
  ('demo-customer-id', 'admin', 'finance-reports', 'finance.transactions', 7, true, 'standard',
   '{"maxItems": 5, "showStatus": true, "showCategory": true, "showViewAll": true}'::jsonb);

-- ============================================================================
-- Insert widget configurations for super_admin role (same layout)
-- ============================================================================
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
VALUES
  -- Revenue Summary Widget (position 1)
  ('demo-customer-id', 'super_admin', 'finance-reports', 'finance.revenue-summary', 1, true, 'standard',
   '{"showTrend": true, "showBreakdown": true, "defaultPeriod": "month", "showPeriodSelector": true}'::jsonb),
  
  -- Expense Summary Widget (position 2)
  ('demo-customer-id', 'super_admin', 'finance-reports', 'finance.expense-summary', 2, true, 'standard',
   '{"showTrend": true, "showCategories": true, "defaultPeriod": "month", "showPeriodSelector": true}'::jsonb),
  
  -- Net Profit Widget (position 3)
  ('demo-customer-id', 'super_admin', 'finance-reports', 'finance.net-profit', 3, true, 'standard',
   '{"showMargin": true, "showComparison": true, "defaultPeriod": "month", "showTrendIndicator": true}'::jsonb),
  
  -- Monthly Chart Widget (position 4 - expanded for better visualization)
  ('demo-customer-id', 'super_admin', 'finance-reports', 'finance.monthly-chart', 4, true, 'expanded',
   '{"months": 6, "showLegend": true, "showGrid": true, "showDataPoints": true}'::jsonb),
  
  -- Category Breakdown Widget (position 5)
  ('demo-customer-id', 'super_admin', 'finance-reports', 'finance.category-breakdown', 5, true, 'standard',
   '{"showPercentages": true, "showLegend": true, "type": "revenue", "showTypeSelector": true}'::jsonb),
  
  -- Collection Rate Widget (position 6)
  ('demo-customer-id', 'super_admin', 'finance-reports', 'finance.collection-rate', 6, true, 'standard',
   '{"showProgressBar": true, "showAmounts": true, "thresholdGood": 80, "thresholdWarning": 60, "showPeriodSelector": true}'::jsonb),
  
  -- Transactions Widget (position 7)
  ('demo-customer-id', 'super_admin', 'finance-reports', 'finance.transactions', 7, true, 'standard',
   '{"maxItems": 5, "showStatus": true, "showCategory": true, "showViewAll": true}'::jsonb);

-- ============================================================================
-- Verify insertion
-- ============================================================================
DO $$
DECLARE
  admin_count INTEGER;
  super_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM screen_layouts WHERE screen_id = 'finance-reports' AND role = 'admin';
  SELECT COUNT(*) INTO super_admin_count FROM screen_layouts WHERE screen_id = 'finance-reports' AND role = 'super_admin';
  
  IF admin_count = 7 AND super_admin_count = 7 THEN
    RAISE NOTICE 'Finance Reports screen layouts created successfully: % admin widgets, % super_admin widgets', admin_count, super_admin_count;
  ELSE
    RAISE WARNING 'Expected 7 widgets per role, got admin=%, super_admin=%', admin_count, super_admin_count;
  END IF;
END $$;
