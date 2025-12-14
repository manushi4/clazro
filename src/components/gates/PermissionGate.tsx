import React from "react";
import { usePermissions } from "../../hooks/config/usePermissions";
import type { PermissionCode, Role } from "../../types/permission.types";

type PermissionGateProps = {
  role: Role;
  permission: PermissionCode;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export const PermissionGate: React.FC<PermissionGateProps> = ({
  role,
  permission,
  fallback = null,
  children,
}) => {
  const { has } = usePermissions(role);
  const allowed = has(permission);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
};
