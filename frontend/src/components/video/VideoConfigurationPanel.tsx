import React from 'react';
import { VideoProject } from '../../types/video';
import { Card } from '../ui/Card';

interface VideoConfigurationPanelProps {
  project: VideoProject;
  onUpdate: (updates: Partial<VideoProject>) => void;
}

export const VideoConfigurationPanel: React.FC<VideoConfigurationPanelProps> = ({
  project,
  onUpdate
}) => {
  const handleChange = (field: keyof VideoProject, value: any) => {
    onUpdate({ [field]: value });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Video Configuration</h3>

      <div className="space-y-6">
        {/* FPS Setting */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Frames Per Second (FPS)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="24"
              max="60"
              step="6"
              value={30}
              onChange={(e) => handleChange('fps' as any, parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-medium w-12">30</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Higher FPS = smoother animations (24, 30, 60)
          </p>
        </div>

        {/* Scene Duration */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Default Scene Duration (seconds)
          </label>
          <input
            type="number"
            min="1"
            max="30"
            step="0.5"
            value={5.0}
            onChange={(e) => handleChange('scene_duration' as any, parseFloat(e.target.value))}
            className="w-full p-2 border rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">
            Default duration for each scene
          </p>
        </div>

        {/* Visual Novel Mode */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium">
              Visual Novel Mode
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Static backgrounds with character overlays
            </p>
          </div>
          <input
            type="checkbox"
            checked={true}
            onChange={(e) => handleChange('visual_novel_mode' as any, e.target.checked)}
            className="w-5 h-5"
          />
        </div>

        {/* Character Display */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium">
              Display Character Portraits
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Show character portraits during dialogue
            </p>
          </div>
          <input
            type="checkbox"
            checked={true}
            onChange={(e) => handleChange('character_display' as any, e.target.checked)}
            className="w-5 h-5"
          />
        </div>

        {/* Resolution (already exists) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Resolution
          </label>
          <select
            value={project.resolution}
            onChange={(e) => handleChange('resolution', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="720p">720p (1280x720)</option>
            <option value="1080p">1080p (1920x1080)</option>
            <option value="1440p">1440p (2560x1440)</option>
            <option value="2160p">4K (3840x2160)</option>
          </select>
        </div>

        {/* Background Style (already exists) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Background Style
          </label>
          <select
            value={project.background_style}
            onChange={(e) => handleChange('background_style', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="anime">Anime</option>
            <option value="realistic">Realistic</option>
            <option value="fantasy">Fantasy</option>
            <option value="modern">Modern</option>
            <option value="historical">Historical</option>
            <option value="cyberpunk">Cyberpunk</option>
            <option value="medieval">Medieval</option>
            <option value="sci-fi">Sci-Fi</option>
          </select>
        </div>
      </div>
    </Card>
  );
};
