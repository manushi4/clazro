/**
 * AI Tutor Chat Widget
 * Interactive chat widget with AI tutor using Gemini API
 * For testing: Uses direct API calls with user-provided API key
 * For production: Should use AI Gateway Edge Function
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { AppText } from "../../../ui/components/AppText";
import { useAISettingsStore } from "../../../stores/aiSettingsStore";
import {
  sendChatMessage,
  GeminiMessage,
  GeminiDirectError,
  validateApiKey,
  ValidationResult,
} from "../../../services/ai/geminiDirectService";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
};

const SYSTEM_PROMPT = `You are a friendly and helpful AI tutor for students. 
Your role is to:
- Help students understand concepts clearly
- Answer questions in a simple, age-appropriate way
- Encourage learning and curiosity
- Provide examples when helpful
- Be patient and supportive
Keep responses concise but informative. Use simple language.`;

export const AITutorChatWidget: React.FC<WidgetProps> = ({ config }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  
  // Store
  const { geminiApiKey, setApiKey, loadSettings, isInitialized } = useAISettingsStore();
  
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Load settings on mount
  useEffect(() => {
    if (!isInitialized) {
      loadSettings();
    }
  }, [isInitialized, loadSettings]);

  // Show welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: t("widgets.aiTutor.welcomeMessage", {
            defaultValue: "Hi! I'm your AI tutor. Ask me anything about your studies!",
          }),
          timestamp: new Date(),
          status: "sent",
        },
      ]);
    }
  }, [t, messages.length]);

  // Convert messages to Gemini format
  const toGeminiMessages = useCallback((msgs: ChatMessage[]): GeminiMessage[] => {
    return msgs
      .filter((m) => m.id !== "welcome" && m.status !== "error")
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));
  }, []);

  // Send message
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;

    if (!geminiApiKey) {
      setShowSettings(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
      timestamp: new Date(),
      status: "sent",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const geminiMessages = toGeminiMessages([...messages, userMessage]);
      
      const response = await sendChatMessage(geminiApiKey, geminiMessages, {
        systemPrompt: SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 1024,
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        status: "sent",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("[AITutorChat] Error:", error);
      
      let errorMessage = t("widgets.aiTutor.errorGeneric", {
        defaultValue: "Sorry, I couldn't process that. Please try again.",
      });

      if (error instanceof GeminiDirectError) {
        if (error.code === "CONTENT_BLOCKED") {
          errorMessage = t("widgets.aiTutor.errorBlocked", {
            defaultValue: "I can't respond to that. Let's talk about something else!",
          });
        } else if (error.status === 401 || error.status === 400) {
          errorMessage = t("widgets.aiTutor.errorApiKey", {
            defaultValue: "API key issue. Please check your settings.",
          });
        }
      }

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
        status: "error",
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [inputText, isLoading, geminiApiKey, messages, toGeminiMessages, t]);

  // Save API key
  const handleSaveApiKey = useCallback(async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert(
        t("widgets.aiTutor.settings.error", { defaultValue: "Error" }),
        t("widgets.aiTutor.settings.enterKey", { defaultValue: "Please enter an API key" })
      );
      return;
    }

    setIsValidating(true);
    console.log("[AITutorChat] Starting API key validation...");
    console.log("[AITutorChat] Key length:", apiKeyInput.trim().length);
    console.log("[AITutorChat] Key prefix:", apiKeyInput.trim().substring(0, 10));
    
    try {
      const result: ValidationResult = await validateApiKey(apiKeyInput.trim());
      console.log("[AITutorChat] Validation result:", JSON.stringify(result, null, 2));
      
      if (result.valid) {
        setApiKey("gemini", apiKeyInput.trim());
        setShowSettings(false);
        setApiKeyInput("");
        Alert.alert(
          t("widgets.aiTutor.settings.success", { defaultValue: "Success" }),
          t("widgets.aiTutor.settings.keySaved", { defaultValue: "API key saved!" })
        );
      } else {
        // Show detailed error for debugging
        const errorDetails = [
          `Error: ${result.error || "Unknown"}`,
          `Code: ${result.errorCode || "N/A"}`,
          `Status: ${result.errorStatus || "N/A"}`,
        ].join("\n");
        
        console.log("[AITutorChat] Validation failed:", errorDetails);
        console.log("[AITutorChat] Debug info:", result.debugInfo);
        
        Alert.alert(
          t("widgets.aiTutor.settings.error", { defaultValue: "Validation Failed" }),
          `${t("widgets.aiTutor.settings.invalidKey", { defaultValue: "Invalid API key" })}\n\n${errorDetails}`
        );
      }
    } catch (error) {
      console.log("[AITutorChat] Validation exception:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      Alert.alert(
        t("widgets.aiTutor.settings.error", { defaultValue: "Error" }),
        `${t("widgets.aiTutor.settings.validationFailed", { defaultValue: "Could not validate key" })}\n\n${errorMsg}`
      );
    } finally {
      setIsValidating(false);
    }
  }, [apiKeyInput, setApiKey, t]);

  // Render message bubble
  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === "user";
      const isError = item.status === "error";

      return (
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            {
              backgroundColor: isUser
                ? colors.primary
                : isError
                ? `${colors.error}20`
                : colors.surfaceVariant,
              borderRadius: borderRadius.medium,
            },
          ]}
        >
          {!isUser && (
            <View style={styles.avatarContainer}>
              <Icon
                name={isError ? "alert-circle" : "robot"}
                size={16}
                color={isError ? colors.error : colors.primary}
              />
            </View>
          )}
          <AppText
            style={[
              styles.messageText,
              {
                color: isUser
                  ? colors.onPrimary
                  : isError
                  ? colors.error
                  : colors.onSurface,
              },
            ]}
          >
            {item.content}
          </AppText>
        </View>
      );
    },
    [colors, borderRadius]
  );

  // Render settings modal
  const renderSettingsModal = () => (
    <Modal
      visible={showSettings}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSettings(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.surface, borderRadius: borderRadius.large },
          ]}
        >
          <View style={styles.modalHeader}>
            <AppText variant="title" style={{ color: colors.onSurface }}>
              {t("widgets.aiTutor.settings.title", { defaultValue: "AI Settings" })}
            </AppText>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Icon name="close" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <AppText style={[styles.modalLabel, { color: colors.onSurfaceVariant }]}>
            {t("widgets.aiTutor.settings.apiKeyLabel", { defaultValue: "Gemini API Key" })}
          </AppText>
          
          <TextInput
            style={[
              styles.apiKeyInput,
              {
                backgroundColor: colors.surfaceVariant,
                color: colors.onSurface,
                borderRadius: borderRadius.medium,
              },
            ]}
            placeholder={t("widgets.aiTutor.settings.apiKeyPlaceholder", {
              defaultValue: "Enter your Gemini API key",
            })}
            placeholderTextColor={colors.onSurfaceVariant}
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <AppText style={[styles.modalHint, { color: colors.onSurfaceVariant }]}>
            {t("widgets.aiTutor.settings.hint", {
              defaultValue: "Get your API key from Google AI Studio (aistudio.google.com)",
            })}
          </AppText>

          {geminiApiKey && (
            <View style={styles.currentKeyContainer}>
              <Icon name="check-circle" size={16} color={colors.primary} />
              <AppText style={{ color: colors.primary, marginLeft: 8 }}>
                {t("widgets.aiTutor.settings.keyConfigured", { defaultValue: "API key configured" })}
              </AppText>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary, borderRadius: borderRadius.medium },
            ]}
            onPress={handleSaveApiKey}
            disabled={isValidating}
          >
            {isValidating ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <AppText style={{ color: colors.onPrimary, fontWeight: "600" }}>
                {t("widgets.aiTutor.settings.save", { defaultValue: "Save" })}
              </AppText>
            )}
          </TouchableOpacity>

          {geminiApiKey && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setApiKey("gemini", null);
                setApiKeyInput("");
              }}
            >
              <AppText style={{ color: colors.error }}>
                {t("widgets.aiTutor.settings.clear", { defaultValue: "Clear API Key" })}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Settings button */}
      <TouchableOpacity
        style={[styles.settingsButton, { backgroundColor: colors.surfaceVariant }]}
        onPress={() => setShowSettings(true)}
      >
        <Icon
          name={geminiApiKey ? "cog" : "key-plus"}
          size={18}
          color={geminiApiKey ? colors.onSurfaceVariant : colors.primary}
        />
      </TouchableOpacity>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("widgets.aiTutor.thinking", { defaultValue: "Thinking..." })}
          </AppText>
        </View>
      )}

      {/* Input */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.onSurface }]}
          placeholder={
            geminiApiKey
              ? t("widgets.aiTutor.placeholder", { defaultValue: "Ask me anything..." })
              : t("widgets.aiTutor.setupRequired", { defaultValue: "Tap ⚙️ to add API key" })
          }
          placeholderTextColor={colors.onSurfaceVariant}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          editable={!!geminiApiKey}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: inputText.trim() && geminiApiKey ? colors.primary : colors.outline,
              borderRadius: 18,
            },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading || !geminiApiKey}
        >
          <Icon name="send" size={18} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {renderSettingsModal()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 300,
  },
  settingsButton: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
  },
  messagesList: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 40,
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 12,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  userBubble: {
    alignSelf: "flex-end",
    marginLeft: "15%",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    marginRight: "15%",
  },
  avatarContainer: {
    marginRight: 8,
    marginTop: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    marginTop: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  apiKeyInput: {
    padding: 12,
    fontSize: 14,
  },
  modalHint: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  currentKeyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  saveButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 20,
  },
  clearButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
});
