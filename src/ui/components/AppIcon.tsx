import React from "react";
import { Text, TextStyle } from "react-native";

// Placeholder icon component using emoji/text; replace with real icon library when available.
type Props = {
  name: string;
  style?: TextStyle;
};

export const AppIcon: React.FC<Props> = ({ name, style }) => {
  return <Text style={[{ fontSize: 16 }, style]} accessibilityLabel={name}>{name}</Text>;
};
