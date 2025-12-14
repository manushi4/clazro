/**
 * AssignmentDetailScreen - View assignment details and submit work
 *
 * Features:
 * - Assignment details (title, subject, description, instructions, due date, points)
 * - Teacher information (name, profile)
 * - Submission status tracking (pending, submitted, graded, overdue, late)
 * - Score display with percentage and grade letter (if graded)
 * - Teacher feedback display (if graded)
 * - Teacher attachments (assignment materials)
 * - Student attachments (submitted files)
 * - Days until due / days overdue calculation (FIXED - accurate date calculation)
 * - SUBMISSION FORM (NEW - text and photo upload)
 * - File upload to Supabase Storage
 * - Create submission mutation
 * - Pull to refresh
 *
 * Data Sources:
 * - assignments table (with teacher join)
 * - assignment_submissions table (with grader join)
 * - Supabase Storage (for file uploads)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Linking, Alert, TextInput as RNTextInput, ScrollView, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Badge, Button } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import type { ParentStackParamList } from '../../types/navigation';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { ProgressBar } from 'react-native-paper';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

type Props = NativeStackScreenProps<ParentStackParamList, 'AssignmentDetail'>;

type SubmissionStatus = 'pending' | 'submitted' | 'graded' | 'overdue' | 'late';

interface Assignment {
  id: string;
  teacher_id: string;
  class_id: string;
  subject: string;
  title: string;
  description: string | null;
  instructions: string | null;
  total_points: number;
  assigned_date: string;
  due_date: string;
  status: string;
  attachments: any[] | null;
  created_at: string;
  // From join
  teacher: {
    id: string;
    full_name: string;
  } | null;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_date: string;
  submission_text: string | null;
  attachments: any | null;
  status: string;
  score: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  // From join
  graded_by_teacher: {
    id: string;
    full_name: string;
  } | null;
}

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

const AssignmentDetailScreen: React.FC<Props> = ({ route }) => {
  const { assignmentId, studentId } = route.params;
  const queryClient = useQueryClient();

  // UI State
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  // Submission Form State
  const [submissionText, setSubmissionText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    trackScreenView('AssignmentDetail', {
      from: 'AssignmentsList',
      assignmentId,
      studentId,
    });
  }, [assignmentId, studentId]);

  // Fetch assignment details
  const {
    data: assignment,
    isLoading: loadingAssignment,
    error: assignmentError,
    refetch: refetchAssignment,
  } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      console.log('🔍 [AssignmentDetail] Fetching assignment:', assignmentId);
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          teacher:profiles!teacher_id(id, full_name)
        `)
        .eq('id', assignmentId)
        .single();

      if (error) {
        console.error('❌ [AssignmentDetail] Error fetching assignment:', error);
        throw error;
      }

      console.log('✅ [AssignmentDetail] Assignment loaded');
      return data as Assignment;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch student submission
  const {
    data: submission,
    isLoading: loadingSubmission,
    error: submissionError,
    refetch: refetchSubmission,
  } = useQuery({
    queryKey: ['submission', assignmentId, studentId],
    queryFn: async () => {
      console.log('🔍 [AssignmentDetail] Fetching submission for student:', studentId);
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          graded_by_teacher:profiles!graded_by(id, full_name)
        `)
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .maybeSingle(); // Use maybeSingle - no error if not found

      if (error) {
        console.error('❌ [AssignmentDetail] Error fetching submission:', error);
        throw error;
      }

      console.log('✅ [AssignmentDetail] Submission loaded:', data ? 'Found' : 'Not submitted yet');
      return data as Submission | null;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Combined loading/error states
  const isLoading = loadingAssignment || loadingSubmission;
  const error = assignmentError || submissionError;

  // Pull to refresh
  const handleRefresh = () => {
    refetchAssignment();
    refetchSubmission();
  };

  // ✅ FIXED: Days until due calculation with proper date normalization
  const daysRemaining = useMemo(() => {
    if (!assignment?.due_date) return null;

    // Normalize both dates to midnight for accurate day comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(assignment.due_date);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return days;
  }, [assignment]); // ✅ Correct dependency

  // Calculation: Submission status
  const submissionStatus = useMemo((): SubmissionStatus => {
    if (!submission) {
      return (daysRemaining ?? 0) < 0 ? 'overdue' : 'pending';
    }
    return submission.status as SubmissionStatus;
  }, [submission, daysRemaining]);

  // Calculation: Score percentage (if graded)
  const scorePercentage = useMemo(() => {
    if (!submission?.score || !assignment?.total_points) return null;
    return (submission.score / assignment.total_points) * 100;
  }, [submission?.score, assignment?.total_points]);

  // Calculation: Grade letter
  const gradeLetter = useMemo(() => {
    if (scorePercentage === null) return null;
    if (scorePercentage >= 90) return 'A+';
    if (scorePercentage >= 80) return 'A';
    if (scorePercentage >= 70) return 'B';
    if (scorePercentage >= 60) return 'C';
    if (scorePercentage >= 50) return 'D';
    return 'F';
  }, [scorePercentage]);

  // Calculation: Urgency color
  const getUrgencyColor = (days: number | null): string => {
    if (days === null) return Colors.textSecondary;
    if (days < 0) return Colors.error; // Overdue
    if (days <= 2) return Colors.error; // 2 days or less
    if (days <= 7) return Colors.warning; // 1 week or less
    return Colors.success; // More than 1 week
  };

  // Get subject color
  const getSubjectColor = (subject: string): string => {
    const colors: Record<string, string> = {
      'Mathematics': Colors.primary,
      'Science': Colors.success,
      'English': Colors.accent,
      'Physics': Colors.primary,
      'Chemistry': Colors.warning,
      'Biology': Colors.success,
      'Computer Science': Colors.primary,
    };
    return colors[subject] || Colors.textSecondary;
  };

  // Get status badge variant
  const getStatusVariant = (status: SubmissionStatus): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'graded': return 'success';
      case 'submitted': return 'info';
      case 'overdue': return 'error';
      case 'late': return 'warning';
      default: return 'warning';
    }
  };

  // Get score color
  const getScoreColor = (percentage: number | null): string => {
    if (percentage === null) return Colors.textSecondary;
    if (percentage >= 70) return Colors.success;
    if (percentage >= 50) return Colors.warning;
    return Colors.error;
  };

  // 📤 NEW: File Upload to Supabase Storage
  const uploadFileToStorage = async (file: any): Promise<FileAttachment> => {
    try {
      const fileName = `${Date.now()}_${file.name || 'file'}`;
      const filePath = `assignment_submissions/${studentId}/${assignmentId}/${fileName}`;

      console.log('📤 [Upload] Uploading file:', fileName);

      // Convert file to blob for upload
      const fileBlob = await fetch(file.uri).then(r => r.blob());

      const { data, error } = await supabase.storage
        .from('assignments')
        .upload(filePath, fileBlob, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('assignments')
        .getPublicUrl(filePath);

      console.log('✅ [Upload] File uploaded successfully');

      return {
        name: file.name || fileName,
        url: urlData.publicUrl,
        type: file.type || 'application/octet-stream',
        size: file.fileSize || file.size || 0,
      };
    } catch (err) {
      console.error('❌ [Upload] Error:', err);
      throw err;
    }
  };

  // Note: For PDF/document uploads, students can:
  // 1. Upload photos of documents (using camera/gallery)
  // 2. Or teacher can accept Google Drive/OneDrive links in the text field

  // 🖼️ NEW: Pick Image from Gallery
  const handlePickImage = async () => {
    try {
      trackAction('pick_image', 'AssignmentDetail', { assignmentId });

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
      });

      if (result.assets && result.assets[0]) {
        setUploading(true);
        const uploadedFile = await uploadFileToStorage({
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || 'photo.jpg',
          type: result.assets[0].type || 'image/jpeg',
          size: result.assets[0].fileSize,
        });
        setAttachments(prev => [...prev, uploadedFile]);
        setUploading(false);
        Alert.alert('Success', 'Photo added successfully!');
      }
    } catch (err: any) {
      setUploading(false);
      console.error('Image picker error:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // 📸 NEW: Take Photo with Camera
  const handleTakePhoto = async () => {
    try {
      trackAction('take_photo', 'AssignmentDetail', { assignmentId });

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        saveToPhotos: true,
      });

      if (result.assets && result.assets[0]) {
        setUploading(true);
        const uploadedFile = await uploadFileToStorage({
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || 'photo.jpg',
          type: result.assets[0].type || 'image/jpeg',
          size: result.assets[0].fileSize,
        });
        setAttachments(prev => [...prev, uploadedFile]);
        setUploading(false);
        Alert.alert('Success', 'Photo added successfully!');
      }
    } catch (err: any) {
      setUploading(false);
      console.error('Camera error:', err);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // 🗑️ NEW: Remove Attachment
  const handleRemoveAttachment = (index: number) => {
    Alert.alert(
      'Remove File',
      'Are you sure you want to remove this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setAttachments(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  // ✅ NEW: Submit Assignment Mutation
  const submitAssignmentMutation = useMutation({
    mutationFn: async () => {
      console.log('📝 [Submit] Creating submission...');

      if (!submissionText.trim() && attachments.length === 0) {
        throw new Error('Please provide either text or file attachments');
      }

      const { data, error } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: studentId,
          submission_text: submissionText.trim() || null,
          attachments: attachments.length > 0 ? attachments : null,
          submission_date: new Date().toISOString(),
          status: (daysRemaining ?? 0) < 0 ? 'late' : 'submitted',
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [Submit] Error:', error);
        throw error;
      }

      console.log('✅ [Submit] Submission created successfully');
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch submission data
      queryClient.invalidateQueries({ queryKey: ['submission', assignmentId, studentId] });
      refetchSubmission();

      // Reset form
      setSubmissionText('');
      setAttachments([]);
      setShowSubmitForm(false);

      // Track success
      trackAction('submit_assignment_success', 'AssignmentDetail', { assignmentId, studentId });

      // Show success message
      Alert.alert(
        'Success! 🎉',
        'Your assignment has been submitted successfully!',
        [{ text: 'OK' }]
      );
    },
    onError: (error: any) => {
      console.error('❌ [Submit] Submission failed:', error);
      trackAction('submit_assignment_error', 'AssignmentDetail', { assignmentId, error: error.message });
      Alert.alert(
        'Submission Failed',
        error.message || 'Failed to submit assignment. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  // Handle download attachment
  const handleDownloadAttachment = async (url: string, filename: string) => {
    try {
      trackAction('download_assignment_attachment', 'AssignmentDetail', { filename });
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this file type');
      }
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Error', 'Failed to download attachment');
    }
  };

  const urgencyColor = getUrgencyColor(daysRemaining);
  const isOverdue = (daysRemaining ?? 0) < 0 && !submission;
  const canSubmit = !submission && assignment?.status === 'published';

  return (
    <BaseScreen
      scrollable={true}
      loading={isLoading}
      error={error ? 'Failed to load assignment details' : null}
      empty={!isLoading && !assignment}
      emptyBody="Assignment not found"
      onRetry={handleRefresh}
    >
      <Col sx={{ p: 'md' }} gap="md">
        {/* Section 1: Header Card */}
        <Card variant="elevated">
          <CardContent>
            <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
              <View style={{ backgroundColor: getSubjectColor(assignment?.subject || '') + '20', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                <T variant="caption" style={{ color: getSubjectColor(assignment?.subject || '') }}>
                  {assignment?.subject || 'Subject'}
                </T>
              </View>
              <Badge
                variant={getStatusVariant(submissionStatus)}
                label={submissionStatus.toUpperCase()}
              />
            </Row>

            <T variant="title" weight="bold" style={{ marginTop: Spacing.xs }}>
              {assignment?.title}
            </T>

            {assignment?.teacher && (
              <T variant="body" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                👨‍🏫 {assignment.teacher.full_name}
              </T>
            )}

            <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
              Posted {assignment ? new Date(assignment.assigned_date).toLocaleDateString() : ''}
            </T>
          </CardContent>
        </Card>

        {/* Section 2: Assignment Details Card */}
        {assignment && (
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.xs }}>
                📋 Assignment Details
              </T>

              {assignment.description && (
                <>
                  <T variant="body" color="textSecondary" style={{ marginTop: Spacing.sm }}>
                    {assignment.description}
                  </T>
                </>
              )}

              {assignment.instructions && (
                <View style={{ marginTop: Spacing.sm }}>
                  <Button
                    variant="outline"
                    onPress={() => {
                      const newState = expandedSection === 'instructions' ? null : 'instructions';
                      setExpandedSection(newState);
                      if (newState) {
                        trackAction('expand_instructions', 'AssignmentDetail', { assignmentId });
                      }
                    }}
                  >
                    {expandedSection === 'instructions' ? '▼ Hide' : '▶ Show'} Full Instructions
                  </Button>
                  {expandedSection === 'instructions' && (
                    <T variant="body" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                      {assignment.instructions}
                    </T>
                  )}
                </View>
              )}

              {/* Key Metrics */}
              <Row spaceBetween style={{ marginTop: Spacing.md }}>
                <Col>
                  <T variant="caption" color="textSecondary">Total Points</T>
                  <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.primary }}>
                    {assignment.total_points}
                  </T>
                </Col>
                <Col>
                  <T variant="caption" color="textSecondary">Assigned</T>
                  <T variant="body" weight="semiBold">
                    {new Date(assignment.assigned_date).toLocaleDateString()}
                  </T>
                </Col>
                <Col>
                  <T variant="caption" color="textSecondary">Due Date</T>
                  <T variant="body" weight="semiBold" color={isOverdue ? 'error' : 'textPrimary'}>
                    {new Date(assignment.due_date).toLocaleDateString()}
                  </T>
                </Col>
              </Row>
            </CardContent>
          </Card>
        )}

        {/* Section 3: Due Date & Status Card */}
        {daysRemaining !== null && !submission && (
          <Card
            variant="elevated"
            style={isOverdue ? { borderLeftWidth: 4, borderLeftColor: Colors.error } : {}}
          >
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                ⏰ {isOverdue ? 'OVERDUE' : 'Time Remaining'}
              </T>

              <View style={{ alignItems: 'center', paddingVertical: Spacing.md }}>
                <T
                  variant="display"
                  weight="bold"
                  style={{ fontSize: 48, color: urgencyColor }}
                >
                  {Math.abs(daysRemaining)}
                </T>
                <T variant="body" color="textSecondary">
                  {daysRemaining > 0
                    ? `day${daysRemaining === 1 ? '' : 's'} remaining`
                    : daysRemaining === 0
                    ? 'Due today'
                    : `day${Math.abs(daysRemaining) === 1 ? '' : 's'} overdue`}
                </T>
              </View>

              {isOverdue && (
                <View
                  style={{
                    padding: Spacing.sm,
                    backgroundColor: Colors.error + '20',
                    borderRadius: 8,
                  }}
                >
                  <T variant="body" color="error" style={{ textAlign: 'center' }}>
                    ⚠️ This assignment is overdue. Please submit as soon as possible.
                  </T>
                </View>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section 4: Submission Form (NEW - Conditional) */}
        {canSubmit && !showSubmitForm && (
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                📝 Submission Status
              </T>

              <View style={{ padding: Spacing.md, backgroundColor: Colors.warning + '20', borderRadius: 8 }}>
                <T variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
                  {isOverdue
                    ? '❌ Not yet submitted (OVERDUE)'
                    : '⏳ Not yet submitted'}
                </T>
                {daysRemaining !== null && daysRemaining > 0 && (
                  <T variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.xs }}>
                    {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining to submit
                  </T>
                )}
              </View>

              <Button
                variant="primary"
                onPress={() => {
                  setShowSubmitForm(true);
                  trackAction('open_submit_form', 'AssignmentDetail', { assignmentId });
                }}
                style={{ marginTop: Spacing.md }}
              >
                {isOverdue ? '⚠️ Submit Late' : '📤 Submit Assignment'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Section 4B: Submission Form (NEW - Expanded) */}
        {canSubmit && showSubmitForm && (
          <Card variant="elevated" style={{ borderLeftWidth: 4, borderLeftColor: Colors.primary }}>
            <CardContent>
              <Row spaceBetween centerV style={{ marginBottom: Spacing.md }}>
                <T variant="body" weight="semiBold">
                  📝 Submit Your Work
                </T>
                <Button
                  variant="text"
                  onPress={() => setShowSubmitForm(false)}
                >
                  Cancel
                </Button>
              </Row>

              {/* Text Input */}
              <View style={{ marginBottom: Spacing.md }}>
                <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.xs }}>
                  📝 Assignment Text
                </T>
                <RNTextInput
                  multiline
                  numberOfLines={6}
                  placeholder="Enter your work here..."
                  value={submissionText}
                  onChangeText={setSubmissionText}
                  style={{
                    borderWidth: 1,
                    borderColor: Colors.outline,
                    borderRadius: 8,
                    padding: Spacing.sm,
                    minHeight: 120,
                    textAlignVertical: 'top',
                    fontFamily: 'System',
                    fontSize: 16,
                  }}
                />
                <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs, fontStyle: 'italic' }}>
                  💡 Tip: You can add photos of your work using the buttons below
                </T>
              </View>

              {/* File Upload Buttons */}
              <View style={{ marginBottom: Spacing.md }}>
                <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.xs }}>
                  📎 Attachments (Optional)
                </T>
                <Row style={{ gap: Spacing.xs, flexWrap: 'wrap' }}>
                  <Button
                    variant="outline"
                    onPress={handlePickImage}
                    disabled={uploading}
                  >
                    🖼️ Add Photo from Gallery
                  </Button>
                  <Button
                    variant="outline"
                    onPress={handleTakePhoto}
                    disabled={uploading}
                  >
                    📷 Take Photo
                  </Button>
                </Row>
                <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs, fontStyle: 'italic' }}>
                  📸 You can upload multiple photos. For PDF documents: Take photos of each page
                </T>

                {uploading && (
                  <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                    Uploading file... Please wait
                  </T>
                )}
              </View>

              {/* Attached Files List */}
              {attachments.length > 0 && (
                <View style={{ marginBottom: Spacing.md }}>
                  <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.xs }}>
                    Attached Files ({attachments.length})
                  </T>
                  <Col gap="xs">
                    {attachments.map((file, index) => (
                      <Row
                        key={`attachment-${index}`}
                        spaceBetween
                        centerV
                        style={{
                          padding: Spacing.sm,
                          backgroundColor: Colors.surface,
                          borderRadius: 8,
                        }}
                      >
                        <Col style={{ flex: 1 }}>
                          <T variant="body">{file.name}</T>
                          <T variant="caption" color="textSecondary">
                            {(file.size / 1024).toFixed(0)} KB
                          </T>
                        </Col>
                        <Button
                          variant="text"
                          onPress={() => handleRemoveAttachment(index)}
                        >
                          Remove
                        </Button>
                      </Row>
                    ))}
                  </Col>
                </View>
              )}

              {/* Submit Button */}
              <Button
                variant="primary"
                onPress={() => {
                  if (!submissionText.trim() && attachments.length === 0) {
                    Alert.alert('Required', 'Please provide either text or file attachments');
                    return;
                  }

                  Alert.alert(
                    'Submit Assignment',
                    'Are you sure you want to submit this assignment? You cannot edit it after submission.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Submit',
                        onPress: () => submitAssignmentMutation.mutate(),
                      },
                    ]
                  );
                }}
                disabled={submitAssignmentMutation.isPending || uploading}
              >
                {submitAssignmentMutation.isPending ? 'Submitting...' : '✅ Submit Assignment'}
              </Button>

              <T variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.xs }}>
                * You cannot edit your submission after submitting
              </T>
            </CardContent>
          </Card>
        )}

        {/* Section 4C: Submitted Status (Existing) */}
        {submission && (
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                📝 Submission Status
              </T>

              <Row spaceBetween centerV style={{ marginBottom: Spacing.sm }}>
                <T variant="body">Submitted on:</T>
                <T variant="body" weight="semiBold">
                  {new Date(submission.submission_date).toLocaleDateString()}
                </T>
              </Row>

              {submission.submission_text && (
                <View style={{ marginTop: Spacing.sm }}>
                  <T variant="caption" color="textSecondary">Student's Work:</T>
                  <T variant="body" style={{ marginTop: Spacing.xs }}>
                    {submission.submission_text}
                  </T>
                </View>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section 5: Score & Feedback Card (If Graded) */}
        {submission?.status === 'graded' && (
          <Card variant="elevated">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                ✅ Grade & Feedback
              </T>

              {/* Score Display */}
              <View style={{ alignItems: 'center', paddingVertical: Spacing.md }}>
                <Row centerV style={{ gap: Spacing.sm }}>
                  <T
                    variant="display"
                    weight="bold"
                    style={{ fontSize: 48, color: getScoreColor(scorePercentage) }}
                  >
                    {submission.score ?? 0}
                  </T>
                  <T variant="title" color="textSecondary">
                    / {assignment?.total_points ?? 0}
                  </T>
                </Row>

                <T variant="body" color="textSecondary" style={{ marginTop: Spacing.xs }}>
                  {(scorePercentage ?? 0).toFixed(1)}% • Grade: {gradeLetter}
                </T>

                {/* Progress Bar */}
                <ProgressBar
                  progress={(scorePercentage ?? 0) / 100}
                  color={getScoreColor(scorePercentage)}
                  style={{ width: '100%', height: 8, borderRadius: 4, marginTop: Spacing.md }}
                />
              </View>

              {/* Feedback */}
              {submission.feedback && (
                <View style={{ marginTop: Spacing.md }}>
                  <Button
                    variant="outline"
                    onPress={() => {
                      const newState = expandedSection === 'feedback' ? null : 'feedback';
                      setExpandedSection(newState);
                      if (newState) {
                        trackAction('expand_feedback', 'AssignmentDetail', { assignmentId });
                      }
                    }}
                  >
                    {expandedSection === 'feedback' ? '▼ Hide' : '▶ Show'} Teacher Feedback
                  </Button>
                  {expandedSection === 'feedback' && (
                    <View
                      style={{
                        marginTop: Spacing.xs,
                        padding: Spacing.sm,
                        backgroundColor: Colors.surface,
                        borderRadius: 8,
                      }}
                    >
                      <T variant="body">{submission.feedback}</T>
                    </View>
                  )}
                </View>
              )}

              {/* Grader Info */}
              {submission.graded_by_teacher && (
                <T variant="caption" color="textSecondary" style={{ marginTop: Spacing.sm }}>
                  Graded by {submission.graded_by_teacher.full_name} on{' '}
                  {submission.graded_at ? new Date(submission.graded_at).toLocaleDateString() : 'N/A'}
                </T>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section 6: Teacher Attachments (If Any) */}
        {assignment?.attachments && assignment.attachments.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                📎 Assignment Materials
              </T>

              <Col gap="xs">
                {assignment.attachments.map((attachment: any, index: number) => (
                  <Row
                    key={`teacher-attachment-${index}`}
                    spaceBetween
                    centerV
                    style={{
                      padding: Spacing.sm,
                      backgroundColor: Colors.surface,
                      borderRadius: 8,
                    }}
                  >
                    <T variant="body">{attachment.name || `Attachment ${index + 1}`}</T>
                    <Button
                      variant="outline"
                      onPress={() => handleDownloadAttachment(attachment.url, attachment.name)}
                    >
                      Download
                    </Button>
                  </Row>
                ))}
              </Col>
            </CardContent>
          </Card>
        )}

        {/* Section 7: Student Attachments (If Submitted) */}
        {submission?.attachments && Array.isArray(submission.attachments) && submission.attachments.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <T variant="body" weight="semiBold" style={{ marginBottom: Spacing.sm }}>
                📄 Submitted Files
              </T>

              <Col gap="xs">
                {submission.attachments.map((attachment: any, index: number) => (
                  <Row
                    key={`student-attachment-${index}`}
                    spaceBetween
                    centerV
                    style={{
                      padding: Spacing.sm,
                      backgroundColor: Colors.surface,
                      borderRadius: 8,
                    }}
                  >
                    <T variant="body">{attachment.name || `File ${index + 1}`}</T>
                    <Button
                      variant="outline"
                      onPress={() => handleDownloadAttachment(attachment.url, attachment.name)}
                    >
                      View
                    </Button>
                  </Row>
                ))}
              </Col>
            </CardContent>
          </Card>
        )}
      </Col>
    </BaseScreen>
  );
};

export default AssignmentDetailScreen;
