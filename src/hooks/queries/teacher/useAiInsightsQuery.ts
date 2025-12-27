import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthStore } from "../../../stores/authStore";

export type InsightType =
  | "performance_alert"
  | "engagement_insight"
  | "teaching_recommendation"
  | "assessment_suggestion"
  | "deadline_reminder"
  | "resource_recommendation"
  | "student_at_risk"
  | "class_trend";

export type InsightPriority = "low" | "medium" | "high" | "critical";
export type InsightStatus = "unread" | "read" | "acted" | "dismissed";

export type AiInsight = {
  id: string;
  customer_id: string;
  teacher_id: string;
  insight_type: InsightType;
  priority: InsightPriority;
  title_en: string;
  title_hi?: string;
  description_en?: string;
  description_hi?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  related_entity_name?: string;
  action_url?: string;
  action_label_en?: string;
  action_label_hi?: string;
  data_points?: Record<string, unknown>;
  status: InsightStatus;
  is_actionable: boolean;
  generated_at: string;
  expires_at?: string;
  read_at?: string;
  acted_at?: string;
  created_at: string;
  updated_at: string;
};

export type UseAiInsightsQueryOptions = {
  limit?: number;
  status?: InsightStatus | "all";
  priority?: InsightPriority | "all";
  insightType?: InsightType | "all";
};

export const INSIGHT_TYPE_CONFIG: Record<
  InsightType,
  { icon: string; color: string; labelKey: string }
> = {
  performance_alert: {
    icon: "chart-line",
    color: "#E53935",
    labelKey: "teacher:widgets.aiInsights.types.performanceAlert",
  },
  engagement_insight: {
    icon: "account-group",
    color: "#1E88E5",
    labelKey: "teacher:widgets.aiInsights.types.engagementInsight",
  },
  teaching_recommendation: {
    icon: "lightbulb-on",
    color: "#FDD835",
    labelKey: "teacher:widgets.aiInsights.types.teachingRecommendation",
  },
  assessment_suggestion: {
    icon: "clipboard-check",
    color: "#43A047",
    labelKey: "teacher:widgets.aiInsights.types.assessmentSuggestion",
  },
  deadline_reminder: {
    icon: "clock-alert",
    color: "#FB8C00",
    labelKey: "teacher:widgets.aiInsights.types.deadlineReminder",
  },
  resource_recommendation: {
    icon: "book-open-variant",
    color: "#8E24AA",
    labelKey: "teacher:widgets.aiInsights.types.resourceRecommendation",
  },
  student_at_risk: {
    icon: "account-alert",
    color: "#D32F2F",
    labelKey: "teacher:widgets.aiInsights.types.studentAtRisk",
  },
  class_trend: {
    icon: "trending-up",
    color: "#00ACC1",
    labelKey: "teacher:widgets.aiInsights.types.classTrend",
  },
};

export const PRIORITY_CONFIG: Record<
  InsightPriority,
  { color: string; labelKey: string }
> = {
  low: { color: "#9E9E9E", labelKey: "teacher:widgets.aiInsights.priority.low" },
  medium: {
    color: "#1E88E5",
    labelKey: "teacher:widgets.aiInsights.priority.medium",
  },
  high: {
    color: "#FB8C00",
    labelKey: "teacher:widgets.aiInsights.priority.high",
  },
  critical: {
    color: "#D32F2F",
    labelKey: "teacher:widgets.aiInsights.priority.critical",
  },
};

// Demo data for when database is unavailable
const DEMO_INSIGHTS: AiInsight[] = [
  {
    id: "demo-1",
    customer_id: "demo",
    teacher_id: "demo",
    insight_type: "student_at_risk",
    priority: "high",
    title_en: "3 students showing declining performance",
    title_hi: "3 छात्रों का प्रदर्शन गिर रहा है",
    description_en:
      "Students Rahul, Priya, and Amit have shown a 20% decrease in test scores over the last 2 weeks.",
    description_hi:
      "छात्र राहुल, प्रिया और अमित ने पिछले 2 सप्ताहों में परीक्षा अंकों में 20% की गिरावट दिखाई है।",
    related_entity_type: "class",
    related_entity_name: "Class 10-A Mathematics",
    action_url: "StudentProgress",
    action_label_en: "View Details",
    action_label_hi: "विवरण देखें",
    data_points: { students_affected: 3, decline_percentage: 20 },
    status: "unread",
    is_actionable: true,
    generated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    customer_id: "demo",
    teacher_id: "demo",
    insight_type: "teaching_recommendation",
    priority: "medium",
    title_en: "Try visual aids for Algebra concepts",
    title_hi: "बीजगणित अवधारणाओं के लिए दृश्य सहायता का प्रयोग करें",
    description_en:
      "Students are struggling with quadratic equations. Visual representations may help improve understanding.",
    description_hi:
      "छात्र द्विघात समीकरणों में कठिनाई महसूस कर रहे हैं। दृश्य प्रस्तुतियां समझ बेहतर बनाने में मदद कर सकती हैं।",
    related_entity_type: "subject",
    related_entity_name: "Mathematics",
    action_url: "ResourceLibrary",
    action_label_en: "Browse Resources",
    action_label_hi: "संसाधन ब्राउज़ करें",
    data_points: { topic: "Quadratic Equations", struggle_rate: 45 },
    status: "unread",
    is_actionable: true,
    generated_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "demo-3",
    customer_id: "demo",
    teacher_id: "demo",
    insight_type: "engagement_insight",
    priority: "low",
    title_en: "Class 9-B engagement up 15%",
    title_hi: "कक्षा 9-B की सहभागिता 15% बढ़ी",
    description_en:
      "Participation in class discussions has increased after implementing group activities last week.",
    description_hi:
      "पिछले सप्ताह समूह गतिविधियों को लागू करने के बाद कक्षा चर्चाओं में भागीदारी बढ़ी है।",
    related_entity_type: "class",
    related_entity_name: "Class 9-B Science",
    data_points: { engagement_increase: 15, activity_type: "Group Discussion" },
    status: "read",
    is_actionable: false,
    generated_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "demo-4",
    customer_id: "demo",
    teacher_id: "demo",
    insight_type: "deadline_reminder",
    priority: "high",
    title_en: "Term exam papers due in 3 days",
    title_hi: "सत्र परीक्षा पेपर 3 दिनों में देय हैं",
    description_en:
      "5 pending assignments need to be graded before the term end deadline.",
    description_hi:
      "सत्र समाप्ति की समय सीमा से पहले 5 लंबित असाइनमेंट को ग्रेड करने की आवश्यकता है।",
    related_entity_type: "assignment",
    action_url: "PendingGrading",
    action_label_en: "Start Grading",
    action_label_hi: "ग्रेडिंग शुरू करें",
    data_points: { pending_count: 5, days_remaining: 3 },
    status: "unread",
    is_actionable: true,
    generated_at: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "demo-5",
    customer_id: "demo",
    teacher_id: "demo",
    insight_type: "class_trend",
    priority: "medium",
    title_en: "Class average improving in Science",
    title_hi: "विज्ञान में कक्षा औसत सुधार रहा है",
    description_en:
      "Class 10-A Science average has improved from 68% to 74% over the last month.",
    description_hi:
      "कक्षा 10-A विज्ञान का औसत पिछले महीने में 68% से 74% तक सुधर गया है।",
    related_entity_type: "class",
    related_entity_name: "Class 10-A Science",
    data_points: { previous_average: 68, current_average: 74, improvement: 6 },
    status: "read",
    is_actionable: false,
    generated_at: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

export const useAiInsightsQuery = (
  options: UseAiInsightsQueryOptions = {}
) => {
  const { user } = useAuthStore();
  const customerId = user?.customerId;

  const { limit = 10, status = "all", priority = "all", insightType = "all" } = options;

  return useQuery({
    queryKey: ["teacher-ai-insights", customerId, { limit, status, priority, insightType }],
    queryFn: async () => {
      // Return demo data if no customerId available
      if (!customerId) {
        console.log("No customerId, using demo data for AI Insights");
        return filterDemoInsights(DEMO_INSIGHTS, { status, priority, insightType, limit });
      }

      try {
        let query = supabase
          .from("teacher_ai_insights")
          .select("*")
          .eq("customer_id", customerId)
          .order("generated_at", { ascending: false })
          .limit(limit);

        if (status !== "all") {
          query = query.eq("status", status);
        }

        if (priority !== "all") {
          query = query.eq("priority", priority);
        }

        if (insightType !== "all") {
          query = query.eq("insight_type", insightType);
        }

        const { data, error } = await query;

        if (error) {
          console.log("AI Insights query error, using demo data:", error.message);
          return filterDemoInsights(DEMO_INSIGHTS, { status, priority, insightType, limit });
        }

        if (!data || data.length === 0) {
          return filterDemoInsights(DEMO_INSIGHTS, { status, priority, insightType, limit });
        }

        return data as AiInsight[];
      } catch (err) {
        console.log("AI Insights fetch error, using demo data:", err);
        return filterDemoInsights(DEMO_INSIGHTS, { status, priority, insightType, limit });
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Helper to filter demo insights
function filterDemoInsights(
  insights: AiInsight[],
  options: { status?: string; priority?: string; insightType?: string; limit: number }
): AiInsight[] {
  let filtered = [...insights];

  if (options.status && options.status !== "all") {
    filtered = filtered.filter((i) => i.status === options.status);
  }

  if (options.priority && options.priority !== "all") {
    filtered = filtered.filter((i) => i.priority === options.priority);
  }

  if (options.insightType && options.insightType !== "all") {
    filtered = filtered.filter((i) => i.insight_type === options.insightType);
  }

  return filtered.slice(0, options.limit);
}

// Get unread insights count
export const useUnreadInsightsCount = () => {
  const { user } = useAuthStore();
  const customerId = user?.customerId;

  return useQuery({
    queryKey: ["teacher-ai-insights-unread-count", customerId],
    queryFn: async () => {
      // Return demo count if no customerId
      if (!customerId) {
        return DEMO_INSIGHTS.filter((i) => i.status === "unread").length;
      }

      try {
        const { count, error } = await supabase
          .from("teacher_ai_insights")
          .select("*", { count: "exact", head: true })
          .eq("customer_id", customerId)
          .eq("status", "unread");

        if (error) {
          return DEMO_INSIGHTS.filter((i) => i.status === "unread").length;
        }

        return count || DEMO_INSIGHTS.filter((i) => i.status === "unread").length;
      } catch (err) {
        return DEMO_INSIGHTS.filter((i) => i.status === "unread").length;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Get high priority insights
export const useHighPriorityInsightsQuery = (limit = 5) => {
  const { user } = useAuthStore();
  const customerId = user?.customerId;

  const getHighPriorityDemo = () =>
    DEMO_INSIGHTS.filter(
      (i) =>
        (i.priority === "high" || i.priority === "critical") &&
        i.status === "unread"
    ).slice(0, limit);

  return useQuery({
    queryKey: ["teacher-ai-insights-high-priority", customerId, limit],
    queryFn: async () => {
      // Return demo data if no customerId
      if (!customerId) {
        return getHighPriorityDemo();
      }

      try {
        const { data, error } = await supabase
          .from("teacher_ai_insights")
          .select("*")
          .eq("customer_id", customerId)
          .in("priority", ["high", "critical"])
          .eq("status", "unread")
          .order("priority", { ascending: false })
          .order("generated_at", { ascending: false })
          .limit(limit);

        if (error) {
          return getHighPriorityDemo();
        }

        if (!data || data.length === 0) {
          return getHighPriorityDemo();
        }

        return data as AiInsight[];
      } catch (err) {
        return getHighPriorityDemo();
      }
    },
    staleTime: 1000 * 60 * 5,
  });
};
