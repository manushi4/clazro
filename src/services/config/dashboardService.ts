import type { CustomerConfig } from "../../types/config.types";
import type { Role } from "../../types/permission.types";
import type { DashboardConfig } from "../../types/widget.types";

export const DashboardService = {
  getDashboardConfig(config: CustomerConfig, role: Role): DashboardConfig | null {
    return config.dashboard.find((entry) => entry.role === role) ?? null;
  },
};
