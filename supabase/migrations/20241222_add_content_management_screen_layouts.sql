-- ============================================================================
-- Migration: Add Content Management Screen Layouts
-- Date: 2024-12-22
-- Purpose: Configure widgets for the content-management dynamic screen
-- Screen ID: content-management
-- Target Roles: admin, super_admin
-- ============================================================================

-- Delete existing entries for clean setup (idempotent)
DELETE FROM screen_layouts WHERE screen_id = 'content-management';

-- ============================================================================
-- Insert widget configurations for admin role
-- ============================================================================
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
VALUES
  -- Content Stats Widget (position 1)
  ('demo-customer-id', 'admin', 'content-management', 'content.stats', 1, true, 'standard',
   '{"showViews": true, "showRatings": true, "showTypeBreakdown": true, "showStatusBreakdown": true}'::jsonb),
  
  -- Content List Widget (position 2 - expanded for better browsing)
  ('demo-customer-id', 'admin', 'content-management', 'content.list', 2, true, 'expanded',
   '{"showFilters": true, "showSearch": true, "showStatus": true, "maxItems": 10, "showViewAll": true}'::jsonb),
  
  -- Content Categories Widget (position 3)
  ('demo-customer-id', 'admin', 'content-management', 'content.categories', 3, true, 'standard',
   '{"layoutStyle": "grid", "showCounts": true, "showViews": true, "enableTap": true}'::jsonb);

-- ============================================================================
-- Insert widget configurations for super_admin role (same layout)
-- ============================================================================
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
VALUES
  -- Content Stats Widget (position 1)
  ('demo-customer-id', 'super_admin', 'content-management', 'content.stats', 1, true, 'standard',
   '{"showViews": true, "showRatings": true, "showTypeBreakdown": true, "showStatusBreakdown": true}'::jsonb),
  
  -- Content List Widget (position 2 - expanded for better browsing)
  ('demo-customer-id', 'super_admin', 'content-management', 'content.list', 2, true, 'expanded',
   '{"showFilters": true, "showSearch": true, "showStatus": true, "maxItems": 10, "showViewAll": true}'::jsonb),
  
  -- Content Categories Widget (position 3)
  ('demo-customer-id', 'super_admin', 'content-management', 'content.categories', 3, true, 'standard',
   '{"layoutStyle": "grid", "showCounts": true, "showViews": true, "enableTap": true}'::jsonb);

-- ============================================================================
-- Verify insertion
-- ============================================================================
DO $
DECLARE
  admin_count INTEGER;
  super_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM screen_layouts WHERE screen_id = 'content-management' AND role = 'admin';
  SELECT COUNT(*) INTO super_admin_count FROM screen_layouts WHERE screen_id = 'content-management' AND role = 'super_admin';
  
  IF admin_count = 3 AND super_admin_count = 3 THEN
    RAISE NOTICE 'Content Management screen layouts created successfully: % admin widgets, % super_admin widgets', admin_count, super_admin_count;
  ELSE
    RAISE WARNING 'Expected 3 widgets per role, got admin=%, super_admin=%', admin_count, super_admin_count;
  END IF;
END $;
