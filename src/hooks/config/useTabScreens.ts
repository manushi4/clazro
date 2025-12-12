import { useNavigationConfig } from "./useNavigationConfig";
import type { Role } from "../../types/permission.types";

export function useTabScreens(role: Role, tabId: string) {
  const nav = useNavigationConfig(role);
  return nav.screens.filter((screen) => screen.tabId === tabId);
}
