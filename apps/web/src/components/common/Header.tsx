import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, Moon, Sun, Github } from 'lucide-react';

export const Header: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const location = useLocation();

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

  return (
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
        <div className="hidden md:flex items-center gap-2 rounded-full border border-apple-gray-200/60 bg-apple-surface/60 px-3.5 py-1 text-xs text-apple-gray-600 dark:border-darkroom-border dark:bg-darkroom-surface/60 dark:text-apple-gray-300">
          <span className="h-2 w-2 rounded-full bg-cinema-green animate-pulse" />
          <span className="font-mono text-[11px]">TPN Gold Shield · 4K DCI Ready</span>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2.5">
          {/* Navigation Links */}
          <Link
            to="/"
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              location.pathname === '/'
                ? 'bg-apple-gray-200 text-apple-gray-900 dark:bg-darkroom-elevated dark:text-white'
                : 'text-apple-gray-600 hover:text-apple-gray-900 dark:text-apple-gray-400 dark:hover:text-white'
            }`}
          >
            Studio Projects
          </Link>

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
  );
};
