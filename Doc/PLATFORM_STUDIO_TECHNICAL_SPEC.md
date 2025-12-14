# 🎨 PLATFORM STUDIO - TECHNICAL SPECIFICATION

> **Complete technical spec for the drag-and-drop, real-time, config management web application**

**Version:** 2.0  
**Last Updated:** December 2024

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Architecture](#architecture)
4. [Drag & Drop Builder](#drag--drop-builder)
5. [Template System](#template-system)
6. [Live Mobile Preview](#live-mobile-preview)
7. [Real-Time Sync](#real-time-sync)
8. [Publish System](#publish-system)
9. [Debug Console](#debug-console)
10. [Database Schema](#database-schema)
11. [API Contracts](#api-contracts)
12. [Technology Stack](#technology-stack)
13. [Implementation Phases](#implementation-phases)

---

## 1. Overview

### What is Platform Studio?

Platform Studio is a **web-based configuration management system** that allows:
- Drag-and-drop screen/widget building
- Real-time preview on actual mobile device frame
- Instant push to live mobile apps
- Full debugging and logging
- Template-based quick setup

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **Drag & Drop Builder** | Visual editor for tabs, screens, widgets |
| **Template Library** | Pre-built configurations for quick setup |
| **Live Preview** | Real mobile device frame with live data |
| **Real-Time Push** | Changes reflect instantly on mobile |
| **Draft/Publish** | Safe editing with version control |
| **Debug Console** | Full logging of all operations |
| **Rollback** | Instant revert to previous versions |

### User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PLATFORM STUDIO                               │
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │   SELECT     │    │    EDIT      │    │      PREVIEW         │   │
│  │   CUSTOMER   │ →  │  (Drag/Drop) │ →  │  (Live Mobile Frame) │   │
│  └──────────────┘    └──────────────┘    └──────────────────────┘   │
│                                                    │                 │
│                                                    ▼                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │   ROLLBACK   │ ←  │   PUBLISH    │ ←  │      VALIDATE        │   │
│  │  (if needed) │    │  (Go Live)   │    │   (Check Errors)     │   │
│  └──────────────┘    └──────────────┘    └──────────────────────┘   │
│                             │                                        │
│                             ▼                                        │
│                    ┌──────────────────┐                              │
│                    │   DEBUG CONSOLE  │                              │
│                    │   (Full Logs)    │                              │
│                    └──────────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Features

### 2.1 Drag & Drop Builder

**Capabilities:**
- Drag widgets onto screens
- Reorder widgets by dragging
- Resize widgets (compact/standard/expanded)
- Configure widget properties via panel
- Add/remove/reorder tabs (1-10)
- Assign screens to tabs

**Widget Palette:**
```
┌─────────────────────────────────────────────────────────────┐
│  WIDGET PALETTE                                              │
├─────────────────────────────────────────────────────────────┤
│  📅 Schedule                                                 │
│    ├── Today's Schedule                                      │
│    ├── Weekly Calendar                                       │
│    └── Upcoming Events                                       │
│                                                              │
│  📚 Study                                                    │
│    ├── Recent Library                                        │
│    ├── Favorites                                             │
│    └── Subject Progress                                      │
│                                                              │
│  📝 Assessment                                               │
│    ├── Pending Assignments                                   │
│    ├── Upcoming Tests                                        │
│    └── Recent Results                                        │
│                                                              │
│  ❓ Doubts                                                   │
│    ├── Doubts Inbox                                          │
│    ├── Quick Ask                                             │
│    └── Answered Doubts                                       │
│                                                              │
│  📊 Progress                                                 │
│    ├── Progress Snapshot                                     │
│    ├── Streak Widget                                         │
│    └── Leaderboard                                           │
│                                                              │
│  🤖 AI                                                       │
│    ├── AI Tutor Chat                                         │
│    └── Recommendations                                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Template System

**Pre-built Templates:**

| Template | Tabs | Description |
|----------|------|-------------|
| **Minimal (3 tabs)** | Home, Learn, Profile | Simple setup for small coaching |
| **Standard (5 tabs)** | Home, Schedule, Study, Ask, Profile | Balanced feature set |
| **Full (7 tabs)** | Home, Schedule, Study, Tests, Ask, Progress, Profile | All features |
| **Teacher Focus** | Home, Classes, Students, Doubts, Profile | Teacher-optimized |
| **Parent View** | Home, Child Progress, Schedule, Profile | Parent-optimized |

**Template Application:**
```typescript
// One-click template application
async function applyTemplate(customerId: string, templateId: string) {
  const template = await getTemplate(templateId);
  
  // Apply navigation tabs
  await upsertNavigationTabs(customerId, template.tabs);
  
  // Apply screen layouts
  for (const screen of template.screens) {
    await upsertScreenLayout(customerId, screen);
  }
  
  // Apply default theme
  await upsertTheme(customerId, template.theme);
  
  // Log to audit
  await logConfigChange(customerId, 'template_applied', { templateId });
}
```

### 2.3 Live Mobile Preview

**Real Device Frame Preview:**
- Actual iPhone/Android device frame
- Live data from Supabase (not mock data)
- Real-time updates as you edit
- Role switching (Student/Teacher/Parent)
- Dark/Light mode toggle

```
┌─────────────────────────────────────────────────────────────┐
│                    LIVE PREVIEW PANEL                        │
├─────────────────────────────────────────────────────────────┤
│  Device: [iPhone 14 ▼]  Role: [Student ▼]  Mode: [Light ▼]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│              ┌─────────────────────┐                         │
│              │    ┌───────────┐    │                         │
│              │    │  12:30 PM │    │  ← Status bar           │
│              │    └───────────┘    │                         │
│              │                     │                         │
│              │  ┌───────────────┐  │                         │
│              │  │ Hero Greeting │  │  ← Widget 1             │
│              │  │ Welcome, John │  │                         │
│              │  └───────────────┘  │                         │
│              │                     │                         │
│              │  ┌───────────────┐  │                         │
│              │  │ Today Schedule│  │  ← Widget 2             │
│              │  │ 3 classes     │  │                         │
│              │  └───────────────┘  │                         │
│              │                     │                         │
│              │  ┌───────────────┐  │                         │
│              │  │ Quick Actions │  │  ← Widget 3             │
│              │  │ [📚] [❓] [📊]│  │                         │
│              │  └───────────────┘  │                         │
│              │                     │                         │
│              │  ┌─┬─┬─┬─┬─┐       │                         │
│              │  │🏠│📅│📚│❓│👤│       │  ← Tab bar           │
│              │  └─┴─┴─┴─┴─┘       │                         │
│              └─────────────────────┘                         │
│                                                              │
│  [Refresh Preview]  [Open in New Window]  [QR for Device]   │
└─────────────────────────────────────────────────────────────┘
```

**Preview Implementation:**

> **Note:** Platform Studio is a **standalone Next.js project** (separate from the React Native mobile app). The preview uses **simulation widgets** built with plain React/HTML that visually match the mobile widgets — same design, same data, but not actual React Native components. This is the same approach used by Shopify, Wix, and similar builders.

```typescript
// Preview component renders simulation widgets (plain React, not RN)
function LivePreview({ customerId, role, screenId }: PreviewProps) {
  // Fetch REAL config from Supabase (draft version)
  const { data: layout } = useScreenLayout(customerId, role, screenId, { draft: true });
  const { data: theme } = useCustomerTheme(customerId, { draft: true });
  const { data: branding } = useCustomerBranding(customerId, { draft: true });
  
  // Render preview widgets (simulation components that match mobile design)
  return (
    <DeviceFrame device={selectedDevice}>
      <ThemeProvider theme={theme}>
        <BrandingProvider branding={branding}>
          <PreviewScreen layout={layout} />
        </BrandingProvider>
      </ThemeProvider>
    </DeviceFrame>
  );
}
```

### 2.4 Real-Time Sync to Mobile

**How It Works:**

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Platform Studio │     │     Supabase     │     │   Mobile App     │
│     (Web)        │     │    (Database)    │     │  (React Native)  │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         │  1. Save config        │                        │
         │───────────────────────>│                        │
         │                        │                        │
         │                        │  2. Realtime event     │
         │                        │───────────────────────>│
         │                        │                        │
         │                        │                        │  3. Invalidate
         │                        │                        │     cache
         │                        │                        │
         │                        │  4. Fetch new config   │
         │                        │<───────────────────────│
         │                        │                        │
         │                        │  5. Return config      │
         │                        │───────────────────────>│
         │                        │                        │
         │                        │                        │  6. Re-render
         │                        │                        │     UI
         │                        │                        │
```

**Supabase Realtime Subscription (Mobile App):**
```typescript
// Mobile app subscribes to config changes
useEffect(() => {
  const subscription = supabase
    .channel('config-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'config_change_events',
        filter: `customer_id=eq.${customerId}`,
      },
      (payload) => {
        console.log('Config changed:', payload);
        
        // Invalidate React Query cache
        queryClient.invalidateQueries(['customer-config', customerId]);
        queryClient.invalidateQueries(['screen-layout', customerId]);
        queryClient.invalidateQueries(['navigation-tabs', customerId]);
        
        // Show toast to user (optional)
        showToast('App updated!');
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [customerId]);
```

---

## 3. Architecture

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PLATFORM STUDIO (Web App)                        │
│                                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐ │
│  │  Tab Builder   │  │ Screen Builder │  │     Widget Palette         │ │
│  │  (1-10 tabs)   │  │ (Drag & Drop)  │  │     (60+ widgets)          │ │
│  └───────┬────────┘  └───────┬────────┘  └────────────┬───────────────┘ │
│          │                   │                        │                  │
│          └───────────────────┼────────────────────────┘                  │
│                              │                                           │
│                              ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      CONFIG STATE MANAGER                          │  │
│  │  (Draft configs, validation, diff tracking)                        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                              │                                           │
│          ┌───────────────────┼───────────────────┐                       │
│          │                   │                   │                       │
│          ▼                   ▼                   ▼                       │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────────┐ │
│  │ Live Preview │   │Debug Console │   │     Publish Panel            │ │
│  │(Mobile Frame)│   │  (Logs)      │   │ (Validate → Publish → Track) │ │
│  └──────────────┘   └──────────────┘   └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ API Calls
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE BACKEND                               │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                        CONFIG TABLES                             │    │
│  │  draft_configs │ published_configs │ config_versions             │    │
│  │  navigation_tabs │ screen_layouts │ customer_branding            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      PUBLISH SYSTEM                              │    │
│  │  publish_queue │ publish_logs │ publish_status                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    REALTIME CHANNELS                             │    │
│  │  config_change_events (triggers mobile refresh)                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Realtime Subscription
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         MOBILE APPS (React Native)                       │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Config Listener → Cache Invalidation → Re-render UI            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Student App │ Teacher App │ Parent App │ Admin App                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
EDIT FLOW:
1. User drags widget → Updates local draft state
2. Draft auto-saves every 5 seconds → draft_configs table
3. Live preview updates immediately from draft state
4. No impact on production mobile apps (draft only)

PUBLISH FLOW:
1. User clicks "Publish" → Validation runs
2. If valid → Create publish job in publish_queue
3. Publish worker processes job:
   a. Copy draft → published_configs
   b. Update navigation_tabs, screen_layouts, etc.
   c. Insert config_change_events (triggers realtime)
   d. Update publish_status
4. Mobile apps receive realtime event → Refresh config
5. Debug console shows full log trail
```

---

## 4. Drag & Drop Builder

### 4.1 Builder Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Platform Studio > SchoolABC > Student Home                    [Publish]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌────────────────────────────┐  ┌──────────────────┐ │
│  │ WIDGET       │  │      CANVAS                 │  │ PROPERTIES       │ │
│  │ PALETTE      │  │                             │  │                  │ │
│  │              │  │  ┌───────────────────────┐  │  │ Widget: Hero     │ │
│  │ 📅 Schedule  │  │  │ 1. Hero Greeting  [≡] │  │  │                  │ │
│  │  • Today     │  │  │    Welcome, {name}    │  │  │ Size:            │ │
│  │  • Weekly    │  │  └───────────────────────┘  │  │ [Compact]        │ │
│  │              │  │                             │  │ [Standard] ✓     │ │
│  │ 📚 Study     │  │  ┌───────────────────────┐  │  │ [Expanded]       │ │
│  │  • Library   │  │  │ 2. Today Schedule [≡] │  │  │                  │ │
│  │  • Favorites │  │  │    3 classes today    │  │  │ Show Avatar:     │ │
│  │              │  │  └───────────────────────┘  │  │ [✓] Yes          │ │
│  │ 📝 Tests     │  │                             │  │                  │ │
│  │  • Upcoming  │  │  ┌───────────────────────┐  │  │ Show Streak:     │ │
│  │  • Results   │  │  │ 3. Quick Actions  [≡] │  │  │ [✓] Yes          │ │
│  │              │  │  │    [📚] [❓] [📊]     │  │  │                  │ │
│  │ ❓ Doubts    │  │  └───────────────────────┘  │  │ Custom Props:    │ │
│  │  • Inbox     │  │                             │  │ {                │ │
│  │  • Quick Ask │  │  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  │  │   "greeting":    │ │
│  │              │  │    Drop widget here         │  │   "Welcome"      │ │
│  │ 📊 Progress  │  │  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │  │ }                │ │
│  │  • Snapshot  │  │                             │  │                  │ │
│  │  • Streak    │  │                             │  │ [Delete Widget]  │ │
│  │              │  │                             │  │                  │ │
│  └──────────────┘  └────────────────────────────┘  └──────────────────┘ │
│                                                                          │
│  [Tab: Home ✓] [Tab: Study] [Tab: Ask] [Tab: Profile] [+ Add Tab]       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Drag & Drop Implementation

**Using dnd-kit (React):**

```typescript
// src/studio/components/ScreenBuilder.tsx
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function ScreenBuilder({ customerId, screenId, role }: BuilderProps) {
  const [widgets, setWidgets] = useState<ScreenWidgetConfig[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  // Handle drag end - reorder widgets
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex(i => i.widgetId === active.id);
        const newIndex = items.findIndex(i => i.widgetId === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update positions
        return newItems.map((item, index) => ({
          ...item,
          position: index + 1,
        }));
      });
      
      // Auto-save draft
      saveDraft();
    }
  };

  // Handle drop from palette (new widget)
  const handleDropFromPalette = (widgetId: string, position: number) => {
    const metadata = widgetRegistry[widgetId]?.metadata;
    if (!metadata) return;

    const newWidget: ScreenWidgetConfig = {
      widgetId,
      position,
      size: metadata.defaultSize,
      enabled: true,
      customProps: metadata.defaultConfig,
    };

    setWidgets(prev => {
      const updated = [...prev];
      updated.splice(position - 1, 0, newWidget);
      return updated.map((w, i) => ({ ...w, position: i + 1 }));
    });

    // Log action
    logAction('widget_added', { widgetId, screenId, position });
    
    // Auto-save draft
    saveDraft();
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="screen-builder">
        {/* Widget Palette */}
        <WidgetPalette onDrop={handleDropFromPalette} />
        
        {/* Canvas */}
        <SortableContext items={widgets.map(w => w.widgetId)} strategy={verticalListSortingStrategy}>
          <div className="canvas">
            {widgets.map((widget) => (
              <SortableWidget
                key={widget.widgetId}
                widget={widget}
                isSelected={selectedWidget === widget.widgetId}
                onSelect={() => setSelectedWidget(widget.widgetId)}
                onDelete={() => handleDeleteWidget(widget.widgetId)}
              />
            ))}
            <DropZone onDrop={(widgetId) => handleDropFromPalette(widgetId, widgets.length + 1)} />
          </div>
        </SortableContext>
        
        {/* Properties Panel */}
        {selectedWidget && (
          <PropertiesPanel
            widget={widgets.find(w => w.widgetId === selectedWidget)!}
            onChange={handleWidgetChange}
          />
        )}
      </div>
    </DndContext>
  );
}
```

### 4.3 Tab Builder

```typescript
// src/studio/components/TabBuilder.tsx
function TabBuilder({ customerId, role }: TabBuilderProps) {
  const [tabs, setTabs] = useState<TabConfig[]>([]);
  const maxTabs = 10;
  const minTabs = 1;

  const handleAddTab = () => {
    if (tabs.length >= maxTabs) {
      showError('Maximum 10 tabs allowed');
      return;
    }

    const newTab: TabConfig = {
      tabId: `tab-${Date.now()}`,
      customerId,
      role,
      label: 'New Tab',
      icon: 'apps',
      orderIndex: tabs.length + 1,
      enabled: true,
      rootScreenId: 'placeholder-screen',
      screens: [],
    };

    setTabs([...tabs, newTab]);
    logAction('tab_added', { tabId: newTab.tabId });
  };

  const handleDeleteTab = (tabId: string) => {
    if (tabs.length <= minTabs) {
      showError('At least 1 tab required');
      return;
    }

    setTabs(tabs.filter(t => t.tabId !== tabId));
    logAction('tab_deleted', { tabId });
  };

  const handleReorderTabs = (oldIndex: number, newIndex: number) => {
    const reordered = arrayMove(tabs, oldIndex, newIndex);
    setTabs(reordered.map((tab, i) => ({ ...tab, orderIndex: i + 1 })));
    logAction('tabs_reordered', { oldIndex, newIndex });
  };

  return (
    <div className="tab-builder">
      <DndContext onDragEnd={handleTabDragEnd}>
        <SortableContext items={tabs.map(t => t.tabId)}>
          {tabs.map((tab) => (
            <SortableTab
              key={tab.tabId}
              tab={tab}
              onEdit={(updates) => handleEditTab(tab.tabId, updates)}
              onDelete={() => handleDeleteTab(tab.tabId)}
            />
          ))}
        </SortableContext>
      </DndContext>
      
      {tabs.length < maxTabs && (
        <button onClick={handleAddTab}>+ Add Tab</button>
      )}
      
      <div className="tab-count">
        {tabs.length} / {maxTabs} tabs
      </div>
    </div>
  );
}
```

---

## 5. Template System

### 5.1 Template Structure

```typescript
// src/studio/templates/types.ts
export type ConfigTemplate = {
  id: string;
  name: string;
  description: string;
  category: 'minimal' | 'standard' | 'full' | 'role-specific';
  targetRoles: Role[];
  preview_image_url: string;
  
  // Configuration
  tabs: TabConfig[];
  screens: Record<string, ScreenLayoutConfig>;
  theme: Partial<ThemeConfig>;
  branding: Partial<CustomerBranding>;
  features: string[]; // Feature IDs to enable
};
```

### 5.2 Pre-built Templates

```typescript
// src/studio/templates/prebuilt.ts

export const TEMPLATES: ConfigTemplate[] = [
  {
    id: 'minimal-3-tabs',
    name: 'Minimal (3 Tabs)',
    description: 'Simple setup with Home, Learn, Profile',
    category: 'minimal',
    targetRoles: ['student'],
    preview_image_url: '/templates/minimal.png',
    tabs: [
      { tabId: 'home', label: 'Home', icon: 'home', orderIndex: 1, rootScreenId: 'student-home' },
      { tabId: 'learn', label: 'Learn', icon: 'school', orderIndex: 2, rootScreenId: 'study-hub' },
      { tabId: 'profile', label: 'Me', icon: 'person', orderIndex: 3, rootScreenId: 'profile-home' },
    ],
    screens: {
      'student-home': {
        widgets: [
          { widgetId: 'hero.greeting', position: 1, size: 'standard' },
          { widgetId: 'schedule.today', position: 2, size: 'compact' },
          { widgetId: 'actions.quick', position: 3, size: 'standard' },
        ],
      },
      'study-hub': {
        widgets: [
          { widgetId: 'library.recent', position: 1, size: 'standard' },
          { widgetId: 'library.subjects', position: 2, size: 'expanded' },
        ],
      },
    },
    theme: {
      primary_color: '#6750A4',
    },
    branding: {},
    features: ['schedule', 'library'],
  },

  {
    id: 'standard-5-tabs',
    name: 'Standard (5 Tabs)',
    description: 'Balanced setup with all core features',
    category: 'standard',
    targetRoles: ['student'],
    preview_image_url: '/templates/standard.png',
    tabs: [
      { tabId: 'home', label: 'Home', icon: 'home', orderIndex: 1, rootScreenId: 'student-home' },
      { tabId: 'schedule', label: 'Schedule', icon: 'calendar', orderIndex: 2, rootScreenId: 'schedule-screen' },
      { tabId: 'study', label: 'Study', icon: 'library', orderIndex: 3, rootScreenId: 'study-hub' },
      { tabId: 'ask', label: 'Ask', icon: 'help', orderIndex: 4, rootScreenId: 'doubts-home' },
      { tabId: 'profile', label: 'Me', icon: 'person', orderIndex: 5, rootScreenId: 'profile-home' },
    ],
    screens: {
      'student-home': {
        widgets: [
          { widgetId: 'hero.greeting', position: 1, size: 'standard' },
          { widgetId: 'schedule.today', position: 2, size: 'compact' },
          { widgetId: 'actions.quick', position: 3, size: 'standard' },
          { widgetId: 'assignments.pending', position: 4, size: 'compact' },
          { widgetId: 'doubts.inbox', position: 5, size: 'compact' },
        ],
      },
      // ... other screens
    },
    theme: {
      primary_color: '#6750A4',
    },
    branding: {},
    features: ['schedule', 'library', 'doubts', 'assignments'],
  },

  {
    id: 'full-7-tabs',
    name: 'Full Featured (7 Tabs)',
    description: 'Complete setup with all features enabled',
    category: 'full',
    targetRoles: ['student'],
    preview_image_url: '/templates/full.png',
    tabs: [
      { tabId: 'home', label: 'Home', icon: 'home', orderIndex: 1, rootScreenId: 'student-home' },
      { tabId: 'schedule', label: 'Schedule', icon: 'calendar', orderIndex: 2, rootScreenId: 'schedule-screen' },
      { tabId: 'study', label: 'Study', icon: 'library', orderIndex: 3, rootScreenId: 'study-hub' },
      { tabId: 'tests', label: 'Tests', icon: 'assignment', orderIndex: 4, rootScreenId: 'tests-home' },
      { tabId: 'ask', label: 'Ask', icon: 'help', orderIndex: 5, rootScreenId: 'doubts-home' },
      { tabId: 'progress', label: 'Progress', icon: 'trending-up', orderIndex: 6, rootScreenId: 'progress-home' },
      { tabId: 'profile', label: 'Me', icon: 'person', orderIndex: 7, rootScreenId: 'profile-home' },
    ],
    // ... screens and other config
  },

  {
    id: 'teacher-focus',
    name: 'Teacher Dashboard',
    description: 'Optimized for teachers with class management',
    category: 'role-specific',
    targetRoles: ['teacher'],
    preview_image_url: '/templates/teacher.png',
    tabs: [
      { tabId: 'home', label: 'Home', icon: 'home', orderIndex: 1, rootScreenId: 'teacher-home' },
      { tabId: 'classes', label: 'Classes', icon: 'class', orderIndex: 2, rootScreenId: 'classes-screen' },
      { tabId: 'students', label: 'Students', icon: 'people', orderIndex: 3, rootScreenId: 'students-screen' },
      { tabId: 'doubts', label: 'Doubts', icon: 'help', orderIndex: 4, rootScreenId: 'teacher-doubts' },
      { tabId: 'profile', label: 'Me', icon: 'person', orderIndex: 5, rootScreenId: 'profile-home' },
    ],
    // ... screens
  },
];
```

### 5.3 Template Application UI

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Choose a Template                                              [Close] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │          │
│  │  │  📱       │  │  │  │  📱       │  │  │  │  📱       │  │          │
│  │  │  3 tabs   │  │  │  │  5 tabs   │  │  │  │  7 tabs   │  │          │
│  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │          │
│  │                 │  │                 │  │                 │          │
│  │  Minimal        │  │  Standard       │  │  Full Featured  │          │
│  │  3 tabs, basic  │  │  5 tabs, core   │  │  7 tabs, all    │          │
│  │                 │  │                 │  │                 │          │
│  │  [Apply]        │  │  [Apply] ✓      │  │  [Apply]        │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐                               │
│  │  ┌───────────┐  │  │  ┌───────────┐  │                               │
│  │  │  📱       │  │  │  │  📱       │  │                               │
│  │  │  Teacher  │  │  │  │  Parent   │  │                               │
│  │  └───────────┘  │  │  └───────────┘  │                               │
│  │                 │  │                 │                               │
│  │  Teacher Focus  │  │  Parent View    │                               │
│  │  Class mgmt     │  │  Child tracking │                               │
│  │                 │  │                 │                               │
│  │  [Apply]        │  │  [Apply]        │                               │
│  └─────────────────┘  └─────────────────┘                               │
│                                                                          │
│  ⚠️ Applying a template will replace current configuration              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Publish System

### 6.1 Draft vs Published

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CONFIG LIFECYCLE                                 │
│                                                                          │
│   ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐   │
│   │  DRAFT   │  →   │ VALIDATE │  →   │ PUBLISH  │  →   │   LIVE   │   │
│   │          │      │          │      │          │      │          │   │
│   │ Edit in  │      │ Check    │      │ Copy to  │      │ Mobile   │   │
│   │ Studio   │      │ errors   │      │ prod     │      │ apps see │   │
│   └──────────┘      └──────────┘      └──────────┘      └──────────┘   │
│        │                                                      │         │
│        │                                                      │         │
│        └──────────────────────────────────────────────────────┘         │
│                           ROLLBACK (if needed)                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Publish Workflow

```typescript
// src/studio/services/publishService.ts

export type PublishStatus = 
  | 'idle'
  | 'validating'
  | 'validation_failed'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'rolling_back'
  | 'rolled_back';

export type PublishJob = {
  id: string;
  customer_id: string;
  initiated_by: string;
  status: PublishStatus;
  started_at: string;
  completed_at?: string;
  error?: string;
  changes_summary: ChangesSummary;
  version: number;
  previous_version: number;
};

export type ChangesSummary = {
  tabs_added: number;
  tabs_removed: number;
  tabs_modified: number;
  widgets_added: number;
  widgets_removed: number;
  widgets_modified: number;
  screens_modified: string[];
  theme_changed: boolean;
  branding_changed: boolean;
};

// Main publish function
export async function publishConfig(customerId: string, userId: string): Promise<PublishJob> {
  const jobId = generateJobId();
  
  // Create publish job
  const job: PublishJob = {
    id: jobId,
    customer_id: customerId,
    initiated_by: userId,
    status: 'validating',
    started_at: new Date().toISOString(),
    changes_summary: await calculateChanges(customerId),
    version: await getNextVersion(customerId),
    previous_version: await getCurrentVersion(customerId),
  };

  await insertPublishJob(job);
  logPublishEvent(job, 'job_created');

  try {
    // Step 1: Validate
    logPublishEvent(job, 'validation_started');
    const validation = await validateDraftConfig(customerId);
    
    if (!validation.valid) {
      job.status = 'validation_failed';
      job.error = validation.errors.map(e => e.message).join('; ');
      await updatePublishJob(job);
      logPublishEvent(job, 'validation_failed', { errors: validation.errors });
      return job;
    }
    logPublishEvent(job, 'validation_passed');

    // Step 2: Publish
    job.status = 'publishing';
    await updatePublishJob(job);
    logPublishEvent(job, 'publish_started');

    // Copy draft to published
    await copyDraftToPublished(customerId, job.version);
    logPublishEvent(job, 'config_copied');

    // Trigger realtime event for mobile apps
    await triggerConfigChangeEvent(customerId, 'config_published');
    logPublishEvent(job, 'realtime_triggered');

    // Step 3: Complete
    job.status = 'published';
    job.completed_at = new Date().toISOString();
    await updatePublishJob(job);
    logPublishEvent(job, 'publish_completed');

    return job;

  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
    job.completed_at = new Date().toISOString();
    await updatePublishJob(job);
    logPublishEvent(job, 'publish_failed', { error: error.message });
    throw error;
  }
}

// Rollback function
export async function rollbackConfig(customerId: string, targetVersion: number): Promise<PublishJob> {
  const jobId = generateJobId();
  
  const job: PublishJob = {
    id: jobId,
    customer_id: customerId,
    initiated_by: getCurrentUserId(),
    status: 'rolling_back',
    started_at: new Date().toISOString(),
    version: targetVersion,
    previous_version: await getCurrentVersion(customerId),
  };

  await insertPublishJob(job);
  logPublishEvent(job, 'rollback_started');

  try {
    // Restore from version history
    await restoreConfigVersion(customerId, targetVersion);
    logPublishEvent(job, 'config_restored');

    // Trigger realtime
    await triggerConfigChangeEvent(customerId, 'config_rolled_back');
    logPublishEvent(job, 'realtime_triggered');

    job.status = 'rolled_back';
    job.completed_at = new Date().toISOString();
    await updatePublishJob(job);
    logPublishEvent(job, 'rollback_completed');

    return job;

  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
    await updatePublishJob(job);
    logPublishEvent(job, 'rollback_failed', { error: error.message });
    throw error;
  }
}
```

### 6.3 Validation Rules

```typescript
// src/studio/services/validationService.ts

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};

export type ValidationError = {
  code: string;
  path: string;
  message: string;
  severity: 'error';
};

export type ValidationWarning = {
  code: string;
  path: string;
  message: string;
  severity: 'warning';
};

export async function validateDraftConfig(customerId: string): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const draft = await getDraftConfig(customerId);

  // Rule 1: At least 1 tab required
  if (!draft.tabs || draft.tabs.length === 0) {
    errors.push({
      code: 'NO_TABS',
      path: 'tabs',
      message: 'At least 1 tab is required',
      severity: 'error',
    });
  }

  // Rule 2: Maximum 10 tabs
  if (draft.tabs && draft.tabs.length > 10) {
    errors.push({
      code: 'TOO_MANY_TABS',
      path: 'tabs',
      message: 'Maximum 10 tabs allowed',
      severity: 'error',
    });
  }

  // Rule 3: Each tab must have a valid root screen
  for (const tab of draft.tabs || []) {
    if (!tab.rootScreenId || !screenExists(tab.rootScreenId)) {
      errors.push({
        code: 'INVALID_ROOT_SCREEN',
        path: `tabs.${tab.tabId}.rootScreenId`,
        message: `Tab "${tab.label}" has invalid root screen`,
        severity: 'error',
      });
    }
  }

  // Rule 4: Each screen must have at least 1 widget
  for (const [screenId, layout] of Object.entries(draft.screens || {})) {
    if (!layout.widgets || layout.widgets.length === 0) {
      warnings.push({
        code: 'EMPTY_SCREEN',
        path: `screens.${screenId}`,
        message: `Screen "${screenId}" has no widgets`,
        severity: 'warning',
      });
    }
  }

  // Rule 5: Widget IDs must be valid
  for (const [screenId, layout] of Object.entries(draft.screens || {})) {
    for (const widget of layout.widgets || []) {
      if (!widgetRegistry[widget.widgetId]) {
        errors.push({
          code: 'INVALID_WIDGET',
          path: `screens.${screenId}.widgets.${widget.widgetId}`,
          message: `Unknown widget "${widget.widgetId}"`,
          severity: 'error',
        });
      }
    }
  }

  // Rule 6: Required features must be enabled
  for (const [screenId, layout] of Object.entries(draft.screens || {})) {
    for (const widget of layout.widgets || []) {
      const metadata = widgetRegistry[widget.widgetId]?.metadata;
      if (metadata?.requiredFeatureId) {
        const featureEnabled = draft.features?.[metadata.requiredFeatureId]?.enabled;
        if (!featureEnabled) {
          warnings.push({
            code: 'FEATURE_DISABLED',
            path: `screens.${screenId}.widgets.${widget.widgetId}`,
            message: `Widget "${widget.widgetId}" requires feature "${metadata.requiredFeatureId}" which is disabled`,
            severity: 'warning',
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
```

---

## 7. Debug Console

### 7.1 Debug Console UI

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DEBUG CONSOLE                                          [Clear] [Export]│
├─────────────────────────────────────────────────────────────────────────┤
│  Filter: [All ▼]  [Errors Only]  [Publish Events]  [Config Changes]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  12:45:32.123  INFO   [PUBLISH] Job created: pub_abc123                 │
│  12:45:32.456  INFO   [PUBLISH] Validation started                      │
│  12:45:33.789  INFO   [PUBLISH] Validation passed (0 errors, 2 warnings)│
│  12:45:33.790  WARN   [VALIDATE] Screen "study-hub" has no widgets      │
│  12:45:33.791  WARN   [VALIDATE] Feature "ai" disabled but widget used  │
│  12:45:34.012  INFO   [PUBLISH] Publishing config...                    │
│  12:45:34.234  INFO   [PUBLISH] Copying draft to published              │
│  12:45:34.567  DEBUG  [DB] INSERT INTO published_configs...             │
│  12:45:34.890  DEBUG  [DB] UPDATE navigation_tabs SET...                │
│  12:45:35.123  DEBUG  [DB] UPDATE screen_layouts SET...                 │
│  12:45:35.456  INFO   [PUBLISH] Config copied successfully              │
│  12:45:35.789  INFO   [REALTIME] Triggering config_change_event         │
│  12:45:36.012  DEBUG  [REALTIME] Event sent to 3 connected devices      │
│  12:45:36.234  INFO   [PUBLISH] ✅ Publish completed successfully       │
│  12:45:36.235  INFO   [PUBLISH] Version: 12 → 13                        │
│  12:45:36.236  INFO   [PUBLISH] Duration: 4.113s                        │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  12:46:01.000  INFO   [MOBILE] Device "iPhone-abc" fetched new config   │
│  12:46:01.234  INFO   [MOBILE] Device "Android-xyz" fetched new config  │
│  12:46:02.567  INFO   [MOBILE] Device "iPad-123" fetched new config     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Logging Implementation

```typescript
// src/studio/services/logService.ts

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export type LogCategory = 
  | 'PUBLISH'
  | 'VALIDATE'
  | 'CONFIG'
  | 'REALTIME'
  | 'DB'
  | 'MOBILE'
  | 'AUTH'
  | 'TEMPLATE';

export type LogEntry = {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: Record<string, unknown>;
  customer_id?: string;
  user_id?: string;
  job_id?: string;
  session_id: string;
};

// In-memory log buffer (for UI)
const logBuffer: LogEntry[] = [];
const MAX_BUFFER_SIZE = 1000;

// Log subscribers (for real-time UI updates)
const subscribers: Set<(entry: LogEntry) => void> = new Set();

export function log(
  level: LogLevel,
  category: LogCategory,
  message: string,
  data?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
    customer_id: getCurrentCustomerId(),
    user_id: getCurrentUserId(),
    session_id: getSessionId(),
  };

  // Add to buffer
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }

  // Notify subscribers
  subscribers.forEach(fn => fn(entry));

  // Persist important logs to database
  if (level === 'ERROR' || category === 'PUBLISH') {
    persistLog(entry);
  }

  // Console output (dev mode)
  if (process.env.NODE_ENV === 'development') {
    const color = {
      DEBUG: '\x1b[90m',
      INFO: '\x1b[36m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m',
    }[level];
    console.log(`${color}[${level}] [${category}] ${message}\x1b[0m`, data || '');
  }
}

// Convenience functions
export const logDebug = (cat: LogCategory, msg: string, data?: any) => log('DEBUG', cat, msg, data);
export const logInfo = (cat: LogCategory, msg: string, data?: any) => log('INFO', cat, msg, data);
export const logWarn = (cat: LogCategory, msg: string, data?: any) => log('WARN', cat, msg, data);
export const logError = (cat: LogCategory, msg: string, data?: any) => log('ERROR', cat, msg, data);

// Subscribe to logs (for Debug Console UI)
export function subscribeToLogs(callback: (entry: LogEntry) => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

// Get log history
export function getLogHistory(filter?: {
  level?: LogLevel;
  category?: LogCategory;
  since?: string;
}): LogEntry[] {
  let logs = [...logBuffer];
  
  if (filter?.level) {
    logs = logs.filter(l => l.level === filter.level);
  }
  if (filter?.category) {
    logs = logs.filter(l => l.category === filter.category);
  }
  if (filter?.since) {
    logs = logs.filter(l => l.timestamp >= filter.since);
  }
  
  return logs;
}

// Persist to database
async function persistLog(entry: LogEntry): Promise<void> {
  await supabase.from('studio_logs').insert({
    id: entry.id,
    timestamp: entry.timestamp,
    level: entry.level,
    category: entry.category,
    message: entry.message,
    data: entry.data,
    customer_id: entry.customer_id,
    user_id: entry.user_id,
    session_id: entry.session_id,
  });
}
```

### 7.3 Publish Event Logging

```typescript
// src/studio/services/publishService.ts

export function logPublishEvent(
  job: PublishJob,
  event: string,
  data?: Record<string, unknown>
): void {
  const eventMessages: Record<string, string> = {
    'job_created': `Publish job created: ${job.id}`,
    'validation_started': 'Validation started',
    'validation_passed': 'Validation passed',
    'validation_failed': 'Validation failed',
    'publish_started': 'Publishing config...',
    'config_copied': 'Config copied to production',
    'realtime_triggered': 'Realtime event sent to mobile devices',
    'publish_completed': '✅ Publish completed successfully',
    'publish_failed': '❌ Publish failed',
    'rollback_started': 'Rollback started',
    'config_restored': 'Config restored from version history',
    'rollback_completed': '✅ Rollback completed',
    'rollback_failed': '❌ Rollback failed',
  };

  const level: LogLevel = event.includes('failed') ? 'ERROR' : 'INFO';
  
  logInfo('PUBLISH', eventMessages[event] || event, {
    job_id: job.id,
    customer_id: job.customer_id,
    version: job.version,
    ...data,
  });

  // Also insert into publish_logs table for history
  supabase.from('publish_logs').insert({
    job_id: job.id,
    event,
    timestamp: new Date().toISOString(),
    data,
  });
}
```

---

## 8. Database Schema (Platform Studio)

### 8.1 New Tables for Platform Studio

```sql
-- Draft configurations (edited in Studio, not live)
CREATE TABLE draft_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  config_type TEXT NOT NULL, -- 'navigation' | 'screen_layout' | 'theme' | 'branding'
  config_data JSONB NOT NULL,
  last_edited_by UUID REFERENCES auth.users(id),
  last_edited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, config_type)
);

-- Published configurations (what mobile apps see)
CREATE TABLE published_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  config_type TEXT NOT NULL,
  config_data JSONB NOT NULL,
  version INT NOT NULL,
  published_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, config_type)
);

-- Config version history (for rollback)
CREATE TABLE config_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  version INT NOT NULL,
  config_snapshot JSONB NOT NULL, -- Full config at this version
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, version)
);

-- Publish jobs
CREATE TABLE publish_jobs (
  id TEXT PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id),
  initiated_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL, -- 'validating' | 'publishing' | 'published' | 'failed' | 'rolling_back' | 'rolled_back'
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  error TEXT,
  changes_summary JSONB,
  version INT NOT NULL,
  previous_version INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Publish logs (detailed event log per job)
CREATE TABLE publish_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL REFERENCES publish_jobs(id),
  event TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_publish_logs_job ON publish_logs(job_id);

-- Studio logs (general logging)
CREATE TABLE studio_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  level TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  customer_id UUID,
  user_id UUID,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_studio_logs_customer ON studio_logs(customer_id, timestamp DESC);
CREATE INDEX idx_studio_logs_level ON studio_logs(level, timestamp DESC);

-- Config templates
CREATE TABLE config_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  target_roles TEXT[] NOT NULL,
  preview_image_url TEXT,
  template_data JSONB NOT NULL, -- Full template config
  is_system BOOLEAN DEFAULT false, -- System templates vs custom
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Config change events (triggers mobile refresh)
CREATE TABLE config_change_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  event_type TEXT NOT NULL, -- 'config_published' | 'config_rolled_back' | 'feature_changed'
  version INT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime for config_change_events
ALTER PUBLICATION supabase_realtime ADD TABLE config_change_events;
```

---

## 9. API Contracts (Platform Studio)

### 9.1 Draft Management APIs

```typescript
// Save draft config
POST /api/studio/draft
Request: {
  customer_id: string;
  config_type: 'navigation' | 'screen_layout' | 'theme' | 'branding';
  config_data: object;
}
Response: {
  success: boolean;
  draft_id: string;
  saved_at: string;
}

// Get draft config
GET /api/studio/draft/:customer_id/:config_type
Response: {
  config_data: object;
  last_edited_by: string;
  last_edited_at: string;
  has_unpublished_changes: boolean;
}

// Discard draft (revert to published)
DELETE /api/studio/draft/:customer_id/:config_type
Response: {
  success: boolean;
  reverted_to_version: number;
}
```

### 9.2 Publish APIs

```typescript
// Validate draft before publish
POST /api/studio/validate
Request: {
  customer_id: string;
}
Response: {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// Publish config
POST /api/studio/publish
Request: {
  customer_id: string;
}
Response: {
  job_id: string;
  status: PublishStatus;
  version: number;
}

// Get publish job status
GET /api/studio/publish/:job_id
Response: {
  job: PublishJob;
  logs: PublishLogEntry[];
}

// Rollback to version
POST /api/studio/rollback
Request: {
  customer_id: string;
  target_version: number;
}
Response: {
  job_id: string;
  status: PublishStatus;
}
```

### 9.3 Version History APIs

```typescript
// Get version history
GET /api/studio/versions/:customer_id
Response: {
  versions: {
    version: number;
    created_at: string;
    created_by: string;
    changes_summary: ChangesSummary;
  }[];
}

// Get specific version
GET /api/studio/versions/:customer_id/:version
Response: {
  version: number;
  config_snapshot: object;
  created_at: string;
  created_by: string;
}

// Compare versions
GET /api/studio/versions/:customer_id/compare?from=:v1&to=:v2
Response: {
  diff: {
    added: object[];
    removed: object[];
    modified: object[];
  };
}
```

### 9.4 Template APIs

```typescript
// List templates
GET /api/studio/templates
Response: {
  templates: ConfigTemplate[];
}

// Apply template
POST /api/studio/templates/apply
Request: {
  customer_id: string;
  template_id: string;
  options?: {
    preserve_branding?: boolean;
    preserve_theme?: boolean;
  };
}
Response: {
  success: boolean;
  applied_at: string;
}

// Create custom template from current config
POST /api/studio/templates/create
Request: {
  name: string;
  description: string;
  customer_id: string; // Source customer
}
Response: {
  template_id: string;
}
```

---

## 10. Technology Stack

### 10.1 Frontend (Platform Studio Web App)

> **Note:** Platform Studio is a **standalone project** with its own package.json, completely separate from the React Native mobile app. The mobile app's package.json is managed by other teams and cannot be modified.

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type safety |
| **@dnd-kit/core** | Drag and drop |
| **TanStack Query** | Data fetching & caching |
| **Zustand** | State management |
| **Tailwind CSS** | Styling |
| **Shadcn/ui** | UI components |
| **Preview Widgets** | Simulation components (plain React/HTML, visually match mobile) |
| **Zod** | Validation |

### 10.2 Preview Widget Strategy

Since Platform Studio cannot share code with the mobile app:

1. **Preview widgets** are built with plain React/HTML/CSS
2. They **visually match** the mobile widgets (same design system)
3. They fetch **real data** from Supabase (same APIs as mobile)
4. They apply **real theme/branding** from config

This ensures "what you see = what users get" without code sharing.

### 10.2 Backend

| Technology | Purpose |
|------------|---------|
| **Supabase** | Database, Auth, Realtime |
| **PostgreSQL** | Data storage |
| **Supabase Edge Functions** | Serverless APIs |
| **Supabase Realtime** | Live sync to mobile |

### 10.3 Project Structure

Platform Studio is a **standalone project** (no code sharing with mobile app):

```
platform-studio/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/
│   │   ├── builder/            # Drag & drop builder components
│   │   ├── preview/            # Preview simulation widgets
│   │   ├── ui/                 # Shared UI components
│   │   └── debug/              # Debug console components
│   ├── services/               # Supabase API services
│   ├── hooks/                  # React hooks
│   ├── stores/                 # Zustand stores
│   ├── types/                  # TypeScript types
│   └── lib/                    # Utilities
├── package.json
└── ...
```

**Types Synchronization:** Types are manually kept in sync between mobile app and Platform Studio. When mobile app types change, Platform Studio types must be updated accordingly.

---

## 11. Implementation Phases

### Phase 1: Foundation (2 weeks)
- [ ] Set up Next.js project
- [ ] Database schema for drafts, versions, publish
- [ ] Basic authentication
- [ ] Customer selection UI

### Phase 2: Drag & Drop Builder (3 weeks)
- [ ] Widget palette component
- [ ] Canvas with drag & drop
- [ ] Properties panel
- [ ] Tab builder (1-10 tabs)
- [ ] Auto-save drafts

### Phase 3: Live Preview (2 weeks)
- [ ] Device frame component
- [ ] React Native Web widget rendering
- [ ] Real-time preview updates
- [ ] Role/device switching

### Phase 4: Publish System (2 weeks)
- [ ] Validation service
- [ ] Publish workflow
- [ ] Version history
- [ ] Rollback functionality

### Phase 5: Real-Time Sync (1 week)
- [ ] Supabase Realtime setup
- [ ] Mobile app subscription
- [ ] Cache invalidation

### Phase 6: Debug Console (1 week)
- [ ] Logging service
- [ ] Debug console UI
- [ ] Log filtering & export

### Phase 7: Templates (1 week)
- [ ] Pre-built templates
- [ ] Template application
- [ ] Custom template creation

### Phase 8: Polish & Testing (2 weeks)
- [ ] Error handling
- [ ] Loading states
- [ ] E2E tests
- [ ] Documentation

**Total: 14 weeks**

---

## 12. Summary

Platform Studio provides:

✅ **Drag & Drop Builder** — Visual editing of tabs, screens, widgets  
✅ **Template System** — Quick setup with pre-built configurations  
✅ **Live Preview** — Real mobile device frame with live data  
✅ **Real-Time Sync** — Changes push instantly to mobile apps  
✅ **Draft/Publish** — Safe editing with version control  
✅ **Debug Console** — Full logging of all operations  
✅ **Rollback** — Instant revert to previous versions  

**Key Principle:** What you see in Studio is exactly what users see on mobile. No surprises.

```
End of PLATFORM_STUDIO_TECHNICAL_SPEC.md
```
