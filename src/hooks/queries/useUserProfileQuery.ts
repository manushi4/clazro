import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient, DEMO_CUSTOMER_ID } from "../../lib/supabaseClient";

export type UserProfile = {
  id: string;
  user_id: string;
  customer_id: string;
  first_name: string;
  last_name?: string;
  display_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  class_name_en?: string;
  class_name_hi?: string;
  section?: string;
  roll_number?: string;
  school_name_en?: string;
  school_name_hi?: string;
  role: "student" | "teacher" | "parent" | "admin";
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  badges_count: number;
  language?: string;
  theme_mode?: "system" | "light" | "dark";
  is_active: boolean;
  last_active_at?: string;
  created_at: string;
  updated_at: string;
};

const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  return data as UserProfile;
};

export const useUserProfileQuery = (userId: string | null) => {
  return useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Demo user ID for development
export const DEMO_USER_ID = "demo-student-001";
