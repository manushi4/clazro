import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCustomerId } from "../../../hooks/config/useCustomerId";
import { ActivityIndicator } from "react-native";

type StudentItem = {
  id: string;
  name: string;
  classId: string;
  className: string;
  attendance: number;
  avgScore: number;
  status: "excellent" | "good" | "average" | "at-risk";
};

type ClassGroup = {
  id: string;
  name: string;
  students: StudentItem[];
};

function useClassStudentsQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ["class-students", customerId],
    queryFn: async () => {
      const supabase = getSupabaseClient();

      // Get classes
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name_en")
        .eq("customer_id", customerId)
        .order("name_en");

      if (!classes?.length) {
        return [];
      }

      // Get attendance stats per student in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: attendanceData } = await supabase
        .from("attendance_records")
        .select("student_user_id, class_id, status")
        .eq("customer_id", customerId)
        .gte("attendance_date", thirtyDaysAgo);

      // Get submission scores per student
      const { data: submissions } = await supabase
        .from("assignment_submissions")
        .select("student_user_id, percentage")
        .eq("customer_id", customerId)
        .eq("status", "graded");

      // Build student map
      const studentMap: Record<string, {
        classId: string;
        presentCount: number;
        totalCount: number;
        scores: number[];
      }> = {};

      attendanceData?.forEach((record) => {
        const key = record.student_user_id;
        if (!studentMap[key]) {
          studentMap[key] = {
            classId: record.class_id,
            presentCount: 0,
            totalCount: 0,
            scores: [],
          };
        }
        studentMap[key].totalCount++;
        if (record.status === "present") {
          studentMap[key].presentCount++;
        }
      });

      submissions?.forEach((sub) => {
        const key = sub.student_user_id;
        if (studentMap[key] && sub.percentage !== null) {
          studentMap[key].scores.push(sub.percentage);
        }
      });

      // Group students by class
      const classGroups: ClassGroup[] = classes.map((cls) => {
        const studentsInClass = Object.entries(studentMap)
          .filter(([_, data]) => data.classId === cls.id)
          .map(([studentId, data]) => {
            const attendance = data.totalCount > 0
              ? Math.round((data.presentCount / data.totalCount) * 100)
              : 0;
            const avgScore = data.scores.length > 0
              ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
              : 0;

            let status: StudentItem["status"] = "average";
            if (avgScore >= 80 && attendance >= 90) status = "excellent";
            else if (avgScore >= 60 && attendance >= 75) status = "good";
            else if (avgScore < 50 || attendance < 60) status = "at-risk";

            return {
              id: studentId,
              name: `Student ${studentId.split("-")[1] || "1"}`,
              classId: cls.id,
              className: cls.name_en,
              attendance,
              avgScore,
              status,
            };
          });

        return {
          id: cls.id,
          name: cls.name_en,
          students: studentsInClass,
        };
      }).filter((g) => g.students.length > 0);

      return classGroups;
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5,
  });
}

export const ClassStudentsWidget: React.FC<WidgetProps> = ({ config, onNavigate }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  const { data: classGroups, isLoading, error } = useClassStudentsQuery();

  const getStatusColor = (status: StudentItem["status"]) => {
    switch (status) {
      case "excellent": return "#4CAF50";
      case "good": return "#2196F3";
      case "average": return "#FF9800";
      case "at-risk": return "#F44336";
    }
  };

  const getStatusIcon = (status: StudentItem["status"]) => {
    switch (status) {
      case "excellent": return "star";
      case "good": return "thumb-up";
      case "average": return "minus";
      case "at-risk": return "alert";
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !classGroups) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.errorContainer, borderRadius: borderRadius.large }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>Failed to load students</AppText>
      </View>
    );
  }

  if (classGroups.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.large }]}>
        <Icon name="account-group-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.classStudents.noData", { defaultValue: "No student data available" })}
        </AppText>
      </View>
    );
  }

  const renderStudent = (student: StudentItem) => (
    <TouchableOpacity
      key={student.id}
      style={[styles.studentRow, { backgroundColor: colors.surface }]}
      onPress={() => onNavigate?.("StudentDetail", { studentId: student.id })}
    >
      <View style={[styles.statusDot, { backgroundColor: getStatusColor(student.status) }]} />
      <View style={styles.studentInfo}>
        <AppText style={[styles.studentName, { color: colors.onSurface }]} numberOfLines={1}>
          {student.name}
        </AppText>
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Icon name="calendar-check" size={12} color={colors.onSurfaceVariant} />
            <AppText style={[styles.metricValue, { color: colors.onSurfaceVariant }]}>
              {student.attendance}%
            </AppText>
          </View>
          <View style={styles.metric}>
            <Icon name="chart-line" size={12} color={colors.onSurfaceVariant} />
            <AppText style={[styles.metricValue, { color: colors.onSurfaceVariant }]}>
              {student.avgScore}%
            </AppText>
          </View>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(student.status)}15` }]}>
        <Icon name={getStatusIcon(student.status)} size={14} color={getStatusColor(student.status)} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {classGroups.map((group) => {
        const isExpanded = expandedClass === group.id;
        const displayStudents = isExpanded ? group.students : group.students.slice(0, 3);
        const statusCounts = {
          excellent: group.students.filter((s) => s.status === "excellent").length,
          atRisk: group.students.filter((s) => s.status === "at-risk").length,
        };

        return (
          <View key={group.id} style={[styles.classCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
            <TouchableOpacity
              style={styles.classHeader}
              onPress={() => setExpandedClass(isExpanded ? null : group.id)}
            >
              <Icon name="google-classroom" size={20} color={colors.primary} />
              <View style={styles.classInfo}>
                <AppText style={[styles.className, { color: colors.onSurface }]} numberOfLines={1}>
                  {group.name}
                </AppText>
                <View style={styles.classMeta}>
                  <AppText style={[styles.classCount, { color: colors.onSurfaceVariant }]}>
                    {group.students.length} {t("widgets.classStudents.students", { defaultValue: "students" })}
                  </AppText>
                  {statusCounts.excellent > 0 && (
                    <View style={styles.miniStat}>
                      <Icon name="star" size={10} color="#4CAF50" />
                      <AppText style={{ fontSize: 10, color: "#4CAF50" }}>{statusCounts.excellent}</AppText>
                    </View>
                  )}
                  {statusCounts.atRisk > 0 && (
                    <View style={styles.miniStat}>
                      <Icon name="alert" size={10} color="#F44336" />
                      <AppText style={{ fontSize: 10, color: "#F44336" }}>{statusCounts.atRisk}</AppText>
                    </View>
                  )}
                </View>
              </View>
              <Icon
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <View style={styles.studentsList}>
              {displayStudents.map(renderStudent)}
            </View>

            {group.students.length > 3 && !isExpanded && (
              <TouchableOpacity
                style={styles.showMoreBtn}
                onPress={() => setExpandedClass(group.id)}
              >
                <AppText style={[styles.showMoreText, { color: colors.primary }]}>
                  +{group.students.length - 3} {t("widgets.classStudents.more", { defaultValue: "more" })}
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  classCard: {
    overflow: "hidden",
  },
  classHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 14,
    fontWeight: "600",
  },
  classMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  classCount: {
    fontSize: 11,
  },
  miniStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  studentsList: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 4,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    gap: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 13,
    fontWeight: "500",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricValue: {
    fontSize: 11,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  showMoreBtn: {
    padding: 8,
    alignItems: "center",
  },
  showMoreText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default ClassStudentsWidget;
