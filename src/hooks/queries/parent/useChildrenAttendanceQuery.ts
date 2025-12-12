import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";
import { useDemoUser } from "../../useDemoUser";

export type AttendanceStatus = "present" | "absent" | "late" | "excused" | "half_day";

export type AttendanceRecord = {
  id: string;
  student_user_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  check_in_time: string | null;
  check_out_time: string | null;
  reason: string | null;
};

export type ChildAttendanceSummary = {
  child_user_id: string;
  child_name: string;
  child_avatar_url: string | null;
  class_name: string | null;
  section: string | null;
  today_status: AttendanceStatus | null;
  today_check_in: string | null;
  this_week: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    half_day: number;
    total_days: number;
  };
  this_month: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    half_day: number;
    total_days: number;
    attendance_percentage: number;
  };
  recent_records: AttendanceRecord[];
};

/**
 * Hook to fetch attendance summary for all children of a parent
 * Returns today's status, weekly summary, and monthly stats for each child
 */
export function useChildrenAttendanceQuery() {
  const customerId = useCustomerId();
  const { userId: parentUserId } = useDemoUser();

  return useQuery({
    queryKey: ["children-attendance", customerId, parentUserId],
    queryFn: async (): Promise<ChildAttendanceSummary[]> => {
      const supabase = getSupabaseClient();

      // Get parent's children (simple query like useChildrenQuery)
      const { data: childrenData, error: childrenError } = await supabase
        .from("parent_children")
        .select("child_user_id")
        .eq("parent_user_id", parentUserId)
        .eq("customer_id", customerId);

      if (childrenError) throw childrenError;
      if (!childrenData || childrenData.length === 0) return [];

      // Map to simple structure with mock names (same pattern as useChildrenQuery)
      const children = childrenData.map((c, index) => ({
        child_user_id: c.child_user_id,
        child_name: `Child ${index + 1}`,
        child_avatar_url: null,
        class_name: "Class 10",
        section: "A",
      }));

      // Calculate date ranges
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      
      // Start of week (Monday)
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(today.getDate() - diff);
      const weekStartStr = startOfWeek.toISOString().split("T")[0];
      
      // Start of month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartStr = startOfMonth.toISOString().split("T")[0];

      // Fetch attendance for all children
      const childIds = children.map((c) => c.child_user_id);
      
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("customer_id", customerId)
        .in("student_user_id", childIds)
        .gte("attendance_date", monthStartStr)
        .lte("attendance_date", todayStr)
        .order("attendance_date", { ascending: false });

      if (attendanceError) throw attendanceError;

      // Process data for each child
      const summaries: ChildAttendanceSummary[] = children.map((child) => {
        const childRecords = (attendanceRecords || []).filter(
          (r) => r.student_user_id === child.child_user_id
        );

        // Today's status
        const todayRecord = childRecords.find((r) => r.attendance_date === todayStr);

        // This week stats
        const weekRecords = childRecords.filter((r) => r.attendance_date >= weekStartStr);
        const weekStats = {
          present: weekRecords.filter((r) => r.status === "present").length,
          absent: weekRecords.filter((r) => r.status === "absent").length,
          late: weekRecords.filter((r) => r.status === "late").length,
          excused: weekRecords.filter((r) => r.status === "excused").length,
          half_day: weekRecords.filter((r) => r.status === "half_day").length,
          total_days: weekRecords.length,
        };

        // This month stats
        const monthStats = {
          present: childRecords.filter((r) => r.status === "present").length,
          absent: childRecords.filter((r) => r.status === "absent").length,
          late: childRecords.filter((r) => r.status === "late").length,
          excused: childRecords.filter((r) => r.status === "excused").length,
          half_day: childRecords.filter((r) => r.status === "half_day").length,
          total_days: childRecords.length,
          attendance_percentage: 0,
        };

        // Calculate attendance percentage (present + late + half_day count as attended)
        const attendedDays = monthStats.present + monthStats.late + monthStats.half_day;
        monthStats.attendance_percentage =
          monthStats.total_days > 0
            ? Math.round((attendedDays / monthStats.total_days) * 100)
            : 0;

        return {
          child_user_id: child.child_user_id,
          child_name: child.child_name,
          child_avatar_url: child.child_avatar_url,
          class_name: child.class_name,
          section: child.section,
          today_status: (todayRecord?.status as AttendanceStatus) || null,
          today_check_in: todayRecord?.check_in_time || null,
          this_week: weekStats,
          this_month: monthStats,
          recent_records: childRecords.slice(0, 7).map((r) => ({
            id: r.id,
            student_user_id: r.student_user_id,
            attendance_date: r.attendance_date,
            status: r.status as AttendanceStatus,
            check_in_time: r.check_in_time,
            check_out_time: r.check_out_time,
            reason: r.reason,
          })),
        };
      });

      return summaries;
    },
    enabled: !!customerId && !!parentUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
