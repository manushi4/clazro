/**
 * Media Processing Service
 * File compression, thumbnail generation, and optimization
 * Phase 73: File Upload & Media Management
 */

import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';
import { FILE_TYPES } from './FileValidator';
import { FileMetadata } from './StorageService';

// Processing configuration
const PROCESSING_CONFIG = {
  IMAGE_COMPRESSION: {
    quality: 80,
    maxWidth: 1920,
    maxHeight: 1080,
    format: 'JPEG' as const,
  },
  THUMBNAIL: {
    width: 300,
    height: 300,
    quality: 70,
    format: 'JPEG' as const,
  },
  VIDEO_THUMBNAIL: {
    quality: 80,
    format: 'JPEG' as const,
  },
  AUDIO_COMPRESSION: {
    bitRate: 128, // kbps
    sampleRate: 44100,
  },
} as const;

export interface ProcessingOptions {
  compress?: boolean;
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
  quality?: number;
  maxDimensions?: { width: number; height: number };
}

export interface ProcessingResult {
  processedUri: string;
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
  thumbnailUri?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
  };
}

export class MediaProcessor {
  /**
   * Process file based on its type and options
   */
  async processFile(
    file: {
      uri: string;
      name: string;
      type: string;
      size?: number;
    },
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    try {
      const category = this.getFileCategory(file.type);
      
      switch (category) {
        case 'image':
          return await this.processImage(file, options);
        case 'video':
          return await this.processVideo(file, options);
        case 'audio':
          return await this.processAudio(file, options);
        default:
          return {
            processedUri: file.uri,
            originalSize: file.size || 0,
            processedSize: file.size || 0,
            compressionRatio: 1,
          };
      }
    } catch (error) {
      console.error('Media processing failed:', error);
      throw new Error(`Failed to process ${file.type} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Compress file for upload
   */
  async compressFile(file: {
    uri: string;
    name: string;
    type: string;
    size?: number;
  }): Promise<{ uri: string; name: string; type: string; size?: number }> {
    const result = await this.processFile(file, { compress: true });
    
    return {
      uri: result.processedUri,
      name: file.name,
      type: file.type,
      size: result.processedSize,
    };
  }

  /**
   * Generate thumbnail for file
   */
  async generateThumbnail(metadata: FileMetadata): Promise<string | null> {
    try {
      const category = this.getFileCategory(metadata.mimeType);
      
      switch (category) {
        case 'image':
          return await this.generateImageThumbnail(metadata.path);
        case 'video':
          return await this.generateVideoThumbnail(metadata.path);
        case 'document':
          return await this.generateDocumentThumbnail(metadata.path);
        default:
          return null;
      }
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return null;
    }
  }

  /**
   * Check if file type is compressible
   */
  isCompressible(mimeType: string): boolean {
    return FILE_TYPES.IMAGES.includes(mimeType as any) || 
           FILE_TYPES.VIDEOS.includes(mimeType as any) ||
           FILE_TYPES.AUDIO.includes(mimeType as any);
  }

  /**
   * Check if file type supports thumbnails
   */
  supportsThumbnails(mimeType: string): boolean {
    return FILE_TYPES.IMAGES.includes(mimeType as any) || 
           FILE_TYPES.VIDEOS.includes(mimeType as any) ||
           FILE_TYPES.DOCUMENTS.includes(mimeType as any);
  }

  /**
   * Extract metadata from file
   */
  async extractMetadata(filePath: string, mimeType: string): Promise<Record<string, any>> {
    try {
      const category = this.getFileCategory(mimeType);
      
      switch (category) {
        case 'image':
          return await this.extractImageMetadata(filePath);
        case 'video':
          return await this.extractVideoMetadata(filePath);
        case 'audio':
          return await this.extractAudioMetadata(filePath);
        default:
          return {};
      }
    } catch (error) {
      console.error('Metadata extraction failed:', error);
      return {};
    }
  }

  // Private processing methods

  private async processImage(
    file: { uri: string; name: string; type: string; size?: number },
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    const originalSize = file.size || 0;
    let processedUri = file.uri;
    let processedSize = originalSize;
    let thumbnailUri: string | undefined;

    // Compress image if requested
    if (options.compress) {
      const compressionConfig = {
        ...PROCESSING_CONFIG.IMAGE_COMPRESSION,
        quality: options.quality || PROCESSING_CONFIG.IMAGE_COMPRESSION.quality,
        maxWidth: options.maxDimensions?.width || PROCESSING_CONFIG.IMAGE_COMPRESSION.maxWidth,
        maxHeight: options.maxDimensions?.height || PROCESSING_CONFIG.IMAGE_COMPRESSION.maxHeight,
      };

      const resizedImage = await ImageResizer.createResizedImage(
        file.uri,
        compressionConfig.maxWidth,
        compressionConfig.maxHeight,
        compressionConfig.format,
        compressionConfig.quality
      );

      processedUri = resizedImage.uri;
      processedSize = resizedImage.size;
    }

    // Generate thumbnail if requested
    if (options.generateThumbnail) {
      const thumbnailConfig = {
        ...PROCESSING_CONFIG.THUMBNAIL,
        width: options.thumbnailSize?.width || PROCESSING_CONFIG.THUMBNAIL.width,
        height: options.thumbnailSize?.height || PROCESSING_CONFIG.THUMBNAIL.height,
      };

      const thumbnail = await ImageResizer.createResizedImage(
        file.uri,
        thumbnailConfig.width,
        thumbnailConfig.height,
        thumbnailConfig.format,
        thumbnailConfig.quality,
        0,
        undefined,
        false,
        {
          mode: 'cover',
        }
      );

      thumbnailUri = thumbnail.uri;
    }

    // Extract image metadata
    const metadata = await this.extractImageMetadata(file.uri);

    return {
      processedUri,
      originalSize,
      processedSize,
      compressionRatio: originalSize > 0 ? originalSize / processedSize : 1,
      thumbnailUri,
      metadata,
    };
  }

  private async processVideo(
    file: { uri: string; name: string; type: string; size?: number },
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    // For video processing, we'd typically use FFmpeg
    // For now, return original file with thumbnail generation
    const originalSize = file.size || 0;
    let thumbnailUri: string | undefined;

    if (options.generateThumbnail) {
      thumbnailUri = await this.generateVideoThumbnail(file.uri);
    }

    const metadata = await this.extractVideoMetadata(file.uri);

    return {
      processedUri: file.uri,
      originalSize,
      processedSize: originalSize,
      compressionRatio: 1,
      thumbnailUri,
      metadata,
    };
  }

  private async processAudio(
    file: { uri: string; name: string; type: string; size?: number },
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    // Audio compression would require a native library
    // For now, return original file
    const metadata = await this.extractAudioMetadata(file.uri);

    return {
      processedUri: file.uri,
      originalSize: file.size || 0,
      processedSize: file.size || 0,
      compressionRatio: 1,
      metadata,
    };
  }

  private async generateImageThumbnail(imagePath: string): Promise<string> {
    const thumbnail = await ImageResizer.createResizedImage(
      imagePath,
      PROCESSING_CONFIG.THUMBNAIL.width,
      PROCESSING_CONFIG.THUMBNAIL.height,
      PROCESSING_CONFIG.THUMBNAIL.format,
      PROCESSING_CONFIG.THUMBNAIL.quality,
      0,
      undefined,
      false,
      {
        mode: 'cover',
      }
    );

    return thumbnail.uri;
  }

  private async generateVideoThumbnail(videoPath: string): Promise<string | null> {
    try {
      // Video thumbnail generation would require react-native-video or FFmpeg
      // This is a placeholder implementation
      console.log('Video thumbnail generation not yet implemented');
      return null;
    } catch (error) {
      console.error('Video thumbnail generation failed:', error);
      return null;
    }
  }

  private async generateDocumentThumbnail(documentPath: string): Promise<string | null> {
    try {
      // Document thumbnail generation would require a PDF library
      // This is a placeholder implementation
      console.log('Document thumbnail generation not yet implemented');
      return null;
    } catch (error) {
      console.error('Document thumbnail generation failed:', error);
      return null;
    }
  }

  private async extractImageMetadata(imagePath: string): Promise<Record<string, any>> {
    try {
      // Basic file info from RNFS
      const fileInfo = await RNFS.stat(imagePath);
      
      return {
        size: fileInfo.size,
        lastModified: fileInfo.mtime,
        format: this.getImageFormat(imagePath),
      };
    } catch (error) {
      console.error('Failed to extract image metadata:', error);
      return {};
    }
  }

  private async extractVideoMetadata(videoPath: string): Promise<Record<string, any>> {
    try {
      const fileInfo = await RNFS.stat(videoPath);
      
      return {
        size: fileInfo.size,
        lastModified: fileInfo.mtime,
        format: this.getVideoFormat(videoPath),
      };
    } catch (error) {
      console.error('Failed to extract video metadata:', error);
      return {};
    }
  }

  private async extractAudioMetadata(audioPath: string): Promise<Record<string, any>> {
    try {
      const fileInfo = await RNFS.stat(audioPath);
      
      return {
        size: fileInfo.size,
        lastModified: fileInfo.mtime,
        format: this.getAudioFormat(audioPath),
      };
    } catch (error) {
      console.error('Failed to extract audio metadata:', error);
      return {};
    }
  }

  private getFileCategory(mimeType: string): string {
    if (FILE_TYPES.IMAGES.includes(mimeType as any)) return 'image';
    if (FILE_TYPES.VIDEOS.includes(mimeType as any)) return 'video';
    if (FILE_TYPES.AUDIO.includes(mimeType as any)) return 'audio';
    if (FILE_TYPES.DOCUMENTS.includes(mimeType as any)) return 'document';
    return 'other';
  }

  private getImageFormat(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    const formatMap: Record<string, string> = {
      jpg: 'JPEG',
      jpeg: 'JPEG',
      png: 'PNG',
      gif: 'GIF',
      webp: 'WebP',
      bmp: 'BMP',
    };
    return formatMap[extension] || 'Unknown';
  }

  private getVideoFormat(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    const formatMap: Record<string, string> = {
      mp4: 'MP4',
      avi: 'AVI',
      mov: 'MOV',
      wmv: 'WMV',
      flv: 'FLV',
      webm: 'WebM',
      mkv: 'MKV',
    };
    return formatMap[extension] || 'Unknown';
  }

  private getAudioFormat(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    const formatMap: Record<string, string> = {
      mp3: 'MP3',
      wav: 'WAV',
      aac: 'AAC',
      ogg: 'OGG',
      m4a: 'M4A',
      flac: 'FLAC',
    };
    return formatMap[extension] || 'Unknown';
  }

  /**
   * Calculate optimal compression settings based on file size and type
   */
  getOptimalCompressionSettings(fileSize: number, mimeType: string): ProcessingOptions {
    const category = this.getFileCategory(mimeType);
    
    if (category === 'image') {
      if (fileSize > 10 * 1024 * 1024) { // > 10MB
        return {
          compress: true,
          quality: 60,
          maxDimensions: { width: 1280, height: 720 },
          generateThumbnail: true,
        };
      } else if (fileSize > 5 * 1024 * 1024) { // > 5MB
        return {
          compress: true,
          quality: 70,
          maxDimensions: { width: 1600, height: 900 },
          generateThumbnail: true,
        };
      } else if (fileSize > 2 * 1024 * 1024) { // > 2MB
        return {
          compress: true,
          quality: 80,
          generateThumbnail: true,
        };
      }
    }

    return {
      generateThumbnail: this.supportsThumbnails(mimeType),
    };
  }

  /**
   * Estimate processing time based on file size and operations
   */
  estimateProcessingTime(fileSize: number, operations: string[]): number {
    // Base time in seconds
    let estimatedTime = 1;

    // Size factor (larger files take longer)
    const sizeFactor = Math.log10(fileSize / (1024 * 1024)) || 0; // MB scale
    estimatedTime += sizeFactor * 2;

    // Operation factors
    operations.forEach(operation => {
      switch (operation) {
        case 'compress':
          estimatedTime += sizeFactor * 3;
          break;
        case 'thumbnail':
          estimatedTime += 2;
          break;
        case 'metadata':
          estimatedTime += 1;
          break;
      }
    });

    return Math.max(1, Math.round(estimatedTime));
  }
}

export { PROCESSING_CONFIG };
export type { ProcessingOptions, ProcessingResult };