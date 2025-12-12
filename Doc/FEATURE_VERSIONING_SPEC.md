 Here is the **next core brick**, written in full production depth and ready to place into your `docs/` folder.

---

# 📄 `docs/FEATURE_VERSIONING_SPEC.md`

### Feature, Widget & Config Versioning Strategy for Mansuhi

````md
# 🧬 FEATURE_VERSIONING_SPEC.md
### Feature, Widget & Config Versioning Strategy for Mansuhi

This document establishes the **versioning model** for all dynamic elements of the Mansuhi platform:

- Features  
- Widgets  
- Navigation config  
- Dashboard layout  
- Customer config  
- Screen definitions  

Versioning prevents breaking tenants when features evolve over time.

It allows us to:

- Deploy breaking changes safely  
- Migrate customers gradually  
- Keep backward compatibility  
- Detect incompatible configs early  
- Roll out features progressively  

This is essential for a **multi-tenant**, **config-driven**, **dynamic UI platform**.

---

# 1. 🎯 Why Versioning Is Critical

Because your UI is **not hardcoded**, and comes from:

- Supabase config  
- Feature flags  
- Widget layouts  
- Navigation mappings  
- Role-based permissions  

Every update to:

- A widget component  
- A screen layout  
- A feature’s behavior  
- Allowed props  
- Data shape  
- Theme structure  

…can break customers using older configurations.

Versioning ensures:

1. **Backward compatibility**  
2. **Controlled migrations**  
3. **Feature rollout safety**  
4. **Config safety & warnings**  
5. **Stable UI for all tenants**

---

# 2. 🧱 What Needs Versioning

### 2.1 Features  
Defined in:
- `featureRegistry`
- `customer_features` table

Each feature should have:

```ts
{
  featureId: "study.library",
  version: "1.0.0",
  minAppVersion: "1.0.0",
  deprecated: false,
  ...
}
````

---

### 2.2 Widgets

Defined in:

* `widgetRegistry`
* `dashboard_widgets` table

Each widget has:

```ts
{
  widgetId: "home.recommendations",
  version: "2.1.0",
  minConfigVersion: 3,
  deprecated: false,
}
```

Widgets often change faster than screens.

---

### 2.3 Dashboard Layout

Layout stored per customer + role:

```ts
dashboard_layouts.configVersion
```

This ensures:

* When widget definitions change → layout can be migrated.

---

### 2.4 Navigation Config

Fields in navigation need versioning too:

```ts
navigation_tabs.version
navigation_screens.version
```

Reason:

* If a screen becomes incompatible or renamed → version mismatch.

---

### 2.5 CustomerConfig (Top-Level)

Customer config structure itself should have:

```ts
CustomerConfig.configVersion: number
```

Increment this when:

* Structure changes
* Required fields added
* New top-level sections added

---

# 3. 📦 Versioning Model

We follow **Semantic Versioning** at the widget/feature/screen level:

```
MAJOR.MINOR.PATCH
```

### MAJOR

Breaking changes:

* Removing existing props
* Changing widget behavior fundamentally
* Removing/renaming featureId
* Screen renames
* Data shape changes

### MINOR

Backwards-compatible enhancements:

* New props
* Additional UI capability
* Optional metadata fields

### PATCH

Small fixes:

* Bug fixes
* Styling fixes
* Non-breaking improvements

---

# 4. 🔁 Config Compatibility Checking

When loading CustomerConfig:

Engine performs:

```ts
checkFeatureCompatibility(featureId, featureVersion)
checkWidgetCompatibility(widgetId, widgetVersion)
checkCustomerConfigVersion(customerConfig.configVersion)
```

### Incompatible?

→ Attempt a **migration**
→ Or fallback to:

* older widget behavior
* default widget
* skip widget
* safe-mode

Analytics + Sentry event:
`version_incompatible`

---

# 5. 🔧 Migration Functions

Migration lives in:

```
src/config/migrations/
```

Examples:

### 5.1 Dashboard Layout Migration

```ts
export function migrateDashboardLayoutV1toV2(layoutV1): LayoutV2 {
  return {
    ...layoutV1,
    widgets: layoutV1.widgets.map(w => ({
      widgetId: w.widgetId,
      orderIndex: w.orderIndex,
      config: { ...w.config, newFlag: true },
    }))
  };
}
```

### 5.2 Feature Migration

If a feature’s allowed actions change:

```ts
migrateFeatureV2toV3(customerFeatures);
```

### 5.3 Navigation Migration

If screen is renamed:

```ts
oldRoute → newRoute
```

Customer configs can be migrated automatically on load.

---

# 6. 🛡 Safety Rules for Versioning

### Rule 1 — Never delete widgets without migration

If a widget is removed:

* Mark `deprecated: true`
* Provide fallback widget ID
* Auto-migrate layouts

### Rule 2 — Never change widget input types without bumping MAJOR version

This avoids runtime errors.

### Rule 3 — Always include `minAppVersion`

Helps enforce app updates.

### Rule 4 — Add contract checks

With:

```
npm run check:features
npm run check:widgets
npm run check:navigation
```

These scripts validate:

* registry definitions
* feature tables
* config versions
* migration functions

### Rule 5 — Always log all version errors

Using analytics event:
`version_error`

---

# 7. 🤖 Version-Aware Widget Rendering

WidgetProps include:

```ts
{
  widgetVersion: "1.2.0",
  configVersion: number;
}
```

Rendering pipeline checks:

```ts
if (widget.version < requiredVersion) {
  return <WidgetDeprecatedFallback />;
}
```

---

# 8. 🧪 Testing Version Safety

### Unit tests:

* Incompatibility detection
* Migration functions
* Minor/patch version behavior

### Integration tests:

* Loading old customer config → migrated
* Display fallback widgets if widget version too old

### E2E tests:

* Pin customer config to old version → app still bootstraps
* Deploy breaking changes → app migrates config

---

# 9. 🧩 Deprecation Strategy

When deprecating widget/feature:

1. Add:

   ```ts
   deprecated: true
   ```
2. Provide:

   * fallback widget ID
   * migration function
3. Log use of deprecated widgets
4. Remove in future major version

---

# 10. 🏁 Summary

Versioning ensures:

* Backwards compatibility
* Controlled rollout of new widgets/features
* No breaking changes for existing customers
* Automatic config migrations
* Predictable fallback behavior
* Stable multi-tenant scaling

Combined with:

* Widget failsafes
* Navigation failsafes
* Config validation

…it creates a **bulletproof dynamic platform**.

```
End of FEATURE_VERSIONING_SPEC.md
```
