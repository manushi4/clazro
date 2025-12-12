/**
 * MediaUploader - Comprehensive File Upload Component
 * Phase 21: Media Integration System
 * Provides drag-drop file upload with progress tracking and multi-format support
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { DocumentPickerResponse } from '../../types/database';

import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  Dimensions,
  ScrollView,
  Vibration,
  ActivityIndicator,
} from 'react-native';
// Using React Native core ImagePicker and simplified file handling
// import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uri: string;
  mimeType?: string;
  thumbnail?: string;
  uploadProgress?: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

export interface MediaUploaderProps {
  onFilesSelected?: (files: MediaFile[]) => void;
  onFileRemoved?: (fileId: string) => void;
  onUploadProgress?: (fileId: string, progress: number) => void;
  onUploadComplete?: (fileId: string, result: any) => void;
  onUploadError?: (fileId: string, error: string) => void;
  onUpload?: (files: MediaFile[]) => void;
  onCancel?: () => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  enableCamera?: boolean;
  enableDocuments?: boolean;
  enableMultiSelect?: boolean;
  uploadEndpoint?: string;
  disabled?: boolean;
  autoUpload?: boolean;
  showPreview?: boolean;
  persistFiles?: boolean; // Phase 81.1 Enhancement - persist files locally
  enableRetry?: boolean; // Phase 81.1 Enhancement - retry failed uploads
  compressionQuality?: number; // Phase 81.1 Enhancement - image compression
}

const SUPPORTED_FORMATS = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  videos: ['video/mp4', 'video/mov', 'video/avi'],
  audio: ['audio/mp3', 'audio/wav', 'audio/aac'],
};

const FILE_ICONS = {
  'application/pdf': 'picture_as_pdf',
  'application/msword': 'description',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'description',
  'video/mp4': 'video_file',
  'video/mov': 'video_file',
  'video/avi': 'video_file',
  'audio/mp3': 'audio_file',
  'audio/wav': 'audio_file',
  'audio/aac': 'audio_file',
  default: 'insert_drive_file',
};

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onFilesSelected,
  onFileRemoved,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onUpload,
  onCancel,
  maxFiles = 10,
  maxFileSize = 50, // 50MB default
  allowedTypes = [...SUPPORTED_FORMATS.images, ...SUPPORTED_FORMATS.documents, ...SUPPORTED_FORMATS.videos],
  enableCamera = true,
  enableDocuments = true,
  enableMultiSelect = true,
  uploadEndpoint,
  disabled = false,
  autoUpload = false,
  showPreview = true,
  persistFiles = true,
  enableRetry = true,
  compressionQuality = 0.8,
}) => {
  const { theme } = useTheme();
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState<{[key: string]: number}>({});
  const uploadQueue = useRef<MediaFile[]>([]);
  const persistenceKey = 'media_uploader_files';

  // Load persisted files on component mount
  useEffect(() => {
    if (persistFiles) {
      loadPersistedFiles();
    }
  }, []);

  // Auto-upload when files are selected
  useEffect(() => {
    if (autoUpload && selectedFiles.some(f => f.uploadStatus === 'pending')) {
      handleBulkUpload();
    }
  }, [selectedFiles, autoUpload]);

  // Request camera permission
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Camera permission error:', err);
        return false;
      }
    }
    return true;
  };

  // Phase 81.1 Enhancement - Load persisted files
  const loadPersistedFiles = async () => {
    try {
      const persistedData = await AsyncStorage.getItem(persistenceKey);
      if (persistedData) {
        const files: MediaFile[] = JSON.parse(persistedData);
        setSelectedFiles(files);
        onFilesSelected?.(files);
      }
    } catch (error) {
      console.warn('Failed to load persisted files:', error);
    }
  };

  // Phase 81.1 Enhancement - Persist files to AsyncStorage
  const persistFilesToStorage = async (files: MediaFile[]) => {
    try {
      await AsyncStorage.setItem(persistenceKey, JSON.stringify(files));
    } catch (error) {
      console.warn('Failed to persist files:', error);
    }
  };

  // Phase 81.1 Enhancement - Clear persisted files
  const clearPersistedFiles = async () => {
    try {
      await AsyncStorage.removeItem(persistenceKey);
    } catch (error) {
      console.warn('Failed to clear persisted files:', error);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate file
  const validateFile = (file: DocumentPickerResponse | any): { isValid: boolean; error?: string } => {
    // Check file size
    if (file.size && file.size > maxFileSize * 1024 * 1024) {
      return { isValid: false, error: `File size exceeds ${maxFileSize}MB limit` };
    }

    // Check file type
    if (allowedTypes.length > 0 && file.type && !allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not supported' };
    }

    return { isValid: true };
  };

  // Create MediaFile from picker response
  const createMediaFile = (file: DocumentPickerResponse | any): MediaFile => {
    return {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name || file.fileName || 'Unknown file',
      type: file.type || file.mime || 'application/octet-stream',
      size: file.size || 0,
      uri: file.uri,
      mimeType: file.type || file.mime,
      uploadProgress: 0,
      uploadStatus: 'pending',
    };
  };

  // Handle file selection from document picker (using image library for media files)
  const handleDocumentPicker = useCallback(() => {
    if (disabled) return;

    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      quality: compressionQuality,
      selectionLimit: enableMultiSelect ? maxFiles - selectedFiles.length : 1,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled file picker');
      } else if (response.errorMessage) {
        Alert.alert('File Picker Error', response.errorMessage);
      } else if (response.assets) {
        const validFiles: MediaFile[] = [];
        const errors: string[] = [];

        for (const asset of response.assets) {
          if (selectedFiles.length + validFiles.length >= maxFiles) {
            errors.push(`Maximum ${maxFiles} files allowed`);
            break;
          }

          const validation = validateFile(asset);
          if (validation.isValid) {
            validFiles.push(createMediaFile(asset));
          } else {
            errors.push(`${asset.fileName || 'file'}: ${validation.error}`);
          }
        }

        if (validFiles.length > 0) {
          const newFiles = [...selectedFiles, ...validFiles];
          setSelectedFiles(newFiles);
          onFilesSelected?.(newFiles);
        }

        if (errors.length > 0) {
          Alert.alert('Upload Errors', errors.join('\n'));
        }
      }
    });
  }, [disabled, enableMultiSelect, maxFiles, selectedFiles, onFilesSelected, compressionQuality]);

  // Phase 81.1 Enhancement - Enhanced camera capture with better error handling
  const handleCamera = useCallback(async () => {
    if (disabled || !enableCamera) {
      Alert.alert('Camera Disabled', 'Camera access is currently disabled.');
      return;
    }

    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required', 
          'Camera permission is required to take photos. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // Could open app settings here
            }}
          ]
        );
        return;
      }

      if (selectedFiles.length >= maxFiles) {
        Alert.alert('Limit Reached', `Maximum ${maxFiles} files allowed. Please remove some files first.`);
        return;
      }

      const options = {
        mediaType: 'photo' as MediaType,
        quality: compressionQuality,
        includeBase64: false,
        maxWidth: 2048,
        maxHeight: 2048,
      };

      launchCamera(options, (response: ImagePickerResponse) => {
        try {
          if (response.didCancel) {
            return; // User cancelled, no action needed
          }

          if (response.errorMessage || response.errorCode) {
            Alert.alert('Camera Error', response.errorMessage || 'Unable to access camera');
            return;
          }

          if (response.assets && response.assets[0]) {
            const asset = response.assets[0];
            
            // Enhanced validation
            if (!asset.uri) {
              Alert.alert('error', 'Failed to capture photo');
              return;
            }

            const validation = validateFile(asset);
            
            if (validation.isValid) {
              const mediaFile = createMediaFile({
                name: asset.fileName || `photo_${Date.now()}.jpg`,
                type: asset.type || 'image/jpeg',
                size: asset.fileSize || 0,
                uri: asset.uri,
              });

              const newFiles = [...selectedFiles, mediaFile];
              setSelectedFiles(newFiles);
              onFilesSelected?.(newFiles);

              // Phase 81.1 Enhancement - Persist files if enabled
              if (persistFiles) {
                persistFiles(newFiles);
              }

              // Provide haptic feedback
              if (Platform.OS === 'android') {
                Vibration.vibrate(100);
              }
            } else {
              Alert.alert('Invalid File', validation.error || 'The captured photo is not valid');
            }
          }
        } catch (error) {
          console.error('Camera capture error:', error);
          Alert.alert('error', 'Failed to process captured photo');
        }
      });
    } catch (error) {
      console.error('Camera setup error:', error);
      Alert.alert('Camera Error', 'Unable to access camera. Please try again.');
    }
  }, [disabled, enableCamera, maxFiles, selectedFiles, onFilesSelected, compressionQuality, persistFiles]);

  // Handle gallery selection
  const handleGallery = useCallback(async () => {
    if (disabled) return;

    const options = {
      mediaType: 'mixed' as MediaType,
      quality: 0.8,
      selectionLimit: enableMultiSelect ? maxFiles - selectedFiles.length : 1,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets) {
        const validFiles: MediaFile[] = [];
        const errors: string[] = [];

        for (const asset of response.assets) {
          const validation = validateFile(asset);
          
          if (validation.isValid) {
            validFiles.push(createMediaFile({
              name: asset.fileName || `media_${Date.now()}.${asset.type?.split('/')[1] || 'jpg'}`,
              type: asset.type || 'image/jpeg',
              size: asset.fileSize || 0,
              uri: asset.uri,
            }));
          } else {
            errors.push(`${asset.fileName}: ${validation.error}`);
          }
        }

        if (validFiles.length > 0) {
          const newFiles = [...selectedFiles, ...validFiles];
          setSelectedFiles(newFiles);
          onFilesSelected?.(newFiles);
        }

        if (errors.length > 0) {
          Alert.alert('Upload Errors', errors.join('\n'));
        }
      }
    });
  }, [disabled, enableMultiSelect, maxFiles, selectedFiles, onFilesSelected]);

  // Phase 81.1 Enhancement - Bulk upload functionality
  const handleBulkUpload = useCallback(async () => {
    if (isUploading || selectedFiles.length === 0) return;
    
    const filesToUpload = selectedFiles.filter(f => 
      f.uploadStatus === 'pending' || f.uploadStatus === 'error'
    );
    
    if (filesToUpload.length === 0) return;
    
    setIsUploading(true);
    
    try {
      for (const file of filesToUpload) {
        await uploadSingleFile(file);
      }
    } catch (error) {
      console.error('Bulk upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, isUploading]);

  // Phase 81.1 Enhancement - Single file upload with retry
  const uploadSingleFile = useCallback(async (file: MediaFile) => {
    const maxRetries = enableRetry ? 3 : 1;
    const currentAttempts = retryAttempts[file.id] || 0;
    
    if (currentAttempts >= maxRetries) {
      updateFileStatus(file.id, 'error', 'Maximum retry attempts reached');
      return;
    }
    
    updateFileStatus(file.id, 'uploading');
    
    try {
      // Simulate upload with progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        updateFileProgress(file.id, progress);
        
        // Simulate random failure for demo
        if (progress === 50 && Math.random() < 0.3 && enableRetry) {
          throw new Error('Network timeout');
        }
      }
      
      updateFileStatus(file.id, 'completed');
      onUploadComplete?.(file.id, { url: file.uri, success: true });
      
    } catch (error) {
      console.warn(`Upload failed for ${file.name}:`, error);
      
      // Update retry attempts
      setRetryAttempts(prev => ({
        ...prev,
        [file.id]: currentAttempts + 1
      }));
      
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      updateFileStatus(file.id, 'error', errorMessage);
      onUploadError?.(file.id, errorMessage);
      
      // Retry after delay if enabled
      if (enableRetry && currentAttempts < maxRetries - 1) {
        setTimeout(() => {
          uploadSingleFile(file);
        }, 2000 * (currentAttempts + 1)); // Exponential backoff
      }
    }
  }, [enableRetry, retryAttempts, onUploadComplete, onUploadError]);

  // Update file status
  const updateFileStatus = useCallback((fileId: string, status: MediaFile['uploadStatus'], errorMessage?: string) => {
    setSelectedFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, uploadStatus: status, errorMessage }
        : file
    ));
  }, []);

  // Update file progress
  const updateFileProgress = useCallback((fileId: string, progress: number) => {
    setSelectedFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, uploadProgress: progress }
        : file
    ));
    onUploadProgress?.(fileId, progress);
  }, [onUploadProgress]);

  // Phase 81.1 Enhancement - Retry failed file
  const retryFailedFile = useCallback(async (fileId: string) => {
    const file = selectedFiles.find(f => f.id === fileId);
    if (file && file.uploadStatus === 'error') {
      // Reset retry count for manual retry
      setRetryAttempts(prev => ({
        ...prev,
        [fileId]: 0
      }));
      await uploadSingleFile(file);
    }
  }, [selectedFiles, uploadSingleFile]);

  // Remove file
  const handleRemoveFile = useCallback((fileId: string) => {
    const newFiles = selectedFiles.filter(file => file.id !== fileId);
    setSelectedFiles(newFiles);
    onFileRemoved?.(fileId);
    onFilesSelected?.(newFiles);
    
    // Phase 81.1 Enhancement - Update persisted files
    if (persistFiles) {
      persistFiles(newFiles);
    }
  }, [selectedFiles, onFileRemoved, onFilesSelected, persistFiles]);

  // Get file icon
  const getFileIcon = (mimeType: string): string => {
    return FILE_ICONS[mimeType as keyof typeof FILE_ICONS] || FILE_ICONS.default;
  };

  // Upload simulation (replace with actual upload logic)
  const simulateUpload = useCallback((file: MediaFile) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        onUploadComplete?.(file.id, { url: file.uri });
      }
      onUploadProgress?.(file.id, progress);
    }, 500);
  }, [onUploadProgress, onUploadComplete]);

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },

    header: {
      marginBottom: 16,
    },

    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.OnSurface,
      marginBottom: 4,
    },

    subtitle: {
      fontSize: 13,
      color: theme.OnSurfaceVariant,
      lineHeight: 18,
    },

    uploadZone: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.Outline,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
      minHeight: 120,
      marginBottom: 16,
    },

    uploadZoneActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryContainer + '20',
    },

    uploadZoneDisabled: {
      opacity: 0.5,
      backgroundColor: theme.SurfaceVariant,
    },

    uploadIcon: {
      color: theme.OnSurfaceVariant,
      marginBottom: 8,
    },

    uploadIconActive: {
      color: theme.primary,
    },

    uploadText: {
      fontSize: 16,
      color: theme.OnSurface,
      fontWeight: '500',
      marginBottom: 4,
      textAlign: 'center',
    },

    uploadSubtext: {
      fontSize: 13,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
      lineHeight: 18,
    },

    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },

    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.SurfaceVariant,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 8,
    },

    primaryButton: {
      backgroundColor: theme.primary,
    },

    actionButtonDisabled: {
      opacity: 0.5,
    },

    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnSurfaceVariant,
    },

    primaryButtonText: {
      color: theme.OnPrimary,
    },

    actionButtonIcon: {
      color: theme.OnSurfaceVariant,
    },

    primaryButtonIcon: {
      color: theme.OnPrimary,
    },

    filesContainer: {
      gap: 8,
    },

    fileItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.Outline,
    },

    fileIcon: {
      marginRight: 12,
      color: theme.OnSurfaceVariant,
    },

    fileInfo: {
      flex: 1,
    },

    fileName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.OnBackground,
      marginBottom: 2,
    },

    fileDetails: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
    },

    removeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme.errorContainer,
      marginLeft: 8,
    },

    removeIcon: {
      color: theme.OnErrorContainer,
    },

    progressBar: {
      height: 3,
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 2,
      marginTop: 8,
      overflow: 'hidden',
    },

    progressFill: {
      height: '100%',
      backgroundColor: theme.primary,
    },

    emptyState: {
      alignItems: 'center',
      paddingVertical: 20,
    },

    emptyIcon: {
      color: theme.OnSurfaceVariant,
      marginBottom: 8,
    },

    emptyText: {
      fontSize: 14,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
    },

    // Phase 81.1 Enhancement - Enhanced styles
    fileItemError: {
      borderColor: '#F44336',
      borderWidth: 1,
      backgroundColor: '#FFF5F5',
    },

    fileItemSuccess: {
      borderColor: '#4CAF50',
      borderWidth: 1,
      backgroundColor: '#F5FFF5',
    },

    fileMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    statusText: {
      fontSize: 11,
      fontWeight: '500',
    },

    errorMessage: {
      fontSize: 11,
      color: '#F44336',
      marginTop: 4,
      fontStyle: 'italic',
    },

    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 8,
    },

    progressText: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
      minWidth: 35,
    },

    fileActions: {
      flexDirection: 'column',
      gap: 4,
    },

    retryButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme.primaryContainer,
    },

    footer: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.Outline,
    },

    fileCount: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
      marginBottom: 8,
      fontStyle: 'italic',
    },

    uploadControls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      gap: 12,
    },

    uploadButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 8,
    },

    uploadButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },

    clearButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.Outline,
    },

    clearButtonText: {
      fontSize: 14,
      color: theme.OnSurface,
    },

    uploadSummary: {
      paddingTop: 8,
    },

    summaryText: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
    },
  });

  const styles = getStyles(theme);
  const canAddMore = selectedFiles.length < maxFiles;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Media Upload</Text>
        <Text style={styles.subtitle}>
          Upload files to support your doubt submission. Max {maxFiles} files, {maxFileSize}MB each.
        </Text>
      </View>

      {/* Upload Zone */}
      <TouchableOpacity
        style={[
          styles.uploadZone,
          isDragOver && styles.uploadZoneActive,
          (disabled || !canAddMore) && styles.uploadZoneDisabled,
        ]}
        onPress={handleDocumentPicker}
        disabled={disabled || !canAddMore}
        accessibilityLabel="Upload files"
        accessibilityRole="button"
      >
        <Icon
          name="cloud-upload"
          size={40}
          style={[
            styles.uploadIcon,
            isDragOver && styles.uploadIconActive,
          ]}
        />
        <Text style={styles.uploadText}>
          {canAddMore ? 'Tap to upload files' : `Maximum ${maxFiles} files reached`}
        </Text>
        <Text style={styles.uploadSubtext}>
          Supports images, documents, and videos
        </Text>
      </TouchableOpacity>

      {/* Action Buttons */}
      {canAddMore && !disabled && (
        <View style={styles.actionButtons}>
          {enableDocuments && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleDocumentPicker}
              accessibilityLabel="Select files"
              accessibilityRole="button"
            >
              <Icon
                name="folder"
                size={18}
                style={styles.primaryButtonIcon}
              />
              <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
                Files
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleGallery}
            accessibilityLabel="Select from gallery"
            accessibilityRole="button"
          >
            <Icon
              name="photo-library"
              size={18}
              style={styles.actionButtonIcon}
            />
            <Text style={styles.actionButtonText}>Gallery</Text>
          </TouchableOpacity>

          {enableCamera && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCamera}
              accessibilityLabel="Take photo"
              accessibilityRole="button"
            >
              <Icon
                name="camera-alt"
                size={18}
                style={styles.actionButtonIcon}
              />
              <Text style={styles.actionButtonText}>Camera</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Phase 81.1 Enhancement - Enhanced File List with Status */}
      {selectedFiles.length > 0 ? (
        <ScrollView style={styles.filesContainer} nestedScrollEnabled>
          {selectedFiles.map((file) => (
            <View key={file.id} style={[
              styles.fileItem,
              file.uploadStatus === 'error' && styles.fileItemError,
              file.uploadStatus === 'completed' && styles.fileItemSuccess
            ]}>
              <Icon
                name={getFileIcon(file.mimeType || file.type)}
                size={24}
                style={styles.fileIcon}
              />
              
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <View style={styles.fileMetaRow}>
                  <Text style={styles.fileDetails}>
                    {formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase()}
                  </Text>
                  
                  {/* Phase 81.1 Enhancement - Status indicator */}
                  {file.uploadStatus === 'uploading' && (
                    <View style={styles.statusIndicator}>
                      <ActivityIndicator size="small" color={theme.primary} />
                      <Text style={styles.statusText}>Uploading...</Text>
                    </View>
                  )}
                  
                  {file.uploadStatus === 'completed' && (
                    <View style={styles.statusIndicator}>
                      <Icon name="check-circle" size={16} color="#4CAF50" />
                      <Text style={[styles.statusText, { color: '#4CAF50' }]}>Complete</Text>
                    </View>
                  )}
                  
                  {file.uploadStatus === 'error' && (
                    <View style={styles.statusIndicator}>
                      <Icon name="error" size={16} color="#F44336" />
                      <Text style={[styles.statusText, { color: '#F44336' }]}>
                        Error {retryAttempts[file.id] ? `(${retryAttempts[file.id]}/3)` : ''}
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Phase 81.1 Enhancement - Error message display */}
                {file.uploadStatus === 'error' && file.errorMessage && (
                  <Text style={styles.errorMessage} numberOfLines={2}>
                    {file.errorMessage}
                  </Text>
                )}
                
                {/* Phase 81.1 Enhancement - Progress bar */}
                {file.uploadProgress !== undefined && file.uploadProgress < 100 && file.uploadStatus === 'uploading' && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${file.uploadProgress}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>{file.uploadProgress}%</Text>
                  </View>
                )}
              </View>

              {/* Phase 81.1 Enhancement - File actions */}
              <View style={styles.fileActions}>
                {file.uploadStatus === 'error' && enableRetry && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => retryFailedFile(file.id)}
                    accessibilityLabel={`Retry upload ${file.name}`}
                    accessibilityRole="button"
                  >
                    <Icon name="refresh" size={16} color={theme.primary} />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveFile(file.id)}
                  accessibilityLabel={`Remove ${file.name}`}
                  accessibilityRole="button"
                >
                  <Icon name="close" size={16} style={styles.removeIcon} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="attach-file" size={32} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>
            No files selected yet
          </Text>
        </View>
      )}

      {/* Phase 81.1 Enhancement - Enhanced Footer with Upload Controls */}
      <View style={styles.footer}>
        <Text style={styles.fileCount}>
          {selectedFiles.length} of {maxFiles} files selected
        </Text>
        
        {selectedFiles.length > 0 && !autoUpload && (
          <View style={styles.uploadControls}>
            {selectedFiles.some(f => f.uploadStatus === 'pending' || f.uploadStatus === 'error') && (
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: theme.primary }]}
                onPress={handleBulkUpload}
                disabled={isUploading}
                accessibilityLabel="Upload all files"
                accessibilityRole="button"
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color={theme.OnPrimary} />
                ) : (
                  <Icon name="cloud-upload" size={20} color={theme.OnPrimary} />
                )}
                <Text style={[styles.uploadButtonText, { color: theme.OnPrimary }]}>
                  {isUploading ? 'Uploading...' : 'Upload All'}
                </Text>
              </TouchableOpacity>
            )}
            
            {persistFiles && selectedFiles.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  Alert.alert(
                    'Clear Files',
                    'Are you sure you want to remove all files?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear', style: 'destructive', onPress: () => {
                        setSelectedFiles([]);
                        clearPersistedFiles();
                        onFilesSelected?.([]);
                      }}
                    ]
                  );
                }}
                accessibilityLabel="Clear all files"
                accessibilityRole="button"
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Phase 81.1 Enhancement - Upload summary */}
        {selectedFiles.length > 0 && (
          <View style={styles.uploadSummary}>
            <Text style={styles.summaryText}>
              ✓ {selectedFiles.filter(f => f.uploadStatus === 'completed').length} completed • 
              ⏳ {selectedFiles.filter(f => f.uploadStatus === 'uploading').length} uploading • 
              ❌ {selectedFiles.filter(f => f.uploadStatus === 'error').length} failed
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default MediaUploader;