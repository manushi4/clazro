import { NavigationService } from "../../services/config/navigationService";
import { useConfigStore } from "../../stores/configStore";
import type { Role } from "../../types/permission.types";

export function useNavigationConfig(role: Role) {
  const config = useConfigStore((state) => state.config);
  if (!config) return { tabs: [], screens: [] };
  return NavigationService.getNavigationConfig(config, role);
}
