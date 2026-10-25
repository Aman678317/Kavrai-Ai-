import React from 'react';
import { Film, Plus, Sparkles } from 'lucide-react';

interface ProjectEmptyStateProps {
  onOpenCreate: () => void;
  onLoadDemo: () => void;
  isFiltered?: boolean;
  onClearFilter?: () => void;
}

export const ProjectEmptyState: React.FC<ProjectEmptyStateProps> = ({
  onOpenCreate,
  onLoadDemo,
  isFiltered,
  onClearFilter,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-apple-gray-300 bg-apple-surface/50 p-12 text-center dark:border-darkroom-border dark:bg-darkroom-surface/50">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-apple-gray-100 text-apple-gray-400 dark:bg-darkroom-elevated dark:text-apple-gray-500 mb-4 shadow-apple-sm">
        <Film className="h-8 w-8" />
      </div>

      <h3 className="text-base font-bold text-apple-gray-900 dark:text-white">
        {isFiltered ? 'No Matching Film Projects' : 'No Film Projects Yet'}
      </h3>

      <p className="mt-1.5 max-w-sm text-xs text-apple-gray-500 dark:text-apple-gray-400 leading-relaxed">
        {isFiltered
          ? 'No localization projects match your search query or language filter criteria.'
          : 'Initialize your first cinema-grade feature film localization pipeline or load a pre-conformed 4K DCI demo reel.'}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {isFiltered ? (
          <button
            onClick={onClearFilter}
            className="inline-flex items-center gap-2 rounded-xl border border-apple-gray-200 bg-apple-surface px-4 py-2 text-xs font-semibold text-apple-gray-700 hover:bg-apple-gray-50 dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-white transition-colors"
          >
            Clear Search Filters
          </button>
        ) : (
          <>
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-apple-blue px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-apple-blue-hover active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" />
              Create Film Project
            </button>
            <button
              onClick={onLoadDemo}
              className="inline-flex items-center gap-2 rounded-xl border border-apple-gray-200 bg-apple-surface px-4 py-2 text-xs font-semibold text-apple-gray-700 hover:bg-apple-gray-50 dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-white transition-colors"
            >
              <Sparkles className="h-4 w-4 text-cinema-gold" />
              Load 4K Reference Demo Reel
            </button>
          </>
        )}
      </div>
    </div>
  );
};
