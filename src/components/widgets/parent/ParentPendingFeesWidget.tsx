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

export const ParentPendingFeesWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("parent");
  const { data, isLoading, error } = useChildrenFeesQuery();

  // Config options with defaults
  const layoutStyle = (config?.layoutStyle as LayoutStyle) || "list";
  const maxItems = (config?.maxItems as number) || 4;
  const showDueDate = config?.showDueDate !== false;
  const showFeeType = config?.showFeeType !== false;
  const showAmount = config?.showAmount !== false;
  const showPayButton = config?.showPayButton !== false;
  const showOverdueCount = config?.showOverdueCount !== false;
  const enableTap = config?.enableTap !== false;

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.pendingFees.states.loading")}
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
          {t("widgets.pendingFees.states.error")}
        </AppText>
      </View>
    );
  }

  // Aggregate pending and overdue fees from all children
  const pendingFees: FeeRecord[] = [];
  let overdueCount = 0;

  data?.forEach((child) => {
    pendingFees.push(...child.pending_fees, ...child.partial_fees);
    overdueCount += child.overdue_fees.length;
  });

  // Sort by due date (earliest first)
  const sortedFees = [...pendingFees].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const displayFees = sortedFees.slice(0, maxItems);

  // Empty state
  if (displayFees.length === 0 && overdueCount === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="check-circle" size={40} color={colors.success} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.pendingFees.states.empty")}
        </AppText>
        <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
          {t("widgets.pendingFees.states.emptySubtitle")}
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

  // Calculate days until due
  const getDueDaysText = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return t("widgets.pendingFees.labels.daysOverdue", { days: Math.abs(diffDays) });
    } else if (diffDays === 0) {
      return t("widgets.pendingFees.labels.dueToday");
    } else if (diffDays === 1) {
      return t("widgets.pendingFees.labels.dueTomorrow");
    } else {
      return t("widgets.pendingFees.labels.dueInDays", { days: diffDays });
    }
  };

  // Get urgency color based on due date
  const getUrgencyColor = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return colors.error;
    if (diffDays <= 3) return colors.warning;
    return colors.primary;
  };

  // Render fee item based on layout
  const renderFeeItem = (fee: FeeRecord, index: number) => {
    const urgencyColor = getUrgencyColor(fee.due_date);
    const remaining = fee.amount - (fee.paid_amount || 0);
    const isPartial = fee.status === "partial";

    if (layoutStyle === "compact") {
      return (
        <TouchableOpacity
          key={fee.id}
          style={[styles.compactItem, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => handleFeePress(fee)}
          disabled={!enableTap}
        >
          <View style={[styles.urgencyBar, { backgroundColor: urgencyColor }]} />
          <View style={styles.compactContent}>
            <AppText style={[styles.compactTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {getLocalizedField(fee, "title")}
            </AppText>
            {showDueDate && (
              <AppText style={[styles.compactDue, { color: urgencyColor }]}>
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
          {showFeeType && (
            <View style={[styles.cardIcon, { backgroundColor: `${urgencyColor}20` }]}>
              <Icon name={getFeeTypeIcon(fee.fee_type)} size={20} color={urgencyColor} />
            </View>
          )}
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
            {getLocalizedField(fee, "title")}
          </AppText>
          {showAmount && (
            <AppText style={[styles.cardAmount, { color: urgencyColor }]}>
              {formatCurrency(remaining)}
            </AppText>
          )}
          {showDueDate && (
            <AppText style={[styles.cardDue, { color: colors.onSurfaceVariant }]}>
              {getDueDaysText(fee.due_date)}
            </AppText>
          )}
          {isPartial && (
            <View style={[styles.partialBadge, { backgroundColor: `${colors.warning}20` }]}>
              <AppText style={[styles.partialText, { color: colors.warning }]}>
                {t("widgets.pendingFees.labels.partial")}
              </AppText>
            </View>
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
            <View style={[styles.feeTypeIcon, { backgroundColor: `${urgencyColor}20` }]}>
              <Icon name={getFeeTypeIcon(fee.fee_type)} size={20} color={urgencyColor} />
            </View>
          )}
          <View style={styles.listContent}>
            <View style={styles.listTitleRow}>
              <AppText style={[styles.listTitle, { color: colors.onSurface }]} numberOfLines={1}>
                {getLocalizedField(fee, "title")}
              </AppText>
              {isPartial && (
                <View style={[styles.partialBadgeSmall, { backgroundColor: `${colors.warning}20` }]}>
                  <AppText style={[styles.partialTextSmall, { color: colors.warning }]}>
                    {t("widgets.pendingFees.labels.partial")}
                  </AppText>
                </View>
              )}
            </View>
            {showDueDate && (
              <AppText style={[styles.listDue, { color: urgencyColor }]}>
                {getDueDaysText(fee.due_date)}
              </AppText>
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
              style={[styles.payButton, { backgroundColor: colors.primary }]}
              onPress={() => handlePayPress(fee)}
            >
              <AppText style={[styles.payButtonText, { color: colors.onPrimary }]}>
                {t("widgets.pendingFees.labels.pay")}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Overdue Alert Banner */}
      {showOverdueCount && overdueCount > 0 && (
        <TouchableOpacity
          style={[styles.overdueAlert, { backgroundColor: colors.errorContainer }]}
          onPress={handleViewAll}
        >
          <Icon name="alert-circle" size={18} color={colors.error} />
          <AppText style={[styles.overdueText, { color: colors.error }]}>
            {t("widgets.pendingFees.overdueAlert", { count: overdueCount })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.error} />
        </TouchableOpacity>
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
      {(pendingFees.length > maxItems || overdueCount > 0) && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.pendingFees.actions.viewAll", { count: pendingFees.length + overdueCount })}
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
  // Overdue Alert
  overdueAlert: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  overdueText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
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
    gap: 2,
  },
  listTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  listDue: {
    fontSize: 12,
  },
  listRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  listAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  // Cards Layout
  cardsContainer: {
    gap: 12,
    paddingRight: 4,
  },
  cardItem: {
    width: 140,
    padding: 14,
    borderRadius: 12,
    gap: 8,
    alignItems: "center",
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  cardAmount: {
    fontSize: 16,
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
  urgencyBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
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
  partialBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  partialText: {
    fontSize: 10,
    fontWeight: "600",
  },
  partialBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  partialTextSmall: {
    fontSize: 9,
    fontWeight: "600",
  },
  payButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  payButtonText: {
    fontSize: 12,
    fontWeight: "600",
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

export default ParentPendingFeesWidget;
