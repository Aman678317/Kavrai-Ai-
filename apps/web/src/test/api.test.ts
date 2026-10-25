import { describe, it, expect, beforeEach } from 'vitest';
import { projectsApi, speechProcessingApi, transcreationApi, dubbingApi } from '../lib/api';

describe('Cinema Projects API & State Engine', () => {
  beforeEach(async () => {
    // Reset to demo projects before each test
    await projectsApi.resetDemoData();
  });

  it('retrieves pre-seeded reference 4K cinema projects', async () => {
    const projects = await projectsApi.getProjects();
    expect(projects).toBeDefined();
    expect(projects.length).toBeGreaterThanOrEqual(2);

    const first = projects[0];
    expect(first.title).toBe('Echoes of Eternity');
    expect(first.aspectRatio).toBe('2.39:1');
    expect(first.targetLoudnessLkfs).toBe(-24.0);
    expect(first.targetLanguages.length).toBeGreaterThanOrEqual(3);
  });

  it('fetches a single project by ID correctly', async () => {
    const project = await projectsApi.getProjectById('proj-cinema-001');
    expect(project).not.toBeNull();
    expect(project?.id).toBe('proj-cinema-001');
    expect(project?.director).toBe('Denis Villeneuve');
    expect(project?.reels.length).toBe(6);
  });

  it('returns null when querying non-existent project ID', async () => {
    const project = await projectsApi.getProjectById('non-existent-id-999');
    expect(project).toBeNull();
  });

  it('creates a new cinema localization project with configured metadata', async () => {
    const newProject = await projectsApi.createProject({
      title: 'Dune: The Sisterhood',
      director: 'Johan Renck',
      studio: 'Warner Bros. Discovery',
      description: 'Origins of the Bene Gesserit order in deep space.',
      sourceLanguageCode: 'en-US',
      targetLanguageCodes: ['es-ES', 'fr-FR', 'ja-JP'],
      aspectRatio: '2.39:1',
      frameRate: 24.0,
      targetLoudnessLkfs: -24.0,
      colorSpace: 'ACEScg (SMPTE ST 2065-1)',
    });

    expect(newProject.id).toMatch(/^proj-/);
    expect(newProject.title).toBe('Dune: The Sisterhood');
    expect(newProject.status).toBe('INGESTING');
    expect(newProject.targetLanguages).toHaveLength(3);
    expect(newProject.reels.length).toBe(4);

    const all = await projectsApi.getProjects();
    const found = all.find((p) => p.id === newProject.id);
    expect(found).toBeDefined();
  });

  it('deletes an existing project successfully', async () => {
    const initial = await projectsApi.getProjects();
    const targetId = initial[0].id;

    const result = await projectsApi.deleteProject(targetId);
    expect(result).toBe(true);

    const after = await projectsApi.getProjects();
    expect(after.find((p) => p.id === targetId)).toBeUndefined();
    expect(after.length).toBe(initial.length - 1);
  });

  it('computes aggregated studio metrics with SyncNet and runtime totals', async () => {
    const metrics = await projectsApi.getMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.totalProjects).toBeGreaterThanOrEqual(2);
    expect(metrics.averageSyncNetConfidence).toBeGreaterThanOrEqual(8.2); // Cinema broadcast specification
    expect(metrics.totalProcessedRuntimeHours).toBeGreaterThan(0);
    expect(metrics.localizedLanguagesCount).toBeGreaterThan(0);
  });
});

describe('AI Speech Processing API Client', () => {
  it('triggers speech processing and returns word-level forced alignment with speaker turns', async () => {
    const stages: string[] = [];
    const segments = await speechProcessingApi.triggerSpeechProcessing(
      'proj_test',
      'reel_test',
      's3://cinema-vault-raw/scene01_dialogue.wav',
      {
        characterRoster: ['Commander Elena Vance', 'Chief Engineer Kaelen'],
        denoisePrefilter: true,
      },
      (stage, pct) => {
        stages.push(stage);
        expect(pct).toBeGreaterThanOrEqual(0);
        expect(pct).toBeLessThanOrEqual(100);
      }
    );

    expect(segments.length).toBeGreaterThanOrEqual(3);
    expect(stages.length).toBeGreaterThanOrEqual(4);

    const first = segments[0];
    expect(first.speakerName).toBe('Commander Elena Vance');
    expect(first.timecodeIn).toMatch(/^\d{2}:\d{2}:\d{2}:\d{2}$/);
    expect(first.timecodeOut).toMatch(/^\d{2}:\d{2}:\d{2}:\d{2}$/);
    expect(first.detectedLanguage).toBe('en-US');
    expect(first.languageConfidence).toBeGreaterThanOrEqual(0.98);
    expect(first.words.length).toBeGreaterThan(0);
    expect(first.words[0].startTime).toBeLessThan(first.words[0].endTime);
    expect(first.snrDb).toBeGreaterThanOrEqual(12.0);
    expect(first.needsReview).toBe(false);
  });

  it('detects noisy audio takes and flags manual review with low SNR', async () => {
    const segments = await speechProcessingApi.triggerSpeechProcessing(
      'proj_test',
      'reel_noisy',
      's3://cinema-vault-raw/noisy_take_low_snr.wav'
    );

    expect(segments.length).toBeGreaterThan(0);
    expect(segments.every((s) => s.needsReview)).toBe(true);
    expect(segments.every((s) => s.snrDb < 3.0)).toBe(true);
    expect(segments[0].audioQuality).toContain('LOW_SNR');
  });
});

describe('Multilingual Dialogue Transcreation & Dubbing Script API', () => {
  it('generates theatrical dubbing scripts with syllable budget enforcement and pronunciation notes', async () => {
    const stages: string[] = [];
    const result = await transcreationApi.triggerTranscreation(
      'proj_trans_test',
      'reel_trans_test',
      'es-ES',
      { syllableBudgetTolerance: 1 },
      (stage, pct) => {
        stages.push(stage);
        expect(pct).toBeGreaterThanOrEqual(0);
        expect(pct).toBeLessThanOrEqual(100);
      }
    );

    expect(result.lines.length).toBeGreaterThanOrEqual(3);
    expect(stages.length).toBeGreaterThanOrEqual(4);
    expect(result.retryCount).toBe(0);

    const first = result.lines[0];
    expect(first.characterName).toBe('Commander Elena Vance');
    expect(first.tone).toBe('URGENT_COMMAND');
    expect(first.timecodeIn).toMatch(/^\d{2}:\d{2}:\d{2}:\d{2}$/);
    expect(first.timecodeOut).toMatch(/^\d{2}:\d{2}:\d{2}:\d{2}$/);
    // Syllable delta constraint: Delta <= 1
    expect(first.syllableDelta).toBeLessThanOrEqual(1);
    expect(first.validationStatus).toBe('VALIDATED');
    expect(first.isApproved).toBe(true);

    // Viseme bilabial anchors
    expect(first.visemeAnchors.length).toBeGreaterThan(0);
    expect(first.visemeAnchors.every((v) => ['p', 'b', 'm'].includes(v.phoneme))).toBe(true);

    // Pronunciation notes
    expect(first.pronunciationNotes.length).toBeGreaterThan(0);
    expect(first.pronunciationNotes[0].ipa).toBeDefined();
    expect(first.pronunciationNotes[0].stressSyllable).toBeDefined();
  });

  it('recovers automatically via exponential backoff retry on simulated rate limits (429)', async () => {
    const result = await transcreationApi.triggerTranscreation(
      'proj_trans_retry',
      'reel_trans_retry',
      'es-ES',
      { simulateRateLimit: true }
    );

    expect(result.lines.length).toBeGreaterThan(0);
    expect(result.retryCount).toBeGreaterThanOrEqual(1);
    expect(result.lines[0].validationStatus).toBe('VALIDATED');
  });

  it('handles persistent provider failures gracefully by throwing informative error', async () => {
    await expect(
      transcreationApi.triggerTranscreation(
        'proj_trans_fail',
        'reel_trans_fail',
        'es-ES',
        { simulateFailure: true }
      )
    ).rejects.toThrow('LLM Provider Failure: Persistent 500');
  });

  it('updates dubbing script line text and approval validation status', async () => {
    const updated = await transcreationApi.updateDubbingScriptLine('dub-reel_01-001', {
      translatedText: 'Trayectoria confirmada con máxima precisión.',
      isApproved: true,
    });

    expect(updated.id).toBe('dub-reel_01-001');
    expect(updated.translatedText).toBe('Trayectoria confirmada con máxima precisión.');
    expect(updated.validationStatus).toBe('VALIDATED');
  });
});

describe('Modular Dubbing & Voice Synthesis Engine API', () => {
  it('retrieves certified character voice profiles with SAG-AFTRA authorization', async () => {
    const profiles = await dubbingApi.getVoiceProfiles();
    expect(profiles).toBeDefined();
    expect(profiles.length).toBeGreaterThanOrEqual(3);

    const elena = profiles.find((p) => p.characterId === 'char_elena');
    expect(elena).toBeDefined();
    expect(elena?.isAuthorized).toBe(true);
    expect(elena?.authorizationConsentId).toBe('SAG-AFTRA-EV-2026-9941');
    expect(elena?.primaryModel).toContain('CosyVoice 2');
    expect(elena?.licenseType).toBe('APACHE_2_0');
  });

  it('synthesizes reel dubbing audio with WSOLA duration alignment and -24.0 LKFS loudness', async () => {
    const job = await dubbingApi.triggerDubbingSynthesis('reel_test_01', {
      speakingRate: 1.0,
      defaultEmotion: 'URGENT_COMMAND',
      targetLanguage: 'es-ES',
    });

    expect(job).toBeDefined();
    expect(job.status).toBe('COMPLETED');
    expect(job.stage).toBe('COMPLETED');
    expect(job.progressPercent).toBe(100);
    expect(job.audioLines.length).toBe(3);

    // Verify broadcast loudness & peak constraints
    expect(job.averageLoudnessLkfs).toBe(-24.0);
    expect(job.averageSnrDb).toBeGreaterThanOrEqual(25.0);

    // Verify WSOLA time-stretch metadata
    const lineWithStretch = job.audioLines.find((l) => l.wsolaApplied);
    expect(lineWithStretch).toBeDefined();
    expect(lineWithStretch?.conformedDurationSeconds).toBe(lineWithStretch?.targetDurationSeconds);
    expect(lineWithStretch?.loudnessLkfs).toBe(-24.0);
  });

  it('enforces closed-gate security on uncertified voice models without SAG-AFTRA consent', async () => {
    await expect(
      dubbingApi.triggerDubbingSynthesis('reel_security_test', {
        simulateUncertifiedVoice: true,
      })
    ).rejects.toThrow('Voice authorization failed: SAG-AFTRA consent token');
  });

  it('ingests and conforms human ADR audio takes with duration and quality validation', async () => {
    const humanLine = await dubbingApi.uploadHumanAudioTake('dub-audio-001', {
      name: 'human_elena_take01.wav',
      size: 1024 * 1024 * 3.5,
      durationSeconds: 3.55,
    });

    expect(humanLine).toBeDefined();
    expect(humanLine.isHumanAudio).toBe(true);
    expect(humanLine.licenseType).toBe('HUMAN_PERFORMER');
    expect(humanLine.loudnessLkfs).toBe(-24.0);
    expect(humanLine.snrDb).toBeGreaterThanOrEqual(25.0);
    expect(humanLine.conformanceStatus).toBe('CONFORMED');
  });
});


