/**
 * Type declarations for react-native-image-crop-picker
 * Extends the existing types to include missing properties and methods
 */

declare module 'react-native-image-crop-picker' {
  // Extended Options interface with all possible properties
  export interface Options {
    // Core options
    width?: number;
    height?: number;
    cropping?: boolean;
    multiple?: boolean;
    maxFiles?: number;

    // Image processing
    compressImageMaxWidth?: number;
    compressImageMaxHeight?: number;
    compressImageQuality?: number;
    includeBase64?: boolean;
    includeExif?: boolean;

    // Media type
    mediaType?: 'photo' | 'video' | 'any';

    // Cropping options
    cropperCircleOverlay?: boolean;
    freeStyleCropEnabled?: boolean;
    showCropGuidelines?: boolean;
    showCropFrame?: boolean;
    enableRotationGesture?: boolean;
    avoidEmptySpaceAroundImage?: boolean;

    // Sorting and selection
    sortOrder?: 'none' | 'asc' | 'desc';

    // Color customization (Android)
    cropperActiveWidgetColor?: string;
    cropperStatusBarColor?: string;
    cropperToolbarColor?: string;
    cropperToolbarWidgetColor?: string;
    cropperToolbarTitle?: string;
    disableCropperColorSetters?: boolean;

    // Camera options
    useFrontCamera?: boolean;

    // Video options
    minFiles?: number;
    waitAnimationEnd?: boolean;
    smartAlbums?: any[];
    forceJpg?: boolean;

    // Path (for cropper)
    path?: string;

    // Allow any other properties for flexibility
    [key: string]: any;
  }

  // Image result interface
  export interface Image {
    path: string;
    width: number;
    height: number;
    mime: string;
    size?: number;
    data?: string;
    exif?: any;
    filename?: string | null;
    duration?: number;
    // CropRect can be null or undefined in some cases
    cropRect?: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
    creationDate?: string;
    modificationDate?: string;
  }

  // Video result interface (if different from Image)
  export interface Video extends Image {
    duration: number;
  }

  // Main ImagePicker object with all methods
  const ImagePicker: {
    /**
     * Opens camera to take a photo
     */
    openCamera(options?: Options): Promise<Image>;

    /**
     * Opens image picker to select one or multiple images
     */
    openPicker(options?: Options): Promise<Image | Image[]>;

    /**
     * Opens cropper for a specific image path
     */
    openCropper(options: Options & { path: string }): Promise<Image>;

    /**
     * Opens device settings (for permissions)
     */
    openSettings(): Promise<boolean>;

    /**
     * Cleans all temporary files
     */
    clean(): Promise<void>;

    /**
     * Cleans a specific file
     */
    cleanSingle(path: string): Promise<void>;
  };

  export default ImagePicker;

  // Also export as named export for compatibility
  export const openCamera: typeof ImagePicker.openCamera;
  export const openPicker: typeof ImagePicker.openPicker;
  export const openCropper: typeof ImagePicker.openCropper;
  export const openSettings: typeof ImagePicker.openSettings;
  export const clean: typeof ImagePicker.clean;
  export const cleanSingle: typeof ImagePicker.cleanSingle;
}
