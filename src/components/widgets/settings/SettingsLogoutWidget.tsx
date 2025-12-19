/**
 * Settings Logout Widget (settings.logout)
 * Shows logout button with confirmation
 * Follows Widget Development Guide phases 1-7
 */
import React, { useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { AppText } from "../../../ui/components/AppText";

const WIDGET_ID = "settings.logout";

export const SettingsLogoutWidget: React.FC<WidgetProps> = ({ config }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("settings");
  const { trackWidgetEvent } = useAnalytics();

  const handleLogout = useCallback(() => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "logout_pressed" });
    Alert.alert(
      t("logout.title", { defaultValue: "Logout" }),
      t("logout.message", { defaultValue: "Are you sure you want to logout?" }),
      [
        { text: t("common:actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
        {
          text: t("logout.confirm", { defaultValue: "Logout" }),
          style: "destructive",
          onPress: () => {
            trackWidgetEvent(WIDGET_ID, "click", { action: "logout_confirmed" });
            // TODO: Implement actual logout logic
            Alert.alert("Logged out", "You have been logged out.");
          },
        },
      ]
    );
  }, [t, trackWidgetEvent]);

  return (
    <View style={styles.container}>
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
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "600" },
});
