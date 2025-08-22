import { useState, useCallback } from 'react';
import { AudioGeneration } from '../types/audio';
import { apiService } from '../lib/services/apiService';

export const useAudioGeneration = () => {
  const [generations, setGenerations] = useState<AudioGeneration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGenerations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const response = await apiService.get<AudioGeneration[]>('/audio');
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setGenerations(response.data);
    }
    
    setLoading(false);
  }, []);

  const getGenerationsByScript = useCallback(async (scriptId: string) => {
    setLoading(true);
    setError(null);
    
    const response = await apiService.get<AudioGeneration[]>(`/audio/script/${scriptId}`);
    if (response.error) {
      setError(response.error);
      return [];
    } else if (response.data) {
      return response.data;
    }
    
    setLoading(false);
    return [];
  }, []);

  const startGeneration = useCallback(async (scriptId: string) => {
    setError(null);
    const response = await apiService.post<AudioGeneration>('/audio', { scriptId });
    
    if (response.error) {
      setError(response.error);
      return null;
    } else if (response.data) {
      setGenerations(prev => [...prev, response.data!]);
      return response.data;
    }
    return null;
  }, []);

  const updateGenerationStatus = useCallback(async (
    id: string, 
    status: AudioGeneration['status'],
    data?: { audioUrl?: string; error?: string }
  ) => {
    setError(null);
    const response = await apiService.put<AudioGeneration>(`/audio/${id}/status`, {
      status,
      ...data
    });
    
    if (response.error) {
      setError(response.error);
      return null;
    } else if (response.data) {
      setGenerations(prev => prev.map(g => g.id === id ? response.data! : g));
      return response.data;
    }
    return null;
  }, []);

  const deleteGeneration = useCallback(async (id: string) => {
    setError(null);
    const response = await apiService.delete(`/audio/${id}`);
    
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setGenerations(prev => prev.filter(g => g.id !== id));
      return true;
    }
  }, []);

  return {
    generations,
    loading,
    error,
    fetchGenerations,
    getGenerationsByScript,
    startGeneration,
    updateGenerationStatus,
    deleteGeneration,
  };
};