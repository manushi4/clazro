import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useParentQuickActionsQuery, QuickActionRecord, QuickActionColor } from "../../../hooks/queries/parent/useParentQuickActionsQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "parent.quick-actions";

export const ParentQuickActionsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const { data: actions, isLoading, error } = useParentQuickActionsQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options matching Platform Studio
  const columns = (config?.columns as number) || 2;
  const showLabels = config?.showLabels !== false;
  const iconSize = (config?.iconSize as "small" | "medium" | "large") || "medium";
  const style = (config?.style as "filled" | "outlined" | "minimal") || "filled";
  const maxActions = (config?.maxActions as number) || 6;
  const enableTap = config?.enableTap !== false;

  const getIconSize = () => {
    switch (iconSize) {
      case "small": return 20;
      case "large": return 32;
      default: return 26;
    }
  };

  const getActionColor = (colorKey: QuickActionColor) => {
    const colorMap: Record<QuickActionColor, string> = {
      primary: colors.primary,
      secondary: colors.secondary || colors.primary,
      tertiary: colors.tertiary || colors.info,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
    };
    return colorMap[colorKey] || colors.primary;
  };


  const handleActionPress = (action: QuickActionRecord) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "action_tap", actionId: action.action_id, route: action.route });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_action_tap`, level: "info", data: { actionId: action.action_id } });
    onNavigate?.(action.route);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.quickActions.states.loading")}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.quickActions.states.error")}
        </AppText>
      </View>
    );
  }

  const displayActions = (actions || []).slice(0, maxActions);

  if (displayActions.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="gesture-tap" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.quickActions.states.empty")}
        </AppText>
      </View>
    );
  }

  const renderAction = (action: QuickActionRecord, index: number) => {
    const actionColor = getActionColor(action.color);
    const isCompact = size === "compact";

    const getButtonStyle = () => {
      switch (style) {
        case "outlined":
          return {
            backgroundColor: "transparent",
            borderWidth: 1.5,
            borderColor: actionColor,
          };
        case "minimal":
          return {
            backgroundColor: `${actionColor}10`,
            borderWidth: 0,
          };
        default: // filled
          return {
            backgroundColor: `${actionColor}15`,
            borderWidth: 0,
          };
      }
    };

    return (
      <TouchableOpacity
        key={action.id}
        style={[
          styles.actionButton,
          getButtonStyle(),
          { 
            borderRadius: borderRadius.medium,
            width: `${100 / columns - 2}%`,
          },
          isCompact && styles.actionButtonCompact,
        ]}
        onPress={() => handleActionPress(action)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrapper, style === "filled" && { backgroundColor: `${actionColor}20` }]}>
          <Icon name={action.icon} size={getIconSize()} color={actionColor} />
        </View>
        {showLabels && (
          <AppText
            style={[
              styles.actionLabel,
              { color: style === "outlined" ? actionColor : colors.onSurface },
              isCompact && styles.actionLabelCompact,
            ]}
            numberOfLines={1}
          >
            {getLocalizedField(action, "label")}
          </AppText>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { gap: columns === 3 ? 8 : 10 }]}>
      <View style={[styles.actionsGrid, { gap: columns === 3 ? 8 : 10 }]}>
        {displayActions.map((action, index) => renderAction(action, index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" },
  actionButton: { alignItems: "center", paddingVertical: 16, paddingHorizontal: 8, marginBottom: 8, gap: 8 },
  actionButtonCompact: { paddingVertical: 12, gap: 6 },
  iconWrapper: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  actionLabelCompact: { fontSize: 11 },
  loadingContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 12 },
  loadingText: { fontSize: 14 },
  errorContainer: { padding: 24, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 10 },
  errorText: { fontSize: 14, fontWeight: "500" },
  emptyContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
});
