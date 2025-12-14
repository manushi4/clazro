/**
 * Comparison Details Query Hook
 * Fetches detailed comparison analytics between child and class/school averages
 */

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { useCustomerId } from "../config/useCustomerId";

export type ComparisonMetric = {
  id: string;
  metric_name_en: string;
  metric_name_hi?: string;
  child_value: number;
  class_average: number;
  school_average: number;
  percentile: number;
  trend: "up" | "down" | "stable";
  change_percent: number;
};

export type SubjectComparison = {
  id: string;
  subject_id: string;
  subject_name_en: string;
  subject_name_hi?: string;
  child_score: number;
  class_average: number;
  school_average: number;
  rank_in_class: number;
  total_students: number;
  percentile: number;
  trend: "up" | "down" | "stable";
};

export type ComparisonDetailsData = {
  id: string;
  child_id: string;
  child_name: string;
  class_name: string;
  school_name: string;
  overall_score: number;
  overall_class_avg: number;
  overall_school_avg: number;
  overall_rank: number;
  total_students: number;
  overall_percentile: number;
  metrics: ComparisonMetric[];
  subjects: SubjectComparison[];
  generated_at: string;
  period_en: string;
  period_hi?: string;
};

// Mock data for development - will be replaced with actual Supabase query
const getMockComparisonData = (childId: string): ComparisonDetailsData => ({
  id: `comparison-${childId}`,
  child_id: childId,
  child_name: "Aarav Sharma",
  class_name: "Class 8-A",
  school_name: "Delhi Public School",
  overall_score: 85.5,
  overall_class_avg: 78.2,
  overall_school_avg: 75.8,
  overall_rank: 5,
  total_students: 45,
  overall_percentile: 89,
  metrics: [
    {
      id: "m1",
      metric_name_en: "Academic Performance",
      metric_name_hi: "शैक्षणिक प्रदर्शन",
      child_value: 85.5,
      class_average: 78.2,
      school_average: 75.8,
      percentile: 89,
      trend: "up",
      change_percent: 5.2,
    },
    {
      id: "m2",
      metric_name_en: "Attendance Rate",
      metric_name_hi: "उपस्थिति दर",
      child_value: 94,
      class_average: 88,
      school_average: 86,
      percentile: 92,
      trend: "stable",
      change_percent: 0,
    },
    {
      id: "m3",
      metric_name_en: "Assignment Completion",
      metric_name_hi: "असाइनमेंट पूर्णता",
      child_value: 92,
      class_average: 85,
      school_average: 82,
      percentile: 88,
      trend: "up",
      change_percent: 3.5,
    },
    {
      id: "m4",
      metric_name_en: "Test Scores",
      metric_name_hi: "परीक्षा अंक",
      child_value: 82,
      class_average: 76,
      school_average: 74,
      percentile: 85,
      trend: "up",
      change_percent: 4.0,
    },
    {
      id: "m5",
      metric_name_en: "Class Participation",
      metric_name_hi: "कक्षा भागीदारी",
      child_value: 78,
      class_average: 72,
      school_average: 70,
      percentile: 80,
      trend: "down",
      change_percent: -2.0,
    },
  ],
  subjects: [
    {
      id: "s1",
      subject_id: "math",
      subject_name_en: "Mathematics",
      subject_name_hi: "गणित",
      child_score: 88,
      class_average: 75,
      school_average: 72,
      rank_in_class: 3,
      total_students: 45,
      percentile: 93,
      trend: "up",
    },
    {
      id: "s2",
      subject_id: "science",
      subject_name_en: "Science",
      subject_name_hi: "विज्ञान",
      child_score: 85,
      class_average: 78,
      school_average: 76,
      rank_in_class: 5,
      total_students: 45,
      percentile: 89,
      trend: "stable",
    },
    {
      id: "s3",
      subject_id: "english",
      subject_name_en: "English",
      subject_name_hi: "अंग्रेज़ी",
      child_score: 82,
      class_average: 80,
      school_average: 78,
      rank_in_class: 8,
      total_students: 45,
      percentile: 82,
      trend: "up",
    },
    {
      id: "s4",
      subject_id: "hindi",
      subject_name_en: "Hindi",
      subject_name_hi: "हिंदी",
      child_score: 90,
      class_average: 82,
      school_average: 80,
      rank_in_class: 2,
      total_students: 45,
      percentile: 96,
      trend: "up",
    },
    {
      id: "s5",
      subject_id: "social",
      subject_name_en: "Social Studies",
      subject_name_hi: "सामाजिक अध्ययन",
      child_score: 78,
      class_average: 76,
      school_average: 74,
      rank_in_class: 12,
      total_students: 45,
      percentile: 73,
      trend: "down",
    },
  ],
  generated_at: new Date().toISOString(),
  period_en: "Current Term (Oct - Dec 2024)",
  period_hi: "वर्तमान सत्र (अक्टूबर - दिसंबर 2024)",
});

export function useComparisonDetailsQuery(childId?: string | undefined) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["comparison-details", customerId, childId || "default"],
    queryFn: async () => {
      // If no childId provided, fetch first child from parent_children
      let resolvedChildId = childId;
      
      if (!resolvedChildId) {
        const supabase = getSupabaseClient();
        const { data: childrenData } = await supabase
          .from("parent_children")
          .select("child_user_id")
          .eq("customer_id", customerId)
          .limit(1)
          .single();
        
        resolvedChildId = childrenData?.child_user_id;
      }

      if (!resolvedChildId) {
        // Return mock data with default child for demo
        resolvedChildId = "demo-child";
      }

      // TODO: Replace with actual Supabase query when table is ready
      // const supabase = getSupabaseClient();
      // const { data, error } = await supabase
      //   .from("comparison_analytics")
      //   .select("*")
      //   .eq("customer_id", customerId)
      //   .eq("child_id", resolvedChildId)
      //   .single();
      // if (error) throw error;
      // return data as ComparisonDetailsData;

      // Return mock data for now
      await new Promise((resolve) => setTimeout(resolve, 500));
      return getMockComparisonData(resolvedChildId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!customerId && !!childId,
  });
}
