/**
 * PendingApprovalsWidget - Admin Pending User Approvals
 *
 * Phase 3: Widget Component following WIDGET_DEVELOPMENT_GUIDE.md
 *
 * Displays users awaiting approval with quick approve/reject actions.
 * Uses usePendingApprovalsQuery hook for real data with fallback.
 *
 * Widget ID: users.pending-approvals
 * Category: list
 * Roles: admin, super_admin
 */

import React, { useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../../theme/useAppTheme";
import { AppText } from "../../../../ui/components/AppText";
import { AppCard } from "../../../../ui/components/AppCard";
import type { WidgetProps } from "../../../../types/widget.types";
import {
  usePendingApprovalsQuery,
  useApproveUser,
  useRejectUser,
  type PendingUser,
} from "../../../../hooks/queries/admin";

type PendingApprovalsConfig = {
  maxItems?: number;
  showOrganization?: boolean;
  showQuickActions?: boolean;
  enableTap?: boolean;
};

export const PendingApprovalsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("admin");

  // Widget configuration with defaults
  const widgetConfig: PendingApprovalsConfig = {
    maxItems: 5,
    showOrganization: true,
    showQuickActions: true,
    enableTap: true,
    ...config,
  };

  // Fetch pending users from database
  const { data: pendingUsers, isLoading, error, refetch } = usePendingApprovalsQuery({
    limit: widgetConfig.maxItems,
  });

  // Mutations for approve/reject
  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();

  // Role colors using theme
  const getRoleColor = useCallback((role: string) => {
    switch (role) {
      case 'student': return colors.primary;
      case 'teacher': return colors.success || '#4CAF50';
      case 'parent': return colors.warning || '#FF9800';
      default: return colors.tertiary;
    }
  }, [colors]);

  const handleApprove = useCallback(
    (user: PendingUser) => {
      Alert.alert(
        t("widgets.pendingApprovals.approveTitle"),
        t("widgets.pendingApprovals.approveMessage", { name: user.name }),
        [
          { text: t("common:actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
          {
            text: t("common:actions.approve", { defaultValue: "Approve" }),
            onPress: () => {
              approveUser.mutate(user.id, {
                onError: (err) => {
                  Alert.alert("Error", "Failed to approve user. Please try again.");
                  console.error('[PendingApprovalsWidget] Approve error:', err);
                },
              });
            },
          },
        ]
      );
    },
    [t, approveUser]
  );

  const handleReject = useCallback(
    (user: PendingUser) => {
      Alert.alert(
        t("widgets.pendingApprovals.rejectTitle"),
        t("widgets.pendingApprovals.rejectMessage", { name: user.name }),
        [
          { text: t("common:actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
          {
            text: t("common:actions.reject", { defaultValue: "Reject" }),
            style: "destructive",
            onPress: () => {
              rejectUser.mutate({ userId: user.id }, {
                onError: (err) => {
                  Alert.alert("Error", "Failed to reject user. Please try again.");
                  console.error('[PendingApprovalsWidget] Reject error:', err);
                },
              });
            },
          },
        ]
      );
    },
    [t, rejectUser]
  );

  const handleUserPress = useCallback(
    (user: PendingUser) => {
      if (!widgetConfig.enableTap) return;
      onNavigate?.("users-detail", { userId: user.id, mode: "approval" });
    },
    [widgetConfig.enableTap, onNavigate]
  );

  const handleViewAll = useCallback(() => {
    onNavigate?.("users-management", { filter: "pending" });
  }, [onNavigate]);

  // Loading state
  if (isLoading) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t("widgets.pendingApprovals.title")}
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppCard>
    );
  }

  // Error state
  if (error) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.header}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t("widgets.pendingApprovals.title")}
          </AppText>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.onSurfaceVariant }]}>
            Failed to load pending approvals
          </AppText>
          <TouchableOpacity onPress={() => refetch()}>
            <AppText style={[styles.retryText, { color: colors.primary }]}>
              Tap to retry
            </AppText>
          </TouchableOpacity>
        </View>
      </AppCard>
    );
  }

  const users = pendingUsers || [];

  const renderPendingItem = (user: PendingUser) => {
    const roleColor = getRoleColor(user.role);

    return (
      <View
        key={user.id}
        style={[
          styles.pendingItem,
          { borderBottomColor: colors.outlineVariant },
        ]}
      >
        <TouchableOpacity
          style={styles.userSection}
          onPress={() => handleUserPress(user)}
          disabled={!widgetConfig.enableTap}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`View ${user.name}'s profile`}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: roleColor + "30" },
            ]}
          >
            <AppText style={[styles.avatarText, { color: roleColor }]}>
              {user.name.charAt(0).toUpperCase()}
            </AppText>
          </View>

          <View style={styles.userInfo}>
            <AppText style={[styles.userName, { color: colors.onSurface }]}>
              {user.name}
            </AppText>
            <AppText style={[styles.userEmail, { color: colors.onSurfaceVariant }]}>
              {user.email}
            </AppText>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.roleBadge,
                  { backgroundColor: roleColor + "20" },
                ]}
              >
                <AppText
                  style={[styles.roleBadgeText, { color: roleColor }]}
                >
                  {t(`widgets.userList.roles.${user.role}`, { defaultValue: user.role })}
                </AppText>
              </View>
              <AppText style={[styles.requestedAt, { color: colors.onSurfaceVariant }]}>
                {user.requestedAt}
              </AppText>
            </View>
            {widgetConfig.showOrganization && user.organization && (
              <AppText style={[styles.organization, { color: colors.onSurfaceVariant }]}>
                {user.organization}
              </AppText>
            )}
          </View>
        </TouchableOpacity>

        {widgetConfig.showQuickActions && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: (colors.success || "#4CAF50") + "20" },
              ]}
              onPress={() => handleApprove(user)}
              activeOpacity={0.7}
              disabled={approveUser.isPending}
              accessibilityRole="button"
              accessibilityLabel={`Approve ${user.name}`}
            >
              {approveUser.isPending && approveUser.variables === user.id ? (
                <ActivityIndicator size="small" color={colors.success || "#4CAF50"} />
              ) : (
                <Icon name="check" size={18} color={colors.success || "#4CAF50"} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.error + "20" },
              ]}
              onPress={() => handleReject(user)}
              activeOpacity={0.7}
              disabled={rejectUser.isPending}
              accessibilityRole="button"
              accessibilityLabel={`Reject ${user.name}`}
            >
              {rejectUser.isPending && (rejectUser.variables as any)?.userId === user.id ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Icon name="close" size={18} color={colors.error} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <AppCard style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t("widgets.pendingApprovals.title")}
          </AppText>
          {users.length > 0 && (
            <View
              style={[
                styles.countBadge,
                { backgroundColor: colors.warning || "#FF9800" },
              ]}
            >
              <AppText style={styles.countText}>{users.length}</AppText>
            </View>
          )}
        </View>
        <TouchableOpacity 
          onPress={handleViewAll}
          accessibilityRole="button"
          accessibilityLabel="View all pending approvals"
        >
          <AppText style={[styles.viewAll, { color: colors.primary }]}>
            {t("common:actions.viewAll", { defaultValue: "View All" })}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Pending List */}
      {users.length > 0 ? (
        users.map(renderPendingItem)
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="check-circle" size={48} color={colors.success || "#4CAF50"} />
          <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            {t("widgets.pendingApprovals.noPending")}
          </AppText>
        </View>
      )}
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  viewAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  pendingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  requestedAt: {
    fontSize: 11,
  },
  organization: {
    fontSize: 11,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
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

export default PendingApprovalsWidget;
