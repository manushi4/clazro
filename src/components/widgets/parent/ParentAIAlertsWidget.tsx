import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAIAlertsQuery, AIAlert } from "../../../hooks/queries/parent/useAIAlertsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

type LayoutStyle = "list" | "cards" | "compact";

export const ParentAIAlertsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("parent");
  const { data, isLoading, error } = useAIAlertsQuery();

  // Config options with defaults
  const layoutStyle = (config?.layoutStyle as LayoutStyle) || "list";
  const maxItems = (config?.maxItems as number) || 4;
  const showDescription = config?.showDescription !== false;
  const showActionRequired = config?.showActionRequired !== false;
  const showSeverity = config?.showSeverity !== false;
  const showCriticalFirst = config?.showCriticalFirst !== false;
  const enableTap = config?.enableTap !== false;

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.aiAlerts.states.loading")}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.aiAlerts.states.error")}
        </AppText>
      </View>
    );
  }

  const alerts = data?.alerts || [];
  const displayAlerts = alerts.slice(0, maxItems);

  // Empty state
  if (displayAlerts.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="shield-check" size={40} color={colors.success} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.aiAlerts.states.empty")}
        </AppText>
        <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
          {t("widgets.aiAlerts.states.emptySubtitle")}
        </AppText>
      </View>
    );
  }

  const handleAlertPress = (alert: AIAlert) => {
    if (enableTap && alert.action_route) {
      onNavigate?.(alert.action_route, alert.action_params);
    }
  };

  const handleViewAll = () => {
    onNavigate?.("ai-alerts");
  };

  // Get alert type icon
  const getAlertIcon = (type: string, customIcon?: string | null) => {
    if (customIcon) return customIcon;
    switch (type) {
      case "academic": return "school";
      case "attendance": return "calendar-alert";
      case "behavior": return "account-alert";
      case "deadline": return "clock-alert";
      case "performance": return "chart-line-variant";
      case "engagement": return "account-clock";
      default: return "alert-circle";
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return colors.error;
      case "high": return "#F59E0B";
      case "medium": return colors.primary;
      case "low": return colors.success;
      default: return colors.onSurfaceVariant;
    }
  };

  // Get severity background
  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "critical": return `${colors.error}15`;
      case "high": return "#F59E0B15";
      case "medium": return `${colors.primary}15`;
      case "low": return `${colors.success}15`;
      default: return colors.surfaceVariant;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return t("widgets.aiAlerts.time.justNow");
    if (diffHours < 24) return t("widgets.aiAlerts.time.hoursAgo", { count: diffHours });
    if (diffDays === 1) return t("widgets.aiAlerts.time.yesterday");
    return t("widgets.aiAlerts.time.daysAgo", { count: diffDays });
  };


  // Render alert item based on layout
  const renderAlertItem = (alert: AIAlert, index: number) => {
    const severityColor = getSeverityColor(alert.severity);
    const severityBg = getSeverityBg(alert.severity);
    const iconName = getAlertIcon(alert.alert_type, alert.icon);

    if (layoutStyle === "compact") {
      return (
        <TouchableOpacity
          key={alert.id}
          style={[styles.compactItem, { backgroundColor: severityBg }]}
          onPress={() => handleAlertPress(alert)}
          disabled={!enableTap}
        >
          <View style={[styles.severityBar, { backgroundColor: severityColor }]} />
          <Icon name={iconName} size={18} color={severityColor} />
          <View style={styles.compactContent}>
            <AppText style={[styles.compactTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {getLocalizedField(alert, "title")}
            </AppText>
            <AppText style={[styles.compactTime, { color: colors.onSurfaceVariant }]}>
              {formatTimeAgo(alert.triggered_at)}
            </AppText>
          </View>
          {showSeverity && (
            <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
              <AppText style={styles.severityText}>
                {t(`widgets.aiAlerts.severity.${alert.severity}`)}
              </AppText>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (layoutStyle === "cards") {
      return (
        <TouchableOpacity
          key={alert.id}
          style={[styles.cardItem, { backgroundColor: severityBg, borderColor: severityColor, borderWidth: 1 }]}
          onPress={() => handleAlertPress(alert)}
          disabled={!enableTap}
        >
          <View style={[styles.cardHeader, { borderBottomColor: `${severityColor}30` }]}>
            <Icon name={iconName} size={20} color={severityColor} />
            {showSeverity && (
              <View style={[styles.cardSeverity, { backgroundColor: severityColor }]}>
                <AppText style={styles.cardSeverityText}>
                  {t(`widgets.aiAlerts.severity.${alert.severity}`)}
                </AppText>
              </View>
            )}
          </View>
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
            {getLocalizedField(alert, "title")}
          </AppText>
          <AppText style={[styles.cardCategory, { color: severityColor }]}>
            {alert.category}
          </AppText>
          <AppText style={[styles.cardTime, { color: colors.onSurfaceVariant }]}>
            {formatTimeAgo(alert.triggered_at)}
          </AppText>
        </TouchableOpacity>
      );
    }

    // Default list layout
    return (
      <TouchableOpacity
        key={alert.id}
        style={[styles.listItem, { backgroundColor: severityBg, borderLeftColor: severityColor, borderLeftWidth: 4 }]}
        onPress={() => handleAlertPress(alert)}
        disabled={!enableTap}
      >
        <View style={styles.listHeader}>
          <View style={[styles.alertIcon, { backgroundColor: `${severityColor}20` }]}>
            <Icon name={iconName} size={20} color={severityColor} />
          </View>
          <View style={styles.listHeaderContent}>
            <View style={styles.listTitleRow}>
              <AppText style={[styles.listTitle, { color: colors.onSurface }]} numberOfLines={1}>
                {getLocalizedField(alert, "title")}
              </AppText>
              {!alert.is_acknowledged && (
                <View style={[styles.unreadDot, { backgroundColor: severityColor }]} />
              )}
            </View>
            <View style={styles.listMeta}>
              <AppText style={[styles.listCategory, { color: severityColor }]}>
                {alert.category}
              </AppText>
              <AppText style={[styles.listDot, { color: colors.onSurfaceVariant }]}>•</AppText>
              <AppText style={[styles.listTime, { color: colors.onSurfaceVariant }]}>
                {formatTimeAgo(alert.triggered_at)}
              </AppText>
            </View>
          </View>
          {showSeverity && (
            <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
              <AppText style={styles.severityText}>
                {t(`widgets.aiAlerts.severity.${alert.severity}`)}
              </AppText>
            </View>
          )}
        </View>
        {showDescription && (
          <AppText style={[styles.listDescription, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
            {getLocalizedField(alert, "description")}
          </AppText>
        )}
        {showActionRequired && alert.action_required_en && (
          <View style={[styles.actionBox, { backgroundColor: `${severityColor}10` }]}>
            <Icon name="arrow-right-circle" size={14} color={severityColor} />
            <AppText style={[styles.actionText, { color: severityColor }]} numberOfLines={1}>
              {getLocalizedField(alert, "action_required")}
            </AppText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Critical Alert Banner */}
      {data && data.critical_count > 0 && (
        <View style={[styles.criticalBanner, { backgroundColor: `${colors.error}15` }]}>
          <Icon name="alert-octagon" size={18} color={colors.error} />
          <AppText style={[styles.criticalText, { color: colors.error }]}>
            {t("widgets.aiAlerts.header.critical", { count: data.critical_count })}
          </AppText>
        </View>
      )}

      {/* Summary Header */}
      {data && data.unacknowledged_count > 0 && data.critical_count === 0 && (
        <View style={[styles.headerBanner, { backgroundColor: `${colors.primary}15` }]}>
          <Icon name="bell-alert" size={16} color={colors.primary} />
          <AppText style={[styles.headerText, { color: colors.primary }]}>
            {t("widgets.aiAlerts.header.unacknowledged", { count: data.unacknowledged_count })}
          </AppText>
        </View>
      )}

      {/* Alerts List */}
      {layoutStyle === "cards" ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {displayAlerts.map((alert, index) => renderAlertItem(alert, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displayAlerts.map((alert, index) => renderAlertItem(alert, index))}
        </View>
      )}

      {/* View All Button */}
      {alerts.length > maxItems && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.aiAlerts.actions.viewAll", { count: alerts.length })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  errorContainer: {
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    borderRadius: 12,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
  },
  // Critical Banner
  criticalBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  criticalText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  // Header Banner
  headerBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  headerText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  // List Layout
  listContainer: {
    gap: 10,
  },
  listItem: {
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  listHeaderContent: {
    flex: 1,
  },
  listTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  listCategory: {
    fontSize: 11,
    fontWeight: "500",
  },
  listDot: {
    fontSize: 10,
  },
  listTime: {
    fontSize: 11,
  },
  listDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 46,
  },
  actionBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 46,
    marginTop: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "500",
    flex: 1,
  },
  // Cards Layout
  cardsContainer: {
    gap: 12,
    paddingRight: 4,
  },
  cardItem: {
    width: 160,
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  cardSeverity: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardSeverityText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardCategory: {
    fontSize: 10,
    fontWeight: "500",
  },
  cardTime: {
    fontSize: 10,
    marginTop: 4,
  },
  // Compact Layout
  compactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    gap: 10,
  },
  severityBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  compactTime: {
    fontSize: 11,
    marginTop: 2,
  },
  // Common
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default ParentAIAlertsWidget;
