/**
 * Media Upload Hook
 * Per MEDIA_FILE_HANDLING_SPEC.md
 *
 * Provides easy-to-use media upload functionality with:
 * - Progress tracking
 * - Error handling
 * - Offline awareness
 */

import { useState, useCallback } from 'react';
import { useNetworkStatus } from '../offline/networkStore';
import {
  uploadFile,
  getSignedUrl,
  deleteFile,
  BUCKETS,
  BucketName,
  ResourceType,
  UploadResult,
} from '../services/media/mediaService';
import { useDemoUser } from './useDemoUser';

type UploadState = {
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: UploadResult | null;
};

type UseMediaUploadOptions = {
  bucket: BucketName;
  resourceType?: ResourceType;
  resourceId?: string;
  folder?: string;
};

/**
 * Hook for uploading media files
 *
 * @example
 * ```tsx
 * const { upload, isUploading, progress, error } = useMediaUpload({
 *   bucket: BUCKETS.USER_UPLOADS,
 *   resourceType: 'attachment',
 *   resourceId: assignmentId,
 * });
 *
 * const handlePick = async () => {
 *   const result = await launchImageLibrary();
 *   if (result.assets?.[0]) {
 *     const uploadResult = await upload({
 *       uri: result.assets[0].uri,
 *       name: result.assets[0].fileName,
 *       type: result.assets[0].type,
 *     });
 *   }
 * };
 * ```
 */
export const useMediaUpload = (options: UseMediaUploadOptions) => {
  const { isOnline } = useNetworkStatus();
  const { userId, customerSlug } = useDemoUser();

  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    result: null,
  });

  const upload = useCallback(
    async (file: { uri: string; name: string; type?: string }): Promise<UploadResult> => {
      // Check network
      if (!isOnline) {
        const error = 'Cannot upload while offline';
        setState(prev => ({ ...prev, error }));
        return { success: false, error };
      }

      setState({
        isUploading: true,
        progress: 0,
        error: null,
        result: null,
      });

      try {
        const result = await uploadFile(file, {
          bucket: options.bucket,
          customerId: customerSlug,
          userId,
          resourceType: options.resourceType,
          resourceId: options.resourceId,
          folder: options.folder,
          onProgress: progress => {
            setState(prev => ({ ...prev, progress }));
          },
        });

        setState({
          isUploading: false,
          progress: result.success ? 100 : 0,
          error: result.error || null,
          result,
        });

        return result;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Upload failed';
        setState({
          isUploading: false,
          progress: 0,
          error,
          result: null,
        });
        return { success: false, error };
      }
    },
    [isOnline, customerSlug, userId, options]
  );

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      result: null,
    });
  }, []);

  return {
    upload,
    reset,
    isUploading: state.isUploading,
    progress: state.progress,
    error: state.error,
    result: state.result,
    isOnline,
  };
};

/**
 * Hook for getting signed URLs
 */
export const useSignedUrl = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUrl = useCallback(
    async (bucket: BucketName, path: string, expiresIn?: number): Promise<string | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const url = await getSignedUrl(bucket, path, expiresIn);
        setIsLoading(false);
        return url;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get URL';
        setError(errorMsg);
        setIsLoading(false);
        return null;
      }
    },
    []
  );

  return { getUrl, isLoading, error };
};

/**
 * Hook for deleting files
 */
export const useMediaDelete = () => {
  const { isOnline } = useNetworkStatus();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    async (bucket: BucketName, path: string): Promise<boolean> => {
      if (!isOnline) {
        setError('Cannot delete while offline');
        return false;
      }

      setIsDeleting(true);
      setError(null);

      try {
        const success = await deleteFile(bucket, path);
        setIsDeleting(false);
        if (!success) {
          setError('Delete failed');
        }
        return success;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Delete failed';
        setError(errorMsg);
        setIsDeleting(false);
        return false;
      }
    },
    [isOnline]
  );

  return { remove, isDeleting, error, isOnline };
};

// Re-export bucket names for convenience
export { BUCKETS };

export default useMediaUpload;
