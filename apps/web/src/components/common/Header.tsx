import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, Moon, Sun, Github, ChevronDown, UserCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { ROLE_LABELS, StudioRole } from '../../types/auth';
import { AuthModal } from '../auth/AuthModal';

export const Header: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Check initial dark mode from system or localStorage
    const saved = localStorage.getItem('kavrai_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('kavrai_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('kavrai_theme', 'dark');
      setIsDark(true);
    }
  };

  const roleMeta = user ? ROLE_LABELS[user.role as StudioRole] : null;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-apple-gray-200/80 bg-apple-canvas/80 apple-glass dark:border-darkroom-border dark:bg-darkroom-canvas/80 transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand & Studio Title */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="group flex items-center gap-2.5 transition-transform active:scale-95"
              aria-label="Kavrai AI Cinema Studio Dashboard"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-apple-blue shadow-glow-blue transition-all group-hover:scale-105">
                <Film className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tracking-tight text-apple-gray-900 dark:text-white text-base">
                    KAVRAI AI
                  </span>
                  <span className="rounded-full bg-apple-blue/10 px-2 py-0.5 text-[10px] font-semibold text-apple-blue dark:bg-apple-blue/20 dark:text-blue-400">
                    STUDIO PRO
                  </span>
                </div>
                <p className="text-[11px] font-medium tracking-wide text-apple-gray-500 dark:text-apple-gray-400">
                  Cinema-Grade Neural Film Localization
                </p>
              </div>
            </Link>
          </div>

          {/* Center Breadcrumb or Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-apple-gray-200/60 bg-apple-surface/60 px-3.5 py-1 text-xs text-apple-gray-600 dark:border-darkroom-border dark:bg-darkroom-surface/60 dark:text-apple-gray-300">
            <ShieldCheck className="h-3.5 w-3.5 text-cinema-green" />
            <span className="font-mono text-[11px]">TPN Gold Shield · 4K DCI Conformance</span>
          </div>

          {/* Action Controls & Persona Navigation */}
          <div className="flex items-center gap-2.5">
            {/* Studio Navigation */}
            <Link
              to="/"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-apple-gray-200 text-apple-gray-900 dark:bg-darkroom-elevated dark:text-white'
                  : 'text-apple-gray-600 hover:text-apple-gray-900 dark:text-apple-gray-400 dark:hover:text-white'
              }`}
            >
              Projects
            </Link>

            {/* Persona & Studio Role Trigger */}
            {user ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-apple-gray-200/80 bg-apple-surface/90 px-2.5 py-1.5 shadow-2xs hover:border-apple-blue dark:border-darkroom-border dark:bg-darkroom-surface/90 dark:hover:border-blue-500 transition-all text-left"
                title="Click to Switch Studio Role or Sign In"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-6 w-6 rounded-full object-cover border border-apple-gray-200 dark:border-darkroom-border shrink-0"
                />
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[11px] font-bold text-apple-gray-900 dark:text-white">
                      {user.name.split(' ')[0]}
                    </span>
                    {roleMeta && (
                      <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded ${roleMeta.badgeClass}`}>
                        {roleMeta.name}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className="h-3 w-3 text-apple-gray-400" />
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-apple-blue px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-apple-blue-hover transition-all"
              >
                <UserCircle2 className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            )}

            {/* GitHub Repository Link */}
            <a
              href="https://github.com/Aman678317/Kavrai-Ai-"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-apple-gray-200 bg-apple-surface text-apple-gray-600 hover:text-apple-gray-900 hover:border-apple-gray-300 dark:border-darkroom-border dark:bg-darkroom-surface dark:text-apple-gray-400 dark:hover:text-white transition-colors"
              title="GitHub Repository"
            >
              <Github className="h-4 w-4" />
            </a>

            {/* Darkroom / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-apple-gray-200 bg-apple-surface text-apple-gray-600 hover:text-apple-gray-900 hover:border-apple-gray-300 dark:border-darkroom-border dark:bg-darkroom-surface dark:text-apple-gray-400 dark:hover:text-white transition-colors"
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Theatrical Darkroom Mode'}
              title={isDark ? 'Theatrical Darkroom Active (Click for Light Mode)' : 'Click for Theatrical Darkroom Mode'}
            >
              {isDark ? <Sun className="h-4 w-4 text-cinema-gold" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Studio Authentication & Role Switcher Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

