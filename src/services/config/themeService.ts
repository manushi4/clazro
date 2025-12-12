import type { CustomerConfig } from "../../types/config.types";
import type { ThemeConfig } from "../../types/config.types";

export const ThemeService = {
  getTheme(config: CustomerConfig): ThemeConfig {
    return config.theme;
  },
};
