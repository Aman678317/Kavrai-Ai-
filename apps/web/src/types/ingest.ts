/**
 * Theatrical Media Ingestion & S3 Multipart Upload Types
 * Aligned with Netflix Delivery Specs v16 & SMPTE ST 2067-2.
 */

export interface MediaMetadata {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  durationSeconds: number;
  width: number;
  height: number;
  aspectRatio: string;
  frameRate: number;
  codec: string;
  formatName: string;
  audioChannels: number;
  sampleRateHz: number;
}

export type PartUploadStatus = 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';

export interface UploadPart {
  partNumber: number;
  startByte: number;
  endByte: number;
  sizeBytes: number;
  status: PartUploadStatus;
  etag?: string;
  progressPercent: number;
  error?: string;
}

export type UploadSessionStatus =
  | 'INITIALIZING'
  | 'READY'
  | 'UPLOADING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ABORTED';

export interface MultipartUploadSession {
  uploadId: string;
  projectId: string;
  fileName: string;
  fileSizeBytes: number;
  key: string;
  s3Uri: string;
  partSizeBytes: number;
  totalParts: number;
  parts: UploadPart[];
  status: UploadSessionStatus;
  uploadedBytes: number;
  speedBytesPerSec: number;
  metadata?: MediaMetadata;
  createdAt: number;
  completedAt?: number;
  error?: string;
}

export interface IngestReelResult {
  reelId: string;
  reelNumber: number;
  name: string;
  s3Uri: string;
  timecodeIn: string;
  timecodeOut: string;
  durationSeconds: number;
  metadata: MediaMetadata;
}
