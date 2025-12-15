/**
 * Query hook for AI Tools widget (ai.tools)
 * Fetches AI-powered learning tools from database
 */
import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useCustomerId } from "../config/useCustomerId";
import { useNetworkStatus } from "../../offline/networkStore";

export type AITool = {
  id: string;
  tool_key: string;
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  icon: string;
  color: string;
  route: string;
  enabled: boolean;
  position: number;
  requires_online: boolean;
  feature_id?: string;
};

async function fetchAITools(customerId: string): Promise<AITool[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("ai_tools")
    .select("*")
    .eq("customer_id", customerId)
    .eq("enabled", true)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch AI tools: ${error.message}`);
  }

  return data || [];
}

export function useAIToolsQuery() {
  const customerId = useCustomerId();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ["ai-tools", customerId],
    queryFn: () => fetchAITools(customerId!),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: isOnline ? 2 : 0,
  });
}
