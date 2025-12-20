import React from 'react';
import { Character } from '../../types/character';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface CharacterCardProps {
  character: Character;
  onEdit?: (character: Character) => void;
  onDelete?: (character: Character) => void;
  onSelect?: (character: Character) => void;
  showActions?: boolean;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onEdit,
  onDelete,
  onSelect,
  showActions = true
}) => {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect?.(character)}>
      <div className="flex gap-4">
        {/* Portrait */}
        <div className="flex-shrink-0">
          {character.base_portrait_url ? (
            <img
              src={character.base_portrait_url}
              alt={character.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{character.name}</h3>
          {character.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{character.description}</p>
          )}

          {/* Voice Info */}
          {character.voice_name && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-gray-500">Voice:</span>
              <span className="font-medium text-blue-600">{character.voice_name}</span>
            </div>
          )}

          {/* Expression Count */}
          {character.expression_count !== undefined && character.expression_count > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              {character.expression_count} expression{character.expression_count > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(character)}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(character)}
                className="text-red-600 hover:bg-red-50"
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
