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
} from 'lucide-react';
import { FilmProject, Reel, Shot } from '../types/project';
import { projectsApi } from '../lib/api';
import { CinemaPlayerModal } from '../components/player/CinemaPlayerModal';

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
              <div className="border-b border-apple-gray-100 bg-apple-gray-50/50 px-5 py-3 dark:border-darkroom-border dark:bg-darkroom-elevated/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-apple-gray-700 dark:text-apple-gray-300">
                    Shot-by-Shot Timeline Conformance · {selectedReel?.name}
                  </h3>
                  <p className="text-[11px] text-apple-gray-400">
                    Synchronized timecodes, active speaker attribution, and SyncNet verification
                  </p>
                </div>
                <span className="rounded-full bg-cinema-green/10 text-cinema-green px-2.5 py-0.5 text-[11px] font-semibold border border-cinema-green/20">
                  SyncNet Benchmark: $\ge 8.2$
                </span>
              </div>

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
                    {MOCK_SHOTS.map((shot) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="text-sm font-bold text-apple-gray-900 dark:text-white mt-1">-24.1 LKFS</div>
                <span className="text-emerald-600 text-[11px] font-semibold">Within &plusmn;0.5 dB Tolerance</span>
              </div>
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
    </div>
  );
};
