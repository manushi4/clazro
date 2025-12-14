/**
 * File Validation Service
 * Security and validation for file uploads
 * Phase 73: File Upload & Media Management
 */

import { STORAGE_BUCKETS } from './StorageService';

// File type categories
export const FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'],
  VIDEOS: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'],
  AUDIO: ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/m4a', 'audio/flac'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SPREADSHEETS: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  PRESENTATIONS: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  TEXT: ['text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript'],
  ARCHIVES: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
} as const;

// Security settings per bucket
const BUCKET_CONFIGS = {
  [STORAGE_BUCKETS.AVATARS]: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: FILE_TYPES.IMAGES,
    requiresAuth: true,
    scanForViruses: false,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },
  [STORAGE_BUCKETS.ASSIGNMENTS]: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: [
      ...FILE_TYPES.DOCUMENTS,
      ...FILE_TYPES.IMAGES,
      ...FILE_TYPES.VIDEOS,
      ...FILE_TYPES.AUDIO,
      ...FILE_TYPES.TEXT,
      ...FILE_TYPES.ARCHIVES,
    ],
    requiresAuth: true,
    scanForViruses: true,
    allowedExtensions: [
      '.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif',
      '.mp4', '.avi', '.mov', '.mp3', '.wav', '.zip', '.rar'
    ],
  },
  [STORAGE_BUCKETS.CLASS_MATERIALS]: {
    maxSize: 500 * 1024 * 1024, // 500MB
    allowedTypes: [
      ...FILE_TYPES.DOCUMENTS,
      ...FILE_TYPES.PRESENTATIONS,
      ...FILE_TYPES.SPREADSHEETS,
      ...FILE_TYPES.IMAGES,
      ...FILE_TYPES.VIDEOS,
      ...FILE_TYPES.AUDIO,
    ],
    requiresAuth: true,
    scanForViruses: true,
    allowedExtensions: [
      '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
      '.jpg', '.jpeg', '.png', '.mp4', '.avi', '.mov', '.mp3', '.wav'
    ],
  },
  [STORAGE_BUCKETS.CHAT_MEDIA]: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      ...FILE_TYPES.IMAGES,
      ...FILE_TYPES.VIDEOS,
      ...FILE_TYPES.AUDIO,
      ...FILE_TYPES.DOCUMENTS,
    ],
    requiresAuth: true,
    scanForViruses: false,
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.webp',
      '.mp4', '.mov', '.mp3', '.wav', '.m4a',
      '.pdf', '.doc', '.docx', '.txt'
    ],
  },
  [STORAGE_BUCKETS.DOCUMENTS]: {
    maxSize: 200 * 1024 * 1024, // 200MB
    allowedTypes: [
      ...FILE_TYPES.DOCUMENTS,
      ...FILE_TYPES.SPREADSHEETS,
      ...FILE_TYPES.PRESENTATIONS,
      ...FILE_TYPES.TEXT,
      ...FILE_TYPES.IMAGES,
    ],
    requiresAuth: true,
    scanForViruses: true,
    allowedExtensions: [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.txt', '.csv', '.html', '.jpg', '.jpeg', '.png'
    ],
  },
  [STORAGE_BUCKETS.TEMP_UPLOADS]: {
    maxSize: 1024 * 1024 * 1024, // 1GB
    allowedTypes: Object.values(FILE_TYPES).flat(),
    requiresAuth: true,
    scanForViruses: true,
    allowedExtensions: [], // All extensions allowed for temp uploads
  },
} as const;

// Dangerous file patterns to block
const BLOCKED_PATTERNS = [
  /\.exe$/i,
  /\.bat$/i,
  /\.cmd$/i,
  /\.com$/i,
  /\.pif$/i,
  /\.scr$/i,
  /\.vbs$/i,
  /\.js$/i,
  /\.jar$/i,
  /\.app$/i,
  /\.deb$/i,
  /\.dmg$/i,
  /\.iso$/i,
  /\.msi$/i,
  /\.rpm$/i,
  /^\.htaccess$/i,
  /^\.htpasswd$/i,
  /\.php$/i,
  /\.asp$/i,
  /\.jsp$/i,
];

// Suspicious content patterns
const SUSPICIOUS_CONTENT_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /data:text\/html/gi,
  /eval\s*\(/gi,
  /document\.write/gi,
];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedName?: string;
}

export class FileValidator {
  /**
   * Validate file before upload
   */
  async validateFile(
    file: {
      uri: string;
      name: string;
      type: string;
      size?: number;
    },
    bucket: keyof typeof STORAGE_BUCKETS
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    const config = BUCKET_CONFIGS[bucket];
    if (!config) {
      result.isValid = false;
      result.errors.push('Invalid storage bucket');
      return result;
    }

    // Validate file name
    const nameValidation = this.validateFileName(file.name);
    if (!nameValidation.isValid) {
      result.errors.push(...nameValidation.errors);
      result.isValid = false;
    }
    result.sanitizedName = nameValidation.sanitizedName;
    result.warnings.push(...nameValidation.warnings);

    // Validate file size
    if (file.size && file.size > config.maxSize) {
      result.isValid = false;
      result.errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(config.maxSize)})`);
    }

    // Validate file type
    if (!config.allowedTypes.includes(file.type as any)) {
      result.isValid = false;
      result.errors.push(`File type '${file.type}' is not allowed in this bucket`);
    }

    // Validate file extension
    const extension = this.getFileExtension(file.name);
    if (config.allowedExtensions.length > 0 && !config.allowedExtensions.includes(extension)) {
      result.isValid = false;
      result.errors.push(`File extension '${extension}' is not allowed in this bucket`);
    }

    // Check for blocked patterns
    const patternValidation = this.validateFilePatterns(file.name);
    if (!patternValidation.isValid) {
      result.errors.push(...patternValidation.errors);
      result.isValid = false;
    }

    // Additional security checks based on file type
    if (this.isExecutableType(file.type)) {
      result.isValid = false;
      result.errors.push('Executable files are not allowed');
    }

    // Validate MIME type consistency
    const expectedMimeType = this.getExpectedMimeType(file.name);
    if (expectedMimeType && expectedMimeType !== file.type) {
      result.warnings.push(`File extension suggests MIME type '${expectedMimeType}' but received '${file.type}'`);
    }

    return result;
  }

  /**
   * Validate multiple files
   */
  async validateFiles(
    files: Array<{
      uri: string;
      name: string;
      type: string;
      size?: number;
    }>,
    bucket: keyof typeof STORAGE_BUCKETS
  ): Promise<ValidationResult[]> {
    return Promise.all(files.map(file => this.validateFile(file, bucket)));
  }

  /**
   * Check if file type is supported for compression
   */
  isCompressible(mimeType: string): boolean {
    return FILE_TYPES.IMAGES.includes(mimeType as any) || 
           FILE_TYPES.VIDEOS.includes(mimeType as any);
  }

  /**
   * Check if file type supports thumbnail generation
   */
  supportsThumbnails(mimeType: string): boolean {
    return FILE_TYPES.IMAGES.includes(mimeType as any) || 
           FILE_TYPES.VIDEOS.includes(mimeType as any) ||
           FILE_TYPES.DOCUMENTS.includes(mimeType as any);
  }

  /**
   * Get file category
   */
  getFileCategory(mimeType: string): string {
    for (const [category, types] of Object.entries(FILE_TYPES)) {
      if (types.includes(mimeType as any)) {
        return category.toLowerCase();
      }
    }
    return 'other';
  }

  /**
   * Sanitize file name
   */
  sanitizeFileName(fileName: string): string {
    // Remove or replace dangerous characters
    let sanitized = fileName
      .replace(/[^\w\s.-]/gi, '_') // Replace special chars with underscore
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

    // Ensure file has an extension
    if (!sanitized.includes('.')) {
      sanitized += '.txt';
    }

    // Limit length
    if (sanitized.length > 255) {
      const ext = this.getFileExtension(sanitized);
      const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
      sanitized = nameWithoutExt.substring(0, 255 - ext.length) + ext;
    }

    return sanitized;
  }

  /**
   * Scan file content for suspicious patterns
   */
  async scanFileContent(fileContent: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    for (const pattern of SUSPICIOUS_CONTENT_PATTERNS) {
      if (pattern.test(fileContent)) {
        result.isValid = false;
        result.errors.push(`Suspicious content detected: ${pattern.source}`);
      }
    }

    return result;
  }

  // Private methods

  private validateFileName(fileName: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      sanitizedName: fileName,
    };

    // Check for empty or invalid file names
    if (!fileName || fileName.trim().length === 0) {
      result.isValid = false;
      result.errors.push('File name cannot be empty');
      return result;
    }

    // Check for dangerous patterns
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(fileName)) {
        result.isValid = false;
        result.errors.push(`File name contains blocked pattern: ${pattern.source}`);
      }
    }

    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    if (reservedNames.includes(nameWithoutExt.toUpperCase())) {
      result.isValid = false;
      result.errors.push(`File name '${nameWithoutExt}' is reserved and cannot be used`);
    }

    // Sanitize file name
    result.sanitizedName = this.sanitizeFileName(fileName);
    if (result.sanitizedName !== fileName) {
      result.warnings.push('File name has been sanitized to remove special characters');
    }

    return result;
  }

  private validateFilePatterns(fileName: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check for double extensions (potential security risk)
    const doubleExtensionPattern = /\.(exe|bat|cmd|com|pif|scr|vbs|js)\.(txt|doc|pdf|jpg|png)$/i;
    if (doubleExtensionPattern.test(fileName)) {
      result.isValid = false;
      result.errors.push('Files with double extensions that could hide executable content are not allowed');
    }

    // Check for path traversal attempts
    if (fileName.includes('../') || fileName.includes('..\\')) {
      result.isValid = false;
      result.errors.push('Path traversal attempts are not allowed');
    }

    // Check for null bytes
    if (fileName.includes('\0')) {
      result.isValid = false;
      result.errors.push('File names containing null bytes are not allowed');
    }

    return result;
  }

  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) return '';
    return fileName.substring(lastDotIndex).toLowerCase();
  }

  private getExpectedMimeType(fileName: string): string | null {
    const extension = this.getFileExtension(fileName);
    
    const extensionToMimeType: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mp3',
      '.wav': 'audio/wav',
      '.zip': 'application/zip',
    };

    return extensionToMimeType[extension] || null;
  }

  private isExecutableType(mimeType: string): boolean {
    const executableTypes = [
      'application/x-executable',
      'application/x-msdownload',
      'application/x-msdos-program',
      'application/x-sh',
      'application/x-bat',
      'text/x-shellscript',
    ];
    
    return executableTypes.includes(mimeType);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export { FILE_TYPES, BUCKET_CONFIGS };