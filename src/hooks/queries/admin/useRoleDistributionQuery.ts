/**
 * useRoleDistributionQuery - Query hook for role distribution data
 *
 * Fetches user counts grouped by role from the profiles table.
 * Used by RoleDistributionWidget to display role distribution chart.
 *
 * Phase 2: Query Hook (WIDGET_DEVELOPMENT_GUIDE.md)
 */

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export type RoleDistributionData = {
  role: string;
  count: number;
  percentage: number;
};

export type RoleDistributionStats = {
  distribution: RoleDistributionData[];
  totalUsers: number;
};

// Role configuration for display
const ROLE_CONFIG: Record<string, { color: string; icon: string; order: number }> = {
  student: { color: "#2196F3", icon: "school", order: 1 },
  teacher: { color: "#4CAF50", icon: "human-male-board", order: 2 },
  parent: { color: "#FF9800", icon: "account-child", order: 3 },
  admin: { color: "#9C27B0", icon: "shield-account", order: 4 },
};

// Fallback mock data for development/demo
const MOCK_DISTRIBUTION: RoleDistributionStats = {
  distribution: [
    { role: "student", count: 856, percentage: 68.7 },
    { role: "teacher", count: 124, percentage: 9.9 },
    { role: "parent", count: 245, percentage: 19.6 },
    { role: "admin", count: 22, percentage: 1.8 },
  ],
  totalUsers: 1247,
};

export function useRoleDistributionQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["admin", "role-distribution", customerId],
    queryFn: async (): Promise<RoleDistributionStats> => {
      const supabase = getSupabaseClient();

      // Fetch all profiles and group by role
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("customer_id", customerId);

      if (error) {
        console.error("[useRoleDistributionQuery] Error fetching profiles:", error);
        throw error;
      }

      // If no data, return mock data for demo purposes
      if (!data || data.length === 0) {
        if (__DEV__) {
          console.log("[useRoleDistributionQuery] No data found, using mock data");
        }
        return MOCK_DISTRIBUTION;
      }

      // Count users by role
      const roleCounts: Record<string, number> = {};
      data.forEach((profile) => {
        const role = profile.role || "unknown";
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });

      const totalUsers = data.length;

      // Convert to distribution array with percentages
      const distribution: RoleDistributionData[] = Object.entries(roleCounts)
        .map(([role, count]) => ({
          role,
          count,
          percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 1000) / 10 : 0,
        }))
        .sort((a, b) => {
          // Sort by predefined order, unknown roles at the end
          const orderA = ROLE_CONFIG[a.role]?.order ?? 99;
          const orderB = ROLE_CONFIG[b.role]?.order ?? 99;
          return orderA - orderB;
        });

      return {
        distribution,
        totalUsers,
      };
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}

// Export role config for use in widget
export { ROLE_CONFIG };
