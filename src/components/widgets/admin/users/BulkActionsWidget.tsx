/**
 * BulkActionsWidget - Admin Bulk User Operations
 *
 * Provides quick access to bulk user operations like
 * import, export, bulk approve, and bulk actions.
 *
 * Widget ID: users.bulk-actions
 * Category: actions
 * Roles: admin, super_admin
 *
 * Phase 1: Database Setup - Uses existing profiles table
 * Phase 2: Query Hook - useBulkActionsQuery for user counts
 * Phase 3: Widget Component - This file
 * Phase 4: Translations - EN/HI in admin.json
 * Phase 5: Widget Registry - Registered in widgetRegistry.ts
 * Phase 6: Platform Studio - Registered in platform-studio widgetRegistry.ts
 * Phase 7: Database Screen Layout - Added to users-management screen
 */

import React, { useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../../../theme/useAppTheme";
import { AppText } from "../../../../ui/components/AppText";
import { AppCard } from "../../../../ui/components/AppCard";
import type { WidgetProps } from "../../../../types/widget.types";
import { useBulkActionsQuery } from "../../../../hooks/queries/admin/useBulkActionsQuery";
import { 
  useBulkApprove, 
  useExportUsers, 
  useBulkSuspend,
  useBulkResetPasswords 
} from "../../../../hooks/mutations/admin/useBulkUserActions";

type BulkActionsConfig = {
  columns?: number;
  showLabels?: boolean;
  compactMode?: boolean;
  showCounts?: boolean;
};

export const BulkActionsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("admin");

  // Query hook for user counts and action status
  const { data, isLoading, error } = useBulkActionsQuery();

  // Mutation hooks for bulk operations
  const bulkApproveMutation = useBulkApprove();
  const exportUsersMutation = useExportUsers();
  const bulkSuspendMutation = useBulkSuspend();
  const bulkResetPasswordsMutation = useBulkResetPasswords();

  const widgetConfig: BulkActionsConfig = {
    columns: 2,
    showLabels: true,
    compactMode: false,
    showCounts: true,
    ...config,
  };

  // Get color from theme based on colorKey
  const getActionColor = useCallback((colorKey: string): string => {
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
  }, [colors]);

  const handleActionPress = useCallback(
    (actionId: string, count: number) => {
      switch (actionId) {
        case "import":
          onNavigate?.("bulk-import");
          break;

        case "export":
          Alert.alert(
            t("widgets.bulkActions.exportTitle", { defaultValue: "Export Users" }),
            t("widgets.bulkActions.exportMessage", {
              defaultValue: "Choose export format",
            }),
            [
              { text: t("common:actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
              {
                text: "CSV",
                onPress: () => {
                  exportUsersMutation.mutate(
                    { options: { exportFormat: "csv" } },
                    {
                      onSuccess: (result) => {
                        Alert.alert(
                          t("common:status.success", { defaultValue: "Success" }),
                          result.message
                        );
                      },
                      onError: (err) => {
                        Alert.alert(
                          t("common:status.error", { defaultValue: "Error" }),
                          err.message
                        );
                      },
                    }
                  );
                },
              },
              {
                text: "Excel",
                onPress: () => {
                  exportUsersMutation.mutate(
                    { options: { exportFormat: "excel" } },
                    {
                      onSuccess: (result) => {
                        Alert.alert(
                          t("common:status.success", { defaultValue: "Success" }),
                          result.message
                        );
                      },
                      onError: (err) => {
                        Alert.alert(
                          t("common:status.error", { defaultValue: "Error" }),
                          err.message
                        );
                      },
                    }
                  );
                },
              },
            ]
          );
          break;

        case "bulk-approve":
          if (count === 0) {
            Alert.alert(
              t("widgets.bulkActions.noUsersTitle", { defaultValue: "No Users" }),
              t("widgets.bulkActions.noPendingUsers", {
                defaultValue: "There are no pending users to approve.",
              })
            );
            return;
          }
          Alert.alert(
            t("widgets.bulkActions.bulkApproveTitle", { defaultValue: "Bulk Approve" }),
            t("widgets.bulkActions.bulkApproveMessage", {
              defaultValue: `This will approve all ${count} pending users. Continue?`,
              count,
            }),
            [
              { text: t("common:actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
              {
                text: t("common:actions.approve", { defaultValue: "Approve All" }),
                onPress: () => {
                  bulkApproveMutation.mutate(
                    { selectAll: true },
                    {
                      onSuccess: (result) => {
                        Alert.alert(
                          t("common:status.success", { defaultValue: "Success" }),
                          result.message
                        );
                      },
                      onError: (err) => {
                        Alert.alert(
                          t("common:status.error", { defaultValue: "Error" }),
                          err.message
                        );
                      },
                    }
                  );
                },
              },
            ]
          );
          break;

        case "bulk-email":
          onNavigate?.("compose-message", { mode: "bulk" });
          break;

        case "bulk-suspend":
          Alert.alert(
            t("widgets.bulkActions.bulkSuspendTitle", { defaultValue: "Bulk Suspend" }),
            t("widgets.bulkActions.bulkSuspendMessage", {
              defaultValue: "Select users to suspend from the user list.",
            }),
            [
              { 
                text: t("common:actions.ok", { defaultValue: "OK" }),
                onPress: () => onNavigate?.("users-management", { action: "select-for-suspend" }),
              }
            ]
          );
          break;

        case "reset-passwords":
          Alert.alert(
            t("widgets.bulkActions.resetPasswordsTitle", { defaultValue: "Reset Passwords" }),
            t("widgets.bulkActions.resetPasswordsMessage", {
              defaultValue: "This will send password reset emails to selected users.",
            }),
            [
              { text: t("common:actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
              {
                text: t("common:actions.continue", { defaultValue: "Continue" }),
                onPress: () => {
                  onNavigate?.("users-management", { action: "select-for-reset" });
                },
              },
            ]
          );
          break;

        default:
          break;
      }
    },
    [t, onNavigate, bulkApproveMutation, exportUsersMutation]
  );

  // Loading state
  if (isLoading) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("common:states.loading", { defaultValue: "Loading..." })}
          </AppText>
        </View>
      </AppCard>
    );
  }

  // Error state
  if (error) {
    return (
      <AppCard style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("common:states.error", { defaultValue: "Failed to load data" })}
          </AppText>
        </View>
      </AppCard>
    );
  }

  const actions = data?.availableActions || [];

  const renderActionButton = (action: typeof actions[0]) => {
    const actionColor = getActionColor(action.colorKey);
    const isProcessing = 
      (action.id === "bulk-approve" && bulkApproveMutation.isPending) ||
      (action.id === "export" && exportUsersMutation.isPending) ||
      (action.id === "bulk-suspend" && bulkSuspendMutation.isPending) ||
      (action.id === "reset-passwords" && bulkResetPasswordsMutation.isPending);

    return (
      <TouchableOpacity
        key={action.id}
        style={[
          styles.actionButton,
          widgetConfig.compactMode && styles.actionButtonCompact,
          {
            backgroundColor: actionColor + "15",
            borderRadius: borderRadius.md,
            opacity: action.enabled ? 1 : 0.5,
          },
        ]}
        onPress={() => handleActionPress(action.id, action.count)}
        activeOpacity={0.7}
        disabled={!action.enabled || isProcessing}
      >
        <View
          style={[
            styles.iconContainer,
            widgetConfig.compactMode && styles.iconContainerCompact,
            { backgroundColor: actionColor + "25" },
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={actionColor} />
          ) : (
            <Icon
              name={action.icon}
              size={widgetConfig.compactMode ? 20 : 24}
              color={actionColor}
            />
          )}
        </View>
        {widgetConfig.showLabels && (
          <AppText
            style={[
              styles.actionLabel,
              widgetConfig.compactMode && styles.actionLabelCompact,
              { color: colors.onSurface },
            ]}
            numberOfLines={2}
          >
            {t(action.labelKey, { defaultValue: action.labelKey.split(".").pop() })}
          </AppText>
        )}
        {widgetConfig.showCounts && action.count > 0 && (
          <View style={[styles.countBadge, { backgroundColor: actionColor + "30" }]}>
            <AppText style={[styles.countText, { color: actionColor }]}>
              {action.count > 999 ? "999+" : action.count}
            </AppText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <AppCard style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {t("widgets.bulkActions.title", { defaultValue: "Bulk Actions" })}
        </AppText>
        <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          {t("widgets.bulkActions.subtitle", { 
            defaultValue: "{{count}} users available",
            count: data?.totalUsers || 0,
          })}
        </AppText>
      </View>

      {/* Actions Grid */}
      <View
        style={[
          styles.actionsGrid,
          { gap: widgetConfig.compactMode ? 8 : 12 },
        ]}
      >
        {actions.map(renderActionButton)}
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  actionButton: {
    width: "48%",
    padding: 16,
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  actionButtonCompact: {
    padding: 12,
    width: "31%",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainerCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  actionLabelCompact: {
    fontSize: 11,
  },
  countBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  countText: {
    fontSize: 10,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
  },
});

export default BulkActionsWidget;
