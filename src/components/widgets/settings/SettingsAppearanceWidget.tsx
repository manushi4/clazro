/**
 * Settings Appearance Widget (settings.appearance)
 * Shows theme selection: system, light, dark
 * Follows Widget Development Guide phases 1-7
 */
import React, { useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useThemeStore } from "../../../stores/themeStore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { AppText } from "../../../ui/components/AppText";
import { AppCard } from "../../../ui/components/AppCard";
import type { ThemeMode } from "../../../types/config.types";

const WIDGET_ID = "settings.appearance";

const THEME_MODES: { mode: ThemeMode; icon: string; label: string }[] = [
  { mode: "system", icon: "theme-light-dark", label: "System" },
  { mode: "light", icon: "white-balance-sunny", label: "Light" },
  { mode: "dark", icon: "weather-night", label: "Dark" },
];

export const SettingsAppearanceWidget: React.FC<WidgetProps> = ({ config }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("settings");
  const { trackWidgetEvent } = useAnalytics();
  const { themeMode, setThemeMode } = useThemeStore();

  const [showThemeModal, setShowThemeModal] = useState(false);
  const showThemeSelector = config?.showThemeSelector !== false;

  const handleThemeSelect = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    trackWidgetEvent(WIDGET_ID, "click", { action: "change_theme", mode });
    setShowThemeModal(false);
  }, [setThemeMode, trackWidgetEvent]);

  const getThemeIcon = () => {
    return themeMode === "dark" ? "weather-night" : themeMode === "light" ? "white-balance-sunny" : "theme-light-dark";
  };

  const getThemeLabel = () => {
    return themeMode === "system" 
      ? t("theme.system", { defaultValue: "System" }) 
      : themeMode === "dark" 
        ? t("theme.dark", { defaultValue: "Dark" }) 
        : t("theme.light", { defaultValue: "Light" });
  };

  if (!showThemeSelector) return null;

  return (
    <View style={styles.container}>
      <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
        {t("sections.appearance", { defaultValue: "Appearance" })}
      </AppText>
      <AppCard padding="sm">
        <TouchableOpacity
          style={[styles.settingsItem, { borderBottomColor: colors.outlineVariant }]}
          onPress={() => setShowThemeModal(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.surfaceVariant }]}>
            <Icon name={getThemeIcon()} size={20} color={colors.primary} />
          </View>
          <View style={styles.itemContent}>
            <AppText style={[styles.itemTitle, { color: colors.onSurface }]}>
              {t("theme.title", { defaultValue: "Theme" })}
            </AppText>
            <AppText style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>
              {getThemeLabel()}
            </AppText>
          </View>
          <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </AppCard>

      {/* Theme Modal */}
      <Modal visible={showThemeModal} transparent animationType="fade" onRequestClose={() => setShowThemeModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowThemeModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
            <AppText style={[styles.modalTitle, { color: colors.onSurface }]}>
              {t("theme.title", { defaultValue: "Theme" })}
            </AppText>
            {THEME_MODES.map((item) => (
              <TouchableOpacity
                key={item.mode}
                style={[styles.themeOption, { borderBottomColor: colors.outlineVariant }]}
                onPress={() => handleThemeSelect(item.mode)}
              >
                <Icon name={item.icon} size={24} color={colors.primary} style={{ marginRight: 12 }} />
                <View style={styles.themeText}>
                  <AppText style={[styles.themeName, { color: colors.onSurface }]}>
                    {t(`theme.${item.mode}`, { defaultValue: item.label })}
                  </AppText>
                </View>
                {themeMode === item.mode && <Icon name="check-circle" size={24} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setShowThemeModal(false)}
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
  themeOption: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  themeText: { flex: 1 },
  themeName: { fontSize: 16, fontWeight: "600" },
  modalCloseBtn: { marginTop: 16, padding: 12, borderRadius: 8, alignItems: "center" },
});
