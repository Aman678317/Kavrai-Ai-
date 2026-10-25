import { describe, it, expect } from 'vitest';
import {
  calculateAspectRatio,
  detectCodecFromExtension,
  validateVideoFile,
} from '../lib/mediaInspector';
import {
  calculateChunkPlan,
  generateS3Key,
  createMultipartSession,
  uploadPartChunk,
  finalizeUploadSession,
} from '../lib/multipartUploader';

describe('Theatrical Media Ingestion & S3 Multipart Engine', () => {
  describe('Media Inspector & Validation', () => {
    it('validates supported cinema container extensions', () => {
      expect(validateVideoFile({ name: 'reel_01.mov', size: 1048576 }).valid).toBe(true);
      expect(validateVideoFile({ name: 'feature.mxf', size: 2097152 }).valid).toBe(true);
      expect(validateVideoFile({ name: 'preview.mp4', size: 5242880 }).valid).toBe(true);
      expect(validateVideoFile({ name: 'master.mkv', size: 8388608 }).valid).toBe(true);

      // Rejects invalid formats
      expect(validateVideoFile({ name: 'script.pdf', size: 1024 }).valid).toBe(false);
      expect(validateVideoFile({ name: 'malware.exe', size: 2048 }).valid).toBe(false);
      expect(validateVideoFile({ name: 'poster.jpg', size: 4096 }).valid).toBe(false);
      expect(validateVideoFile({ name: 'empty.mov', size: 0 }).valid).toBe(false);
    });

    it('calculates standard cinema aspect ratios accurately', () => {
      expect(calculateAspectRatio(3840, 1608)).toBe('2.39:1 (Anamorphic DCI)');
      expect(calculateAspectRatio(4096, 1714)).toBe('2.39:1 (Anamorphic DCI)');
      expect(calculateAspectRatio(1920, 1038)).toBe('1.85:1 (Flat Theatrical)');
      expect(calculateAspectRatio(3840, 2160)).toBe('16:9 (Broadcast UHD)');
      expect(calculateAspectRatio(1440, 1080)).toBe('4:3 (Academy Standard)');
    });

    it('detects high-bitrate studio codecs from containers', () => {
      const movMeta = detectCodecFromExtension('dune_reel01.mov', 'video/quicktime');
      expect(movMeta.codec).toContain('ProRes 422 HQ');

      const mxfMeta = detectCodecFromExtension('oppenheimer_master.mxf', 'application/mxf');
      expect(mxfMeta.codec).toContain('DNxHR');

      const mkvMeta = detectCodecFromExtension('feature_take.mkv', 'video/x-matroska');
      expect(mkvMeta.codec).toContain('H.265');
    });
  });

  describe('S3 Multipart Chunking & State Machine', () => {
    it('slices files into deterministic chunk plans matching S3 specs', () => {
      // 12MB file with 5MB parts -> 3 parts (5MB, 5MB, 2MB)
      const partSize = 5 * 1024 * 1024;
      const fileSize = 12 * 1024 * 1024;
      const parts = calculateChunkPlan(fileSize, partSize);

      expect(parts).toHaveLength(3);
      expect(parts[0].partNumber).toBe(1);
      expect(parts[0].startByte).toBe(0);
      expect(parts[0].endByte).toBe(partSize);
      expect(parts[0].sizeBytes).toBe(partSize);

      expect(parts[1].partNumber).toBe(2);
      expect(parts[1].startByte).toBe(partSize);
      expect(parts[1].endByte).toBe(partSize * 2);

      expect(parts[2].partNumber).toBe(3);
      expect(parts[2].sizeBytes).toBe(2 * 1024 * 1024);
      expect(parts[2].endByte).toBe(fileSize);
    });

    it('generates secure deterministic S3 object keys per architecture specs', () => {
      const { key, s3Uri } = generateS3Key('proj_101', 'Reel 01 Master Pro-Res.mov');
      expect(key).toBe('org_kavrai_theatrical/proj_proj_101/reels/Reel_01_Master_Pro-Res.mov');
      expect(s3Uri).toBe('s3://cinema-vault-raw/org_kavrai_theatrical/proj_proj_101/reels/Reel_01_Master_Pro-Res.mov');
    });

    it('manages multipart session lifecycle, failure recovery and completion', async () => {
      const session = createMultipartSession('proj_test', 'test_reel.mov', 15 * 1024 * 1024, undefined, 5 * 1024 * 1024);
      expect(session.totalParts).toBe(3);
      expect(session.status).toBe('READY');

      // Upload chunk 1 successfully
      const p1 = await uploadPartChunk(session, 1, { simulatedLatencyMs: 10 });
      expect(p1.status).toBe('COMPLETED');
      expect(p1.etag).toBeDefined();

      // Chunk 2 simulates network dropout / failure
      const p2 = await uploadPartChunk(session, 2, { simulateFailure: true, simulatedLatencyMs: 10 });
      expect(p2.status).toBe('FAILED');
      expect(session.status).toBe('FAILED');

      // Finalize should fail because not all parts are finished
      expect(finalizeUploadSession(session)).toBe(false);

      // Retry Chunk 2 successfully
      const p2Retry = await uploadPartChunk(session, 2, { simulateFailure: false, simulatedLatencyMs: 10 });
      expect(p2Retry.status).toBe('COMPLETED');

      // Upload Chunk 3
      const p3 = await uploadPartChunk(session, 3, { simulatedLatencyMs: 10 });
      expect(p3.status).toBe('COMPLETED');

      // Finalize session successfully
      const isSealed = finalizeUploadSession(session);
      expect(isSealed).toBe(true);
      expect(session.status).toBe('COMPLETED');
      expect(session.completedAt).toBeDefined();
    });
  });
});
