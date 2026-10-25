import { describe, it, expect } from 'vitest';
import {
  padZero,
  framesToTimecode,
  secondsToTimecode,
  timecodeToFrames,
  formatDuration,
} from '../lib/timecode';

describe('SMPTE Timecode & Cinema Math', () => {
  it('pads single digits with leading zeros', () => {
    expect(padZero(5)).toBe('05');
    expect(padZero(0)).toBe('00');
    expect(padZero(14)).toBe('14');
    expect(padZero(3, 3)).toBe('003');
    expect(padZero(-2)).toBe('00');
  });

  it('converts frame counts to SMPTE timecode at 24 fps', () => {
    expect(framesToTimecode(0, 24)).toBe('00:00:00:00');
    expect(framesToTimecode(12, 24)).toBe('00:00:00:12');
    expect(framesToTimecode(24, 24)).toBe('00:00:01:00');
    expect(framesToTimecode(25, 24)).toBe('00:00:01:01');
    // 1 minute = 60 * 24 = 1440 frames
    expect(framesToTimecode(1440, 24)).toBe('00:01:00:00');
    // 1 hour = 3600 * 24 = 86400 frames
    expect(framesToTimecode(86400, 24)).toBe('01:00:00:00');
  });

  it('converts seconds to SMPTE timecode accurately', () => {
    expect(secondsToTimecode(0, 24)).toBe('00:00:00:00');
    expect(secondsToTimecode(1.0, 24)).toBe('00:00:01:00');
    expect(secondsToTimecode(1.5, 24)).toBe('00:00:01:12');
    expect(secondsToTimecode(65.25, 24)).toBe('00:01:05:06');
    expect(secondsToTimecode(-5, 24)).toBe('00:00:00:00');
  });

  it('parses SMPTE timecode back to frame counts', () => {
    expect(timecodeToFrames('00:00:00:00', 24)).toBe(0);
    expect(timecodeToFrames('00:00:01:00', 24)).toBe(24);
    expect(timecodeToFrames('00:01:00:00', 24)).toBe(1440);
    expect(timecodeToFrames('01:04:12:00', 24)).toBe((3600 + 4 * 60 + 12) * 24);
    // Invalid timecode format fallback
    expect(timecodeToFrames('invalid', 24)).toBe(0);
    expect(timecodeToFrames('00:00:00', 24)).toBe(0);
  });

  it('supports round-trip conversion between timecode and frames', () => {
    const originalTimecode = '01:24:36:18';
    const frames = timecodeToFrames(originalTimecode, 24);
    const roundTripped = framesToTimecode(frames, 24);
    expect(roundTripped).toBe(originalTimecode);
  });

  it('formats duration in clean MM:SS format', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(45)).toBe('00:45');
    expect(formatDuration(60)).toBe('01:00');
    expect(formatDuration(125)).toBe('02:05');
    expect(formatDuration(3670)).toBe('61:10');
    expect(formatDuration(-10)).toBe('00:00');
  });
});
