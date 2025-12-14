/**
 * Download Manager
 * Per MEDIA_FILE_HANDLING_SPEC.md
 *
 * Handles downloading files for offline access with:
 * - Progress tracking
 * - Signed URL refresh
 * - File integrity validation
 * - AsyncStorage persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { AppError } from '../../error/AppError';
import { addBreadcrumb, captureException } from '../../error/sentry';
import { DownloadRecord, DownloadStatus } from '../../types/downloads.types';
import { getNetworkStatus } from '../../offline/networkStore';

const STORAGE_KEY = 'downloads.records';
const BASE_DIR = `${RNFS.DocumentDirectoryPath}/mansuhi_downloads`;

// Progress listeners
type ProgressCallback = (progress: number, bytesWritten: number, totalBytes: number) => void;
const progressListeners: Map<string, Set<ProgressCallback>> = new Map();

/**
 * Ensure base download directory exists
 */
async function ensureBaseDir() {
  const exists = await RNFS.exists(BASE_DIR);
  if (!exists) {
    await RNFS.mkdir(BASE_DIR);
  }
}

/**
 * Read all download records from storage
 */
async function readRecords(): Promise<DownloadRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DownloadRecord[]) : [];
  } catch {
    return [];
  }
}

/**
 * Write download records to storage
 */
async function writeRecords(records: DownloadRecord[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/**
 * Find record index by ID
 */
function recordIndex(records: DownloadRecord[], id: string) {
  return records.findIndex(r => r.id === id);
}

/**
 * Persist a single record
 */
async function persistRecord(record: DownloadRecord) {
  const records = await readRecords();
  const idx = recordIndex(records, record.id);
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  await writeRecords(records);
}

/**
 * Notify progress listeners
 */
function notifyProgress(id: string, progress: number, bytesWritten: number, totalBytes: number) {
  const listeners = progressListeners.get(id);
  if (listeners) {
    listeners.forEach(cb => cb(progress, bytesWritten, totalBytes));
  }
}

/**
 * Subscribe to download progress
 */
export function subscribeToProgress(id: string, callback: ProgressCallback): () => void {
  if (!progressListeners.has(id)) {
    progressListeners.set(id, new Set());
  }
  progressListeners.get(id)!.add(callback);

  return () => {
    progressListeners.get(id)?.delete(callback);
  };
}

/**
 * List all downloads
 */
export async function listDownloads(): Promise<DownloadRecord[]> {
  return readRecords();
}

/**
 * Get a single download record
 */
export async function getDownload(id: string): Promise<DownloadRecord | null> {
  const records = await readRecords();
  return records.find(r => r.id === id) || null;
}

/**
 * Check if a file is downloaded and available
 */
export async function isDownloaded(id: string): Promise<boolean> {
  const record = await getDownload(id);
  if (!record || record.status !== 'completed') return false;

  try {
    const exists = await RNFS.exists(record.localPath);
    return exists;
  } catch {
    return false;
  }
}


/**
 * Delete a download and its local file
 */
export async function deleteDownload(id: string): Promise<void> {
  const records = await readRecords();
  const idx = recordIndex(records, id);
  if (idx >= 0) {
    const rec = records[idx];
    if (rec.localPath) {
      try {
        await RNFS.unlink(rec.localPath);
      } catch {
        // File may not exist, ignore
      }
    }
    records.splice(idx, 1);
    await writeRecords(records);
  }
  progressListeners.delete(id);
}

/**
 * Clear all completed downloads
 */
export async function clearCompletedDownloads(): Promise<number> {
  const records = await readRecords();
  const completed = records.filter(r => r.status === 'completed');

  for (const rec of completed) {
    try {
      await RNFS.unlink(rec.localPath);
    } catch {
      // Ignore
    }
  }

  const remaining = records.filter(r => r.status !== 'completed');
  await writeRecords(remaining);
  return completed.length;
}

/**
 * Refresh signed URL for a file
 */
async function refreshSignedUrl(bucket: string, path: string): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new AppError('Supabase not configured', { severity: 'error' });
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    throw new AppError('Failed to get signed URL', { cause: error, severity: 'error' });
  }

  return data.signedUrl;
}

/**
 * Download a file from Supabase Storage
 */
export async function downloadFile(params: {
  id: string;
  bucket: string;
  path: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  checksum?: string;
  onProgress?: ProgressCallback;
}): Promise<DownloadRecord> {
  // Check network status
  const { isOnline } = getNetworkStatus();
  if (!isOnline) {
    throw new AppError('Cannot download while offline', { severity: 'warn' });
  }

  await ensureBaseDir();

  // Get signed URL
  const signedUrl = await refreshSignedUrl(params.bucket, params.path);

  // Determine local file path
  const safeId = params.id.replace(/[^a-zA-Z0-9._-]/g, '_');
  const ext = params.path.split('.').pop() || '';
  const target = `${BASE_DIR}/${safeId}${ext ? '.' + ext : ''}`;

  // Create initial record
  const record: DownloadRecord = {
    id: params.id,
    bucket: params.bucket,
    path: params.path,
    signedUrl,
    localPath: target,
    mimeType: params.mimeType,
    size: params.size,
    checksum: params.checksum,
    status: 'in_progress',
    updatedAt: new Date().toISOString(),
  };
  await persistRecord(record);

  // Register progress callback
  if (params.onProgress) {
    subscribeToProgress(params.id, params.onProgress);
  }

  try {
    addBreadcrumb({
      category: 'downloads',
      message: 'download_start',
      level: 'info',
      data: { id: params.id, bucket: params.bucket },
    });

    // Start download with progress tracking
    const downloadResult = RNFS.downloadFile({
      fromUrl: signedUrl,
      toFile: target,
      progress: res => {
        const progress = res.contentLength > 0 ? (res.bytesWritten / res.contentLength) * 100 : 0;
        notifyProgress(params.id, progress, res.bytesWritten, res.contentLength);
      },
      progressInterval: 100,
    });

    const result = await downloadResult.promise;

    if (result.statusCode && result.statusCode >= 400) {
      throw new AppError(`Download failed with status ${result.statusCode}`, { severity: 'error' });
    }

    // Verify file exists
    const exists = await RNFS.exists(target);
    if (!exists) {
      throw new AppError('Downloaded file not found', { severity: 'error' });
    }

    // Get actual file size
    const stat = await RNFS.stat(target);

    // Update record as completed
    const completed: DownloadRecord = {
      ...record,
      status: 'completed',
      size: stat.size,
      updatedAt: new Date().toISOString(),
    };
    await persistRecord(completed);

    addBreadcrumb({
      category: 'downloads',
      message: 'download_complete',
      level: 'info',
      data: { id: params.id, size: stat.size },
    });

    notifyProgress(params.id, 100, stat.size, stat.size);

    return completed;
  } catch (error) {
    // Update record as failed
    const failed: DownloadRecord = {
      ...record,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Download failed',
      updatedAt: new Date().toISOString(),
    };
    await persistRecord(failed);

    captureException(error, { scope: 'download', id: params.id });
    throw error;
  }
}

/**
 * Get local file path for a downloaded file
 */
export async function getLocalFilePath(id: string): Promise<string | null> {
  const record = await getDownload(id);
  if (!record || record.status !== 'completed') return null;

  try {
    const exists = await RNFS.exists(record.localPath);
    return exists ? record.localPath : null;
  } catch {
    return null;
  }
}

/**
 * Validate downloaded file integrity
 */
export async function validateDownload(id: string): Promise<boolean> {
  const record = await getDownload(id);
  if (!record || record.status !== 'completed') return false;

  try {
    const exists = await RNFS.exists(record.localPath);
    if (!exists) {
      // Mark as failed
      await persistRecord({ ...record, status: 'failed', error: 'File missing' });
      return false;
    }

    const stat = await RNFS.stat(record.localPath);

    // Check size if known
    if (record.size && stat.size !== record.size) {
      await persistRecord({ ...record, status: 'failed', error: 'Size mismatch' });
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Get total download storage used
 */
export async function getStorageUsed(): Promise<number> {
  const records = await readRecords();
  let total = 0;

  for (const record of records) {
    if (record.status === 'completed' && record.size) {
      total += record.size;
    }
  }

  return total;
}

export default {
  listDownloads,
  getDownload,
  isDownloaded,
  deleteDownload,
  clearCompletedDownloads,
  downloadFile,
  getLocalFilePath,
  validateDownload,
  getStorageUsed,
  subscribeToProgress,
};
