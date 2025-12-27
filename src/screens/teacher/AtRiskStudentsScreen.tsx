import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useAppTheme } from "../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { getLocalizedField } from "../../utils/getLocalizedField";
import { AppText } from "../../ui/components/AppText";
import {
  useAtRiskStudentsQuery,
  type AtRiskStudent,
} from "../../hooks/queries/teacher/useAtRiskStudentsQuery";

type GroupBy = "all" | "class" | "batch";
type RiskFilter = "all" | "critical" | "high" | "medium" | "low";

const RISK_ICONS: Record<string, string> = {
  critical: "alert-circle",
  high: "alert",
  medium: "alert-outline",
  low: "information-outline",
};

const TREND_ICONS: Record<string, string> = {
  improving: "trending-up",
  stable: "trending-neutral",
  declining: "trending-down",
};

export const AtRiskStudentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation(["teacher", "dashboard"]);

  // State - default to batch view
  const [groupBy, setGroupBy] = useState<GroupBy>("batch");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");

  // Data - fetch all students
  const { data, isLoading, refetch } = useAtRiskStudentsQuery({
    limit: 100,
    status: "active",
  });

  // Risk level colors
  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return colors.error;
      case "high":
        return colors.warning;
      case "medium":
        return "#F59E0B";
      case "low":
        return colors.success;
      default:
        return colors.onSurfaceVariant;
    }
  };

  // Trend colors
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return colors.success;
      case "declining":
        return colors.error;
      default:
        return colors.onSurfaceVariant;
    }
  };

  // Summary stats
  const stats = useMemo(() => {
    if (!data) return { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    return {
      critical: data.filter((s) => s.risk_level === "critical").length,
      high: data.filter((s) => s.risk_level === "high").length,
      medium: data.filter((s) => s.risk_level === "medium").length,
      low: data.filter((s) => s.risk_level === "low").length,
      total: data.length,
    };
  }, [data]);

  // Filter and group data
  const groupedData = useMemo(() => {
    if (!data) return {};

    // Apply risk filter
    let filtered = data;
    if (riskFilter !== "all") {
      filtered = data.filter((s) => s.risk_level === riskFilter);
    }

    // Group by selected option
    if (groupBy === "all") {
      return { "All Students": filtered };
    } else if (groupBy === "class") {
      return filtered.reduce(
        (acc, student) => {
          const key = student.class_name || "Unknown Class";
          if (!acc[key]) acc[key] = [];
          acc[key].push(student);
          return acc;
        },
        {} as Record<string, AtRiskStudent[]>
      );
    } else {
      // batch = class + section
      return filtered.reduce(
        (acc, student) => {
          const key = student.section
            ? `${student.class_name} - ${student.section}`
            : student.class_name || "Unknown";
          if (!acc[key]) acc[key] = [];
          acc[key].push(student);
          return acc;
        },
        {} as Record<string, AtRiskStudent[]>
      );
    }
  }, [data, groupBy, riskFilter]);

  // Format percentage
  const formatPercent = (value?: number) => {
    if (value === undefined || value === null) return "--";
    return `${Math.round(value)}%`;
  };

  // Navigate to student detail
  const handleStudentPress = (student: AtRiskStudent) => {
    (navigation as any).navigate("StudentDetail", {
      studentId: student.student_id,
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("teacher:screens.atRiskStudents.title", {
            defaultValue: "At-Risk Students",
          })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[colors.primary]}
          />
        }
      >
        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[
              styles.statCard,
              {
                backgroundColor:
                  riskFilter === "critical"
                    ? `${colors.error}20`
                    : colors.surfaceVariant,
                borderColor:
                  riskFilter === "critical" ? colors.error : "transparent",
                borderWidth: riskFilter === "critical" ? 2 : 0,
              },
            ]}
            onPress={() =>
              setRiskFilter(riskFilter === "critical" ? "all" : "critical")
            }
          >
            <Icon name="alert-circle" size={20} color={colors.error} />
            <AppText style={[styles.statValue, { color: colors.error }]}>
              {stats.critical}
            </AppText>
            <AppText
              style={[styles.statLabel, { color: colors.onSurfaceVariant }]}
            >
              {t("teacher:screens.atRiskStudents.stats.critical", {
                defaultValue: "Critical",
              })}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              {
                backgroundColor:
                  riskFilter === "high"
                    ? `${colors.warning}20`
                    : colors.surfaceVariant,
                borderColor:
                  riskFilter === "high" ? colors.warning : "transparent",
                borderWidth: riskFilter === "high" ? 2 : 0,
              },
            ]}
            onPress={() =>
              setRiskFilter(riskFilter === "high" ? "all" : "high")
            }
          >
            <Icon name="alert" size={20} color={colors.warning} />
            <AppText style={[styles.statValue, { color: colors.warning }]}>
              {stats.high}
            </AppText>
            <AppText
              style={[styles.statLabel, { color: colors.onSurfaceVariant }]}
            >
              {t("teacher:screens.atRiskStudents.stats.high", {
                defaultValue: "High",
              })}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              {
                backgroundColor:
                  riskFilter === "medium"
                    ? "#F59E0B20"
                    : colors.surfaceVariant,
                borderColor: riskFilter === "medium" ? "#F59E0B" : "transparent",
                borderWidth: riskFilter === "medium" ? 2 : 0,
              },
            ]}
            onPress={() =>
              setRiskFilter(riskFilter === "medium" ? "all" : "medium")
            }
          >
            <Icon name="alert-outline" size={20} color="#F59E0B" />
            <AppText style={[styles.statValue, { color: "#F59E0B" }]}>
              {stats.medium}
            </AppText>
            <AppText
              style={[styles.statLabel, { color: colors.onSurfaceVariant }]}
            >
              {t("teacher:screens.atRiskStudents.stats.medium", {
                defaultValue: "Medium",
              })}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              {
                backgroundColor:
                  riskFilter === "low"
                    ? `${colors.success}20`
                    : colors.surfaceVariant,
                borderColor:
                  riskFilter === "low" ? colors.success : "transparent",
                borderWidth: riskFilter === "low" ? 2 : 0,
              },
            ]}
            onPress={() => setRiskFilter(riskFilter === "low" ? "all" : "low")}
          >
            <Icon name="information-outline" size={20} color={colors.success} />
            <AppText style={[styles.statValue, { color: colors.success }]}>
              {stats.low}
            </AppText>
            <AppText
              style={[styles.statLabel, { color: colors.onSurfaceVariant }]}
            >
              {t("teacher:screens.atRiskStudents.stats.low", {
                defaultValue: "Low",
              })}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Group By Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor:
                  groupBy === "all" ? colors.primary : colors.surfaceVariant,
                borderRadius: borderRadius.medium,
              },
            ]}
            onPress={() => setGroupBy("all")}
          >
            <AppText
              style={[
                styles.tabText,
                {
                  color:
                    groupBy === "all" ? colors.onPrimary : colors.onSurfaceVariant,
                },
              ]}
            >
              {t("teacher:screens.atRiskStudents.tabs.all", {
                defaultValue: "All",
              })}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor:
                  groupBy === "class" ? colors.primary : colors.surfaceVariant,
                borderRadius: borderRadius.medium,
              },
            ]}
            onPress={() => setGroupBy("class")}
          >
            <AppText
              style={[
                styles.tabText,
                {
                  color:
                    groupBy === "class"
                      ? colors.onPrimary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              {t("teacher:screens.atRiskStudents.tabs.byClass", {
                defaultValue: "By Class",
              })}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor:
                  groupBy === "batch" ? colors.primary : colors.surfaceVariant,
                borderRadius: borderRadius.medium,
              },
            ]}
            onPress={() => setGroupBy("batch")}
          >
            <AppText
              style={[
                styles.tabText,
                {
                  color:
                    groupBy === "batch"
                      ? colors.onPrimary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              {t("teacher:screens.atRiskStudents.tabs.byBatch", {
                defaultValue: "By Batch",
              })}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Grouped Student List */}
        {Object.entries(groupedData).map(([groupName, students]) => (
          <View key={groupName} style={styles.groupContainer}>
            {/* Group Header */}
            {groupBy !== "all" && (
              <View
                style={[
                  styles.groupHeader,
                  { backgroundColor: colors.surfaceVariant },
                ]}
              >
                <Icon
                  name={groupBy === "class" ? "school-outline" : "account-group"}
                  size={18}
                  color={colors.primary}
                />
                <AppText
                  style={[styles.groupTitle, { color: colors.onSurface }]}
                >
                  {groupName}
                </AppText>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: `${colors.primary}20` },
                  ]}
                >
                  <AppText
                    style={[styles.countText, { color: colors.primary }]}
                  >
                    {students.length}
                  </AppText>
                </View>
              </View>
            )}

            {/* Students in Group */}
            {students.map((student) => {
              const riskColor = getRiskColor(student.risk_level);
              const trendColor = getTrendColor(student.recent_trend);

              return (
                <TouchableOpacity
                  key={student.id}
                  onPress={() => handleStudentPress(student)}
                  style={[
                    styles.studentCard,
                    {
                      backgroundColor: colors.surface,
                      borderRadius: borderRadius.medium,
                      borderLeftColor: riskColor,
                    },
                  ]}
                >
                  {/* Header Row */}
                  <View style={styles.studentHeader}>
                    <View style={styles.studentInfo}>
                      <View
                        style={[
                          styles.riskBadge,
                          { backgroundColor: `${riskColor}20` },
                        ]}
                      >
                        <Icon
                          name={RISK_ICONS[student.risk_level] || "alert"}
                          size={14}
                          color={riskColor}
                        />
                        <AppText style={[styles.riskText, { color: riskColor }]}>
                          {student.risk_level.toUpperCase()}
                        </AppText>
                      </View>
                      <AppText
                        style={[styles.studentName, { color: colors.onSurface }]}
                        numberOfLines={1}
                      >
                        {getLocalizedField(student, "student_name")}
                      </AppText>
                    </View>
                    <View style={styles.trendContainer}>
                      <Icon
                        name={
                          TREND_ICONS[student.recent_trend] || "trending-neutral"
                        }
                        size={18}
                        color={trendColor}
                      />
                    </View>
                  </View>

                  {/* Class Info (only show if groupBy is "all") */}
                  {groupBy === "all" && (
                    <View style={styles.classRow}>
                      <Icon
                        name="school-outline"
                        size={14}
                        color={colors.onSurfaceVariant}
                      />
                      <AppText
                        style={[
                          styles.classText,
                          { color: colors.onSurfaceVariant },
                        ]}
                      >
                        {student.class_name}
                        {student.section ? ` - ${student.section}` : ""}
                        {student.roll_number
                          ? ` (Roll: ${student.roll_number})`
                          : ""}
                      </AppText>
                    </View>
                  )}

                  {/* Primary Concern */}
                  <AppText
                    style={[styles.concernText, { color: colors.onSurface }]}
                    numberOfLines={2}
                  >
                    {getLocalizedField(student, "primary_concern")}
                  </AppText>

                  {/* Metrics Row */}
                  <View style={styles.metricsRow}>
                    <View style={styles.metric}>
                      <Icon
                        name="calendar-check"
                        size={14}
                        color={colors.onSurfaceVariant}
                      />
                      <AppText
                        style={[
                          styles.metricValue,
                          {
                            color:
                              (student.attendance_rate || 0) < 75
                                ? colors.error
                                : colors.onSurface,
                          },
                        ]}
                      >
                        {formatPercent(student.attendance_rate)}
                      </AppText>
                      <AppText
                        style={[
                          styles.metricLabel,
                          { color: colors.onSurfaceVariant },
                        ]}
                      >
                        Attendance
                      </AppText>
                    </View>
                    <View style={styles.metric}>
                      <Icon
                        name="clipboard-check-outline"
                        size={14}
                        color={colors.onSurfaceVariant}
                      />
                      <AppText
                        style={[
                          styles.metricValue,
                          {
                            color:
                              (student.assignment_completion_rate || 0) < 70
                                ? colors.warning
                                : colors.onSurface,
                          },
                        ]}
                      >
                        {formatPercent(student.assignment_completion_rate)}
                      </AppText>
                      <AppText
                        style={[
                          styles.metricLabel,
                          { color: colors.onSurfaceVariant },
                        ]}
                      >
                        Assignments
                      </AppText>
                    </View>
                    <View style={styles.metric}>
                      <Icon
                        name="chart-line"
                        size={14}
                        color={colors.onSurfaceVariant}
                      />
                      <AppText
                        style={[
                          styles.metricValue,
                          {
                            color:
                              (student.average_score || 0) < 50
                                ? colors.error
                                : colors.onSurface,
                          },
                        ]}
                      >
                        {formatPercent(student.average_score)}
                      </AppText>
                      <AppText
                        style={[
                          styles.metricLabel,
                          { color: colors.onSurfaceVariant },
                        ]}
                      >
                        Avg Score
                      </AppText>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Empty State */}
        {Object.keys(groupedData).length === 0 && !isLoading && (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <Icon
              name="emoticon-happy-outline"
              size={48}
              color={colors.success}
            />
            <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
              {t("teacher:screens.atRiskStudents.empty.title", {
                defaultValue: "No At-Risk Students",
              })}
            </AppText>
            <AppText
              style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}
            >
              {t("teacher:screens.atRiskStudents.empty.subtitle", {
                defaultValue: "All students are performing well!",
              })}
            </AppText>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  studentCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    gap: 10,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  studentInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskText: {
    fontSize: 10,
    fontWeight: "700",
  },
  studentName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  trendContainer: {
    padding: 4,
  },
  classRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  classText: {
    fontSize: 12,
  },
  concernText: {
    fontSize: 13,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  metric: {
    alignItems: "center",
    gap: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  metricLabel: {
    fontSize: 11,
  },
  emptyState: {
    margin: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  bottomPadding: {
    height: 32,
  },
});

export default AtRiskStudentsScreen;
