/**
 * TwoFactorSetupScreen - 2FA Setup Fixed Screen
 *
 * Purpose: Setup two-factor authentication for admin accounts
 * Type: Fixed (not widget-based) - Auth flow requires custom handling
 * Accessible from: LoginAdminScreen after successful login
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: Setup 2FA for admin accounts using TOTP
 * - User stories:
 *   - As an admin, I can scan a QR code to setup 2FA
 *   - As an admin, I can manually enter the secret if QR scan fails
 *   - As an admin, I can verify my authenticator app setup
 *   - As an admin, I can skip 2FA setup (with warning)
 *   - As an admin, I see success confirmation after setup
 * - Data requirements: admin_users (two_factor_secret, two_factor_enabled)
 * - Screen ID: 2fa-setup
 * - Role access: admin, super_admin
 * - Required permissions: None (auth flow screen)
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses existing tables: admin_users
 * - Fields: two_factor_secret, two_factor_enabled, two_factor_backup_codes
 * - RLS: User can only update their own 2FA settings
 * - No new migrations needed for this screen
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - Mock implementation for demo (production would use backend TOTP)
 * - In production: useSetup2FA, useVerify2FA mutations
 *
 * ============================================================================
 * PHASE 4: SCREEN COMPONENT ✓
 * ============================================================================
 * - All required hooks (theme, i18n, analytics, offline)
 * - Loading state with ActivityIndicator
 * - Error state with retry
 * - Multi-step flow: QR → Verify → Complete
 * - OfflineBanner at top
 * - Branding support
 * - Analytics tracking
 *
 * ============================================================================
 * PHASE 5: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in routeRegistry.ts: 2fa-setup, TwoFactorSetup
 *
 * ============================================================================
 * PHASE 6: TRANSLATIONS (i18n) ✓
 * ============================================================================
 * - English: src/locales/en/admin.json (twoFactor section)
 * - Hindi: src/locales/hi/admin.json (twoFactor section)
 *
 * ============================================================================
 * PHASE 7: NAVIGATION INTEGRATION ✓
 * ============================================================================
 * - Entry from: LoginAdminScreen (after successful login)
 * - Navigates to: admin-home (after setup complete or skip)
 * - Back navigation: Returns to QR step or login
 *
 * ============================================================================
 * PHASE 8: TESTING & VERIFICATION
 * ============================================================================
 * - [ ] Loading state renders correctly (QR generation)
 * - [ ] QR code displays with manual entry option
 * - [ ] Verification step validates 6-digit code
 * - [ ] Success state shows completion message
 * - [ ] Offline mode: banner shows, verification blocked
 * - [ ] i18n: English displays correctly
 * - [ ] i18n: Hindi displays correctly
 * - [ ] Analytics: screen_view and 2fa events fire
 * - [ ] Error tracking: errors logged to Sentry
 * - [ ] Navigation: skip and continue work correctly
 * - [ ] Accessibility: proper labels and hints
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Clipboard,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  TextInput,
  Button,
  Surface,
  ProgressBar,
  IconButton,
} from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";
import { useBranding } from "../../context/BrandingContext";

// Analytics & Error Tracking
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb, captureException } from "../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

type SetupStep = "qr" | "verify" | "complete";
type ScreenState = "loading" | "error" | "success";

// =============================================================================
// COMPONENT
// =============================================================================

export const TwoFactorSetupScreen: React.FC<Props> = ({
  screenId = "2fa-setup",
  role,
  navigation: navProp,
  onFocused,
}) => {
  // ===========================================================================
  // HOOKS
  // ===========================================================================
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation(["admin", "common"]);
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [initError, setInitError] = useState<string | null>(null);
  const [step, setStep] = useState<SetupStep>("qr");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
    });

    // Initialize screen and generate QR code
    initializeScreen();
  }, [screenId, trackScreenView]);

  // Call onFocused callback if provided
  useEffect(() => {
    onFocused?.();
  }, [onFocused]);

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================
  const initializeScreen = useCallback(async () => {
    setScreenState("loading");
    setInitError(null);

    try {
      // In production, this would call the backend to generate TOTP secret
      // For demo, using placeholder values
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const demoSecret = "JBSWY3DPEHPK3PXP";
      const appName = branding?.appName || "EduPlatform";
      const userEmail = "admin@example.com"; // Would come from auth context

      setSecret(demoSecret);
      setQrCodeUrl(
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/${encodeURIComponent(
          appName
        )}:${encodeURIComponent(userEmail)}?secret=${demoSecret}&issuer=${encodeURIComponent(
          appName
        )}`
      );
      setScreenState("success");

      trackEvent("2fa_qr_generated");
      addBreadcrumb({
        category: "2fa",
        message: "QR code generated for 2FA setup",
        level: "info",
      });
    } catch (error: any) {
      setInitError(
        error.message ||
          t("common:errors.generic", { defaultValue: "Something went wrong" })
      );
      setScreenState("error");
      captureException(error, {
        tags: { screen: screenId, action: "generate_qr" },
      });
    }
  }, [branding?.appName, screenId, t, trackEvent]);

  // ===========================================================================
  // VALIDATION
  // ===========================================================================
  const validateCode = useCallback(
    (value: string): boolean => {
      if (!value) {
        setCodeError(
          t("admin:twoFactor.errors.codeRequired", {
            defaultValue: "Verification code is required",
          })
        );
        return false;
      }
      if (value.length !== 6 || !/^\d+$/.test(value)) {
        setCodeError(
          t("admin:twoFactor.errors.invalidCode", {
            defaultValue: "Please enter a valid 6-digit code",
          })
        );
        return false;
      }
      setCodeError(null);
      return true;
    },
    [t]
  );

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================
  const handleCodeChange = useCallback(
    (value: string) => {
      // Only allow digits, max 6
      const cleanValue = value.replace(/\D/g, "").slice(0, 6);
      setCode(cleanValue);
      if (codeError) validateCode(cleanValue);
    },
    [codeError, validateCode]
  );

  const handleCopySecret = useCallback(() => {
    if (secret) {
      Clipboard.setString(secret);
      setCopiedSecret(true);
      trackEvent("2fa_secret_copied");
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  }, [secret, trackEvent]);

  const handleNextStep = useCallback(() => {
    trackEvent("2fa_proceed_to_verify");
    setStep("verify");
    setCode("");
    setCodeError(null);
  }, [trackEvent]);

  const handleVerify = useCallback(async () => {
    // Check offline status
    if (!isOnline) {
      Alert.alert(
        t("common:offline.title", { defaultValue: "You're Offline" }),
        t("common:offline.actionRequired", {
          defaultValue: "Internet connection required for this action.",
        }),
        [{ text: t("common:actions.ok", { defaultValue: "OK" }) }]
      );
      trackEvent("2fa_verify_blocked_offline");
      return;
    }

    if (!validateCode(code)) return;

    setIsVerifying(true);
    trackEvent("2fa_verify_attempt");
    addBreadcrumb({
      category: "2fa",
      message: "2FA verification attempted",
      level: "info",
    });

    try {
      // In production, this would verify the code with backend TOTP
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock verification - accept any valid 6-digit code for demo
      if (code.length === 6) {
        trackEvent("2fa_setup_success");
        addBreadcrumb({
          category: "2fa",
          message: "2FA setup completed successfully",
          level: "info",
        });
        setStep("complete");
      } else {
        throw new Error("Invalid code");
      }
    } catch (error: any) {
      trackEvent("2fa_verify_failed");
      setCodeError(
        t("admin:twoFactor.errors.invalidCode", {
          defaultValue: "Invalid verification code",
        })
      );
      captureException(error, {
        tags: { screen: screenId, action: "verify_2fa" },
      });
    } finally {
      setIsVerifying(false);
    }
  }, [code, isOnline, validateCode, trackEvent, t, screenId]);

  const handleSkip = useCallback(() => {
    Alert.alert(
      t("admin:twoFactor.skipTitle", { defaultValue: "Skip 2FA Setup?" }),
      t("admin:twoFactor.skipMessage", {
        defaultValue:
          "Two-factor authentication adds an extra layer of security. Are you sure you want to skip?",
      }),
      [
        {
          text: t("common:actions.cancel", { defaultValue: "Cancel" }),
          style: "cancel",
        },
        {
          text: t("common:actions.skip", { defaultValue: "Skip" }),
          style: "destructive",
          onPress: () => {
            trackEvent("2fa_setup_skipped");
            addBreadcrumb({
              category: "2fa",
              message: "User skipped 2FA setup",
              level: "warning",
            });
            navigation.reset({
              index: 0,
              routes: [{ name: "admin-home" }],
            });
          },
        },
      ]
    );
  }, [navigation, trackEvent, t]);

  const handleContinue = useCallback(() => {
    trackEvent("2fa_setup_complete_continue");
    navigation.reset({
      index: 0,
      routes: [{ name: "admin-home" }],
    });
  }, [navigation, trackEvent]);

  const handleBack = useCallback(() => {
    if (step === "verify") {
      setStep("qr");
      setCode("");
      setCodeError(null);
    } else {
      navigation.goBack();
    }
  }, [step, navigation]);

  const handleRetry = useCallback(() => {
    initializeScreen();
  }, [initializeScreen]);

  // ===========================================================================
  // HELPERS
  // ===========================================================================
  const getProgress = useCallback(() => {
    switch (step) {
      case "qr":
        return 0.33;
      case "verify":
        return 0.66;
      case "complete":
        return 1;
      default:
        return 0;
    }
  }, [step]);

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================
  if (screenState === "loading") {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[styles.loadingText, { color: colors.onSurfaceVariant }]}
          >
            {t("admin:twoFactor.generatingQR", {
              defaultValue: "Generating QR code...",
            })}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // ERROR STATE
  // ===========================================================================
  if (screenState === "error" && initError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centerContent}>
          <Icon name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.error }]}>
            {t("common:errors.title", { defaultValue: "Oops!" })}
          </Text>
          <Text
            style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}
          >
            {initError}
          </Text>
          <Button
            mode="contained"
            onPress={handleRetry}
            style={styles.retryButton}
            testID="2fa-retry-button"
          >
            {t("common:actions.retry", { defaultValue: "Try Again" })}
          </Button>
          <Button
            mode="text"
            onPress={handleSkip}
            style={styles.skipButton}
            testID="2fa-skip-button"
          >
            {t("common:actions.skip", { defaultValue: "Skip for now" })}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // SUCCESS STATE (Multi-step flow)
  // ===========================================================================
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <View style={styles.header}>
        {step !== "complete" && (
          <IconButton
            icon="arrow-left"
            onPress={handleBack}
            accessibilityLabel={t("common:actions.back", {
              defaultValue: "Go back",
            })}
            testID="2fa-back-button"
          />
        )}
        <Text
          variant="titleLarge"
          style={[styles.headerTitle, { color: colors.onSurface }]}
          accessibilityRole="header"
        >
          {t("admin:twoFactor.title", {
            defaultValue: "Two-Factor Authentication",
          })}
        </Text>
        {step !== "complete" && (
          <IconButton
            icon="close"
            onPress={handleSkip}
            iconColor={colors.onSurfaceVariant}
            accessibilityLabel={t("admin:twoFactor.skipTitle", {
              defaultValue: "Skip 2FA setup",
            })}
            testID="2fa-close-button"
          />
        )}
        {step === "complete" && <View style={styles.headerSpacer} />}
      </View>

      {/* Progress Bar */}
      <ProgressBar
        progress={getProgress()}
        color={colors.primary}
        style={styles.progressBar}
        accessibilityLabel={`Setup progress: ${Math.round(getProgress() * 100)}%`}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Surface
          style={[styles.card, { borderRadius: borderRadius.large }]}
          elevation={2}
        >
          {/* QR Code Step */}
          {step === "qr" && renderQRStep()}

          {/* Verify Step */}
          {step === "verify" && renderVerifyStep()}

          {/* Complete Step */}
          {step === "complete" && renderCompleteStep()}
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );

  // ===========================================================================
  // RENDER HELPERS
  // ===========================================================================
  function renderQRStep() {
    return (
      <>
        <Icon
          name="qrcode-scan"
          size={48}
          color={colors.primary}
          style={styles.stepIcon}
        />
        <Text
          variant="titleMedium"
          style={[styles.stepTitle, { color: colors.onSurface }]}
          accessibilityRole="header"
        >
          {t("admin:twoFactor.scanQR", { defaultValue: "Scan QR Code" })}
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.stepDescription, { color: colors.onSurfaceVariant }]}
        >
          {t("admin:twoFactor.scanQRDescription", {
            defaultValue:
              "Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code.",
          })}
        </Text>

        {/* QR Code */}
        {qrCodeUrl ? (
          <Image
            source={{ uri: qrCodeUrl }}
            style={styles.qrCode}
            resizeMode="contain"
            accessibilityLabel={t("admin:twoFactor.qrCodeAlt", {
              defaultValue: "QR code for authenticator app",
            })}
            testID="2fa-qr-code"
          />
        ) : (
          <View
            style={[
              styles.qrPlaceholder,
              { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Manual Entry Secret */}
        {secret && (
          <TouchableOpacity
            style={[
              styles.secretContainer,
              { backgroundColor: colors.surfaceVariant },
            ]}
            onPress={handleCopySecret}
            accessibilityLabel={t("admin:twoFactor.copySecret", {
              defaultValue: "Copy secret code",
            })}
            accessibilityHint={t("admin:twoFactor.copySecretHint", {
              defaultValue: "Double tap to copy the secret code",
            })}
            testID="2fa-secret-container"
          >
            <Text
              variant="labelSmall"
              style={{ color: colors.onSurfaceVariant }}
            >
              {t("admin:twoFactor.manualEntry", {
                defaultValue: "Manual entry code:",
              })}
            </Text>
            <View style={styles.secretRow}>
              <Text
                variant="bodyMedium"
                style={[styles.secretText, { color: colors.onSurface }]}
                selectable
              >
                {secret}
              </Text>
              <Icon
                name={copiedSecret ? "check" : "content-copy"}
                size={18}
                color={copiedSecret ? colors.primary : colors.onSurfaceVariant}
              />
            </View>
            {copiedSecret && (
              <Text
                variant="labelSmall"
                style={{ color: colors.primary, marginTop: 4 }}
              >
                {t("common:status.copied", { defaultValue: "Copied!" })}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <Button
          mode="contained"
          onPress={handleNextStep}
          style={styles.button}
          disabled={!qrCodeUrl}
          accessibilityLabel={t("admin:twoFactor.nextButton", {
            defaultValue: "Next",
          })}
          testID="2fa-next-button"
        >
          {t("admin:twoFactor.nextButton", { defaultValue: "Next" })}
        </Button>
      </>
    );
  }

  function renderVerifyStep() {
    return (
      <>
        <Icon
          name="shield-check"
          size={48}
          color={colors.primary}
          style={styles.stepIcon}
        />
        <Text
          variant="titleMedium"
          style={[styles.stepTitle, { color: colors.onSurface }]}
          accessibilityRole="header"
        >
          {t("admin:twoFactor.enterCode", {
            defaultValue: "Enter Verification Code",
          })}
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.stepDescription, { color: colors.onSurfaceVariant }]}
        >
          {t("admin:twoFactor.enterCodeDescription", {
            defaultValue:
              "Enter the 6-digit code from your authenticator app to verify setup.",
          })}
        </Text>

        <TextInput
          label={t("admin:twoFactor.codeLabel", {
            defaultValue: "Verification Code",
          })}
          value={code}
          onChangeText={handleCodeChange}
          mode="outlined"
          keyboardType="number-pad"
          maxLength={6}
          style={styles.codeInput}
          error={!!codeError}
          disabled={isVerifying}
          autoFocus
          accessibilityLabel={t("admin:twoFactor.codeLabel", {
            defaultValue: "Verification Code",
          })}
          accessibilityHint={t("admin:twoFactor.codeHint", {
            defaultValue: "Enter the 6-digit code from your authenticator app",
          })}
          testID="2fa-code-input"
        />
        {codeError && (
          <Text
            style={[styles.fieldError, { color: colors.error }]}
            accessibilityRole="alert"
          >
            {codeError}
          </Text>
        )}

        {/* Offline Warning */}
        {!isOnline && (
          <View
            style={[
              styles.warningContainer,
              { backgroundColor: colors.tertiaryContainer },
            ]}
          >
            <Icon name="wifi-off" size={20} color={colors.tertiary} />
            <Text
              style={[
                styles.warningText,
                { color: colors.onTertiaryContainer },
              ]}
            >
              {t("common:offline.actionRequired", {
                defaultValue: "Internet connection required",
              })}
            </Text>
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleVerify}
          loading={isVerifying}
          disabled={isVerifying || code.length !== 6}
          style={styles.button}
          accessibilityLabel={t("admin:twoFactor.verifyButton", {
            defaultValue: "Verify & Enable 2FA",
          })}
          testID="2fa-verify-button"
        >
          {isVerifying
            ? t("common:status.verifying", { defaultValue: "Verifying..." })
            : t("admin:twoFactor.verifyButton", {
                defaultValue: "Verify & Enable 2FA",
              })}
        </Button>
      </>
    );
  }

  function renderCompleteStep() {
    return (
      <>
        <Icon
          name="check-circle"
          size={64}
          color="#4CAF50"
          style={styles.stepIcon}
        />
        <Text
          variant="titleMedium"
          style={[styles.stepTitle, { color: colors.onSurface }]}
          accessibilityRole="header"
        >
          {t("admin:twoFactor.setupComplete", { defaultValue: "2FA Enabled!" })}
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.stepDescription, { color: colors.onSurfaceVariant }]}
        >
          {t("admin:twoFactor.setupCompleteDescription", {
            defaultValue:
              "Two-factor authentication is now enabled for your account. You'll need your authenticator app to sign in.",
          })}
        </Text>

        {/* Security Tip */}
        <View
          style={[
            styles.tipContainer,
            { backgroundColor: colors.primaryContainer },
          ]}
          accessibilityRole="note"
        >
          <Icon name="lightbulb-outline" size={20} color={colors.primary} />
          <Text
            variant="bodySmall"
            style={{ color: colors.onPrimaryContainer, flex: 1 }}
          >
            {t("admin:twoFactor.backupTip", {
              defaultValue:
                "Tip: Save your backup codes in a secure location in case you lose access to your authenticator app.",
            })}
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.button}
          accessibilityLabel={t("admin:twoFactor.continueButton", {
            defaultValue: "Continue to Dashboard",
          })}
          testID="2fa-continue-button"
        >
          {t("admin:twoFactor.continueButton", {
            defaultValue: "Continue to Dashboard",
          })}
        </Button>
      </>
    );
  }
};

// =============================================================================
// STYLES
// =============================================================================

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
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 8,
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
  },
  skipButton: {
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
  },
  headerSpacer: {
    width: 48,
  },
  progressBar: {
    height: 4,
    marginHorizontal: 16,
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    padding: 24,
    alignItems: "center",
  },
  stepIcon: {
    marginBottom: 16,
  },
  stepTitle: {
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 8,
  },
  stepDescription: {
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderRadius: 8,
  },
  secretContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: "center",
    width: "100%",
  },
  secretRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  secretText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 2,
    fontSize: 16,
  },
  codeInput: {
    width: "100%",
    marginBottom: 8,
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
  },
  fieldError: {
    fontSize: 12,
    marginBottom: 16,
    textAlign: "center",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    width: "100%",
  },
  warningText: {
    flex: 1,
    fontSize: 14,
  },
  button: {
    width: "100%",
    marginTop: 8,
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
    width: "100%",
  },
});

export default TwoFactorSetupScreen;
