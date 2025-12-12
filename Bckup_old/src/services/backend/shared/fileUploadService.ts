/**
 * File Upload Service
 * Handles file uploads to Supabase Storage
 *
 * Storage Buckets:
 * - avatars: User profile images (5 MB, public)
 * - assignments: Assignment files (100 MB, private)
 * - class-materials: Class materials (500 MB, private)
 * - chat-media: Chat attachments (50 MB, private)
 * - documents: General documents (100 MB, private)
 * - temp-uploads: Temporary uploads (100 MB, private)
 */

import { supabase } from '../../../lib/supabaseClient';

// ==================== TYPES ====================

export interface UploadOptions {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  path: string;
  url: string;
  publicUrl?: string;
  size: number;
  type: string;
  bucket: string;
}

export interface FileUpload {
  file: File;
  path: string;
}

export interface FileObject {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  sortBy?: { column: string; order: 'asc' | 'desc' };
  search?: string;
}

// ==================== UPLOAD FUNCTIONS ====================

/**
 * Upload a single file to storage
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 * @param file - File to upload
 * @param options - Upload options
 * @returns Promise<UploadResult>
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: options?.cacheControl || '3600',
      contentType: options?.contentType || file.type,
      upsert: options?.upsert || false,
    });

  if (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }

  // Get public URL for public buckets
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: publicUrlData.publicUrl,
    publicUrl: publicUrlData.publicUrl,
    size: file.size,
    type: file.type,
    bucket,
  };
}

/**
 * Upload multiple files in parallel
 * @param bucket - Storage bucket name
 * @param files - Array of files with paths
 * @returns Promise<UploadResult[]>
 */
export async function uploadMultipleFiles(
  bucket: string,
  files: FileUpload[]
): Promise<UploadResult[]> {
  const uploadPromises = files.map((fileUpload) =>
    uploadFile(bucket, fileUpload.path, fileUpload.file)
  );

  return Promise.all(uploadPromises);
}

// ==================== DOWNLOAD FUNCTIONS ====================

/**
 * Download a file from storage
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 * @returns Promise<Blob>
 */
export async function downloadFile(bucket: string, path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error) {
    throw new Error(`File download failed: ${error.message}`);
  }

  return data;
}

/**
 * Get public URL for a file
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 * @returns string - Public URL
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Get signed URL for a private file
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 * @param expiresIn - Expiration time in seconds (default: 3600)
 * @returns Promise<string>
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

// ==================== DELETE FUNCTIONS ====================

/**
 * Delete a file from storage
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 * @returns Promise<void>
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`File deletion failed: ${error.message}`);
  }
}

/**
 * Delete multiple files from storage
 * @param bucket - Storage bucket name
 * @param paths - Array of file paths
 * @returns Promise<void>
 */
export async function deleteMultipleFiles(
  bucket: string,
  paths: string[]
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw new Error(`Bulk file deletion failed: ${error.message}`);
  }
}

// ==================== LIST FUNCTIONS ====================

/**
 * List files in a bucket folder
 * @param bucket - Storage bucket name
 * @param folder - Folder path (optional)
 * @param options - List options
 * @returns Promise<FileObject[]>
 */
export async function listFiles(
  bucket: string,
  folder: string = '',
  options?: ListOptions
): Promise<FileObject[]> {
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: options?.limit || 100,
    offset: options?.offset || 0,
    sortBy: options?.sortBy || { column: 'name', order: 'asc' },
    search: options?.search,
  });

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Validate file type against allowed types
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns boolean
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in megabytes
 * @returns boolean
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Get file extension from filename
 * @param filename - Filename to parse
 * @returns string
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Generate unique filename with timestamp
 * @param originalName - Original filename
 * @returns string
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const nameWithoutExt = originalName.substring(
    0,
    originalName.lastIndexOf('.')
  );

  return `${nameWithoutExt}-${timestamp}-${randomStr}.${extension}`;
}

/**
 * Format file size to human-readable string
 * @param bytes - Size in bytes
 * @returns string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get MIME type from file extension
 * @param extension - File extension
 * @returns string
 */
export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'zip': 'application/zip',
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

// ==================== BUCKET-SPECIFIC HELPERS ====================

/**
 * Upload assignment file
 * @param teacherId - Teacher UUID
 * @param assignmentId - Assignment UUID
 * @param file - File to upload
 * @returns Promise<UploadResult>
 */
export async function uploadAssignmentFile(
  teacherId: string,
  assignmentId: string,
  file: File
): Promise<UploadResult> {
  const filename = generateUniqueFilename(file.name);
  const path = `${teacherId}/${assignmentId}/${filename}`;

  return uploadFile('assignments', path, file);
}

/**
 * Upload student submission
 * @param studentId - Student UUID
 * @param assignmentId - Assignment UUID
 * @param file - File to upload
 * @returns Promise<UploadResult>
 */
export async function uploadSubmissionFile(
  studentId: string,
  assignmentId: string,
  file: File
): Promise<UploadResult> {
  const filename = generateUniqueFilename(file.name);
  const path = `${studentId}/${assignmentId}/${filename}`;

  // Note: "submissions" bucket doesn't exist, using "assignments" for now
  // Create submissions bucket if needed
  return uploadFile('temp-uploads', path, file);
}

/**
 * Upload profile image
 * @param userId - User UUID
 * @param file - Image file
 * @returns Promise<UploadResult>
 */
export async function uploadProfileImage(
  userId: string,
  file: File
): Promise<UploadResult> {
  const filename = generateUniqueFilename(file.name);
  const path = `${userId}/${filename}`;

  return uploadFile('avatars', path, file, { upsert: true });
}

/**
 * Upload chat media
 * @param roomId - Chat room UUID
 * @param userId - User UUID
 * @param file - Media file
 * @returns Promise<UploadResult>
 */
export async function uploadChatMedia(
  roomId: string,
  userId: string,
  file: File
): Promise<UploadResult> {
  const filename = generateUniqueFilename(file.name);
  const path = `${roomId}/${userId}/${filename}`;

  return uploadFile('chat-media', path, file);
}

/**
 * Upload class material
 * @param teacherId - Teacher UUID
 * @param classId - Class UUID
 * @param file - Material file
 * @returns Promise<UploadResult>
 */
export async function uploadClassMaterial(
  teacherId: string,
  classId: string,
  file: File
): Promise<UploadResult> {
  const filename = generateUniqueFilename(file.name);
  const path = `${teacherId}/${classId}/${filename}`;

  return uploadFile('class-materials', path, file);
}
