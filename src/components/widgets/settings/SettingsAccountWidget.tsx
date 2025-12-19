/**
 * Settings Account Widget (settings.account)
 * Shows account-related settings: password, language
 * Follows Widget Development Guide phases 1-7
 */
import React, { useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useBranding } from "../../../context/BrandingContext";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { AppText } from "../../../ui/components/AppText";
import { AppCard } from "../../../ui/components/AppCard";

const WIDGET_ID = "settings.account";
const STORAGE_KEYS = { LANGUAGE: "@settings/language" };

const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
];

type SettingsItemProps = {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, title, subtitle, onPress }) => {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: colors.outlineVariant }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.itemContent}>
        <AppText style={[styles.itemTitle, { color: colors.onSurface }]}>{title}</AppText>
        {subtitle && (
          <AppText style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>{subtitle}</AppText>
        )}
      </View>
      <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
    </TouchableOpacity>
  );
};

export const SettingsAccountWidget: React.FC<WidgetProps> = ({ config }) => {
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t, i18n } = useTranslation("settings");
  const { trackWidgetEvent } = useAnalytics();
  const navigation = useNavigation<any>();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  const showChangePassword = config?.showChangePassword !== false;
  const showLanguage = config?.showLanguage !== false;

  const handleChangePassword = useCallback(() => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "change_password" });
    Alert.alert(
      t("changePassword.title", { defaultValue: "Change Password" }),
      t("changePassword.message", {
        defaultValue: `To change your password:\n\n1. Contact support\n2. Email: ${branding.supportEmail || "support@app.com"}\n\n(Self-service coming soon)`,
      }),
      [{ text: t("common:actions.ok", { defaultValue: "OK" }) }]
    );
  }, [branding.supportEmail, t, trackWidgetEvent]);

  const handleLanguageSelect = useCallback(async (languageCode: string) => {
    if (languageCode === i18n.language || isChangingLanguage) return;
    setIsChangingLanguage(true);
    trackWidgetEvent(WIDGET_ID, "click", { action: "change_language", to: languageCode });
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, languageCode);
      setShowLanguageModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to change language. Please try again.");
    } finally {
      setIsChangingLanguage(false);
    }
  }, [i18n, isChangingLanguage, trackWidgetEvent]);

  const getCurrentLanguage = () => {
    const lang = LANGUAGES.find((l) => l.code === i18n.language);
    return lang?.nativeName || "English";
  };

  return (
    <View style={styles.container}>
      <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
        {t("sections.account", { defaultValue: "Account" })}
      </AppText>
      <AppCard padding="sm">
        {showChangePassword && (
          <SettingsItem
            icon="lock"
            title={t("changePassword.title", { defaultValue: "Change Password" })}
            subtitle={t("changePassword.subtitle", { defaultValue: "Update your password" })}
            onPress={handleChangePassword}
          />
        )}
        {showLanguage && (
          <SettingsItem
            icon="translate"
            title={t("language.title", { defaultValue: "Language" })}
            subtitle={getCurrentLanguage()}
            onPress={() => setShowLanguageModal(true)}
          />
        )}
      </AppCard>

      {/* Language Modal */}
      <Modal visible={showLanguageModal} transparent animationType="fade" onRequestClose={() => setShowLanguageModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLanguageModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
            <AppText style={[styles.modalTitle, { color: colors.onSurface }]}>
              {t("language.screenTitle", { defaultValue: "Select Language" })}
            </AppText>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.languageOption, { borderBottomColor: colors.outlineVariant }]}
                onPress={() => handleLanguageSelect(lang.code)}
              >
                <AppText style={styles.flag}>{lang.flag}</AppText>
                <View style={styles.languageText}>
                  <AppText style={[styles.languageName, { color: colors.onSurface }]}>{lang.nativeName}</AppText>
                  <AppText style={[styles.languageSubname, { color: colors.onSurfaceVariant }]}>{lang.name}</AppText>
                </View>
                {i18n.language === lang.code && <Icon name="check-circle" size={24} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setShowLanguageModal(false)}
            >
              <AppText style={{ color: colors.onSurface }}>{t("common:actions.cancel", { defaultValue: "Cancel" })}</AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginLeft: 4 },
  settingsItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  iconContainer: { width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 12 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: "500" },
  itemSubtitle: { fontSize: 13, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContent: { width: "100%", maxWidth: 340, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "600", textAlign: "center", marginBottom: 16 },
  languageOption: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  flag: { fontSize: 28, marginRight: 12 },
  languageText: { flex: 1 },
  languageName: { fontSize: 16, fontWeight: "600" },
  languageSubname: { fontSize: 13, marginTop: 2 },
  modalCloseBtn: { marginTop: 16, padding: 12, borderRadius: 8, alignItems: "center" },
});
