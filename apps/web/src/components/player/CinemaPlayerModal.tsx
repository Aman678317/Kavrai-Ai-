import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Sliders,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';
import { FilmProject } from '../../types/project';
import { SplitWipeViewer, ViewMode } from './SplitWipeViewer';
import { TimelineScrubber } from './TimelineScrubber';
import { secondsToTimecode } from '../../lib/timecode';

interface CinemaPlayerModalProps {
  project: FilmProject;
  isOpen: boolean;
  onClose: () => void;
}

export const CinemaPlayerModal: React.FC<CinemaPlayerModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const [currentTime, setCurrentTime] = useState<number>(14.5); // Start mid-reel
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<ViewMode>('SPLIT');
  const animationFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());

  const duration = 60.0; // 60-second reference scene
  const fps = project.frameRate || 24.0;
  const frameDuration = 1.0 / fps;

  // Media URLs
  const originalMediaUrl = project.posterUrl;
  const localizedMediaUrl =
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop';

  // Keyboard shortcut handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setIsPlaying(false);
          setCurrentTime((prev) => Math.max(0, prev - frameDuration));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setIsPlaying(false);
          setCurrentTime((prev) => Math.min(duration, prev + frameDuration));
          break;
        case 'KeyK':
          e.preventDefault();
          setIsPlaying(false);
          setPlaybackRate(1.0);
          break;
        case 'KeyJ':
          e.preventDefault();
          setIsPlaying(true);
          setPlaybackRate(-2.0);
          break;
        case 'KeyL':
          e.preventDefault();
          setIsPlaying(true);
          setPlaybackRate(2.0);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, frameDuration, duration, onClose]);

  // Playback tick loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const deltaSec = (now - lastTickRef.current) / 1000.0;
      lastTickRef.current = now;

      setCurrentTime((prev) => {
        let next = prev + deltaSec * playbackRate;
        if (next >= duration) {
          next = 0; // loop
        } else if (next < 0) {
          next = duration;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackRate, duration]);

  const handleSeek = (newSeconds: number) => {
    setCurrentTime(Math.max(0, Math.min(duration, newSeconds)));
  };

  const stepFrame = (deltaFrames: number) => {
    setIsPlaying(false);
    setCurrentTime((prev) => Math.max(0, Math.min(duration, prev + deltaFrames * frameDuration)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0D0E12] text-white select-none animate-in fade-in duration-200">
      {/* Top Studio Bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6 bg-black/40">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-apple-blue px-2 py-0.5 text-xs font-bold text-white shadow-glow-blue">
            A/B QC
          </span>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>{project.title}</span>
              <span className="text-white/40">·</span>
              <span className="text-xs text-white/60 font-normal">Reel 01 (Shot #103)</span>
            </h2>
          </div>
        </div>

        {/* Specs Badges */}
        <div className="hidden md:flex items-center gap-3 text-xs font-mono text-white/60">
          <span className="rounded bg-white/5 px-2 py-0.5">{project.aspectRatio}</span>
          <span className="rounded bg-white/5 px-2 py-0.5">{fps} FPS</span>
          <span className="rounded bg-white/5 px-2 py-0.5 text-emerald-400">
            -24.1 LKFS (BS.1770-4)
          </span>
          <span className="rounded bg-white/5 px-2 py-0.5 text-cinema-gold">ACEScg</span>
        </div>

        <button
          onClick={onClose}
          className="rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close A/B Player (Esc)"
          title="Exit A/B Player (Esc)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Center Viewport */}
      <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col justify-center max-w-6xl mx-auto w-full">
        <SplitWipeViewer
          originalMediaUrl={originalMediaUrl}
          localizedMediaUrl={localizedMediaUrl}
          aspectRatio={project.aspectRatio}
          syncNetScore={8.8}
          ssimIdentity={0.995}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Bottom Control Deck & Timeline */}
      <div className="shrink-0 border-t border-white/10 bg-black/60 p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-4">
        {/* Timeline Scrubber */}
        <TimelineScrubber
          currentTime={currentTime}
          duration={duration}
          fps={fps}
          onSeek={handleSeek}
        />

        {/* Transport Bar & Shortcuts */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          {/* Left: SMPTE Readout */}
          <div className="font-mono text-sm tracking-wider text-white font-bold bg-white/5 rounded-xl px-3 py-1.5 border border-white/10">
            {secondsToTimecode(currentTime, fps)}
          </div>

          {/* Center: Playback Transport Buttons */}
          <div className="flex items-center gap-2">
            {/* Step Back 1 Frame */}
            <button
              onClick={() => stepFrame(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white active:scale-95 transition-all"
              title="Step backward 1 frame (←)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Shuttle Reverse 2x */}
            <button
              onClick={() => {
                setIsPlaying(true);
                setPlaybackRate(-2.0);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white active:scale-95 transition-all"
              title="Shuttle reverse 2x (J)"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-apple-blue text-white shadow-glow-blue hover:bg-apple-blue-hover active:scale-95 transition-all"
              title="Play / Pause (Space)"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-white" />
              ) : (
                <Play className="h-5 w-5 fill-white ml-0.5" />
              )}
            </button>

            {/* Shuttle Forward 2x */}
            <button
              onClick={() => {
                setIsPlaying(true);
                setPlaybackRate(2.0);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white active:scale-95 transition-all"
              title="Shuttle forward 2x (L)"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            {/* Step Forward 1 Frame */}
            <button
              onClick={() => stepFrame(1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white active:scale-95 transition-all"
              title="Step forward 1 frame (→)"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Right: Keyboard Shortcuts Hint */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-white/40 font-mono">
            <span>[Space] Play</span>
            <span>·</span>
            <span>[J/K/L] Shuttle</span>
            <span>·</span>
            <span>[← / →] Step Frame</span>
          </div>
        </div>
      </div>
    </div>
  );
};
