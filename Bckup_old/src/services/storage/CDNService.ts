/**
 * CDN Service for Supabase Storage
 * Image transformations, caching, and performance optimization
 * Phase 73: File Upload & Media Management
 */

import { FileMetadata } from './StorageService';
import { SUPABASE_API } from '../../lib/supabaseRest';

// CDN transformation options
export interface ImageTransformOptions {
  width?: number;
  height?: number;
  resize?: 'fit' | 'fill' | 'crop' | 'scale';
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'auto';
  gravity?: 'auto' | 'center' | 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  rotation?: number;
  flip?: 'horizontal' | 'vertical' | 'both';
  background?: string;
  border?: {
    width: number;
    color: string;
  };
}

// Responsive image breakpoints
export const RESPONSIVE_BREAKPOINTS = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 },
  xlarge: { width: 1920, height: 1920 },
} as const;

// Cache control settings
export interface CacheOptions {
  maxAge?: number; // seconds
  staleWhileRevalidate?: number; // seconds
  mustRevalidate?: boolean;
  noCache?: boolean;
  noStore?: boolean;
}

// Video streaming options
export interface VideoStreamingOptions {
  quality?: 'auto' | '240p' | '360p' | '480p' | '720p' | '1080p';
  format?: 'mp4' | 'webm' | 'hls';
  startTime?: number; // seconds
  duration?: number; // seconds
  thumbnail?: {
    time?: number; // seconds from start
    format?: 'jpeg' | 'png';
    width?: number;
    height?: number;
  };
}

export class CDNService {
  private baseUrl: string;
  private defaultCacheOptions: CacheOptions;

  constructor() {
    this.baseUrl = SUPABASE_API.STORAGE_URL;
    this.defaultCacheOptions = {
      maxAge: 86400, // 24 hours
      staleWhileRevalidate: 3600, // 1 hour
    };
  }

  /**
   * Get optimized image URL with transformations
   */
  getImageUrl(
    bucket: string,
    path: string,
    transforms: ImageTransformOptions = {},
    cacheOptions: CacheOptions = {}
  ): string {
    const url = new URL(`${this.baseUrl}/object/public/${bucket}/${path}`);
    
    // Apply transformations as query parameters
    this.applyImageTransforms(url, transforms);
    
    // Apply cache headers
    this.applyCacheOptions(url, { ...this.defaultCacheOptions, ...cacheOptions });
    
    return url.toString();
  }

  /**
   * Get responsive image URLs for different breakpoints
   */
  getResponsiveImageUrls(
    bucket: string,
    path: string,
    options: {
      formats?: Array<'jpeg' | 'png' | 'webp'>;
      quality?: number;
      cacheOptions?: CacheOptions;
    } = {}
  ): Record<string, Record<string, string>> {
    const { formats = ['webp', 'jpeg'], quality = 80, cacheOptions = {} } = options;
    const responsiveUrls: Record<string, Record<string, string>> = {};

    Object.entries(RESPONSIVE_BREAKPOINTS).forEach(([breakpoint, dimensions]) => {
      responsiveUrls[breakpoint] = {};
      
      formats.forEach(format => {
        responsiveUrls[breakpoint][format] = this.getImageUrl(
          bucket,
          path,
          {
            ...dimensions,
            format,
            quality,
            resize: 'fit',
          },
          cacheOptions
        );
      });
    });

    return responsiveUrls;
  }

  /**
   * Generate image srcSet for responsive images
   */
  generateImageSrcSet(
    bucket: string,
    path: string,
    options: {
      format?: 'jpeg' | 'png' | 'webp';
      quality?: number;
      densities?: number[];
    } = {}
  ): string {
    const { format = 'webp', quality = 80, densities = [1, 2, 3] } = options;
    
    const srcSetEntries = densities.map(density => {
      const width = Math.round(RESPONSIVE_BREAKPOINTS.large.width * density);
      const height = Math.round(RESPONSIVE_BREAKPOINTS.large.height * density);
      
      const url = this.getImageUrl(bucket, path, {
        width,
        height,
        format,
        quality,
        resize: 'fit',
      });
      
      return `${url} ${density}x`;
    });

    return srcSetEntries.join(', ');
  }

  /**
   * Get video streaming URL with quality options
   */
  getVideoUrl(
    bucket: string,
    path: string,
    options: VideoStreamingOptions = {},
    cacheOptions: CacheOptions = {}
  ): string {
    const url = new URL(`${this.baseUrl}/object/public/${bucket}/${path}`);
    
    // Apply video transformations
    if (options.quality && options.quality !== 'auto') {
      url.searchParams.append('quality', options.quality);
    }
    
    if (options.format) {
      url.searchParams.append('format', options.format);
    }
    
    if (options.startTime !== undefined) {
      url.searchParams.append('t', options.startTime.toString());
    }
    
    if (options.duration !== undefined) {
      url.searchParams.append('duration', options.duration.toString());
    }
    
    // Apply cache options
    this.applyCacheOptions(url, { ...this.defaultCacheOptions, ...cacheOptions });
    
    return url.toString();
  }

  /**
   * Get video thumbnail URL
   */
  getVideoThumbnailUrl(
    bucket: string,
    path: string,
    options: VideoStreamingOptions['thumbnail'] = {},
    cacheOptions: CacheOptions = {}
  ): string {
    const url = new URL(`${this.baseUrl}/object/public/${bucket}/${path}`);
    
    // Video thumbnail specific parameters
    url.searchParams.append('thumbnail', 'true');
    
    if (options.time !== undefined) {
      url.searchParams.append('t', options.time.toString());
    }
    
    if (options.format) {
      url.searchParams.append('format', options.format);
    }
    
    if (options.width) {
      url.searchParams.append('w', options.width.toString());
    }
    
    if (options.height) {
      url.searchParams.append('h', options.height.toString());
    }
    
    // Apply cache options
    this.applyCacheOptions(url, { ...this.defaultCacheOptions, ...cacheOptions });
    
    return url.toString();
  }

  /**
   * Get PDF thumbnail URL
   */
  getPdfThumbnailUrl(
    bucket: string,
    path: string,
    options: {
      page?: number;
      width?: number;
      height?: number;
      format?: 'jpeg' | 'png';
      quality?: number;
    } = {},
    cacheOptions: CacheOptions = {}
  ): string {
    const { page = 1, width = 300, height = 400, format = 'jpeg', quality = 80 } = options;
    
    const url = new URL(`${this.baseUrl}/object/public/${bucket}/${path}`);
    
    // PDF thumbnail parameters
    url.searchParams.append('pdf_thumbnail', 'true');
    url.searchParams.append('page', page.toString());
    url.searchParams.append('w', width.toString());
    url.searchParams.append('h', height.toString());
    url.searchParams.append('format', format);
    url.searchParams.append('quality', quality.toString());
    
    // Apply cache options
    this.applyCacheOptions(url, { ...this.defaultCacheOptions, ...cacheOptions });
    
    return url.toString();
  }

  /**
   * Preload critical images
   */
  preloadImages(urls: string[]): Promise<void[]> {
    const preloadPromises = urls.map(url => this.preloadImage(url));
    return Promise.all(preloadPromises);
  }

  /**
   * Generate blur placeholder for progressive loading
   */
  getBlurPlaceholderUrl(
    bucket: string,
    path: string,
    options: {
      width?: number;
      height?: number;
      blur?: number;
      quality?: number;
    } = {}
  ): string {
    const { width = 20, height = 20, blur = 5, quality = 20 } = options;
    
    return this.getImageUrl(bucket, path, {
      width,
      height,
      blur,
      quality,
      format: 'jpeg',
      resize: 'fill',
    });
  }

  /**
   * Get file download URL with custom headers
   */
  getDownloadUrl(
    bucket: string,
    path: string,
    options: {
      fileName?: string;
      contentType?: string;
      cacheControl?: string;
      expires?: Date;
    } = {}
  ): string {
    const url = new URL(`${this.baseUrl}/object/public/${bucket}/${path}`);
    
    if (options.fileName) {
      url.searchParams.append('download', options.fileName);
    }
    
    if (options.contentType) {
      url.searchParams.append('content-type', options.contentType);
    }
    
    if (options.cacheControl) {
      url.searchParams.append('cache-control', options.cacheControl);
    }
    
    if (options.expires) {
      url.searchParams.append('expires', options.expires.toISOString());
    }
    
    return url.toString();
  }

  /**
   * Analyze image for optimal transformations
   */
  analyzeImageForOptimization(
    metadata: FileMetadata,
    targetContext: 'thumbnail' | 'gallery' | 'hero' | 'profile' | 'content'
  ): ImageTransformOptions {
    const baseTransforms: ImageTransformOptions = {
      format: 'webp',
      quality: 80,
    };

    switch (targetContext) {
      case 'thumbnail':
        return {
          ...baseTransforms,
          ...RESPONSIVE_BREAKPOINTS.thumbnail,
          resize: 'crop',
          gravity: 'auto',
          quality: 70,
        };
      
      case 'gallery':
        return {
          ...baseTransforms,
          ...RESPONSIVE_BREAKPOINTS.medium,
          resize: 'fit',
          quality: 85,
        };
      
      case 'hero':
        return {
          ...baseTransforms,
          ...RESPONSIVE_BREAKPOINTS.xlarge,
          resize: 'fill',
          gravity: 'center',
          quality: 90,
        };
      
      case 'profile':
        return {
          ...baseTransforms,
          ...RESPONSIVE_BREAKPOINTS.small,
          resize: 'crop',
          gravity: 'auto',
          quality: 80,
        };
      
      case 'content':
      default:
        return {
          ...baseTransforms,
          ...RESPONSIVE_BREAKPOINTS.large,
          resize: 'fit',
          quality: 85,
        };
    }
  }

  /**
   * Get bandwidth-optimized URL based on connection
   */
  getBandwidthOptimizedUrl(
    bucket: string,
    path: string,
    connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown' = 'unknown',
    context: 'thumbnail' | 'gallery' | 'hero' | 'profile' | 'content' = 'content'
  ): string {
    let qualityMultiplier = 1;
    let sizeMultiplier = 1;

    // Adjust quality and size based on connection
    switch (connectionType) {
      case 'slow-2g':
        qualityMultiplier = 0.4;
        sizeMultiplier = 0.5;
        break;
      case '2g':
        qualityMultiplier = 0.6;
        sizeMultiplier = 0.7;
        break;
      case '3g':
        qualityMultiplier = 0.8;
        sizeMultiplier = 0.9;
        break;
      case '4g':
      case 'wifi':
        qualityMultiplier = 1;
        sizeMultiplier = 1;
        break;
      default:
        qualityMultiplier = 0.8;
        sizeMultiplier = 0.9;
    }

    const baseTransforms = this.analyzeImageForOptimization(
      { mimeType: 'image/jpeg' } as FileMetadata,
      context
    );

    const optimizedTransforms: ImageTransformOptions = {
      ...baseTransforms,
      quality: Math.round((baseTransforms.quality || 80) * qualityMultiplier),
      width: baseTransforms.width ? Math.round(baseTransforms.width * sizeMultiplier) : undefined,
      height: baseTransforms.height ? Math.round(baseTransforms.height * sizeMultiplier) : undefined,
    };

    return this.getImageUrl(bucket, path, optimizedTransforms);
  }

  // Private helper methods

  private applyImageTransforms(url: URL, transforms: ImageTransformOptions): void {
    Object.entries(transforms).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        switch (key) {
          case 'width':
            url.searchParams.append('w', value.toString());
            break;
          case 'height':
            url.searchParams.append('h', value.toString());
            break;
          case 'resize':
            url.searchParams.append('resize', value);
            break;
          case 'quality':
            url.searchParams.append('quality', value.toString());
            break;
          case 'format':
            url.searchParams.append('format', value);
            break;
          case 'gravity':
            url.searchParams.append('gravity', value);
            break;
          case 'blur':
            url.searchParams.append('blur', value.toString());
            break;
          case 'brightness':
            url.searchParams.append('brightness', value.toString());
            break;
          case 'contrast':
            url.searchParams.append('contrast', value.toString());
            break;
          case 'saturation':
            url.searchParams.append('saturation', value.toString());
            break;
          case 'rotation':
            url.searchParams.append('rotate', value.toString());
            break;
          case 'flip':
            url.searchParams.append('flip', value);
            break;
          case 'background':
            url.searchParams.append('bg', value);
            break;
          case 'border':
            if (typeof value === 'object' && value.width && value.color) {
              url.searchParams.append('border', `${value.width},${value.color}`);
            }
            break;
        }
      }
    });
  }

  private applyCacheOptions(url: URL, cacheOptions: CacheOptions): void {
    if (cacheOptions.maxAge !== undefined) {
      url.searchParams.append('max-age', cacheOptions.maxAge.toString());
    }
    
    if (cacheOptions.staleWhileRevalidate !== undefined) {
      url.searchParams.append('stale-while-revalidate', cacheOptions.staleWhileRevalidate.toString());
    }
    
    if (cacheOptions.mustRevalidate) {
      url.searchParams.append('must-revalidate', '1');
    }
    
    if (cacheOptions.noCache) {
      url.searchParams.append('no-cache', '1');
    }
    
    if (cacheOptions.noStore) {
      url.searchParams.append('no-store', '1');
    }
  }

  private preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Calculate optimal image size based on device capabilities
   */
  getOptimalImageSize(
    context: 'thumbnail' | 'gallery' | 'hero' | 'profile' | 'content',
    devicePixelRatio: number = 1
  ): { width: number; height: number } {
    const baseSize = RESPONSIVE_BREAKPOINTS[
      context === 'thumbnail' ? 'thumbnail' :
      context === 'profile' ? 'small' :
      context === 'gallery' ? 'medium' :
      context === 'hero' ? 'xlarge' :
      'large'
    ];

    return {
      width: Math.round(baseSize.width * devicePixelRatio),
      height: Math.round(baseSize.height * devicePixelRatio),
    };
  }
}

export const cdnService = new CDNService();
export { CDNService };
export type { 
  ImageTransformOptions, 
  CacheOptions, 
  VideoStreamingOptions 
};