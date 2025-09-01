import React, { useState } from 'react';
import { CharacterManager } from '../components/CharacterManager';
import { VideoProjectCreator } from '../components/VideoProjectCreator';
import { VideoScriptEditor } from '../components/VideoScriptEditor';
import { VideoProject, Character } from '../types';

export const VideoManagerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'characters' | 'editor'>('projects');
  const [selectedProject, setSelectedProject] = useState<VideoProject | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const handleProjectSelected = (project: VideoProject) => {
    setSelectedProject(project);
    setActiveTab('editor');
  };

  const handleProjectCreated = (project: VideoProject) => {
    setSelectedProject(project);
    setActiveTab('editor');
  };

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
  };

  const tabConfig = [
    {
      id: 'projects' as const,
      label: 'Projects',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Create and manage video projects'
    },
    {
      id: 'characters' as const,
      label: 'Characters',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      description: 'Manage character profiles and voices'
    },
    {
      id: 'editor' as const,
      label: 'Script Editor',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      description: 'Edit scripts with video metadata',
      disabled: !selectedProject
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Manager</h1>
          <p className="text-gray-600">
            Create visual novel-style videos with character dialogue and scene backgrounds.
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabConfig.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  disabled={tab.disabled}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600' 
                      : tab.disabled
                        ? 'border-transparent text-gray-400 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.disabled && (
                    <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                      Select Project
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Descriptions */}
          <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
            {tabConfig.find(tab => tab.id === activeTab)?.description}
            {selectedProject && activeTab === 'editor' && (
              <span className="ml-2 font-medium">• {selectedProject.name}</span>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border min-h-[600px]">
          <div className="p-6">
            {activeTab === 'projects' && (
              <VideoProjectCreator 
                onProjectCreated={handleProjectCreated}
                onProjectSelected={handleProjectSelected}
              />
            )}
            
            {activeTab === 'characters' && (
              <CharacterManager 
                onCharacterSelect={handleCharacterSelect}
              />
            )}
            
            {activeTab === 'editor' && selectedProject && (
              <VideoScriptEditor 
                scriptId={selectedProject.script_id}
                onScriptChange={(lines) => {
                  console.log('Script lines updated:', lines.length);
                }}
              />
            )}

            {activeTab === 'editor' && !selectedProject && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
                <p className="text-gray-500 text-center mb-6">
                  Select a video project from the Projects tab to start editing your script.
                </p>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go to Projects
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        {(selectedProject || selectedCharacter) && (
          <div className="mt-4 bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {selectedProject && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600">Project:</span>
                    <span className="font-medium">{selectedProject.name}</span>
                  </div>
                )}
                {selectedCharacter && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-600">Selected Character:</span>
                    <span className="font-medium">{selectedCharacter.name}</span>
                  </div>
                )}
              </div>
              <div className="text-gray-500">
                Visual Novel Video Generator v1.0
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};