/**
 * Offline Mutation Queue
 * Per OFFLINE_SUPPORT_SPEC.md
 *
 * Queues mutations when offline and replays them when back online.
 * Persists queue to AsyncStorage for app restart recovery.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNetworkStatus } from './networkStore';

const QUEUE_STORAGE_KEY = '@offline_mutation_queue';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export type MutationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type QueuedMutation = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
  status: MutationStatus;
  retryCount: number;
  lastError?: string;
  completedAt?: string;
};

export type MutationHandler = (payload: Record<string, unknown>) => Promise<unknown>;

// In-memory queue state
let mutationQueue: QueuedMutation[] = [];
let isProcessing = false;
let listeners: Set<(queue: QueuedMutation[]) => void> = new Set();

// Registered mutation handlers
const mutationHandlers: Map<string, MutationHandler> = new Map();

/**
 * Notify all listeners of queue changes
 */
const notifyListeners = () => {
  listeners.forEach(listener => listener([...mutationQueue]));
};

/**
 * Persist queue to AsyncStorage
 */
const persistQueue = async () => {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(mutationQueue));
  } catch (error) {
    console.error('[MutationQueue] Failed to persist queue:', error);
  }
};

/**
 * Load queue from AsyncStorage
 */
export const loadQueue = async (): Promise<QueuedMutation[]> => {
  try {
    const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      mutationQueue = JSON.parse(stored);
      // Reset any "processing" items to "pending" (app may have crashed)
      mutationQueue = mutationQueue.map(m =>
        m.status === 'processing' ? { ...m, status: 'pending' as MutationStatus } : m
      );
      await persistQueue();
      notifyListeners();
    }
  } catch (error) {
    console.error('[MutationQueue] Failed to load queue:', error);
  }
  return mutationQueue;
};

/**
 * Register a mutation handler
 */
export const registerMutationHandler = (type: string, handler: MutationHandler) => {
  mutationHandlers.set(type, handler);
};

/**
 * Unregister a mutation handler
 */
export const unregisterMutationHandler = (type: string) => {
  mutationHandlers.delete(type);
};

/**
 * Generate unique mutation ID
 */
const generateId = () => `mut_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;


/**
 * Add a mutation to the queue
 */
export const queueMutation = async (
  type: string,
  payload: Record<string, unknown>
): Promise<QueuedMutation> => {
  const mutation: QueuedMutation = {
    id: generateId(),
    type,
    payload,
    createdAt: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  };

  mutationQueue.push(mutation);
  await persistQueue();
  notifyListeners();

  if (__DEV__) {
    console.log('[MutationQueue] Queued mutation:', mutation.type, mutation.id);
  }

  // Try to process immediately if online
  if (getNetworkStatus().isOnline) {
    processQueue();
  }

  return mutation;
};

/**
 * Remove a mutation from the queue
 */
export const removeMutation = async (id: string) => {
  mutationQueue = mutationQueue.filter(m => m.id !== id);
  await persistQueue();
  notifyListeners();
};

/**
 * Clear completed/failed mutations
 */
export const clearCompletedMutations = async () => {
  mutationQueue = mutationQueue.filter(
    m => m.status !== 'completed' && m.status !== 'failed'
  );
  await persistQueue();
  notifyListeners();
};

/**
 * Clear all mutations
 */
export const clearAllMutations = async () => {
  mutationQueue = [];
  await persistQueue();
  notifyListeners();
};

/**
 * Get current queue
 */
export const getQueue = (): QueuedMutation[] => [...mutationQueue];

/**
 * Get pending mutations count
 */
export const getPendingCount = (): number =>
  mutationQueue.filter(m => m.status === 'pending').length;

/**
 * Subscribe to queue changes
 */
export const subscribeToQueue = (listener: (queue: QueuedMutation[]) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Process a single mutation
 */
const processMutation = async (mutation: QueuedMutation): Promise<boolean> => {
  const handler = mutationHandlers.get(mutation.type);

  if (!handler) {
    console.error(`[MutationQueue] No handler for mutation type: ${mutation.type}`);
    mutation.status = 'failed';
    mutation.lastError = `No handler registered for type: ${mutation.type}`;
    return false;
  }

  try {
    mutation.status = 'processing';
    notifyListeners();

    await handler(mutation.payload);

    mutation.status = 'completed';
    mutation.completedAt = new Date().toISOString();

    if (__DEV__) {
      console.log('[MutationQueue] Mutation completed:', mutation.type, mutation.id);
    }

    return true;
  } catch (error) {
    mutation.retryCount++;
    mutation.lastError = error instanceof Error ? error.message : String(error);

    if (mutation.retryCount >= MAX_RETRIES) {
      mutation.status = 'failed';
      console.error('[MutationQueue] Mutation failed after retries:', mutation.type, error);
    } else {
      mutation.status = 'pending';
      if (__DEV__) {
        console.log(
          `[MutationQueue] Mutation retry ${mutation.retryCount}/${MAX_RETRIES}:`,
          mutation.type
        );
      }
    }

    return false;
  }
};

/**
 * Process all pending mutations in queue
 */
export const processQueue = async () => {
  if (isProcessing) return;
  if (!getNetworkStatus().isOnline) return;

  isProcessing = true;

  try {
    const pendingMutations = mutationQueue.filter(m => m.status === 'pending');

    for (const mutation of pendingMutations) {
      // Check if still online before each mutation
      if (!getNetworkStatus().isOnline) {
        if (__DEV__) {
          console.log('[MutationQueue] Went offline, pausing queue processing');
        }
        break;
      }

      const success = await processMutation(mutation);

      // Small delay between mutations
      if (!success && mutation.status === 'pending') {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }

    await persistQueue();
    notifyListeners();
  } finally {
    isProcessing = false;
  }
};

/**
 * Initialize queue system - call on app start
 */
export const initMutationQueue = async () => {
  await loadQueue();

  if (__DEV__) {
    const pending = getPendingCount();
    if (pending > 0) {
      console.log(`[MutationQueue] Loaded ${pending} pending mutations`);
    }
  }

  // Process any pending mutations if online
  if (getNetworkStatus().isOnline && getPendingCount() > 0) {
    processQueue();
  }
};

export default {
  queueMutation,
  removeMutation,
  clearCompletedMutations,
  clearAllMutations,
  getQueue,
  getPendingCount,
  subscribeToQueue,
  processQueue,
  registerMutationHandler,
  unregisterMutationHandler,
  initMutationQueue,
  loadQueue,
};
