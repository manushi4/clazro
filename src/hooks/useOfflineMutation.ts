/**
 * Offline Mutation Hook
 * Per OFFLINE_SUPPORT_SPEC.md
 *
 * Provides offline-aware mutation capabilities.
 * Queues mutations when offline, executes immediately when online.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from '../offline/networkStore';
import {
  queueMutation,
  getQueue,
  getPendingCount,
  subscribeToQueue,
  processQueue,
  clearCompletedMutations,
  QueuedMutation,
} from '../offline/mutationQueue';

type MutationOptions = {
  /** If true, always queue even when online (for batch processing) */
  alwaysQueue?: boolean;
  /** Callback when mutation completes successfully */
  onSuccess?: (result: unknown) => void;
  /** Callback when mutation fails */
  onError?: (error: Error) => void;
  /** Callback when mutation is queued (offline) */
  onQueued?: (mutation: QueuedMutation) => void;
};

type MutationResult = {
  /** Whether the mutation is currently executing */
  isLoading: boolean;
  /** Whether the mutation was queued for later */
  isQueued: boolean;
  /** Error if mutation failed immediately */
  error: Error | null;
  /** The queued mutation object if queued */
  queuedMutation: QueuedMutation | null;
};

/**
 * Hook for performing offline-aware mutations
 *
 * @example
 * ```tsx
 * const { mutate, isLoading, isQueued } = useOfflineMutation('submit_assignment');
 *
 * const handleSubmit = async () => {
 *   await mutate({ assignmentId: '123', answers: [...] });
 * };
 * ```
 */
export const useOfflineMutation = <TPayload extends Record<string, unknown>>(
  mutationType: string,
  options: MutationOptions = {}
) => {
  const { isOnline } = useNetworkStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [isQueued, setIsQueued] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [queuedMutation, setQueuedMutation] = useState<QueuedMutation | null>(null);

  const mutate = useCallback(
    async (payload: TPayload): Promise<MutationResult> => {
      setError(null);
      setIsQueued(false);
      setQueuedMutation(null);

      // If offline or alwaysQueue, add to queue
      if (!isOnline || options.alwaysQueue) {
        try {
          const mutation = await queueMutation(mutationType, payload);
          setIsQueued(true);
          setQueuedMutation(mutation);
          options.onQueued?.(mutation);

          if (__DEV__) {
            console.log(`[useOfflineMutation] Queued ${mutationType} (offline)`);
          }

          return {
            isLoading: false,
            isQueued: true,
            error: null,
            queuedMutation: mutation,
          };
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          options.onError?.(error);
          return {
            isLoading: false,
            isQueued: false,
            error,
            queuedMutation: null,
          };
        }
      }

      // Online - execute immediately via queue (for consistency)
      setIsLoading(true);
      try {
        const mutation = await queueMutation(mutationType, payload);
        setQueuedMutation(mutation);

        // Wait for processing
        await processQueue();

        // Check result
        const queue = getQueue();
        const processed = queue.find(m => m.id === mutation.id);

        if (processed?.status === 'completed') {
          options.onSuccess?.(processed);
          setIsLoading(false);
          return {
            isLoading: false,
            isQueued: false,
            error: null,
            queuedMutation: processed,
          };
        } else if (processed?.status === 'failed') {
          const err = new Error(processed.lastError || 'Mutation failed');
          setError(err);
          options.onError?.(err);
          setIsLoading(false);
          return {
            isLoading: false,
            isQueued: false,
            error: err,
            queuedMutation: processed,
          };
        }

        // Still pending (shouldn't happen if online)
        setIsLoading(false);
        return {
          isLoading: false,
          isQueued: true,
          error: null,
          queuedMutation: processed || mutation,
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
        setIsLoading(false);
        return {
          isLoading: false,
          isQueued: false,
          error,
          queuedMutation: null,
        };
      }
    },
    [isOnline, mutationType, options]
  );

  return {
    mutate,
    isLoading,
    isQueued,
    error,
    queuedMutation,
    isOnline,
  };
};

/**
 * Hook to monitor the mutation queue
 */
export const useMutationQueue = () => {
  const { isOnline } = useNetworkStatus();
  const [queue, setQueue] = useState<QueuedMutation[]>(getQueue());
  const [pendingCount, setPendingCount] = useState(getPendingCount());

  useEffect(() => {
    const unsubscribe = subscribeToQueue(newQueue => {
      setQueue(newQueue);
      setPendingCount(newQueue.filter(m => m.status === 'pending').length);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      processQueue();
    }
  }, [isOnline, pendingCount]);

  const clearCompleted = useCallback(() => {
    clearCompletedMutations();
  }, []);

  const retry = useCallback(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline]);

  return {
    queue,
    pendingCount,
    failedCount: queue.filter(m => m.status === 'failed').length,
    completedCount: queue.filter(m => m.status === 'completed').length,
    isOnline,
    clearCompleted,
    retry,
  };
};

export default useOfflineMutation;
