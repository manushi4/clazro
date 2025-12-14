Understood — here is the **next core brick**, written at full production quality:

---

# 📄 `docs/CRASH_REPORTING_SENTRY_SPEC.md`

### Complete Crash Reporting, Error Monitoring & Diagnostics Strategy

```md
# 💥 CRASH_REPORTING_SENTRY_SPEC.md
### Crash Reporting, Error Monitoring, Breadcrumbs & Diagnostics Pipeline for Mansuhi

This document defines **how Mansuhi handles crash reporting and production error monitoring**, using **Sentry** (or equivalent).  
It ensures:

- All fatal and non-fatal errors are captured  
- Errors include user/customer/context for debugging  
- Widget/screen/navigation/config problems are visible  
- Performance bottlenecks are measurable  
- Issues can be traced back to specific tenants/features/widgets  

This is a **mandatory cross-platform system** and must be integrated before advanced UI/features.

---

# 1. 🎯 Objectives

The Sentry (Crash Reporting) system must:

1. Catch **all unhandled crashes** (global scope)
2. Catch **screen-level errors** (per stack)
3. Catch **widget-level errors** (per widget)
4. Capture **navigation failures**
5. Capture **config loading/validation errors**
6. Record **breadcrumbs** leading up to the crash
7. Attach useful **context metadata** (device, user, tenant, role)
8. Function in **multi-tenant** and **offline scenarios**
9. Integrate with **analytics events** for a full observability chain

This system must **never** crash the app itself.

---

# 2. 🧱 High-Level Architecture

```

┌─────────────────────────────┐
│       Global Sentry Init    │
└─────────────┬───────────────┘
│
Global Error Boundary
│
Navigator Error Boundary
│
Screen Boundaries
│
Widget Boundaries
│
Analytics Layer
│
┌─────────────▼────────────────┐
│   Sentry Provider (SDK)       │
│  Logs, Performance, Breadcrumb │
└───────────────────────────────┘

```

Interaction:

- React errors bubble → boundaries capture → report to Sentry
- `AppError` (custom class) produces structured logs
- Analytics logs breadcrumbs before and after events
- Navigation and config failures sent as Sentry events

---

# 3. 🔌 Sentry Initialization

Location:  
```

src/app/AppProviders.tsx

````

Requirements:

- Initialize BEFORE rendering navigation
- Capture:
  - device info
  - release version
  - environment (dev/staging/production)
- Attach global scope with:
  - `customerId`
  - `role`
  - `userId`
  - app version
  - platform
  - network status (optional)

Example (not full code):

```ts
Sentry.init({
  dsn: EXPO_PUBLIC_SENTRY_DSN,
  enableInExpoDevelopment: false,
  tracesSampleRate: 1.0,
  integrations: [new Sentry.ReactNativeTracing()],
});
````

---

# 4. 🧩 Error Boundaries Integrated with Sentry

### 4.1 GlobalErrorBoundary

* Wraps navigator + all providers
* Catches any React rendering crash
* Sends event:

  * `type`: "GLOBAL_ERROR"
  * `screenId`: current screen
  * `routeStack`: full nav stack
* Shows:

  * Restart app
  * Go Home

### 4.2 StackErrorBoundary

* Wrap each tab’s Stack.Navigator
* If a screen inside a stack crashes:

  * Log `STACK_ERROR`
  * Include:

    * tabId
    * screenId
* Show graceful fallback screen

### 4.3 ScreenErrorBoundary

* Wrap complex screens
* On crash:

  * Log `SCREEN_ERROR`
  * Include:

    * screenId
    * route params
* Show “This page encountered a problem”

### 4.4 WidgetErrorBoundary

* Wrap each dashboard widget
* On crash:

  * Log `WIDGET_ERROR`
  * Include:

    * widgetId
    * customerId
    * role
* Render fallback card instead of crashing dashboard

This ensures **maximum granularity**.

---

# 5. 🧠 Automatically Captured Errors

### 5.1 Config-related Errors

When:

* Zod validation fails
* Missing navigation tab
* WidgetId not found in registry
* FeatureId missing from registry

We call:

```ts
Sentry.captureException(new ConfigError(details));
```

Metadata attached:

* config section
* failed path
* customerId
* screenshot for admin (optional in future)

### 5.2 Navigation Errors

If:

* route not found
* param missing
* invalid screen mapping

Event:
`navigation_error`

### 5.3 Backend/Supabase Errors

Wrap all Supabase RPCs like:

```ts
const { data, error } = await fn();
if (error) {
  Sentry.captureException(error, { extra: { rpc: 'get_dashboard_layout' } });
}
```

This captures:

* Permission denied
* Network errors
* 500s

---

# 6. 🧂 Breadcrumbs (Critical)

Breadcrumbs = tiny logs before errors, essential for debugging.

We log automatic breadcrumbs for:

* Screen view (`screen_view`)
* Navigation (`navigate_to_screen`)
* Config loaded (`config_loaded`)
* Widget rendered (`widget_render`)
* Widget error (`widget_error`)
* Offline/online events (`network_offline`)
* Analytics events (funnel reconstruction)

This gives a full timeline of what the user did before the crash.

---

# 7. 🗂 Metadata on All Errors

Every Sentry event MUST include:

| Field           | Purpose                             |
| --------------- | ----------------------------------- |
| `userId`        | Identifies which user saw the crash |
| `customerId`    | Multi-tenant debugging              |
| `role`          | Student/Teacher/Admin               |
| `screenId`      | Which screen crashed                |
| `widgetId`      | If applicable                       |
| `featureId`     | Which feature failed                |
| `configVersion` | Future-proofing                     |
| `networkStatus` | Offline/Online                      |
| `isSafeMode`    | Whether safe-mode was active        |

This metadata turns crashes from “mysterious” to “diagnosable”.

---

# 8. 💾 Offline Behaviour

If offline, Sentry caches events until:

* Internet restored
* App restart (depending on SDK)
* Event queue flushed

**Events must never block UI.**

If Sentry fails to send → fail silently.

---

# 9. 🧬 Error Types & Custom Error Class

Create:

```
src/error/AppError.ts
```

```ts
export class AppError extends Error {
  type: AppErrorType;
  context?: any;
  constructor(type: AppErrorType, message: string, context?: any) {
    super(message);
    this.type = type;
    this.context = context;
  }
}
```

### Error Types:

```ts
type AppErrorType =
  | "CONFIG"
  | "NAVIGATION"
  | "NETWORK"
  | "WIDGET"
  | "SCREEN"
  | "PERMISSION"
  | "UNKNOWN";
```

Helps group errors in dashboards.

---

# 10. 🚨 Crash Escalation Rules

### High-priority to investigate:

* Repeated `widget_error` from same widget on different tenants
* Repeated `config_safe_mode` activations
* `navigation_error` spike
* `permission_denied` spike (possible RLS misconfig)
* Slow screen load times growing

### Low-priority:

* Random failures with no clustering
* Offline errors (if expected)

---

# 11. 🧪 Testing Strategy

### Unit tests

* `AppError` classification
* Sentry wrapper triggers correctly

### Integration tests

* Simulate throwing inside widget → Sentry receives `WIDGET_ERROR`
* Simulate config validation error → Sentry logs `CONFIG_ERROR`

### E2E tests

* Kill Supabase → safe-mode → Sentry logs `config_failed`
* Trigger navigation to missing screen → Sentry logs `navigation_error`

---

# 12. 📝 Developer Guidelines

* NEVER swallow errors silently.
* ALWAYS wrap async logic in try/catch OR rely on React Query.
* ALWAYS attach metadata in Sentry tags.

### Minimum for any new feature:

```ts
Sentry.setContext("feature", { featureId: "study.resource" });
```

* Use `trackEvent` for all major actions — breadcrumbs help.

---

# 13. 🏁 Summary

This crash reporting system ensures:

* Zero silent failures
* All runtime problems visible
* Complete tenant-level visibility
* Perfect integration with dynamic UI + configs
* Debuggability for complex multi-tenant issues
* Safety for future large features

```
End of CRASH_REPORTING_SENTRY_SPEC.md
```
