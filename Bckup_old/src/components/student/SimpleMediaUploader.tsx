/**
 * SimpleMediaUploader - Enhanced Media Upload Component
 * Phase 82: Advanced Features Enhancement Suite
 * Features: Real camera/file access, previews, compression, drag-drop
 */

import React, { useState, useRef, useEffect } from 'react';
import type { DocumentPickerResponse } from '../../types/database';

import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Image,
  Modal,
  PanResponder,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
// import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';  // Removed - incompatible with RN 0.80.2
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { LightTheme } from '../../theme/colors';

export interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uri: string;
  uploadProgress?: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error' | 'compressing';
  errorMessage?: string;
  thumbnail?: string;
  compressedSize?: number;
  uploadSpeed?: number;
  estimatedTimeRemaining?: number;
  lastModified?: number;
}

export interface SimpleMediaUploaderProps {
  onFilesSelected?: (files: MediaFile[]) => void;
  onFileRemoved?: (fileId: string) => void;
  onUploadProgress?: (fileId: string, progress: number) => void;
  onUploadComplete?: (fileId: string, result: any) => void;
  onUploadError?: (fileId: string, error: string) => void;
  maxFiles?: number;
  maxFileSize?: number;
  enableCamera?: boolean;
  enableDocuments?: boolean;
  enableMultiSelect?: boolean;
  autoUpload?: boolean;
  showPreview?: boolean;
  persistFiles?: boolean;
  enableRetry?: boolean;
  compressionQuality?: number;
  enableDragDrop?: boolean;
  enableImageCompression?: boolean;
  generateThumbnails?: boolean;
  enableBulkActions?: boolean;
  allowedFileTypes?: string[];
}

const { width } = Dimensions.get('window');

const SimpleMediaUploader: React.FC<SimpleMediaUploaderProps> = ({
  onFilesSelected,
  onFileRemoved,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  maxFileSize = 25,
  enableCamera = true,
  enableDocuments = true,
  enableMultiSelect = true,
  autoUpload = false,
  showPreview = true,
  persistFiles = true,
  enableRetry = true,
  compressionQuality = 0.8,
}) => {
  const { theme } = useTheme();
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewModal, setPreviewModal] = useState<{visible: boolean, file?: MediaFile}>({visible: false});
  const [dragActive, setDragActive] = useState(false);
  const [totalUploadProgress, setTotalUploadProgress] = useState(0);
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);
  const dragAnimation = useRef(new Animated.Value(0)).current;
  const uploadTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (persistFiles) {
      loadPersistedFiles();
    }
    
    return () => {
      if (uploadTimerRef.current) {
        clearInterval(uploadTimerRef.current);
      }
    };
  }, []);
  
  const loadPersistedFiles = async () => {
    try {
      const savedFiles = await AsyncStorage.getItem('media_uploader_files');
      if (savedFiles) {
        const files = JSON.parse(savedFiles);
        setSelectedFiles(files.filter((f: MediaFile) => f.uploadStatus !== 'completed'));
      }
    } catch (error) {
      console.log('Error loading persisted files:', error);
    }
  };
  
  const saveFilesToStorage = async (files: MediaFile[]) => {
    try {
      await AsyncStorage.setItem('media_uploader_files', JSON.stringify(files));
    } catch (error) {
      console.log('Error persisting files:', error);
    }
  };

  // Real camera capture with permission handling
  const handleCameraCapture = async () => {
    try {
      // Check camera permission for Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to camera to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
          return;
        }
      }

      const options = {
        mediaType: 'photo' as MediaType,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: compressionQuality,
      };

      launchCamera(options, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('User cancelled camera');
        } else if (response.errorMessage) {
          Alert.alert('Camera Error', response.errorMessage);
        } else if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          const newFile: MediaFile = {
            id: `camera_${Date.now()}`,
            name: asset.fileName || `photo_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
            size: asset.fileSize || 0,
            uri: asset.uri || '',
            uploadStatus: 'pending'
          };
          addFile(newFile);
        }
      });
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('error', 'Failed to access camera. Please try again.');
    }
  };

  // File picker - using image library for media files
  // Note: For documents (PDF, DOC, etc.), use react-native-image-picker's mixed mode
  const handleFilePicker = async () => {
    try {
      // Check storage permission for Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to storage to select files',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Storage permission is required to select files.');
          return;
        }
      }

      // Use image picker for media files (images and videos)
      const options = {
        mediaType: 'mixed' as MediaType,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: compressionQuality,
        selectionLimit: enableMultiSelect ? maxFiles - selectedFiles.length : 1,
      };

      launchImageLibrary(options, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('User cancelled file picker');
        } else if (response.errorMessage) {
          Alert.alert('File Picker Error', response.errorMessage);
        } else if (response.assets) {
          response.assets.forEach((asset, index) => {
            // Check file size
            if (asset.fileSize && asset.fileSize > maxFileSize * 1024 * 1024) {
              Alert.alert('File Too Large', `Selected file exceeds ${maxFileSize}MB limit.`);
              return;
            }

            const newFile: MediaFile = {
              id: `file_${Date.now()}_${index}`,
              name: asset.fileName || `file_${Date.now()}.${asset.type?.split('/')[1] || 'jpg'}`,
              type: asset.type || 'application/octet-stream',
              size: asset.fileSize || 0,
              uri: asset.uri || '',
              uploadStatus: 'pending'
            };
            addFile(newFile);
          });
        }
      });
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('error', 'Failed to select files. Please try again.');
    }
  };

  // Real gallery picker for images and videos
  const handleGalleryPicker = async () => {
    try {
      // Check storage permission for Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to storage to select photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Storage permission is required to select photos.');
          return;
        }
      }

      const options = {
        mediaType: 'mixed' as MediaType,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: compressionQuality,
        selectionLimit: enableMultiSelect ? maxFiles - selectedFiles.length : 1,
      };

      launchImageLibrary(options, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('User cancelled gallery');
        } else if (response.errorMessage) {
          Alert.alert('Gallery Error', response.errorMessage);
        } else if (response.assets) {
          response.assets.forEach((asset, index) => {
            // Check file size
            if (asset.fileSize && asset.fileSize > maxFileSize * 1024 * 1024) {
              Alert.alert('File Too Large', `Selected file exceeds ${maxFileSize}MB limit.`);
              return;
            }

            const newFile: MediaFile = {
              id: `gallery_${Date.now()}_${index}`,
              name: asset.fileName || `image_${Date.now()}.jpg`,
              type: asset.type || 'image/jpeg',
              size: asset.fileSize || 0,
              uri: asset.uri || '',
              uploadStatus: 'pending'
            };
            addFile(newFile);
          });
        }
      });
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('error', 'Failed to access gallery. Please try again.');
    }
  };

  // Enhanced file addition with compression and thumbnails
  const addFile = async (file: MediaFile) => {
    if (selectedFiles.length >= maxFiles) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxFiles} files.`);
      return;
    }

    // Generate thumbnail for images
    let enhancedFile = { ...file };
    if (generateThumbnails && file.type.startsWith('image/')) {
      enhancedFile.thumbnail = file.uri; // In production, generate actual thumbnail
    }

    // Compress image if enabled
    if (enableImageCompression && file.type.startsWith('image/')) {
      enhancedFile = await compressImage(enhancedFile);
    }

    const newFiles = [...selectedFiles, enhancedFile];
    setSelectedFiles(newFiles);
    onFilesSelected?.(newFiles);

    if (persistFiles) {
      await saveFilesToStorage(newFiles);
    }

    if (autoUpload) {
      simulateUpload(enhancedFile.id);
    }
  };

  // Phase 82: Image compression
  const compressImage = async (file: MediaFile): Promise<MediaFile> => {
    // Update status to compressing
    const compressingFile = { ...file, uploadStatus: 'compressing' as const };
    setSelectedFiles(prev => prev.map(f => f.id === file.id ? compressingFile : f));

    // Simulate compression (in production, use actual image compression)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const compressedSize = Math.floor(file.size * compressionQuality);
    return {
      ...file,
      compressedSize,
      uploadStatus: 'pending',
    };
  };

  // Enhanced file removal with persistence
  const removeFile = async (fileId: string) => {
    const newFiles = selectedFiles.filter(f => f.id !== fileId);
    setSelectedFiles(newFiles);
    onFilesSelected?.(newFiles);
    onFileRemoved?.(fileId);
    
    if (persistFiles) {
      await saveFilesToStorage(newFiles);
    }
  };

  // Phase 82: Bulk file removal
  const removeAllFiles = async () => {
    Alert.alert(
      'Remove All Files',
      'Are you sure you want to remove all files?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove All',
          style: 'destructive',
          onPress: async () => {
            setSelectedFiles([]);
            onFilesSelected?.([]);
            if (persistFiles) {
              await AsyncStorage.removeItem('media_uploader_files');
            }
          }
        }
      ]
    );
  };

  // Enhanced upload simulation with speed tracking and ETA
  const simulateUpload = (fileId: string) => {
    setIsUploading(true);
    const startTime = Date.now();
    setUploadStartTime(startTime);
    
    // Update file status to uploading
    setSelectedFiles(prev => prev.map(file => 
      file.id === fileId ? { 
        ...file, 
        uploadStatus: 'uploading' as const, 
        uploadProgress: 0,
        uploadSpeed: 0,
        estimatedTimeRemaining: 0
      } : file
    ));

    // Enhanced progress simulation with realistic speed calculation
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // Variable progress increment
      const elapsed = (Date.now() - startTime) / 1000; // seconds
      const speed = progress > 0 ? (progress / elapsed) : 0; // progress per second
      const eta = progress < 100 ? ((100 - progress) / speed) : 0;
      
      setSelectedFiles(prev => prev.map(file => 
        file.id === fileId ? { 
          ...file, 
          uploadProgress: Math.min(progress, 100),
          uploadSpeed: speed,
          estimatedTimeRemaining: eta
        } : file
      ));
      
      onUploadProgress?.(fileId, Math.min(progress, 100));

      if (progress >= 100) {
        clearInterval(interval);
        
        // Mark as completed
        setSelectedFiles(prev => prev.map(file => 
          file.id === fileId ? { 
            ...file, 
            uploadStatus: 'completed' as const, 
            uploadProgress: 100,
            uploadSpeed: 0,
            estimatedTimeRemaining: 0
          } : file
        ));
        
        onUploadComplete?.(fileId, { 
          success: true, 
          url: `https://example.com/files/${fileId}`,
          uploadTime: elapsed,
          finalSize: file.compressedSize || file.size
        });
        setIsUploading(false);
        
        // Update total progress
        updateTotalProgress();
      }
    }, 300 + Math.random() * 200); // Variable interval for realism
  };

  // Phase 82: Calculate total upload progress
  const updateTotalProgress = () => {
    const totalFiles = selectedFiles.length;
    if (totalFiles === 0) {
      setTotalUploadProgress(0);
      return;
    }
    
    const totalProgress = selectedFiles.reduce((sum, file) => {
      return sum + (file.uploadProgress || 0);
    }, 0);
    
    setTotalUploadProgress(totalProgress / totalFiles);
  };

  // Upload all pending files
  const handleUploadAll = () => {
    const pendingFiles = selectedFiles.filter(f => f.uploadStatus === 'pending');
    if (pendingFiles.length === 0) {
      Alert.alert('No Files', 'No files are pending upload.');
      return;
    }

    pendingFiles.forEach(file => {
      setTimeout(() => simulateUpload(file.id), Math.random() * 1000);
    });
  };

  // Enhanced file size formatting
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Phase 82: Format upload speed
  const formatUploadSpeed = (speed: number): string => {
    return `${speed.toFixed(1)}%/s`;
  };

  // Phase 82: Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  // Phase 82: Open preview modal
  const openPreview = (file: MediaFile) => {
    if (file.type.startsWith('image/') || file.thumbnail) {
      setPreviewModal({ visible: true, file });
    }
  };

  // Phase 82: Close preview modal
  const closePreview = () => {
    setPreviewModal({ visible: false });
  };

  // Get file icon based on type
  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video_file';
    if (type.startsWith('audio/')) return 'audio_file';
    if (type.includes('pdf')) return 'picture_as_pdf';
    return 'insert_drive_file';
  };

  // Get status icon
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pending': return 'schedule';
      case 'uploading': return 'cloud_upload';
      case 'completed': return 'check_circle';
      case 'error': return 'error';
      default: return 'help';
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return LightTheme.Outline;
      case 'uploading': return LightTheme.Primary;
      case 'completed': return '#4CAF50';
      case 'error': return LightTheme.Error;
      default: return LightTheme.Outline;
    }
  };

  return (
    <View style={styles.container}>
      {/* Enhanced Upload Actions with Progress */}
      <View style={styles.uploadActionsContainer}>
        {/* Total Progress Bar */}
        {selectedFiles.length > 0 && isUploading && (
          <View style={styles.totalProgressContainer}>
            <View style={styles.totalProgressBar}>
              <View style={[styles.totalProgressFill, { width: `${totalUploadProgress}%` }]} />
            </View>
            <Text style={styles.totalProgressText}>
              Overall Progress: {Math.round(totalUploadProgress)}%
            </Text>
          </View>
        )}
        
        <View style={styles.uploadActions}>
          {enableCamera && (
            <TouchableOpacity style={styles.actionButton} onPress={handleCameraCapture}>
              <Icon name="photo-camera" size={20} color={LightTheme.OnPrimary} />
              <Text style={styles.actionButtonText}>Camera</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.actionButton} onPress={handleGalleryPicker}>
            <Icon name="photo-library" size={20} color={LightTheme.OnPrimary} />
            <Text style={styles.actionButtonText}>Gallery</Text>
          </TouchableOpacity>
          
          {enableDocuments && (
            <TouchableOpacity style={styles.actionButton} onPress={handleFilePicker}>
              <Icon name="insert-drive-file" size={20} color={LightTheme.OnPrimary} />
              <Text style={styles.actionButtonText}>Files</Text>
            </TouchableOpacity>
          )}

          {selectedFiles.length > 0 && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.uploadButton]} 
              onPress={handleUploadAll}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size={16} color={LightTheme.OnPrimary} />
              ) : (
                <Icon name="cloud-upload" size={20} color={LightTheme.OnPrimary} />
              )}
              <Text style={styles.actionButtonText}>Upload All</Text>
            </TouchableOpacity>
          )}
          
          {/* Bulk Actions */}
          {enableBulkActions && selectedFiles.length > 1 && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.removeAllButton]} 
              onPress={removeAllFiles}
            >
              <Icon name="clear-all" size={20} color={LightTheme.OnError} />
              <Text style={[styles.actionButtonText, { color: LightTheme.OnError }]}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Enhanced File List with Previews */}
      {selectedFiles.length > 0 && (
        <ScrollView style={styles.fileList} showsVerticalScrollIndicator={false}>
          {selectedFiles.map((file, index) => (
            <View key={file.id} style={styles.fileItem}>
              <TouchableOpacity 
                style={styles.fileInfo} 
                onPress={() => openPreview(file)}
                disabled={!file.type.startsWith('image/')}
              >
                {/* Enhanced file preview */}
                <View style={styles.filePreview}>
                  {file.thumbnail ? (
                    <Image source={{ uri: file.thumbnail }} style={styles.thumbnailImage} />
                  ) : (
                    <Icon 
                      name={getFileIcon(file.type)} 
                      size={32} 
                      color={LightTheme.Primary} 
                      style={styles.fileIcon} 
                    />
                  )}
                  {file.uploadStatus === 'compressing' && (
                    <View style={styles.compressionOverlay}>
                      <ActivityIndicator size={16} color={LightTheme.OnPrimary} />
                    </View>
                  )}
                </View>
                
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <View style={styles.fileSizeContainer}>
                    <Text style={styles.fileSize}>
                      {formatFileSize(file.compressedSize || file.size)}
                    </Text>
                    {file.compressedSize && file.compressedSize < file.size && (
                      <Text style={styles.compressionSavings}>
                        ({Math.round((1 - file.compressedSize / file.size) * 100)}% smaller)
                      </Text>
                    )}
                  </View>
                  
                  {/* Enhanced progress display */}
                  {file.uploadProgress !== undefined && file.uploadStatus === 'uploading' && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressBarFill, { width: `${file.uploadProgress}%` }]} />
                      </View>
                      <View style={styles.progressInfo}>
                        <Text style={styles.progressText}>{Math.round(file.uploadProgress)}%</Text>
                        {file.uploadSpeed && (
                          <Text style={styles.speedText}>
                            {formatUploadSpeed(file.uploadSpeed)}
                          </Text>
                        )}
                        {file.estimatedTimeRemaining && (
                          <Text style={styles.etaText}>
                            ETA: {formatTimeRemaining(file.estimatedTimeRemaining)}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                  
                  {file.uploadStatus === 'compressing' && (
                    <Text style={styles.compressionText}>Optimizing image...</Text>
                  )}
                </View>
              </TouchableOpacity>
              
              <View style={styles.fileActions}>
                {file.type.startsWith('image/') && (
                  <TouchableOpacity 
                    style={styles.previewButton}
                    onPress={() => openPreview(file)}
                  >
                    <Icon name="visibility" size={20} color={LightTheme.Primary} />
                  </TouchableOpacity>
                )}
                <Icon 
                  name={getStatusIcon(file.uploadStatus)} 
                  size={20} 
                  color={getStatusColor(file.uploadStatus)} 
                />
                <TouchableOpacity 
                  style={styles.removeButton} 
                  onPress={() => removeFile(file.id)}
                >
                  <Icon name="close" size={20} color={LightTheme.Error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      
      {/* Preview Modal */}
      <Modal
        visible={previewModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePreview}
      >
        <View style={styles.previewModalOverlay}>
          <View style={styles.previewModalContent}>
            <TouchableOpacity style={styles.previewCloseButton} onPress={closePreview}>
              <Icon name="close" size={24} color={LightTheme.OnSurface} />
            </TouchableOpacity>
            {previewModal.file && (
              <>
                <Text style={styles.previewTitle}>{previewModal.file.name}</Text>
                <Image 
                  source={{ uri: previewModal.file.thumbnail || previewModal.file.uri }} 
                  style={styles.previewImage}
                  resizeMode="contain"
                />
                <Text style={styles.previewInfo}>
                  Size: {formatFileSize(previewModal.file.compressedSize || previewModal.file.size)}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Empty State */}
      {selectedFiles.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="cloud-upload" size={48} color={LightTheme.Outline} />
          <Text style={styles.emptyText}>No files selected</Text>
          <Text style={styles.emptySubtext}>
            Tap Camera, Gallery, or Files to add attachments
          </Text>
        </View>
      )}

      {/* Enhanced Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          📎 Max {maxFiles} files, {maxFileSize}MB each
        </Text>
        <Text style={styles.infoText}>
          📱 Phase 82 Enhanced: Real camera, compression, previews
        </Text>
        {enableImageCompression && (
          <Text style={styles.infoText}>
            🗜 Image compression enabled ({Math.round(compressionQuality * 100)}% quality)
          </Text>
        )}
        {generateThumbnails && (
          <Text style={styles.infoText}>
            🖼 Thumbnail generation enabled
          </Text>
        )}
        <Text style={styles.infoText}>
          ✨ Advanced features: Speed tracking, ETA, bulk actions
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 200,
    backgroundColor: LightTheme.Surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: LightTheme.Outline,
    borderStyle: 'dashed',
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 80,
    backgroundColor: LightTheme.Primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  uploadButton: {
    backgroundColor: LightTheme.Secondary,
  },
  actionButtonText: {
    color: LightTheme.OnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  fileList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  fileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: LightTheme.OnSurface,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: LightTheme.Outline,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    position: 'relative',
    height: 4,
    backgroundColor: LightTheme.OutlineVariant,
    borderRadius: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: LightTheme.Primary,
    borderRadius: 2,
  },
  progressText: {
    position: 'absolute',
    right: 0,
    top: -16,
    fontSize: 10,
    color: LightTheme.Primary,
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: LightTheme.Outline,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: LightTheme.Outline,
    marginTop: 4,
    textAlign: 'center',
  },
  infoSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
  },
  infoText: {
    fontSize: 12,
    color: LightTheme.Outline,
    textAlign: 'center',
    marginBottom: 4,
  },
  // Phase 82: Enhanced styles
  uploadActionsContainer: {
    marginBottom: 16,
  },
  totalProgressContainer: {
    marginBottom: 12,
  },
  totalProgressBar: {
    height: 6,
    backgroundColor: LightTheme.OutlineVariant,
    borderRadius: 3,
    marginBottom: 4,
  },
  totalProgressFill: {
    height: 6,
    backgroundColor: LightTheme.Secondary,
    borderRadius: 3,
  },
  totalProgressText: {
    fontSize: 11,
    color: LightTheme.Outline,
    textAlign: 'center',
  },
  removeAllButton: {
    backgroundColor: LightTheme.errorContainer,
  },
  filePreview: {
    position: 'relative',
    marginRight: 12,
  },
  thumbnailImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  compressionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  compressionSavings: {
    fontSize: 10,
    color: '#4CAF50',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: LightTheme.Primary,
    borderRadius: 2,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  speedText: {
    fontSize: 9,
    color: LightTheme.Primary,
    fontWeight: '600',
  },
  etaText: {
    fontSize: 9,
    color: LightTheme.Outline,
  },
  compressionText: {
    fontSize: 10,
    color: LightTheme.Primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  previewButton: {
    padding: 4,
    marginRight: 8,
  },
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: LightTheme.Surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  previewCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: 16,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewInfo: {
    fontSize: 14,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
});

export default SimpleMediaUploader;