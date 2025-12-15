/**
 * Query hook for Notes Summary widget (notes.summary)
 * Fetches student notes with count, recent notes, and pinned notes
 */
import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useNetworkStatus } from "../../offline/networkStore";
import { useDemoUser } from "../useDemoUser";

export type StudentNote = {
  id: string;
  title_en: string;
  title_hi?: string;
  content_preview?: string;
  subject_id?: string;
  subject_name_en?: string;
  subject_name_hi?: string;
  color: string;
  tags: string[];
  word_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type NotesSummaryData = {
  totalNotes: number;
  pinnedNotes: StudentNote[];
  recentNotes: StudentNote[];
  totalWords: number;
};

async function fetchNotesSummary(userId: string): Promise<NotesSummaryData> {
  const supabase = getSupabaseClient();

  // Fetch all notes for the user
  const { data: notes, error } = await supabase
    .from("student_notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch notes: ${error.message}`);
  }

  const allNotes = notes || [];
  const pinnedNotes = allNotes.filter((note) => note.is_pinned);
  const recentNotes = allNotes.slice(0, 5);
  const totalWords = allNotes.reduce((sum, note) => sum + (note.word_count || 0), 0);

  return {
    totalNotes: allNotes.length,
    pinnedNotes,
    recentNotes,
    totalWords,
  };
}

export function useNotesSummaryQuery() {
  const { userId } = useDemoUser();
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ["notes-summary", userId],
    queryFn: () => fetchNotesSummary(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: isOnline ? 2 : 0,
  });
}
