import { useOfflineQuery } from "../useOfflineQuery";

type Recommendation = { id: string; title: string; summary: string };

async function fetchRecommendations(userId?: string | null): Promise<Recommendation[]> {
  // Placeholder network call; replace with Supabase later
  await new Promise((resolve) => setTimeout(resolve, 120));
  return [
    { id: "rec1", title: "Try AI Tutor", summary: "Get step-by-step help on Algebra" },
    { id: "rec2", title: "Review Chemistry notes", summary: "Finish the Organic basics deck" },
  ];
}

export function useRecommendations(userId?: string | null) {
  return useOfflineQuery(["recommendations", userId], () => fetchRecommendations(userId));
}
