# Screen Development Guide

This guide explains how to create screens in the CoComplete platform. Screens are the primary containers for UI that users navigate between.

---

## Screen Types Overview

The platform supports two types of screens:

| Type | Description | Configuration | Use Case |
|------|-------------|---------------|----------|
| **Dynamic Screen** | Widget-based, config-driven | `screen_layouts` table | Dashboards, lists, profile pages |
| **Fixed Screen** | Hardcoded React component | Code only | Settings, forms, specialized flows |

```
┌─────────────────────────────────────────────────────────────────┐
│                      SCREEN SYSTEM FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Platform Studio ──save──> screen_layouts ──query──> Mobile App  │
│       │                         │                         │      │
│       ▼                         ▼                         ▼      │
│  Screen Builder          Widget configs           DynamicScreen  │
│  (drag/drop)             (JSON in DB)           (renders widgets)│
│                                                                  │
│  Fixed screens bypass Platform Studio - defined entirely in code │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start: Complete Phase Checklists

### Dynamic Screen (Widget-Based) - 5 Phases

```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: PLANNING                                                    │
├─────────────────────────────────────────────────────────────────────┤
│ [ ] Define screen purpose and target role                           │
│ [ ] List widgets needed (check widget registry)                     │
│ [ ] Determine screen_id (e.g., parent-home)                         │
│ [ ] Identify if new tab needed or existing tab                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: SUPABASE DATABASE SETUP                                    │
├─────────────────────────────────────────────────────────────────────┤
│ [ ] Add navigation_tabs entry (if new tab)                          │
│ [ ] Add tab_screens entry (if sub-screen)                           │
│ [ ] Add screen_layouts entries for each widget                      │
│ [ ] Set widget positions, sizes, custom_props                       │
│ [ ] Add role_permissions if screen needs special access             │
│ [ ] Verify RLS allows role to read screen_layouts                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: ROUTE REGISTRATION                                         │
├─────────────────────────────────────────────────────────────────────┤
│ [ ] Add to routeRegistry.ts with DynamicScreen component            │
│ [ ] Add alias if needed (kebab-case + PascalCase)                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 4: PLATFORM STUDIO INTEGRATION                                │
├─────────────────────────────────────────────────────────────────────┤
│ [ ] Add screen to Platform Studio screenRegistry                    │
│ [ ] Define allowedWidgets for the screen                            │
│ [ ] Test drag-drop widget configuration                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 5: TESTING & VERIFICATION                                     │
├─────────────────────────────────────────────────────────────────────┤
│ [ ] Widgets render in correct order                                 │
│ [ ] Widget configs (custom_props) applied correctly                 │
│ [ ] Pull-to-refresh works                                           │
│ [ ] Offline mode shows cached data                                  │
│ [ ] Navigation from widgets works                                   │
│ [ ] Analytics events fire (screen_view)                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Fixed Screen (Custom Component) - 8 Phases

```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: PLANNING & ANALYSIS                                        │
├─────────────────────────────────────────────────────────────────────┤
│ [ ] Define screen purpose, user stories                             │
│ [ ] List data requirements (what tables needed?)                    │
│ [ ] Define screen_id (e.g., fee-payment, child-detail)              │
│ [ ] Identify role access (who can see this?)                        │
│ [ ] List required permissions                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: SUPABASE DATABASE SETUP (if screen needs data)             │
├─────────────────────────────────────────────────────────────────────┤
│ [ ] Create migration file                                           │
│ [ ] Create table with proper schema                                 │
│ [ ] Add localized columns (_en, _hi) for user-facing text           │
│ [ ] Add customer_id for multi-tenancy                               │
│ [ ] Enable RLS on table                                             │
│ [ ] Create RLS policies for role access                             │
│ [ ] Add indexes for query performance                               │
│ [ ] Insert seed/test data                                           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: QUERY/MUTATION HOOKS                                       │
├─────────────────────────────────────────────────────────────────────┤
│ [ ] Create query hook: src/hooks/queries/use<Entity>Query.ts        │
│ [ ] Create mutation hooks if needed: src/hooks/mutations/           │
│ [ ] Define TypeScript types for data                                │
│ [ ] Set proper staleTime, gcTime for caching                        │
│ [ ] Handle offline mode in hooks                                    │
│ [ ] Export from hooks/queries/index.ts                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 4: SCREEN COMPONENT                                           │
├─────────────────────────────────────────────────────────────────────┤
│ [ ] Create: src/screens/<category>/<Name>Screen.tsx                 │
│ [ ] Add all required hooks (theme, i18n, analytics, offline)        │
│ [ ] Implement Loading state with ActivityIndicator                  │
│ [ ] Implement Error state with retry button                         │
│ [ ] Implement Empty state with guidance                             │
│ [ ] Implement Success state with content                            │
│ [ ] Add OfflineBanner at top                                        │
│ [ ] Use getLocalizedField for dynamic content                       │
│ [ ] Use t() for static UI text                                      │
│ [ ] Add permission checks with usePermissions                       │
│ [ ] Use branding for white-label text                               │
│ [ ] Track screen view with useAnalytics                             │
│ [ ] Export from src/screens/<category>/index.ts                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 5: ROUTE REGISTRATION                                         │
├─────────────────────────────────────────────────────────────────────┤
│ [ ] Add to routeRegistry.ts with custom component                   │
│ [ ] Add alias for PascalCase if needed                              │
│ [ ] Add to COMMON_SCREENS if accessible from any tab                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 6: TRANSLATIONS (i18n)                                        │
├─────────────────────────────────────────────────────────────────────┤
│ [ ] Add English: src/i18n/locales/en/screens.json                   │
│ [ ] Add Hindi: src/i18n/locales/hi/screens.json                     │
│ [ ] Include: title, subtitle, sections, actions, states, messages   │
│ [ ] Test language switching                                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 7: NAVIGATION INTEGRATION                                     │
├─────────────────────────────────────────────────────────────────────┤
│ [ ] Add navigation from parent screens/widgets                      │
│ [ ] Handle route params if needed                                   │
│ [ ] Test back navigation                                            │
│ [ ] Add deep link config if needed                                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 8: TESTING & VERIFICATION                                     │
├─────────────────────────────────────────────────────────────────────┤
│ [ ] All 4 states render correctly (loading/error/empty/success)     │
│ [ ] Offline mode: banner shows, cached data displays                │
│ [ ] Mutations blocked when offline with alert                       │
│ [ ] i18n: English displays correctly                                │
│ [ ] i18n: Hindi displays correctly                                  │
│ [ ] Permissions: unauthorized users can't access                    │
│ [ ] Branding: customer-specific text shows                          │
│ [ ] Analytics: screen_view event fires                              │
│ [ ] Error tracking: errors logged to Sentry                         │
│ [ ] Pull-to-refresh works                                           │
│ [ ] Navigation works in both directions                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Screen ID Convention

```
Format: <role>-<purpose>[-<detail>]

Examples (Dynamic):
- student-home         (Student dashboard)
- parent-home          (Parent dashboard)
- teacher-home         (Teacher dashboard)
- child-progress-screen (Parent viewing child's progress)
- schedule-screen      (Schedule for any role)
- profile-home         (Profile page)

Examples (Fixed):
- settings             (Settings screen)
- edit-profile         (Profile editing form)
- language-selection   (Language picker)
- global-analytics     (Analytics detail view)
```

**Important:** Screen ID must be IDENTICAL across:
1. `navigation_tabs.initial_route` or `tab_screens.screen_id`
2. `screen_layouts.screen_id`
3. `routeRegistry.ts` key
4. Platform Studio screen list

---

## Dynamic Screen Development

Dynamic screens render widgets from the `screen_layouts` database table. They require NO custom code - just database configuration.

### Phase 1: Database Configuration

#### 1.1 Define Navigation Tab (if new tab needed)

```sql
-- Add to navigation_tabs table
INSERT INTO navigation_tabs (
  customer_id,
  role,
  tab_id,
  label,
  icon,
  initial_route,
  order_index,
  enabled
) VALUES (
  'your-customer-id',
  'parent',
  'home',
  'Home',
  'home',
  'parent-home',     -- This is the screen_id
  1,
  true
);
```

#### 1.2 Add Screen Layouts (Widgets)

```sql
-- Add widgets to the screen
INSERT INTO screen_layouts (
  customer_id,
  role,
  screen_id,
  widget_id,
  position,
  enabled,
  size,
  custom_props,
  visibility_rules
) VALUES
  -- First widget
  ('your-customer-id', 'parent', 'parent-home', 'parent.children-overview', 1, true, 'standard',
   '{"layoutStyle": "cards", "showQuickStats": true}'::jsonb, NULL),
  -- Second widget
  ('your-customer-id', 'parent', 'parent-home', 'parent.notifications-preview', 2, true, 'compact',
   '{"maxItems": 3}'::jsonb, NULL),
  -- Third widget
  ('your-customer-id', 'parent', 'parent-home', 'parent.quick-actions', 3, true, 'standard',
   '{"columns": 4}'::jsonb, NULL);
```

#### screen_layouts Table Schema

| Column | Type | Description |
|--------|------|-------------|
| `customer_id` | UUID | Customer/tenant ID |
| `role` | TEXT | User role (student, parent, teacher, admin) |
| `screen_id` | TEXT | Screen identifier (must match route) |
| `widget_id` | TEXT | Widget identifier from widget registry |
| `position` | INT | Order on screen (1, 2, 3...) |
| `enabled` | BOOL | Whether widget is visible |
| `size` | TEXT | Widget size: compact, standard, expanded |
| `custom_props` | JSONB | Widget configuration overrides |
| `visibility_rules` | JSONB | Conditional visibility logic |

### Phase 2: Route Registry

Add to `src/navigation/routeRegistry.ts`:

```typescript
const registry: Record<string, RouteDefinition> = {
  // ... existing entries

  // Dynamic screen - uses DynamicScreen component
  "parent-home": { screenId: "parent-home", component: DynamicScreen },
  "child-progress-screen": { screenId: "child-progress-screen", component: DynamicScreen },
};
```

### Phase 3: Platform Studio Integration

Add screen to Platform Studio's screen list for drag-drop widget configuration:

```typescript
// platform-studio/src/config/screenRegistry.ts
const SCREENS = [
  // ... existing screens
  {
    screenId: "parent-home",
    name: "Parent Dashboard",
    role: "parent",
    type: "dashboard",
    allowedWidgets: ["parent.*", "child.*", "actions.*"],
  },
];
```

### Phase 4: Test Dynamic Screen

1. Verify widgets appear in correct order
2. Check widget configs are applied
3. Test pull-to-refresh
4. Verify offline mode shows cached widgets
5. Test visibility rules (if any)

---

## Fixed Screen Development

Fixed screens are custom React components for complex interactions that don't fit the widget model.

### When to Use Fixed Screens

- **Forms**: Multi-step forms, complex validation
- **Settings**: User preferences with immediate feedback
- **Specialized UI**: Charts, editors, complex interactions
- **Auth flows**: Login, registration, password reset
- **Detail views**: When widgets can't express the layout

### Phase 1: Create Screen Component

Location: `src/screens/<category>/<ScreenName>Screen.tsx`

```typescript
/**
 * <ScreenName> Screen - Fixed (Custom Component)
 *
 * Purpose: Brief description of what this screen does
 * Type: Fixed (not widget-based)
 * Accessible from: [list tabs/screens that link here]
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";
import { useBranding } from "../../context/BrandingContext";

// Analytics & Error Tracking
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Screen-specific hooks/queries
// import { useMyDataQuery } from "../../hooks/queries/useMyDataQuery";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

export const MyNewScreen: React.FC<Props> = ({
  screenId = "my-new-screen",
  role,
  navigation: navProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation("screens"); // or specific namespace
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = useRoute<any>();

  // === STATE ===
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // === DATA FETCHING ===
  // const { data, isLoading: queryLoading, error: queryError } = useMyDataQuery();

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
    });

    // Simulate loading
    setTimeout(() => setIsLoading(false), 500);
  }, [screenId]);

  // === EVENT HANDLERS ===
  const handleAction = useCallback(() => {
    trackEvent("action_pressed", { screen: screenId });
    // Handle action
  }, [trackEvent, screenId]);

  const handleBack = useCallback(() => {
    trackEvent("back_pressed", { screen: screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("common:status.loading", { defaultValue: "Loading..." })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {error}
          </AppText>
          <AppButton
            title={t("common:actions.retry", { defaultValue: "Try Again" })}
            onPress={() => setError(null)}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  // === SUCCESS STATE ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header (optional - if not using navigation header) */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("myScreen.title", { defaultValue: "Screen Title" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen content here */}
        <AppCard>
          <AppText style={{ color: colors.onSurface }}>
            Screen content goes here
          </AppText>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerRight: {
    width: 32, // Balance the back button
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
});

export default MyNewScreen;
```

### Phase 2: Export Screen

Add to `src/screens/<category>/index.ts`:

```typescript
export { MyNewScreen } from "./MyNewScreen";
```

### Phase 3: Register in Route Registry

Add to `src/navigation/routeRegistry.ts`:

```typescript
import { MyNewScreen } from "../screens/category";

const registry: Record<string, RouteDefinition> = {
  // ... existing entries

  // Fixed screen - uses custom component
  "my-new-screen": { screenId: "my-new-screen", component: MyNewScreen },
  // Add alias for PascalCase if needed
  "MyNewScreen": { screenId: "MyNewScreen", component: MyNewScreen },
};
```

### Phase 4: Add to COMMON_SCREENS (If Accessible From Any Tab)

If the screen should be accessible from any tab (not just specific tab stacks):

```typescript
// src/navigation/DynamicTabNavigator.tsx

const COMMON_SCREENS = [
  { screenId: "settings", component: SettingsScreen },
  { screenId: "edit-profile", component: EditProfileScreen },
  // Add your screen
  { screenId: "my-new-screen", component: MyNewScreen },
];
```

### Phase 5: Add Translations

Add to `src/i18n/locales/en/screens.json` (or appropriate namespace):

```json
{
  "myScreen": {
    "title": "My Screen Title",
    "subtitle": "Screen description",
    "sections": {
      "main": "Main Section"
    },
    "actions": {
      "save": "Save",
      "cancel": "Cancel"
    },
    "states": {
      "loading": "Loading...",
      "empty": "No data available",
      "error": "Something went wrong"
    }
  }
}
```

Add Hindi translations to `src/i18n/locales/hi/screens.json`.

---

## Screen Props Interface

All screens (both Dynamic and Fixed) receive these props:

```typescript
type ScreenProps = {
  // Screen identification
  screenId: string;              // Screen ID from route

  // User context
  role?: Role;                   // Current user role

  // Navigation
  navigation?: NavigationProp;   // Navigation object

  // Callbacks
  onFocused?: () => void;        // Called when screen gains focus
};
```

For Fixed screens, you may also receive route params:

```typescript
const route = useRoute<RouteProp<ParamList, 'MyScreen'>>();
const { itemId, mode } = route.params || {};
```

---

## Navigation Patterns

### Navigate to Screen

```typescript
// From a widget or screen
navigation.navigate("my-new-screen", { itemId: "123" });

// Using onNavigate callback (in widgets)
onNavigate?.("my-new-screen", { itemId: "123" });
```

### Navigate Back

```typescript
navigation.goBack();
```

### Replace Screen (no back)

```typescript
navigation.replace("my-new-screen");
```

### Reset Stack

```typescript
navigation.reset({
  index: 0,
  routes: [{ name: "home" }],
});
```

### Handle Deep Links

```typescript
// Define linking config in App.tsx
const linking = {
  prefixes: ['myapp://'],
  config: {
    screens: {
      'my-new-screen': 'screen/:itemId',
    },
  },
};
```

---

## Screen Checklist

### Required Elements (All Screens)

- [ ] SafeAreaView wrapper
- [ ] useAppTheme for colors
- [ ] useTranslation for i18n
- [ ] useAnalytics for tracking
- [ ] trackScreenView on mount
- [ ] Offline banner (if data-dependent)

### State Handling

- [ ] Loading state with ActivityIndicator
- [ ] Error state with retry option
- [ ] Empty state with guidance
- [ ] Success state with content

### Navigation

- [ ] Registered in routeRegistry.ts
- [ ] Added to COMMON_SCREENS (if needed)
- [ ] Back navigation works correctly
- [ ] Deep link config (if needed)

### Accessibility

- [ ] Proper touch targets (min 44x44)
- [ ] Screen reader labels
- [ ] Focus management

### Testing

- [ ] All states render correctly
- [ ] Navigation works in both directions
- [ ] Offline mode handled gracefully
- [ ] Analytics events fire properly
- [ ] i18n works for en and hi

---

## Screen Categories

Organize screens by category in `src/screens/`:

```
src/screens/
├── auth/
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   └── index.ts
├── settings/
│   ├── SettingsScreen.tsx
│   ├── LanguageSelectionScreen.tsx
│   └── index.ts
├── profile/
│   ├── EditProfileScreen.tsx
│   ├── HelpFeedbackScreen.tsx
│   └── index.ts
├── progress/
│   ├── GlobalAnalyticsScreen.tsx
│   ├── SubjectAnalyticsScreen.tsx
│   └── index.ts
├── parent/
│   ├── ChildDetailScreen.tsx
│   ├── FeePaymentScreen.tsx
│   └── index.ts
└── index.ts  (re-exports all)
```

---

## Dynamic vs Fixed: Decision Guide

| Consideration | Choose Dynamic | Choose Fixed |
|--------------|----------------|--------------|
| Layout flexibility | Widgets rearrangeable via Platform Studio | Fixed layout required |
| Content type | Data display, lists, cards | Complex forms, workflows |
| Customization | Per-customer widget configs | Same for all customers |
| Development speed | Fast (config only) | Slower (code required) |
| Maintenance | Easy (database changes) | Code changes needed |
| Complex interactions | Not suitable | Ideal |
| Offline support | Automatic via widgets | Manual implementation |

### Hybrid Approach

Some screens use a hybrid approach - a Fixed screen that includes some Dynamic widgets:

```typescript
// Fixed screen with embedded DynamicScreen section
export const HybridScreen: React.FC = () => {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Fixed header/form section */}
      <View style={styles.fixedSection}>
        <AppText>Fixed Content</AppText>
      </View>

      {/* Dynamic widget section */}
      <DynamicScreen
        screenId="hybrid-widgets"
        role="parent"
      />
    </SafeAreaView>
  );
};
```

---

## Performance Considerations

### Dynamic Screens

- Widgets are lazy-loaded from registry
- Use `staleTime` in useScreenLayoutQuery for caching
- Visibility rules evaluated per render

### Fixed Screens

- Use `useMemo` for expensive computations
- Use `useCallback` for event handlers
- Avoid inline function definitions in JSX
- Consider virtualized lists for long content

### Common Optimizations

```typescript
// Memoize filtered/sorted data
const filteredItems = useMemo(() =>
  items.filter(item => item.enabled).sort((a, b) => a.order - b.order),
  [items]
);

// Memoize event handlers
const handlePress = useCallback((id: string) => {
  navigation.navigate("detail", { id });
}, [navigation]);

// Use React.memo for list items
const ListItem = React.memo(({ item, onPress }) => (
  <TouchableOpacity onPress={() => onPress(item.id)}>
    <AppText>{item.title}</AppText>
  </TouchableOpacity>
));
```

---

## Error Handling

### Screen-Level Error Boundary

All screens are wrapped with `ScreenErrorBoundaryWrapper`:

```typescript
// In DynamicTabNavigator.tsx
<ScreenErrorBoundaryWrapper screenId={screen.screenId}>
  <Component {...props} />
</ScreenErrorBoundaryWrapper>
```

### Manual Error Handling

```typescript
const [error, setError] = useState<string | null>(null);

const loadData = async () => {
  try {
    setError(null);
    const data = await fetchData();
    setData(data);
  } catch (err) {
    setError(err.message || "Failed to load data");
    addBreadcrumb({
      category: "error",
      message: `Screen error: ${screenId}`,
      level: "error",
      data: { error: err.message },
    });
  }
};
```

---

## Example: Complete Fixed Screen

See `src/screens/settings/SettingsScreen.tsx` for a complete example that includes:
- All required hooks and imports
- Config-driven sections (show/hide via Platform Studio)
- Multiple modals (language, theme)
- AsyncStorage for persistence
- Full i18n support
- Analytics tracking
- Offline awareness
- Proper styling patterns

---

---

## Offline Support Patterns

All screens must handle offline scenarios gracefully. Reference: `OFFLINE_SUPPORT_SPEC.md`

### Network Status Hook

```typescript
import { useNetworkStatus } from "../../offline/networkStore";

const { isOnline, connectionType } = useNetworkStatus();
```

### Offline Banner Component

```typescript
import { OfflineBanner } from "../../offline/OfflineBanner";

// In your screen JSX (top of content)
<SafeAreaView>
  <OfflineBanner />
  {/* Rest of content */}
</SafeAreaView>
```

### Offline Behavior by Screen Type

| Screen Type | Offline Behavior |
|-------------|------------------|
| Dynamic (Dashboard) | Show cached widgets, disable refresh |
| Dynamic (List) | Show cached data, disable actions |
| Fixed (Settings) | Full functionality (local storage) |
| Fixed (Forms) | Queue submissions, show warning |
| Fixed (Detail) | Show cached data if available |

### Mutation Handling When Offline

```typescript
const handleSubmit = useCallback(async () => {
  if (!isOnline) {
    Alert.alert(
      t("common:offline.title", { defaultValue: "You're Offline" }),
      t("common:offline.actionRequired", {
        defaultValue: "This action requires internet connection. Please try again when online."
      }),
      [{ text: t("common:actions.ok") }]
    );
    return;
  }

  // Proceed with mutation
  await mutation.mutateAsync(data);
}, [isOnline, mutation, data]);
```

### React Query Offline Configuration

```typescript
// In your query hook
return useQuery({
  queryKey: ["my-data", userId],
  queryFn: fetchData,
  staleTime: 5 * 60 * 1000,      // 5 minutes
  gcTime: 30 * 60 * 1000,         // 30 minutes cache
  networkMode: "offlineFirst",    // Use cache when offline
  retry: isOnline ? 2 : 0,        // Don't retry when offline
});
```

---

## i18n / Multi-Language Patterns

All screens must support English and Hindi. Reference: `I18N_MULTILANGUAGE_SPEC.md`

### Two Types of Localized Content

| Type | Storage | Access Method |
|------|---------|---------------|
| **Static UI** (labels, buttons, headers) | Translation files (`src/locales/`) | `t("key")` |
| **Dynamic Content** (from database) | DB columns (`title_en`, `title_hi`) | `getLocalizedField(item, 'field')` |

### Static UI Text

```typescript
import { useTranslation } from "react-i18next";

// Namespace: "screens" for screen-specific, "common" for shared
const { t } = useTranslation("screens");

// Usage with defaults
<AppText>{t("myScreen.title", { defaultValue: "My Screen" })}</AppText>
<AppText>{t("myScreen.states.empty", { defaultValue: "No data" })}</AppText>

// With interpolation
<AppText>{t("myScreen.greeting", { name: userName, defaultValue: "Hello, {{name}}" })}</AppText>
```

### Dynamic Content (Database)

```typescript
import { getLocalizedField } from "../../utils/getLocalizedField";

// Database record has: title_en, title_hi, description_en, description_hi
const item = { title_en: "Hello", title_hi: "नमस्ते" };

// Returns correct value based on current language
<AppText>{getLocalizedField(item, 'title')}</AppText>
```

### Translation File Structure

```
src/i18n/locales/
├── en/
│   ├── common.json      (shared strings)
│   ├── dashboard.json   (widget strings)
│   ├── screens.json     (screen-specific)
│   └── settings.json    (settings screen)
└── hi/
    ├── common.json
    ├── dashboard.json
    ├── screens.json
    └── settings.json
```

### Screen Translation Template

**English** (`src/i18n/locales/en/screens.json`):
```json
{
  "myScreen": {
    "title": "My Screen Title",
    "subtitle": "Screen description",
    "sections": {
      "main": "Main Section",
      "details": "Details"
    },
    "actions": {
      "save": "Save",
      "cancel": "Cancel",
      "retry": "Try Again"
    },
    "states": {
      "loading": "Loading...",
      "empty": "No data available",
      "error": "Something went wrong"
    },
    "messages": {
      "saveSuccess": "Saved successfully",
      "saveFailed": "Failed to save"
    }
  }
}
```

**Hindi** (`src/i18n/locales/hi/screens.json`):
```json
{
  "myScreen": {
    "title": "मेरी स्क्रीन शीर्षक",
    "subtitle": "स्क्रीन विवरण",
    "sections": {
      "main": "मुख्य अनुभाग",
      "details": "विवरण"
    },
    "actions": {
      "save": "सहेजें",
      "cancel": "रद्द करें",
      "retry": "पुनः प्रयास करें"
    },
    "states": {
      "loading": "लोड हो रहा है...",
      "empty": "कोई डेटा उपलब्ध नहीं",
      "error": "कुछ गलत हुआ"
    },
    "messages": {
      "saveSuccess": "सफलतापूर्वक सहेजा गया",
      "saveFailed": "सहेजने में विफल"
    }
  }
}
```

---

## Error Handling Patterns

All screens must implement consistent error handling. Reference: `ERROR_HANDLING_SPEC.md`

### Error Taxonomy

| Error Type | Description | Screen Handling |
|------------|-------------|-----------------|
| **Config Error** | Invalid config from DB | Show safe-mode fallback |
| **Network Error** | API/Supabase failures | Show offline state + retry |
| **Render Error** | React component crash | Error boundary catches |
| **Validation Error** | Invalid user input | Inline field errors |
| **Auth Error** | Session expired | Redirect to login |

### Error Boundary Integration

Screens are automatically wrapped with error boundaries:

```typescript
// In DynamicTabNavigator.tsx - already provided
<ScreenErrorBoundaryWrapper screenId={screen.screenId}>
  <Component {...props} />
</ScreenErrorBoundaryWrapper>
```

### Manual Error Handling Pattern

```typescript
import { addBreadcrumb, captureException } from "../../error/errorReporting";

const [error, setError] = useState<string | null>(null);

const loadData = async () => {
  try {
    setError(null);
    const data = await fetchData();
    setData(data);
  } catch (err) {
    // Log to Sentry
    captureException(err, {
      tags: { screen: screenId, action: "load_data" },
      extra: { userId, role },
    });

    // Add breadcrumb for debugging
    addBreadcrumb({
      category: "error",
      message: `Data load failed: ${screenId}`,
      level: "error",
      data: { error: err.message },
    });

    // User-friendly error message
    const message = err.code === "NETWORK_ERROR"
      ? t("common:errors.network", { defaultValue: "Network error. Please check your connection." })
      : t("common:errors.generic", { defaultValue: "Something went wrong." });

    setError(message);
  }
};
```

### Error State UI Pattern

```typescript
// Error state rendering
if (error) {
  return (
    <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
      <Icon name="alert-circle-outline" size={64} color={colors.error} />
      <AppText style={[styles.errorTitle, { color: colors.error }]}>
        {t("common:errors.title", { defaultValue: "Oops!" })}
      </AppText>
      <AppText style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
        {error}
      </AppText>
      <View style={styles.errorActions}>
        <AppButton
          title={t("common:actions.retry", { defaultValue: "Try Again" })}
          onPress={handleRetry}
          variant="primary"
        />
        <AppButton
          title={t("common:actions.goHome", { defaultValue: "Go Home" })}
          onPress={() => navigation.navigate("home")}
          variant="outline"
        />
      </View>
    </View>
  );
}
```

---

## RBAC / Permissions Patterns

All screens must respect role-based access. Reference: `PERMISSIONS_RBAC_SPEC.md`

### usePermissions Hook

```typescript
import { usePermissions } from "../../hooks/config/usePermissions";

const { has, permissions } = usePermissions(role);

// Check single permission
if (has("view_dashboard")) {
  // Show dashboard content
}

// Check multiple permissions (AND)
if (has("create_assignment") && has("edit_assignment")) {
  // Show assignment editor
}

// Conditionally render
{has("view_notifications") && <NotificationBadge />}
```

### Permission-Based Section Rendering

```typescript
const MyScreen: React.FC<Props> = ({ role }) => {
  const { has } = usePermissions(role);

  return (
    <ScrollView>
      {/* Always visible */}
      <ProfileSection />

      {/* Permission-gated */}
      {has("view_analytics") && <AnalyticsSection />}
      {has("manage_users") && <UserManagementSection />}
      {has("view_reports") && <ReportsSection />}
    </ScrollView>
  );
};
```

### Role-Specific Content

```typescript
// Different content based on role
const getWelcomeMessage = (role: Role) => {
  switch (role) {
    case "student":
      return t("welcome.student", { defaultValue: "Ready to learn?" });
    case "parent":
      return t("welcome.parent", { defaultValue: "Track your child's progress" });
    case "teacher":
      return t("welcome.teacher", { defaultValue: "Manage your classes" });
    case "admin":
      return t("welcome.admin", { defaultValue: "Platform overview" });
  }
};
```

---

## Branding / White-Label Patterns

Support customer-specific branding. Reference: `CustomerBranding` type.

### useBranding Hook

```typescript
import { useBranding } from "../../context/BrandingContext";

const branding = useBranding();

// Access branding properties
const appName = branding.appName;           // "SchoolX Learning"
const logo = branding.logoUrl;              // Logo URL
const supportEmail = branding.supportEmail; // Support email
const primaryColor = branding.primaryColor; // Brand color

// Feature naming (white-label)
const aiTutorName = branding.aiTutorName;   // "Ask Guru" / "Study Buddy"
const doubtLabel = branding.doubtSectionName; // "Ask Doubts" / "Get Help"
```

### Branded Text Usage

```typescript
// Use branding for customer-specific names
<AppText>
  {t("welcome.appName", {
    appName: branding.appName,
    defaultValue: "Welcome to {{appName}}"
  })}
</AppText>

// Branded feature names
<AppText>
  {t("doubts.askQuestion", {
    featureName: branding.doubtSectionName,
    defaultValue: "Ask a question in {{featureName}}"
  })}
</AppText>
```

### Branded Links

```typescript
const handleHelp = () => {
  const url = branding.helpCenterUrl || "https://help.default.com";
  Linking.openURL(url);
};

const handlePrivacy = () => {
  const url = branding.privacyUrl || "https://default.com/privacy";
  Linking.openURL(url);
};
```

---

## Supabase Integration Patterns

### Phase 2 Detail: Database Setup with Migrations

When your Fixed screen needs data, follow this complete database setup:

#### Step 1: Create Migration File

```sql
-- Migration: 20240115_create_parent_fee_records.sql
-- Purpose: Store fee payment records for parent role

-- 1. CREATE TABLE with proper schema
CREATE TABLE IF NOT EXISTS fee_records (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Multi-tenancy (REQUIRED)
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Ownership
  parent_id UUID NOT NULL REFERENCES auth.users(id),
  child_id UUID NOT NULL REFERENCES auth.users(id),

  -- Localized content (for user-facing text)
  title_en TEXT NOT NULL,
  title_hi TEXT,
  description_en TEXT,
  description_hi TEXT,

  -- Domain data
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  receipt_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE INDEXES for performance
CREATE INDEX idx_fee_records_customer ON fee_records(customer_id);
CREATE INDEX idx_fee_records_parent ON fee_records(parent_id);
CREATE INDEX idx_fee_records_child ON fee_records(child_id);
CREATE INDEX idx_fee_records_status ON fee_records(status);
CREATE INDEX idx_fee_records_due_date ON fee_records(due_date);

-- 3. ENABLE RLS (CRITICAL for security)
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES

-- Policy: Parents can read their own fee records
CREATE POLICY "fee_records_select_parent" ON fee_records
  FOR SELECT
  USING (
    parent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.customer_id = fee_records.customer_id
      AND ur.role IN ('admin', 'teacher')
    )
  );

-- Policy: Only admins can insert fee records
CREATE POLICY "fee_records_insert_admin" ON fee_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.customer_id = fee_records.customer_id
      AND ur.role = 'admin'
    )
  );

-- Policy: Parents can update payment status (pay fees)
CREATE POLICY "fee_records_update_parent" ON fee_records
  FOR UPDATE
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- 5. CREATE TRIGGER for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fee_records_updated_at
  BEFORE UPDATE ON fee_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 6. INSERT SEED DATA for testing
INSERT INTO fee_records (customer_id, parent_id, child_id, title_en, title_hi, amount, due_date, status)
VALUES
  ('demo-customer-id', 'demo-parent-id', 'demo-child-id',
   'Tuition Fee - January', 'ट्यूशन फीस - जनवरी', 5000.00, '2024-01-31', 'pending'),
  ('demo-customer-id', 'demo-parent-id', 'demo-child-id',
   'Library Fee', 'पुस्तकालय शुल्क', 500.00, '2024-02-15', 'pending');
```

#### Step 2: RLS Policy Patterns

```sql
-- PATTERN 1: User owns the record
CREATE POLICY "user_owns_record" ON my_table
  FOR ALL
  USING (user_id = auth.uid());

-- PATTERN 2: Role-based access (read-only for specific roles)
CREATE POLICY "role_based_read" ON my_table
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.customer_id = my_table.customer_id
      AND ur.role IN ('admin', 'teacher', 'parent')
    )
  );

-- PATTERN 3: Parent can see child's data
CREATE POLICY "parent_sees_child" ON child_data
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_children pc
      WHERE pc.parent_id = auth.uid()
      AND pc.child_id = child_data.student_id
    )
  );

-- PATTERN 4: Multi-tenant isolation
CREATE POLICY "tenant_isolation" ON my_table
  FOR ALL
  USING (
    customer_id IN (
      SELECT customer_id FROM user_roles WHERE user_id = auth.uid()
    )
  );
```

### Query Hook Pattern

```typescript
// src/hooks/queries/useMyDataQuery.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../services/supabaseClient";
import { useCustomerId } from "../config/useCustomerId";

export type MyDataType = {
  id: string;
  title_en: string;
  title_hi?: string;
  // ... fields
};

export function useMyDataQuery(userId: string) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["my-data", customerId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("my_table")
        .select("*")
        .eq("customer_id", customerId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MyDataType[];
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes
    enabled: !!customerId && !!userId,
  });
}
```

### Mutation Hook Pattern

```typescript
// src/hooks/mutations/useCreateMyData.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../services/supabaseClient";

type CreateMyDataInput = {
  title: string;
  description?: string;
};

export function useCreateMyData(customerId: string, userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMyDataInput) => {
      const { data, error } = await supabase
        .from("my_table")
        .insert({
          customer_id: customerId,
          user_id: userId,
          title_en: input.title,
          description_en: input.description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["my-data", customerId] });
    },
    onError: (error) => {
      captureException(error, { tags: { mutation: "create_my_data" } });
    },
  });
}
```

### Using in Screen

```typescript
const { data, isLoading, error, refetch } = useMyDataQuery(userId);
const createMutation = useCreateMyData(customerId, userId);

const handleCreate = async (input: CreateMyDataInput) => {
  if (!isOnline) {
    Alert.alert(t("common:offline.title"), t("common:offline.actionRequired"));
    return;
  }

  try {
    await createMutation.mutateAsync(input);
    Alert.alert(t("common:success"), t("myScreen.messages.saveSuccess"));
  } catch (err) {
    Alert.alert(t("common:error"), t("myScreen.messages.saveFailed"));
  }
};
```

---

## Configuration System Integration

### Screen Config from Platform Studio

For Fixed screens that support partial configuration:

```typescript
type ScreenConfig = {
  showSection1: boolean;
  showSection2: boolean;
  maxItems: number;
  // ... configurable options
};

const DEFAULT_CONFIG: ScreenConfig = {
  showSection1: true,
  showSection2: true,
  maxItems: 10,
};

// In screen component
const [config] = useState<ScreenConfig>(DEFAULT_CONFIG);

// Later: load from Platform Studio via useScreenConfigQuery
```

### Feature Flags Integration

```typescript
import { useFeatures } from "../../hooks/config/useFeatures";

const features = useFeatures();
const enabledFeatureIds = new Set(
  features.filter(f => f.enabled).map(f => f.featureId)
);

// Check feature availability
const aiTutorEnabled = enabledFeatureIds.has("ai.tutor");
const premiumEnabled = enabledFeatureIds.has("premium.features");

// Conditionally render
{aiTutorEnabled && <AiTutorSection />}
```

---

## Complete Screen Template

Here's a complete Fixed screen template incorporating ALL patterns:

```typescript
/**
 * CompleteExampleScreen - Fixed Screen Template
 *
 * Demonstrates all required patterns:
 * - Offline support
 * - i18n (static + dynamic)
 * - Error handling
 * - RBAC permissions
 * - Branding
 * - Supabase integration
 * - Analytics
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";
import { useBranding } from "../../context/BrandingContext";

// Analytics & Error Tracking
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb, captureException } from "../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";

// Permissions & Features
import { usePermissions } from "../../hooks/config/usePermissions";
import { useFeatures } from "../../hooks/config/useFeatures";

// Localization
import { getLocalizedField } from "../../utils/getLocalizedField";

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Data Hooks
import { useMyDataQuery } from "../../hooks/queries/useMyDataQuery";

type Props = {
  screenId?: string;
  role?: string;
};

export const CompleteExampleScreen: React.FC<Props> = ({
  screenId = "complete-example",
  role = "student",
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation("screens");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const { has } = usePermissions(role);
  const features = useFeatures();
  const navigation = useNavigation<any>();

  // === DATA ===
  const { data, isLoading, error, refetch } = useMyDataQuery("user-id");
  const [refreshing, setRefreshing] = useState(false);

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen: ${screenId}`,
      level: "info",
    });
  }, [screenId]);

  // === HANDLERS ===
  const handleRefresh = useCallback(async () => {
    if (!isOnline) {
      Alert.alert(
        t("common:offline.title"),
        t("common:offline.refreshDisabled")
      );
      return;
    }
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [isOnline, refetch]);

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={{ color: colors.onSurfaceVariant }}>
            {t("common:status.loading")}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={{ color: colors.error }}>
            {t("common:errors.loadFailed")}
          </AppText>
          <AppButton
            title={t("common:actions.retry")}
            onPress={() => refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  // === SUCCESS STATE ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Branded Header */}
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t("myScreen.title", { appName: branding.appName })}
        </AppText>

        {/* Dynamic Content */}
        {data?.map(item => (
          <AppCard key={item.id}>
            <AppText style={{ color: colors.onSurface }}>
              {getLocalizedField(item, 'title')}
            </AppText>
          </AppCard>
        ))}

        {/* Permission-gated Section */}
        {has("view_analytics") && (
          <AppCard>
            <AppText>{t("myScreen.sections.analytics")}</AppText>
          </AppCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
});
```

---

## Troubleshooting

### Screen Not Appearing

1. Check routeRegistry.ts has the screen registered
2. Verify screen_id matches in all places
3. Check COMMON_SCREENS if accessing from different tab
4. Verify role/permissions allow access

### Widgets Not Loading (Dynamic)

1. Check screen_layouts has entries for screen_id
2. Verify widget_id exists in widgetRegistry
3. Check enabled=true in screen_layouts
4. Verify role matches in screen_layouts

### Navigation Not Working

1. Ensure route is registered in routeRegistry
2. Check navigation params are correct
3. Verify screen component exports correctly

### Styling Issues

1. Always use theme colors from useAppTheme
2. Check SafeAreaView is wrapping content
3. Verify flex: 1 on container
