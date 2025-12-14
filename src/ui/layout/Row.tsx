import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";

export const Row: React.FC<ViewProps> = ({ children, style, ...rest }) => (
  <View {...rest} style={[styles.row, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
