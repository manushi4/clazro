import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useChildrenFeesQuery, FeeRecord } from "../../../hooks/queries/parent/useChildrenFeesQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

type LayoutStyle = "list" | "cards" | "compact";

export const ParentFeeSummaryWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const { data, isLoading, error } = useChildrenFeesQuery();

  // Config options with defaults
  const layoutStyle = (config?.layoutStyle as LayoutStyle) || "list";
  const maxItems = (config?.maxItems as number) || 5;
  const showTotalSummary = config?.showTotalSummary !== false;
  const showDueDate = config?.showDueDate !== false;
  const showFeeType = config?.showFeeType !== false;
  const showAmount = config?.showAmount !== false;
  const showPayButton = config?.showPayButton !== false;
  const showOverdueFirst = config?.showOverdueFirst !== false;
  const enableTap = config?.enableTap !== false;
  const showProgressBar = config?.showProgressBar !== false;

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.feeSummary.states.loading")}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.feeSummary.states.error")}
        </AppText>
      </View>
    );
  }

  // Aggregate all fees from all children
  const allFees: FeeRecord[] = [];
  let totalPending = 0;
  let totalOverdue = 0;

  data?.forEach((child) => {
    allFees.push(...child.pending_fees, ...child.overdue_fees, ...child.partial_fees);
    totalPending += child.total_pending;
    totalOverdue += child.total_overdue;
  });

  // Sort fees: overdue first if enabled, then by due date
  const sortedFees = [...allFees].sort((a, b) => {
    if (showOverdueFirst) {
      if (a.status === "overdue" && b.status !== "overdue") return -1;
      if (a.status !== "overdue" && b.status === "overdue") return 1;
    }
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const displayFees = sortedFees.slice(0, maxItems);
  const totalDue = totalPending + totalOverdue;

  // Empty state
  if (displayFees.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="check-circle" size={40} color={colors.success} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.feeSummary.states.empty")}
        </AppText>
        <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
          {t("widgets.feeSummary.states.emptySubtitle")}
        </AppText>
      </View>
    );
  }

  const handleFeePress = (fee: FeeRecord) => {
    if (enableTap) {
      onNavigate?.("fee-detail", { feeId: fee.id });
    }
  };

  const handlePayPress = (fee: FeeRecord) => {
    onNavigate?.("fee-detail", { feeId: fee.id });
  };

  const handleViewAll = () => {
    onNavigate?.("fees-overview");
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue":
        return colors.error;
      case "partial":
        return colors.warning;
      case "pending":
        return colors.primary;
      default:
        return colors.success;
    }
  };

  // Get fee type icon
  const getFeeTypeIcon = (type: string) => {
    switch (type) {
      case "tuition":
        return "school";
      case "exam":
        return "file-document";
      case "transport":
        return "bus";
      case "library":
        return "book";
      case "lab":
        return "flask";
      default:
        return "cash";
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Calculate days until due or overdue
  const getDueDaysText = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return t("widgets.feeSummary.labels.daysOverdue", { days: Math.abs(diffDays) });
    } else if (diffDays === 0) {
      return t("widgets.feeSummary.labels.dueToday");
    } else if (diffDays === 1) {
      return t("widgets.feeSummary.labels.dueTomorrow");
    } else {
      return t("widgets.feeSummary.labels.dueInDays", { days: diffDays });
    }
  };

  // Render fee item based on layout
  const renderFeeItem = (fee: FeeRecord, index: number) => {
    const statusColor = getStatusColor(fee.status);
    const remaining = fee.amount - (fee.paid_amount || 0);
    const progressPercent = fee.paid_amount ? (fee.paid_amount / fee.amount) * 100 : 0;

    if (layoutStyle === "compact") {
      return (
        <TouchableOpacity
          key={fee.id}
          style={[styles.compactItem, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => handleFeePress(fee)}
          disabled={!enableTap}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <View style={styles.compactContent}>
            <AppText style={[styles.compactTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {getLocalizedField(fee, "title")}
            </AppText>
            {showDueDate && (
              <AppText style={[styles.compactDue, { color: statusColor }]}>
                {getDueDaysText(fee.due_date)}
              </AppText>
            )}
          </View>
          {showAmount && (
            <AppText style={[styles.compactAmount, { color: colors.onSurface }]}>
              {formatCurrency(remaining)}
            </AppText>
          )}
        </TouchableOpacity>
      );
    }

    if (layoutStyle === "cards") {
      return (
        <TouchableOpacity
          key={fee.id}
          style={[styles.cardItem, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => handleFeePress(fee)}
          disabled={!enableTap}
        >
          <View style={[styles.cardHeader, { borderBottomColor: colors.outline }]}>
            {showFeeType && (
              <View style={[styles.feeTypeIcon, { backgroundColor: `${statusColor}20` }]}>
                <Icon name={getFeeTypeIcon(fee.fee_type)} size={18} color={statusColor} />
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <AppText style={[styles.statusText, { color: statusColor }]}>
                {t(`widgets.feeSummary.labels.${fee.status}`)}
              </AppText>
            </View>
          </View>
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
            {getLocalizedField(fee, "title")}
          </AppText>
          {showAmount && (
            <AppText style={[styles.cardAmount, { color: colors.primary }]}>
              {formatCurrency(remaining)}
            </AppText>
          )}
          {showDueDate && (
            <AppText style={[styles.cardDue, { color: statusColor }]}>
              {getDueDaysText(fee.due_date)}
            </AppText>
          )}
          {showProgressBar && fee.status === "partial" && (
            <View style={[styles.progressContainer, { backgroundColor: colors.outline }]}>
              <View
                style={[styles.progressBar, { width: `${progressPercent}%`, backgroundColor: colors.success }]}
              />
            </View>
          )}
          {showPayButton && (
            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: colors.primary }]}
              onPress={() => handlePayPress(fee)}
            >
              <AppText style={[styles.payButtonText, { color: colors.onPrimary }]}>
                {t("widgets.feeSummary.labels.payNow")}
              </AppText>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    }

    // Default list layout
    return (
      <TouchableOpacity
        key={fee.id}
        style={[styles.listItem, { backgroundColor: colors.surfaceVariant }]}
        onPress={() => handleFeePress(fee)}
        disabled={!enableTap}
      >
        <View style={styles.listLeft}>
          {showFeeType && (
            <View style={[styles.feeTypeIcon, { backgroundColor: `${statusColor}20` }]}>
              <Icon name={getFeeTypeIcon(fee.fee_type)} size={20} color={statusColor} />
            </View>
          )}
          <View style={styles.listContent}>
            <AppText style={[styles.listTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {getLocalizedField(fee, "title")}
            </AppText>
            <View style={styles.listMeta}>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                <AppText style={[styles.statusText, { color: statusColor }]}>
                  {t(`widgets.feeSummary.labels.${fee.status}`)}
                </AppText>
              </View>
              {showDueDate && (
                <AppText style={[styles.listDue, { color: colors.onSurfaceVariant }]}>
                  {getDueDaysText(fee.due_date)}
                </AppText>
              )}
            </View>
            {showProgressBar && fee.status === "partial" && (
              <View style={styles.listProgressWrapper}>
                <View style={[styles.progressContainer, { backgroundColor: colors.outline }]}>
                  <View
                    style={[styles.progressBar, { width: `${progressPercent}%`, backgroundColor: colors.success }]}
                  />
                </View>
                <AppText style={[styles.partialText, { color: colors.onSurfaceVariant }]}>
                  {t("widgets.feeSummary.labels.partialPaid", { amount: formatCurrency(fee.paid_amount || 0) })}
                </AppText>
              </View>
            )}
          </View>
        </View>
        <View style={styles.listRight}>
          {showAmount && (
            <AppText style={[styles.listAmount, { color: colors.onSurface }]}>
              {formatCurrency(remaining)}
            </AppText>
          )}
          {showPayButton && (
            <TouchableOpacity
              style={[styles.smallPayButton, { backgroundColor: colors.primary }]}
              onPress={() => handlePayPress(fee)}
            >
              <Icon name="credit-card" size={14} color={colors.onPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      {showTotalSummary && (
        <View style={[styles.summaryHeader, { backgroundColor: colors.surfaceVariant }]}>
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.feeSummary.summary.totalDue")}
            </AppText>
            <AppText style={[styles.summaryAmount, { color: colors.primary }]}>
              {formatCurrency(totalDue)}
            </AppText>
          </View>
          {totalOverdue > 0 && (
            <View style={styles.summaryItem}>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.feeSummary.summary.overdue")}
              </AppText>
              <AppText style={[styles.summaryAmount, { color: colors.error }]}>
                {formatCurrency(totalOverdue)}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Fee List */}
      {layoutStyle === "cards" ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {displayFees.map((fee, index) => renderFeeItem(fee, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displayFees.map((fee, index) => renderFeeItem(fee, index))}
        </View>
      )}

      {/* View All Button */}
      {allFees.length > maxItems && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.feeSummary.actions.viewAll", { count: allFees.length })}
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
  loadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  errorContainer: {
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    borderRadius: 12,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
  },
  // Summary Header
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 14,
    borderRadius: 12,
  },
  summaryItem: {
    alignItems: "center",
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  // List Layout
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
  },
  listLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  listContent: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  listMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listDue: {
    fontSize: 11,
  },
  listRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  listAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  listProgressWrapper: {
    marginTop: 4,
    gap: 2,
  },
  // Cards Layout
  cardsContainer: {
    gap: 12,
    paddingRight: 4,
  },
  cardItem: {
    width: 160,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardDue: {
    fontSize: 11,
  },
  // Compact Layout
  compactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  compactDue: {
    fontSize: 11,
  },
  compactAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Common
  feeTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  progressContainer: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  partialText: {
    fontSize: 10,
  },
  payButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  payButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  smallPayButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default ParentFeeSummaryWidget;
