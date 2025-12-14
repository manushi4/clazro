/**
 * AssignmentDetailScreen - Fixed Screen
 *
 * Purpose: Display detailed assignment information for parent viewing child's assignment
 * Type: Fixed (not widget-based)
 * Accessible from: child-assignments, parent.assignments-pending widget
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
  Linking,
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

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Data Hooks
import { useAssignmentDetailQuery, AssignmentAttachment } from "../../hooks/queries/useAssignmentDetailQuery";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

// Assignment type icons
const TYPE_ICONS: Record<string, string> = {
  homework: 'clipboard-text',
  project: 'folder-star',
  practice: 'pencil',
  classwork: 'school',
};

// Status colors
const STATUS_COLORS: Record<string, string> = {
  draft: '#9E9E9E',
  published: '#4CAF50',
  closed: '#F44336',
};

// Attachment type icons
const ATTACHMENT_ICONS: Record<string, string> = {
  pdf: 'file-pdf-box',
  image: 'file-image',
  doc: 'file-word',
  other: 'file-document',
};

export const AssignmentDetailScreen: React.FC<Props> = ({
  screenId = "assignment-detail",
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
  const assignmentId = route.params?.assignmentId || route.params?.id || '';

  // === DATA ===
  const { data, isLoading, error, refetch } = useAssignmentDetailQuery(assignmentId);
  const [refreshing, setRefreshing] = useState(false);

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { assignmentId },
    });
  }, [screenId, assignmentId]);

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

  const handleAttachmentPress = useCallback(async (attachment: AssignmentAttachment) => {
    trackEvent("attachment_pressed", { attachmentId: attachment.id, type: attachment.type });
    if (attachment.url) {
      try {
        const canOpen = await Linking.canOpenURL(attachment.url);
        if (canOpen) {
          await Linking.openURL(attachment.url);
        } else {
          Alert.alert(t("errors.title"), t("errors.openUrl"));
        }
      } catch {
        Alert.alert(t("errors.title"), t("errors.openUrl"));
      }
    }
  }, [trackEvent, t]);

  // === HELPER FUNCTIONS ===
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: "short",
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDueDateColor = () => {
    if (!data) return colors.onSurfaceVariant;
    if (data.is_overdue) return colors.error;
    if (data.days_remaining <= 1) return colors.warning;
    return colors.success;
  };

  const getDueDateText = () => {
    if (!data) return '';
    if (data.is_overdue) return t("assignmentDetail.overdue", { defaultValue: "Overdue" });
    if (data.days_remaining === 0) return t("assignmentDetail.dueToday", { defaultValue: "Due today" });
    if (data.days_remaining === 1) return t("assignmentDetail.dueTomorrow", { defaultValue: "Due tomorrow" });
    return t("assignmentDetail.dueDays", { defaultValue: "Due in {{days}} days", days: data.days_remaining });
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
  if (error || !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("assignmentDetail.title", { defaultValue: "Assignment" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("assignmentDetail.notFound", { defaultValue: "Assignment not found" })}
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
          {t("assignmentDetail.title", { defaultValue: "Assignment" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
      >
        {/* Assignment Header Card */}
        <AppCard style={styles.mainCard}>
          <View style={styles.assignmentHeader}>
            <View style={[styles.typeIcon, { backgroundColor: `${data.subject?.color || colors.primary}20` }]}>
              <Icon 
                name={TYPE_ICONS[data.assignment_type] || 'clipboard-text'} 
                size={28} 
                color={data.subject?.color || colors.primary} 
              />
            </View>
            <View style={styles.assignmentInfo}>
              <AppText style={[styles.assignmentTitle, { color: colors.onSurface }]}>
                {data.title}
              </AppText>
              {data.subject && (
                <View style={styles.subjectRow}>
                  <Icon name={data.subject.icon} size={14} color={data.subject.color} />
                  <AppText style={[styles.subjectName, { color: colors.onSurfaceVariant }]}>
                    {data.subject.name}
                  </AppText>
                </View>
              )}
            </View>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[data.status]}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[data.status] }]} />
            <AppText style={[styles.statusText, { color: STATUS_COLORS[data.status] }]}>
              {t(`assignmentDetail.status.${data.status}`, { defaultValue: data.status })}
            </AppText>
          </View>
        </AppCard>

        {/* Details Card */}
        <AppCard style={styles.detailsCard}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
            {t("assignmentDetail.details", { defaultValue: "Details" })}
          </AppText>

          {/* Type */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Icon name="tag" size={18} color={colors.onSurfaceVariant} />
              <AppText style={[styles.detailLabelText, { color: colors.onSurfaceVariant }]}>
                {t("assignmentDetail.type", { defaultValue: "Type" })}
              </AppText>
            </View>
            <AppText style={[styles.detailValue, { color: colors.onSurface }]}>
              {t(`assignmentDetail.types.${data.assignment_type}`, { defaultValue: data.assignment_type })}
            </AppText>
          </View>

          {/* Due Date */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Icon name="calendar" size={18} color={colors.onSurfaceVariant} />
              <AppText style={[styles.detailLabelText, { color: colors.onSurfaceVariant }]}>
                {t("assignmentDetail.dueDate", { defaultValue: "Due Date" })}
              </AppText>
            </View>
            <View style={styles.dueDateContainer}>
              <AppText style={[styles.detailValue, { color: colors.onSurface }]}>
                {formatDate(data.due_date)}
              </AppText>
              <View style={[styles.dueBadge, { backgroundColor: `${getDueDateColor()}20` }]}>
                <AppText style={[styles.dueBadgeText, { color: getDueDateColor() }]}>
                  {getDueDateText()}
                </AppText>
              </View>
            </View>
          </View>

          {/* Max Score */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Icon name="star" size={18} color={colors.onSurfaceVariant} />
              <AppText style={[styles.detailLabelText, { color: colors.onSurfaceVariant }]}>
                {t("assignmentDetail.maxScore", { defaultValue: "Max Score" })}
              </AppText>
            </View>
            <AppText style={[styles.detailValue, { color: colors.primary, fontWeight: '700' }]}>
              {data.max_score} {t("assignmentDetail.points", { defaultValue: "points" })}
            </AppText>
          </View>
        </AppCard>

        {/* Instructions Card */}
        {data.instructions && (
          <AppCard style={styles.instructionsCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("assignmentDetail.instructions", { defaultValue: "Instructions" })}
            </AppText>
            <AppText style={[styles.instructionsText, { color: colors.onSurfaceVariant }]}>
              {data.instructions}
            </AppText>
          </AppCard>
        )}

        {/* Attachments Card */}
        {data.attachments && data.attachments.length > 0 && (
          <AppCard style={styles.attachmentsCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("assignmentDetail.attachments", { defaultValue: "Attachments" })} ({data.attachments.length})
            </AppText>
            {data.attachments.map((attachment, index) => (
              <TouchableOpacity
                key={attachment.id || index}
                style={[styles.attachmentItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant }]}
                onPress={() => handleAttachmentPress(attachment)}
                activeOpacity={0.7}
              >
                <View style={[styles.attachmentIcon, { backgroundColor: colors.surfaceVariant }]}>
                  <Icon 
                    name={ATTACHMENT_ICONS[attachment.type] || 'file-document'} 
                    size={22} 
                    color={colors.primary} 
                  />
                </View>
                <View style={styles.attachmentInfo}>
                  <AppText style={[styles.attachmentName, { color: colors.onSurface }]} numberOfLines={1}>
                    {attachment.name}
                  </AppText>
                  {attachment.size_bytes && (
                    <AppText style={[styles.attachmentSize, { color: colors.onSurfaceVariant }]}>
                      {formatFileSize(attachment.size_bytes)}
                    </AppText>
                  )}
                </View>
                <Icon name="download" size={20} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </AppCard>
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
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  // Main Card
  mainCard: { padding: 16 },
  assignmentHeader: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  typeIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  assignmentInfo: { flex: 1 },
  assignmentTitle: { fontSize: 18, fontWeight: "700", lineHeight: 24 },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  subjectName: { fontSize: 13 },
  statusBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 14, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  // Details Card
  detailsCard: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 14 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  detailLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabelText: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: "500" },
  dueDateContainer: { alignItems: "flex-end", gap: 4 },
  dueBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  dueBadgeText: { fontSize: 11, fontWeight: "600" },
  // Instructions Card
  instructionsCard: { padding: 16 },
  instructionsText: { fontSize: 14, lineHeight: 22 },
  // Attachments Card
  attachmentsCard: { padding: 16 },
  attachmentItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  attachmentIcon: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  attachmentInfo: { flex: 1 },
  attachmentName: { fontSize: 14, fontWeight: "500" },
  attachmentSize: { fontSize: 12, marginTop: 2 },
  bottomSpacer: { height: 24 },
});
