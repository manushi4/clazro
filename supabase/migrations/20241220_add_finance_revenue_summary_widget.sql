-- Migration: 20241220_add_finance_revenue_summary_widget.sql
-- Purpose: Add finance.revenue-summary widget to admin finance-dashboard screen
-- Phase 7 of Widget Development Guide

-- =============================================================================
-- 1. INSERT WIDGET INTO SCREEN_LAYOUTS
-- =============================================================================
-- Note: This assumes screen_layouts table exists and customer_id is known
-- Replace 'your-customer-id' with actual customer UUID in production

-- Add finance.revenue-summary widget to finance-dashboard screen for admin role
-- Using ON CONFLICT to handle re-runs safely
INSERT INTO screen_layouts (
  customer_id,
  role,
  screen_id,
  widget_id,
  position,
  size,
  enabled,
  custom_props,
  visibility_rules
) 
SELECT 
  c.id as customer_id,
  'admin' as role,
  'finance-dashboard' as screen_id,
  'finance.revenue-summary' as widget_id,
  1 as position,
  'standard' as size,
  true as enabled,
  '{
    "showTotalRevenue": true,
    "showGrowthPercentage": true,
    "showBreakdown": true,
    "showComparison": true,
    "defaultPeriod": "month",
    "showPeriodSelector": true,
    "abbreviateNumbers": true,
    "showViewDetails": true
  }'::jsonb as custom_props,
  '[]'::jsonb as visibility_rules
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM screen_layouts sl 
  WHERE sl.customer_id = c.id 
  AND sl.role = 'admin' 
  AND sl.screen_id = 'finance-dashboard' 
  AND sl.widget_id = 'finance.revenue-summary'
);

-- =============================================================================
-- 2. ALSO ADD TO ADMIN-HOME SCREEN (optional - for dashboard overview)
-- =============================================================================
INSERT INTO screen_layouts (
  customer_id,
  role,
  screen_id,
  widget_id,
  position,
  size,
  enabled,
  custom_props,
  visibility_rules
) 
SELECT 
  c.id as customer_id,
  'admin' as role,
  'admin-home' as screen_id,
  'finance.revenue-summary' as widget_id,
  5 as position,
  'compact' as size,
  true as enabled,
  '{
    "showTotalRevenue": true,
    "showGrowthPercentage": true,
    "showBreakdown": false,
    "showComparison": false,
    "defaultPeriod": "month",
    "showPeriodSelector": false,
    "abbreviateNumbers": true,
    "showViewDetails": true
  }'::jsonb as custom_props,
  '[]'::jsonb as visibility_rules
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM screen_layouts sl 
  WHERE sl.customer_id = c.id 
  AND sl.role = 'admin' 
  AND sl.screen_id = 'admin-home' 
  AND sl.widget_id = 'finance.revenue-summary'
);

-- =============================================================================
-- 3. COMMENTS
-- =============================================================================
COMMENT ON TABLE screen_layouts IS 'Widget placement configuration per customer/role/screen';
