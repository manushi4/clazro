/**
 * UserListWidget - Admin User List
 *
 * Displays a filterable, sortable list of users with search,
 * role filter, and status filter capabilities.
 *
 * Widget ID: users.list
 * Category: list
 * Roles: admin, super_admin
 *
 * Phase 1: Database Setup - Uses profiles table (no dedicated table needed)
 * Phase 2: Query Hook - useUsersListQuery
 * Phase 3: Widget Component - This file
 * Phase 4: Translations - admin.json (EN/HI)
 * Phase 5: Widget Registry - src/config/widgetRegistry.ts
 * Phase 6: Platform Studio - platform-studio/src/config/widgetRegistry.ts
 * Phase 7: Database Screen Layout - screen_layouts table
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../../theme/useAppTheme";
import { AppText } from "../../../../ui/components/AppText";
import { AppCard } from "../../../../ui/components/AppCard";
import { useUsersListQuery } from "../../../../hooks/queries/admin/useUsersListQuery";
import type { WidgetProps } from "../../../../types/widget.types";
import type { UserListItem } from "../../../../hooks/queries/admin/useUsersListQuery";

type UserListConfig = {
  maxItems?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  showStatus?: boolean;
  showRole?: boolean;
  showLastActive?: boolean;
  showEmail?: boolean;
  enableTap?: boolean;
  defaultRoleFilter?: string | null;
  defaultStatusFilter?: string | null;
};

export const UserListWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("admin");

  const widgetConfig: UserListConfig = {
    maxItems: 10,
    showSearch: true,
    showFilters: true,
    showStatus: true,
    showRole: true,
    showLastActive: true,
    showEmail: true,
    enableTap: true,
    defaultRoleFilter: null,
    defaultStatusFilter: null,
    ...config,
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(
    widgetConfig.defaultRoleFilter || null
  );
  const [selectedStatus, setSelectedStatus] = useState<string | null>(
    widgetConfig.defaultStatusFilter || null
  );

  // Fetch real data from database
  const { data: users, isLoading, error, refetch } = useUsersListQuery({
    search: searchQuery,
    role: selectedRole,
    status: selectedStatus,
    limit: widgetConfig.maxItems,
  });

  // Role colors using theme
  const getRoleColor = useCallback((role: string): string => {
    const roleColors: Record<string, string> = {
      student: colors.primary,
      teacher: colors.success || "#4CAF50",
      parent: colors.warning || "#FF9800",
      admin: colors.tertiary || "#9C27B0",
    };
    return roleColors[role] || colors.primary;
  }, [colors]);

  // Status colors using theme
  const getStatusColor = useCallback((status: string): string => {
    const statusColors: Record<string, string> = {
      active: colors.success || "#4CAF50",
      pending: colors.warning || "#FF9800",
      suspended: colors.error,
    };
    return statusColors[status] || colors.outline;
  }, [colors]);

  const handleUserPress = useCallback(
    (user: UserListItem) => {
      if (!widgetConfig.enableTap) return;
      onNavigate?.("users-detail", { userId: user.id });
    },
    [widgetConfig.enableTap, onNavigate]
  );

  const handleViewAll = useCallback(() => {
    onNavigate?.("users-management", { view: "all" });
  }, [onNavigate]);

  const renderFilterChip = (
    label: string,
    value: string | null,
    selected: boolean,
    onPress: () => void,
    color?: string
  ) => (
    <TouchableOpacity
      key={label}
      style={[
        styles.filterChip,
        {
          backgroundColor: selected
            ? color || colors.primary
            : colors.surfaceVariant,
          borderRadius: borderRadius.sm,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <AppText
        style={[
          styles.filterChipText,
          { color: selected ? "#FFFFFF" : colors.onSurfaceVariant },
        ]}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }: { item: UserListItem }) => {
    const roleColor = getRoleColor(item.role);
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={[
          styles.userItem,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.outlineVariant,
          },
        ]}
        onPress={() => handleUserPress(item)}
        disabled={!widgetConfig.enableTap}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: `${roleColor}30` },
          ]}
        >
          <AppText style={[styles.avatarText, { color: roleColor }]}>
            {item.name.charAt(0).toUpperCase()}
          </AppText>
        </View>

        <View style={styles.userInfo}>
          <AppText style={[styles.userName, { color: colors.onSurface }]}>
            {item.name}
          </AppText>
          {widgetConfig.showEmail && (
            <AppText style={[styles.userEmail, { color: colors.onSurfaceVariant }]}>
              {item.email}
            </AppText>
          )}
          {widgetConfig.showLastActive && item.last_login_at && (
            <AppText style={[styles.lastActive, { color: colors.onSurfaceVariant }]}>
              {t("widgets.userList.lastActive", { defaultValue: "Last active" })}: {item.last_login_at}
            </AppText>
          )}
        </View>

        <View style={styles.userMeta}>
          {widgetConfig.showRole && (
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: `${roleColor}20` },
              ]}
            >
              <AppText
                style={[styles.roleBadgeText, { color: roleColor }]}
              >
                {t(`widgets.userList.roles.${item.role}`, { defaultValue: item.role })}
              </AppText>
            </View>
          )}
          {widgetConfig.showStatus && (
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColor },
              ]}
            />
          )}
        </View>

        <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading && !users?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t("widgets.userList.title", { defaultValue: "Users" })}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("widgets.userList.states.loading", { defaultValue: "Loading users..." })}
          </AppText>
        </View>
      </AppCard>
    );
  }

  // Error state
  if (error && !users?.length) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t("widgets.userList.title", { defaultValue: "Users" })}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("widgets.userList.states.error", { defaultValue: "Failed to load users" })}
          </AppText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <AppText style={styles.retryButtonText}>
              {t("common:actions.retry", { defaultValue: "Retry" })}
            </AppText>
          </TouchableOpacity>
        </View>
      </AppCard>
    );
  }

  return (
    <AppCard style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t("widgets.userList.title", { defaultValue: "Users" })}
        </AppText>
        <TouchableOpacity onPress={handleViewAll}>
          <AppText style={[styles.viewAll, { color: colors.primary }]}>
            {t("common:actions.viewAll", { defaultValue: "View All" })}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Search */}
      {widgetConfig.showSearch && (
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surfaceVariant,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <Icon name="magnify" size={20} color={colors.onSurfaceVariant} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder={t("widgets.userList.searchPlaceholder", {
              defaultValue: "Search users...",
            })}
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="close" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filters */}
      {widgetConfig.showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            {renderFilterChip(
              t("widgets.userList.allRoles", { defaultValue: "All" }),
              null,
              selectedRole === null,
              () => setSelectedRole(null)
            )}
            {["student", "teacher", "parent", "admin"].map((role) =>
              renderFilterChip(
                t(`widgets.userList.roles.${role}`, { defaultValue: role.charAt(0).toUpperCase() + role.slice(1) }),
                role,
                selectedRole === role,
                () => setSelectedRole(selectedRole === role ? null : role),
                getRoleColor(role)
              )
            )}
          </View>
        </View>
      )}

      {/* User List */}
      <FlatList
        data={users || []}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-search" size={48} color={colors.onSurfaceVariant} />
            <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              {t("widgets.userList.noUsers", { defaultValue: "No users found" })}
            </AppText>
          </View>
        }
      />
    </AppCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  viewAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  lastActive: {
    fontSize: 11,
    marginTop: 2,
  },
  userMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});

export default UserListWidget;
