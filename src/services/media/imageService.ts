/**
 * Image Service
 * Per MEDIA_FILE_HANDLING_SPEC.md
 *
 * Provides image optimization, resizing, and caching utilities.
 * Uses react-native-image-resizer for compression.
 */

import { Platform, Image } from 'react-native';
import { getSupabaseClient, DEMO_CUSTOMER_ID } from '../../lib/supabaseClient';
import { BUCKETS, BucketName } from './mediaService';

// Type declaration for react-native-image-resizer (install if needed)
type ImageResizerResponse = {
  uri: string;
  path: string;
  name: string;
  size: number;
  width: number;
  height: number;
};

// Dynamic import to handle missing package gracefully
let ImageResizer: {
  createResizedImage: (
    uri: string,
    maxWidth: number,
    maxHeight: number,
    compressFormat: string,
    quality: number,
    rotation?: number,
    outputPath?: string,
    keepMeta?: boolean
  ) => Promise<ImageResizerResponse>;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ImageResizer = require('react-native-image-resizer').default;
} catch {
  console.warn('[ImageService] react-native-image-resizer not installed. Image optimization disabled.');
}

export type ImageQuality = 'low' | 'medium' | 'high' | 'original';

export type ImageSize = {
  width: number;
  height: number;
};

export type ResizeOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-100
  format?: 'JPEG' | 'PNG' | 'WEBP';
  rotation?: number;
  keepMeta?: boolean;
};

export type OptimizedImage = {
  uri: string;
  width: number;
  height: number;
  size: number;
  name: string;
};

// Preset sizes for common use cases
export const IMAGE_PRESETS: Record<string, ResizeOptions> = {
  thumbnail: { maxWidth: 150, maxHeight: 150, quality: 70, format: 'JPEG' },
  avatar: { maxWidth: 200, maxHeight: 200, quality: 80, format: 'JPEG' },
  preview: { maxWidth: 400, maxHeight: 400, quality: 75, format: 'JPEG' },
  medium: { maxWidth: 800, maxHeight: 800, quality: 80, format: 'JPEG' },
  large: { maxWidth: 1200, maxHeight: 1200, quality: 85, format: 'JPEG' },
  full: { maxWidth: 1920, maxHeight: 1920, quality: 90, format: 'JPEG' },
};

// Quality presets
const QUALITY_MAP: Record<ImageQuality, number> = {
  low: 50,
  medium: 70,
  high: 85,
  original: 100,
};

/**
 * Resize and compress an image
 */
export const resizeImage = async (
  uri: string,
  options: ResizeOptions = {}
): Promise<OptimizedImage> => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 80,
    format = 'JPEG',
    rotation = 0,
    keepMeta = false,
  } = options;

  // If ImageResizer not available, return original
  if (!ImageResizer) {
    console.warn('[ImageService] ImageResizer not available, returning original');
    return {
      uri,
      width: maxWidth,
      height: maxHeight,
      size: 0,
      name: uri.split('/').pop() || 'image',
    };
  }

  try {
    const result = await ImageResizer.createResizedImage(
      uri,
      maxWidth,
      maxHeight,
      format,
      quality,
      rotation,
      undefined, // outputPath (undefined = temp)
      keepMeta
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      size: result.size,
      name: result.name,
    };
  } catch (error) {
    console.error('[ImageService] Resize failed:', error);
    throw error;
  }
};

/**
 * Optimize image using a preset
 */
export const optimizeImage = async (
  uri: string,
  preset: keyof typeof IMAGE_PRESETS = 'medium'
): Promise<OptimizedImage> => {
  const options = IMAGE_PRESETS[preset];
  return resizeImage(uri, options);
};

/**
 * Create multiple sizes of an image
 */
export const createImageVariants = async (
  uri: string,
  sizes: (keyof typeof IMAGE_PRESETS)[] = ['thumbnail', 'medium', 'large']
): Promise<Record<string, OptimizedImage>> => {
  const variants: Record<string, OptimizedImage> = {};

  for (const size of sizes) {
    try {
      variants[size] = await optimizeImage(uri, size);
    } catch (error) {
      console.error(`[ImageService] Failed to create ${size} variant:`, error);
    }
  }

  return variants;
};

/**
 * Compress image to target file size (approximate)
 */
export const compressToSize = async (
  uri: string,
  targetSizeKB: number,
  maxAttempts: number = 5
): Promise<OptimizedImage> => {
  let quality = 90;
  let attempt = 0;
  let result: OptimizedImage | null = null;

  while (attempt < maxAttempts) {
    result = await resizeImage(uri, { quality, maxWidth: 1920, maxHeight: 1920 });

    const sizeKB = result.size / 1024;
    if (sizeKB <= targetSizeKB) {
      return result;
    }

    // Reduce quality for next attempt
    quality = Math.max(20, quality - 15);
    attempt++;
  }

  // Return last result even if target not met
  return result!;
};


/**
 * Get Supabase Storage image URL with transformation
 * Uses Supabase's built-in image transformation
 */
export const getTransformedImageUrl = (
  bucket: BucketName,
  path: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    resize?: 'cover' | 'contain' | 'fill';
  } = {}
): string => {
  const supabase = getSupabaseClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
    transform: {
      width: options.width,
      height: options.height,
      quality: options.quality,
      resize: options.resize,
    },
  });

  return data.publicUrl;
};

/**
 * Get thumbnail URL for an image
 */
export const getThumbnailUrl = (bucket: BucketName, path: string): string => {
  return getTransformedImageUrl(bucket, path, {
    width: 150,
    height: 150,
    quality: 70,
    resize: 'cover',
  });
};

/**
 * Get preview URL for an image
 */
export const getPreviewUrl = (bucket: BucketName, path: string): string => {
  return getTransformedImageUrl(bucket, path, {
    width: 400,
    height: 400,
    quality: 75,
    resize: 'contain',
  });
};

/**
 * Calculate optimal dimensions maintaining aspect ratio
 */
export const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): ImageSize => {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
};

/**
 * Check if image needs optimization based on size
 */
export const needsOptimization = (sizeBytes: number, maxSizeKB: number = 500): boolean => {
  return sizeBytes / 1024 > maxSizeKB;
};

/**
 * Get image info from URI
 */
export const getImageInfo = async (
  uri: string
): Promise<{ width: number; height: number; size: number } | null> => {
  try {
    // For React Native, we'd use Image.getSize or a library
    // This is a placeholder that works with the resize result
    const result = await resizeImage(uri, { quality: 100, maxWidth: 10000, maxHeight: 10000 });
    return {
      width: result.width,
      height: result.height,
      size: result.size,
    };
  } catch {
    return null;
  }
};

/**
 * Validate image file
 */
export const validateImage = (
  file: { type?: string; size?: number; name?: string },
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } => {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } =
    options;

  // Check type
  if (file.type && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    };
  }

  // Check size
  if (file.size && file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
};

export default {
  resizeImage,
  optimizeImage,
  createImageVariants,
  compressToSize,
  getTransformedImageUrl,
  getThumbnailUrl,
  getPreviewUrl,
  calculateDimensions,
  needsOptimization,
  getImageInfo,
  validateImage,
  IMAGE_PRESETS,
};
