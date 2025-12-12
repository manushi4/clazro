export type Role = "student" | "teacher" | "parent" | "admin";

export type PermissionCode = string;

export type RolePermission = {
  role: Role;
  permissionCode: PermissionCode;
};

export type PermissionSet = {
  role: Role;
  permissions: PermissionCode[];
};

export type UserPermissionOverride = {
  permissionCode: PermissionCode;
  granted: boolean;
};
