/**
 * RecentRegistrationsWidget - Shows recently registered users
 *
 * Widget ID: users.recent-registrations
 * Category: Admin User Management
 *
 * Features:
 * - List of recently registered users
 * - Role and status indicators
 * - Time since registration
 * - Quick navigation to user detail
 * - Configurable max items and filters
 *
 * Following WIDGET_DEVELOPMENT_GUIDE.md Phase 3
 */

import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../../../../theme/useAppTheme";
import { AppText } from "../../../../ui/components/AppText";
import { WidgetContainer } from "../../base/WidgetContainer";
import {
  useRecentRegistrationsQuery,
  RecentRegistration,
} from "../../../../hooks/queries/admin/useRecentRegistrationsQuery";
import type { WidgetProps } from "../../../../types/widget.types";

// Role configuration with icons and colors
const ROLE_CONFIG: Record<
  string,
  { icon: string; colorKey: "primary" | "tertiary" | "secondary" | "error" }
> = {
  student: { icon: "school", colorKey: "primary" },
  teacher: { icon: "human-male-board", colorKey: "tertiary" },
  parent: { icon: "account-child", colorKey: "secondary" },
  admin: { icon: "shield-account", colorKey: "error" },
};

// Status configuration
const STATUS_CONFIG: Record<
  string,
  { icon: string; colorKey: "success" | "warning" | "error" }
> = {
  active: { icon: "check-circle", colorKey: "success" },
  pending: { icon: "clock-outline", colorKey: "warning" },
  suspended: { icon: "cancel", colorKey: "error" },
};

export const RecentRegistrationsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("admin");

  // Config options with defaults
  const maxItems = (config?.maxItems as number) || 5;
  const showRole = config?.showRole !== false;
  const showStatus = config?.showStatus !== false;
  const showTime = config?.showTime !== false;
  const showAvatar = config?.showAvatar !== false;
  const showEmail = config?.showEmail === true;
  const enableTap = config?.enableTap !== false;
  const showViewAll = config?.showViewAll !== false;
  const layoutStyle = (config?.layoutStyle as string) || "list";

  // Fetch recent registrations
  const { data, isLoading, error, refetch } = useRecentRegistrationsQuery({
    limit: maxItems,
  });

  // Handle user tap
  const handleUserPress = (userId: string) => {
    if (enableTap) {
      onNavigate?.("users-detail", { userId });
    }
  };

  // Handle view all
  const handleViewAll = () => {
    onNavigate?.("users-management", { filter: "recent" });
  };

  // Get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Render loading state
  if (isLoading) {
    return (
      <WidgetContainer
        widgetId="users.recent-registrations"
        title={t("widgets.recentRegistrations.title")}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <AppText
            style={[styles.loadingText, { color: colors.onSurfaceVariant }]}
          >
            {t("widgets.recentRegistrations.states.loading")}
          </AppText>
        </View>
      </WidgetContainer>
    );
  }

  // Render error state
  if (error) {
    return (
      <WidgetContainer
        widgetId="users.recent-registrations"
        title={t("widgets.recentRegistrations.title")}
      >
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("widgets.recentRegistrations.states.error")}
          </AppText>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <AppText style={[styles.retryText, { color: colors.onPrimary }]}>
              {t("widgets.recentRegistrations.actions.retry")}
            </AppText>
          </TouchableOpacity>
        </View>
      </WidgetContainer>
    );
  }

  // Render empty state
  if (!data || data.length === 0) {
    return (
      <WidgetContainer
        widgetId="users.recent-registrations"
        title={t("widgets.recentRegistrations.title")}
      >
        <View style={styles.emptyContainer}>
          <Icon
            name="account-plus-outline"
            size={48}
            color={colors.onSurfaceVariant}
          />
          <AppText
            style={[styles.emptyTitle, { color: colors.onSurfaceVariant }]}
          >
            {t("widgets.recentRegistrations.empty.title")}
          </AppText>
          <AppText
            style={[styles.emptyMessage, { color: colors.onSurfaceVariant }]}
          >
            {t("widgets.recentRegistrations.empty.message")}
          </AppText>
        </View>
      </WidgetContainer>
    );
  }

  // Render user item
  const renderUserItem = (user: RecentRegistration, index: number) => {
    const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.student;
    const statusConfig = STATUS_CONFIG[user.status] || STATUS_CONFIG.pending;
    const roleColor = colors[roleConfig.colorKey];
    const statusColor = colors[statusConfig.colorKey];

    return (
      <TouchableOpacity
        key={user.id}
        style={[
          styles.userItem,
          {
            backgroundColor: colors.surfaceVariant,
            borderRadius: borderRadius.medium,
          },
          layoutStyle === "cards" && styles.cardItem,
        ]}
        onPress={() => handleUserPress(user.id)}
        disabled={!enableTap}
        activeOpacity={0.7}
        accessibilityLabel={t("widgets.recentRegistrations.userHint", {
          name: user.name,
          role: user.role,
          time: user.registered_ago,
        })}
        accessibilityRole="button"
      >
        {/* Avatar */}
        {showAvatar && (
          <View
            style={[
              styles.avatar,
              { backgroundColor: `${roleColor}20`, borderColor: roleColor },
            ]}
          >
            <AppText style={[styles.avatarText, { color: roleColor }]}>
              {getInitials(user.name)}
            </AppText>
          </View>
        )}

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <AppText
              style={[styles.userName, { color: colors.onSurface }]}
              numberOfLines={1}
            >
              {user.name}
            </AppText>
            {showStatus && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${statusColor}20` },
                ]}
              >
                <Icon name={statusConfig.icon} size={12} color={statusColor} />
              </View>
            )}
          </View>

          {showEmail && (
            <AppText
              style={[styles.userEmail, { color: colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {user.email}
            </AppText>
          )}

          <View style={styles.metaRow}>
            {showRole && (
              <View style={styles.roleBadge}>
                <Icon name={roleConfig.icon} size={12} color={roleColor} />
                <AppText style={[styles.roleText, { color: roleColor }]}>
                  {t(`widgets.userList.roles.${user.role}`)}
                </AppText>
              </View>
            )}

            {showTime && (
              <AppText
                style={[styles.timeText, { color: colors.onSurfaceVariant }]}
              >
                {user.registered_ago}
              </AppText>
            )}
          </View>
        </View>

        {/* Chevron */}
        {enableTap && (
          <Icon
            name="chevron-right"
            size={20}
            color={colors.onSurfaceVariant}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <WidgetContainer
      widgetId="users.recent-registrations"
      title={t("widgets.recentRegistrations.title")}
      subtitle={t("widgets.recentRegistrations.subtitle")}
      action={
        showViewAll ? (
          <TouchableOpacity
            onPress={handleViewAll}
            accessibilityLabel={t("widgets.recentRegistrations.actions.viewAll")}
            accessibilityRole="button"
          >
            <AppText style={[styles.viewAllText, { color: colors.primary }]}>
              {t("widgets.recentRegistrations.actions.viewAll")}
            </AppText>
          </TouchableOpacity>
        ) : undefined
      }
    >
      {layoutStyle === "cards" ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {data.map((user, index) => renderUserItem(user, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {data.map((user, index) => renderUserItem(user, index))}
        </View>
      )}
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  // Loading state
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },

  // Error state
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
  },
  emptyMessage: {
    fontSize: 13,
    textAlign: "center",
  },

  // List layout
  listContainer: {
    gap: 8,
  },

  // Cards layout
  cardsContainer: {
    gap: 12,
    paddingRight: 4,
  },

  // User item
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  cardItem: {
    width: 200,
    flexDirection: "column",
    alignItems: "flex-start",
  },

  // Avatar
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // User info
  userInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  userEmail: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },

  // Role badge
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "500",
  },

  // Status badge
  statusBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Time text
  timeText: {
    fontSize: 11,
  },

  // View all
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default RecentRegistrationsWidget;
