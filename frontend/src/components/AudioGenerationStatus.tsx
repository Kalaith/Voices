import React from 'react';
import { AudioGeneration } from '../types/audio';
import { AudioPlayer } from './AudioPlayer';

interface AudioGenerationStatusProps {
  audioGeneration: AudioGeneration | null;
  currentScriptName?: string;
}

export const AudioGenerationStatus: React.FC<AudioGenerationStatusProps> = ({
  audioGeneration,
  currentScriptName,
}) => {
  if (!audioGeneration) return null;

  return (
    <div className="mt-6">
      {audioGeneration.status === 'generating' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-800">Generating audio...</span>
          </div>
        </div>
      )}

      {audioGeneration.status === 'completed' && audioGeneration.audioUrl && (
        <AudioPlayer
          audioUrl={audioGeneration.audioUrl}
          title={currentScriptName}
        />
      )}

      {audioGeneration.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <div className="font-medium">Error generating audio</div>
            <div className="text-sm mt-1">{audioGeneration.error}</div>
          </div>
        </div>
      )}
    </div>
  );
};