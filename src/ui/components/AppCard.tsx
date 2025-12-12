import React from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { useAppTheme } from "../../theme/useAppTheme";
import { buildTokens } from "../tokens";

type Props = ViewProps & {
  padding?: "sm" | "md" | "lg";
};

export const AppCard: React.FC<Props> = ({ children, style, padding = "md", ...rest }) => {
  const { colors } = useAppTheme();
  const tokens = buildTokens({ colors } as any);
  const paddingValue = padding === "sm" ? tokens.spacing.sm : padding === "lg" ? tokens.spacing.lg : tokens.spacing.md;
  return (
    <View
      {...rest}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.outline,
          borderRadius: tokens.radius.md,
          padding: paddingValue,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
