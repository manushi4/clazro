/**
 * ChildStatsScreen - Fixed Screen
 *
 * Purpose: Display comprehensive statistics for a specific child
 * Type: Fixed (not widget-based)
 * Accessible from: child-detail, children-overview, parent-home widgets
 * Roles: parent
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
  Image,
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
  useChildStatsScreenQuery,
  PerformanceStat,
  RecentTest,
  SubjectScore,
  ActivityItem,
} from "../../hooks/queries/useChildStatsScreenQuery";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

// Grade colors
const GRADE_COLORS: Record<string, string> = {
  'A+': '#1B5E20', 'A': '#2E7D32', 'A-': '#388E3C',
  'B+': '#1565C0', 'B': '#1976D2', 'B-': '#1E88E5',
  'C+': '#F57C00', 'C': '#FB8C00', 'C-': '#FF9800',
  'D': '#E65100', 'F': '#C62828',
};

// Activity type icons
const ACTIVITY_ICONS: Record<string, string> = {
  test: 'clipboard-check',
  assignment: 'file-document',
  attendance: 'calendar-check',
  achievement: 'trophy',
  remark: 'star',
};

export const ChildStatsScreen: React.FC<Props> = ({
  screenId = "child-stats",
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
  const childId = route.params?.childId || route.params?.id || 'child-1';

  // === DATA ===
  const { data: stats, isLoading, error, refetch } = useChildStatsScreenQuery(childId);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'subjects' | 'tests' | 'activity'>('overview');

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { childId },
    });
  }, [screenId, childId]);

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

  const handleSubjectPress = useCallback((subject: SubjectScore) => {
    trackEvent("subject_pressed", { subjectId: subject.id, childId });
    navigation.navigate("subject-report", { subjectId: subject.id, childId });
  }, [navigation, trackEvent, childId]);

  const handleTestPress = useCallback((test: RecentTest) => {
    trackEvent("test_pressed", { testId: test.id, childId });
  }, [trackEvent, childId]);

  const handleViewReportCard = useCallback(() => {
    trackEvent("view_report_card", { childId });
    navigation.navigate("child-report-card", { childId });
  }, [navigation, trackEvent, childId]);

  const handleViewAttendance = useCallback(() => {
    trackEvent("view_attendance", { childId });
    navigation.navigate("child-attendance", { childId });
  }, [navigation, trackEvent, childId]);

  // === HELPER FUNCTIONS ===
  const getGradeColor = (grade: string) => GRADE_COLORS[grade] || colors.onSurface;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return colors.success;
    if (percentage >= 60) return colors.warning;
    return colors.error;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'minus';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return colors.success;
      case 'down': return colors.error;
      default: return colors.onSurfaceVariant;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
  if (error || !stats) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("childStats.title", { defaultValue: "Child Stats" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("childStats.notFound", { defaultValue: "Stats not found" })}
          </AppText>
          <AppButton label={t("actions.goBack")} onPress={handleBack} />
        </View>
      </SafeAreaView>
    );
  }


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
          {stats.child.name}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        {(['overview', 'subjects', 'tests', 'activity'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setSelectedTab(tab)}
          >
            <AppText style={[styles.tabText, { color: selectedTab === tab ? colors.primary : colors.onSurfaceVariant }]}>
              {t(`childStats.tabs.${tab}`, { defaultValue: tab.charAt(0).toUpperCase() + tab.slice(1) })}
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
            {/* Child Profile Card */}
            <AppCard style={styles.profileCard}>
              <View style={styles.profileHeader}>
                {stats.child.avatar_url ? (
                  <Image source={{ uri: stats.child.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryContainer }]}>
                    <Icon name="account" size={32} color={colors.primary} />
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <AppText style={[styles.childName, { color: colors.onSurface }]}>{stats.child.name}</AppText>
                  <AppText style={[styles.childMeta, { color: colors.onSurfaceVariant }]}>
                    {stats.child.grade} - {stats.child.section} • Roll #{stats.child.roll_number}
                  </AppText>
                  {stats.child.school_name && (
                    <AppText style={[styles.schoolName, { color: colors.onSurfaceVariant }]}>
                      {stats.child.school_name}
                    </AppText>
                  )}
                </View>
                <View style={[styles.gradeBadge, { backgroundColor: `${getGradeColor(stats.overall_grade)}20` }]}>
                  <AppText style={[styles.gradeText, { color: getGradeColor(stats.overall_grade) }]}>
                    {stats.overall_grade}
                  </AppText>
                </View>
              </View>

              {/* Rank Info */}
              {stats.class_rank && (
                <View style={[styles.rankRow, { borderTopColor: colors.outlineVariant }]}>
                  <View style={styles.rankItem}>
                    <Icon name="trophy" size={18} color={colors.warning} />
                    <AppText style={[styles.rankValue, { color: colors.onSurface }]}>
                      #{stats.class_rank}
                    </AppText>
                    <AppText style={[styles.rankLabel, { color: colors.onSurfaceVariant }]}>
                      {t("childStats.classRank", { defaultValue: "Class Rank" })}
                    </AppText>
                  </View>
                  <View style={styles.rankItem}>
                    <Icon name="percent" size={18} color={colors.success} />
                    <AppText style={[styles.rankValue, { color: colors.onSurface }]}>
                      {stats.overall_percentage}%
                    </AppText>
                    <AppText style={[styles.rankLabel, { color: colors.onSurfaceVariant }]}>
                      {t("childStats.overall", { defaultValue: "Overall" })}
                    </AppText>
                  </View>
                  <View style={styles.rankItem}>
                    <Icon name="account-group" size={18} color={colors.primary} />
                    <AppText style={[styles.rankValue, { color: colors.onSurface }]}>
                      {stats.total_students}
                    </AppText>
                    <AppText style={[styles.rankLabel, { color: colors.onSurfaceVariant }]}>
                      {t("childStats.students", { defaultValue: "Students" })}
                    </AppText>
                  </View>
                </View>
              )}
            </AppCard>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {stats.stats.map((stat, index) => (
                <View key={index} style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
                  <Icon name={stat.icon} size={22} color={stat.color} />
                  <AppText style={[styles.statValue, { color: colors.onSurface }]}>{stat.value}</AppText>
                  <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                    {getLocalizedField(stat, 'label')}
                  </AppText>
                  {stat.change !== undefined && stat.change !== 0 && (
                    <View style={styles.changeRow}>
                      <Icon
                        name={stat.changeType === 'positive' ? 'arrow-up' : 'arrow-down'}
                        size={12}
                        color={stat.changeType === 'positive' ? colors.success : colors.error}
                      />
                      <AppText style={[styles.changeText, { color: stat.changeType === 'positive' ? colors.success : colors.error }]}>
                        {Math.abs(stat.change)}
                      </AppText>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Attendance Summary */}
            <AppCard style={styles.sectionCard}>
              <TouchableOpacity style={styles.sectionHeader} onPress={handleViewAttendance}>
                <Icon name="calendar-check" size={20} color={colors.primary} />
                <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  {t("childStats.attendance", { defaultValue: "Attendance" })}
                </AppText>
                <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
              <View style={styles.attendanceContent}>
                <View style={[styles.attendanceCircle, { borderColor: getScoreColor(stats.attendance.percentage) }]}>
                  <AppText style={[styles.attendancePercent, { color: getScoreColor(stats.attendance.percentage) }]}>
                    {stats.attendance.percentage.toFixed(0)}%
                  </AppText>
                </View>
                <View style={styles.attendanceStats}>
                  <View style={styles.attendanceStat}>
                    <AppText style={[styles.attendanceValue, { color: colors.success }]}>{stats.attendance.present}</AppText>
                    <AppText style={[styles.attendanceLabel, { color: colors.onSurfaceVariant }]}>
                      {t("childStats.present", { defaultValue: "Present" })}
                    </AppText>
                  </View>
                  <View style={styles.attendanceStat}>
                    <AppText style={[styles.attendanceValue, { color: colors.error }]}>{stats.attendance.absent}</AppText>
                    <AppText style={[styles.attendanceLabel, { color: colors.onSurfaceVariant }]}>
                      {t("childStats.absent", { defaultValue: "Absent" })}
                    </AppText>
                  </View>
                  <View style={styles.attendanceStat}>
                    <AppText style={[styles.attendanceValue, { color: colors.warning }]}>{stats.attendance.late}</AppText>
                    <AppText style={[styles.attendanceLabel, { color: colors.onSurfaceVariant }]}>
                      {t("childStats.late", { defaultValue: "Late" })}
                    </AppText>
                  </View>
                </View>
              </View>
              {stats.attendance.streak > 0 && (
                <View style={[styles.streakBadge, { backgroundColor: `${colors.success}15` }]}>
                  <Icon name="fire" size={16} color={colors.success} />
                  <AppText style={[styles.streakText, { color: colors.success }]}>
                    {stats.attendance.streak} {t("childStats.dayStreak", { defaultValue: "day streak" })}
                  </AppText>
                </View>
              )}
            </AppCard>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <AppButton
                label={t("childStats.viewReportCard", { defaultValue: "Report Card" })}
                onPress={handleViewReportCard}
                variant="outline"
                icon="file-document"
                style={styles.actionButton}
              />
              <AppButton
                label={t("childStats.viewAttendance", { defaultValue: "Attendance" })}
                onPress={handleViewAttendance}
                variant="outline"
                icon="calendar"
                style={styles.actionButton}
              />
            </View>
          </>
        )}


        {selectedTab === 'subjects' && (
          <>
            {stats.subject_scores.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="book-open-variant" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {t("childStats.noSubjects", { defaultValue: "No subjects data" })}
                </AppText>
              </View>
            ) : (
              <AppCard style={styles.sectionCard}>
                {stats.subject_scores.map((subject, index) => (
                  <TouchableOpacity
                    key={subject.id}
                    style={[styles.subjectItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}
                    onPress={() => handleSubjectPress(subject)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.subjectIcon, { backgroundColor: `${subject.color}20` }]}>
                      <Icon name={subject.icon} size={22} color={subject.color} />
                    </View>
                    <View style={styles.subjectInfo}>
                      <AppText style={[styles.subjectName, { color: colors.onSurface }]}>
                        {getLocalizedField(subject, 'subject')}
                      </AppText>
                      <View style={styles.subjectMeta}>
                        <AppText style={[styles.subjectMetaText, { color: colors.onSurfaceVariant }]}>
                          {subject.tests_taken} {t("childStats.tests", { defaultValue: "tests" })}
                        </AppText>
                        <AppText style={[styles.subjectMetaText, { color: colors.onSurfaceVariant }]}>
                          • {subject.assignments_completed} {t("childStats.assignments", { defaultValue: "assignments" })}
                        </AppText>
                      </View>
                    </View>
                    <View style={styles.subjectRight}>
                      <AppText style={[styles.subjectScore, { color: getScoreColor(subject.current_score) }]}>
                        {subject.current_score}%
                      </AppText>
                      <View style={styles.trendRow}>
                        <Icon name={getTrendIcon(subject.trend)} size={14} color={getTrendColor(subject.trend)} />
                        {subject.previous_score && (
                          <AppText style={[styles.previousScore, { color: colors.onSurfaceVariant }]}>
                            {subject.previous_score}%
                          </AppText>
                        )}
                      </View>
                    </View>
                    <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                ))}
              </AppCard>
            )}
          </>
        )}

        {selectedTab === 'tests' && (
          <>
            {stats.recent_tests.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="clipboard-check-outline" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {t("childStats.noTests", { defaultValue: "No tests taken yet" })}
                </AppText>
              </View>
            ) : (
              <AppCard style={styles.sectionCard}>
                {stats.recent_tests.map((test, index) => (
                  <TouchableOpacity
                    key={test.id}
                    style={[styles.testItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}
                    onPress={() => handleTestPress(test)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.testInfo}>
                      <AppText style={[styles.testTitle, { color: colors.onSurface }]}>
                        {getLocalizedField(test, 'title')}
                      </AppText>
                      <View style={styles.testMeta}>
                        <AppText style={[styles.testSubject, { color: colors.primary }]}>
                          {getLocalizedField(test, 'subject')}
                        </AppText>
                        <AppText style={[styles.testDate, { color: colors.onSurfaceVariant }]}>
                          • {formatDate(test.date)}
                        </AppText>
                      </View>
                      {test.class_average && (
                        <AppText style={[styles.classAvg, { color: colors.onSurfaceVariant }]}>
                          {t("childStats.classAvg", { defaultValue: "Class Avg" })}: {test.class_average}%
                        </AppText>
                      )}
                    </View>
                    <View style={styles.testRight}>
                      <AppText style={[styles.testScore, { color: getScoreColor(test.percentage) }]}>
                        {test.score}/{test.max_score}
                      </AppText>
                      <View style={[styles.testGradeBadge, { backgroundColor: `${getGradeColor(test.grade)}20` }]}>
                        <AppText style={[styles.testGradeText, { color: getGradeColor(test.grade) }]}>
                          {test.grade}
                        </AppText>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </AppCard>
            )}
          </>
        )}

        {selectedTab === 'activity' && (
          <>
            {stats.recent_activities.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="history" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {t("childStats.noActivity", { defaultValue: "No recent activity" })}
                </AppText>
              </View>
            ) : (
              <View style={styles.timelineContainer}>
                <View style={[styles.timelineLine, { backgroundColor: colors.outlineVariant }]} />
                {stats.recent_activities.map((activity, index) => (
                  <View key={activity.id} style={styles.activityItem}>
                    <View style={[styles.activityDot, { backgroundColor: activity.color, borderColor: colors.background }]}>
                      <Icon name={activity.icon} size={14} color="#fff" />
                    </View>
                    <View style={[styles.activityContent, { backgroundColor: colors.surfaceVariant }]}>
                      <AppText style={[styles.activityTitle, { color: colors.onSurface }]}>
                        {getLocalizedField(activity, 'title')}
                      </AppText>
                      {activity.description_en && (
                        <AppText style={[styles.activityDesc, { color: colors.onSurfaceVariant }]}>
                          {getLocalizedField(activity, 'description')}
                        </AppText>
                      )}
                      <AppText style={[styles.activityDate, { color: colors.onSurfaceVariant }]}>
                        {formatDate(activity.date)}
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>
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
  // Profile Card
  profileCard: { padding: 16 },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  profileInfo: { flex: 1 },
  childName: { fontSize: 18, fontWeight: "700" },
  childMeta: { fontSize: 13, marginTop: 2 },
  schoolName: { fontSize: 12, marginTop: 2 },
  gradeBadge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  gradeText: { fontSize: 18, fontWeight: "700" },
  rankRow: { flexDirection: "row", justifyContent: "space-around", paddingTop: 14, marginTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  rankItem: { alignItems: "center", gap: 4 },
  rankValue: { fontSize: 16, fontWeight: "700" },
  rankLabel: { fontSize: 10 },
  // Stats Grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "48%", padding: 14, borderRadius: 12, alignItems: "center", gap: 6 },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 11, textAlign: "center" },
  changeRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  changeText: { fontSize: 11, fontWeight: "500" },
  // Section Card
  sectionCard: { padding: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600", flex: 1 },
  // Attendance
  attendanceContent: { flexDirection: "row", alignItems: "center", gap: 20 },
  attendanceCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, alignItems: "center", justifyContent: "center" },
  attendancePercent: { fontSize: 18, fontWeight: "700" },
  attendanceStats: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  attendanceStat: { alignItems: "center" },
  attendanceValue: { fontSize: 18, fontWeight: "700" },
  attendanceLabel: { fontSize: 11, marginTop: 2 },
  streakBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, marginTop: 12, borderRadius: 8 },
  streakText: { fontSize: 13, fontWeight: "600" },
  // Quick Actions
  quickActions: { flexDirection: "row", gap: 12 },
  actionButton: { flex: 1 },
  // Subject Item
  subjectItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  subjectIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  subjectInfo: { flex: 1 },
  subjectName: { fontSize: 15, fontWeight: "600" },
  subjectMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  subjectMetaText: { fontSize: 12 },
  subjectRight: { alignItems: "flex-end", marginRight: 8 },
  subjectScore: { fontSize: 16, fontWeight: "700" },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  previousScore: { fontSize: 11 },
  // Test Item
  testItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  testInfo: { flex: 1 },
  testTitle: { fontSize: 14, fontWeight: "600" },
  testMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  testSubject: { fontSize: 12, fontWeight: "500" },
  testDate: { fontSize: 12 },
  classAvg: { fontSize: 11, marginTop: 4 },
  testRight: { alignItems: "flex-end" },
  testScore: { fontSize: 14, fontWeight: "600" },
  testGradeBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  testGradeText: { fontSize: 12, fontWeight: "600" },
  // Activity Timeline
  timelineContainer: { position: "relative", paddingLeft: 20 },
  timelineLine: { position: "absolute", left: 13, top: 16, bottom: 16, width: 2, borderRadius: 1 },
  activityItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  activityDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 3, marginRight: 12, marginLeft: -7 },
  activityContent: { flex: 1, padding: 12, borderRadius: 10 },
  activityTitle: { fontSize: 14, fontWeight: "500" },
  activityDesc: { fontSize: 12, marginTop: 4 },
  activityDate: { fontSize: 11, marginTop: 6 },
  // Empty State
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14 },
  bottomSpacer: { height: 20 },
});
