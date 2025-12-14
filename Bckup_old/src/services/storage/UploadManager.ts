/**
 * Upload Manager Service
 * Handles file uploads with progress tracking, retry logic, and queue management
 * Phase 73: File Upload & Media Management
 */

import RNFS from 'react-native-fs';
import { SUPABASE_API } from '../../lib/supabaseRest';
import { STORAGE_BUCKETS } from './StorageService';
import { SUPABASE_ANON_KEY } from '../../config/env.config';

export interface UploadTask {
  id: string;
  file: {
    uri: string;
    name: string;
    type: string;
    size?: number;
  };
  bucket: string;
  path: string;
  status: 'queued' | 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  bytesUploaded: number;
  totalBytes: number;
  error?: string;
  retryCount: number;
  maxRetries: number;
  chunkSize: number;
  chunks: UploadChunk[];
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

export interface UploadChunk {
  index: number;
  start: number;
  end: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  etag?: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  status: UploadTask['status'];
  error?: string;
  estimatedTimeRemaining?: number;
  uploadSpeed?: number;
}

export interface UploadResult {
  success: boolean;
  fileId: string;
  path: string;
  bucket: string;
  size: number;
  etag?: string;
  error?: string;
}

export interface UploadOptions {
  chunkSize?: number;
  maxRetries?: number;
  maxConcurrentUploads?: number;
  timeout?: number;
  resumable?: boolean;
}

const DEFAULT_OPTIONS: Required<UploadOptions> = {
  chunkSize: 5 * 1024 * 1024, // 5MB chunks
  maxRetries: 3,
  maxConcurrentUploads: 3,
  timeout: 30000, // 30 seconds
  resumable: true,
};

export class UploadManager {
  private uploadQueue: UploadTask[] = [];
  private activeUploads: Map<string, UploadTask> = new Map();
  private completedUploads: Map<string, UploadResult> = new Map();
  private options: Required<UploadOptions>;
  private isProcessing = false;

  constructor(options: UploadOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Upload a file with progress tracking and resumability
   */
  async uploadFile(
    file: {
      uri: string;
      name: string;
      type: string;
      size?: number;
    },
    bucket: keyof typeof STORAGE_BUCKETS,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const taskId = this.generateTaskId();
      
      const task: UploadTask = {
        id: taskId,
        file,
        bucket,
        path,
        status: 'queued',
        progress: 0,
        bytesUploaded: 0,
        totalBytes: file.size || 0,
        retryCount: 0,
        maxRetries: this.options.maxRetries,
        chunkSize: this.options.chunkSize,
        chunks: [],
        onProgress,
        onComplete: resolve,
        onError: reject,
      };

      this.uploadQueue.push(task);
      this.processQueue();
    });
  }

  /**
   * Upload multiple files with queue management
   */
  async uploadFiles(
    files: Array<{
      uri: string;
      name: string;
      type: string;
      size?: number;
    }>,
    bucket: keyof typeof STORAGE_BUCKETS,
    basePath: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file, index) => 
      this.uploadFile(
        file,
        bucket,
        `${basePath}/${file.name}`,
        onProgress
      )
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Pause upload
   */
  pauseUpload(taskId: string): boolean {
    const task = this.activeUploads.get(taskId) || this.uploadQueue.find(t => t.id === taskId);
    if (task && (task.status === 'uploading' || task.status === 'queued')) {
      task.status = 'paused';
      return true;
    }
    return false;
  }

  /**
   * Resume upload
   */
  resumeUpload(taskId: string): boolean {
    const task = this.activeUploads.get(taskId) || this.uploadQueue.find(t => t.id === taskId);
    if (task && task.status === 'paused') {
      task.status = 'queued';
      this.processQueue();
      return true;
    }
    return false;
  }

  /**
   * Cancel upload
   */
  cancelUpload(taskId: string): boolean {
    const task = this.activeUploads.get(taskId) || this.uploadQueue.find(t => t.id === taskId);
    if (task) {
      task.status = 'cancelled';
      this.activeUploads.delete(taskId);
      this.uploadQueue = this.uploadQueue.filter(t => t.id !== taskId);
      return true;
    }
    return false;
  }

  /**
   * Get upload progress for a specific task
   */
  getUploadProgress(taskId: string): UploadProgress | null {
    const task = this.activeUploads.get(taskId) || this.uploadQueue.find(t => t.id === taskId);
    if (!task) return null;

    return {
      fileId: task.id,
      fileName: task.file.name,
      bytesUploaded: task.bytesUploaded,
      totalBytes: task.totalBytes,
      percentage: task.totalBytes > 0 ? (task.bytesUploaded / task.totalBytes) * 100 : 0,
      status: task.status,
      error: task.error,
    };
  }

  /**
   * Get all active uploads
   */
  getActiveUploads(): UploadProgress[] {
    return Array.from(this.activeUploads.values()).map(task => ({
      fileId: task.id,
      fileName: task.file.name,
      bytesUploaded: task.bytesUploaded,
      totalBytes: task.totalBytes,
      percentage: task.totalBytes > 0 ? (task.bytesUploaded / task.totalBytes) * 100 : 0,
      status: task.status,
      error: task.error,
    }));
  }

  /**
   * Clear completed uploads from history
   */
  clearCompleted(): void {
    this.completedUploads.clear();
  }

  // Private methods

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.uploadQueue.length > 0 && this.activeUploads.size < this.options.maxConcurrentUploads) {
        const task = this.uploadQueue.find(t => t.status === 'queued');
        if (!task) break;

        this.activeUploads.set(task.id, task);
        this.uploadQueue = this.uploadQueue.filter(t => t.id !== task.id);

        // Start upload in background
        this.performUpload(task).catch(error => {
          console.error(`Upload failed for task ${task.id}:`, error);
        });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async performUpload(task: UploadTask): Promise<void> {
    try {
      task.status = 'uploading';
      
      // Determine upload strategy based on file size
      if (task.totalBytes > this.options.chunkSize) {
        await this.performChunkedUpload(task);
      } else {
        await this.performDirectUpload(task);
      }

      // Mark as completed
      task.status = 'completed';
      const result: UploadResult = {
        success: true,
        fileId: task.id,
        path: task.path,
        bucket: task.bucket,
        size: task.totalBytes,
      };

      this.completedUploads.set(task.id, result);
      task.onComplete?.(result);

    } catch (error) {
      await this.handleUploadError(task, error as Error);
    } finally {
      this.activeUploads.delete(task.id);
      this.processQueue(); // Process next item in queue
    }
  }

  private async performDirectUpload(task: UploadTask): Promise<void> {
    const formData = new FormData();
    formData.append('file', {
      uri: task.file.uri,
      type: task.file.type,
      name: task.file.name,
    } as any);

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          task.bytesUploaded = event.loaded;
          task.progress = (event.loaded / event.total) * 100;
          
          const progress: UploadProgress = {
            fileId: task.id,
            fileName: task.file.name,
            bytesUploaded: event.loaded,
            totalBytes: event.total,
            percentage: task.progress,
            status: task.status,
          };
          
          task.onProgress?.(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.open('POST', `${SUPABASE_API.STORAGE_URL}/object/${task.bucket}/${task.path}`);
      xhr.setRequestHeader('Authorization', `Bearer ${this.getAuthToken()}`);
      xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
      xhr.timeout = this.options.timeout;
      
      xhr.send(formData);
    });
  }

  private async performChunkedUpload(task: UploadTask): Promise<void> {
    // Initialize chunks if not already done
    if (task.chunks.length === 0) {
      task.chunks = this.createChunks(task.totalBytes, task.chunkSize);
    }

    // Upload each chunk
    for (const chunk of task.chunks) {
      if (task.status === 'cancelled' || task.status === 'paused') {
        throw new Error('Upload cancelled or paused');
      }

      if (chunk.status === 'completed') {
        continue; // Skip already completed chunks (for resumability)
      }

      await this.uploadChunk(task, chunk);
      
      // Update overall progress
      const completedChunks = task.chunks.filter(c => c.status === 'completed');
      task.bytesUploaded = completedChunks.reduce((sum, c) => sum + (c.end - c.start + 1), 0);
      task.progress = (task.bytesUploaded / task.totalBytes) * 100;

      const progress: UploadProgress = {
        fileId: task.id,
        fileName: task.file.name,
        bytesUploaded: task.bytesUploaded,
        totalBytes: task.totalBytes,
        percentage: task.progress,
        status: task.status,
      };
      
      task.onProgress?.(progress);
    }
  }

  private async uploadChunk(task: UploadTask, chunk: UploadChunk): Promise<void> {
    chunk.status = 'uploading';

    try {
      // Read chunk data from file
      const chunkData = await RNFS.read(task.file.uri, chunk.end - chunk.start + 1, chunk.start, 'base64');
      
      const response = await fetch(
        `${SUPABASE_API.STORAGE_URL}/object/${task.bucket}/${task.path}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/octet-stream',
            'Content-Range': `bytes ${chunk.start}-${chunk.end}/${task.totalBytes}`,
            'x-chunk-index': chunk.index.toString(),
          },
          body: chunkData,
        }
      );

      if (!response.ok) {
        throw new Error(`Chunk upload failed: ${response.status} ${response.statusText}`);
      }

      chunk.status = 'completed';
      chunk.etag = response.headers.get('etag') || undefined;

    } catch (error) {
      chunk.status = 'failed';
      throw error;
    }
  }

  private createChunks(fileSize: number, chunkSize: number): UploadChunk[] {
    const chunks: UploadChunk[] = [];
    let start = 0;
    let index = 0;

    while (start < fileSize) {
      const end = Math.min(start + chunkSize - 1, fileSize - 1);
      
      chunks.push({
        index,
        start,
        end,
        status: 'pending',
      });

      start = end + 1;
      index++;
    }

    return chunks;
  }

  private async handleUploadError(task: UploadTask, error: Error): Promise<void> {
    task.error = error.message;
    task.retryCount++;

    if (task.retryCount < task.maxRetries) {
      // Retry after exponential backoff
      const delay = Math.min(1000 * Math.pow(2, task.retryCount), 30000);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      task.status = 'queued';
      this.uploadQueue.unshift(task); // Add to front of queue for retry
      this.processQueue();
    } else {
      task.status = 'failed';
      const result: UploadResult = {
        success: false,
        fileId: task.id,
        path: task.path,
        bucket: task.bucket,
        size: task.totalBytes,
        error: error.message,
      };

      this.completedUploads.set(task.id, result);
      task.OnError?.(error);
    }
  }

  private generateTaskId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getAuthToken(): string {
    // TODO: Get from auth context
    return 'auth_token';
  }

  /**
   * Clean up resources and cancel all uploads
   */
  cleanup(): void {
    // Cancel all active uploads
    for (const taskId of this.activeUploads.keys()) {
      this.cancelUpload(taskId);
    }

    // Clear all queues
    this.uploadQueue = [];
    this.activeUploads.clear();
    this.completedUploads.clear();
  }

  /**
   * Get upload statistics
   */
  getStats(): {
    queued: number;
    active: number;
    completed: number;
    failed: number;
    totalBytes: number;
    uploadedBytes: number;
  } {
    const completed = Array.from(this.completedUploads.values());
    const failed = completed.filter(r => !r.success).length;
    const successful = completed.filter(r => r.success).length;

    const totalBytes = [
      ...this.uploadQueue,
      ...Array.from(this.activeUploads.values())
    ].reduce((sum, task) => sum + task.totalBytes, 0);

    const uploadedBytes = Array.from(this.activeUploads.values())
      .reduce((sum, task) => sum + task.bytesUploaded, 0);

    return {
      queued: this.uploadQueue.length,
      active: this.activeUploads.size,
      completed: successful,
      failed,
      totalBytes,
      uploadedBytes,
    };
  }
}

export type { UploadTask, UploadChunk, UploadProgress, UploadResult, UploadOptions };