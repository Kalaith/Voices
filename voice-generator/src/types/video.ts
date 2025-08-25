import { Character, CharacterEmotion, CharacterPosition, CharacterUsage } from './character';

export interface VideoProject {
  id: number;
  name: string;
  script_id: number;
  script_title?: string;
  script_description?: string;
  resolution: VideoResolution;
  background_style: BackgroundStyle;
  status: VideoStatus;
  progress: number;
  output_path?: string;
  total_lines?: number;
  total_scenes?: number;
  total_characters?: number;
  created_at: string;
  updated_at: string;
  script_lines?: VideoScriptLine[];
  scenes?: Scene[];
  characters?: CharacterUsage[];
}

export interface CreateVideoProjectRequest {
  name: string;
  script_id: number;
  resolution?: VideoResolution;
  background_style?: BackgroundStyle;
}

export interface UpdateVideoProjectRequest {
  name?: string;
  resolution?: VideoResolution;
  background_style?: BackgroundStyle;
  status?: VideoStatus;
  progress?: number;
  output_path?: string;
}

export interface VideoScriptLine {
  id: number;
  script_id: number;
  content: string;
  line_order: number;
  scene_id?: string;
  character_name?: string;
  character_display_name?: string;
  character_description?: string;
  character_emotion: CharacterEmotion;
  background_prompt?: string;
  character_position: CharacterPosition;
  base_portrait_url?: string;
  voice_profile_id?: number;
  voice_name?: string;
  voice_parameters?: string;
}

export interface UpdateScriptLineRequest {
  content?: string;
  scene_id?: string;
  character_name?: string;
  character_emotion?: CharacterEmotion;
  background_prompt?: string;
  character_position?: CharacterPosition;
}

export interface BatchUpdateScriptLinesRequest {
  updates: Array<{
    line_id: number;
  } & UpdateScriptLineRequest>;
}

export interface Scene {
  scene_id: string;
  background_prompt?: string;
  line_count: number;
  characters_in_scene: string[];
}

export interface ScriptWithVideoData {
  id: number;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  lines: VideoScriptLine[];
  scenes: Scene[];
  characters: CharacterUsage[];
  stats: ScriptStats;
}

export interface ScriptStats {
  total_lines: number;
  total_scenes: number;
  total_characters: number;
  lines_with_characters: number;
  lines_with_backgrounds: number;
  avg_line_length: number;
}

export interface ScriptReadiness {
  script_id: number;
  readiness_score: number;
  statistics: {
    total_lines: number;
    lines_with_characters: number;
    lines_with_backgrounds: number;
    lines_with_scenes: number;
    unique_scenes: number;
    unique_characters: number;
  };
  recommendations: string[];
}

export interface ProjectStats {
  total_lines: number;
  total_scenes: number;
  total_characters: number;
  lines_with_backgrounds: number;
  lines_with_characters: number;
  avg_line_length: number;
  readiness_score: number;
}

export interface AutoGenerateSceneDataResponse {
  message: string;
  updated_lines: number;
  total_lines: number;
  scenes_created: number;
}

export interface VideoGenerationQueue {
  id: number;
  video_project_id: number;
  status: QueueStatus;
  progress: number;
  current_step?: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export type VideoResolution = '720p' | '1080p' | '1440p' | '2160p';

export type VideoStatus = 'draft' | 'generating' | 'completed' | 'failed';

export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type BackgroundStyle = 
  | 'anime' 
  | 'realistic' 
  | 'fantasy' 
  | 'modern' 
  | 'historical' 
  | 'cyberpunk' 
  | 'medieval' 
  | 'sci-fi';

export const VIDEO_RESOLUTIONS: { value: VideoResolution; label: string; dimensions: string }[] = [
  { value: '720p', label: '720p HD', dimensions: '1280x720' },
  { value: '1080p', label: '1080p Full HD', dimensions: '1920x1080' },
  { value: '1440p', label: '1440p QHD', dimensions: '2560x1440' },
  { value: '2160p', label: '4K UHD', dimensions: '3840x2160' }
];

export const BACKGROUND_STYLES: { value: BackgroundStyle; label: string; description: string }[] = [
  { value: 'anime', label: 'Anime Style', description: 'Colorful anime-inspired backgrounds' },
  { value: 'realistic', label: 'Realistic', description: 'Photorealistic environments' },
  { value: 'fantasy', label: 'Fantasy', description: 'Magical and fantastical settings' },
  { value: 'modern', label: 'Modern', description: 'Contemporary urban environments' },
  { value: 'historical', label: 'Historical', description: 'Period-appropriate settings' },
  { value: 'cyberpunk', label: 'Cyberpunk', description: 'Futuristic neon-lit cityscapes' },
  { value: 'medieval', label: 'Medieval', description: 'Castle and village settings' },
  { value: 'sci-fi', label: 'Sci-Fi', description: 'Futuristic space and tech environments' }
];

export const VIDEO_STATUSES: { value: VideoStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'generating', label: 'Generating', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'failed', label: 'Failed', color: 'red' }
];

export const QUEUE_STATUSES: { value: QueueStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'processing', label: 'Processing', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'failed', label: 'Failed', color: 'red' }
];

export const getVideoResolutionDimensions = (resolution: VideoResolution): { width: number; height: number } => {
  const dimensions = {
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
    '1440p': { width: 2560, height: 1440 },
    '2160p': { width: 3840, height: 2160 }
  };
  return dimensions[resolution];
};

export const getReadinessColor = (score: number): string => {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  if (score >= 40) return 'orange';
  return 'red';
};

export const getReadinessLabel = (score: number): string => {
  if (score >= 80) return 'Ready';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Work';
  return 'Not Ready';
};