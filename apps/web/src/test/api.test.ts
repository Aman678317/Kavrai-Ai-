import { describe, it, expect, beforeEach } from 'vitest';
import { projectsApi } from '../lib/api';

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
