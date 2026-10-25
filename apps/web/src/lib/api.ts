import {
  FilmProject,
  CreateProjectInput,
  StudioMetrics,
  Reel,
  Shot,
  DialogueSegment,
  SpeechJob,
  DubbingScriptLine,
  ToneProfile,
  ValidationStatus,
  TranscreationJob,
  CharacterVoiceProfile,
  DubbedAudioLine,
  DubbingJob,
  EmotionProfile,
} from '../types/project';
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

/**
 * AI Speech Processing, Demucs Stem Isolation & Diarization API Client
 */
export const speechProcessingApi = {
  async triggerSpeechProcessing(
    _projectId: string,
    reelId: string,
    audioS3Uri: string,
    options?: {
      sourceLanguageHint?: string;
      characterRoster?: string[];
      denoisePrefilter?: boolean;
    },
    onProgress?: (stage: string, percent: number) => void
  ): Promise<DialogueSegment[]> {
    onProgress?.('Extracting 48kHz vocal stem with Meta Demucs v4...', 20);
    await new Promise((r) => setTimeout(r, 250));

    onProgress?.('Segmenting dialogue boundaries via Voice Activity Detection (VAD)...', 45);
    await new Promise((r) => setTimeout(r, 250));

    onProgress?.('Running WhisperX large-v3 multilingual speech-to-text & alignment...', 75);
    await new Promise((r) => setTimeout(r, 300));

    onProgress?.('Clustering speaker turns & voiceprints with PyAnnote.audio 3.1...', 90);
    await new Promise((r) => setTimeout(r, 200));

    const isNoisy =
      audioS3Uri.toLowerCase().includes('noisy') ||
      audioS3Uri.toLowerCase().includes('low_snr');

    const segments: DialogueSegment[] = [
      {
        id: `seg-${reelId}-001`,
        speakerId: 'SPEAKER_00',
        speakerName: options?.characterRoster?.[0] || 'Commander Elena Vance',
        timecodeIn: '01:00:01:06',
        timecodeOut: '01:00:04:18',
        startSeconds: 1.25,
        endSeconds: 4.75,
        detectedLanguage: 'en-US',
        languageConfidence: 0.99,
        sourceText: 'Orbital trajectory confirmed. Atmospheric entry vector initialized.',
        targetText: 'Trayectoria orbital confirmada. Vector de reentrada atmosférica iniciado.',
        audioQuality: isNoisy ? 'LOW_SNR_NOISE_GATE_WARNING' : 'ISOLATED_VOCAL_CLEAN (SDR 12.4 dB)',
        snrDb: isNoisy ? 2.4 : 14.8,
        needsReview: isNoisy,
        words: [
          { word: 'Orbital', startTime: 1.25, endTime: 1.65, confidence: isNoisy ? 0.72 : 0.98 },
          { word: 'trajectory', startTime: 1.68, endTime: 2.25, confidence: isNoisy ? 0.69 : 0.97 },
          { word: 'confirmed.', startTime: 2.28, endTime: 2.85, confidence: isNoisy ? 0.71 : 0.99 },
          { word: 'Atmospheric', startTime: 2.95, endTime: 3.55, confidence: isNoisy ? 0.68 : 0.96 },
          { word: 'entry', startTime: 3.58, endTime: 3.95, confidence: isNoisy ? 0.70 : 0.98 },
          { word: 'vector', startTime: 3.98, endTime: 4.35, confidence: isNoisy ? 0.72 : 0.97 },
          { word: 'initialized.', startTime: 4.38, endTime: 4.75, confidence: isNoisy ? 0.69 : 0.99 },
        ],
      },
      {
        id: `seg-${reelId}-002`,
        speakerId: 'SPEAKER_01',
        speakerName: options?.characterRoster?.[1] || 'Chief Engineer Kaelen',
        timecodeIn: '01:00:06:00',
        timecodeOut: '01:00:10:12',
        startSeconds: 6.0,
        endSeconds: 10.5,
        detectedLanguage: 'en-US',
        languageConfidence: 0.99,
        sourceText: 'Shield frequency holding at ninety-two percent. Keep the main thrusters synchronized.',
        targetText: 'Frecuencia de escudos estable al noventa y dos por ciento. Mantengan propulsores sincronizados.',
        audioQuality: isNoisy ? 'LOW_SNR_NOISE_GATE_WARNING' : 'ISOLATED_VOCAL_CLEAN (SDR 12.4 dB)',
        snrDb: isNoisy ? 2.2 : 15.2,
        needsReview: isNoisy,
        words: [
          { word: 'Shield', startTime: 6.0, endTime: 6.4, confidence: isNoisy ? 0.70 : 0.97 },
          { word: 'frequency', startTime: 6.42, endTime: 6.95, confidence: isNoisy ? 0.68 : 0.96 },
          { word: 'holding', startTime: 6.98, endTime: 7.35, confidence: isNoisy ? 0.71 : 0.98 },
          { word: 'at', startTime: 7.36, endTime: 7.5, confidence: isNoisy ? 0.75 : 0.99 },
          { word: 'ninety-two', startTime: 7.52, endTime: 8.1, confidence: isNoisy ? 0.69 : 0.97 },
          { word: 'percent.', startTime: 8.12, endTime: 8.6, confidence: isNoisy ? 0.72 : 0.98 },
          { word: 'Keep', startTime: 8.7, endTime: 8.95, confidence: isNoisy ? 0.74 : 0.99 },
          { word: 'the', startTime: 8.96, endTime: 9.1, confidence: isNoisy ? 0.75 : 0.99 },
          { word: 'main', startTime: 9.12, endTime: 9.4, confidence: isNoisy ? 0.71 : 0.98 },
          { word: 'thrusters', startTime: 9.42, endTime: 9.9, confidence: isNoisy ? 0.67 : 0.96 },
          { word: 'synchronized.', startTime: 9.92, endTime: 10.5, confidence: isNoisy ? 0.70 : 0.97 },
        ],
      },
      {
        id: `seg-${reelId}-003`,
        speakerId: 'SPEAKER_00',
        speakerName: options?.characterRoster?.[0] || 'Commander Elena Vance',
        timecodeIn: '01:00:12:08',
        timecodeOut: '01:00:16:04',
        startSeconds: 12.33,
        endSeconds: 16.16,
        detectedLanguage: 'en-US',
        languageConfidence: 0.98,
        sourceText: 'We have an anomalous radiation signature breaching the forward bulkhead.',
        targetText: 'Detectamos una firma de radiación anómala atravesando el mamparo de proa.',
        audioQuality: isNoisy ? 'LOW_SNR_NOISE_GATE_WARNING' : 'ISOLATED_VOCAL_CLEAN (SDR 12.4 dB)',
        snrDb: isNoisy ? 2.5 : 14.1,
        needsReview: isNoisy,
        words: [
          { word: 'We', startTime: 12.33, endTime: 12.5, confidence: isNoisy ? 0.72 : 0.98 },
          { word: 'have', startTime: 12.52, endTime: 12.75, confidence: isNoisy ? 0.71 : 0.99 },
          { word: 'an', startTime: 12.76, endTime: 12.9, confidence: isNoisy ? 0.73 : 0.99 },
          { word: 'anomalous', startTime: 12.92, endTime: 13.5, confidence: isNoisy ? 0.68 : 0.95 },
          { word: 'radiation', startTime: 13.52, endTime: 14.1, confidence: isNoisy ? 0.69 : 0.97 },
          { word: 'signature', startTime: 14.12, endTime: 14.65, confidence: isNoisy ? 0.70 : 0.96 },
          { word: 'breaching', startTime: 14.68, endTime: 15.2, confidence: isNoisy ? 0.69 : 0.98 },
          { word: 'the', startTime: 15.22, endTime: 15.35, confidence: isNoisy ? 0.74 : 0.99 },
          { word: 'forward', startTime: 15.38, endTime: 15.75, confidence: isNoisy ? 0.71 : 0.97 },
          { word: 'bulkhead.', startTime: 15.78, endTime: 16.16, confidence: isNoisy ? 0.69 : 0.98 },
        ],
      },
    ];

    onProgress?.('Speech processing and speaker attribution complete.', 100);
    return segments;
  },
};

/**
 * Multilingual Dialogue Transcreation, Syllable Budgeting & Dubbing Script API Client
 */
export const transcreationApi = {
  async triggerTranscreation(
    _projectId: string,
    reelId: string,
    targetLanguage: string = 'es-ES',
    options?: {
      syllableBudgetTolerance?: number;
      simulateFailure?: boolean;
      simulateRateLimit?: boolean;
    },
    onProgress?: (stage: string, percent: number) => void
  ): Promise<{ lines: DubbingScriptLine[]; retryCount: number }> {
    onProgress?.('Analyzing scene context, character relationships & dramatic tone...', 15);
    await new Promise((r) => setTimeout(r, 200));

    let retryCount = 0;

    // Simulate rate limit retry recovery if requested
    if (options?.simulateRateLimit) {
      onProgress?.('LLM rate limit (HTTP 429) hit. Applying exponential backoff retry...', 35);
      await new Promise((r) => setTimeout(r, 300));
      retryCount = 1;
      onProgress?.('Retry attempt 1 succeeded via secondary vLLM Qwen-2.5-72B fallback.', 45);
    }

    // Simulate terminal provider failure if requested
    if (options?.simulateFailure) {
      onProgress?.('Connecting to LLM translation gateway...', 30);
      await new Promise((r) => setTimeout(r, 200));
      throw new Error('LLM Provider Failure: Persistent 500 Gateway Timeout after 3 retries.');
    }

    onProgress?.('Generating theatrical transcreation with Claude 3.5 Sonnet...', 55);
    await new Promise((r) => setTimeout(r, 250));

    onProgress?.('Verifying syllable budget envelope (Δ ≤ ±1 syllable)...', 75);
    await new Promise((r) => setTimeout(r, 200));

    onProgress?.('Indexing bilabial viseme closures (/p, b, m/) for lip-sync...', 90);
    await new Promise((r) => setTimeout(r, 150));

    const isSpanish = targetLanguage.startsWith('es');
    const isFrench = targetLanguage.startsWith('fr');

    const lines: DubbingScriptLine[] = [
      {
        id: `dub-${reelId}-001`,
        shotId: 'shot-101',
        timecodeIn: '01:00:01:06',
        timecodeOut: '01:00:04:18',
        startSeconds: 1.25,
        endSeconds: 4.75,
        characterId: 'char_elena',
        characterName: 'Commander Elena Vance',
        characterRelationship: 'Commanding lead pilot directing operations',
        sceneContext: 'Deep space command bridge during atmospheric entry descent',
        tone: 'URGENT_COMMAND',
        sourceLanguage: 'en-US',
        targetLanguage,
        sourceText: 'Orbital trajectory confirmed. Atmospheric entry vector initialized.',
        translatedText: isSpanish
          ? 'Trayectoria orbital lista. Vector de reentrada iniciado.'
          : isFrench
          ? 'Trajectoire orbitale prête. Vecteur de rentrée enclenché.'
          : 'Flugbahn bestätigt. Atmosphärischer Eintrittsvektor gestartet.',
        sourceSyllables: 21,
        targetSyllables: 20,
        syllableDelta: 1,
        durationDeltaPercent: -4.8,
        validationStatus: 'VALIDATED',
        isApproved: true,
        culturalNotes: 'Preserved formal military aerospace protocol.',
        visemeAnchors: [
          { viseme: 'bilabial', targetFrame: 34, phoneme: 'b', isClosure: true },
          { viseme: 'bilabial', targetFrame: 78, phoneme: 'p', isClosure: true },
        ],
        pronunciationNotes: [
          {
            word: isSpanish ? 'Trayectoria' : 'Trajectoire',
            ipa: isSpanish ? '[tɾa.ʝekˈto.ɾja]' : '[tʁa.ʒɛk.twaʁ]',
            phoneticSpelling: isSpanish ? 'trah-yek-TOH-ryah' : 'trah-zhek-TWAHR',
            stressSyllable: isSpanish ? 'TOH' : 'TWAHR',
          },
          {
            word: isSpanish ? 'reentrada' : 'enclenché',
            ipa: isSpanish ? '[re.enˈtɾa.ða]' : '[ɑ̃.klɑ̃.ʃe]',
            phoneticSpelling: isSpanish ? 'reh-en-TRAH-thah' : 'ahn-klahn-SHAY',
            stressSyllable: isSpanish ? 'TRAH' : 'SHAY',
          },
        ],
      },
      {
        id: `dub-${reelId}-002`,
        shotId: 'shot-102',
        timecodeIn: '01:00:06:00',
        timecodeOut: '01:00:10:12',
        startSeconds: 6.0,
        endSeconds: 10.5,
        characterId: 'char_kaelen',
        characterName: 'Chief Engineer Kaelen',
        characterRelationship: 'Senior propulsion engineer reporting to Commander Vance',
        sceneContext: 'Engineering deck adjusting ion engine coils under heat load',
        tone: 'URGENT_COMMAND',
        sourceLanguage: 'en-US',
        targetLanguage,
        sourceText: 'Shield frequency holding at ninety-two percent. Keep the main thrusters synchronized.',
        translatedText: isSpanish
          ? 'Escudos al noventa y dos por ciento. Propulsores sincronizados.'
          : isFrench
          ? 'Boucliers à quatre-vingt-douze pour cent. Synchronisez les propulseurs.'
          : 'Schildfrequenz stabil bei zweiundneunzig Prozent. Triebwerke synchronisieren.',
        sourceSyllables: 21,
        targetSyllables: 21,
        syllableDelta: 0,
        durationDeltaPercent: 0.0,
        validationStatus: 'VALIDATED',
        isApproved: true,
        culturalNotes: 'Precise technical cadence with zero syllable drift.',
        visemeAnchors: [
          { viseme: 'bilabial', targetFrame: 154, phoneme: 'p', isClosure: true },
          { viseme: 'bilabial', targetFrame: 210, phoneme: 'm', isClosure: true },
        ],
        pronunciationNotes: [
          {
            word: isSpanish ? 'propulsores' : 'propulseurs',
            ipa: isSpanish ? '[pɾo.pulˈso.ɾes]' : '[pʁɔ.pyl.sœʁ]',
            phoneticSpelling: isSpanish ? 'pro-pool-SOH-res' : 'pro-pül-SOOR',
            stressSyllable: isSpanish ? 'SOH' : 'SOOR',
          },
        ],
      },
      {
        id: `dub-${reelId}-003`,
        shotId: 'shot-103',
        timecodeIn: '01:00:12:08',
        timecodeOut: '01:00:16:04',
        startSeconds: 12.33,
        endSeconds: 16.16,
        characterId: 'char_elena',
        characterName: 'Commander Elena Vance',
        characterRelationship: 'Reporting emergency warning status to cockpit crew',
        sceneContext: 'Hull sensor panel flashing red warning indicators',
        tone: 'URGENT_COMMAND',
        sourceLanguage: 'en-US',
        targetLanguage,
        sourceText: 'We have an anomalous radiation signature breaching the forward bulkhead.',
        translatedText: isSpanish
          ? 'Firma anómala de radiación que cruza el mamparo de proa.'
          : isFrench
          ? 'Signature de radiation anormale à travers la cloison avant.'
          : 'Anomale Strahlungssignatur durchbricht das vordere Schott.',
        sourceSyllables: 20,
        targetSyllables: 20,
        syllableDelta: 0,
        durationDeltaPercent: 0.0,
        validationStatus: 'VALIDATED',
        isApproved: true,
        culturalNotes: 'Tense cinematic pacing with bilabial anchor on /m/ (mamparo).',
        visemeAnchors: [
          { viseme: 'bilabial', targetFrame: 312, phoneme: 'm', isClosure: true },
          { viseme: 'bilabial', targetFrame: 345, phoneme: 'p', isClosure: true },
        ],
        pronunciationNotes: [
          {
            word: isSpanish ? 'radiación' : 'radiation',
            ipa: isSpanish ? '[ra.ðjaˈsjon]' : '[ʁa.dja.sjɔ̃]',
            phoneticSpelling: isSpanish ? 'rah-thyah-SYOHN' : 'rah-dyah-SYOHN',
            stressSyllable: isSpanish ? 'SYOHN' : 'SYOHN',
          },
          {
            word: isSpanish ? 'mamparo' : 'cloison',
            ipa: isSpanish ? '[mamˈpa.ɾo]' : '[klwa.zɔ̃]',
            phoneticSpelling: isSpanish ? 'mahm-PAH-ro' : 'klwah-ZOHN',
            stressSyllable: isSpanish ? 'PAH' : 'ZOHN',
          },
        ],
      },

    ];

    onProgress?.('Dubbing script transcreation & timing alignment complete.', 100);
    return { lines, retryCount };
  },

  async updateDubbingScriptLine(
    lineId: string,
    updates: Partial<DubbingScriptLine>
  ): Promise<Partial<DubbingScriptLine>> {
    await new Promise((r) => setTimeout(r, 60));
    return {
      id: lineId,
      ...updates,
      validationStatus: updates.isApproved ? 'VALIDATED' : 'MANUALLY_EDITED',
    };
  },
};

export const dubbingApi = {
  async getVoiceProfiles(): Promise<CharacterVoiceProfile[]> {
    await new Promise((r) => setTimeout(r, 80));
    return [
      {
        characterId: 'char_elena',
        characterName: 'Commander Elena Vance',
        performerName: 'Elena Vance (Lead Voice Talent)',
        authorizationConsentId: 'SAG-AFTRA-EV-2026-9941',
        isAuthorized: true,
        primaryModel: 'CosyVoice 2 (Apache 2.0)',
        licenseType: 'APACHE_2_0',
        pitchScale: 1.05,
        energyScale: 1.1,
        referenceAudioUrl: 's3://cinema-vault-voices/elena_vance_clean_master.wav',
        languageTimbre: 'es-ES',
      },
      {
        characterId: 'char_kaelen',
        characterName: 'Chief Engineer Kaelen',
        performerName: 'Kaelen Scott (Senior Voice Talent)',
        authorizationConsentId: 'SAG-AFTRA-KS-2026-4412',
        isAuthorized: true,
        primaryModel: 'StyleTTS 2 (MIT)',
        licenseType: 'MIT_WITH_CONSENT',
        pitchScale: 0.95,
        energyScale: 1.15,
        referenceAudioUrl: 's3://cinema-vault-voices/kaelen_scott_clean_master.wav',
        languageTimbre: 'es-ES',
      },
      {
        characterId: 'char_aura',
        characterName: 'AI Interface Aura',
        performerName: 'Aura Synthetic Vocal Architecture',
        authorizationConsentId: 'SYNTH-AI-AU-2026-0001',
        isAuthorized: true,
        primaryModel: 'CosyVoice 2 (Apache 2.0)',
        licenseType: 'APACHE_2_0',
        pitchScale: 1.0,
        energyScale: 0.98,
        referenceAudioUrl: 's3://cinema-vault-voices/aura_interface_master.wav',
        languageTimbre: 'es-ES',
      },
    ];
  },

  async triggerDubbingSynthesis(
    reelId: string,
    options: {
      speakingRate?: number;
      defaultEmotion?: EmotionProfile;
      targetLanguage?: string;
      simulateUncertifiedVoice?: boolean;
    } = {},
    onProgress?: (stage: string, percent: number) => void
  ): Promise<DubbingJob> {
    const rate = options.speakingRate ?? 1.0;
    const emotion = options.defaultEmotion ?? 'URGENT_COMMAND';
    const lang = options.targetLanguage ?? 'es-ES';

    onProgress?.('Verifying SAG-AFTRA Actor Consent Ledgers & Licensing...', 20);
    await new Promise((r) => setTimeout(r, 150));

    if (options.simulateUncertifiedVoice) {
      throw new Error(
        "Voice authorization failed: SAG-AFTRA consent token for character 'char_unauthorized' is invalid or expired."
      );
    }

    onProgress?.('Generating Expressive Prosody & Neural Synthesis (CosyVoice 2 / StyleTTS 2)...', 50);
    await new Promise((r) => setTimeout(r, 180));

    onProgress?.('Evaluating Duration Alignment & Applying Dynamic WSOLA Time-Stretch...', 75);
    await new Promise((r) => setTimeout(r, 150));

    onProgress?.('Conforming Broadcast Loudness (ITU-R BS.1770-4 -24.0 LKFS)...', 90);
    await new Promise((r) => setTimeout(r, 120));

    const audioLines: DubbedAudioLine[] = [
      {
        id: `dub-audio-${reelId}-001`,
        shotId: 'shot-101',
        characterId: 'char_elena',
        characterName: 'Commander Elena Vance',
        timecodeIn: '01:00:01:06',
        timecodeOut: '01:00:04:18',
        targetDurationSeconds: 3.5,
        actualDurationSeconds: 3.42,
        conformedDurationSeconds: 3.42,
        durationDeltaMs: -80,
        wsolaApplied: false,
        timeStretchRatio: 1.0,
        loudnessLkfs: -24.0,
        truePeakDbtp: -1.0,
        snrDb: 29.4,
        isHumanAudio: false,
        audioUrl: `s3://cinema-vault-dubbing/cosyvoice2/elena_trayectoria_orbital.wav`,
        conformanceStatus: 'CONFORMED',
        licenseType: 'APACHE_2_0',
        emotion,
        translatedText: 'Trayectoria orbital lista. Vector de reentrada iniciado.',
      },
      {
        id: `dub-audio-${reelId}-002`,
        shotId: 'shot-102',
        characterId: 'char_kaelen',
        characterName: 'Chief Engineer Kaelen',
        timecodeIn: '01:00:06:00',
        timecodeOut: '01:00:10:12',
        targetDurationSeconds: 4.5,
        actualDurationSeconds: 4.85,
        conformedDurationSeconds: 4.5,
        durationDeltaMs: 350,
        wsolaApplied: true,
        timeStretchRatio: 0.928,
        loudnessLkfs: -24.0,
        truePeakDbtp: -1.0,
        snrDb: 28.8,
        isHumanAudio: false,
        audioUrl: `s3://cinema-vault-dubbing/styletts2/kaelen_escudos_noventa.wav`,
        conformanceStatus: 'CONFORMED',
        licenseType: 'MIT_WITH_CONSENT',
        emotion,
        translatedText: 'Escudos al noventa y dos por ciento. Propulsores sincronizados.',
      },
      {
        id: `dub-audio-${reelId}-003`,
        shotId: 'shot-103',
        characterId: 'char_elena',
        characterName: 'Commander Elena Vance',
        timecodeIn: '01:00:12:08',
        timecodeOut: '01:00:16:04',
        targetDurationSeconds: 3.83,
        actualDurationSeconds: 3.8,
        conformedDurationSeconds: 3.8,
        durationDeltaMs: -30,
        wsolaApplied: false,
        timeStretchRatio: 1.0,
        loudnessLkfs: -24.0,
        truePeakDbtp: -1.0,
        snrDb: 29.1,
        isHumanAudio: false,
        audioUrl: `s3://cinema-vault-dubbing/cosyvoice2/elena_firma_anomala.wav`,
        conformanceStatus: 'CONFORMED',
        licenseType: 'APACHE_2_0',
        emotion,
        translatedText: 'Firma anómala de radiación que cruza el mamparo de proa.',
      },
    ];

    onProgress?.('Reel Dubbing & Audio Conformance complete.', 100);

    return {
      jobId: `job-dub-${reelId}-${Date.now().toString().slice(-4)}`,
      projectId: 'proj-001',
      reelId,
      status: 'COMPLETED',
      stage: 'COMPLETED',
      progressPercent: 100,
      targetLanguage: lang,
      audioLines,
      totalDurationSeconds: 11.72,
      averageLoudnessLkfs: -24.0,
      averageSnrDb: 29.1,
      humanTakesCount: 0,
    };
  },

  async uploadHumanAudioTake(
    lineId: string,
    file: { name: string; size: number; durationSeconds?: number },
    onProgress?: (stage: string, percent: number) => void
  ): Promise<DubbedAudioLine> {
    onProgress?.('Validating 48 kHz 24-bit PCM Broadcast Audio Take...', 25);
    await new Promise((r) => setTimeout(r, 120));

    onProgress?.('Running SNR and Acoustic Quality Analysis...', 60);
    await new Promise((r) => setTimeout(r, 120));

    const duration = file.durationSeconds ?? 3.55;
    const targetDuration = 3.5;
    const deltaMs = Math.round((duration - targetDuration) * 1000);
    const driftPercent = (Math.abs(duration - targetDuration) / targetDuration) * 100;
    const wsola = driftPercent > 5.0 && driftPercent <= 15.0;

    onProgress?.('Applying ITU-R BS.1770-4 (-24.0 LKFS) Normalization...', 90);
    await new Promise((r) => setTimeout(r, 100));

    onProgress?.('Human ADR Take Conformed and Attached.', 100);

    return {
      id: `dub-human-${lineId}`,
      characterId: 'char_elena',
      characterName: 'Commander Elena Vance',
      timecodeIn: '01:00:01:06',
      timecodeOut: '01:00:04:18',
      targetDurationSeconds: targetDuration,
      actualDurationSeconds: duration,
      conformedDurationSeconds: wsola ? targetDuration : duration,
      durationDeltaMs: deltaMs,
      wsolaApplied: wsola,
      timeStretchRatio: wsola ? Number((targetDuration / duration).toFixed(3)) : 1.0,
      loudnessLkfs: -24.0,
      truePeakDbtp: -1.0,
      snrDb: 31.2,
      isHumanAudio: true,
      audioUrl: `s3://cinema-vault-dubbing/human_adr/${file.name}`,
      conformanceStatus: driftPercent > 15.0 ? 'NEEDS_PACING_ADJUSTMENT' : 'CONFORMED',
      licenseType: 'HUMAN_PERFORMER',
      emotion: 'NEUTRAL',
      translatedText: '[Human Performer ADR Studio Recording]',
      pacingWarning:
        driftPercent > 15.0
          ? `Speech duration is ${driftPercent.toFixed(1)}% divergent from target window.`
          : undefined,
    };
  },
};



