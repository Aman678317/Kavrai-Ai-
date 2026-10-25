import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  Film,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileVideo,
} from 'lucide-react';
import { MediaMetadata, MultipartUploadSession, UploadPart } from '../../types/ingest';
import { Reel } from '../../types/project';
import { extractMediaMetadata, validateVideoFile } from '../../lib/mediaInspector';
import { mediaIngestApi, projectsApi } from '../../lib/api';
import { secondsToTimecode } from '../../lib/timecode';

interface MediaIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  onReelIngested?: (reel: Reel) => void;
}

export const MediaIngestModal: React.FC<MediaIngestModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  onReelIngested,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [session, setSession] = useState<MultipartUploadSession | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pauseRef = useRef<boolean>(false);

  useEffect(() => {
    pauseRef.current = isPaused;
  }, [isPaused]);

  if (!isOpen) return null;

  const handleFileSelection = async (selectedFile: File) => {
    setErrorMessage(null);
    const validation = validateVideoFile(selectedFile);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid video file format.');
      return;
    }

    try {
      setIsInspecting(true);
      setFile(selectedFile);
      const meta = await extractMediaMetadata(selectedFile);
      setMetadata(meta);

      // Initialize S3 multipart session with 5MB parts
      const newSession = await mediaIngestApi.initiateUpload(
        projectId,
        selectedFile.name,
        selectedFile.size,
        meta
      );
      setSession(newSession);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to inspect media file.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const startUpload = async () => {
    if (!session) return;
    setIsUploading(true);
    setIsPaused(false);
    setErrorMessage(null);

    try {
      for (const part of session.parts) {
        if (pauseRef.current) {
          session.status = 'PAUSED';
          setSession({ ...session });
          break;
        }

        if (part.status === 'COMPLETED') continue;

        // Check if we should simulate failure on chunk 3 for test verification
        const shouldFail = simulateFailure && part.partNumber === 3 && part.status !== 'FAILED';

        await mediaIngestApi.uploadPart(session, part.partNumber, {
          simulateFailure: shouldFail,
          onProgress: (_num, _pct) => {
            setSession({ ...session });
          },
        });

        setSession({ ...session });

        if (part.status === 'FAILED') {
          setIsUploading(false);
          setErrorMessage(`Upload interrupted at chunk ${part.partNumber}. Click "Retry" to resume without data loss.`);
          return;
        }
      }

      if (session.parts.every((p) => p.status === 'COMPLETED')) {
        await mediaIngestApi.completeUpload(session);
        setSession({ ...session });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Multipart upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const togglePause = () => {
    if (isUploading) {
      setIsPaused(true);
      pauseRef.current = true;
      if (session) {
        session.status = 'PAUSED';
        setSession({ ...session });
      }
    } else {
      setIsPaused(false);
      pauseRef.current = false;
      startUpload();
    }
  };

  const retryUpload = () => {
    setSimulateFailure(false);
    if (session) {
      session.parts.forEach((p) => {
        if (p.status === 'FAILED') p.status = 'PENDING';
      });
      session.status = 'READY';
      session.error = undefined;
      setSession({ ...session });
    }
    startUpload();
  };

  const handleAttachReel = async () => {
    if (!session || session.status !== 'COMPLETED' || !metadata) return;

    const newReel: Reel = {
      id: `reel-${Date.now()}`,
      reelNumber: 3,
      name: `Reel 03 - Master Ingest (${file?.name})`,
      timecodeIn: '02:00:00:00',
      timecodeOut: secondsToTimecode(metadata.durationSeconds + 7200, 24),
      durationSeconds: metadata.durationSeconds,
      shotCount: 16,
      status: 'QUEUED',
      progressPercentage: 0,
      s3MasterUri: session.s3Uri,
    };

    try {
      await projectsApi.attachReel(projectId, newReel);
      onReelIngested?.(newReel);
      onClose();
    } catch (e) {
      console.error('Failed to attach reel to project:', e);
    }
  };

  const completedParts = session?.parts.filter((p) => p.status === 'COMPLETED').length || 0;
  const totalParts = session?.totalParts || 0;
  const progressPercent = totalParts > 0 ? Math.round((completedParts / totalParts) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-apple-gray-200/80 bg-apple-surface/95 p-6 sm:p-8 shadow-apple-modal backdrop-blur-2xl dark:border-darkroom-border dark:bg-darkroom-surface/95 transition-all text-apple-gray-900 dark:text-white max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-apple-gray-200/80 dark:border-darkroom-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20 dark:text-blue-400">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Theatrical Master Ingestion</h2>
              <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
                S3 Direct Multipart Chunked Upload · {projectTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-apple-gray-400 hover:bg-apple-gray-100 hover:text-apple-gray-700 dark:hover:bg-darkroom-elevated dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Ingestion Warning</span>
              <p className="text-[11px] mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* File Dropzone */}
        {!file && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-apple-blue bg-apple-blue/5 dark:border-blue-500 dark:bg-blue-500/10'
                : 'border-apple-gray-300 hover:border-apple-gray-400 dark:border-darkroom-border dark:hover:border-darkroom-border/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mov,.mp4,.mkv,.mxf,.webm"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelection(e.target.files[0]);
                }
              }}
            />
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20 dark:text-blue-400 mb-3">
              <FileVideo className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-apple-gray-900 dark:text-white">
              Drop Cinema Video Master Here
            </h3>
            <p className="mt-1 text-xs text-apple-gray-500 dark:text-apple-gray-400 max-w-sm">
              Supports ProRes 422 HQ, DNxHR, H.264/HEVC, and uncompressed DPX wraps (.mov, .mp4, .mxf, .mkv)
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-apple-gray-100 px-3 py-1.5 text-xs font-semibold text-apple-gray-700 dark:bg-darkroom-elevated dark:text-apple-gray-200">
              Browse Local Drives
            </span>
          </div>
        )}

        {/* Selected File Inspection & Technical Card */}
        {file && metadata && (
          <div className="mt-6 space-y-5">
            {/* Metadata Summary Pill */}
            <div className="rounded-2xl border border-apple-gray-200/80 bg-apple-gray-50/70 p-4 dark:border-darkroom-border dark:bg-darkroom-elevated/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-apple-blue text-white shrink-0">
                    <Film className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-apple-gray-900 dark:text-white truncate max-w-md">
                      {file.name}
                    </h4>
                    <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 mt-0.5">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB · {metadata.formatName}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  Validated
                </span>
              </div>

              {/* Technical Grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                <div className="rounded-lg bg-apple-surface dark:bg-darkroom-surface p-2 border border-apple-gray-200/60 dark:border-darkroom-border/60">
                  <span className="text-apple-gray-400 block text-[10px]">Resolution</span>
                  <span className="font-mono font-bold">{metadata.width} × {metadata.height}</span>
                </div>
                <div className="rounded-lg bg-apple-surface dark:bg-darkroom-surface p-2 border border-apple-gray-200/60 dark:border-darkroom-border/60">
                  <span className="text-apple-gray-400 block text-[10px]">Aspect Ratio</span>
                  <span className="font-semibold truncate block">{metadata.aspectRatio.split(' ')[0]}</span>
                </div>
                <div className="rounded-lg bg-apple-surface dark:bg-darkroom-surface p-2 border border-apple-gray-200/60 dark:border-darkroom-border/60">
                  <span className="text-apple-gray-400 block text-[10px]">Frame Rate</span>
                  <span className="font-mono font-bold">{metadata.frameRate} fps</span>
                </div>
                <div className="rounded-lg bg-apple-surface dark:bg-darkroom-surface p-2 border border-apple-gray-200/60 dark:border-darkroom-border/60">
                  <span className="text-apple-gray-400 block text-[10px]">Audio Bed</span>
                  <span className="font-semibold">{metadata.audioChannels}.0 (48 kHz)</span>
                </div>
              </div>
            </div>

            {/* S3 Destination Key Preview */}
            {session && (
              <div className="rounded-xl border border-apple-gray-200/60 bg-apple-surface/40 p-3 text-[11px] dark:border-darkroom-border/60 dark:bg-darkroom-surface/40">
                <div className="flex items-center justify-between text-apple-gray-500 mb-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <HardDrive className="h-3.5 w-3.5 text-apple-blue" />
                    <span>Target Object Key (MinIO / S3 NVMe Vault):</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 font-mono">SSE-S3 AES-256</span>
                </div>
                <div className="font-mono text-apple-gray-700 dark:text-apple-gray-300 break-all select-all">
                  {session.s3Uri}
                </div>
              </div>
            )}

            {/* Upload Progress & Chunk Visualizer */}
            {session && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>
                    Upload Progress: {completedParts}/{totalParts} Chunks ({progressPercent}%)
                  </span>
                  <span className="font-mono text-[11px] text-apple-gray-500">
                    {session.status === 'COMPLETED'
                      ? 'Upload Sealed'
                      : session.status === 'PAUSED'
                      ? 'Paused'
                      : isUploading
                      ? '45.0 MB/s'
                      : 'Ready'}
                  </span>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-apple-gray-200 dark:bg-darkroom-elevated">
                  <div
                    className="h-full bg-gradient-to-r from-apple-blue to-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Granular Chunk Grid */}
                <div>
                  <div className="flex justify-between text-[10px] text-apple-gray-400 mb-1.5">
                    <span>Granular 5MB S3 Part Slices:</span>
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-xs bg-emerald-500 inline-block" /> Completed
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-xs bg-apple-blue inline-block animate-pulse" /> Uploading
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-xs bg-rose-500 inline-block" /> Failed
                      </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-10 gap-1 p-2 rounded-xl bg-apple-gray-100 dark:bg-darkroom-elevated border border-apple-gray-200/60 dark:border-darkroom-border/60">
                    {session.parts.map((part) => (
                      <div
                        key={part.partNumber}
                        title={`Part #${part.partNumber} (${(part.sizeBytes / (1024 * 1024)).toFixed(1)} MB): ${part.status}`}
                        className={`h-4 rounded-xs text-[8px] font-mono flex items-center justify-center transition-colors ${
                          part.status === 'COMPLETED'
                            ? 'bg-emerald-500 text-white'
                            : part.status === 'UPLOADING'
                            ? 'bg-apple-blue text-white animate-pulse'
                            : part.status === 'FAILED'
                            ? 'bg-rose-500 text-white'
                            : 'bg-apple-gray-200 dark:bg-darkroom-border text-apple-gray-400'
                        }`}
                      >
                        {part.partNumber}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Test Simulation Controls */}
            {session && session.status !== 'COMPLETED' && (
              <div className="flex items-center justify-between p-3 rounded-xl border border-apple-gray-200 bg-apple-gray-50/50 dark:border-darkroom-border dark:bg-darkroom-elevated/30 text-xs">
                <span className="text-[11px] text-apple-gray-500">Test Failure Recovery:</span>
                <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="rounded border-apple-gray-300 text-apple-blue focus:ring-0"
                  />
                  <span>Simulate Network Dropout on Chunk #3</span>
                </label>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-apple-gray-200/80 dark:border-darkroom-border">
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setMetadata(null);
                  setSession(null);
                }}
                disabled={isUploading}
                className="text-xs font-semibold text-apple-gray-500 hover:text-apple-gray-900 dark:hover:text-white transition-colors disabled:opacity-40"
              >
                Choose Different File
              </button>

              <div className="flex items-center gap-2.5">
                {session?.status === 'FAILED' ? (
                  <button
                    onClick={retryUpload}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-amber-600 transition-all shadow-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Resume & Retry Failed Chunks</span>
                  </button>
                ) : session?.status === 'COMPLETED' ? (
                  <button
                    onClick={handleAttachReel}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-glow-green hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Attach Reel to Project</span>
                  </button>
                ) : (
                  <>
                    {session?.status === 'UPLOADING' && (
                      <button
                        onClick={togglePause}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-apple-gray-300 px-3.5 py-2 text-xs font-semibold text-apple-gray-700 hover:bg-apple-gray-100 dark:border-darkroom-border dark:text-apple-gray-300 dark:hover:bg-darkroom-elevated transition-colors"
                      >
                        <Pause className="h-3.5 w-3.5" />
                        <span>Pause</span>
                      </button>
                    )}

                    {session?.status === 'PAUSED' && (
                      <button
                        onClick={togglePause}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-apple-gray-300 px-3.5 py-2 text-xs font-semibold text-apple-gray-700 hover:bg-apple-gray-100 dark:border-darkroom-border dark:text-apple-gray-300 dark:hover:bg-darkroom-elevated transition-colors"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Resume</span>
                      </button>
                    )}

                    {session?.status === 'READY' && (
                      <button
                        onClick={startUpload}
                        className="inline-flex items-center gap-2 rounded-xl bg-apple-blue px-5 py-2.5 text-xs font-semibold text-white shadow-glow-blue hover:bg-apple-blue-hover active:scale-95 transition-all"
                      >
                        <UploadCloud className="h-4 w-4" />
                        <span>Start S3 Multipart Ingest</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
