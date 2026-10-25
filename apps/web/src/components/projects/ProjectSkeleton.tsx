import React from 'react';

export const ProjectSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-apple-gray-200 bg-apple-surface shadow-apple-sm dark:border-darkroom-border dark:bg-darkroom-surface">
      {/* Poster Skeleton */}
      <div className="relative aspect-[16/9] w-full animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated" />

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col p-5 space-y-4">
        <div>
          <div className="h-5 w-3/4 rounded-md animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated" />
          <div className="h-3 w-1/2 rounded-md animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated mt-2" />
        </div>

        <div className="space-y-1.5">
          <div className="h-3 w-full rounded-md animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated" />
          <div className="h-3 w-5/6 rounded-md animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated" />
        </div>

        <div className="pt-2">
          <div className="flex gap-2">
            <div className="h-6 w-12 rounded-md animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated" />
            <div className="h-6 w-12 rounded-md animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated" />
            <div className="h-6 w-12 rounded-md animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated" />
          </div>
        </div>

        <div className="mt-auto pt-3">
          <div className="h-2 w-full rounded-full animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated" />
          <div className="flex justify-between mt-3">
            <div className="h-3 w-16 rounded animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated" />
            <div className="h-3 w-28 rounded animate-shimmer bg-apple-gray-200 dark:bg-darkroom-elevated" />
          </div>
        </div>
      </div>
    </div>
  );
};
