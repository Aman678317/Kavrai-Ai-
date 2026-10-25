export type PipelineStatus =
  | 'QUEUED'
  | 'INGESTING'
  | 'TRANSCRIBING'
  | 'DUBBING'
  | 'LIP_SYNCING'
  | 'CONFORMING'
  | 'COMPLETED'
  | 'FAILED';

export type AspectRatio = '2.39:1' | '16:9' | '1.85:1' | '4:3';

export type FrameRate = 24.0 | 23.976 | 25.0 | 29.97 | 30.0;

export interface TargetLanguage {
  code: string;
  name: string;
  flag: string;
  isTranscreated?: boolean;
  isDubbed?: boolean;
  isLipSynced?: boolean;
}

export interface Reel {
  id: string;
  name: string;
  reelNumber: number;
  durationSeconds: number;
  shotCount: number;
  status: PipelineStatus;
  progressPercentage: number;
}

export interface Shot {
  id: string;
  shotNumber: number;
  timecodeIn: string;
  timecodeOut: string;
  durationFrames: number;
  activeSpeaker: string;
  syncNetConfidence: number; // Target >= 8.2
  ssimIdentity: number;      // Target >= 0.992
  status: PipelineStatus;
}

export interface FilmProject {
  id: string;
  title: string;
  director: string;
  studio: string;
  description: string;
  posterUrl: string;
  sourceLanguage: TargetLanguage;
  targetLanguages: TargetLanguage[];
  aspectRatio: AspectRatio;
  frameRate: FrameRate;
  targetLoudnessLkfs: number; // e.g. -24.0
  colorSpace: string;        // e.g. "ACEScg (SMPTE ST 2065-1)"
  status: PipelineStatus;
  overallProgress: number;   // 0 - 100
  runtimeMinutes: number;
  totalReels: number;
  totalShots: number;
  reels: Reel[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  title: string;
  director: string;
  studio: string;
  description: string;
  sourceLanguageCode: string;
  targetLanguageCodes: string[];
  aspectRatio: AspectRatio;
  frameRate: FrameRate;
  targetLoudnessLkfs?: number;
  colorSpace?: string;
  posterUrl?: string;
  useSampleReel?: boolean;
}

export interface StudioMetrics {
  totalProjects: number;
  activeProcessingReels: number;
  localizedLanguagesCount: number;
  averageSyncNetConfidence: number;
  totalProcessedRuntimeHours: number;
}
