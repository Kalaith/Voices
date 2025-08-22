import { useState, useCallback } from 'react';
import { Voice } from '../types/voice';
import { apiService } from '../lib/services/apiService';

interface VoiceTestState {
  isPlaying: boolean;
  isGenerating: boolean;
  error: string | null;
  audioUrl: string | null;
}

export const useVoiceTest = () => {
  const [testStates, setTestStates] = useState<Record<string, VoiceTestState>>({});

  const getTestState = useCallback((voiceId: string): VoiceTestState => {
    return testStates[voiceId] || {
      isPlaying: false,
      isGenerating: false,
      error: null,
      audioUrl: null
    };
  }, [testStates]);

  const updateTestState = useCallback((voiceId: string, updates: Partial<VoiceTestState>) => {
    setTestStates(prev => ({
      ...prev,
      [voiceId]: { ...prev[voiceId] || {}, ...updates }
    }));
  }, []);

  const testVoice = useCallback(async (voice: Voice, testText?: string) => {
    const sampleText = testText || `Hello! This is ${voice.name} speaking. I can adjust my speed, pitch, and other parameters to create the perfect voice for your projects.`;
    
    updateTestState(voice.id, { 
      isGenerating: true, 
      error: null,
      isPlaying: false 
    });

    try {
      // Call the backend API to generate test audio
      const response = await apiService.post('/audio/generate', {
        text: sampleText,
        voice: voice
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data && response.data.audio_url) {
        updateTestState(voice.id, {
          isGenerating: false,
          audioUrl: response.data.audio_url,
          isPlaying: true
        });

        // Create and play audio element
        const audio = new Audio(`http://localhost:8000${response.data.audio_url}`);
        
        audio.onended = () => {
          updateTestState(voice.id, { isPlaying: false });
        };

        audio.onerror = () => {
          updateTestState(voice.id, { 
            isPlaying: false, 
            error: 'Failed to play audio' 
          });
        };

        await audio.play();

      } else {
        throw new Error('No audio URL received');
      }

    } catch (error) {
      updateTestState(voice.id, {
        isGenerating: false,
        isPlaying: false,
        error: error instanceof Error ? error.message : 'Failed to generate test audio'
      });
    }
  }, [updateTestState]);

  const stopVoice = useCallback((voiceId: string) => {
    updateTestState(voiceId, { 
      isPlaying: false 
    });
    
    // Stop any playing audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }, [updateTestState]);

  return {
    testVoice,
    stopVoice,
    getTestState
  };
};