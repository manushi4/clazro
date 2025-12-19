/**
 * ClassDetailScreen - Fixed Screen
 *
 * Purpose: Display detailed information about a specific class/period
 * Type: Fixed (not widget-based)
 * Accessible from: schedule widgets (WeekCalendarWidget, TodayScheduleWidget)
 * Roles: student, parent, teacher
 */

import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
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
import { useClassDetailQuery } from "../../hooks/queries/useClassDetailQuery";

// Localization helper
import { getLocalizedField } from "../../utils/getLocalizedField";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  route?: any;
  onFocused?: () => void;
};

// Class type icons
const CLASS_TYPE_ICONS: Record<string, string> = {
  lecture: "school",
  lab: "flask",
  tutorial: "account-group",
  seminar: "presentation",
  workshop: "tools",
  exam: "clipboard-text",
  default: "book-open-variant",
};

// Mock class data for demo items
const MOCK_CLASSES: Record<string, any> = {
  "mock-1": {
    id: "mock-1",
    title_en: "Mathematics",
    description_en: "Introduction to Algebra and basic mathematical concepts. This class covers fundamental algebraic operations, equations, and problem-solving techniques.",
    class_type: "lecture",
    room: "Room 101",
    start_time: new Date().setHours(9, 0, 0, 0),
    end_time: new Date().setHours(10, 0, 0, 0),
    is_live: false,
    subject: { name_en: "Mathematics", icon: "calculator", color: "#4CAF50" },
    teacher: { display_name: "Dr. Sharma", first_name: "Rajesh", last_name: "Sharma" },
  },
  "mock-2": {
    id: "mock-2",
    title_en: "Physics Lab",
    description_en: "Hands-on laboratory session covering Newton's Laws of Motion. Students will conduct experiments to understand force, mass, and acceleration.",
    class_type: "lab",
    room: "Lab 3",
    start_time: new Date().setHours(11, 0, 0, 0),
    end_time: new Date().setHours(13, 0, 0, 0),
    is_live: false,
    subject: { name_en: "Physics", icon: "atom", color: "#2196F3" },
    teacher: { display_name: "Prof. Verma", first_name: "Anita", last_name: "Verma" },
  },
  "mock-3": {
    id: "mock-3",
    title_en: "English Essay Due",
    description_en: "Submit your essay on 'The Impact of Technology on Modern Education'. Minimum 1000 words required.",
    class_type: "assignment",
    room: "",
    start_time: new Date().setHours(14, 0, 0, 0),
    end_time: new Date().setHours(14, 30, 0, 0),
    is_live: false,
    subject: { name_en: "English", icon: "book-open-page-variant", color: "#FF9800" },
  },
  "mock-4": {
    id: "mock-4",
    title_en: "Live Chemistry Class",
    description_en: "Interactive live session on Chemical Bonding. Join the video call to participate in real-time discussions and Q&A.",
    class_type: "live",
    room: "Online",
    start_time: new Date().setHours(16, 0, 0, 0),
    end_time: new Date().setHours(17, 0, 0, 0),
    is_live: true,
    meeting_url: "https://meet.example.com/chemistry-class",
    subject: { name_en: "Chemistry", icon: "flask", color: "#9C27B0" },
    teacher: { display_name: "Dr. Patel", first_name: "Meera", last_name: "Patel" },
  },
};

function getMockClassData(mockId: string, itemType?: string): any {
  const mockData = MOCK_CLASSES[mockId];
  if (mockData) {
    return {
      ...mockData,
      start_time: new Date(mockData.start_time).toISOString(),
      end_time: new Date(mockData.end_time).toISOString(),
    };
  }
  // Return generic mock data if specific mock not found
  return {
    id: mockId,
    title_en: itemType === "assignment" ? "Assignment" : "Class",
    description_en: "This is a demo class. Real class data will be shown when connected to the database.",
    class_type: itemType || "lecture",
    room: "Demo Room",
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),
    is_live: itemType === "live",
    subject: { name_en: "Demo Subject", icon: "school", color: "#607D8B" },
  };
}

export const ClassDetailScreen: React.FC<Props> = ({
  screenId = "class-detail",
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

  // Get class ID from route params
  const classId = route.params?.classId || route.params?.id;
  const itemType = route.params?.type; // Type passed from widget (class, lab, assignment, etc.)

  // Check if this is a mock item (from fallback data)
  const isMockItem = classId?.startsWith("mock-");

  // === DATA ===
  const { data: classData, isLoading, error, refetch } = useClassDetailQuery(isMockItem ? undefined : classId);

  const [refreshing, setRefreshing] = useState(false);

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { classId },
    });
  }, [screenId, classId]);

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

  // Use mock data if it's a mock item, otherwise use real data
  const displayData = isMockItem ? getMockClassData(classId, itemType) : classData;

  const handleJoinClass = useCallback(() => {
    if (!displayData?.meeting_url) return;

    trackEvent("join_class_pressed", {
      classId: displayData.id,
      meetingUrl: displayData.meeting_url,
    });

    Linking.openURL(displayData.meeting_url).catch(() => {
      Alert.alert(
        t("errors.title", { defaultValue: "Error" }),
        t("errors.openUrl", { defaultValue: "Could not open link" })
      );
    });
  }, [displayData, trackEvent, t]);

  const handleViewTeacher = useCallback(() => {
    if (!displayData?.teacher_id && !displayData?.teacher) return;

    trackEvent("view_teacher_pressed", {
      classId: displayData.id,
      teacherId: displayData.teacher_id,
    });

    // Don't navigate for mock data
    if (!isMockItem && displayData.teacher_id) {
      navigation.navigate("teacher-detail", { teacherId: displayData.teacher_id });
    }
  }, [displayData, navigation, trackEvent, isMockItem]);

  // === HELPER FUNCTIONS ===
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(i18n.language === "hi" ? "hi-IN" : "en-US", {
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

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} ${t("classDetail.mins", { defaultValue: "mins" })}`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0
      ? `${hours}h ${mins}m`
      : `${hours} ${t("classDetail.hour", { defaultValue: "hour" })}${hours > 1 ? "s" : ""}`;
  };

  const getClassTypeIcon = (type: string | null) => {
    return CLASS_TYPE_ICONS[type || "default"] || CLASS_TYPE_ICONS.default;
  };

  const isClassLive = () => {
    if (!displayData) return false;
    const now = new Date();
    const start = new Date(displayData.start_time);
    const end = new Date(displayData.end_time);
    return now >= start && now <= end;
  };

  const isClassUpcoming = () => {
    if (!displayData) return false;
    const now = new Date();
    const start = new Date(displayData.start_time);
    return now < start;
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
  if ((error || !classData) && !isMockItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("classDetail.title", { defaultValue: "Class Details" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("classDetail.notFound", { defaultValue: "Class not found" })}
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

  const title = getLocalizedField(displayData, "title") || displayData.title_en;
  const description = getLocalizedField(displayData, "description") || displayData.description_en;
  const subjectName = displayData.subject
    ? getLocalizedField(displayData.subject, "name") || displayData.subject.name_en
    : null;
  const teacherName = displayData.teacher
    ? displayData.teacher.display_name ||
      `${displayData.teacher.first_name || ""} ${displayData.teacher.last_name || ""}`.trim()
    : null;

  const live = isClassLive();
  const upcoming = isClassUpcoming();

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
          {t("classDetail.title", { defaultValue: "Class Details" })}
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
        {/* Status Badge & Type */}
        <View style={styles.badgeRow}>
          {live && (
            <View style={[styles.liveBadge, { backgroundColor: colors.error }]}>
              <Icon name="broadcast" size={14} color="#FFFFFF" />
              <AppText style={styles.liveBadgeText}>
                {t("classDetail.live", { defaultValue: "LIVE" })}
              </AppText>
            </View>
          )}
          {upcoming && !live && (
            <View style={[styles.upcomingBadge, { backgroundColor: colors.primaryContainer }]}>
              <Icon name="clock-outline" size={14} color={colors.primary} />
              <AppText style={[styles.upcomingBadgeText, { color: colors.primary }]}>
                {t("classDetail.upcoming", { defaultValue: "Upcoming" })}
              </AppText>
            </View>
          )}
          <View style={[styles.typeBadge, { backgroundColor: colors.surfaceVariant }]}>
            <Icon
              name={getClassTypeIcon(displayData.class_type)}
              size={14}
              color={colors.onSurfaceVariant}
            />
            <AppText style={[styles.typeText, { color: colors.onSurfaceVariant }]}>
              {displayData.class_type || t("classDetail.class", { defaultValue: "Class" })}
            </AppText>
          </View>
        </View>

        {/* Title */}
        <AppText style={[styles.title, { color: colors.onSurface }]}>{title}</AppText>

        {/* Subject */}
        {subjectName && (
          <View style={styles.subjectRow}>
            {displayData.subject?.icon && (
              <Icon name={displayData.subject.icon} size={18} color={displayData.subject.color || colors.primary} />
            )}
            <AppText style={[styles.subjectText, { color: colors.primary }]}>{subjectName}</AppText>
          </View>
        )}

        {/* Time & Date Card */}
        <AppCard style={styles.timeCard}>
          <View style={styles.timeRow}>
            <Icon name="calendar" size={20} color={colors.primary} />
            <AppText style={[styles.dateText, { color: colors.onSurface }]}>
              {formatDate(displayData.start_time)}
            </AppText>
          </View>
          <View style={styles.timeRow}>
            <Icon name="clock-outline" size={20} color={colors.primary} />
            <AppText style={[styles.timeText, { color: colors.onSurface }]}>
              {formatTime(displayData.start_time)} - {formatTime(displayData.end_time)}
            </AppText>
            <View style={[styles.durationBadge, { backgroundColor: colors.surfaceVariant }]}>
              <AppText style={[styles.durationText, { color: colors.onSurfaceVariant }]}>
                {getDuration(displayData.start_time, displayData.end_time)}
              </AppText>
            </View>
          </View>
          {displayData.room && (
            <View style={styles.timeRow}>
              <Icon name="map-marker" size={20} color={colors.primary} />
              <AppText style={[styles.roomText, { color: colors.onSurface }]}>
                {t("classDetail.room", { defaultValue: "Room" })}: {displayData.room}
              </AppText>
            </View>
          )}
        </AppCard>

        {/* Teacher Card */}
        {teacherName && (
          <TouchableOpacity onPress={handleViewTeacher} activeOpacity={0.7}>
            <AppCard style={styles.teacherCard}>
              <View style={styles.teacherRow}>
                <View style={[styles.teacherAvatar, { backgroundColor: colors.primaryContainer }]}>
                  {displayData?.teacher?.avatar_url ? (
                    <Icon name="account" size={24} color={colors.primary} />
                  ) : (
                    <Icon name="account" size={24} color={colors.primary} />
                  )}
                </View>
                <View style={styles.teacherInfo}>
                  <AppText style={[styles.teacherLabel, { color: colors.onSurfaceVariant }]}>
                    {t("classDetail.teacher", { defaultValue: "Teacher" })}
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
              {t("classDetail.description", { defaultValue: "Description" })}
            </AppText>
            <AppText style={[styles.descriptionText, { color: colors.onSurface }]}>
              {description}
            </AppText>
          </AppCard>
        )}

        {/* Join Class Button (if live or has meeting URL) */}
        {displayData?.meeting_url && (live || upcoming) && (
          <View style={styles.actionContainer}>
            <AppButton
              label={
                live
                  ? t("classDetail.joinNow", { defaultValue: "Join Now" })
                  : t("classDetail.joinClass", { defaultValue: "Join Class" })
              }
              onPress={handleJoinClass}
              variant="primary"
              icon={live ? "video" : "video-outline"}
            />
          </View>
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
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  upcomingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  upcomingBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "capitalize",
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
  timeCard: {
    padding: 16,
    gap: 12,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateText: {
    fontSize: 15,
    fontWeight: "500",
  },
  timeText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 12,
    fontWeight: "500",
  },
  roomText: {
    fontSize: 15,
  },
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
  actionContainer: {
    marginTop: 8,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default ClassDetailScreen;
