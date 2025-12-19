/**
 * XP Balance Widget (rewards.xp-balance)
 * Displays user's XP, coins, level progress, and rewards balance
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
import { useXpBalanceQuery } from "../../../hooks/queries/useXpBalanceQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "rewards.xp-balance";

export const XpBalanceWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = useXpBalanceQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const showCoins = config?.showCoins !== false;
  const showXp = config?.showXp !== false;
  const showLevel = config?.showLevel !== false;
  const showProgress = config?.showProgress !== false;
  const showRank = config?.showRank !== false;
  const showMultiplier = config?.showMultiplier !== false;
  const showEarnings = config?.showEarnings !== false;
  const layoutStyle = (config?.layoutStyle as string) || "card";
  const compactMode = config?.compactMode === true || size === "compact";
  const enableTap = config?.enableTap !== false;

  const getLevelName = () => {
    if (!data) return "";
    return getLocalizedField({ level_name_en: data.levelNameEn, level_name_hi: data.levelNameHi }, 'level_name');
  };

  const getProgressPercent = () => {
    if (!data || data.xpForNextLevel === 0) return 0;
    return Math.min(100, Math.round((data.xpProgressInLevel / data.xpForNextLevel) * 100));
  };


  const handleWidgetPress = () => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "widget_tap" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_tap`, level: "info" });
    onNavigate?.("rewards-hub");
  };

  const handleShopPress = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "shop_tap" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_shop_tap`, level: "info" });
    onNavigate?.("reward-shop");
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.xpBalance.states.loading", "Loading balance...")}
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
          {t("widgets.xpBalance.states.error", "Couldn't load balance")}
        </AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.xpBalance.actions.retry", "Retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="star-four-points" size={32} color={colors.primary} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.xpBalance.states.empty", "Start earning XP!")}
        </AppText>
        <AppText style={[styles.emptyHint, { color: colors.onSurfaceVariant }]}>
          {t("widgets.xpBalance.states.emptyHint", "Complete activities to earn rewards")}
        </AppText>
      </View>
    );
  }

  const progressPercent = getProgressPercent();

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handleWidgetPress} 
      activeOpacity={enableTap ? 0.7 : 1}
      disabled={!enableTap}
    >
      {/* Offline badge */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
            {t("common:offline", "Offline")}
          </AppText>
        </View>
      )}

      {/* Main balance row */}
      <View style={styles.balanceRow}>
        {/* Coins */}
        {showCoins && (
          <View style={[styles.balanceItem, { backgroundColor: `${colors.warning}15`, borderRadius: borderRadius.medium }]}>
            <Icon name="circle-multiple" size={compactMode ? 20 : 24} color={colors.warning} />
            <View style={styles.balanceContent}>
              <AppText style={[styles.balanceValue, { color: colors.onSurface }]}>
                {data.coinsBalance.toLocaleString()}
              </AppText>
              {!compactMode && (
                <AppText style={[styles.balanceLabel, { color: colors.onSurfaceVariant }]}>
                  {t("widgets.xpBalance.labels.coins", "Coins")}
                </AppText>
              )}
            </View>
          </View>
        )}

        {/* XP */}
        {showXp && (
          <View style={[styles.balanceItem, { backgroundColor: `${colors.tertiary}15`, borderRadius: borderRadius.medium }]}>
            <Icon name="star-four-points" size={compactMode ? 20 : 24} color={colors.tertiary} />
            <View style={styles.balanceContent}>
              <AppText style={[styles.balanceValue, { color: colors.onSurface }]}>
                {data.xpTotal.toLocaleString()}
              </AppText>
              {!compactMode && (
                <AppText style={[styles.balanceLabel, { color: colors.onSurfaceVariant }]}>
                  {t("widgets.xpBalance.labels.xp", "XP")}
                </AppText>
              )}
            </View>
          </View>
        )}
      </View>


      {/* Level & Progress */}
      {showLevel && (
        <View style={[styles.levelSection, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <View style={styles.levelHeader}>
            <View style={styles.levelInfo}>
              <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
                <AppText style={[styles.levelNumber, { color: colors.onPrimary }]}>
                  {data.currentLevel}
                </AppText>
              </View>
              <View>
                <AppText style={[styles.levelName, { color: colors.onSurface }]}>
                  {getLevelName()}
                </AppText>
                {!compactMode && (
                  <AppText style={[styles.levelXp, { color: colors.onSurfaceVariant }]}>
                    {data.xpProgressInLevel.toLocaleString()} / {data.xpForNextLevel.toLocaleString()} XP
                  </AppText>
                )}
              </View>
            </View>
            {showMultiplier && data.activeMultiplier > 1 && (
              <View style={[styles.multiplierBadge, { backgroundColor: colors.success }]}>
                <Icon name="lightning-bolt" size={12} color={colors.onSuccess} />
                <AppText style={[styles.multiplierText, { color: colors.onSuccess }]}>
                  {data.activeMultiplier}x
                </AppText>
              </View>
            )}
          </View>

          {/* Progress bar */}
          {showProgress && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressTrack, { backgroundColor: colors.outline }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { backgroundColor: colors.primary, width: `${progressPercent}%` }
                  ]} 
                />
              </View>
              <AppText style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
                {progressPercent}%
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Stats row */}
      {!compactMode && (showEarnings || showRank) && (
        <View style={styles.statsRow}>
          {/* Today's earnings */}
          {showEarnings && (
            <View style={styles.statItem}>
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                +{data.xpEarnedToday}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.xpBalance.labels.today", "Today")}
              </AppText>
            </View>
          )}

          {/* This week */}
          {showEarnings && (
            <View style={styles.statItem}>
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                +{data.xpEarnedThisWeek}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.xpBalance.labels.thisWeek", "This Week")}
              </AppText>
            </View>
          )}

          {/* Rank */}
          {showRank && data.rankInClass && (
            <View style={styles.statItem}>
              <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                #{data.rankInClass}
              </AppText>
              <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.xpBalance.labels.classRank", "Class Rank")}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Shop button */}
      {enableTap && !compactMode && (
        <TouchableOpacity 
          style={[styles.shopButton, { borderColor: colors.outline }]} 
          onPress={handleShopPress}
          activeOpacity={0.7}
        >
          <Icon name="store" size={16} color={colors.primary} />
          <AppText style={[styles.shopText, { color: colors.primary }]}>
            {t("widgets.xpBalance.actions.visitShop", "Visit Reward Shop")}
          </AppText>
          <Icon name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
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
  
  // Balance row
  balanceRow: { flexDirection: "row", gap: 12 },
  balanceItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  balanceContent: { gap: 2 },
  balanceValue: { fontSize: 18, fontWeight: "700" },
  balanceLabel: { fontSize: 11 },
  
  // Level section
  levelSection: { padding: 12, gap: 10 },
  levelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  levelInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  levelBadge: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  levelNumber: { fontSize: 16, fontWeight: "700" },
  levelName: { fontSize: 14, fontWeight: "600" },
  levelXp: { fontSize: 11 },
  multiplierBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  multiplierText: { fontSize: 12, fontWeight: "700" },
  
  // Progress
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: "500", minWidth: 32 },
  
  // Stats row
  statsRow: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 8 },
  statItem: { alignItems: "center", gap: 2 },
  statValue: { fontSize: 15, fontWeight: "700" },
  statLabel: { fontSize: 10 },
  
  // Shop button
  shopButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderTopWidth: 1, marginTop: 4 },
  shopText: { fontSize: 13, fontWeight: "500" },
});
