/**
 * ComposeMessageScreen - Fixed Screen
 *
 * Purpose: Compose and send new messages or reply to existing messages
 * Type: Fixed (form-based)
 * Accessible from: messages screen, message-detail screen
 * Roles: parent, teacher, student, admin
 */

import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
import { useComposeMessageMutation, ComposeMessageInput } from "../../hooks/mutations/useComposeMessageMutation";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

type Priority = 'low' | 'normal' | 'high' | 'urgent';
type Category = 'general' | 'academic' | 'attendance' | 'fees' | 'behavior' | 'event';

const PRIORITIES: { value: Priority; icon: string; color: string }[] = [
  { value: 'low', icon: 'arrow-down', color: '#9E9E9E' },
  { value: 'normal', icon: 'minus', color: '#4CAF50' },
  { value: 'high', icon: 'arrow-up', color: '#FF9800' },
  { value: 'urgent', icon: 'alert', color: '#F44336' },
];

const CATEGORIES: { value: Category; icon: string }[] = [
  { value: 'general', icon: 'message-text' },
  { value: 'academic', icon: 'school' },
  { value: 'attendance', icon: 'calendar-check' },
  { value: 'fees', icon: 'currency-inr' },
  { value: 'behavior', icon: 'account-alert' },
  { value: 'event', icon: 'calendar-star' },
];


export const ComposeMessageScreen: React.FC<Props> = ({
  screenId = "compose-message",
  role = "parent",
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

  // Get params (for reply mode)
  const replyToId = route.params?.replyToId;
  const replyToSubject = route.params?.replyToSubject;
  const isReplyMode = !!replyToId;

  // === FORM STATE ===
  const [subject, setSubject] = useState(isReplyMode ? `Re: ${replyToSubject || ''}` : '');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [category, setCategory] = useState<Category>('general');

  // === MUTATION ===
  // TODO: Get actual parent user ID from auth context
  const parentUserId = 'demo-parent-id';
  const composeMutation = useComposeMessageMutation(parentUserId);

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { isReplyMode, replyToId },
    });
  }, [screenId, isReplyMode, replyToId]);

  // === VALIDATION ===
  const isFormValid = subject.trim().length > 0 && message.trim().length > 0;

  // === EVENT HANDLERS ===
  const handleBack = useCallback(() => {
    trackEvent("back_pressed", { screen: screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  const handleSend = useCallback(async () => {
    if (!isOnline) {
      Alert.alert(
        t("offline.title"),
        t("composeMessage.offlineMessage", { defaultValue: "Cannot send messages while offline" })
      );
      return;
    }

    if (!isFormValid) {
      Alert.alert(
        t("errors.title"),
        t("composeMessage.validationError", { defaultValue: "Please fill in subject and message" })
      );
      return;
    }

    trackEvent("message_send_pressed", { screen: screenId, isReply: isReplyMode });

    try {
      const input: ComposeMessageInput = {
        subject: subject.trim(),
        message: message.trim(),
        sender_type: role as 'parent' | 'teacher' | 'school',
        priority,
        category,
        reply_to_id: replyToId,
      };

      await composeMutation.mutateAsync(input);

      Alert.alert(
        t("composeMessage.successTitle", { defaultValue: "Message Sent" }),
        t("composeMessage.successMessage", { defaultValue: "Your message has been sent successfully" }),
        [{ text: t("actions.ok"), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(
        t("errors.title"),
        t("composeMessage.sendError", { defaultValue: "Failed to send message. Please try again." })
      );
    }
  }, [isOnline, isFormValid, subject, message, priority, category, replyToId, role, composeMutation, navigation, t, trackEvent, screenId, isReplyMode]);

  const handlePrioritySelect = useCallback((value: Priority) => {
    setPriority(value);
    trackEvent("priority_selected", { priority: value });
  }, [trackEvent]);

  const handleCategorySelect = useCallback((value: Category) => {
    setCategory(value);
    trackEvent("category_selected", { category: value });
  }, [trackEvent]);

  // === RENDER ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="close" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {isReplyMode
            ? t("composeMessage.replyTitle", { defaultValue: "Reply" })
            : t("composeMessage.title", { defaultValue: "New Message" })}
        </AppText>
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendButton, !isFormValid && styles.sendButtonDisabled]}
          disabled={!isFormValid || composeMutation.isPending}
        >
          <Icon
            name="send"
            size={24}
            color={isFormValid ? colors.primary : colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Subject Input */}
          <AppCard style={styles.inputCard}>
            <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
              {t("composeMessage.subject", { defaultValue: "Subject" })}
            </AppText>
            <TextInput
              style={[styles.subjectInput, { color: colors.onSurface, borderBottomColor: colors.outlineVariant }]}
              value={subject}
              onChangeText={setSubject}
              placeholder={t("composeMessage.subjectPlaceholder", { defaultValue: "Enter subject..." })}
              placeholderTextColor={colors.onSurfaceVariant}
              maxLength={100}
              editable={!isReplyMode}
            />
          </AppCard>

          {/* Message Input */}
          <AppCard style={styles.inputCard}>
            <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
              {t("composeMessage.message", { defaultValue: "Message" })}
            </AppText>
            <TextInput
              style={[styles.messageInput, { color: colors.onSurface, backgroundColor: colors.surfaceVariant }]}
              value={message}
              onChangeText={setMessage}
              placeholder={t("composeMessage.messagePlaceholder", { defaultValue: "Type your message..." })}
              placeholderTextColor={colors.onSurfaceVariant}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </AppCard>

          {/* Priority Selection */}
          <AppCard style={styles.optionCard}>
            <AppText style={[styles.optionLabel, { color: colors.onSurface }]}>
              {t("composeMessage.priority", { defaultValue: "Priority" })}
            </AppText>
            <View style={styles.optionRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.optionButton,
                    { backgroundColor: priority === p.value ? `${p.color}20` : colors.surfaceVariant },
                    priority === p.value && { borderColor: p.color, borderWidth: 1 },
                  ]}
                  onPress={() => handlePrioritySelect(p.value)}
                >
                  <Icon name={p.icon} size={16} color={priority === p.value ? p.color : colors.onSurfaceVariant} />
                  <AppText style={[styles.optionText, { color: priority === p.value ? p.color : colors.onSurfaceVariant }]}>
                    {t(`composeMessage.priorities.${p.value}`, { defaultValue: p.value })}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </AppCard>

          {/* Category Selection */}
          <AppCard style={styles.optionCard}>
            <AppText style={[styles.optionLabel, { color: colors.onSurface }]}>
              {t("composeMessage.category", { defaultValue: "Category" })}
            </AppText>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[
                    styles.categoryButton,
                    { backgroundColor: category === c.value ? `${colors.primary}20` : colors.surfaceVariant },
                    category === c.value && { borderColor: colors.primary, borderWidth: 1 },
                  ]}
                  onPress={() => handleCategorySelect(c.value)}
                >
                  <Icon name={c.icon} size={20} color={category === c.value ? colors.primary : colors.onSurfaceVariant} />
                  <AppText style={[styles.categoryText, { color: category === c.value ? colors.primary : colors.onSurfaceVariant }]}>
                    {t(`composeMessage.categories.${c.value}`, { defaultValue: c.value })}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </AppCard>

          {/* Send Button (for mobile) */}
          <AppButton
            label={composeMutation.isPending
              ? t("composeMessage.sending", { defaultValue: "Sending..." })
              : t("composeMessage.send", { defaultValue: "Send Message" })}
            onPress={handleSend}
            disabled={!isFormValid || composeMutation.isPending || !isOnline}
            style={styles.sendButtonBottom}
          />

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center", marginHorizontal: 8 },
  sendButton: { padding: 4 },
  sendButtonDisabled: { opacity: 0.5 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  // Input Cards
  inputCard: { padding: 16 },
  inputLabel: { fontSize: 12, fontWeight: "500", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  subjectInput: { fontSize: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  messageInput: { fontSize: 15, padding: 12, borderRadius: 8, minHeight: 120, lineHeight: 22 },
  // Option Cards
  optionCard: { padding: 16 },
  optionLabel: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  optionText: { fontSize: 12, fontWeight: "500", textTransform: "capitalize" },
  // Category Grid
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, gap: 8, minWidth: "45%" },
  categoryText: { fontSize: 13, fontWeight: "500", textTransform: "capitalize" },
  // Bottom Button
  sendButtonBottom: { marginTop: 8 },
  bottomSpacer: { height: 24 },
});
