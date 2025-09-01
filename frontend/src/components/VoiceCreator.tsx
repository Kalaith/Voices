import React, { useState } from 'react';
import { Voice } from '../types/voice';
import { DEFAULT_VOICE_PARAMETERS } from '../utils/constants';

interface VoiceCreatorProps {
  onVoiceCreated: (voice: Voice) => void;
  onClose: () => void;
}

export const VoiceCreator: React.FC<VoiceCreatorProps> = ({ onVoiceCreated, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [speed, setSpeed] = useState(DEFAULT_VOICE_PARAMETERS.speed);
  const [pitch, setPitch] = useState(DEFAULT_VOICE_PARAMETERS.pitch);
  const [temperature, setTemperature] = useState(DEFAULT_VOICE_PARAMETERS.temperature);
  const [topP, setTopP] = useState(DEFAULT_VOICE_PARAMETERS.top_p);
  const [topK, setTopK] = useState(DEFAULT_VOICE_PARAMETERS.top_k);
  const [seed, setSeed] = useState(DEFAULT_VOICE_PARAMETERS.seed);
  const [batchSize, setBatchSize] = useState(1);
  const [exaggeration, setExaggeration] = useState(0.5);
  const [cfgWeight, setCfgWeight] = useState(0.5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    const voice: Voice = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim() || undefined,
      parameters: {
        speed,
        pitch,
        temperature,
        top_p: topP,
        top_k: topK,
        seed,
        batch_size: batchSize,
        exaggeration,
        cfg_weight: cfgWeight,
      },
    };

    onVoiceCreated(voice);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Custom Voice</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Voice Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter voice name"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Voice Parameters</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Speed: {speed.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pitch: {pitch.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature: {temperature.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Top P: {topP.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Top K: {topK}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seed: {seed}
                  <span className="text-xs text-gray-500 ml-2">(for consistent voice generation)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="2147483647"
                    value={seed}
                    onChange={(e) => setSeed(parseInt(e.target.value) || 2024)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setSeed(Math.floor(Math.random() * 2147483647))}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    title="Generate random seed"
                  >
                    🎲
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Same seed = same voice characteristics. Change seed for voice variations.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Size: {batchSize}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Higher values = faster generation but more memory usage. Start with 1.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exaggeration: {exaggeration.toFixed(1)}
                  <span className="text-xs text-gray-500 ml-2">(Chatterbox only - emotion control)</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={exaggeration}
                  onChange={(e) => setExaggeration(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CFG Weight: {cfgWeight.toFixed(1)}
                  <span className="text-xs text-gray-500 ml-2">(Chatterbox only - generation control)</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={cfgWeight}
                  onChange={(e) => setCfgWeight(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Voice
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};