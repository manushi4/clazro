import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export type TeacherCalendarEvent = {
  id: string;
  customer_id: string;
  teacher_id: string;
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  event_type: "class" | "meeting" | "exam" | "holiday" | "deadline" | "personal" | "other";
  start_time: string;
  end_time?: string;
  all_day: boolean;
  location?: string;
  class_id?: string;
  class_name?: string;
  color?: string;
  icon?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  reminder_minutes?: number;
  attendees?: string[];
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
};

export function useTeacherCalendarQuery(options?: {
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
}) {
  const customerId = useCustomerId();
  const startDate = options?.startDate || new Date();
  const endDate = options?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const eventType = options?.eventType;

  return useQuery({
    queryKey: ["teacher-calendar", customerId, { startDate: startDate.toISOString(), endDate: endDate.toISOString(), eventType }],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from("teacher_calendar_events")
        .select("*")
        .eq("customer_id", customerId)
        .eq("status", "scheduled")
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString())
        .order("start_time", { ascending: true });

      if (eventType) {
        query = query.eq("event_type", eventType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as TeacherCalendarEvent[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTodayEventsQuery() {
  const customerId = useCustomerId();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return useQuery({
    queryKey: ["today-events", customerId, today.toDateString()],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("teacher_calendar_events")
        .select("*")
        .eq("customer_id", customerId)
        .eq("status", "scheduled")
        .gte("start_time", today.toISOString())
        .lt("start_time", tomorrow.toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;
      return (data || []) as TeacherCalendarEvent[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpcomingEventsQuery(limit: number = 5) {
  const customerId = useCustomerId();
  const now = new Date();

  return useQuery({
    queryKey: ["upcoming-events", customerId, limit],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("teacher_calendar_events")
        .select("*")
        .eq("customer_id", customerId)
        .eq("status", "scheduled")
        .gte("start_time", now.toISOString())
        .order("start_time", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return (data || []) as TeacherCalendarEvent[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2,
  });
}
