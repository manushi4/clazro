import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import type { WidgetMetadata, WidgetSize } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { addBreadcrumb } from "../../../error/sentry";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

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
}) => {
  const { colors, borderRadius, elevation, componentStyles } = useAppTheme();
  const { t } = useTranslation("dashboard");

  const config = SIZE_CONFIG[size] || SIZE_CONFIG.standard;
  const widgetIcon = WIDGET_ICONS[metadata.id] || "widgets";
  
  // Apply custom props with defaults
  const accent = customProps.accentColor || colors.primary;
  const showHeader = customProps.showHeader !== false; // Default true
  const cardRadius = customProps.borderRadius ?? borderRadius.large;
  const shadowStyle = customProps.shadow || "small";
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

  // Shadow styles based on customProps
  const getShadowStyle = () => {
    if (shadowStyle === "none") return {};
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

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: cardRadius,
          padding: config.padding,
          minHeight: config.minHeight,
          borderWidth: 1,
          borderColor: colors.outlineVariant,
          ...getShadowStyle(),
        },
      ]}
    >
      {/* Accent bar at top */}
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
    marginBottom: 8, // Reduced from 12 for tighter spacing
    overflow: "hidden",
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
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
