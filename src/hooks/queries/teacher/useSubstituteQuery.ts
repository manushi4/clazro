import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthStore } from "../../../stores/authStore";

export interface SubstituteRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  substitute_id: string | null;
  substitute_name: string | null;
  class_id: string | null;
  class_name: string;
  subject: string;
  request_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "fulfilled" | "cancelled";
  notes: string | null;
  created_at: string;
}

export interface AvailableTeacher {
  id: string;
  teacher_id: string;
  teacher_name: string;
  avatar_url: string | null;
  subjects: string[];
  available_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface SubstituteData {
  myRequests: SubstituteRequest[];
  pendingRequests: SubstituteRequest[];
  availableTeachers: AvailableTeacher[];
}

interface UseSubstituteQueryOptions {
  includeMyRequests?: boolean;
  includePendingRequests?: boolean;
  includeAvailableTeachers?: boolean;
  dateFilter?: string;
}

export const useSubstituteQuery = (options: UseSubstituteQueryOptions = {}) => {
  const { customerId, userId } = useAuthStore();
  const {
    includeMyRequests = true,
    includePendingRequests = true,
    includeAvailableTeachers = true,
    dateFilter,
  } = options;

  return useQuery<SubstituteData>({
    queryKey: ["teacher", "substitute", customerId, userId, options],
    queryFn: async () => {
      const results: SubstituteData = {
        myRequests: [],
        pendingRequests: [],
        availableTeachers: [],
      };

      // Fetch my substitute requests
      if (includeMyRequests) {
        const { data: myReqs, error: myReqsError } = await supabase
          .from("substitute_requests")
          .select("*")
          .eq("customer_id", customerId)
          .eq("requester_id", userId)
          .gte("request_date", new Date().toISOString().split("T")[0])
          .order("request_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(10);

        if (myReqsError) throw myReqsError;
        results.myRequests = myReqs || [];
      }

      // Fetch pending requests from others (that I could fulfill)
      if (includePendingRequests) {
        const { data: pendingReqs, error: pendingError } = await supabase
          .from("substitute_requests")
          .select("*")
          .eq("customer_id", customerId)
          .eq("status", "pending")
          .neq("requester_id", userId)
          .gte("request_date", new Date().toISOString().split("T")[0])
          .order("request_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(10);

        if (pendingError) throw pendingError;
        results.pendingRequests = pendingReqs || [];
      }

      // Fetch available teachers
      if (includeAvailableTeachers) {
        let query = supabase
          .from("teacher_availability")
          .select("*")
          .eq("customer_id", customerId)
          .eq("is_available", true)
          .gte("available_date", new Date().toISOString().split("T")[0]);

        if (dateFilter) {
          query = query.eq("available_date", dateFilter);
        }

        const { data: teachers, error: teachersError } = await query
          .order("available_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(10);

        if (teachersError) throw teachersError;
        results.availableTeachers = teachers || [];
      }

      return results;
    },
    enabled: !!customerId && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};
