import { useFeatureEnabled } from "./useFeatureEnabled";
import { usePermissions } from "./usePermissions";
import type { PermissionCode, Role } from "../../types/permission.types";

export function useCanAccessFeature(
  featureId: string,
  role: Role,
  requiredPermissions: PermissionCode[] = []
) {
  const featureEnabled = useFeatureEnabled(featureId);
  const { has } = usePermissions(role);

  const permissionsOk = requiredPermissions.every((code) => has(code));

  return featureEnabled && permissionsOk;
}
