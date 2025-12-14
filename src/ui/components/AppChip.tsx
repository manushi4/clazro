import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { useAppTheme } from "../../theme/useAppTheme";
import { buildTokens } from "../tokens";

type Props = {
  label: string;
  selected?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
};

export const AppChip: React.FC<Props> = ({ label, selected, style, onPress }) => {
  const { colors } = useAppTheme();
  const tokens = buildTokens({ colors } as any);
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          borderColor: selected ? colors.primary : colors.outline,
          backgroundColor: selected ? colors.primaryContainer : colors.surface,
          borderRadius: tokens.radius.sm,
        },
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.label, { color: selected ? colors.onPrimaryContainer : colors.onSurface }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});
