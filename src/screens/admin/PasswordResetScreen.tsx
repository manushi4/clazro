/**
 * PasswordResetScreen - Password Reset Fixed Screen
 *
 * Purpose: Allow users to reset their password via email
 * Type: Fixed (not widget-based) - Auth flow requires custom handling
 * Accessible from: LoginAdminScreen (Forgot Password link)
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: Password reset flow for admin accounts
 * - User stories:
 *   - As an admin, I can request a password reset email
 *   - As an admin, I see validation errors for invalid email
 *   - As an admin, I see success confirmation after email sent
 *   - As an admin, I can navigate back to login
 * - Data requirements: Uses Supabase auth.resetPasswordForEmail
 * - Screen ID: password-reset
 * - Role access: Public (pre-auth screen)
 * - Required permissions: None (public auth screen)
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses Supabase Auth built-in password reset
 * - No custom tables needed
 * - Email template configured in Supabase dashboard
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - usePasswordReset: Mutation hook for password reset request
 * - Located: src/hooks/mutations/admin/usePasswordReset.ts
 *
 * ============================================================================
 * PHASE 4: SCREEN COMPONENT ✓
 * ============================================================================
 * - All required hooks (theme, i18n, analytics, offline)
 * - Loading state with ActivityIndicator
 * - Error state with retry
 * - Multi-step flow: Request → Success
 * - OfflineBanner at top
 * - Branding support
 * - Analytics tracking
 *
 * ============================================================================
 * PHASE 5: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in routeRegistry.ts: password-reset, PasswordReset
 *
 * ============================================================================
 * PHASE 6: TRANSLATIONS (i18n) ✓
 * ============================================================================
 * - English: src/locales/en/admin.json (passwordReset section)
 * - Hindi: src/locales/hi/admin.json (passwordReset section)
 *
 * ============================================================================
 * PHASE 7: NAVIGATION INTEGRATION ✓
 * ============================================================================
 * - Entry from: LoginAdminScreen (Forgot Password link)
 * - Navigates to: login-admin (after success or back)
 * - Back navigation: Returns to login
 *
 * ============================================================================
 * PHASE 8: TESTING & VERIFICATION
 * ============================================================================
 * - [ ] Loading state renders correctly
 * - [ ] Email input validates correctly
 * - [ ] Success state shows confirmation message
 * - [ ] Offline mode: banner shows, request blocked
 * - [ ] i18n: English displays correctly
 * - [ ] i18n: Hindi displays correctly
 * - [ ] Analytics: screen_view and reset events fire
 * - [ ] Error tracking: errors logged to Sentry
 * - [ ] Navigation: back to login works correctly
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  TextInput,
  Button,
  Surface,
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

// Hooks
import { usePasswordReset } from "../../hooks/mutations/admin";

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

type ScreenStep = "request" | "success";
type ScreenState = "loading" | "error" | "success";

// =============================================================================
// COMPONENT
// =============================================================================

export const PasswordResetScreen: React.FC<Props> = ({
  screenId = "password-reset",
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
  const [step, setStep] = useState<ScreenStep>("request");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  // ===========================================================================
  // MUTATION
  // ===========================================================================
  const {
    mutate: resetPassword,
    isPending,
    error: resetError,
    reset: resetMutation,
  } = usePasswordReset();

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

    // Initialize screen
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
      // Simulate initialization (check any prerequisites)
      await new Promise((resolve) => setTimeout(resolve, 300));
      setScreenState("success");
    } catch (error: any) {
      setInitError(
        error.message ||
          t("common:errors.generic", { defaultValue: "Something went wrong" })
      );
      setScreenState("error");
      captureException(error, {
        tags: { screen: screenId, action: "init" },
      });
    }
  }, [screenId, t]);

  // ===========================================================================
  // VALIDATION
  // ===========================================================================
  const validateEmail = useCallback(
    (value: string): boolean => {
      if (!value.trim()) {
        setEmailError(
          t("admin:passwordReset.errors.emailRequired", {
            defaultValue: "Email is required",
          })
        );
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setEmailError(
          t("admin:passwordReset.errors.emailInvalid", {
            defaultValue: "Please enter a valid email",
          })
        );
        return false;
      }
      setEmailError(null);
      return true;
    },
    [t]
  );

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================
  const handleEmailChange = useCallback(
    (value: string) => {
      setEmail(value);
      if (emailError) validateEmail(value);
      if (resetError) resetMutation();
    },
    [emailError, resetError, resetMutation, validateEmail]
  );

  const handleSubmit = useCallback(() => {
    // Check offline status
    if (!isOnline) {
      Alert.alert(
        t("common:offline.title", { defaultValue: "You're Offline" }),
        t("common:offline.actionRequired", {
          defaultValue: "Internet connection required for this action.",
        }),
        [{ text: t("common:actions.ok", { defaultValue: "OK" }) }]
      );
      trackEvent("password_reset_blocked_offline");
      return;
    }

    if (!validateEmail(email)) {
      trackEvent("password_reset_validation_failed");
      return;
    }

    trackEvent("password_reset_attempt", { email: email.toLowerCase() });
    addBreadcrumb({
      category: "auth",
      message: "Password reset requested",
      level: "info",
    });

    resetPassword(
      { email: email.trim().toLowerCase() },
      {
        onSuccess: () => {
          trackEvent("password_reset_success");
          addBreadcrumb({
            category: "auth",
            message: "Password reset email sent",
            level: "info",
          });
          setStep("success");
        },
        onError: (error) => {
          trackEvent("password_reset_failed", { error: error.message });
          addBreadcrumb({
            category: "auth",
            message: "Password reset failed",
            level: "error",
            data: { error: error.message },
          });
        },
      }
    );
  }, [email, isOnline, validateEmail, resetPassword, trackEvent, t]);

  const handleBack = useCallback(() => {
    trackEvent("password_reset_back_pressed");
    navigation.goBack();
  }, [navigation, trackEvent]);

  const handleBackToLogin = useCallback(() => {
    trackEvent("password_reset_back_to_login");
    navigation.navigate("login-admin");
  }, [navigation, trackEvent]);

  const handleRetry = useCallback(() => {
    initializeScreen();
  }, [initializeScreen]);

  const handleTryAgain = useCallback(() => {
    setStep("request");
    setEmail("");
    setEmailError(null);
    resetMutation();
  }, [resetMutation]);

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
            {t("common:status.loading", { defaultValue: "Loading..." })}
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
            testID="password-reset-retry-button"
          >
            {t("common:actions.retry", { defaultValue: "Try Again" })}
          </Button>
          <Button
            mode="text"
            onPress={handleBack}
            style={styles.backButton}
            testID="password-reset-back-button"
          >
            {t("common:actions.back", { defaultValue: "Go Back" })}
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
        <IconButton
          icon="arrow-left"
          onPress={handleBack}
          accessibilityLabel={t("common:actions.back", {
            defaultValue: "Go back",
          })}
          testID="password-reset-header-back"
        />
        <Text
          variant="titleLarge"
          style={[styles.headerTitle, { color: colors.onSurface }]}
          accessibilityRole="header"
        >
          {t("admin:passwordReset.title", { defaultValue: "Reset Password" })}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Surface
            style={[styles.card, { borderRadius: borderRadius.large }]}
            elevation={2}
          >
            {/* Request Step */}
            {step === "request" && renderRequestStep()}

            {/* Success Step */}
            {step === "success" && renderSuccessStep()}
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  // ===========================================================================
  // RENDER HELPERS
  // ===========================================================================
  function renderRequestStep() {
    return (
      <>
        {/* Logo */}
        {branding?.logoUrl ? (
          <Image
            source={{ uri: branding.logoUrl }}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel={t("admin:login.logoAlt", {
              defaultValue: "App logo",
            })}
          />
        ) : (
          <View
            style={[
              styles.logoPlaceholder,
              { backgroundColor: colors.primaryContainer },
            ]}
          >
            <Icon name="lock-reset" size={40} color={colors.primary} />
          </View>
        )}

        <Text
          variant="titleMedium"
          style={[styles.stepTitle, { color: colors.onSurface }]}
          accessibilityRole="header"
        >
          {t("admin:passwordReset.requestTitle", {
            defaultValue: "Forgot your password?",
          })}
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.stepDescription, { color: colors.onSurfaceVariant }]}
        >
          {t("admin:passwordReset.requestDescription", {
            defaultValue:
              "Enter your email address and we'll send you a link to reset your password.",
          })}
        </Text>

        {/* Email Input */}
        <TextInput
          label={t("admin:passwordReset.emailLabel", { defaultValue: "Email" })}
          value={email}
          onChangeText={handleEmailChange}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          style={styles.input}
          error={!!emailError}
          disabled={isPending}
          left={<TextInput.Icon icon="email-outline" />}
          accessibilityLabel={t("admin:passwordReset.emailLabel", {
            defaultValue: "Email",
          })}
          accessibilityHint={t("admin:passwordReset.emailHint", {
            defaultValue: "Enter your email address",
          })}
          testID="password-reset-email-input"
        />
        {emailError && (
          <Text
            style={[styles.fieldError, { color: colors.error }]}
            accessibilityRole="alert"
          >
            {emailError}
          </Text>
        )}

        {/* Reset Error */}
        {resetError && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: colors.errorContainer },
            ]}
          >
            <Icon name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {resetError.message ||
                t("admin:passwordReset.errors.resetFailed", {
                  defaultValue: "Failed to send reset email. Please try again.",
                })}
            </Text>
          </View>
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

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isPending}
          disabled={isPending || !email.trim()}
          style={styles.button}
          contentStyle={styles.buttonContent}
          accessibilityLabel={t("admin:passwordReset.submitButton", {
            defaultValue: "Send Reset Link",
          })}
          testID="password-reset-submit-button"
        >
          {isPending
            ? t("common:status.sending", { defaultValue: "Sending..." })
            : t("admin:passwordReset.submitButton", {
                defaultValue: "Send Reset Link",
              })}
        </Button>

        {/* Back to Login */}
        <Button
          mode="text"
          onPress={handleBackToLogin}
          style={styles.linkButton}
          disabled={isPending}
          accessibilityLabel={t("admin:passwordReset.backToLogin", {
            defaultValue: "Back to Login",
          })}
          testID="password-reset-back-to-login"
        >
          {t("admin:passwordReset.backToLogin", {
            defaultValue: "Back to Login",
          })}
        </Button>
      </>
    );
  }

  function renderSuccessStep() {
    return (
      <>
        <Icon
          name="email-check"
          size={64}
          color={colors.primary}
          style={styles.successIcon}
        />
        <Text
          variant="titleMedium"
          style={[styles.stepTitle, { color: colors.onSurface }]}
          accessibilityRole="header"
        >
          {t("admin:passwordReset.successTitle", {
            defaultValue: "Check your email",
          })}
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.stepDescription, { color: colors.onSurfaceVariant }]}
        >
          {t("admin:passwordReset.successDescription", {
            email: email,
            defaultValue:
              "We've sent a password reset link to {{email}}. Please check your inbox and follow the instructions.",
          })}
        </Text>

        {/* Tips */}
        <View
          style={[
            styles.tipContainer,
            { backgroundColor: colors.surfaceVariant },
          ]}
          accessibilityRole="note"
        >
          <Icon
            name="information-outline"
            size={20}
            color={colors.onSurfaceVariant}
          />
          <View style={styles.tipContent}>
            <Text
              variant="bodySmall"
              style={{ color: colors.onSurfaceVariant }}
            >
              {t("admin:passwordReset.tipSpam", {
                defaultValue:
                  "• Check your spam folder if you don't see the email",
              })}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: colors.onSurfaceVariant, marginTop: 4 }}
            >
              {t("admin:passwordReset.tipExpiry", {
                defaultValue: "• The link expires in 1 hour",
              })}
            </Text>
          </View>
        </View>

        {/* Back to Login Button */}
        <Button
          mode="contained"
          onPress={handleBackToLogin}
          style={styles.button}
          contentStyle={styles.buttonContent}
          accessibilityLabel={t("admin:passwordReset.backToLogin", {
            defaultValue: "Back to Login",
          })}
          testID="password-reset-success-back-to-login"
        >
          {t("admin:passwordReset.backToLogin", {
            defaultValue: "Back to Login",
          })}
        </Button>

        {/* Resend Link */}
        <Button
          mode="text"
          onPress={handleTryAgain}
          style={styles.linkButton}
          accessibilityLabel={t("admin:passwordReset.resendLink", {
            defaultValue: "Didn't receive email? Try again",
          })}
          testID="password-reset-resend"
        >
          {t("admin:passwordReset.resendLink", {
            defaultValue: "Didn't receive email? Try again",
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
  backButton: {
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
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 16,
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    padding: 24,
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
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
  input: {
    width: "100%",
    marginBottom: 4,
  },
  fieldError: {
    fontSize: 12,
    marginBottom: 12,
    alignSelf: "flex-start",
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    width: "100%",
  },
  errorText: {
    flex: 1,
    fontSize: 14,
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
  buttonContent: {
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 12,
  },
  successIcon: {
    marginBottom: 16,
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
  tipContent: {
    flex: 1,
  },
});

export default PasswordResetScreen;
