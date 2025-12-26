/**
 * Top Performers Widget (analytics.top-performers)
 * Displays top performing students with class filter dropdown
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
  useTopPerformersQuery,
  useClassesForFilterQuery,
  TopPerformer,
  ClassOption,
} from "../../../hooks/queries/useTopPerformersQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "analytics.top-performers";

// Rank badge colors
const getRankColor = (rank: number, colors: any) => {
  if (rank === 1) return "#FFD700"; // Gold
  if (rank === 2) return "#C0C0C0"; // Silver
  if (rank === 3) return "#CD7F32"; // Bronze
  return colors.primary;
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return "trophy";
  if (rank === 2) return "medal";
  if (rank === 3) return "medal-outline";
  return "account";
};

export const TopPerformersWidget: React.FC<WidgetProps> = ({
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
  const maxItems = (config?.maxItems as number) || 5;
  const showTrend = config?.showTrend !== false;
  const showSubject = config?.showSubject !== false;

  // Queries
  const { data: classes, isLoading: classesLoading } = useClassesForFilterQuery();
  const { data, isLoading, error, refetch } = useTopPerformersQuery({
    limit: maxItems,
    classId: selectedClass,
  });

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_view_all`, level: "info" });
    onNavigate?.("top-performers-detail");
  };

  const handleStudentPress = (item: TopPerformer) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "student_tap", studentId: item.student_id });
    addBreadcrumb({
      category: "widget",
      message: `${WIDGET_ID}_student_tap`,
      level: "info",
      data: { studentId: item.student_id },
    });
    onNavigate?.("student-profile", { studentId: item.student_id });
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
    if (!selectedClass) return t("widgets.topPerformers.labels.allClasses", { defaultValue: "All Classes" });
    const selected = classes?.find((c) => c.id === selectedClass);
    return selected ? getLocalizedField(selected, "name") : "All Classes";
  };

  // === LOADING STATE ===
  if (isLoading || classesLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.topPerformers.states.loading", { defaultValue: "Loading top performers..." })}
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
          {t("widgets.topPerformers.states.error", { defaultValue: "Failed to load data" })}
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
        <Icon name="trophy-outline" size={36} color={colors.onSurfaceVariant} />
        <AppText style={[styles.stateText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.topPerformers.states.empty", { defaultValue: "No performers data yet" })}
        </AppText>
      </View>
    );
  }

  // === SUCCESS STATE ===
  return (
    <View style={styles.container}>
      {/* Header with Class Filter */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="trophy" size={20} color="#FFD700" />
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t("widgets.topPerformers.title", { defaultValue: "Top Performers" })}
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

      {/* Period Badge */}
      {data[0]?.period_label && (
        <View style={[styles.periodBadge, { backgroundColor: `${colors.primary}15` }]}>
          <Icon name="calendar" size={12} color={colors.primary} />
          <AppText style={[styles.periodText, { color: colors.primary }]}>
            {data[0].period_label}
          </AppText>
        </View>
      )}

      {/* Performers List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {data.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.performerItem,
              { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
              item.rank <= 3 && { borderLeftWidth: 3, borderLeftColor: getRankColor(item.rank, colors) },
            ]}
            onPress={() => handleStudentPress(item)}
            activeOpacity={0.7}
          >
            {/* Rank Badge */}
            <View style={[styles.rankBadge, { backgroundColor: `${getRankColor(item.rank, colors)}20` }]}>
              <Icon name={getRankIcon(item.rank)} size={item.rank <= 3 ? 18 : 14} color={getRankColor(item.rank, colors)} />
              <AppText style={[styles.rankNumber, { color: getRankColor(item.rank, colors) }]}>
                #{item.rank}
              </AppText>
            </View>

            {/* Student Info */}
            <View style={styles.studentInfo}>
              <AppText style={[styles.studentName, { color: colors.onSurface }]} numberOfLines={1}>
                {item.student_name}
              </AppText>
              {showSubject && item.subject_en && (
                <AppText style={[styles.subjectText, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                  {getLocalizedField(item, "subject")}
                </AppText>
              )}
            </View>

            {/* Score & Trend */}
            <View style={styles.scoreSection}>
              <AppText style={[styles.scoreText, { color: colors.primary }]}>
                {Number(item.score).toFixed(1)}%
              </AppText>
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
          {t("widgets.topPerformers.actions.viewAll", { defaultValue: "View All Rankings" })}
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
                {t("widgets.topPerformers.labels.selectClass", { defaultValue: "Select Class" })}
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
                {t("widgets.topPerformers.labels.allClasses", { defaultValue: "All Classes" })}
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

  // Period
  periodBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  periodText: {
    fontSize: 11,
    fontWeight: "500",
  },

  // List
  listContainer: {
    maxHeight: 300,
  },
  performerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumber: {
    fontSize: 10,
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

  // Score
  scoreSection: {
    alignItems: "flex-end",
    gap: 4,
  },
  scoreText: {
    fontSize: 16,
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

export default TopPerformersWidget;
