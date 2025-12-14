/**
 * FeePaymentScreen - Fixed Screen
 *
 * Purpose: Process fee payments with multiple payment methods
 * Type: Fixed (not widget-based)
 * Accessible from: fee-detail screen
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
  TextInput,
  KeyboardAvoidingView,
  Platform,
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

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Data Hooks
import { useFeeDetailQuery } from "../../hooks/queries/useFeeDetailQuery";
import { useFeePaymentMutation, PaymentMethod } from "../../hooks/mutations/useFeePaymentMutation";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

// Payment method options
const PAYMENT_METHODS: { id: PaymentMethod; icon: string; label: string }[] = [
  { id: "upi", icon: "cellphone", label: "UPI" },
  { id: "card", icon: "credit-card", label: "Card" },
  { id: "netbanking", icon: "bank", label: "Net Banking" },
  { id: "wallet", icon: "wallet", label: "Wallet" },
];

export const FeePaymentScreen: React.FC<Props> = ({
  screenId = "fee-payment",
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


  // === STATE ===
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [isPartialPayment, setIsPartialPayment] = useState(false);

  // === DATA ===
  const { data: fee, isLoading, error } = useFeeDetailQuery(feeId);
  const paymentMutation = useFeePaymentMutation();

  // Calculate remaining amount
  const remainingAmount = fee ? fee.amount - (fee.paid_amount || 0) : 0;

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

  // Set default payment amount when fee loads
  useEffect(() => {
    if (fee && remainingAmount > 0) {
      setPaymentAmount(remainingAmount.toString());
    }
  }, [fee, remainingAmount]);

  // === EVENT HANDLERS ===
  const handleBack = useCallback(() => {
    trackEvent("back_pressed", { screen: screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  const handleMethodSelect = useCallback((method: PaymentMethod) => {
    setSelectedMethod(method);
    trackEvent("payment_method_selected", { method });
  }, [trackEvent]);

  const handlePartialToggle = useCallback(() => {
    setIsPartialPayment(!isPartialPayment);
    if (!isPartialPayment) {
      setPaymentAmount("");
    } else {
      setPaymentAmount(remainingAmount.toString());
    }
  }, [isPartialPayment, remainingAmount]);

  const handleAmountChange = useCallback((text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, "");
    setPaymentAmount(cleaned);
  }, []);

  const handlePayment = useCallback(async () => {
    if (!isOnline) {
      Alert.alert(
        t("offline.title", { defaultValue: "You're Offline" }),
        t("offline.actionRequired", { defaultValue: "Payment requires internet connection" })
      );
      return;
    }

    if (!selectedMethod) {
      Alert.alert(
        t("fees.payment.selectMethod", { defaultValue: "Select Payment Method" }),
        t("fees.payment.selectMethodMessage", { defaultValue: "Please select a payment method to continue" })
      );
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(
        t("fees.payment.invalidAmount", { defaultValue: "Invalid Amount" }),
        t("fees.payment.invalidAmountMessage", { defaultValue: "Please enter a valid payment amount" })
      );
      return;
    }

    if (amount > remainingAmount) {
      Alert.alert(
        t("fees.payment.exceedsAmount", { defaultValue: "Amount Exceeds Due" }),
        t("fees.payment.exceedsAmountMessage", { defaultValue: "Payment amount cannot exceed the remaining balance" })
      );
      return;
    }

    trackEvent("payment_initiated", { feeId, amount, method: selectedMethod });

    try {
      const result = await paymentMutation.mutateAsync({
        feeId,
        amount,
        paymentMethod: selectedMethod,
      });

      if (result.success) {
        Alert.alert(
          t("fees.payment.success", { defaultValue: "Payment Successful" }),
          t("fees.payment.successMessage", { 
            defaultValue: "Your payment has been processed. Receipt: {{receipt}}", 
            receipt: result.receiptNumber 
          }),
          [
            {
              text: t("actions.ok", { defaultValue: "OK" }),
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert(
        t("fees.payment.failed", { defaultValue: "Payment Failed" }),
        err.message || t("fees.payment.failedMessage", { defaultValue: "Unable to process payment. Please try again." })
      );
    }
  }, [isOnline, selectedMethod, paymentAmount, remainingAmount, feeId, paymentMutation, navigation, trackEvent, t]);

  // === HELPER FUNCTIONS ===
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
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
            {t("fees.payment.title", { defaultValue: "Pay Fee" })}
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

  // Check if already paid
  if (fee.status === "paid") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("fees.payment.title", { defaultValue: "Pay Fee" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="check-circle" size={48} color={colors.success} />
          <AppText style={[styles.successText, { color: colors.success }]}>
            {t("fees.payment.alreadyPaid", { defaultValue: "This fee has already been paid" })}
          </AppText>
          <AppButton
            label={t("actions.goBack", { defaultValue: "Go Back" })}
            onPress={handleBack}
          />
        </View>
      </SafeAreaView>
    );
  }

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
          {t("fees.payment.title", { defaultValue: "Pay Fee" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Fee Summary Card */}
          <AppCard style={styles.summaryCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("fees.payment.summary", { defaultValue: "Fee Summary" })}
            </AppText>
            
            <View style={styles.summaryRow}>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                {t("fees.totalAmount", { defaultValue: "Total Amount" })}
              </AppText>
              <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
                {formatCurrency(fee.amount)}
              </AppText>
            </View>

            {fee.paid_amount && fee.paid_amount > 0 && (
              <View style={styles.summaryRow}>
                <AppText style={[styles.summaryLabel, { color: colors.success }]}>
                  {t("fees.paidAmount", { defaultValue: "Paid Amount" })}
                </AppText>
                <AppText style={[styles.summaryValue, { color: colors.success }]}>
                  {formatCurrency(fee.paid_amount)}
                </AppText>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

            <View style={styles.summaryRow}>
              <AppText style={[styles.summaryLabel, { color: colors.primary, fontWeight: "600" }]}>
                {t("fees.remainingAmount", { defaultValue: "Remaining" })}
              </AppText>
              <AppText style={[styles.summaryValueLarge, { color: colors.primary }]}>
                {formatCurrency(remainingAmount)}
              </AppText>
            </View>
          </AppCard>


          {/* Payment Amount */}
          <AppCard style={styles.amountCard}>
            <View style={styles.amountHeader}>
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t("fees.payment.amount", { defaultValue: "Payment Amount" })}
              </AppText>
              <TouchableOpacity
                style={styles.partialToggle}
                onPress={handlePartialToggle}
              >
                <Icon
                  name={isPartialPayment ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={22}
                  color={colors.primary}
                />
                <AppText style={[styles.partialLabel, { color: colors.onSurfaceVariant }]}>
                  {t("fees.payment.partial", { defaultValue: "Partial Payment" })}
                </AppText>
              </TouchableOpacity>
            </View>

            <View style={[styles.amountInputContainer, { borderColor: colors.outlineVariant }]}>
              <AppText style={[styles.currencySymbol, { color: colors.onSurfaceVariant }]}>₹</AppText>
              <TextInput
                style={[styles.amountInput, { color: colors.onSurface }]}
                value={paymentAmount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.onSurfaceVariant}
                editable={isPartialPayment}
              />
            </View>

            {isPartialPayment && (
              <AppText style={[styles.amountHint, { color: colors.onSurfaceVariant }]}>
                {t("fees.payment.maxAmount", { 
                  defaultValue: "Maximum: {{amount}}", 
                  amount: formatCurrency(remainingAmount) 
                })}
              </AppText>
            )}
          </AppCard>

          {/* Payment Methods */}
          <AppCard style={styles.methodsCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("fees.payment.selectMethod", { defaultValue: "Select Payment Method" })}
            </AppText>

            <View style={styles.methodsGrid}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodItem,
                    {
                      borderColor: selectedMethod === method.id ? colors.primary : colors.outlineVariant,
                      backgroundColor: selectedMethod === method.id ? `${colors.primary}10` : colors.surface,
                    },
                  ]}
                  onPress={() => handleMethodSelect(method.id)}
                >
                  <Icon
                    name={method.icon}
                    size={28}
                    color={selectedMethod === method.id ? colors.primary : colors.onSurfaceVariant}
                  />
                  <AppText
                    style={[
                      styles.methodLabel,
                      { color: selectedMethod === method.id ? colors.primary : colors.onSurface },
                    ]}
                  >
                    {t(`fees.methods.${method.id}`, { defaultValue: method.label })}
                  </AppText>
                  {selectedMethod === method.id && (
                    <Icon name="check-circle" size={18} color={colors.primary} style={styles.methodCheck} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </AppCard>

          {/* Pay Button */}
          <View style={styles.payButtonContainer}>
            <AppButton
              label={
                paymentMutation.isPending
                  ? t("fees.payment.processing", { defaultValue: "Processing..." })
                  : t("fees.payment.payAmount", { 
                      defaultValue: "Pay {{amount}}", 
                      amount: formatCurrency(parseFloat(paymentAmount) || 0) 
                    })
              }
              onPress={handlePayment}
              disabled={!selectedMethod || paymentMutation.isPending || !paymentAmount}
              style={styles.payButton}
            />
          </View>

          {/* Secure Payment Note */}
          <View style={styles.secureNote}>
            <Icon name="shield-check" size={16} color={colors.success} />
            <AppText style={[styles.secureText, { color: colors.onSurfaceVariant }]}>
              {t("fees.payment.secure", { defaultValue: "Your payment is secure and encrypted" })}
            </AppText>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  successText: {
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
  // Summary Card
  summaryCard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  summaryValueLarge: {
    fontSize: 20,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  // Amount Card
  amountCard: {
    padding: 16,
  },
  amountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  partialToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  partialLabel: {
    fontSize: 13,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "600",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: "700",
    padding: 0,
  },
  amountHint: {
    fontSize: 12,
    marginTop: 8,
  },
  // Methods Card
  methodsCard: {
    padding: 16,
  },
  methodsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  methodItem: {
    width: "47%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  methodCheck: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  // Pay Button
  payButtonContainer: {
    marginTop: 8,
  },
  payButton: {
    paddingVertical: 16,
  },
  // Secure Note
  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  secureText: {
    fontSize: 12,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default FeePaymentScreen;
