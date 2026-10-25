/**
 * Studio Authentication & Role-Based Access Control (RBAC) Types
 * Aligned with Netflix Delivery Specs, C2PA Provenance & TPN Gold Shield standards.
 */

export type StudioRole = 'DIRECTOR' | 'SOUND_SUPERVISOR' | 'QC_AUDITOR' | 'STUDIO_PRODUCER';

export type Permission =
  | 'CREATE_PROJECT'
  | 'DELETE_PROJECT'
  | 'SIGN_C2PA_MASTER'
  | 'ADJUST_AUDIO_STEMS'
  | 'AUDIT_QC_SHOTS'
  | 'REGENERATE_LIPSYNC';

export interface StudioUser {
  id: string;
  name: string;
  email: string;
  role: StudioRole;
  title: string;
  avatarUrl: string;
  studio: string;
  token?: string;
}

export const ROLE_PERMISSIONS: Record<StudioRole, Permission[]> = {
  DIRECTOR: [
    'CREATE_PROJECT',
    'DELETE_PROJECT',
    'SIGN_C2PA_MASTER',
    'ADJUST_AUDIO_STEMS',
    'AUDIT_QC_SHOTS',
    'REGENERATE_LIPSYNC',
  ],
  STUDIO_PRODUCER: [
    'CREATE_PROJECT',
    'DELETE_PROJECT',
    'AUDIT_QC_SHOTS',
  ],
  SOUND_SUPERVISOR: [
    'ADJUST_AUDIO_STEMS',
    'REGENERATE_LIPSYNC',
  ],
  QC_AUDITOR: [
    'AUDIT_QC_SHOTS',
  ],
};

export const ROLE_LABELS: Record<StudioRole, { name: string; color: string; badgeClass: string }> = {
  DIRECTOR: {
    name: 'Lead Director',
    color: '#0071E3',
    badgeClass: 'bg-apple-blue/15 text-apple-blue border-apple-blue/30 dark:bg-blue-500/20 dark:text-blue-400',
  },
  SOUND_SUPERVISOR: {
    name: 'Sound Supervisor',
    color: '#9333EA',
    badgeClass: 'bg-cinema-purple/15 text-cinema-purple border-cinema-purple/30 dark:bg-purple-500/20 dark:text-purple-400',
  },
  QC_AUDITOR: {
    name: 'Lead QC Auditor',
    color: '#10B981',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400',
  },
  STUDIO_PRODUCER: {
    name: 'Executive Producer',
    color: '#F59E0B',
    badgeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400',
  },
};

export const STUDIO_PERSONAS: StudioUser[] = [
  {
    id: 'user-director-01',
    name: 'Elena Vance',
    email: 'elena.vance@kavrai.studio',
    role: 'DIRECTOR',
    title: 'Supervising Director',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    studio: 'Kavrai Theatrical Labs',
    token: 'jwt-theatrical-director-token-elena-vance-ecc256',
  },
  {
    id: 'user-sound-02',
    name: 'Kaelen Scott',
    email: 'kaelen.scott@kavrai.studio',
    role: 'SOUND_SUPERVISOR',
    title: 'Senior Sound Designer & Re-recording Mixer',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    studio: 'Skywalker Sound & Mix Stage',
    token: 'jwt-theatrical-sound-token-kaelen-scott-ecc256',
  },
  {
    id: 'user-qc-03',
    name: 'Marcus Zhao',
    email: 'marcus.zhao@kavrai.studio',
    role: 'QC_AUDITOR',
    title: 'Lead Visual Conformance & SyncNet Auditor',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    studio: 'Netflix Certified Quality Lab',
    token: 'jwt-theatrical-qc-token-marcus-zhao-ecc256',
  },
  {
    id: 'user-producer-04',
    name: 'Sarah Lin',
    email: 'sarah.lin@kavrai.studio',
    role: 'STUDIO_PRODUCER',
    title: 'Executive VP of International Distribution',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
    studio: 'Universal Pictures Theatrical',
    token: 'jwt-theatrical-producer-token-sarah-lin-ecc256',
  },
];
