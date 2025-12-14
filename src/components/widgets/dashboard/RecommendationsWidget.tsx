import React from "react";
import { View, StyleSheet } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { useRecommendations } from "../../../hooks/queries/useRecommendations";
import { AppText } from "../../../ui/components/AppText";

export const RecommendationsWidget: React.FC<WidgetProps> = ({ userId }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const { data, isLoading, error, isFetching } = useRecommendations(userId);
  return (
    <View style={styles.container}>
      <AppText variant="title" style={{ color: colors.onSurface }}>{t("widgets.recommendations.title")}</AppText>
      {isLoading || isFetching ? (
        <AppText style={{ color: colors.onSurfaceVariant }}>{t("widgets.recommendations.subtitle")}</AppText>
      ) : error ? (
        <AppText style={{ color: colors.error }}>
          {t("widgets.recommendations.error", { defaultValue: "Unable to load recommendations" })}
        </AppText>
      ) : (
        data?.map((item) => (
          <View key={item.id}>
            <AppText style={{ color: colors.onSurface }}>{item.title}</AppText>
            <AppText style={{ color: colors.onSurfaceVariant }}>{item.summary}</AppText>
          </View>
        ))
      )}
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
