-- Migration: 20241221_add_analytics_growth_widget.sql
-- Purpose: Add analytics.growth widget to admin analytics-dashboard and admin-home screens
-- Phase 7 of Widget Development Guide

-- =============================================================================
-- 1. INSERT WIDGET INTO ANALYTICS-DASHBOARD SCREEN
-- =============================================================================
-- Add analytics.growth widget to analytics-dashboard screen for admin role
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
  'analytics-dashboard' as screen_id,
  'analytics.growth' as widget_id,
  1 as position,
  'standard' as size,
  true as enabled,
  '{
    "defaultPeriod": "week",
    "showPeriodSelector": true,
    "showOverallGrowth": true,
    "showMetricsGrid": true,
    "showTargetProgress": true,
    "showTrendChart": true,
    "showHighlights": true,
    "showViewDetails": true,
    "abbreviateNumbers": true,
    "chartHeight": 140,
    "maxMetrics": 4
  }'::jsonb as custom_props,
  '[]'::jsonb as visibility_rules
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM screen_layouts sl 
  WHERE sl.customer_id = c.id 
  AND sl.role = 'admin' 
  AND sl.screen_id = 'analytics-dashboard' 
  AND sl.widget_id = 'analytics.growth'
);

-- =============================================================================
-- 2. ADD TO ADMIN-HOME SCREEN (for dashboard overview)
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
  'analytics.growth' as widget_id,
  6 as position,
  'compact' as size,
  true as enabled,
  '{
    "defaultPeriod": "week",
    "showPeriodSelector": true,
    "showOverallGrowth": true,
    "showMetricsGrid": true,
    "showTargetProgress": false,
    "showTrendChart": false,
    "showHighlights": false,
    "showViewDetails": true,
    "abbreviateNumbers": true,
    "chartHeight": 120,
    "maxMetrics": 4
  }'::jsonb as custom_props,
  '[]'::jsonb as visibility_rules
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM screen_layouts sl 
  WHERE sl.customer_id = c.id 
  AND sl.role = 'admin' 
  AND sl.screen_id = 'admin-home' 
  AND sl.widget_id = 'analytics.growth'
);

-- =============================================================================
-- 3. COMMENTS
-- =============================================================================
COMMENT ON COLUMN screen_layouts.widget_id IS 'Widget identifier from widgetRegistry - analytics.growth shows growth metrics with period selectors, target progress, and trend charts';
