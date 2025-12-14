import React from "react";
import { TextInput, StyleSheet, TextInputProps, I18nManager } from "react-native";
import { useAppTheme } from "../../theme/useAppTheme";
import { buildTokens } from "../tokens";

export const AppInput: React.FC<TextInputProps> = ({ style, ...rest }) => {
  const { colors } = useAppTheme();
  const tokens = buildTokens({ colors } as any);
  return (
    <TextInput
      {...rest}
      style={[
        styles.input,
        {
          borderColor: colors.outline,
          color: colors.onSurface,
          borderRadius: tokens.radius.md,
        },
        style,
      ]}
      placeholderTextColor={colors.onSurfaceVariant}
      accessibilityRole="text"
      allowFontScaling
      textAlign={I18nManager.isRTL ? "right" : "left"}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
});
