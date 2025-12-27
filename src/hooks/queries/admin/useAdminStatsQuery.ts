/**
 * useAdminStatsQuery - Fetch admin dashboard quick stats
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabaseClient";

export interface AdminStats {
  totalUsers: number;
  userChange: number;
  revenue: number;
  revenueChange: number;
  activeClasses: number;
  pendingAlerts: number;
}

export const useAdminStatsQuery = (customerId: string) => {
  return useQuery({
    queryKey: ["admin-stats", customerId],
    queryFn: async (): Promise<AdminStats> => {
      // Fetch stats from multiple tables
      const [usersResult, classesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", customerId),
        supabase
          .from("classes")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", customerId)
          .eq("status", "active"),
      ]);

      // Demo data for now - replace with actual queries
      return {
        totalUsers: usersResult.count || 1250,
        userChange: 12,
        revenue: 485000,
        revenueChange: 8,
        activeClasses: classesResult.count || 24,
        pendingAlerts: 3,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
};

export default useAdminStatsQuery;
