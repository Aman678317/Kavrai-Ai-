import { FilmProject, CreateProjectInput, StudioMetrics, Reel, Shot } from '../types/project';
import { DEMO_PROJECTS, SUPPORTED_LANGUAGES } from './demoData';
import { MediaMetadata, MultipartUploadSession, UploadPart } from '../types/ingest';
import {
  createMultipartSession,
  uploadPartChunk,
  finalizeUploadSession,
} from './multipartUploader';

const STORAGE_KEY = 'kavrai_cinema_projects';
let inMemoryProjects: FilmProject[] | null = null;

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

// Helper to retrieve projects from localStorage or seed
function getStoredProjects(): FilmProject[] {
  if (hasLocalStorage()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored projects, falling back to seed:', e);
    }
  }

  if (inMemoryProjects && inMemoryProjects.length > 0) {
    return inMemoryProjects;
  }

  // Initialize with clone of demo projects
  const initial = JSON.parse(JSON.stringify(DEMO_PROJECTS));
  inMemoryProjects = initial;
  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch {}
  }
  return initial;
}

function saveProjects(projects: FilmProject[]): void {
  inMemoryProjects = projects;
  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage:', e);
    }
  }
}

export const projectsApi = {
  /**
   * Fetch all active film localization projects
   */
  async getProjects(): Promise<FilmProject[]> {
    // Artificial slight delay to allow smooth Apple-style skeleton animation
    await new Promise((r) => setTimeout(r, 150));
    return getStoredProjects();
  },

  /**
   * Fetch a single project by ID
   */
  async getProjectById(id: string): Promise<FilmProject | null> {
    await new Promise((r) => setTimeout(r, 120));
    const projects = getStoredProjects();
    const found = projects.find((p) => p.id === id);
    return found || null;
  },

  /**
   * Create a new film localization project
   */
  async createProject(input: CreateProjectInput): Promise<FilmProject> {
    await new Promise((r) => setTimeout(r, 200));
    const projects = getStoredProjects();

    const sourceLang =
      SUPPORTED_LANGUAGES.find((l) => l.code === input.sourceLanguageCode) ||
      SUPPORTED_LANGUAGES[0];

    const targetLangs = input.targetLanguageCodes
      .map((code) => SUPPORTED_LANGUAGES.find((l) => l.code === code))
      .filter((l): l is NonNullable<typeof l> => Boolean(l))
      .map((l) => ({
        ...l,
        isTranscreated: false,
        isDubbed: false,
        isLipSynced: false,
      }));

    const newProject: FilmProject = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: input.title.trim() || 'Untitled Cinema Reel',
      director: input.director.trim() || 'Studio Director',
      studio: input.studio.trim() || 'Independent Studio',
      description: input.description.trim() || 'Theatrical feature film localization package.',
      posterUrl:
        input.posterUrl?.trim() ||
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop',
      sourceLanguage: sourceLang,
      targetLanguages: targetLangs,
      aspectRatio: input.aspectRatio || '2.39:1',
      frameRate: input.frameRate || 24.0,
      targetLoudnessLkfs: input.targetLoudnessLkfs || -24.0,
      colorSpace: input.colorSpace || 'ACEScg (SMPTE ST 2065-1)',
      status: 'INGESTING',
      overallProgress: 12,
      runtimeMinutes: 105,
      totalReels: 4,
      totalShots: 920,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reels: [
        {
          id: `reel-${Date.now()}-1`,
          name: 'Reel 01 - Principal Ingestion',
          reelNumber: 1,
          durationSeconds: 1500,
          shotCount: 230,
          status: 'INGESTING',
          progressPercentage: 45,
        },
        {
          id: `reel-${Date.now()}-2`,
          name: 'Reel 02 - Dialogue Separation',
          reelNumber: 2,
          durationSeconds: 1400,
          shotCount: 210,
          status: 'QUEUED',
          progressPercentage: 0,
        },
        {
          id: `reel-${Date.now()}-3`,
          name: 'Reel 03 - Speech Transcreation',
          reelNumber: 3,
          durationSeconds: 1650,
          shotCount: 250,
          status: 'QUEUED',
          progressPercentage: 0,
        },
        {
          id: `reel-${Date.now()}-4`,
          name: 'Reel 04 - Neural Lip-Sync Conform',
          reelNumber: 4,
          durationSeconds: 1580,
          shotCount: 230,
          status: 'QUEUED',
          progressPercentage: 0,
        },
      ],
    };

    projects.unshift(newProject);
    saveProjects(projects);
    return newProject;
  },

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 100));
    const projects = getStoredProjects();
    const filtered = projects.filter((p) => p.id !== id);
    saveProjects(filtered);
    return true;
  },

  /**
   * Reset / Load reference demo reel
   */
  async resetDemoData(): Promise<FilmProject[]> {
    await new Promise((r) => setTimeout(r, 150));
    const initial = JSON.parse(JSON.stringify(DEMO_PROJECTS));
    saveProjects(initial);
    return initial;
  },

  /**
   * Calculate aggregated studio metrics
   */
  async getMetrics(): Promise<StudioMetrics> {
    const projects = getStoredProjects();
    const uniqueLangs = new Set<string>();
    let activeReels = 0;
    let totalMinutes = 0;

    projects.forEach((p) => {
      totalMinutes += p.runtimeMinutes || 0;
      p.targetLanguages.forEach((tl) => uniqueLangs.add(tl.code));
      p.reels.forEach((r) => {
        if (r.status !== 'COMPLETED') activeReels++;
      });
    });

    return {
      totalProjects: projects.length,
      activeProcessingReels: activeReels,
      localizedLanguagesCount: uniqueLangs.size,
      averageSyncNetConfidence: 8.7, // Studio target benchmark
      totalProcessedRuntimeHours: Math.round((totalMinutes / 60) * 10) / 10,
    };
  },

  /**
   * Attach an ingested master reel to an existing project
   */
  async attachReel(projectId: string, reel: Reel): Promise<FilmProject | null> {
    await new Promise((r) => setTimeout(r, 100));
    const projects = getStoredProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return null;

    project.reels.push(reel);
    saveProjects(projects);
    return project;
  },
};

/**
 * Theatrical Media Ingestion & S3 Multipart API Client
 */
export const mediaIngestApi = {
  /**
   * Initiate multipart upload session with key derivation
   */
  async initiateUpload(
    projectId: string,
    fileName: string,
    fileSizeBytes: number,
    metadata?: MediaMetadata
  ): Promise<MultipartUploadSession> {
    await new Promise((r) => setTimeout(r, 100));
    return createMultipartSession(projectId, fileName, fileSizeBytes, metadata);
  },

  /**
   * Upload a specific chunk part
   */
  async uploadPart(
    session: MultipartUploadSession,
    partNumber: number,
    options?: { simulateFailure?: boolean; onProgress?: (p: number, pct: number) => void }
  ): Promise<UploadPart> {
    return uploadPartChunk(session, partNumber, options);
  },

  /**
   * Finalize and seal the S3 multipart upload
   */
  async completeUpload(session: MultipartUploadSession): Promise<{ s3Uri: string; status: string }> {
    await new Promise((r) => setTimeout(r, 100));
    const ok = finalizeUploadSession(session);
    if (!ok) {
      throw new Error('Cannot complete upload: not all parts are finished.');
    }
    return {
      s3Uri: session.s3Uri,
      status: 'UPLOAD_COMPLETE',
    };
  },
};

/**
 * AI Video Analysis & Character Recognition API Client
 */
export const videoAnalysisApi = {
  async triggerAnalysis(
    _projectId: string,
    reelId: string,
    _s3Uri: string,
    onProgress?: (stage: string, percent: number) => void
  ): Promise<Shot[]> {
    onProgress?.('Detecting scene & shot cuts (Content-Aware)...', 30);
    await new Promise((r) => setTimeout(r, 350));

    onProgress?.('Clustering visible characters & ArcFace embeddings...', 65);
    await new Promise((r) => setTimeout(r, 400));

    onProgress?.('Indexing frame-accurate SMPTE timecodes...', 90);
    await new Promise((r) => setTimeout(r, 300));

    const generatedShots: Shot[] = [
      {
        id: `shot-${reelId}-101`,
        shotNumber: 1,
        timecodeIn: '01:00:00:00',
        timecodeOut: '01:00:04:12',
        durationFrames: 108,
        activeSpeaker: 'Commander Elena Vance',
        syncNetConfidence: 8.9,
        ssimIdentity: 0.996,
        status: 'COMPLETED',
      },
      {
        id: `shot-${reelId}-102`,
        shotNumber: 2,
        timecodeIn: '01:00:04:12',
        timecodeOut: '01:00:09:04',
        durationFrames: 112,
        activeSpeaker: 'Chief Engineer Kaelen',
        syncNetConfidence: 8.7,
        ssimIdentity: 0.994,
        status: 'COMPLETED',
      },
      {
        id: `shot-${reelId}-103`,
        shotNumber: 3,
        timecodeIn: '01:00:09:04',
        timecodeOut: '01:00:16:18',
        durationFrames: 182,
        activeSpeaker: 'Commander Elena Vance',
        syncNetConfidence: 9.1,
        ssimIdentity: 0.997,
        status: 'LIP_SYNCING',
      },
      {
        id: `shot-${reelId}-104`,
        shotNumber: 4,
        timecodeIn: '01:00:16:18',
        timecodeOut: '01:00:19:22',
        durationFrames: 76,
        activeSpeaker: 'AI Interface "Aura"',
        syncNetConfidence: 9.2,
        ssimIdentity: 0.998,
        status: 'DUBBING',
      },
      {
        id: `shot-${reelId}-105`,
        shotNumber: 5,
        timecodeIn: '01:00:19:22',
        timecodeOut: '01:00:25:10',
        durationFrames: 132,
        activeSpeaker: 'Dr. Aris Thorne',
        syncNetConfidence: 8.8,
        ssimIdentity: 0.995,
        status: 'CONFORMING',
      },
      {
        id: `shot-${reelId}-106`,
        shotNumber: 6,
        timecodeIn: '01:00:25:10',
        timecodeOut: '01:00:30:00',
        durationFrames: 110,
        activeSpeaker: 'Chief Engineer Kaelen',
        syncNetConfidence: 8.6,
        ssimIdentity: 0.993,
        status: 'QUEUED',
      },
    ];

    onProgress?.('AI Shot Analysis complete.', 100);
    return generatedShots;
  },
};


