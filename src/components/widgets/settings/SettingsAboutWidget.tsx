/**
 * Settings About Widget (settings.about)
 * Shows about section: help, privacy, terms, version
 * Follows Widget Development Guide phases 1-7
 */
import React, { useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useBranding } from "../../../context/BrandingContext";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { AppText } from "../../../ui/components/AppText";
import { AppCard } from "../../../ui/components/AppCard";

const WIDGET_ID = "settings.about";

type SettingsItemProps = {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
};

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, title, subtitle, onPress, showChevron = true }) => {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: colors.outlineVariant }]}
      onPress={onPress}
      disabled={!onPress}
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
      {showChevron && onPress && <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />}
    </TouchableOpacity>
  );
};

export const SettingsAboutWidget: React.FC<WidgetProps> = ({ config }) => {
  const { colors } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation("settings");
  const { trackWidgetEvent } = useAnalytics();

  const showHelp = config?.showHelp !== false;
  const showPrivacy = config?.showPrivacy !== false;
  const showTerms = config?.showTerms !== false;
  const showVersion = config?.showVersion !== false;

  const handleHelp = useCallback(() => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "help" });
    const url = branding.helpCenterUrl || "https://help.example.com";
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open help center");
    });
  }, [branding.helpCenterUrl, trackWidgetEvent]);

  const handlePrivacy = useCallback(() => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "privacy" });
    const url = branding.privacyUrl || "https://example.com/privacy";
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open privacy policy");
    });
  }, [branding.privacyUrl, trackWidgetEvent]);

  const handleTerms = useCallback(() => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "terms" });
    const url = branding.termsUrl || "https://example.com/terms";
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open terms of service");
    });
  }, [branding.termsUrl, trackWidgetEvent]);

  if (!showHelp && !showPrivacy && !showTerms && !showVersion) return null;

  return (
    <View style={styles.container}>
      <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
        {t("sections.about", { defaultValue: "About" })}
      </AppText>
      <AppCard padding="sm">
        {showHelp && (
          <SettingsItem
            icon="help-circle"
            title={t("help.title", { defaultValue: "Help & Support" })}
            subtitle={t("help.subtitle", { defaultValue: "Get help and contact support" })}
            onPress={handleHelp}
          />
        )}
        {showPrivacy && (
          <SettingsItem
            icon="shield-lock"
            title={t("privacy.title", { defaultValue: "Privacy Policy" })}
            subtitle={t("privacy.subtitle", { defaultValue: "Read our privacy policy" })}
            onPress={handlePrivacy}
          />
        )}
        {showTerms && (
          <SettingsItem
            icon="file-document"
            title={t("terms.title", { defaultValue: "Terms of Service" })}
            subtitle={t("terms.subtitle", { defaultValue: "Read our terms of service" })}
            onPress={handleTerms}
          />
        )}
        {showVersion && (
          <SettingsItem
            icon="information"
            title={t("version.title", { defaultValue: "App Version" })}
            subtitle="1.0.0 (Build 1)"
            showChevron={false}
          />
        )}
      </AppCard>
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
});
