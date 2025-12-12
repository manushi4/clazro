/**
 * Storage Services Export Index
 * Phase 73: File Upload & Media Management
 */

// Core Storage Service
export { StorageService, storageService } from './StorageService';
export type {
  FileMetadata,
  UploadProgress,
  UploadOptions,
  FileSearchFilters,
} from './StorageService';
export { STORAGE_BUCKETS, FILE_PATHS } from './StorageService';

// File Validation Service
export { FileValidator } from './FileValidator';
export type { ValidationResult } from './FileValidator';
export { FILE_TYPES, BUCKET_CONFIGS } from './FileValidator';

// Media Processing Service
export { MediaProcessor } from './MediaProcessor';
export type {
  ProcessingOptions,
  ProcessingResult,
} from './MediaProcessor';
export { PROCESSING_CONFIG } from './MediaProcessor';

// Upload Manager Service
export { UploadManager } from './UploadManager';
export type {
  UploadTask,
  UploadChunk,
  UploadResult,
  UploadOptions as ManagerUploadOptions,
} from './UploadManager';

// CDN Service
export { CDNService, cdnService } from './CDNService';
export type {
  ImageTransformOptions,
  CacheOptions,
  VideoStreamingOptions,
} from './CDNService';
export { RESPONSIVE_BREAKPOINTS } from './CDNService';