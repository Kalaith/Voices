import React, { useState, useEffect } from 'react';
import { AudioGeneration } from '../types/audio';
import { ScriptEditor } from '../components/ScriptEditor';
import { ScriptList } from '../components/ScriptList';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { AudioGenerationStatus } from '../components/AudioGenerationStatus';
import { useAudioGeneration } from '../hooks/useAudioGeneration';
import { useVoices } from '../hooks/useVoices';
import { useScripts } from '../hooks/useScripts';

export function VoiceGeneratorPage() {
  const { voices } = useVoices();
  const { scripts, currentScript, setCurrentScript, createScript, updateScript } = useScripts();
  const { startGeneration } = useAudioGeneration();
  const [audioGeneration, setAudioGeneration] = useState<AudioGeneration | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    checkServiceConnection();
  }, []);

  const checkServiceConnection = async () => {
    try {
      const response = await fetch('http://localhost:9966/health');
      setIsConnected(response.ok);
    } catch {
      setIsConnected(false);
    }
  };

  const handleScriptUpdate = (updatedScript: any) => {
    updateScript(updatedScript.id, updatedScript);
  };

  const handleGenerateAudio = async (script: any) => {
    if (!isConnected) {
      alert('Voice generation service is not connected. Please ensure the service is running on port 9966.');
      return;
    }

    try {
      const generation = await startGeneration(script.id);
      if (generation) {
        setAudioGeneration(generation);
      }
    } catch (error) {
      console.error('Failed to start audio generation:', error);
      alert('Failed to start audio generation. Please try again.');
    }
  };

  const handleCreateScript = async () => {
    const newScript = await createScript();
    setAudioGeneration(null);
    if (newScript) {
      setCurrentScript(newScript);
    }
  };

  const handleScriptSelect = (script: any) => {
    setCurrentScript(script);
    setAudioGeneration(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Audio Generator</h2>
        <p className="text-gray-600">Generate audio from your scripts using custom voices</p>
        <div className="mt-4">
          <ConnectionStatus isConnected={isConnected} onRetryConnection={checkServiceConnection} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <ScriptList 
            scripts={scripts}
            currentScript={currentScript}
            onScriptSelect={handleScriptSelect}
            onCreateScript={handleCreateScript}
          />
        </div>

        <div className="lg:col-span-2">
          {currentScript && (
            <ScriptEditor
              script={currentScript}
              voices={voices}
              onScriptUpdate={handleScriptUpdate}
              onGenerateAudio={handleGenerateAudio}
            />
          )}

          <AudioGenerationStatus 
            audioGeneration={audioGeneration}
            currentScriptName={currentScript?.name}
          />
        </div>
      </div>
    </div>
  );
}

