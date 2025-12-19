/**
 * Community Feed Widget (community.feed)
 * Displays community posts, achievements, questions, and announcements
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
import { useCommunityFeedQuery, CommunityPost, PostType } from "../../../hooks/queries/useCommunityFeedQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "community.feed";

export const CommunityFeedWidget: React.FC<WidgetProps> = ({ config, onNavigate, size = "standard" }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { isOnline } = useNetworkStatus();
  const { trackWidgetEvent } = useAnalytics();
  
  const maxItems = (config?.maxItems as number) || 5;
  const { data, isLoading, error, refetch } = useCommunityFeedQuery(maxItems);

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const showAuthorInfo = config?.showAuthorInfo !== false;
  const showEngagement = config?.showEngagement !== false;
  const showPostType = config?.showPostType !== false;
  const showPinnedFirst = config?.showPinnedFirst !== false;
  const layoutStyle = (config?.layoutStyle as string) || "list";
  const compactMode = config?.compactMode === true || size === "compact";
  const enableTap = config?.enableTap !== false;
  const filterType = (config?.filterType as string) || "all";


  // Post type icons and colors
  const getPostTypeConfig = (type: PostType) => {
    const configs: Record<PostType, { icon: string; color: string; label: string }> = {
      post: { icon: "text", color: colors.onSurfaceVariant, label: t("widgets.communityFeed.types.post", "Post") },
      achievement: { icon: "trophy", color: colors.warning, label: t("widgets.communityFeed.types.achievement", "Achievement") },
      question: { icon: "help-circle", color: colors.info, label: t("widgets.communityFeed.types.question", "Question") },
      poll: { icon: "poll", color: colors.tertiary, label: t("widgets.communityFeed.types.poll", "Poll") },
      announcement: { icon: "bullhorn", color: colors.error, label: t("widgets.communityFeed.types.announcement", "Announcement") },
      milestone: { icon: "flag-checkered", color: colors.success, label: t("widgets.communityFeed.types.milestone", "Milestone") },
      challenge: { icon: "lightning-bolt", color: colors.primary, label: t("widgets.communityFeed.types.challenge", "Challenge") },
    };
    return configs[type] || configs.post;
  };

  const getAchievementColor = (colorKey: string | null) => {
    if (!colorKey) return colors.primary;
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

  const getPostContent = (post: CommunityPost) => {
    return getLocalizedField({ content_en: post.contentEn, content_hi: post.contentHi }, 'content');
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("widgets.communityFeed.time.justNow", "Just now");
    if (diffMins < 60) return t("widgets.communityFeed.time.minutesAgo", "{{count}}m ago", { count: diffMins });
    if (diffHours < 24) return t("widgets.communityFeed.time.hoursAgo", "{{count}}h ago", { count: diffHours });
    return t("widgets.communityFeed.time.daysAgo", "{{count}}d ago", { count: diffDays });
  };

  const handlePostPress = (post: CommunityPost) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "post_tap", postId: post.id, postType: post.postType });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_post_tap`, level: "info", data: { postId: post.id } });
    onNavigate?.("community-post", { postId: post.id });
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_all`, level: "info" });
    onNavigate?.("community");
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.communityFeed.states.loading", "Loading feed...")}
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
          {t("widgets.communityFeed.states.error", "Couldn't load feed")}
        </AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]} onPress={() => refetch()}>
          <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
            {t("widgets.communityFeed.actions.retry", "Retry")}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data || data.posts.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Icon name="account-group" size={32} color={colors.primary} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.communityFeed.states.empty", "No posts yet")}
        </AppText>
        <AppText style={[styles.emptyHint, { color: colors.onSurfaceVariant }]}>
          {t("widgets.communityFeed.states.emptyHint", "Be the first to share something!")}
        </AppText>
      </View>
    );
  }

  // Filter posts
  let displayPosts = data.posts;
  if (filterType !== "all") {
    displayPosts = data.posts.filter(p => p.postType === filterType);
  }
  if (showPinnedFirst) {
    displayPosts = [...displayPosts].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }


  const renderPost = (post: CommunityPost, index: number) => {
    const typeConfig = getPostTypeConfig(post.postType);
    const achievementColor = post.achievementColor ? getAchievementColor(post.achievementColor) : typeConfig.color;

    return (
      <TouchableOpacity
        key={post.id}
        style={[
          layoutStyle === "cards" ? styles.cardItem : styles.listItem,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }
        ]}
        onPress={() => handlePostPress(post)}
        activeOpacity={enableTap ? 0.7 : 1}
        disabled={!enableTap}
      >
        {/* Pinned indicator */}
        {post.isPinned && (
          <View style={[styles.pinnedBadge, { backgroundColor: colors.primary }]}>
            <Icon name="pin" size={10} color={colors.onPrimary} />
            {!compactMode && (
              <AppText style={[styles.pinnedText, { color: colors.onPrimary }]}>
                {t("widgets.communityFeed.labels.pinned", "Pinned")}
              </AppText>
            )}
          </View>
        )}

        {/* Author info */}
        {showAuthorInfo && (
          <View style={styles.authorRow}>
            <View style={[styles.avatar, { backgroundColor: `${achievementColor}20` }]}>
              {post.authorAvatarUrl ? (
                <Icon name="account" size={20} color={achievementColor} />
              ) : (
                <AppText style={[styles.avatarText, { color: achievementColor }]}>
                  {post.authorName.charAt(0).toUpperCase()}
                </AppText>
              )}
            </View>
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <AppText style={[styles.authorName, { color: colors.onSurface }]} numberOfLines={1}>
                  {post.authorName}
                </AppText>
                {post.authorRole === "teacher" && (
                  <Icon name="check-decagram" size={14} color={colors.info} style={styles.verifiedIcon} />
                )}
              </View>
              <View style={styles.metaRow}>
                {post.authorBadge && !compactMode && (
                  <View style={[styles.badgeTag, { backgroundColor: `${achievementColor}15` }]}>
                    <AppText style={[styles.badgeText, { color: achievementColor }]}>
                      {post.authorBadge}
                    </AppText>
                  </View>
                )}
                <AppText style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
                  {formatTimeAgo(post.createdAt)}
                </AppText>
              </View>
            </View>
            {showPostType && (
              <View style={[styles.typeBadge, { backgroundColor: `${typeConfig.color}15` }]}>
                <Icon name={typeConfig.icon} size={12} color={typeConfig.color} />
              </View>
            )}
          </View>
        )}

        {/* Content */}
        <AppText 
          style={[styles.content, { color: colors.onSurface }]} 
          numberOfLines={compactMode ? 2 : 3}
        >
          {getPostContent(post)}
        </AppText>

        {/* Achievement/Milestone badge */}
        {(post.postType === "achievement" || post.postType === "milestone") && post.achievementIcon && !compactMode && (
          <View style={[styles.achievementBadge, { backgroundColor: `${achievementColor}15`, borderRadius: borderRadius.small }]}>
            <Icon name={post.achievementIcon} size={16} color={achievementColor} />
            <AppText style={[styles.achievementText, { color: achievementColor }]}>
              {post.achievementType || typeConfig.label}
            </AppText>
          </View>
        )}

        {/* Engagement stats */}
        {showEngagement && (
          <View style={styles.engagementRow}>
            <View style={styles.engagementItem}>
              <Icon name="heart-outline" size={14} color={colors.onSurfaceVariant} />
              <AppText style={[styles.engagementText, { color: colors.onSurfaceVariant }]}>
                {post.likesCount}
              </AppText>
            </View>
            <View style={styles.engagementItem}>
              <Icon name="comment-outline" size={14} color={colors.onSurfaceVariant} />
              <AppText style={[styles.engagementText, { color: colors.onSurfaceVariant }]}>
                {post.commentsCount}
              </AppText>
            </View>
            {post.sharesCount > 0 && !compactMode && (
              <View style={styles.engagementItem}>
                <Icon name="share-outline" size={14} color={colors.onSurfaceVariant} />
                <AppText style={[styles.engagementText, { color: colors.onSurfaceVariant }]}>
                  {post.sharesCount}
                </AppText>
              </View>
            )}
          </View>
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

      {/* Posts */}
      {layoutStyle === "cards" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContainer}>
          {displayPosts.map((post, index) => renderPost(post, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displayPosts.map((post, index) => renderPost(post, index))}
        </View>
      )}

      {/* View All button */}
      {enableTap && data.hasMore && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll} activeOpacity={0.7}>
          <Icon name="account-group" size={16} color={colors.primary} />
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.communityFeed.actions.viewAll", "View Community Feed")}
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
  
  // Layout containers
  listContainer: { gap: 10 },
  cardsContainer: { gap: 12, paddingRight: 4 },
  
  // List item
  listItem: { padding: 12, gap: 10, position: "relative" },
  
  // Card item
  cardItem: { width: 260, padding: 12, gap: 10, position: "relative" },
  
  // Pinned badge
  pinnedBadge: { position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, zIndex: 1 },
  pinnedText: { fontSize: 9, fontWeight: "600" },
  
  // Author
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontWeight: "700" },
  authorInfo: { flex: 1, gap: 2 },
  authorNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  authorName: { fontSize: 13, fontWeight: "600" },
  verifiedIcon: { marginLeft: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  badgeTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: "500" },
  timeText: { fontSize: 11 },
  typeBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  
  // Content
  content: { fontSize: 13, lineHeight: 18 },
  
  // Achievement badge
  achievementBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, alignSelf: "flex-start" },
  achievementText: { fontSize: 11, fontWeight: "600" },
  
  // Engagement
  engagementRow: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 4 },
  engagementItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  engagementText: { fontSize: 12 },
  
  // View All
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderTopWidth: 1, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: "500" },
});
