import React from "react";
import { View, StyleSheet } from "react-native";
import { useEnabledTabs, useTabScreens } from "../hooks/config";
import { useAppTheme } from "../theme/useAppTheme";
import type { Role } from "../types/permission.types";
import { AppText } from "../ui/components/AppText";

type Props = {
  role: Role;
};

export const DynamicTabs: React.FC<Props> = ({ role }) => {
  const tabs = useEnabledTabs(role);
  const { colors } = useAppTheme();

  return (
    <View style={styles.container} accessibilityLabel="Dynamic Tabs">
      <AppText variant="title" style={[styles.heading, { color: colors.onSurface }]}>Tabs ({role})</AppText>
      {tabs.map((tab) => {
        const screens = useTabScreens(role, tab.tabId);
        return (
          <View
            key={tab.tabId}
            style={[
              styles.tabBlock,
              { borderColor: colors.outline, backgroundColor: colors.surface, },
            ]}
          >
            <AppText variant="title" style={[styles.tabTitle, { color: colors.onSurface }]}>
              {tab.label} ({tab.tabId})
            </AppText>
            <AppText style={[styles.meta, { color: colors.onSurfaceVariant }]}>
              Initial route: {tab.initialRoute}
            </AppText>
            <AppText style={[styles.meta, { color: colors.onSurfaceVariant }]}>
              Feature: {tab.featureId ?? "none"}
            </AppText>
            <AppText style={[styles.meta, { color: colors.onSurfaceVariant }]}>Screens:</AppText>
            {screens.map((screen) => (
              <AppText key={screen.screenId} style={[styles.screenItem, { color: colors.onSurface }]}>
                - {screen.screenId} ({screen.featureId ?? "none"})
              </AppText>
            ))}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
  },
  tabBlock: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tabTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  meta: {
    color: "#4b5563",
    fontSize: 13,
  },
  screenItem: {
    color: "#374151",
    fontSize: 13,
    marginLeft: 8,
  },
});
