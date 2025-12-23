/**
 * UserCreateScreen - Admin User Creation Fixed Screen
 *
 * Purpose: Create new users with role selection and profile setup
 * Type: Fixed (form-based) - Custom form for user creation
 * Accessible from: UserManagementScreen, Quick Actions widget
 *
 * Following SCREEN_DEVELOPMENT_GUIDE.md Phase 1-8
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";

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

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

type UserRole = "student" | "teacher" | "parent" | "admin";

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
  sendInvite: boolean;
};

type FormErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

const ROLES: { value: UserRole; label: string; icon: string; color: string }[] = [
  { value: "student", label: "Student", icon: "school", color: "#2196F3" },
  { value: "teacher", label: "Teacher", icon: "human-male-board", color: "#4CAF50" },
  { value: "parent", label: "Parent", icon: "account-child", color: "#FF9800" },
  { value: "admin", label: "Admin", icon: "shield-account", color: "#9C27B0" },
];

// =============================================================================
// COMPONENT
// =============================================================================

export const UserCreateScreen: React.FC<Props> = ({
  screenId = "users-create",
  navigation: navProp,
  onFocused,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation(["admin", "common"]);
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    role: "student",
    password: "",
    confirmPassword: "",
    sendInvite: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track screen view
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
    });
  }, [screenId, trackScreenView]);

  // Handlers
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const updateField = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t("admin:userCreate.errors.nameRequired", { defaultValue: "Name is required" });
    }

    if (!formData.email.trim()) {
      newErrors.email = t("admin:userCreate.errors.emailRequired", { defaultValue: "Email is required" });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("admin:userCreate.errors.emailInvalid", { defaultValue: "Invalid email format" });
    }

    if (!formData.sendInvite) {
      if (!formData.password) {
        newErrors.password = t("admin:userCreate.errors.passwordRequired", { defaultValue: "Password is required" });
      } else if (formData.password.length < 6) {
        newErrors.password = t("admin:userCreate.errors.passwordShort", { defaultValue: "Password must be at least 6 characters" });
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t("admin:userCreate.errors.passwordMismatch", { defaultValue: "Passwords do not match" });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const handleSubmit = useCallback(async () => {
    if (!isOnline) {
      Alert.alert(
        t("common:offline.title", { defaultValue: "Offline" }),
        t("common:offline.actionBlocked", { defaultValue: "This action requires an internet connection." })
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call - in production, this would call a mutation hook
      await new Promise((resolve) => setTimeout(resolve, 1500));

      trackEvent("user_created", {
        role: formData.role,
        sendInvite: formData.sendInvite,
      });

      Alert.alert(
        t("admin:userCreate.success.title", { defaultValue: "Success" }),
        t("admin:userCreate.success.message", {
          name: formData.fullName,
          defaultValue: `User ${formData.fullName} has been created successfully.`,
        }),
        [
          {
            text: t("common:actions.ok", { defaultValue: "OK" }),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        t("common:error.title", { defaultValue: "Error" }),
        t("admin:userCreate.errors.createFailed", { defaultValue: "Failed to create user. Please try again." })
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [isOnline, validateForm, formData, trackEvent, t, navigation]);

  const selectedRole = ROLES.find((r) => r.value === formData.role);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("admin:userCreate.title", { defaultValue: "Create User" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Role Selection */}
          <AppCard style={styles.section}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:userCreate.selectRole", { defaultValue: "Select Role" })}
            </AppText>
            <View style={styles.roleGrid}>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: formData.role === role.value ? `${role.color}15` : colors.surfaceVariant,
                      borderColor: formData.role === role.value ? role.color : colors.outlineVariant,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                  onPress={() => updateField("role", role.value)}
                >
                  <Icon
                    name={role.icon}
                    size={28}
                    color={formData.role === role.value ? role.color : colors.onSurfaceVariant}
                  />
                  <AppText
                    style={[
                      styles.roleLabel,
                      { color: formData.role === role.value ? role.color : colors.onSurfaceVariant },
                    ]}
                  >
                    {t(`admin:widgets.userList.roles.${role.value}`, { defaultValue: role.label })}
                  </AppText>
                  {formData.role === role.value && (
                    <Icon name="check-circle" size={18} color={role.color} style={styles.roleCheck} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </AppCard>

          {/* Basic Information */}
          <AppCard style={styles.section}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("admin:userCreate.basicInfo", { defaultValue: "Basic Information" })}
            </AppText>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:userCreate.fullName", { defaultValue: "Full Name" })} *
              </AppText>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: errors.fullName ? colors.error : colors.outlineVariant,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Icon name="account" size={20} color={colors.onSurfaceVariant} />
                <TextInput
                  style={[styles.input, { color: colors.onSurface }]}
                  placeholder={t("admin:userCreate.fullNamePlaceholder", { defaultValue: "Enter full name" })}
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={formData.fullName}
                  onChangeText={(text) => updateField("fullName", text)}
                  autoCapitalize="words"
                />
              </View>
              {errors.fullName && (
                <AppText style={[styles.errorText, { color: colors.error }]}>{errors.fullName}</AppText>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:userCreate.email", { defaultValue: "Email" })} *
              </AppText>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: errors.email ? colors.error : colors.outlineVariant,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Icon name="email" size={20} color={colors.onSurfaceVariant} />
                <TextInput
                  style={[styles.input, { color: colors.onSurface }]}
                  placeholder={t("admin:userCreate.emailPlaceholder", { defaultValue: "Enter email address" })}
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={formData.email}
                  onChangeText={(text) => updateField("email", text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && (
                <AppText style={[styles.errorText, { color: colors.error }]}>{errors.email}</AppText>
              )}
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:userCreate.phone", { defaultValue: "Phone Number" })}
              </AppText>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.outlineVariant,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Icon name="phone" size={20} color={colors.onSurfaceVariant} />
                <TextInput
                  style={[styles.input, { color: colors.onSurface }]}
                  placeholder={t("admin:userCreate.phonePlaceholder", { defaultValue: "Enter phone number" })}
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={formData.phone}
                  onChangeText={(text) => updateField("phone", text)}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </AppCard>

          {/* Password Section */}
          <AppCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t("admin:userCreate.password", { defaultValue: "Password" })}
              </AppText>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: formData.sendInvite ? colors.primaryContainer : colors.surfaceVariant,
                    borderRadius: borderRadius.full,
                  },
                ]}
                onPress={() => updateField("sendInvite", !formData.sendInvite)}
              >
                <Icon
                  name={formData.sendInvite ? "email-send" : "lock"}
                  size={16}
                  color={formData.sendInvite ? colors.primary : colors.onSurfaceVariant}
                />
                <AppText
                  style={[
                    styles.toggleText,
                    { color: formData.sendInvite ? colors.primary : colors.onSurfaceVariant },
                  ]}
                >
                  {formData.sendInvite
                    ? t("admin:userCreate.sendInvite", { defaultValue: "Send Invite" })
                    : t("admin:userCreate.setPassword", { defaultValue: "Set Password" })}
                </AppText>
              </TouchableOpacity>
            </View>

            {formData.sendInvite ? (
              <View style={[styles.infoBox, { backgroundColor: colors.primaryContainer }]}>
                <Icon name="information" size={20} color={colors.primary} />
                <AppText style={[styles.infoText, { color: colors.onPrimaryContainer }]}>
                  {t("admin:userCreate.inviteInfo", {
                    defaultValue: "An invitation email will be sent to the user to set their own password.",
                  })}
                </AppText>
              </View>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                    {t("admin:userCreate.passwordLabel", { defaultValue: "Password" })} *
                  </AppText>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: errors.password ? colors.error : colors.outlineVariant,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <Icon name="lock" size={20} color={colors.onSurfaceVariant} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface }]}
                      placeholder={t("admin:userCreate.passwordPlaceholder", { defaultValue: "Enter password" })}
                      placeholderTextColor={colors.onSurfaceVariant}
                      value={formData.password}
                      onChangeText={(text) => updateField("password", text)}
                      secureTextEntry
                    />
                  </View>
                  {errors.password && (
                    <AppText style={[styles.errorText, { color: colors.error }]}>{errors.password}</AppText>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                    {t("admin:userCreate.confirmPassword", { defaultValue: "Confirm Password" })} *
                  </AppText>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: errors.confirmPassword ? colors.error : colors.outlineVariant,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <Icon name="lock-check" size={20} color={colors.onSurfaceVariant} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface }]}
                      placeholder={t("admin:userCreate.confirmPasswordPlaceholder", { defaultValue: "Confirm password" })}
                      placeholderTextColor={colors.onSurfaceVariant}
                      value={formData.confirmPassword}
                      onChangeText={(text) => updateField("confirmPassword", text)}
                      secureTextEntry
                    />
                  </View>
                  {errors.confirmPassword && (
                    <AppText style={[styles.errorText, { color: colors.error }]}>{errors.confirmPassword}</AppText>
                  )}
                </View>
              </>
            )}
          </AppCard>

          {/* Summary */}
          <AppCard style={[styles.section, { backgroundColor: colors.surfaceVariant }]}>
            <View style={styles.summaryRow}>
              <Icon name={selectedRole?.icon || "account"} size={24} color={selectedRole?.color || colors.primary} />
              <View style={styles.summaryText}>
                <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                  {t("admin:userCreate.creating", { defaultValue: "Creating" })}
                </AppText>
                <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
                  {formData.fullName || t("admin:userCreate.newUser", { defaultValue: "New User" })} ({t(`admin:widgets.userList.roles.${formData.role}`, { defaultValue: formData.role })})
                </AppText>
              </View>
            </View>
          </AppCard>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.outlineVariant, borderRadius: borderRadius.md }]}
            onPress={handleBack}
            disabled={isSubmitting}
          >
            <AppText style={[styles.cancelButtonText, { color: colors.onSurfaceVariant }]}>
              {t("common:actions.cancel", { defaultValue: "Cancel" })}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: isSubmitting || !isOnline ? colors.outlineVariant : colors.primary,
                borderRadius: borderRadius.md,
              },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !isOnline}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="account-plus" size={20} color="#FFFFFF" />
                <AppText style={styles.submitButtonText}>
                  {t("admin:userCreate.createUser", { defaultValue: "Create User" })}
                </AppText>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  flex: {
    flex: 1,
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
    paddingBottom: 100,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  roleCard: {
    width: "47%",
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    position: "relative",
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  roleCheck: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UserCreateScreen;
