import React, { useState } from 'react';
import { Voice } from '../types/voice';
import { useVoiceTest } from '../hooks/useVoiceTest';

interface VoiceEditorProps {
  voice: Voice;
  onVoiceUpdated: (voiceId: string, updates: Partial<Voice>) => void;
  onClose: () => void;
}

export const VoiceEditor: React.FC<VoiceEditorProps> = ({
  voice,
  onVoiceUpdated,
  onClose
}) => {
  const { testVoice, stopVoice, getTestState } = useVoiceTest();
  const [formData, setFormData] = useState({
    name: voice.name,
    description: voice.description || '',
    speed: voice.speed || 1.0,
    pitch: voice.pitch || 1.0,
    temperature: voice.temperature || 0.3,
    top_p: voice.top_p || 0.7,
    top_k: voice.top_k || 20,
    seed: voice.seed || 2024,
    batch_size: voice.batch_size || 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVoiceUpdated(voice.id, formData);
  };

  const handleParameterChange = (param: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const handleTestCurrentVoice = () => {
    // Create a temporary voice object with current form data
    const testVoiceData: Voice = {
      ...formData,
      id: voice.id,
    };
    testVoice(testVoiceData);
  };

  const testState = getTestState(voice.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Edit Voice</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Voice Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voice Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter voice name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe this voice..."
              rows={3}
            />
          </div>

          {/* Voice Parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Voice Parameters</h3>

            {/* Speed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speed: {formData.speed}
              </label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={formData.speed}
                onChange={(e) => handleParameterChange('speed', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Slow (0.1)</span>
                <span>Fast (3.0)</span>
              </div>
            </div>

            {/* Pitch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pitch: {formData.pitch}
              </label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={formData.pitch}
                onChange={(e) => handleParameterChange('pitch', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low (0.1)</span>
                <span>High (3.0)</span>
              </div>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature: {formData.temperature}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => handleParameterChange('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Conservative (0.1)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>

            {/* Top P */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top P: {formData.top_p}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={formData.top_p}
                onChange={(e) => handleParameterChange('top_p', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Focused (0.1)</span>
                <span>Diverse (1.0)</span>
              </div>
            </div>

            {/* Top K */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top K: {formData.top_k}
              </label>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={formData.top_k}
                onChange={(e) => handleParameterChange('top_k', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Narrow (1)</span>
                <span>Wide (100)</span>
              </div>
            </div>

            {/* Seed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seed: {formData.seed}
                <span className="text-xs text-gray-500 ml-2">(for consistent voice)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="2147483647"
                  value={formData.seed}
                  onChange={(e) => handleParameterChange('seed', parseInt(e.target.value) || 2024)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleParameterChange('seed', Math.floor(Math.random() * 2147483647))}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  title="Generate random seed"
                >
                  🎲
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Same seed = same voice. Change for variations.
              </div>
            </div>

            {/* Batch Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Size: {formData.batch_size}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={formData.batch_size}
                onChange={(e) => handleParameterChange('batch_size', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Slower (1)</span>
                <span>Faster (10)</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Higher values = faster generation but more memory usage
              </div>
            </div>
          </div>

          {/* Test Error Display */}
          {testState.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {testState.error}
            </div>
          )}

          {/* Test Voice Section */}
          <div className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => testState.isPlaying ? stopVoice(voice.id) : handleTestCurrentVoice()}
              disabled={testState.isGenerating}
              className={`w-full px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
                testState.isGenerating
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : testState.isPlaying
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {testState.isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  <span>Generating Preview...</span>
                </>
              ) : testState.isPlaying ? (
                <>
                  <span>⏹️</span>
                  <span>Stop Preview</span>
                </>
              ) : (
                <>
                  <span>▶️</span>
                  <span>Test Voice with Current Settings</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Test how the voice sounds with your current parameter settings
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Update Voice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};