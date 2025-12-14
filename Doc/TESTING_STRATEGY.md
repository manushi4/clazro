# 🧪 TESTING_STRATEGY.md  
### Comprehensive Testing Plan for Multi-Tenant, Config-Driven Architecture  
### (Unit • Integration • Contract • E2E • Load • Chaos • Regression)

This document defines the **complete testing approach** for the project from development → production.  
It follows the safe-mode, widget system, navigation system, permissions, and config-driven design described in:  
- Config-Driven Architecture Plan  
- Implementation Master Guide  
- Permissions RBAC Spec  
- Widget System Spec  
  

This is the **single source of truth** for testing strategy.

---

# 1. 🎯 Testing Goals

1. Ensure the core app works **even if config fails** → “safe mode”.  
2. Ensure each tenant/customer gets their own correct experience.  
3. Validate that:
   - widgets render safely  
   - navigation builds safely  
   - permissions are enforced correctly  
4. Ensure dynamic UI (tabs, dashboards, themes) does not break.  
5. Guarantee system-wide correctness across:
   - Student App  
   - Teacher Experience  
   - Parent Experience  
   - Admin Console  
6. Catch dangerous misconfigurations **before** they hit production.  

---

# 2. 🧱 Testing Pyramid (Final Version)

      ┌──────────────────────────────┐
      │      End-to-End (Detox)      │
      ├──────────────────────────────┤
      │   Integration (React Query)  │
      │   + Navigation + Dashboard   │
      ├──────────────────────────────┤
      │      Unit Tests (Jest)       │
      ├──────────────────────────────┤
      │ Contract / Schema Validators │
      ├──────────────────────────────┤
      │  DB-level Constraints + RLS  │
      └──────────────────────────────┘


      
Each layer is mandatory.

---

# 3. 🧪 Unit Tests

**Location:**  
`src/**/__tests__/unit/`

### 3.1 TypeScript Types & Utility Functions  
✔ Validate interfaces & required fields for:  
- CustomerConfig  
- FeatureConfig  
- NavigationConfig  
- DashboardConfig  
- ThemeConfig  
- WidgetMetadata  
- Permission resolution logic  
  

### 3.2 Services  
Test:  
- FeatureService  
- NavigationService  
- DashboardService  
- PermissionService  
- ThemeService  
- CustomerConfigService  
  

**Test Conditions:**

| Scenario | Expected |
|---------|----------|
| DB returns valid data | service returns usable config |
| DB returns invalid data | fallback to DEFAULT_* |
| DB returns nothing | fallback to DEFAULT_* |
| DB throws error | SAFE_MODE if needed |

### 3.3 Hooks  
Test pure versions of:  
- `resolveFeatures`  
- `resolveNavigation`  
- `resolveDashboardLayout`  
- `checkPermissions`  

### 3.4 Permissions Logic  
Test override precedence:  
✔ Granted override → allow  
✔ Revoked override → deny  
✔ No override → use role default  
✔ On failure → fail closed  
  

---

# 4. 🔗 Integration Tests

**Location:**  
`src/**/__tests__/integration/`

Focus on combining modules.

---

## 4.1 Dynamic Dashboard (Major Area)

Test scenarios:  
1. Valid layout → renders correct widgets  
2. Missing widget in registry → skip + log  
3. DB failure → DEFAULT layout  
4. Widget error → fallback with `WidgetErrorBoundary`  
5. Widgets respect permissions (hidden)  

From Widget System Spec:  
  

---

## 4.2 Dynamic Navigation

Test:  
- Tab building from database  
- Only enabled tabs appear  
- Tab order matches `order_index`  
- Screens inside tab obey permissions  
  

---

## 4.3 Feature Gating

Test feature flags:  
- Disabled feature hides whole section  
- Enabled feature works normally  
- Feature disabled → widget disappears  

---

## 4.4 Theming

Test:  
- Customer theme overrides  
- Missing theme → default theme  
- Invalid theme → fallback + error logged  
  

---

## 4.5 Teacher / Parent / Admin Flows
Smoke tests for:  
- Teacher assignments  
- Teacher live class  
- Parent progress view  
- Admin feature toggles  
- Admin dashboard reordering  

---

# 5. 🧾 Contract Tests (Critical)

These tests ensure **schema correctness and cross-layer consistency**.

**Location:**  
`contract-tests/` or `__tests__/contract/`

### 5.1 Widget Registry Contract  
- Every `widget_id` in DB exists in `widgetRegistry`  
- Every widget in registry has:
  - component
  - metadata
  - valid data policy  
  

### 5.2 Feature Registry Contract  
- Every DB feature ID exists in `featureRegistry.ts`  
- Feature metadata matches required fields  

### 5.3 Navigation Contract  
- Every screen referenced in navigation exists in SCREEN_INVENTORY.md  
- No unknown route names  
- All tab_ids match TabConfig format  
  

### 5.4 Permissions Contract  
- All DB permissions exist in TypeScript enum  
- All feature-required permissions exist in DB  
- No dangling permission references  
  

---

# 6. 🚦 E2E Testing (Detox)

**Location:**  
`e2e/`

E2E tests validate user experience across screens, roles, and dynamic configs.

### Must-cover flows:

#### Student
- Login → Dashboard  
- Quick actions (Ask a doubt, AI tutor)  
- Study Library basic flows  
- Test attempt + review  
- Widget behavior (schedule, assignments, progress)  

#### Teacher
- Create assignment  
- Answer doubt  
- Start live class  

#### Parent
- View child progress  
- View child schedule  

#### Admin
- Toggle feature → app updates  
- Change dashboard layout → app updates  
- Change theme → app changes live  
  

### E2E Special Cases:

1. Config fails → safe mode pages load  
2. Feature disabled:
   - Tab disappears  
   - Widget removed  
   - Feature button hidden  
3. Permission removed:
   - Button disappears  
   - Attempting restricted action redirects  
4. Wrong customer slug → error page  

---

# 7. 📈 Load / Stress Testing (k6)

These tests check backend scalability & correctness.

### Endpoints to test heavily:
- get_customer_config  
- get_navigation_config  
- get_dashboard_layout  
- get_user_permissions  
- student dashboard data (today classes, assignments, tests)  

### Goals:
- 500 concurrent users → stable  
- No RLS failures  
- p95 < 250ms for main config endpoints  
  

---

# 8. 🔥 Chaos Testing (Optional but Recommended)

Simulate failures:

- Supabase down  
- Network timeout  
- Permissions table missing rows  
- customer_features corrupted  
- dashboard_layouts malformed  

Expected behavior:
- App falls back to **SAFE_MODE_CONFIG**  
- Minimal tabs (Home, Profile)  
- Minimal widgets (HeroCard, TodaySchedule)  
- No sensitive actions  
  

---

# 9. 📋 Regression Testing

Performed before each release.

Checklist:
- All tabs load  
- Dashboard renders  
- All feature UIs open  
- Navigation works  
- Theme applied correctly  
- Permissions respected  
- No console errors  
- Widget skeletons → final UI properly  

---

# 🔚 Final Summary

This testing strategy ensures:

### ✔ The app NEVER crashes  
(because every component has fallbacks  
and config has safe-mode defaults)

### ✔ The UI is always correct for each customer  
(navigation, widgets, theme, features are validated)

### ✔ The system is secure  
(permissions enforced at every level)

### ✔ Bugs are caught early  
(unit + integration + contract)

### ✔ End-to-end experience remains reliable  
(E2E + Load + Chaos testing)

This is the **complete, final testing plan** for the entire project lifecycle.

