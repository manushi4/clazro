import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useChildSubjectProgressQuery, SubjectProgress } from "../../../hooks/queries/parent/useChildSubjectProgressQuery";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const WIDGET_ID = "parent.subject-progress";

export const ChildSubjectProgressWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = "standard",
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("parent");
  const renderStart = useRef(Date.now());
  const { trackWidgetEvent } = useAnalytics();

  const { data: childProgress, isLoading, error } = useChildSubjectProgressQuery();

  useEffect(() => {
    trackWidgetEvent(WIDGET_ID, "render", { size, loadTime: Date.now() - renderStart.current });
  }, []);

  // Config options
  const maxSubjects = parseInt(config?.maxSubjects as string) || 5;
  const showProgressBar = config?.showProgressBar !== false;
  const showScore = config?.showScore !== false;
  const showChapters = config?.showChapters !== false;
  const showTests = config?.showTests !== false;
  const showOverallProgress = config?.showOverallProgress !== false;
  const showStudyHours = config?.showStudyHours !== false;
  const compactMode = config?.compactMode === true;
  const enableTap = config?.enableTap !== false;
  const layoutStyle = (config?.layoutStyle as "list" | "cards" | "compact") || "list";

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

  const handleSubjectPress = (subject: SubjectProgress) => {
    if (!enableTap) return;
    trackWidgetEvent(WIDGET_ID, "click", { action: "subject_tap", subjectId: subject.subject_id });
    addBreadcrumb({ category: "widget", message: `${WIDGET_ID}_subject_tap`, level: "info", data: { subjectId: subject.subject_id } });
    onNavigate?.("subject-progress", { subjectId: subject.subject_id });
  };

  const handleViewAll = () => {
    trackWidgetEvent(WIDGET_ID, "click", { action: "view_all" });
    onNavigate?.("child-subjects");
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceVariant }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          {t("widgets.subjectProgress.states.loading")}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
        <Icon name="alert-circle" size={24} color={colors.error} />
        <AppText style={[styles.errorText, { color: colors.error }]}>
          {t("widgets.subjectProgress.states.error")}
        </AppText>
      </View>
    );
  }

  if (!childProgress || childProgress.length === 0 || childProgress[0]?.subjects.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="book-education" size={40} color={colors.onSurfaceVariant} />
        <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
          {t("widgets.subjectProgress.states.empty")}
        </AppText>
      </View>
    );
  }

  // Use first child's progress (can be extended for multi-child selector)
  const progress = childProgress[0];
  const displaySubjects = progress.subjects.slice(0, maxSubjects);
  const isCompact = size === "compact" || compactMode;


  const renderListItem = (subject: SubjectProgress, index: number) => (
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
        <View style={styles.titleRow}>
          <AppText style={[styles.subjectTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {getLocalizedField(subject, 'title')}
          </AppText>
          {showScore && (
            <AppText style={[styles.scoreText, { color: subject.color }]}>
              {subject.score}%
            </AppText>
          )}
        </View>
        {showProgressBar && (
          <View style={[styles.progressBarBg, { backgroundColor: colors.outline }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { backgroundColor: subject.color, width: `${subject.progress_percentage}%` }
              ]} 
            />
          </View>
        )}
        <View style={styles.metaRow}>
          {showChapters && (
            <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
              {t("widgets.subjectProgress.chapters", { 
                completed: subject.chapters_completed, 
                total: subject.total_chapters 
              })}
            </AppText>
          )}
          {showTests && (
            <AppText style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
              {t("widgets.subjectProgress.tests", { 
                passed: subject.tests_passed, 
                total: subject.total_tests 
              })}
            </AppText>
          )}
        </View>
      </View>
      {enableTap && (
        <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
      )}
    </TouchableOpacity>
  );

  const renderCardItem = (subject: SubjectProgress, index: number) => (
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
      <View style={[styles.cardScoreBadge, { backgroundColor: `${subject.color}20` }]}>
        <AppText style={[styles.cardScoreText, { color: subject.color }]}>
          {subject.score}%
        </AppText>
      </View>
      {showProgressBar && (
        <View style={[styles.cardProgressBg, { backgroundColor: colors.outline }]}>
          <View 
            style={[
              styles.cardProgressFill, 
              { backgroundColor: subject.color, width: `${subject.progress_percentage}%` }
            ]} 
          />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCompactItem = (subject: SubjectProgress, index: number) => (
    <TouchableOpacity
      key={subject.subject_id}
      style={[styles.compactItem, { borderBottomColor: colors.outline }]}
      onPress={() => handleSubjectPress(subject)}
      disabled={!enableTap}
      activeOpacity={0.7}
    >
      <Icon name={getSubjectIcon(subject.icon)} size={16} color={subject.color} />
      <AppText style={[styles.compactTitle, { color: colors.onSurface }]} numberOfLines={1}>
        {getLocalizedField(subject, 'title')}
      </AppText>
      <View style={[styles.compactProgressBg, { backgroundColor: colors.outline }]}>
        <View 
          style={[
            styles.compactProgressFill, 
            { backgroundColor: subject.color, width: `${subject.progress_percentage}%` }
          ]} 
        />
      </View>
      <AppText style={[styles.compactScore, { color: subject.color }]}>
        {subject.score}%
      </AppText>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Overall Progress Summary */}
      {showOverallProgress && (
        <View style={[styles.summaryBanner, { backgroundColor: `${colors.primary}10`, borderRadius: borderRadius.medium }]}>
          <View style={styles.summaryItem}>
            <AppText style={[styles.summaryValue, { color: colors.primary }]}>
              {progress.overall_progress}%
            </AppText>
            <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              {t("widgets.subjectProgress.overall")}
            </AppText>
          </View>
          {showStudyHours && (
            <View style={[styles.summaryDivider, { backgroundColor: colors.outline }]} />
          )}
          {showStudyHours && (
            <View style={styles.summaryItem}>
              <AppText style={[styles.summaryValue, { color: colors.primary }]}>
                {progress.total_study_hours}h
              </AppText>
              <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                {t("widgets.subjectProgress.studied")}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Subject List */}
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

      {/* View All Button */}
      {progress.subjects.length > maxSubjects && enableTap && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <AppText style={[styles.viewAllText, { color: colors.primary }]}>
            {t("widgets.subjectProgress.actions.viewAll", { count: progress.subjects.length })}
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
  summaryBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, gap: 20 },
  summaryItem: { alignItems: "center" },
  summaryValue: { fontSize: 22, fontWeight: "700" },
  summaryLabel: { fontSize: 11, marginTop: 2 },
  summaryDivider: { width: 1, height: 36 },
  // List layout
  listContainer: { gap: 10 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  contentWrapper: { flex: 1, gap: 6 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  subjectTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  scoreText: { fontSize: 14, fontWeight: "700" },
  progressBarBg: { height: 6, borderRadius: 3 },
  progressBarFill: { height: 6, borderRadius: 3 },
  metaRow: { flexDirection: "row", gap: 12 },
  metaText: { fontSize: 11 },
  // Cards layout
  cardsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cardItem: { width: "48%", padding: 14, alignItems: "center", gap: 8 },
  cardIconWrapper: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  cardScoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  cardScoreText: { fontSize: 14, fontWeight: "700" },
  cardProgressBg: { width: "100%", height: 4, borderRadius: 2, marginTop: 4 },
  cardProgressFill: { height: 4, borderRadius: 2 },
  // Compact layout
  compactContainer: { padding: 8 },
  compactItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 8, gap: 10, borderBottomWidth: 1 },
  compactTitle: { flex: 1, fontSize: 13 },
  compactProgressBg: { width: 60, height: 4, borderRadius: 2 },
  compactProgressFill: { height: 4, borderRadius: 2 },
  compactScore: { fontSize: 12, fontWeight: "600", width: 36, textAlign: "right" },
  // View all
  viewAllButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: "600" },
});
