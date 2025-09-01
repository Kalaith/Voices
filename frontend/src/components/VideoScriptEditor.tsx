import React, { useState, useEffect } from 'react';
import { 
  VideoScriptLine, 
  Character, 
  Scene, 
  ScriptWithVideoData, 
  UpdateScriptLineRequest,
  ScriptReadiness,
  CHARACTER_EMOTIONS,
  CHARACTER_POSITIONS,
  getEmotionDisplayName,
  getReadinessColor,
  getReadinessLabel
} from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { ProgressBar } from './ui/ProgressBar';

interface VideoScriptEditorProps {
  scriptId: number;
  onScriptChange?: (lines: VideoScriptLine[]) => void;
}

export const VideoScriptEditor: React.FC<VideoScriptEditorProps> = ({ scriptId, onScriptChange }) => {
  const [scriptData, setScriptData] = useState<ScriptWithVideoData | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [readiness, setReadiness] = useState<ScriptReadiness | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (scriptId) {
      fetchScriptData();
      fetchCharacters();
      fetchReadinessScore();
    }
  }, [scriptId]);

  const fetchScriptData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/scripts/${scriptId}/video-data`);
      if (!response.ok) throw new Error('Failed to fetch script data');
      const data = await response.json();
      setScriptData(data);
      onScriptChange?.(data.lines || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch script data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/characters');
      if (!response.ok) throw new Error('Failed to fetch characters');
      const data = await response.json();
      setCharacters(data);
    } catch (err) {
      console.error('Failed to fetch characters:', err);
    }
  };

  const fetchReadinessScore = async () => {
    try {
      const response = await fetch(`/api/scripts/${scriptId}/readiness`);
      if (response.ok) {
        const data = await response.json();
        setReadiness(data);
      }
    } catch (err) {
      console.error('Failed to fetch readiness score:', err);
    }
  };

  const updateScriptLine = async (lineId: number, updates: UpdateScriptLineRequest) => {
    try {
      const response = await fetch(`/api/script-lines/${lineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update script line');
      }

      const updatedLine = await response.json();
      
      // Update the line in our local state
      setScriptData(prev => {
        if (!prev) return prev;
        const updatedLines = prev.lines.map(line => 
          line.id === lineId ? { ...line, ...updatedLine } : line
        );
        return { ...prev, lines: updatedLines };
      });

      fetchReadinessScore(); // Refresh readiness score
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update script line');
    }
  };

  const generateBackgroundPrompt = (sceneId: string) => {
    if (!scriptData) return '';
    
    const sceneLines = scriptData.lines.filter(line => line.scene_id === sceneId);
    if (sceneLines.length > 0) {
      const sceneName = sceneId.replace(/_/g, ' ');
      const prompt = `anime style background, ${sceneName}, detailed environment, high quality`;
      return prompt;
    }
    return '';
  };

  const autoGenerateSceneData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/scripts/${scriptId}/auto-generate-scenes`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate scene data');
      }

      fetchScriptData();
      fetchReadinessScore();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate scene data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSceneExpansion = (sceneId: string) => {
    setExpandedScenes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sceneId)) {
        newSet.delete(sceneId);
      } else {
        newSet.add(sceneId);
      }
      return newSet;
    });
  };

  const groupLinesByScene = (lines: VideoScriptLine[]) => {
    const grouped: Record<string, VideoScriptLine[]> = {};
    const unscened: VideoScriptLine[] = [];

    lines.forEach(line => {
      if (line.scene_id && line.scene_id.trim()) {
        if (!grouped[line.scene_id]) {
          grouped[line.scene_id] = [];
        }
        grouped[line.scene_id].push(line);
      } else {
        unscened.push(line);
      }
    });

    return { grouped, unscened };
  };

  if (loading && !scriptData) {
    return <div className="flex justify-center p-8">Loading script data...</div>;
  }

  if (!scriptData) {
    return <div className="text-center p-8 text-gray-500">No script data available</div>;
  }

  const { grouped: groupedLines, unscened: unscanedLines } = groupLinesByScene(scriptData.lines);
  const readinessScore = readiness?.readiness_score || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Script Editor: {scriptData.title}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={autoGenerateSceneData} disabled={loading}>
            {loading ? 'Generating...' : 'Auto-Generate Scenes'}
          </Button>
          <Button onClick={() => fetchScriptData()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 underline mt-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Script Stats & Readiness */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{scriptData.stats.total_lines}</div>
          <div className="text-sm text-gray-600">Total Lines</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{scriptData.stats.total_scenes}</div>
          <div className="text-sm text-gray-600">Scenes</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{scriptData.stats.total_characters}</div>
          <div className="text-sm text-gray-600">Characters</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full bg-${getReadinessColor(readinessScore)}-500`}
                style={{ width: `${readinessScore}%` }}
              />
            </div>
            <span className="text-sm font-medium">{readinessScore}%</span>
          </div>
          <div className={`text-sm text-${getReadinessColor(readinessScore)}-600`}>
            {getReadinessLabel(readinessScore)}
          </div>
        </Card>
      </div>

      {/* Readiness Recommendations */}
      {readiness && readiness.recommendations.length > 0 && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold mb-2">Recommendations:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {readiness.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Scenes Overview */}
      {scriptData.scenes.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Scenes Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scriptData.scenes.map(scene => (
              <div key={scene.scene_id} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">{scene.scene_id.replace(/_/g, ' ')}</div>
                <div className="text-sm text-gray-600">
                  {scene.line_count} lines • {scene.characters_in_scene.length} characters
                </div>
                {scene.background_prompt && (
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {scene.background_prompt}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Script Lines by Scene */}
      <div className="space-y-4">
        {Object.entries(groupedLines).map(([sceneId, lines]) => (
          <Card key={sceneId} className="p-4">
            <div 
              className="flex items-center justify-between cursor-pointer mb-3"
              onClick={() => toggleSceneExpansion(sceneId)}
            >
              <h3 className="text-lg font-semibold">
                Scene: {sceneId.replace(/_/g, ' ')} ({lines.length} lines)
              </h3>
              <Button variant="outline" size="sm">
                {expandedScenes.has(sceneId) ? 'Collapse' : 'Expand'}
              </Button>
            </div>

            {expandedScenes.has(sceneId) && (
              <div className="space-y-3">
                {lines.map((line, index) => (
                  <div key={line.id} className="border rounded-md p-3">
                    <div className="flex items-start gap-3">
                      <div className="text-sm text-gray-500 w-8 flex-shrink-0">
                        {line.line_order}
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        {/* Content */}
                        <textarea
                          className="w-full p-2 border rounded text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={line.content}
                          onChange={(e) => updateScriptLine(line.id, { content: e.target.value })}
                          rows={Math.min(4, Math.max(2, Math.ceil(line.content.length / 80)))}
                        />

                        {/* Metadata Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <label className="block text-xs font-medium mb-1">Character</label>
                            <select
                              className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500"
                              value={line.character_name || ''}
                              onChange={(e) => updateScriptLine(line.id, { character_name: e.target.value || undefined })}
                            >
                              <option value="">Select character...</option>
                              {characters.map(char => (
                                <option key={char.id} value={char.name}>{char.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1">Emotion</label>
                            <select
                              className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500"
                              value={line.character_emotion}
                              onChange={(e) => updateScriptLine(line.id, { character_emotion: e.target.value as any })}
                            >
                              {CHARACTER_EMOTIONS.map(emotion => (
                                <option key={emotion} value={emotion}>
                                  {getEmotionDisplayName(emotion)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1">Position</label>
                            <select
                              className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500"
                              value={line.character_position}
                              onChange={(e) => updateScriptLine(line.id, { character_position: e.target.value as any })}
                            >
                              {CHARACTER_POSITIONS.map(pos => (
                                <option key={pos.value} value={pos.value}>
                                  {pos.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1">Scene ID</label>
                            <input
                              type="text"
                              className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500"
                              value={line.scene_id || ''}
                              onChange={(e) => updateScriptLine(line.id, { scene_id: e.target.value || undefined })}
                              placeholder="scene_1"
                            />
                          </div>
                        </div>

                        {/* Background Prompt */}
                        <div>
                          <label className="block text-xs font-medium mb-1">Background Prompt</label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500"
                            value={line.background_prompt || ''}
                            onChange={(e) => updateScriptLine(line.id, { background_prompt: e.target.value || undefined })}
                            placeholder="Background description for this scene"
                          />
                          {line.scene_id && !line.background_prompt && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-1 text-xs"
                              onClick={() => updateScriptLine(line.id, { background_prompt: generateBackgroundPrompt(line.scene_id!) })}
                            >
                              Generate Background Prompt
                            </Button>
                          )}
                        </div>

                        {/* Character Preview */}
                        {line.character_name && (
                          <div className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded">
                            {line.base_portrait_url && (
                              <img 
                                src={line.base_portrait_url} 
                                alt={line.character_name}
                                className="w-6 h-6 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <span className="text-gray-700">{line.character_display_name || line.character_name}</span>
                            <span className="text-blue-600">• {getEmotionDisplayName(line.character_emotion)}</span>
                            <span className="text-green-600">• {CHARACTER_POSITIONS.find(p => p.value === line.character_position)?.label}</span>
                            {line.voice_name && (
                              <span className="text-purple-600">• Voice: {line.voice_name}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}

        {/* Unscened Lines */}
        {unscanedLines.length > 0 && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Unscened Lines ({unscanedLines.length})</h3>
            <div className="space-y-3">
              {unscanedLines.map(line => (
                <div key={line.id} className="border border-yellow-200 rounded-md p-3 bg-yellow-50">
                  <div className="flex items-start gap-3">
                    <div className="text-sm text-gray-500 w-8 flex-shrink-0">
                      {line.line_order}
                    </div>
                    
                    <div className="flex-1">
                      <textarea
                        className="w-full p-2 border rounded text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={line.content}
                        onChange={(e) => updateScriptLine(line.id, { content: e.target.value })}
                        rows={2}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        <input
                          type="text"
                          className="p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500"
                          value={line.scene_id || ''}
                          onChange={(e) => updateScriptLine(line.id, { scene_id: e.target.value || undefined })}
                          placeholder="Assign to scene (e.g., scene_1)"
                        />
                        <select
                          className="p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500"
                          value={line.character_name || ''}
                          onChange={(e) => updateScriptLine(line.id, { character_name: e.target.value || undefined })}
                        >
                          <option value="">Select character...</option>
                          {characters.map(char => (
                            <option key={char.id} value={char.name}>{char.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {scriptData.lines.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          No script lines found. Add some content to your script first.
        </div>
      )}
    </div>
  );
};