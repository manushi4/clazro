import { PermissionService } from "../../services/config/permissionService";
import { useConfigStore } from "../../stores/configStore";
import type { PermissionCode, Role } from "../../types/permission.types";

export function usePermissions(role: Role) {
  const config = useConfigStore((state) => state.config);
  if (!config) return { permissions: [], has: () => false };

  const set = PermissionService.getPermissionSet(config, role);
  return {
    permissions: set?.permissions ?? [],
    has: (code: PermissionCode) => PermissionService.hasPermission(config, role, code),
  };
}
