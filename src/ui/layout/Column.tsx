import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";

export const Column: React.FC<ViewProps> = ({ children, style, ...rest }) => (
  <View {...rest} style={[styles.col, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  col: {
    flexDirection: "column",
  },
});
