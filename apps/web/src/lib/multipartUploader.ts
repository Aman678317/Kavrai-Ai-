import {
  MultipartUploadSession,
  UploadPart,
  MediaMetadata,
} from '../types/ingest';

const DEFAULT_CHUNK_SIZE_BYTES = 5 * 1024 * 1024; // 5MB standard S3 minimum

export function calculateChunkPlan(
  fileSizeBytes: number,
  chunkSize: number = DEFAULT_CHUNK_SIZE_BYTES
): UploadPart[] {
  const size = Math.max(0, fileSizeBytes);
  const partSize = Math.max(1024 * 1024, chunkSize); // Minimum 1MB for tests/simulations
  const totalParts = Math.max(1, Math.ceil(size / partSize));

  const parts: UploadPart[] = [];
  for (let i = 0; i < totalParts; i++) {
    const startByte = i * partSize;
    const endByte = Math.min(size, startByte + partSize);
    parts.push({
      partNumber: i + 1,
      startByte,
      endByte,
      sizeBytes: Math.max(0, endByte - startByte),
      status: 'PENDING',
      progressPercent: 0,
    });
  }

  return parts;
}

export function generateS3Key(projectId: string, fileName: string): { key: string; s3Uri: string } {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `org_kavrai_theatrical/proj_${projectId}/reels/${sanitizedName}`;
  const s3Uri = `s3://cinema-vault-raw/${key}`;
  return { key, s3Uri };
}

export function createMultipartSession(
  projectId: string,
  fileName: string,
  fileSizeBytes: number,
  metadata?: MediaMetadata,
  chunkSize: number = DEFAULT_CHUNK_SIZE_BYTES
): MultipartUploadSession {
  const { key, s3Uri } = generateS3Key(projectId, fileName);
  const parts = calculateChunkPlan(fileSizeBytes, chunkSize);

  return {
    uploadId: `mp_upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    projectId,
    fileName,
    fileSizeBytes,
    key,
    s3Uri,
    partSizeBytes: chunkSize,
    totalParts: parts.length,
    parts,
    status: 'READY',
    uploadedBytes: 0,
    speedBytesPerSec: 0,
    metadata,
    createdAt: Date.now(),
  };
}

/**
 * Execute upload of a specific part with progress and failure recovery simulation
 */
export async function uploadPartChunk(
  session: MultipartUploadSession,
  partNumber: number,
  options: {
    simulateFailure?: boolean;
    onProgress?: (partNumber: number, percent: number) => void;
    simulatedLatencyMs?: number;
  } = {}
): Promise<UploadPart> {
  const part = session.parts.find((p) => p.partNumber === partNumber);
  if (!part) {
    throw new Error(`Part number ${partNumber} not found in upload session.`);
  }

  part.status = 'UPLOADING';
  part.error = undefined;

  const latency = options.simulatedLatencyMs ?? 40;
  const steps = 4;

  for (let s = 1; s <= steps; s++) {
    await new Promise((r) => setTimeout(r, latency / steps));
    part.progressPercent = Math.round((s / steps) * 100);
    options.onProgress?.(partNumber, part.progressPercent);
  }

  if (options.simulateFailure) {
    part.status = 'FAILED';
    part.error = 'Network timeout: S3 connection reset by peer (ETIMEDOUT)';
    session.status = 'FAILED';
    session.error = `Chunk ${partNumber} failed to upload.`;
    return part;
  }

  part.status = 'COMPLETED';
  part.etag = `etag_${partNumber}_${Math.random().toString(36).substring(2, 10)}`;
  part.progressPercent = 100;

  // Recalculate uploaded bytes
  const completedBytes = session.parts
    .filter((p) => p.status === 'COMPLETED')
    .reduce((acc, p) => acc + p.sizeBytes, 0);

  session.uploadedBytes = completedBytes;
  session.speedBytesPerSec = 45 * 1024 * 1024; // 45 MB/s nominal

  return part;
}

/**
 * Check if all parts are completed and finalize upload session
 */
export function finalizeUploadSession(session: MultipartUploadSession): boolean {
  const allCompleted = session.parts.every((p) => p.status === 'COMPLETED');
  if (allCompleted) {
    session.status = 'COMPLETED';
    session.completedAt = Date.now();
    session.speedBytesPerSec = 0;
    session.uploadedBytes = session.fileSizeBytes;
    return true;
  }
  return false;
}
