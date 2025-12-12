/**
 * NewDoubtSubmission - EXACT match to HTML reference
 * Purpose: Comprehensive doubt submission with history and AI suggestions
 * Design: Material Design with rich editor, image upload, priority, history
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { launchCamera, launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { PERMISSIONS, request, check, RESULTS } from 'react-native-permissions';
import { T } from '../../ui';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { logDatabaseError } from '../../utils/errorLogger';

type Props = NativeStackScreenProps<any, 'NewDoubtSubmission'>;

type Priority = 'high' | 'medium' | 'low';
type DoubtStatus = 'answered' | 'viewed' | 'open';
type HistoryTab = 'all' | 'pending' | 'answered';

interface ImageAttachment {
  id: string;
  uri: string;
  fileName?: string;
  fileSize?: number;
  type?: string;
  base64?: string;
}

interface DoubtHistory {
  id: string;
  title: string;
  subject: string;
  timestamp: string;
  status: DoubtStatus;
}

const SUBJECTS = [
  { value: '', label: 'e.g. Physics, Chemistry' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'biology', label: 'Biology' },
];

export default function NewDoubtSubmission({ route, navigation }: Props) {
  const { user } = useAuth();
  const editDoubtId = route.params?.editDoubtId;
  const isEditMode = !!editDoubtId;

  const [subject, setSubject] = useState('');
  const [doubtTitle, setDoubtTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('high');
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [aiSuggestionsExpanded, setAiSuggestionsExpanded] = useState(false);
  const [historyTab, setHistoryTab] = useState<HistoryTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [submissionBannerVisible, setSubmissionBannerVisible] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const textInputRef = useRef<TextInput>(null);

  // Fetch doubt history from Supabase
  const { data: doubtHistory } = useQuery({
    queryKey: ['doubt-history', user?.id, historyTab],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('doubts')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      // Apply status filter based on tab
      if (historyTab === 'pending') {
        query = query.in('status', ['open', 'viewed']);
      } else if (historyTab === 'answered') {
        query = query.eq('status', 'answered');
      }

      const { data, error } = await query;

      if (error) {
        logDatabaseError('NewDoubtSubmission', 'Fetch doubts history', error);
        return [];
      }

      // Helper function to format timestamp
      const formatTimeAgo = (timestamp: string) => {
        // Add 'Z' to indicate UTC timezone if not present
        const utcString = timestamp.includes('Z') || timestamp.includes('+') ? timestamp : `${timestamp}Z`;
        const now = new Date().getTime();
        const doubtTime = new Date(utcString).getTime();
        const diffMinutes = Math.floor((now - doubtTime) / (1000 * 60));

        if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        const diffWeeks = Math.floor(diffDays / 7);
        return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
      };

      return (data || []).map(d => ({
        id: d.id,
        title: d.title,
        subject: d.subject_code,
        timestamp: formatTimeAgo(d.created_at),
        status: d.status as DoubtStatus,
      })) as DoubtHistory[];
    },
    enabled: !!user?.id,
  });

  // Fetch similar doubts based on current subject
  const { data: similarDoubts } = useQuery({
    queryKey: ['similar-doubts', subject],
    queryFn: async () => {
      if (!subject) return [];

      const { data, error } = await supabase
        .from('doubts')
        .select('title')
        .eq('subject_code', subject)
        .eq('status', 'answered')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        logDatabaseError('NewDoubtSubmission', 'Fetch similar doubts', error);
        return [];
      }

      return (data || []).map((d, idx) => `${idx + 1}. ${d.title}`);
    },
    enabled: !!subject,
  });

  const insertBulletPoint = () => {
    const start = selectionStart;
    const beforeText = description.substring(0, start);
    const afterText = description.substring(start);

    // Add bullet point at cursor
    const newText = `${beforeText}\n• `;
    setDescription(newText + afterText);

    // Move cursor after bullet
    const newCursorPos = newText.length;
    setSelectionStart(newCursorPos);
    setSelectionEnd(newCursorPos);

    trackAction('insert_bullet', 'NewDoubtSubmission');
  };

  const insertNumberedPoint = () => {
    const start = selectionStart;
    const beforeText = description.substring(0, start);
    const afterText = description.substring(start);

    // Count existing numbered items to get next number
    const numberedItems = beforeText.match(/\n\d+\.\s/g) || [];
    const nextNumber = numberedItems.length + 1;

    // Add numbered point at cursor
    const newText = `${beforeText}\n${nextNumber}. `;
    setDescription(newText + afterText);

    // Move cursor after number
    const newCursorPos = newText.length;
    setSelectionStart(newCursorPos);
    setSelectionEnd(newCursorPos);

    trackAction('insert_numbered', 'NewDoubtSubmission');
  };

  const clearContent = () => {
    // Clear entire text box content
    setDescription('');
    trackAction('clear_content', 'NewDoubtSubmission');
  };

  useEffect(() => {
    trackScreenView('NewDoubtSubmission', { isEditMode, editDoubtId });
  }, []);

  // Load doubt data when in edit mode
  useEffect(() => {
    const loadDoubtForEdit = async () => {
      if (!isEditMode || !editDoubtId) return;

      setIsLoadingEdit(true);
      try {
        const { data, error } = await supabase
          .from('doubts')
          .select('*')
          .eq('id', editDoubtId)
          .eq('student_id', user?.id) // Security: only load own doubts
          .single();

        if (error) {
          logDatabaseError('NewDoubtSubmission', 'Load doubt for edit', error);
          Alert.alert('Error', 'Failed to load doubt for editing');
          navigation.goBack();
          return;
        }

        // Populate form fields
        setSubject(data.subject_code || '');
        setDoubtTitle(data.title || '');
        setDescription(data.description || '');
        setPriority(data.priority || 'high');

        // Load existing images from attachments
        if (data.attachments && data.attachments.images) {
          const existingImages: ImageAttachment[] = data.attachments.images.map((url: string, index: number) => ({
            id: `existing-${index}`,
            uri: url,
            fileName: `image-${index}.jpg`,
            type: 'image/jpeg',
            // No base64 for existing images (already uploaded)
          }));
          setImages(existingImages);
        }

        trackAction('load_doubt_for_edit', 'NewDoubtSubmission', { doubtId: editDoubtId });
      } catch (error) {
        console.error('Error loading doubt:', error);
        Alert.alert('Error', 'Failed to load doubt for editing');
        navigation.goBack();
      } finally {
        setIsLoadingEdit(false);
      }
    };

    loadDoubtForEdit();
  }, [isEditMode, editDoubtId, user?.id]);

  const handleTakePhoto = async () => {
    trackAction('take_photo', 'NewDoubtSubmission');

    try {
      // Request camera permission first
      const cameraPermission = Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.CAMERA
        : PERMISSIONS.IOS.CAMERA;

      const permissionResult = await check(cameraPermission);

      if (permissionResult === RESULTS.DENIED) {
        const requestResult = await request(cameraPermission);
        if (requestResult !== RESULTS.GRANTED) {
          Alert.alert(
            'Camera Permission Required',
            'Please grant camera permission to take photos for your doubts.',
            [{ text: 'OK' }]
          );
          return;
        }
      } else if (permissionResult === RESULTS.BLOCKED) {
        Alert.alert(
          'Camera Permission Blocked',
          'Camera permission is blocked. Please enable it in your device settings to take photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch camera after permission granted
      const result: ImagePickerResponse = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        saveToPhotos: true,
        cameraType: 'back',
        includeBase64: true, // Enable base64 for upload
      });

      if (result.didCancel) {
        console.log('User cancelled camera');
        return;
      }

      if (result.errorCode) {
        console.error('Camera Error:', result.errorMessage);
        Alert.alert('Camera Error', result.errorMessage || 'Failed to open camera');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newImage: ImageAttachment = {
          id: Date.now().toString(),
          uri: asset.uri || '',
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          type: asset.type,
          base64: asset.base64,
        };
        setImages([...images, newImage]);
        trackAction('photo_captured', 'NewDoubtSubmission', {
          fileName: asset.fileName,
          fileSize: asset.fileSize,
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleGallery = async () => {
    trackAction('open_gallery', 'NewDoubtSubmission');

    try {
      // Request storage/photo library permission for Android
      if (Platform.OS === 'android') {
        const androidVersion = Platform.Version;

        // Android 13+ uses READ_MEDIA_IMAGES, older versions use READ_EXTERNAL_STORAGE
        const storagePermission = androidVersion >= 33
          ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

        const permissionResult = await check(storagePermission);

        if (permissionResult === RESULTS.DENIED) {
          const requestResult = await request(storagePermission);
          if (requestResult !== RESULTS.GRANTED) {
            Alert.alert(
              'Storage Permission Required',
              'Please grant storage permission to select photos for your doubts.',
              [{ text: 'OK' }]
            );
            return;
          }
        } else if (permissionResult === RESULTS.BLOCKED) {
          Alert.alert(
            'Storage Permission Blocked',
            'Storage permission is blocked. Please enable it in your device settings to select photos.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Launch gallery after permission granted (or on iOS which handles permissions internally)
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        selectionLimit: 3, // Allow up to 3 images
        includeBase64: true, // Enable base64 for upload
      });

      if (result.didCancel) {
        console.log('User cancelled gallery picker');
        return;
      }

      if (result.errorCode) {
        console.error('Gallery Error:', result.errorMessage);
        Alert.alert('Gallery Error', result.errorMessage || 'Failed to open gallery');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const newImages: ImageAttachment[] = result.assets.map(asset => ({
          id: `${Date.now()}-${Math.random()}`,
          uri: asset.uri || '',
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          type: asset.type,
          base64: asset.base64,
        }));

        // Limit total images to 5
        const combinedImages = [...images, ...newImages].slice(0, 5);
        setImages(combinedImages);

        trackAction('images_selected', 'NewDoubtSubmission', {
          count: newImages.length,
          totalImages: combinedImages.length,
        });

        if (combinedImages.length >= 5) {
          Alert.alert('Limit Reached', 'Maximum 5 images allowed per doubt.');
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
    trackAction('remove_image', 'NewDoubtSubmission', { imageId: id });
  };

  // Upload images to Supabase Storage using base64
  const uploadImagesToStorage = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const image of images) {
      try {
        // If image already has a public URL (existing image), just add it
        if (image.uri.startsWith('http')) {
          uploadedUrls.push(image.uri);
          continue;
        }

        // New image - needs upload
        if (!image.base64 || !user?.id) {
          console.warn('Skipping image - no base64 data or user ID');
          continue;
        }

        // Generate unique file name
        const timestamp = Date.now();
        const fileName = image.fileName || `doubt_${timestamp}.jpg`;
        const filePath = `doubts/${user.id}/${timestamp}_${fileName}`;

        // Decode base64 to binary string for React Native
        const binaryString = atob(image.base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Upload to Supabase Storage using the byte array directly
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('doubt-images')
          .upload(filePath, bytes, {
            contentType: image.type || 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          continue; // Skip this image and continue with others
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('doubt-images')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          uploadedUrls.push(urlData.publicUrl);
        }
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!subject || !doubtTitle.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to submit a doubt');
      return;
    }

    try {
      // Show loading state
      Alert.alert(
        isEditMode ? 'Updating...' : 'Uploading...',
        isEditMode ? 'Please wait while we update your doubt' : 'Please wait while we upload your doubt'
      );

      trackAction(isEditMode ? 'update_doubt' : 'submit_doubt', 'NewDoubtSubmission', {
        subject,
        priority,
        hasImages: images.length > 0,
        doubtId: editDoubtId,
      });

      // Upload images first (handles both new and existing images)
      const imageUrls = await uploadImagesToStorage();

      if (isEditMode) {
        // Update existing doubt
        const { data, error } = await supabase
          .from('doubts')
          .update({
            subject_code: subject,
            title: doubtTitle,
            description,
            priority,
            attachments: imageUrls.length > 0 ? { images: imageUrls } : null,
          })
          .eq('id', editDoubtId)
          .eq('student_id', user.id) // Security: only update own doubts
          .select()
          .single();

        if (error) {
          console.error('Error updating doubt:', error);
          Alert.alert('Error', 'Failed to update doubt. Please try again.');
          return;
        }

        // Success! Go back to detail screen or list
        Alert.alert(
          '✅ Doubt Updated',
          'Your doubt has been updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        // Create new doubt
        const { data, error } = await supabase
          .from('doubts')
          .insert({
            student_id: user.id,
            subject_code: subject,
            title: doubtTitle,
            description,
            priority,
            status: 'open',
            attachments: imageUrls.length > 0 ? { images: imageUrls } : null,
          })
          .select()
          .single();

        if (error) {
          console.error('Error submitting doubt:', error);
          Alert.alert('Error', 'Failed to submit doubt. Please try again.');
          return;
        }

        // Success! Reset form and stay on screen
        Alert.alert(
          '✅ Doubt Submitted',
          'Your doubt has been submitted successfully! Our teachers will respond soon.',
          [{ text: 'Submit Another', onPress: () => {} }]
        );

        // Reset form fields
        setSubject('');
        setDoubtTitle('');
        setDescription('');
        setPriority('high');
        setImages([]);
        setAiSuggestionsExpanded(false);

        // Show success banner briefly
        setSubmissionBannerVisible(true);
        setTimeout(() => {
          setSubmissionBannerVisible(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'An error occurred while submitting. Please try again.');
    }
  };

  const getStatusBadgeStyle = (status: DoubtStatus) => {
    switch (status) {
      case 'answered':
        return { bg: '#7ED321', text: '#7ED321' };
      case 'viewed':
        return { bg: '#F5A623', text: '#F5A623' };
      case 'open':
        return { bg: '#4A90E2', text: '#4A90E2' };
      default:
        return { bg: '#9CA3AF', text: '#9CA3AF' };
    }
  };

  const getStatusLabel = (status: DoubtStatus) => {
    switch (status) {
      case 'answered':
        return 'Answered';
      case 'viewed':
        return 'Viewed';
      case 'open':
        return 'Open';
      default:
        return 'Unknown';
    }
  };

  // Filter doubt history by search query (tab filtering is done in query)
  const filteredDoubts = (doubtHistory || []).filter((doubt) =>
    searchQuery ? doubt.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            trackAction('back_button', 'NewDoubtSubmission');
            navigation.goBack();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <T variant="h2" style={styles.icon}>←</T>
        </TouchableOpacity>

        <T variant="body" weight="bold" style={styles.topBarTitle}>
          {isEditMode ? 'Edit Doubt' : 'Ask a Doubt'}
        </T>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => trackAction('more_options', 'NewDoubtSubmission')}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <T variant="h2" style={styles.icon}>⋮</T>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Subject Selection */}
        <View style={styles.section}>
          <T variant="body" weight="medium" style={styles.label}>
            Select Subject
          </T>
          <TouchableOpacity
            style={styles.pickerContainer}
            onPress={() => {
              const buttons = SUBJECTS.filter(s => s.value).map((subj) => ({
                text: subj.label,
                onPress: () => setSubject(subj.value),
              }));
              buttons.push({
                text: 'Cancel',
                onPress: () => {},
                style: 'cancel'
              });
              Alert.alert('Select Subject', 'Choose a subject for your doubt', buttons, {
                cancelable: true,
                onDismiss: () => {}
              });
            }}
            accessibilityRole="button"
            accessibilityLabel="Select subject"
          >
            <T variant="body" style={styles.pickerText}>
              {SUBJECTS.find(s => s.value === subject)?.label || 'e.g. Physics, Chemistry'}
            </T>
            <T style={styles.pickerArrow}>▼</T>
          </TouchableOpacity>
          <T variant="caption" style={styles.teacherInfo}>
            Teacher: Dr. Evelyn Reed
          </T>
        </View>

        {/* Doubt Form */}
        <View style={styles.section}>
          <T variant="body" weight="medium" style={styles.label}>
            Doubt Title / Question
          </T>
          <TextInput
            style={styles.input}
            placeholder="e.g., How does photosynthesis work?"
            placeholderTextColor="#9CA3AF"
            value={doubtTitle}
            onChangeText={setDoubtTitle}
          />
        </View>

        <View style={styles.section}>
          <T variant="body" weight="medium" style={styles.label}>
            Detailed Description
          </T>
          <View style={styles.editorContainer}>
            {/* Simple Toolbar */}
            <View style={styles.toolbar}>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={insertBulletPoint}
                accessibilityRole="button"
                accessibilityLabel="Add bullet point"
              >
                <T style={styles.toolbarIcon}>• List</T>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={insertNumberedPoint}
                accessibilityRole="button"
                accessibilityLabel="Add numbered point"
              >
                <T style={styles.toolbarIcon}>1. List</T>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolbarClearButton}
                onPress={clearContent}
                accessibilityRole="button"
                accessibilityLabel="Clear all text"
              >
                <T style={styles.toolbarClearText}>Clear All</T>
              </TouchableOpacity>
            </View>
            <TextInput
              ref={textInputRef}
              style={styles.textarea}
              placeholder="Describe your doubt in detail. Use bullet points or numbered lists if needed."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              onSelectionChange={(e) => {
                setSelectionStart(e.nativeEvent.selection.start);
                setSelectionEnd(e.nativeEvent.selection.end);
              }}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Image Uploader */}
        <View style={styles.section}>
          <T variant="body" weight="medium" style={styles.sectionTitle}>
            Attach Images or Files
          </T>
          <View style={styles.uploadGrid}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleTakePhoto}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
            >
              <T style={styles.uploadIcon}>📷</T>
              <T variant="caption" style={styles.uploadText}>Take Photo</T>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleGallery}
              accessibilityRole="button"
              accessibilityLabel="Choose from gallery"
            >
              <T style={styles.uploadIcon}>🖼️</T>
              <T variant="caption" style={styles.uploadText}>From Gallery</T>
            </TouchableOpacity>
          </View>

          {/* Image Preview */}
          {images.length > 0 && (
            <ScrollView horizontal style={styles.imagePreviewContainer} showsHorizontalScrollIndicator={false}>
              {images.map((image) => (
                <View key={image.id} style={styles.imagePreviewWrapper}>
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(image.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Remove image"
                  >
                    <T style={styles.removeImageIcon}>×</T>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Priority Level */}
        <View style={styles.section}>
          <T variant="body" weight="medium" style={styles.sectionTitle}>
            Set Priority Level
          </T>
          <View style={styles.priorityGrid}>
            <TouchableOpacity
              style={[
                styles.priorityButton,
                priority === 'high' && styles.priorityButtonHigh,
              ]}
              onPress={() => setPriority('high')}
              accessibilityRole="button"
              accessibilityLabel="Set priority to high"
            >
              <T
                variant="caption"
                weight="semiBold"
                style={priority === 'high' ? {...styles.priorityText, ...styles.priorityTextHigh} : styles.priorityText}
              >
                High
              </T>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.priorityButton,
                priority === 'medium' && styles.priorityButtonMedium,
              ]}
              onPress={() => setPriority('medium')}
              accessibilityRole="button"
              accessibilityLabel="Set priority to medium"
            >
              <T
                variant="caption"
                weight="semiBold"
                style={priority === 'medium' ? {...styles.priorityText, ...styles.priorityTextMedium} : styles.priorityText}
              >
                Medium
              </T>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.priorityButton,
                priority === 'low' && styles.priorityButtonLow,
              ]}
              onPress={() => setPriority('low')}
              accessibilityRole="button"
              accessibilityLabel="Set priority to low"
            >
              <T
                variant="caption"
                weight="semiBold"
                style={priority === 'low' ? {...styles.priorityText, ...styles.priorityTextLow} : styles.priorityText}
              >
                Low
              </T>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Suggestions */}
        <View style={styles.aiSuggestionsContainer}>
          <TouchableOpacity
            style={styles.aiSuggestionsHeader}
            onPress={() => setAiSuggestionsExpanded(!aiSuggestionsExpanded)}
            accessibilityRole="button"
            accessibilityLabel="Toggle AI suggestions"
          >
            <View style={styles.aiSuggestionsTitle}>
              <T style={styles.aiIcon}>✨</T>
              <T variant="body" weight="medium" style={styles.aiText}>
                Similar Doubts & Resources
              </T>
            </View>
            <T
              style={aiSuggestionsExpanded ? {...styles.expandIcon, ...styles.expandIconRotated} : styles.expandIcon}
            >
              ▼
            </T>
          </TouchableOpacity>

          {aiSuggestionsExpanded && (
            <View style={styles.aiSuggestionsContent}>
              {(similarDoubts && similarDoubts.length > 0) ? (
                similarDoubts.map((doubt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.similarDoubtItem}
                    onPress={() => trackAction('view_similar_doubt', 'NewDoubtSubmission', { index })}
                  >
                    <T variant="body" style={styles.similarDoubtText}>
                      {doubt}
                    </T>
                  </TouchableOpacity>
                ))
              ) : (
                <T variant="caption" style={styles.noSuggestionsText}>
                  No similar doubts found. Select a subject to see suggestions.
                </T>
              )}
            </View>
          )}
        </View>

        {/* My Doubts History */}
        <View style={styles.historySection}>
          <T variant="h2" weight="bold" style={styles.historyTitle}>
            My Doubts History
          </T>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <T style={styles.searchIcon}>🔍</T>
            <TextInput
              style={styles.searchInput}
              placeholder="Search my doubts..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, historyTab === 'all' && styles.tabActive]}
              onPress={() => setHistoryTab('all')}
            >
              <T
                variant="body"
                weight={historyTab === 'all' ? 'semiBold' : 'medium'}
                style={historyTab === 'all' ? {...styles.tabText, ...styles.tabTextActive} : styles.tabText}
              >
                All
              </T>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, historyTab === 'pending' && styles.tabActive]}
              onPress={() => setHistoryTab('pending')}
            >
              <T
                variant="body"
                weight={historyTab === 'pending' ? 'semiBold' : 'medium'}
                style={historyTab === 'pending' ? {...styles.tabText, ...styles.tabTextActive} : styles.tabText}
              >
                Pending
              </T>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, historyTab === 'answered' && styles.tabActive]}
              onPress={() => setHistoryTab('answered')}
            >
              <T
                variant="body"
                weight={historyTab === 'answered' ? 'semiBold' : 'medium'}
                style={historyTab === 'answered' ? {...styles.tabText, ...styles.tabTextActive} : styles.tabText}
              >
                Answered
              </T>
            </TouchableOpacity>
          </View>

          {/* Doubts List */}
          <View style={styles.doubtsList}>
            {filteredDoubts.length === 0 ? (
              <View style={styles.emptyState}>
                <T variant="body" style={styles.emptyStateText}>
                  {historyTab === 'all' && 'No doubts submitted yet'}
                  {historyTab === 'pending' && 'No pending doubts'}
                  {historyTab === 'answered' && 'No answered doubts yet'}
                </T>
              </View>
            ) : (
              filteredDoubts.map((doubt) => {
                const badge = getStatusBadgeStyle(doubt.status);
                const isPending = doubt.status === 'open' || doubt.status === 'viewed';

                return (
                  <TouchableOpacity
                    key={doubt.id}
                    style={styles.doubtCard}
                    onPress={() => {
                      trackAction('view_doubt_detail', 'NewDoubtSubmission', { doubtId: doubt.id });
                      navigation.navigate('DoubtDetailScreen', { doubtId: doubt.id });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`View doubt: ${doubt.title}`}
                    activeOpacity={0.7}
                  >
                    <View style={styles.doubtCardContent}>
                      <T variant="body" weight="semiBold" style={styles.doubtCardTitle}>
                        {doubt.title}
                      </T>
                      <T variant="caption" style={styles.doubtCardMeta}>
                        {doubt.subject} • {doubt.timestamp}
                      </T>
                    </View>

                    <View style={styles.doubtCardActions}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: `${badge.bg}33` },
                        ]}
                      >
                        <T
                          variant="caption"
                          weight="medium"
                          style={{...styles.statusBadgeText, color: badge.text}}
                        >
                          {getStatusLabel(doubt.status)}
                        </T>
                      </View>

                      {/* Edit & Delete buttons for pending doubts only */}
                      {isPending && (
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              trackAction('edit_doubt', 'NewDoubtSubmission', { doubtId: doubt.id });
                              // Navigate to this same screen with editDoubtId param to load edit mode
                              navigation.push('NewDoubtSubmission', { editDoubtId: doubt.id });
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Edit doubt"
                          >
                            <T style={styles.actionIcon}>✏️</T>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              trackAction('delete_doubt_attempt', 'NewDoubtSubmission', { doubtId: doubt.id });
                              Alert.alert(
                                '🗑️ Delete Doubt?',
                                `Are you sure you want to delete "${doubt.title}"?\n\nThis action cannot be undone.`,
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: async () => {
                                      try {
                                        const { error } = await supabase
                                          .from('doubts')
                                          .delete()
                                          .eq('id', doubt.id)
                                          .eq('student_id', user?.id); // Safety check

                                        if (error) {
                                          console.error('Error deleting doubt:', error);
                                          Alert.alert('Error', 'Failed to delete doubt. Please try again.');
                                          return;
                                        }

                                        trackAction('delete_doubt_success', 'NewDoubtSubmission', { doubtId: doubt.id });
                                        Alert.alert('✅ Deleted', 'Doubt has been deleted successfully.');

                                        // Refresh the list (the query will auto-refetch)
                                      } catch (error) {
                                        console.error('Delete error:', error);
                                        Alert.alert('Error', 'An error occurred while deleting.');
                                      }
                                    },
                                  },
                                ]
                              );
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Delete doubt"
                          >
                            <T style={styles.actionIcon}>🗑️</T>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        {/* Bottom padding for submit button */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Submission Tracking Banner */}
      {submissionBannerVisible && (
        <View style={styles.submissionBanner}>
          <T variant="caption" weight="medium" style={styles.bannerText}>
            Status: Submitted • Just now
          </T>
          <TouchableOpacity onPress={() => setSubmissionBannerVisible(false)}>
            <T style={styles.bannerClose}>×</T>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Action Button */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          accessibilityRole="button"
          accessibilityLabel={isEditMode ? "Update doubt" : "Submit doubt"}
        >
          <T variant="body" weight="bold" style={styles.submitButtonText}>
            {isEditMode ? 'Update Doubt' : 'Submit Doubt'}
          </T>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Top Bar - Material Design 56px
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  icon: {
    fontSize: 24,
    color: '#333333',
  },
  topBarTitle: {
    color: '#111827',
    fontSize: 18,
  },
  container: {
    flex: 1,
    backgroundColor: '#F6F7F8',
  },
  section: {
    padding: 16,
  },
  label: {
    color: '#111827',
    fontSize: 15,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 15,
    marginBottom: 12,
  },
  // Subject Selection
  pickerContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  teacherInfo: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 4,
    paddingLeft: 4,
  },
  // Input Fields
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
  },
  // Rich Text Editor
  editorContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
  },
  toolbarButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarIcon: {
    fontSize: 14,
    color: '#4B5563',
  },
  toolbarClearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginLeft: 'auto',
  },
  toolbarClearText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  textarea: {
    minHeight: 144,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    textAlignVertical: 'top',
  },
  // Image Upload
  uploadGrid: {
    flexDirection: 'row',

  },
  uploadButton: {
    flex: 1,
    height: 100,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#FAFAFA',
  },
  uploadIcon: {
    fontSize: 32,
  },
  uploadText: {
    color: '#4A4A4A',
    fontSize: 13,
  },
  imagePreviewContainer: {
    marginTop: 12,
    flexDirection: 'row',
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  removeImageButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  // Priority Level
  priorityGrid: {
    flexDirection: 'row',

  },
  priorityButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityButtonHigh: {
    borderColor: '#F5A623',
    backgroundColor: '#FEF3E0',
  },
  priorityButtonMedium: {
    borderColor: '#4A90E2',
    backgroundColor: '#EBF4FF',
  },
  priorityButtonLow: {
    borderColor: '#6B7280',
    backgroundColor: '#F3F4F6',
  },
  priorityText: {
    color: '#4A4A4A',
    fontSize: 13,
  },
  priorityTextHigh: {
    color: '#F5A623',
  },
  priorityTextMedium: {
    color: '#4A90E2',
  },
  priorityTextLow: {
    color: '#6B7280',
  },
  // AI Suggestions
  aiSuggestionsContainer: {
    margin: 16,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  aiSuggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  aiSuggestionsTitle: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  aiIcon: {
    fontSize: 20,
    color: '#50E3C2',
  },
  aiText: {
    color: '#111827',
    fontSize: 15,
  },
  expandIcon: {
    fontSize: 16,
    color: '#6B7280',
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  aiSuggestionsContent: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  similarDoubtItem: {
    marginBottom: 12,
  },
  similarDoubtText: {
    color: '#4A90E2',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  noSuggestionsText: {
    color: '#888888',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  // My Doubts History
  historySection: {
    padding: 16,
    paddingTop: 24,
  },
  historyTitle: {
    color: '#111827',
    fontSize: 20,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 20,
    color: '#9CA3AF',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    color: '#6B7280',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#4A90E2',
  },
  // Doubts List
  doubtsList: {
    gap: 12,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  doubtCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    gap: 12,
    marginBottom: 12,
  },
  doubtCardContent: {
    flex: 1,
  },
  doubtCardTitle: {
    color: '#111827',
    fontSize: 15,
    marginBottom: 4,
  },
  doubtCardMeta: {
    color: '#6B7280',
    fontSize: 13,
  },
  doubtCardActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
  },
  // Submission Banner
  submissionBanner: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    padding: 16,
    borderRadius: 8,
  },
  bannerText: {
    color: '#4A90E2',
    fontSize: 13,
  },
  bannerClose: {
    fontSize: 24,
    color: '#4A90E2',
  },
  // Bottom Action Button
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
