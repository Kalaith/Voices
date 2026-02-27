import React, { useState, useEffect } from 'react';
import { Character } from '../../types/character';
import { apiService } from '../../lib/services/apiService';
import { CharacterCard } from './CharacterCard';
import { Button } from '../ui/Button';

interface CharacterLibraryBrowserProps {
  onSelect?: (character: Character) => void;
  selectedIds?: number[];
  multiSelect?: boolean;
}

export const CharacterLibraryBrowser: React.FC<CharacterLibraryBrowserProps> = ({
  onSelect,
  selectedIds: _selectedIds = [],
  multiSelect: _multiSelect = false
}) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<Character[]>('/characters');
      if (response.error) throw new Error(response.error);
      setCharacters(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch characters');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (character: Character) => {
    if (!confirm(`Are you sure you want to delete "${character.name}"?`)) {
      return;
    }

    try {
      const response = await apiService.delete(`/characters/${character.id}`);
      if (response.error) throw new Error(response.error);
      await fetchCharacters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete character');
    }
  };

  const filteredCharacters = characters.filter(char =>
    char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    char.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-lg">Loading characters...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Character Library</h2>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search characters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-md"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Character Grid/List */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-3'
      }>
        {filteredCharacters.map(character => (
          <CharacterCard
            key={character.id}
            character={character}
            onSelect={onSelect}
            onDelete={handleDelete}
            showActions={true}
          />
        ))}
      </div>

      {filteredCharacters.length === 0 && (
        <div className="text-center p-12">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No characters found' : 'No characters yet'}
          </h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search' : 'Create your first character to get started'}
          </p>
        </div>
      )}
    </div>
  );
};
