import { useState, useCallback, useEffect } from 'react';
import { Script, ScriptLine, Speaker } from '../types/script';
import { apiService } from '../lib/services/apiService';

export const useScripts = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [currentScript, setCurrentScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScripts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const response = await apiService.get<Script[]>('/scripts');
    if (response.error) {
      setError(response.error);
      const defaultScript: Script = {
        id: crypto.randomUUID(),
        name: 'New Script',
        speakers: [],
        lines: [],
      };
      setScripts([defaultScript]);
      setCurrentScript(defaultScript);
    } else if (response.data) {
      setScripts(response.data);
      setCurrentScript(response.data[0] || null);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  const createScript = useCallback(async (name?: string) => {
    setError(null);
    const scriptData = {
      name: name || `Script ${scripts.length + 1}`,
      speakers: [],
      lines: [],
    };
    
    const response = await apiService.post<Script>('/scripts', scriptData);
    
    if (response.error) {
      setError(response.error);
      return null;
    } else if (response.data) {
      setScripts(prev => [...prev, response.data!]);
      setCurrentScript(response.data);
      return response.data;
    }
    return null;
  }, [scripts.length]);

  const updateScript = useCallback(async (scriptId: string, updates: Partial<Script>) => {
    setError(null);
    const response = await apiService.put<Script>(`/scripts/${scriptId}`, updates);
    
    if (response.error) {
      setError(response.error);
      return null;
    } else if (response.data) {
      setScripts(prev => prev.map(s => s.id === scriptId ? response.data! : s));
      if (currentScript?.id === scriptId) {
        setCurrentScript(response.data);
      }
      return response.data;
    }
    return null;
  }, [currentScript]);

  const deleteScript = useCallback(async (scriptId: string) => {
    setError(null);
    const response = await apiService.delete(`/scripts/${scriptId}`);
    
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setScripts(prev => {
        const newScripts = prev.filter(s => s.id !== scriptId);
        if (currentScript?.id === scriptId) {
          setCurrentScript(newScripts[0] || null);
        }
        return newScripts;
      });
      return true;
    }
  }, [currentScript]);

  return {
    scripts,
    currentScript,
    loading,
    error,
    setCurrentScript,
    createScript,
    updateScript,
    deleteScript,
    refreshScripts: fetchScripts,
  };
};