import React from "react";
import { View, StyleSheet } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";

export const PeersGroupsWidget: React.FC<WidgetProps> = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("dashboard");
  return (
    <View style={styles.container}>
      <AppText variant="title" style={{ color: colors.onSurface }}>{t("widgets.peersGroups.title")}</AppText>
      <AppText style={{ color: colors.onSurfaceVariant }}>{t("widgets.peersGroups.subtitle")}</AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#4b5563",
  },
});
