import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { useAppTheme } from "../../theme/useAppTheme";
import { buildTokens } from "../tokens";

type Props = ViewProps & {
  spacing?: "sm" | "md" | "lg";
};

export const ScreenSection: React.FC<Props> = ({ children, style, spacing = "md", ...rest }) => {
  const { colors } = useAppTheme();
  const tokens = buildTokens({ colors } as any);
  const gap = spacing === "sm" ? tokens.spacing.sm : spacing === "lg" ? tokens.spacing.lg : tokens.spacing.md;
  return (
    <View {...rest} style={[styles.section, { gap }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    width: "100%",
    alignSelf: "stretch",
  },
});
