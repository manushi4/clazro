import { useMemo } from "react";
import { useDemoRoleStore } from "../stores/demoRoleStore";

// Placeholder hook until auth wiring is available.
// Uses persisted role from store for dev switching.
export function useDemoUser() {
  const { role, userId } = useDemoRoleStore();
  const customerSlug = process.env.DEMO_CUSTOMER_SLUG || "demo-school";

  return useMemo(
    () => ({
      userId,
      customerSlug,
      role,
    }),
    [userId, customerSlug, role]
  );
}
