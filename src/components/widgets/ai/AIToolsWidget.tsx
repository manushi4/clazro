/**
 * AI Tools Widget (ai.tools)
 * Shows AI-powered learning tools like AI Tutor, Practice Generator, etc.
 * Follows Widget Development Guide phases 1-7
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useAIToolsQuery, type AITool } from "../../../hooks/queries/useAIToolsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "ai.tools";

export const AIToolsWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = useAIToolsQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options with defaults
  const maxTools = (config?.maxTools as number) || (size === "compact" ? 4 : 6);
  const layoutStyle = (config?.layoutStyle as string) || "grid";
  const showDescription = config?.showDescription !== false && size !== "compact";
  const showIcon = config?.showIcon !== false;
  const enableTap = config?.enableTap !== false;
  const columns = (config?.columns as number) || 2;

  // Color mapping using theme colors
  const getToolColor = (colorKey: string) => {
    const colorMap: Record<string, string> = {
      primary: colors.primary,
      secondary: colors.secondary,
      tertiary: colors.tertiary,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
    };
    return colorMap[colorKey] || colors.primary;
  };

  // Event handlers
  const handleToolPress = (tool: AITool) => {
    if (!isOnline && tool.requires_online) {
      // Show offline message for online-only tools
      return;
    }
    trackWidgetEvent(WIDGET_ID, "click", { action: "tool_tap", toolKey: tool.tool_key });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_tool_tap`, level: "info", data: { toolKey: tool.tool_key } });
    onNavigate?.(tool.route);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("ai-hub");
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.aiTools.states.loading")}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.stateText, { color: colors.onSurface }]}>
          {t("widgets.aiTools.states.error")}
        </AppText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]}
          onPress={() => refetch()}
        >
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.aiTools.actions.retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="robot-off" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.aiTools.states.empty")}
        </AppText>
      </View>
    );
  }

  const displayTools = data.slice(0, maxTools);

  // Render tool item
  const renderToolItem = (tool: AITool, index: number) => {
    const toolColor = getToolColor(tool.color);
    const isDisabled = !isOnline && tool.requires_online;

    return (
      <TouchableOpacity
        key={tool.id}
        style={[
          layoutStyle === "grid" ? styles.gridItem : styles.listItem,
          { 
            backgroundColor: colors.surfaceVariant, 
            borderRadius: borderRadius.medium,
            opacity: isDisabled ? 0.5 : 1,
          },
        ]}
        onPress={enableTap ? () => handleToolPress(tool) : undefined}
        disabled={!enableTap || isDisabled}
        activeOpacity={0.7}
      >
        {showIcon && (
          <View style={[styles.iconContainer, { backgroundColor: `${toolColor}15` }]}>
            <Icon name={tool.icon} size={layoutStyle === "grid" ? 24 : 20} color={toolColor} />
          </View>
        )}
        <View style={layoutStyle === "grid" ? styles.gridContent : styles.listContent}>
          <AppText 
            style={[
              layoutStyle === "grid" ? styles.gridTitle : styles.listTitle, 
              { color: colors.onSurface }
            ]} 
            numberOfLines={1}
          >
            {getLocalizedField(tool, "title")}
          </AppText>
          {showDescription && (
            <AppText 
              style={[styles.description, { color: colors.onSurfaceVariant }]} 
              numberOfLines={layoutStyle === "grid" ? 2 : 1}
            >
              {getLocalizedField(tool, "description")}
            </AppText>
          )}
        </View>
        {layoutStyle === "list" && (
          <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />
        )}
        {isDisabled && (
          <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
            <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Offline indicator */}
      {!isOnline && (
        <View style={[styles.offlineBar, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}>
          <Icon name="cloud-off-outline" size={14} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
            {t("common:offline")} - {t("widgets.aiTools.offlineNote")}
          </AppText>
        </View>
      )}

      {/* Grid Layout */}
      {layoutStyle === "grid" && (
        <View style={[styles.gridContainer, { gap: 10 }]}>
          {displayTools.map((tool, index) => renderToolItem(tool, index))}
        </View>
      )}

      {/* List Layout */}
      {layoutStyle === "list" && (
        <View style={styles.listContainer}>
          {displayTools.map((tool, index) => renderToolItem(tool, index))}
        </View>
      )}

      {/* Cards Layout - Horizontal Scroll */}
      {layoutStyle === "cards" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {displayTools.map((tool, index) => {
            const toolColor = getToolColor(tool.color);
            const isDisabled = !isOnline && tool.requires_online;

            return (
              <TouchableOpacity
                key={tool.id}
                style={[
                  styles.cardItem,
                  { 
                    backgroundColor: colors.surfaceVariant, 
                    borderRadius: borderRadius.medium,
                    opacity: isDisabled ? 0.5 : 1,
                  },
                ]}
                onPress={enableTap ? () => handleToolPress(tool) : undefined}
                disabled={!enableTap || isDisabled}
                activeOpacity={0.7}
              >
                {showIcon && (
                  <View style={[styles.cardIconContainer, { backgroundColor: `${toolColor}15` }]}>
                    <Icon name={tool.icon} size={28} color={toolColor} />
                  </View>
                )}
                <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={1}>
                  {getLocalizedField(tool, "title")}
                </AppText>
                {showDescription && (
                  <AppText style={[styles.cardDescription, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                    {getLocalizedField(tool, "description")}
                  </AppText>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* View All Button */}
      {enableTap && data.length > maxTools && (
        <TouchableOpacity
          style={[styles.viewAllButton, { borderColor: colors.outline }]}
          onPress={handleViewAll}
          activeOpacity={0.7}
        >
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.aiTools.actions.viewAll", { count: data.length })}
          </AppText>
          <Icon name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: { gap: 12 },
  centerContainer: { alignItems: "center", justifyContent: "center", padding: 24 },
  stateText: { fontSize: 13, marginTop: 8, textAlign: "center" },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
  retryText: { fontSize: 13, fontWeight: "600" },

  // Offline indicators
  offlineBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  offlineText: { fontSize: 11 },
  offlineBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    padding: 2,
    borderRadius: 4,
  },

  // Grid layout
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridItem: {
    width: "48%",
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  gridContent: {
    alignItems: "center",
    gap: 4,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  // List layout
  listContainer: { gap: 8 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  listContent: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Cards layout
  cardsContainer: { gap: 12, paddingRight: 4 },
  cardItem: {
    width: 130,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 10,
    textAlign: "center",
  },

  // Common
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    fontSize: 11,
  },

  // View all button
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    marginTop: 4,
  },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
