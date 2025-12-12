import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useQuickActionsQuery } from "../../../hooks/queries/useQuickActionsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "actions.quick";

type QuickActionDisplay = {
  id: string;
  action_id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  route: string;
  requiresOnline?: boolean;
};

// Fallback action definitions when database is empty
const FALLBACK_ACTIONS = [
  { id: "study", action_id: "study_material", label: "Study", icon: "book-open-variant", colorKey: "primary", route: "study-hub" },
  { id: "ask", action_id: "ask_doubt", label: "Ask Doubt", icon: "chat-question", colorKey: "success", route: "ask-doubt", requiresOnline: true },
  { id: "test", action_id: "take_test", label: "Take Test", icon: "clipboard-check", colorKey: "warning", route: "tests", requiresOnline: true },
  { id: "live", action_id: "live_class", label: "Live Class", icon: "video", colorKey: "tertiary", route: "live-classes", requiresOnline: true },
];

export const QuickActionsWidget: React.FC<WidgetProps> = ({ 
  onNavigate, 
  config,
  size = "standard",
  role = "student",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  
  // Fetch quick actions from database
  const { data: dbActions, isLoading, error } = useQuickActionsQuery(role);

  // Track widget render
  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Size-aware config
  const layoutStyle = (config?.layoutStyle as string) || "grid";
  const columns = parseInt((config?.columns as string) || (size === "compact" ? "4" : "2"));
  const showLabels = config?.showLabels !== false && size !== "compact";
  const iconSize = (config?.iconSize as string) || (size === "compact" ? "small" : "medium");
  const useCustomColors = config?.useCustomColors !== false;

  // Resolve colors from theme
  const getActionColor = (colorKey: string) => {
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

  // Build actions from database or fallback
  const visibleActions: QuickActionDisplay[] = (dbActions && dbActions.length > 0)
    ? dbActions.map(action => ({
        id: action.id,
        action_id: action.action_id,
        label: getLocalizedField(action, 'label'), // Uses current language
        icon: action.icon,
        color: action.color || colors.primary,
        bgColor: (action.color || colors.primary) + "15",
        route: action.route,
        requiresOnline: action.requires_online,
      }))
    : FALLBACK_ACTIONS.map(def => ({
        id: def.id,
        action_id: def.action_id,
        label: t(`widgets.quickActions.${def.id}`, { defaultValue: def.label }),
        icon: def.icon,
        color: getActionColor(def.colorKey),
        bgColor: getActionColor(def.colorKey) + "15",
        route: def.route,
        requiresOnline: def.requiresOnline,
      }));

  const handleActionPress = (action: QuickActionDisplay) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: action.action_id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_action_tap`, level: "info", data: { actionId: action.action_id } });
    onNavigate?.(action.route);
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Calculate button width based on columns
  const screenWidth = Dimensions.get("window").width;
  const containerPadding = 32;
  const gap = 10;
  const availableWidth = screenWidth - containerPadding - (gap * (columns - 1));
  const buttonWidth = availableWidth / columns;

  // Icon sizes
  const iconSizes = { small: 20, medium: 24, large: 32 };
  const circleSizes = { small: 40, medium: 48, large: 56 };
  const currentIconSize = iconSizes[iconSize as keyof typeof iconSizes] || 24;
  const currentCircleSize = circleSizes[iconSize as keyof typeof circleSizes] || 48;

  // Empty state (no actions visible)
  if (!visibleActions.length) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="gesture-tap" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.quickActions.states.empty", { defaultValue: "No quick actions available" })}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Offline indicator */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
            {t("common:offline", { defaultValue: "Some actions unavailable" })}
          </AppText>
        </View>
      )}

      {/* Cards layout - horizontal scroll */}
      {layoutStyle === "cards" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {visibleActions.map((action) => {
            const isDisabled = !isOnline && action.requiresOnline;
            return (
              <TouchableOpacity
                key={action.id}
                style={[styles.cardItem, { backgroundColor: useCustomColors ? action.bgColor : colors.surfaceVariant, opacity: isDisabled ? 0.5 : 1 }]}
                onPress={() => handleActionPress(action)}
                activeOpacity={0.7}
                disabled={isDisabled}
              >
                <View style={[styles.cardIcon, { backgroundColor: useCustomColors ? `${action.color}20` : `${colors.primary}20` }]}>
                  <Icon name={action.icon} size={28} color={useCustomColors ? action.color : colors.primary} />
                </View>
                {showLabels && <AppText style={[styles.cardLabel, { color: colors.onSurface }]}>{action.label}</AppText>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* List layout - vertical list */}
      {layoutStyle === "list" && (
        <View style={styles.listContainer}>
          {visibleActions.map((action) => {
            const isDisabled = !isOnline && action.requiresOnline;
            return (
              <TouchableOpacity
                key={action.id}
                style={[styles.listItem, { backgroundColor: useCustomColors ? action.bgColor : colors.surfaceVariant, opacity: isDisabled ? 0.5 : 1 }]}
                onPress={() => handleActionPress(action)}
                activeOpacity={0.7}
                disabled={isDisabled}
              >
                <View style={[styles.listIcon, { backgroundColor: useCustomColors ? `${action.color}20` : `${colors.primary}20` }]}>
                  <Icon name={action.icon} size={20} color={useCustomColors ? action.color : colors.primary} />
                </View>
                <AppText style={[styles.listLabel, { color: colors.onSurface }]}>{action.label}</AppText>
                <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Default grid layout */}
      {(layoutStyle === "grid" || !["cards", "list"].includes(layoutStyle)) && (
        <View style={[styles.grid, { gap }]}>
          {visibleActions.map((action) => {
            const isDisabled = !isOnline && action.requiresOnline;
            return (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionButton,
                  { 
                    backgroundColor: useCustomColors ? action.bgColor : colors.surfaceVariant,
                    width: buttonWidth - gap/2,
                    minWidth: buttonWidth - gap/2,
                    opacity: isDisabled ? 0.5 : 1,
                  }
                ]}
                onPress={() => handleActionPress(action)}
                activeOpacity={0.7}
                disabled={isDisabled}
              >
                <View style={[
                  styles.iconCircle, 
                  { 
                    backgroundColor: useCustomColors ? `${action.color}20` : `${colors.primary}20`,
                    width: currentCircleSize,
                    height: currentCircleSize,
                    borderRadius: currentCircleSize / 2,
                  }
                ]}>
                  <Icon name={action.icon} size={currentIconSize} color={useCustomColors ? action.color : colors.primary} />
                </View>
                {showLabels && (
                  <AppText style={[styles.actionLabel, { color: colors.onSurface }]}>
                    {action.label}
                  </AppText>
                )}
                {isDisabled && <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} style={styles.offlineIcon} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  // Grid layout (default)
  grid: { flexDirection: "row", flexWrap: "wrap" },
  actionButton: { alignItems: "center", paddingVertical: 16, paddingHorizontal: 8, borderRadius: 12, gap: 8, position: "relative" },
  iconCircle: { alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  offlineIcon: { position: "absolute", top: 8, right: 8 },
  // Cards layout
  cardsContainer: { gap: 12, paddingRight: 4 },
  cardItem: { width: 100, padding: 16, borderRadius: 16, alignItems: "center", gap: 10 },
  cardIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardLabel: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  // List layout
  listContainer: { gap: 8 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, gap: 12 },
  listIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  listLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  // Common
  emptyContainer: { alignItems: "center", padding: 20, gap: 8 },
  emptyText: { fontSize: 13, textAlign: "center" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
  loadingContainer: { alignItems: "center", justifyContent: "center", padding: 40 },
});
