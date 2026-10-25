/**
 * SMPTE Timecode & Cinema Frame Math Utilities
 * Supports 24.0, 23.976, 25.0, 29.97, and 30.0 fps.
 */

export function padZero(num: number, length: number = 2): string {
  return Math.floor(Math.max(0, num)).toString().padStart(length, '0');
}

/**
 * Convert frame count to SMPTE timecode string (HH:MM:SS:FF)
 */
export function framesToTimecode(totalFrames: number, fps: number = 24.0): string {
  const frames = Math.max(0, Math.floor(totalFrames));
  const roundedFps = Math.round(fps);

  const ff = frames % roundedFps;
  const totalSeconds = Math.floor(frames / roundedFps);
  const ss = totalSeconds % 60;
  const mm = Math.floor(totalSeconds / 60) % 60;
  const hh = Math.floor(totalSeconds / 3600);

  return `${padZero(hh)}:${padZero(mm)}:${padZero(ss)}:${padZero(ff)}`;
}

/**
 * Convert floating-point seconds to SMPTE timecode string (HH:MM:SS:FF)
 */
export function secondsToTimecode(seconds: number, fps: number = 24.0): string {
  const totalFrames = Math.floor(Math.max(0, seconds) * fps);
  return framesToTimecode(totalFrames, fps);
}

/**
 * Parse SMPTE timecode string (HH:MM:SS:FF) to frame count
 */
export function timecodeToFrames(timecode: string, fps: number = 24.0): number {
  const parts = timecode.split(':').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(isNaN)) {
    return 0;
  }
  const [hh, mm, ss, ff] = parts;
  const roundedFps = Math.round(fps);
  return (hh * 3600 + mm * 60 + ss) * roundedFps + ff;
}

/**
 * Format total duration in clean MM:SS
 */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${padZero(mm)}:${padZero(ss)}`;
}
