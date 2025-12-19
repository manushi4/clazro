/**
 * DoubtSubmitScreen - Submit a new doubt
 * 
 * Purpose: Form to submit a new doubt/question to teachers
 * Type: Fixed (not widget-based)
 * Accessible from: DoubtsInboxWidget "Ask New" button, doubts-home screen
 */

import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { useAppTheme } from "../../theme/useAppTheme";
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb } from "../../error/errorReporting";
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";
import { AppText } from "../../ui/components/AppText";

const SUBJECTS = [
  { id: "math", name: "Mathematics", icon: "calculator" },
  { id: "physics", name: "Physics", icon: "atom" },
  { id: "chemistry", name: "Chemistry", icon: "flask" },
  { id: "biology", name: "Biology", icon: "leaf" },
  { id: "english", name: "English", icon: "alphabetical" },
  { id: "history", name: "History", icon: "book-open-page-variant" },
];

const PRIORITIES = [
  { id: "low", name: "Low", color: "#6B7280" },
  { id: "medium", name: "Medium", color: "#F59E0B" },
  { id: "high", name: "High", color: "#EF4444" },
];

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
};

export const DoubtSubmitScreen: React.FC<Props> = ({
  screenId = "doubt-submit",
  navigation: navProp,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("screens");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
    });
  }, [screenId]);

  const handleBack = useCallback(() => {
    if (title || description) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [navigation, title, description]);

  const handleSubmit = useCallback(async () => {
    if (!selectedSubject) {
      Alert.alert("Missing Subject", "Please select a subject for your doubt.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a title for your doubt.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Missing Description", "Please describe your doubt in detail.");
      return;
    }
    if (!isOnline) {
      Alert.alert("Offline", "You need to be online to submit a doubt. Please try again when connected.");
      return;
    }

    setIsSubmitting(true);
    trackEvent("doubt_submit_attempt", { screen: screenId, subject: selectedSubject, priority: selectedPriority });

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      trackEvent("doubt_submit_success", { screen: screenId });
      Alert.alert(
        "Doubt Submitted! 🎉",
        "Your doubt has been submitted successfully. You'll be notified when a teacher responds.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }, 1500);
  }, [selectedSubject, title, description, isOnline, trackEvent, screenId, selectedPriority, navigation]);

  const isFormValid = selectedSubject && title.trim() && description.trim();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="close" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          Ask a Doubt
        </AppText>
        <View style={styles.headerRight} />
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
          {/* Subject Selection */}
          <View style={styles.section}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Select Subject *
            </AppText>
            <View style={styles.subjectsGrid}>
              {SUBJECTS.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.subjectChip,
                    { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.sm },
                    selectedSubject === subject.id && { backgroundColor: colors.primary + "20", borderColor: colors.primary, borderWidth: 1 },
                  ]}
                  onPress={() => setSelectedSubject(subject.id)}
                >
                  <Icon
                    name={subject.icon}
                    size={18}
                    color={selectedSubject === subject.id ? colors.primary : colors.onSurfaceVariant}
                  />
                  <AppText
                    style={[
                      styles.subjectChipText,
                      { color: selectedSubject === subject.id ? colors.primary : colors.onSurfaceVariant },
                    ]}
                  >
                    {subject.name}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority Selection */}
          <View style={styles.section}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Priority
            </AppText>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((priority) => (
                <TouchableOpacity
                  key={priority.id}
                  style={[
                    styles.priorityChip,
                    { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.sm },
                    selectedPriority === priority.id && { backgroundColor: priority.color + "20", borderColor: priority.color, borderWidth: 1 },
                  ]}
                  onPress={() => setSelectedPriority(priority.id)}
                >
                  <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
                  <AppText
                    style={[
                      styles.priorityText,
                      { color: selectedPriority === priority.id ? priority.color : colors.onSurfaceVariant },
                    ]}
                  >
                    {priority.name}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Title *
            </AppText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderRadius: borderRadius.sm },
              ]}
              placeholder="What's your doubt about?"
              placeholderTextColor={colors.onSurfaceVariant}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <AppText style={[styles.charCount, { color: colors.onSurfaceVariant }]}>
              {title.length}/100
            </AppText>
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Description *
            </AppText>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderRadius: borderRadius.sm },
              ]}
              placeholder="Describe your doubt in detail. Include what you've tried and where you're stuck."
              placeholderTextColor={colors.onSurfaceVariant}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <AppText style={[styles.charCount, { color: colors.onSurfaceVariant }]}>
              {description.length}/1000
            </AppText>
          </View>

          {/* Tips */}
          <View style={[styles.tipsCard, { backgroundColor: colors.primary + "10", borderRadius: borderRadius.md }]}>
            <Icon name="lightbulb-outline" size={20} color={colors.primary} />
            <View style={styles.tipsContent}>
              <AppText style={[styles.tipsTitle, { color: colors.primary }]}>Tips for a good doubt</AppText>
              <AppText style={[styles.tipsText, { color: colors.onSurfaceVariant }]}>
                • Be specific about what you don't understand{"\n"}
                • Include the topic or chapter name{"\n"}
                • Mention what you've already tried
              </AppText>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.footer, { borderTopColor: colors.outlineVariant }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: isFormValid ? colors.primary : colors.surfaceVariant, borderRadius: borderRadius.md },
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <AppText style={styles.submitText}>Submitting...</AppText>
            ) : (
              <>
                <Icon name="send" size={18} color={isFormValid ? "#fff" : colors.onSurfaceVariant} />
                <AppText style={[styles.submitText, { color: isFormValid ? "#fff" : colors.onSurfaceVariant }]}>
                  Submit Doubt
                </AppText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center" },
  headerRight: { width: 32 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 20 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "600" },
  subjectsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  subjectChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  subjectChipText: { fontSize: 13, fontWeight: "500" },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, flex: 1, justifyContent: "center" },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityText: { fontSize: 13, fontWeight: "500" },
  input: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textArea: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 120 },
  charCount: { fontSize: 11, textAlign: "right" },
  tipsCard: { flexDirection: "row", padding: 14, gap: 12 },
  tipsContent: { flex: 1, gap: 4 },
  tipsTitle: { fontSize: 13, fontWeight: "600" },
  tipsText: { fontSize: 12, lineHeight: 18 },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  submitButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  submitText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});

export default DoubtSubmitScreen;
