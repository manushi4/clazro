/**
 * Connections List Widget (connections.list)
 * Displays student connections with online status, mutual subjects, and XP
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
import { useConnectionsListQuery, ConnectionItem } from "../../../hooks/queries/useConnectionsListQuery";

const WIDGET_ID = "connections.list";

export const ConnectionsListWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = useConnectionsListQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxItems = (config?.maxItems as number) || 5;
  const showOnlineStatus = config?.showOnlineStatus !== false;
  const showXP = config?.showXP !== false;
  const showStreak = config?.showStreak !== false;
  const showMutualSubjects = config?.showMutualSubjects !== false;
  const showStats = config?.showStats !== false;
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const enableTap = config?.enableTap !== false;
  const compactMode = config?.compactMode === true || size === "compact";

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_all`, level: "info" });
    onNavigate?.("connections");
  };

  const handleConnectionPress = (connection: ConnectionItem) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "connection_tap", connectionId: connection.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_connection_tap`, level: "info", data: { connectionId: connection.id } });
    onNavigate?.(`profile/${connection.connectedUserId}`);
  };

  const getConnectionTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      study_buddy: "account-school",
      classmate: "account-group",
      friend: "account-heart",
      mentor: "account-star",
      mentee: "account-child",
    };
    return icons[type] || "account";
  };

  const getConnectionTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      study_buddy: colors.primary,
      classmate: colors.info,
      friend: colors.success,
      mentor: colors.warning,
      mentee: colors.tertiary,
    };
    return colorMap[type] || colors.primary;
  };

  const formatLastActive = (dateStr: string | null) => {
    if (!dateStr) return t("widgets.connectionsList.labels.unknown", "Unknown");
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return t("widgets.connectionsList.labels.justNow", "Just now");
    if (diffMins < 60) return t("widgets.connectionsList.labels.minutesAgo", "{{count}}m ago", { count: diffMins });
    if (diffHours < 24) return t("widgets.connectionsList.labels.hoursAgo", "{{count}}h ago", { count: diffHours });
    return t("widgets.connectionsList.labels.daysAgo", "{{count}}d ago", { count: diffDays });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.connectionsList.states.loading", "Loading connections...")}
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
          {t("widgets.connectionsList.states.error", "Couldn't load connections")}
        </AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.connectionsList.actions.retry", "Retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.connections.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="account-group-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.connectionsList.states.empty", "No connections yet")}
        </AppText>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => onNavigate?.("find-connections")}>
          <Icon name="account-plus" size={16} color={colors.onPrimary} />
          <AppText style={[styles.addButtonText, { color: colors.onPrimary }]}>
            {t("widgets.connectionsList.actions.findConnections", "Find Connections")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const activeConnections = data.connections.filter(c => c.status === 'active');
  const displayConnections = activeConnections.slice(0, maxItems);

  const renderConnectionItem = (connection: ConnectionItem, index: number) => {
    const typeColor = getConnectionTypeColor(connection.connectionType);

    return (
      <TouchableOpacity
        key={connection.id}
        style={[
          layoutStyle === "cards" ? styles.cardItem : styles.listItem,
          { backgroundColor: colors.surfaceVariant }
        ]}
        onPress={() => handleConnectionPress(connection)}
        activeOpacity={enableTap ? 0.7 : 1}
        disabled={!enableTap}
      >
        {/* Avatar with online indicator */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: `${typeColor}20` }]}>
            <Icon name={getConnectionTypeIcon(connection.connectionType)} size={layoutStyle === "cards" ? 24 : 20} color={typeColor} />
          </View>
          {showOnlineStatus && (
            <View style={[styles.onlineIndicator, { backgroundColor: connection.isOnline ? colors.success : colors.outline }]} />
          )}
        </View>

        {/* Connection info */}
        <View style={styles.connectionInfo}>
          <AppText style={[styles.connectionName, { color: colors.onSurface }]} numberOfLines={1}>
            {connection.name}
          </AppText>
          {connection.className && !compactMode && (
            <AppText style={[styles.connectionClass, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {connection.className}
            </AppText>
          )}
          {showMutualSubjects && connection.mutualSubjects.length > 0 && !compactMode && layoutStyle !== "cards" && (
            <View style={styles.subjectsRow}>
              {connection.mutualSubjects.slice(0, 2).map((subject, idx) => (
                <View key={idx} style={[styles.subjectChip, { backgroundColor: `${colors.primary}15` }]}>
                  <AppText style={[styles.subjectText, { color: colors.primary }]}>{subject}</AppText>
                </View>
              ))}
              {connection.mutualSubjects.length > 2 && (
                <AppText style={[styles.moreSubjects, { color: colors.onSurfaceVariant }]}>
                  +{connection.mutualSubjects.length - 2}
                </AppText>
              )}
            </View>
          )}
        </View>

        {/* Stats */}
        {!compactMode && (showXP || showStreak) && (
          <View style={styles.statsContainer}>
            {showXP && (
              <View style={styles.statItem}>
                <Icon name="star" size={12} color={colors.warning} />
                <AppText style={[styles.statValue, { color: colors.onSurfaceVariant }]}>
                  {connection.xpPoints >= 1000 ? `${(connection.xpPoints / 1000).toFixed(1)}k` : connection.xpPoints}
                </AppText>
              </View>
            )}
            {showStreak && connection.streakDays > 0 && (
              <View style={styles.statItem}>
                <Icon name="fire" size={12} color={colors.error} />
                <AppText style={[styles.statValue, { color: colors.onSurfaceVariant }]}>{connection.streakDays}</AppText>
              </View>
            )}
          </View>
        )}

        {/* Last active (for offline connections) */}
        {!connection.isOnline && !compactMode && layoutStyle !== "cards" && (
          <AppText style={[styles.lastActive, { color: colors.onSurfaceVariant }]}>
            {formatLastActive(connection.lastActiveAt)}
          </AppText>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Offline badge */}
      {!isOnline && (
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cloud-off-outline" size={12} color={colors.onSurfaceVariant} />
          <AppText style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
            {t("common:offline", "Offline")}
          </AppText>
        </View>
      )}

      {/* Stats banner */}
      {showStats && !compactMode && (
        <View style={[styles.statsBanner, { backgroundColor: colors.surfaceVariant }]}>
          <View style={styles.statBannerItem}>
            <AppText style={[styles.statBannerValue, { color: colors.onSurface }]}>{data.totalCount}</AppText>
            <AppText style={[styles.statBannerLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.connectionsList.labels.total", "Total")}
            </AppText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />
          <View style={styles.statBannerItem}>
            <View style={styles.onlineStatRow}>
              <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
              <AppText style={[styles.statBannerValue, { color: colors.success }]}>{data.onlineCount}</AppText>
            </View>
            <AppText style={[styles.statBannerLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.connectionsList.labels.online", "Online")}
            </AppText>
          </View>
          {data.pendingCount > 0 && (
            <>
              <View style={[styles.statDivider, { backgroundColor: colors.outline }]} />
              <View style={styles.statBannerItem}>
                <AppText style={[styles.statBannerValue, { color: colors.warning }]}>{data.pendingCount}</AppText>
                <AppText style={[styles.statBannerLabel, { color: colors.onSurfaceVariant }]}>
                  {t("widgets.connectionsList.labels.pending", "Pending")}
                </AppText>
              </View>
            </>
          )}
        </View>
      )}

      {/* Connections list */}
      {layoutStyle === "cards" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {displayConnections.map((connection, index) => renderConnectionItem(connection, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displayConnections.map((connection, index) => renderConnectionItem(connection, index))}
        </View>
      )}

      {/* View All button */}
      {enableTap && activeConnections.length > maxItems && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.connectionsList.actions.viewAll", "View All ({{count}})", { count: activeConnections.length })}
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
  addButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginTop: 12 },
  addButtonText: { fontSize: 13, fontWeight: "600" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
  statsBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 12, gap: 16 },
  statBannerItem: { alignItems: "center", gap: 2 },
  statBannerValue: { fontSize: 18, fontWeight: "700" },
  statBannerLabel: { fontSize: 10 },
  statDivider: { width: 1, height: 24 },
  onlineStatRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  listContainer: { gap: 8 },
  cardsContainer: { gap: 12, paddingRight: 4 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, gap: 12 },
  cardItem: { width: 120, padding: 14, borderRadius: 12, alignItems: "center", gap: 8 },
  avatarContainer: { position: "relative" },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  onlineIndicator: { position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#fff" },
  connectionInfo: { flex: 1, gap: 2 },
  connectionName: { fontSize: 14, fontWeight: "600" },
  connectionClass: { fontSize: 11 },
  subjectsRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, flexWrap: "wrap" },
  subjectChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  subjectText: { fontSize: 9, fontWeight: "500" },
  moreSubjects: { fontSize: 9 },
  statsContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 2 },
  statValue: { fontSize: 11, fontWeight: "500" },
  lastActive: { fontSize: 10 },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
