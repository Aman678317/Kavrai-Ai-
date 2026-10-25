import React, { useRef, useCallback } from 'react';
import { secondsToTimecode } from '../../lib/timecode';

interface TimelineScrubberProps {
  currentTime: number; // in seconds
  duration: number;    // in seconds
  fps: number;
  onSeek: (seconds: number) => void;
  shotCutPoints?: number[]; // array of cut points in seconds
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentTime,
  duration,
  fps,
  onSeek,
  shotCutPoints = [0, 8.5, 17.2, 26.8, 38.0, 48.5, 60.0],
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const calculateSeekTime = useCallback(
    (clientX: number) => {
      if (!trackRef.current || duration <= 0) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const ratio = x / rect.width;
      return ratio * duration;
    },
    [duration]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const newTime = calculateSeekTime(e.clientX);
    onSeek(newTime);

    const handlePointerMove = (ev: PointerEvent) => {
      const draggedTime = calculateSeekTime(ev.clientX);
      onSeek(draggedTime);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col space-y-1.5 select-none text-xs">
      {/* Timecode Ruler & Progress Bar */}
      <div className="flex items-center justify-between font-mono text-[11px] text-white/50 px-1">
        <span>{secondsToTimecode(currentTime, fps)}</span>
        <span className="text-white/30 text-[10px]">
          SMPTE TIMELINE · {fps} FPS
        </span>
        <span>{secondsToTimecode(duration, fps)}</span>
      </div>

      {/* Main Scrubber Track */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        className="relative h-14 w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-darkroom-elevated touch-none"
      >
        {/* Synthetic Audio Waveform Display */}
        <div className="absolute inset-0 flex items-center justify-between px-1 gap-0.5 opacity-30 pointer-events-none">
          {Array.from({ length: 64 }).map((_, i) => {
            // Generate stable pseudo-random waveform height
            const seed = Math.sin(i * 0.7) * 0.5 + 0.5;
            const heightPercent = 20 + Math.floor(seed * 70);
            return (
              <div
                key={i}
                className="w-full bg-cyan-400 rounded-full"
                style={{ height: `${heightPercent}%` }}
              />
            );
          })}
        </div>

        {/* Shot Cut Boundaries */}
        {shotCutPoints.map((cutPoint, idx) => {
          if (cutPoint <= 0 || cutPoint >= duration) return null;
          const leftPercent = (cutPoint / duration) * 100;
          return (
            <div
              key={idx}
              className="absolute inset-y-0 w-0.5 bg-yellow-400/40 pointer-events-none"
              style={{ left: `${leftPercent}%` }}
              title={`Shot Transition @ ${cutPoint}s`}
            >
              <div className="h-1.5 w-1.5 -ml-0.5 bg-yellow-400 rounded-full" />
            </div>
          );
        })}

        {/* Elapsed Progress Tint */}
        <div
          className="absolute inset-y-0 left-0 bg-apple-blue/15 border-r border-apple-blue/50 pointer-events-none"
          style={{ width: `${currentPercent}%` }}
        />

        {/* Draggable Playhead Scrubber */}
        <div
          className="absolute inset-y-0 z-30 pointer-events-none -ml-1.5 flex flex-col items-center"
          style={{ left: `${currentPercent}%` }}
        >
          {/* Head Handle */}
          <div className="h-3 w-3 rounded-full bg-apple-blue border-2 border-white shadow-glow-blue" />
          {/* Vertical Needle */}
          <div className="h-full w-0.5 bg-apple-blue" />
        </div>
      </div>
    </div>
  );
};
