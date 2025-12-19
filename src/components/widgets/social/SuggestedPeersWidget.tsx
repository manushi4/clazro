/**
 * Suggested Peers Widget (suggestions.peers)
 * Displays peer suggestions with match score, mutual subjects, and connect actions
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
import { usePeerSuggestionsQuery, PeerSuggestion } from "../../../hooks/queries/usePeerSuggestionsQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "suggestions.peers";

export const SuggestedPeersWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  const { data, isLoading, error, refetch } = usePeerSuggestionsQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxItems = (config?.maxItems as number) || 5;
  const showMatchScore = config?.showMatchScore !== false;
  const showMutualSubjects = config?.showMutualSubjects !== false;
  const showMutualConnections = config?.showMutualConnections !== false;
  const showOnlineStatus = config?.showOnlineStatus !== false;
  const showMatchReasons = config?.showMatchReasons !== false;
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const enableTap = config?.enableTap !== false;
  const compactMode = config?.compactMode === true || size === "compact";

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_all`, level: "info" });
    onNavigate?.("find-connections");
  };

  const handlePeerPress = (peer: PeerSuggestion) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "peer_tap", peerId: peer.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_peer_tap`, level: "info", data: { peerId: peer.id } });
    onNavigate?.(`profile/${peer.suggestedUserId}`);
  };

  const handleConnect = (peer: PeerSuggestion) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "connect", peerId: peer.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_connect`, level: "info", data: { peerId: peer.id } });
    // TODO: Implement connect action
  };

  const getSuggestionTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      classmate: "account-school",
      study_buddy: "account-group",
      recommended: "star-outline",
      mutual_friend: "account-multiple",
    };
    return icons[type] || "account";
  };

  const getSuggestionTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      classmate: colors.primary,
      study_buddy: colors.info,
      recommended: colors.warning,
      mutual_friend: colors.success,
    };
    return colorMap[type] || colors.primary;
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.onSurfaceVariant;
  };

  const getPeerName = (peer: PeerSuggestion) => {
    return getLocalizedField({ name_en: peer.name, name_hi: peer.nameHi }, 'name');
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.suggestedPeers.states.loading", "Finding peers...")}
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
          {t("widgets.suggestedPeers.states.error", "Couldn't load suggestions")}
        </AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.suggestedPeers.actions.retry", "Retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.suggestions.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="account-search-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.suggestedPeers.states.empty", "No suggestions right now")}
        </AppText>
        <AppText style={[styles.emptyHint, { color: colors.onSurfaceVariant }]}>
          {t("widgets.suggestedPeers.states.emptyHint", "Check back later for new peer suggestions")}
        </AppText>
      </View>
    );
  }

  const displaySuggestions = data.suggestions.slice(0, maxItems);

  const renderPeerItem = (peer: PeerSuggestion, index: number) => {
    const typeColor = getSuggestionTypeColor(peer.suggestionType);
    const scoreColor = getMatchScoreColor(peer.matchScore);

    return (
      <TouchableOpacity
        key={peer.id}
        style={[
          layoutStyle === "cards" ? styles.cardItem : styles.listItem,
          { backgroundColor: colors.surfaceVariant }
        ]}
        onPress={() => handlePeerPress(peer)}
        activeOpacity={enableTap ? 0.7 : 1}
        disabled={!enableTap}
      >
        {/* Avatar with online indicator */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: `${typeColor}20` }]}>
            <Icon name={getSuggestionTypeIcon(peer.suggestionType)} size={layoutStyle === "cards" ? 24 : 20} color={typeColor} />
          </View>
          {showOnlineStatus && (
            <View style={[styles.onlineIndicator, { backgroundColor: peer.isOnline ? colors.success : colors.outline }]} />
          )}
        </View>

        {/* Peer info */}
        <View style={styles.peerInfo}>
          <View style={styles.nameRow}>
            <AppText style={[styles.peerName, { color: colors.onSurface }]} numberOfLines={1}>
              {getPeerName(peer)}
            </AppText>
            {showMatchScore && (
              <View style={[styles.matchBadge, { backgroundColor: `${scoreColor}15` }]}>
                <AppText style={[styles.matchScore, { color: scoreColor }]}>{peer.matchScore}%</AppText>
              </View>
            )}
          </View>
          
          {peer.className && !compactMode && (
            <AppText style={[styles.peerClass, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {peer.className}
            </AppText>
          )}

          {showMatchReasons && peer.matchReasons.length > 0 && !compactMode && layoutStyle !== "cards" && (
            <View style={styles.reasonsRow}>
              {peer.matchReasons.slice(0, 2).map((reason, idx) => (
                <View key={idx} style={[styles.reasonChip, { backgroundColor: `${colors.primary}10` }]}>
                  <AppText style={[styles.reasonText, { color: colors.primary }]}>{reason}</AppText>
                </View>
              ))}
            </View>
          )}

          {showMutualSubjects && peer.mutualSubjects.length > 0 && !compactMode && layoutStyle !== "cards" && (
            <View style={styles.subjectsRow}>
              <Icon name="book-outline" size={10} color={colors.onSurfaceVariant} />
              <AppText style={[styles.subjectsText, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {peer.mutualSubjects.slice(0, 2).join(", ")}
                {peer.mutualSubjects.length > 2 && ` +${peer.mutualSubjects.length - 2}`}
              </AppText>
            </View>
          )}
        </View>

        {/* Stats & Connect button */}
        <View style={styles.actionsContainer}>
          {showMutualConnections && peer.mutualConnections > 0 && !compactMode && (
            <View style={styles.mutualRow}>
              <Icon name="account-multiple" size={12} color={colors.onSurfaceVariant} />
              <AppText style={[styles.mutualText, { color: colors.onSurfaceVariant }]}>
                {peer.mutualConnections}
              </AppText>
            </View>
          )}
          <TouchableOpacity
            style={[styles.connectButton, { backgroundColor: colors.primary }]}
            onPress={() => handleConnect(peer)}
            activeOpacity={0.7}
          >
            <Icon name="account-plus" size={14} color={colors.onPrimary} />
            {!compactMode && layoutStyle !== "cards" && (
              <AppText style={[styles.connectText, { color: colors.onPrimary }]}>
                {t("widgets.suggestedPeers.actions.connect", "Connect")}
              </AppText>
            )}
          </TouchableOpacity>
        </View>
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

      {/* Suggestions list */}
      {layoutStyle === "cards" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {displaySuggestions.map((peer, index) => renderPeerItem(peer, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displaySuggestions.map((peer, index) => renderPeerItem(peer, index))}
        </View>
      )}

      {/* View All button */}
      {enableTap && data.suggestions.length > maxItems && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.suggestedPeers.actions.viewAll", "View All ({{count}})", { count: data.totalCount })}
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
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  retryText: { fontSize: 13, fontWeight: "600" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  offlineText: { fontSize: 10, fontWeight: "500" },
  listContainer: { gap: 8 },
  cardsContainer: { gap: 12, paddingRight: 4 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, gap: 12 },
  cardItem: { width: 140, padding: 14, borderRadius: 12, alignItems: "center", gap: 8 },
  avatarContainer: { position: "relative" },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  onlineIndicator: { position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#fff" },
  peerInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  peerName: { fontSize: 14, fontWeight: "600", flex: 1 },
  matchBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  matchScore: { fontSize: 10, fontWeight: "700" },
  peerClass: { fontSize: 11 },
  reasonsRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, flexWrap: "wrap" },
  reasonChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  reasonText: { fontSize: 9, fontWeight: "500" },
  subjectsRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  subjectsText: { fontSize: 10, flex: 1 },
  actionsContainer: { alignItems: "flex-end", gap: 6 },
  mutualRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  mutualText: { fontSize: 10 },
  connectButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  connectText: { fontSize: 11, fontWeight: "600" },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
