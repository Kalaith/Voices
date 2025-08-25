export interface Character {
  id: number;
  name: string;
  description: string;
  voice_profile_id?: number;
  voice_name?: string;
  voice_parameters?: string;
  base_portrait_url?: string;
  expression_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCharacterRequest {
  name: string;
  description: string;
  voice_profile_id?: number;
  base_portrait_url?: string;
}

export interface UpdateCharacterRequest {
  name?: string;
  description?: string;
  voice_profile_id?: number;
  base_portrait_url?: string;
}

export interface CharacterExpression {
  id: number;
  character_id: number;
  emotion: string;
  expression_prompt?: string;
  image_path?: string;
  created_at: string;
}

export interface CreateCharacterExpressionRequest {
  emotion: string;
  expression_prompt?: string;
  image_path?: string;
}

export interface CharacterUsage {
  character_name?: string;
  character_display_name?: string;
  base_portrait_url?: string;
  voice_profile_id?: number;
  voice_name?: string;
  line_count: number;
  scene_count: number;
}

export type CharacterEmotion = 
  | 'neutral' 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'surprised' 
  | 'confused' 
  | 'excited' 
  | 'worried' 
  | 'determined' 
  | 'shy';

export type CharacterPosition = 'left' | 'right' | 'center';

export const CHARACTER_EMOTIONS: CharacterEmotion[] = [
  'neutral',
  'happy', 
  'sad',
  'angry',
  'surprised',
  'confused',
  'excited',
  'worried',
  'determined',
  'shy'
];

export const CHARACTER_POSITIONS: { value: CharacterPosition; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' }
];

export const getEmotionDisplayName = (emotion: CharacterEmotion): string => {
  const emotionNames: Record<CharacterEmotion, string> = {
    neutral: 'Neutral',
    happy: 'Happy',
    sad: 'Sad', 
    angry: 'Angry',
    surprised: 'Surprised',
    confused: 'Confused',
    excited: 'Excited',
    worried: 'Worried',
    determined: 'Determined',
    shy: 'Shy'
  };
  return emotionNames[emotion] || emotion;
};