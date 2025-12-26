import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import type { WidgetMetadata, WidgetSize } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { addBreadcrumb } from "../../../error/sentry";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { LayoutSettings } from "../../../services/config/configService";

type CustomProps = {
  accentColor?: string;
  showHeader?: boolean;
  borderRadius?: number;
  shadow?: "none" | "small" | "medium";
  showChevron?: boolean; // Show right arrow (only if widget is tappable)
};

type Props = {
  metadata: WidgetMetadata;
  size?: WidgetSize;
  children: React.ReactNode;
  customProps?: CustomProps;
  layoutSettings?: LayoutSettings;
};

// Size-based styling
const SIZE_CONFIG = {
  compact: {
    padding: 12,
    titleSize: 14,
    subtitleSize: 11,
    iconSize: 18,
    minHeight: 80,
  },
  standard: {
    padding: 16,
    titleSize: 16,
    subtitleSize: 12,
    iconSize: 22,
    minHeight: 120,
  },
  expanded: {
    padding: 20,
    titleSize: 18,
    subtitleSize: 14,
    iconSize: 26,
    minHeight: 180,
  },
};

// Widget icon mapping
const WIDGET_ICONS: Record<string, string> = {
  "hero.greeting": "hand-wave",
  "schedule.today": "calendar-today",
  "actions.quick": "lightning-bolt",
  "assignments.pending": "clipboard-text",
  "doubts.inbox": "chat-question",
  "progress.snapshot": "chart-arc",
  "progress.subject-wise": "book-open-page-variant",
  "progress.streak": "fire",
  "stats.grid": "view-grid",
  "quests.active": "flag-checkered",
  "peers.leaderboard": "trophy",
  "continue.learning": "book-clock",
  "ai.recommendations": "robot",
  "ai.tutor-chat": "robot-happy",
  "feed.class": "bulletin-board",
  "peers.groups": "account-group",
  "profile.card": "account-circle",
  "profile.quickLinks": "link-variant",
  "profile.stats": "chart-box-outline",
  "profile.achievements": "trophy",
  "profile.activity": "history",
};

export const WidgetContainer: React.FC<Props> = ({
  metadata,
  size = "standard",
  children,
  customProps = {},
  layoutSettings,
}) => {
  const { colors, borderRadius, elevation, componentStyles } = useAppTheme();
  const { t } = useTranslation("dashboard");

  const config = SIZE_CONFIG[size] || SIZE_CONFIG.standard;
  const widgetIcon = WIDGET_ICONS[metadata.id] || "widgets";

  // Apply layout settings (from Platform Studio) with fallbacks
  const containerStyle = layoutSettings?.containerStyle || "card";
  const showShadow = layoutSettings?.showShadow ?? true;
  const layoutBorderRadius = layoutSettings?.borderRadius ?? 12;

  // Style flags
  const isFlat = containerStyle === "flat";
  const isSeamless = containerStyle === "seamless";

  // Apply custom props with defaults (widget-level overrides)
  const accent = customProps.accentColor || colors.primary;
  // For seamless: show inline title (smaller, integrated), not separate header
  const showHeader = isSeamless ? false : (customProps.showHeader !== false);
  const showInlineTitle = isSeamless; // Show title inline with content for seamless
  const cardRadius = customProps.borderRadius ?? layoutBorderRadius;
  const shadowStyle = (showShadow && !isFlat && !isSeamless) ? (customProps.shadow || "small") : "none";
  const showChevron = customProps.showChevron === true; // Default false - only show if explicitly enabled

  const title = (metadata.titleKey && t(metadata.titleKey)) || metadata.name || metadata.id;
  const subtitle = (metadata.descriptionKey && t(metadata.descriptionKey)) || metadata.description;

  React.useEffect(() => {
    addBreadcrumb({
      category: "widget",
      message: "widget_render",
      level: "info",
      data: { widgetId: metadata.id, size },
    });
  }, [metadata.id, size]);

  const showSubtitle = size !== "compact" && subtitle;

  // Shadow styles based on customProps and layout style
  const getShadowStyle = () => {
    // No shadow for flat or seamless style
    if (isFlat || isSeamless || shadowStyle === "none") return {};
    if (shadowStyle === "medium") {
      return Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
        android: { elevation: 6 },
      });
    }
    // Default: small
    return Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
    });
  };

  // For seamless: minimal horizontal padding only, for flat: slightly reduced
  const effectivePadding = isSeamless ? 0 : (isFlat ? Math.max(config.padding - 4, 8) : config.padding);
  const horizontalPadding = isSeamless ? 16 : 0; // Consistent edge margins for seamless

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isSeamless ? "transparent" : colors.surface,
          borderRadius: (isFlat || isSeamless) ? 0 : cardRadius,
          padding: effectivePadding,
          paddingHorizontal: horizontalPadding,
          minHeight: (isFlat || isSeamless) ? undefined : config.minHeight, // No min height for flat/seamless
          borderWidth: (isFlat || isSeamless) ? 0 : 1,
          borderColor: (isFlat || isSeamless) ? "transparent" : colors.outlineVariant,
          // For flat style only, add subtle bottom border
          ...(isFlat && !isSeamless && {
            borderBottomWidth: 1,
            borderBottomColor: colors.outlineVariant,
          }),
          ...getShadowStyle(),
        },
      ]}
    >
      {/* Visual flow connector - subtle left border for seamless */}
      {isSeamless && (
        <View
          style={[
            styles.flowConnector,
            { backgroundColor: `${accent}30` },
          ]}
        />
      )}

      {/* Accent bar at top - hide for flat/seamless style */}
      {!isFlat && !isSeamless && (
        <View
          style={[
            styles.accentBar,
            {
              backgroundColor: accent,
              borderTopLeftRadius: cardRadius,
              borderTopRightRadius: cardRadius,
            },
          ]}
        />
      )}

      {/* Inline section title for seamless style */}
      {showInlineTitle && title && (
        <View style={styles.inlineTitleContainer}>
          <AppText
            style={[
              styles.inlineTitle,
              { color: colors.onSurfaceVariant },
            ]}
          >
            {title}
          </AppText>
        </View>
      )}

      {showHeader && (
        <View style={styles.header}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${accent}15` }]}>
            <Icon name={widgetIcon} size={config.iconSize} color={accent} />
          </View>

          {/* Title & Subtitle */}
          <View style={styles.titleContainer}>
            <AppText
              variant="title"
              style={[styles.title, { color: colors.onSurface, fontSize: config.titleSize }]}
              numberOfLines={1}
            >
              {title}
            </AppText>
            {showSubtitle && (
              <AppText
                style={[styles.subtitle, { color: colors.onSurfaceVariant, fontSize: config.subtitleSize }]}
                numberOfLines={1}
              >
                {subtitle}
              </AppText>
            )}
          </View>

          {/* Optional action button - only show if widget is tappable */}
          {showChevron && (
            <View style={styles.actionContainer}>
              <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
            </View>
          )}
        </View>
      )}

      {/* Widget content */}
      <View style={[styles.content, !showHeader && { marginTop: 0 }]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    // marginBottom removed - now controlled by gap in parent
    overflow: "hidden",
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  flowConnector: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  inlineTitleContainer: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  inlineTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingTop: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 2,
  },
  actionContainer: {
    padding: 4,
  },
  content: {
    marginTop: 8,
  },
});
