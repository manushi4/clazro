/**
 * Settings Notifications Widget (settings.notifications)
 * Shows notification toggles: push, email
 * Follows Widget Development Guide phases 1-7
 */
import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { AppText } from "../../../ui/components/AppText";
import { AppCard } from "../../../ui/components/AppCard";

const WIDGET_ID = "settings.notifications";
const STORAGE_KEYS = {
  PUSH_NOTIFICATIONS: "@settings/push_notifications",
  EMAIL_ALERTS: "@settings/email_alerts",
};

type SettingsItemProps = {
  icon: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
};

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, title, subtitle, trailing }) => {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.settingsItem, { borderBottomColor: colors.outlineVariant }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.itemContent}>
        <AppText style={[styles.itemTitle, { color: colors.onSurface }]}>{title}</AppText>
        {subtitle && (
          <AppText style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>{subtitle}</AppText>
        )}
      </View>
      {trailing}
    </View>
  );
};

export const SettingsNotificationsWidget: React.FC<WidgetProps> = ({ config }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("settings");
  const { trackWidgetEvent } = useAnalytics();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const showPushNotifications = config?.showPushNotifications !== false;
  const showEmailAlerts = config?.showEmailAlerts !== false;

  useEffect(() => {
    loadSettings();
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
      console.error("Failed to load notification settings:", error);
    }
  };

  const saveSetting = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (error) {
      console.error("Failed to save setting:", error);
    }
  };

  const handlePushNotificationsChange = useCallback((value: boolean) => {
    setPushNotifications(value);
    saveSetting(STORAGE_KEYS.PUSH_NOTIFICATIONS, value);
    trackWidgetEvent(WIDGET_ID, "toggle", { setting: "push_notifications", enabled: value });
  }, [trackWidgetEvent]);

  const handleEmailAlertsChange = useCallback((value: boolean) => {
    setEmailAlerts(value);
    saveSetting(STORAGE_KEYS.EMAIL_ALERTS, value);
    trackWidgetEvent(WIDGET_ID, "toggle", { setting: "email_alerts", enabled: value });
  }, [trackWidgetEvent]);

  if (!showPushNotifications && !showEmailAlerts) return null;

  return (
    <View style={styles.container}>
      <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
        {t("sections.notifications", { defaultValue: "Notifications" })}
      </AppText>
      <AppCard padding="sm">
        {showPushNotifications && (
          <SettingsItem
            icon="bell"
            title={t("pushNotifications.title", { defaultValue: "Push Notifications" })}
            subtitle={t("pushNotifications.subtitle", { defaultValue: "Receive push notifications" })}
            trailing={
              <Switch
                value={pushNotifications}
                onValueChange={handlePushNotificationsChange}
                trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }}
                thumbColor={pushNotifications ? colors.primary : colors.outline}
              />
            }
          />
        )}
        {showEmailAlerts && (
          <SettingsItem
            icon="email"
            title={t("emailAlerts.title", { defaultValue: "Email Alerts" })}
            subtitle={t("emailAlerts.subtitle", { defaultValue: "Receive email notifications" })}
            trailing={
              <Switch
                value={emailAlerts}
                onValueChange={handleEmailAlertsChange}
                trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }}
                thumbColor={emailAlerts ? colors.primary : colors.outline}
              />
            }
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
