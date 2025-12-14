/**
 * SubjectDetailScreen - Fixed Screen
 *
 * Purpose: Display comprehensive details for a specific subject
 * Type: Fixed (not widget-based)
 * Accessible from: child-subjects, subject-progress, subject widgets
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
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";
import { useBranding } from "../../context/BrandingContext";

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
  useSubjectDetailScreenQuery,
  SubjectChapter,
  SubjectAssignment,
  SubjectResource,
} from "../../hooks/queries/useSubjectDetailScreenQuery";

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
  music: "music",
  palette: "palette",
  default: "book-education",
};

// Resource type icons
const RESOURCE_ICONS: Record<string, string> = {
  pdf: "file-pdf-box",
  video: "play-circle",
  link: "link-variant",
  document: "file-document",
};

// Assignment type icons
const ASSIGNMENT_ICONS: Record<string, string> = {
  homework: "clipboard-text",
  project: "folder-star",
  quiz: "clipboard-check",
  test: "school",
};

// Status colors
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FFF3E0", text: "#E65100" },
  submitted: { bg: "#E3F2FD", text: "#1565C0" },
  graded: { bg: "#E8F5E9", text: "#2E7D32" },
  overdue: { bg: "#FFEBEE", text: "#C62828" },
};


export const SubjectDetailScreen: React.FC<Props> = ({
  screenId = "subject-detail",
  role,
  navigation: navProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = useRoute<any>();

  // Get params from route
  const subjectId = route.params?.subjectId || route.params?.id;
  const childId = route.params?.childId;

  // === DATA ===
  const { data: subject, isLoading, error, refetch } = useSubjectDetailScreenQuery(subjectId, childId);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'chapters' | 'assignments' | 'resources'>('overview');

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
      Alert.alert(
        t("offline.title", { defaultValue: "You're Offline" }),
        t("offline.refreshDisabled", { defaultValue: "Cannot refresh while offline" })
      );
      return;
    }
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [isOnline, refetch, t]);

  const handleChapterPress = useCallback((chapter: SubjectChapter) => {
    if (chapter.is_locked) {
      Alert.alert(
        t("subjectDetail.chapterLocked", { defaultValue: "Chapter Locked" }),
        t("subjectDetail.completePrerequisite", { defaultValue: "Complete previous chapters to unlock" })
      );
      return;
    }
    trackEvent("chapter_pressed", { chapterId: chapter.id, subjectId });
    // Navigate to chapter detail
  }, [trackEvent, subjectId, t]);

  const handleAssignmentPress = useCallback((assignment: SubjectAssignment) => {
    trackEvent("assignment_pressed", { assignmentId: assignment.id, subjectId });
    // Navigate to assignment detail
  }, [trackEvent, subjectId]);

  const handleResourcePress = useCallback((resource: SubjectResource) => {
    trackEvent("resource_pressed", { resourceId: resource.id, type: resource.type });
    if (resource.url) {
      Linking.openURL(resource.url).catch(() => {
        Alert.alert(t("errors.title"), t("errors.openUrl"));
      });
    } else {
      Alert.alert(
        t("subjectDetail.resourceTitle", { defaultValue: "Resource" }),
        t("subjectDetail.resourceComingSoon", { defaultValue: "Resource viewer coming soon" })
      );
    }
  }, [trackEvent, t]);

  const handleViewProgress = useCallback(() => {
    trackEvent("view_progress_pressed", { subjectId });
    navigation.navigate("subject-progress", { subjectId, childId });
  }, [navigation, trackEvent, subjectId, childId]);

  const handleViewPerformance = useCallback(() => {
    trackEvent("view_performance_pressed", { subjectId });
    navigation.navigate("subject-performance", { subjectId, childId });
  }, [navigation, trackEvent, subjectId, childId]);

  const handleContactTeacher = useCallback(() => {
    if (!subject?.teacher?.email) return;
    trackEvent("contact_teacher_pressed", { subjectId });
    Linking.openURL(`mailto:${subject.teacher.email}`).catch(() => {
      Alert.alert(t("errors.title"), t("errors.openUrl"));
    });
  }, [subject, trackEvent, subjectId, t]);

  // === HELPER FUNCTIONS ===
  const getSubjectIcon = (icon?: string) => SUBJECT_ICONS[icon || "default"] || SUBJECT_ICONS.default;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return colors.success;
    if (percentage >= 50) return colors.warning;
    return colors.error;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getDaysUntilDue = (dateString: string) => {
    const due = new Date(dateString);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("status.loading", { defaultValue: "Loading..." })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // === ERROR STATE ===
  if (error || !subject) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("subjectDetail.title", { defaultValue: "Subject Details" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("subjectDetail.notFound", { defaultValue: "Subject not found" })}
          </AppText>
          <AppButton label={t("actions.goBack", { defaultValue: "Go Back" })} onPress={handleBack} />
        </View>
      </SafeAreaView>
    );
  }

  const title = getLocalizedField(subject, "title");
  const description = getLocalizedField(subject, "description");


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
          {title}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        {(['overview', 'chapters', 'assignments', 'resources'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setSelectedTab(tab)}
          >
            <AppText style={[styles.tabText, { color: selectedTab === tab ? colors.primary : colors.onSurfaceVariant }]}>
              {t(`subjectDetail.tabs.${tab}`, { defaultValue: tab.charAt(0).toUpperCase() + tab.slice(1) })}
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
            {/* Subject Header Card */}
            <AppCard style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <View style={[styles.subjectIcon, { backgroundColor: subject.color ? `${subject.color}20` : `${colors.primary}15` }]}>
                  <Icon name={getSubjectIcon(subject.icon)} size={32} color={subject.color || colors.primary} />
                </View>
                <View style={styles.subjectInfo}>
                  <AppText style={[styles.subjectTitle, { color: colors.onSurface }]}>{title}</AppText>
                  {description && (
                    <AppText style={[styles.subjectDesc, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                      {description}
                    </AppText>
                  )}
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <AppText style={[styles.progressLabel, { color: colors.onSurfaceVariant }]}>
                    {t("subjectDetail.overallProgress", { defaultValue: "Overall Progress" })}
                  </AppText>
                  <AppText style={[styles.progressValue, { color: getProgressColor(subject.progress_percentage) }]}>
                    {subject.progress_percentage}%
                  </AppText>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[styles.progressFill, { backgroundColor: getProgressColor(subject.progress_percentage), width: `${subject.progress_percentage}%` }]}
                  />
                </View>
              </View>
            </AppCard>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]} onPress={handleViewProgress}>
                <Icon name="book-check" size={22} color={colors.primary} />
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>
                  {subject.chapters_completed}/{subject.total_chapters}
                </AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {t("subjectDetail.chapters", { defaultValue: "Chapters" })}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]} onPress={handleViewPerformance}>
                <Icon name="percent" size={22} color={colors.success} />
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>{subject.average_score}%</AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {t("subjectDetail.avgScore", { defaultValue: "Avg Score" })}
                </AppText>
              </TouchableOpacity>

              <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
                <Icon name="clock-outline" size={22} color={colors.tertiary} />
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>{subject.hours_studied.toFixed(1)}h</AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {t("subjectDetail.studied", { defaultValue: "Studied" })}
                </AppText>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
                <Icon name="clipboard-alert" size={22} color={colors.warning} />
                <AppText style={[styles.statValue, { color: colors.onSurface }]}>{subject.assignments_pending}</AppText>
                <AppText style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  {t("subjectDetail.pending", { defaultValue: "Pending" })}
                </AppText>
              </View>
            </View>

            {/* Next Class */}
            {subject.next_class && (
              <AppCard style={styles.nextClassCard}>
                <View style={styles.sectionHeader}>
                  <Icon name="calendar-clock" size={20} color={colors.primary} />
                  <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                    {t("subjectDetail.nextClass", { defaultValue: "Next Class" })}
                  </AppText>
                </View>
                <View style={styles.nextClassContent}>
                  <View style={styles.nextClassTime}>
                    <AppText style={[styles.nextClassDate, { color: colors.onSurface }]}>
                      {formatDate(subject.next_class.date)}
                    </AppText>
                    <AppText style={[styles.nextClassHour, { color: colors.primary }]}>
                      {subject.next_class.time}
                    </AppText>
                  </View>
                  {subject.next_class.topic_en && (
                    <AppText style={[styles.nextClassTopic, { color: colors.onSurfaceVariant }]}>
                      {getLocalizedField(subject.next_class, "topic")}
                    </AppText>
                  )}
                </View>
              </AppCard>
            )}

            {/* Teacher Card */}
            {subject.teacher && (
              <AppCard style={styles.teacherCard}>
                <View style={styles.sectionHeader}>
                  <Icon name="account-tie" size={20} color={colors.primary} />
                  <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                    {t("subjectDetail.teacher", { defaultValue: "Teacher" })}
                  </AppText>
                </View>
                <View style={styles.teacherContent}>
                  {subject.teacher.avatar_url ? (
                    <Image source={{ uri: subject.teacher.avatar_url }} style={styles.teacherAvatar} />
                  ) : (
                    <View style={[styles.teacherAvatarPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
                      <Icon name="account" size={24} color={colors.onSurfaceVariant} />
                    </View>
                  )}
                  <View style={styles.teacherInfo}>
                    <AppText style={[styles.teacherName, { color: colors.onSurface }]}>{subject.teacher.name}</AppText>
                    {subject.teacher.email && (
                      <AppText style={[styles.teacherEmail, { color: colors.onSurfaceVariant }]}>{subject.teacher.email}</AppText>
                    )}
                  </View>
                  {subject.teacher.email && (
                    <TouchableOpacity style={[styles.contactButton, { backgroundColor: `${colors.primary}15` }]} onPress={handleContactTeacher}>
                      <Icon name="email-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </AppCard>
            )}

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <AppButton
                label={t("subjectDetail.viewProgress", { defaultValue: "View Progress" })}
                onPress={handleViewProgress}
                variant="outline"
                icon="chart-line"
                style={styles.actionButton}
              />
              <AppButton
                label={t("subjectDetail.viewPerformance", { defaultValue: "View Performance" })}
                onPress={handleViewPerformance}
                variant="outline"
                icon="chart-bar"
                style={styles.actionButton}
              />
            </View>
          </>
        )}


        {selectedTab === 'chapters' && (
          <>
            {subject.chapters.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="book-open-page-variant" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {t("subjectDetail.noChapters", { defaultValue: "No chapters available" })}
                </AppText>
              </View>
            ) : (
              <AppCard style={styles.sectionCard}>
                {subject.chapters.map((chapter, index) => {
                  const chapterProgress = chapter.total_lessons > 0
                    ? Math.round((chapter.completed_lessons / chapter.total_lessons) * 100)
                    : 0;
                  return (
                    <TouchableOpacity
                      key={chapter.id}
                      style={[styles.chapterItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}
                      onPress={() => handleChapterPress(chapter)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.chapterNumber, { backgroundColor: chapter.is_locked ? colors.surfaceVariant : `${colors.primary}15` }]}>
                        {chapter.is_locked ? (
                          <Icon name="lock" size={16} color={colors.onSurfaceVariant} />
                        ) : (
                          <AppText style={[styles.chapterNumberText, { color: colors.primary }]}>{chapter.order_index}</AppText>
                        )}
                      </View>
                      <View style={styles.chapterInfo}>
                        <AppText style={[styles.chapterTitle, { color: chapter.is_locked ? colors.onSurfaceVariant : colors.onSurface }]}>
                          {getLocalizedField(chapter, "title")}
                        </AppText>
                        <View style={styles.chapterMeta}>
                          <AppText style={[styles.chapterMetaText, { color: colors.onSurfaceVariant }]}>
                            {chapter.completed_lessons}/{chapter.total_lessons} {t("subjectDetail.lessons", { defaultValue: "lessons" })}
                          </AppText>
                          <AppText style={[styles.chapterMetaText, { color: colors.onSurfaceVariant }]}>
                            • {formatDuration(chapter.duration_minutes)}
                          </AppText>
                        </View>
                        {!chapter.is_locked && (
                          <View style={[styles.chapterProgressBar, { backgroundColor: colors.surfaceVariant }]}>
                            <View style={[styles.chapterProgressFill, { width: `${chapterProgress}%`, backgroundColor: getProgressColor(chapterProgress) }]} />
                          </View>
                        )}
                      </View>
                      <View style={styles.chapterRight}>
                        {!chapter.is_locked && (
                          <AppText style={[styles.chapterPercent, { color: getProgressColor(chapterProgress) }]}>{chapterProgress}%</AppText>
                        )}
                        <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </AppCard>
            )}
          </>
        )}

        {selectedTab === 'assignments' && (
          <>
            {subject.assignments.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="clipboard-check-outline" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {t("subjectDetail.noAssignments", { defaultValue: "No assignments yet" })}
                </AppText>
              </View>
            ) : (
              <AppCard style={styles.sectionCard}>
                {subject.assignments.map((assignment, index) => {
                  const statusStyle = STATUS_COLORS[assignment.status] || STATUS_COLORS.pending;
                  const daysUntil = getDaysUntilDue(assignment.due_date);
                  return (
                    <TouchableOpacity
                      key={assignment.id}
                      style={[styles.assignmentItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}
                      onPress={() => handleAssignmentPress(assignment)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.assignmentIcon, { backgroundColor: `${colors.primary}15` }]}>
                        <Icon name={ASSIGNMENT_ICONS[assignment.type] || "clipboard-text"} size={20} color={colors.primary} />
                      </View>
                      <View style={styles.assignmentInfo}>
                        <AppText style={[styles.assignmentTitle, { color: colors.onSurface }]}>
                          {getLocalizedField(assignment, "title")}
                        </AppText>
                        <View style={styles.assignmentMeta}>
                          <View style={[styles.typeBadge, { backgroundColor: colors.surfaceVariant }]}>
                            <AppText style={[styles.typeText, { color: colors.onSurfaceVariant }]}>
                              {t(`subjectDetail.assignmentType.${assignment.type}`, { defaultValue: assignment.type })}
                            </AppText>
                          </View>
                          <AppText style={[styles.dueText, { color: daysUntil < 0 ? colors.error : colors.onSurfaceVariant }]}>
                            {daysUntil < 0
                              ? t("subjectDetail.overdue", { defaultValue: "Overdue" })
                              : daysUntil === 0
                              ? t("subjectDetail.dueToday", { defaultValue: "Due today" })
                              : t("subjectDetail.dueDays", { days: daysUntil, defaultValue: `Due in ${daysUntil} days` })}
                          </AppText>
                        </View>
                      </View>
                      <View style={styles.assignmentRight}>
                        {assignment.status === 'graded' && assignment.score !== undefined ? (
                          <AppText style={[styles.scoreText, { color: colors.success }]}>
                            {assignment.score}/{assignment.max_score}
                          </AppText>
                        ) : (
                          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                            <AppText style={[styles.statusText, { color: statusStyle.text }]}>
                              {t(`subjectDetail.status.${assignment.status}`, { defaultValue: assignment.status })}
                            </AppText>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </AppCard>
            )}
          </>
        )}

        {selectedTab === 'resources' && (
          <>
            {subject.resources.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="folder-open" size={48} color={colors.onSurfaceVariant} />
                <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {t("subjectDetail.noResources", { defaultValue: "No resources available" })}
                </AppText>
              </View>
            ) : (
              <AppCard style={styles.sectionCard}>
                {subject.resources.map((resource, index) => (
                  <TouchableOpacity
                    key={resource.id}
                    style={[styles.resourceItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}
                    onPress={() => handleResourcePress(resource)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.resourceIcon, { backgroundColor: `${colors.tertiary}15` }]}>
                      <Icon name={RESOURCE_ICONS[resource.type] || "file"} size={22} color={colors.tertiary} />
                    </View>
                    <View style={styles.resourceInfo}>
                      <AppText style={[styles.resourceTitle, { color: colors.onSurface }]}>
                        {getLocalizedField(resource, "title")}
                      </AppText>
                      <View style={styles.resourceMeta}>
                        <AppText style={[styles.resourceType, { color: colors.onSurfaceVariant }]}>
                          {resource.type.toUpperCase()}
                        </AppText>
                        {resource.size && (
                          <AppText style={[styles.resourceSize, { color: colors.onSurfaceVariant }]}>
                            • {resource.size}
                          </AppText>
                        )}
                      </View>
                    </View>
                    <Icon name="download" size={20} color={colors.primary} />
                  </TouchableOpacity>
                ))}
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
  tabText: { fontSize: 13, fontWeight: "500" },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  // Subject Card
  subjectCard: { padding: 16 },
  subjectHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  subjectIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  subjectInfo: { flex: 1 },
  subjectTitle: { fontSize: 20, fontWeight: "700" },
  subjectDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  progressSection: { marginTop: 8 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 13 },
  progressValue: { fontSize: 16, fontWeight: "700" },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  // Stats Grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "48%", padding: 14, borderRadius: 12, alignItems: "center", gap: 4 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 10, textTransform: "uppercase", textAlign: "center" },
  // Next Class Card
  nextClassCard: { padding: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  nextClassContent: { flexDirection: "row", alignItems: "center", gap: 16 },
  nextClassTime: { alignItems: "center" },
  nextClassDate: { fontSize: 14, fontWeight: "600" },
  nextClassHour: { fontSize: 13, fontWeight: "500", marginTop: 2 },
  nextClassTopic: { flex: 1, fontSize: 13 },
  // Teacher Card
  teacherCard: { padding: 16 },
  teacherContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  teacherAvatar: { width: 48, height: 48, borderRadius: 24 },
  teacherAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  teacherInfo: { flex: 1 },
  teacherName: { fontSize: 15, fontWeight: "600" },
  teacherEmail: { fontSize: 12, marginTop: 2 },
  contactButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  // Quick Actions
  quickActions: { flexDirection: "row", gap: 12 },
  actionButton: { flex: 1 },
  // Section Card
  sectionCard: { padding: 0, overflow: "hidden" },
  // Chapter Item
  chapterItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  chapterNumber: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  chapterNumberText: { fontSize: 14, fontWeight: "700" },
  chapterInfo: { flex: 1 },
  chapterTitle: { fontSize: 14, fontWeight: "500" },
  chapterMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  chapterMetaText: { fontSize: 12 },
  chapterProgressBar: { height: 4, borderRadius: 2, marginTop: 8, overflow: "hidden" },
  chapterProgressFill: { height: "100%", borderRadius: 2 },
  chapterRight: { alignItems: "flex-end", gap: 4 },
  chapterPercent: { fontSize: 13, fontWeight: "600" },
  // Assignment Item
  assignmentItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  assignmentIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  assignmentInfo: { flex: 1 },
  assignmentTitle: { fontSize: 14, fontWeight: "500" },
  assignmentMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  dueText: { fontSize: 12 },
  assignmentRight: { alignItems: "flex-end" },
  scoreText: { fontSize: 15, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  // Resource Item
  resourceItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  resourceIcon: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  resourceInfo: { flex: 1 },
  resourceTitle: { fontSize: 14, fontWeight: "500" },
  resourceMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  resourceType: { fontSize: 11, fontWeight: "600" },
  resourceSize: { fontSize: 11 },
  // Empty State
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14 },
  bottomSpacer: { height: 32 },
});

export default SubjectDetailScreen;
