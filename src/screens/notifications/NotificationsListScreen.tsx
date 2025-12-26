/**
 * NotificationsListScreen - Fixed Screen
 *
 * Purpose: Display all notifications with filters, search, and mark read functionality
 * Type: Fixed (not widget-based)
 * Accessible from: header bell icon, notification widget, push notification tap
 * Roles: parent, student, teacher, admin
 */

import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";

// Analytics & Error Tracking
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";

// UI Components
import { AppText } from "../../ui/components/AppText";

// Data Hooks
import {
  useNotificationsListQuery,
  NotificationListItem,
  NotificationsListFilters,
} from "../../hooks/queries/useNotificationsListQuery";
import {
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "../../hooks/queries/useNotificationQuery";
import { useDemoUser } from "../../hooks/useDemoUser";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

// Filter options
const FILTER_TABS = [
  { key: "all", labelKey: "notifications.filters.all" },
  { key: "unread", labelKey: "notifications.filters.unread" },
  { key: "read", labelKey: "notifications.filters.read" },
] as const;

const CATEGORY_FILTERS = [
  { key: "all", labelKey: "notifications.categories.all", icon: "all-inclusive" },
  { key: "assignments", labelKey: "notifications.categories.assignments", icon: "clipboard-text" },
  { key: "doubts", labelKey: "notifications.categories.doubts", icon: "help-circle" },
  { key: "attendance", labelKey: "notifications.categories.attendance", icon: "calendar-check" },
  { key: "announcements", labelKey: "notifications.categories.announcements", icon: "bullhorn" },
  { key: "grades", labelKey: "notifications.categories.grades", icon: "school" },
  { key: "schedule", labelKey: "notifications.categories.schedule", icon: "calendar" },
] as const;

export const NotificationsListScreen: React.FC<Props> = ({
  screenId = "notifications-list",
  role,
  navigation: navProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const { userId } = useDemoUser();

  // === STATE ===
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // === FILTERS ===
  const filters: NotificationsListFilters = useMemo(
    () => ({
      readStatus: activeTab,
      category: activeCategory === "all" ? undefined : (activeCategory as any),
      searchQuery: searchQuery.trim() || undefined,
    }),
    [activeTab, activeCategory, searchQuery]
  );

  // === DATA ===
  const { data, isLoading, error, refetch } = useNotificationsListQuery(filters, 50);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
    });
  }, [screenId]);

  // === EVENT HANDLERS ===
  const handleBack = useCallback(() => {
    trackEvent("back_pressed", "navigation", { screen: screenId });
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

  const handleNotificationPress = useCallback(
    (notification: NotificationListItem) => {
      trackEvent("notification_pressed", "interaction", {
        notificationId: notification.id,
        category: notification.category,
      });

      // Mark as read
      if (!notification.is_read && isOnline) {
        markReadMutation.mutate(notification.id);
      }

      // Navigate to detail
      navigation.navigate("notification-detail", {
        notificationId: notification.id,
      });
    },
    [navigation, markReadMutation, isOnline, trackEvent]
  );

  const handleMarkAllRead = useCallback(() => {
    if (!isOnline) {
      Alert.alert(
        t("offline.title", { defaultValue: "You're Offline" }),
        t("offline.actionRequired", { defaultValue: "This action requires internet connection" })
      );
      return;
    }

    Alert.alert(
      t("notifications.markAllReadTitle", { defaultValue: "Mark All as Read" }),
      t("notifications.markAllReadMessage", {
        defaultValue: "Are you sure you want to mark all notifications as read?",
      }),
      [
        { text: t("actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
        {
          text: t("actions.confirm", { defaultValue: "Confirm" }),
          onPress: () => {
            if (userId) {
              trackEvent("mark_all_read", "interaction", { count: data?.unreadCount });
              markAllReadMutation.mutate(userId);
            }
          },
        },
      ]
    );
  }, [isOnline, userId, data?.unreadCount, markAllReadMutation, trackEvent, t]);

  const handleDeleteNotification = useCallback(
    (notification: NotificationListItem) => {
      if (!isOnline) {
        Alert.alert(
          t("offline.title", { defaultValue: "You're Offline" }),
          t("offline.actionRequired", { defaultValue: "This action requires internet connection" })
        );
        return;
      }

      Alert.alert(
        t("notifications.deleteTitle", { defaultValue: "Delete Notification" }),
        t("notifications.deleteMessage", {
          defaultValue: "Are you sure you want to delete this notification?",
        }),
        [
          { text: t("actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
          {
            text: t("actions.delete", { defaultValue: "Delete" }),
            style: "destructive",
            onPress: () => {
              trackEvent("notification_deleted", "interaction", { notificationId: notification.id });
              deleteMutation.mutate(notification.id);
            },
          },
        ]
      );
    },
    [isOnline, deleteMutation, trackEvent, t]
  );

  // === RENDER HELPERS ===
  const renderNotificationItem = useCallback(
    ({ item }: { item: NotificationListItem }) => {
      const priorityColor =
        item.priority === "high" ? colors.error : item.priority === "low" ? colors.onSurfaceVariant : colors.primary;

      return (
        <TouchableOpacity
          onPress={() => handleNotificationPress(item)}
          onLongPress={() => handleDeleteNotification(item)}
          style={[
            styles.notificationItem,
            {
              backgroundColor: item.is_read ? colors.surface : colors.surfaceVariant,
              borderRadius: borderRadius.medium,
            },
          ]}
          activeOpacity={0.7}
        >
          {/* Unread indicator */}
          {!item.is_read && <View style={[styles.unreadIndicator, { backgroundColor: colors.primary }]} />}

          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
            <Icon name={item.icon} size={22} color={item.color} />
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <View style={styles.titleRow}>
              <AppText
                style={[
                  styles.title,
                  { color: colors.onSurface },
                  !item.is_read && styles.unreadTitle,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </AppText>
              {item.priority === "high" && (
                <Icon name="alert-circle" size={14} color={priorityColor} />
              )}
            </View>

            {item.body && (
              <AppText
                style={[styles.body, { color: colors.onSurfaceVariant }]}
                numberOfLines={2}
              >
                {item.body}
              </AppText>
            )}

            <View style={styles.metaRow}>
              <View style={[styles.categoryBadge, { backgroundColor: `${item.color}15` }]}>
                <AppText style={[styles.categoryText, { color: item.color }]}>
                  {item.category}
                </AppText>
              </View>
              <AppText style={[styles.timeAgo, { color: colors.onSurfaceVariant }]}>
                {item.time_ago}
              </AppText>
            </View>
          </View>

          {/* Chevron */}
          <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      );
    },
    [colors, borderRadius, handleNotificationPress, handleDeleteNotification]
  );

  const renderEmptyState = useCallback(() => {
    const emptyMessage =
      activeTab === "unread"
        ? t("notifications.states.noUnread", { defaultValue: "No unread notifications" })
        : t("notifications.states.empty", { defaultValue: "No notifications yet" });

    return (
      <View style={styles.emptyContainer}>
        <Icon name="bell-off-outline" size={64} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>{emptyMessage}</AppText>
        <AppText style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>
          {t("notifications.states.emptySubtext", {
            defaultValue: "When you receive notifications, they'll appear here",
          })}
        </AppText>
      </View>
    );
  }, [activeTab, colors, t]);

  // === LOADING STATE ===
  if (isLoading && !data) {
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
  if (error && !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("notifications.title", { defaultValue: "Notifications" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("errors.loadFailed", { defaultValue: "Failed to load notifications" })}
          </AppText>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <AppText style={{ color: colors.onPrimary }}>
              {t("actions.retry", { defaultValue: "Retry" })}
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

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

        {showSearch ? (
          <View style={[styles.searchContainer, { backgroundColor: colors.surfaceVariant }]}>
            <Icon name="magnify" size={20} color={colors.onSurfaceVariant} />
            <TextInput
              style={[styles.searchInput, { color: colors.onSurface }]}
              placeholder={t("notifications.searchPlaceholder", { defaultValue: "Search notifications..." })}
              placeholderTextColor={colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
            >
              <Icon name="close" size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.headerTitleContainer}>
              <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
                {t("notifications.title", { defaultValue: "Notifications" })}
              </AppText>
              {unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
                  <AppText style={[styles.unreadBadgeText, { color: colors.onError }]}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </AppText>
                </View>
              )}
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setShowSearch(true)} style={styles.headerButton}>
                <Icon name="magnify" size={24} color={colors.onSurface} />
              </TouchableOpacity>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllRead} style={styles.headerButton}>
                  <Icon name="check-all" size={24} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterTabs, { borderBottomColor: colors.outlineVariant }]}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.filterTab,
              activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <AppText
              style={[
                styles.filterTabText,
                { color: activeTab === tab.key ? colors.primary : colors.onSurfaceVariant },
              ]}
            >
              {t(tab.labelKey, { defaultValue: tab.key })}
              {tab.key === "unread" && unreadCount > 0 && ` (${unreadCount})`}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoryFilters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORY_FILTERS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.categoryChipsContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveCategory(item.key)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    activeCategory === item.key ? colors.primaryContainer : colors.surfaceVariant,
                  borderRadius: 20,
                },
              ]}
            >
              <Icon
                name={item.icon}
                size={16}
                color={activeCategory === item.key ? colors.onPrimaryContainer : colors.onSurfaceVariant}
              />
              <AppText
                style={[
                  styles.categoryChipText,
                  {
                    color:
                      activeCategory === item.key ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                  },
                ]}
              >
                {t(item.labelKey, { defaultValue: item.key })}
              </AppText>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    width: 32,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  filterTabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  categoryFilters: {
    paddingVertical: 12,
  },
  categoryChipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
  },
  separator: {
    height: 10,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    overflow: "hidden",
  },
  unreadIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 15,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: "600",
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  timeAgo: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    gap: 12,
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default NotificationsListScreen;
