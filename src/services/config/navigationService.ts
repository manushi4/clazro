import type { CustomerConfig, NavigationConfig } from "../../types/config.types";
import type { Role } from "../../types/permission.types";

export const NavigationService = {
  getNavigationConfig(config: CustomerConfig, role: Role): NavigationConfig {
    const tabs = config.navigation.tabs.filter((tab) => tab.role === role && tab.enabled);
    const screens = config.navigation.screens.filter(
      (screen) => screen.enabled && tabs.some((tab) => tab.tabId === screen.tabId)
    );
    return { tabs, screens };
  },
};
