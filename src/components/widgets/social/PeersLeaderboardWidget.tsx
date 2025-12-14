/**
 * Peers Leaderboard Widget (peers.leaderboard)
 * Displays XP rankings and competition among peers
 */
import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNetworkStatus } from "../../../offline/networkStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { useLeaderboardQuery, LeaderboardScope, LeaderboardEntry } from "../../../hooks/queries/useLeaderboardQuery";

const WIDGET_ID = "peers.leaderboard";

export const PeersLeaderboardWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  
  // Config options
  const scope = (config?.scope as LeaderboardScope) || 'school';
  const maxEntries = Math.min((config?.maxEntries as number) || 5, 10);
  const showMyRank = config?.showMyRank !== false;
  const showPercentile = config?.showPercentile !== false;
  const showScope = config?.showScope !== false;
  const showXP = config?.showXP !== false;
  const showStreak = config?.showStreak !== false;
  const compactMode = config?.compactMode === true || size === "compact";
  const enableTap = config?.enableTap !== false;
  
  const [selectedScope, setSelectedScope] = useState<LeaderboardScope>(scope);
  
  const { data, isLoading, error, refetch } = useLeaderboardQuery(selectedScope, maxEntries);

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, scope: selectedScope, loadTime: Date.now() - renderStart.current });
  }, []);

  const handleScopeChange = (newScope: LeaderboardScope) => {
    setSelectedScope(newScope);
    trackWidgetEvent(WIDGET_ID, "scope_change", { from: selectedScope, to: newScope });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_scope_change`, level: "info", data: { scope: newScope } });
  };


  const handleEntryPress = (entry: LeaderboardEntry) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "entry_tap", userId: entry.user_id, rank: entry.rank });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_entry_tap`, level: "info", data: { userId: entry.user_id } });
    onNavigate?.(`peer/${entry.user_id}`);
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all", scope: selectedScope });
    onNavigate?.("leaderboard");
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>{t("widgets.peersLeaderboard.states.loading")}</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="trophy-broken" size={24} color={colors.error} />
        <AppText style={[styles.stateText, { color: colors.onSurface }]}>{t("widgets.peersLeaderboard.states.error")}</AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>{t("widgets.peersLeaderboard.actions.retry")}</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data?.entries?.length) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="trophy-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>{t("widgets.peersLeaderboard.states.empty")}</AppText>
      </View>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return "🏆";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return null;
    }
  };

  const getPercentile = (rank: number, total: number) => {
    if (total === 0) return 0;
    return Math.round(((total - rank + 1) / total) * 100);
  };

  const getScopeLabel = (scopeValue: LeaderboardScope) => {
    switch (scopeValue) {
      case 'class': return t("widgets.peersLeaderboard.scopes.class");
      case 'school': return t("widgets.peersLeaderboard.scopes.school");
      case 'global': return t("widgets.peersLeaderboard.scopes.global");
      default: return scopeValue;
    }
  };

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>{t("common:offline")}</AppText>
        </View>
      )}

      {/* Scope Tabs */}
      {showScope && !compactMode && (
        <View style={[styles.scopeTabs, { backgroundColor: colors.surfaceVariant }]}>
          {(['class', 'school', 'global'] as LeaderboardScope[]).map((scopeOption) => (
            <TouchableOpacity
              key={scopeOption}
              style={[styles.scopeTab, selectedScope === scopeOption && { backgroundColor: colors.primary }]}
              onPress={() => handleScopeChange(scopeOption)}
              activeOpacity={0.7}
            >
              <AppText style={[styles.scopeTabText, { color: selectedScope === scopeOption ? colors.onPrimary : colors.onSurfaceVariant }]}>
                {getScopeLabel(scopeOption)}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}


      {/* My Rank Card */}
      {showMyRank && data.my_rank && !compactMode && (
        <View style={[styles.myRankCard, { backgroundColor: colors.primaryContainer }]}>
          <View style={styles.myRankContent}>
            <View style={styles.myRankLeft}>
              <AppText style={[styles.myRankLabel, { color: colors.onPrimaryContainer }]}>{t("widgets.peersLeaderboard.labels.myRank")}</AppText>
              <View style={styles.myRankInfo}>
                <AppText style={[styles.myRankNumber, { color: colors.primary }]}>#{data.my_rank.rank}</AppText>
                {showPercentile && (
                  <AppText style={[styles.percentile, { color: colors.onPrimaryContainer }]}>
                    {t("widgets.peersLeaderboard.labels.percentile", { value: getPercentile(data.my_rank.rank, data.total_participants) })}
                  </AppText>
                )}
              </View>
            </View>
            <View style={styles.myRankRight}>
              {showXP && (
                <View style={styles.statItem}>
                  <Icon name="star" size={14} color={colors.warning} />
                  <AppText style={[styles.statValue, { color: colors.onPrimaryContainer }]}>{data.my_rank.total_xp.toLocaleString()}</AppText>
                </View>
              )}
              {showStreak && data.my_rank.current_streak > 0 && (
                <View style={styles.statItem}>
                  <Icon name="fire" size={14} color={colors.error} />
                  <AppText style={[styles.statValue, { color: colors.onPrimaryContainer }]}>{data.my_rank.current_streak}</AppText>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Leaderboard List */}
      <View style={styles.leaderboardList}>
        {data.entries.map((entry) => {
          const rankIcon = getRankIcon(entry.rank);
          
          return (
            <TouchableOpacity
              key={entry.id}
              style={[
                styles.entryCard,
                { backgroundColor: entry.is_current_user ? colors.primaryContainer : colors.surfaceVariant },
                compactMode && styles.entryCardCompact,
              ]}
              onPress={() => handleEntryPress(entry)}
              disabled={!enableTap}
              activeOpacity={0.7}
            >
              {/* Rank */}
              <View style={styles.rankContainer}>
                {rankIcon ? (
                  <AppText style={styles.rankEmoji}>{rankIcon}</AppText>
                ) : (
                  <AppText style={[styles.rankNumber, { color: colors.onSurfaceVariant }]}>#{entry.rank}</AppText>
                )}
              </View>

              {/* Avatar */}
              <View style={[styles.avatarContainer, { backgroundColor: colors.outline + "20" }]}>
                {entry.avatar_url ? (
                  <Image source={{ uri: entry.avatar_url }} style={styles.avatar} />
                ) : (
                  <Icon name="account" size={compactMode ? 20 : 24} color={colors.onSurfaceVariant} />
                )}
              </View>

              {/* User Info */}
              <View style={styles.userInfo}>
                <AppText
                  style={[styles.userName, { color: entry.is_current_user ? colors.onPrimaryContainer : colors.onSurface }, compactMode && styles.userNameCompact]}
                  numberOfLines={1}
                >
                  {entry.full_name}
                  {entry.is_current_user && (
                    <AppText style={[styles.youBadge, { color: colors.primary }]}> {t("widgets.peersLeaderboard.labels.you")}</AppText>
                  )}
                </AppText>
                
                {!compactMode && (
                  <View style={styles.userStats}>
                    {showXP && (
                      <View style={styles.statItem}>
                        <Icon name="star" size={12} color={colors.warning} />
                        <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>{entry.total_xp.toLocaleString()}</AppText>
                      </View>
                    )}
                    {showStreak && entry.current_streak > 0 && (
                      <View style={styles.statItem}>
                        <Icon name="fire" size={12} color={colors.error} />
                        <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>{entry.current_streak}</AppText>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Chevron */}
              {enableTap && <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* View All */}
      {enableTap && !compactMode && data.total_participants > maxEntries && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.peersLeaderboard.actions.viewAll", { count: data.total_participants })}
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
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  retryText: { fontSize: 13, fontWeight: "600" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
  scopeTabs: { flexDirection: "row", borderRadius: 8, padding: 2 },
  scopeTab: { flex: 1, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignItems: "center" },
  scopeTabText: { fontSize: 12, fontWeight: "600" },
  myRankCard: { padding: 12, borderRadius: 12 },
  myRankContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  myRankLeft: { flex: 1 },
  myRankLabel: { fontSize: 12, fontWeight: "500", marginBottom: 4 },
  myRankInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  myRankNumber: { fontSize: 20, fontWeight: "700" },
  percentile: { fontSize: 11, fontWeight: "500" },
  myRankRight: { flexDirection: "row", gap: 12 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { fontSize: 12, fontWeight: "600" },
  statText: { fontSize: 11, fontWeight: "500" },
  leaderboardList: { gap: 8 },
  entryCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, gap: 12 },
  entryCardCompact: { padding: 8, gap: 8 },
  rankContainer: { width: 32, alignItems: "center" },
  rankEmoji: { fontSize: 20 },
  rankNumber: { fontSize: 14, fontWeight: "600" },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 14, fontWeight: "600" },
  userNameCompact: { fontSize: 13 },
  youBadge: { fontSize: 12, fontWeight: "700" },
  userStats: { flexDirection: "row", gap: 12 },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
