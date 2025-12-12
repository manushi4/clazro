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
import { usePaymentHistoryQuery, PaymentRecord } from "../../../hooks/queries/parent/usePaymentHistoryQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

type LayoutStyle = "list" | "cards" | "compact";

export const ParentPaymentHistoryWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("parent");
  const { data, isLoading, error } = usePaymentHistoryQuery();

  // Config options with defaults
  const layoutStyle = (config?.layoutStyle as LayoutStyle) || "list";
  const maxItems = (config?.maxItems as number) || 5;
  const showPaymentMethod = config?.showPaymentMethod !== false;
  const showReceiptNumber = config?.showReceiptNumber !== false;
  const showAmount = config?.showAmount !== false;
  const showTotalSummary = config?.showTotalSummary !== false;
  const enableTap = config?.enableTap !== false;

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.paymentHistory.states.loading")}
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
          {t("widgets.paymentHistory.states.error")}
        </AppText>
      </View>
    );
  }

  const payments = data?.payments || [];
  const displayPayments = payments.slice(0, maxItems);

  // Empty state
  if (displayPayments.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="receipt" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.paymentHistory.states.empty")}
        </AppText>
        <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
          {t("widgets.paymentHistory.states.emptySubtitle")}
        </AppText>
      </View>
    );
  }

  const handlePaymentPress = (payment: PaymentRecord) => {
    if (enableTap) {
      onNavigate?.("payment-details", { paymentId: payment.id });
    }
  };

  const handleViewAll = () => {
    onNavigate?.("payment-history");
  };

  // Get fee type icon
  const getFeeTypeIcon = (type: string) => {
    switch (type) {
      case "tuition": return "school";
      case "exam": return "file-document";
      case "transport": return "bus";
      case "library": return "book";
      case "lab": return "flask";
      default: return "cash";
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method: string | null) => {
    switch (method) {
      case "upi": return "cellphone";
      case "card": return "credit-card";
      case "netbanking": return "bank";
      case "cash": return "cash";
      case "cheque": return "checkbook";
      default: return "wallet";
    }
  };

  // Get payment method label
  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return t("widgets.paymentHistory.methods.unknown");
    return t(`widgets.paymentHistory.methods.${method}`);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };


  // Render payment item based on layout
  const renderPaymentItem = (payment: PaymentRecord, index: number) => {
    if (layoutStyle === "compact") {
      return (
        <TouchableOpacity
          key={payment.id}
          style={[styles.compactItem, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => handlePaymentPress(payment)}
          disabled={!enableTap}
        >
          <View style={[styles.successBar, { backgroundColor: colors.success }]} />
          <View style={styles.compactContent}>
            <AppText style={[styles.compactTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {getLocalizedField(payment, "title")}
            </AppText>
            <AppText style={[styles.compactDate, { color: colors.onSurfaceVariant }]}>
              {formatDate(payment.paid_date)}
            </AppText>
          </View>
          {showAmount && (
            <AppText style={[styles.compactAmount, { color: colors.success }]}>
              {formatCurrency(payment.paid_amount)}
            </AppText>
          )}
        </TouchableOpacity>
      );
    }

    if (layoutStyle === "cards") {
      return (
        <TouchableOpacity
          key={payment.id}
          style={[styles.cardItem, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => handlePaymentPress(payment)}
          disabled={!enableTap}
        >
          <View style={[styles.cardIcon, { backgroundColor: `${colors.success}20` }]}>
            <Icon name={getFeeTypeIcon(payment.fee_type)} size={20} color={colors.success} />
          </View>
          <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
            {getLocalizedField(payment, "title")}
          </AppText>
          {showAmount && (
            <AppText style={[styles.cardAmount, { color: colors.success }]}>
              {formatCurrency(payment.paid_amount)}
            </AppText>
          )}
          <AppText style={[styles.cardDate, { color: colors.onSurfaceVariant }]}>
            {formatDate(payment.paid_date)}
          </AppText>
          {showPaymentMethod && payment.payment_method && (
            <View style={styles.cardMethodRow}>
              <Icon name={getPaymentMethodIcon(payment.payment_method)} size={12} color={colors.onSurfaceVariant} />
              <AppText style={[styles.cardMethod, { color: colors.onSurfaceVariant }]}>
                {getPaymentMethodLabel(payment.payment_method)}
              </AppText>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    // Default list layout
    return (
      <TouchableOpacity
        key={payment.id}
        style={[styles.listItem, { backgroundColor: colors.surfaceVariant }]}
        onPress={() => handlePaymentPress(payment)}
        disabled={!enableTap}
      >
        <View style={styles.listLeft}>
          <View style={[styles.feeTypeIcon, { backgroundColor: `${colors.success}20` }]}>
            <Icon name={getFeeTypeIcon(payment.fee_type)} size={20} color={colors.success} />
          </View>
          <View style={styles.listContent}>
            <AppText style={[styles.listTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {getLocalizedField(payment, "title")}
            </AppText>
            <View style={styles.listMeta}>
              <AppText style={[styles.listDate, { color: colors.onSurfaceVariant }]}>
                {formatDate(payment.paid_date)}
              </AppText>
              {showPaymentMethod && payment.payment_method && (
                <>
                  <AppText style={[styles.listDot, { color: colors.onSurfaceVariant }]}>•</AppText>
                  <Icon name={getPaymentMethodIcon(payment.payment_method)} size={12} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.listMethod, { color: colors.onSurfaceVariant }]}>
                    {getPaymentMethodLabel(payment.payment_method)}
                  </AppText>
                </>
              )}
            </View>
            {showReceiptNumber && payment.receipt_number && (
              <AppText style={[styles.listReceipt, { color: colors.primary }]}>
                {t("widgets.paymentHistory.labels.receipt")}: {payment.receipt_number}
              </AppText>
            )}
          </View>
        </View>
        <View style={styles.listRight}>
          {showAmount && (
            <AppText style={[styles.listAmount, { color: colors.success }]}>
              {formatCurrency(payment.paid_amount)}
            </AppText>
          )}
          <View style={[styles.paidBadge, { backgroundColor: `${colors.success}20` }]}>
            <Icon name="check-circle" size={12} color={colors.success} />
            <AppText style={[styles.paidText, { color: colors.success }]}>
              {t("widgets.paymentHistory.labels.paid")}
            </AppText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Total Summary Header */}
      {showTotalSummary && data && (
        <View style={[styles.summaryHeader, { backgroundColor: `${colors.success}15` }]}>
          <View style={styles.summaryLeft}>
            <Icon name="check-decagram" size={20} color={colors.success} />
            <View>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.paymentHistory.summary.totalPaid")}
              </AppText>
              <AppText style={[styles.summaryAmount, { color: colors.success }]}>
                {formatCurrency(data.total_paid)}
              </AppText>
            </View>
          </View>
          <View style={styles.summaryRight}>
            <AppText style={[styles.summaryCount, { color: colors.onSurface }]}>
              {data.payment_count}
            </AppText>
            <AppText style={[styles.summaryCountLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.paymentHistory.summary.payments")}
            </AppText>
          </View>
        </View>
      )}

      {/* Payment List */}
      {layoutStyle === "cards" ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {displayPayments.map((payment, index) => renderPaymentItem(payment, index))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {displayPayments.map((payment, index) => renderPaymentItem(payment, index))}
        </View>
      )}

      {/* View All Button */}
      {payments.length > maxItems && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.paymentHistory.actions.viewAll", { count: payments.length })}
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summaryLabel: {
    fontSize: 11,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  summaryRight: {
    alignItems: "center",
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: "700",
  },
  summaryCountLabel: {
    fontSize: 10,
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
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  listMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  listDate: {
    fontSize: 12,
  },
  listDot: {
    fontSize: 10,
  },
  listMethod: {
    fontSize: 11,
    marginLeft: 2,
  },
  listReceipt: {
    fontSize: 11,
    marginTop: 2,
  },
  listRight: {
    alignItems: "flex-end",
    gap: 4,
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
    gap: 6,
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
  cardDate: {
    fontSize: 10,
  },
  cardMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardMethod: {
    fontSize: 10,
  },
  // Compact Layout
  compactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    gap: 10,
  },
  successBar: {
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
  compactDate: {
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
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  paidText: {
    fontSize: 10,
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

export default ParentPaymentHistoryWidget;
