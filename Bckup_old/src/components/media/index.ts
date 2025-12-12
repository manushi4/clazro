/**
 * Media Components Export Index
 * Phase 73: File Upload & Media Management
 */

// Core Components
export { FileUploader } from './FileUploader';
export type { FileUploaderProps, FileUploadItem } from './FileUploader';

export { FilePreview } from './FilePreview';
export type { FilePreviewProps } from './FilePreview';

export { UploadProgress } from './UploadProgress';
export type { UploadProgressProps } from './UploadProgress';

// Image Components
export { ImagePicker } from './ImagePicker';
export type { ImagePickerProps, SelectedImage } from './ImagePicker';

// Video Components
export { VideoPlayer } from './VideoPlayer';
export type { VideoPlayerProps } from './VideoPlayer';

// Audio Components
// AudioRecorder not implemented yet - commented out
// export { AudioRecorder } from './AudioRecorder';
// export type { AudioRecorderProps, AudioRecordingResult } from './AudioRecorder';

// Gallery Components
export { MediaGallery } from './MediaGallery';
export type { MediaGalleryProps } from './MediaGallery';

// Re-export services for convenience
export { storageService } from '../../services/storage/StorageService';
export { cdnService } from '../../services/storage/CDNService';
export type {
  FileMetadata,
  UploadOptions,
  UploadProgress as UploadProgressType,
  FileSearchFilters,
  STORAGE_BUCKETS,
} from '../../services/storage/StorageService';

export type {
  ImageTransformOptions,
  CacheOptions,
  VideoStreamingOptions,
} from '../../services/storage/CDNService';