# 🧱 WIDGET_FAILSAFE_SPEC.md
### Universal Widget Safety, Fallback & Stability Rules

This document defines how the app ensures **stable widget rendering** across **any screen, any tab, any position**.

**Key Principle:** Widgets are universal. One broken widget must NEVER break the screen or app. Every widget is isolated.

---

# 1. 🎯 Objectives

1. **Any screen must always render**, even with broken widget config
2. **Each widget is isolated** — if one fails, others continue
3. **Widget errors are logged** with full context for debugging
4. **Graceful fallbacks** for every failure scenario
5. **Permission/feature gating** handled safely
6. **Offline behavior** is predictable per widget
7. **Performance budgets** enforced per widget

---

# 2. 🧱 Widget Rendering Pipeline

```
screen_layouts (from DB)
       ↓
validateScreenLayout (Zod)
       ↓
widget array: [{ widgetId, position, size, config }]
       ↓
For each widget:
  ├── Check widgetRegistry → exists?
  ├── Check role → allowed?
  ├── Check permissions → granted?
  ├── Check feature → enabled?
  ├── Check online → required?
       ↓
WidgetErrorBoundary
       ↓
WidgetContainer
       ↓
ActualWidget
```

**At each step, failures are handled gracefully.**

---

# 3. 📚 Widget Registry

Location: `src/config/widgetRegistry.ts`

```ts
export const widgetRegistry: Record<WidgetId, WidgetRegistryEntry> = {
  "schedule.today": {
    component: TodayScheduleWidget,
    metadata: { /* ... */ },
  },
  "doubts.inbox": {
    component: DoubtsInboxWidget,
    metadata: { /* ... */ },
  },
  // ... 60+ widgets
};
```

**Rules:**
- Widget IDs must be stable (no casual renaming)
- All widgets imported through registry
- Registry is the **single source of truth**
- Never import widget components directly in screens

---

# 4. ⚠️ Widget Validation

Before rendering each widget:

### 4.1 Schema Validation (Zod)

```ts
const WidgetConfigSchema = z.object({
  widgetId: z.string().min(1),
  position: z.number().int().min(1),
  size: z.enum(["compact", "standard", "expanded"]),
  enabled: z.boolean(),
  customProps: z.record(z.unknown()).optional(),
});
```

**If validation fails:**
- Log config error
- Skip widget
- Continue with next widget
- Analytics: `widget_config_invalid`

### 4.2 Registry Check

```ts
const entry = widgetRegistry[widgetId];
if (!entry) {
  logError('widget_missing_in_registry', { widgetId });
  return null; // Skip, don't crash
}
```

### 4.3 Role Check

```ts
if (!entry.metadata.allowedRoles.includes(userRole)) {
  return null; // Silently skip
}
```

### 4.4 Permission Check

```ts
if (entry.metadata.requiredPermissions) {
  const hasAll = entry.metadata.requiredPermissions.every(p => userPermissions.includes(p));
  if (!hasAll) {
    logAnalytics('widget_permission_hidden', { widgetId });
    return null; // Silently skip
  }
}
```

### 4.5 Feature Check

```ts
if (entry.metadata.requiredFeatureId) {
  if (!isFeatureEnabled(entry.metadata.requiredFeatureId)) {
    return null; // Silently skip
  }
}
```

### 4.6 Online Check

```ts
if (entry.metadata.requiresOnline && !isOnline) {
  return <WidgetOfflinePlaceholder widgetId={widgetId} />;
}
```


---

# 5. 🛡 WidgetErrorBoundary

Every widget is wrapped in an error boundary:

```tsx
<WidgetErrorBoundary 
  widgetId={widgetId}
  screenId={screenId}
  onError={handleWidgetError}
>
  <ActualWidget {...props} />
</WidgetErrorBoundary>
```

### Behavior on Error

1. **Catch the error** (React error boundary)
2. **Log to Sentry:**
   - `widget_error`
   - widgetId, screenId, customerId, role
   - Error stack trace
3. **Log to Analytics:**
   - `widget_render_error`
4. **Show fallback card:**
   ```
   ┌─────────────────────────────┐
   │  ⚠️ Couldn't load this      │
   │     section                  │
   │                              │
   │     [Retry]                  │
   └─────────────────────────────┘
   ```
5. **Other widgets continue rendering**

### Retry Behavior

- "Retry" button triggers widget re-mount
- Max 3 retries per session
- After 3 failures: show permanent fallback

---

# 6. 🧩 Fallback Types

## 6.1 Missing Widget in Registry

**Scenario:** widgetId in config doesn't exist in registry

**Behavior:**
- Log `widget_missing_in_registry`
- Skip widget (don't render anything)
- Continue with other widgets
- **Never crash**

## 6.2 Widget Component Throws

**Scenario:** Widget code throws during render

**Behavior:**
- Error boundary catches
- Show fallback card
- Log to Sentry + Analytics
- Other widgets unaffected

## 6.3 Widget Data Fetch Fails

**Scenario:** Widget's useQuery fails

**Behavior (based on cache):**
- **Has cached data:** Show cached + "Offline" badge
- **No cached data:** Show inline error:
  ```
  "Couldn't load this section"
  [Retry]
  ```

## 6.4 Permission Denied

**Scenario:** User lacks required permission

**Behavior:**
- Widget silently hidden
- No error shown to user
- Log `widget_permission_hidden` for analytics

## 6.5 Feature Disabled

**Scenario:** Required feature is disabled for customer

**Behavior:**
- Widget silently hidden
- No error shown
- Log `widget_feature_disabled`

## 6.6 Offline + Online-Required

**Scenario:** Widget requires online but device is offline

**Behavior (based on metadata.offlineBehavior):**
- `show-cached`: Show cached data + offline badge
- `show-placeholder`: Show "Available when online"
- `hide`: Remove widget entirely

---

# 7. 🧱 Screen-Level Stability

### 7.1 Never Break Layout

Even if widgets fail:
- Screen container always renders
- Spacing/padding maintained
- No layout jumps

### 7.2 Minimum Widgets

If ALL widgets fail on a screen:
- Show screen-level fallback:
  ```
  "This screen is having trouble loading"
  [Refresh] [Go Home]
  ```
- Log `screen_all_widgets_failed`

### 7.3 Widget Order Stability

- Widgets render in `position` order
- Failed widgets don't shift others
- Placeholder maintains space

---

# 8. 📏 Widget Requirements

Every widget MUST:

1. **Handle loading state** — Show skeleton
2. **Handle error state** — Show inline error
3. **Handle empty state** — Show "No data" message
4. **Be self-contained** — Own data fetching
5. **Respect size prop** — Render correctly in compact/standard/expanded
6. **Support refresh** — If `refreshable: true`

Every widget must NOT:

1. Throw errors in render
2. Assume data is always present
3. Assume network is available
4. Import other widgets directly
5. Have side effects in render

---

# 9. 🧪 Testing Widget Stability

### 9.1 Unit Tests

- Widget renders with mock data
- Widget handles loading state
- Widget handles error state
- Widget handles empty state
- Widget respects size variants

### 9.2 Integration Tests

- Missing widgetId → skipped
- Invalid config → skipped
- RequiresOnline + offline → placeholder
- Permission denied → hidden
- Feature disabled → hidden

### 9.3 E2E Tests

- Corrupt screen_layouts → screen renders remaining widgets
- Widget throws → other widgets unaffected
- Offline mode → offline placeholders appear
- All widgets fail → screen fallback shown

---

# 10. 📊 Error Monitoring

### Key Metrics to Track

| Metric | Alert Threshold |
|--------|-----------------|
| `widget_render_error` rate | >1% |
| `widget_missing_in_registry` | Any occurrence |
| `widget_config_invalid` | >0.5% |
| `screen_all_widgets_failed` | Any occurrence |

### Sentry Tags

Every widget error includes:
- `widgetId`
- `screenId`
- `tabId`
- `customerId`
- `role`
- `size`
- `isOffline`

---

# 11. ⚡ Performance Budgets

| Metric | Budget |
|--------|--------|
| Widget render time | <100ms |
| Widget data fetch | <500ms |
| Skeleton display | <200ms |
| Error boundary catch | <50ms |

### Slow Widget Handling

If widget exceeds budget:
- Log `widget_slow_render`
- Consider lazy loading
- Consider data prefetching

---

# 12. 🏁 Summary

The Universal Widget Failsafe System ensures:

✅ **Isolated failures** — One widget crash never affects others  
✅ **Graceful fallbacks** — Every failure has a user-friendly fallback  
✅ **Silent permission handling** — Hidden, not errored  
✅ **Offline-aware** — Per-widget offline behavior  
✅ **Full observability** — All errors logged with context  
✅ **Performance enforced** — Budgets per widget  
✅ **Screen stability** — Screen always renders something  

**Key Principle:** The app must always be usable. Widget failures are contained and logged, never propagated.

```
End of WIDGET_FAILSAFE_SPEC.md
```
