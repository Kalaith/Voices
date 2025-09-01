import React, { useState, useEffect, useRef, useCallback } from 'react';

const TTS_ENGINE_STORAGE_KEY = 'tts-selected-engine';

interface Engine {
  name: string;
  loaded: boolean;
  available: boolean;
  supported_parameters: string[];
}

interface EngineInfo {
  available_engines: string[];
  current_engine: string | null;
  engines_info: Record<string, Engine>;
  engines_health: Record<string, any>;
}

interface TTSEngineSelectorProps {
  onEngineChange?: (engine: string) => void;
  className?: string;
}

export const TTSEngineSelector: React.FC<TTSEngineSelectorProps> = ({
  onEngineChange,
  className = ''
}) => {
  const [engineInfo, setEngineInfo] = useState<EngineInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchEngineInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:9966/engines');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: EngineInfo = await response.json();
      setEngineInfo(data);
    } catch (err) {
      console.error('Failed to fetch engine info:', err);
      setError('Failed to load TTS engines');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEngineSelect = useCallback(async (engineName: string) => {
    if (!engineInfo || engineName === engineInfo.current_engine) {
      return;
    }

    try {
      setIsChanging(true);
      setError(null);

      const response = await fetch('http://localhost:9966/engines/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ engine_name: engineName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      // Refresh engine info
      await fetchEngineInfo();
      
      // Save selected engine to localStorage
      try {
        localStorage.setItem(TTS_ENGINE_STORAGE_KEY, engineName);
        console.log('TTS Engine: Saved engine to localStorage:', engineName);
      } catch (error) {
        console.error('TTS Engine: Failed to save engine to localStorage:', error);
      }
      
      // Notify parent component
      if (onEngineChange) {
        onEngineChange(engineName);
      }
    } catch (err) {
      console.error('Failed to change engine:', err);
      setError(err instanceof Error ? err.message : 'Failed to change engine');
    } finally {
      setIsChanging(false);
    }
  }, [engineInfo, onEngineChange, fetchEngineInfo]);

  const getEngineDisplayName = (engineName: string) => {
    switch (engineName) {
      case 'chatts':
        return 'ChatTTS';
      case 'chatterbox':
        return 'Chatterbox';
      default:
        return engineName.charAt(0).toUpperCase() + engineName.slice(1);
    }
  };

  const getEngineDescription = (engineName: string) => {
    switch (engineName) {
      case 'chatts':
        return 'Conversational text-to-speech with natural voices';
      case 'chatterbox':
        return 'Zero-shot TTS with emotion control and voice conversion';
      default:
        return 'Text-to-speech engine';
    }
  };

  const getEngineStatus = (engineName: string) => {
    if (!engineInfo) return 'Unknown';
    
    const health = engineInfo.engines_health[engineName];
    if (!health) return 'Not Available';
    
    if (!health.available) return 'Not Installed';
    if (!health.loaded) return 'Not Loaded';
    return 'Ready';
  };

  const isEngineReady = (engineName: string) => {
    if (!engineInfo) return false;
    const health = engineInfo.engines_health[engineName];
    return health?.available && health?.loaded;
  };

  // Initial engine info fetch
  useEffect(() => {
    fetchEngineInfo();
  }, [fetchEngineInfo]);

  // Load saved engine preference on component mount
  useEffect(() => {
    if (engineInfo && engineInfo.available_engines.length > 0 && !hasInitialized) {
      const loadSavedEngine = async () => {
        try {
          const savedEngine = localStorage.getItem(TTS_ENGINE_STORAGE_KEY);
          console.log('TTS Engine: Restoring saved engine:', savedEngine);
          
          // Only apply saved engine if it's different from current and is available
          if (savedEngine && 
              savedEngine !== engineInfo.current_engine && 
              engineInfo.available_engines.includes(savedEngine)) {
            // Use handleEngineSelect to maintain consistency
            handleEngineSelect(savedEngine);
          }
        } catch (error) {
          console.error('TTS Engine: Failed to load saved engine from localStorage:', error);
        }
      };
      
      loadSavedEngine();
      setHasInitialized(true);
    }
  }, [engineInfo?.available_engines, engineInfo?.current_engine, hasInitialized, handleEngineSelect]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  // Compact single-line view
  if (isLoading) {
    return (
      <div className={`${className} relative`}>
        <div className="flex items-center justify-between p-2 border rounded-lg bg-white">
          <span className="text-sm text-gray-600">Loading engines...</span>
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} relative`}>
        <div className="flex items-center justify-between p-2 border rounded-lg bg-white">
          <span className="text-sm text-red-600">Engine error</span>
          <button
            onClick={fetchEngineInfo}
            className="text-blue-500 hover:text-blue-700 text-sm"
            title="Retry"
          >
            🔄
          </button>
        </div>
      </div>
    );
  }

  if (!engineInfo || engineInfo.available_engines.length === 0) {
    return (
      <div className={`${className} relative`}>
        <div className="flex items-center justify-between p-2 border rounded-lg bg-white">
          <span className="text-sm text-gray-600">No engines available</span>
        </div>
      </div>
    );
  }

  const currentEngine = engineInfo.current_engine;
  const currentEngineDisplay = currentEngine ? getEngineDisplayName(currentEngine) : 'None';
  const isCurrentEngineReady = currentEngine ? isEngineReady(currentEngine) : false;

  return (
    <div ref={containerRef} className={`${className} relative`}>
      {/* Compact header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-center justify-between p-2 border rounded-lg bg-white hover:bg-gray-50 transition-colors
          ${isExpanded ? 'border-blue-500' : 'border-gray-200'}
        `}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">TTS:</span>
          <span className="text-sm">{currentEngineDisplay}</span>
          {isCurrentEngineReady && (
            <span className="w-2 h-2 bg-green-500 rounded-full" title="Ready"></span>
          )}
          {isChanging && (
            <div className="animate-spin w-3 h-3 border border-blue-500 border-t-transparent rounded-full"></div>
          )}
        </div>
        <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-3">
            <div className="text-xs text-gray-500 mb-2">Select TTS Engine:</div>
            <div className="space-y-2">
              {engineInfo.available_engines.map((engineName) => {
                const isSelected = engineName === engineInfo.current_engine;
                const isReady = isEngineReady(engineName);
                const status = getEngineStatus(engineName);

                return (
                  <button
                    key={engineName}
                    className={`
                      w-full p-2 text-left border rounded cursor-pointer transition-colors text-sm
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                      ${!isReady ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={() => {
                      if (isReady && !isChanging) {
                        handleEngineSelect(engineName);
                        setIsExpanded(false);
                      }
                    }}
                    disabled={!isReady || isChanging}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{getEngineDisplayName(engineName)}</span>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-1.5 py-0.5 text-xs rounded ${
                          isReady
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getEngineDescription(engineName)}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-3 pt-2 border-t">
              <button
                onClick={() => {
                  fetchEngineInfo();
                  setIsExpanded(false);
                }}
                disabled={isLoading || isChanging}
                className="text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};