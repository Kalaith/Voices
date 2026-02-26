import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { GENERATION_MODES } from '../../types/videoServiceSchema';

interface ScriptGenerationConfigData {
  generation_mode: 'predefined' | 'ai_generated';
  prompt?: string;
  max_length?: number;
  temperature?: number;
  top_p?: number;
  kobold_endpoint?: string;
}

interface ScriptGenerationConfigProps {
  config: Partial<ScriptGenerationConfigData>;
  onUpdate: (config: Partial<ScriptGenerationConfigData>) => void;
  onGenerate?: () => void;
}

export const ScriptGenerationConfig: React.FC<ScriptGenerationConfigProps> = ({
  config = {},
  onUpdate,
  onGenerate
}) => {
  const [localConfig, setLocalConfig] = useState<Partial<ScriptGenerationConfigData>>({
    generation_mode: 'predefined',
    max_length: 1000,
    temperature: 0.7,
    top_p: 0.9,
    ...config
  });

  const handleChange = <K extends keyof ScriptGenerationConfigData>(field: K, value: ScriptGenerationConfigData[K]) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    onUpdate(updated);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Script Generation Configuration</h3>

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
            {GENERATION_MODES.map(mode => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>

        {localConfig.generation_mode === 'ai_generated' && (
          <>
            {/* KoboldAI Endpoint */}
            <div>
              <label className="block text-sm font-medium mb-2">
                KoboldAI Endpoint
              </label>
              <input
                type="text"
                placeholder="http://localhost:5000"
                value={localConfig.kobold_endpoint || ''}
                onChange={(e) => handleChange('kobold_endpoint', e.target.value)}
                className="w-full p-2 border rounded-md font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL of your KoboldAI instance
              </p>
            </div>

            {/* Story Prompt */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Story Prompt
              </label>
              <textarea
                placeholder="Enter your story premise and context..."
                value={localConfig.prompt || ''}
                onChange={(e) => handleChange('prompt', e.target.value)}
                className="w-full p-3 border rounded-md h-32"
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide context and direction for the AI to generate your story
              </p>
            </div>

            {/* Max Length */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Maximum Length (tokens)
              </label>
              <input
                type="number"
                min="100"
                max="4000"
                step="100"
                value={localConfig.max_length}
                onChange={(e) => handleChange('max_length', parseInt(e.target.value))}
                className="w-full p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of tokens to generate
              </p>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Temperature
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={localConfig.temperature}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{localConfig.temperature?.toFixed(1)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Lower = more focused, Higher = more creative
              </p>
            </div>

            {/* Top P (Nucleus Sampling) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Top P (Nucleus Sampling)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localConfig.top_p}
                  onChange={(e) => handleChange('top_p', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{localConfig.top_p?.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Controls diversity of word selection
              </p>
            </div>

            {/* Generate Button */}
            {onGenerate && (
              <div className="pt-4">
                <Button onClick={onGenerate} className="w-full">
                  Generate Script with AI
                </Button>
              </div>
            )}
          </>
        )}

        {localConfig.generation_mode === 'predefined' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              Using predefined script from Script Manager. Edit your script in the Scenes tab or Script Manager page.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
