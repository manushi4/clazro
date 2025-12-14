import React from "react";
import { View, StyleSheet } from "react-native";
import { useNetworkStatus } from "./networkStore";
import { useAppTheme } from "../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../ui/components/AppText";

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const { colors } = useAppTheme();
  const { t } = useTranslation("common");

  if (isOnline) return null;

  return (
    <View
      style={[styles.banner, { backgroundColor: colors.surfaceVariant }]}
      accessibilityRole="alert"
      accessible
      accessibilityLabel={t("status.offline", { defaultValue: "You are offline" })}
    >
      <AppText style={[styles.text, { color: colors.onSurfaceVariant }]}>
        {t("status.offline", { defaultValue: "You are offline" })}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    alignSelf: "stretch",
    padding: 8,
    borderRadius: 8,
  },
  text: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14,
  },
});
