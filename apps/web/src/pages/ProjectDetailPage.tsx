import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Film,
  Layers,
  Globe2,
  Mic2,
  Play,
  FileCheck2,
  ShieldCheck,
  Lock,
  Sliders,
  UserCheck,
  UploadCloud,
  Sparkles,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Wand2,
  BookOpen,
  CheckCheck,
  RefreshCw,
  AlertOctagon,
  MessageSquare,
} from 'lucide-react';
import {
  FilmProject,
  Reel,
  Shot,
  DialogueSegment,
  DubbingScriptLine,
  ToneProfile,
  ValidationStatus,
} from '../types/project';
import {
  projectsApi,
  videoAnalysisApi,
  speechProcessingApi,
  transcreationApi,
} from '../lib/api';
import { useAuth } from '../lib/authContext';
import { CinemaPlayerModal } from '../components/player/CinemaPlayerModal';
import { MediaIngestModal } from '../components/ingest/MediaIngestModal';

const MOCK_DUBBING_LINES: DubbingScriptLine[] = [
  {
    id: 'dub-init-001',
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
    targetLanguage: 'es-ES',
    sourceText: 'Orbital trajectory confirmed. Atmospheric entry vector initialized.',
    translatedText: 'Trayectoria orbital lista. Vector de reentrada iniciado.',
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
        word: 'Trayectoria',
        ipa: '[tɾa.ʝekˈto.ɾja]',
        phoneticSpelling: 'trah-yek-TOH-ryah',
        stressSyllable: 'TOH',
      },
      {
        word: 'reentrada',
        ipa: '[re.enˈtɾa.ða]',
        phoneticSpelling: 'reh-en-TRAH-thah',
        stressSyllable: 'TRAH',
      },
    ],
  },
  {
    id: 'dub-init-002',
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
    targetLanguage: 'es-ES',
    sourceText: 'Shield frequency holding at ninety-two percent. Keep the main thrusters synchronized.',
    translatedText: 'Escudos al noventa y dos por ciento. Propulsores sincronizados.',
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
        word: 'propulsores',
        ipa: '[pɾo.pulˈso.ɾes]',
        phoneticSpelling: 'pro-pool-SOH-res',
        stressSyllable: 'SOH',
      },
    ],
  },
  {
    id: 'dub-init-003',
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
    targetLanguage: 'es-ES',
    sourceText: 'We have an anomalous radiation signature breaching the forward bulkhead.',
    translatedText: 'Firma anómala de radiación que cruza el mamparo de proa.',
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
        word: 'radiación',
        ipa: '[ra.ðjaˈsjon]',
        phoneticSpelling: 'rah-thyah-SYOHN',
        stressSyllable: 'SYOHN',
      },
      {
        word: 'mamparo',
        ipa: '[mamˈpa.ɾo]',
        phoneticSpelling: 'mahm-PAH-ro',
        stressSyllable: 'PAH',
      },
    ],
  },
];

const MOCK_DIALOGUE_SEGMENTS: DialogueSegment[] = [
  {
    id: 'seg-init-001',
    speakerId: 'SPEAKER_00',
    speakerName: 'Commander Elena Vance',
    timecodeIn: '01:00:01:06',
    timecodeOut: '01:00:04:18',
    startSeconds: 1.25,
    endSeconds: 4.75,
    detectedLanguage: 'en-US',
    languageConfidence: 0.99,
    sourceText: 'Orbital trajectory confirmed. Atmospheric entry vector initialized.',
    targetText: 'Trayectoria orbital confirmada. Vector de reentrada atmosférica iniciado.',
    audioQuality: 'ISOLATED_VOCAL_CLEAN (SDR 12.4 dB)',
    snrDb: 14.8,
    needsReview: false,
    words: [
      { word: 'Orbital', startTime: 1.25, endTime: 1.65, confidence: 0.98 },
      { word: 'trajectory', startTime: 1.68, endTime: 2.25, confidence: 0.97 },
      { word: 'confirmed.', startTime: 2.28, endTime: 2.85, confidence: 0.99 },
      { word: 'Atmospheric', startTime: 2.95, endTime: 3.55, confidence: 0.96 },
      { word: 'entry', startTime: 3.58, endTime: 3.95, confidence: 0.98 },
      { word: 'vector', startTime: 3.98, endTime: 4.35, confidence: 0.97 },
      { word: 'initialized.', startTime: 4.38, endTime: 4.75, confidence: 0.99 },
    ],
  },
  {
    id: 'seg-init-002',
    speakerId: 'SPEAKER_01',
    speakerName: 'Chief Engineer Kaelen',
    timecodeIn: '01:00:06:00',
    timecodeOut: '01:00:10:12',
    startSeconds: 6.0,
    endSeconds: 10.5,
    detectedLanguage: 'en-US',
    languageConfidence: 0.99,
    sourceText: 'Shield frequency holding at ninety-two percent. Keep the main thrusters synchronized.',
    targetText: 'Frecuencia de escudos estable al noventa y dos por ciento. Mantengan propulsores sincronizados.',
    audioQuality: 'ISOLATED_VOCAL_CLEAN (SDR 12.4 dB)',
    snrDb: 15.2,
    needsReview: false,
    words: [
      { word: 'Shield', startTime: 6.0, endTime: 6.4, confidence: 0.97 },
      { word: 'frequency', startTime: 6.42, endTime: 6.95, confidence: 0.96 },
      { word: 'holding', startTime: 6.98, endTime: 7.35, confidence: 0.98 },
      { word: 'at', startTime: 7.36, endTime: 7.5, confidence: 0.99 },
      { word: 'ninety-two', startTime: 7.52, endTime: 8.1, confidence: 0.97 },
      { word: 'percent.', startTime: 8.12, endTime: 8.6, confidence: 0.98 },
      { word: 'Keep', startTime: 8.7, endTime: 8.95, confidence: 0.99 },
      { word: 'the', startTime: 8.96, endTime: 9.1, confidence: 0.99 },
      { word: 'main', startTime: 9.12, endTime: 9.4, confidence: 0.98 },
      { word: 'thrusters', startTime: 9.42, endTime: 9.9, confidence: 0.96 },
      { word: 'synchronized.', startTime: 9.92, endTime: 10.5, confidence: 0.97 },
    ],
  },
  {
    id: 'seg-init-003',
    speakerId: 'SPEAKER_00',
    speakerName: 'Commander Elena Vance',
    timecodeIn: '01:00:12:08',
    timecodeOut: '01:00:16:04',
    startSeconds: 12.33,
    endSeconds: 16.16,
    detectedLanguage: 'en-US',
    languageConfidence: 0.98,
    sourceText: 'We have an anomalous radiation signature breaching the forward bulkhead.',
    targetText: 'Detectamos una firma de radiación anómala atravesando el mamparo de proa.',
    audioQuality: 'LOW_SNR_NOISE_GATE_WARNING',
    snrDb: 2.5,
    needsReview: true,
    words: [
      { word: 'We', startTime: 12.33, endTime: 12.5, confidence: 0.72 },
      { word: 'have', startTime: 12.52, endTime: 12.75, confidence: 0.71 },
      { word: 'an', startTime: 12.76, endTime: 12.9, confidence: 0.73 },
      { word: 'anomalous', startTime: 12.92, endTime: 13.5, confidence: 0.68 },
      { word: 'radiation', startTime: 13.52, endTime: 14.1, confidence: 0.69 },
      { word: 'signature', startTime: 14.12, endTime: 14.65, confidence: 0.70 },
      { word: 'breaching', startTime: 14.68, endTime: 15.2, confidence: 0.69 },
      { word: 'the', startTime: 15.22, endTime: 15.35, confidence: 0.74 },
      { word: 'forward', startTime: 15.38, endTime: 15.75, confidence: 0.71 },
      { word: 'bulkhead.', startTime: 15.78, endTime: 16.16, confidence: 0.69 },
    ],
  },
];

const MOCK_SHOTS: Shot[] = [
  {
    id: 'shot-101',
    shotNumber: 1,
    timecodeIn: '01:04:12:00',
    timecodeOut: '01:04:16:12',
    durationFrames: 108,
    activeSpeaker: 'Commander Elena Vance',
    syncNetConfidence: 8.8,
    ssimIdentity: 0.995,
    status: 'COMPLETED',
  },
  {
    id: 'shot-102',
    shotNumber: 2,
    timecodeIn: '01:04:16:12',
    timecodeOut: '01:04:21:04',
    durationFrames: 112,
    activeSpeaker: 'Chief Engineer Kaelen',
    syncNetConfidence: 8.6,
    ssimIdentity: 0.994,
    status: 'COMPLETED',
  },
  {
    id: 'shot-103',
    shotNumber: 3,
    timecodeIn: '01:04:21:04',
    timecodeOut: '01:04:28:18',
    durationFrames: 182,
    activeSpeaker: 'Commander Elena Vance',
    syncNetConfidence: 8.9,
    ssimIdentity: 0.996,
    status: 'LIP_SYNCING',
  },
  {
    id: 'shot-104',
    shotNumber: 4,
    timecodeIn: '01:04:28:18',
    timecodeOut: '01:04:32:00',
    durationFrames: 78,
    activeSpeaker: 'AI Interface "Aura"',
    syncNetConfidence: 9.1,
    ssimIdentity: 0.998,
    status: 'DUBBING',
  },
];

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<FilmProject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'REELS' | 'TRANSCREATION' | 'VOICE' | 'DELIVERY'>('REELS');
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const [isIngestOpen, setIsIngestOpen] = useState<boolean>(false);
  const [c2paSigned, setC2paSigned] = useState<boolean>(false);
  const [loudnessCalibrated, setLoudnessCalibrated] = useState<boolean>(false);
  const [shots, setShots] = useState<Shot[]>(MOCK_SHOTS);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStage, setAnalysisStage] = useState<string>('');
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [dialogueSegments, setDialogueSegments] = useState<DialogueSegment[]>(MOCK_DIALOGUE_SEGMENTS);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState<boolean>(false);
  const [speechStage, setSpeechStage] = useState<string>('');
  const [speechProgress, setSpeechProgress] = useState<number>(0);
  const [expandedSegmentId, setExpandedSegmentId] = useState<string | null>(null);
  const [simulateNoise, setSimulateNoise] = useState<boolean>(false);
  const [selectedLangCode, setSelectedLangCode] = useState<string>('es-ES');
  const [dubbingLines, setDubbingLines] = useState<DubbingScriptLine[]>(MOCK_DUBBING_LINES);
  const [transcreationView, setTranscreationView] = useState<'DUBBING_SCRIPT' | 'SPEECH_ASR'>('DUBBING_SCRIPT');
  const [isTranscreating, setIsTranscreating] = useState<boolean>(false);
  const [transcreationStage, setTranscreationStage] = useState<string>('');
  const [transcreationProgress, setTranscreationProgress] = useState<number>(0);
  const [expandedDubLineId, setExpandedDubLineId] = useState<string | null>(null);
  const [simulateProviderFailure, setSimulateProviderFailure] = useState<boolean>(false);
  const [simulateProviderRetry, setSimulateProviderRetry] = useState<boolean>(false);
  const [transcreationNotification, setTranscreationNotification] = useState<string | null>(null);
  const { user, hasPermission } = useAuth();

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await projectsApi.getProjectById(id);
        setProject(data);
        if (data && data.reels.length > 0) {
          setSelectedReel(data.reels[0]);
        }
      } catch (e) {
        console.error('Failed to load project details:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadProject();
  }, [id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-8 w-48 rounded-lg animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated mb-6" />
        <div className="h-64 w-full rounded-3xl animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 rounded-2xl animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated" />
          <div className="h-40 rounded-2xl animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated" />
          <div className="h-40 rounded-2xl animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-apple-gray-100 text-apple-gray-400 dark:bg-darkroom-elevated dark:text-apple-gray-500 mx-auto mb-4">
          <Film className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-apple-gray-900 dark:text-white">Project Not Found</h2>
        <p className="mt-2 text-xs text-apple-gray-500 dark:text-apple-gray-400">
          The requested cinema localization project could not be found or has been removed.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-apple-blue px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-apple-blue-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Studio Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-20">
      {/* Top Breadcrumb & Return Bar */}
      <div className="border-b border-apple-gray-200/80 bg-apple-surface/40 dark:border-darkroom-border dark:bg-darkroom-surface/40">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 text-xs text-apple-gray-500">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-medium text-apple-gray-600 hover:text-apple-blue dark:text-apple-gray-300 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Studio Projects</span>
          </Link>
          <span className="font-mono text-[11px] text-apple-gray-400">
            PROJECT ID: {project.id}
          </span>
        </div>
      </div>

      {/* Hero Project Banner */}
      <div className="relative overflow-hidden border-b border-apple-gray-200/80 bg-gradient-to-b from-apple-surface to-apple-canvas dark:border-darkroom-border dark:from-darkroom-surface dark:to-darkroom-canvas transition-colors">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              {/* Project Poster Thumbnail */}
              <div className="relative h-28 w-20 sm:h-36 sm:w-26 shrink-0 overflow-hidden rounded-2xl border border-apple-gray-200 shadow-apple-card dark:border-darkroom-border">
                <img
                  src={project.posterUrl}
                  alt={project.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="rounded-full bg-apple-blue/10 px-2.5 py-0.5 text-[11px] font-semibold text-apple-blue dark:bg-apple-blue/20 dark:text-blue-400">
                    {project.status.replace('_', ' ')}
                  </span>
                  <span className="rounded-md bg-apple-gray-100 dark:bg-darkroom-elevated px-2 py-0.5 text-[11px] font-mono text-apple-gray-700 dark:text-apple-gray-300">
                    {project.aspectRatio} · {project.frameRate} fps
                  </span>
                  <span className="rounded-md bg-apple-gray-100 dark:bg-darkroom-elevated px-2 py-0.5 text-[11px] font-mono text-apple-gray-700 dark:text-apple-gray-300">
                    {project.colorSpace.split(' ')[0]}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-apple-gray-900 dark:text-white">
                  {project.title}
                </h1>
                <p className="text-xs sm:text-sm text-apple-gray-500 dark:text-apple-gray-400 mt-1">
                  Directed by {project.director} · Produced with {project.studio}
                </p>

                {/* Target Language Chips */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-[11px] text-apple-gray-400 font-semibold uppercase tracking-wider">
                    Dubs:
                  </span>
                  {project.targetLanguages.map((tl) => (
                    <span
                      key={tl.code}
                      className="inline-flex items-center gap-1 rounded-md border border-apple-gray-200/80 bg-apple-surface px-2 py-0.5 text-xs text-apple-gray-800 dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-apple-gray-200 shadow-2xs"
                    >
                      <span>{tl.flag}</span>
                      <span>{tl.name.split(' ')[0]}</span>
                    </span>
                  ))}
                </div>

                {/* Active Reviewer Role Pill */}
                {user && (
                  <div className="mt-3.5 inline-flex items-center gap-2 rounded-lg border border-apple-gray-200/60 bg-apple-surface/60 px-2.5 py-1 text-[11px] text-apple-gray-600 dark:border-darkroom-border/60 dark:bg-darkroom-elevated/60 dark:text-apple-gray-300">
                    <UserCheck className="h-3.5 w-3.5 text-apple-blue dark:text-blue-400" />
                    <span>
                      Reviewing as: <strong className="font-semibold text-apple-gray-900 dark:text-white">{user.name}</strong> ({user.title})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions & Launch A/B Player */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => setIsPlayerOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-apple-blue px-4 py-2.5 text-xs font-semibold text-white shadow-glow-blue hover:bg-apple-blue-hover active:scale-[0.98] transition-all"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Launch A/B Split-Wipe Player</span>
              </button>
            </div>
          </div>

          {/* Pipeline Stages Progress Ribbon */}
          <div className="mt-8 pt-6 border-t border-apple-gray-200/60 dark:border-darkroom-border/60">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-apple-gray-400">
                End-to-End Pipeline Conformance
              </span>
              <span className="font-mono font-bold text-apple-gray-900 dark:text-white">
                {project.overallProgress}% Complete
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-apple-gray-100 dark:bg-darkroom-elevated">
              <div
                className="h-full bg-gradient-to-r from-apple-blue via-cinema-purple to-cinema-green transition-all duration-700"
                style={{ width: `${project.overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-apple-gray-200 bg-apple-surface dark:border-darkroom-border dark:bg-darkroom-surface">
        <div className="mx-auto flex max-w-7xl gap-6 px-4 sm:px-6 lg:px-8">
          {[
            { id: 'REELS', label: 'Reels & Shots Breakdown', icon: Layers },
            { id: 'TRANSCREATION', label: 'Multilingual Transcreation', icon: Globe2 },
            { id: 'VOICE', label: 'Voice & Stem Separation', icon: Mic2 },
            { id: 'DELIVERY', label: 'DCP / IMF Master Export', icon: FileCheck2 },
          ].map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId as any)}
              className={`flex items-center gap-2 border-b-2 py-3.5 text-xs font-semibold transition-all ${
                activeTab === tabId
                  ? 'border-apple-blue text-apple-blue dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-apple-gray-500 hover:text-apple-gray-900 dark:text-apple-gray-400 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tab 1: Reels & Shots */}
        {activeTab === 'REELS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-apple-gray-900 dark:text-white">
                  Conformed Theatrical Reels
                </h3>
                <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
                  Feature film partitioned into SMPTE standard reels and frame-indexed shots.
                </p>
              </div>
              <button
                onClick={() => setIsIngestOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-apple-gray-200 bg-apple-surface px-3 py-1.5 text-xs font-semibold text-apple-gray-800 hover:border-apple-blue hover:text-apple-blue dark:border-darkroom-border dark:bg-darkroom-surface dark:text-apple-gray-200 shadow-2xs transition-all"
              >
                <UploadCloud className="h-3.5 w-3.5 text-apple-blue" />
                <span>Ingest Master Reel</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {project.reels.map((reel) => (
                <div
                  key={reel.id}
                  onClick={() => setSelectedReel(reel)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    selectedReel?.id === reel.id
                      ? 'border-apple-blue bg-apple-blue/5 dark:bg-apple-blue/10 ring-2 ring-apple-blue/20'
                      : 'border-apple-gray-200 bg-apple-surface hover:border-apple-gray-300 dark:border-darkroom-border dark:bg-darkroom-surface'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-apple-gray-900 dark:text-white">
                      {reel.name}
                    </span>
                    <span className="text-[11px] font-mono text-apple-gray-400">
                      {Math.round(reel.durationSeconds / 60)} mins
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-apple-gray-500">
                    <span>{reel.shotCount} shots</span>
                    <span className="font-semibold text-apple-gray-800 dark:text-apple-gray-200">
                      {reel.progressPercentage}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-apple-gray-100 dark:bg-darkroom-elevated overflow-hidden">
                    <div
                      className="h-full bg-apple-blue rounded-full"
                      style={{ width: `${reel.progressPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Shots Table */}
            <div className="overflow-hidden rounded-2xl border border-apple-gray-200 bg-apple-surface shadow-apple-sm dark:border-darkroom-border dark:bg-darkroom-surface">
              <div className="border-b border-apple-gray-100 bg-apple-gray-50/50 px-5 py-3 dark:border-darkroom-border dark:bg-darkroom-elevated/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-apple-gray-700 dark:text-apple-gray-300">
                    Shot-by-Shot Timeline Conformance · {selectedReel?.name}
                  </h3>
                  <p className="text-[11px] text-apple-gray-400">
                    Synchronized timecodes, active speaker attribution, and SyncNet verification
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="rounded-full bg-cinema-green/10 text-cinema-green px-2.5 py-0.5 text-[11px] font-semibold border border-cinema-green/20">
                    SyncNet Target: &ge; 8.2
                  </span>
                  <button
                    onClick={async () => {
                      if (!selectedReel || !project) return;
                      setIsAnalyzing(true);
                      try {
                        const detected = await videoAnalysisApi.triggerAnalysis(
                          project.id,
                          selectedReel.id,
                          selectedReel.s3MasterUri || 's3://cinema-vault-raw/reel_01.mov',
                          (stg, pct) => {
                            setAnalysisStage(stg);
                            setAnalysisProgress(pct);
                          }
                        );
                        setShots(detected);
                      } finally {
                        setIsAnalyzing(false);
                      }
                    }}
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-apple-blue px-3 py-1.5 text-xs font-semibold text-white shadow-glow-blue hover:bg-apple-blue-hover active:scale-95 disabled:opacity-50 transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{isAnalyzing ? 'Analyzing AI Cuts...' : 'Analyze Reel AI Metadata'}</span>
                  </button>
                </div>
              </div>

              {/* Live AI Analysis Progress Ribbon */}
              {isAnalyzing && (
                <div className="p-4 bg-apple-blue/5 border-b border-apple-blue/15 dark:bg-apple-blue/10 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-semibold text-apple-blue dark:text-blue-400 mb-1.5">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-apple-blue animate-pulse" />
                      <span>{analysisStage}</span>
                    </span>
                    <span className="font-mono">{analysisProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-apple-blue/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-apple-blue rounded-full transition-all duration-300"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-apple-gray-100 bg-apple-gray-50/30 text-[11px] font-semibold text-apple-gray-400 dark:border-darkroom-border dark:bg-darkroom-elevated/20">
                    <tr>
                      <th className="px-5 py-3">Shot #</th>
                      <th className="px-5 py-3">Timecode (In - Out)</th>
                      <th className="px-5 py-3">Active Character</th>
                      <th className="px-5 py-3">SyncNet Confidence</th>
                      <th className="px-5 py-3">Identity SSIM</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-apple-gray-100 dark:divide-darkroom-border/60">
                    {shots.map((shot) => (
                      <tr key={shot.id} className="hover:bg-apple-gray-50/50 dark:hover:bg-darkroom-elevated/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-medium text-apple-gray-900 dark:text-white">
                          #{shot.shotNumber.toString().padStart(3, '0')}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-apple-gray-600 dark:text-apple-gray-300">
                          {shot.timecodeIn} → {shot.timecodeOut} ({shot.durationFrames}f)
                        </td>
                        <td className="px-5 py-3.5 font-medium text-apple-gray-800 dark:text-apple-gray-200">
                          {shot.activeSpeaker}
                        </td>
                        <td className="px-5 py-3.5 font-mono">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 font-semibold dark:bg-emerald-950/40 dark:text-emerald-400">
                            {shot.syncNetConfidence} / 10
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-apple-gray-600 dark:text-apple-gray-300">
                          {(shot.ssimIdentity * 100).toFixed(1)}%
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-apple-blue dark:text-blue-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-apple-blue animate-pulse" />
                            {shot.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Multilingual Transcreation */}
        {activeTab === 'TRANSCREATION' && (
          <div className="space-y-6">
            {/* View Switcher: Dubbing Scripts vs ASR Transcription */}
            <div className="flex items-center justify-between border-b border-apple-gray-200/80 pb-3 dark:border-darkroom-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTranscreationView('DUBBING_SCRIPT')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    transcreationView === 'DUBBING_SCRIPT'
                      ? 'bg-apple-blue text-white shadow-glow-blue'
                      : 'bg-apple-gray-100 text-apple-gray-700 hover:bg-apple-gray-200 dark:bg-darkroom-elevated dark:text-apple-gray-300'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Theatrical Dubbing Scripts & Syllable Timing</span>
                </button>
                <button
                  onClick={() => setTranscreationView('SPEECH_ASR')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    transcreationView === 'SPEECH_ASR'
                      ? 'bg-apple-blue text-white shadow-glow-blue'
                      : 'bg-apple-gray-100 text-apple-gray-700 hover:bg-apple-gray-200 dark:bg-darkroom-elevated dark:text-apple-gray-300'
                  }`}
                >
                  <Mic2 className="h-3.5 w-3.5" />
                  <span>Speech ASR & Phoneme Alignment</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-apple-gray-400">
                  Target: {selectedLangCode} · Syllable Delta &le; &plusmn;1
                </span>
              </div>
            </div>

            {/* Subview 1: Theatrical Dubbing Script Editor (Claude 3.5 Sonnet / Qwen-2.5-72B) */}
            {transcreationView === 'DUBBING_SCRIPT' && (
              <div className="space-y-6">
                {/* Header Action & Model Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-apple-gray-900 dark:text-white">
                        Syllable-Constrained Dubbing Scripts
                      </h3>
                      <span className="rounded-full bg-apple-blue/10 px-2.5 py-0.5 text-[10px] font-semibold text-apple-blue dark:bg-apple-blue/20 dark:text-blue-400">
                        Claude 3.5 Sonnet · Qwen-2.5-72B · Syllable Budgeting
                      </span>
                    </div>
                    <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
                      Context-aware theatrical dialogue adaptation with character relationship dynamics, pronunciation guides (IPA), and bilabial viseme alignment (/p, b, m/).
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Retry on 429 Rate Limit Simulation */}
                    <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl border border-apple-gray-200/80 bg-apple-surface px-2.5 py-1.5 text-[11px] font-medium text-apple-gray-700 hover:border-apple-gray-300 dark:border-darkroom-border dark:bg-darkroom-surface dark:text-apple-gray-300 shadow-2xs">
                      <input
                        type="checkbox"
                        checked={simulateProviderRetry}
                        onChange={(e) => setSimulateProviderRetry(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-apple-gray-300 text-apple-blue focus:ring-apple-blue"
                      />
                      <span>Simulate 429 Retry Recovery</span>
                    </label>

                    {/* Provider 500 Failure Simulation */}
                    <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl border border-apple-gray-200/80 bg-apple-surface px-2.5 py-1.5 text-[11px] font-medium text-apple-gray-700 hover:border-apple-gray-300 dark:border-darkroom-border dark:bg-darkroom-surface dark:text-apple-gray-300 shadow-2xs">
                      <input
                        type="checkbox"
                        checked={simulateProviderFailure}
                        onChange={(e) => setSimulateProviderFailure(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-apple-gray-300 text-apple-blue focus:ring-apple-blue"
                      />
                      <span>Simulate 500 Provider Failure</span>
                    </label>

                    {/* Transcreation Trigger Button */}
                    <button
                      onClick={async () => {
                        if (!selectedReel || !project) return;
                        setIsTranscreating(true);
                        setTranscreationNotification(null);
                        try {
                          const result = await transcreationApi.triggerTranscreation(
                            project.id,
                            selectedReel.id,
                            selectedLangCode,
                            {
                              syllableBudgetTolerance: 1,
                              simulateFailure: simulateProviderFailure,
                              simulateRateLimit: simulateProviderRetry,
                            },
                            (stg, pct) => {
                              setTranscreationStage(stg);
                              setTranscreationProgress(pct);
                            }
                          );
                          setDubbingLines(result.lines);
                          if (result.retryCount > 0) {
                            setTranscreationNotification(
                              `Provider rate limit encountered. Recovered automatically via exponential backoff (Retry attempt 1 succeeded).`
                            );
                          }
                        } catch (err: any) {
                          setTranscreationNotification(`Transcreation Error: ${err.message || 'Provider failure'}`);
                        } finally {
                          setIsTranscreating(false);
                        }
                      }}
                      disabled={isTranscreating}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-apple-blue px-3 py-1.5 text-xs font-semibold text-white shadow-glow-blue hover:bg-apple-blue-hover active:scale-95 disabled:opacity-50 transition-all"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      <span>{isTranscreating ? 'Transcreating Dialogue...' : 'Generate AI Dubbing Script'}</span>
                    </button>
                  </div>
                </div>

                {/* Live Progress Ribbon */}
                {isTranscreating && (
                  <div className="p-4 bg-apple-blue/5 border border-apple-blue/20 rounded-2xl dark:bg-apple-blue/10 animate-fade-in shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-semibold text-apple-blue dark:text-blue-400 mb-1.5">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-apple-blue animate-pulse" />
                        <span>{transcreationStage}</span>
                      </span>
                      <span className="font-mono">{transcreationProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-apple-blue/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-apple-blue rounded-full transition-all duration-300"
                        style={{ width: `${transcreationProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Retry or Failure Notification Banner */}
                {transcreationNotification && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between animate-fade-in ${
                      transcreationNotification.includes('Error')
                        ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-300'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {transcreationNotification.includes('Error') ? (
                        <AlertOctagon className="h-4 w-4 shrink-0 text-rose-600" />
                      ) : (
                        <RefreshCw className="h-4 w-4 shrink-0 text-emerald-600 animate-spin-slow" />
                      )}
                      <span>{transcreationNotification}</span>
                    </div>
                    <button
                      onClick={() => setTranscreationNotification(null)}
                      className="text-[11px] underline opacity-80 hover:opacity-100"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Target Language Selection Tabs */}
                <div className="flex items-center justify-between border-b border-apple-gray-200/80 pb-3 dark:border-darkroom-border">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-apple-gray-400 mr-1">
                      Localization Target:
                    </span>
                    {project.targetLanguages.map((tl) => (
                      <button
                        key={tl.code}
                        onClick={() => setSelectedLangCode(tl.code)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                          selectedLangCode === tl.code
                            ? 'bg-apple-blue text-white shadow-sm font-semibold'
                            : 'bg-apple-gray-100 text-apple-gray-700 hover:bg-apple-gray-200 dark:bg-darkroom-elevated dark:text-apple-gray-300'
                        }`}
                      >
                        <span>{tl.flag}</span>
                        <span>{tl.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Summary Metric Chips */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-md bg-apple-gray-100 dark:bg-darkroom-elevated px-2 py-0.5 font-mono text-[11px] text-apple-gray-600 dark:text-apple-gray-300">
                      {dubbingLines.length} Dub Lines
                    </span>
                    <span className="rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 font-mono text-[11px] font-semibold border border-emerald-200/60">
                      {dubbingLines.filter((l) => l.isApproved).length} Approved
                    </span>
                    <span className="rounded-md bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20 dark:text-blue-300 px-2 py-0.5 font-mono text-[11px] font-semibold">
                      Avg &Delta;: &le; &plusmn;1 Syllable
                    </span>
                  </div>
                </div>

                {/* Dubbing Script Lines List */}
                <div className="space-y-4">
                  {dubbingLines.map((line) => {
                    const isExpanded = expandedDubLineId === line.id;
                    const deltaColor =
                      line.syllableDelta === 0
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : line.syllableDelta <= 1
                        ? 'text-apple-blue bg-apple-blue/10 dark:bg-apple-blue/20 dark:text-blue-400'
                        : 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400';

                    return (
                      <div
                        key={line.id}
                        className={`rounded-2xl border bg-apple-surface shadow-apple-sm transition-all overflow-hidden ${
                          line.isApproved
                            ? 'border-apple-gray-200 dark:border-darkroom-border hover:border-apple-gray-300'
                            : 'border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/20'
                        }`}
                      >
                        {/* Line Top Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-apple-gray-100 bg-apple-gray-50/50 px-4 py-2.5 dark:border-darkroom-border/60 dark:bg-darkroom-elevated/40 text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-[11px] font-bold text-apple-gray-400">
                              {line.id}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-apple-blue/10 px-2 py-0.5 text-xs font-semibold text-apple-blue dark:bg-blue-500/20 dark:text-blue-300">
                              <UserCheck className="h-3 w-3" />
                              <span>{line.characterName}</span>
                            </span>
                            <span className="font-mono text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
                              {line.timecodeIn} &rarr; {line.timecodeOut}
                            </span>
                            <span className="hidden sm:inline-block text-[11px] text-apple-gray-400 italic truncate max-w-xs">
                              {line.characterRelationship}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Dramatic Tone Badge */}
                            <span className="rounded-md bg-cinema-purple/10 text-cinema-purple border border-cinema-purple/20 dark:bg-purple-500/20 dark:text-purple-300 px-2 py-0.5 text-[10px] font-semibold">
                              {line.tone.replace('_', ' ')}
                            </span>

                            {/* Validation Status Badge */}
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                                line.isApproved
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{line.validationStatus}</span>
                            </span>

                            {/* Approval Toggle */}
                            <button
                              onClick={() => {
                                setDubbingLines((prev) =>
                                  prev.map((l) =>
                                    l.id === line.id
                                      ? {
                                          ...l,
                                          isApproved: !l.isApproved,
                                          validationStatus: !l.isApproved ? 'VALIDATED' : 'MANUALLY_EDITED',
                                        }
                                      : l
                                  )
                                );
                              }}
                              className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium transition-all ${
                                line.isApproved
                                  ? 'bg-apple-gray-100 text-apple-gray-600 hover:bg-apple-gray-200 dark:bg-darkroom-elevated dark:text-apple-gray-300'
                                  : 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                              }`}
                            >
                              <CheckCheck className="h-3 w-3" />
                              <span>{line.isApproved ? 'Locked' : 'Approve'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Script Comparison & Syllable Counter Grid */}
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Original Script */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-apple-gray-400">
                              <span>Original English ({project.sourceLanguage.name})</span>
                              <span className="font-mono text-apple-gray-500 font-semibold">
                                {line.sourceSyllables} Syllables
                              </span>
                            </div>
                            <div className="p-3 rounded-xl bg-apple-gray-50 dark:bg-darkroom-elevated/60 text-xs font-medium text-apple-gray-800 dark:text-apple-gray-200 border border-apple-gray-100 dark:border-darkroom-border/40">
                              "{line.sourceText}"
                            </div>
                          </div>

                          {/* Transcreated Dubbing Script */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-apple-gray-400">
                              <span>Transcreated Dubbing Script ({selectedLangCode})</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-apple-gray-500 font-semibold">
                                  {line.targetSyllables} Syllables
                                </span>
                                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${deltaColor}`}>
                                  &Delta; {line.syllableDelta === 0 ? '0' : `&plusmn;${line.syllableDelta}`}
                                </span>
                              </div>
                            </div>
                            <textarea
                              rows={2}
                              value={line.translatedText}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDubbingLines((prev) =>
                                  prev.map((l) =>
                                    l.id === line.id
                                      ? {
                                          ...l,
                                          translatedText: val,
                                          validationStatus: 'MANUALLY_EDITED',
                                        }
                                      : l
                                  )
                                );
                              }}
                              className="w-full p-2.5 rounded-xl border border-apple-gray-200 bg-white text-xs text-apple-gray-900 focus:border-apple-blue focus:ring-1 focus:ring-apple-blue dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-white transition-colors"
                            />
                          </div>
                        </div>

                        {/* Pronunciation & Viseme Drawer Toggle */}
                        <div className="px-4 pb-3">
                          <button
                            onClick={() => setExpandedDubLineId(isExpanded ? null : line.id)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-apple-blue hover:text-apple-blue-hover dark:text-blue-400 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            <span>
                              {isExpanded ? 'Hide' : 'Show'} Voice Actor Pronunciation Guide & Bilabial Visemes ({line.visemeAnchors.length} anchors)
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2.5 p-3.5 rounded-xl bg-apple-gray-50/80 dark:bg-darkroom-elevated/40 border border-apple-gray-100 dark:border-darkroom-border/60 animate-fade-in space-y-3">
                              {/* Pronunciation Guide Chips */}
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-apple-gray-400 block mb-1.5">
                                  Phonetic IPA & Voice Actor Stress Notes:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {line.pronunciationNotes.map((pn, pIdx) => (
                                    <div
                                      key={pIdx}
                                      className="rounded-lg border border-apple-gray-200/80 bg-white px-2.5 py-1.5 shadow-2xs dark:border-darkroom-border dark:bg-darkroom-elevated text-xs"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <strong className="text-apple-gray-900 dark:text-white">{pn.word}</strong>
                                        <span className="font-mono text-apple-blue dark:text-blue-400 text-[11px]">
                                          {pn.ipa}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-apple-gray-500 mt-0.5">
                                        Phonetic: <span className="font-mono">{pn.phoneticSpelling}</span> · Stress: <strong className="text-emerald-600">{pn.stressSyllable}</strong>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Bilabial Lip-Sync Anchors */}
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-apple-gray-400 block mb-1.5">
                                  Bilabial Lip Closures (/p, b, m/) for Neural Lip-Sync:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {line.visemeAnchors.map((va, vIdx) => (
                                    <span
                                      key={vIdx}
                                      className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-mono font-semibold"
                                    >
                                      <span>/{va.phoneme}/</span>
                                      <span>&rarr; Frame #{va.targetFrame}</span>
                                      <span className="opacity-70">(Closure)</span>
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Cultural / Direction Notes */}
                              {line.culturalNotes && (
                                <div className="text-[11px] text-apple-gray-500 italic border-t border-apple-gray-100 dark:border-darkroom-border/60 pt-2">
                                  <strong>Direction Note:</strong> {line.culturalNotes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subview 2: Raw Speech Extraction & Alignment (WhisperX / Demucs) */}
            {transcreationView === 'SPEECH_ASR' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-apple-gray-900 dark:text-white">
                      Dialogue Extraction & Speaker Diarization
                    </h3>
                    <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
                      Demucs v4 vocal stem isolation and WhisperX large-v3 word-level forced alignment.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={async () => {
                        if (!selectedReel || !project) return;
                        setIsProcessingSpeech(true);
                        try {
                          const audioUri = simulateNoise
                            ? 's3://cinema-vault-raw/noisy_take_01.wav'
                            : selectedReel.s3MasterUri || 's3://cinema-vault-raw/reel_01.wav';
                          const results = await speechProcessingApi.triggerSpeechProcessing(
                            project.id,
                            selectedReel.id,
                            audioUri,
                            {
                              characterRoster: [
                                'Commander Elena Vance',
                                'Chief Engineer Kaelen',
                                'Dr. Marcus Thorne',
                              ],
                              denoisePrefilter: true,
                            },
                            (stg, pct) => {
                              setSpeechStage(stg);
                              setSpeechProgress(pct);
                            }
                          );
                          setDialogueSegments(results);
                        } finally {
                          setIsProcessingSpeech(false);
                        }
                      }}
                      disabled={isProcessingSpeech}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-apple-blue px-3 py-1.5 text-xs font-semibold text-white shadow-glow-blue hover:bg-apple-blue-hover active:scale-95 disabled:opacity-50 transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{isProcessingSpeech ? 'Processing ASR...' : 'Extract Audio Dialogue'}</span>
                    </button>
                  </div>
                </div>

                {/* Live Speech Progress Ribbon */}
                {isProcessingSpeech && (
                  <div className="p-4 bg-apple-blue/5 border border-apple-blue/20 rounded-2xl dark:bg-apple-blue/10 animate-fade-in shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-semibold text-apple-blue dark:text-blue-400 mb-1.5">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-apple-blue animate-pulse" />
                        <span>{speechStage}</span>
                      </span>
                      <span className="font-mono">{speechProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-apple-blue/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-apple-blue rounded-full transition-all duration-300"
                        style={{ width: `${speechProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Segments Cards */}
                <div className="space-y-4">
                  {dialogueSegments.map((seg) => {
                    const isExpanded = expandedSegmentId === seg.id;
                    return (
                      <div
                        key={seg.id}
                        className="rounded-2xl border border-apple-gray-200 bg-apple-surface shadow-apple-sm p-4 dark:border-darkroom-border dark:bg-darkroom-surface"
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-apple-gray-400">{seg.id}</span>
                            <span className="text-apple-blue font-semibold">{seg.speakerName}</span>
                            <span className="text-apple-gray-500">
                              {seg.timecodeIn} &rarr; {seg.timecodeOut}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-emerald-600 font-semibold">
                            SNR {seg.snrDb} dB
                          </span>
                        </div>
                        <p className="text-xs text-apple-gray-800 dark:text-apple-gray-200 italic mb-2">
                          "{seg.sourceText}"
                        </p>
                        <button
                          onClick={() => setExpandedSegmentId(isExpanded ? null : seg.id)}
                          className="text-[11px] font-semibold text-apple-blue hover:underline"
                        >
                          {isExpanded ? 'Hide' : 'Show'} Word Timings ({seg.words.length} words)
                        </button>
                        {isExpanded && (
                          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-apple-gray-100 dark:border-darkroom-border">
                            {seg.words.map((w, idx) => (
                              <div
                                key={idx}
                                className="rounded border bg-white dark:bg-darkroom-elevated px-2 py-1 text-[11px]"
                              >
                                <span className="font-bold">{w.word}</span>{' '}
                                <span className="font-mono text-apple-gray-400 text-[10px]">
                                  {w.startTime.toFixed(2)}s - {w.endTime.toFixed(2)}s
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Target Language Verification Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-apple-gray-200/60 dark:border-darkroom-border/60">
              {project.targetLanguages.map((tl) => (
                <div
                  key={tl.code}
                  className="rounded-2xl border border-apple-gray-200 bg-apple-surface p-5 shadow-apple-sm dark:border-darkroom-border dark:bg-darkroom-surface"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{tl.flag}</span>
                      <span className="font-bold text-sm text-apple-gray-900 dark:text-white">
                        {tl.name}
                      </span>
                    </div>
                    <span className="rounded-full bg-apple-blue/10 px-2.5 py-0.5 text-[11px] font-semibold text-apple-blue dark:bg-apple-blue/20 dark:text-blue-400">
                      Syllable Budget: $\Delta \le \pm 1$
                    </span>
                  </div>
                  <div className="space-y-2 text-xs text-apple-gray-600 dark:text-apple-gray-300">
                    <div className="flex justify-between border-b border-apple-gray-100 py-1.5 dark:border-darkroom-border/60">
                      <span>Phonetic BLEU Score:</span>
                      <span className="font-mono font-semibold text-emerald-600">38.4 (Target &ge; 34.0)</span>
                    </div>
                    <div className="flex justify-between border-b border-apple-gray-100 py-1.5 dark:border-darkroom-border/60">
                      <span>chrF++ Morphological Overlap:</span>
                      <span className="font-mono font-semibold text-emerald-600">62.1 (Target &ge; 58.0)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span>Viseme Closure Alignment (/p, b, m/):</span>
                      <span className="font-mono font-semibold text-cinema-green">&plusmn;1 Frame (98.2%)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Tab 3: Voice & Stems */}
        {activeTab === 'VOICE' && (
          <div className="rounded-2xl border border-apple-gray-200 bg-apple-surface p-6 shadow-apple-sm dark:border-darkroom-border dark:bg-darkroom-surface space-y-6">
            <div>
              <h3 className="text-sm font-bold text-apple-gray-900 dark:text-white mb-1">
                Audio Separation & Loudness Normalization
              </h3>
              <p className="text-xs text-apple-gray-500">
                Hybrid Demucs v4 48 kHz stem isolation and ITU-R BS.1770-4 (-24.0 LKFS) broadcast loudness conform.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
              <div className="rounded-xl border border-apple-gray-200 bg-apple-gray-50 p-4 dark:border-darkroom-border dark:bg-darkroom-elevated">
                <span className="text-apple-gray-500">Dialogue Stem</span>
                <div className="text-sm font-bold text-apple-gray-900 dark:text-white mt-1">vocals.wav</div>
                <span className="text-emerald-600 text-[11px] font-semibold">Clean Isolation (SDR 12.4 dB)</span>
              </div>
              <div className="rounded-xl border border-apple-gray-200 bg-apple-gray-50 p-4 dark:border-darkroom-border dark:bg-darkroom-elevated">
                <span className="text-apple-gray-500">Music & Effects (M&E)</span>
                <div className="text-sm font-bold text-apple-gray-900 dark:text-white mt-1">m_and_e.wav</div>
                <span className="text-cinema-green text-[11px] font-semibold">100% Phase Preserved</span>
              </div>
              <div className="rounded-xl border border-apple-gray-200 bg-apple-gray-50 p-4 dark:border-darkroom-border dark:bg-darkroom-elevated">
                <span className="text-apple-gray-500">Integrated Loudness</span>
                <div className="text-sm font-bold text-apple-gray-900 dark:text-white mt-1">
                  {loudnessCalibrated ? '-24.0 LKFS (Conformed)' : '-24.1 LKFS'}
                </div>
                <span className="text-emerald-600 text-[11px] font-semibold">Within ±0.5 dB Tolerance</span>
              </div>
            </div>

            {/* Audio Supervisor Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-apple-gray-200/60 dark:border-darkroom-border/60">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-apple-gray-500">Sound Engineering Clearance:</span>
                {hasPermission('ADJUST_AUDIO_STEMS') ? (
                  <span className="rounded-md bg-cinema-purple/15 px-2 py-0.5 text-[10px] font-bold text-cinema-purple border border-cinema-purple/30 dark:bg-purple-500/20 dark:text-purple-400">
                    Sound Supervisor Authorized
                  </span>
                ) : (
                  <span className="rounded-md bg-apple-gray-200 dark:bg-darkroom-elevated px-2 py-0.5 text-[10px] font-medium text-apple-gray-500">
                    Read-Only (Sound Supervisor or Director Role Required)
                  </span>
                )}
              </div>
              {hasPermission('ADJUST_AUDIO_STEMS') && (
                <button
                  onClick={() => setLoudnessCalibrated((prev) => !prev)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-cinema-purple px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-700 active:scale-95 transition-all"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>{loudnessCalibrated ? 'Reset Loudness Trim' : 'Re-Calibrate LKFS Conformance'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Delivery */}
        {activeTab === 'DELIVERY' && (
          <div className="rounded-2xl border border-apple-gray-200 bg-apple-surface p-6 shadow-apple-sm dark:border-darkroom-border dark:bg-darkroom-surface space-y-4">
            <h3 className="text-sm font-bold text-apple-gray-900 dark:text-white">
              Theatrical Package & Provenance Manifest
            </h3>
            <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <div>
                <span className="font-bold">C2PA Cryptographic Signature Valid (ECC NIST P-256)</span>
                <p className="text-[11px] mt-0.5 text-emerald-600 dark:text-emerald-300">
                  Master reels are cryptographically bound with actor likeness consent and tamper-proof manifest metadata.
                </p>
              </div>
            </div>

            {/* Role-Gated Master Sign-Off Control */}
            {hasPermission('SIGN_C2PA_MASTER') ? (
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-apple-gray-50 dark:bg-darkroom-elevated p-4 rounded-xl border border-apple-gray-200 dark:border-darkroom-border">
                <div>
                  <span className="text-xs font-bold text-apple-gray-900 dark:text-white">
                    Supervising Director Authorization
                  </span>
                  <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
                    Apply immutable theatrical seal for SMPTE ST 2067-2 IMF / DCI packaging.
                  </p>
                </div>
                <button
                  onClick={() => setC2paSigned((prev) => !prev)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-glow-blue transition-all ${
                    c2paSigned
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-apple-blue hover:bg-apple-blue-hover active:scale-95'
                  }`}
                >
                  <FileCheck2 className="h-4 w-4" />
                  <span>{c2paSigned ? 'C2PA Theatrical Seal Applied (DCP Ready)' : 'Authorize & Sign C2PA Master Manifest'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-400">
                <Lock className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Director Sign-Off Required for Theatrical C2PA Seal</span>
                  <p className="text-[11px] mt-0.5 text-amber-600 dark:text-amber-300">
                    Current active persona: <strong className="font-semibold">{user?.name || 'Guest'}</strong> ({user?.title || 'Unauthenticated'}). Only the Supervising Director role possesses cryptographic authority to seal actor likeness and voice synthesis distribution masters.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Theatrical Dual-Viewport Cinema Player Modal */}
      {project && (
        <CinemaPlayerModal
          project={project}
          isOpen={isPlayerOpen}
          onClose={() => setIsPlayerOpen(false)}
        />
      )}

      {/* S3 Direct Multipart Master Media Ingest Modal */}
      {project && (
        <MediaIngestModal
          isOpen={isIngestOpen}
          onClose={() => setIsIngestOpen(false)}
          projectId={project.id}
          projectTitle={project.title}
          onReelIngested={(newReel) => {
            setProject({
              ...project,
              reels: [...project.reels, newReel],
            });
            setSelectedReel(newReel);
          }}
        />
      )}
    </div>
  );
};
