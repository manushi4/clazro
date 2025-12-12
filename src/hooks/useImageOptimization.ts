/**
 * Image Optimization Hook
 * Per MEDIA_FILE_HANDLING_SPEC.md
 *
 * Provides React hooks for image optimization and transformation.
 */

import { useState, useCallback } from 'react';
import {
  resizeImage,
  optimizeImage,
  createImageVariants,
  compressToSize,
  validateImage,
  IMAGE_PRESETS,
  OptimizedImage,
  ResizeOptions,
} from '../services/media/imageService';

type OptimizationState = {
  isOptimizing: boolean;
  progress: number;
  error: string | null;
  result: OptimizedImage | null;
};

/**
 * Hook for optimizing a single image
 *
 * @example
 * ```tsx
 * const { optimize, isOptimizing, result } = useImageOptimization();
 *
 * const handleImage = async (uri: string) => {
 *   const optimized = await optimize(uri, 'medium');
 *   if (optimized) {
 *     // Use optimized.uri for upload
 *   }
 * };
 * ```
 */
export const useImageOptimization = () => {
  const [state, setState] = useState<OptimizationState>({
    isOptimizing: false,
    progress: 0,
    error: null,
    result: null,
  });

  const optimize = useCallback(
    async (
      uri: string,
      preset: keyof typeof IMAGE_PRESETS = 'medium'
    ): Promise<OptimizedImage | null> => {
      setState({
        isOptimizing: true,
        progress: 0,
        error: null,
        result: null,
      });

      try {
        setState(prev => ({ ...prev, progress: 50 }));
        const result = await optimizeImage(uri, preset);

        setState({
          isOptimizing: false,
          progress: 100,
          error: null,
          result,
        });

        return result;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Optimization failed';
        setState({
          isOptimizing: false,
          progress: 0,
          error,
          result: null,
        });
        return null;
      }
    },
    []
  );

  const resize = useCallback(
    async (uri: string, options: ResizeOptions): Promise<OptimizedImage | null> => {
      setState({
        isOptimizing: true,
        progress: 0,
        error: null,
        result: null,
      });

      try {
        const result = await resizeImage(uri, options);

        setState({
          isOptimizing: false,
          progress: 100,
          error: null,
          result,
        });

        return result;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Resize failed';
        setState({
          isOptimizing: false,
          progress: 0,
          error,
          result: null,
        });
        return null;
      }
    },
    []
  );

  const compress = useCallback(
    async (uri: string, targetSizeKB: number): Promise<OptimizedImage | null> => {
      setState({
        isOptimizing: true,
        progress: 0,
        error: null,
        result: null,
      });

      try {
        const result = await compressToSize(uri, targetSizeKB);

        setState({
          isOptimizing: false,
          progress: 100,
          error: null,
          result,
        });

        return result;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Compression failed';
        setState({
          isOptimizing: false,
          progress: 0,
          error,
          result: null,
        });
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      isOptimizing: false,
      progress: 0,
      error: null,
      result: null,
    });
  }, []);

  return {
    optimize,
    resize,
    compress,
    reset,
    isOptimizing: state.isOptimizing,
    progress: state.progress,
    error: state.error,
    result: state.result,
  };
};

/**
 * Hook for creating multiple image variants
 */
export const useImageVariants = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [variants, setVariants] = useState<Record<string, OptimizedImage> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (
      uri: string,
      sizes: (keyof typeof IMAGE_PRESETS)[] = ['thumbnail', 'medium', 'large']
    ): Promise<Record<string, OptimizedImage> | null> => {
      setIsCreating(true);
      setError(null);
      setVariants(null);

      try {
        const result = await createImageVariants(uri, sizes);
        setVariants(result);
        setIsCreating(false);
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create variants';
        setError(errorMsg);
        setIsCreating(false);
        return null;
      }
    },
    []
  );

  return {
    create,
    isCreating,
    variants,
    error,
  };
};

/**
 * Hook for validating images before upload
 */
export const useImageValidation = (options?: { maxSizeMB?: number; allowedTypes?: string[] }) => {
  const validate = useCallback(
    (file: { type?: string; size?: number; name?: string }) => {
      return validateImage(file, options);
    },
    [options]
  );

  return { validate };
};

// Re-export presets
export { IMAGE_PRESETS };

export default useImageOptimization;
