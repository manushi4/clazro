# Universal Widget Architecture - Complete Implementation Plan

**Project:** Transform app into universal widget, config-driven, multi-tenant platform
**Key Change:** Any widget can be placed on any screen, any tab, any position
**Duration:** 10-12 weeks (team) | 18-20 weeks (solo)

---

## Executive Summary

### Current State
- Fixed 5 tabs
- Dashboard-only widgets
- Hardcoded screen layouts
- 2-3 days to customize per customer

### Target State
- **1-10 dynamic tabs** per customer
- **Universal widgets** — any widget on any screen
- **Config-driven screens** — widgets assembled from DB
- **10 minutes** to onboard new customer (zero code changes)

### Success Metrics
| Metric | Current | Target |
|--------|---------|--------|
| Time to add customer | 2-3 days | 10 minutes |
| Code changes per customer | 50+ files | 0 files |
| Tab flexibility | Fixed 5 | 1-10 dynamic |
| Widget placement | Dashboard only | Any screen |
| Screen load time | 1.8s | <2s (p95) |

---

## Core Architecture Principles

### 1. Universal Widgets
Every UI function is a widget. Widgets can be placed on:
- Any screen
- Any tab
- Any position
- Any size (compact/standard/expanded)

### 2. Dynamic Tabs
- Support 1-10 tabs per customer
- Each tab points to a root screen
- Tabs can have badges, permissions, feature requirements

### 3. Composable Screens
Every screen is a container of widgets:
```
Screen = [Widget1, Widget2, Widget3, ...]
```
Widgets are assembled from `screen_layouts` table.

### 4. Config-Driven Everything
- Navigation from DB
- Screen layouts from DB
- Features from DB
- Themes from DB
- Permissions from DB
- **Branding from DB** (white-label)

### 5. Full White-Label Support
Every customer can customize:
- App name, logos, splash screen
- Feature names (AI Tutor → "Ask Guru")
- Tab labels, button text
- Support contact info
- Legal links

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN UI (Platform Studio)                │
│  Tab Builder • Screen Layout Editor • Widget Placement       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ writes config
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                         │
│  navigation_tabs (1-10 tabs)                                 │
│  screen_layouts (widgets per screen)                         │
│  widget_definitions (60+ widgets)                            │
│  customer_features, customer_themes                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ reads config (cached)
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP                                │
│  DynamicNavigator → builds 1-10 tabs from config             │
│  DynamicScreen → assembles widgets from config               │
│  WidgetRegistry → renders 60+ widget types                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Widget System

### Widget Categories (60+ widgets)

| Category | Widgets | Example |
|----------|---------|---------|
| Schedule | 4 | schedule.today, schedule.weekly |
| Study | 5 | library.recent, library.subjects |
| Assessment | 6 | assignments.pending, tests.upcoming |
| Doubts | 5 | doubts.inbox, doubts.quick-ask |
| Progress | 5 | progress.snapshot, progress.streak |
| Social | 5 | peers.groups, peers.leaderboard |
| AI | 4 | ai.tutor-chat, ai.recommendations |
| Profile | 4 | profile.summary, notifications.recent |
| Common | 3 | hero.greeting, actions.quick |
| Teacher | 4 | analytics.class-performance |
| Parent | 4 | child.progress, child.schedule |
| Admin | 4 | admin.stats, admin.users |

### Widget Placement Rules

Each widget has metadata:
- `allowedRoles` — Which roles can see it
- `allowedScreenTypes` — Which screen types it can appear on
- `supportedSizes` — compact, standard, expanded
- `requiredPermissions` — Permissions needed
- `requiredFeatureId` — Feature dependency

### Same Widget, Multiple Screens

```
schedule.today widget can appear on:
├── Student Home (compact)
├── Teacher Home (standard)
├── Schedule Tab (expanded)
└── Parent Dashboard (compact)
```

No code changes. Just config.


---

## Navigation System

### Dynamic Tab Configuration

```typescript
// Example: 3-tab configuration
{
  "tabs": [
    { "tabId": "home", "label": "Home", "icon": "home", "orderIndex": 1, "rootScreenId": "student-home" },
    { "tabId": "learn", "label": "Learn", "icon": "school", "orderIndex": 2, "rootScreenId": "study-hub" },
    { "tabId": "profile", "label": "Me", "icon": "person", "orderIndex": 3, "rootScreenId": "profile-home" }
  ]
}

// Example: 7-tab configuration
{
  "tabs": [
    { "tabId": "home", "label": "Home", "orderIndex": 1, "rootScreenId": "student-home" },
    { "tabId": "schedule", "label": "Schedule", "orderIndex": 2, "rootScreenId": "schedule-screen" },
    { "tabId": "study", "label": "Study", "orderIndex": 3, "rootScreenId": "study-hub" },
    { "tabId": "tests", "label": "Tests", "orderIndex": 4, "rootScreenId": "tests-home" },
    { "tabId": "ask", "label": "Ask", "orderIndex": 5, "rootScreenId": "doubts-home" },
    { "tabId": "progress", "label": "Progress", "orderIndex": 6, "rootScreenId": "progress-home" },
    { "tabId": "profile", "label": "Me", "orderIndex": 7, "rootScreenId": "profile-home" }
  ]
}
```

### Tab Features
- 1-10 tabs supported
- Per-role tab configuration
- Badge support (count, dot)
- Permission gating
- Feature gating
- Offline handling

---

## Screen Layout System

### Screen Layout Configuration

```typescript
// Student Home Screen
{
  "screenId": "student-home",
  "customerId": "school-abc",
  "role": "student",
  "widgets": [
    { "widgetId": "hero.greeting", "position": 1, "size": "standard" },
    { "widgetId": "schedule.today", "position": 2, "size": "compact" },
    { "widgetId": "actions.quick", "position": 3, "size": "standard" },
    { "widgetId": "assignments.pending", "position": 4, "size": "compact" },
    { "widgetId": "doubts.inbox", "position": 5, "size": "compact" },
    { "widgetId": "progress.snapshot", "position": 6, "size": "standard" }
  ]
}

// Teacher Home Screen (different widgets)
{
  "screenId": "teacher-home",
  "customerId": "school-abc",
  "role": "teacher",
  "widgets": [
    { "widgetId": "hero.greeting", "position": 1, "size": "standard" },
    { "widgetId": "schedule.today", "position": 2, "size": "expanded" },
    { "widgetId": "analytics.class-performance", "position": 3, "size": "expanded" },
    { "widgetId": "doubts.to-answer", "position": 4, "size": "standard" },
    { "widgetId": "assignments.to-grade", "position": 5, "size": "standard" }
  ]
}
```

### Screen Types
- **Dashboard** — Main entry screens with widgets
- **Hub** — Feature entry points with widgets
- **List** — Collection views (may have widgets)
- **Detail** — Single item views (usually no widgets)
- **Custom** — Special purpose screens

---

## Database Schema

### Core Tables

```sql
-- Navigation tabs (1-10 per customer)
CREATE TABLE navigation_tabs (
  customer_id UUID,
  role TEXT,
  tab_id TEXT,
  label TEXT,
  icon TEXT,
  order_index INT CHECK (order_index >= 1 AND order_index <= 10),
  root_screen_id TEXT,
  enabled BOOLEAN,
  UNIQUE(customer_id, role, tab_id)
);

-- Screen layouts (widgets per screen)
CREATE TABLE screen_layouts (
  customer_id UUID,
  role TEXT,
  screen_id TEXT,
  widget_id TEXT,
  position INT,
  size TEXT,
  enabled BOOLEAN,
  custom_props JSONB,
  UNIQUE(customer_id, role, screen_id, widget_id)
);

-- Widget definitions (global)
CREATE TABLE widget_definitions (
  widget_id TEXT PRIMARY KEY,
  name TEXT,
  category TEXT,
  allowed_roles TEXT[],
  supported_sizes TEXT[],
  required_permissions TEXT[]
);

-- Customer branding (white-label) - NEW
CREATE TABLE customer_branding (
  customer_id UUID PRIMARY KEY,
  app_name TEXT,
  logo_url TEXT,
  logo_small_url TEXT,
  ai_tutor_name TEXT DEFAULT 'AI Tutor',
  doubt_section_name TEXT DEFAULT 'Ask Doubts',
  assignment_name TEXT DEFAULT 'Assignment',
  test_name TEXT DEFAULT 'Test',
  support_email TEXT,
  support_phone TEXT,
  terms_url TEXT,
  privacy_url TEXT,
  text_overrides JSONB DEFAULT '{}'
);
```

---

## Safety & Fallbacks

### Fallback Chain

```
1. Try: Load config from Supabase
2. Fail: Use cached config (AsyncStorage)
3. Fail: Use DEFAULT_CONFIG (embedded)
4. Fail: Use SAFE_MODE_CONFIG (minimal)
```

### Safe Mode Configuration

```typescript
const SAFE_MODE_CONFIG = {
  tabs: [
    { tabId: "home", label: "Home", rootScreenId: "fallback-home" },
    { tabId: "profile", label: "Profile", rootScreenId: "fallback-profile" }
  ],
  // Minimal widgets, no premium features
};
```

### Error Boundaries

```
GlobalErrorBoundary
  └── NavigatorErrorBoundary
        └── ScreenErrorBoundary
              └── WidgetErrorBoundary
```

**One widget crash never breaks the app.**

---

## Performance Budgets

| Metric | Budget |
|--------|--------|
| Config load time | <500ms |
| Screen render time | <200ms |
| Widget render time | <100ms |
| Total screen load | <2s (p95) |
| Config cache hit rate | >95% |

### Caching Strategy

- Config cached for 10 minutes
- Widget data cached per widget policy
- Offline: serve from cache
- Background refresh when online

---

## Implementation Phases

| Phase | Duration | Output |
|-------|----------|--------|
| 0. Planning | 1 week | Architecture docs |
| 1. Types & Defaults | 1 week | TypeScript foundation |
| 2. Database Schema | 1 week | Supabase tables |
| 3. Widget Registry | 1 week | 60+ widget definitions |
| 4. Config Services | 1 week | Data loading layer |
| 5. Dynamic Navigation | 1 week | 1-10 tabs |
| 6. Dynamic Screens | 2 weeks | Widget composition |
| 7. Widget Implementation | 4 weeks | All widgets |
| 8. Permissions | 1 week | RBAC |
| 9. Theming | 1 week | Per-customer themes |
| **10. Platform Studio** | **6 weeks** | **Full web app** |
| 11. Testing | 3 weeks | Production hardening |

**Total: 24 weeks (solo) | 12-14 weeks (team)**

---

## Platform Studio (Phase 10)

Platform Studio is the web-based configuration management system.

**See:** `PLATFORM_STUDIO_TECHNICAL_SPEC.md` for complete technical specification.

### Key Features

| Feature | Description |
|---------|-------------|
| **Drag & Drop Builder** | Visual editor for tabs, screens, widgets |
| **Template Library** | Pre-built configurations for quick setup |
| **Live Preview** | Real mobile device frame with live data |
| **Real-Time Push** | Changes reflect instantly on mobile |
| **Draft/Publish** | Safe editing with version control |
| **Debug Console** | Full logging of all operations |
| **Rollback** | Instant revert to previous versions |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATFORM STUDIO (Web)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Drag & Drop │  │  Templates  │  │   Live Preview      │  │
│  │   Builder   │  │   Library   │  │   (Mobile Frame)    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          ▼                                   │
│              ┌───────────────────────┐                       │
│              │   PUBLISH BUTTON      │                       │
│              │   + Debug Console     │                       │
│              └───────────┬───────────┘                       │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
              ┌───────────────────────┐
              │   SUPABASE DATABASE   │
              │   (Real-time enabled) │
              └───────────┬───────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
      ┌──────────┐  ┌──────────┐  ┌──────────┐
      │ Mobile 1 │  │ Mobile 2 │  │ Mobile N │
      │ (Live!)  │  │ (Live!)  │  │ (Live!)  │
      └──────────┘  └──────────┘  └──────────┘
```

### Real-Time Sync Flow

1. Admin edits config in Platform Studio
2. Clicks "Publish" → Validation runs
3. If valid → Config saved to `published_configs`
4. `config_change_events` row inserted
5. Supabase Realtime broadcasts to all mobile apps
6. Mobile apps invalidate cache → Re-fetch config
7. UI updates instantly (no app restart needed)

---

## Key Differences from Previous Architecture

| Before | After |
|--------|-------|
| Fixed 5 tabs | 1-10 dynamic tabs |
| Dashboard-only widgets | Universal widgets |
| Hardcoded screen layouts | Config-driven screens |
| Widget tied to dashboard | Widget on any screen |
| `dashboard_layouts` table | `screen_layouts` table |

---

## Summary

This architecture provides:

✅ **Universal Widgets** — Any widget, any screen, any position  
✅ **Dynamic Tabs** — 1-10 tabs per customer  
✅ **Composable Screens** — Widgets assembled from config  
✅ **Zero Code Changes** — All customization via config  
✅ **Safe Fallbacks** — App always works  
✅ **Scalable** — Add widgets without breaking existing  

**Core Philosophy:**
```
Code = Universe of widgets (60+)
Config = Each customer's unique arrangement
App = Renders config dynamically
```

```
End of CONFIG_DRIVEN_ARCHITECTURE_PLAN.md
```
