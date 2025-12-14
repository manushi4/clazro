/**
 * PaymentDetailScreen - Fixed Screen
 *
 * Purpose: Display detailed information about a specific payment transaction
 * Type: Fixed (not widget-based)
 * Accessible from: payment-history screen, ParentPaymentHistoryWidget
 * Roles: parent
 */

import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";
import { useBranding } from "../../context/BrandingContext";

// Analytics & Error Tracking
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";

// Localization
import { getLocalizedField } from "../../utils/getLocalizedField";

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Data Hooks
import { useFeeDetailQuery, FeeType } from "../../hooks/queries/useFeeDetailQuery";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

// Payment method icons
const PAYMENT_METHOD_ICONS: Record<string, string> = {
  upi: "cellphone",
  card: "credit-card",
  netbanking: "bank",
  wallet: "wallet",
  cash: "cash",
  cheque: "checkbook",
  other: "cash-multiple",
};

// Fee type icons
const FEE_TYPE_ICONS: Record<FeeType, string> = {
  tuition: "school",
  exam: "clipboard-text",
  transport: "bus",
  library: "book-open-variant",
  lab: "flask",
  other: "cash",
};


export const PaymentDetailScreen: React.FC<Props> = ({
  screenId = "payment-detail",
  role,
  navigation: navProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = useRoute<any>();

  // Get payment ID from route params
  const paymentId = route.params?.paymentId || route.params?.id;

  // === DATA ===
  const { data: payment, isLoading, error, refetch } = useFeeDetailQuery(paymentId);
  const [refreshing, setRefreshing] = useState(false);

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { paymentId },
    });
  }, [screenId, paymentId]);

  // === EVENT HANDLERS ===
  const handleBack = useCallback(() => {
    trackEvent("back_pressed", { screen: screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  const handleRefresh = useCallback(async () => {
    if (!isOnline) {
      Alert.alert(
        t("offline.title", { defaultValue: "You're Offline" }),
        t("offline.refreshDisabled", { defaultValue: "Cannot refresh while offline" })
      );
      return;
    }
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [isOnline, refetch, t]);

  const handleDownloadReceipt = useCallback(() => {
    if (!payment?.receipt_number) return;

    trackEvent("payment_receipt_download", { paymentId: payment.id });
    
    Alert.alert(
      t("fees.receiptTitle", { defaultValue: "Download Receipt" }),
      t("fees.receiptMessage", { defaultValue: "Receipt download coming soon" })
    );
  }, [payment, trackEvent, t]);

  const handleShareReceipt = useCallback(async () => {
    if (!payment) return;

    trackEvent("payment_receipt_share", { paymentId: payment.id });

    try {
      const title = getLocalizedField(payment, "title");
      await Share.share({
        message: t("fees.payment.shareMessage", {
          defaultValue: `Payment Receipt\n\nFee: ${title}\nAmount: ${formatCurrency(payment.paid_amount || payment.amount)}\nReceipt No: ${payment.receipt_number || "N/A"}\nDate: ${formatDate(payment.paid_date)}`,
        }),
        title: t("fees.payment.shareTitle", { defaultValue: "Payment Receipt" }),
      });
    } catch (err) {
      // User cancelled or error
    }
  }, [payment, trackEvent, t]);

  // === HELPER FUNCTIONS ===
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodIcon = (method: string | null) => {
    return PAYMENT_METHOD_ICONS[method || "other"] || PAYMENT_METHOD_ICONS.other;
  };

  const getFeeTypeIcon = (feeType: FeeType) => {
    return FEE_TYPE_ICONS[feeType] || FEE_TYPE_ICONS.other;
  };


  // === LOADING STATE ===
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("status.loading", { defaultValue: "Loading..." })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // === ERROR STATE ===
  if (error || !payment) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("fees.payment.detailTitle", { defaultValue: "Payment Details" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("fees.payment.notFound", { defaultValue: "Payment record not found" })}
          </AppText>
          <AppButton
            label={t("actions.goBack", { defaultValue: "Go Back" })}
            onPress={handleBack}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Check if this is actually a paid record
  if (payment.status !== "paid") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("fees.payment.detailTitle", { defaultValue: "Payment Details" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="clock-outline" size={48} color={colors.warning} />
          <AppText style={[styles.warningText, { color: colors.warning }]}>
            {t("fees.payment.notPaid", { defaultValue: "This fee has not been paid yet" })}
          </AppText>
          <AppButton
            label={t("actions.goBack", { defaultValue: "Go Back" })}
            onPress={handleBack}
          />
        </View>
      </SafeAreaView>
    );
  }

  const title = getLocalizedField(payment, "title");
  const paidAmount = payment.paid_amount || payment.amount;

  // === SUCCESS STATE ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("fees.payment.detailTitle", { defaultValue: "Payment Details" })}
        </AppText>
        <TouchableOpacity onPress={handleShareReceipt} style={styles.shareButton}>
          <Icon name="share-variant" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Success Banner */}
        <View style={[styles.successBanner, { backgroundColor: "#E8F5E9" }]}>
          <Icon name="check-circle" size={28} color="#2E7D32" />
          <View style={styles.successInfo}>
            <AppText style={[styles.successText, { color: "#2E7D32" }]}>
              {t("fees.payment.successful", { defaultValue: "Payment Successful" })}
            </AppText>
            <AppText style={[styles.successSubtext, { color: "#2E7D32" }]}>
              {formatDate(payment.paid_date)} {formatTime(payment.paid_date)}
            </AppText>
          </View>
        </View>

        {/* Amount Card */}
        <AppCard style={styles.amountCard}>
          <AppText style={[styles.amountLabel, { color: colors.onSurfaceVariant }]}>
            {t("fees.payment.amountPaid", { defaultValue: "Amount Paid" })}
          </AppText>
          <AppText style={[styles.amountValue, { color: colors.success }]}>
            {formatCurrency(paidAmount)}
          </AppText>
        </AppCard>


        {/* Fee Details Card */}
        <AppCard style={styles.detailsCard}>
          <View style={styles.feeTypeRow}>
            <View style={[styles.feeTypeIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Icon name={getFeeTypeIcon(payment.fee_type)} size={28} color={colors.primary} />
            </View>
            <View style={styles.feeTypeInfo}>
              <AppText style={[styles.feeTypeLabel, { color: colors.onSurfaceVariant }]}>
                {t(`fees.types.${payment.fee_type}`, { defaultValue: payment.fee_type })}
              </AppText>
              <AppText style={[styles.feeTitle, { color: colors.onSurface }]}>
                {title}
              </AppText>
            </View>
          </View>
        </AppCard>

        {/* Transaction Details Card */}
        <AppCard style={styles.transactionCard}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("fees.payment.transactionDetails", { defaultValue: "Transaction Details" })}
          </AppText>

          {/* Receipt Number */}
          {payment.receipt_number && (
            <View style={styles.detailRow}>
              <Icon name="receipt" size={20} color={colors.onSurfaceVariant} />
              <AppText style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
                {t("fees.receiptNumber", { defaultValue: "Receipt No." })}
              </AppText>
              <AppText style={[styles.detailValue, { color: colors.onSurface }]}>
                {payment.receipt_number}
              </AppText>
            </View>
          )}

          {/* Payment Method */}
          {payment.payment_method && (
            <View style={styles.detailRow}>
              <Icon name={getPaymentMethodIcon(payment.payment_method)} size={20} color={colors.onSurfaceVariant} />
              <AppText style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
                {t("fees.paymentMethod", { defaultValue: "Payment Method" })}
              </AppText>
              <AppText style={[styles.detailValue, { color: colors.onSurface }]}>
                {t(`fees.methods.${payment.payment_method}`, { defaultValue: payment.payment_method })}
              </AppText>
            </View>
          )}

          {/* Payment Date */}
          <View style={styles.detailRow}>
            <Icon name="calendar-check" size={20} color={colors.onSurfaceVariant} />
            <AppText style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
              {t("fees.paidDate", { defaultValue: "Paid Date" })}
            </AppText>
            <AppText style={[styles.detailValue, { color: colors.onSurface }]}>
              {formatDate(payment.paid_date)}
            </AppText>
          </View>

          {/* Original Amount (if different from paid) */}
          {payment.amount !== paidAmount && (
            <View style={styles.detailRow}>
              <Icon name="cash" size={20} color={colors.onSurfaceVariant} />
              <AppText style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
                {t("fees.totalAmount", { defaultValue: "Total Amount" })}
              </AppText>
              <AppText style={[styles.detailValue, { color: colors.onSurface }]}>
                {formatCurrency(payment.amount)}
              </AppText>
            </View>
          )}

          {/* Due Date */}
          <View style={styles.detailRow}>
            <Icon name="calendar" size={20} color={colors.onSurfaceVariant} />
            <AppText style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
              {t("fees.dueDate", { defaultValue: "Due Date" })}
            </AppText>
            <AppText style={[styles.detailValue, { color: colors.onSurface }]}>
              {formatDate(payment.due_date)}
            </AppText>
          </View>
        </AppCard>

        {/* Notes */}
        {payment.notes && (
          <AppCard style={styles.notesCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("fees.notes", { defaultValue: "Notes" })}
            </AppText>
            <AppText style={[styles.notesText, { color: colors.onSurfaceVariant }]}>
              {payment.notes}
            </AppText>
          </AppCard>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {payment.receipt_number && (
            <AppButton
              label={t("fees.downloadReceipt", { defaultValue: "Download Receipt" })}
              onPress={handleDownloadReceipt}
              style={styles.receiptButton}
            />
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 12,
  },
  warningText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerRight: {
    width: 32,
  },
  shareButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  // Success Banner
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  successInfo: {
    flex: 1,
  },
  successText: {
    fontSize: 16,
    fontWeight: "700",
  },
  successSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  // Amount Card
  amountCard: {
    padding: 20,
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "700",
  },
  // Details Card
  detailsCard: {
    padding: 16,
  },
  feeTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  feeTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  feeTypeInfo: {
    flex: 1,
  },
  feeTypeLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  feeTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },
  // Transaction Card
  transactionCard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Notes Card
  notesCard: {
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
  },
  // Actions
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  receiptButton: {
    paddingVertical: 14,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default PaymentDetailScreen;
