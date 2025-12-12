Here is the **next core brick**, written with maximum clarity and depth, ready for your `docs/` folder.
This one is extremely important because it defines the **entire UI layer**, ensuring consistency across all Mansuhi screens, widgets, dashboards, and roles.

---

# 📄 `docs/UI_COMPONENT_SYSTEM.md`

### Unified UI Component Architecture, Design Tokens & Reusable Building Blocks for Mansuhi

```md
# 🎨 UI_COMPONENT_SYSTEM.md
### Mansuhi UI Component System & Design Tokens

This document defines the **UI foundation** for Mansuhi:

- Design tokens (colors, spacing, radius, typography)
- Base components (buttons, cards, inputs)
- Layout primitives
- Reusable screen templates
- Widget shells and rendering standards
- MD3 integration
- Theme-aware behaviour (dark/light, tenant theme)
- Accessibility requirements

This system ensures:
- Consistent UI across all features
- Easy maintenance
- Smooth multi-tenant theming
- Faster development using repeatable patterns
- Professional, scalable design aesthetics

This doc is mandatory for all UI development.

---

# 1. 🎯 Goals

1. Provide a **single source of truth** for UI components.
2. Ensure **consistent look & feel** across the app.
3. Make UI **themeable per customer** dynamically.
4. Support **Material Design 3 (MD3)** out of the box.
5. Create a reusable **widget system** for the dynamic dashboard.
6. Provide a layout language that is:
   - predictable  
   - responsive  
   - accessible  
   - easy to use for developers  
7. Avoid duplication and custom CSS-like styles everywhere.

---

# 2. 📦 Design Tokens (global UI variables)

Tokens live in:

```

src/ui/tokens/

````

These are theme-aware, but fallback to defaults if needed.

---

## 2.1 Colors (MD3-based)

All colors come from the **Theme Engine**:

```ts
color.primary
color.primaryContainer
color.secondary
color.background
color.surface
color.onPrimary
color.onBackground
color.error
````

For dark mode:

* Managed automatically via MD3's color scheme derivation.

---

## 2.2 Spacing Tokens

Never use raw numbers like `13`, `17` in styles.

Use:

```ts
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};
```

Spacing guides:

* Vertical spacing between sections: `lg`
* Inside cards: `md`
* Inside buttons: `sm` or `md`

---

## 2.3 Radius Tokens

```ts
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24, // Optional for very rounded MD3
};
```

---

## 2.4 Typography Tokens

Basic set:

```ts
typography = {
  headlineLarge: { fontSize: 32, fontWeight: '700' },
  headlineMedium: { fontSize: 24, fontWeight: '600' },
  headlineSmall: { fontSize: 20, fontWeight: '600' },

  titleLarge: { fontSize: 18, fontWeight: '600' },
  titleMedium: { fontSize: 16, fontWeight: '600' },
  titleSmall: { fontSize: 14, fontWeight: '600' },

  bodyLarge: { fontSize: 16 },
  bodyMedium: { fontSize: 14 },
  bodySmall: { fontSize: 12 },

  labelLarge: { fontSize: 14, fontWeight: '500' },
  labelMedium: { fontSize: 12, fontWeight: '500' },
};
```

All typography is consumed through **AppText**.

---

# 3. 🧱 Base Components

Stored in:

```
src/ui/components/
```

These are **theme-aware**, **accessible**, and **consistent**.

---

## 3.1 `<AppText />`

Wrapper around RN `<Text>`.

### Responsibilities:

* Uses typography tokens
* Applies theme colors
* Supports dynamic font scaling
* Supports i18n RTL
* Automatically uses accessible color depending on theme

Usage:

```tsx
<AppText variant="titleMedium" color="onBackground">
  {t("study.chapter")}
</AppText>
```

---

## 3.2 `<AppButton />`

Supports:

* primary
* secondary
* tonal (MD3)
* outline
* ghost
* icon-left
* icon-only
* disabled state

### Features:

* Theme-aware styles
* Min. height 48
* Ripple/touch feedback
* Loading state

Usage:

```tsx
<AppButton mode="primary" onPress={submitDoubt}>
  {t("actions.submit")}
</AppButton>
```

---

## 3.3 `<AppCard />`

Used for:

* Widgets
* List items
* Highlight blocks

Features:

* Rounded corners via radius tokens
* Elevation levels
* Outlined / elevated variants

Usage:

```tsx
<AppCard>
  <AppText variant="titleMedium">{t("dashboard.todayClasses")}</AppText>
</AppCard>
```

---

## 3.4 `<AppInput />`

Used for:

* Doubt submission
* Notes
* Admin text fields

Features:

* MD3 text field styling
* Error state
* Helper text
* Icons

---

## 3.5 `<AppIcon />`

Wrapper for all icons.

Supports:

* MaterialCommunityIcons
* Local icon sets
* Dynamic color from theme

---

## 3.6 `<AppChip />`

Used for:

* Filters
* Tags
* Mini actions

Variants:

* filled
* outlined
* selectable

---

## 3.7 `<AppDivider />`

Simple horizontal line using MD3 color surface variants.

---

# 4. 🔧 Layout Components

Stored in:

```
src/ui/layout/
```

Provide clean layout primitives.

---

## 4.1 `<Row />`

Horizontal layout:

```tsx
<Row align="center" justify="space-between">
  <AppText>Title</AppText>
  <AppButton>Action</AppButton>
</Row>
```

---

## 4.2 `<Column />`

Vertical layout with automatic spacing:

```tsx
<Column gap="md">
  <AppText>Line 1</AppText>
  <AppText>Line 2</AppText>
</Column>
```

---

## 4.3 `<Spacer />`

Acts as a flexible space.

---

## 4.4 `<ScreenSection />`

Standardized screen block with padding:

```tsx
<ScreenSection title={t("doubts.recent")}>
  <DoubtList />
</ScreenSection>
```

---

# 5. 🖼 Screen Templates

Each feature screen must follow a consistent structure:

* `<AppScaffold />` = wrapper with:

  * SafeAreaView
  * ScrollView or FlatList
  * Background
  * HeaderBar (if needed)

### Template:

```
AppScaffold
  Header
  Content (widgets or list)
  FloatingActions (optional)
```

Components:

```
src/ui/screen/
  AppScaffold.tsx
  HeaderBar.tsx
  ScreenContainer.tsx
```

---

# 6. 📦 Widget Container

The widget system integrates with UI components.

Every widget uses:

```tsx
<WidgetContainer titleKey="..." icon="..." isLoading={...}>
  <WidgetContent />
</WidgetContainer>
```

### WidgetContainer responsibilities:

* Card with theme-aware color & radius
* Padding from spacing tokens
* Title translated via `titleKey`
* Optional actions (View All, CTA)
* Skeleton while loading
* Fallback during error states
* Offline indicator

This ensures **consistent widget look & feel** across customers.

---

# 7. 🛡 Accessibility Standards (UI-specific)

All UI components must:

* Support font scaling
* Use accessible color contrasts
* Use MD3 large tap targets (48dp)
* Provide `accessibilityLabel` when needed
* Properly announce state changes

This aligns with:

```
docs/ACCESSIBILITY_GUIDELINES.md
```

---

# 8. 🧪 Testing UI Components

Testing guidelines:

### Unit Tests:

* AppButton modes render correct colors
* AppText picks right variant
* WidgetContainer handles loading/error states

### Snapshot tests:

* For common layouts
* For key widgets

### Visual QA:

* Different tenant themes must preserve contrast and spacing
* RTL/i18n support

---

# 9. 🔧 Developer Guidelines (VERY IMPORTANT)

### Do NOT:

* Use raw `<Text>` or `<View>` with custom styles
* Hardcode colors
* Hardcode spacing like `margin: 12`
* Use inline styles with random values
* Create feature-specific UI that duplicates existing components

### DO:

* Always use `<AppText />` for text
* Use `<AppButton />` for all interactive actions
* Use `<AppCard />` for grouping content
* Use spacing tokens everywhere
* Use WidgetContainer for dashboard widgets
* Apply translation via `t()`
* Follow screen template standards

This ensures a **consistent, professional UI** across the entire product.

---

# 10. 🏁 Summary

The Mansuhi UI Component System provides:

* A unified, theme-aware design language
* Fully reusable components
* MD3-powered styling
* Per-customer theming support
* Consistent, accessible UI
* Faster development for all features
* Zero “custom-styled” screens that break consistency

This is the **foundation** of all UI building in Mansuhi.

```
End of UI_COMPONENT_SYSTEM.md
```


