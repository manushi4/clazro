/**
 * Supabase Storage Service
 * Comprehensive file upload and management for Manushi Coaching Platform
 * Phase 73: File Upload & Media Management with CDN integration
 */

import { supabase } from '../../lib/supabase';
import { FileValidator } from './FileValidator';
import { MediaProcessor } from './MediaProcessor';
import { UploadManager } from './UploadManager';

// Storage bucket configuration
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  ASSIGNMENTS: 'assignments', 
  CLASS_MATERIALS: 'class-materials',
  CHAT_MEDIA: 'chat-media',
  DOCUMENTS: 'documents',
  TEMP_UPLOADS: 'temp-uploads',
} as const;

// File organization paths
export const FILE_PATHS = {
  USERS: (userId: string) => `users/${userId}`,
  CLASSES: (classId: string) => `classes/${classId}`,
  ASSIGNMENTS: (assignmentId: string) => `assignments/${assignmentId}`,
  CHAT: (chatId: string) => `chat/${chatId}`,
  TEMP: (sessionId: string) => `temp/${sessionId}`,
} as const;

// File metadata interface
export interface FileMetadata {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  bucket: string;
  userId: string;
  uploadedAt: Date;
  lastModified?: Date;
  version: number;
  thumbnailPath?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  metadata?: Record<string, any>;
  tags?: string[];
  accessLevel: 'private' | 'public' | 'shared';
  expiresAt?: Date;
}

// Upload progress callback
export interface UploadProgress {
  fileId: string;
  fileName: string;
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  estimatedTimeRemaining?: number;
  uploadSpeed?: number;
}

// Upload options
export interface UploadOptions {
  bucket: keyof typeof STORAGE_BUCKETS;
  path: string;
  compress?: boolean;
  generateThumbnail?: boolean;
  accessLevel?: 'private' | 'public' | 'shared';
  expiresIn?: number; // seconds
  metadata?: Record<string, any>;
  tags?: string[];
  onProgress?: (progress: UploadProgress) => void;
}

// File search filters
export interface FileSearchFilters {
  bucket?: string;
  path?: string;
  mimeType?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  sizeMin?: number;
  sizeMax?: number;
  userId?: string;
  accessLevel?: string;
}

class StorageService {
  private fileValidator = new FileValidator();
  private mediaProcessor = new MediaProcessor();
  private uploadManager = new UploadManager();

  /**
   * Upload a single file to Supabase Storage
   */
  async uploadFile(
    file: {
      uri: string;
      name: string;
      type: string;
      size?: number;
    },
    options: UploadOptions
  ): Promise<FileMetadata> {
    try {
      // Validate file
      await this.fileValidator.validateFile(file, options.bucket);

      // Generate unique file ID and path
      const fileId = this.generateFileId();
      const fileName = `${fileId}-${file.name}`;
      const fullPath = `${options.path}/${fileName}`;

      // Process file if needed (compression, thumbnail generation)
      let processedFile = file;
      if (options.compress && this.mediaProcessor.isCompressible(file.type)) {
        processedFile = await this.mediaProcessor.compressFile(file);
      }

      // Upload file using upload manager
      const uploadResult = await this.uploadManager.uploadFile(
        processedFile,
        options.bucket,
        fullPath,
        options.onProgress ? (progress) => options.onProgress!(progress) : undefined
      );

      // Create file metadata
      const metadata: FileMetadata = {
        id: fileId,
        name: fileName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size || 0,
        path: fullPath,
        bucket: options.bucket,
        userId: await this.getCurrentUserId(),
        uploadedAt: new Date(),
        version: 1,
        processingStatus: 'pending',
        metadata: options.metadata,
        tags: options.tags,
        accessLevel: options.accessLevel || 'private',
        expiresAt: options.expiresIn ? new Date(Date.now() + options.expiresIn * 1000) : undefined,
      };

      // Store metadata in database
      await this.storeFileMetadata(metadata);

      // Generate thumbnail if requested
      if (options.generateThumbnail && this.mediaProcessor.supportsThumbnails(file.type)) {
        this.generateThumbnailAsync(metadata);
      }

      return metadata;
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple files with batch processing
   */
  async uploadFiles(
    files: Array<{
      uri: string;
      name: string;
      type: string;
      size?: number;
    }>,
    options: UploadOptions
  ): Promise<FileMetadata[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, {
      ...options,
      onProgress: options.onProgress ? (progress) => {
        options.onProgress!({
          ...progress,
          fileName: `${file.name} (${progress.fileName})`,
        });
      } : undefined,
    }));

    return Promise.all(uploadPromises);
  }

  /**
   * Get file download URL
   */
  async getFileUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Failed to get file URL:', error);
      throw error;
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw error;
      }

      // Remove from metadata database
      await this.deleteFileMetadata(bucket, path);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * Search files with filters
   */
  async searchFiles(filters: FileSearchFilters): Promise<FileMetadata[]> {
    try {
      let query = supabase.from('file_uploads').select('*');

      if (filters.bucket) {
        query = query.eq('bucket', filters.bucket);
      }
      if (filters.path) {
        query = query.like('path', `%${filters.path}%`);
      }
      if (filters.mimeType) {
        query = query.like('mime_type', `${filters.mimeType}%`);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.accessLevel) {
        query = query.eq('access_level', filters.accessLevel);
      }
      if (filters.dateFrom) {
        query = query.gte('uploaded_at', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        query = query.lte('uploaded_at', filters.dateTo.toISOString());
      }
      if (filters.sizeMin) {
        query = query.gte('size', filters.sizeMin);
      }
      if (filters.sizeMax) {
        query = query.lte('size', filters.sizeMax);
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapDbToMetadata);
    } catch (error) {
      console.error('File search failed:', error);
      throw error;
    }
  }

  /**
   * Get file metadata by ID
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const { data, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }

      return this.mapDbToMetadata(data);
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      throw error;
    }
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(fileId: string, updates: Partial<FileMetadata>): Promise<FileMetadata> {
    try {
      const updateData = this.mapMetadataToDb({ ...updates, id: fileId });
      
      const { data, error } = await supabase
        .from('file_uploads')
        .update(updateData)
        .eq('id', fileId)
        .select()
        .single();
      
      if (error) throw error;
      
      return this.mapDbToMetadata(data);
    } catch (error) {
      console.error('Failed to update file metadata:', error);
      throw error;
    }
  }

  /**
   * Share file with expiration
   */
  async shareFile(
    fileId: string, 
    expiresIn: number = 86400, // 24 hours default
    accessLevel: 'public' | 'shared' = 'shared'
  ): Promise<{ shareUrl: string; expiresAt: Date }> {
    try {
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        throw new Error('File not found');
      }

      const shareUrl = await this.getFileUrl(metadata.bucket, metadata.path, expiresIn);
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Update file access level and expiration
      await this.updateFileMetadata(fileId, {
        accessLevel,
        expiresAt,
      });

      // Log file share event
      await this.logFileAccess(fileId, 'shared');

      return { shareUrl, expiresAt };
    } catch (error) {
      console.error('Failed to share file:', error);
      throw error;
    }
  }

  /**
   * Get file usage statistics
   */
  async getStorageStats(userId?: string): Promise<{
    totalFiles: number;
    totalSize: number;
    usedByBucket: Record<string, { count: number; size: number }>;
    recentFiles: FileMetadata[];
  }> {
    try {
      let query = supabase.from('file_uploads').select('bucket,size,uploaded_at,id,name,mime_type');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: files, error } = await query;
      if (error) throw error;
      
      const totalFiles = files.length;
      const totalSize = files.reduce((sum: number, file: any) => sum + (file.size || 0), 0);
      
      const usedByBucket: Record<string, { count: number; size: number }> = {};
      files.forEach((file: any) => {
        if (!usedByBucket[file.bucket]) {
          usedByBucket[file.bucket] = { count: 0, size: 0 };
        }
        usedByBucket[file.bucket].count++;
        usedByBucket[file.bucket].size += file.size || 0;
      });

      const recentFiles = files
        .sort((a: any, b: any) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
        .slice(0, 10)
        .map(this.mapDbToMetadata);

      return {
        totalFiles,
        totalSize,
        usedByBucket,
        recentFiles,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      throw error;
    }
  }

  /**
   * Clean up expired files
   */
  async cleanupExpiredFiles(): Promise<number> {
    try {
      const { data: expiredFiles, error } = await supabase
        .from('file_uploads')
        .select('id,bucket,path')
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;

      let deletedCount = 0;
      for (const file of expiredFiles) {
        try {
          await this.deleteFile(file.bucket, file.path);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete expired file ${file.id}:`, error);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup expired files:', error);
      return 0;
    }
  }

  // Private helper methods

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return user.id;
  }

  private async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');
    return session.access_token;
  }

  private async storeFileMetadata(metadata: FileMetadata): Promise<void> {
    const dbData = this.mapMetadataToDb(metadata);
    const { error } = await supabase.from('file_uploads').insert(dbData);
    if (error) throw error;
  }

  private async deleteFileMetadata(bucket: string, path: string): Promise<void> {
    const { error } = await supabase
      .from('file_uploads')
      .delete()
      .eq('bucket', bucket)
      .eq('path', path);
    if (error) throw error;
  }

  private async generateThumbnailAsync(metadata: FileMetadata): Promise<void> {
    // Background thumbnail generation
    try {
      const thumbnailPath = await this.mediaProcessor.generateThumbnail(metadata);
      if (thumbnailPath) {
        await this.updateFileMetadata(metadata.id, {
          thumbnailPath,
          processingStatus: 'completed',
        });
      }
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      await this.updateFileMetadata(metadata.id, {
        processingStatus: 'failed',
      });
    }
  }

  private async logFileAccess(fileId: string, action: string): Promise<void> {
    try {
      const { error } = await supabase.from('file_access_logs').insert({
        file_id: fileId,
        action,
        accessed_at: new Date().toISOString(),
        user_id: await this.getCurrentUserId(),
      });
      if (error) throw error;
    } catch (error) {
      console.error('Failed to log file access:', error);
    }
  }

  private mapDbToMetadata(dbRecord: any): FileMetadata {
    return {
      id: dbRecord.id,
      name: dbRecord.name,
      originalName: dbRecord.original_name,
      mimeType: dbRecord.mime_type,
      size: dbRecord.size,
      path: dbRecord.path,
      bucket: dbRecord.bucket,
      userId: dbRecord.user_id,
      uploadedAt: new Date(dbRecord.uploaded_at),
      lastModified: dbRecord.last_modified ? new Date(dbRecord.last_modified) : undefined,
      version: dbRecord.version,
      thumbnailPath: dbRecord.thumbnail_path,
      processingStatus: dbRecord.processing_status,
      metadata: dbRecord.metadata,
      tags: dbRecord.tags,
      accessLevel: dbRecord.access_level,
      expiresAt: dbRecord.expires_at ? new Date(dbRecord.expires_at) : undefined,
    };
  }

  private mapMetadataToDb(metadata: Partial<FileMetadata>): any {
    return {
      id: metadata.id,
      name: metadata.name,
      original_name: metadata.originalName,
      mime_type: metadata.mimeType,
      size: metadata.size,
      path: metadata.path,
      bucket: metadata.bucket,
      user_id: metadata.userId,
      uploaded_at: metadata.uploadedAt?.toISOString(),
      last_modified: metadata.lastModified?.toISOString(),
      version: metadata.version,
      thumbnail_path: metadata.thumbnailPath,
      processing_status: metadata.processingStatus,
      metadata: metadata.metadata,
      tags: metadata.tags,
      access_level: metadata.accessLevel,
      expires_at: metadata.expiresAt?.toISOString(),
    };
  }
}

export const storageService = new StorageService();
export { StorageService };
export type { FileMetadata, UploadProgress, UploadOptions, FileSearchFilters };