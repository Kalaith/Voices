import { useState, useCallback, useEffect } from 'react';
import { Voice } from '../types/voice';
import { apiService } from '../lib/services/apiService';

export const useVoices = () => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const response = await apiService.get<Voice[]>('/voices');
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setVoices(response.data);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  const addVoice = useCallback(async (voice: Omit<Voice, 'id'>) => {
    setError(null);
    const response = await apiService.post<Voice>('/voices', voice);
    
    if (response.error) {
      setError(response.error);
      return null;
    } else if (response.data) {
      setVoices(prev => [...prev, response.data!]);
      return response.data;
    }
    return null;
  }, []);

  const removeVoice = useCallback(async (voiceId: string) => {
    setError(null);
    const response = await apiService.delete(`/voices/${voiceId}`);
    
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setVoices(prev => prev.filter(v => v.id !== voiceId));
      return true;
    }
  }, []);

  const updateVoice = useCallback(async (voiceId: string, updates: Partial<Voice>) => {
    setError(null);
    const response = await apiService.put<Voice>(`/voices/${voiceId}`, updates);
    
    if (response.error) {
      setError(response.error);
      return null;
    } else if (response.data) {
      setVoices(prev => prev.map(v => v.id === voiceId ? response.data! : v));
      return response.data;
    }
    return null;
  }, []);

  const getVoiceById = useCallback((voiceId: string) => {
    return voices.find(v => v.id === voiceId);
  }, [voices]);

  return {
    voices,
    loading,
    error,
    addVoice,
    removeVoice,
    updateVoice,
    getVoiceById,
    refreshVoices: fetchVoices,
  };
};