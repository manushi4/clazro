/**
 * Edit Profile Screen - Fixed (Low Customization)
 * 
 * Form for editing user profile:
 * - Name, avatar upload, class, phone
 * - Uses useAppTheme() for colors
 * - Uses useBranding() for text
 * - Uses useMediaUpload() for avatar
 */

import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { launchImageLibrary } from "react-native-image-picker";

import { useAppTheme } from "../../theme/useAppTheme";
import { useBranding } from "../../context/BrandingContext";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useNetworkStatus } from "../../offline/networkStore";
import { useMediaUpload, BUCKETS } from "../../hooks/useMediaUpload";
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { OfflineBanner } from "../../offline/OfflineBanner";
import { useDemoUser } from "../../hooks/useDemoUser";

type FormData = {
  name: string;
  phone: string;
  className: string;
  section: string;
  avatarUrl: string | null;
};

export const EditProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation("profile");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const { userId } = useDemoUser();

  // Media upload hook for avatar
  const { upload, isUploading, progress } = useMediaUpload({
    bucket: BUCKETS.USER_UPLOADS,
    resourceType: "avatar",
    resourceId: userId,
  });

  // Form state (would be populated from user query in production)
  const [formData, setFormData] = useState<FormData>({
    name: "Demo Student",
    phone: "",
    className: "10",
    section: "A",
    avatarUrl: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  React.useEffect(() => {
    trackScreenView("edit-profile");
  }, []);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePickAvatar = useCallback(async () => {
    if (!isOnline) {
      Alert.alert(
        t("common:offline.title", { defaultValue: "Offline" }),
        t("common:offline.uploadDisabled", { defaultValue: "Cannot upload while offline" })
      );
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        quality: 0.8,
        maxWidth: 512,
        maxHeight: 512,
      });

      if (result.assets?.[0]) {
        const asset = result.assets[0];
        trackEvent("avatar_upload_started");

        const uploadResult = await upload({
          uri: asset.uri!,
          name: asset.fileName || "avatar.jpg",
          type: asset.type || "image/jpeg",
        });

        if (uploadResult.success && uploadResult.url) {
          setFormData(prev => ({ ...prev, avatarUrl: uploadResult.url! }));
          trackEvent("avatar_upload_success");
        } else {
          Alert.alert("Error", uploadResult.error || "Failed to upload avatar");
          trackEvent("avatar_upload_failed", { error: uploadResult.error });
        }
      }
    } catch (error) {
      console.error("Image picker error:", error);
    }
  }, [isOnline, upload, trackEvent, t]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("editProfile.errors.nameRequired", { defaultValue: "Name is required" });
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = t("editProfile.errors.invalidPhone", { defaultValue: "Enter valid 10-digit phone" });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    if (!isOnline) {
      Alert.alert(
        t("common:offline.title", { defaultValue: "Offline" }),
        t("common:offline.saveDisabled", { defaultValue: "Cannot save while offline" })
      );
      return;
    }

    setIsSaving(true);
    trackEvent("profile_save_started");

    try {
      // TODO: Call API to save profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      trackEvent("profile_save_success");
      Alert.alert(
        t("editProfile.success.title", { defaultValue: "Success" }),
        t("editProfile.success.message", { defaultValue: "Profile updated successfully" }),
        [{ text: "OK", onPress: () => navigation?.goBack?.() }]
      );
    } catch (error) {
      trackEvent("profile_save_failed");
      Alert.alert(
        t("editProfile.error.title", { defaultValue: "Error" }),
        t("editProfile.error.message", { defaultValue: "Failed to update profile" })
      );
    } finally {
      setIsSaving(false);
    }
  }, [formData, isOnline, navigation, trackEvent, t]);

  const renderInput = (
    field: keyof FormData,
    label: string,
    icon: string,
    options?: {
      placeholder?: string;
      keyboardType?: "default" | "phone-pad" | "email-address";
      editable?: boolean;
    }
  ) => (
    <View style={styles.inputGroup}>
      <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
        {label}
      </AppText>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surfaceVariant,
            borderRadius: borderRadius.medium,
            borderColor: errors[field] ? colors.error : "transparent",
            borderWidth: errors[field] ? 1 : 0,
          },
        ]}
      >
        <Icon name={icon} size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.onSurface }]}
          value={formData[field] as string}
          onChangeText={(value) => updateField(field, value)}
          placeholder={options?.placeholder}
          placeholderTextColor={colors.outline}
          keyboardType={options?.keyboardType || "default"}
          editable={options?.editable !== false}
        />
      </View>
      {errors[field] && (
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {errors[field]}
        </AppText>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={[styles.avatarContainer, { backgroundColor: colors.surfaceVariant }]}
            onPress={handlePickAvatar}
            disabled={isUploading}
            activeOpacity={0.7}
          >
            {formData.avatarUrl ? (
              <Image source={{ uri: formData.avatarUrl }} style={styles.avatar} />
            ) : (
              <Icon name="account" size={60} color={colors.onSurfaceVariant} />
            )}
            {isUploading ? (
              <View style={[styles.avatarOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
                <ActivityIndicator color="#fff" />
                <AppText style={styles.uploadProgress}>{Math.round(progress)}%</AppText>
              </View>
            ) : (
              <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                <Icon name="camera" size={16} color={colors.onPrimary} />
              </View>
            )}
          </TouchableOpacity>
          <AppText style={[styles.avatarHint, { color: colors.onSurfaceVariant }]}>
            {t("editProfile.tapToChange", { defaultValue: "Tap to change photo" })}
          </AppText>
        </View>

        {/* Form Fields */}
        <AppCard padding="md" style={styles.formCard}>
          {renderInput("name", t("editProfile.fields.name", { defaultValue: "Full Name" }), "account", {
            placeholder: t("editProfile.placeholders.name", { defaultValue: "Enter your name" }),
          })}

          {renderInput("phone", t("editProfile.fields.phone", { defaultValue: "Phone Number" }), "phone", {
            placeholder: t("editProfile.placeholders.phone", { defaultValue: "Enter phone number" }),
            keyboardType: "phone-pad",
          })}

          {renderInput("className", t("editProfile.fields.class", { defaultValue: "Class" }), "school", {
            placeholder: t("editProfile.placeholders.class", { defaultValue: "Enter class" }),
          })}

          {renderInput("section", t("editProfile.fields.section", { defaultValue: "Section" }), "format-list-numbered", {
            placeholder: t("editProfile.placeholders.section", { defaultValue: "Enter section" }),
          })}
        </AppCard>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.medium,
              opacity: isSaving ? 0.7 : 1,
            },
          ]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <Icon name="content-save" size={20} color={colors.onPrimary} />
              <AppText style={[styles.saveButtonText, { color: colors.onPrimary }]}>
                {t("editProfile.save", { defaultValue: "Save Changes" })}
              </AppText>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatar: { width: 120, height: 120 },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadProgress: { color: "#fff", fontSize: 12, marginTop: 4 },
  editBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarHint: { fontSize: 13, marginTop: 8 },
  formCard: { marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: "500", marginBottom: 6, marginLeft: 4 },
  inputContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, paddingVertical: 14 },
  errorText: { fontSize: 12, marginTop: 4, marginLeft: 4 },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  saveButtonText: { fontSize: 16, fontWeight: "600" },
  bottomSpacer: { height: 32 },
});

export default EditProfileScreen;
