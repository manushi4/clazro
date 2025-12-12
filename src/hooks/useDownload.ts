/**
 * Download Hook
 * Per MEDIA_FILE_HANDLING_SPEC.md
 *
 * Provides React hooks for downloading and managing offline files.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from '../offline/networkStore';
import {
  downloadFile,
  getDownload,
  isDownloaded,
  deleteDownload,
  listDownloads,
  getLocalFilePath,
  subscribeToProgress,
  getStorageUsed,
} from '../services/downloads/downloadManager';
import type { DownloadRecord, DownloadStatus } from '../types/downloads.types';

type DownloadState = {
  status: DownloadStatus | 'idle';
  progress: number;
  error: string | null;
  record: DownloadRecord | null;
};

type UseDownloadOptions = {
  bucket: string;
  path: string;
  filename?: string;
  mimeType?: string;
  size?: number;
};

/**
 * Hook for downloading a single file
 *
 * @example
 * ```tsx
 * const { download, status, progress, isDownloaded, localPath } = useDownload('resource_123', {
 *   bucket: 'study-pdfs',
 *   path: 'customer_1/resource_123.pdf',
 * });
 *
 * return (
 *   <Button onPress={download} disabled={status === 'in_progress'}>
 *     {status === 'in_progress' ? `${progress}%` : isDownloaded ? 'Open' : 'Download'}
 *   </Button>
 * );
 * ```
 */
export const useDownload = (id: string, options: UseDownloadOptions) => {
  const { isOnline } = useNetworkStatus();
  const [state, setState] = useState<DownloadState>({
    status: 'idle',
    progress: 0,
    error: null,
    record: null,
  });
  const [downloaded, setDownloaded] = useState(false);
  const [localPath, setLocalPath] = useState<string | null>(null);

  // Check initial download status
  useEffect(() => {
    const checkStatus = async () => {
      const record = await getDownload(id);
      if (record) {
        setState(prev => ({ ...prev, status: record.status, record }));
        if (record.status === 'completed') {
          const path = await getLocalFilePath(id);
          setLocalPath(path);
          setDownloaded(!!path);
        }
      }
    };
    checkStatus();
  }, [id]);

  // Subscribe to progress updates
  useEffect(() => {
    const unsubscribe = subscribeToProgress(id, (progress, bytesWritten, totalBytes) => {
      setState(prev => ({ ...prev, progress: Math.round(progress) }));
    });
    return unsubscribe;
  }, [id]);

  const download = useCallback(async (): Promise<DownloadRecord | null> => {
    if (!isOnline) {
      setState(prev => ({ ...prev, error: 'Cannot download while offline' }));
      return null;
    }

    setState({
      status: 'in_progress',
      progress: 0,
      error: null,
      record: null,
    });

    try {
      const record = await downloadFile({
        id,
        bucket: options.bucket,
        path: options.path,
        filename: options.filename,
        mimeType: options.mimeType,
        size: options.size,
        onProgress: (progress) => {
          setState(prev => ({ ...prev, progress: Math.round(progress) }));
        },
      });

      const path = await getLocalFilePath(id);
      setLocalPath(path);
      setDownloaded(true);

      setState({
        status: 'completed',
        progress: 100,
        error: null,
        record,
      });

      return record;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Download failed';
      setState(prev => ({
        ...prev,
        status: 'failed',
        error,
      }));
      return null;
    }
  }, [id, options, isOnline]);

  const remove = useCallback(async () => {
    await deleteDownload(id);
    setDownloaded(false);
    setLocalPath(null);
    setState({
      status: 'idle',
      progress: 0,
      error: null,
      record: null,
    });
  }, [id]);

  return {
    download,
    remove,
    status: state.status,
    progress: state.progress,
    error: state.error,
    record: state.record,
    isDownloaded: downloaded,
    localPath,
    isOnline,
  };
};

/**
 * Hook for managing all downloads
 */
export const useDownloads = () => {
  const { isOnline } = useNetworkStatus();
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const [records, storage] = await Promise.all([
      listDownloads(),
      getStorageUsed(),
    ]);
    setDownloads(records);
    setStorageUsed(storage);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const removeDownload = useCallback(async (id: string) => {
    await deleteDownload(id);
    await refresh();
  }, [refresh]);

  const completedCount = downloads.filter(d => d.status === 'completed').length;
  const inProgressCount = downloads.filter(d => d.status === 'in_progress').length;
  const failedCount = downloads.filter(d => d.status === 'failed').length;

  return {
    downloads,
    storageUsed,
    completedCount,
    inProgressCount,
    failedCount,
    isLoading,
    isOnline,
    refresh,
    removeDownload,
  };
};

/**
 * Hook to check if a specific file is downloaded
 */
export const useIsDownloaded = (id: string) => {
  const [downloaded, setDownloaded] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      setChecking(true);
      const result = await isDownloaded(id);
      setDownloaded(result);
      setChecking(false);
    };
    check();
  }, [id]);

  return { isDownloaded: downloaded, isChecking: checking };
};

export default useDownload;
