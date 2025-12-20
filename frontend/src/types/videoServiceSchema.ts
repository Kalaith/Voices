// Video Service JSON Schema Types
// These types match the expected format for the video generation service

export interface VideoServiceProject {
  project: ProjectInfo;
  output_directory: string;
  characters: Record<string, VideoCharacter>;
  video: VideoConfig;
  script: ScriptConfig;
  audio: AudioConfig;
  images: ImageConfig;
}

export interface ProjectInfo {
  title: string;
  description: string;
}

export interface VideoCharacter {
  name: string;
  role: string;
  description: string;
  voice: VoiceConfig;
  appearance: string;
  portrait: PortraitConfig;
}

export interface VoiceConfig {
  engine: string;
  voice_id: string;
  speed: number;
  exaggeration: number;
  cfg_weight: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  seed?: number;
}

export interface PortraitConfig {
  position: 'left' | 'right' | 'none';
  size: 'small' | 'medium' | 'large';
  file: string;
}

export interface VideoConfig {
  scene_duration: number;
  fps: number;
  total_duration: number;
  visual_novel_mode: boolean;
  character_display: boolean;
}

export interface ScriptConfig {
  generation_mode: 'predefined' | 'ai_generated';
  prompt?: string;
  max_length?: number;
  temperature?: number;
  top_p?: number;
  scenes: Scene[];
}

export interface Scene {
  scene_number: number;
  background_description: string;
  characters_present: string[];
  dialogue: DialogueLine[];
  duration: number;
}

export interface DialogueLine {
  character: string;
  text: string;
}

export interface AudioConfig {
  enabled: boolean;
  engine: string;
  multi_voice_enabled: boolean;
  default_engine: string;
  character_voice_mapping: Record<string, VoiceConfig>;
  fallback_voice_parameters: Partial<VoiceConfig>;
}

export interface ImageConfig {
  generation_mode: 'generate' | 'predefined';
  style: string;
  character_style: string;
  background_style: string;
  width: number;
  height: number;
  steps: number;
  files: string[];
}

// Helper types for UI components
export interface PortraitSize {
  value: 'small' | 'medium' | 'large';
  label: string;
  dimensions: string;
}

export const PORTRAIT_SIZES: PortraitSize[] = [
  { value: 'small', label: 'Small', dimensions: '200x300' },
  { value: 'medium', label: 'Medium', dimensions: '300x450' },
  { value: 'large', label: 'Large', dimensions: '400x600' }
];

export const GENERATION_MODES: { value: 'predefined' | 'ai_generated'; label: string }[] = [
  { value: 'predefined', label: 'Predefined Script' },
  { value: 'ai_generated', label: 'AI Generated' }
];

export const IMAGE_GENERATION_MODES: { value: 'generate' | 'predefined'; label: string }[] = [
  { value: 'generate', label: 'Generate Images' },
  { value: 'predefined', label: 'Use Predefined Images' }
];

export const IMAGE_STYLES: string[] = [
  'anime',
  'realistic',
  'watercolor',
  'oil_painting',
  'sketch',
  'digital_art',
  'pixel_art',
  'comic_book'
];
