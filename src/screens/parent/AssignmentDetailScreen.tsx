/**
 * AssignmentDetailScreen - Fixed Screen
 *
 * Purpose: Display detailed assignment information with submission status
 * Type: Fixed (not widget-based)
 * Accessible from: assignments widgets, child-assignments, schedule
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
  RefreshControl,
  Linking,
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
import {
  useAssignmentDetailQuery,
  AssignmentAttachment,
} from "../../hooks/queries/useAssignmentDetailQuery";
import {
  useSubmissionQuery,
  useCreateSubmission,
  SubmissionAttachment,
} from "../../hooks/queries/useSubmissionQuery";

// File picking
import { launchImageLibrary } from "react-native-image-picker";
import ImageCropPicker from "react-native-image-crop-picker";
import ReactNativeBlobUtil from "react-native-blob-util";
import { NativeModules } from "react-native";

const { FilePicker } = NativeModules;

type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  route?: any;
  onFocused?: () => void;
};

// Assignment type icons
const TYPE_ICONS: Record<string, string> = {
  homework: "clipboard-text",
  project: "folder-star",
  practice: "pencil",
  classwork: "school",
  quiz: "help-circle",
  test: "file-document-edit",
};

// Status colors
const STATUS_COLORS: Record<string, string> = {
  draft: "#9E9E9E",
  published: "#4CAF50",
  closed: "#F44336",
};

// Attachment type icons
const ATTACHMENT_ICONS: Record<string, string> = {
  pdf: "file-pdf-box",
  image: "file-image",
  doc: "file-word",
  video: "file-video",
  audio: "file-music",
  other: "file-document",
};

export const AssignmentDetailScreen: React.FC<Props> = ({
  screenId = "assignment-detail",
  role = "student",
  navigation: navProp,
  route: routeProp,
  onFocused,
}) => {
  // === HOOKS ===
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation("common");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const routeHook = useRoute<any>();
  const route = routeProp || routeHook;

  // Get params from route
  const assignmentId = route.params?.assignmentId || route.params?.id || "";

  // Debug logging
  if (__DEV__) {
    console.log("[AssignmentDetailScreen] routeProp:", routeProp);
    console.log("[AssignmentDetailScreen] route:", route);
    console.log("[AssignmentDetailScreen] route.params:", route?.params);
    console.log("[AssignmentDetailScreen] assignmentId:", assignmentId);
  }

  // === DATA ===
  const { data, isLoading, isFetching, error, refetch, status, fetchStatus } = useAssignmentDetailQuery(assignmentId);
  const [refreshing, setRefreshing] = useState(false);

  // Submission state
  const studentId = "96055c84-a9ee-496d-8360-6b7cea64b928"; // TODO: Get from auth context
  const { data: existingSubmission, isLoading: submissionLoading } = useSubmissionQuery(assignmentId, studentId);
  const createSubmission = useCreateSubmission();
  const [submissionText, setSubmissionText] = useState("");
  const [submissionAttachments, setSubmissionAttachments] = useState<SubmissionAttachment[]>([]);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  // Debug logging for query state
  if (__DEV__) {
    console.log("[AssignmentDetailScreen] Query state:", { 
      isLoading, 
      isFetching,
      status,
      fetchStatus,
      error: error?.message, 
      hasData: !!data,
      hasSubmission: !!existingSubmission,
    });
    if (data) console.log("[AssignmentDetailScreen] Data:", data.id, data.title);
    if (error) console.log("[AssignmentDetailScreen] Error:", error);
  }

  // Determine if user is a student (can submit) or parent (view only)
  const isStudent = role === "student";
  const hasSubmitted = !!existingSubmission;
  const canSubmit = isStudent && data?.status === "published" && !hasSubmitted;

  // === LIFECYCLE ===
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { assignmentId, role },
    });
  }, [screenId, assignmentId, role]);

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

  const handleAttachmentPress = useCallback(
    async (attachment: AssignmentAttachment) => {
      trackEvent("attachment_pressed", {
        attachmentId: attachment.id,
        type: attachment.type,
      });
      if (attachment.url) {
        try {
          const canOpen = await Linking.canOpenURL(attachment.url);
          if (canOpen) {
            await Linking.openURL(attachment.url);
          } else {
            Alert.alert(
              t("errors.title", { defaultValue: "Error" }),
              t("errors.openUrl", { defaultValue: "Could not open link" })
            );
          }
        } catch {
          Alert.alert(
            t("errors.title", { defaultValue: "Error" }),
            t("errors.openUrl", { defaultValue: "Could not open link" })
          );
        }
      }
    },
    [trackEvent, t]
  );

  const handleToggleSubmissionForm = useCallback(() => {
    setShowSubmissionForm((prev) => !prev);
  }, []);

  const handlePickImage = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        quality: 0.8,
        selectionLimit: 5,
      });

      if (result.assets && result.assets.length > 0) {
        const newAttachments: SubmissionAttachment[] = result.assets.map((asset, index) => ({
          id: `img-${Date.now()}-${index}`,
          name: asset.fileName || `Image_${index + 1}.jpg`,
          url: asset.uri || "",
          type: "image" as const,
          size_bytes: asset.fileSize,
        }));
        setSubmissionAttachments((prev) => [...prev, ...newAttachments]);
        trackEvent("attachment_added", { type: "image", count: newAttachments.length });
      }
    } catch (err) {
      Alert.alert(
        t("errors.title", { defaultValue: "Error" }),
        t("assignmentDetail.pickImageFailed", { defaultValue: "Failed to pick image" })
      );
    }
  }, [trackEvent, t]);

  const handleTakePhoto = useCallback(async () => {
    try {
      const image = await ImageCropPicker.openCamera({
        mediaType: "photo",
        compressImageQuality: 0.8,
        cropping: false,
      });

      const newAttachment: SubmissionAttachment = {
        id: `photo-${Date.now()}`,
        name: image.filename || `Photo_${Date.now()}.jpg`,
        url: image.path,
        type: "image" as const,
        size_bytes: image.size,
      };
      setSubmissionAttachments((prev) => [...prev, newAttachment]);
      trackEvent("attachment_added", { type: "camera" });
    } catch (err: any) {
      // User cancelled
      if (err?.code === "E_PICKER_CANCELLED") {
        return;
      }
      if (__DEV__) {
        console.log("[AssignmentDetailScreen] Camera exception:", err);
      }
      Alert.alert(
        t("errors.title", { defaultValue: "Error" }),
        err?.message || t("assignmentDetail.takePhotoFailed", { defaultValue: "Failed to open camera" })
      );
    }
  }, [trackEvent, t]);

  const handlePickDocument = useCallback(async () => {
    // Use native FilePicker module to open Android's file picker for PDFs/docs
    try {
      const result = await FilePicker.pickFile();
      
      if (result) {
        const fileName = result.name || "Document";
        const mimeType = result.type || "";
        const isPdf = mimeType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");
        const isDoc = mimeType.includes("doc") || mimeType.includes("word") || 
                      fileName.toLowerCase().endsWith(".doc") || fileName.toLowerCase().endsWith(".docx");
        const isImage = mimeType.includes("image");
        
        let fileType: "pdf" | "doc" | "image" | "other" = "other";
        if (isPdf) fileType = "pdf";
        else if (isDoc) fileType = "doc";
        else if (isImage) fileType = "image";
        
        const newAttachment: SubmissionAttachment = {
          id: `doc-${Date.now()}`,
          name: fileName,
          url: result.uri,
          type: fileType,
          size_bytes: result.size,
        };
        
        setSubmissionAttachments((prev) => [...prev, newAttachment]);
        trackEvent("attachment_added", { type: fileType });
      }
    } catch (err: any) {
      // User cancelled - not an error
      if (err?.code === "E_PICKER_CANCELLED") {
        return;
      }
      if (__DEV__) {
        console.log("[AssignmentDetailScreen] File picker error:", err);
      }
      Alert.alert(
        t("errors.title", { defaultValue: "Error" }),
        t("assignmentDetail.pickFileFailed", { defaultValue: "Failed to pick file" })
      );
    }
  }, [trackEvent, t]);

  const handleRemoveAttachment = useCallback((attachmentId: string) => {
    setSubmissionAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    trackEvent("attachment_removed", { attachmentId });
  }, [trackEvent]);

  const handleSubmitAssignment = useCallback(async () => {
    if (!isOnline) {
      Alert.alert(
        t("offline.title", { defaultValue: "You're Offline" }),
        t("assignmentDetail.submitOffline", {
          defaultValue: "You need internet connection to submit",
        })
      );
      return;
    }

    if (!submissionText.trim() && submissionAttachments.length === 0) {
      Alert.alert(
        t("assignmentDetail.submitError", { defaultValue: "Cannot Submit" }),
        t("assignmentDetail.emptySubmission", {
          defaultValue: "Please enter your answer or attach a file",
        })
      );
      return;
    }

    trackEvent("submit_assignment_pressed", { assignmentId, attachmentCount: submissionAttachments.length });

    try {
      await createSubmission.mutateAsync({
        assignment_id: assignmentId,
        student_id: studentId,
        submission_text: submissionText.trim(),
        attachments: submissionAttachments,
      });

      Alert.alert(
        t("assignmentDetail.submitSuccess", { defaultValue: "Submitted!" }),
        t("assignmentDetail.submitSuccessMessage", {
          defaultValue: "Your assignment has been submitted successfully.",
        })
      );
      setSubmissionText("");
      setSubmissionAttachments([]);
      setShowSubmissionForm(false);
    } catch (err) {
      Alert.alert(
        t("errors.title", { defaultValue: "Error" }),
        t("assignmentDetail.submitFailed", {
          defaultValue: "Failed to submit assignment. Please try again.",
        })
      );
    }
  }, [isOnline, assignmentId, studentId, submissionText, submissionAttachments, trackEvent, t, createSubmission]);

  // === HELPER FUNCTIONS ===
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
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
    if (!data) return "";
    if (data.is_overdue)
      return t("assignmentDetail.overdue", { defaultValue: "Overdue" });
    if (data.days_remaining === 0)
      return t("assignmentDetail.dueToday", { defaultValue: "Due today" });
    if (data.days_remaining === 1)
      return t("assignmentDetail.dueTomorrow", { defaultValue: "Due tomorrow" });
    return t("assignmentDetail.dueDays", {
      defaultValue: "Due in {{days}} days",
      days: data.days_remaining,
    });
  };

  // === LOADING STATE ===
  // Show loading if query is pending (initial load) or fetching
  if (status === 'pending' || isLoading) {
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
          <AppButton
            label={t("actions.goBack", { defaultValue: "Go Back" })}
            onPress={handleBack}
          />
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Assignment Header Card */}
        <AppCard style={styles.mainCard}>
          <View style={styles.assignmentHeader}>
            <View
              style={[
                styles.typeIcon,
                { backgroundColor: `${data.subject?.color || colors.primary}20` },
              ]}
            >
              <Icon
                name={TYPE_ICONS[data.assignment_type] || "clipboard-text"}
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

          {/* Status Badges */}
          <View style={styles.badgesRow}>
            <View
              style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[data.status]}20` }]}
            >
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[data.status] }]} />
              <AppText style={[styles.statusText, { color: STATUS_COLORS[data.status] }]}>
                {t(`assignmentDetail.status.${data.status}`, { defaultValue: data.status })}
              </AppText>
            </View>

            {/* Due Date Badge */}
            <View style={[styles.dueBadge, { backgroundColor: `${getDueDateColor()}20` }]}>
              <Icon name="clock-outline" size={12} color={getDueDateColor()} />
              <AppText style={[styles.dueBadgeText, { color: getDueDateColor() }]}>
                {getDueDateText()}
              </AppText>
            </View>
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
              {t(`assignmentDetail.types.${data.assignment_type}`, {
                defaultValue: data.assignment_type,
              })}
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
            <AppText style={[styles.detailValue, { color: colors.onSurface }]}>
              {formatDateTime(data.due_date)}
            </AppText>
          </View>

          {/* Max Score */}
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <View style={styles.detailLabel}>
              <Icon name="star" size={18} color={colors.onSurfaceVariant} />
              <AppText style={[styles.detailLabelText, { color: colors.onSurfaceVariant }]}>
                {t("assignmentDetail.maxScore", { defaultValue: "Max Score" })}
              </AppText>
            </View>
            <AppText style={[styles.detailValue, { color: colors.primary, fontWeight: "700" }]}>
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
              {t("assignmentDetail.attachments", { defaultValue: "Attachments" })} (
              {data.attachments.length})
            </AppText>
            {data.attachments.map((attachment, index) => (
              <TouchableOpacity
                key={attachment.id || index}
                style={[
                  styles.attachmentItem,
                  index > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant },
                ]}
                onPress={() => handleAttachmentPress(attachment)}
                activeOpacity={0.7}
              >
                <View style={[styles.attachmentIcon, { backgroundColor: colors.surfaceVariant }]}>
                  <Icon
                    name={ATTACHMENT_ICONS[attachment.type] || "file-document"}
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.attachmentInfo}>
                  <AppText
                    style={[styles.attachmentName, { color: colors.onSurface }]}
                    numberOfLines={1}
                  >
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

        {/* Existing Submission Card */}
        {isStudent && hasSubmitted && existingSubmission && (
          <AppCard style={styles.submissionCard}>
            <View style={styles.submissionHeader}>
              <Icon name="check-circle" size={24} color={colors.success} />
              <AppText style={[styles.submissionTitle, { color: colors.success }]}>
                {t("assignmentDetail.submitted", { defaultValue: "Submitted" })}
              </AppText>
            </View>
            <AppText style={[styles.submissionDate, { color: colors.onSurfaceVariant }]}>
              {t("assignmentDetail.submittedOn", { defaultValue: "Submitted on" })}{" "}
              {new Date(existingSubmission.submitted_at).toLocaleDateString()}
            </AppText>
            {existingSubmission.submission_text && (
              <View style={[styles.submissionContent, { backgroundColor: colors.surfaceVariant }]}>
                <AppText style={[styles.submissionText, { color: colors.onSurface }]}>
                  {existingSubmission.submission_text}
                </AppText>
              </View>
            )}
            {existingSubmission.status === "graded" && existingSubmission.score !== null && (
              <View style={styles.gradeSection}>
                <AppText style={[styles.gradeLabel, { color: colors.onSurfaceVariant }]}>
                  {t("assignmentDetail.score", { defaultValue: "Score" })}:
                </AppText>
                <AppText style={[styles.gradeValue, { color: colors.primary }]}>
                  {existingSubmission.score}/{data.max_score}
                </AppText>
              </View>
            )}
            {existingSubmission.feedback && (
              <View style={[styles.feedbackSection, { borderTopColor: colors.outlineVariant }]}>
                <AppText style={[styles.feedbackLabel, { color: colors.onSurfaceVariant }]}>
                  {t("assignmentDetail.feedback", { defaultValue: "Teacher Feedback" })}:
                </AppText>
                <AppText style={[styles.feedbackText, { color: colors.onSurface }]}>
                  {existingSubmission.feedback}
                </AppText>
              </View>
            )}
          </AppCard>
        )}

        {/* Submit Section (for students who haven't submitted) */}
        {isStudent && data.status === "published" && !hasSubmitted && (
          <AppCard style={styles.submitCard}>
            <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
              {t("assignmentDetail.yourAnswer", { defaultValue: "Your Answer" })}
            </AppText>
            
            {/* Submission Form - Always visible */}
            <View style={styles.submissionForm}>
              {/* Text Input */}
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceVariant,
                    color: colors.onSurface,
                    borderColor: colors.outline,
                  },
                ]}
                placeholder={t("assignmentDetail.answerPlaceholder", {
                  defaultValue: "Type your answer here...",
                })}
                placeholderTextColor={colors.onSurfaceVariant}
                value={submissionText}
                onChangeText={setSubmissionText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!data.is_overdue}
              />

              {/* Attachment Buttons */}
              <AppText style={[styles.attachLabel, { color: colors.onSurfaceVariant }]}>
                {t("assignmentDetail.attachFiles", { defaultValue: "Attach Files" })}
              </AppText>
              <View style={styles.attachmentButtons}>
                <TouchableOpacity
                  style={[styles.attachButton, { backgroundColor: colors.surfaceVariant }]}
                  onPress={handleTakePhoto}
                  disabled={data.is_overdue}
                >
                  <Icon name="camera" size={22} color={data.is_overdue ? colors.onSurfaceVariant : colors.primary} />
                  <AppText style={[styles.attachButtonText, { color: data.is_overdue ? colors.onSurfaceVariant : colors.onSurface }]}>
                    {t("assignmentDetail.camera", { defaultValue: "Camera" })}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.attachButton, { backgroundColor: colors.surfaceVariant }]}
                  onPress={handlePickImage}
                  disabled={data.is_overdue}
                >
                  <Icon name="image" size={22} color={data.is_overdue ? colors.onSurfaceVariant : colors.primary} />
                  <AppText style={[styles.attachButtonText, { color: data.is_overdue ? colors.onSurfaceVariant : colors.onSurface }]}>
                    {t("assignmentDetail.gallery", { defaultValue: "Gallery" })}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.attachButton, { backgroundColor: colors.surfaceVariant }]}
                  onPress={handlePickDocument}
                  disabled={data.is_overdue}
                >
                  <Icon name="file-document" size={22} color={data.is_overdue ? colors.onSurfaceVariant : colors.primary} />
                  <AppText style={[styles.attachButtonText, { color: data.is_overdue ? colors.onSurfaceVariant : colors.onSurface }]}>
                    {t("assignmentDetail.files", { defaultValue: "Files" })}
                  </AppText>
                </TouchableOpacity>
              </View>

                {/* Attached Files Preview */}
                {submissionAttachments.length > 0 && (
                  <View style={styles.attachedFilesSection}>
                    <AppText style={[styles.attachedFilesTitle, { color: colors.onSurfaceVariant }]}>
                      {t("assignmentDetail.attachedFiles", { defaultValue: "Attached Files" })} ({submissionAttachments.length})
                    </AppText>
                    {submissionAttachments.map((attachment) => (
                      <View
                        key={attachment.id}
                        style={[styles.attachedFileItem, { backgroundColor: colors.surfaceVariant }]}
                      >
                        <Icon
                          name={attachment.type === "image" ? "image" : attachment.type === "pdf" ? "file-pdf-box" : "file-document"}
                          size={20}
                          color={colors.primary}
                        />
                        <AppText
                          style={[styles.attachedFileName, { color: colors.onSurface }]}
                          numberOfLines={1}
                        >
                          {attachment.name}
                        </AppText>
                        <TouchableOpacity
                          onPress={() => handleRemoveAttachment(attachment.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Icon name="close-circle" size={20} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButtonLarge,
                    {
                      backgroundColor: !isOnline || createSubmission.isPending || data.is_overdue
                        ? colors.surfaceVariant
                        : colors.primary,
                    },
                  ]}
                  onPress={handleSubmitAssignment}
                  disabled={!isOnline || createSubmission.isPending || data.is_overdue}
                >
                  {createSubmission.isPending ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <>
                      <Icon 
                        name="send" 
                        size={20} 
                        color={data.is_overdue ? colors.onSurfaceVariant : colors.onPrimary} 
                      />
                      <AppText 
                        style={[
                          styles.submitButtonLargeText, 
                          { color: data.is_overdue ? colors.onSurfaceVariant : colors.onPrimary }
                        ]}
                      >
                        {t("assignmentDetail.submitAssignment", { defaultValue: "Submit Assignment" })}
                      </AppText>
                    </>
                  )}
                </TouchableOpacity>
              </View>

            {data.is_overdue && (
              <View style={[styles.overdueNotice, { backgroundColor: `${colors.error}15` }]}>
                <Icon name="clock-alert" size={20} color={colors.error} />
                <AppText style={[styles.overdueText, { color: colors.error }]}>
                  {t("assignmentDetail.overdueNotice", {
                    defaultValue: "This assignment is past due",
                  })}
                </AppText>
              </View>
            )}

            {!isOnline && (
              <AppText style={[styles.offlineNote, { color: colors.onSurfaceVariant }]}>
                {t("assignmentDetail.submitOffline", {
                  defaultValue: "You need internet connection to submit",
                })}
              </AppText>
            )}
          </AppCard>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 16, textAlign: "center", marginVertical: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 8,
  },
  headerRight: { width: 32 },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  mainCard: { padding: 16 },
  assignmentHeader: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  assignmentInfo: { flex: 1 },
  assignmentTitle: { fontSize: 18, fontWeight: "700", lineHeight: 24 },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  subjectName: { fontSize: 13 },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  dueBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  dueBadgeText: { fontSize: 11, fontWeight: "600" },
  detailsCard: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 14 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  detailLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabelText: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: "500" },
  instructionsCard: { padding: 16 },
  instructionsText: { fontSize: 14, lineHeight: 22 },
  attachmentsCard: { padding: 16 },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  attachmentIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentInfo: { flex: 1 },
  attachmentName: { fontSize: 14, fontWeight: "500" },
  attachmentSize: { fontSize: 12, marginTop: 2 },
  actionContainer: {
    marginTop: 8,
    gap: 8,
  },
  overdueNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  overdueText: {
    fontSize: 14,
    fontWeight: "500",
  },
  offlineNote: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  bottomSpacer: { height: 24 },
  // Submission styles
  submissionCard: { padding: 16 },
  submissionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  submissionDate: {
    fontSize: 12,
    marginBottom: 12,
  },
  submissionContent: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  submissionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  gradeSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  gradeLabel: {
    fontSize: 14,
  },
  gradeValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  feedbackSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  feedbackLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
  },
  submitCard: { padding: 16 },
  startSubmitButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
  },
  startSubmitText: {
    fontSize: 14,
  },
  submissionForm: {
    gap: 12,
  },
  textInput: {
    minHeight: 120,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  submitActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Attachment button styles
  attachmentButtons: {
    flexDirection: "row",
    gap: 10,
  },
  attachButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  attachButtonText: {
    fontSize: 11,
    fontWeight: "500",
  },
  attachedFilesSection: {
    gap: 8,
  },
  attachedFilesTitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  attachedFileItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    gap: 10,
  },
  attachedFileName: {
    flex: 1,
    fontSize: 13,
  },
  attachLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  submitButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonLargeText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AssignmentDetailScreen;
