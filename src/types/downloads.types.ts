export type DownloadStatus = "pending" | "in_progress" | "completed" | "failed";

export type DownloadRecord = {
  id: string;
  bucket: string;
  path: string;
  signedUrl: string;
  localPath: string;
  mimeType?: string;
  size?: number;
  checksum?: string;
  status: DownloadStatus;
  error?: string;
  updatedAt: string;
};
