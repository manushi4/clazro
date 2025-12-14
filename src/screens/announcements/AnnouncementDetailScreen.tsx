/**
 * AnnouncementDetailScreen - Fixed Screen
 *
 * Purpose: Display full announcement details with attachments
 * Type: Fixed (not widget-based)
 * Accessible from: announcements screen, notification tap
 * Roles: parent, student, teacher, admin
 */

import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
  RefreshControl,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";
import { useBranding } from "../../context/BrandingContext";

// Analytics & Error Tracking
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";

// Localization
import { getLocalizedField } from "../../utils/getLocalizedField";

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Data Hooks
import { useAnnouncementQuery } from "../../hooks/queries/useAnnouncementQuery";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

// Priority badge colors
const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  high: { bg: "#FFEBEE", text: "#C62828" },
  normal: { bg: "#E3F2FD", text: "#1565C0" },
  low: { bg: "#F5F5F5", text: "#757575" },
};

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  general: "bullhorn",
  academic: "school",
  event: "calendar-star",
  holiday: "beach",
  exam: "clipboard-text",
  sports: "basketball",
  cultural: "palette",
  emergency: "alert-circle",
  default: "information",
};

export const AnnouncementDetailScreen: React.FC<Props> = ({
  screenId = "announcement-detail",
  role,
  navigation: navProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = useRoute<any>();

  // Get announcement ID from route params
  const announcementId = route.params?.announcementId || route.params?.id;

  // === DATA ===
  const { data: announcement, isLoading, error, refetch } = useAnnouncementQuery(announcementId);
  const [refreshing, setRefreshing] = useState(false);

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { announcementId },
    });
  }, [screenId, announcementId]);

  // === EVENT HANDLERS ===
  const handleBack = useCallback(() => {
    trackEvent("back_pressed", { screen: screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  const handleRefresh = useCallback(async () => {
    if (!isOnline) {
      Alert.alert(
        t("offline.title", { defaultValue: "You're Offline" }),
        t("offline.refreshDisabled", { defaultValue: "Cannot refresh while offline" })
      );
      return;
    }
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [isOnline, refetch, t]);

  const handleShare = useCallback(async () => {
    if (!announcement) return;

    const title = getLocalizedField(announcement, "title");
    const content = getLocalizedField(announcement, "content");

    trackEvent("announcement_shared", { announcementId: announcement.id });

    try {
      await Share.share({
        title,
        message: `${title}\n\n${content}`,
      });
    } catch (err) {
      // User cancelled or error
    }
  }, [announcement, trackEvent]);

  const handleAttachment = useCallback(() => {
    if (!announcement?.attachment_url) return;

    trackEvent("announcement_attachment_opened", {
      announcementId: announcement.id,
    });

    Linking.openURL(announcement.attachment_url).catch(() => {
      Alert.alert(
        t("errors.title", { defaultValue: "Error" }),
        t("errors.openUrl", { defaultValue: "Could not open attachment" })
      );
    });
  }, [announcement, trackEvent, t]);

  // === HELPER FUNCTIONS ===
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryIcon = (category: string | null) => {
    return CATEGORY_ICONS[category || "default"] || CATEGORY_ICONS.default;
  };

  const getPriorityColors = (priority: string | null) => {
    return PRIORITY_COLORS[priority || "normal"] || PRIORITY_COLORS.normal;
  };

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("status.loading", { defaultValue: "Loading..." })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // === ERROR STATE ===
  if (error || !announcement) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("announcements.detail", { defaultValue: "Announcement" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("announcements.notFound", { defaultValue: "Announcement not found" })}
          </AppText>
          <AppButton
            title={t("actions.goBack", { defaultValue: "Go Back" })}
            onPress={handleBack}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  const priorityColors = getPriorityColors(announcement.priority);
  const title = getLocalizedField(announcement, "title");
  const content = getLocalizedField(announcement, "content");

  // === SUCCESS STATE ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("announcements.detail", { defaultValue: "Announcement" })}
        </AppText>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Icon name="share-variant" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Pinned & Category Badge */}
        <View style={styles.badgeRow}>
          {announcement.is_pinned && (
            <View style={[styles.pinnedBadge, { backgroundColor: colors.primaryContainer }]}>
              <Icon name="pin" size={14} color={colors.primary} />
              <AppText style={[styles.pinnedText, { color: colors.primary }]}>
                {t("announcements.pinned", { defaultValue: "Pinned" })}
              </AppText>
            </View>
          )}
          <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceVariant }]}>
            <Icon
              name={getCategoryIcon(announcement.category)}
              size={16}
              color={colors.onSurfaceVariant}
            />
            <AppText style={[styles.categoryText, { color: colors.onSurfaceVariant }]}>
              {announcement.category || t("announcements.general", { defaultValue: "General" })}
            </AppText>
          </View>
          {announcement.priority && announcement.priority !== "normal" && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityColors.bg }]}>
              <AppText style={[styles.priorityText, { color: priorityColors.text }]}>
                {announcement.priority.toUpperCase()}
              </AppText>
            </View>
          )}
        </View>

        {/* Title */}
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {title}
        </AppText>

        {/* Timestamp */}
        <View style={styles.timestampRow}>
          <Icon name="calendar" size={16} color={colors.onSurfaceVariant} />
          <AppText style={[styles.timestamp, { color: colors.onSurfaceVariant }]}>
            {formatDate(announcement.published_at || announcement.created_at)}
          </AppText>
          <Icon name="clock-outline" size={16} color={colors.onSurfaceVariant} style={{ marginLeft: 12 }} />
          <AppText style={[styles.timestamp, { color: colors.onSurfaceVariant }]}>
            {formatTime(announcement.published_at || announcement.created_at)}
          </AppText>
        </View>

        {/* Target Roles */}
        {announcement.target_roles && announcement.target_roles.length > 0 && (
          <View style={styles.rolesRow}>
            <Icon name="account-group" size={16} color={colors.onSurfaceVariant} />
            <AppText style={[styles.rolesText, { color: colors.onSurfaceVariant }]}>
              {t("announcements.for", { defaultValue: "For:" })}{" "}
              {announcement.target_roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(", ")}
            </AppText>
          </View>
        )}

        {/* Content Card */}
        <AppCard style={styles.contentCard}>
          <AppText style={[styles.contentText, { color: colors.onSurface }]}>
            {content}
          </AppText>
        </AppCard>

        {/* Attachment */}
        {announcement.attachment_url && (
          <TouchableOpacity
            style={[styles.attachmentCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
            onPress={handleAttachment}
            activeOpacity={0.7}
          >
            <Icon name="attachment" size={24} color={colors.primary} />
            <View style={styles.attachmentInfo}>
              <AppText style={[styles.attachmentTitle, { color: colors.onSurface }]}>
                {t("announcements.attachment", { defaultValue: "Attachment" })}
              </AppText>
              <AppText style={[styles.attachmentHint, { color: colors.onSurfaceVariant }]}>
                {t("announcements.tapToOpen", { defaultValue: "Tap to open" })}
              </AppText>
            </View>
            <Icon name="open-in-new" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Expiry Notice */}
        {announcement.expires_at && (
          <View style={[styles.expiryNotice, { backgroundColor: colors.errorContainer }]}>
            <Icon name="clock-alert-outline" size={18} color={colors.error} />
            <AppText style={[styles.expiryText, { color: colors.error }]}>
              {t("announcements.expiresOn", { defaultValue: "Expires on:" })}{" "}
              {formatDate(announcement.expires_at)}
            </AppText>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerRight: {
    width: 32,
  },
  shareButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  pinnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: "600",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
    marginTop: 4,
  },
  timestampRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timestamp: {
    fontSize: 13,
  },
  rolesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rolesText: {
    fontSize: 13,
  },
  contentCard: {
    padding: 16,
    marginTop: 4,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
  },
  attachmentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  attachmentHint: {
    fontSize: 12,
    marginTop: 2,
  },
  expiryNotice: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  expiryText: {
    fontSize: 13,
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 32,
  },
});

export default AnnouncementDetailScreen;
