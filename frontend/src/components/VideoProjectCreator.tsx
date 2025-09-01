import React, { useState, useEffect } from 'react';
import { Script } from '../types/script';
import { 
  VideoProject, 
  CreateVideoProjectRequest, 
  VIDEO_RESOLUTIONS, 
  BACKGROUND_STYLES, 
  VIDEO_STATUSES,
  ProjectStats,
  getReadinessColor,
  getReadinessLabel
} from '../types/video';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { ProgressBar } from './ui/ProgressBar';
import { apiService } from '../lib/services/apiService';

interface VideoProjectCreatorProps {
  onProjectCreated?: (project: VideoProject) => void;
  onProjectSelected?: (project: VideoProject) => void;
}

export const VideoProjectCreator: React.FC<VideoProjectCreatorProps> = ({ 
  onProjectCreated, 
  onProjectSelected 
}) => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [projectStats, setProjectStats] = useState<Record<number, ProjectStats>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newProject, setNewProject] = useState<CreateVideoProjectRequest>({
    name: '',
    script_id: 0,
    resolution: '1080p',
    background_style: 'anime'
  });

  useEffect(() => {
    fetchScripts();
    fetchProjects();
  }, []);

  const fetchScripts = async () => {
    try {
      const response = await apiService.get<Script[]>('/scripts');
      if (response.error) throw new Error(response.error);
      setScripts(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scripts');
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<VideoProject[]>('/video/projects');
      if (response.error) throw new Error(response.error);
      const data = response.data || [];
      setProjects(data);
      
      // Fetch stats for each project
      const statsPromises = data.map(async (project: VideoProject) => {
        try {
          const statsResponse = await apiService.get<ProjectStats>(`/video/projects/${project.id}/stats`);
          if (statsResponse.data) {
            return { projectId: project.id, stats: statsResponse.data };
          }
        } catch (err) {
          console.error(`Failed to fetch stats for project ${project.id}:`, err);
        }
        return null;
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap: Record<number, ProjectStats> = {};
      statsResults.forEach(result => {
        if (result) {
          statsMap[result.projectId] = result.stats;
        }
      });
      setProjectStats(statsMap);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !newProject.script_id) {
      setError('Project name and script are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiService.post<VideoProject>('/video/projects', newProject);
      if (response.error) {
        throw new Error(response.error);
      }

      const project = response.data;
      setIsCreating(false);
      setNewProject({ name: '', script_id: 0, resolution: '1080p', background_style: 'anime' });
      fetchProjects();
      if (project) {
        onProjectCreated?.(project);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (project: VideoProject) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.delete(`/video/projects/${project.id}`);
      if (response.error) {
        throw new Error(response.error);
      }

      fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusConfig = VIDEO_STATUSES.find(s => s.value === status);
    return statusConfig?.color || 'gray';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && projects.length === 0) {
    return <div className="flex justify-center p-8">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Video Projects</h2>
        <Button onClick={() => setIsCreating(true)} disabled={loading}>
          New Project
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 underline mt-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Create Project Form */}
      {isCreating && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create Video Project</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Project Name *</label>
              <input
                type="text"
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="My Visual Novel Project"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Script *</label>
              <select
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newProject.script_id || ''}
                onChange={(e) => setNewProject({ ...newProject, script_id: parseInt(e.target.value) })}
              >
                <option value="">Select a script...</option>
                {scripts.map(script => (
                  <option key={script.id} value={script.id}>{script.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Resolution</label>
                <select
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newProject.resolution}
                  onChange={(e) => setNewProject({ ...newProject, resolution: e.target.value as any })}
                >
                  {VIDEO_RESOLUTIONS.map(res => (
                    <option key={res.value} value={res.value}>
                      {res.label} ({res.dimensions})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Background Style</label>
                <select
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newProject.background_style}
                  onChange={(e) => setNewProject({ ...newProject, background_style: e.target.value as any })}
                >
                  {BACKGROUND_STYLES.map(style => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreateProject} disabled={loading}>
                {loading ? 'Creating...' : 'Create Project'}
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => {
          const stats = projectStats[project.id];
          const readinessScore = stats?.readiness_score || 0;
          
          return (
            <Card 
              key={project.id} 
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onProjectSelected?.(project)}
            >
              <div className="space-y-4">
                {/* Project Header */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{project.script_title}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Project Status */}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium bg-${getStatusColor(project.status)}-100 text-${getStatusColor(project.status)}-700`}>
                    {VIDEO_STATUSES.find(s => s.value === project.status)?.label || project.status}
                  </span>
                  {project.progress > 0 && (
                    <div className="flex-1">
                      <ProgressBar progress={project.progress} size="sm" />
                    </div>
                  )}
                </div>

                {/* Project Settings */}
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {project.resolution}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                    {BACKGROUND_STYLES.find(s => s.value === project.background_style)?.label || project.background_style}
                  </span>
                </div>

                {/* Project Stats */}
                {stats && (
                  <div className="border-t pt-3">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{stats.total_lines}</div>
                        <div className="text-xs text-gray-500">Lines</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{stats.total_scenes}</div>
                        <div className="text-xs text-gray-500">Scenes</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{stats.total_characters}</div>
                        <div className="text-xs text-gray-500">Characters</div>
                      </div>
                    </div>
                    
                    {/* Readiness Score */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-gray-600">Readiness:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-${getReadinessColor(readinessScore)}-500`}
                            style={{ width: `${readinessScore}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium text-${getReadinessColor(readinessScore)}-600`}>
                          {getReadinessLabel(readinessScore)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Meta */}
                <div className="text-xs text-gray-500 border-t pt-3">
                  Created {formatDate(project.created_at)}
                  {project.output_path && (
                    <div className="mt-1">
                      <a 
                        href={project.output_path} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Output
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {projects.length === 0 && !loading && (
        <div className="text-center p-12">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No video projects yet</h3>
          <p className="text-gray-500 mb-4">Create your first video project to get started with visual novel generation.</p>
          <Button onClick={() => setIsCreating(true)}>
            Create Your First Project
          </Button>
        </div>
      )}
    </div>
  );
};