import React, { useEffect, useState } from 'react';
import {
  Film,
  Plus,
  Sparkles,
  Search,
  Activity,
  Layers,
  Globe2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { FilmProject, StudioMetrics } from '../types/project';
import { projectsApi } from '../lib/api';
import { ProjectCard } from '../components/projects/ProjectCard';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { ProjectEmptyState } from '../components/projects/ProjectEmptyState';
import { ProjectSkeleton } from '../components/projects/ProjectSkeleton';

export const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<FilmProject[]>([]);
  const [metrics, setMetrics] = useState<StudioMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchProjectsAndMetrics = async () => {
    try {
      setIsLoading(true);
      const [fetchedProjects, fetchedMetrics] = await Promise.all([
        projectsApi.getProjects(),
        projectsApi.getMetrics(),
      ]);
      setProjects(fetchedProjects);
      setMetrics(fetchedMetrics);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndMetrics();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateProject = async (input: any) => {
    const created = await projectsApi.createProject(input);
    showNotification(`Film project "${created.title}" initialized successfully!`);
    await fetchProjectsAndMetrics();
  };

  const handleDeleteProject = async (id: string) => {
    await projectsApi.deleteProject(id);
    showNotification('Project removed from studio workspace.');
    await fetchProjectsAndMetrics();
  };

  const handleResetDemoData = async () => {
    await projectsApi.resetDemoData();
    showNotification('Reference 4K DCI cinema demo reels loaded!');
    await fetchProjectsAndMetrics();
  };

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const matchesQuery =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studio.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || p.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="min-h-full pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-apple-gray-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl dark:bg-white dark:text-apple-gray-900 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-cinema-green" />
          <span>{notification}</span>
        </div>
      )}

      {/* Hero Welcome & Actions Banner */}
      <section className="border-b border-apple-gray-200/80 bg-apple-surface/40 dark:border-darkroom-border dark:bg-darkroom-surface/40 transition-colors">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-apple-blue/20 bg-apple-blue/5 px-2.5 py-0.5 text-[11px] font-semibold text-apple-blue dark:bg-apple-blue/10 dark:text-blue-400 mb-2">
                <Sparkles className="h-3 w-3 text-cinema-gold" />
                <span>Next-Gen Cinema Localization</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-apple-gray-900 dark:text-white">
                Film Localization Workspace
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-apple-gray-500 dark:text-apple-gray-400 max-w-2xl">
                Cinema-grade multilingual speech transcreation, voice cloning, and neural lip-sync conforming for full-length theatrical releases.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleResetDemoData}
                className="inline-flex items-center gap-1.5 rounded-xl border border-apple-gray-200 bg-apple-surface px-3.5 py-2.5 text-xs font-semibold text-apple-gray-700 shadow-apple-sm hover:bg-apple-gray-50 dark:border-darkroom-border dark:bg-darkroom-surface dark:text-apple-gray-200 dark:hover:bg-darkroom-elevated transition-colors"
                title="Load sample 4K demo reels"
              >
                <RotateCcw className="h-3.5 w-3.5 text-cinema-gold" />
                <span>Reset Demo Reels</span>
              </button>

              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-apple-blue px-4 py-2.5 text-xs font-semibold text-white shadow-glow-blue hover:bg-apple-blue-hover active:scale-[0.98] transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>New Film Project</span>
              </button>
            </div>
          </div>

          {/* Studio Metrics Cards */}
          <div className="mt-8 grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-apple-gray-200/80 bg-apple-surface p-4 shadow-apple-sm dark:border-darkroom-border dark:bg-darkroom-surface">
              <div className="flex items-center justify-between text-apple-gray-500 dark:text-apple-gray-400 text-xs font-medium">
                <span>Total Projects</span>
                <Film className="h-4 w-4 text-apple-blue" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-apple-gray-900 dark:text-white font-mono">
                {metrics ? metrics.totalProjects : '—'}
              </div>
              <p className="mt-0.5 text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
                Theatrical feature productions
              </p>
            </div>

            <div className="rounded-2xl border border-apple-gray-200/80 bg-apple-surface p-4 shadow-apple-sm dark:border-darkroom-border dark:bg-darkroom-surface">
              <div className="flex items-center justify-between text-apple-gray-500 dark:text-apple-gray-400 text-xs font-medium">
                <span>Active GPU Reels</span>
                <Layers className="h-4 w-4 text-cinema-purple" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-apple-gray-900 dark:text-white font-mono">
                {metrics ? metrics.activeProcessingReels : '—'}
              </div>
              <p className="mt-0.5 text-[11px] text-cinema-purple font-medium">
                In-flight neural diffusion
              </p>
            </div>

            <div className="rounded-2xl border border-apple-gray-200/80 bg-apple-surface p-4 shadow-apple-sm dark:border-darkroom-border dark:bg-darkroom-surface">
              <div className="flex items-center justify-between text-apple-gray-500 dark:text-apple-gray-400 text-xs font-medium">
                <span>Localized Languages</span>
                <Globe2 className="h-4 w-4 text-cinema-cyan" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-apple-gray-900 dark:text-white font-mono">
                {metrics ? metrics.localizedLanguagesCount : '—'}
              </div>
              <p className="mt-0.5 text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
                Phonetic & viseme conform
              </p>
            </div>

            <div className="rounded-2xl border border-apple-gray-200/80 bg-apple-surface p-4 shadow-apple-sm dark:border-darkroom-border dark:bg-darkroom-surface">
              <div className="flex items-center justify-between text-apple-gray-500 dark:text-apple-gray-400 text-xs font-medium">
                <span>Avg. SyncNet Confidence</span>
                <Activity className="h-4 w-4 text-cinema-green" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-apple-gray-900 dark:text-white font-mono">
                {metrics ? metrics.averageSyncNetConfidence : '8.7'}
                <span className="text-xs text-apple-gray-400 font-normal ml-1">/ 10.0</span>
              </div>
              <p className="mt-0.5 text-[11px] text-cinema-green font-medium">
                Exceeds $\ge 8.2$ broadcast spec
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Projects Section */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search, Filter & Quick Nav Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-apple-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, directors, or studios..."
              className="w-full rounded-xl border border-apple-gray-200 bg-apple-surface pl-9 pr-4 py-2 text-xs text-apple-gray-900 placeholder:text-apple-gray-400 focus:border-apple-blue focus:outline-none dark:border-darkroom-border dark:bg-darkroom-surface dark:text-white dark:focus:border-blue-400 shadow-apple-sm transition-all"
            />
          </div>

          {/* Status Filter Badges */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Projects' },
              { id: 'LIP_SYNCING', label: 'Lip-Sync' },
              { id: 'DUBBING', label: 'Dubbing' },
              { id: 'INGESTING', label: 'Ingest' },
              { id: 'COMPLETED', label: 'Master Ready' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === f.id
                    ? 'bg-apple-blue text-white shadow-xs'
                    : 'bg-apple-surface text-apple-gray-600 border border-apple-gray-200 hover:bg-apple-gray-50 dark:bg-darkroom-surface dark:border-darkroom-border dark:text-apple-gray-300 dark:hover:bg-darkroom-elevated'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Loading / Empty / Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProjectSkeleton />
            <ProjectSkeleton />
            <ProjectSkeleton />
          </div>
        ) : filteredProjects.length === 0 ? (
          <ProjectEmptyState
            onOpenCreate={() => setIsCreateOpen(true)}
            onLoadDemo={handleResetDemoData}
            isFiltered={Boolean(searchQuery || statusFilter !== 'ALL')}
            onClearFilter={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
};
