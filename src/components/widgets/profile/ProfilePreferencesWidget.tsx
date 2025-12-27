import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Switch, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useUserProfileQuery, DEMO_USER_ID } from "../../../hooks/queries/useUserProfileQuery";
import { useUpdateSettings } from "../../../hooks/mutations/admin/useUpdateSettings";

type PreferenceItem = {
  id: string;
  icon: string;
  labelKey: string;
  type: "toggle" | "select" | "action";
  value?: boolean | string;
  options?: { value: string; label: string }[];
  onPress?: () => void;
};

export const ProfilePreferencesWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  userId,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t, i18n } = useTranslation(["profile", "settings"]);

  // Config options with defaults
  const showNotifications = config?.showNotifications !== false;
  const showAppearance = config?.showAppearance !== false;
  const showLanguage = config?.showLanguage !== false;
  const showPrivacy = config?.showPrivacy !== false;
  const compactMode = config?.compactMode === true;

  // Fetch user profile for current settings
  const { data: profile, isLoading, error } = useUserProfileQuery(userId || DEMO_USER_ID);
  const updateSettings = useUpdateSettings();

  // Local state for immediate UI feedback
  const [localSettings, setLocalSettings] = useState<Record<string, boolean | string>>({});

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          {t("profile:widgets.preferences.states.error", { defaultValue: "Failed to load preferences" })}
        </AppText>
      </View>
    );
  }

  // Get current value (local state takes precedence for immediate feedback)
  const getValue = (key: string, defaultValue: boolean | string) => {
    if (key in localSettings) return localSettings[key];
    if (profile && key in profile) return (profile as any)[key];
    return defaultValue;
  };

  // Handle toggle change
  const handleToggle = async (key: string, newValue: boolean) => {
    setLocalSettings((prev) => ({ ...prev, [key]: newValue }));

    try {
      await updateSettings.mutateAsync({
        userId: userId || DEMO_USER_ID,
        notification: key.startsWith("notifications_") ? { [key]: newValue } : undefined,
        appearance: key.startsWith("theme_") || key === "compact_mode" ? { [key]: newValue } : undefined,
        privacy: key.startsWith("profile_") || key.startsWith("allow_") ? { [key]: newValue } : undefined,
      });
    } catch (error) {
      // Revert on error
      setLocalSettings((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Handle language change
  const handleLanguageChange = () => {
    const newLang = i18n.language === "en" ? "hi" : "en";
    i18n.changeLanguage(newLang);
  };

  // Build preference items
  const preferenceItems: PreferenceItem[] = [];

  if (showNotifications) {
    preferenceItems.push({
      id: "notifications",
      icon: "bell-outline",
      labelKey: "profile:widgets.preferences.notifications",
      type: "toggle",
      value: getValue("notifications_enabled", true) as boolean,
    });
  }

  if (showAppearance) {
    preferenceItems.push({
      id: "dark_mode",
      icon: "weather-night",
      labelKey: "profile:widgets.preferences.darkMode",
      type: "toggle",
      value: getValue("theme_mode", "system") === "dark",
    });
  }

  if (showLanguage) {
    preferenceItems.push({
      id: "language",
      icon: "translate",
      labelKey: "profile:widgets.preferences.language",
      type: "action",
      value: i18n.language === "hi" ? "Hindi" : "English",
      onPress: handleLanguageChange,
    });
  }

  if (showPrivacy) {
    preferenceItems.push({
      id: "profile_visible",
      icon: "eye-outline",
      labelKey: "profile:widgets.preferences.profileVisible",
      type: "toggle",
      value: getValue("profile_visible", true) as boolean,
    });
  }

  // Render preference item
  const renderItem = (item: PreferenceItem, index: number) => {
    const isLast = index === preferenceItems.length - 1;

    return (
      <View
        key={item.id}
        style={[
          styles.item,
          !isLast && { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
          compactMode && styles.itemCompact,
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
          <Icon name={item.icon} size={20} color={colors.primary} />
        </View>

        <View style={styles.labelContainer}>
          <AppText style={[styles.label, { color: colors.onSurface }]}>
            {t(item.labelKey, { defaultValue: item.id })}
          </AppText>
          {item.type === "action" && item.value && (
            <AppText style={[styles.valueText, { color: colors.onSurfaceVariant }]}>
              {item.value}
            </AppText>
          )}
        </View>

        {item.type === "toggle" && (
          <Switch
            value={item.value as boolean}
            onValueChange={(newValue) => handleToggle(item.id, newValue)}
            trackColor={{ false: colors.surfaceVariant, true: `${colors.primary}80` }}
            thumbColor={item.value ? colors.primary : colors.onSurfaceVariant}
          />
        )}

        {item.type === "action" && (
          <TouchableOpacity
            onPress={item.onPress}
            style={[styles.actionButton, { backgroundColor: colors.surfaceVariant }]}
          >
            <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {preferenceItems.map((item, index) => renderItem(item, index))}

      {/* Settings link */}
      <TouchableOpacity
        style={[styles.allSettingsButton, { borderColor: colors.outlineVariant }]}
        onPress={() => onNavigate?.("system-settings")}
      >
        <Icon name="cog-outline" size={18} color={colors.primary} />
        <AppText style={[styles.allSettingsText, { color: colors.primary }]}>
          {t("profile:widgets.preferences.allSettings", { defaultValue: "All Settings" })}
        </AppText>
        <Icon name="chevron-right" size={18} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  itemCompact: {
    paddingVertical: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
  },
  valueText: {
    fontSize: 12,
    marginTop: 2,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  allSettingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  allSettingsText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ProfilePreferencesWidget;
