import React, { useState } from 'react';
import { Voice } from '../types/voice';
import { useVoices } from '../hooks/useVoices';
import { useVoiceTest } from '../hooks/useVoiceTest';
import { VoiceCreator } from '../components/VoiceCreator';
import { VoiceEditor } from '../components/VoiceEditor';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ParameterBar } from '../components/ui/ParameterBar';
import { ProgressBar } from '../components/ui/ProgressBar';

export function VoiceLibraryPage() {
  const { voices, loading, error, addVoice, updateVoice, removeVoice } = useVoices();
  const { testVoice, stopVoice, getTestState } = useVoiceTest();
  const [showVoiceCreator, setShowVoiceCreator] = useState(false);
  const [editingVoice, setEditingVoice] = useState<Voice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{voice: Voice} | null>(null);

  const handleVoiceCreated = async (voiceData: Omit<Voice, 'id'>) => {
    const newVoice = await addVoice(voiceData);
    if (newVoice) {
      setShowVoiceCreator(false);
    }
  };

  const handleVoiceUpdated = async (voiceId: string, updates: Partial<Voice>) => {
    const updatedVoice = await updateVoice(voiceId, updates);
    if (updatedVoice) {
      setEditingVoice(null);
    }
  };

  const handleVoiceDelete = (voice: Voice) => {
    setDeleteConfirm({ voice });
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await removeVoice(deleteConfirm.voice.id);
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-full max-w-md">
          <ProgressBar
            progress={0}
            label="Loading voices..."
            indeterminate
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Voice Library</h2>
          <p className="text-gray-600">Create and manage your custom voices ({voices.length} voices)</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowVoiceCreator(true)}
          className="flex items-center gap-2"
          ariaLabel="Create a new custom voice"
        >
          <span>➕</span>
          Create New Voice
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600">⚠️</span>
            <span className="ml-2 text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Voices Grid */}
      {voices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎤</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No voices yet</h3>
          <p className="text-gray-600 mb-4">Create your first custom voice to get started</p>
          <Button
            variant="primary"
            onClick={() => setShowVoiceCreator(true)}
            ariaLabel="Create your first voice"
          >
            Create Voice
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {voices.map((voice) => {
            const testState = getTestState(voice.id);
            
            return (
              <div key={voice.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{voice.name}</h3>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingVoice(voice)}
                      ariaLabel={`Edit ${voice.name} voice settings`}
                      className="text-blue-500 hover:text-blue-700 p-1"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVoiceDelete(voice)}
                      ariaLabel={`Delete ${voice.name} voice`}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </div>
                </div>
                
                {voice.description && (
                  <p className="text-gray-600 mb-4">{voice.description}</p>
                )}

                <div className="space-y-3">
                  <ParameterBar
                    label="Speed"
                    value={voice.speed || 1.0}
                    maxValue={2}
                    size="sm"
                  />
                  <ParameterBar
                    label="Pitch"
                    value={voice.pitch || 1.0}
                    maxValue={2}
                    size="sm"
                  />
                  <ParameterBar
                    label="Temperature"
                    value={voice.temperature || 0.5}
                    maxValue={1}
                    size="sm"
                  />
                  <ParameterBar
                    label="Top P"
                    value={voice.top_p || 0.8}
                    maxValue={1}
                    size="sm"
                  />
                  <ParameterBar
                    label="Top K"
                    value={voice.top_k || 50}
                    maxValue={100}
                    size="sm"
                  />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Seed:</span>
                    <span className="font-medium text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{voice.seed || 2024}</span>
                  </div>
                </div>

                {/* Test Error Display */}
                {testState.error && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {testState.error}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingVoice(voice)}
                    className="flex-1"
                    ariaLabel={`Edit ${voice.name} voice`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={testState.isPlaying ? 'danger' : 'success'}
                    size="sm"
                    onClick={() => testState.isPlaying ? stopVoice(voice.id) : testVoice(voice)}
                    disabled={testState.isGenerating}
                    isLoading={testState.isGenerating}
                    className="flex-1 flex items-center justify-center gap-2"
                    ariaLabel={testState.isPlaying ? `Stop testing ${voice.name}` : `Test ${voice.name} voice`}
                  >
                    {testState.isGenerating ? (
                      'Generating...'
                    ) : testState.isPlaying ? (
                      <>
                        <span>⏹️</span>
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <span>▶️</span>
                        <span>Test</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Voice Creator Modal */}
      {showVoiceCreator && (
        <VoiceCreator
          onVoiceCreated={handleVoiceCreated}
          onClose={() => setShowVoiceCreator(false)}
        />
      )}

      {/* Voice Editor Modal */}
      {editingVoice && (
        <VoiceEditor
          voice={editingVoice}
          onVoiceUpdated={handleVoiceUpdated}
          onClose={() => setEditingVoice(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={confirmDelete}
          title="Delete Voice"
          message={`Are you sure you want to delete "${deleteConfirm.voice.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          icon="🗑️"
        />
      )}
    </div>
  );
}