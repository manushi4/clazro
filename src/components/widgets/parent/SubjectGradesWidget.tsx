/**
 * SubjectGradesWidget - Displays subject grades list with navigation to subject-report
 * Widget ID: parent.subject-grades
 * Used in: child-report-card screen
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useChildReportCardQuery, SubjectGrade } from "../../../hooks/queries/parent/useChildReportCardQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "parent.subject-grades";

export const SubjectGradesWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "expanded",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const { data: reportCards, isLoading, error } = useChildReportCardQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  const getGradeColor = (grade: string): string => {
    if (grade === 'A+' || grade === 'A') return colors.success;
    if (grade === 'B+' || grade === 'B') return colors.primary;
    if (grade === 'C+' || grade === 'C') return colors.warning;
    return colors.error;
  };

  const getSubjectIcon = (icon: string): string => {
    const iconMap: Record<string, string> = {
      calculator: 'calculator-variant',
      atom: 'atom',
      flask: 'flask',
      book: 'book-open-variant',
      leaf: 'leaf',
      globe: 'earth',
      music: 'music',
      palette: 'palette',
    };
    return iconMap[icon] || 'book';
  };

  const handleSubjectPress = (subject: SubjectGrade, childId?: string) => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "subject_tap", subjectId: subject.subject_id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_subject_tap`, level: "info", data: { subjectId: subject.subject_id } });
    onNavigate?.("subject-report", { subjectId: subject.subject_id, childId });
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.subjectGrades.loading", { defaultValue: "Loading grades..." })}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.subjectGrades.error", { defaultValue: "Failed to load grades" })}
        </AppText>
      </View>
    );
  }

  if (!reportCards || reportCards.length === 0 || !reportCards[0].subjects?.length) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="school-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.subjectGrades.empty", { defaultValue: "No grades available" })}
        </AppText>
      </View>
    );
  }

  const report = reportCards[0];
  const subjects = report.subjects;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="school" size={20} color={colors.primary} />
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("widgets.subjectGrades.title", { defaultValue: "Subject Grades" })}
        </AppText>
        <AppText style={[styles.headerCount, { color: colors.onSurfaceVariant }]}>
          {subjects.length} {t("widgets.subjectGrades.subjects", { defaultValue: "subjects" })}
        </AppText>
      </View>

      <View style={styles.listContainer}>
        {subjects.map((subject, index) => (
          <TouchableOpacity
            key={subject.subject_id}
            style={[
              styles.subjectItem,
              { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
              index > 0 && styles.subjectItemMargin
            ]}
            onPress={() => handleSubjectPress(subject, report.child_id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, { backgroundColor: `${subject.color}20` }]}>
              <Icon name={getSubjectIcon(subject.icon)} size={22} color={subject.color} />
            </View>
            
            <View style={styles.contentWrapper}>
              <AppText style={[styles.subjectTitle, { color: colors.onSurface }]} numberOfLines={1}>
                {getLocalizedField(subject, 'title')}
              </AppText>
              <View style={styles.scoreRow}>
                <AppText style={[styles.scoreText, { color: colors.onSurfaceVariant }]}>
                  {subject.score}%
                </AppText>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${subject.score}%`, 
                        backgroundColor: getGradeColor(subject.grade) 
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.gradeWrapper}>
              <View style={[styles.gradeBadge, { backgroundColor: `${getGradeColor(subject.grade)}20` }]}>
                <AppText style={[styles.gradeText, { color: getGradeColor(subject.grade) }]}>
                  {subject.grade}
                </AppText>
              </View>
              <AppText style={[styles.gradePoints, { color: colors.onSurfaceVariant }]}>
                {subject.grade_points}/10 GP
              </AppText>
            </View>
            
            <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        ))}
      </View>

      <AppText style={[styles.tapHint, { color: colors.onSurfaceVariant }]}>
        {t("widgets.subjectGrades.tapHint", { defaultValue: "Tap a subject to view detailed report" })}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  loadingContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 12 },
  loadingText: { fontSize: 14 },
  errorContainer: { padding: 24, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 10 },
  errorText: { fontSize: 14, fontWeight: "500" },
  emptyContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: "600", flex: 1 },
  headerCount: { fontSize: 12 },
  listContainer: { gap: 0 },
  subjectItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  subjectItemMargin: { marginTop: 10 },
  iconWrapper: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  contentWrapper: { flex: 1 },
  subjectTitle: { fontSize: 15, fontWeight: "600" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  scoreText: { fontSize: 12, width: 36 },
  progressBar: { flex: 1, height: 4, backgroundColor: "#E0E0E0", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  gradeWrapper: { alignItems: "center", gap: 2 },
  gradeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  gradeText: { fontSize: 16, fontWeight: "700" },
  gradePoints: { fontSize: 10 },
  tapHint: { fontSize: 11, textAlign: "center", fontStyle: "italic" },
});
