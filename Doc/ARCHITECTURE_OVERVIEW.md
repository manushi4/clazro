# 🌐 Architecture Overview  
### Universal Widget, Config-Driven, Multi-Tenant Ed-Tech Platform  
### (Student • Teacher • Parent • Admin)

---

## 🎯 Core Principles

### 1. Everything is a Widget
Every UI function is a widget. Widgets can be placed on **any screen, any tab, any position**. There are no fixed layouts.

### 2. Everything is Config
- Tab count is dynamic (1-10 tabs)
- Screen layouts are dynamic (widgets assembled from DB)
- Features are toggleable per customer
- Themes are customizable per customer
- **Zero hardcoding** for customer-specific behavior

### 3. Multi-Tenant by Design
- Single codebase serves all customers
- Row-level isolation via `customer_id`
- Each customer gets unique: tabs, screens, widgets, themes, features

---

## 🧩 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION SHELL                         │
│  Navigation Container • Providers • Role Switching           │
├─────────────────────────────────────────────────────────────┤
│                    DYNAMIC TAB BAR                           │
│  1-10 tabs from config • Per customer • Per role             │
├─────────────────────────────────────────────────────────────┤
│                    DYNAMIC SCREENS                           │
│  Each screen = Container of Widgets from config              │
├─────────────────────────────────────────────────────────────┤
│                    UNIVERSAL WIDGETS                         │
│  50+ widgets • Any widget on any screen • Self-contained     │
├─────────────────────────────────────────────────────────────┤
│                    CONFIG LAYER                              │
│  featureRegistry • widgetRegistry • screenRegistry           │
│  Supabase tables (remote config)                             │
├─────────────────────────────────────────────────────────────┤
│                    DATA LAYER                                │
│  React Query • Supabase Client • Caching                     │
├─────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE                            │
│  Analytics • Permissions • Error Handling • Theming          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Layer Details

### 1. Application Shell

The shell contains **global** components:

- `AppProviders` — Theme, Query Client, Navigation, Auth
- `DynamicNavigator` — Builds tabs from config
- `RoleRouter` — Routes to correct shell per role

**The shell does NOT contain UI. It defines WHERE UI lives.**

### 2. Dynamic Tab Bar

- Reads `navigation_tabs` from Supabase
- Supports **1-10 tabs** per customer
- Each tab points to a `rootScreenId`
- Tabs can have badges, icons, permissions

**Examples:**
- Customer A: 3 tabs (Home, Study, Profile)
- Customer B: 5 tabs (Home, Study, Ask, Progress, Profile)
- Customer C: 7 tabs (Home, Schedule, Study, Tests, Ask, Progress, Profile)

### 3. Dynamic Screens

Every screen is a **container of widgets**:

```
Screen = [Widget1, Widget2, Widget3, ...]
```

- Reads `screen_layouts` from Supabase
- Widgets rendered in order by `position`
- Each widget is self-contained (data, loading, errors)
- Screens can be: dashboard, hub, list, detail, custom

### 4. Universal Widgets

**50+ widgets** organized by category:

| Category | Examples |
|----------|----------|
| Schedule | today, weekly, upcoming-class |
| Study | recent, favorites, subjects |
| Assessment | pending-assignments, upcoming-tests, results |
| Doubts | inbox, quick-ask, answered |
| Progress | snapshot, subject-wise, streak |
| Social | groups, leaderboard, feed |
| AI | tutor-chat, recommendations, summary |
| Profile | summary, stats, notifications |

**Key Rule:** Any widget can appear on any screen.


### 5. Config Layer

#### Local Config (TypeScript)
- `featureRegistry.ts` — All available features
- `widgetRegistry.ts` — All available widgets + metadata
- `screenRegistry.ts` — All available screens
- `defaultConfig.ts` — Fallback configuration

#### Remote Config (Supabase)
- `customers` — Customer master data
- `customer_features` — Feature toggles per customer
- `navigation_tabs` — Tab configuration (1-10 tabs)
- `screen_layouts` — Widget placement per screen
- `customer_branding` — **White-label** (logos, text overrides, feature names)
- `customer_themes` — Visual theme per customer
- `role_permissions` — RBAC configuration

**Rule:** Registries define WHAT exists. Database defines WHAT is enabled and HOW it looks.

---

### 8. Branding Layer (White-Label)

Every customer can customize:

| Element | Source |
|---------|--------|
| App name | `customer_branding.app_name` |
| Logos | `customer_branding.logo_url` |
| AI Tutor name | `customer_branding.ai_tutor_name` |
| Feature names | `customer_branding.*_name` |
| Text overrides | `customer_branding.text_overrides` |
| Support info | `customer_branding.support_*` |
| Legal links | `customer_branding.*_url` |

**Both dynamic AND fixed screens use branding.**

### 6. Data Layer

Location: `src/data/`

- Supabase client setup
- React Query hooks
- Caching strategies
- Offline support

**UI never calls Supabase directly. Always through data layer.**

### 7. Infrastructure Layer

Cross-cutting concerns:

- **Analytics** — Screen views, widget interactions, errors
- **Permissions** — RBAC + per-user overrides
- **Error Handling** — Boundaries at global, screen, widget levels
- **Theming** — Material 3 + customer overrides
- **i18n** — Multi-language support

---

## 🔄 Data Flow

```
┌──────────────────┐
│  Admin UI        │  (Platform Studio)
│  Config changes  │
└────────┬─────────┘
         │ writes
         ▼
┌──────────────────┐
│  Supabase DB     │
│  - navigation_tabs
│  - screen_layouts
│  - customer_features
│  - customer_themes
└────────┬─────────┘
         │ reads (cached)
         ▼
┌──────────────────┐
│  Mobile App      │
│  - DynamicNavigator (builds tabs)
│  - DynamicScreen (assembles widgets)
│  - WidgetRegistry (renders widgets)
└──────────────────┘
```

---

## 🎨 Screen Composition Example

### Student Home Screen

**Config:**
```json
{
  "screenId": "student-home",
  "widgets": [
    { "widgetId": "hero.greeting", "position": 1 },
    { "widgetId": "schedule.today", "position": 2 },
    { "widgetId": "actions.quick", "position": 3 },
    { "widgetId": "assignments.pending", "position": 4 },
    { "widgetId": "progress.snapshot", "position": 5 }
  ]
}
```

**Renders:**
```
┌─────────────────────────────┐
│  Hero Greeting Widget       │
├─────────────────────────────┤
│  Today's Schedule Widget    │
├─────────────────────────────┤
│  Quick Actions Widget       │
├─────────────────────────────┤
│  Pending Assignments Widget │
├─────────────────────────────┤
│  Progress Snapshot Widget   │
└─────────────────────────────┘
```

### Same Widget, Different Screens

The `schedule.today` widget can appear on:
- Student Home (compact size)
- Teacher Home (standard size)
- Schedule Tab (expanded size)
- Parent Dashboard (compact size)

**No code changes. Just config.**

---

## 🔐 Permission Model

```
Permission Check Flow:
1. Role base permissions (student, teacher, parent, admin)
2. Customer role overrides (customer_role_permissions)
3. User-level overrides (user_permissions)
4. Final: ALLOW or DENY
```

Permissions control:
- Tab visibility
- Screen access
- Widget visibility
- Feature access
- Action buttons

---

## 🛡 Safety Model

### Fallback Chain

```
1. Try: Load config from Supabase
2. Fail: Use cached config (AsyncStorage)
3. Fail: Use DEFAULT_CONFIG (embedded)
4. Fail: Use SAFE_MODE_CONFIG (minimal)
```

### Error Boundaries

```
GlobalErrorBoundary
  └── NavigatorErrorBoundary
        └── ScreenErrorBoundary
              └── WidgetErrorBoundary
```

**One widget crash never breaks the whole app.**

---

## 📊 Key Metrics

| Metric | Target |
|--------|--------|
| Time to add customer | 10 minutes |
| Code changes per customer | 0 |
| Feature toggle time | <1 second |
| Screen load time | <2s (p95) |
| Config cache hit rate | >95% |

---

## 🎯 Summary

This architecture ensures:

✅ **Universal Widgets** — Any widget, any screen, any position  
✅ **Dynamic Tabs** — 1-10 tabs per customer  
✅ **Config-Driven** — Zero hardcoding for customers  
✅ **Multi-Tenant** — Single codebase, many customers  
✅ **Multi-Role** — Student, Teacher, Parent, Admin  
✅ **Safe** — Fallbacks at every level  
✅ **Scalable** — Add widgets/screens without breaking existing  

**Core Philosophy:**
```
Code = Universe of possibilities (widgets, screens, features)
Config = Each customer's unique universe
App = Renders config dynamically
```

```
End of ARCHITECTURE_OVERVIEW.md
```
