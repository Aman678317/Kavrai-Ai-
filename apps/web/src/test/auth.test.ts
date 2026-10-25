import { describe, it, expect } from 'vitest';
import {
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  STUDIO_PERSONAS,
  StudioRole,
  Permission,
} from '../types/auth';

describe('Studio Authentication & RBAC Engine', () => {
  it('defines the 4 key theatrical studio personas', () => {
    expect(STUDIO_PERSONAS).toHaveLength(4);

    const director = STUDIO_PERSONAS.find((p) => p.role === 'DIRECTOR');
    expect(director).toBeDefined();
    expect(director?.name).toBe('Elena Vance');
    expect(director?.token).toContain('director');

    const soundSup = STUDIO_PERSONAS.find((p) => p.role === 'SOUND_SUPERVISOR');
    expect(soundSup).toBeDefined();
    expect(soundSup?.name).toBe('Kaelen Scott');

    const qcAuditor = STUDIO_PERSONAS.find((p) => p.role === 'QC_AUDITOR');
    expect(qcAuditor).toBeDefined();
    expect(qcAuditor?.name).toBe('Marcus Zhao');

    const producer = STUDIO_PERSONAS.find((p) => p.role === 'STUDIO_PRODUCER');
    expect(producer).toBeDefined();
    expect(producer?.name).toBe('Sarah Lin');
  });

  it('enforces strict Director-only C2PA cryptographic sign-off permission', () => {
    const directorPermissions = ROLE_PERMISSIONS['DIRECTOR'];
    expect(directorPermissions).toContain('SIGN_C2PA_MASTER');

    const soundPermissions = ROLE_PERMISSIONS['SOUND_SUPERVISOR'];
    expect(soundPermissions).not.toContain('SIGN_C2PA_MASTER');

    const qcPermissions = ROLE_PERMISSIONS['QC_AUDITOR'];
    expect(qcPermissions).not.toContain('SIGN_C2PA_MASTER');

    const producerPermissions = ROLE_PERMISSIONS['STUDIO_PRODUCER'];
    expect(producerPermissions).not.toContain('SIGN_C2PA_MASTER');
  });

  it('restricts Audio Stem Adjustment to Sound Supervisors and Directors', () => {
    expect(ROLE_PERMISSIONS['SOUND_SUPERVISOR']).toContain('ADJUST_AUDIO_STEMS');
    expect(ROLE_PERMISSIONS['DIRECTOR']).toContain('ADJUST_AUDIO_STEMS');
    expect(ROLE_PERMISSIONS['QC_AUDITOR']).not.toContain('ADJUST_AUDIO_STEMS');
    expect(ROLE_PERMISSIONS['STUDIO_PRODUCER']).not.toContain('ADJUST_AUDIO_STEMS');
  });

  it('restricts Project Creation to Directors and Studio Producers', () => {
    expect(ROLE_PERMISSIONS['DIRECTOR']).toContain('CREATE_PROJECT');
    expect(ROLE_PERMISSIONS['STUDIO_PRODUCER']).toContain('CREATE_PROJECT');
    expect(ROLE_PERMISSIONS['SOUND_SUPERVISOR']).not.toContain('CREATE_PROJECT');
    expect(ROLE_PERMISSIONS['QC_AUDITOR']).not.toContain('CREATE_PROJECT');
  });

  it('allows QC Auditors, Producers, and Directors to audit shot conformance', () => {
    expect(ROLE_PERMISSIONS['QC_AUDITOR']).toContain('AUDIT_QC_SHOTS');
    expect(ROLE_PERMISSIONS['DIRECTOR']).toContain('AUDIT_QC_SHOTS');
    expect(ROLE_PERMISSIONS['STUDIO_PRODUCER']).toContain('AUDIT_QC_SHOTS');
  });

  it('provides complete styling metadata for all studio roles', () => {
    const roles: StudioRole[] = ['DIRECTOR', 'SOUND_SUPERVISOR', 'QC_AUDITOR', 'STUDIO_PRODUCER'];
    for (const role of roles) {
      const meta = ROLE_LABELS[role];
      expect(meta).toBeDefined();
      expect(meta.name).toBeTruthy();
      expect(meta.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(meta.badgeClass).toBeTruthy();
    }
  });
});
