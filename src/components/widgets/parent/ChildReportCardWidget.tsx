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

const WIDGET_ID = "parent.report-card-preview";

export const ChildReportCardWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const { data: reportCards, isLoading, error } = useChildReportCardQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxSubjects = parseInt(config?.maxSubjects as string) || 5;
  const showOverallGrade = config?.showOverallGrade !== false;
  const showAverageScore = config?.showAverageScore !== false;
  const showBestScore = config?.showBestScore !== false;
  const showPassRate = config?.showPassRate !== false;
  const showTerm = config?.showTerm !== false;
  const showSubjectGrades = config?.showSubjectGrades !== false;
  const showGradePoints = config?.showGradePoints !== false;
  const compactMode = config?.compactMode === true;
  const enableTap = config?.enableTap !== false;
  const layoutStyle = (config?.layoutStyle as "list" | "cards" | "compact") || "list";

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
    };
    return iconMap[icon] || 'book';
  };

  const handleSubjectPress = (subject: SubjectGrade) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "subject_tap", subjectId: subject.subject_id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_subject_tap`, level: "info", data: { subjectId: subject.subject_id } });
    onNavigate?.("subject-report", { subjectId: subject.subject_id, childId: report?.child_id });
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("child-report-card");
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.reportCardPreview.states.loading")}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.reportCardPreview.states.error")}
        </AppText>
      </View>
    );
  }

  if (!reportCards || reportCards.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="file-document-outline" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.reportCardPreview.states.empty")}
        </AppText>
      </View>
    );
  }

  // Use first child's report card
  const report = reportCards[0];
  const displaySubjects = report.subjects.slice(0, maxSubjects);
  const isCompact = size === "compact" || compactMode;


  const renderListItem = (subject: SubjectGrade, index: number) => (
    <TouchableOpacity
      key={subject.subject_id}
      style={[styles.listItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
      onPress={() => handleSubjectPress(subject)}
      disabled={!enableTap}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrapper, { backgroundColor: `${subject.color}20` }]}>
        <Icon name={getSubjectIcon(subject.icon)} size={20} color={subject.color} />
      </View>
      <View style={styles.contentWrapper}>
        <AppText style={[styles.subjectTitle, { color: colors.onSurface }]} numberOfLines={1}>
          {getLocalizedField(subject, 'title')}
        </AppText>
        <AppText style={[styles.scoreText, { color: colors.onSurfaceVariant }]}>
          {subject.score}%
        </AppText>
      </View>
      <View style={[styles.gradeBadge, { backgroundColor: `${getGradeColor(subject.grade)}20` }]}>
        <AppText style={[styles.gradeText, { color: getGradeColor(subject.grade) }]}>
          {subject.grade}
        </AppText>
      </View>
      {showGradePoints && (
        <AppText style={[styles.gradePoints, { color: colors.onSurfaceVariant }]}>
          {subject.grade_points}/10
        </AppText>
      )}
      {enableTap && (
        <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
      )}
    </TouchableOpacity>
  );

  const renderCardItem = (subject: SubjectGrade, index: number) => (
    <TouchableOpacity
      key={subject.subject_id}
      style={[styles.cardItem, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}
      onPress={() => handleSubjectPress(subject)}
      disabled={!enableTap}
      activeOpacity={0.7}
    >
      <View style={[styles.cardIconWrapper, { backgroundColor: `${subject.color}20` }]}>
        <Icon name={getSubjectIcon(subject.icon)} size={24} color={subject.color} />
      </View>
      <AppText style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={1}>
        {getLocalizedField(subject, 'title')}
      </AppText>
      <View style={[styles.cardGradeBadge, { backgroundColor: `${getGradeColor(subject.grade)}20` }]}>
        <AppText style={[styles.cardGradeText, { color: getGradeColor(subject.grade) }]}>
          {subject.grade}
        </AppText>
      </View>
      <AppText style={[styles.cardScore, { color: colors.onSurfaceVariant }]}>
        {subject.score}%
      </AppText>
    </TouchableOpacity>
  );

  const renderCompactItem = (subject: SubjectGrade, index: number) => (
    <View
      key={subject.subject_id}
      style={[styles.compactItem, { borderBottomColor: colors.outline }]}
    >
      <Icon name={getSubjectIcon(subject.icon)} size={16} color={subject.color} />
      <AppText style={[styles.compactTitle, { color: colors.onSurface }]} numberOfLines={1}>
        {getLocalizedField(subject, 'title')}
      </AppText>
      <AppText style={[styles.compactScore, { color: colors.onSurfaceVariant }]}>
        {subject.score}%
      </AppText>
      <View style={[styles.compactGradeBadge, { backgroundColor: `${getGradeColor(subject.grade)}20` }]}>
        <AppText style={[styles.compactGradeText, { color: getGradeColor(subject.grade) }]}>
          {subject.grade}
        </AppText>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Overall Grade Summary */}
      {showOverallGrade && (
        <View style={[styles.summaryBanner, { backgroundColor: `${getGradeColor(report.overall_grade)}10`, borderRadius: borderRadius.medium }]}>
          <View style={styles.gradeCircle}>
            <View style={[styles.gradeCircleInner, { backgroundColor: `${getGradeColor(report.overall_grade)}20`, borderColor: getGradeColor(report.overall_grade) }]}>
              <AppText style={[styles.overallGrade, { color: getGradeColor(report.overall_grade) }]}>
                {report.overall_grade}
              </AppText>
            </View>
            <AppText style={[styles.overallLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.reportCardPreview.overallGrade")}
            </AppText>
          </View>
          <View style={styles.summaryStats}>
            {showAverageScore && (
              <View style={styles.statItem}>
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                  {report.average_score.toFixed(1)}%
                </AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {t("widgets.reportCardPreview.average")}
                </AppText>
              </View>
            )}
            {showBestScore && (
              <View style={styles.statItem}>
                <AppText style={[styles.statValue, { color: colors.success }]}>
                  {report.best_score.toFixed(1)}%
                </AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {t("widgets.reportCardPreview.best")}
                </AppText>
              </View>
            )}
            {showPassRate && (
              <View style={styles.statItem}>
                <AppText style={[styles.statValue, { color: colors.primary }]}>
                  {report.pass_rate}%
                </AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {t("widgets.reportCardPreview.passRate")}
                </AppText>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Term Badge */}
      {showTerm && (
        <View style={[styles.termBadge, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.small }]}>
          <Icon name="calendar-month" size={14} color={colors.primary} />
          <AppText style={[styles.termText, { color: colors.onSurface }]}>
            {report.term}
          </AppText>
        </View>
      )}

      {/* Subject Grades */}
      {showSubjectGrades && (
        <>
          {layoutStyle === "cards" ? (
            <View style={styles.cardsContainer}>
              {displaySubjects.map((subject, index) => renderCardItem(subject, index))}
            </View>
          ) : layoutStyle === "compact" ? (
            <View style={[styles.compactContainer, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
              {displaySubjects.map((subject, index) => renderCompactItem(subject, index))}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {displaySubjects.map((subject, index) => renderListItem(subject, index))}
            </View>
          )}
        </>
      )}

      {/* View All Button */}
      {report.subjects.length > maxSubjects && enableTap && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.reportCardPreview.actions.viewAll")}
          </AppText>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  // Loading/Error/Empty states
  loadingContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 12 },
  loadingText: { fontSize: 14 },
  errorContainer: { padding: 24, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 10 },
  errorText: { fontSize: 14, fontWeight: "500" },
  emptyContainer: { padding: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  // Summary banner
  summaryBanner: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
  gradeCircle: { alignItems: "center" },
  gradeCircleInner: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  overallGrade: { fontSize: 22, fontWeight: "800" },
  overallLabel: { fontSize: 10, marginTop: 4 },
  summaryStats: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 10, marginTop: 2 },
  // Term badge
  termBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, gap: 6 },
  termText: { fontSize: 12, fontWeight: "500" },
  // List layout
  listContainer: { gap: 10 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  contentWrapper: { flex: 1 },
  subjectTitle: { fontSize: 14, fontWeight: "600" },
  scoreText: { fontSize: 12, marginTop: 2 },
  gradeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  gradeText: { fontSize: 14, fontWeight: "700" },
  gradePoints: { fontSize: 11, marginLeft: 4 },
  // Cards layout
  cardsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cardItem: { width: "48%", padding: 14, alignItems: "center", gap: 8 },
  cardIconWrapper: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  cardGradeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  cardGradeText: { fontSize: 16, fontWeight: "700" },
  cardScore: { fontSize: 12 },
  // Compact layout
  compactContainer: { padding: 8 },
  compactItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 8, gap: 10, borderBottomWidth: 1 },
  compactTitle: { flex: 1, fontSize: 13 },
  compactScore: { fontSize: 12, width: 40, textAlign: "right" },
  compactGradeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  compactGradeText: { fontSize: 12, fontWeight: "600" },
  // View all
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: "600" },
});
