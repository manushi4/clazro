import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

type QuickLink = {
  id: string;
  icon: string;
  labelKey: string;
  route: string;
  color?: string;
  showChevron?: boolean;
};

const DEFAULT_LINKS: QuickLink[] = [
  { id: "edit-profile", icon: "account-edit", labelKey: "editProfile", route: "edit-profile", showChevron: true },
  { id: "settings", icon: "cog", labelKey: "settings", route: "settings", showChevron: true },
  { id: "help", icon: "help-circle", labelKey: "help", route: "help-feedback", showChevron: true },
  { id: "logout", icon: "logout", labelKey: "logout", route: "logout", color: "error", showChevron: false },
];

export const ProfileQuickLinksWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("profile");

  // Debug: Log config to verify it's being received
  if (__DEV__) {
    console.log("[ProfileQuickLinks] config:", JSON.stringify(config));
  }

  // Config options with defaults
  const showEditProfile = config?.showEditProfile !== false;
  const showSettings = config?.showSettings !== false;
  const showHelp = config?.showHelp !== false;
  const showLogout = config?.showLogout !== false;
  const layoutStyle = (config?.layoutStyle as "list" | "grid") || "list";
  const showIcons = config?.showIcons !== false;
  const showDividers = config?.showDividers !== false;

  // Filter links based on config
  const visibleLinks = DEFAULT_LINKS.filter((link) => {
    switch (link.id) {
      case "edit-profile": return showEditProfile;
      case "settings": return showSettings;
      case "help": return showHelp;
      case "logout": return showLogout;
      default: return true;
    }
  });

  const handlePress = (link: QuickLink) => {
    if (link.id === "logout") {
      // TODO: Handle logout action
      console.log("Logout pressed");
      return;
    }
    onNavigate?.(link.route);
  };

  const getIconColor = (link: QuickLink) => {
    if (link.color === "error") return colors.error;
    return colors.onSurfaceVariant;
  };

  const getTextColor = (link: QuickLink) => {
    if (link.color === "error") return colors.error;
    return colors.onSurface;
  };

  // Grid layout
  if (layoutStyle === "grid") {
    return (
      <View style={styles.gridContainer}>
        {visibleLinks.map((link) => (
          <TouchableOpacity
            key={link.id}
            style={[
              styles.gridItem,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: borderRadius.medium,
              },
            ]}
            onPress={() => handlePress(link)}
            activeOpacity={0.7}
          >
            {showIcons && (
              <View
                style={[
                  styles.gridIconContainer,
                  { backgroundColor: getIconColor(link) + "15" },
                ]}
              >
                <Icon name={link.icon} size={22} color={getIconColor(link)} />
              </View>
            )}
            <AppText
              style={[styles.gridLabel, { color: getTextColor(link) }]}
              numberOfLines={1}
            >
              {t(`widgets.quickLinks.links.${link.labelKey}`)}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // List layout (default)
  return (
    <View
      style={[
        styles.listContainer,
        {
          backgroundColor: colors.surfaceVariant,
          borderRadius: borderRadius.medium,
        },
      ]}
    >
      {visibleLinks.map((link, index) => (
        <React.Fragment key={link.id}>
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => handlePress(link)}
            activeOpacity={0.7}
          >
            {showIcons && (
              <View
                style={[
                  styles.listIconContainer,
                  { backgroundColor: getIconColor(link) + "15" },
                ]}
              >
                <Icon name={link.icon} size={20} color={getIconColor(link)} />
              </View>
            )}
            <AppText
              style={[styles.listLabel, { color: getTextColor(link) }]}
            >
              {t(`widgets.quickLinks.links.${link.labelKey}`)}
            </AppText>
            {link.showChevron && (
              <Icon
                name="chevron-right"
                size={20}
                color={colors.onSurfaceVariant}
              />
            )}
          </TouchableOpacity>
          {showDividers && index < visibleLinks.length - 1 && (
            <View
              style={[styles.divider, { backgroundColor: colors.outlineVariant }]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // List layout
  listContainer: {
    overflow: "hidden",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  listIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  listLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginLeft: 64,
  },
  // Grid layout
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridItem: {
    width: "31%",
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 8,
  },
  gridIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default ProfileQuickLinksWidget;
