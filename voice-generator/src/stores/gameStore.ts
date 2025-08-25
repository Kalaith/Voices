import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Voice {
  id: string;
  name: string;
  description?: string;
  parameters: {
    speed: number;
    pitch: number;
    temperature: number;
    top_p: number;
    top_k: number;
  };
}

interface Script {
  id: string;
  name: string;
  speakers: Speaker[];
  lines: ScriptLine[];
}

interface Speaker {
  id: string;
  name: string;
  voiceId: string;
  color: string;
}

interface ScriptLine {
  id: string;
  speakerId: string;
  text: string;
  duration?: number;
}

interface AudioGeneration {
  id: string;
  scriptId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  audioUrl?: string;
  errorMessage?: string;
}

interface AppState {
  voices: Voice[];
  scripts: Script[];
  audioGenerations: AudioGeneration[];
  currentScript: Script | null;
  isLoading: boolean;
}

interface AppActions {
  setVoices: (voices: Voice[]) => void;
  addVoice: (voice: Voice) => void;
  updateVoice: (id: string, voice: Partial<Voice>) => void;
  removeVoice: (id: string) => void;
  setScripts: (scripts: Script[]) => void;
  addScript: (script: Script) => void;
  updateScript: (id: string, script: Partial<Script>) => void;
  removeScript: (id: string) => void;
  setCurrentScript: (script: Script | null) => void;
  setAudioGenerations: (generations: AudioGeneration[]) => void;
  addAudioGeneration: (generation: AudioGeneration) => void;
  updateAudioGeneration: (id: string, generation: Partial<AudioGeneration>) => void;
  setLoading: (loading: boolean) => void;
  resetApp: () => void;
}

type AppStore = AppState & AppActions;

const initialState: AppState = {
  voices: [],
  scripts: [],
  audioGenerations: [],
  currentScript: null,
  isLoading: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Voice actions
      setVoices: (voices) => set({ voices }),
      addVoice: (voice) => set(state => ({ 
        voices: [...state.voices, voice] 
      })),
      updateVoice: (id, updatedVoice) => set(state => ({
        voices: state.voices.map(voice => 
          voice.id === id ? { ...voice, ...updatedVoice } : voice
        )
      })),
      removeVoice: (id) => set(state => ({
        voices: state.voices.filter(voice => voice.id !== id)
      })),
      
      // Script actions
      setScripts: (scripts) => set({ scripts }),
      addScript: (script) => set(state => ({ 
        scripts: [...state.scripts, script] 
      })),
      updateScript: (id, updatedScript) => set(state => ({
        scripts: state.scripts.map(script => 
          script.id === id ? { ...script, ...updatedScript } : script
        )
      })),
      removeScript: (id) => set(state => ({
        scripts: state.scripts.filter(script => script.id !== id),
        currentScript: state.currentScript?.id === id ? null : state.currentScript
      })),
      setCurrentScript: (script) => set({ currentScript: script }),
      
      // Audio generation actions
      setAudioGenerations: (audioGenerations) => set({ audioGenerations }),
      addAudioGeneration: (generation) => set(state => ({ 
        audioGenerations: [...state.audioGenerations, generation] 
      })),
      updateAudioGeneration: (id, updatedGeneration) => set(state => ({
        audioGenerations: state.audioGenerations.map(gen => 
          gen.id === id ? { ...gen, ...updatedGeneration } : gen
        )
      })),
      
      // UI actions
      setLoading: (isLoading) => set({ isLoading }),
      
      // Reset action
      resetApp: () => set(initialState)
    }),
    {
      name: 'voice-generator-storage',
      partialize: (state) => ({ 
        voices: state.voices,
        scripts: state.scripts,
        currentScript: state.currentScript
      })
    }
  )
);