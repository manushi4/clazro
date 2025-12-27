import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import { useClassRosterQuery, type ClassStudent } from "../../../hooks/queries/teacher/useClassRosterQuery";
import { getLocalizedField } from "../../../utils/getLocalizedField";

export const ClassRosterWidget: React.FC<WidgetProps> = ({ config }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");

  // Get classId from route params or config
  const classId = (route.params as any)?.classId || (config?.classId as string) || "demo-1";

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "roll_number" | "attendance" | "score">("roll_number");

  // Config with defaults
  const maxItems = (config?.maxItems as number) || 10;
  const showSearch = config?.showSearch !== false;
  const showAttendance = config?.showAttendance !== false;
  const showScore = config?.showScore !== false;

  // Data
  const { data, isLoading, error, refetch } = useClassRosterQuery({
    classId,
    searchQuery,
    sortBy,
    limit: maxItems,
  });

  // Handle student press
  const handleStudentPress = (student: ClassStudent) => {
    (navigation as any).navigate("StudentDetail", {
      studentId: student.student_id,
      studentName: student.student_name_en,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.classRoster.states.loading", { defaultValue: "Loading students..." })}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.classRoster.states.error", { defaultValue: "Failed to load students" })}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>Retry</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Get status color for attendance/score
  const getStatusColor = (value: number, type: "attendance" | "score"): string => {
    if (type === "attendance") {
      if (value >= 90) return colors.success || "#4CAF50";
      if (value >= 75) return colors.warning || "#FF9800";
      return colors.error || "#F44336";
    }
    // Score
    if (value >= 80) return colors.success || "#4CAF50";
    if (value >= 60) return colors.warning || "#FF9800";
    return colors.error || "#F44336";
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      {showSearch && (
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderRadius: borderRadius.medium }]}>
          <Icon name="magnify" size={20} color={colors.onSurfaceVariant} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder={t("widgets.classRoster.searchPlaceholder", { defaultValue: "Search students..." })}
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="close-circle" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        {(["roll_number", "name", "attendance", "score"] as const).map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => setSortBy(option)}
            style={[
              styles.sortChip,
              {
                backgroundColor: sortBy === option ? `${colors.primary}20` : colors.surfaceVariant,
                borderRadius: borderRadius.small,
              },
            ]}
          >
            <AppText
              style={[
                styles.sortText,
                { color: sortBy === option ? colors.primary : colors.onSurfaceVariant },
              ]}
            >
              {t(`widgets.classRoster.sort.${option}`, { defaultValue: option })}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Empty state */}
      {!data?.length ? (
        <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="account-search" size={32} color={colors.onSurfaceVariant} />
          <AppText style={{ color: colors.onSurfaceVariant }}>
            {searchQuery
              ? t("widgets.classRoster.states.noResults", { defaultValue: "No students found" })
              : t("widgets.classRoster.states.empty", { defaultValue: "No students in this class" })}
          </AppText>
        </View>
      ) : (
        /* Student List */
        <View style={styles.listContainer}>
          {data.map((student) => (
            <TouchableOpacity
              key={student.id}
              onPress={() => handleStudentPress(student)}
              style={[
                styles.studentItem,
                { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
              ]}
            >
              {/* Avatar/Roll */}
              <View style={[styles.avatarBox, { backgroundColor: `${colors.primary}15` }]}>
                <AppText style={[styles.rollText, { color: colors.primary }]}>
                  {student.roll_number}
                </AppText>
              </View>

              {/* Student Info */}
              <View style={styles.studentInfo}>
                <AppText style={[styles.studentName, { color: colors.onSurface }]} numberOfLines={1}>
                  {getLocalizedField(student, "student_name")}
                </AppText>
                <View style={styles.statsRow}>
                  {showAttendance && (
                    <View style={styles.statBadge}>
                      <Icon name="calendar-check" size={12} color={getStatusColor(student.attendance_rate, "attendance")} />
                      <AppText style={[styles.statValue, { color: getStatusColor(student.attendance_rate, "attendance") }]}>
                        {student.attendance_rate}%
                      </AppText>
                    </View>
                  )}
                  {showScore && (
                    <View style={styles.statBadge}>
                      <Icon name="chart-line" size={12} color={getStatusColor(student.average_score, "score")} />
                      <AppText style={[styles.statValue, { color: getStatusColor(student.average_score, "score") }]}>
                        {student.average_score}
                      </AppText>
                    </View>
                  )}
                  {student.assignments_pending > 0 && (
                    <View style={[styles.pendingBadge, { backgroundColor: `${colors.warning}20` }]}>
                      <AppText style={[styles.pendingText, { color: colors.warning }]}>
                        {student.assignments_pending} pending
                      </AppText>
                    </View>
                  )}
                </View>
              </View>

              <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  stateContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  sortContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  listContainer: {
    gap: 8,
  },
  studentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rollText: {
    fontSize: 14,
    fontWeight: "700",
  },
  studentInfo: {
    flex: 1,
    gap: 4,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 11,
    fontWeight: "500",
  },
  pendingBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: "500",
  },
});
