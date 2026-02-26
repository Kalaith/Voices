import React, { useState, useEffect } from 'react';
import { VideoProject } from '../../types/video';
import { VideoServiceProject } from '../../types/videoServiceSchema';
import { JsonBuilder, ProjectWithFullData } from '../../utils/jsonBuilder';
import { apiService } from '../../lib/services/apiService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { JsonPreviewModal } from '../JsonPreview';
import { VideoConfigurationPanel } from './VideoConfigurationPanel';
import { ImageConfigurationPanel } from './ImageConfigurationPanel';

interface VideoProjectEditorProps {
  projectId: number;
  onClose: () => void;
}

type TabName = 'overview' | 'characters' | 'scenes' | 'configuration' | 'export';

export const VideoProjectEditor: React.FC<VideoProjectEditorProps> = ({
  projectId,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TabName>('overview');
  const [project, setProject] = useState<ProjectWithFullData | null>(null);
  const [jsonPreview, setJsonPreview] = useState<VideoServiceProject | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<ProjectWithFullData>(`/video/projects/${projectId}/details`);
      if (response.data) {
        setProject(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (updates: Partial<VideoProject>) => {
    if (!project) return;

    try {
      setSaving(true);
      const response = await apiService.put(`/video/projects/${projectId}`, updates);
      if (response.data) {
        setProject({ ...project, ...response.data });
      }
    } catch (err) {
      console.error('Failed to update project:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateJSON = () => {
    if (!project) return;
    const json = JsonBuilder.buildVideoServiceJSON(project);
    setJsonPreview(json);
    setShowJsonModal(true);
  };

  const handleDownloadJSON = () => {
    if (project) {
      JsonBuilder.downloadJSON(project);
    }
  };

  const tabs: { id: TabName; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'characters', label: 'Characters', icon: '👥' },
    { id: 'scenes', label: 'Scenes', icon: '🎬' },
    { id: 'configuration', label: 'Configuration', icon: '⚙️' },
    { id: 'export', label: 'Export', icon: '📦' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-lg">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-lg text-red-600">Project not found</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-gray-600 text-sm mt-1">{project.script_title}</p>
        </div>
        <div className="flex gap-3">
          {saving && <span className="text-sm text-gray-500">Saving...</span>}
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <OverviewTab project={project} />
        )}

        {activeTab === 'characters' && (
          <CharactersTab project={project} />
        )}

        {activeTab === 'scenes' && (
          <ScenesTab project={project} />
        )}

        {activeTab === 'configuration' && (
          <ConfigurationTab project={project} onUpdate={handleUpdateProject} />
        )}

        {activeTab === 'export' && (
          <ExportTab
            project={project}
            onGenerateJSON={handleGenerateJSON}
            onDownload={handleDownloadJSON}
          />
        )}
      </div>

      {/* JSON Preview Modal */}
      {jsonPreview && (
        <JsonPreviewModal
          json={jsonPreview}
          projectName={project.name}
          isOpen={showJsonModal}
          onClose={() => setShowJsonModal(false)}
          onDownload={handleDownloadJSON}
        />
      )}
    </div>
  );
};

// Overview Tab
const OverviewTab: React.FC<{ project: ProjectWithFullData }> = ({ project }) => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Project Information</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Project Name</dt>
            <dd className="font-medium">{project.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Status</dt>
            <dd className="font-medium capitalize">{project.status}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Resolution</dt>
            <dd className="font-medium">{project.resolution}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Background Style</dt>
            <dd className="font-medium capitalize">{project.background_style}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Created</dt>
            <dd className="font-medium">{new Date(project.created_at).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Last Updated</dt>
            <dd className="font-medium">{new Date(project.updated_at).toLocaleDateString()}</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Statistics</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{project.script_lines?.length || 0}</div>
            <div className="text-sm text-gray-500 mt-1">Total Lines</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{project.scenes?.length || 0}</div>
            <div className="text-sm text-gray-500 mt-1">Scenes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{project.characters?.length || 0}</div>
            <div className="text-sm text-gray-500 mt-1">Characters</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Characters Tab
const CharactersTab: React.FC<{ project: ProjectWithFullData }> = ({ project }) => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Characters in Project</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.characters?.map((char, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                {char.base_portrait_url && (
                  <img
                    src={char.base_portrait_url}
                    alt={char.character_display_name || ''}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold">{char.character_display_name || char.character_name}</h4>
                  {char.voice_name && (
                    <p className="text-sm text-gray-600">Voice: {char.voice_name}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>{char.line_count} lines</span>
                    <span>{char.scene_count} scenes</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// Scenes Tab
const ScenesTab: React.FC<{ project: ProjectWithFullData }> = ({ project }) => {
  return (
    <div className="space-y-4">
      {project.scenes?.map((scene, idx) => (
        <Card key={scene.scene_id} className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold">Scene {idx + 1}: {scene.scene_id}</h3>
            <span className="text-sm text-gray-500">{scene.line_count} lines</span>
          </div>
          {scene.background_prompt && (
            <p className="text-sm text-gray-600 mb-2">
              Background: {scene.background_prompt}
            </p>
          )}
          {scene.characters_in_scene && scene.characters_in_scene.length > 0 && (
            <div className="text-sm">
              Characters: <span className="font-medium">{scene.characters_in_scene.join(', ')}</span>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

// Configuration Tab
const ConfigurationTab: React.FC<{
  project: ProjectWithFullData;
  onUpdate: (updates: Partial<VideoProject>) => void;
}> = ({ project, onUpdate }) => {
  return (
    <div className="space-y-6">
      <VideoConfigurationPanel project={project} onUpdate={onUpdate} />
      <ImageConfigurationPanel
        config={{}}
        onUpdate={(_config) => {}}
      />
    </div>
  );
};

// Export Tab
const ExportTab: React.FC<{
  project: ProjectWithFullData;
  onGenerateJSON: () => void;
  onDownload: () => void;
}> = ({ project, onGenerateJSON, onDownload }) => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Export Options</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Video Service JSON</h4>
            <p className="text-sm text-gray-600 mb-4">
              Export your project as JSON compatible with the video generation service.
            </p>
            <div className="flex gap-3">
              <Button onClick={onGenerateJSON}>
                Preview JSON
              </Button>
              <Button onClick={onDownload} variant="outline">
                Download JSON
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Project Readiness</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Script lines with characters</span>
            <span className="font-medium">{project.script_lines?.filter(l => l.character_name).length || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Script lines with backgrounds</span>
            <span className="font-medium">{project.script_lines?.filter(l => l.background_prompt).length || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Total scenes</span>
            <span className="font-medium">{project.scenes?.length || 0}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
