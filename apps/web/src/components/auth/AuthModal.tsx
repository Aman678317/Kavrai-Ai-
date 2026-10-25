import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Check,
  Sparkles,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { ROLE_LABELS, StudioRole, StudioUser } from '../../types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, availablePersonas, switchPersona, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'PERSONAS' | 'CREDENTIALS'>('PERSONAS');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectPersona = (persona: StudioUser) => {
    switchPersona(persona.id);
    onClose();
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    await login(email, password);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-apple-gray-200/80 bg-apple-surface/95 p-6 sm:p-8 shadow-apple-modal backdrop-blur-2xl dark:border-darkroom-border dark:bg-darkroom-surface/95 transition-all text-apple-gray-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-5 border-b border-apple-gray-200/80 dark:border-darkroom-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20 dark:text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Studio Access & Roles</h2>
              <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
                TPN Gold Shield Multi-Tenant Studio Authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-apple-gray-400 hover:bg-apple-gray-100 hover:text-apple-gray-700 dark:hover:bg-darkroom-elevated dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-apple-gray-100 dark:bg-darkroom-elevated p-1 mt-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('PERSONAS')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              activeTab === 'PERSONAS'
                ? 'bg-apple-surface dark:bg-darkroom-surface shadow-xs text-apple-blue dark:text-blue-400'
                : 'text-apple-gray-500 hover:text-apple-gray-900 dark:text-apple-gray-400 dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Studio Personas (1-Click)</span>
          </button>
          <button
            onClick={() => setActiveTab('CREDENTIALS')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              activeTab === 'CREDENTIALS'
                ? 'bg-apple-surface dark:bg-darkroom-surface shadow-xs text-apple-blue dark:text-blue-400'
                : 'text-apple-gray-500 hover:text-apple-gray-900 dark:text-apple-gray-400 dark:hover:text-white'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Studio Credentials</span>
          </button>
        </div>

        {/* Content: Personas */}
        {activeTab === 'PERSONAS' && (
          <div className="mt-5 space-y-3">
            <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
              Select an authorized theatrical persona to instantly test role-gated permissions:
            </p>

            <div className="grid grid-cols-1 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {availablePersonas.map((persona) => {
                const isCurrent = user?.id === persona.id;
                const roleMeta = ROLE_LABELS[persona.role as StudioRole];

                return (
                  <button
                    key={persona.id}
                    onClick={() => handleSelectPersona(persona)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      isCurrent
                        ? 'border-apple-blue bg-apple-blue/5 shadow-2xs dark:border-blue-500 dark:bg-blue-500/10'
                        : 'border-apple-gray-200/80 bg-apple-canvas/40 hover:border-apple-gray-300 dark:border-darkroom-border dark:bg-darkroom-elevated/40 dark:hover:border-darkroom-border/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={persona.avatarUrl}
                        alt={persona.name}
                        className="h-10 w-10 rounded-full object-cover border border-apple-gray-200 dark:border-darkroom-border shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-apple-gray-900 dark:text-white truncate">
                            {persona.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md border shrink-0 ${roleMeta.badgeClass}`}
                          >
                            {roleMeta.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 truncate mt-0.5">
                          {persona.title} · {persona.studio}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3">
                      {isCurrent ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-apple-blue text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-apple-blue dark:text-blue-400 flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100">
                          Switch <ArrowRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content: Credentials */}
        {activeTab === 'CREDENTIALS' && (
          <form onSubmit={handleCredentialsSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-300 mb-1">
                Studio Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="director@paramount.studio"
                required
                className="w-full rounded-xl border border-apple-gray-200 bg-apple-canvas px-3.5 py-2.5 text-xs text-apple-gray-900 placeholder:text-apple-gray-400 focus:border-apple-blue focus:outline-none dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-300 mb-1">
                Studio Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-apple-gray-200 bg-apple-canvas px-3.5 py-2.5 text-xs text-apple-gray-900 placeholder:text-apple-gray-400 focus:border-apple-blue focus:outline-none dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] text-apple-gray-400 pt-1">
              <Lock className="h-3.5 w-3.5 text-emerald-500" />
              <span>TLS 1.3 · ECC NIST P-256 JWT Authentication</span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-apple-blue py-2.5 text-xs font-semibold text-white shadow-glow-blue hover:bg-apple-blue-hover active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" />
                    <span>Sign In to Studio Workspace</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
