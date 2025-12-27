# Sidebar/Drawer Implementation Guide

Complete guide for implementing a fully configurable sidebar/drawer navigation system following the config-driven, white-label architecture.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Mobile App Implementation](#mobile-app-implementation)
5. [Platform Studio Integration](#platform-studio-integration)
6. [Configuration Options](#configuration-options)
7. [Implementation Phases](#implementation-phases)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose

The sidebar/drawer serves as an **overflow navigation** for features that don't fit in the 5 bottom tabs:
- Apply for Leave
- Request Substitute
- My Calendar
- Reports & Analytics
- Resources & Documents
- Settings & Preferences

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| Everything is Config | All drawer settings stored in database |
| Multi-tenant | Per-customer customization |
| Role-based | Different items per role |
| White-label | Colors, logo, branding from theme |
| Platform Studio | Visual configuration UI |

### User Experience

```
┌─────────────────────────────────────┐
│ [=] App Header              [Bell] │
├─────────────────────────────────────┤
│                                     │
│        Screen Content               │
│                                     │
├─────────────────────────────────────┤
│  Home   Teach   Assess  Chat  Profile│
└─────────────────────────────────────┘

User taps [=] hamburger icon:

┌──────────────────┬──────────────────┐
│                  │                  │
│  ┌────────────┐  │                  │
│  │  Avatar    │  │                  │
│  │  Name      │  │   Dimmed         │
│  │  Role      │  │   Content        │
│  ├────────────┤  │                  │
│  │ Dashboard  │  │                  │
│  │ Calendar   │  │                  │
│  │ Leave      │  │                  │
│  │ Reports    │  │                  │
│  ├────────────┤  │                  │
│  │ Settings   │  │                  │
│  │ Help       │  │                  │
│  │ Logout     │  │                  │
│  └────────────┘  │                  │
└──────────────────┴──────────────────┘
```

---

## Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Platform Studio                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Drawer      │  │ Menu Item   │  │ Style               │  │
│  │ Settings    │  │ Editor      │  │ Customization       │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                       Supabase                               │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │ drawer_config   │  │ drawer_menu_items               │   │
│  │ (per customer/  │  │ (menu items per role)           │   │
│  │  role settings) │  │                                 │   │
│  └────────┬────────┘  └────────────────┬────────────────┘   │
└───────────┼────────────────────────────┼────────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App                               │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │ useDrawerConfig │  │ DynamicDrawer.tsx               │   │
│  │ Query.ts        │──▶│ (renders based on config)      │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
Mobile App (src/)
├── navigation/
│   ├── DynamicDrawer.tsx           # Main drawer component
│   ├── DrawerNavigator.tsx         # React Navigation drawer
│   └── drawerRegistry.ts           # Available menu items registry
├── components/drawer/
│   ├── DrawerContent.tsx           # Drawer content layout
│   ├── DrawerHeader.tsx            # Header with avatar/logo
│   ├── DrawerMenuItem.tsx          # Single menu item
│   ├── DrawerDivider.tsx           # Section divider
│   ├── DrawerSectionHeader.tsx     # Section title
│   └── DrawerFooter.tsx            # Footer with version/logout
├── hooks/
│   ├── queries/
│   │   └── useDrawerConfigQuery.ts # Fetch drawer configuration
│   └── mutations/
│       └── useDrawerActions.ts     # Drawer-related actions
├── stores/
│   └── drawerStore.ts              # Zustand store for drawer state
└── types/
    └── drawer.types.ts             # TypeScript types

Platform Studio (platform-studio/src/)
├── app/studio/
│   └── drawer/
│       └── page.tsx                # Drawer builder page
├── components/drawer-builder/
│   ├── DrawerPreview.tsx           # Live preview
│   ├── DrawerSettingsPanel.tsx     # General settings
│   ├── MenuItemList.tsx            # Sortable menu items
│   ├── MenuItemEditor.tsx          # Edit single item
│   └── DrawerStylePanel.tsx        # Appearance settings
├── config/
│   └── drawerRegistry.ts           # Available items for palette
└── stores/
    └── drawerConfigStore.ts        # Zustand store
```

---

## Database Schema

### Table: drawer_config

Main configuration table for drawer settings per customer/role.

```sql
-- Migration: create_drawer_config_table
CREATE TABLE IF NOT EXISTS drawer_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'parent', 'admin')),

  -- Enable/Disable
  enabled BOOLEAN DEFAULT true,

  -- Position & Behavior
  position TEXT DEFAULT 'left' CHECK (position IN ('left', 'right')),
  trigger_type TEXT DEFAULT 'hamburger' CHECK (trigger_type IN ('hamburger', 'swipe', 'both')),
  swipe_edge_width INTEGER DEFAULT 20,  -- pixels from edge to trigger swipe

  -- Dimensions
  width_percentage INTEGER DEFAULT 80 CHECK (width_percentage BETWEEN 50 AND 100),
  width_max_px INTEGER DEFAULT 320,     -- max width in pixels

  -- Appearance
  background_style TEXT DEFAULT 'solid' CHECK (background_style IN ('solid', 'gradient', 'blur')),
  background_opacity INTEGER DEFAULT 100 CHECK (background_opacity BETWEEN 0 AND 100),
  overlay_opacity INTEGER DEFAULT 50 CHECK (overlay_opacity BETWEEN 0 AND 100),
  overlay_color TEXT DEFAULT '#000000',
  border_radius INTEGER DEFAULT 0,      -- right edge radius when position=left
  shadow_enabled BOOLEAN DEFAULT true,
  shadow_opacity INTEGER DEFAULT 30,

  -- Animation
  animation_type TEXT DEFAULT 'slide' CHECK (animation_type IN ('slide', 'push', 'reveal', 'fade')),
  animation_duration INTEGER DEFAULT 300, -- milliseconds

  -- Header Configuration
  header_style TEXT DEFAULT 'avatar' CHECK (header_style IN ('avatar', 'logo', 'compact', 'none')),
  header_show_role BOOLEAN DEFAULT true,
  header_show_email BOOLEAN DEFAULT false,
  header_background_style TEXT DEFAULT 'gradient' CHECK (header_background_style IN ('solid', 'gradient', 'image', 'none')),
  header_height INTEGER DEFAULT 180,    -- pixels

  -- Footer Configuration
  footer_enabled BOOLEAN DEFAULT true,
  footer_show_version BOOLEAN DEFAULT true,
  footer_show_logout BOOLEAN DEFAULT true,

  -- Behavior
  close_on_select BOOLEAN DEFAULT true,
  haptic_feedback BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(customer_id, role)
);

-- Indexes
CREATE INDEX idx_drawer_config_customer ON drawer_config(customer_id);
CREATE INDEX idx_drawer_config_role ON drawer_config(customer_id, role);

-- RLS
ALTER TABLE drawer_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drawer_config_tenant_isolation" ON drawer_config
  FOR ALL USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles
      WHERE user_id = auth.uid()::text
    )
  );

-- Updated_at trigger
CREATE TRIGGER drawer_config_updated_at
  BEFORE UPDATE ON drawer_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Table: drawer_menu_items

Menu items configuration per customer/role.

```sql
-- Migration: create_drawer_menu_items_table
CREATE TABLE IF NOT EXISTS drawer_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'parent', 'admin')),

  -- Item Identity
  item_id TEXT NOT NULL,              -- unique identifier within role

  -- Display
  label_en TEXT NOT NULL,             -- English label
  label_hi TEXT,                      -- Hindi label
  icon TEXT NOT NULL,                 -- MaterialCommunityIcons name
  icon_color TEXT,                    -- optional custom color (null = use theme)

  -- Item Type
  item_type TEXT DEFAULT 'link' CHECK (item_type IN (
    'link',           -- navigates to route
    'action',         -- triggers action (logout, etc.)
    'divider',        -- horizontal line
    'section_header', -- section title
    'expandable'      -- has sub-items
  )),

  -- Navigation (for type='link')
  route TEXT,                         -- screen route name
  route_params JSONB DEFAULT '{}',    -- navigation params

  -- Action (for type='action')
  action_id TEXT,                     -- 'logout', 'switch_role', 'share_app', etc.

  -- Expandable (for type='expandable')
  parent_item_id TEXT,                -- for nested items
  expanded_by_default BOOLEAN DEFAULT false,

  -- Badge
  badge_type TEXT DEFAULT 'none' CHECK (badge_type IN ('none', 'dot', 'count')),
  badge_source TEXT,                  -- 'notifications', 'pending_leaves', custom key
  badge_color TEXT,                   -- optional custom color

  -- Visibility
  order_index INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT true,
  visibility_rules JSONB,             -- conditional visibility

  -- Styling
  highlight BOOLEAN DEFAULT false,    -- emphasized item (different bg)
  text_color TEXT,                    -- optional custom text color

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(customer_id, role, item_id)
);

-- Indexes
CREATE INDEX idx_drawer_menu_customer ON drawer_menu_items(customer_id);
CREATE INDEX idx_drawer_menu_role ON drawer_menu_items(customer_id, role);
CREATE INDEX idx_drawer_menu_parent ON drawer_menu_items(parent_item_id);
CREATE INDEX idx_drawer_menu_order ON drawer_menu_items(customer_id, role, order_index);

-- RLS
ALTER TABLE drawer_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drawer_menu_tenant_isolation" ON drawer_menu_items
  FOR ALL USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles
      WHERE user_id = auth.uid()::text
    )
  );

-- Updated_at trigger
CREATE TRIGGER drawer_menu_updated_at
  BEFORE UPDATE ON drawer_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Default Data Seeding

```sql
-- Teacher drawer config
INSERT INTO drawer_config (customer_id, role, enabled, position, width_percentage, header_style)
VALUES (
  '2b1195ab-1a06-4c94-8e5f-c7c318e7fc46',
  'teacher',
  true,
  'left',
  80,
  'avatar'
);

-- Teacher menu items
INSERT INTO drawer_menu_items (customer_id, role, item_id, label_en, label_hi, icon, item_type, route, order_index, enabled) VALUES
-- Main Section
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'dashboard', 'Dashboard', 'डैशबोर्ड', 'view-dashboard', 'link', 'teacher-home', 1, true),
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'calendar', 'My Calendar', 'मेरा कैलेंडर', 'calendar-month', 'link', 'teacher-calendar', 2, true),
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'divider-1', '', '', '', 'divider', NULL, 3, true),

-- Leave & Attendance Section
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'section-leave', 'Leave & Attendance', 'छुट्टी और उपस्थिति', '', 'section_header', NULL, 4, true),
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'apply-leave', 'Apply for Leave', 'छुट्टी के लिए आवेदन', 'calendar-remove', 'link', 'leave-application', 5, true),
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'leave-history', 'Leave History', 'छुट्टी का इतिहास', 'history', 'link', 'leave-history', 6, true),
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'request-substitute', 'Request Substitute', 'विकल्प का अनुरोध', 'account-switch', 'link', 'substitute-request', 7, true),
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'divider-2', '', '', '', 'divider', NULL, 8, true),

-- Resources Section
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'section-resources', 'Resources', 'संसाधन', '', 'section_header', NULL, 9, true),
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'teaching-materials', 'Teaching Materials', 'शिक्षण सामग्री', 'book-open-page-variant', 'link', 'teaching-materials', 10, true),
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'question-bank', 'Question Bank', 'प्रश्न बैंक', 'file-question', 'link', 'question-bank', 11, true),
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'reports', 'Reports', 'रिपोर्ट', 'chart-bar', 'link', 'teacher-reports', 12, true),
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'divider-3', '', '', '', 'divider', NULL, 13, true),

-- Settings Section
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'settings', 'Settings', 'सेटिंग्स', 'cog', 'link', 'settings-home', 14, true),
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'help', 'Help & Support', 'सहायता', 'help-circle', 'link', 'help-center', 15, true),
('2b1195ab-1a06-4c94-8e5f-c7c318e7fc46', 'teacher', 'logout', 'Logout', 'लॉग आउट', 'logout', 'action', NULL, 16, true);
```

---

## Configuration Options

### Drawer Settings Reference

#### Dimensions

| Property | Type | Default | Range | Description |
|----------|------|---------|-------|-------------|
| `width_percentage` | Integer | 80 | 50-100 | Drawer width as % of screen |
| `width_max_px` | Integer | 320 | 200-500 | Maximum width in pixels |
| `header_height` | Integer | 180 | 100-300 | Header section height |
| `swipe_edge_width` | Integer | 20 | 10-50 | Edge area for swipe trigger |

#### Appearance

| Property | Type | Default | Options | Description |
|----------|------|---------|---------|-------------|
| `background_style` | String | solid | solid, gradient, blur | Drawer background type |
| `background_opacity` | Integer | 100 | 0-100 | Background transparency |
| `overlay_opacity` | Integer | 50 | 0-100 | Scrim/overlay darkness |
| `overlay_color` | String | #000000 | Hex color | Overlay color |
| `border_radius` | Integer | 0 | 0-32 | Corner radius (far edge) |
| `shadow_enabled` | Boolean | true | true/false | Show drop shadow |
| `shadow_opacity` | Integer | 30 | 0-100 | Shadow intensity |

#### Animation

| Property | Type | Default | Options | Description |
|----------|------|---------|---------|-------------|
| `animation_type` | String | slide | slide, push, reveal, fade | Open animation style |
| `animation_duration` | Integer | 300 | 100-500 | Animation duration (ms) |

#### Position & Trigger

| Property | Type | Default | Options | Description |
|----------|------|---------|---------|-------------|
| `position` | String | left | left, right | Drawer position |
| `trigger_type` | String | hamburger | hamburger, swipe, both | How to open drawer |

#### Header

| Property | Type | Default | Options | Description |
|----------|------|---------|---------|-------------|
| `header_style` | String | avatar | avatar, logo, compact, none | Header display style |
| `header_show_role` | Boolean | true | true/false | Show user role badge |
| `header_show_email` | Boolean | false | true/false | Show email address |
| `header_background_style` | String | gradient | solid, gradient, image, none | Header background |

#### Footer

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `footer_enabled` | Boolean | true | Show footer section |
| `footer_show_version` | Boolean | true | Show app version |
| `footer_show_logout` | Boolean | true | Show logout button in footer |

#### Behavior

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `close_on_select` | Boolean | true | Close drawer when item tapped |
| `haptic_feedback` | Boolean | true | Vibrate on interactions |

### Menu Item Types

#### Link Item
Navigates to a screen when tapped.

```json
{
  "item_id": "calendar",
  "label_en": "My Calendar",
  "label_hi": "मेरा कैलेंडर",
  "icon": "calendar-month",
  "item_type": "link",
  "route": "teacher-calendar",
  "route_params": {},
  "badge_type": "count",
  "badge_source": "calendar_events_today"
}
```

#### Action Item
Triggers an action (logout, share, etc.).

```json
{
  "item_id": "logout",
  "label_en": "Logout",
  "label_hi": "लॉग आउट",
  "icon": "logout",
  "item_type": "action",
  "action_id": "logout"
}
```

Available actions:
- `logout` - Sign out user
- `switch_role` - Switch between roles (if multi-role)
- `share_app` - Share app link
- `rate_app` - Open app store rating
- `contact_support` - Open support chat/email

#### Divider
Horizontal separator line.

```json
{
  "item_id": "divider-1",
  "item_type": "divider",
  "order_index": 5
}
```

#### Section Header
Non-tappable section title.

```json
{
  "item_id": "section-leave",
  "label_en": "Leave & Attendance",
  "label_hi": "छुट्टी और उपस्थिति",
  "item_type": "section_header"
}
```

#### Expandable Item
Item with nested sub-items.

```json
{
  "item_id": "reports",
  "label_en": "Reports",
  "icon": "chart-bar",
  "item_type": "expandable",
  "expanded_by_default": false
}

// Sub-items reference parent
{
  "item_id": "attendance-report",
  "label_en": "Attendance Report",
  "icon": "clipboard-check",
  "item_type": "link",
  "route": "attendance-report",
  "parent_item_id": "reports"
}
```

### Visibility Rules

Control when items appear based on conditions.

```json
{
  "visibility_rules": {
    "type": "feature",
    "featureId": "leave_management",
    "operator": "enabled"
  }
}

{
  "visibility_rules": {
    "type": "role",
    "roles": ["teacher", "admin"],
    "operator": "includes"
  }
}

{
  "visibility_rules": {
    "type": "condition",
    "conditions": [
      { "field": "user.is_class_teacher", "operator": "equals", "value": true }
    ]
  }
}
```

### Badge Sources

Dynamic badge values from app state.

| Source Key | Description | Badge Type |
|------------|-------------|------------|
| `notifications_unread` | Unread notifications count | count |
| `pending_leaves` | Pending leave requests | count |
| `pending_approvals` | Items awaiting approval | count |
| `calendar_events_today` | Today's event count | count |
| `new_messages` | Unread messages | count |
| `has_updates` | App has updates | dot |

---

## Mobile App Implementation

### Types Definition

```typescript
// src/types/drawer.types.ts

export type DrawerPosition = 'left' | 'right';
export type DrawerTrigger = 'hamburger' | 'swipe' | 'both';
export type DrawerAnimation = 'slide' | 'push' | 'reveal' | 'fade';
export type DrawerBackgroundStyle = 'solid' | 'gradient' | 'blur';
export type DrawerHeaderStyle = 'avatar' | 'logo' | 'compact' | 'none';
export type DrawerHeaderBgStyle = 'solid' | 'gradient' | 'image' | 'none';

export type DrawerMenuItemType =
  | 'link'
  | 'action'
  | 'divider'
  | 'section_header'
  | 'expandable';

export type DrawerBadgeType = 'none' | 'dot' | 'count';

export type DrawerConfig = {
  id: string;
  customer_id: string;
  role: string;
  enabled: boolean;

  // Position & Behavior
  position: DrawerPosition;
  trigger_type: DrawerTrigger;
  swipe_edge_width: number;

  // Dimensions
  width_percentage: number;
  width_max_px: number;

  // Appearance
  background_style: DrawerBackgroundStyle;
  background_opacity: number;
  overlay_opacity: number;
  overlay_color: string;
  border_radius: number;
  shadow_enabled: boolean;
  shadow_opacity: number;

  // Animation
  animation_type: DrawerAnimation;
  animation_duration: number;

  // Header
  header_style: DrawerHeaderStyle;
  header_show_role: boolean;
  header_show_email: boolean;
  header_background_style: DrawerHeaderBgStyle;
  header_height: number;

  // Footer
  footer_enabled: boolean;
  footer_show_version: boolean;
  footer_show_logout: boolean;

  // Behavior
  close_on_select: boolean;
  haptic_feedback: boolean;
};

export type DrawerMenuItem = {
  id: string;
  customer_id: string;
  role: string;
  item_id: string;

  // Display
  label_en: string;
  label_hi?: string;
  icon: string;
  icon_color?: string;

  // Type
  item_type: DrawerMenuItemType;

  // Navigation
  route?: string;
  route_params?: Record<string, any>;

  // Action
  action_id?: string;

  // Expandable
  parent_item_id?: string;
  expanded_by_default?: boolean;

  // Badge
  badge_type: DrawerBadgeType;
  badge_source?: string;
  badge_color?: string;

  // Visibility
  order_index: number;
  enabled: boolean;
  visibility_rules?: VisibilityRule;

  // Styling
  highlight?: boolean;
  text_color?: string;
};

export type VisibilityRule = {
  type: 'feature' | 'role' | 'condition';
  featureId?: string;
  roles?: string[];
  operator: string;
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
};
```

### Query Hook

```typescript
// src/hooks/queries/useDrawerConfigQuery.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useAuthStore } from '../../stores/authStore';
import { DrawerConfig, DrawerMenuItem } from '../../types/drawer.types';

export type DrawerConfigData = {
  config: DrawerConfig;
  menuItems: DrawerMenuItem[];
};

export function useDrawerConfigQuery() {
  const customerId = useCustomerId();
  const role = useAuthStore((s) => s.user?.role);

  return useQuery({
    queryKey: ['drawer-config', customerId, role],
    queryFn: async (): Promise<DrawerConfigData> => {
      // Fetch drawer config
      const { data: configData, error: configError } = await supabase
        .from('drawer_config')
        .select('*')
        .eq('customer_id', customerId)
        .eq('role', role)
        .single();

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      // Fetch menu items
      const { data: menuData, error: menuError } = await supabase
        .from('drawer_menu_items')
        .select('*')
        .eq('customer_id', customerId)
        .eq('role', role)
        .eq('enabled', true)
        .order('order_index', { ascending: true });

      if (menuError) throw menuError;

      return {
        config: configData || getDefaultConfig(role),
        menuItems: menuData || [],
      };
    },
    enabled: !!customerId && !!role,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function getDefaultConfig(role: string): DrawerConfig {
  return {
    id: '',
    customer_id: '',
    role,
    enabled: true,
    position: 'left',
    trigger_type: 'both',
    swipe_edge_width: 20,
    width_percentage: 80,
    width_max_px: 320,
    background_style: 'solid',
    background_opacity: 100,
    overlay_opacity: 50,
    overlay_color: '#000000',
    border_radius: 0,
    shadow_enabled: true,
    shadow_opacity: 30,
    animation_type: 'slide',
    animation_duration: 300,
    header_style: 'avatar',
    header_show_role: true,
    header_show_email: false,
    header_background_style: 'gradient',
    header_height: 180,
    footer_enabled: true,
    footer_show_version: true,
    footer_show_logout: true,
    close_on_select: true,
    haptic_feedback: true,
  };
}
```

### Drawer Store

```typescript
// src/stores/drawerStore.ts

import { create } from 'zustand';

type DrawerState = {
  isOpen: boolean;
  expandedItems: string[];

  // Actions
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  toggleExpanded: (itemId: string) => void;
  setExpandedItems: (items: string[]) => void;
};

export const useDrawerStore = create<DrawerState>((set) => ({
  isOpen: false,
  expandedItems: [],

  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  toggleDrawer: () => set((s) => ({ isOpen: !s.isOpen })),

  toggleExpanded: (itemId) =>
    set((s) => ({
      expandedItems: s.expandedItems.includes(itemId)
        ? s.expandedItems.filter((id) => id !== itemId)
        : [...s.expandedItems, itemId],
    })),

  setExpandedItems: (items) => set({ expandedItems: items }),
}));
```

### Drawer Content Component

```typescript
// src/components/drawer/DrawerContent.tsx

import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../../theme/useAppTheme';
import { useDrawerConfigQuery } from '../../hooks/queries/useDrawerConfigQuery';
import { useDrawerStore } from '../../stores/drawerStore';
import { useAuthStore } from '../../stores/authStore';
import { getLocalizedField } from '../../utils/getLocalizedField';

import { DrawerHeader } from './DrawerHeader';
import { DrawerMenuItem } from './DrawerMenuItem';
import { DrawerDivider } from './DrawerDivider';
import { DrawerSectionHeader } from './DrawerSectionHeader';
import { DrawerFooter } from './DrawerFooter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const DrawerContent: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const { closeDrawer, expandedItems, toggleExpanded, setExpandedItems } = useDrawerStore();
  const logout = useAuthStore((s) => s.logout);

  const { data, isLoading } = useDrawerConfigQuery();
  const config = data?.config;
  const menuItems = data?.menuItems || [];

  // Set initially expanded items
  useEffect(() => {
    if (menuItems.length > 0) {
      const defaultExpanded = menuItems
        .filter((item) => item.item_type === 'expandable' && item.expanded_by_default)
        .map((item) => item.item_id);
      setExpandedItems(defaultExpanded);
    }
  }, [menuItems]);

  if (!config || isLoading) return null;

  const drawerWidth = Math.min(
    (SCREEN_WIDTH * config.width_percentage) / 100,
    config.width_max_px
  );

  const handleItemPress = async (item: DrawerMenuItem) => {
    if (config.haptic_feedback && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    switch (item.item_type) {
      case 'link':
        if (item.route) {
          navigation.navigate(item.route as never, item.route_params as never);
          if (config.close_on_select) {
            closeDrawer();
            navigation.dispatch(DrawerActions.closeDrawer());
          }
        }
        break;

      case 'action':
        handleAction(item.action_id);
        break;

      case 'expandable':
        toggleExpanded(item.item_id);
        break;
    }
  };

  const handleAction = (actionId?: string) => {
    switch (actionId) {
      case 'logout':
        closeDrawer();
        logout();
        break;
      case 'share_app':
        // Implement share
        break;
      case 'rate_app':
        // Implement rating
        break;
      case 'contact_support':
        navigation.navigate('help-center' as never);
        closeDrawer();
        break;
    }
  };

  // Filter top-level items (no parent)
  const topLevelItems = menuItems.filter((item) => !item.parent_item_id);

  // Get children for expandable items
  const getChildren = (parentId: string) =>
    menuItems.filter((item) => item.parent_item_id === parentId);

  const renderItem = (item: DrawerMenuItem) => {
    switch (item.item_type) {
      case 'divider':
        return <DrawerDivider key={item.item_id} />;

      case 'section_header':
        return (
          <DrawerSectionHeader
            key={item.item_id}
            label={getLocalizedField(item, 'label')}
          />
        );

      case 'expandable':
        const isExpanded = expandedItems.includes(item.item_id);
        const children = getChildren(item.item_id);
        return (
          <View key={item.item_id}>
            <DrawerMenuItem
              item={item}
              onPress={() => handleItemPress(item)}
              isExpanded={isExpanded}
              hasChildren={children.length > 0}
            />
            {isExpanded && children.map((child) => (
              <DrawerMenuItem
                key={child.item_id}
                item={child}
                onPress={() => handleItemPress(child)}
                isNested
              />
            ))}
          </View>
        );

      default:
        return (
          <DrawerMenuItem
            key={item.item_id}
            item={item}
            onPress={() => handleItemPress(item)}
          />
        );
    }
  };

  const bgOpacity = config.background_opacity / 100;
  const backgroundColor =
    config.background_style === 'solid'
      ? colors.surface
      : config.background_style === 'gradient'
      ? colors.surface
      : colors.surface;

  return (
    <View
      style={[
        styles.container,
        {
          width: drawerWidth,
          backgroundColor,
          opacity: bgOpacity,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          borderTopRightRadius: config.position === 'left' ? config.border_radius : 0,
          borderBottomRightRadius: config.position === 'left' ? config.border_radius : 0,
          borderTopLeftRadius: config.position === 'right' ? config.border_radius : 0,
          borderBottomLeftRadius: config.position === 'right' ? config.border_radius : 0,
        },
        config.shadow_enabled && {
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 0 },
          shadowOpacity: config.shadow_opacity / 100,
          shadowRadius: 10,
          elevation: 10,
        },
      ]}
    >
      {/* Header */}
      {config.header_style !== 'none' && (
        <DrawerHeader config={config} />
      )}

      {/* Menu Items */}
      <ScrollView
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        {topLevelItems.map(renderItem)}
      </ScrollView>

      {/* Footer */}
      {config.footer_enabled && (
        <DrawerFooter
          config={config}
          onLogout={() => handleAction('logout')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
});
```

### Drawer Header Component

```typescript
// src/components/drawer/DrawerHeader.tsx

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppTheme } from '../../theme/useAppTheme';
import { useBranding } from '../../context/BrandingContext';
import { useAuthStore } from '../../stores/authStore';
import { AppText } from '../../ui/components/AppText';
import { DrawerConfig } from '../../types/drawer.types';

type Props = {
  config: DrawerConfig;
};

export const DrawerHeader: React.FC<Props> = ({ config }) => {
  const { colors } = useAppTheme();
  const { branding } = useBranding();
  const user = useAuthStore((s) => s.user);

  const renderHeaderContent = () => {
    switch (config.header_style) {
      case 'avatar':
        return (
          <View style={styles.avatarContainer}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <AppText style={[styles.avatarInitial, { color: colors.onPrimary }]}>
                  {user?.display_name?.[0]?.toUpperCase() || 'U'}
                </AppText>
              </View>
            )}
            <AppText style={[styles.userName, { color: colors.onPrimary }]}>
              {user?.display_name || 'User'}
            </AppText>
            {config.header_show_role && (
              <View style={[styles.roleBadge, { backgroundColor: `${colors.onPrimary}20` }]}>
                <AppText style={[styles.roleText, { color: colors.onPrimary }]}>
                  {user?.role?.toUpperCase()}
                </AppText>
              </View>
            )}
            {config.header_show_email && (
              <AppText style={[styles.email, { color: `${colors.onPrimary}80` }]}>
                {user?.email}
              </AppText>
            )}
          </View>
        );

      case 'logo':
        return (
          <View style={styles.logoContainer}>
            {branding?.logo_url ? (
              <Image
                source={{ uri: branding.logo_url }}
                style={styles.logo}
                resizeMode="contain"
              />
            ) : (
              <AppText style={[styles.appName, { color: colors.onPrimary }]}>
                {branding?.app_name || 'App'}
              </AppText>
            )}
          </View>
        );

      case 'compact':
        return (
          <View style={styles.compactContainer}>
            <View style={[styles.compactAvatar, { backgroundColor: colors.primary }]}>
              <AppText style={{ color: colors.onPrimary, fontWeight: 'bold' }}>
                {user?.display_name?.[0]?.toUpperCase() || 'U'}
              </AppText>
            </View>
            <View style={styles.compactInfo}>
              <AppText style={[styles.compactName, { color: colors.onPrimary }]}>
                {user?.display_name}
              </AppText>
              {config.header_show_role && (
                <AppText style={[styles.compactRole, { color: `${colors.onPrimary}80` }]}>
                  {user?.role}
                </AppText>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderBackground = () => {
    switch (config.header_background_style) {
      case 'gradient':
        return (
          <LinearGradient
            colors={[colors.primary, colors.primaryContainer || colors.primary]}
            style={[styles.headerBg, { height: config.header_height }]}
          >
            {renderHeaderContent()}
          </LinearGradient>
        );

      case 'solid':
        return (
          <View
            style={[
              styles.headerBg,
              { height: config.header_height, backgroundColor: colors.primary },
            ]}
          >
            {renderHeaderContent()}
          </View>
        );

      default:
        return (
          <View style={[styles.headerBg, { height: config.header_height }]}>
            {renderHeaderContent()}
          </View>
        );
    }
  };

  return renderBackground();
};

const styles = StyleSheet.create({
  headerBg: {
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarContainer: {
    alignItems: 'flex-start',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  email: {
    fontSize: 13,
    marginTop: 4,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logo: {
    width: 120,
    height: 60,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  compactRole: {
    fontSize: 12,
    marginTop: 2,
  },
});
```

### Drawer Menu Item Component

```typescript
// src/components/drawer/DrawerMenuItem.tsx

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppTheme } from '../../theme/useAppTheme';
import { AppText } from '../../ui/components/AppText';
import { getLocalizedField } from '../../utils/getLocalizedField';
import { useBadgeValue } from '../../hooks/useBadgeValue';
import { DrawerMenuItem as DrawerMenuItemType } from '../../types/drawer.types';

type Props = {
  item: DrawerMenuItemType;
  onPress: () => void;
  isNested?: boolean;
  isExpanded?: boolean;
  hasChildren?: boolean;
};

export const DrawerMenuItem: React.FC<Props> = ({
  item,
  onPress,
  isNested = false,
  isExpanded = false,
  hasChildren = false,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const badgeValue = useBadgeValue(item.badge_source);

  const label = getLocalizedField(item, 'label');
  const iconColor = item.icon_color || colors.onSurface;
  const textColor = item.text_color || colors.onSurface;

  const renderBadge = () => {
    if (item.badge_type === 'none' || !badgeValue) return null;

    const badgeColor = item.badge_color || colors.error;

    if (item.badge_type === 'dot') {
      return <View style={[styles.badgeDot, { backgroundColor: badgeColor }]} />;
    }

    return (
      <View style={[styles.badgeCount, { backgroundColor: badgeColor }]}>
        <AppText style={styles.badgeText}>
          {badgeValue > 99 ? '99+' : badgeValue}
        </AppText>
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        isNested && styles.nested,
        item.highlight && { backgroundColor: `${colors.primary}10` },
        { borderRadius: borderRadius.medium },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}10` }]}>
        <Icon name={item.icon} size={20} color={iconColor} />
      </View>

      <AppText
        style={[styles.label, { color: textColor }]}
        numberOfLines={1}
      >
        {label}
      </AppText>

      {renderBadge()}

      {hasChildren && (
        <Icon
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.onSurfaceVariant}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 2,
  },
  nested: {
    marginLeft: 24,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
```

---

## Platform Studio Integration

### Drawer Builder Page

```typescript
// platform-studio/src/app/studio/drawer/page.tsx

"use client";

import { useState } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { ROLES, Role } from "@/types";
import { useDrawerConfigStore } from "@/stores/drawerConfigStore";
import { DrawerPreview } from "@/components/drawer-builder/DrawerPreview";
import { DrawerSettingsPanel } from "@/components/drawer-builder/DrawerSettingsPanel";
import { MenuItemList } from "@/components/drawer-builder/MenuItemList";
import { MenuItemEditor } from "@/components/drawer-builder/MenuItemEditor";
import { Save, Loader2, Plus } from "lucide-react";

export default function DrawerBuilder() {
  const {
    selectedRole,
    setSelectedRole,
    drawerConfig,
    menuItems,
    updateConfig,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    reorderMenuItems,
    saveToSupabase,
    isSaving,
    isDirty,
  } = useDrawerConfigStore();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = menuItems.findIndex((i) => i.item_id === active.id);
      const newIndex = menuItems.findIndex((i) => i.item_id === over.id);
      const reordered = arrayMove(menuItems, oldIndex, newIndex);
      reorderMenuItems(reordered.map((item, idx) => ({ ...item, order_index: idx + 1 })));
    }
  };

  const selectedItem = menuItems.find((i) => i.item_id === selectedItemId);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Drawer Builder</h1>
            <p className="text-sm text-gray-500">Configure sidebar navigation</p>
          </div>

          {/* Role selector */}
          <div className="flex gap-1 ml-8">
            {ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium ${
                  selectedRole === role
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-sm text-orange-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              Unsaved changes
            </span>
          )}
          <button
            onClick={saveToSupabase}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Settings Panel */}
        <div className="w-80 border-r bg-white overflow-auto">
          <DrawerSettingsPanel
            config={drawerConfig}
            onUpdate={updateConfig}
          />
        </div>

        {/* Center: Menu Items */}
        <div className="flex-1 p-6 bg-gray-50 overflow-auto">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Menu Items</h2>
              <button
                onClick={() => addMenuItem()}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg"
              >
                <Plus size={14} />
                Add Item
              </button>
            </div>

            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={menuItems.map((i) => i.item_id)}
                strategy={verticalListSortingStrategy}
              >
                <MenuItemList
                  items={menuItems}
                  selectedItemId={selectedItemId}
                  onSelect={setSelectedItemId}
                  onDelete={deleteMenuItem}
                />
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Right: Item Editor + Preview */}
        <div className="flex border-l">
          {/* Item Editor */}
          {selectedItem && (
            <div className="w-72 border-r bg-white overflow-auto">
              <MenuItemEditor
                item={selectedItem}
                onUpdate={(updates) => updateMenuItem(selectedItem.item_id, updates)}
                onClose={() => setSelectedItemId(null)}
              />
            </div>
          )}

          {/* Preview */}
          <div className="w-80 bg-white overflow-hidden">
            <DrawerPreview
              config={drawerConfig}
              menuItems={menuItems}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Drawer Settings Panel

```typescript
// platform-studio/src/components/drawer-builder/DrawerSettingsPanel.tsx

import { DrawerConfig } from "@/types";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import { Select } from "@/components/ui/Select";
import {
  Layout,
  Palette,
  Move,
  Image,
  Settings2,
} from "lucide-react";

type Props = {
  config: DrawerConfig;
  onUpdate: (updates: Partial<DrawerConfig>) => void;
};

export function DrawerSettingsPanel({ config, onUpdate }: Props) {
  return (
    <div className="divide-y">
      {/* Enable/Disable */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Enable Drawer</span>
          <Switch
            checked={config.enabled}
            onChange={(enabled) => onUpdate({ enabled })}
          />
        </div>
      </div>

      {/* Position & Trigger */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Layout size={14} />
          Position & Trigger
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Position</label>
            <Select
              value={config.position}
              onChange={(position) => onUpdate({ position })}
              options={[
                { value: "left", label: "Left" },
                { value: "right", label: "Right" },
              ]}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Trigger</label>
            <Select
              value={config.trigger_type}
              onChange={(trigger_type) => onUpdate({ trigger_type })}
              options={[
                { value: "hamburger", label: "Hamburger Icon" },
                { value: "swipe", label: "Edge Swipe" },
                { value: "both", label: "Both" },
              ]}
            />
          </div>

          {(config.trigger_type === "swipe" || config.trigger_type === "both") && (
            <div>
              <label className="text-xs text-gray-500">
                Swipe Edge Width: {config.swipe_edge_width}px
              </label>
              <Slider
                value={config.swipe_edge_width}
                min={10}
                max={50}
                onChange={(swipe_edge_width) => onUpdate({ swipe_edge_width })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Dimensions */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Move size={14} />
          Dimensions
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">
              Width: {config.width_percentage}%
            </label>
            <Slider
              value={config.width_percentage}
              min={50}
              max={100}
              onChange={(width_percentage) => onUpdate({ width_percentage })}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Max Width: {config.width_max_px}px
            </label>
            <Slider
              value={config.width_max_px}
              min={200}
              max={500}
              step={10}
              onChange={(width_max_px) => onUpdate({ width_max_px })}
            />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Palette size={14} />
          Appearance
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Background Style</label>
            <Select
              value={config.background_style}
              onChange={(background_style) => onUpdate({ background_style })}
              options={[
                { value: "solid", label: "Solid" },
                { value: "gradient", label: "Gradient" },
                { value: "blur", label: "Blur (iOS)" },
              ]}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Background Opacity: {config.background_opacity}%
            </label>
            <Slider
              value={config.background_opacity}
              min={0}
              max={100}
              onChange={(background_opacity) => onUpdate({ background_opacity })}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Overlay Opacity: {config.overlay_opacity}%
            </label>
            <Slider
              value={config.overlay_opacity}
              min={0}
              max={100}
              onChange={(overlay_opacity) => onUpdate({ overlay_opacity })}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Border Radius: {config.border_radius}px
            </label>
            <Slider
              value={config.border_radius}
              min={0}
              max={32}
              onChange={(border_radius) => onUpdate({ border_radius })}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Shadow</span>
            <Switch
              checked={config.shadow_enabled}
              onChange={(shadow_enabled) => onUpdate({ shadow_enabled })}
            />
          </div>

          {config.shadow_enabled && (
            <div>
              <label className="text-xs text-gray-500">
                Shadow Opacity: {config.shadow_opacity}%
              </label>
              <Slider
                value={config.shadow_opacity}
                min={0}
                max={100}
                onChange={(shadow_opacity) => onUpdate({ shadow_opacity })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Animation */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Move size={14} />
          Animation
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Animation Type</label>
            <Select
              value={config.animation_type}
              onChange={(animation_type) => onUpdate({ animation_type })}
              options={[
                { value: "slide", label: "Slide" },
                { value: "push", label: "Push" },
                { value: "reveal", label: "Reveal" },
                { value: "fade", label: "Fade" },
              ]}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Duration: {config.animation_duration}ms
            </label>
            <Slider
              value={config.animation_duration}
              min={100}
              max={500}
              step={50}
              onChange={(animation_duration) => onUpdate({ animation_duration })}
            />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Image size={14} />
          Header
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Header Style</label>
            <Select
              value={config.header_style}
              onChange={(header_style) => onUpdate({ header_style })}
              options={[
                { value: "avatar", label: "Avatar & Name" },
                { value: "logo", label: "Logo" },
                { value: "compact", label: "Compact" },
                { value: "none", label: "None" },
              ]}
            />
          </div>

          {config.header_style !== "none" && (
            <>
              <div>
                <label className="text-xs text-gray-500">
                  Header Height: {config.header_height}px
                </label>
                <Slider
                  value={config.header_height}
                  min={100}
                  max={300}
                  step={10}
                  onChange={(header_height) => onUpdate({ header_height })}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Background</label>
                <Select
                  value={config.header_background_style}
                  onChange={(header_background_style) => onUpdate({ header_background_style })}
                  options={[
                    { value: "gradient", label: "Gradient" },
                    { value: "solid", label: "Solid" },
                    { value: "image", label: "Image" },
                    { value: "none", label: "None" },
                  ]}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Show Role</span>
                <Switch
                  checked={config.header_show_role}
                  onChange={(header_show_role) => onUpdate({ header_show_role })}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Show Email</span>
                <Switch
                  checked={config.header_show_email}
                  onChange={(header_show_email) => onUpdate({ header_show_email })}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Settings2 size={14} />
          Footer
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Enable Footer</span>
            <Switch
              checked={config.footer_enabled}
              onChange={(footer_enabled) => onUpdate({ footer_enabled })}
            />
          </div>

          {config.footer_enabled && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Show Version</span>
                <Switch
                  checked={config.footer_show_version}
                  onChange={(footer_show_version) => onUpdate({ footer_show_version })}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Show Logout</span>
                <Switch
                  checked={config.footer_show_logout}
                  onChange={(footer_show_logout) => onUpdate({ footer_show_logout })}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Behavior */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Settings2 size={14} />
          Behavior
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Close on Select</span>
            <Switch
              checked={config.close_on_select}
              onChange={(close_on_select) => onUpdate({ close_on_select })}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Haptic Feedback</span>
            <Switch
              checked={config.haptic_feedback}
              onChange={(haptic_feedback) => onUpdate({ haptic_feedback })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Implementation Phases

### Phase 1: Database Setup
- [ ] Create drawer_config table migration
- [ ] Create drawer_menu_items table migration
- [ ] Add RLS policies
- [ ] Seed default data for all roles

### Phase 2: Mobile Types & Store
- [ ] Create drawer.types.ts
- [ ] Create drawerStore.ts
- [ ] Create useDrawerConfigQuery.ts hook

### Phase 3: Mobile Components
- [ ] DrawerContent.tsx
- [ ] DrawerHeader.tsx
- [ ] DrawerMenuItem.tsx
- [ ] DrawerDivider.tsx
- [ ] DrawerSectionHeader.tsx
- [ ] DrawerFooter.tsx

### Phase 4: Navigation Integration
- [ ] Wrap navigator with Drawer
- [ ] Add hamburger icon to header
- [ ] Implement swipe gesture

### Phase 5: Platform Studio Store
- [ ] Create drawerConfigStore.ts
- [ ] Implement Supabase sync

### Phase 6: Platform Studio UI
- [ ] Drawer builder page
- [ ] Settings panel
- [ ] Menu item list (sortable)
- [ ] Menu item editor
- [ ] Live preview

### Phase 7: Testing
- [ ] Test all roles
- [ ] Test all animation types
- [ ] Test offline behavior
- [ ] Test Platform Studio sync

---

## Troubleshooting

### Drawer Not Opening

1. Check `drawer_config.enabled` is true
2. Verify hamburger icon is connected to store
3. Check React Navigation drawer setup

### Menu Items Not Showing

1. Verify `drawer_menu_items.enabled` is true
2. Check RLS policy allows access
3. Verify customer_id matches

### Styling Not Applied

1. Check opacity values (0-100, not 0-1)
2. Verify theme colors available
3. Check Platform Studio sync

### Badge Not Updating

1. Verify `badge_source` matches store key
2. Check `useBadgeValue` hook implementation
3. Ensure store updates on data change

---

## References

- [Widget Development Guide](./WIDGET_DEVELOPMENT_GUIDE.md)
- [Screen Development Guide](./SCREEN_DEVELOPMENT_GUIDE.md)
- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
- [React Navigation Drawer](https://reactnavigation.org/docs/drawer-navigator/)
