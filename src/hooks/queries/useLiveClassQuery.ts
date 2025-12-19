import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useNetworkStatus } from "../../offline/networkStore";
import { useCustomerId } from "../config/useCustomerId";

export type LiveClass = {
  id: string;
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  start_time: string;
  end_time: string;
  meeting_url?: string;
  is_live: boolean;
  teacher_name?: string;
  participants_count?: number;
  subject?: {
    id: string;
    title_en: string;
    title_hi?: string;
    color?: string;
    icon?: string;
  };
};

// Fallback mock data when database is empty - using mock- prefix to identify mock items
const FALLBACK_LIVE_CLASSES: LiveClass[] = [
  {
    id: "mock-live-1",
    title_en: "Live: Mathematics Doubt Session",
    description_en: "Interactive live session for clearing doubts on algebra and calculus",
    start_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 mins from now
    end_time: new Date(Date.now() + 90 * 60 * 1000).toISOString(), // 1.5 hours from now
    meeting_url: "https://meet.example.com/math-doubts",
    is_live: false,
    teacher_name: "Dr. Sharma",
    participants_count: 15,
    subject: { id: "mock-sub-1", title_en: "Mathematics", color: "#4CAF50", icon: "calculator" },
  },
  {
    id: "mock-live-2",
    title_en: "Live: Physics Lab Demo",
    description_en: "Watch live physics experiments and ask questions",
    start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    meeting_url: "https://meet.example.com/physics-lab",
    is_live: false,
    teacher_name: "Prof. Verma",
    participants_count: 22,
    subject: { id: "mock-sub-2", title_en: "Physics", color: "#2196F3", icon: "atom" },
  },
  {
    id: "mock-live-3",
    title_en: "Live: English Speaking Practice",
    description_en: "Practice conversational English with interactive exercises",
    start_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
    end_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
    meeting_url: "https://meet.example.com/english-speaking",
    is_live: false,
    teacher_name: "Ms. Johnson",
    participants_count: 18,
    subject: { id: "mock-sub-3", title_en: "English", color: "#EC4899", icon: "book" },
  },
  {
    id: "mock-live-4",
    title_en: "Live: Chemistry - Organic Compounds",
    description_en: "Deep dive into organic chemistry with molecular structures",
    start_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
    end_time: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(), // 7 hours from now
    meeting_url: "https://meet.example.com/chemistry-organic",
    is_live: false,
    teacher_name: "Dr. Patel",
    participants_count: 25,
    subject: { id: "mock-sub-4", title_en: "Chemistry", color: "#10B981", icon: "flask" },
  },
];

async function fetchLiveClasses(customerId: string): Promise<LiveClass[]> {
  // Get current time and next 24 hours
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("classes")
    .select(`
      id,
      title_en,
      title_hi,
      description_en,
      description_hi,
      start_time,
      end_time,
      meeting_url,
      is_live,
      class_type,
      subject:subjects(id, title_en, title_hi, color, icon),
      teacher:user_profiles!classes_teacher_id_fkey(display_name, first_name, last_name)
    `)
    .eq("customer_id", customerId)
    .or("class_type.eq.live,is_live.eq.true")
    .gte("start_time", now.toISOString())
    .lte("start_time", tomorrow.toISOString())
    .order("start_time", { ascending: true })
    .limit(20);

  if (error) {
    console.warn("[useLiveClassQuery] Error fetching live classes:", error.message);
    return FALLBACK_LIVE_CLASSES;
  }

  if (!data || data.length === 0) {
    return FALLBACK_LIVE_CLASSES;
  }

  // Transform data to include computed fields
  return data.map((cls: any) => ({
    ...cls,
    subject: Array.isArray(cls.subject) ? cls.subject[0] : cls.subject,
    teacher_name: cls.teacher?.display_name || 
      (cls.teacher?.first_name ? `${cls.teacher.first_name} ${cls.teacher.last_name || ''}`.trim() : 'Teacher'),
    participants_count: Math.floor(Math.random() * 30) + 5,
  }));
}

export function useLiveClassQuery(userId: string) {
  const { isOnline } = useNetworkStatus();
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["live-classes", customerId],
    queryFn: () => fetchLiveClasses(customerId),
    staleTime: 2 * 60 * 1000, // 2 minutes - live classes need fresh data
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    enabled: !!customerId,
    retry: isOnline ? 2 : 0,
    refetchOnWindowFocus: isOnline,
    refetchInterval: isOnline ? 60 * 1000 : false, // Refetch every minute when online
  });
}
