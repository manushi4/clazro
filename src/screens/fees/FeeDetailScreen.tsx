/**
 * FeeDetailScreen - Fixed Screen
 *
 * Purpose: Display detailed information about a specific fee record
 * Type: Fixed (not widget-based)
 * Accessible from: fees-overview screen, pending-fees widget, fee-alerts widget
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
  Linking,
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
import { useFeeDetailQuery, FeeStatus, FeeType } from "../../hooks/queries/useFeeDetailQuery";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};


// Status colors
const STATUS_COLORS: Record<FeeStatus, { bg: string; text: string; icon: string }> = {
  pending: { bg: "#FFF3E0", text: "#E65100", icon: "clock-outline" },
  overdue: { bg: "#FFEBEE", text: "#C62828", icon: "alert-circle" },
  partial: { bg: "#E3F2FD", text: "#1565C0", icon: "progress-clock" },
  paid: { bg: "#E8F5E9", text: "#2E7D32", icon: "check-circle" },
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

export const FeeDetailScreen: React.FC<Props> = ({
  screenId = "fee-detail",
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

  // Get fee ID from route params
  const feeId = route.params?.feeId || route.params?.id;

  // === DATA ===
  const { data: fee, isLoading, error, refetch } = useFeeDetailQuery(feeId);
  const [refreshing, setRefreshing] = useState(false);

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { feeId },
    });
  }, [screenId, feeId]);

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

  const handlePayNow = useCallback(() => {
    if (!isOnline) {
      Alert.alert(
        t("offline.title", { defaultValue: "You're Offline" }),
        t("offline.actionRequired", { defaultValue: "Payment requires internet connection" })
      );
      return;
    }

    trackEvent("fee_pay_pressed", { feeId: fee?.id, amount: fee?.amount });
    
    // Navigate to fee payment screen
    navigation.navigate("fee-payment", { feeId: fee?.id });
  }, [isOnline, fee, trackEvent, t, navigation]);

  const handleDownloadReceipt = useCallback(() => {
    if (!fee?.receipt_number) return;

    trackEvent("fee_receipt_download", { feeId: fee.id });
    
    // TODO: Implement receipt download
    Alert.alert(
      t("fees.receiptTitle", { defaultValue: "Download Receipt" }),
      t("fees.receiptMessage", { defaultValue: "Receipt download coming soon" })
    );
  }, [fee, trackEvent, t]);

  // === HELPER FUNCTIONS ===
  const formatCurrency = (amount: number) => {
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

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusConfig = (status: FeeStatus) => {
    return STATUS_COLORS[status] || STATUS_COLORS.pending;
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
  if (error || !fee) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("fees.detail", { defaultValue: "Fee Details" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("fees.notFound", { defaultValue: "Fee record not found" })}
          </AppText>
          <AppButton
            label={t("actions.goBack", { defaultValue: "Go Back" })}
            onPress={handleBack}
          />
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(fee.status);
  const title = getLocalizedField(fee, "title");
  const daysUntilDue = getDaysUntilDue(fee.due_date);
  const remainingAmount = fee.amount - (fee.paid_amount || 0);
  const isPaid = fee.status === "paid";
  const isOverdue = fee.status === "overdue";

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
          {t("fees.detail", { defaultValue: "Fee Details" })}
        </AppText>
        <View style={styles.headerRight} />
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
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusConfig.bg }]}>
          <Icon name={statusConfig.icon} size={24} color={statusConfig.text} />
          <View style={styles.statusInfo}>
            <AppText style={[styles.statusText, { color: statusConfig.text }]}>
              {t(`fees.status.${fee.status}`, { defaultValue: fee.status.toUpperCase() })}
            </AppText>
            {!isPaid && (
              <AppText style={[styles.statusSubtext, { color: statusConfig.text }]}>
                {isOverdue
                  ? t("fees.overdueDays", { days: Math.abs(daysUntilDue), defaultValue: `${Math.abs(daysUntilDue)} days overdue` })
                  : daysUntilDue === 0
                  ? t("fees.dueToday", { defaultValue: "Due today" })
                  : daysUntilDue > 0
                  ? t("fees.dueDays", { days: daysUntilDue, defaultValue: `Due in ${daysUntilDue} days` })
                  : ""}
              </AppText>
            )}
          </View>
        </View>

        {/* Fee Type & Title */}
        <AppCard style={styles.mainCard}>
          <View style={styles.feeTypeRow}>
            <View style={[styles.feeTypeIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Icon name={getFeeTypeIcon(fee.fee_type)} size={28} color={colors.primary} />
            </View>
            <View style={styles.feeTypeInfo}>
              <AppText style={[styles.feeTypeLabel, { color: colors.onSurfaceVariant }]}>
                {t(`fees.types.${fee.fee_type}`, { defaultValue: fee.fee_type })}
              </AppText>
              <AppText style={[styles.feeTitle, { color: colors.onSurface }]}>
                {title}
              </AppText>
            </View>
          </View>
        </AppCard>

        {/* Amount Card */}
        <AppCard style={styles.amountCard}>
          <View style={styles.amountRow}>
            <AppText style={[styles.amountLabel, { color: colors.onSurfaceVariant }]}>
              {t("fees.totalAmount", { defaultValue: "Total Amount" })}
            </AppText>
            <AppText style={[styles.amountValue, { color: colors.onSurface }]}>
              {formatCurrency(fee.amount)}
            </AppText>
          </View>

          {fee.paid_amount && fee.paid_amount > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
              <View style={styles.amountRow}>
                <AppText style={[styles.amountLabel, { color: colors.success }]}>
                  {t("fees.paidAmount", { defaultValue: "Paid Amount" })}
                </AppText>
                <AppText style={[styles.amountValue, { color: colors.success }]}>
                  {formatCurrency(fee.paid_amount)}
                </AppText>
              </View>
            </>
          )}

          {!isPaid && remainingAmount > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
              <View style={styles.amountRow}>
                <AppText style={[styles.amountLabel, { color: isOverdue ? colors.error : colors.warning }]}>
                  {t("fees.remainingAmount", { defaultValue: "Remaining" })}
                </AppText>
                <AppText style={[styles.amountValueLarge, { color: isOverdue ? colors.error : colors.warning }]}>
                  {formatCurrency(remainingAmount)}
                </AppText>
              </View>
            </>
          )}
        </AppCard>


        {/* Details Card */}
        <AppCard style={styles.detailsCard}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("fees.details", { defaultValue: "Details" })}
          </AppText>

          <View style={styles.detailRow}>
            <Icon name="calendar" size={20} color={colors.onSurfaceVariant} />
            <AppText style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
              {t("fees.dueDate", { defaultValue: "Due Date" })}
            </AppText>
            <AppText style={[styles.detailValue, { color: colors.onSurface }]}>
              {formatDate(fee.due_date)}
            </AppText>
          </View>

          {fee.paid_date && (
            <View style={styles.detailRow}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <AppText style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
                {t("fees.paidDate", { defaultValue: "Paid Date" })}
              </AppText>
              <AppText style={[styles.detailValue, { color: colors.success }]}>
                {formatDate(fee.paid_date)}
              </AppText>
            </View>
          )}

          {fee.payment_method && (
            <View style={styles.detailRow}>
              <Icon name="credit-card" size={20} color={colors.onSurfaceVariant} />
              <AppText style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
                {t("fees.paymentMethod", { defaultValue: "Payment Method" })}
              </AppText>
              <AppText style={[styles.detailValue, { color: colors.onSurface }]}>
                {t(`fees.methods.${fee.payment_method}`, { defaultValue: fee.payment_method })}
              </AppText>
            </View>
          )}

          {fee.receipt_number && (
            <View style={styles.detailRow}>
              <Icon name="receipt" size={20} color={colors.onSurfaceVariant} />
              <AppText style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
                {t("fees.receiptNumber", { defaultValue: "Receipt No." })}
              </AppText>
              <AppText style={[styles.detailValue, { color: colors.onSurface }]}>
                {fee.receipt_number}
              </AppText>
            </View>
          )}
        </AppCard>

        {/* Notes */}
        {fee.notes && (
          <AppCard style={styles.notesCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("fees.notes", { defaultValue: "Notes" })}
            </AppText>
            <AppText style={[styles.notesText, { color: colors.onSurfaceVariant }]}>
              {fee.notes}
            </AppText>
          </AppCard>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {!isPaid && (
            <AppButton
              label={t("fees.payNow", { defaultValue: "Pay Now" })}
              onPress={handlePayNow}
              style={styles.payButton}
            />
          )}

          {isPaid && fee.receipt_number && (
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  // Status Banner
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  // Main Card
  mainCard: {
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
  // Amount Card
  amountCard: {
    padding: 16,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  amountLabel: {
    fontSize: 14,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  amountValueLarge: {
    fontSize: 20,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  // Details Card
  detailsCard: {
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
  payButton: {
    paddingVertical: 14,
  },
  receiptButton: {
    paddingVertical: 14,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default FeeDetailScreen;
