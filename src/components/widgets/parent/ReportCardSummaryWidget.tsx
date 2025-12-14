/**
 * ReportCardSummaryWidget - Displays overall report card summary
 * Widget ID: parent.report-card-summary
 * Used in: child-report-card screen
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useChildReportCardQuery } from "../../../hooks/queries/parent/useChildReportCardQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";

const WIDGET_ID = "parent.report-card-summary";

export const ReportCardSummaryWidget: React.FC<WidgetProps> = ({
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

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !reportCards || reportCards.length === 0) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.reportCardSummary.error", { defaultValue: "Failed to load report" })}
        </AppText>
      </View>
    );
  }

  const report = reportCards[0];
  const gradeColor = getGradeColor(report.overall_grade);

  return (
    <View style={styles.container}>
      {/* Overall Grade Circle */}
      <View style={[styles.gradeSection, { backgroundColor: `${gradeColor}10`, borderRadius: borderRadius.large }]}>
        <View style={[styles.gradeCircle, { borderColor: gradeColor }]}>
          <AppText style={[styles.gradeText, { color: gradeColor }]}>
            {report.overall_grade}
          </AppText>
        </View>
        <View style={styles.gradeInfo}>
          <AppText style={[styles.gradeLabel, { color: colors.onSurface }]}>
            {t("widgets.reportCardSummary.overallGrade", { defaultValue: "Overall Grade" })}
          </AppText>
          <AppText style={[styles.termText, { color: colors.onSurfaceVariant }]}>
            {report.term}
          </AppText>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <Icon name="percent" size={22} color={colors.primary} />
          <AppText style={[styles.statValue, { color: colors.onSurface }]}>
            {report.average_score.toFixed(1)}%
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t("widgets.reportCardSummary.average", { defaultValue: "Average" })}
          </AppText>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <Icon name="trophy" size={22} color={colors.success} />
          <AppText style={[styles.statValue, { color: colors.success }]}>
            {report.best_score.toFixed(0)}%
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t("widgets.reportCardSummary.best", { defaultValue: "Best Score" })}
          </AppText>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <Icon name="check-circle" size={22} color={colors.tertiary} />
          <AppText style={[styles.statValue, { color: colors.onSurface }]}>
            {report.pass_rate}%
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t("widgets.reportCardSummary.passRate", { defaultValue: "Pass Rate" })}
          </AppText>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <Icon name="book-multiple" size={22} color={colors.warning} />
          <AppText style={[styles.statValue, { color: colors.onSurface }]}>
            {report.subjects.length}
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            {t("widgets.reportCardSummary.subjects", { defaultValue: "Subjects" })}
          </AppText>
        </View>
      </View>

      {/* GPA/CGPA if available */}
      {report.gpa && (
        <View style={[styles.gpaSection, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <View style={styles.gpaItem}>
            <AppText style={[styles.gpaLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.reportCardSummary.gpa", { defaultValue: "GPA" })}
            </AppText>
            <AppText style={[styles.gpaValue, { color: colors.primary }]}>
              {report.gpa.toFixed(2)}
            </AppText>
          </View>
          {report.cgpa && (
            <View style={styles.gpaItem}>
              <AppText style={[styles.gpaLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.reportCardSummary.cgpa", { defaultValue: "CGPA" })}
              </AppText>
              <AppText style={[styles.gpaValue, { color: colors.success }]}>
                {report.cgpa.toFixed(2)}
              </AppText>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  loadingContainer: { padding: 40, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  errorContainer: { padding: 24, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 10 },
  errorText: { fontSize: 14, fontWeight: "500" },
  gradeSection: { flexDirection: "row", alignItems: "center", padding: 20, gap: 16 },
  gradeCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
  gradeText: { fontSize: 28, fontWeight: "800" },
  gradeInfo: { flex: 1 },
  gradeLabel: { fontSize: 18, fontWeight: "700" },
  termText: { fontSize: 14, marginTop: 4 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "48%", padding: 14, alignItems: "center", gap: 6 },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 11, textAlign: "center" },
  gpaSection: { flexDirection: "row", justifyContent: "space-around", padding: 16 },
  gpaItem: { alignItems: "center" },
  gpaLabel: { fontSize: 12 },
  gpaValue: { fontSize: 24, fontWeight: "700", marginTop: 4 },
});
