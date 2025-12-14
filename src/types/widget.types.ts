import React from "react";
import { FeatureId } from "./feature.types";
import { PermissionCode, Role } from "./permission.types";
import { CustomerBranding } from "./branding.types";

export type WidgetId = string;

export type WidgetDefaultConfig = Record<string, unknown>;

export type WidgetRuntimeConfig = Record<string, unknown>;

// Widget size variants
export type WidgetSize = "compact" | "standard" | "expanded";

export type WidgetProps = {
  customerId: string;
  userId: string;
  role: Role;
  config: WidgetRuntimeConfig;
  // Branding for white-label support
  branding?: CustomerBranding;
  // Theme for styling
  theme?: any;
  // Size variant
  size?: WidgetSize;
  // Navigation
  onNavigate: (route: string, params?: Record<string, unknown>) => void;
  onAction?: (event: Record<string, unknown>) => void;
};

export type WidgetComponent = React.FC<WidgetProps>;

export type WidgetDataPolicy = {
  maxQueries: number;
  staleTimeMs: number;
  prefetchOnDashboardLoad?: boolean;
  allowBackgroundRefresh?: boolean;
};

export type WidgetMetadata = {
  id: WidgetId;
  name?: string;
  titleKey?: string;
  description?: string;
  descriptionKey?: string;
  featureId: FeatureId;
  roles: Role[];
  // Size support
  supportedSizes?: WidgetSize[];
  defaultSize?: WidgetSize;
  minHeight?: "xs" | "sm" | "md" | "lg";
  requiresOnline?: boolean;
  // Failsafe flags
  deprecated?: boolean;
  replacementId?: WidgetId;
  version?: string;
  dataPolicy: WidgetDataPolicy;
  defaultConfig: WidgetDefaultConfig;
  requiredPermissions?: PermissionCode[];
};

export type WidgetLayoutItem = {
  widgetId: WidgetId;
  orderIndex: number;
  enabled: boolean;
  customProps?: WidgetRuntimeConfig;
};

export type DashboardConfig = {
  role: Role;
  layout: WidgetLayoutItem[];
};
