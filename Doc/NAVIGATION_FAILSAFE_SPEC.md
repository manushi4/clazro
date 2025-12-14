# 🧭 NAVIGATION_FAILSAFE_SPEC.md
### Dynamic Navigation Safety & Fallback System

This document defines how the app ensures **stable navigation** with **dynamic tabs (1-10)** even when:

- Config is missing or corrupted
- Admin misconfigures tabs/screens
- Network is offline
- Screen components fail
- Widget/screen permissions block access

**Key Principle:** Navigation is 100% config-driven. Tab count is dynamic (1-10). The app must never crash regardless of configuration.

---

# 1. 🎯 Objectives

1. App must **always open**, even with broken configs
2. Navigation must **never throw** or break rendering
3. Support **1-10 tabs** per customer (not fixed)
4. Every misconfiguration has a **graceful fallback**
5. Users always have a safe path ("Home", "Profile")
6. Developers get good logs for debugging
7. System respects: feature flags, permissions, offline mode, safe-mode

---

# 2. 🧱 Navigation Architecture

## 2.1 Components

1. **Dynamic Tab Bar** — Built from `navigation_tabs` config (1-10 tabs)
2. **Dynamic Screens** — Built from `screen_layouts` config
3. **Static Fallback Navigator** — Hardcoded 3-tab fallback
4. **Screen Registry** — Maps screen IDs → components
5. **Widget Registry** — Maps widget IDs → components
6. **Navigation Resolver** — Validates at runtime
7. **Navigation Error Boundary** — Catches crashes

## 2.2 Tab Count Support

| Tabs | Use Case |
|------|----------|
| 1 | Minimal app (single screen) |
| 2 | Simple: Home + Profile |
| 3 | Basic: Home + Study + Profile |
| 4 | Standard: Home + Study + Ask + Profile |
| 5 | Full: Home + Study + Ask + Progress + Profile |
| 6-7 | Extended with Social/Schedule tabs |
| 8-10 | Enterprise with custom tabs |

---

# 3. 📂 Route & Screen Registry

Location: `src/navigation/registry/`

### 3.1 Screen Registry

```ts
// screenRegistry.ts
export const screenRegistry: Record<string, React.ComponentType> = {
  "student-home": DynamicScreen,
  "teacher-home": DynamicScreen,
  "parent-home": DynamicScreen,
  "study-hub": DynamicScreen,
  "schedule-screen": DynamicScreen,
  "doubts-home": DynamicScreen,
  "progress-home": DynamicScreen,
  "profile-home": DynamicScreen,
  // Detail screens
  "class-detail": ClassDetailScreen,
  "resource-viewer": ResourceViewerScreen,
  "doubt-detail": DoubtDetailScreen,
  // ... all screens
};
```

### 3.2 Rules

- Every screen in config must exist in registry
- Missing screens render `ScreenPlaceholder`
- Registry is the **single source of truth**


---

# 4. 🚦 Navigation Resolver

Location: `src/navigation/resolvers/`

### 4.1 Tab Resolution

```ts
function resolveTabs(customerId: string, role: string): TabConfig[] {
  try {
    const tabs = fetchNavigationTabs(customerId, role);
    
    // Validate each tab
    const validTabs = tabs
      .filter(tab => tab.enabled)
      .filter(tab => screenRegistry[tab.rootScreenId])
      .filter(tab => checkTabPermissions(tab))
      .sort((a, b) => a.orderIndex - b.orderIndex);
    
    // Must have at least 1 tab
    if (validTabs.length === 0) {
      reportNavigationError({ type: 'NO_VALID_TABS', customerId, role });
      return FALLBACK_TABS;
    }
    
    // Max 10 tabs
    return validTabs.slice(0, 10);
  } catch (error) {
    reportNavigationError({ type: 'TAB_RESOLUTION_FAILED', error });
    return FALLBACK_TABS;
  }
}
```

### 4.2 Screen Resolution

```ts
function resolveScreen(screenId: string): React.ComponentType {
  const screen = screenRegistry[screenId];
  
  if (!screen) {
    reportNavigationError({ type: 'SCREEN_NOT_FOUND', screenId });
    return ScreenPlaceholder;
  }
  
  return screen;
}
```

---

# 5. 🛡 Static Fallback Navigator

### 5.1 When Activated

Static navigation is used when:
1. `USE_DYNAMIC_NAV=false` (env flag)
2. Tab config fetch fails completely
3. All tabs fail validation
4. Navigation resolver fails repeatedly (>3 times)

### 5.2 Fallback Configuration

**Minimal 3-Tab Fallback:**

```ts
const FALLBACK_TABS: TabConfig[] = [
  {
    tabId: "home",
    label: "Home",
    icon: "home",
    orderIndex: 1,
    rootScreenId: "fallback-home",
    enabled: true,
  },
  {
    tabId: "study",
    label: "Study",
    icon: "library-books",
    orderIndex: 2,
    rootScreenId: "fallback-study",
    enabled: true,
  },
  {
    tabId: "profile",
    label: "Profile",
    icon: "person",
    orderIndex: 3,
    rootScreenId: "fallback-profile",
    enabled: true,
  },
];
```

### 5.3 Fallback Screens

Fallback screens show minimal, hardcoded UI:
- Basic navigation works
- Core features accessible
- No dynamic widgets (static content)

---

# 6. 🧩 Config Validation Rules

### 6.1 Tab Validation

Each tab must have:
- `tabId` (unique, lowercase)
- `label` (1-20 chars)
- `icon` (valid icon name)
- `orderIndex` (1-10)
- `rootScreenId` (exists in registry)

**Invalid tabs are skipped, not crashed.**

### 6.2 Tab Filtering

Tab is **removed** if:
- Required feature is disabled
- User lacks required permission
- `requiresOnline=true` but offline
- `rootScreenId` not in registry

### 6.3 Screen Filtering

Screen is **removed** if:
- `screenId` not in registry
- Required feature disabled
- Permission denied
- `requiresOnline=true` but offline

---

# 7. 🧬 Safe Mode Navigation

When safe-mode config is active:

**Only 2 tabs shown:**
1. Home (minimal widgets)
2. Profile (basic info)

All other tabs removed to ensure stability.

---

# 8. 🧠 Screen Placeholder Component

When a screen is missing or fails:

**UI:**
```
"This screen is not available right now."
[Go Back]
[Go to Home]
```

**Logged:**
- `navigation_error`
- screenId, customerId, role, config version

---

# 9. 🔐 Permission-Based Routing

### 9.1 Tab-Level Permissions

```ts
// Tab hidden if user lacks permission
if (tab.requiredPermission && !hasPermission(tab.requiredPermission)) {
  return null; // Tab not rendered
}
```

### 9.2 Screen-Level Permissions

```ts
// Screen shows "Access Denied" if navigated via deep link
if (!hasPermission(screen.requiredPermission)) {
  return <AccessDeniedScreen />;
}
```

### 9.3 Widget-Level Permissions

Handled by widget system (widgets hidden, not crashed).

---

# 10. 🔗 Deep Link Safety

When opening via deep link:

1. Validate feature access
2. Validate permission
3. Validate screenId exists
4. Validate parameters

**If any fail:**
- Show placeholder screen
- Log error
- Offer "Go Home" button

---

# 11. 🌐 Offline Navigation Rules

### 11.1 Tab Behavior

If `tab.requiresOnline=true` and offline:
- Tab shown but greyed out
- Tap shows: "This section requires internet"

### 11.2 Screen Behavior

If `screen.requiresOnline=true` and offline:
- Show offline placeholder
- Offer "Retry when online"

---

# 12. 🧪 Navigation Testing

### 12.1 Unit Tests

- `resolveTabs` returns fallback for empty config
- `resolveScreen` returns placeholder for missing screen
- Tab filtering respects permissions

### 12.2 Integration Tests

- 3-tab config renders 3 tabs
- 7-tab config renders 7 tabs
- Missing screen shows placeholder
- Offline blocking works

### 12.3 E2E Tests

- Kill Supabase → fallback navigation works
- Misconfigure tabs → app still usable
- Switch customer configs → no crash
- Deep link to invalid screen → placeholder shown

---

# 13. 📊 Tab Count Examples

### Example 1: Minimal (2 Tabs)

```json
{
  "tabs": [
    { "tabId": "home", "label": "Home", "orderIndex": 1 },
    { "tabId": "profile", "label": "Me", "orderIndex": 2 }
  ]
}
```

### Example 2: Standard (5 Tabs)

```json
{
  "tabs": [
    { "tabId": "home", "label": "Home", "orderIndex": 1 },
    { "tabId": "study", "label": "Study", "orderIndex": 2 },
    { "tabId": "ask", "label": "Ask", "orderIndex": 3 },
    { "tabId": "progress", "label": "Progress", "orderIndex": 4 },
    { "tabId": "profile", "label": "Me", "orderIndex": 5 }
  ]
}
```

### Example 3: Extended (8 Tabs)

```json
{
  "tabs": [
    { "tabId": "home", "label": "Home", "orderIndex": 1 },
    { "tabId": "schedule", "label": "Schedule", "orderIndex": 2 },
    { "tabId": "study", "label": "Study", "orderIndex": 3 },
    { "tabId": "tests", "label": "Tests", "orderIndex": 4 },
    { "tabId": "ask", "label": "Ask", "orderIndex": 5 },
    { "tabId": "progress", "label": "Progress", "orderIndex": 6 },
    { "tabId": "social", "label": "Peers", "orderIndex": 7 },
    { "tabId": "profile", "label": "Me", "orderIndex": 8 }
  ]
}
```

---

# 14. 🏁 Summary

This navigation failsafe system ensures:

✅ **Dynamic tabs** — 1-10 tabs per customer  
✅ **Universal screens** — Any screen can be a tab root  
✅ **Safe fallbacks** — 3-tab fallback if config fails  
✅ **Permission-aware** — Tabs/screens respect permissions  
✅ **Offline-aware** — Graceful degradation when offline  
✅ **Never crashes** — Placeholders for missing screens  
✅ **Full logging** — All errors tracked for debugging  

**Key Principle:** The app must always be usable, regardless of configuration state.

```
End of NAVIGATION_FAILSAFE_SPEC.md
```
