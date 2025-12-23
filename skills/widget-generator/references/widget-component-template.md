# Widget Component Template

## Complete Widget Component

Location: `src/components/widgets/{category}/{WidgetName}Widget.tsx`

```tsx
import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Types
import type { WidgetProps } from "../../../types/widget.types";

// Theme (REQUIRED - never use hardcoded colors)
import { useAppTheme } from "../../../theme/useAppTheme";

// Translations (REQUIRED)
import { useTranslation } from "react-i18next";

// Localized content helper (for database content)
import { getLocalizedField } from "../../../utils/getLocalizedField";

// Data fetching
import { use{EntityName}Query } from "../../../hooks/queries/{role}/use{EntityName}Query";

// ============================================
// WIDGET COMPONENT
// ============================================
export const {WidgetName}Widget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  userId,
  role,
}) => {
  // ============================================
  // HOOKS
  // ============================================
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");

  // ============================================
  // CONFIG (with defaults - CRITICAL)
  // ============================================
  const maxItems = (config?.maxItems as number) || 5;
  const showIcon = config?.showIcon !== false;  // default true
  const layoutStyle = (config?.layoutStyle as "list" | "cards" | "grid") || "list";
  const showViewAll = config?.showViewAll !== false;

  // ============================================
  // DATA FETCHING
  // ============================================
  const { data, isLoading, error, refetch } = use{EntityName}Query({
    limit: maxItems,
  });

  // ============================================
  // HANDLERS
  // ============================================
  const handleItemPress = (itemId: string) => {
    onNavigate?.("{detail-screen}", { id: itemId });
  };

  const handleViewAll = () => {
    onNavigate?.("{list-screen}");
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.{widgetKey}.states.loading", { defaultValue: "Loading..." })}
        </AppText>
      </View>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={[styles.stateText, { color: colors.error }]}>
          {t("widgets.{widgetKey}.states.error", { defaultValue: "Failed to load" })}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryButton, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>
            {t("common:actions.retry", { defaultValue: "Retry" })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (!data?.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="inbox-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.{widgetKey}.states.empty", { defaultValue: "No items yet" })}
        </AppText>
      </View>
    );
  }

  // ============================================
  // SUCCESS STATE - RENDER CONTENT
  // ============================================
  const renderItem = (item: any, index: number) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleItemPress(item.id)}
      style={[
        styles.item,
        {
          backgroundColor: colors.surfaceVariant,
          borderRadius: borderRadius.medium,
        },
      ]}
      activeOpacity={0.7}
    >
      {showIcon && (
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
          <Icon name="star" size={18} color={colors.primary} />
        </View>
      )}

      <View style={styles.itemContent}>
        {/* Use getLocalizedField for database content */}
        <AppText style={[styles.itemTitle, { color: colors.onSurface }]} numberOfLines={1}>
          {getLocalizedField(item, 'title')}
        </AppText>

        {item.description_en && (
          <AppText style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
            {getLocalizedField(item, 'description')}
          </AppText>
        )}
      </View>

      <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
    </TouchableOpacity>
  );

  // Layout rendering based on config
  const renderLayout = () => {
    switch (layoutStyle) {
      case "cards":
        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
          >
            {data.slice(0, maxItems).map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleItemPress(item.id)}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderRadius: borderRadius.large,
                  },
                ]}
              >
                {showIcon && (
                  <Icon name="star" size={24} color={colors.primary} />
                )}
                <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
                  {getLocalizedField(item, 'title')}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case "grid":
        return (
          <View style={styles.gridContainer}>
            {data.slice(0, maxItems).map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleItemPress(item.id)}
                style={[
                  styles.gridItem,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderRadius: borderRadius.medium,
                  },
                ]}
              >
                {showIcon && (
                  <Icon name="star" size={20} color={colors.primary} />
                )}
                <AppText style={[styles.gridTitle, { color: colors.onSurface }]} numberOfLines={2}>
                  {getLocalizedField(item, 'title')}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "list":
      default:
        return (
          <View style={styles.listContainer}>
            {data.slice(0, maxItems).map(renderItem)}
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderLayout()}

      {/* View All Button */}
      {showViewAll && data.length > maxItems && (
        <TouchableOpacity
          onPress={handleViewAll}
          style={[styles.viewAllButton, { borderColor: colors.outline }]}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.{widgetKey}.actions.viewAll", { defaultValue: "View All" })}
          </AppText>
          <Icon name="arrow-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    gap: 12,
  },

  // State containers
  stateContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  stateText: {
    fontSize: 13,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },

  // List layout
  listContainer: {
    gap: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemSubtitle: {
    fontSize: 12,
  },

  // Cards layout
  cardsContainer: {
    gap: 12,
    paddingRight: 4,
  },
  card: {
    width: 120,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },

  // Grid layout
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gridItem: {
    width: "48%",
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },

  // View All
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "500",
  },
});

// AppText component (use your UI library's text component)
const AppText = ({ style, children, numberOfLines }: any) => (
  <Text style={style} numberOfLines={numberOfLines}>
    {children}
  </Text>
);
```

## Config Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxItems` | number | 5 | Maximum items to display |
| `showIcon` | boolean | true | Show item icons |
| `layoutStyle` | "list" \| "cards" \| "grid" | "list" | Layout style |
| `showViewAll` | boolean | true | Show "View All" button |
| `showDate` | boolean | true | Show date on items |
| `showBadge` | boolean | true | Show status badges |

## Reading Config Pattern

Always provide defaults when reading config:

```typescript
// Boolean (default true)
const showIcon = config?.showIcon !== false;

// Boolean (default false)
const showDate = config?.showDate === true;

// Number with default
const maxItems = (config?.maxItems as number) || 5;

// String with default
const layoutStyle = (config?.layoutStyle as string) || "list";

// Enum with type safety
const layout = (config?.layoutStyle as "list" | "cards" | "grid") || "list";
```

## Theme Colors Quick Reference

```typescript
const { colors, borderRadius } = useAppTheme();

// Text
colors.onSurface        // Primary text
colors.onSurfaceVariant // Secondary text

// Backgrounds
colors.surface          // Card background
colors.surfaceVariant   // Item background
colors.background       // Screen background

// Brand/Status
colors.primary          // Primary actions/icons
colors.success          // Success states (green)
colors.warning          // Warning states (orange)
colors.error            // Error states (red)
colors.info             // Info states (blue)

// Borders
colors.outline          // Visible borders
colors.outlineVariant   // Subtle borders

// Opacity backgrounds
`${colors.primary}15`   // 15 = ~9% opacity
`${colors.success}20`   // 20 = ~12% opacity
```

## Localization Pattern

```typescript
// Static UI text (buttons, labels)
const { t } = useTranslation("dashboard");
<Text>{t("widgets.myWidget.title")}</Text>

// Dynamic content from database
import { getLocalizedField } from "../../../utils/getLocalizedField";
<Text>{getLocalizedField(item, 'title')}</Text>
// Reads item.title_en or item.title_hi based on current language
```

## Navigation Pattern

```typescript
// Navigate to detail screen with params
onNavigate?.("item-detail", { id: item.id });

// Navigate to list screen
onNavigate?.("items-list");

// Navigate with multiple params
onNavigate?.("filtered-list", { category: "active", sort: "date" });
```
