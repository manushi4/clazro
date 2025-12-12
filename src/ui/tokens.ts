import { MD3Theme } from "react-native-paper";

export type DesignTokens = {
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
  radius: { sm: number; md: number; lg: number };
  typography: { heading: number; title: number; body: number; caption: number };
};

export function buildTokens(theme: MD3Theme): DesignTokens {
  return {
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
    radius: { sm: 6, md: 10, lg: 14 },
    typography: {
      heading: 24,
      title: 18,
      body: 14,
      caption: 12,
    },
  };
}
