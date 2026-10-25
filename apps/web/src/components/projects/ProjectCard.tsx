import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trash2 } from 'lucide-react';
import { FilmProject, PipelineStatus } from '../../types/project';

interface ProjectCardProps {
  project: FilmProject;
  onDelete?: (id: string) => void;
}

const getStatusBadge = (status: PipelineStatus) => {
  switch (status) {
    case 'COMPLETED':
      return {
        label: 'Master Ready',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-500',
      };
    case 'LIP_SYNCING':
      return {
        label: 'Neural Lip-Sync',
        bg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30',
        dot: 'bg-purple-500 animate-pulse',
      };
    case 'DUBBING':
      return {
        label: 'Voice Synthesis',
        bg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30',
        dot: 'bg-blue-500 animate-pulse',
      };
    case 'TRANSCRIBING':
      return {
        label: 'ASR & Transcreation',
        bg: 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/30',
        dot: 'bg-cyan-500 animate-pulse',
      };
    case 'INGESTING':
      return {
        label: 'Demux & Ingest',
        bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
        dot: 'bg-amber-500 animate-pulse',
      };
    case 'FAILED':
      return {
        label: 'Error Flagged',
        bg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
        dot: 'bg-rose-500',
      };
    default:
      return {
        label: 'Queued',
        bg: 'bg-apple-gray-200 dark:bg-darkroom-elevated text-apple-gray-700 dark:text-apple-gray-300 border-apple-gray-300 dark:border-darkroom-border',
        dot: 'bg-apple-gray-400',
      };
  }
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  const badge = getStatusBadge(project.status);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete film project "${project.title}"?`)) {
      onDelete?.(project.id);
    }
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-apple-gray-200 bg-apple-surface shadow-apple-card transition-all duration-300 hover:-translate-y-1 hover:border-apple-gray-300 hover:shadow-apple-hover dark:border-darkroom-border dark:bg-darkroom-surface dark:hover:border-darkroom-hover">
      {/* Poster Header Section */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-apple-gray-100 dark:bg-darkroom-canvas">
        <img
          src={project.posterUrl}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop';
          }}
        />

        {/* Top Badges Overlay */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 bg-gradient-to-b from-black/60 to-transparent">
          <span className="rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[11px] font-semibold text-white/90">
            {project.aspectRatio} · {project.frameRate} fps
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md ${badge.bg}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
          </div>
        </div>

        {/* Bottom Specs Bar */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-[11px] text-white/80 font-mono">
          <span>{project.runtimeMinutes} MINS</span>
          <span>{project.totalReels} REELS ({project.totalShots} SHOTS)</span>
        </div>
      </div>

      {/* Card Content Section */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold tracking-tight text-apple-gray-900 group-hover:text-apple-blue dark:text-white transition-colors line-clamp-1">
              {project.title}
            </h3>
            <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 mt-0.5 line-clamp-1">
              Dir. {project.director} · {project.studio}
            </p>
          </div>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="rounded-lg p-1.5 text-apple-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors"
              title="Delete project"
              aria-label="Delete project"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="mt-2.5 text-xs text-apple-gray-600 dark:text-apple-gray-300 line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        {/* Target Languages Chips */}
        <div className="mt-4 pt-3 border-t border-apple-gray-100 dark:border-darkroom-border/60">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-apple-gray-400 dark:text-apple-gray-500 mb-2">
            <span>Localization Targets</span>
            <span>{project.targetLanguages.length} LGS</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {project.targetLanguages.slice(0, 4).map((lang) => (
              <span
                key={lang.code}
                className="inline-flex items-center gap-1 rounded-md border border-apple-gray-200 bg-apple-gray-50 px-2 py-0.5 text-xs text-apple-gray-700 dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-apple-gray-300"
                title={lang.name}
              >
                <span>{lang.flag}</span>
                <span className="font-medium text-[11px]">{lang.code.split('-')[0].toUpperCase()}</span>
              </span>
            ))}
            {project.targetLanguages.length > 4 && (
              <span className="inline-flex items-center rounded-md border border-apple-gray-200 bg-apple-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-apple-gray-600 dark:border-darkroom-border dark:bg-darkroom-elevated dark:text-apple-gray-400">
                +{project.targetLanguages.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar & Open Link Footer */}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-apple-gray-500 dark:text-apple-gray-400 text-[11px]">
              Pipeline Progress
            </span>
            <span className="font-mono font-semibold text-apple-gray-900 dark:text-white text-xs">
              {project.overallProgress}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-apple-gray-100 dark:bg-darkroom-elevated">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                project.status === 'COMPLETED' ? 'bg-cinema-green' : 'bg-apple-blue'
              }`}
              style={{ width: `${project.overallProgress}%` }}
            />
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between">
            <span className="text-[11px] text-apple-gray-400 font-mono">
              {project.colorSpace.split(' ')[0]}
            </span>
            <Link
              to={`/projects/${project.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-apple-blue hover:text-apple-blue-hover dark:text-blue-400 transition-colors"
            >
              Open Studio Workspace
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
