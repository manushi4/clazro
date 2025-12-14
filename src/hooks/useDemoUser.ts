import { useMemo } from "react";

// Placeholder hook until auth wiring is available.
// Reads environment overrides or falls back to seeded demo user.
export function useDemoUser() {
  const userId = process.env.DEMO_USER_ID || "96055c84-a9ee-496d-8360-6b7cea64b928";
  const customerSlug = process.env.DEMO_CUSTOMER_SLUG || "demo-school";
  const role = (process.env.DEMO_ROLE || "student") as "student" | "teacher" | "parent" | "admin";

  return useMemo(
    () => ({
      userId,
      customerSlug,
      role,
    }),
    [userId, customerSlug, role]
  );
}
