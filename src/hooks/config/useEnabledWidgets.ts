import { useDashboardLayout } from "./useDashboardLayout";
import type { Role } from "../../types/permission.types";

export function useEnabledWidgets(role: Role) {
  const layout = useDashboardLayout(role);
  return layout?.layout ?? [];
}
