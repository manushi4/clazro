import { PermissionCode, Role } from "./permission.types";

export type FeatureId = string;

export type FeatureDefinition = {
  id: FeatureId;
  name: string;
  description?: string;
  category?: string;
  roles: Role[];
  defaultEnabled: boolean;
  requiredPermissions?: PermissionCode[];
  primaryTab?: string;
  primaryScreens?: string[];
};

export type FeatureToggle = {
  featureId: FeatureId;
  enabled: boolean;
  version?: string;
  overridden?: boolean;
};
