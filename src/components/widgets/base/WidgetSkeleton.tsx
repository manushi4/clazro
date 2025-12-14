import React from "react";
import { View, StyleSheet } from "react-native";

export const WidgetSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={[styles.line, { width: "60%" }]} />
      <View style={[styles.line, { width: "80%" }]} />
      <View style={[styles.line, { width: "70%" }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    gap: 6,
  },
  line: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
  },
});
