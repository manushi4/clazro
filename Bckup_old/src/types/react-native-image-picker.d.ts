/**
 * Type declarations for react-native-image-picker
 * Extends the existing types to include missing properties
 */

declare module 'react-native-image-picker' {
  // Extend Asset interface to include exif and other missing properties
  export interface Asset {
    uri?: string;
    fileName?: string;
    fileSize?: number;
    type?: string;
    width?: number;
    height?: number;
    timestamp?: string;
    id?: string;
    duration?: number;
    bitrate?: number;
    // Add missing exif property
    exif?: Record<string, any>;
    // Add other potentially missing properties
    originalPath?: string;
    latitude?: number;
    longitude?: number;
  }

  // Extend CameraOptions to accept number for quality
  export interface CameraOptions {
    mediaType?: 'photo' | 'video' | 'mixed';
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // Allow number instead of just PhotoQuality enum
    videoQuality?: 'low' | 'medium' | 'high';
    durationLimit?: number;
    saveToPhotos?: boolean;
    cameraType?: 'back' | 'front';
    includeBase64?: boolean;
    includeExtra?: boolean;
    presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
    // Allow any other properties
    [key: string]: any;
  }

  // Extend ImageLibraryOptions
  export interface ImageLibraryOptions {
    mediaType?: 'photo' | 'video' | 'mixed';
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // Allow number
    videoQuality?: 'low' | 'medium' | 'high';
    selectionLimit?: number;
    includeBase64?: boolean;
    includeExtra?: boolean;
    presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
    // Allow any other properties
    [key: string]: any;
  }

  // Extend ImagePickerResponse
  export interface ImagePickerResponse {
    didCancel?: boolean;
    errorCode?: string;
    errorMessage?: string;
    assets?: Asset[];
    // Allow any other properties
    [key: string]: any;
  }

  // Keep existing exports
  export type MediaType = 'photo' | 'video' | 'mixed';
  export type PhotoQuality = 0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1;
  export type CameraType = 'back' | 'front';

  // Callback type
  export type Callback = (response: ImagePickerResponse) => void;

  // Main functions
  export function launchCamera(options: CameraOptions, callback: Callback): void;
  export function launchImageLibrary(options: ImageLibraryOptions, callback: Callback): void;
}
