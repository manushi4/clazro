/**
 * LoginAdminScreen - Admin Login Fixed Screen
 *
 * Purpose: Admin authentication with email/password and 2FA support
 * Type: Fixed (not widget-based) - Auth flow requires custom handling
 * Accessible from: App entry point for admin role, auth navigator
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: Admin authentication with email/password
 * - User stories:
 *   - As an admin, I can login with my email and password
 *   - As an admin, I see validation errors for invalid inputs
 *   - As an admin, I'm redirected to 2FA setup/verify if required
 *   - As an admin, I can reset my password if forgotten
 * - Data requirements: profiles, admin_users, admin_sessions, audit_logs
 * - Screen ID: login-admin
 * - Role access: admin, super_admin
 * - Required permissions: None (public auth screen)
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses existing tables: profiles, admin_users, admin_sessions, audit_logs
 * - RLS: Public access for auth, role-restricted for profile verification
 * - No new migrations needed for this screen
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - useAdminAuth: Login mutation with role verification
 * - Located: src/hooks/mutations/admin/useAdminAuth.ts
 *
 * ============================================================================
 * PHASE 4: SCREEN COMPONENT ✓
 * ============================================================================
 * - All required hooks (theme, i18n, analytics, offline)
 * - Loading state with ActivityIndicator
 * - Error state with retry/clear
 * - Success state with form
 * - OfflineBanner at top
 * - Branding for white-label
 * - Analytics tracking
 *
 * ============================================================================
 * PHASE 5: ROUTE REGISTRATION ✓
 * ============================================================================
 * - Registered in routeRegistry.ts: login-admin, LoginAdmin
 *
 * ============================================================================
 * PHASE 6: TRANSLATIONS (i18n) ✓
 * ============================================================================
 * - English: src/locales/en/admin.json (login section)
 * - Hindi: src/locales/hi/admin.json (login section)
 *
 * ============================================================================
 * PHASE 7: NAVIGATION INTEGRATION ✓
 * ============================================================================
 * - Entry point from auth navigator
 * - Navigates to: 2fa-setup, 2fa-verify, admin-home, password-reset
 *
 * ============================================================================
 * PHASE 8: TESTING & VERIFICATION
 * ============================================================================
 * - [ ] Loading state renders correctly
 * - [ ] Error state shows with retry option
 * - [ ] Success state shows login form
 * - [ ] Offline mode: banner shows, login blocked with alert
 * - [ ] i18n: English displays correctly
 * - [ ] i18n: Hindi displays correctly
 * - [ ] Branding: customer logo and app name show
 * - [ ] Analytics: screen_view and login events fire
 * - [ ] Error tracking: login errors logged to Sentry
 * - [ ] Navigation: 2FA flow works, password reset works
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput, Button, Surface } from "react-native-paper";
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
import { useAdminAuth } from "../../hooks/mutations/admin";

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

type ScreenState = "loading" | "error" | "success";

// =============================================================================
// COMPONENT
// =============================================================================

export const LoginAdminScreen: React.FC<Props> = ({
  screenId = "login-admin",
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ===========================================================================
  // MUTATION
  // ===========================================================================
  const {
    mutate: login,
    isPending,
    error: loginError,
    reset: resetError,
  } = useAdminAuth();

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  useEffect(() => {
    // Track screen view
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
    });

    // Initialize screen (simulate any async setup)
    const initScreen = async () => {
      try {
        // Any initialization logic here (e.g., check existing session)
        setScreenState("success");
      } catch (error: any) {
        setInitError(error.message || "Failed to initialize screen");
        setScreenState("error");
        captureException(error, {
          tags: { screen: screenId, action: "init" },
        });
      }
    };

    initScreen();
  }, [screenId, trackScreenView]);

  // Call onFocused callback if provided
  useEffect(() => {
    onFocused?.();
  }, [onFocused]);

  // ===========================================================================
  // VALIDATION
  // ===========================================================================
  const validateEmail = useCallback(
    (value: string): boolean => {
      if (!value.trim()) {
        setEmailError(
          t("admin:login.errors.emailRequired", {
            defaultValue: "Email is required",
          })
        );
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setEmailError(
          t("admin:login.errors.emailInvalid", {
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

  const validatePassword = useCallback(
    (value: string): boolean => {
      if (!value) {
        setPasswordError(
          t("admin:login.errors.passwordRequired", {
            defaultValue: "Password is required",
          })
        );
        return false;
      }
      if (value.length < 6) {
        setPasswordError(
          t("admin:login.errors.passwordShort", {
            defaultValue: "Password must be at least 6 characters",
          })
        );
        return false;
      }
      setPasswordError(null);
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
      if (loginError) resetError();
    },
    [emailError, loginError, resetError, validateEmail]
  );

  const handlePasswordChange = useCallback(
    (value: string) => {
      setPassword(value);
      if (passwordError) validatePassword(value);
      if (loginError) resetError();
    },
    [passwordError, loginError, resetError, validatePassword]
  );

  const handleLogin = useCallback(() => {
    // Check offline status - block mutation when offline
    if (!isOnline) {
      Alert.alert(
        t("common:offline.title", { defaultValue: "You're Offline" }),
        t("common:offline.loginRequired", {
          defaultValue:
            "Internet connection is required to login. Please try again when online.",
        }),
        [{ text: t("common:actions.ok", { defaultValue: "OK" }) }]
      );
      trackEvent("admin_login_blocked_offline");
      return;
    }

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      trackEvent("admin_login_validation_failed");
      return;
    }

    // Track login attempt
    trackEvent("admin_login_attempt", { email: email.toLowerCase() });
    addBreadcrumb({
      category: "auth",
      message: "Admin login form submitted",
      level: "info",
    });

    // Execute login mutation
    login(
      { email: email.trim().toLowerCase(), password },
      {
        onSuccess: (data) => {
          trackEvent("admin_login_success", { userId: data.user.id });
          addBreadcrumb({
            category: "auth",
            message: "Admin login successful",
            level: "info",
            data: { userId: data.user.id },
          });

          // Navigate based on 2FA status
          if (data.requires2FA) {
            navigation.navigate("2fa-verify", { userId: data.user.id });
          } else if (!data.profile.two_factor_enabled) {
            // Prompt to setup 2FA for security
            navigation.navigate("2fa-setup");
          } else {
            // Navigate to admin dashboard
            navigation.reset({
              index: 0,
              routes: [{ name: "admin-home" }],
            });
          }
        },
        onError: (error) => {
          trackEvent("admin_login_failed", { error: error.message });
          addBreadcrumb({
            category: "auth",
            message: "Admin login failed",
            level: "error",
            data: { error: error.message },
          });
        },
      }
    );
  }, [
    email,
    password,
    isOnline,
    validateEmail,
    validatePassword,
    login,
    navigation,
    trackEvent,
    t,
  ]);

  const handleForgotPassword = useCallback(() => {
    trackEvent("admin_forgot_password_pressed");
    navigation.navigate("password-reset");
  }, [navigation, trackEvent]);

  const handleRetry = useCallback(() => {
    setInitError(null);
    setScreenState("loading");
    // Re-trigger initialization
    setTimeout(() => setScreenState("success"), 500);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

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
          >
            {t("common:actions.retry", { defaultValue: "Try Again" })}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // SUCCESS STATE (Login Form)
  // ===========================================================================
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Offline Banner */}
      <OfflineBanner />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Surface
              style={[styles.card, { borderRadius: borderRadius.large }]}
              elevation={2}
            >
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
                  <Icon
                    name="shield-account"
                    size={40}
                    color={colors.primary}
                  />
                </View>
              )}

              {/* Title */}
              <Text
                variant="headlineMedium"
                style={[styles.title, { color: colors.onSurface }]}
                accessibilityRole="header"
              >
                {t("admin:login.title", { defaultValue: "Admin Login" })}
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
              >
                {t("admin:login.subtitle", {
                  appName: branding?.appName || "EduPlatform",
                  defaultValue: "{{appName}} Administration",
                })}
              </Text>

              {/* Email Input */}
              <TextInput
                label={t("admin:login.emailLabel", { defaultValue: "Email" })}
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
                accessibilityLabel={t("admin:login.emailLabel", {
                  defaultValue: "Email",
                })}
                accessibilityHint={t("admin:login.emailHint", {
                  defaultValue: "Enter your admin email address",
                })}
                testID="admin-login-email-input"
              />
              {emailError && (
                <Text style={[styles.fieldError, { color: colors.error }]}>
                  {emailError}
                </Text>
              )}

              {/* Password Input */}
              <TextInput
                label={t("admin:login.passwordLabel", {
                  defaultValue: "Password",
                })}
                value={password}
                onChangeText={handlePasswordChange}
                mode="outlined"
                secureTextEntry={!showPassword}
                style={styles.input}
                error={!!passwordError}
                disabled={isPending}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={togglePasswordVisibility}
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                  />
                }
                accessibilityLabel={t("admin:login.passwordLabel", {
                  defaultValue: "Password",
                })}
                accessibilityHint={t("admin:login.passwordHint", {
                  defaultValue: "Enter your password",
                })}
                testID="admin-login-password-input"
              />
              {passwordError && (
                <Text style={[styles.fieldError, { color: colors.error }]}>
                  {passwordError}
                </Text>
              )}

              {/* Login Error */}
              {loginError && (
                <View
                  style={[
                    styles.errorContainer,
                    { backgroundColor: colors.errorContainer },
                  ]}
                >
                  <Icon name="alert-circle" size={20} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {loginError.message ||
                      t("admin:login.errors.loginFailed", {
                        defaultValue: "Login failed. Please try again.",
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
                    {t("common:offline.loginRequired", {
                      defaultValue: "Internet connection required to login",
                    })}
                  </Text>
                </View>
              )}

              {/* Login Button */}
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={isPending}
                disabled={isPending || !email || !password}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
                accessibilityLabel={t("admin:login.loginButton", {
                  defaultValue: "Sign In",
                })}
                accessibilityHint={t("admin:login.loginButtonHint", {
                  defaultValue: "Tap to sign in to admin panel",
                })}
                testID="admin-login-submit-button"
              >
                {isPending
                  ? t("common:status.loading", { defaultValue: "Loading..." })
                  : t("admin:login.loginButton", { defaultValue: "Sign In" })}
              </Button>

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={handleForgotPassword}
                style={styles.forgotButton}
                disabled={isPending}
                accessibilityRole="button"
                accessibilityLabel={t("admin:login.forgotPassword", {
                  defaultValue: "Forgot Password?",
                })}
                testID="admin-login-forgot-password"
              >
                <Text style={[styles.forgotText, { color: colors.primary }]}>
                  {t("admin:login.forgotPassword", {
                    defaultValue: "Forgot Password?",
                  })}
                </Text>
              </TouchableOpacity>
            </Surface>

            {/* Footer */}
            <View style={styles.footer}>
              <Text
                style={[styles.footerText, { color: colors.onSurfaceVariant }]}
              >
                {t("admin:login.secureLogin", {
                  defaultValue: "Secure admin access",
                })}
              </Text>
              <Icon
                name="shield-check"
                size={16}
                color={colors.primary}
                style={styles.footerIcon}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    padding: 24,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: "center",
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 4,
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 4,
  },
  fieldError: {
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
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
  },
  warningText: {
    flex: 1,
    fontSize: 14,
  },
  loginButton: {
    marginTop: 8,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  forgotButton: {
    marginTop: 16,
    alignSelf: "center",
    padding: 8,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
  },
  footerIcon: {
    marginLeft: 4,
  },
});

export default LoginAdminScreen;
