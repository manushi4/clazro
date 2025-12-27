import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import { useTeacherClassesQuery } from "../../../hooks/queries/teacher/useTeacherClassesQuery";

export const ClassCardsWidget: React.FC<WidgetProps> = ({ config }) => {
  const navigation = useNavigation();
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("teacher");

  // Config with defaults
  const maxItems = (config?.maxItems as number) || 6;
  const columns = (config?.columns as number) || 2;
  const showStudentCount = config?.showStudentCount !== false;
  const showSubject = config?.showSubject !== false;

  // Data
  const { data, isLoading, error, refetch } = useTeacherClassesQuery();

  // Handle class press
  const handleClassPress = (classItem: any) => {
    (navigation as any).navigate("TeacherClassDetail", { classId: classItem.id, className: classItem.name });
  };

  // Loading state
  if (isLoading) {
    return (
      <View
        style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}
      >
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.classCards.states.loading", { defaultValue: "Loading classes..." })}
        </AppText>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View
        style={[styles.stateContainer, { backgroundColor: colors.errorContainer }]}
      >
        <Icon name="alert-circle-outline" size={24} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("widgets.classCards.states.error", { defaultValue: "Failed to load classes" })}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.error }]}
        >
          <AppText style={{ color: colors.onError, fontSize: 12 }}>
            {t("common.retry", { defaultValue: "Retry" })}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (!data?.length) {
    return (
      <View
        style={[styles.stateContainer, { backgroundColor: colors.surfaceVariant }]}
      >
        <Icon name="school-outline" size={32} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.classCards.states.empty", { defaultValue: "No classes assigned" })}
        </AppText>
      </View>
    );
  }

  // Class color based on grade
  const getClassColor = (grade: string): string => {
    const gradeNum = parseInt(grade) || 0;
    if (gradeNum >= 10) return "#9C27B0"; // Purple
    if (gradeNum >= 9) return "#2196F3"; // Blue
    if (gradeNum >= 8) return "#4CAF50"; // Green
    return "#FF9800"; // Orange
  };

  return (
    <View style={[styles.gridContainer, { gap: 12 }]}>
      {data.slice(0, maxItems).map((classItem) => {
        const classColor = getClassColor(classItem.grade);
        return (
          <TouchableOpacity
            key={classItem.id}
            onPress={() => handleClassPress(classItem)}
            style={[
              styles.classCard,
              {
                width: `${100 / columns - 3}%`,
                backgroundColor: colors.surfaceVariant,
                borderRadius: borderRadius.medium,
                borderLeftWidth: 4,
                borderLeftColor: classColor,
              },
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.gradeBox,
                  { backgroundColor: `${classColor}20` },
                ]}
              >
                <AppText style={[styles.gradeText, { color: classColor }]}>
                  {classItem.grade}-{classItem.section}
                </AppText>
              </View>
              <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />
            </View>

            <AppText
              style={[styles.className, { color: colors.onSurface }]}
              numberOfLines={1}
            >
              {classItem.name}
            </AppText>

            {showSubject && (
              <AppText
                style={[styles.subject, { color: colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {classItem.subject}
              </AppText>
            )}

            <View style={styles.cardFooter}>
              {showStudentCount && (
                <View style={styles.statItem}>
                  <Icon name="account-group" size={14} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                    {classItem.student_count}
                  </AppText>
                </View>
              )}
              {classItem.schedule_time && (
                <View style={styles.statItem}>
                  <Icon name="clock-outline" size={14} color={colors.onSurfaceVariant} />
                  <AppText style={[styles.statText, { color: colors.onSurfaceVariant }]}>
                    {classItem.schedule_time}
                  </AppText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
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
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  classCard: {
    padding: 12,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  gradeBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  className: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  subject: {
    fontSize: 12,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 11,
  },
});
