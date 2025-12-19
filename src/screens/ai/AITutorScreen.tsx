/**
 * AITutorScreen - Fixed Screen
 *
 * Purpose: AI-powered tutoring chat interface for students
 * Type: Fixed (not widget-based)
 * Accessible from: QuickActionsWidget, AIToolsWidget, Dashboard
 * Roles: student, parent
 */

import React, { useEffect, useCallback, useState, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
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

// Data Hooks
import {
  useAITutorConversationsQuery,
  useAITutorMessagesQuery,
  useCreateConversationMutation,
  useSendMessageMutation,
  useRateMessageMutation,
  AITutorMessage,
  AITutorConversation,
} from "../../hooks/queries/useAITutorQuery";

// User context
import { useDemoUser } from "../../hooks/useDemoUser";

// Localization helper
import { getLocalizedField } from "../../utils/getLocalizedField";

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  route?: any;
  onFocused?: () => void;
};

// Suggested questions for new conversations
const SUGGESTED_QUESTIONS = [
  { id: "1", text_en: "Help me solve a math problem", text_hi: "गणित का सवाल हल करने में मदद करें" },
  { id: "2", text_en: "Explain a science concept", text_hi: "विज्ञान की अवधारणा समझाएं" },
  { id: "3", text_en: "Help with my homework", text_hi: "होमवर्क में मदद करें" },
  { id: "4", text_en: "Prepare for an exam", text_hi: "परीक्षा की तैयारी करें" },
];

export const AITutorScreen: React.FC<Props> = ({
  screenId = "ai-tutor",
  role,
  navigation: navProp,
  route: routeProp,
  onFocused,
}) => {
  // Debug log - this should appear in Metro console when screen opens
  console.log('=== AITutorScreen MOUNTED ===');
  console.log('[AITutorScreen] Props:', { screenId, role, hasNavProp: !!navProp, hasRouteProp: !!routeProp });

  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const { t, i18n } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const { userId } = useDemoUser();
  const navigation = navProp || useNavigation<any>();
  const routeHook = useRoute<any>();
  const route = routeProp || routeHook;

  // Get params
  const conversationIdParam = route.params?.conversationId;
  const studentId = route.params?.studentId || userId;

  // === STATE ===
  const [activeConversationId, setActiveConversationId] = useState<string | null>(conversationIdParam || null);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showConversations, setShowConversations] = useState(!conversationIdParam);
  const scrollViewRef = useRef<ScrollView>(null);

  // === DATA ===
  const { data: conversations, isLoading: conversationsLoading } = useAITutorConversationsQuery(studentId);
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useAITutorMessagesQuery(activeConversationId || undefined);
  const createConversation = useCreateConversationMutation();
  const sendMessage = useSendMessageMutation();
  const rateMessage = useRateMessageMutation();

  // Only show loading if we have a studentId and are actually loading
  const isLoading = studentId && (conversationsLoading || (activeConversationId && messagesLoading));

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
    });
  }, [screenId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // === EVENT HANDLERS ===
  const handleBack = useCallback(() => {
    if (activeConversationId && !conversationIdParam) {
      setActiveConversationId(null);
      setShowConversations(true);
    } else {
      navigation.goBack();
    }
  }, [activeConversationId, conversationIdParam, navigation]);

  const handleNewChat = useCallback(async () => {
    if (!studentId) return;

    trackEvent("ai_tutor_new_chat", { studentId });
    createConversation.mutate(
      { studentId },
      {
        onSuccess: (conversation) => {
          setActiveConversationId(conversation.id);
          setShowConversations(false);
        },
      }
    );
  }, [studentId, createConversation, trackEvent]);

  const handleSelectConversation = useCallback((conversation: AITutorConversation) => {
    setActiveConversationId(conversation.id);
    setShowConversations(false);
    trackEvent("ai_tutor_select_conversation", { conversationId: conversation.id });
  }, [trackEvent]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !activeConversationId || isSending) return;

    const messageContent = inputText.trim();
    setInputText("");
    setIsSending(true);

    trackEvent("ai_tutor_send_message", { conversationId: activeConversationId });

    sendMessage.mutate(
      { conversationId: activeConversationId, content: messageContent },
      {
        onSuccess: () => {
          refetchMessages();
          setIsSending(false);
        },
        onError: () => {
          setIsSending(false);
          setInputText(messageContent); // Restore message on error
        },
      }
    );
  }, [inputText, activeConversationId, isSending, sendMessage, refetchMessages, trackEvent]);

  const handleSuggestedQuestion = useCallback(async (question: typeof SUGGESTED_QUESTIONS[0]) => {
    if (!studentId) return;

    // Create new conversation and send the question
    createConversation.mutate(
      { studentId, titleEn: question.text_en, titleHi: question.text_hi },
      {
        onSuccess: (conversation) => {
          setActiveConversationId(conversation.id);
          setShowConversations(false);
          // Send the suggested question
          sendMessage.mutate(
            { conversationId: conversation.id, content: i18n.language === 'hi' ? question.text_hi : question.text_en },
            { onSuccess: () => refetchMessages() }
          );
        },
      }
    );
  }, [studentId, createConversation, sendMessage, refetchMessages, i18n.language]);

  const handleRateMessage = useCallback((messageId: string, rating: number) => {
    if (!activeConversationId) return;
    rateMessage.mutate({ messageId, rating, conversationId: activeConversationId });
    trackEvent("ai_tutor_rate_message", { messageId, rating });
  }, [activeConversationId, rateMessage, trackEvent]);

  // === RENDER HELPERS ===
  const renderMessage = (message: AITutorMessage, index: number) => {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        {isAssistant && (
          <View style={[styles.avatarContainer, { backgroundColor: colors.primaryContainer }]}>
            <Icon name="robot" size={20} color={colors.primary} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser
              ? [styles.userBubble, { backgroundColor: colors.primary }]
              : [styles.assistantBubble, { backgroundColor: colors.surfaceVariant }],
          ]}
        >
          <AppText
            style={[
              styles.messageText,
              { color: isUser ? colors.onPrimary : colors.onSurface },
            ]}
          >
            {message.content}
          </AppText>
          <AppText
            style={[
              styles.messageTime,
              { color: isUser ? colors.onPrimary : colors.onSurfaceVariant, opacity: 0.7 },
            ]}
          >
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </AppText>
        </View>
        {isAssistant && (
          <View style={styles.ratingContainer}>
            <TouchableOpacity onPress={() => handleRateMessage(message.id, 1)} style={styles.ratingButton}>
              <Icon
                name={message.rating === 1 ? "thumb-up" : "thumb-up-outline"}
                size={16}
                color={message.rating === 1 ? colors.primary : colors.onSurfaceVariant}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRateMessage(message.id, -1)} style={styles.ratingButton}>
              <Icon
                name={message.rating === -1 ? "thumb-down" : "thumb-down-outline"}
                size={16}
                color={message.rating === -1 ? colors.error : colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderConversationItem = (conversation: AITutorConversation) => {
    const title = getLocalizedField(conversation, 'title') || conversation.title_en || t('aiTutor.newChat');
    const lastMessageDate = conversation.last_message_at
      ? new Date(conversation.last_message_at).toLocaleDateString()
      : '';

    return (
      <TouchableOpacity
        key={conversation.id}
        style={[styles.conversationItem, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
        onPress={() => handleSelectConversation(conversation)}
      >
        <View style={[styles.conversationIcon, { backgroundColor: colors.primaryContainer }]}>
          <Icon name="chat" size={20} color={colors.primary} />
        </View>
        <View style={styles.conversationContent}>
          <AppText style={[styles.conversationTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {title}
          </AppText>
          <AppText style={[styles.conversationMeta, { color: colors.onSurfaceVariant }]}>
            {conversation.message_count} {t('aiTutor.messages', { defaultValue: 'messages' })} • {lastMessageDate}
          </AppText>
        </View>
        <Icon name="chevron-right" size={24} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
    );
  };

  // === LOADING STATE ===
  if (isLoading && !messages) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("aiTutor.loading", { defaultValue: "Loading..." })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // === CONVERSATIONS LIST VIEW ===
  if (showConversations && !activeConversationId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <OfflineBanner />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("aiTutor.title", { defaultValue: "AI Tutor" })}
          </AppText>
          <TouchableOpacity onPress={handleNewChat} style={styles.newChatButton}>
            <Icon name="plus" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Suggested Questions */}
          <View style={styles.section}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("aiTutor.suggestedQuestions", { defaultValue: "Quick Start" })}
            </AppText>
            <View style={styles.suggestionsGrid}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <TouchableOpacity
                  key={q.id}
                  style={[styles.suggestionCard, { backgroundColor: colors.primaryContainer }]}
                  onPress={() => handleSuggestedQuestion(q)}
                >
                  <Icon name="lightbulb-outline" size={20} color={colors.primary} />
                  <AppText style={[styles.suggestionText, { color: colors.primary }]}>
                    {i18n.language === 'hi' ? q.text_hi : q.text_en}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Conversations */}
          {conversations && conversations.length > 0 && (
            <View style={styles.section}>
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t("aiTutor.recentChats", { defaultValue: "Recent Chats" })}
              </AppText>
              {conversations.map(renderConversationItem)}
            </View>
          )}

          {/* Empty State */}
          {(!conversations || conversations.length === 0) && (
            <View style={styles.emptyState}>
              <Icon name="robot-happy" size={64} color={colors.primary} />
              <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
                {t("aiTutor.welcomeTitle", { defaultValue: "Welcome to AI Tutor!" })}
              </AppText>
              <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
                {t("aiTutor.welcomeSubtitle", { defaultValue: "I'm here to help you learn. Ask me anything about your studies!" })}
              </AppText>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // === CHAT VIEW ===
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("aiTutor.title", { defaultValue: "AI Tutor" })}
        </AppText>
        <View style={styles.headerRight} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome message if no messages */}
          {(!messages || messages.length === 0) && (
            <View style={styles.welcomeContainer}>
              <View style={[styles.welcomeIcon, { backgroundColor: colors.primaryContainer }]}>
                <Icon name="robot" size={32} color={colors.primary} />
              </View>
              <AppText style={[styles.welcomeText, { color: colors.onSurface }]}>
                {t("aiTutor.chatWelcome", { defaultValue: "Hi! I'm your AI tutor. How can I help you today?" })}
              </AppText>
            </View>
          )}

          {/* Messages */}
          {messages?.map((msg, idx) => renderMessage(msg, idx))}

          {/* Typing indicator */}
          {isSending && (
            <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
              <View style={[styles.avatarContainer, { backgroundColor: colors.primaryContainer }]}>
                <Icon name="robot" size={20} color={colors.primary} />
              </View>
              <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.surfaceVariant }]}>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, { backgroundColor: colors.onSurfaceVariant }]} />
                  <View style={[styles.typingDot, { backgroundColor: colors.onSurfaceVariant }]} />
                  <View style={[styles.typingDot, { backgroundColor: colors.onSurfaceVariant }]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.surfaceVariant, color: colors.onSurface }]}
            placeholder={t("aiTutor.inputPlaceholder", { defaultValue: "Type your question..." })}
            placeholderTextColor={colors.onSurfaceVariant}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={isOnline && !isSending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() && isOnline ? colors.primary : colors.surfaceVariant },
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || !isOnline || isSending}
          >
            <Icon
              name="send"
              size={20}
              color={inputText.trim() && isOnline ? colors.onPrimary : colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  newChatButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    width: "48%",
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  conversationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  conversationContent: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  conversationMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  welcomeContainer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  assistantMessageContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    borderBottomRightRadius: 4,
    marginLeft: "auto",
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 8,
  },
  ratingButton: {
    padding: 4,
  },
  typingIndicator: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AITutorScreen;
