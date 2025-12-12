/**
 * Settings Screen - Dynamic (Medium Customization)
 * 
 * Sections can be shown/hidden via Platform Studio config.
 * Uses theme, branding, and i18n throughout.
 * Works offline with cached settings.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAppTheme } from "../../theme/useAppTheme";
import { useBranding } from "../../context/BrandingContext";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useNetworkStatus } from "../../offline/networkStore";
import { useThemeStore } from "../../stores/themeStore";
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { OfflineBanner } from "../../offline/OfflineBanner";

// Storage keys
const STORAGE_KEYS = {
  PUSH_NOTIFICATIONS: "@settings/push_notifications",
  EMAIL_ALERTS: "@settings/email_alerts",
  LANGUAGE: "@settings/language",
};

// Languages
const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
];

// Settings config type (from Platform Studio)
type SettingsConfig = {
  showLanguage: boolean;
  showDarkMode: boolean;
  showNotificationToggles: boolean;
  showHelp: boolean;
  showChangePassword: boolean;
  showPrivacyPolicy: boolean;
  showTermsOfService: boolean;
};

const DEFAULT_CONFIG: SettingsConfig = {
  showLanguage: true,
  showDarkMode: true,
  showNotificationToggles: true,
  showHelp: true,
  showChangePassword: true,
  showPrivacyPolicy: true,
  showTermsOfService: true,
};


type SettingsItemProps = {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
};

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  trailing,
  showChevron = true,
  destructive = false,
}) => {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: colors.outlineVariant }]}
      onPress={onPress}
      disabled={!onPress && !trailing}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name={icon} size={20} color={iconColor || colors.primary} />
      </View>
      <View style={styles.itemContent}>
        <AppText
          style={[styles.itemTitle, { color: destructive ? colors.error : colors.onSurface }]}
        >
          {title}
        </AppText>
        {subtitle && (
          <AppText style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>
            {subtitle}
          </AppText>
        )}
      </View>
      {trailing}
      {showChevron && onPress && !trailing && (
        <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
      )}
    </TouchableOpacity>
  );
};

// Theme modes
import type { ThemeMode } from "../../types/config.types";

const THEME_MODES: { mode: ThemeMode; icon: string; label: string }[] = [
  { mode: "system", icon: "theme-light-dark", label: "System" },
  { mode: "light", icon: "white-balance-sunny", label: "Light" },
  { mode: "dark", icon: "weather-night", label: "Dark" },
];

// Theme Selection Modal
const ThemeModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  currentMode: ThemeMode;
  onSelect: (mode: ThemeMode) => void;
}> = ({ visible, onClose, currentMode, onSelect }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("settings");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
          <AppText style={[styles.modalTitle, { color: colors.onSurface }]}>
            {t("theme.title", { defaultValue: "Theme" })}
          </AppText>

          {THEME_MODES.map((item) => (
            <TouchableOpacity
              key={item.mode}
              style={[styles.languageOption, { borderBottomColor: colors.outlineVariant }]}
              onPress={() => onSelect(item.mode)}
            >
              <Icon name={item.icon} size={24} color={colors.primary} style={{ marginRight: 12 }} />
              <View style={styles.languageText}>
                <AppText style={[styles.languageName, { color: colors.onSurface }]}>
                  {t(`theme.${item.mode}`, { defaultValue: item.label })}
                </AppText>
              </View>
              {currentMode === item.mode && (
                <Icon name="check-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceVariant }]} onPress={onClose}>
            <AppText style={{ color: colors.onSurface }}>{t("common:actions.cancel", { defaultValue: "Cancel" })}</AppText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Language Selection Modal
const LanguageModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSelect: (code: string) => void;
}> = ({ visible, onClose, currentLanguage, onSelect }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("settings");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <AppText style={[styles.modalTitle, { color: colors.onSurface }]}>
            {t("language.screenTitle", { defaultValue: "Select Language" })}
          </AppText>

          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.languageOption, { borderBottomColor: colors.outlineVariant }]}
              onPress={() => onSelect(lang.code)}
            >
              <AppText style={styles.flag}>{lang.flag}</AppText>
              <View style={styles.languageText}>
                <AppText style={[styles.languageName, { color: colors.onSurface }]}>
                  {lang.nativeName}
                </AppText>
                <AppText style={[styles.languageSubname, { color: colors.onSurfaceVariant }]}>
                  {lang.name}
                </AppText>
              </View>
              {currentLanguage === lang.code && (
                <Icon name="check-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceVariant }]}
            onPress={onClose}
          >
            <AppText style={{ color: colors.onSurface }}>
              {t("common:actions.cancel", { defaultValue: "Cancel" })}
            </AppText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};


export const SettingsScreen: React.FC = () => {
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t, i18n } = useTranslation("settings");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const { themeMode, setThemeMode, loadPersistedTheme } = useThemeStore();

  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  // Config (would come from Platform Studio in production)
  const [config] = useState<SettingsConfig>(DEFAULT_CONFIG);

  // Load saved settings
  useEffect(() => {
    trackScreenView("settings");
    loadSettings();
    loadPersistedTheme();
  }, []);

  const loadSettings = async () => {
    try {
      const [push, email] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PUSH_NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.EMAIL_ALERTS),
      ]);
      if (push !== null) setPushNotifications(push === "true");
      if (email !== null) setEmailAlerts(email === "true");
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSetting = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (error) {
      console.error("Failed to save setting:", error);
    }
  };

  // Handlers
  const handlePushNotificationsChange = useCallback((value: boolean) => {
    setPushNotifications(value);
    saveSetting(STORAGE_KEYS.PUSH_NOTIFICATIONS, value);
    trackEvent("toggle_push_notifications", { enabled: value });
  }, [trackEvent]);

  const handleEmailAlertsChange = useCallback((value: boolean) => {
    setEmailAlerts(value);
    saveSetting(STORAGE_KEYS.EMAIL_ALERTS, value);
    trackEvent("toggle_email_alerts", { enabled: value });
  }, [trackEvent]);

  const [showThemeModal, setShowThemeModal] = useState(false);

  const handleLanguageSelect = useCallback(async (languageCode: string) => {
    if (languageCode === i18n.language || isChangingLanguage) return;
    
    setIsChangingLanguage(true);
    trackEvent("language_changed", { from: i18n.language, to: languageCode });

    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, languageCode);
      setShowLanguageModal(false);
    } catch (error) {
      console.error("Failed to change language:", error);
      Alert.alert("Error", "Failed to change language. Please try again.");
    } finally {
      setIsChangingLanguage(false);
    }
  }, [i18n, isChangingLanguage, trackEvent]);

  const handleChangePassword = useCallback(() => {
    trackEvent("change_password_pressed");
    Alert.alert(
      t("changePassword.title", { defaultValue: "Change Password" }),
      t("changePassword.message", {
        defaultValue: `To change your password:\n\n1. Contact support\n2. Email: ${branding.supportEmail || "support@app.com"}\n\n(Self-service coming soon)`,
      }),
      [{ text: t("common:actions.ok", { defaultValue: "OK" }) }]
    );
  }, [branding.supportEmail, t, trackEvent]);

  const handleHelp = useCallback(() => {
    trackEvent("navigate_to_help");
    const url = branding.helpCenterUrl || "https://help.example.com";
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open help center");
    });
  }, [branding.helpCenterUrl, trackEvent]);

  const handlePrivacy = useCallback(() => {
    trackEvent("navigate_to_privacy");
    const url = branding.privacyUrl || "https://example.com/privacy";
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open privacy policy");
    });
  }, [branding.privacyUrl, trackEvent]);

  const handleTerms = useCallback(() => {
    trackEvent("navigate_to_terms");
    const url = branding.termsUrl || "https://example.com/terms";
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open terms of service");
    });
  }, [branding.termsUrl, trackEvent]);

  const handleLogout = useCallback(() => {
    trackEvent("logout_pressed");
    Alert.alert(
      t("logout.title", { defaultValue: "Logout" }),
      t("logout.message", { defaultValue: "Are you sure you want to logout?" }),
      [
        { text: t("common:actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
        {
          text: t("logout.confirm", { defaultValue: "Logout" }),
          style: "destructive",
          onPress: () => {
            trackEvent("logout_confirmed");
            Alert.alert("Logged out", "You have been logged out.");
          },
        },
      ]
    );
  }, [t, trackEvent]);

  const getCurrentLanguage = () => {
    const lang = LANGUAGES.find((l) => l.code === i18n.language);
    return lang?.nativeName || "English";
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
            {t("sections.account", { defaultValue: "Account" })}
          </AppText>
          <AppCard padding="sm">
            {config.showChangePassword && (
              <SettingsItem
                icon="lock"
                title={t("changePassword.title", { defaultValue: "Change Password" })}
                subtitle={t("changePassword.subtitle", { defaultValue: "Update your password" })}
                onPress={handleChangePassword}
              />
            )}
            {config.showLanguage && (
              <SettingsItem
                icon="translate"
                title={t("language.title", { defaultValue: "Language" })}
                subtitle={getCurrentLanguage()}
                onPress={() => setShowLanguageModal(true)}
              />
            )}
          </AppCard>
        </View>

        {/* Notifications Section */}
        {config.showNotificationToggles && (
          <View style={styles.section}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
              {t("sections.notifications", { defaultValue: "Notifications" })}
            </AppText>
            <AppCard padding="sm">
              <SettingsItem
                icon="bell"
                title={t("pushNotifications.title", { defaultValue: "Push Notifications" })}
                subtitle={t("pushNotifications.subtitle", { defaultValue: "Receive push notifications" })}
                showChevron={false}
                trailing={
                  <Switch
                    value={pushNotifications}
                    onValueChange={handlePushNotificationsChange}
                    trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }}
                    thumbColor={pushNotifications ? colors.primary : colors.outline}
                  />
                }
              />
              <SettingsItem
                icon="email"
                title={t("emailAlerts.title", { defaultValue: "Email Alerts" })}
                subtitle={t("emailAlerts.subtitle", { defaultValue: "Receive email notifications" })}
                showChevron={false}
                trailing={
                  <Switch
                    value={emailAlerts}
                    onValueChange={handleEmailAlertsChange}
                    trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }}
                    thumbColor={emailAlerts ? colors.primary : colors.outline}
                  />
                }
              />
            </AppCard>
          </View>
        )}

        {/* Appearance Section */}
        {config.showDarkMode && (
          <View style={styles.section}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
              {t("sections.appearance", { defaultValue: "Appearance" })}
            </AppText>
            <AppCard padding="sm">
              <SettingsItem
                icon={themeMode === "dark" ? "weather-night" : themeMode === "light" ? "white-balance-sunny" : "theme-light-dark"}
                title={t("theme.title", { defaultValue: "Theme" })}
                subtitle={themeMode === "system" ? t("theme.system", { defaultValue: "System" }) : themeMode === "dark" ? t("theme.dark", { defaultValue: "Dark" }) : t("theme.light", { defaultValue: "Light" })}
                onPress={() => setShowThemeModal(true)}
              />
            </AppCard>
          </View>
        )}

        {/* About Section */}
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
            {t("sections.about", { defaultValue: "About" })}
          </AppText>
          <AppCard padding="sm">
            {config.showHelp && (
              <SettingsItem
                icon="help-circle"
                title={t("help.title", { defaultValue: "Help & Support" })}
                subtitle={t("help.subtitle", { defaultValue: "Get help and contact support" })}
                onPress={handleHelp}
              />
            )}
            {config.showPrivacyPolicy && (
              <SettingsItem
                icon="shield-lock"
                title={t("privacy.title", { defaultValue: "Privacy Policy" })}
                subtitle={t("privacy.subtitle", { defaultValue: "Read our privacy policy" })}
                onPress={handlePrivacy}
              />
            )}
            {config.showTermsOfService && (
              <SettingsItem
                icon="file-document"
                title={t("terms.title", { defaultValue: "Terms of Service" })}
                subtitle={t("terms.subtitle", { defaultValue: "Read our terms of service" })}
                onPress={handleTerms}
              />
            )}
            <SettingsItem
              icon="information"
              title={t("version.title", { defaultValue: "App Version" })}
              subtitle="1.0.0 (Build 1)"
              showChevron={false}
            />
          </AppCard>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.errorContainer, borderRadius: borderRadius.medium }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Icon name="logout" size={20} color={colors.error} />
            <AppText style={[styles.logoutText, { color: colors.error }]}>
              {t("logout.button", { defaultValue: "Logout" })}
            </AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Language Selection Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        currentLanguage={i18n.language}
        onSelect={handleLanguageSelect}
      />

      {/* Theme Selection Modal */}
      <ThemeModal
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        currentMode={themeMode}
        onSelect={(mode) => {
          setThemeMode(mode);
          trackEvent("theme_changed", { mode });
          setShowThemeModal(false);
        }}
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: "500" },
  itemSubtitle: { fontSize: 13, marginTop: 2 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "600" },
  bottomSpacer: { height: 32 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flag: { fontSize: 28, marginRight: 12 },
  languageText: { flex: 1 },
  languageName: { fontSize: 16, fontWeight: "600" },
  languageSubname: { fontSize: 13, marginTop: 2 },
  modalCloseBtn: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});

export default SettingsScreen;
