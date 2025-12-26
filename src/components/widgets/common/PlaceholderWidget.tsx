import React from "react";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { AppText } from "../../../ui/components/AppText";

interface PlaceholderWidgetProps extends WidgetProps {
  title?: string;
  icon?: string;
  message?: string;
}

export const PlaceholderWidget: React.FC<PlaceholderWidgetProps> = ({
  config,
}) => {
  const { colors, borderRadius } = useAppTheme();

  const title = (config?.title as string) || "Coming Soon";
  const icon = (config?.icon as string) || "rocket-launch-outline";
  const message = (config?.message as string) || "This feature is under development";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceVariant,
          borderRadius: borderRadius.large
        }
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
        <Icon name={icon} size={32} color={colors.primary} />
      </View>
      <AppText style={[styles.title, { color: colors.onSurface }]}>
        {title}
      </AppText>
      <AppText style={[styles.message, { color: colors.onSurfaceVariant }]}>
        {message}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  message: {
    fontSize: 13,
    textAlign: "center",
  },
});
