/**
 * TestDetailScreen - Fixed Screen
 *
 * Purpose: Display test details with start test functionality
 * Type: Fixed (not widget-based)
 * Accessible from: AssignmentsTestsWidget, test-center
 * Roles: student, parent
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
import { useBranding } from "../../context/BrandingContext";

// Analytics & Error Tracking
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Data Hooks
import { useTestDetailQuery } from "../../hooks/queries/useTestDetailQuery";

// Localization helper
import { getLocalizedField } from "../../utils/getLocalizedField";


// Mock test data for demo items
const MOCK_TESTS: Record<string, any> = {
  "mock-test-1": {
    id: "mock-test-1",
    title_en: "Mathematics Unit Test",
    description_en: "Unit test covering algebra and geometry concepts from chapters 5-8.",
    instructions_en: "Read each question carefully. Show all your work for partial credit. No calculators allowed.",
    scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 60,
    max_score: 100,
    total_questions: 25,
    passing_score: 40,
    test_type: "unit_test",
    allow_late_submission: false,
    show_answers_after: true,
    subject: { title_en: "Mathematics", icon: "calculator", color: "#4CAF50" },
    teacher: { display_name: "Dr. Sharma", first_name: "Rajesh", last_name: "Sharma" },
  },
  "mock-test-2": {
    id: "mock-test-2",
    title_en: "Physics Quiz",
    description_en: "Quick quiz on Newton's Laws of Motion.",
    instructions_en: "Multiple choice questions. Select the best answer.",
    scheduled_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 30,
    max_score: 50,
    total_questions: 15,
    passing_score: 20,
    test_type: "quiz",
    allow_late_submission: true,
    show_answers_after: true,
    subject: { title_en: "Physics", icon: "atom", color: "#2196F3" },
    teacher: { display_name: "Prof. Verma", first_name: "Anita", last_name: "Verma" },
  },
};

function getMockTestData(mockId: string): any {
  return MOCK_TESTS[mockId] || {
    id: mockId,
    title_en: "Test",
    description_en: "This is a demo test. Real test data will be shown when connected to the database.",
    instructions_en: "Follow the instructions provided.",
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 45,
    max_score: 100,
    total_questions: 20,
    passing_score: 40,
    test_type: "quiz",
    subject: { title_en: "Demo Subject", icon: "school", color: "#607D8B" },
  };
}

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  route?: any;
  onFocused?: () => void;
};


export const TestDetailScreen: React.FC<Props> = ({
  screenId = "test-detail",
  role,
  navigation: navProp,
  route: routeProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t, i18n } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const routeHook = useRoute<any>();
  const route = routeProp || routeHook;

  // Get test ID from route params
  const testId = route.params?.testId || route.params?.id;

  // Check if this is a mock item
  const isMockItem = testId?.startsWith("mock-");

  // === DATA ===
  const { data: dbTest, isLoading, error, refetch } = useTestDetailQuery(isMockItem ? undefined : testId);
  
  // Use mock data if it's a mock item, otherwise use real data
  const test = isMockItem ? getMockTestData(testId) : dbTest;
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState<string>("");

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { testId },
    });
  }, [screenId, testId]);

  // Countdown timer for upcoming tests
  useEffect(() => {
    if (!test?.scheduled_at) return;

    const updateCountdown = () => {
      const now = new Date();
      const scheduled = new Date(test.scheduled_at);
      const diff = scheduled.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setCountdown(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`);
      } else {
        setCountdown(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [test]);


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

  const handleStartTest = useCallback(() => {
    if (!isOnline) {
      Alert.alert(
        t("offline.title", { defaultValue: "You're Offline" }),
        t("testDetail.offlineStart", { defaultValue: "You need internet connection to start the test" })
      );
      return;
    }

    trackEvent("start_test", { testId: test?.id, testType: test?.test_type });

    // Show confirmation dialog
    Alert.alert(
      t("testDetail.startConfirmTitle", { defaultValue: "Start Test?" }),
      t("testDetail.startConfirmMessage", { 
        defaultValue: "Once you start, you will have {{duration}} minutes to complete the test. Are you ready?",
        duration: test?.duration_minutes || 0
      }),
      [
        { text: t("actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
        { 
          text: t("testDetail.startNow", { defaultValue: "Start Now" }), 
          onPress: () => {
            // Navigate to test attempt screen
            // studentId will be obtained from useDemoUser in TestAttemptScreen
            navigation.navigate("test-attempt", {
              testId: test?.id,
            });
          }
        },
      ]
    );
  }, [test, isOnline, trackEvent, t, navigation, route.params?.studentId]);

  const handleViewTeacher = useCallback(() => {
    if (!test?.teacher_id) return;
    trackEvent("view_teacher_pressed", { testId: test.id, teacherId: test.teacher_id });
    navigation.navigate("teacher-detail", { teacherId: test.teacher_id });
  }, [test, navigation, trackEvent]);


  // === HELPER FUNCTIONS ===
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === "hi" ? "hi-IN" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === "hi" ? "hi-IN" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(i18n.language === "hi" ? "hi-IN" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTestTypeLabel = (type: string | null) => {
    switch (type) {
      case "quiz": return t("testDetail.types.quiz", { defaultValue: "Quiz" });
      case "unit_test": return t("testDetail.types.unitTest", { defaultValue: "Unit Test" });
      case "final": return t("testDetail.types.final", { defaultValue: "Final Exam" });
      case "practice": return t("testDetail.types.practice", { defaultValue: "Practice Test" });
      case "mock": return t("testDetail.types.mock", { defaultValue: "Mock Test" });
      default: return t("testDetail.types.test", { defaultValue: "Test" });
    }
  };

  const getTestTypeIcon = (type: string | null) => {
    switch (type) {
      case "quiz": return "help-circle";
      case "unit_test": return "file-document";
      case "final": return "school";
      case "practice": return "pencil";
      case "mock": return "clipboard-check";
      default: return "clipboard-text";
    }
  };

  const isTestUpcoming = () => {
    if (!test?.scheduled_at) return false;
    return new Date(test.scheduled_at) > new Date();
  };

  const isTestAvailable = () => {
    if (!test?.scheduled_at) return true;
    const now = new Date();
    const scheduled = new Date(test.scheduled_at);
    // Test is available if scheduled time has passed
    return now >= scheduled;
  };


  // === LOADING STATE ===
  if (isLoading && !isMockItem) {
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
  if ((error || !test) && !isMockItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("testDetail.title", { defaultValue: "Test Details" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="clipboard-alert" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("testDetail.notFound", { defaultValue: "Test not found" })}
          </AppText>
          <AppButton
            label={t("actions.goBack", { defaultValue: "Go Back" })}
            onPress={handleBack}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  const title = getLocalizedField(test, "title") || test.title_en;
  const description = getLocalizedField(test, "description");
  const instructions = getLocalizedField(test, "instructions");
  const subjectName = test.subject
    ? getLocalizedField(test.subject, "title") || test.subject.title_en
    : null;
  const teacherName = test.teacher
    ? test.teacher.display_name ||
      `${test.teacher.first_name || ""} ${test.teacher.last_name || ""}`.trim()
    : null;

  const upcoming = isTestUpcoming();
  const available = isTestAvailable();


  // === SUCCESS STATE ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("testDetail.title", { defaultValue: "Test Details" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Countdown Banner for Upcoming */}
        {upcoming && countdown && (
          <View style={[styles.countdownBanner, { backgroundColor: colors.primaryContainer }]}>
            <Icon name="clock-outline" size={20} color={colors.primary} />
            <AppText style={[styles.countdownText, { color: colors.primary }]}>
              {t("testDetail.startsIn", { defaultValue: "Starts in" })} {countdown}
            </AppText>
          </View>
        )}

        {/* Available Banner */}
        {available && !upcoming && (
          <View style={[styles.availableBanner, { backgroundColor: "#DCFCE7" }]}>
            <Icon name="check-circle" size={20} color="#16A34A" />
            <AppText style={[styles.availableText, { color: "#16A34A" }]}>
              {t("testDetail.available", { defaultValue: "Test is available now" })}
            </AppText>
          </View>
        )}

        {/* Test Type & Title */}
        <View style={styles.titleSection}>
          <View style={[styles.typeBadge, { backgroundColor: colors.primaryContainer }]}>
            <Icon name={getTestTypeIcon(test.test_type)} size={16} color={colors.primary} />
            <AppText style={[styles.typeText, { color: colors.primary }]}>
              {getTestTypeLabel(test.test_type)}
            </AppText>
          </View>
          <AppText style={[styles.title, { color: colors.onSurface }]}>{title}</AppText>
          {subjectName && (
            <View style={styles.subjectRow}>
              {test.subject?.icon && (
                <Icon
                  name={test.subject.icon}
                  size={18}
                  color={test.subject.color || colors.primary}
                />
              )}
              <AppText style={[styles.subjectText, { color: colors.primary }]}>
                {subjectName}
              </AppText>
            </View>
          )}
        </View>


        {/* Test Info Card */}
        <AppCard style={styles.infoCard}>
          <View style={styles.infoGrid}>
            {/* Schedule */}
            {test.scheduled_at && (
              <View style={styles.infoItem}>
                <Icon name="calendar" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
                    {t("testDetail.scheduledFor", { defaultValue: "Scheduled For" })}
                  </AppText>
                  <AppText style={[styles.infoValue, { color: colors.onSurface }]}>
                    {formatDate(test.scheduled_at)}
                  </AppText>
                  <AppText style={[styles.infoSubValue, { color: colors.onSurfaceVariant }]}>
                    {formatTime(test.scheduled_at)}
                  </AppText>
                </View>
              </View>
            )}

            {/* Duration */}
            {test.duration_minutes && (
              <View style={styles.infoItem}>
                <Icon name="clock-outline" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
                    {t("testDetail.duration", { defaultValue: "Duration" })}
                  </AppText>
                  <AppText style={[styles.infoValue, { color: colors.onSurface }]}>
                    {test.duration_minutes} {t("testDetail.minutes", { defaultValue: "minutes" })}
                  </AppText>
                </View>
              </View>
            )}

            {/* Questions */}
            {test.total_questions && (
              <View style={styles.infoItem}>
                <Icon name="help-circle-outline" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
                    {t("testDetail.questions", { defaultValue: "Questions" })}
                  </AppText>
                  <AppText style={[styles.infoValue, { color: colors.onSurface }]}>
                    {test.total_questions}
                  </AppText>
                </View>
              </View>
            )}

            {/* Max Score */}
            {test.max_score && (
              <View style={styles.infoItem}>
                <Icon name="star" size={20} color="#F59E0B" />
                <View style={styles.infoContent}>
                  <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
                    {t("testDetail.maxScore", { defaultValue: "Max Score" })}
                  </AppText>
                  <AppText style={[styles.infoValue, { color: colors.onSurface }]}>
                    {test.max_score} {t("testDetail.points", { defaultValue: "points" })}
                  </AppText>
                </View>
              </View>
            )}

            {/* Passing Score */}
            {test.passing_score && (
              <View style={styles.infoItem}>
                <Icon name="check-circle" size={20} color="#16A34A" />
                <View style={styles.infoContent}>
                  <AppText style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
                    {t("testDetail.passingScore", { defaultValue: "Passing Score" })}
                  </AppText>
                  <AppText style={[styles.infoValue, { color: colors.onSurface }]}>
                    {test.passing_score} {t("testDetail.points", { defaultValue: "points" })}
                  </AppText>
                </View>
              </View>
            )}
          </View>
        </AppCard>


        {/* Teacher Card */}
        {teacherName && (
          <TouchableOpacity onPress={handleViewTeacher} activeOpacity={0.7}>
            <AppCard style={styles.teacherCard}>
              <View style={styles.teacherRow}>
                <View style={[styles.teacherAvatar, { backgroundColor: colors.primaryContainer }]}>
                  <Icon name="account" size={24} color={colors.primary} />
                </View>
                <View style={styles.teacherInfo}>
                  <AppText style={[styles.teacherLabel, { color: colors.onSurfaceVariant }]}>
                    {t("testDetail.instructor", { defaultValue: "Instructor" })}
                  </AppText>
                  <AppText style={[styles.teacherName, { color: colors.onSurface }]}>
                    {teacherName}
                  </AppText>
                </View>
                <Icon name="chevron-right" size={24} color={colors.onSurfaceVariant} />
              </View>
            </AppCard>
          </TouchableOpacity>
        )}

        {/* Description */}
        {description && (
          <AppCard style={styles.descriptionCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
              {t("testDetail.about", { defaultValue: "About this test" })}
            </AppText>
            <AppText style={[styles.descriptionText, { color: colors.onSurface }]}>
              {description}
            </AppText>
          </AppCard>
        )}

        {/* Instructions */}
        {instructions && (
          <AppCard style={[styles.instructionsCard, { backgroundColor: colors.primaryContainer }]}>
            <View style={styles.instructionsHeader}>
              <Icon name="information" size={20} color={colors.primary} />
              <AppText style={[styles.sectionTitle, { color: colors.primary }]}>
                {t("testDetail.instructions", { defaultValue: "Instructions" })}
              </AppText>
            </View>
            <AppText style={[styles.instructionsText, { color: colors.onPrimaryContainer }]}>
              {instructions}
            </AppText>
          </AppCard>
        )}

        {/* Test Rules Card */}
        <AppCard style={styles.rulesCard}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
            {t("testDetail.rules", { defaultValue: "Test Rules" })}
          </AppText>
          <View style={styles.rulesList}>
            <View style={styles.ruleItem}>
              <Icon 
                name={test.allow_late_submission ? "check-circle" : "close-circle"} 
                size={18} 
                color={test.allow_late_submission ? "#16A34A" : colors.error} 
              />
              <AppText style={[styles.ruleText, { color: colors.onSurface }]}>
                {test.allow_late_submission 
                  ? t("testDetail.lateAllowed", { defaultValue: "Late submission allowed" })
                  : t("testDetail.lateNotAllowed", { defaultValue: "No late submission" })}
              </AppText>
            </View>
            <View style={styles.ruleItem}>
              <Icon 
                name={test.show_answers_after ? "eye" : "eye-off"} 
                size={18} 
                color={test.show_answers_after ? "#16A34A" : colors.onSurfaceVariant} 
              />
              <AppText style={[styles.ruleText, { color: colors.onSurface }]}>
                {test.show_answers_after 
                  ? t("testDetail.answersShown", { defaultValue: "Answers shown after submission" })
                  : t("testDetail.answersHidden", { defaultValue: "Answers not shown" })}
              </AppText>
            </View>
          </View>
        </AppCard>


        {/* Start Test Button */}
        {role !== "parent" && (
          <View style={styles.actionContainer}>
            <AppButton
              label={
                available
                  ? t("testDetail.startTest", { defaultValue: "Start Test" })
                  : t("testDetail.notAvailable", { defaultValue: "Not Available Yet" })
              }
              onPress={handleStartTest}
              variant="primary"
              icon={available ? "play" : "clock-outline"}
              disabled={!available || !isOnline}
            />
            {!isOnline && (
              <AppText style={[styles.offlineNote, { color: colors.onSurfaceVariant }]}>
                {t("testDetail.offlineNote", {
                  defaultValue: "Internet connection required to take test",
                })}
              </AppText>
            )}
          </View>
        )}

        {/* Tips Card */}
        {upcoming && (
          <AppCard style={[styles.tipsCard, { backgroundColor: colors.surfaceVariant }]}>
            <View style={styles.tipsHeader}>
              <Icon name="lightbulb-outline" size={18} color={colors.primary} />
              <AppText style={[styles.tipsTitle, { color: colors.primary }]}>
                {t("testDetail.tips", { defaultValue: "Preparation Tips" })}
              </AppText>
            </View>
            <View style={styles.tipsList}>
              <AppText style={[styles.tipItem, { color: colors.onSurfaceVariant }]}>
                • {t("testDetail.tip1", { defaultValue: "Review the subject material thoroughly" })}
              </AppText>
              <AppText style={[styles.tipItem, { color: colors.onSurfaceVariant }]}>
                • {t("testDetail.tip2", { defaultValue: "Get a good night's sleep before the test" })}
              </AppText>
              <AppText style={[styles.tipItem, { color: colors.onSurfaceVariant }]}>
                • {t("testDetail.tip3", { defaultValue: "Ensure stable internet connection" })}
              </AppText>
            </View>
          </AppCard>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  // Banners
  countdownBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: "600",
  },
  availableBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  availableText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Title Section
  titleSection: {
    gap: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
  },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Info Card
  infoCard: {
    padding: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  infoSubValue: {
    fontSize: 13,
  },
  // Teacher Card
  teacherCard: {
    padding: 16,
  },
  teacherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  teacherAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  teacherInfo: {
    flex: 1,
  },
  teacherLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  teacherName: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Description Card
  descriptionCard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  // Instructions Card
  instructionsCard: {
    padding: 16,
  },
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 22,
  },
  // Rules Card
  rulesCard: {
    padding: 16,
  },
  rulesList: {
    gap: 10,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ruleText: {
    fontSize: 14,
    flex: 1,
  },
  // Action Container
  actionContainer: {
    marginTop: 8,
    gap: 8,
  },
  offlineNote: {
    fontSize: 12,
    textAlign: "center",
  },
  // Tips Card
  tipsCard: {
    padding: 16,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  tipsList: {
    gap: 4,
  },
  tipItem: {
    fontSize: 13,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default TestDetailScreen;
