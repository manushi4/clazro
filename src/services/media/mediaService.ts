/**
 * Media Upload Service
 * Per MEDIA_FILE_HANDLING_SPEC.md
 *
 * Handles file uploads to Supabase Storage with:
 * - Multi-tenant path organization
 * - Signed URL generation
 * - File metadata tracking
 * - Progress callbacks
 */

import { getSupabaseClient, DEMO_CUSTOMER_ID } from '../../lib/supabaseClient';
import { Platform } from 'react-native';

// Storage bucket names
export const BUCKETS = {
  STUDY_PDFS: 'study-pdfs',
  CLASS_RECORDINGS: 'class-recordings',
  THUMBNAILS: 'thumbnails',
  USER_UPLOADS: 'user-uploads',
  AVATARS: 'avatars',
  SCHOOL_BRANDING: 'school-branding',
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

export type ResourceType = 'pdf' | 'video' | 'image' | 'attachment';

export type UploadOptions = {
  bucket: BucketName;
  customerId?: string;
  userId?: string;
  resourceType?: ResourceType;
  resourceId?: string;
  folder?: string;
  onProgress?: (progress: number) => void;
};

export type UploadResult = {
  success: boolean;
  path?: string;
  publicUrl?: string;
  signedUrl?: string;
  error?: string;
  metadata?: FileMetadata;
};

export type FileMetadata = {
  id: string;
  bucket: string;
  path: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  resourceType?: ResourceType;
  resourceId?: string;
};

/**
 * Generate a safe filename
 */
const sanitizeFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const name = filename
    .replace(/\.[^/.]+$/, '') // Remove extension
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric
    .replace(/_+/g, '_') // Collapse multiple underscores
    .slice(0, 50); // Limit length

  const uniqueId = Date.now().toString(36);
  return `${name}_${uniqueId}.${ext}`;
};

/**
 * Get MIME type from filename
 */
const getMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
};

/**
 * Build storage path with customer isolation
 */
const buildPath = (
  filename: string,
  customerId: string,
  folder?: string,
  userId?: string
): string => {
  const parts = [customerId];
  if (userId) parts.push(userId);
  if (folder) parts.push(folder);
  parts.push(sanitizeFilename(filename));
  return parts.join('/');
};


/**
 * Upload a file to Supabase Storage
 */
export const uploadFile = async (
  file: { uri: string; name: string; type?: string },
  options: UploadOptions
): Promise<UploadResult> => {
  const supabase = getSupabaseClient();
  const customerId = options.customerId || DEMO_CUSTOMER_ID;

  try {
    // Build path
    const path = buildPath(file.name, customerId, options.folder, options.userId);
    const mimeType = file.type || getMimeType(file.name);

    // Read file as blob (React Native)
    const response = await fetch(file.uri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(path, blob, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error('[MediaService] Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL (for public buckets)
    const { data: urlData } = supabase.storage.from(options.bucket).getPublicUrl(path);

    // Save metadata to database
    const metadata = await saveFileMetadata({
      customerId,
      userId: options.userId,
      bucket: options.bucket,
      path,
      filename: file.name,
      mimeType,
      sizeBytes: blob.size,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
    });

    if (__DEV__) {
      console.log('[MediaService] Upload success:', path);
    }

    return {
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl,
      metadata,
    };
  } catch (err) {
    console.error('[MediaService] Upload failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
};

/**
 * Get a signed URL for private file access
 */
export const getSignedUrl = async (
  bucket: BucketName,
  path: string,
  expiresIn: number = 600 // 10 minutes default
): Promise<string | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('[MediaService] Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
};

/**
 * Get public URL for public bucket files
 */
export const getPublicUrl = (bucket: BucketName, path: string): string => {
  const supabase = getSupabaseClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (
  bucket: BucketName,
  path: string
): Promise<boolean> => {
  const supabase = getSupabaseClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error('[MediaService] Delete error:', error);
    return false;
  }

  // Also delete metadata
  await supabase.from('file_metadata').delete().match({ bucket, path });

  return true;
};

/**
 * Save file metadata to database
 */
const saveFileMetadata = async (data: {
  customerId: string;
  userId?: string;
  bucket: string;
  path: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  resourceType?: ResourceType;
  resourceId?: string;
}): Promise<FileMetadata | undefined> => {
  const supabase = getSupabaseClient();

  const { data: result, error } = await supabase
    .from('file_metadata')
    .insert({
      customer_id: data.customerId,
      user_id: data.userId,
      bucket: data.bucket,
      path: data.path,
      filename: data.filename,
      mime_type: data.mimeType,
      size_bytes: data.sizeBytes,
      resource_type: data.resourceType,
      resource_id: data.resourceId,
    })
    .select()
    .single();

  if (error) {
    console.error('[MediaService] Metadata save error:', error);
    return undefined;
  }

  return {
    id: result.id,
    bucket: result.bucket,
    path: result.path,
    filename: result.filename,
    mimeType: result.mime_type,
    sizeBytes: result.size_bytes,
    resourceType: result.resource_type,
    resourceId: result.resource_id,
  };
};

/**
 * List files for a resource
 */
export const listFilesForResource = async (
  resourceType: ResourceType,
  resourceId: string
): Promise<FileMetadata[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('file_metadata')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId);

  if (error) {
    console.error('[MediaService] List files error:', error);
    return [];
  }

  return data.map(row => ({
    id: row.id,
    bucket: row.bucket,
    path: row.path,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
  }));
};

export default {
  uploadFile,
  getSignedUrl,
  getPublicUrl,
  deleteFile,
  listFilesForResource,
  BUCKETS,
};
