import React, { useState } from 'react';
import { X, Film, Check, Lock } from 'lucide-react';
import { AspectRatio, CreateProjectInput, FrameRate } from '../../types/project';
import { SUPPORTED_LANGUAGES } from '../../lib/demoData';
import { useAuth } from '../../lib/authContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateProjectInput) => Promise<void>;
}

const SAMPLE_POSTERS = [
  {
    name: 'Sci-Fi Space',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Cyberpunk City',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Dramatic Film Noir',
    url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop',
  },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission('CREATE_PROJECT');
  const [title, setTitle] = useState('');
  const [director, setDirector] = useState('');
  const [studio, setStudio] = useState('');
  const [description, setDescription] = useState('');
  const [sourceLang, setSourceLang] = useState('en-US');
  const [targetLangs, setTargetLangs] = useState<string[]>(['es-ES', 'fr-FR', 'de-DE']);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('2.39:1');
  const [frameRate, setFrameRate] = useState<FrameRate>(24.0);
  const [posterUrl, setPosterUrl] = useState(SAMPLE_POSTERS[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;


  const toggleTargetLang = (code: string) => {
    if (targetLangs.includes(code)) {
      if (targetLangs.length === 1) return; // Keep at least one target
      setTargetLangs(targetLangs.filter((c) => c !== code));
    } else {
      setTargetLangs([...targetLangs, code]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a project or film title.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        title,
        director: director.trim() || 'Studio Director',
        studio: studio.trim() || 'Independent Studio',
        description: description.trim() || 'Theatrical cinematic localization package.',
        sourceLanguageCode: sourceLang,
        targetLanguageCodes: targetLangs,
        aspectRatio,
        frameRate,
        targetLoudnessLkfs: -24.0,
        colorSpace: 'ACEScg (SMPTE ST 2065-1)',
        posterUrl,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-apple-gray-200 bg-apple-surface p-6 shadow-2xl dark:border-darkroom-border dark:bg-darkroom-surface sm:p-8 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-apple-gray-100 pb-4 dark:border-darkroom-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-apple-gray-900 dark:text-white">
                New Film Localization Project
              </h2>
              <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
                Configure cinema metadata, aspect ratios, and target dubbing languages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-apple-gray-400 hover:bg-apple-gray-100 dark:hover:bg-darkroom-elevated dark:text-apple-gray-400 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Film Title & Director */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-300 mb-1.5">
                Film Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Echoes of Eternity"
                className="w-full rounded-xl border border-apple-gray-200 bg-apple-gray-50 px-3.5 py-2 text-xs text-apple-gray-900 focus:border-apple-blue focus:bg-white focus:outline-none dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-white dark:focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-300 mb-1.5">
                Director
              </label>
              <input
                type="text"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                placeholder="e.g. Denis Villeneuve"
                className="w-full rounded-xl border border-apple-gray-200 bg-apple-gray-50 px-3.5 py-2 text-xs text-apple-gray-900 focus:border-apple-blue focus:bg-white focus:outline-none dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-white dark:focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* Studio & Source Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-300 mb-1.5">
                Studio / Production House
              </label>
              <input
                type="text"
                value={studio}
                onChange={(e) => setStudio(e.target.value)}
                placeholder="e.g. DNEG / Paramount Pictures"
                className="w-full rounded-xl border border-apple-gray-200 bg-apple-gray-50 px-3.5 py-2 text-xs text-apple-gray-900 focus:border-apple-blue focus:bg-white focus:outline-none dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-white dark:focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-300 mb-1.5">
                Source Dialogue Language
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full rounded-xl border border-apple-gray-200 bg-apple-gray-50 px-3 py-2 text-xs text-apple-gray-900 focus:border-apple-blue focus:bg-white focus:outline-none dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-white dark:focus:border-blue-400 transition-all"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-300 mb-1.5">
              Synopsis / Narrative Context
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary used by LLM to maintain dramatic tone in transcreation..."
              className="w-full rounded-xl border border-apple-gray-200 bg-apple-gray-50 px-3.5 py-2 text-xs text-apple-gray-900 focus:border-apple-blue focus:bg-white focus:outline-none dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-white dark:focus:border-blue-400 transition-all"
            />
          </div>

          {/* Target Languages Multi-select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-300">
                Target Localization Languages ({targetLangs.length} selected)
              </label>
              <span className="text-[11px] text-apple-gray-400">Click to select/deselect</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 border border-apple-gray-100 rounded-xl dark:border-darkroom-border/60">
              {SUPPORTED_LANGUAGES.filter((l) => l.code !== sourceLang).map((lang) => {
                const selected = targetLangs.includes(lang.code);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => toggleTargetLang(lang.code)}
                    className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                      selected
                        ? 'border-apple-blue bg-apple-blue/10 text-apple-blue dark:bg-apple-blue/20 dark:text-blue-300'
                        : 'border-apple-gray-200 bg-apple-gray-50 text-apple-gray-700 hover:border-apple-gray-300 dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-apple-gray-300'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name.split(' ')[0]}</span>
                    {selected && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio & Frame Rate Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-300 mb-1.5">
                Theatrical Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['2.39:1', '16:9', '1.85:1'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`rounded-xl border py-1.5 text-center text-xs font-semibold transition-all ${
                      aspectRatio === ratio
                        ? 'border-apple-blue bg-apple-blue text-white shadow-sm'
                        : 'border-apple-gray-200 bg-apple-gray-50 text-apple-gray-700 hover:bg-apple-gray-100 dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-apple-gray-300'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-300 mb-1.5">
                Master Frame Rate
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { rate: 24.0, label: '24.0 fps (DCI)' },
                  { rate: 23.976, label: '23.976 fps' },
                ].map(({ rate, label }) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setFrameRate(rate as FrameRate)}
                    className={`rounded-xl border py-1.5 text-center text-xs font-semibold transition-all ${
                      frameRate === rate
                        ? 'border-apple-blue bg-apple-blue text-white shadow-sm'
                        : 'border-apple-gray-200 bg-apple-gray-50 text-apple-gray-700 hover:bg-apple-gray-100 dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-apple-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sample Poster Selector */}
          <div>
            <label className="block text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-300 mb-1.5">
              Key Art Poster Style
            </label>
            <div className="grid grid-cols-3 gap-3">
              {SAMPLE_POSTERS.map((poster) => (
                <button
                  key={poster.name}
                  type="button"
                  onClick={() => setPosterUrl(poster.url)}
                  className={`group relative aspect-[16/9] overflow-hidden rounded-xl border transition-all ${
                    posterUrl === poster.url
                      ? 'border-apple-blue ring-2 ring-apple-blue/30 scale-[1.02]'
                      : 'border-apple-gray-200 opacity-70 hover:opacity-100 dark:border-darkroom-border'
                  }`}
                >
                  <img src={poster.url} alt={poster.name} className="h-full w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-0.5 text-[10px] text-white font-medium truncate">
                    {poster.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-apple-gray-100 dark:border-darkroom-border">
            {!canCreate ? (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span>Director or Producer role required ({user?.name || 'Guest'} restricted)</span>
              </span>
            ) : <div />}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-apple-gray-600 hover:bg-apple-gray-100 dark:text-apple-gray-300 dark:hover:bg-darkroom-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !canCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-apple-blue px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-apple-blue-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Initializing Reels...
                  </>
                ) : (
                  'Create Localization Project'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
