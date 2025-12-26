import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { getLocalizedField } from "../../../utils/getLocalizedField";
import { AppText } from "../../../ui/components/AppText";
import {
  useLeaveRequestQuery,
  useLeaveBalanceQuery,
  type LeaveRequest,
} from "../../../hooks/queries/teacher/useLeaveRequestQuery";

type FilterType = "all" | "pending" | "approved" | "rejected";

const getLeaveTypeConfig = (leaveType: string) => {
  switch (leaveType) {
    case "sick":
      return { color: "#F44336", icon: "hospital-box", label: "Sick Leave" };
    case "casual":
      return { color: "#2196F3", icon: "account-clock", label: "Casual Leave" };
    case "earned":
      return { color: "#4CAF50", icon: "calendar-check", label: "Earned Leave" };
    case "maternity":
      return { color: "#E91E63", icon: "baby-carriage", label: "Maternity Leave" };
    case "paternity":
      return { color: "#9C27B0", icon: "human-male-child", label: "Paternity Leave" };
    case "unpaid":
      return { color: "#FF9800", icon: "cash-remove", label: "Unpaid Leave" };
    default:
      return { color: "#607D8B", icon: "calendar-blank", label: "Other Leave" };
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending":
      return { color: "#FF9800", icon: "clock-outline", label: "Pending" };
    case "approved":
      return { color: "#4CAF50", icon: "check-circle", label: "Approved" };
    case "rejected":
      return { color: "#F44336", icon: "close-circle", label: "Rejected" };
    case "cancelled":
      return { color: "#9E9E9E", icon: "cancel", label: "Cancelled" };
    default:
      return { color: "#607D8B", icon: "help-circle", label: status };
  }
};

const formatDateRange = (startDate: string, endDate: string, isHalfDay: boolean): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const formatDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  if (start.toDateString() === end.toDateString()) {
    return isHalfDay ? `${formatDate(start)} (Half Day)` : formatDate(start);
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
};

export const LeaveRequestWidget: React.FC<WidgetProps> = ({ config }) => {
  const navigation = useNavigation();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");
  const [filter, setFilter] = useState<FilterType>("all");

  const maxItems = (config?.maxItems as number) || 5;
  const showBalance = config?.showBalance !== false;

  const { data: requests, isLoading, error, refetch } = useLeaveRequestQuery({
    status: filter === "all" ? "all" : filter,
    limit: maxItems,
  });

  const { data: balance } = useLeaveBalanceQuery();

  const handleApplyLeave = () => {
    (navigation as any).navigate("LeaveRequestCreate");
  };

  const handleViewRequest = (request: LeaveRequest) => {
    (navigation as any).navigate("LeaveRequestDetail", { requestId: request.id });
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: t("widgets.leaveRequest.filters.all", { defaultValue: "All" }) },
    { key: "pending", label: t("widgets.leaveRequest.filters.pending", { defaultValue: "Pending" }) },
    { key: "approved", label: t("widgets.leaveRequest.filters.approved", { defaultValue: "Approved" }) },
    { key: "rejected", label: t("widgets.leaveRequest.filters.rejected", { defaultValue: "Rejected" }) },
  ];

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.leaveRequest.states.error", { defaultValue: "Failed to load" })}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>
            {t("common.retry", { defaultValue: "Retry" })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Leave Balance Summary */}
      {showBalance && balance && (
        <View style={styles.balanceContainer}>
          <View style={[styles.balanceCard, { backgroundColor: colors.surfaceVariant }]}>
            <View style={[styles.balanceIcon, { backgroundColor: "#F4433615" }]}>
              <Icon name="hospital-box" size={16} color="#F44336" />
            </View>
            <View style={styles.balanceInfo}>
              <AppText style={[styles.balanceLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.leaveRequest.balance.sick", { defaultValue: "Sick" })}
              </AppText>
              <AppText style={[styles.balanceValue, { color: colors.onSurface }]}>
                {balance.sick.available}/{balance.sick.total}
              </AppText>
            </View>
          </View>
          <View style={[styles.balanceCard, { backgroundColor: colors.surfaceVariant }]}>
            <View style={[styles.balanceIcon, { backgroundColor: "#2196F315" }]}>
              <Icon name="account-clock" size={16} color="#2196F3" />
            </View>
            <View style={styles.balanceInfo}>
              <AppText style={[styles.balanceLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.leaveRequest.balance.casual", { defaultValue: "Casual" })}
              </AppText>
              <AppText style={[styles.balanceValue, { color: colors.onSurface }]}>
                {balance.casual.available}/{balance.casual.total}
              </AppText>
            </View>
          </View>
          <View style={[styles.balanceCard, { backgroundColor: colors.surfaceVariant }]}>
            <View style={[styles.balanceIcon, { backgroundColor: "#4CAF5015" }]}>
              <Icon name="calendar-check" size={16} color="#4CAF50" />
            </View>
            <View style={styles.balanceInfo}>
              <AppText style={[styles.balanceLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.leaveRequest.balance.earned", { defaultValue: "Earned" })}
              </AppText>
              <AppText style={[styles.balanceValue, { color: colors.onSurface }]}>
                {balance.earned.available}/{balance.earned.total}
              </AppText>
            </View>
          </View>
        </View>
      )}

      {/* Apply Leave Button */}
      <TouchableOpacity
        onPress={handleApplyLeave}
        style={[styles.applyBtn, { backgroundColor: colors.primary }]}
      >
        <Icon name="plus" size={18} color={colors.onPrimary} />
        <AppText style={{ color: colors.onPrimary, fontSize: 14, fontWeight: "600" }}>
          {t("widgets.leaveRequest.applyLeave", { defaultValue: "Apply for Leave" })}
        </AppText>
      </TouchableOpacity>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f.key ? colors.primary : colors.surfaceVariant,
                borderRadius: borderRadius.full || 20,
              },
            ]}
          >
            <AppText
              style={{
                color: filter === f.key ? colors.onPrimary : colors.onSurfaceVariant,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {f.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Empty State */}
      {!requests?.length ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="calendar-blank-outline" size={32} color={colors.onSurfaceVariant} />
          <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
            {t("widgets.leaveRequest.states.empty", { defaultValue: "No leave requests" })}
          </AppText>
        </View>
      ) : (
        /* Leave Requests List */
        <View style={styles.listContainer}>
          {requests.slice(0, maxItems).map((request, index) => {
            const typeConfig = getLeaveTypeConfig(request.leave_type);
            const statusConfig = getStatusConfig(request.status);

            return (
              <TouchableOpacity
                key={request.id}
                onPress={() => handleViewRequest(request)}
                style={[
                  styles.requestCard,
                  {
                    backgroundColor: colors.surface,
                    borderRadius: borderRadius.medium,
                    borderLeftWidth: 4,
                    borderLeftColor: typeConfig.color,
                  },
                  index < Math.min(requests.length, maxItems) - 1 && { marginBottom: 10 },
                ]}
              >
                {/* Header */}
                <View style={styles.requestHeader}>
                  <View style={[styles.typeIcon, { backgroundColor: `${typeConfig.color}15` }]}>
                    <Icon name={typeConfig.icon} size={20} color={typeConfig.color} />
                  </View>
                  <View style={styles.headerContent}>
                    <AppText style={[styles.leaveType, { color: colors.onSurface }]}>
                      {typeConfig.label}
                    </AppText>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}15` }]}>
                      <Icon name={statusConfig.icon} size={12} color={statusConfig.color} />
                      <AppText style={{ color: statusConfig.color, fontSize: 11, fontWeight: "600" }}>
                        {statusConfig.label}
                      </AppText>
                    </View>
                  </View>
                </View>

                {/* Date and Duration */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Icon name="calendar-range" size={14} color={colors.onSurfaceVariant} />
                    <AppText style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
                      {formatDateRange(request.start_date, request.end_date, request.is_half_day)}
                    </AppText>
                  </View>
                  <View style={styles.detailItem}>
                    <Icon name="clock-outline" size={14} color={colors.onSurfaceVariant} />
                    <AppText style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
                      {request.duration_days} {request.duration_days === 1 ? "day" : "days"}
                    </AppText>
                  </View>
                </View>

                {/* Reason */}
                {(request.reason_en || request.reason_hi) && (
                  <AppText
                    style={[styles.reason, { color: colors.onSurfaceVariant }]}
                    numberOfLines={2}
                  >
                    {getLocalizedField(request, "reason")}
                  </AppText>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* View All Link */}
      {requests && requests.length > 0 && (
        <TouchableOpacity
          onPress={() => (navigation as any).navigate("LeaveRequestList")}
          style={[styles.viewAllBtn, { borderColor: colors.outlineVariant }]}
        >
          <AppText style={{ color: colors.primary, fontWeight: "600" }}>
            {t("widgets.leaveRequest.viewAll", { defaultValue: "View All Requests" })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  stateContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  balanceContainer: {
    flexDirection: "row",
    gap: 8,
  },
  balanceCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  balanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContainer: {
    gap: 8,
    paddingRight: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  listContainer: {},
  requestCard: {
    padding: 14,
    gap: 10,
  },
  requestHeader: {
    flexDirection: "row",
    gap: 12,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  leaveType: {
    fontSize: 15,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  reason: {
    fontSize: 12,
    lineHeight: 16,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 4,
  },
});
