/**
 * Streak Protection Widget (automation.streak-protection)
 * Displays streak status, protection shields, and quick actions to maintain streak
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useStreakProtectionQuery, StreakProtectionStatus } from "../../../hooks/queries/useStreakProtectionQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "automation.streak-protection";

export const StreakProtectionWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = useStreakProtectionQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const showShields = config?.showShields !== false;
  const showWeekProgress = config?.showWeekProgress !== false;
  const showMilestone = config?.showMilestone !== false;
  const showQuickAction = config?.showQuickAction !== false;
  const showUrgencyBanner = config?.showUrgencyBanner !== false;
  const layoutStyle = (config?.layoutStyle as string) || "card";
  const compactMode = config?.compactMode === true || size === "compact";
  const enableTap = config?.enableTap !== false;


  // Status colors using theme
  const getStatusColor = (status: StreakProtectionStatus) => {
    const statusColors: Record<StreakProtectionStatus, string> = {
      safe: colors.success,
      at_risk: colors.warning,
      critical: colors.error,
      lost: colors.onSurfaceVariant,
    };
    return statusColors[status] || colors.primary;
  };

  const getStatusIcon = (status: StreakProtectionStatus) => {
    const icons: Record<StreakProtectionStatus, string> = {
      safe: "shield-check",
      at_risk: "shield-alert",
      critical: "shield-off",
      lost: "shield-remove",
    };
    return icons[status] || "shield";
  };

  const getStatusLabel = (status: StreakProtectionStatus) => {
    const labels: Record<StreakProtectionStatus, string> = {
      safe: t("widgets.streakProtection.status.safe", "Streak Protected"),
      at_risk: t("widgets.streakProtection.status.atRisk", "At Risk"),
      critical: t("widgets.streakProtection.status.critical", "Critical!"),
      lost: t("widgets.streakProtection.status.lost", "Streak Lost"),
    };
    return labels[status] || status;
  };

  const getLocalizedReward = () => {
    if (!data?.streakProtection) return null;
    return getLocalizedField(
      { reward_en: data.streakProtection.nextMilestoneRewardEn, reward_hi: data.streakProtection.nextMilestoneRewardHi },
      'reward'
    );
  };

  const getLocalizedActionLabel = () => {
    if (!data?.streakProtection) return null;
    return getLocalizedField(
      { action_en: data.streakProtection.quickActionLabelEn, action_hi: data.streakProtection.quickActionLabelHi },
      'action'
    );
  };

  const handleQuickAction = () => {
    if (!enableTap || !data?.streakProtection?.quickActionRoute) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "quick_action", status: data.streakProtection.protectionStatus });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_quick_action`, level: "info" });
    onNavigate?.(data.streakProtection.quickActionRoute);
  };

  const handleUseShield = () => {
    if (!enableTap || !data?.shieldsAvailable) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "use_shield", shieldsAvailable: data.shieldsAvailable });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_use_shield`, level: "info" });
    onNavigate?.("streak-shield");
  };

  const handleViewDetails = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_details" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_details`, level: "info" });
    onNavigate?.("streak-details");
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.streakProtection.states.loading", "Loading streak...")}
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
          {t("widgets.streakProtection.states.error", "Couldn't load streak")}
        </AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.streakProtection.actions.retry", "Retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty/No streak state
  if (!data?.streakProtection) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="fire" size={32} color={colors.warning} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.streakProtection.states.empty", "Start your streak!")}
        </AppText>
        <AppText style={[styles.emptyHint, { color: colors.onSurfaceVariant }]}>
          {t("widgets.streakProtection.states.emptyHint", "Complete a study session to begin")}
        </AppText>
      </View>
    );
  }

  const { streakProtection, isAtRisk, isCritical, isLost, shieldsAvailable, weekProgress, daysToMilestone } = data;
  const statusColor = getStatusColor(streakProtection.protectionStatus);


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

      {/* Urgency Banner for at-risk/critical */}
      {showUrgencyBanner && (isAtRisk || isCritical) && (
        <View style={[styles.urgencyBanner, { backgroundColor: `${statusColor}15`, borderRadius: borderRadius.medium, borderLeftColor: statusColor }]}>
          <Icon name={isCritical ? "alert" : "clock-alert-outline"} size={18} color={statusColor} />
          <View style={styles.urgencyContent}>
            <AppText style={[styles.urgencyTitle, { color: statusColor }]}>
              {isCritical 
                ? t("widgets.streakProtection.urgency.critical", "Only {{hours}}h left!", { hours: streakProtection.hoursUntilLoss })
                : t("widgets.streakProtection.urgency.atRisk", "{{hours}}h until streak loss", { hours: streakProtection.hoursUntilLoss })
              }
            </AppText>
            <AppText style={[styles.urgencyHint, { color: colors.onSurfaceVariant }]}>
              {t("widgets.streakProtection.urgency.hint", "Complete a session to stay safe")}
            </AppText>
          </View>
        </View>
      )}

      {/* Main Streak Card */}
      <TouchableOpacity
        style={[styles.mainCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
        onPress={handleViewDetails}
        activeOpacity={enableTap ? 0.7 : 1}
        disabled={!enableTap}
      >
        {/* Streak Fire Icon & Count */}
        <View style={styles.streakHeader}>
          <View style={[styles.fireContainer, { backgroundColor: `${colors.warning}20` }]}>
            <Icon name="fire" size={compactMode ? 28 : 36} color={colors.warning} />
          </View>
          <View style={styles.streakInfo}>
            <AppText style={[styles.streakCount, { color: colors.onSurface }]}>
              {streakProtection.currentStreak}
            </AppText>
            <AppText style={[styles.streakLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.streakProtection.labels.dayStreak", "day streak")}
            </AppText>
          </View>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <Icon name={getStatusIcon(streakProtection.protectionStatus)} size={14} color={statusColor} />
            {!compactMode && (
              <AppText style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(streakProtection.protectionStatus)}
              </AppText>
            )}
          </View>
        </View>

        {/* Longest Streak */}
        {!compactMode && streakProtection.longestStreak > 0 && (
          <View style={styles.longestRow}>
            <Icon name="trophy-outline" size={14} color={colors.onSurfaceVariant} />
            <AppText style={[styles.longestText, { color: colors.onSurfaceVariant }]}>
              {t("widgets.streakProtection.labels.longest", "Longest: {{days}} days", { days: streakProtection.longestStreak })}
            </AppText>
          </View>
        )}
      </TouchableOpacity>

      {/* Shields Section */}
      {showShields && !compactMode && (
        <View style={[styles.shieldsCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <View style={styles.shieldsHeader}>
            <Icon name="shield" size={18} color={colors.primary} />
            <AppText style={[styles.shieldsTitle, { color: colors.onSurface }]}>
              {t("widgets.streakProtection.labels.shields", "Protection Shields")}
            </AppText>
          </View>
          <View style={styles.shieldsRow}>
            {[...Array(streakProtection.maxShieldsPerMonth)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.shieldIcon,
                  { backgroundColor: i < shieldsAvailable ? `${colors.primary}20` : `${colors.onSurfaceVariant}10` }
                ]}
              >
                <Icon
                  name={i < shieldsAvailable ? "shield-check" : "shield-off-outline"}
                  size={20}
                  color={i < shieldsAvailable ? colors.primary : colors.onSurfaceVariant}
                />
              </View>
            ))}
            <AppText style={[styles.shieldsCount, { color: colors.onSurfaceVariant }]}>
              {t("widgets.streakProtection.labels.shieldsLeft", "{{count}} left this month", { count: shieldsAvailable })}
            </AppText>
          </View>
          {(isAtRisk || isCritical) && shieldsAvailable > 0 && (
            <TouchableOpacity
              style={[styles.useShieldButton, { backgroundColor: colors.primary, borderRadius: borderRadius.small }]}
              onPress={handleUseShield}
              activeOpacity={0.7}
            >
              <Icon name="shield-plus" size={16} color={colors.onPrimary} />
              <AppText style={[styles.useShieldText, { color: colors.onPrimary }]}>
                {t("widgets.streakProtection.actions.useShield", "Use Shield")}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Week Progress */}
      {showWeekProgress && !compactMode && (
        <View style={[styles.progressCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <View style={styles.progressHeader}>
            <AppText style={[styles.progressTitle, { color: colors.onSurface }]}>
              {t("widgets.streakProtection.labels.weekGoal", "Weekly Goal")}
            </AppText>
            <AppText style={[styles.progressValue, { color: colors.primary }]}>
              {streakProtection.currentWeekDays}/{streakProtection.weeklyGoalDays} {t("widgets.streakProtection.labels.days", "days")}
            </AppText>
          </View>
          <View style={[styles.progressBar, { backgroundColor: `${colors.primary}20` }]}>
            <View style={[styles.progressFill, { width: `${weekProgress}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>
      )}

      {/* Next Milestone */}
      {showMilestone && !compactMode && streakProtection.nextMilestone && (
        <View style={[styles.milestoneCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <Icon name="flag-checkered" size={18} color={colors.tertiary} />
          <View style={styles.milestoneContent}>
            <AppText style={[styles.milestoneTitle, { color: colors.onSurface }]}>
              {t("widgets.streakProtection.labels.nextMilestone", "{{days}} days to milestone", { days: daysToMilestone })}
            </AppText>
            {getLocalizedReward() && (
              <AppText style={[styles.milestoneReward, { color: colors.tertiary }]}>
                {t("widgets.streakProtection.labels.reward", "Reward: {{reward}}", { reward: getLocalizedReward() })}
              </AppText>
            )}
          </View>
        </View>
      )}

      {/* Quick Action Button */}
      {showQuickAction && streakProtection.quickActionRoute && (
        <TouchableOpacity
          style={[
            styles.quickActionButton,
            { 
              backgroundColor: isCritical ? colors.error : isAtRisk ? colors.warning : colors.primary,
              borderRadius: borderRadius.medium 
            }
          ]}
          onPress={handleQuickAction}
          activeOpacity={0.7}
        >
          <Icon name={isLost ? "restart" : "play-circle"} size={20} color={colors.onPrimary} />
          <AppText style={[styles.quickActionText, { color: colors.onPrimary }]}>
            {getLocalizedActionLabel() || t("widgets.streakProtection.actions.continue", "Continue Learning")}
          </AppText>
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
  
  // Urgency Banner
  urgencyBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderLeftWidth: 3 },
  urgencyContent: { flex: 1 },
  urgencyTitle: { fontSize: 13, fontWeight: "600" },
  urgencyHint: { fontSize: 11, marginTop: 2 },
  
  // Main Card
  mainCard: { padding: 16, gap: 10 },
  streakHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  fireContainer: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  streakInfo: { flex: 1 },
  streakCount: { fontSize: 32, fontWeight: "700" },
  streakLabel: { fontSize: 13 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  statusText: { fontSize: 11, fontWeight: "600" },
  longestRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  longestText: { fontSize: 12 },
  
  // Shields Card
  shieldsCard: { padding: 14, gap: 10 },
  shieldsHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  shieldsTitle: { fontSize: 13, fontWeight: "600" },
  shieldsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  shieldIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  shieldsCount: { fontSize: 11, marginLeft: "auto" },
  useShieldButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, marginTop: 4 },
  useShieldText: { fontSize: 13, fontWeight: "600" },
  
  // Progress Card
  progressCard: { padding: 14, gap: 8 },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressTitle: { fontSize: 13, fontWeight: "500" },
  progressValue: { fontSize: 13, fontWeight: "600" },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  
  // Milestone Card
  milestoneCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  milestoneContent: { flex: 1 },
  milestoneTitle: { fontSize: 12, fontWeight: "500" },
  milestoneReward: { fontSize: 11, marginTop: 2 },
  
  // Quick Action Button
  quickActionButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  quickActionText: { fontSize: 14, fontWeight: "600" },
});
