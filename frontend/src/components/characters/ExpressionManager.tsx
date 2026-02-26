import React, { useState, useEffect } from 'react';
import { CHARACTER_EMOTIONS, CharacterEmotion } from '../../types/character';
import { apiService } from '../../lib/services/apiService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface CharacterExpression {
  id: number;
  character_id: number;
  emotion: string;
  expression_prompt?: string;
  image_path?: string;
  created_at: string;
}

interface ExpressionManagerProps {
  characterId: number;
  characterName: string;
}

export const ExpressionManager: React.FC<ExpressionManagerProps> = ({
  characterId,
  characterName
}) => {
  const [expressions, setExpressions] = useState<CharacterExpression[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmotion, setEditingEmotion] = useState<CharacterEmotion | null>(null);
  const [expressionPrompt, setExpressionPrompt] = useState('');
  const [imagePath, setImagePath] = useState('');

  useEffect(() => {
    fetchExpressions();
  }, [characterId]);

  const fetchExpressions = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<CharacterExpression[]>(`/characters/${characterId}/expressions`);
      if (response.data) {
        setExpressions(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch expressions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpression = async () => {
    if (!editingEmotion) return;

    try {
      await apiService.post(`/characters/${characterId}/expressions`, {
        emotion: editingEmotion,
        expression_prompt: expressionPrompt,
        image_path: imagePath
      });

      await fetchExpressions();
      setEditingEmotion(null);
      setExpressionPrompt('');
      setImagePath('');
    } catch (err) {
      console.error('Failed to save expression:', err);
    }
  };

  const getExpression = (emotion: CharacterEmotion) => {
    return expressions.find(exp => exp.emotion === emotion);
  };

  if (loading) {
    return <div className="text-center p-4">Loading expressions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Expressions for {characterName}
        </h3>
        <span className="text-sm text-gray-600">
          {expressions.length} / {CHARACTER_EMOTIONS.length} configured
        </span>
      </div>

      {/* Expression Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {CHARACTER_EMOTIONS.map(emotion => {
          const expression = getExpression(emotion);
          const hasExpression = !!expression;

          return (
            <Card
              key={emotion}
              className={`p-4 cursor-pointer transition-all ${
                hasExpression ? 'border-green-300 bg-green-50' : 'border-gray-200'
              } ${editingEmotion === emotion ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => {
                setEditingEmotion(emotion);
                if (expression) {
                  setExpressionPrompt(expression.expression_prompt || '');
                  setImagePath(expression.image_path || '');
                } else {
                  setExpressionPrompt('');
                  setImagePath('');
                }
              }}
            >
              <div className="text-center space-y-2">
                {/* Emotion Icon/Preview */}
                {expression?.image_path ? (
                  <img
                    src={expression.image_path}
                    alt={emotion}
                    className="w-full h-20 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-20 bg-gray-100 rounded-md flex items-center justify-center text-4xl">
                    {getEmotionEmoji(emotion)}
                  </div>
                )}

                {/* Emotion Name */}
                <div className="font-medium text-sm capitalize">{emotion}</div>

                {/* Status */}
                <div className="text-xs">
                  {hasExpression ? (
                    <span className="text-green-600">✓ Configured</span>
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit Panel */}
      {editingEmotion && (
        <Card className="p-6 border-2 border-blue-300">
          <h4 className="font-semibold mb-4 capitalize">
            Edit {editingEmotion} Expression
          </h4>

          <div className="space-y-4">
            {/* Expression Prompt */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Expression Description/Prompt
              </label>
              <textarea
                placeholder="Describe the expression or provide a generation prompt..."
                value={expressionPrompt}
                onChange={(e) => setExpressionPrompt(e.target.value)}
                className="w-full p-3 border rounded-md h-24"
              />
              <p className="text-xs text-gray-500 mt-1">
                Description or prompt for generating this expression
              </p>
            </div>

            {/* Image Path */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Image Path/URL
              </label>
              <input
                type="text"
                placeholder="path/to/image.png or https://..."
                value={imagePath}
                onChange={(e) => setImagePath(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Path to pre-generated expression image
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleSaveExpression}>
                Save Expression
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingEmotion(null);
                  setExpressionPrompt('');
                  setImagePath('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// Helper function for emotion emojis
function getEmotionEmoji(emotion: CharacterEmotion): string {
  const emojiMap: Record<CharacterEmotion, string> = {
    neutral: '😐',
    happy: '😊',
    sad: '😢',
    angry: '😠',
    surprised: '😲',
    confused: '😕',
    excited: '🤩',
    worried: '😟',
    determined: '😤',
    shy: '😳'
  };
  return emojiMap[emotion] || '😐';
}
