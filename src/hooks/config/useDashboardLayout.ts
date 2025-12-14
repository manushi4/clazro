import { DashboardService } from "../../services/config/dashboardService";
import { useConfigStore } from "../../stores/configStore";
import type { Role } from "../../types/permission.types";

export function useDashboardLayout(role: Role) {
  const config = useConfigStore((state) => state.config);
  if (!config) return null;
  return DashboardService.getDashboardConfig(config, role);
}
