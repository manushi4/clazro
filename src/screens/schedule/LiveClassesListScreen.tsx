/**
 * LiveClassesListScreen - Shows all live classes scheduled for today
 *
 * Purpose: Display a list of all live classes with filtering and sorting
 * Type: Fixed (not widget-based)
 * Accessible from: LiveClassWidget "View All" button
 * Roles: student, parent, teacher
 */

import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
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

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Data Hooks
import { useLiveClassQuery } from "../../hooks/queries/useLiveClassQuery";
import { useDemoUser } from "../../hooks/useDemoUser";

// Localization helper
import { getLocalizedField } from "../../utils/getLocalizedField";

type FilterType = "all" | "live" | "upcoming" | "ended";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  route?: any;
  onFocused?: () => void;
};

export const LiveClassesListScreen: React.FC<Props> = ({
  screenId = "live-classes-list",
  role,
  navigation: navProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const { t, i18n } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const { userId } = useDemoUser();

  // === STATE ===
  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  // === DATA ===
  const { data: liveClasses, isLoading, error, refetch } = useLiveClassQuery(userId);

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
    });
  }, [screenId]);

  // === FILTERED DATA ===
  const filteredClasses = useMemo(() => {
    if (!liveClasses) return [];
    
    const now = new Date();
    
    return liveClasses.filter((cls) => {
      const start = new Date(cls.start_time);
      const end = new Date(cls.end_time);
      const isLive = now >= start && now <= end;
      const isUpcoming = now < start;
      const isEnded = now > end;

      switch (filter) {
        case "live":
          return isLive;
        case "upcoming":
          return isUpcoming;
        case "ended":
          return isEnded;
        default:
          return true;
      }
    });
  }, [liveClasses, filter]);

  // === EVENT HANDLERS ===
  const handleBack = useCallback(() => {
    trackEvent("back_pressed", { screen: screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleClassPress = useCallback((classId: string) => {
    trackEvent("class_pressed", { classId });
    navigation.navigate("live-class", { classId });
  }, [navigation, trackEvent]);

  // === HELPER FUNCTIONS ===
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(i18n.language === "hi" ? "hi-IN" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getClassStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now >= start && now <= end) return "live";
    if (now < start) return "upcoming";
    return "ended";
  };

  const getTimeUntil = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();
    
    if (diffMs <= 0) return null;
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m`;
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
  if (error && !liveClasses) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("liveClasses.title", { defaultValue: "Live Classes" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="video-off" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("liveClasses.error", { defaultValue: "Failed to load classes" })}
          </AppText>
          <AppButton
            label={t("actions.retry", { defaultValue: "Retry" })}
            onPress={handleRefresh}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

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
          {t("liveClasses.title", { defaultValue: "Live Classes" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(["all", "live", "upcoming", "ended"] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterTab,
                { backgroundColor: filter === f ? colors.primary : colors.surfaceVariant },
              ]}
              onPress={() => setFilter(f)}
            >
              <AppText style={[styles.filterText, { color: filter === f ? "#fff" : colors.onSurfaceVariant }]}>
                {t(`liveClasses.filter.${f}`, { defaultValue: f.charAt(0).toUpperCase() + f.slice(1) })}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
        {/* Summary */}
        <View style={styles.summaryRow}>
          <AppText style={[styles.summaryText, { color: colors.onSurfaceVariant }]}>
            {t("liveClasses.showing", { 
              defaultValue: "Showing {{count}} classes", 
              count: filteredClasses.length 
            })}
          </AppText>
        </View>

        {/* Empty State */}
        {filteredClasses.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="video-off-outline" size={48} color={colors.onSurfaceVariant} />
            <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              {filter === "all"
                ? t("liveClasses.empty", { defaultValue: "No live classes scheduled for today" })
                : t("liveClasses.emptyFilter", { defaultValue: "No {{filter}} classes", filter })}
            </AppText>
          </View>
        )}

        {/* Class List */}
        {filteredClasses.map((cls) => {
          const status = getClassStatus(cls.start_time, cls.end_time);
          const timeUntil = getTimeUntil(cls.start_time);
          const title = getLocalizedField(cls, "title", i18n.language);
          const subjectTitle = cls.subject ? getLocalizedField(cls.subject, "title", i18n.language) : null;

          return (
            <TouchableOpacity
              key={cls.id}
              onPress={() => handleClassPress(cls.id)}
              activeOpacity={0.7}
            >
              <AppCard style={[styles.classCard, status === "live" && { borderWidth: 2, borderColor: colors.tertiary }]}>
                {/* Status Badge */}
                {status === "live" && (
                  <View style={[styles.statusBadge, { backgroundColor: colors.tertiary }]}>
                    <View style={styles.liveDot} />
                    <AppText style={styles.statusText}>LIVE NOW</AppText>
                  </View>
                )}
                {status === "upcoming" && timeUntil && (
                  <View style={[styles.statusBadge, { backgroundColor: colors.primaryContainer }]}>
                    <Icon name="clock-outline" size={12} color={colors.primary} />
                    <AppText style={[styles.statusText, { color: colors.primary }]}>
                      In {timeUntil}
                    </AppText>
                  </View>
                )}
                {status === "ended" && (
                  <View style={[styles.statusBadge, { backgroundColor: colors.surfaceVariant }]}>
                    <Icon name="check-circle" size={12} color={colors.onSurfaceVariant} />
                    <AppText style={[styles.statusText, { color: colors.onSurfaceVariant }]}>
                      Ended
                    </AppText>
                  </View>
                )}

                {/* Class Info */}
                <View style={styles.classInfo}>
                  <View style={[styles.classIcon, { backgroundColor: `${colors.tertiary}20` }]}>
                    <Icon name="video" size={24} color={colors.tertiary} />
                  </View>
                  <View style={styles.classDetails}>
                    <AppText style={[styles.classTitle, { color: colors.onSurface }]} numberOfLines={2}>
                      {title}
                    </AppText>
                    <View style={styles.classMeta}>
                      <Icon name="clock-outline" size={14} color={colors.onSurfaceVariant} />
                      <AppText style={[styles.classTime, { color: colors.onSurfaceVariant }]}>
                        {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                      </AppText>
                    </View>
                    {subjectTitle && (
                      <View style={styles.classMeta}>
                        <Icon name="book-outline" size={14} color={colors.primary} />
                        <AppText style={[styles.classSubject, { color: colors.primary }]}>
                          {subjectTitle}
                        </AppText>
                      </View>
                    )}
                    {cls.teacher_name && (
                      <View style={styles.classMeta}>
                        <Icon name="account" size={14} color={colors.onSurfaceVariant} />
                        <AppText style={[styles.classTeacher, { color: colors.onSurfaceVariant }]}>
                          {cls.teacher_name}
                        </AppText>
                      </View>
                    )}
                  </View>
                  <Icon name="chevron-right" size={24} color={colors.onSurfaceVariant} />
                </View>
              </AppCard>
            </TouchableOpacity>
          );
        })}

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
  filterContainer: {
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  classCard: {
    padding: 16,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  classInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  classIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  classDetails: {
    flex: 1,
    gap: 4,
  },
  classTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  classMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  classTime: {
    fontSize: 13,
  },
  classSubject: {
    fontSize: 13,
    fontWeight: "500",
  },
  classTeacher: {
    fontSize: 12,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default LiveClassesListScreen;
