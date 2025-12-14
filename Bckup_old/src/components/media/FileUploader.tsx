/**
 * Universal File Uploader Component
 * Comprehensive file upload with progress tracking and validation
 * Phase 73: File Upload & Media Management
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { launchImageLibrary, launchCamera, MediaType } from 'react-native-image-picker';
// import DocumentPicker, { types } from 'react-native-document-picker';  // Removed - incompatible with RN 0.80.2
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LightTheme, SemanticColors, PrimaryColors } from '../../theme/colors';
import { storageService, UploadOptions, UploadProgress, FileMetadata, STORAGE_BUCKETS } from '../../services/storage/StorageService';
import { FileValidator, ValidationResult } from '../../services/storage/FileValidator';
import { UploadProgress as UploadProgressComponent } from './UploadProgress';
import FilePreview from './FilePreview';

const { width: screenWidth } = Dimensions.get('window');

export interface FileUploadItem {
  id: string;
  file: {
    uri: string;
    name: string;
    type: string;
    size?: number;
  };
  validation?: ValidationResult;
  uploadProgress?: UploadProgress;
  uploadResult?: FileMetadata;
  status: 'selected' | 'validating' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

export interface FileUploaderProps {
  bucket: keyof typeof STORAGE_BUCKETS;
  uploadPath: string;
  maxFiles?: number;
  allowedTypes?: ('image' | 'video' | 'audio' | 'document' | 'all')[];
  uploadOptions?: Partial<UploadOptions>;
  onFilesSelected?: (files: FileUploadItem[]) => void;
  onUploadProgress?: (fileId: string, progress: UploadProgress) => void;
  onUploadComplete?: (fileId: string, result: FileMetadata) => void;
  onUploadError?: (fileId: string, error: string) => void;
  onAllUploadsComplete?: (results: FileMetadata[]) => void;
  disabled?: boolean;
  style?: any;
  children?: React.ReactNode;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  bucket,
  uploadPath,
  maxFiles = 10,
  allowedTypes = ['all'],
  uploadOptions = {},
  onFilesSelected,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onAllUploadsComplete,
  disabled = false,
  style,
  children,
}) => {
  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const fileValidator = useRef(new FileValidator()).current;
  const uploadRefs = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    return () => {
      // Cancel all ongoing uploads on unmount
      uploadRefs.current.forEach(controller => controller.abort());
    };
  }, []);

  const generateFileId = useCallback(() => {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }, []);

  const validateAndAddFiles = useCallback(async (selectedFiles: any[]) => {
    const newUploadItems: FileUploadItem[] = [];

    for (const file of selectedFiles) {
      const fileId = generateFileId();
      const uploadItem: FileUploadItem = {
        id: fileId,
        file: {
          uri: file.uri,
          name: file.name || `file_${Date.now()}`,
          type: file.type || 'application/octet-stream',
          size: file.fileSize || file.size,
        },
        status: 'validating',
      };

      newUploadItems.push(uploadItem);

      // Validate file in background
      try {
        const validation = await fileValidator.validateFile(uploadItem.file, bucket);
        uploadItem.validation = validation;
        uploadItem.status = validation.isValid ? 'selected' : 'failed';
        
        if (!validation.isValid) {
          uploadItem.error = validation.errors.join(', ');
        }
      } catch (error) {
        uploadItem.status = 'failed';
        uploadItem.error = 'Validation failed';
      }
    }

    setUploadItems(prev => {
      const updated = [...prev, ...newUploadItems];
      const limited = updated.slice(-maxFiles); // Keep only last maxFiles items
      onFilesSelected?.(limited);
      return limited;
    });
  }, [bucket, fileValidator, generateFileId, maxFiles, onFilesSelected]);

  const pickImagesFromLibrary = useCallback(() => {
    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as const,
      selectionLimit: maxFiles - uploadItems.length,
    };

    launchImageLibrary(options, response => {
      if (response.assets && !response.didCancel) {
        validateAndAddFiles(response.assets);
      }
      setShowFilePicker(false);
    });
  }, [maxFiles, uploadItems.length, validateAndAddFiles]);

  const pickImageFromCamera = useCallback(() => {
    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as const,
    };

    launchCamera(options, response => {
      if (response.assets && !response.didCancel) {
        validateAndAddFiles(response.assets);
      }
      setShowFilePicker(false);
    });
  }, [validateAndAddFiles]);

  const pickDocuments = useCallback(() => {
    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      selectionLimit: maxFiles - uploadItems.length,
    };

    launchImageLibrary(options, response => {
      if (response.assets && !response.didCancel && !response.errorMessage) {
        validateAndAddFiles(response.assets);
      } else if (response.errorMessage) {
        Alert.alert('error', 'Failed to pick files');
      }
      setShowFilePicker(false);
    });
  }, [maxFiles, uploadItems.length, validateAndAddFiles]);

  const removeFile = useCallback((fileId: string) => {
    // Cancel upload if in progress
    const controller = uploadRefs.current.get(fileId);
    if (controller) {
      controller.abort();
      uploadRefs.current.delete(fileId);
    }

    setUploadItems(prev => prev.filter(item => item.id !== fileId));
  }, []);

  const startUpload = useCallback(async (fileId?: string) => {
    const itemsToUpload = fileId 
      ? uploadItems.filter(item => item.id === fileId && item.status === 'selected')
      : uploadItems.filter(item => item.status === 'selected');

    if (itemsToUpload.length === 0) return;

    setIsUploading(true);
    const completedUploads: FileMetadata[] = [];

    for (const item of itemsToUpload) {
      try {
        // Update status
        setUploadItems(prev => 
          prev.map(i => i.id === item.id ? { ...i, status: 'uploading' } : i)
        );

        // Create abort controller for this upload
        const controller = new AbortController();
        uploadRefs.current.set(item.id, controller);

        // Start upload
        const result = await storageService.uploadFile(
          item.file,
          {
            bucket,
            path: uploadPath,
            ...uploadOptions,
            onProgress: (progress) => {
              setUploadItems(prev => 
                prev.map(i => i.id === item.id ? { ...i, uploadProgress: progress } : i)
              );
              onUploadProgress?.(item.id, progress);
            },
          }
        );

        // Upload completed successfully
        setUploadItems(prev => 
          prev.map(i => i.id === item.id ? { 
            ...i, 
            status: 'completed',
            uploadResult: result 
          } : i)
        );

        completedUploads.push(result);
        onUploadComplete?.(item.id, result);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        setUploadItems(prev => 
          prev.map(i => i.id === item.id ? { 
            ...i, 
            status: 'failed',
            error: errorMessage 
          } : i)
        );

        onUploadError?.(item.id, errorMessage);
      } finally {
        uploadRefs.current.delete(item.id);
      }
    }

    setIsUploading(false);

    if (completedUploads.length > 0) {
      onAllUploadsComplete?.(completedUploads);
    }
  }, [uploadItems, bucket, uploadPath, uploadOptions, onUploadProgress, onUploadComplete, onUploadError, onAllUploadsComplete]);

  const startAllUploads = useCallback(() => {
    startUpload();
  }, [startUpload]);

  const clearCompleted = useCallback(() => {
    setUploadItems(prev => prev.filter(item => item.status !== 'completed'));
  }, []);

  const clearAll = useCallback(() => {
    // Cancel all ongoing uploads
    uploadRefs.current.forEach(controller => controller.abort());
    uploadRefs.current.clear();
    
    setUploadItems([]);
    setIsUploading(false);
  }, []);

  const renderFilePickerOptions = () => {
    if (!showFilePicker) return null;

    return (
      <View style={styles.filePickerOptions}>
        <TouchableOpacity
          style={styles.filePickerOption}
          onPress={pickImageFromCamera}
        >
          <Icon name="camera-alt" size={24} color={PrimaryColors.primary500} />
          <Text style={styles.filePickerOptionText}>Camera</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.filePickerOption}
          onPress={pickImagesFromLibrary}
        >
          <Icon name="photo-library" size={24} color={PrimaryColors.primary500} />
          <Text style={styles.filePickerOptionText}>Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.filePickerOption}
          onPress={pickDocuments}
        >
          <Icon name="insert-drive-file" size={24} color={PrimaryColors.primary500} />
          <Text style={styles.filePickerOptionText}>Documents</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderUploadItem = (item: FileUploadItem) => {
    return (
      <View key={item.id} style={styles.uploadItem}>
        <FilePreview
          file={item.file}
          size={60}
          style={styles.filePreview}
        />
        
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.file.name}
          </Text>
          
          <Text style={styles.fileSize}>
            {item.file.size ? `${(item.file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
          </Text>
          
          {item.validation && !item.validation.isValid && (
            <Text style={styles.errorText} numberOfLines={2}>
              {item.validation.errors.join(', ')}
            </Text>
          )}
          
          {item.error && (
            <Text style={styles.errorText} numberOfLines={2}>
              {item.error}
            </Text>
          )}
          
          {item.uploadProgress && item.status === 'uploading' && (
            <UploadProgressComponent
              progress={item.uploadProgress}
              style={styles.progressBar}
            />
          )}
        </View>
        
        <View style={styles.fileActions}>
          {item.status === 'selected' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => startUpload(item.id)}
              disabled={isUploading}
            >
              <Icon name="cloud-upload" size={20} color={PrimaryColors.primary500} />
            </TouchableOpacity>
          )}
          
          {item.status === 'completed' && (
            <Icon name="check-circle" size={20} color={SemanticColors.Success} />
          )}
          
          {item.status === 'failed' && (
            <Icon name="error" size={20} color={SemanticColors.Error} />
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => removeFile(item.id)}
            disabled={item.status === 'uploading'}
          >
            <Icon 
              name="close" 
              size={20} 
              color={item.status === 'uploading' ? LightTheme.OnSurfaceVariant : SemanticColors.Error} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const hasValidFiles = uploadItems.some(item => item.status === 'selected');
  const hasCompletedFiles = uploadItems.some(item => item.status === 'completed');

  return (
    <View style={[styles.container, style]}>
      {children || (
        <View style={styles.uploadArea}>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              disabled && styles.uploadButtonDisabled,
              uploadItems.length >= maxFiles && styles.uploadButtonFull,
            ]}
            onPress={() => setShowFilePicker(true)}
            disabled={disabled || uploadItems.length >= maxFiles}
          >
            <Icon name="cloud-upload" size={32} color={
              disabled || uploadItems.length >= maxFiles 
                ? LightTheme.OnSurfaceVariant 
                : PrimaryColors.primary500
            } />
            <Text style={[
              styles.uploadButtonText,
              disabled && styles.uploadButtonTextDisabled,
            ]}>
              {uploadItems.length >= maxFiles 
                ? `Maximum ${maxFiles} files reached`
                : 'Tap to select files'
              }
            </Text>
            <Text style={styles.uploadButtonSubtext}>
              Images, Videos, Documents
            </Text>
          </TouchableOpacity>
          
          {renderFilePickerOptions()}
        </View>
      )}
      
      {uploadItems.length > 0 && (
        <View style={styles.uploadsList}>
          <View style={styles.uploadsHeader}>
            <Text style={styles.uploadsTitle}>
              Files ({uploadItems.length}/{maxFiles})
            </Text>
            
            <View style={styles.uploadsActions}>
              {hasValidFiles && (
                <TouchableOpacity
                  style={[styles.bulkActionButton, styles.uploadAllButton]}
                  onPress={startAllUploads}
                  disabled={isUploading}
                >
                  <Icon name="cloud-upload" size={16} color="white" />
                  <Text style={styles.bulkActionButtonText}>Upload All</Text>
                </TouchableOpacity>
              )}
              
              {hasCompletedFiles && (
                <TouchableOpacity
                  style={[styles.bulkActionButton, styles.clearCompletedButton]}
                  onPress={clearCompleted}
                >
                  <Icon name="check" size={16} color={SemanticColors.Success} />
                  <Text style={[styles.bulkActionButtonText, { color: SemanticColors.Success }]}>
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.bulkActionButton, styles.clearAllButton]}
                onPress={clearAll}
                disabled={isUploading}
              >
                <Icon name="clear-all" size={16} color={SemanticColors.Error} />
                <Text style={[styles.bulkActionButtonText, { color: SemanticColors.Error }]}>
                  Clear All
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.uploadItemsList} showsVerticalScrollIndicator={false}>
            {uploadItems.map(renderUploadItem)}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  uploadArea: {
    marginBottom: 16,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: PrimaryColors.primary500,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: LightTheme.Surface,
    minHeight: 120,
    justifyContent: 'center',
  },
  uploadButtonDisabled: {
    borderColor: LightTheme.OnSurfaceVariant,
    backgroundColor: LightTheme.SurfaceVariant,
  },
  uploadButtonFull: {
    borderColor: SemanticColors.Warning,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginTop: 8,
    textAlign: 'center',
  },
  uploadButtonTextDisabled: {
    color: LightTheme.OnSurfaceVariant,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: LightTheme.OnSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  filePickerOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    backgroundColor: LightTheme.Surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filePickerOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    minWidth: 80,
  },
  filePickerOptionText: {
    fontSize: 12,
    color: LightTheme.OnSurface,
    marginTop: 4,
    textAlign: 'center',
  },
  uploadsList: {
    flex: 1,
    maxHeight: 400,
  },
  uploadsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
  },
  uploadsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: LightTheme.OnSurface,
  },
  uploadsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  uploadAllButton: {
    backgroundColor: PrimaryColors.primary500,
  },
  clearCompletedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: SemanticColors.Success,
  },
  clearAllButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: SemanticColors.Error,
  },
  bulkActionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  uploadItemsList: {
    maxHeight: 300,
  },
  uploadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: LightTheme.Surface,
    borderRadius: 8,
    marginVertical: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filePreview: {
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
    paddingRight: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: LightTheme.OnSurface,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 11,
    color: SemanticColors.Error,
    marginBottom: 4,
  },
  progressBar: {
    marginTop: 4,
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
});

export default FileUploader;
export { FileUploader };