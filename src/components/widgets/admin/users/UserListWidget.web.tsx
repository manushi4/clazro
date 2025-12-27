/**
 * UserListWidget - Web Version with DataTable
 *
 * Displays users in a sortable, paginated table on web.
 * Falls back to list on mobile (handled by ResponsiveList).
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../../theme/useAppTheme";
import { AppText } from "../../../../ui/components/AppText";
import { AppCard } from "../../../../ui/components/AppCard";
import { DataTable } from "../../../data/DataTable";
import { useUsersListQuery } from "../../../../hooks/queries/admin/useUsersListQuery";
import type { WidgetProps } from "../../../../types/widget.types";
import type { UserListItem } from "../../../../hooks/queries/admin/useUsersListQuery";
import type { ColumnDef, SortState, PaginationState } from "../../../../types/table.types";

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
  const [sortState, setSortState] = useState<SortState>({
    columnId: null,
    direction: null,
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: widgetConfig.maxItems || 10,
    total: 0,
  });

  // Fetch real data from database
  const { data: users, isLoading, error, refetch } = useUsersListQuery({
    search: searchQuery,
    role: selectedRole,
    status: selectedStatus,
    limit: pagination.pageSize,
    offset: (pagination.page - 1) * pagination.pageSize,
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

  const handleUserClick = useCallback(
    (user: UserListItem) => {
      if (!widgetConfig.enableTap) return;
      onNavigate?.("users-detail", { userId: user.id });
    },
    [widgetConfig.enableTap, onNavigate]
  );

  const handleViewAll = useCallback(() => {
    onNavigate?.("users-management", { view: "all" });
  }, [onNavigate]);

  // Define table columns
  const columns: ColumnDef<UserListItem>[] = useMemo(() => [
    {
      id: 'name',
      header: t("widgets.userList.columns.name", { defaultValue: "Name" }),
      accessor: 'name',
      sortable: true,
      minWidth: 180,
      cell: (value, row) => {
        const roleColor = getRoleColor(row.role);
        return (
          <View style={styles.nameCell}>
            <View style={[styles.avatar, { backgroundColor: `${roleColor}30` }]}>
              <AppText style={[styles.avatarText, { color: roleColor }]}>
                {value.charAt(0).toUpperCase()}
              </AppText>
            </View>
            <AppText style={[styles.userName, { color: colors.onSurface }]}>
              {value}
            </AppText>
          </View>
        );
      },
    },
    {
      id: 'email',
      header: t("widgets.userList.columns.email", { defaultValue: "Email" }),
      accessor: 'email',
      sortable: true,
      minWidth: 200,
      hideOnMobile: true,
    },
    {
      id: 'role',
      header: t("widgets.userList.columns.role", { defaultValue: "Role" }),
      accessor: 'role',
      sortable: true,
      width: 120,
      cell: (value) => {
        const roleColor = getRoleColor(value);
        return (
          <View style={[styles.roleBadge, { backgroundColor: `${roleColor}20` }]}>
            <AppText style={[styles.roleBadgeText, { color: roleColor }]}>
              {t(`widgets.userList.roles.${value}`, { defaultValue: value })}
            </AppText>
          </View>
        );
      },
    },
    {
      id: 'status',
      header: t("widgets.userList.columns.status", { defaultValue: "Status" }),
      accessor: 'status',
      sortable: true,
      width: 100,
      cell: (value) => {
        const statusColor = getStatusColor(value);
        return (
          <View style={styles.statusCell}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <AppText style={[styles.statusText, { color: colors.onSurface }]}>
              {t(`widgets.userList.statuses.${value}`, { defaultValue: value })}
            </AppText>
          </View>
        );
      },
    },
    {
      id: 'last_login_at',
      header: t("widgets.userList.columns.lastActive", { defaultValue: "Last Active" }),
      accessor: 'last_login_at',
      sortable: true,
      width: 140,
      hideOnMobile: true,
      hideOnTablet: true,
      cell: (value) => (
        <AppText style={[styles.lastActive, { color: colors.onSurfaceVariant }]}>
          {value || '-'}
        </AppText>
      ),
    },
  ], [t, colors, getRoleColor, getStatusColor]);

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
          borderRadius: borderRadius.small,
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

      {/* Data Table */}
      <DataTable
        data={users || []}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={isLoading}
        emptyMessage={t("widgets.userList.noUsers", { defaultValue: "No users found" })}
        sortState={sortState}
        onSortChange={setSortState}
        pagination={{
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: users?.length || 0,
        }}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onRowClick={handleUserClick}
        striped
        hoverable
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
    marginBottom: 16,
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
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
  },
  userName: {
    fontSize: 14,
    fontWeight: "500",
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statusCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
  lastActive: {
    fontSize: 13,
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
});

export default UserListWidget;
