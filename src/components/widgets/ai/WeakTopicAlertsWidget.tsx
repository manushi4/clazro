/**
 * Weak Topic Alerts Widget (ai.weak-topic-alerts)
 * Displays AI-generated alerts for weak topics needing attention
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useWeakTopicAlertsQuery, WeakTopicAlert, AlertType } from "../../../hooks/queries/useWeakTopicAlertsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "ai.weak-topic-alerts";

export const WeakTopicAlertsWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = useWeakTopicAlertsQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxItems = (config?.maxItems as number) || 4;
  const showDescription = config?.showDescription !== false;
  const showScore = config?.showScore !== false;
  const showAction = config?.showAction !== false;
  const showSubject = config?.showSubject !== false;
  const showSeverity = config?.showSeverity !== false;
  const showDaysSince = config?.showDaysSince !== false;
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const filterType = config?.filterType as AlertType | "all" | undefined;
  const filterSeverity = config?.filterSeverity as number | "all" | undefined;
  const enableTap = config?.enableTap !== false;
  const compactMode = config?.compactMode === true || size === "compact";

  // Color mapping using theme colors
  const getAlertColor = (colorKey: string) => {
    const colorMap: Record<string, string> = {
      primary: colors.primary,
      secondary: colors.secondary,
      tertiary: colors.tertiary,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
    };
    return colorMap[colorKey] || colors.warning;
  };

  const getAlertTypeIcon = (type: AlertType) => {
    const icons: Record<AlertType, string> = {
      declining: "trending-down",
      critical: "alert-octagon",
      stagnant: "pause-circle-outline",
      opportunity: "star-shooting",
      urgent: "clock-alert-outline",
      improvement: "trending-up",
    };
    return icons[type] || "alert-circle";
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 5) return t("widgets.weakTopicAlerts.severity.critical", "Critical");
    if (severity >= 4) return t("widgets.weakTopicAlerts.severity.high", "High");
    if (severity >= 3) return t("widgets.weakTopicAlerts.severity.medium", "Medium");
    return t("widgets.weakTopicAlerts.severity.low", "Low");
  };

  const getLocalizedTitle = (alert: WeakTopicAlert) => {
    return getLocalizedField({ title_en: alert.titleEn, title_hi: alert.titleHi }, 'title');
  };

  const getLocalizedDescription = (alert: WeakTopicAlert) => {
    return getLocalizedField({ description_en: alert.descriptionEn, description_hi: alert.descriptionHi }, 'description');
  };

  const getLocalizedActionLabel = (alert: WeakTopicAlert) => {
    return getLocalizedField({ action_label_en: alert.actionLabelEn, action_label_hi: alert.actionLabelHi }, 'action_label');
  };

  const handleAlertPress = (alert: WeakTopicAlert) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "alert_tap", alertId: alert.id, type: alert.alertType });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_alert_tap`, level: "info", data: { alertId: alert.id } });
    if (alert.actionRoute) {
      onNavigate?.(alert.actionRoute);
    }
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_all`, level: "info" });
    onNavigate?.("weak-topics");
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.weakTopicAlerts.states.loading", "Analyzing weak topics...")}
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
          {t("widgets.weakTopicAlerts.states.error", "Couldn't load alerts")}
        </AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.weakTopicAlerts.actions.retry", "Retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.alerts.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="check-circle" size={32} color={colors.success} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.weakTopicAlerts.states.empty", "No weak topic alerts")}
        </AppText>
        <AppText style={[styles.emptyHint, { color: colors.onSurfaceVariant }]}>
          {t("widgets.weakTopicAlerts.states.emptyHint", "Great job! Keep up the good work")}
        </AppText>
      </View>
    );
  }

  // Filter alerts
  let filteredAlerts = data.alerts;
  if (filterType && filterType !== "all") {
    filteredAlerts = filteredAlerts.filter(a => a.alertType === filterType);
  }
  if (filterSeverity && filterSeverity !== "all") {
    filteredAlerts = filteredAlerts.filter(a => a.severity >= (filterSeverity as number));
  }
  const displayAlerts = filteredAlerts.slice(0, maxItems);

  const renderScoreChange = (alert: WeakTopicAlert, alertColor: string) => {
    if (!showScore || alert.scoreChange === null) return null;
    const isPositive = alert.scoreChange > 0;
    const changeColor = isPositive ? colors.success : colors.error;
    
    return (
      <View style={styles.scoreContainer}>
        <AppText style={[styles.currentScore, { color: alertColor }]}>
          {alert.currentScore}%
        </AppText>
        <View style={[styles.changeIndicator, { backgroundColor: `${changeColor}15` }]}>
          <Icon name={isPositive ? "arrow-up" : "arrow-down"} size={10} color={changeColor} />
          <AppText style={[styles.changeText, { color: changeColor }]}>
            {Math.abs(alert.scoreChange)}%
          </AppText>
        </View>
      </View>
    );
  };

  const renderAlertItem = (alert: WeakTopicAlert, index: number) => {
    const alertColor = getAlertColor(alert.color);

    return (
      <TouchableOpacity
        key={alert.id}
        style={[
          layoutStyle === "cards" ? styles.cardItem : styles.listItem,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
          alert.severity >= 4 && { borderLeftWidth: 3, borderLeftColor: alertColor }
        ]}
        onPress={() => handleAlertPress(alert)}
        activeOpacity={enableTap ? 0.7 : 1}
        disabled={!enableTap}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${alertColor}15` }]}>
          <Icon name={alert.icon || getAlertTypeIcon(alert.alertType)} size={layoutStyle === "cards" ? 24 : 20} color={alertColor} />
        </View>

        {/* Content */}
        <View style={layoutStyle === "cards" ? styles.cardContent : styles.listContent}>
          <View style={styles.titleRow}>
            <AppText style={[styles.alertTitle, { color: colors.onSurface }]} numberOfLines={layoutStyle === "cards" ? 2 : 1}>
              {getLocalizedTitle(alert)}
            </AppText>
            {showSeverity && alert.severity >= 4 && (
              <View style={[styles.severityBadge, { backgroundColor: `${alertColor}15` }]}>
                <AppText style={[styles.severityText, { color: alertColor }]}>
                  {getSeverityLabel(alert.severity)}
                </AppText>
              </View>
            )}
          </View>

          {showSubject && alert.subject && !compactMode && (
            <View style={styles.topicRow}>
              <Icon name="book-outline" size={10} color={colors.onSurfaceVariant} />
              <AppText style={[styles.topicText, { color: colors.onSurfaceVariant }]}>
                {alert.subject} • {alert.topic}
              </AppText>
            </View>
          )}

          {showDescription && !compactMode && layoutStyle !== "cards" && (
            <AppText style={[styles.description, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
              {getLocalizedDescription(alert)}
            </AppText>
          )}

          {renderScoreChange(alert, alertColor)}

          {showDaysSince && alert.daysSincePractice !== null && !compactMode && (
            <View style={styles.daysRow}>
              <Icon name="calendar-clock" size={10} color={colors.onSurfaceVariant} />
              <AppText style={[styles.daysText, { color: colors.onSurfaceVariant }]}>
                {t("widgets.weakTopicAlerts.labels.daysSince", "{{count}} days since practice", { count: alert.daysSincePractice })}
              </AppText>
            </View>
          )}
        </View>

        {/* Action button */}
        {showAction && alert.actionRoute && !compactMode && layoutStyle !== "cards" && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: alertColor }]}
            onPress={() => handleAlertPress(alert)}
            activeOpacity={0.7}
          >
            <AppText style={[styles.actionText, { color: colors.onPrimary }]}>
              {getLocalizedActionLabel(alert) || t("widgets.weakTopicAlerts.actions.practice", "Practice")}
            </AppText>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Offline badge */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
            {t("common:offline", "Offline")}
          </AppText>
        </View>
      )}

      {/* Summary banner */}
      {!compactMode && (data.criticalCount > 0 || data.urgentCount > 0) && (
        <View style={[styles.summaryBanner, { backgroundColor: `${colors.error}10`, borderRadius: borderRadius.medium }]}>
          <Icon name="alert-circle" size={16} color={colors.error} />
          <AppText style={[styles.summaryText, { color: colors.error }]}>
            {t("widgets.weakTopicAlerts.labels.attentionNeeded", "{{count}} topics need immediate attention", { count: data.criticalCount + data.urgentCount })}
          </AppText>
        </View>
      )}

      {/* Alerts list */}
      {layoutStyle === "cards" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {displayAlerts.map((alert, index) => renderAlertItem(alert, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displayAlerts.map((alert, index) => renderAlertItem(alert, index))}
        </View>
      )}

      {/* View All button */}
      {enableTap && filteredAlerts.length > maxItems && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.weakTopicAlerts.actions.viewAll", "View All Alerts ({{count}})", { count: data.totalCount })}
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
  emptyHint: { fontSize: 11, marginTop: 4, textAlign: "center" },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
  retryText: { fontSize: 13, fontWeight: "600" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
  summaryBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10 },
  summaryText: { fontSize: 12, fontWeight: "500" },
  listContainer: { gap: 8 },
  cardsContainer: { gap: 12, paddingRight: 4 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12, position: "relative" },
  cardItem: { width: 160, padding: 14, alignItems: "center", gap: 8, position: "relative" },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  listContent: { flex: 1, gap: 4 },
  cardContent: { alignItems: "center", gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  alertTitle: { fontSize: 13, fontWeight: "600", flex: 1 },
  severityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  severityText: { fontSize: 10, fontWeight: "700" },
  topicRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  topicText: { fontSize: 10 },
  description: { fontSize: 11, lineHeight: 16 },
  scoreContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  currentScore: { fontSize: 14, fontWeight: "700" },
  changeIndicator: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  changeText: { fontSize: 10, fontWeight: "600" },
  daysRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  daysText: { fontSize: 10 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  actionText: { fontSize: 11, fontWeight: "600" },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
