/**
 * Peer Matches Widget (peer.matches)
 * Displays AI-generated peer matching suggestions based on learning patterns
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
import { usePeerMatchesQuery, PeerMatch, MatchType } from "../../../hooks/queries/usePeerMatchesQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "peer.matches";

export const PeerMatchesWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  
  const maxItems = (config?.maxItems as number) || 5;
  const { data, isLoading, error, refetch } = usePeerMatchesQuery(maxItems);

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const showMatchScore = config?.showMatchScore !== false;
  const showCommonSubjects = config?.showCommonSubjects !== false;
  const showPeerStats = config?.showPeerStats !== false;
  const showOnlineStatus = config?.showOnlineStatus !== false;
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const compactMode = config?.compactMode === true || size === "compact";
  const enableTap = config?.enableTap !== false;
  const filterType = (config?.filterType as string) || "all";

  // Match type icons and colors
  const getMatchTypeConfig = (type: MatchType) => {
    const configs: Record<MatchType, { icon: string; color: string; label: string }> = {
      study_buddy: { icon: "account-multiple", color: colors.primary, label: t("widgets.peerMatches.types.studyBuddy", "Study Buddy") },
      subject_expert: { icon: "school", color: colors.success, label: t("widgets.peerMatches.types.subjectExpert", "Subject Expert") },
      goal_partner: { icon: "flag-checkered", color: colors.warning, label: t("widgets.peerMatches.types.goalPartner", "Goal Partner") },
      mentor: { icon: "account-star", color: colors.tertiary, label: t("widgets.peerMatches.types.mentor", "Mentor") },
      mentee: { icon: "account-heart", color: colors.info, label: t("widgets.peerMatches.types.mentee", "Mentee") },
      project_partner: { icon: "clipboard-text", color: colors.secondary, label: t("widgets.peerMatches.types.projectPartner", "Project Partner") },
    };
    return configs[type] || configs.study_buddy;
  };

  const getMatchReason = (match: PeerMatch) => {
    return getLocalizedField({ match_reason_en: match.matchReasonEn, match_reason_hi: match.matchReasonHi }, 'match_reason');
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return colors.success;
    if (score >= 75) return colors.primary;
    if (score >= 60) return colors.warning;
    return colors.onSurfaceVariant;
  };

  const formatLastActive = (dateStr: string | null) => {
    if (!dateStr) return t("widgets.peerMatches.time.unknown", "Unknown");
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return t("widgets.peerMatches.time.justNow", "Just now");
    if (diffMins < 60) return t("widgets.peerMatches.time.minutesAgo", "{{count}}m ago", { count: diffMins });
    if (diffHours < 24) return t("widgets.peerMatches.time.hoursAgo", "{{count}}h ago", { count: diffHours });
    return t("widgets.peerMatches.time.daysAgo", "{{count}}d ago", { count: diffDays });
  };

  const handleMatchPress = (match: PeerMatch) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "match_tap", matchId: match.id, matchType: match.matchType });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_match_tap`, level: "info", data: { matchId: match.id } });
    onNavigate?.("peer-profile", { peerId: match.peerUserId });
  };

  const handleConnect = (match: PeerMatch) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "connect", matchId: match.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_connect`, level: "info", data: { matchId: match.id } });
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_all`, level: "info" });
    onNavigate?.("peer-matches");
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.peerMatches.states.loading", "Finding matches...")}
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
          {t("widgets.peerMatches.states.error", "Couldn't find matches")}
        </AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.peerMatches.actions.retry", "Retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.matches.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="account-search" size={32} color={colors.primary} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.peerMatches.states.empty", "No matches found yet")}
        </AppText>
        <AppText style={[styles.emptyHint, { color: colors.onSurfaceVariant }]}>
          {t("widgets.peerMatches.states.emptyHint", "Keep learning to find study partners!")}
        </AppText>
      </View>
    );
  }

  // Filter matches
  let displayMatches = data.matches;
  if (filterType !== "all") {
    displayMatches = displayMatches.filter(m => m.matchType === filterType);
  }


  const renderMatch = (match: PeerMatch, index: number) => {
    const typeConfig = getMatchTypeConfig(match.matchType);
    const scoreColor = getMatchScoreColor(match.matchScore);
    const isConnected = match.status === "connected";

    return (
      <TouchableOpacity
        key={match.id}
        style={[
          layoutStyle === "cards" ? styles.cardItem : styles.listItem,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }
        ]}
        onPress={() => handleMatchPress(match)}
        activeOpacity={enableTap ? 0.7 : 1}
        disabled={!enableTap}
      >
        {/* Avatar with online status */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: `${typeConfig.color}20` }]}>
            {match.peerAvatarUrl ? (
              <Icon name="account" size={compactMode ? 20 : 24} color={typeConfig.color} />
            ) : (
              <Icon name="account" size={compactMode ? 20 : 24} color={typeConfig.color} />
            )}
          </View>
          {showOnlineStatus && (
            <View style={[styles.onlineIndicator, { backgroundColor: match.isOnline ? colors.success : colors.onSurfaceVariant }]} />
          )}
        </View>

        {/* Match info */}
        <View style={styles.matchInfo}>
          <View style={styles.nameRow}>
            <AppText style={[styles.peerName, { color: colors.onSurface }]} numberOfLines={1}>
              {match.peerName}
            </AppText>
            {showMatchScore && (
              <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}15` }]}>
                <AppText style={[styles.scoreText, { color: scoreColor }]}>
                  {match.matchScore}%
                </AppText>
              </View>
            )}
          </View>

          {/* Match type badge */}
          <View style={styles.metaRow}>
            <View style={[styles.typeBadge, { backgroundColor: `${typeConfig.color}15` }]}>
              <Icon name={typeConfig.icon} size={10} color={typeConfig.color} />
              <AppText style={[styles.typeText, { color: typeConfig.color }]}>
                {typeConfig.label}
              </AppText>
            </View>
            {match.peerClass && !compactMode && (
              <AppText style={[styles.classText, { color: colors.onSurfaceVariant }]}>
                {match.peerClass}{match.peerSection ? `-${match.peerSection}` : ""}
              </AppText>
            )}
          </View>

          {/* Common subjects */}
          {showCommonSubjects && match.commonSubjects.length > 0 && !compactMode && (
            <View style={styles.subjectsRow}>
              <Icon name="book-open-variant" size={10} color={colors.onSurfaceVariant} />
              <AppText style={[styles.subjectsText, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {match.commonSubjects.slice(0, 3).join(", ")}
              </AppText>
            </View>
          )}

          {/* Peer stats */}
          {showPeerStats && !compactMode && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Icon name="star" size={10} color={colors.warning} />
                <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                  {t("widgets.peerMatches.stats.level", "Lv {{level}}", { level: match.peerLevel })}
                </AppText>
              </View>
              <View style={styles.statItem}>
                <Icon name="fire" size={10} color={colors.error} />
                <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                  {match.peerStreak}
                </AppText>
              </View>
              <View style={styles.statItem}>
                <Icon name="medal" size={10} color={colors.tertiary} />
                <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                  {match.peerBadgesCount}
                </AppText>
              </View>
            </View>
          )}
        </View>

        {/* Connect button or status */}
        {isConnected ? (
          <View style={[styles.connectedBadge, { backgroundColor: `${colors.success}15` }]}>
            <Icon name="check-circle" size={14} color={colors.success} />
          </View>
        ) : enableTap ? (
          <TouchableOpacity
            style={[styles.connectButton, { backgroundColor: colors.primary, borderRadius: borderRadius.small }]}
            onPress={() => handleConnect(match)}
          >
            <Icon name="account-plus" size={14} color={colors.onPrimary} />
          </TouchableOpacity>
        ) : (
          <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
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

      {/* Summary */}
      {!compactMode && data.connectedMatches.length > 0 && (
        <View style={[styles.summaryRow, { backgroundColor: `${colors.success}10`, borderRadius: borderRadius.small }]}>
          <Icon name="account-multiple-check" size={16} color={colors.success} />
          <AppText style={[styles.summaryText, { color: colors.success }]}>
            {t("widgets.peerMatches.labels.connected", "{{count}} connected", { count: data.connectedMatches.length })}
          </AppText>
        </View>
      )}

      {/* Matches */}
      {layoutStyle === "cards" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {displayMatches.map((match, index) => renderMatch(match, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displayMatches.map((match, index) => renderMatch(match, index))}
        </View>
      )}

      {/* View All button */}
      {enableTap && data.hasMore && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <Icon name="account-search" size={16} color={colors.primary} />
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.peerMatches.actions.viewAll", "Find More Matches")}
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
  
  // Summary
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  summaryText: { fontSize: 12, fontWeight: "500" },
  
  // Layout containers
  listContainer: { gap: 10 },
  cardsContainer: { gap: 12, paddingRight: 4 },
  
  // List item
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  
  // Card item
  cardItem: { width: 220, padding: 12, gap: 10 },
  
  // Avatar
  avatarContainer: { position: "relative" },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  onlineIndicator: { position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#fff" },
  
  // Match info
  matchInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  peerName: { fontSize: 14, fontWeight: "600", flex: 1 },
  scoreBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  scoreText: { fontSize: 10, fontWeight: "600" },
  
  // Meta row
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: "500" },
  classText: { fontSize: 10 },
  
  // Subjects row
  subjectsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  subjectsText: { fontSize: 10, flex: 1 },
  
  // Stats row
  statsRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 2 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  statText: { fontSize: 10 },
  
  // Connect button
  connectButton: { padding: 8 },
  connectedBadge: { padding: 8, borderRadius: 20 },
  
  // View All
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
