/**
 * Class Performance Widget (analytics.class-performance)
 * Shows student performance with class filter for teachers
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import {
  useClassPerformanceQuery,
  useClassesForPerformanceQuery,
  ClassPerformance,
  ClassOption,
} from "../../../hooks/queries/useClassPerformanceQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "analytics.class-performance";

// Grade color mapping
const getGradeColor = (grade: string, colors: any) => {
  if (grade.startsWith("A")) return colors.success;
  if (grade.startsWith("B")) return "#4CAF50";
  if (grade.startsWith("C")) return colors.warning;
  if (grade.startsWith("D")) return "#FF9800";
  return colors.error;
};

export const ClassPerformanceWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  // State for class filter
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showClassPicker, setShowClassPicker] = useState(false);

  // Config options
  const maxItems = (config?.maxItems as number) || 6;
  const showRank = config?.showRank !== false;
  const showTrend = config?.showTrend !== false;

  // Queries
  const { data: classes, isLoading: classesLoading } = useClassesForPerformanceQuery();
  const { data, isLoading, error, refetch } = useClassPerformanceQuery({
    limit: maxItems,
    classId: selectedClass,
  });

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_all`, level: "info" });
    onNavigate?.("class-performance-detail");
  };

  const handleStudentPress = (item: ClassPerformance) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "student_tap", studentId: item.user_id });
    addBreadcrumb({
      category: "widget",
      message: `${WIDGET_ID}_student_tap`,
      level: "info",
      data: { studentId: item.user_id },
    });
    onNavigate?.("student-performance", { studentId: item.user_id });
  };

  const handleClassSelect = (classOption: ClassOption | null) => {
    setSelectedClass(classOption?.id || null);
    setShowClassPicker(false);
    trackWidgetEvent(WIDGET_ID, "filter", { classId: classOption?.id || "all" });
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return "trending-up";
    if (trend === "down") return "trending-down";
    return "trending-neutral";
  };

  const getTrendColor = (trend: string) => {
    if (trend === "up") return colors.success;
    if (trend === "down") return colors.error;
    return colors.onSurfaceVariant;
  };

  const getSelectedClassName = () => {
    if (!selectedClass) return t("widgets.classPerformance.labels.allClasses", { defaultValue: "All Classes" });
    const selected = classes?.find((c) => c.id === selectedClass);
    return selected ? getLocalizedField(selected, "name") : "All Classes";
  };

  // === LOADING STATE ===
  if (isLoading || classesLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.classPerformance.states.loading", { defaultValue: "Loading performance..." })}
        </AppText>
      </View>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer, borderRadius: borderRadius.medium }]}>
        <Icon name="alert-circle-outline" size={28} color={colors.error} />
        <AppText style={[styles.stateText, { color: colors.error }]}>
          {t("widgets.classPerformance.states.error", { defaultValue: "Failed to load performance" })}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>
            {t("common:actions.retry", { defaultValue: "Retry" })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // === EMPTY STATE ===
  if (!data?.length) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <Icon name="chart-line" size={36} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.classPerformance.states.empty", { defaultValue: "No performance data yet" })}
        </AppText>
      </View>
    );
  }

  // Calculate overall stats
  const avgScore = data.reduce((sum, item) => sum + Number(item.score), 0) / data.length;

  // === SUCCESS STATE ===
  return (
    <View style={styles.container}>
      {/* Header with Class Filter */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="chart-box" size={20} color={colors.primary} />
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t("widgets.classPerformance.title", { defaultValue: "Class Performance" })}
          </AppText>
        </View>

        {/* Class Dropdown */}
        <TouchableOpacity
          style={[styles.classDropdown, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}
          onPress={() => setShowClassPicker(true)}
        >
          <Icon name="school" size={16} color={colors.primary} />
          <AppText style={[styles.dropdownText, { color: colors.onSurface }]} numberOfLines={1}>
            {getSelectedClassName()}
          </AppText>
          <Icon name="chevron-down" size={16} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: `${colors.primary}10`, borderRadius: borderRadius.medium }]}>
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t("widgets.classPerformance.labels.avgScore", { defaultValue: "Avg Score" })}
          </AppText>
          <AppText style={[styles.summaryValue, { color: colors.primary }]}>
            {avgScore.toFixed(1)}%
          </AppText>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.outline }]} />
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t("widgets.classPerformance.labels.students", { defaultValue: "Students" })}
          </AppText>
          <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
            {data.length}
          </AppText>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.outline }]} />
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            {t("widgets.classPerformance.labels.period", { defaultValue: "Period" })}
          </AppText>
          <AppText style={[styles.summaryValue, { color: colors.onSurface, fontSize: 12 }]} numberOfLines={1}>
            {data[0]?.period_label || "This Month"}
          </AppText>
        </View>
      </View>

      {/* Student List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {data.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.studentItem,
              { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
            ]}
            onPress={() => handleStudentPress(item)}
            activeOpacity={0.7}
          >
            {/* Rank Badge */}
            <View style={[styles.rankBadge, { backgroundColor: `${colors.primary}15` }]}>
              <AppText style={[styles.rankText, { color: colors.primary }]}>
                #{item.rank}
              </AppText>
            </View>

            {/* Student Info */}
            <View style={styles.studentInfo}>
              <AppText style={[styles.studentName, { color: colors.onSurface }]} numberOfLines={1}>
                {item.student_name || item.user_id}
              </AppText>
              <AppText style={[styles.subjectText, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {getLocalizedField(item, "subject")}
              </AppText>
            </View>

            {/* Score & Grade */}
            <View style={styles.scoreSection}>
              <View style={styles.scoreRow}>
                <AppText style={[styles.scoreText, { color: colors.onSurface }]}>
                  {Number(item.score).toFixed(0)}%
                </AppText>
                <View style={[styles.gradeBadge, { backgroundColor: `${getGradeColor(item.grade, colors)}20` }]}>
                  <AppText style={[styles.gradeText, { color: getGradeColor(item.grade, colors) }]}>
                    {item.grade}
                  </AppText>
                </View>
              </View>
              {showTrend && item.trend && (
                <Icon
                  name={getTrendIcon(item.trend)}
                  size={16}
                  color={getTrendColor(item.trend)}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* View All Button */}
      <TouchableOpacity
        style={[styles.viewAllBtn, { borderColor: colors.outline }]}
        onPress={handleViewAll}
      >
        <AppText style={[styles.viewAllText, { color: colors.primary }]}>
          {t("widgets.classPerformance.actions.viewAll", { defaultValue: "View All Students" })}
        </AppText>
        <Icon name="chevron-right" size={18} color={colors.primary} />
      </TouchableOpacity>

      {/* Class Picker Modal */}
      <Modal
        visible={showClassPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClassPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowClassPicker(false)}
        >
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderRadius: borderRadius.large }]}>
            <View style={styles.pickerHeader}>
              <AppText style={[styles.pickerTitle, { color: colors.onSurface }]}>
                {t("widgets.classPerformance.labels.selectClass", { defaultValue: "Select Class" })}
              </AppText>
              <TouchableOpacity onPress={() => setShowClassPicker(false)}>
                <Icon name="close" size={24} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* All Classes Option */}
            <TouchableOpacity
              style={[
                styles.classOption,
                { borderBottomColor: colors.outline },
                !selectedClass && { backgroundColor: `${colors.primary}10` },
              ]}
              onPress={() => handleClassSelect(null)}
            >
              <Icon name="school-outline" size={20} color={!selectedClass ? colors.primary : colors.onSurfaceVariant} />
              <AppText style={[styles.classOptionText, { color: !selectedClass ? colors.primary : colors.onSurface }]}>
                {t("widgets.classPerformance.labels.allClasses", { defaultValue: "All Classes" })}
              </AppText>
              {!selectedClass && <Icon name="check" size={20} color={colors.primary} />}
            </TouchableOpacity>

            {/* Class List */}
            <FlatList
              data={classes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.classOption,
                    { borderBottomColor: colors.outline },
                    selectedClass === item.id && { backgroundColor: `${colors.primary}10` },
                  ]}
                  onPress={() => handleClassSelect(item)}
                >
                  <Icon
                    name="google-classroom"
                    size={20}
                    color={selectedClass === item.id ? colors.primary : colors.onSurfaceVariant}
                  />
                  <AppText
                    style={[
                      styles.classOptionText,
                      { color: selectedClass === item.id ? colors.primary : colors.onSurface },
                    ]}
                  >
                    {getLocalizedField(item, "name")}
                  </AppText>
                  {selectedClass === item.id && <Icon name="check" size={20} color={colors.primary} />}
                </TouchableOpacity>
              )}
              style={styles.classList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  stateContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  stateText: {
    fontSize: 13,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 4,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  classDropdown: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    maxWidth: 140,
  },
  dropdownText: {
    fontSize: 12,
    flex: 1,
  },

  // Summary Card
  summaryCard: {
    flexDirection: "row",
    padding: 12,
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  summaryDivider: {
    width: 1,
    height: 30,
    opacity: 0.3,
  },

  // List
  listContainer: {
    maxHeight: 260,
  },
  studentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "600",
  },
  subjectText: {
    fontSize: 11,
    marginTop: 2,
  },

  // Score Section
  scoreSection: {
    alignItems: "flex-end",
    gap: 4,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "700",
  },
  gradeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gradeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // View All
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  pickerContainer: {
    maxHeight: "60%",
    overflow: "hidden",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  classList: {
    maxHeight: 300,
  },
  classOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  classOptionText: {
    fontSize: 15,
    flex: 1,
  },
});

export default ClassPerformanceWidget;
