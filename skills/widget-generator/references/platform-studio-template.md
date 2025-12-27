# Platform Studio Template

## Overview

Platform Studio requires updates in TWO files:
1. **Widget Registry** - Widget metadata
2. **Widget Properties Panel** - Config schema for the properties editor

## 1. Widget Registry

Location: `platform-studio/src/config/widgetRegistry.ts`

```typescript
export const widgetRegistry: Record<string, WidgetMetadata> = {
  // ... existing widgets

  "{widget.id}": {
    id: "{widget.id}",
    name: "{Widget Display Name}",
    description: "{Brief description of widget purpose}",
    category: "{category}",
    icon: "{icon-name}",  // lucide-react icon name
    allowedRoles: ["student", "teacher", "parent", "admin"],
    allowedScreenTypes: ["dashboard", "hub"],
    supportedSizes: ["compact", "standard", "expanded"],
    defaultSize: "standard",
    requiredFeatureId: "{feature.id}",  // Optional
  },
};
```

### Icon Names (lucide-react)

Common icons for widgets:
- Schedule: `calendar`, `clock`, `calendar-days`
- Study: `book-open`, `library`, `notebook`
- Assessment: `clipboard-list`, `file-text`, `check-square`
- Progress: `trending-up`, `bar-chart`, `target`
- Doubts: `help-circle`, `message-circle`, `message-square`
- AI: `sparkles`, `brain`, `wand-2`
- Profile: `user`, `settings`, `heart`
- Actions: `zap`, `grid`, `layout-grid`
- Parent: `users`, `baby`, `shield`
- Admin: `shield`, `database`, `activity`
- Finance: `wallet`, `credit-card`, `indian-rupee`

### Category Values

```typescript
type WidgetCategory =
  | "schedule"
  | "study"
  | "assessment"
  | "doubts"
  | "progress"
  | "social"
  | "ai"
  | "profile"
  | "notifications"
  | "actions"
  | "content"
  | "analytics"
  | "parent"
  | "admin"
  | "finance";
```

## 2. Config Schema (Properties Panel)

Location: `platform-studio/src/components/builder/WidgetPropertiesPanel.tsx`

Add to `WIDGET_CONFIGS` object:

```typescript
const WIDGET_CONFIGS: Record<string, WidgetConfigSchema> = {
  // ... existing configs

  "{widget.id}": {
    sections: [
      {
        title: "Display",
        icon: "layout",
        fields: [
          {
            key: "maxItems",
            label: "Max Items",
            type: "number",
            min: 1,
            max: 20,
            default: 5,
          },
          {
            key: "layoutStyle",
            label: "Layout",
            type: "select",
            options: ["list", "cards", "grid"],
            default: "list",
          },
          {
            key: "showIcon",
            label: "Show Icons",
            type: "boolean",
            default: true,
          },
        ],
      },
      {
        title: "Behavior",
        icon: "settings",
        fields: [
          {
            key: "showViewAll",
            label: "Show View All Button",
            type: "boolean",
            default: true,
          },
          {
            key: "enableTap",
            label: "Enable Item Tap",
            type: "boolean",
            default: true,
          },
        ],
      },
    ],
  },
};
```

## Config Field Types

### Boolean Field
```typescript
{
  key: "showIcon",
  label: "Show Icons",
  type: "boolean",
  default: true,
}
```

### Number Field
```typescript
{
  key: "maxItems",
  label: "Max Items",
  type: "number",
  min: 1,
  max: 20,
  step: 1,
  default: 5,
}
```

### Select Field
```typescript
{
  key: "layoutStyle",
  label: "Layout Style",
  type: "select",
  options: ["list", "cards", "grid", "timeline"],
  default: "list",
}
```

### String Field
```typescript
{
  key: "customTitle",
  label: "Custom Title",
  type: "string",
  placeholder: "Enter title...",
  maxLength: 50,
}
```

### Color Field
```typescript
{
  key: "accentColor",
  label: "Accent Color",
  type: "color",
  default: "#6366F1",
}
```

## Critical Sync Requirements

### 1. Widget ID Must Match Exactly

```
Mobile Registry:     "schedule.upcoming"
Platform Studio:     "schedule.upcoming"
Database:            "schedule.upcoming"
```

### 2. Config Keys Must Match

```typescript
// Platform Studio schema
{ key: "maxItems", default: 5 }
{ key: "showIcon", default: true }
{ key: "layoutStyle", default: "list" }

// Mobile widget reads
const maxItems = (config?.maxItems as number) || 5;
const showIcon = config?.showIcon !== false;
const layoutStyle = (config?.layoutStyle as string) || "list";
```

### 3. Default Values Must Be Identical

```typescript
// Platform Studio
{ key: "maxItems", type: "number", default: 5 }

// Mobile widget
const maxItems = (config?.maxItems as number) || 5;  // Same default!
```

### 4. Layout Options Must Match Widget Support

```typescript
// If widget only supports list and grid:
{ key: "layoutStyle", options: ["list", "grid"], default: "list" }

// NOT this (includes cards which widget doesn't support):
{ key: "layoutStyle", options: ["list", "cards", "grid"], default: "list" }
```

## Widget-Specific Layout Options

If a widget supports limited layout options, add to `WIDGET_LAYOUT_OPTIONS`:

```typescript
const WIDGET_LAYOUT_OPTIONS: Record<string, string[]> = {
  // Existing
  "profile.quickLinks": ["list", "grid"],
  "schedule.today": ["list", "timeline"],

  // Add your widget
  "{widget.id}": ["list", "cards"],
};
```

## Layout Style Widgets List

If your widget supports layout styles, add to `LAYOUT_STYLE_WIDGETS`:

```typescript
const LAYOUT_STYLE_WIDGETS = [
  "schedule.today",
  "assignments.pending",
  // Add your widget
  "{widget.id}",
];
```

## Preview Component (Optional)

If you want a custom preview in Platform Studio's device preview:

Location: `platform-studio/src/components/preview/DevicePreview.tsx`

```typescript
// Add to WIDGET_TITLES
const WIDGET_TITLES: Record<string, { title: string; subtitle: string }> = {
  // ... existing
  "{widget.id}": {
    title: "{Widget Title}",
    subtitle: "{Widget subtitle}",
  },
};

// Add to WIDGET_ICONS
const WIDGET_ICONS: Record<string, string> = {
  // ... existing
  "{widget.id}": "{emoji}",  // e.g., "📊", "📅", "✅"
};

// Add case to WidgetContent switch (optional for custom preview)
function WidgetContent({ widgetId, theme, props, size }: WidgetContentProps) {
  switch (widgetId) {
    // ... existing cases

    case "{widget.id}":
      return <{WidgetName}Preview theme={theme} props={props} />;

    // Default renders generic preview
    default:
      return <GenericWidgetPreview />;
  }
}

// Create preview component (optional)
function {WidgetName}Preview({ theme, props }: PreviewProps) {
  const maxItems = (props.maxItems as number) || 5;
  const showIcon = props.showIcon !== false;

  return (
    <div className="space-y-1.5">
      {Array.from({ length: Math.min(maxItems, 3) }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 p-2 rounded-lg"
          style={{ backgroundColor: theme.background_color || "#F5F5F5" }}
        >
          {showIcon && <span>⭐</span>}
          <span
            className="text-[8px]"
            style={{ color: theme.text_color || "#1C1B1F" }}
          >
            Item {i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
```

## Section Icons

Available icons for config sections (lucide-react):
- `layout` - Display/layout options
- `settings` - Behavior options
- `palette` - Styling options
- `type` - Content options
- `zap` - Actions
- `filter` - Filter options
- `eye` - Visibility options

## Complete Example

```typescript
// widgetRegistry.ts
"progress.weekly": {
  id: "progress.weekly",
  name: "Weekly Progress",
  description: "Shows student's weekly progress summary",
  category: "progress",
  icon: "trending-up",
  allowedRoles: ["student", "parent"],
  allowedScreenTypes: ["dashboard"],
  supportedSizes: ["compact", "standard"],
  defaultSize: "standard",
},

// WidgetPropertiesPanel.tsx
"progress.weekly": {
  sections: [
    {
      title: "Display",
      icon: "layout",
      fields: [
        { key: "showTrend", label: "Show Trend Arrow", type: "boolean", default: true },
        { key: "showPercentage", label: "Show Percentage", type: "boolean", default: true },
        { key: "compactMode", label: "Compact Mode", type: "boolean", default: false },
      ],
    },
    {
      title: "Data",
      icon: "filter",
      fields: [
        { key: "period", label: "Time Period", type: "select", options: ["week", "month", "quarter"], default: "week" },
      ],
    },
  ],
},
```
