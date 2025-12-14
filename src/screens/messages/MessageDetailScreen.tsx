/**
 * MessageDetailScreen - Fixed Screen
 *
 * Purpose: Display message thread details with replies
 * Type: Fixed (not widget-based)
 * Accessible from: messages screen, notification widgets
 * Roles: parent, teacher, student, admin
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
import {
  useMessageDetailQuery,
  useMarkMessageReadMutation,
  useToggleMessageStarMutation,
  MessageDetail,
} from "../../hooks/queries/useMessageDetailQuery";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

// Priority colors
const PRIORITY_COLORS: Record<string, string> = {
  low: '#9E9E9E',
  normal: '#4CAF50',
  high: '#FF9800',
  urgent: '#F44336',
};

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  general: 'message-text',
  academic: 'school',
  attendance: 'calendar-check',
  fees: 'currency-inr',
  behavior: 'account-alert',
  event: 'calendar-star',
};

// Sender type icons
const SENDER_ICONS: Record<string, string> = {
  parent: 'account',
  teacher: 'human-male-board',
  school: 'domain',
};

export const MessageDetailScreen: React.FC<Props> = ({
  screenId = "message-detail",
  role,
  navigation: navProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors } = useAppTheme();
  const { t } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = useRoute<any>();

  // Get params from route
  const messageId = route.params?.messageId || route.params?.id || '';

  // === DATA ===
  const { data, isLoading, error, refetch } = useMessageDetailQuery(messageId);
  const markReadMutation = useMarkMessageReadMutation();
  const toggleStarMutation = useToggleMessageStarMutation();
  const [refreshing, setRefreshing] = useState(false);


  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { messageId },
    });
  }, [screenId, messageId]);

  // Mark as read when message loads
  useEffect(() => {
    if (data?.original && !data.original.is_read && isOnline) {
      markReadMutation.mutate(messageId);
    }
  }, [data?.original?.id, data?.original?.is_read, isOnline]);

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

  const handleToggleStar = useCallback(() => {
    if (!data?.original || !isOnline) return;
    trackEvent("message_star_toggled", { messageId, starred: !data.original.is_starred });
    toggleStarMutation.mutate({
      messageId,
      isStarred: !data.original.is_starred,
    });
  }, [data?.original, isOnline, messageId, trackEvent, toggleStarMutation]);

  const handleAttachmentPress = useCallback(async (url: string) => {
    trackEvent("attachment_pressed", { messageId });
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t("errors.title"), t("errors.openUrl"));
      }
    } catch {
      Alert.alert(t("errors.title"), t("errors.openUrl"));
    }
  }, [trackEvent, t, messageId]);

  // === HELPER FUNCTIONS ===
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = (msg: MessageDetail, isReply: boolean = false) => (
    <AppCard key={msg.id} style={[styles.messageCard, isReply && styles.replyCard]}>
      {/* Sender Header */}
      <View style={styles.senderRow}>
        <View style={[styles.senderAvatar, { backgroundColor: `${colors.primary}20` }]}>
          <Icon
            name={SENDER_ICONS[msg.sender_type] || 'account'}
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.senderInfo}>
          <AppText style={[styles.senderName, { color: colors.onSurface }]}>
            {t(`messageDetail.sender.${msg.sender_type}`, { defaultValue: msg.sender_name })}
          </AppText>
          <AppText style={[styles.messageTime, { color: colors.onSurfaceVariant }]}>
            {formatDate(msg.created_at)}
          </AppText>
        </View>
        {!isReply && (
          <View style={[styles.priorityBadge, { backgroundColor: `${PRIORITY_COLORS[msg.priority]}20` }]}>
            <AppText style={[styles.priorityText, { color: PRIORITY_COLORS[msg.priority] }]}>
              {t(`messageDetail.priority.${msg.priority}`, { defaultValue: msg.priority })}
            </AppText>
          </View>
        )}
      </View>

      {/* Message Content */}
      <AppText style={[styles.messageContent, { color: colors.onSurface }]}>
        {msg.message}
      </AppText>

      {/* Attachment */}
      {msg.attachment_url && (
        <TouchableOpacity
          style={[styles.attachmentRow, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => handleAttachmentPress(msg.attachment_url!)}
          activeOpacity={0.7}
        >
          <Icon name="attachment" size={18} color={colors.primary} />
          <AppText style={[styles.attachmentText, { color: colors.primary }]}>
            {t("messageDetail.viewAttachment", { defaultValue: "View Attachment" })}
          </AppText>
          <Icon name="open-in-new" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </AppCard>
  );

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
            {t("messageDetail.title", { defaultValue: "Message" })}
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <AppText style={[styles.errorText, { color: colors.error }]}>
            {t("messageDetail.notFound", { defaultValue: "Message not found" })}
          </AppText>
          <AppButton label={t("actions.goBack")} onPress={handleBack} />
        </View>
      </SafeAreaView>
    );
  }

  const { original, replies } = data;

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
          {t("messageDetail.title", { defaultValue: "Message" })}
        </AppText>
        <TouchableOpacity onPress={handleToggleStar} style={styles.starButton}>
          <Icon
            name={original.is_starred ? "star" : "star-outline"}
            size={24}
            color={original.is_starred ? colors.warning : colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
      >
        {/* Subject Card */}
        <AppCard style={styles.subjectCard}>
          <View style={styles.subjectHeader}>
            <View style={[styles.categoryIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Icon
                name={CATEGORY_ICONS[original.category] || 'message-text'}
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.subjectInfo}>
              <AppText style={[styles.subjectText, { color: colors.onSurface }]}>
                {original.subject}
              </AppText>
              <View style={styles.categoryRow}>
                <AppText style={[styles.categoryText, { color: colors.onSurfaceVariant }]}>
                  {t(`messageDetail.category.${original.category}`, { defaultValue: original.category })}
                </AppText>
              </View>
            </View>
          </View>
        </AppCard>

        {/* Original Message */}
        {renderMessage(original)}

        {/* Replies Section */}
        {replies.length > 0 && (
          <>
            <View style={styles.repliesHeader}>
              <Icon name="reply-all" size={18} color={colors.onSurfaceVariant} />
              <AppText style={[styles.repliesTitle, { color: colors.onSurfaceVariant }]}>
                {t("messageDetail.replies", { defaultValue: "Replies" })} ({replies.length})
              </AppText>
            </View>
            {replies.map((reply) => renderMessage(reply, true))}
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
  starButton: { padding: 4 },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 12 },
  // Subject Card
  subjectCard: { padding: 16 },
  subjectHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  categoryIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  subjectInfo: { flex: 1 },
  subjectText: { fontSize: 17, fontWeight: "600", lineHeight: 24 },
  categoryRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  categoryText: { fontSize: 13, textTransform: "capitalize" },
  // Message Card
  messageCard: { padding: 16 },
  replyCard: { marginLeft: 16, borderLeftWidth: 3, borderLeftColor: '#E0E0E0' },
  senderRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  senderAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  senderInfo: { flex: 1, marginLeft: 10 },
  senderName: { fontSize: 14, fontWeight: "600" },
  messageTime: { fontSize: 12, marginTop: 2 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  priorityText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  messageContent: { fontSize: 15, lineHeight: 22 },
  attachmentRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, padding: 10, borderRadius: 8 },
  attachmentText: { flex: 1, fontSize: 13, fontWeight: "500" },
  // Replies
  repliesHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 4 },
  repliesTitle: { fontSize: 14, fontWeight: "500" },
  bottomSpacer: { height: 24 },
});
