import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useChildrenFeesQuery, FeeRecord, FeeStatus } from "../../../hooks/queries/parent/useChildrenFeesQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "parent.fee-alerts";

export const FeeAlertsWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const { data: childrenFees, isLoading, error } = useChildrenFeesQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options matching Platform Studio
  const layoutStyle = (config?.layoutStyle as "cards" | "list" | "compact") || "list";
  const showOverdueFirst = config?.showOverdueFirst !== false;
  const showAmount = config?.showAmount !== false;
  const showDueDate = config?.showDueDate !== false;
  const showFeeType = config?.showFeeType !== false;
  const showPayButton = config?.showPayButton !== false;
  const maxItems = (config?.maxItems as number) || 5;
  const enableTap = config?.enableTap !== false;
  const showTotalSummary = config?.showTotalSummary !== false;

  const handleFeePress = (fee: FeeRecord) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "fee_tap", feeId: fee.id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_fee_tap`, level: "info" });
    onNavigate?.("fee-detail", { feeId: fee.id });
  };

  const handlePayNow = (fee: FeeRecord) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "pay_now", feeId: fee.id });
    onNavigate?.("fee-payment", { feeId: fee.id });
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("fees-overview");
  };

  const getStatusStyle = (status: FeeStatus) => {
    switch (status) {
      case "overdue":
        return { color: colors.error, icon: "alert-circle", label: t("widgets.feeAlerts.labels.overdue") };
      case "pending":
        return { color: colors.warning, icon: "clock-outline", label: t("widgets.feeAlerts.labels.pending") };
      case "partial":
        return { color: colors.info, icon: "progress-clock", label: t("widgets.feeAlerts.labels.partial") };
      default:
        return { color: colors.success, icon: "check-circle", label: t("widgets.feeAlerts.labels.paid") };
    }
  };

  const getFeeTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      tuition: "school",
      exam: "file-document",
      transport: "bus",
      library: "book-open-variant",
      lab: "flask",
      other: "cash",
    };
    return icons[type] || "cash";
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return t("widgets.feeAlerts.labels.daysOverdue", { days: Math.abs(diffDays) });
    if (diffDays === 0) return t("widgets.feeAlerts.labels.dueToday");
    if (diffDays === 1) return t("widgets.feeAlerts.labels.dueTomorrow");
    return t("widgets.feeAlerts.labels.dueInDays", { days: diffDays });
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.feeAlerts.states.loading")}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.feeAlerts.states.error")}
        </AppText>
      </View>
    );
  }

  // Combine all fees from all children
  const allFees: FeeRecord[] = [];
  let totalPending = 0;
  let totalOverdue = 0;

  childrenFees?.forEach((child) => {
    allFees.push(...child.overdue_fees, ...child.pending_fees, ...child.partial_fees);
    totalPending += child.total_pending;
    totalOverdue += child.total_overdue;
  });

  // Sort: overdue first if enabled
  if (showOverdueFirst) {
    allFees.sort((a, b) => {
      if (a.status === "overdue" && b.status !== "overdue") return -1;
      if (a.status !== "overdue" && b.status === "overdue") return 1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }

  const displayFees = allFees.slice(0, maxItems);

  if (displayFees.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: `${colors.success}10` }]}>
        <Icon name="check-circle" size={48} color={colors.success} />
        <AppText style={[styles.emptyText, { color: colors.success }]}>
          {t("widgets.feeAlerts.states.empty")}
        </AppText>
      </View>
    );
  }


  const renderFeeItem = (fee: FeeRecord, index: number) => {
    const statusStyle = getStatusStyle(fee.status);
    const isCompact = layoutStyle === "compact" || size === "compact";
    const remainingAmount = fee.status === "partial" 
      ? fee.amount - (fee.paid_amount || 0) 
      : fee.amount;

    return (
      <TouchableOpacity
        key={fee.id}
        style={[
          styles.feeItem,
          isCompact && styles.feeItemCompact,
          { backgroundColor: colors.surface, borderRadius: borderRadius.medium, shadowColor: colors.shadow || "#000" },
        ]}
        onPress={() => handleFeePress(fee)}
        disabled={!enableTap}
        activeOpacity={0.7}
      >
        {/* Left: Icon */}
        {showFeeType && (
          <View style={[styles.feeIcon, { backgroundColor: `${statusStyle.color}15` }]}>
            <Icon name={getFeeTypeIcon(fee.fee_type)} size={20} color={statusStyle.color} />
          </View>
        )}

        {/* Middle: Details */}
        <View style={styles.feeDetails}>
          <AppText style={[styles.feeTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {getLocalizedField(fee, "title")}
          </AppText>
          
          <View style={styles.feeMetaRow}>
            {showDueDate && (
              <View style={styles.dueDateRow}>
                <Icon name="calendar" size={12} color={statusStyle.color} />
                <AppText style={[styles.dueDate, { color: statusStyle.color }]}>
                  {formatDate(fee.due_date)}
                </AppText>
              </View>
            )}
            
            {fee.status === "partial" && (
              <AppText style={[styles.partialText, { color: colors.info }]}>
                {t("widgets.feeAlerts.labels.partialPaid", { amount: formatCurrency(fee.paid_amount || 0) })}
              </AppText>
            )}
          </View>
        </View>

        {/* Right: Amount & Action */}
        <View style={styles.feeRight}>
          {showAmount && (
            <AppText style={[styles.feeAmount, { color: statusStyle.color }]}>
              {formatCurrency(remainingAmount)}
            </AppText>
          )}
          
          {showPayButton && !isCompact && (
            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: colors.primary }]}
              onPress={() => handlePayNow(fee)}
            >
              <AppText style={styles.payButtonText}>
                {t("widgets.feeAlerts.labels.payNow")}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary Banner */}
      {showTotalSummary && (totalOverdue > 0 || totalPending > 0) && (
        <View style={[styles.summaryBanner, { backgroundColor: totalOverdue > 0 ? `${colors.error}10` : `${colors.warning}10` }]}>
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.feeAlerts.summary.totalDue")}
            </AppText>
            <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
              {formatCurrency(totalPending + totalOverdue)}
            </AppText>
          </View>
          {totalOverdue > 0 && (
            <View style={styles.summaryItem}>
              <AppText style={[styles.summaryLabel, { color: colors.error }]}>
                {t("widgets.feeAlerts.summary.overdue")}
              </AppText>
              <AppText style={[styles.summaryValue, { color: colors.error }]}>
                {formatCurrency(totalOverdue)}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Fee List */}
      <View style={styles.feeList}>
        {displayFees.map((fee, index) => renderFeeItem(fee, index))}
      </View>

      {/* View All */}
      {allFees.length > maxItems && (
        <TouchableOpacity style={[styles.viewAllButton, { borderColor: colors.outline }]} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.feeAlerts.actions.viewAll", { count: allFees.length })}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  summaryBanner: { flexDirection: "row", justifyContent: "space-around", padding: 14, borderRadius: 12 },
  summaryItem: { alignItems: "center", gap: 4 },
  summaryLabel: { fontSize: 11, textTransform: "uppercase", fontWeight: "600" },
  summaryValue: { fontSize: 18, fontWeight: "700" },
  feeList: { gap: 10 },
  feeItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  feeItemCompact: { padding: 10, gap: 10 },
  feeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  feeDetails: { flex: 1, gap: 4 },
  feeTitle: { fontSize: 14, fontWeight: "600" },
  feeMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  dueDateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dueDate: { fontSize: 12, fontWeight: "500" },
  partialText: { fontSize: 11 },
  feeRight: { alignItems: "flex-end", gap: 6 },
  feeAmount: { fontSize: 16, fontWeight: "700" },
  payButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  payButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  loadingContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 12 },
  loadingText: { fontSize: 14 },
  errorContainer: { padding: 24, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 10 },
  errorText: { fontSize: 14, fontWeight: "500" },
  emptyContainer: { padding: 40, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 16 },
  emptyText: { fontSize: 15, textAlign: "center", fontWeight: "600" },
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderTopWidth: 1, gap: 6 },
  viewAllText: { fontSize: 14, fontWeight: "600" },
});
