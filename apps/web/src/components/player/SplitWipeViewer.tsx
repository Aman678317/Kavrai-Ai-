import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Columns, SplitSquareVertical, Eye, Sparkles } from 'lucide-react';
import { AspectRatio } from '../../types/project';

export type ViewMode = 'SPLIT' | 'SIDE_BY_SIDE' | 'ORIGINAL' | 'LOCALIZED';

interface SplitWipeViewerProps {
  originalMediaUrl: string;
  localizedMediaUrl: string;
  aspectRatio: AspectRatio;
  syncNetScore: number;
  ssimIdentity: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const SplitWipeViewer: React.FC<SplitWipeViewerProps> = ({
  originalMediaUrl,
  localizedMediaUrl,
  aspectRatio,
  syncNetScore,
  ssimIdentity,
  viewMode,
  onViewModeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitPosition, setSplitPosition] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSplitPosition(percent);
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Aspect ratio class mapping
  const aspectClass =
    aspectRatio === '2.39:1'
      ? 'aspect-[2.39/1]'
      : aspectRatio === '1.85:1'
      ? 'aspect-[1.85/1]'
      : 'aspect-[16/9]';

  return (
    <div className="flex flex-col space-y-3">
      {/* Viewport Mode Bar */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-md">
          <button
            onClick={() => onViewModeChange('SPLIT')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              viewMode === 'SPLIT'
                ? 'bg-apple-blue text-white shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <SplitSquareVertical className="h-3.5 w-3.5" />
            <span>Split-Wipe</span>
          </button>
          <button
            onClick={() => onViewModeChange('SIDE_BY_SIDE')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              viewMode === 'SIDE_BY_SIDE'
                ? 'bg-apple-blue text-white shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Side-by-Side</span>
          </button>
          <button
            onClick={() => onViewModeChange('ORIGINAL')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              viewMode === 'ORIGINAL'
                ? 'bg-apple-blue text-white shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Original (A)</span>
          </button>
          <button
            onClick={() => onViewModeChange('LOCALIZED')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              viewMode === 'LOCALIZED'
                ? 'bg-apple-blue text-white shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-cinema-gold" />
            <span>Localized (B)</span>
          </button>
        </div>

        {/* Live Quality Meters Overlay */}
        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px]">
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-white/90">
            SyncNet: <strong className="text-emerald-400">{syncNetScore.toFixed(1)}</strong>/10
          </span>
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-white/90">
            Identity: <strong className="text-cyan-400">{(ssimIdentity * 100).toFixed(1)}%</strong>
          </span>
        </div>
      </div>

      {/* Main Screen Container */}
      {viewMode === 'SIDE_BY_SIDE' ? (
        <div className="grid grid-cols-2 gap-3">
          {/* Left Screen: Original */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black aspect-[16/9]">
            <img src={originalMediaUrl} alt="Original Stream" className="h-full w-full object-cover" />
            <span className="absolute top-3 left-3 rounded-md bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-white/80">
              ORIGINAL (EN)
            </span>
          </div>
          {/* Right Screen: Localized */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black aspect-[16/9]">
            <img src={localizedMediaUrl} alt="Localized Stream" className="h-full w-full object-cover" />
            <span className="absolute top-3 right-3 rounded-md bg-apple-blue/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-white font-semibold">
              LOCALIZED (ES) · SYNCED
            </span>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className={`relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black select-none shadow-2xl ${aspectClass}`}
        >
          {/* Stream A: Original Footage (Underneath) */}
          {(viewMode === 'SPLIT' || viewMode === 'ORIGINAL') && (
            <div className="absolute inset-0">
              <img
                src={originalMediaUrl}
                alt="Original Stream"
                className="h-full w-full object-cover pointer-events-none"
              />
              <span className="absolute top-4 left-4 z-10 rounded-md bg-black/70 backdrop-blur-md px-2.5 py-1 text-xs font-mono font-semibold text-white/80">
                A · ORIGINAL REFERENCE
              </span>
            </div>
          )}

          {/* Stream B: Localized Neural Output (Overlaid with CSS Clip-Path) */}
          {(viewMode === 'SPLIT' || viewMode === 'LOCALIZED') && (
            <div
              className="absolute inset-0 transition-none"
              style={{
                clipPath:
                  viewMode === 'SPLIT'
                    ? `inset(0px 0px 0px ${splitPosition}%)`
                    : 'none',
              }}
            >
              <img
                src={localizedMediaUrl}
                alt="Localized Neural Output"
                className="h-full w-full object-cover pointer-events-none"
              />
              <span className="absolute top-4 right-4 z-10 rounded-md bg-apple-blue/80 backdrop-blur-md px-2.5 py-1 text-xs font-mono font-semibold text-white shadow-glow-blue">
                B · NEURAL LIP-SYNC LOCALIZED
              </span>
            </div>
          )}

          {/* Interactive Split-Wipe Divider */}
          {viewMode === 'SPLIT' && (
            <div
              onPointerDown={handlePointerDown}
              className="absolute inset-y-0 z-20 cursor-ew-resize flex items-center justify-center -ml-3 w-6 group touch-none"
              style={{ left: `${splitPosition}%` }}
            >
              {/* Vertical line indicator */}
              <div className="h-full w-0.5 bg-white shadow-glow-blue group-hover:w-1 group-active:w-1 transition-all" />

              {/* Central Grab Handle */}
              <div className="absolute flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/70 backdrop-blur-md text-white shadow-2xl transition-transform group-hover:scale-110 group-active:scale-95">
                <div className="flex gap-0.5">
                  <div className="h-3 w-0.5 bg-white/80 rounded-full" />
                  <div className="h-3 w-0.5 bg-white/80 rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
