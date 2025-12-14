/**
 * SubjectReportScreen - Fixed Screen
 *
 * Purpose: Display detailed report for a specific subject including grades, test scores, assignments, attendance, and teacher feedback
 * Type: Fixed (not widget-based)
 * Accessible from: child-report-card, subject-detail, child-subjects
 * Roles: parent, student
 */

import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";

// Analytics & Error Tracking
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";

// Localization
import { getLocalizedField } from "../../utils/getLocalizedField";

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Data Hooks
import {
  useSubjectReportQuery,
  SubjectGrade,
  SubjectTestScore,
  SubjectAssignmentScore,
  TeacherRemark,
} from "../../hooks/queries/useSubjectReportQuery";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

// Subject icon mapping
const SUBJECT_ICONS: Record<string, string> = {
  calculator: "calculator-variant",
  atom: "atom",
  flask: "flask",
  "book-open": "book-open-variant",
  leaf: "leaf",
  globe: "earth",
  default: "book-education",
};

// Test type icons
const TEST_ICONS: Record<string, string> = {
  unit_test: "clipboard-text",
  mid_term: "clipboard-check",
  final: "school",
  quiz: "help-circle",
  practical: "flask",
};

// Assignment type icons
const ASSIGNMENT_ICONS: Record<string, string> = {
  homework: "clipboard-text",
  project: "folder-star",
  lab: "flask",
  presentation: "presentation",
};

// Grade colors
const GRADE_COLORS: Record<string, string> = {
  'A+': '#1B5E20', 'A': '#2E7D32', 'A-': '#388E3C',
  'B+': '#1565C0', 'B': '#1976D2', 'B-': '#1E88E5',
  'C+': '#F57C00', 'C': '#FB8C00', 'C-': '#FF9800',
  'D': '#E65100', 'F': '#C62828',
};

// Remark type styles
const REMARK_STYLES: Record<string, { icon: string; color: string }> = {
  positive: { icon: 'star', color: '#4CAF50' },
  improvement: { icon: 'alert-circle', color: '#FF9800' },
  general: { icon: 'information', color: '#2196F3' },
};


export const SubjectReportScreen: React.FC<Props> = ({
  screenId = "subject-report",
  role,
  navigation: navProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = useRoute<any>();

  // Get params from route
  const subjectId = route.params?.subjectId || route.params?.id;
  const childId = route.params?.childId;

  // === DATA ===
  const { data: report, isLoading, error, refetch } = useSubjectReportQuery(subjectId, childId);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'tests' | 'assignments' | 'remarks'>('overview');

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { subjectId, childId },
    });
  }, [screenId, subjectId, childId]);

  // === EVENT HANDLERS ===
  const handleBack = useCallback(() => {
    trackEvent("back_pressed", { screen: screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  const handleRefresh = useCallback(async () => {
    if (!isOnline) {
      Alert.alert(t("offline.title"), t("offline.refreshDisabled"));
      return;
    }
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [isOnline, refetch, t]);

  const handleTestPress = useCallback((test: SubjectTestScore) => {
    trackEvent("test_pressed", { testId: test.id, subjectId });
    // Navigate to test detail if needed
  }, [trackEvent, subjectId]);

  const handleAssignmentPress = useCallback((assignment: SubjectAssignmentScore) => {
    trackEvent("assignment_pressed", { assignmentId: assignment.id, subjectId });
    // Navigate to assignment detail if needed
  }, [trackEvent, subjectId]);

  // === HELPER FUNCTIONS ===
  const getSubjectIcon = (icon?: string) => SUBJECT_ICONS[icon || "default"] || SUBJECT_ICONS.default;

  const getGradeColor = (grade: string) => GRADE_COLORS[grade] || colors.onSurface;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return colors.success;
    if (percentage >= 60) return colors.warning;
    return colors.error;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("status.loading")}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // === ERROR STATE ===
  if (error || !report) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("subjectReport.title", { defaultValue: "Subject Report" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("subjectReport.notFound", { defaultValue: "Report not found" })}
          </AppText>
          <AppButton label={t("actions.goBack")} onPress={handleBack} />
        </View>
      </SafeAreaView>
    );
  }

  const title = getLocalizedField(report, "title");


  // === SUCCESS STATE ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
          {title} - {t("subjectReport.report", { defaultValue: "Report" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        {(['overview', 'tests', 'assignments', 'remarks'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setSelectedTab(tab)}
          >
            <AppText style={[styles.tabText, { color: selectedTab === tab ? colors.primary : colors.onSurfaceVariant }]}>
              {t(`subjectReport.tabs.${tab}`, { defaultValue: tab.charAt(0).toUpperCase() + tab.slice(1) })}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
      >
        {selectedTab === 'overview' && (
          <>
            {/* Overall Grade Card */}
            <AppCard style={styles.gradeCard}>
              <View style={styles.gradeHeader}>
                <View style={[styles.subjectIcon, { backgroundColor: report.color ? `${report.color}20` : `${colors.primary}15` }]}>
                  <Icon name={getSubjectIcon(report.icon)} size={28} color={report.color || colors.primary} />
                </View>
                <View style={styles.gradeInfo}>
                  <AppText style={[styles.subjectTitle, { color: colors.onSurface }]}>{title}</AppText>
                  <AppText style={[styles.gradeSubtitle, { color: colors.onSurfaceVariant }]}>
                    {t("subjectReport.overallGrade", { defaultValue: "Overall Grade" })}
                  </AppText>
                </View>
                <View style={[styles.gradeBadge, { backgroundColor: `${getGradeColor(report.overall_grade)}20` }]}>
                  <AppText style={[styles.gradeText, { color: getGradeColor(report.overall_grade) }]}>
                    {report.overall_grade}
                  </AppText>
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <AppText style={[styles.statValue, { color: colors.onSurface }]}>{report.overall_percentage}%</AppText>
                  <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                    {t("subjectReport.percentage", { defaultValue: "Percentage" })}
                  </AppText>
                </View>
                {report.class_rank && (
                  <View style={styles.statItem}>
                    <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                      {report.class_rank}/{report.total_students}
                    </AppText>
                    <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                      {t("subjectReport.classRank", { defaultValue: "Class Rank" })}
                    </AppText>
                  </View>
                )}
                <View style={styles.statItem}>
                  <AppText style={[styles.statValue, { color: colors.onSurface }]}>{report.tests_taken}</AppText>
                  <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                    {t("subjectReport.testsTaken", { defaultValue: "Tests" })}
                  </AppText>
                </View>
              </View>
            </AppCard>

            {/* Term-wise Grades */}
            {report.grades.length > 0 && (
              <AppCard style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Icon name="calendar-check" size={20} color={colors.primary} />
                  <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                    {t("subjectReport.termGrades", { defaultValue: "Term-wise Grades" })}
                  </AppText>
                </View>
                {report.grades.map((grade, index) => (
                  <View
                    key={grade.id}
                    style={[styles.gradeRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}
                  >
                    <View style={styles.gradeRowLeft}>
                      <AppText style={[styles.termName, { color: colors.onSurface }]}>
                        {getLocalizedField(grade, "term")}
                      </AppText>
                      <AppText style={[styles.termMeta, { color: colors.onSurfaceVariant }]}>
                        {grade.credits} {t("subjectReport.credits", { defaultValue: "credits" })} • {grade.grade_points} GP
                      </AppText>
                    </View>
                    <View style={styles.gradeRowRight}>
                      <AppText style={[styles.termPercent, { color: getScoreColor(grade.percentage) }]}>
                        {grade.percentage}%
                      </AppText>
                      <View style={[styles.termGradeBadge, { backgroundColor: `${getGradeColor(grade.grade)}15` }]}>
                        <AppText style={[styles.termGradeText, { color: getGradeColor(grade.grade) }]}>
                          {grade.grade}
                        </AppText>
                      </View>
                    </View>
                  </View>
                ))}
              </AppCard>
            )}

            {/* Attendance Card */}
            <AppCard style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="calendar-account" size={20} color={colors.primary} />
                <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  {t("subjectReport.attendance", { defaultValue: "Attendance" })}
                </AppText>
              </View>
              <View style={styles.attendanceContent}>
                <View style={[styles.attendanceCircle, { borderColor: getScoreColor(report.attendance.percentage) }]}>
                  <AppText style={[styles.attendancePercent, { color: getScoreColor(report.attendance.percentage) }]}>
                    {report.attendance.percentage.toFixed(0)}%
                  </AppText>
                </View>
                <View style={styles.attendanceStats}>
                  <View style={styles.attendanceStat}>
                    <AppText style={[styles.attendanceValue, { color: colors.success }]}>{report.attendance.attended}</AppText>
                    <AppText style={[styles.attendanceLabel, { color: colors.onSurfaceVariant }]}>
                      {t("subjectReport.present", { defaultValue: "Present" })}
                    </AppText>
                  </View>
                  <View style={styles.attendanceStat}>
                    <AppText style={[styles.attendanceValue, { color: colors.warning }]}>{report.attendance.excused}</AppText>
                    <AppText style={[styles.attendanceLabel, { color: colors.onSurfaceVariant }]}>
                      {t("subjectReport.excused", { defaultValue: "Excused" })}
                    </AppText>
                  </View>
                  <View style={styles.attendanceStat}>
                    <AppText style={[styles.attendanceValue, { color: colors.error }]}>{report.attendance.unexcused}</AppText>
                    <AppText style={[styles.attendanceLabel, { color: colors.onSurfaceVariant }]}>
                      {t("subjectReport.absent", { defaultValue: "Absent" })}
                    </AppText>
                  </View>
                </View>
              </View>
              <AppText style={[styles.attendanceTotal, { color: colors.onSurfaceVariant }]}>
                {t("subjectReport.totalClasses", { defaultValue: "Total Classes" })}: {report.attendance.total_classes}
              </AppText>
            </AppCard>

            {/* Performance Summary */}
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: colors.surfaceVariant }]}>
                <Icon name="clipboard-check" size={22} color={colors.primary} />
                <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
                  {report.average_test_score.toFixed(1)}%
                </AppText>
                <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                  {t("subjectReport.avgTestScore", { defaultValue: "Avg Test Score" })}
                </AppText>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: colors.surfaceVariant }]}>
                <Icon name="clipboard-text" size={22} color={colors.tertiary} />
                <AppText style={[styles.summaryValue, { color: colors.onSurface }]}>
                  {report.average_assignment_score.toFixed(1)}%
                </AppText>
                <AppText style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                  {t("subjectReport.avgAssignment", { defaultValue: "Avg Assignment" })}
                </AppText>
              </View>
            </View>
          </>
        )}


        {selectedTab === 'tests' && (
          <>
            {report.test_scores.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="clipboard-check-outline" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {t("subjectReport.noTests", { defaultValue: "No tests taken yet" })}
                </AppText>
              </View>
            ) : (
              <AppCard style={styles.sectionCard}>
                {report.test_scores.map((test, index) => (
                  <TouchableOpacity
                    key={test.id}
                    style={[styles.testItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}
                    onPress={() => handleTestPress(test)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.testIcon, { backgroundColor: `${colors.primary}15` }]}>
                      <Icon name={TEST_ICONS[test.type] || "clipboard-text"} size={20} color={colors.primary} />
                    </View>
                    <View style={styles.testInfo}>
                      <AppText style={[styles.testTitle, { color: colors.onSurface }]}>
                        {getLocalizedField(test, "title")}
                      </AppText>
                      <View style={styles.testMeta}>
                        <AppText style={[styles.testDate, { color: colors.onSurfaceVariant }]}>
                          {formatDate(test.date)}
                        </AppText>
                        {test.class_average && (
                          <AppText style={[styles.testAvg, { color: colors.onSurfaceVariant }]}>
                            • {t("subjectReport.classAvg", { defaultValue: "Class Avg" })}: {test.class_average}%
                          </AppText>
                        )}
                      </View>
                    </View>
                    <View style={styles.testRight}>
                      <AppText style={[styles.testScore, { color: getScoreColor(test.percentage) }]}>
                        {test.score}/{test.max_score}
                      </AppText>
                      <AppText style={[styles.testPercent, { color: getScoreColor(test.percentage) }]}>
                        {test.percentage}%
                      </AppText>
                      {test.rank && (
                        <View style={[styles.rankBadge, { backgroundColor: colors.surfaceVariant }]}>
                          <AppText style={[styles.rankText, { color: colors.onSurfaceVariant }]}>
                            #{test.rank}
                          </AppText>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </AppCard>
            )}
          </>
        )}

        {selectedTab === 'assignments' && (
          <>
            {report.assignment_scores.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="clipboard-text-outline" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {t("subjectReport.noAssignments", { defaultValue: "No assignments yet" })}
                </AppText>
              </View>
            ) : (
              <AppCard style={styles.sectionCard}>
                {report.assignment_scores.map((assignment, index) => (
                  <TouchableOpacity
                    key={assignment.id}
                    style={[styles.assignmentItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}
                    onPress={() => handleAssignmentPress(assignment)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.assignmentIcon, { backgroundColor: `${colors.tertiary}15` }]}>
                      <Icon name={ASSIGNMENT_ICONS[assignment.type] || "clipboard-text"} size={20} color={colors.tertiary} />
                    </View>
                    <View style={styles.assignmentInfo}>
                      <AppText style={[styles.assignmentTitle, { color: colors.onSurface }]}>
                        {getLocalizedField(assignment, "title")}
                      </AppText>
                      <View style={styles.assignmentMeta}>
                        <View style={[styles.typeBadge, { backgroundColor: colors.surfaceVariant }]}>
                          <AppText style={[styles.typeText, { color: colors.onSurfaceVariant }]}>
                            {t(`subjectReport.assignmentType.${assignment.type}`, { defaultValue: assignment.type })}
                          </AppText>
                        </View>
                        {assignment.submitted_date && (
                          <AppText style={[styles.submitDate, { color: colors.onSurfaceVariant }]}>
                            {formatDate(assignment.submitted_date)}
                          </AppText>
                        )}
                      </View>
                      {assignment.feedback_en && (
                        <AppText style={[styles.feedback, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                          "{getLocalizedField(assignment, "feedback")}"
                        </AppText>
                      )}
                    </View>
                    <View style={styles.assignmentRight}>
                      <AppText style={[styles.assignmentScore, { color: getScoreColor((assignment.score / assignment.max_score) * 100) }]}>
                        {assignment.score}/{assignment.max_score}
                      </AppText>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: assignment.status === 'graded' ? `${colors.success}15` : assignment.status === 'late' ? `${colors.warning}15` : `${colors.error}15` }
                      ]}>
                        <AppText style={[
                          styles.statusText,
                          { color: assignment.status === 'graded' ? colors.success : assignment.status === 'late' ? colors.warning : colors.error }
                        ]}>
                          {t(`subjectReport.status.${assignment.status}`, { defaultValue: assignment.status })}
                        </AppText>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </AppCard>
            )}
          </>
        )}

        {selectedTab === 'remarks' && (
          <>
            {report.teacher_remarks.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="comment-text-outline" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {t("subjectReport.noRemarks", { defaultValue: "No teacher remarks yet" })}
                </AppText>
              </View>
            ) : (
              <AppCard style={styles.sectionCard}>
                {report.teacher_remarks.map((remark, index) => {
                  const remarkStyle = REMARK_STYLES[remark.type] || REMARK_STYLES.general;
                  return (
                    <View
                      key={remark.id}
                      style={[styles.remarkItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}
                    >
                      <View style={[styles.remarkIcon, { backgroundColor: `${remarkStyle.color}15` }]}>
                        <Icon name={remarkStyle.icon} size={20} color={remarkStyle.color} />
                      </View>
                      <View style={styles.remarkContent}>
                        <View style={styles.remarkHeader}>
                          <AppText style={[styles.remarkTeacher, { color: colors.onSurface }]}>
                            {remark.teacher_name}
                          </AppText>
                          <AppText style={[styles.remarkDate, { color: colors.onSurfaceVariant }]}>
                            {formatDate(remark.date)}
                          </AppText>
                        </View>
                        <AppText style={[styles.remarkText, { color: colors.onSurfaceVariant }]}>
                          {getLocalizedField(remark, "remark")}
                        </AppText>
                        <View style={[styles.remarkTypeBadge, { backgroundColor: `${remarkStyle.color}15` }]}>
                          <AppText style={[styles.remarkTypeText, { color: remarkStyle.color }]}>
                            {t(`subjectReport.remarkType.${remark.type}`, { defaultValue: remark.type })}
                          </AppText>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </AppCard>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, gap: 16 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 16, textAlign: "center", marginVertical: 12 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center", marginHorizontal: 8 },
  headerRight: { width: 32 },
  // Tab Bar
  tabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontSize: 12, fontWeight: "500" },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  // Grade Card
  gradeCard: { padding: 16 },
  gradeHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  subjectIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  gradeInfo: { flex: 1 },
  subjectTitle: { fontSize: 18, fontWeight: "700" },
  gradeSubtitle: { fontSize: 13, marginTop: 2 },
  gradeBadge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  gradeText: { fontSize: 18, fontWeight: "700" },
  statsRow: { flexDirection: "row", justifyContent: "space-around", paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E0E0E0" },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2 },
  // Section Card
  sectionCard: { padding: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  // Grade Row
  gradeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  gradeRowLeft: { flex: 1 },
  termName: { fontSize: 15, fontWeight: "500" },
  termMeta: { fontSize: 12, marginTop: 2 },
  gradeRowRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  termPercent: { fontSize: 15, fontWeight: "600" },
  termGradeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  termGradeText: { fontSize: 13, fontWeight: "600" },
  // Attendance
  attendanceContent: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 12 },
  attendanceCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, alignItems: "center", justifyContent: "center" },
  attendancePercent: { fontSize: 18, fontWeight: "700" },
  attendanceStats: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  attendanceStat: { alignItems: "center" },
  attendanceValue: { fontSize: 18, fontWeight: "700" },
  attendanceLabel: { fontSize: 11, marginTop: 2 },
  attendanceTotal: { fontSize: 12, textAlign: "center" },
  // Summary Grid
  summaryGrid: { flexDirection: "row", gap: 12 },
  summaryCard: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", gap: 6 },
  summaryValue: { fontSize: 18, fontWeight: "700" },
  summaryLabel: { fontSize: 11, textAlign: "center" },
  // Test Item
  testItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  testIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  testInfo: { flex: 1 },
  testTitle: { fontSize: 14, fontWeight: "500" },
  testMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  testDate: { fontSize: 12 },
  testAvg: { fontSize: 12 },
  testRight: { alignItems: "flex-end" },
  testScore: { fontSize: 14, fontWeight: "600" },
  testPercent: { fontSize: 12, marginTop: 2 },
  rankBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  rankText: { fontSize: 11, fontWeight: "500" },
  // Assignment Item
  assignmentItem: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, gap: 12 },
  assignmentIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  assignmentInfo: { flex: 1 },
  assignmentTitle: { fontSize: 14, fontWeight: "500" },
  assignmentMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typeText: { fontSize: 11 },
  submitDate: { fontSize: 12 },
  feedback: { fontSize: 12, fontStyle: "italic", marginTop: 6 },
  assignmentRight: { alignItems: "flex-end" },
  assignmentScore: { fontSize: 14, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: "500" },
  // Remark Item
  remarkItem: { flexDirection: "row", paddingVertical: 12, gap: 12 },
  remarkIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  remarkContent: { flex: 1 },
  remarkHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  remarkTeacher: { fontSize: 14, fontWeight: "600" },
  remarkDate: { fontSize: 12 },
  remarkText: { fontSize: 13, lineHeight: 20 },
  remarkTypeBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  remarkTypeText: { fontSize: 11, fontWeight: "500" },
  // Empty State
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14 },
  bottomSpacer: { height: 20 },
});
