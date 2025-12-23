-- ============================================================================
-- Migration: Add System Settings Screen Layouts
-- Date: 2024-12-22
-- Purpose: Configure widgets for the system-settings dynamic screen
-- Screen ID: system-settings
-- Target Roles: admin, super_admin
-- ============================================================================

-- Delete existing entries for clean setup (idempotent)
DELETE FROM screen_layouts WHERE screen_id = 'system-settings';

-- ============================================================================
-- Insert widget configurations for admin role
-- ============================================================================
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
VALUES
  -- Account Settings Widget (position 1)
  ('demo-customer-id', 'admin', 'system-settings', 'settings.account', 1, true, 'standard',
   '{"showAvatar": true, "showEmail": true, "showRole": true, "enableEdit": true}'::jsonb),
  
  -- Notifications Settings Widget (position 2)
  ('demo-customer-id', 'admin', 'system-settings', 'settings.notifications', 2, true, 'standard',
   '{"showPush": true, "showEmail": true, "showSMS": true, "showInApp": true}'::jsonb),
  
  -- Appearance Settings Widget (position 3)
  ('demo-customer-id', 'admin', 'system-settings', 'settings.appearance', 3, true, 'standard',
   '{"showTheme": true, "showLanguage": true, "showFontSize": true}'::jsonb),
  
  -- About Widget (position 4 - compact)
  ('demo-customer-id', 'admin', 'system-settings', 'settings.about', 4, true, 'compact',
   '{"showVersion": true, "showBuildNumber": true, "showSupport": true}'::jsonb),
  
  -- Logout Widget (position 5 - compact)
  ('demo-customer-id', 'admin', 'system-settings', 'settings.logout', 5, true, 'compact',
   '{"showConfirmation": true}'::jsonb);

-- ============================================================================
-- Insert widget configurations for super_admin role (same layout)
-- ============================================================================
INSERT INTO screen_layouts (customer_id, role, screen_id, widget_id, position, enabled, size, custom_props)
VALUES
  -- Account Settings Widget (position 1)
  ('demo-customer-id', 'super_admin', 'system-settings', 'settings.account', 1, true, 'standard',
   '{"showAvatar": true, "showEmail": true, "showRole": true, "enableEdit": true}'::jsonb),
  
  -- Notifications Settings Widget (position 2)
  ('demo-customer-id', 'super_admin', 'system-settings', 'settings.notifications', 2, true, 'standard',
   '{"showPush": true, "showEmail": true, "showSMS": true, "showInApp": true}'::jsonb),
  
  -- Appearance Settings Widget (position 3)
  ('demo-customer-id', 'super_admin', 'system-settings', 'settings.appearance', 3, true, 'standard',
   '{"showTheme": true, "showLanguage": true, "showFontSize": true}'::jsonb),
  
  -- About Widget (position 4 - compact)
  ('demo-customer-id', 'super_admin', 'system-settings', 'settings.about', 4, true, 'compact',
   '{"showVersion": true, "showBuildNumber": true, "showSupport": true}'::jsonb),
  
  -- Logout Widget (position 5 - compact)
  ('demo-customer-id', 'super_admin', 'system-settings', 'settings.logout', 5, true, 'compact',
   '{"showConfirmation": true}'::jsonb);

-- ============================================================================
-- Verify insertion
-- ============================================================================
DO $
DECLARE
  admin_count INTEGER;
  super_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM screen_layouts WHERE screen_id = 'system-settings' AND role = 'admin';
  SELECT COUNT(*) INTO super_admin_count FROM screen_layouts WHERE screen_id = 'system-settings' AND role = 'super_admin';
  
  IF admin_count = 5 AND super_admin_count = 5 THEN
    RAISE NOTICE 'System Settings screen layouts created successfully: % admin widgets, % super_admin widgets', admin_count, super_admin_count;
  ELSE
    RAISE WARNING 'Expected 5 widgets per role, got admin=%, super_admin=%', admin_count, super_admin_count;
  END IF;
END $;
