import React, { useState, useEffect } from 'react';
import { Character, CreateCharacterRequest, CharacterExpression, CreateCharacterExpressionRequest, CHARACTER_EMOTIONS, getEmotionDisplayName } from '../types/character';
import { Voice } from '../types/voice';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface CharacterManagerProps {
  onCharacterSelect?: (character: Character) => void;
}

export const CharacterManager: React.FC<CharacterManagerProps> = ({ onCharacterSelect }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [expressions, setExpressions] = useState<CharacterExpression[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newCharacter, setNewCharacter] = useState<CreateCharacterRequest>({
    name: '',
    description: '',
    voice_profile_id: undefined,
    base_portrait_url: ''
  });

  useEffect(() => {
    fetchCharacters();
    fetchVoices();
  }, []);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/characters');
      if (!response.ok) throw new Error('Failed to fetch characters');
      const data = await response.json();
      setCharacters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch characters');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/voices');
      if (!response.ok) throw new Error('Failed to fetch voices');
      const data = await response.json();
      setVoices(data);
    } catch (err) {
      console.error('Failed to fetch voices:', err);
    }
  };

  const fetchCharacterExpressions = async (characterId: number) => {
    try {
      const response = await fetch(`/api/characters/${characterId}/expressions`);
      if (!response.ok) throw new Error('Failed to fetch expressions');
      const data = await response.json();
      setExpressions(data);
    } catch (err) {
      console.error('Failed to fetch expressions:', err);
    }
  };

  const handleCreateCharacter = async () => {
    if (!newCharacter.name.trim()) {
      setError('Character name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCharacter)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create character');
      }

      setIsCreating(false);
      setNewCharacter({ name: '', description: '', voice_profile_id: undefined, base_portrait_url: '' });
      fetchCharacters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCharacter = async () => {
    if (!editingCharacter) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/characters/${editingCharacter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCharacter.name,
          description: editingCharacter.description,
          voice_profile_id: editingCharacter.voice_profile_id,
          base_portrait_url: editingCharacter.base_portrait_url
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update character');
      }

      setEditingCharacter(null);
      fetchCharacters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update character');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCharacter = async (character: Character) => {
    if (!confirm(`Are you sure you want to delete "${character.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/characters/${character.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete character');
      }

      fetchCharacters();
      if (selectedCharacter?.id === character.id) {
        setSelectedCharacter(null);
        setExpressions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete character');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    fetchCharacterExpressions(character.id);
    onCharacterSelect?.(character);
  };

  const handleUpdateExpression = async (emotion: string, expressionPrompt: string) => {
    if (!selectedCharacter) return;

    try {
      const response = await fetch(`/api/characters/${selectedCharacter.id}/expressions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emotion, expression_prompt: expressionPrompt })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update expression');
      }

      fetchCharacterExpressions(selectedCharacter.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update expression');
    }
  };

  if (loading && characters.length === 0) {
    return <div className="flex justify-center p-8">Loading characters...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Character Manager</h2>
        <Button onClick={() => setIsCreating(true)} disabled={loading}>
          Add Character
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 underline mt-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Create Character Form */}
      {isCreating && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Character</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                type="text"
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newCharacter.name}
                onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                placeholder="Character name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                value={newCharacter.description}
                onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
                placeholder="Character description and personality"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Voice</label>
              <select
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newCharacter.voice_profile_id || ''}
                onChange={(e) => setNewCharacter({ 
                  ...newCharacter, 
                  voice_profile_id: e.target.value ? parseInt(e.target.value) : undefined 
                })}
              >
                <option value="">Select a voice...</option>
                {voices.map(voice => (
                  <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Portrait URL (optional)</label>
              <input
                type="url"
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newCharacter.base_portrait_url}
                onChange={(e) => setNewCharacter({ ...newCharacter, base_portrait_url: e.target.value })}
                placeholder="https://example.com/portrait.jpg"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreateCharacter} disabled={loading}>
                {loading ? 'Creating...' : 'Create Character'}
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Character Form */}
      {editingCharacter && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Edit Character</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                type="text"
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editingCharacter.name}
                onChange={(e) => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                value={editingCharacter.description}
                onChange={(e) => setEditingCharacter({ ...editingCharacter, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Voice</label>
              <select
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editingCharacter.voice_profile_id || ''}
                onChange={(e) => setEditingCharacter({ 
                  ...editingCharacter, 
                  voice_profile_id: e.target.value ? parseInt(e.target.value) : undefined 
                })}
              >
                <option value="">Select a voice...</option>
                {voices.map(voice => (
                  <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Portrait URL</label>
              <input
                type="url"
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editingCharacter.base_portrait_url || ''}
                onChange={(e) => setEditingCharacter({ ...editingCharacter, base_portrait_url: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleUpdateCharacter} disabled={loading}>
                {loading ? 'Updating...' : 'Update Character'}
              </Button>
              <Button variant="outline" onClick={() => setEditingCharacter(null)} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Characters List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map(character => (
          <Card 
            key={character.id} 
            className={`p-4 cursor-pointer transition-all ${
              selectedCharacter?.id === character.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`} 
            onClick={() => handleSelectCharacter(character)}
          >
            <div className="flex items-start gap-3">
              {character.base_portrait_url && (
                <img 
                  src={character.base_portrait_url} 
                  alt={character.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold truncate">{character.name}</h3>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCharacter(character);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCharacter(character);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{character.description}</p>
                {character.voice_name && (
                  <p className="text-xs text-blue-600 mt-1">Voice: {character.voice_name}</p>
                )}
                {character.expression_count !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    {character.expression_count} expressions
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {characters.length === 0 && !loading && (
        <div className="text-center p-8 text-gray-500">
          No characters created yet. Click "Add Character" to get started.
        </div>
      )}

      {/* Character Expressions */}
      {selectedCharacter && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Expressions for {selectedCharacter.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CHARACTER_EMOTIONS.map(emotion => {
              const expression = expressions.find(exp => exp.emotion === emotion);
              return (
                <div key={emotion} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium">{getEmotionDisplayName(emotion)}</label>
                    {expression && (
                      <span className="text-xs text-green-600">Configured</span>
                    )}
                  </div>
                  <textarea
                    className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500"
                    rows={2}
                    value={expression?.expression_prompt || ''}
                    onChange={(e) => {
                      const newPrompt = e.target.value;
                      if (newPrompt !== (expression?.expression_prompt || '')) {
                        handleUpdateExpression(emotion, newPrompt);
                      }
                    }}
                    placeholder={`${getEmotionDisplayName(emotion).toLowerCase()} expression prompt`}
                  />
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};