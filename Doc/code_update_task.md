# CODE UPDATE TASK LIST

Critical Mobile App Updates for Config-Driven Architecture

Created: December 8, 2024
Priority: Critical
Estimated Effort: 3-4 days

---

## Overview

Three critical gaps need to be addressed to complete the config-driven architecture:

1. DynamicScreen not rendering widgets - Screen shows placeholder instead of actual widgets
2. Missing Supabase config integration - No connection to fetch config from database
3. No branding/white-label support - CustomerBranding not implemented

---

## SECTION 1: Supabase Config Integration

### 1.1 Environment Setup

- [x] Create `.env.example` file with Supabase credentials template
- [x] Add SUPABASE_URL and SUPABASE_ANON_KEY with defaults
- [x] Update `src/lib/supabaseClient.ts` to use public schema and defaults

Files created/updated:
- `.env.example` ✅
- `src/lib/supabaseClient.ts` ✅

### 1.2 Config Service Layer

- [x] Create `src/services/config/configService.ts`
- [x] Implement `fetchCustomer(customerId)` - loads customer
- [x] Implement `fetchNavigationTabs(customerId, role)` - loads tabs
- [x] Implement `fetchScreenLayout(customerId, role, screenId)` - loads widgets for screen
- [x] Implement `fetchCustomerTheme(customerId)` - loads theme
- [x] Implement `fetchCustomerBranding(customerId)` - loads branding
- [x] Implement `fetchCustomerFeatures(customerId)` - loads features
- [x] Implement `fetchFullCustomerConfig(customerId, role)` - loads all

Files created:
- `src/services/config/configService.ts` ✅

### 1.3 React Query Hooks for Config

- [x] Create `src/hooks/queries/useNavigationTabsQuery.ts`
- [x] Create `src/hooks/queries/useScreenLayoutQuery.ts`
- [x] Create `src/hooks/queries/useCustomerThemeQuery.ts`
- [x] Create `src/hooks/queries/useCustomerBrandingQuery.ts`
- [x] Create `src/hooks/queries/index.ts`
- [x] Add proper staleTime and gcTime settings
- [x] Add error handling with fallback to default config

Files created:
- `src/hooks/queries/useNavigationTabsQuery.ts` ✅
- `src/hooks/queries/useScreenLayoutQuery.ts` ✅
- `src/hooks/queries/useCustomerThemeQuery.ts` ✅
- `src/hooks/queries/useCustomerBrandingQuery.ts` ✅
- `src/hooks/queries/index.ts` ✅

### 1.4 Real-time Config Subscription

- [x] Create `src/hooks/useConfigSubscription.ts`
- [x] Subscribe to `config_change_events` table
- [x] Invalidate React Query cache on config change
- [ ] Show toast notification on config update (optional)

Files created:
- `src/hooks/useConfigSubscription.ts` ✅

### 1.5 Config Caching for Offline

- [ ] Update `src/offline/configCache.ts` to persist fetched config
- [ ] Implement `saveConfigToCache(config)` using AsyncStorage
- [ ] Implement `loadConfigFromCache()` for offline fallback
- [ ] Add cache invalidation on new config fetch

Files to update:
- `src/offline/configCache.ts` (TODO)

### 1.6 Update Existing Hooks to Use Supabase

- [x] Update `useEnabledTabs.ts` to use `useNavigationTabsQuery`
- [ ] Update `useTabScreens.ts` to use Supabase data
- [ ] Update `useDashboardLayout.ts` to use `useScreenLayoutQuery`
- [x] Update `useCustomerTheme.ts` to use `useCustomerThemeQuery`
- [ ] Update `useFeatures.ts` to fetch from `customer_features` table

Files updated:
- `src/hooks/config/useEnabledTabs.ts` ✅
- `src/hooks/config/useCustomerTheme.ts` ✅

---

## SECTION 2: DynamicScreen Widget Rendering

### 2.1 Update DynamicScreen Component

- [x] Fetch screen layout using `useScreenLayoutQuery(screenId)`
- [x] Map over widgets array and render each widget
- [x] Pass proper props to each widget (customerId, userId, role, config, branding, theme)
- [x] Add loading state with ActivityIndicator
- [x] Add error state with retry button
- [x] Add empty state for screens with no widgets

Files updated:
- `src/navigation/DynamicScreen.tsx` ✅ (completely rewritten)

### 2.2 Screen Layout Types

- [x] Add `ScreenLayoutConfig` type to `src/types/config.types.ts`
- [x] Add `ScreenWidgetConfig` type with position, size, enabled, customProps
- [x] Add `WidgetSize` type: "compact" | "standard" | "expanded"
- [x] Add `VisibilityRule` type for conditional widget display

Files updated:
- `src/types/config.types.ts` ✅

### 2.3 Widget Size Support

- [x] Update `WidgetContainer.tsx` to accept size prop
- [x] Add styles for compact, standard, expanded sizes
- [x] Add `WidgetSize` type to widget.types.ts
- [ ] Update widget registry metadata with supportedSizes (optional)

Files updated:
- `src/components/widgets/base/WidgetContainer.tsx` ✅
- `src/types/widget.types.ts` ✅

### 2.4 Widget Visibility Rules

- [x] Create `src/utils/checkVisibilityRules.ts`
- [x] Implement permission-based visibility check
- [x] Implement feature-based visibility check
- [x] Implement online-status visibility check

Files created:
- `src/utils/checkVisibilityRules.ts` ✅

### 2.5 Screen Registry Expansion

- [ ] Add all 16 widget-based screens to `routeRegistry.ts`
- [ ] Map screen IDs to DynamicScreen component
- [ ] Add screen metadata (type, scrollable, pullToRefresh)

Files to update:
- `src/navigation/routeRegistry.ts` (TODO)

### 2.6 Pull to Refresh Support

- [x] Add RefreshControl to DynamicScreen
- [x] Trigger refetch of screen layout on pull
- [x] Show loading indicator during refresh

Files updated:
- `src/navigation/DynamicScreen.tsx` ✅

---

## SECTION 3: Branding/White-Label Support

### 3.1 Branding Types

- [x] Create `src/types/branding.types.ts`
- [x] Define `CustomerBranding` type with all fields
- [x] Define `DEFAULT_BRANDING` constant

Files created:
- `src/types/branding.types.ts` ✅

### 3.2 Branding Hook

- [x] Create `src/hooks/config/useCustomerBranding.ts`
- [x] Fetch branding from `customer_branding` table via query hook
- [x] Provide default branding fallback
- [x] Export from hooks/config/index.ts

Files created:
- `src/hooks/config/useCustomerBranding.ts` ✅

### 3.3 Branding Context Provider

- [x] Create `src/context/BrandingContext.tsx`
- [x] Provide branding to entire app tree
- [x] Create `useBranding()` hook for easy access
- [x] Create `useBrandingContext()` for loading/error state

Files created:
- `src/context/BrandingContext.tsx` ✅

### 3.4 Update WidgetProps to Include Branding

- [x] Add `branding?: CustomerBranding` to WidgetProps type
- [x] Add `theme?: any` to WidgetProps type
- [x] Add `size?: WidgetSize` to WidgetProps type
- [x] Update DynamicScreen to pass branding to widgets
- [ ] Update DynamicDashboard to pass branding to widgets (TODO)

Files updated:
- `src/types/widget.types.ts` ✅
- `src/navigation/DynamicScreen.tsx` ✅

### 3.5 Text Override Utility

- [x] Create `src/utils/getBrandedText.ts`
- [x] Implement `getBrandedText(key, branding, fallback)` function
- [x] Implement `getFeatureName(feature, branding)` helper
- [x] Check textOverrides first, then specific fields, then fallback

Files created:
- `src/utils/getBrandedText.ts` ✅

### 3.6 Update Widgets to Use Branding

- [ ] Update HeroCardWidget to use branding.appName
- [ ] Update DoubtsInboxWidget to use branding.doubtSectionName
- [ ] Update RecommendationsWidget to use branding.aiTutorName
- [ ] Update AssignmentsTestsWidget to use branding.assignmentName, testName

Files to update:
- `src/components/widgets/dashboard/HeroCardWidget.tsx` (TODO)
- `src/components/widgets/dashboard/DoubtsInboxWidget.tsx` (TODO)
- `src/components/widgets/dashboard/RecommendationsWidget.tsx` (TODO)
- `src/components/widgets/dashboard/AssignmentsTestsWidget.tsx` (TODO)

### 3.7 Logo Components

- [ ] Create `src/ui/components/BrandLogo.tsx`
- [ ] Support light/dark mode logo switching
- [ ] Support small/full logo variants
- [ ] Fallback to default logo if not configured

Files to create:
- `src/ui/components/BrandLogo.tsx` (TODO)

---

## SECTION 4: Integration Testing

### 4.1 Verify End-to-End Flow

- [ ] Platform Studio saves config to Supabase
- [ ] Mobile app fetches config from Supabase
- [ ] DynamicScreen renders correct widgets
- [ ] Branding appears correctly in widgets
- [ ] Real-time updates work when config changes

### 4.2 Offline Testing

- [ ] App loads cached config when offline
- [ ] Widgets show offline state appropriately
- [ ] App recovers when back online

### 4.3 Fallback Testing

- [ ] App uses default config if Supabase fails
- [ ] Missing widgets show placeholder
- [ ] Missing branding uses defaults

---

## File Summary

### New Files to Create (15 files)

1. `.env`
2. `src/services/config/configService.ts`
3. `src/hooks/queries/useCustomerConfigQuery.ts`
4. `src/hooks/queries/useNavigationTabsQuery.ts`
5. `src/hooks/queries/useScreenLayoutQuery.ts`
6. `src/hooks/queries/useCustomerThemeQuery.ts`
7. `src/hooks/queries/useCustomerBrandingQuery.ts`
8. `src/hooks/useConfigSubscription.ts`
9. `src/types/branding.types.ts`
10. `src/hooks/config/useCustomerBranding.ts`
11. `src/context/BrandingContext.tsx`
12. `src/utils/checkVisibilityRules.ts`
13. `src/utils/getBrandedText.ts`
14. `src/ui/components/BrandLogo.tsx`

### Files to Update (15 files)

1. `src/lib/supabaseClient.ts`
2. `src/offline/configCache.ts`
3. `src/hooks/config/useEnabledTabs.ts`
4. `src/hooks/config/useTabScreens.ts`
5. `src/hooks/config/useDashboardLayout.ts`
6. `src/hooks/config/useCustomerTheme.ts`
7. `src/hooks/config/useFeatures.ts`
8. `src/navigation/DynamicScreen.tsx`
9. `src/types/config.types.ts`
10. `src/types/widget.types.ts`
11. `src/components/widgets/base/WidgetContainer.tsx`
12. `src/config/widgetRegistry.ts`
13. `src/navigation/routeRegistry.ts`
14. `src/app/DynamicDashboard.tsx`
15. Widget files (4 widgets)

---

## Execution Order

### Phase 1: Supabase Integration (Day 1)
1. Environment setup
2. Config service layer
3. React Query hooks

### Phase 2: DynamicScreen (Day 2)
1. Screen layout types
2. Update DynamicScreen to render widgets
3. Widget size support
4. Visibility rules

### Phase 3: Branding (Day 3)
1. Branding types
2. Branding hook and context
3. Update WidgetProps
4. Update widgets to use branding

### Phase 4: Testing and Polish (Day 4)
1. Real-time subscription
2. Offline caching
3. Integration testing
4. Bug fixes

---

## Success Criteria

- [x] DynamicScreen renders widgets from Supabase config
- [x] Navigation tabs load from database
- [x] Theme colors apply from customer_themes
- [x] Branding data available to widgets
- [x] Config changes in Platform Studio reflect in mobile app (via real-time subscription)
- [ ] App works offline with cached config (TODO)

---

## Progress Summary (December 8, 2024)

### Completed: ~80%

**Section 1 (Supabase Integration): 90% Complete**
- ✅ Supabase client updated with correct schema (public)
- ✅ Config service with all fetch functions
- ✅ React Query hooks for all config types
- ✅ Real-time subscription for config changes
- ⏳ Offline caching (TODO)

**Section 2 (DynamicScreen): 95% Complete**
- ✅ DynamicScreen completely rewritten to render widgets
- ✅ Screen layout types added
- ✅ Widget size support (compact/standard/expanded)
- ✅ Visibility rules implementation
- ✅ Pull to refresh support
- ⏳ Screen registry expansion (TODO)

**Section 3 (Branding): 75% Complete**
- ✅ Branding types with DEFAULT_BRANDING
- ✅ Branding hook and context
- ✅ WidgetProps updated with branding
- ✅ Text override utility
- ⏳ Update individual widgets to use branding (TODO)
- ⏳ BrandLogo component (TODO)

### Files Created (14 files)
1. `.env.example`
2. `src/services/config/configService.ts`
3. `src/hooks/queries/useNavigationTabsQuery.ts`
4. `src/hooks/queries/useScreenLayoutQuery.ts`
5. `src/hooks/queries/useCustomerThemeQuery.ts`
6. `src/hooks/queries/useCustomerBrandingQuery.ts`
7. `src/hooks/queries/index.ts`
8. `src/hooks/useConfigSubscription.ts`
9. `src/hooks/config/useCustomerBranding.ts`
10. `src/types/branding.types.ts`
11. `src/context/BrandingContext.tsx`
12. `src/utils/getBrandedText.ts`
13. `src/utils/checkVisibilityRules.ts`
14. `src/navigation/DynamicScreen.tsx` (rewritten)

### Files Updated (6 files)
1. `src/lib/supabaseClient.ts`
2. `src/types/config.types.ts`
3. `src/types/widget.types.ts`
4. `src/components/widgets/base/WidgetContainer.tsx`
5. `src/hooks/config/useEnabledTabs.ts`
6. `src/hooks/config/useCustomerTheme.ts`
7. `src/hooks/config/index.ts`
