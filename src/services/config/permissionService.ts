import type { CustomerConfig } from "../../types/config.types";
import type { PermissionCode, PermissionSet, Role } from "../../types/permission.types";

export const PermissionService = {
  getPermissionSet(config: CustomerConfig, role: Role): PermissionSet | null {
    return config.permissions.find((entry) => entry.role === role) ?? null;
  },
  hasPermission(config: CustomerConfig, role: Role, permission: PermissionCode): boolean {
    const set = config.permissions.find((entry) => entry.role === role);
    return set ? set.permissions.includes(permission) : false;
  },
};
