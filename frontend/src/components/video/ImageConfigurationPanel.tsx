import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { IMAGE_GENERATION_MODES, IMAGE_STYLES } from '../../types/videoServiceSchema';

interface ImageConfig {
  generation_mode: 'generate' | 'predefined';
  style: string;
  character_style: string;
  background_style: string;
  width: number;
  height: number;
  steps: number;
  files: string[];
}

interface ImageConfigurationPanelProps {
  config: Partial<ImageConfig>;
  onUpdate: (config: Partial<ImageConfig>) => void;
}

export const ImageConfigurationPanel: React.FC<ImageConfigurationPanelProps> = ({
  config = {},
  onUpdate
}) => {
  const [localConfig, setLocalConfig] = useState<Partial<ImageConfig>>({
    generation_mode: 'generate',
    style: 'anime',
    character_style: 'anime',
    background_style: 'anime',
    width: 1920,
    height: 1080,
    steps: 30,
    files: [],
    ...config
  });

  const handleChange = (field: keyof ImageConfig, value: any) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    onUpdate(updated);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Image Generation Configuration</h3>

      <div className="space-y-6">
        {/* Generation Mode */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Generation Mode
          </label>
          <select
            value={localConfig.generation_mode}
            onChange={(e) => handleChange('generation_mode', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            {IMAGE_GENERATION_MODES.map(mode => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>

        {localConfig.generation_mode === 'generate' && (
          <>
            {/* Art Style */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Art Style
              </label>
              <select
                value={localConfig.style}
                onChange={(e) => handleChange('style', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {IMAGE_STYLES.map(style => (
                  <option key={style} value={style}>
                    {style.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Character Style */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Character Style
              </label>
              <select
                value={localConfig.character_style}
                onChange={(e) => handleChange('character_style', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {IMAGE_STYLES.map(style => (
                  <option key={style} value={style}>
                    {style.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Background Style */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Background Style
              </label>
              <select
                value={localConfig.background_style}
                onChange={(e) => handleChange('background_style', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {IMAGE_STYLES.map(style => (
                  <option key={style} value={style}>
                    {style.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Generation Steps */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Generation Steps
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={localConfig.steps}
                  onChange={(e) => handleChange('steps', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{localConfig.steps}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                More steps = higher quality (slower generation)
              </p>
            </div>
          </>
        )}

        {/* Dimensions */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Image Dimensions
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                placeholder="Width"
                value={localConfig.width}
                onChange={(e) => handleChange('width', parseInt(e.target.value))}
                className="w-full p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">Width (px)</p>
            </div>
            <div>
              <input
                type="number"
                placeholder="Height"
                value={localConfig.height}
                onChange={(e) => handleChange('height', parseInt(e.target.value))}
                className="w-full p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">Height (px)</p>
            </div>
          </div>
        </div>

        {/* Predefined Files */}
        {localConfig.generation_mode === 'predefined' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Image Files
            </label>
            <textarea
              placeholder="Enter image file paths (one per line)"
              value={localConfig.files?.join('\n')}
              onChange={(e) => handleChange('files', e.target.value.split('\n').filter(Boolean))}
              className="w-full p-2 border rounded-md h-32 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              List of predefined image file paths
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
