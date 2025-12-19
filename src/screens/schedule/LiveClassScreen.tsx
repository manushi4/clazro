/**
 * LiveClassScreen - Fixed Screen
 *
 * Purpose: Display live class details with join functionality
 * Type: Fixed (not widget-based)
 * Accessible from: LiveClassWidget, schedule widgets, notifications
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
import { useLiveClassDetailQuery } from "../../hooks/queries/useLiveClassDetailQuery";

// Localization helper
import { getLocalizedField } from "../../utils/getLocalizedField";

// Mock live class data for demo items
const MOCK_LIVE_CLASSES: Record<string, any> = {
  "mock-live-1": {
    id: "mock-live-1",
    title_en: "Live: Mathematics Doubt Session",
    description_en: "Interactive live session for clearing doubts on algebra and calculus. Ask your questions and get instant answers from our expert teachers.",
    start_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    meeting_url: "https://meet.example.com/math-doubts",
    is_live: false,
    subject: { title_en: "Mathematics", icon: "calculator", color: "#4CAF50" },
    teacher: { display_name: "Dr. Sharma", first_name: "Rajesh", last_name: "Sharma" },
  },
  "mock-live-2": {
    id: "mock-live-2",
    title_en: "Live: Physics Lab Demo",
    description_en: "Watch live physics experiments and ask questions. Today we'll be demonstrating Newton's Laws of Motion with practical examples.",
    start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    meeting_url: "https://meet.example.com/physics-lab",
    is_live: false,
    subject: { title_en: "Physics", icon: "atom", color: "#2196F3" },
    teacher: { display_name: "Prof. Verma", first_name: "Anita", last_name: "Verma" },
  },
  // Mock item from TodayScheduleWidget
  "mock-4": {
    id: "mock-4",
    title_en: "Live Chemistry Class",
    description_en: "Interactive live chemistry class covering organic chemistry fundamentals. Join us for an engaging session with experiments and Q&A.",
    start_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // Started 10 mins ago (live now)
    end_time: new Date(Date.now() + 50 * 60 * 1000).toISOString(), // Ends in 50 mins
    meeting_url: "https://meet.example.com/chemistry-live",
    is_live: true,
    subject: { title_en: "Chemistry", icon: "flask", color: "#10B981" },
    teacher: { display_name: "Dr. Patel", first_name: "Meera", last_name: "Patel" },
  },
};

function getMockLiveClassData(mockId: string): any {
  return MOCK_LIVE_CLASSES[mockId] || {
    id: mockId,
    title_en: "Live Class",
    description_en: "This is a demo live class. Real class data will be shown when connected to the database.",
    start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    meeting_url: "https://meet.example.com/demo",
    is_live: false,
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

export const LiveClassScreen: React.FC<Props> = ({
  screenId = "live-class",
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

  // Check if this is a mock item (from fallback data)
  const isMockItem = classId?.startsWith("mock-");

  // === DATA ===
  const { data: dbLiveClass, isLoading, error, refetch } = useLiveClassDetailQuery(isMockItem ? undefined : classId);
  
  // Use mock data if it's a mock item, otherwise use real data
  const liveClass = isMockItem ? getMockLiveClassData(classId) : dbLiveClass;
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState<string>("");

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

  // Countdown timer for upcoming classes
  useEffect(() => {
    if (!liveClass) return;

    const updateCountdown = () => {
      const now = new Date();
      const start = new Date(liveClass.start_time);
      const diff = start.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [liveClass]);

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

  const handleJoinClass = useCallback(() => {
    if (!liveClass?.meeting_url) {
      Alert.alert(
        t("liveClass.noMeetingUrl", { defaultValue: "No Meeting Link" }),
        t("liveClass.noMeetingUrlMessage", { defaultValue: "Meeting link is not available yet" })
      );
      return;
    }

    if (!isOnline) {
      Alert.alert(
        t("offline.title", { defaultValue: "You're Offline" }),
        t("liveClass.offlineJoin", { defaultValue: "You need internet connection to join the class" })
      );
      return;
    }

    trackEvent("join_live_class", {
      classId: liveClass.id,
      meetingUrl: liveClass.meeting_url,
      isLive: isClassLive(),
    });

    Linking.openURL(liveClass.meeting_url).catch(() => {
      Alert.alert(
        t("errors.title", { defaultValue: "Error" }),
        t("errors.openUrl", { defaultValue: "Could not open link" })
      );
    });
  }, [liveClass, isOnline, trackEvent, t]);

  const handleViewTeacher = useCallback(() => {
    if (!liveClass?.teacher_id) return;

    trackEvent("view_teacher_pressed", {
      classId: liveClass.id,
      teacherId: liveClass.teacher_id,
    });

    navigation.navigate("teacher-detail", { teacherId: liveClass.teacher_id });
  }, [liveClass, navigation, trackEvent]);

  const handleCopyLink = useCallback(() => {
    if (!liveClass?.meeting_url) return;
    // Note: In production, use Clipboard API
    trackEvent("copy_meeting_link", { classId: liveClass.id });
    Alert.alert(
      t("liveClass.linkCopied", { defaultValue: "Link Copied" }),
      t("liveClass.linkCopiedMessage", { defaultValue: "Meeting link copied to clipboard" })
    );
  }, [liveClass, trackEvent, t]);

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
    if (diffMins < 60) return `${diffMins} ${t("liveClass.mins", { defaultValue: "mins" })}`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const isClassLive = () => {
    if (!liveClass) return false;
    const now = new Date();
    const start = new Date(liveClass.start_time);
    const end = new Date(liveClass.end_time);
    return now >= start && now <= end;
  };

  const isClassUpcoming = () => {
    if (!liveClass) return false;
    const now = new Date();
    const start = new Date(liveClass.start_time);
    return now < start;
  };

  const isClassEnded = () => {
    if (!liveClass) return false;
    const now = new Date();
    const end = new Date(liveClass.end_time);
    return now > end;
  };

  const getTimeUntilStart = () => {
    if (!liveClass) return "";
    const now = new Date();
    const start = new Date(liveClass.start_time);
    const diff = start.getTime() - now.getTime();
    if (diff <= 0) return "";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return t("liveClass.startsIn", { mins, defaultValue: `Starts in ${mins} min` });
    const hours = Math.floor(mins / 60);
    return t("liveClass.startsInHours", { hours, defaultValue: `Starts in ${hours}h` });
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
  if ((error || !liveClass) && !isMockItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("liveClass.title", { defaultValue: "Live Class" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="video-off" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("liveClass.notFound", { defaultValue: "Live class not found" })}
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

  const title = getLocalizedField(liveClass, "title") || liveClass.title_en;
  const description = getLocalizedField(liveClass, "description");
  const subjectName = liveClass.subject
    ? getLocalizedField(liveClass.subject, "title") || liveClass.subject.title_en
    : null;
  const teacherName = liveClass.teacher
    ? liveClass.teacher.display_name ||
      `${liveClass.teacher.first_name || ""} ${liveClass.teacher.last_name || ""}`.trim()
    : null;

  const live = isClassLive();
  const upcoming = isClassUpcoming();
  const ended = isClassEnded();

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
          {t("liveClass.title", { defaultValue: "Live Class" })}
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
        {/* Live Status Banner */}
        {live && (
          <View style={[styles.liveBanner, { backgroundColor: colors.error }]}>
            <View style={styles.liveIndicator}>
              <View style={styles.livePulse} />
              <Icon name="broadcast" size={20} color="#FFFFFF" />
            </View>
            <AppText style={styles.liveBannerText}>
              {t("liveClass.liveNow", { defaultValue: "LIVE NOW" })}
            </AppText>
          </View>
        )}

        {/* Countdown Banner for Upcoming */}
        {upcoming && countdown && (
          <View style={[styles.countdownBanner, { backgroundColor: colors.primaryContainer }]}>
            <Icon name="clock-outline" size={20} color={colors.primary} />
            <AppText style={[styles.countdownText, { color: colors.primary }]}>
              {t("liveClass.startsIn", { defaultValue: "Starts in" })} {countdown}
            </AppText>
          </View>
        )}

        {/* Ended Banner */}
        {ended && (
          <View style={[styles.endedBanner, { backgroundColor: colors.surfaceVariant }]}>
            <Icon name="check-circle" size={20} color={colors.onSurfaceVariant} />
            <AppText style={[styles.endedText, { color: colors.onSurfaceVariant }]}>
              {t("liveClass.ended", { defaultValue: "Class has ended" })}
            </AppText>
          </View>
        )}

        {/* Title & Subject */}
        <View style={styles.titleSection}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>{title}</AppText>
          {subjectName && (
            <View style={styles.subjectRow}>
              {liveClass.subject?.icon && (
                <Icon
                  name={liveClass.subject.icon}
                  size={18}
                  color={liveClass.subject.color || colors.primary}
                />
              )}
              <AppText style={[styles.subjectText, { color: colors.primary }]}>
                {subjectName}
              </AppText>
            </View>
          )}
        </View>

        {/* Time & Duration Card */}
        <AppCard style={styles.timeCard}>
          <View style={styles.timeRow}>
            <Icon name="calendar" size={20} color={colors.primary} />
            <AppText style={[styles.dateText, { color: colors.onSurface }]}>
              {formatDate(liveClass.start_time)}
            </AppText>
          </View>
          <View style={styles.timeRow}>
            <Icon name="clock-outline" size={20} color={colors.primary} />
            <AppText style={[styles.timeText, { color: colors.onSurface }]}>
              {formatTime(liveClass.start_time)} - {formatTime(liveClass.end_time)}
            </AppText>
            <View style={[styles.durationBadge, { backgroundColor: colors.surfaceVariant }]}>
              <AppText style={[styles.durationText, { color: colors.onSurfaceVariant }]}>
                {getDuration(liveClass.start_time, liveClass.end_time)}
              </AppText>
            </View>
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
                    {t("liveClass.instructor", { defaultValue: "Instructor" })}
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
              {t("liveClass.about", { defaultValue: "About this class" })}
            </AppText>
            <AppText style={[styles.descriptionText, { color: colors.onSurface }]}>
              {description}
            </AppText>
          </AppCard>
        )}

        {/* Meeting Info Card */}
        {liveClass.meeting_url && (
          <AppCard style={styles.meetingCard}>
            <View style={styles.meetingHeader}>
              <Icon name="video" size={20} color={colors.primary} />
              <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
                {t("liveClass.meetingInfo", { defaultValue: "Meeting Information" })}
              </AppText>
            </View>
            <View style={styles.meetingUrlRow}>
              <AppText
                style={[styles.meetingUrl, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {liveClass.meeting_url}
              </AppText>
              <TouchableOpacity onPress={handleCopyLink} style={styles.copyButton}>
                <Icon name="content-copy" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </AppCard>
        )}

        {/* Join Button */}
        {!ended && liveClass.meeting_url && (
          <View style={styles.actionContainer}>
            <AppButton
              label={
                live
                  ? t("liveClass.joinNow", { defaultValue: "Join Now" })
                  : t("liveClass.joinClass", { defaultValue: "Join Class" })
              }
              onPress={handleJoinClass}
              variant="primary"
              icon={live ? "video" : "video-outline"}
              disabled={!isOnline}
            />
            {!isOnline && (
              <AppText style={[styles.offlineNote, { color: colors.onSurfaceVariant }]}>
                {t("liveClass.offlineNote", {
                  defaultValue: "Internet connection required to join",
                })}
              </AppText>
            )}
          </View>
        )}

        {/* Tips for Live Class */}
        {(live || upcoming) && (
          <AppCard style={[styles.tipsCard, { backgroundColor: colors.primaryContainer }]}>
            <View style={styles.tipsHeader}>
              <Icon name="lightbulb-outline" size={18} color={colors.primary} />
              <AppText style={[styles.tipsTitle, { color: colors.primary }]}>
                {t("liveClass.tips", { defaultValue: "Tips" })}
              </AppText>
            </View>
            <View style={styles.tipsList}>
              <AppText style={[styles.tipItem, { color: colors.onPrimaryContainer }]}>
                • {t("liveClass.tip1", { defaultValue: "Ensure stable internet connection" })}
              </AppText>
              <AppText style={[styles.tipItem, { color: colors.onPrimaryContainer }]}>
                • {t("liveClass.tip2", { defaultValue: "Use headphones for better audio" })}
              </AppText>
              <AppText style={[styles.tipItem, { color: colors.onPrimaryContainer }]}>
                • {t("liveClass.tip3", { defaultValue: "Keep your questions ready" })}
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
  // Live Banner
  liveBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    marginRight: 6,
  },
  liveBannerText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  // Countdown Banner
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
  // Ended Banner
  endedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  endedText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Title Section
  titleSection: {
    gap: 8,
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
  // Time Card
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
  // Meeting Card
  meetingCard: {
    padding: 16,
  },
  meetingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  meetingUrlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  meetingUrl: {
    flex: 1,
    fontSize: 13,
  },
  copyButton: {
    padding: 8,
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

export default LiveClassScreen;
