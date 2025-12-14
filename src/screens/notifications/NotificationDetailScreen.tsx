/**
 * NotificationDetailScreen - Fixed Screen
 *
 * Purpose: Display full notification details with actions
 * Type: Fixed (not widget-based)
 * Accessible from: notifications screen, push notification tap
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
  Image,
  RefreshControl,
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

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Data Hooks
import {
  useNotificationQuery,
  useMarkNotificationRead,
  useDeleteNotification,
} from "../../hooks/queries/useNotificationQuery";

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
  announcement: "bullhorn",
  assignment: "clipboard-text",
  grade: "school",
  attendance: "calendar-check",
  message: "message-text",
  reminder: "bell-ring",
  alert: "alert-circle",
  system: "cog",
  default: "bell",
};

export const NotificationDetailScreen: React.FC<Props> = ({
  screenId = "notification-detail",
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

  // Get notification ID from route params
  const notificationId = route.params?.notificationId || route.params?.id;

  // === DATA ===
  const { data: notification, isLoading, error, refetch } = useNotificationQuery(notificationId);
  const markReadMutation = useMarkNotificationRead();
  const deleteMutation = useDeleteNotification();
  const [refreshing, setRefreshing] = useState(false);

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { notificationId },
    });
  }, [screenId, notificationId]);

  // Mark as read when notification loads
  useEffect(() => {
    if (notification && !notification.is_read && isOnline) {
      markReadMutation.mutate(notification.id);
    }
  }, [notification?.id, notification?.is_read, isOnline]);

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

  const handleActionUrl = useCallback(() => {
    if (!notification?.action_url) return;
    
    trackEvent("notification_action_pressed", {
      notificationId: notification.id,
      actionUrl: notification.action_url,
    });

    // Check if it's an internal navigation or external URL
    if (notification.action_url.startsWith("screen:")) {
      const screenName = notification.action_url.replace("screen:", "");
      navigation.navigate(screenName, notification.data || {});
    } else {
      Linking.openURL(notification.action_url).catch(() => {
        Alert.alert(
          t("errors.title", { defaultValue: "Error" }),
          t("errors.openUrl", { defaultValue: "Could not open link" })
        );
      });
    }
  }, [notification, navigation, trackEvent, t]);

  const handleDelete = useCallback(() => {
    if (!isOnline) {
      Alert.alert(
        t("offline.title", { defaultValue: "You're Offline" }),
        t("offline.actionRequired", { defaultValue: "This action requires internet connection" })
      );
      return;
    }

    Alert.alert(
      t("notifications.deleteTitle", { defaultValue: "Delete Notification" }),
      t("notifications.deleteMessage", { defaultValue: "Are you sure you want to delete this notification?" }),
      [
        { text: t("actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
        {
          text: t("actions.delete", { defaultValue: "Delete" }),
          style: "destructive",
          onPress: async () => {
            trackEvent("notification_deleted", { notificationId });
            await deleteMutation.mutateAsync(notificationId);
            navigation.goBack();
          },
        },
      ]
    );
  }, [isOnline, notificationId, deleteMutation, navigation, trackEvent, t]);

  // === HELPER FUNCTIONS ===
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
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
  if (error || !notification) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("notifications.detail", { defaultValue: "Notification" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("notifications.notFound", { defaultValue: "Notification not found" })}
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

  const priorityColors = getPriorityColors(notification.priority);

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
          {t("notifications.detail", { defaultValue: "Notification" })}
        </AppText>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Icon name="delete-outline" size={24} color={colors.error} />
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
        {/* Category & Priority Badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.categoryBadge, { backgroundColor: colors.primaryContainer }]}>
            <Icon
              name={getCategoryIcon(notification.category)}
              size={16}
              color={colors.primary}
            />
            <AppText style={[styles.categoryText, { color: colors.primary }]}>
              {notification.category || t("notifications.general", { defaultValue: "General" })}
            </AppText>
          </View>
          {notification.priority && notification.priority !== "normal" && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityColors.bg }]}>
              <AppText style={[styles.priorityText, { color: priorityColors.text }]}>
                {notification.priority.toUpperCase()}
              </AppText>
            </View>
          )}
        </View>

        {/* Title */}
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {notification.title}
        </AppText>

        {/* Timestamp */}
        <View style={styles.timestampRow}>
          <Icon name="clock-outline" size={16} color={colors.onSurfaceVariant} />
          <AppText style={[styles.timestamp, { color: colors.onSurfaceVariant }]}>
            {formatDate(notification.sent_at || notification.created_at)}
          </AppText>
        </View>

        {/* Image (if present) */}
        {notification.image_url && (
          <View style={[styles.imageContainer, { borderRadius: borderRadius.medium }]}>
            <Image
              source={{ uri: notification.image_url }}
              style={[styles.image, { borderRadius: borderRadius.medium }]}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Body Content */}
        <AppCard style={styles.bodyCard}>
          <AppText style={[styles.body, { color: colors.onSurface }]}>
            {notification.body || t("notifications.noContent", { defaultValue: "No additional content" })}
          </AppText>
        </AppCard>

        {/* Additional Data (if present) */}
        {notification.data && Object.keys(notification.data).length > 0 && (
          <AppCard style={styles.dataCard}>
            <AppText style={[styles.dataTitle, { color: colors.onSurfaceVariant }]}>
              {t("notifications.additionalInfo", { defaultValue: "Additional Information" })}
            </AppText>
            {Object.entries(notification.data).map(([key, value]) => (
              <View key={key} style={styles.dataRow}>
                <AppText style={[styles.dataKey, { color: colors.onSurfaceVariant }]}>
                  {key}:
                </AppText>
                <AppText style={[styles.dataValue, { color: colors.onSurface }]}>
                  {String(value)}
                </AppText>
              </View>
            ))}
          </AppCard>
        )}

        {/* Action Button (if action_url present) */}
        {notification.action_url && (
          <View style={styles.actionContainer}>
            <AppButton
              title={t("notifications.takeAction", { defaultValue: "Take Action" })}
              onPress={handleActionUrl}
              variant="primary"
              icon="arrow-right"
            />
          </View>
        )}

        {/* Read Status */}
        <View style={styles.statusRow}>
          <Icon
            name={notification.is_read ? "check-circle" : "circle-outline"}
            size={16}
            color={notification.is_read ? colors.primary : colors.onSurfaceVariant}
          />
          <AppText style={[styles.statusText, { color: colors.onSurfaceVariant }]}>
            {notification.is_read
              ? t("notifications.read", { defaultValue: "Read" })
              : t("notifications.unread", { defaultValue: "Unread" })}
            {notification.read_at && ` • ${formatDate(notification.read_at)}`}
          </AppText>
        </View>

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
  deleteButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    fontWeight: "600",
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
  },
  timestampRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timestamp: {
    fontSize: 13,
  },
  imageContainer: {
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 200,
  },
  bodyCard: {
    padding: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  dataCard: {
    padding: 16,
  },
  dataTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  dataRow: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  dataKey: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  dataValue: {
    fontSize: 14,
    flex: 1,
  },
  actionContainer: {
    marginTop: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
  },
  statusText: {
    fontSize: 12,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default NotificationDetailScreen;
