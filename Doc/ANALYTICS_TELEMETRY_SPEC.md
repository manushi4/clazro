 Here is the next **full, production-grade brick document**:

---

# 📄 `docs/ANALYTICS_TELEMETRY_SPEC.md`

### Complete Analytics & Telemetry Strategy for Mansuhi

```md
# 📊 ANALYTICS_TELEMETRY_SPEC.md
### Unified Analytics, Telemetry, and Usage Instrumentation for Mansuhi

This document defines how analytics events, usage telemetry, performance metrics, and diagnostic signals are collected across the multi-tenant Mansuhi platform.

It ensures:
- Every feature, widget, screen, tab, and config behaves predictably  
- Errors and misconfigurations are detectable  
- Product decisions can be made from real usage  
- Cross-tenant comparisons are possible without storing sensitive data  

This spec is a **required foundation** before large-scale feature development.

---

# 1. 🎯 Objectives

1. **Understand user behaviour**  
   Which widgets/screens/features are used the most?

2. **Detect misconfigurations**  
   Dynamic UI may break; analytics helps identify issues quickly.

3. **Monitor performance**  
   Track slow screens, slow queries, time to first interaction.

4. **Enable product insights**  
   Which features drive engagement? Which need removal or redesign?

5. **Support multi-tenant reporting**  
   Usage per school/customer.

6. **Support debugging**  
   Combine analytics with error/crash logs for full visibility.

---

# 2. 📦 Where Analytics Data Goes

### Primary (recommended)
- **Sentry** for:
  - Errors
  - Breadcrumbs
  - Performance metrics
  - User actions
  - Crashes

### Secondary (optional)
- **Supabase `telemetry_events` table** for:
  - Usage aggregation
  - Admin dashboards
  - Customer-level analytics

### Optional future
- Mixpanel / Amplitude for product analytics
- PostHog self-hosted for privacy-focused deployments

The architecture supports **multiple sinks**, with a simple interface.

---

# 3. 📡 Event Capture Architecture

```

App UI (screens, widgets, buttons)
↓
Analytics Hook (useAnalytics)
↓
AnalyticsService.trackEvent()
↓
Sinks:

* Sentry
* Supabase table
* Console (dev only)

````

This ensures:
- Decoupling between app logic and analytics provider
- Ability to add/remove providers without rewriting UI
- Zero app-side crash risk

---

# 4. 🔧 Analytics Service API

A single entry point:

```ts
AnalyticsService.trackEvent(event: AnalyticsEvent)
AnalyticsService.screenView(screenId: string, params?)
AnalyticsService.widgetEvent(widgetId, action, params?)
AnalyticsService.configEvent(type, details?)
AnalyticsService.errorEvent(error, context?)
````

Each provider (Sentry/Supabase) receives the same normalized event.

---

# 5. 🧱 Event Structure (Canonical)

All events MUST follow:

```ts
type AnalyticsEvent = {
  name: string;
  ts: number;            // epoch timestamp
  userId?: string;
  customerId?: string;
  role?: string;
  screenId?: string;
  widgetId?: string;
  featureId?: string;
  properties?: Record<string, any>;
};
```

Required automatically:

* `userId`
* `customerId`
* `role`
* `screenId` (if applicable)

---

# 6. 🗂 Event Categories & Exact Events

Below is the **full required event taxonomy** for Mansuhi.

---

## 6.1 Screen Events (must log on every screen mount)

| Event               | When                        |
| ------------------- | --------------------------- |
| `screen_view`       | screen becomes active       |
| `screen_load_start` | before data fetching begins |
| `screen_load_end`   | after data load succeeds    |
| `screen_load_error` | screen load fails           |

Properties:

* `screenId`
* `loadTime`
* `params`

---

## 6.2 Navigation Events

| Event                | When                     |
| -------------------- | ------------------------ |
| `tab_changed`        | user switches bottom tab |
| `navigate_to_screen` | any navigation action    |
| `navigation_error`   | route missing / invalid  |

Properties:

* `fromTab`, `toTab`
* `fromScreen`, `toScreen`
* `errorDetails`

---

## 6.3 Widget Events

| Event                | When                      |
| -------------------- | ------------------------- |
| `widget_render`      | widget is rendered        |
| `widget_visible`     | widget scrolled into view |
| `widget_click`       | CTA or internal action    |
| `widget_error`       | widget-level failure      |
| `widget_data_loaded` | data hook resolves        |

Properties:

* `widgetId`
* `loadTime`
* `dataSize`
* `errorDetails`

---

## 6.4 Feature Usage Events

Examples:

| Event                     | Trigger                    |
| ------------------------- | -------------------------- |
| `doubt_create_started`    | student opens new doubt    |
| `doubt_create_success`    | doubt inserted             |
| `doubt_create_failed`     | mutation fails             |
| `test_attempt_started`    | student enters test        |
| `test_attempt_submitted`  | test submitted             |
| `ai_session_started`      | AI tutor session initiated |
| `ai_session_message_sent` | user sends message         |

Every feature should have at least:

* `*_started`
* `*_success`
* `*_failed`

---

## 6.5 Config Events

| Event                    | Meaning                            |
| ------------------------ | ---------------------------------- |
| `config_loaded`          | CustomerConfig successfully loaded |
| `config_failed`          | DB or network error                |
| `config_safe_mode`       | fallback config applied            |
| `config_section_invalid` | invalid nav/widget/feature         |

Properties:

* reason
* errorMessage
* validationDetails

---

## 6.6 Permission Events

| Event                     | When                        |
| ------------------------- | --------------------------- |
| `permission_denied`       | backend rejects user action |
| `permission_gate_blocked` | UI hides feature            |

Properties:

* permissionCode
* featureId (optional)

---

## 6.7 Offline/Network Events

| Event                    | When                              |
| ------------------------ | --------------------------------- |
| `network_offline`        | device goes offline               |
| `network_online`         | connection restored               |
| `offline_action_blocked` | user attempted online-only action |

Properties:

* actionName
* screenId

---

## 6.8 Error/Crash Telemetry

All errors should have:

| Field     | Purpose                                     |
| --------- | ------------------------------------------- |
| `type`    | CONFIG, NETWORK, WIDGET, SCREEN, PERMISSION |
| `context` | user/customer/screen/widget                 |
| `stack`   | stack trace for devs                        |

Sent to:

* Sentry
* Optional Supabase `error_logs` table

---

# 7. 🧠 Sensitive Data Policy

Never log:

* Student names
* Student personal data
* Actual doubt text
* Assignment answers
* Chat messages
* Test answers

Always log:

* IDs (userId, classId, doubtId)
* Screen/widget names
* FeatureIds
* Device type

---

# 8. 🧩 Analytics Integration in UI

### 8.1 Screens

Use:

```ts
const { trackScreenView } = useAnalytics();
useEffect(() => trackScreenView('DoubtDetailScreen'), []);
```

### 8.2 Widgets

Render event:

```ts
trackWidgetEvent(widgetId, 'render');
```

Click event:

```ts
trackWidgetEvent(widgetId, 'click', { action: 'open_doubt' });
```

---

# 9. 🧪 Testing Analytics

## 9.1 Unit Tests

* AnalyticsService sends correct event shape
* useAnalytics hooks return stable functions
* Fallback provider does not crash without network

## 9.2 Integration Tests

* Screen view events fire on navigation
* Widget render events fire on scroll
* Navigation errors logged

## 9.3 E2E Tests

* Simulate user sessions → confirm events in Sentry or Supabase logs
* Offline transitions → verify `network_offline` fired

---

# 10. 🚀 Event Volume Strategy

* High-volume events (scroll, widget_visible) should be **throttled**.
* Critical events (config_safe_mode, widget_error, navigation_error) → always send.
* Consider sampling rate for `screen_view` in massive schools.

---

# 11. 🔚 Summary

This analytics system gives:

* Complete visibility into:

  * screen usage
  * widget performance
  * navigation flows
  * feature engagement
  * config failures
  * permissions issues

* Safety through:

  * error/crash logs
  * safe-mode detection
  * misconfiguration alerts

This creates a foundation for:

* Admin dashboards
* Product decisions
* Automation (e.g., auto-disable broken widgets)

```
End of ANALYTICS_TELEMETRY_SPEC.md
```


