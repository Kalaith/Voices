import React from 'react';
import { VoiceTestingLab } from '../components/VoiceTestingLab';
import { useVoices } from '../hooks/useVoices';

export function VoiceTestingLabPage() {
  const { voices, loading, error } = useVoices();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading voices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-600">⚠️</span>
          <span className="ml-2 text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return <VoiceTestingLab voices={voices} />;
}