import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../config/useCustomerId";

export type GradingStats = {
  totalAssignments: number;
  publishedAssignments: number;
  totalSubmissions: number;
  pendingGrading: number;
  gradedCount: number;
  avgScore: number;
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
};

export function useGradingStatsQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["grading-stats", customerId],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      // Get assignment counts
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, status")
        .eq("customer_id", customerId);

      const totalAssignments = assignments?.length || 0;
      const publishedAssignments =
        assignments?.filter((a) => a.status === "published").length || 0;

      // Get submission stats
      const { data: submissions } = await supabase
        .from("assignment_submissions")
        .select("status, score, percentage, grade_letter")
        .eq("customer_id", customerId);

      const totalSubmissions = submissions?.length || 0;
      const pendingGrading =
        submissions?.filter(
          (s) => s.status === "submitted" || s.status === "late"
        ).length || 0;
      const gradedSubmissions =
        submissions?.filter((s) => s.status === "graded") || [];
      const gradedCount = gradedSubmissions.length;

      // Calculate average score
      const scores = gradedSubmissions
        .map((s) => s.percentage)
        .filter(Boolean);
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

      // Grade distribution
      const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      gradedSubmissions.forEach((s) => {
        const letter = s.grade_letter?.charAt(0);
        if (letter === "A") gradeDistribution.A++;
        else if (letter === "B") gradeDistribution.B++;
        else if (letter === "C") gradeDistribution.C++;
        else if (letter === "D") gradeDistribution.D++;
        else if (letter === "F") gradeDistribution.F++;
      });

      return {
        totalAssignments,
        publishedAssignments,
        totalSubmissions,
        pendingGrading,
        gradedCount,
        avgScore,
        gradeDistribution,
      } as GradingStats;
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
