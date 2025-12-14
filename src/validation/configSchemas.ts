import { z } from "zod";
import type { CustomerConfig } from "../types/config.types";

const roleEnum = z.enum(["student", "teacher", "parent", "admin"]);

const permissionCodeSchema = z.string().min(1, "permission code is required");

export const featureToggleSchema = z.object({
  featureId: z.string().min(1, "featureId is required"),
  enabled: z.boolean(),
  overridden: z.boolean().optional(),
});

export const navigationTabSchema = z.object({
  tabId: z.string().min(1, "tabId is required"),
  role: roleEnum,
  label: z.string().min(1, "label is required"),
  icon: z.string().optional(),
  initialRoute: z.string().min(1, "initialRoute is required"),
  orderIndex: z.number().int().nonnegative(),
  enabled: z.boolean(),
  featureId: z.string().nullish(), // Accept null or undefined from DB
  requiredPermissions: z.array(permissionCodeSchema).optional(),
});

export const navigationScreenSchema = z.object({
  screenId: z.string().min(1, "screenId is required"),
  tabId: z.string().min(1, "tabId is required"),
  orderIndex: z.number().int().nonnegative(),
  enabled: z.boolean(),
  featureId: z.string().nullish(), // Accept null or undefined from DB
  requiredPermissions: z.array(permissionCodeSchema).optional(),
});

export const navigationConfigSchema = z.object({
  tabs: z.array(navigationTabSchema),
  screens: z.array(navigationScreenSchema),
});

export const widgetLayoutItemSchema = z.object({
  widgetId: z.string().min(1, "widgetId is required"),
  orderIndex: z.number().int().nonnegative(),
  enabled: z.boolean(),
  customProps: z.record(z.unknown()).optional(),
});

export const dashboardConfigSchema = z.object({
  role: roleEnum,
  layout: z.array(widgetLayoutItemSchema),
});

export const themeConfigSchema = z.object({
  primaryColor: z.string().min(1, "primaryColor is required"),
  secondaryColor: z.string().min(1, "secondaryColor is required"),
  surfaceColor: z.string().min(1, "surfaceColor is required"),
  logoUrl: z.string().url().optional(),
  roundness: z.number().int().nonnegative().max(32).optional(),
  status: z.enum(["active", "draft"]).optional(),
});

export const permissionSetSchema = z.object({
  role: roleEnum,
  permissions: z.array(permissionCodeSchema),
});

export const customerSchema = z.object({
  id: z.string().min(1, "id is required"),
  name: z.string().min(1, "name is required"),
  slug: z.string().min(1, "slug is required"),
  status: z.enum(["active", "suspended", "pending"]).optional(),
});

export const brandingSchema = z.object({
  appName: z.string().min(1, "appName is required"),
  appTagline: z.string().optional(),
  logoUrl: z.string().optional(),
  logoSmallUrl: z.string().optional(),
  logoDarkUrl: z.string().optional(),
  splashImageUrl: z.string().optional(),
  loginHeroUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  aiTutorName: z.string().min(1, "aiTutorName is required"),
  doubtSectionName: z.string().min(1, "doubtSectionName is required"),
  assignmentName: z.string().min(1, "assignmentName is required"),
  testName: z.string().min(1, "testName is required"),
  liveClassName: z.string().min(1, "liveClassName is required"),
  supportEmail: z.string().optional(),
  supportPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  helpCenterUrl: z.string().optional(),
  termsUrl: z.string().optional(),
  privacyUrl: z.string().optional(),
  refundUrl: z.string().optional(),
  textOverrides: z.record(z.string()).default({}),
});

export const customerConfigSchema = z.object({
  customer: customerSchema,
  features: z.array(featureToggleSchema),
  navigation: navigationConfigSchema,
  dashboard: z.array(dashboardConfigSchema),
  theme: themeConfigSchema,
  branding: brandingSchema,
  permissions: z.array(permissionSetSchema),
  version: z.number().int().optional(),
  updatedAt: z.string().optional(),
});

export type CustomerConfigInput = z.infer<typeof customerConfigSchema>;

export function validateCustomerConfig(input: unknown): CustomerConfig {
  return customerConfigSchema.parse(input);
}
