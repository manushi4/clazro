import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useAppTheme } from "../../theme/useAppTheme";

export const AppDivider: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { colors } = useAppTheme();
  return <View style={[styles.divider, { backgroundColor: colors.outlineVariant }, style]} />;
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    width: "100%",
  },
});
