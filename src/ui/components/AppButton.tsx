import React from "react";
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent, ViewStyle } from "react-native";
import { useAppTheme } from "../../theme/useAppTheme";
import { buildTokens } from "../tokens";

type Props = {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export const AppButton: React.FC<Props> = ({ label, onPress, disabled, style }) => {
  const { colors } = useAppTheme();
  const tokens = buildTokens({ colors } as any);
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: disabled ? colors.surfaceVariant : colors.primary,
          borderRadius: tokens.radius.md,
          opacity: disabled ? 0.7 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.label, { color: disabled ? colors.onSurface : colors.onPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "700",
    fontSize: 14,
  },
});
