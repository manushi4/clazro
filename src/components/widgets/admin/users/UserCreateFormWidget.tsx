/**
 * UserCreateFormWidget - User Creation Form
 *
 * Widget ID: admin.user-create-form
 * Purpose: Form fields for creating a new user
 * Screen: users-create
 */

import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";

import { useAppTheme } from "../../../../theme/useAppTheme";
import { AppText } from "../../../../ui/components/AppText";
import { AppCard } from "../../../../ui/components/AppCard";
import { useNetworkStatus } from "../../../../offline/networkStore";
import { useCreateUser } from "../../../../hooks/mutations/admin";
import { useAnalytics } from "../../../../hooks/useAnalytics";
import type { WidgetProps } from "../../../../types/widget.types";

// =============================================================================
// TYPES
// =============================================================================

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

type CustomProps = {
  selectedRole?: UserRole;
  showPasswordSection?: boolean;
  onSuccess?: () => void;
};

// =============================================================================
// COMPONENT
// =============================================================================

export const UserCreateFormWidget: React.FC<WidgetProps> = ({
  customProps = {},
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation(["admin", "common"]);
  const { isOnline } = useNetworkStatus();
  const { trackEvent } = useAnalytics();
  const navigation = useNavigation<any>();
  const createUserMutation = useCreateUser();

  const {
    selectedRole = "student",
    showPasswordSection = true,
    onSuccess,
  } = customProps as CustomProps;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    role: selectedRole,
    password: "",
    confirmPassword: "",
    sendInvite: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Update role when prop changes
  React.useEffect(() => {
    setFormData((prev) => ({ ...prev, role: selectedRole }));
  }, [selectedRole]);

  const updateField = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    if (!formData.sendInvite && showPasswordSection) {
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
  }, [formData, showPasswordSection, t]);

  const handleSubmit = useCallback(async () => {
    if (!isOnline) {
      Alert.alert(
        t("common:offline.title", { defaultValue: "Offline" }),
        t("common:offline.actionBlocked", { defaultValue: "This action requires an internet connection." })
      );
      return;
    }

    if (!validateForm()) return;

    try {
      const result = await createUserMutation.mutateAsync({
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role,
        phone: formData.phone || undefined,
        password: formData.sendInvite ? undefined : formData.password,
        sendWelcomeEmail: formData.sendInvite,
      });

      if (result.success) {
        trackEvent("user_created", {
          role: formData.role,
          sendInvite: formData.sendInvite,
        });

        Alert.alert(
          t("admin:userCreate.success.title", { defaultValue: "Success" }),
          result.message,
          [
            {
              text: t("common:actions.ok", { defaultValue: "OK" }),
              onPress: () => {
                onSuccess?.();
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          t("common:error.title", { defaultValue: "Error" }),
          result.message || t("admin:userCreate.errors.createFailed", { defaultValue: "Failed to create user" })
        );
      }
    } catch (error: any) {
      Alert.alert(
        t("common:error.title", { defaultValue: "Error" }),
        error.message || t("admin:userCreate.errors.createFailed", { defaultValue: "Failed to create user" })
      );
    }
  }, [isOnline, validateForm, formData, createUserMutation, trackEvent, t, navigation, onSuccess]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const isSubmitting = createUserMutation.isPending;

  return (
    <View style={styles.container}>
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
              editable={!isSubmitting}
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
              editable={!isSubmitting}
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
              editable={!isSubmitting}
            />
          </View>
        </View>
      </AppCard>

      {/* Password Section */}
      {showPasswordSection && (
        <AppCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface, marginBottom: 0 }]}>
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
              disabled={isSubmitting}
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
                    editable={!isSubmitting}
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
                    editable={!isSubmitting}
                  />
                </View>
                {errors.confirmPassword && (
                  <AppText style={[styles.errorText, { color: colors.error }]}>{errors.confirmPassword}</AppText>
                )}
              </View>
            </>
          )}
        </AppCard>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.cancelButton,
            { borderColor: colors.outlineVariant, borderRadius: borderRadius.md },
          ]}
          onPress={handleCancel}
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
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    padding: 16,
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
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 4,
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

export default UserCreateFormWidget;
