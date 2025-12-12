Perfect, let’s treat these like **core bricks** and do them properly.

I’ll start with the **Error Handling spec** as the first brick.
When you’re ready for the next (Analytics / Telemetry), you can just say **“next”**.

---

## 📄 `docs/ERROR_HANDLING_SPEC.md`

````md
# ⚠️ ERROR_HANDLING_SPEC.md
### Global Error Handling & Safe-Mode Behaviour for Mansuhi

This document defines **how errors are detected, handled, surfaced, and logged** across the app.

It is a core part of the platform, tightly connected to:

- Config-driven architecture (dynamic UI)
- Widget system
- Dynamic navigation
- Offline/i18n/theme engines
- Analytics & crash reporting (Sentry)

This spec is **binding**: all features, widgets, and services must follow it.

---

## 1. 🎯 Objectives

1. **No crashes** for students/teachers/parents/admins due to:
   - Invalid config
   - Widget failure
   - Bad network
   - Navigation misconfig
2. **Predictable fallback behaviour**:
   - Safe-mode config
   - Static navigation fallback
   - Widget-level fallback
3. **Consistent UX** when errors occur:
   - Clear messages
   - Retry options
   - Home escape hatch
4. **Good observability**:
   - Errors always logged to Sentry + Analytics
   - Enough context to debug (user/customer/role/config)
5. **Easy to evolve**:
   - Error handling lives in shared components/hooks
   - Apps/features don’t re-invent error patterns

---

## 2. 🧩 Error Taxonomy

We categorise errors into **6 main types**. Every error handled in the system should be mapped to one of these types (for logging, UI, and debugging).

### 2.1 Config Errors

Failures when loading or validating any of:

- `CustomerConfig`
- Navigation config (tabs/screens)
- Dashboard layout / widget layout
- Feature flags / permissions config
- Theme config

Examples:

- Zod schema validation fails
- Missing required field in DB (e.g., tab without `initialRoute`)
- Widget ID in layout not found in `widgetRegistry`
- Feature ID in DB not found in `featureRegistry`

Impact: can break large parts of the app if not handled.

---

### 2.2 Network / Backend Errors

Failures in any API calls:

- Supabase RPCs / queries / mutations
- Supabase auth errors (expired token, invalid session)
- Rate limiting
- Timeouts

Examples:

- `get_customer_config` RPC fails
- `get_dashboard_layout` returns 500
- `insert` for `createDoubt` fails due to network

Impact: data not available, user actions failing.

---

### 2.3 Widget-Level Errors

Errors inside widgets:

- React rendering errors
- Hook errors (e.g., undefined data shape)
- Incorrect prop usage (e.g., missing required `config` field)

Impact: one part of dashboard may break; must not affect the whole screen.

---

### 2.4 Screen-Level Errors

Errors inside screens/stacks:

- Exceptions thrown during rendering
- Failing to map nav params correctly
- Hook misconfiguration at screen level

Examples:

- `NewDoubtSubmission` crashing due to undefined param
- `NewStudyLibraryScreen` failing due to invalid filter state

Impact: single screen broken; the rest of app should remain usable.

---

### 2.5 Navigation Errors

Any errors in screen routing:

- Trying to navigate to a route not registered
- Tab points to non-existing screen
- Parameter mismatch causing screen not to load

Impact: user gets stuck or sees blank screen if not handled.

---

### 2.6 Permission / Access Errors

Errors due to missing permissions/roles:

- Teacher attempting an admin-only action
- Student trying to open a screen behind a feature flag
- Backend permission denied errors

Impact: UX confusion if not handled cleanly.

---

## 3. 🏛 Error Handling Architecture

Error handling is implemented in **four layers**:

1. **Global level** – app-wide error boundary
2. **Navigator level** – per-tab/stack error boundaries
3. **Screen level** – screen-specific error boundaries
4. **Widget level** – widget-specific error boundaries

Plus shared **hooks** and **services** for handling raw errors from Supabase/React Query.

---

### 3.1 Global Error Boundary

Component: `GlobalErrorBoundary`

- Wraps the **entire app UI** (navigation + providers).
- Catches any unhandled React rendering errors.
- Behaviour:
  - Shows a full-screen fallback:
    - Title: _“Something went wrong”_
    - Message: _“We’re working on fixing this. You can try restarting or going back to Home.”_
    - Buttons:
      - “Restart app” (reset navigation + clear some volatile state)
      - “Report issue” (optional, opens email or feedback)
  - Logs error to:
    - Sentry (with full context)
    - Analytics event `fatal_error`

**Never** show raw stack traces to users.

---

### 3.2 Navigator-Level Error Boundaries

Component: `StackErrorBoundary`

- Wraps each major stack:
  - `HomeStack`
  - `StudyStack`
  - `AskStack`
  - `ProgressStack`
  - `ProfileStack`
  - `AdminStack`
- Catches screen-level errors within that stack.
- Behaviour:
  - Shows stack-specific fallback:
    - “We couldn’t load this section.”
  - Options:
    - “Go to Home”
    - “Try again” (remount stack)
  - Logs error with:
    - `screenId`
    - `tabId`

---

### 3.3 Screen-Level Error Boundaries

Component: `ScreenErrorBoundary`

- Wraps **complex screens** individually, especially those with:
  - heavy data logic
  - complex widget composition
- Behaviour:
  - Fallback content within the tab:
    - “This page ran into a problem.”
  - Option:
    - “Go back”
  - Error recorded with `screenId`.

Use this for screens like:

- `NewStudentDashboard`
- `NewStudyLibraryScreen`
- `NewDoubtSubmission`
- `NewProgressDetailScreen`
- Admin screens

---

### 3.4 Widget-Level Error Boundaries

Component: `WidgetErrorBoundary` (part of Widget System spec)

- Wraps each widget component inside `DynamicDashboard`.
- Behaviour:
  - Renders fallback **card**:
    - Title: “This section couldn’t be loaded”
    - Optional “Retry” (re-mount widget)
  - Logs event:
    - Sentry: `widget_error`
    - Analytics: `widget_error` with `widgetId`, `customerId`, `role`

This ensures a single broken widget never breaks the whole dashboard.

---

## 4. 🧠 Handling Config Errors

Config handling is critical because everything is dynamic.

### 4.1 Validation

All configs are validated using Zod in:

- `validateCustomerConfig`
- `validateNavigationConfig`
- `validateDashboardLayout`
- etc.

If any validation fails:

1. Log **Config Validation Error**:
   - Zod error message
   - customerId
   - slug
   - config version (if used)
2. Attempt to fall back:
   - `SAFE_MODE_CONFIG` (for global failure)
   - local static defaults (for partial failure, e.g. nav only)

### 4.2 Safe-Mode Activation

Safe-mode is a special, simplified configuration.

**Trigger Conditions:**

- `get_customer_config` RPC fails *and* no cached config available.
- `validateCustomerConfig` fails completely.
- Critical sections of config missing:
  - no tabs
  - no root screens

**Safe-Mode Behaviour:**

- Tabs: only show:
  - Home
  - Profile
- Dashboard: minimal widgets:
  - Hero card
  - Today’s schedule (if possible)
- Hide:
  - AI
  - Gamification
  - Admin
  - Non-essential analytics

**User-facing UI:**

- Do **not** show “SAFE MODE” to students directly.
- Instead, keep UI simpler and stable.
- Optionally show a subtle banner:
  - “Some features are temporarily limited.”

**Developer-facing logs:**

- Analytics event: `config_safe_mode` (with reason)
- Sentry event: `ConfigError` with details.

---

## 5. 🌐 Handling Network & Backend Errors

Network + backend errors are common. We must:

- Combine with **offline spec** (NetInfo + React Query)
- Never “white-screen” on network errors.

### 5.1 Consuming APIs via React Query

Every data hook:

- Should surface:
  - `data`
  - `isLoading`
  - `error`
  - `isFetching`
- Must handle:
  - `error` state by mapping to:
    - inline error UI (widget)
    - screen-level error state (screen)

### 5.2 Standard Patterns

**Widgets:**

- Loading → Skeleton
- Error (has cached data):
  - show cached data + offline banner if offline
- Error (no cached data):
  - show compact error card:
    - “We couldn’t load this section.”
    - Retry button

**Screens:**

- Loading → standard screen loader
- Error:
  - Message: “Something went wrong loading this page.”
  - Buttons:
    - “Retry”
    - “Go back”

### 5.3 Distinguish Offline vs Server Error

Use `useNetworkStatus()`:

- If `!isOnline`:
  - show message: “You’re offline…”
- If `isOnline` and server error:
  - “We couldn’t reach the server. Please try again.”

---

## 6. 🧷 Navigation Error Handling

Dynamic navigation can misbehave if:

- tab references invalid screen
- screen route not registered
- parameters missing/invalid

### 6.1 Route Resolution

When resolving screens:

- If a route name is missing:
  - Render `DynamicScreenPlaceholder`:
    - “This screen is not available right now.”
  - Log navigation error.

### 6.2 Static Fallback

If dynamic nav fails entirely (nav config fetch/validation fails badly):

- Respect `USE_DYNAMIC_NAV` flag:
  - If false → use static navigation immediately.
  - If true but failing → fallback to static nav as last resort:
    - Hardcoded 5 tabs.

### 6.3 User Experience

User should **never** see a blank screen due to route errors.

---

## 7. 🔐 Permissions & Access Errors

We use RBAC + overrides (see `PERMISSIONS_RBAC_SPEC.md`).

### 7.1 PermissionGate & FeatureGate

Components:

- `<PermissionGate permission="edit_schedule">`
- `<FeatureGate featureId="ai.tutor">`

Behaviour:

- If access granted:
  - render children
- If not:
  - by default render `null`
  - optionally show “locked” state (for some actions)

### 7.2 Backend Permission Errors

If Supabase returns permission/authorization error:

- Show:
  - “You don’t have access to this action.”
- Log:
  - Sentry: `permission_denied`
  - Analytics: `permission_denied` with `permissionCode`

---

## 8. 🧰 Error Handling Utilities & Hooks

Central location: `src/error/`

### 8.1 Useful Types

```ts
type AppErrorType =
  | "CONFIG"
  | "NETWORK"
  | "WIDGET"
  | "SCREEN"
  | "NAVIGATION"
  | "PERMISSION"
  | "UNKNOWN";
````

### 8.2 `class AppError extends Error`

Encapsulate:

* `type: AppErrorType`
* `details?: any`
* `context?: { userId, customerId, screenId, widgetId }`

### 8.3 `useHandleError` hook

Centralizes:

* Logging to Sentry / Analytics
* Mapping error → user-facing text
* Optional fallback actions

---

## 9. 📊 Logging & Escalation

Error handling is incomplete without logging.

**Every non-trivial error path should:**

1. **Log** to console in dev
2. **Emit an Analytics event** (see `ANALYTICS_TELEMETRY_SPEC.md`)
3. **Send to Sentry** for production monitoring

### Priority Events to Monitor

* `config_safe_mode` spikes
* `widget_error` spikes for specific `widgetId`
* `navigation_error` occurrences
* Repeated `permission_denied` on certain actions

---

## 10. 🧪 Testing Error Handling

### 10.1 Unit Tests

* Config validation failing → safe-mode.
* `AppError` classification.
* Hook mapping network error to user message.

### 10.2 Integration Tests

* Dashboard widget throwing → only widget falls back.
* Nav config missing route → placeholder screen.
* Offline network error → offline message, not server message.

### 10.3 E2E Tests

* Kill Supabase for a run → app starts in safe-mode, not crash.
* Break a widget → rest of dashboard still works.
* Make an admin misconfigure nav → no crash, static fallback works if flag set.

---

## 11. 🔚 Summary

Error handling in Mansuhi is:

* **Layered** (global, stack, screen, widget)
* **Config-aware** (safe-mode, fallback configs)
* **Network-aware** (offline vs server errors)
* **Permission-aware** (RBAC + messaging)
* **Observable** (Sentry + Analytics)

If this spec is followed:

* Students will rarely see “broken” screens.
* Devs will have enough signal to debug issues quickly.
* Config-driven flexibility will not turn into runtime chaos.


