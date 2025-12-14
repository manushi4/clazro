import { useOfflineQuery } from "../useOfflineQuery";

export type ClassFeedItem = {
  id: string;
  title: string;
  summary: string;
};

async function fetchClassFeed(): Promise<ClassFeedItem[]> {
  // Placeholder network call; replace with Supabase later
  await new Promise((resolve) => setTimeout(resolve, 120));
  return [
    { id: "1", title: "Exam schedule updated", summary: "Mid-term dates posted" },
    { id: "2", title: "New assignment", summary: "Chemistry lab due Friday" },
    { id: "3", title: "PTM reminder", summary: "Parent-teacher meeting next week" },
  ];
}

export function useClassFeed(customerId?: string | null) {
  return useOfflineQuery(["classFeed", customerId], fetchClassFeed);
}
