// Customer types
export type Customer = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "pending";
  subscription_tier: "free" | "basic" | "premium" | "enterprise";
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Role = "student" | "teacher" | "parent" | "admin";

export const ROLES: Role[] = ["student", "teacher", "parent", "admin"];

export const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  teacher: "Teacher",
  parent: "Parent",
  admin: "Admin",
};
