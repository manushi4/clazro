/**
 * DoubtDetailScreen - View complete doubt details
 * 
 * Purpose: Shows full doubt information including status, teacher responses
 * Type: Fixed (not widget-based)
 * Accessible from: DoubtsInboxWidget, doubts-home screen
 */

import React, { useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { useAppTheme } from "../../theme/useAppTheme";
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";
import { AppText } from "../../ui/components/AppText";

// Mock data for now - will be replaced with real query
const MOCK_DOUBT = {
  id: "1",
  subject: "Mathematics",
  title: "How to solve quadratic equations?",
  description: "I am having trouble understanding the quadratic formula and when to use it. Can you explain with examples?",
  priority: "high",
  status: "pending",
  created_at: "2024-12-15T10:30:00Z",
  updated_at: "2024-12-15T10:30:00Z",
  teacher_response: null,
  teacher_response_at: null,
};

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
};

export const DoubtDetailScreen: React.FC<Props> = ({
  screenId = "doubt-detail",
  navigation: navProp,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("screens");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = useRoute<any>();
  
  const doubtId = route.params?.doubtId || "1";
  const [isLoading, setIsLoading] = React.useState(true);
  const [doubt, setDoubt] = React.useState<typeof MOCK_DOUBT | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    trackScreenView(screenId, { doubtId });
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { doubtId },
    });

    // Simulate loading
    setTimeout(() => {
      setDoubt(MOCK_DOUBT);
      setIsLoading(false);
    }, 500);
  }, [screenId, doubtId]);

  const handleBack = useCallback(() => {
    trackEvent("back_pressed", { screen: screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  const handleShare = useCallback(async () => {
    if (!doubt) return;
    try {
      await Share.share({
        message: `📚 Doubt: ${doubt.title}\n\n${doubt.description}\n\nSubject: ${doubt.subject}\nStatus: ${doubt.status.toUpperCase()}`,
        title: "Share Doubt",
      });
      trackEvent("share_doubt", { screen: screenId, doubtId });
    } catch (err) {
      console.error("Error sharing:", err);
    }
  }, [doubt, trackEvent, screenId, doubtId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return colors.error;
      case "medium": return colors.warning;
      case "low": return colors.onSurfaceVariant;
      default: return colors.onSurfaceVariant;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered": return colors.success;
      case "viewed": return colors.warning;
      case "pending": return colors.primary;
      case "closed": return colors.onSurfaceVariant;
      default: return colors.onSurfaceVariant;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("common:status.loading", { defaultValue: "Loading..." })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !doubt) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {error || "Doubt not found"}
          </AppText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleBack}
          >
            <AppText style={styles.retryText}>Go Back</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          Doubt Details
        </AppText>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Icon name="share-variant" size={22} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badges */}
        <View style={styles.badgesRow}>
          <View style={[styles.badge, { backgroundColor: getPriorityColor(doubt.priority) + "20" }]}>
            <AppText style={[styles.badgeText, { color: getPriorityColor(doubt.priority) }]}>
              {doubt.priority.toUpperCase()} PRIORITY
            </AppText>
          </View>
          <View style={[styles.badge, { backgroundColor: getStatusColor(doubt.status) + "20" }]}>
            <AppText style={[styles.badgeText, { color: getStatusColor(doubt.status) }]}>
              {doubt.status.toUpperCase()}
            </AppText>
          </View>
        </View>

        {/* Subject Tag */}
        <View style={[styles.subjectTag, { backgroundColor: colors.primary + "15" }]}>
          <Icon name="book-open-variant" size={16} color={colors.primary} />
          <AppText style={[styles.subjectText, { color: colors.primary }]}>
            {doubt.subject}
          </AppText>
        </View>

        {/* Title */}
        <AppText style={[styles.title, { color: colors.onSurface }]}>
          {doubt.title}
        </AppText>

        {/* Description Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Description
          </AppText>
          <AppText style={[styles.description, { color: colors.onSurfaceVariant }]}>
            {doubt.description}
          </AppText>
        </View>

        {/* Teacher Response Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Teacher's Response
          </AppText>
          {doubt.teacher_response ? (
            <>
              <View style={[styles.responseBox, { backgroundColor: colors.success + "10", borderLeftColor: colors.success }]}>
                <AppText style={[styles.responseText, { color: colors.onSurface }]}>
                  {doubt.teacher_response}
                </AppText>
              </View>
              {doubt.teacher_response_at && (
                <AppText style={[styles.responseDate, { color: colors.onSurfaceVariant }]}>
                  Responded on {formatDate(doubt.teacher_response_at)}
                </AppText>
              )}
            </>
          ) : (
            <View style={[styles.noResponse, { backgroundColor: colors.surfaceVariant }]}>
              <Icon name="clock-outline" size={24} color={colors.onSurfaceVariant} />
              <AppText style={[styles.noResponseText, { color: colors.onSurfaceVariant }]}>
                Waiting for teacher's response
              </AppText>
              <AppText style={[styles.noResponseSubtext, { color: colors.onSurfaceVariant }]}>
                You'll be notified when your teacher responds
              </AppText>
            </View>
          )}
        </View>

        {/* Timeline Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Timeline
          </AppText>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
              <View style={styles.timelineContent}>
                <AppText style={[styles.timelineLabel, { color: colors.onSurface }]}>
                  Submitted
                </AppText>
                <AppText style={[styles.timelineDate, { color: colors.onSurfaceVariant }]}>
                  {formatDate(doubt.created_at)}
                </AppText>
              </View>
            </View>
            {doubt.status === "answered" && doubt.teacher_response_at && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
                <View style={styles.timelineContent}>
                  <AppText style={[styles.timelineLabel, { color: colors.onSurface }]}>
                    Answered
                  </AppText>
                  <AppText style={[styles.timelineDate, { color: colors.onSurfaceVariant }]}>
                    {formatDate(doubt.teacher_response_at)}
                  </AppText>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, gap: 16 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 16, textAlign: "center", marginVertical: 12 },
  retryButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center" },
  shareButton: { padding: 4 },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  badgesRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  subjectTag: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  subjectText: { fontSize: 13, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "700", lineHeight: 28 },
  card: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "600" },
  description: { fontSize: 14, lineHeight: 22 },
  responseBox: { padding: 12, borderRadius: 8, borderLeftWidth: 3 },
  responseText: { fontSize: 14, lineHeight: 22 },
  responseDate: { fontSize: 12, fontStyle: "italic" },
  noResponse: { padding: 20, borderRadius: 8, alignItems: "center", gap: 8 },
  noResponseText: { fontSize: 14, fontWeight: "500" },
  noResponseSubtext: { fontSize: 12, textAlign: "center" },
  timeline: { gap: 16 },
  timelineItem: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  timelineContent: { flex: 1 },
  timelineLabel: { fontSize: 14, fontWeight: "600" },
  timelineDate: { fontSize: 12, marginTop: 2 },
});

export default DoubtDetailScreen;
