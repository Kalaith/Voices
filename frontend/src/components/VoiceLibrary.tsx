import React, { useState } from 'react';
import { Voice } from '../types/voice';
import { VoiceCreator } from './VoiceCreator';

interface VoiceLibraryProps {
  voices: Voice[];
  onVoiceCreated: (voice: Voice) => void;
}

export const VoiceLibrary: React.FC<VoiceLibraryProps> = ({ voices, onVoiceCreated }) => {
  const [showVoiceCreator, setShowVoiceCreator] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Custom Voices</h2>
        <button
          onClick={() => setShowVoiceCreator(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Voice
        </button>
      </div>
      
      {voices.length === 0 ? (
        <p className="text-gray-600 text-center py-4">No voices created yet</p>
      ) : (
        <div className="space-y-3">
          {voices.map((voice) => (
            <div key={voice.id} className="p-3 border border-gray-200 rounded-lg">
              <div className="font-medium text-gray-900">{voice.name}</div>
              {voice.description && (
                <div className="text-sm text-gray-600 mt-1">{voice.description}</div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                Speed: {voice.parameters.speed}, Pitch: {voice.parameters.pitch}
              </div>
            </div>
          ))}
        </div>
      )}

      {showVoiceCreator && (
        <VoiceCreator
          onVoiceCreated={(voice) => {
            onVoiceCreated(voice);
            setShowVoiceCreator(false);
          }}
          onClose={() => setShowVoiceCreator(false)}
        />
      )}
    </div>
  );
};