import { VideoProject, VideoScriptLine, Scene as VideoScene } from '../types/video';
import { Character } from '../types/character';
import { Voice } from '../types/voice';
import {
  VideoServiceProject,
  VideoCharacter,
  VoiceConfig,
  Scene,
  DialogueLine,
  VideoConfig,
  ScriptConfig,
  AudioConfig,
  ImageConfig,
  PortraitConfig
} from '../types/videoServiceSchema';

export interface ProjectWithFullData extends VideoProject {
  script_lines?: VideoScriptLine[];
  scenes?: VideoScene[];
  characters?: Array<{
    character_name?: string;
    character_display_name?: string;
    base_portrait_url?: string;
    voice_profile_id?: number;
    voice_name?: string;
    line_count: number;
    scene_count: number;
  }>;
  voices?: Voice[];
}

/**
 * Builds a JSON object compatible with the video service format
 * from the database project structure
 */
export class JsonBuilder {
  /**
   * Convert a VideoProject with related data to VideoServiceProject format
   */
  static buildVideoServiceJSON(project: ProjectWithFullData): VideoServiceProject {
    const outputDirectory = this.generateOutputDirectory(project.name);

    return {
      project: {
        title: project.name,
        description: project.script_description || ''
      },
      output_directory: outputDirectory,
      characters: this.buildCharactersObject(project),
      video: this.buildVideoConfig(project),
      script: this.buildScriptConfig(project),
      audio: this.buildAudioConfig(project),
      images: this.buildImageConfig(project)
    };
  }

  /**
   * Generate output directory path from project name
   */
  private static generateOutputDirectory(projectName: string): string {
    const sanitized = projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return `GeneratedVideos/${sanitized}`;
  }

  /**
   * Build characters object with voice and portrait settings
   */
  private static buildCharactersObject(project: ProjectWithFullData): Record<string, VideoCharacter> {
    const charactersObj: Record<string, VideoCharacter> = {};

    if (!project.characters) return charactersObj;

    project.characters.forEach(char => {
      const name = char.character_name || char.character_display_name || 'Unknown';

      charactersObj[name] = {
        name: char.character_display_name || name,
        role: '', // Could be added to character_profiles table
        description: '', // Could be pulled from character_profiles
        voice: this.buildVoiceConfig(char, project),
        appearance: '', // Could be added to character_profiles
        portrait: this.buildPortraitConfig(char)
      };
    });

    return charactersObj;
  }

  /**
   * Build voice configuration for a character
   */
  private static buildVoiceConfig(
    character: ProjectWithFullData['characters'][number],
    project: ProjectWithFullData
  ): VoiceConfig {
    // Default voice config
    const defaultConfig: VoiceConfig = {
      engine: 'chatterbox',
      voice_id: character.voice_name || 'default',
      speed: 1.0,
      exaggeration: 0.5,
      cfg_weight: 0.7
    };

    // Parse voice parameters if available
    if (character.voice_name) {
      try {
        const params = typeof character === 'object' && 'voice_parameters' in character
          ? JSON.parse(character.voice_parameters as string)
          : {};

        return {
          ...defaultConfig,
          speed: params.speed ?? defaultConfig.speed,
          exaggeration: params.exaggeration ?? defaultConfig.exaggeration,
          cfg_weight: params.cfg_weight ?? defaultConfig.cfg_weight,
          temperature: params.temperature,
          top_p: params.top_p,
          top_k: params.top_k,
          seed: params.seed
        };
      } catch (e) {
        console.warn('Failed to parse voice parameters:', e);
      }
    }

    return defaultConfig;
  }

  /**
   * Build portrait configuration for a character
   */
  private static buildPortraitConfig(
    character: ProjectWithFullData['characters'][number]
  ): PortraitConfig {
    return {
      position: 'left', // Default position
      size: 'medium',
      file: character.base_portrait_url || ''
    };
  }

  /**
   * Build video configuration
   */
  private static buildVideoConfig(project: ProjectWithFullData): VideoConfig {
    const totalScenes = project.scenes?.length || 0;
    const sceneDuration = 5.0; // Default scene duration

    return {
      scene_duration: sceneDuration,
      fps: 30, // Default FPS
      total_duration: totalScenes * sceneDuration,
      visual_novel_mode: true,
      character_display: true
    };
  }

  /**
   * Build script configuration with scenes
   */
  private static buildScriptConfig(project: ProjectWithFullData): ScriptConfig {
    const scenes = this.buildScenes(project);

    return {
      generation_mode: 'predefined',
      scenes
    };
  }

  /**
   * Build scenes array from script lines
   */
  private static buildScenes(project: ProjectWithFullData): Scene[] {
    if (!project.script_lines || !project.scenes) return [];

    const scenes: Scene[] = [];

    // Group lines by scene_id
    const sceneGroups = new Map<string, VideoScriptLine[]>();
    project.script_lines.forEach(line => {
      const sceneId = line.scene_id || 'default';
      if (!sceneGroups.has(sceneId)) {
        sceneGroups.set(sceneId, []);
      }
      sceneGroups.get(sceneId)!.push(line);
    });

    // Convert each scene group to Scene format
    let sceneNumber = 1;
    sceneGroups.forEach((lines, sceneId) => {
      const sceneInfo = project.scenes!.find(s => s.scene_id === sceneId);

      // Build dialogue lines
      const dialogue: DialogueLine[] = lines.map(line => ({
        character: line.character_name || 'Narrator',
        text: line.content
      }));

      // Get unique characters in scene
      const charactersPresent = Array.from(
        new Set(lines.map(l => l.character_name).filter(Boolean) as string[])
      );

      scenes.push({
        scene_number: sceneNumber++,
        background_description: sceneInfo?.background_prompt || lines[0]?.background_prompt || '',
        characters_present: charactersPresent,
        dialogue,
        duration: dialogue.length * 2.5 // Estimate 2.5s per line
      });
    });

    return scenes;
  }

  /**
   * Build audio configuration
   */
  private static buildAudioConfig(project: ProjectWithFullData): AudioConfig {
    const characterVoiceMapping: Record<string, VoiceConfig> = {};

    if (project.characters) {
      project.characters.forEach(char => {
        const name = char.character_name || char.character_display_name || 'Unknown';
        characterVoiceMapping[name] = this.buildVoiceConfig(char, project);
      });
    }

    return {
      enabled: true,
      engine: 'chatterbox',
      multi_voice_enabled: true,
      default_engine: 'chatterbox',
      character_voice_mapping: characterVoiceMapping,
      fallback_voice_parameters: {
        speed: 1.0,
        exaggeration: 0.5,
        cfg_weight: 0.7
      }
    };
  }

  /**
   * Build image configuration
   */
  private static buildImageConfig(project: ProjectWithFullData): ImageConfig {
    const resolution = this.getResolutionDimensions(project.resolution);

    return {
      generation_mode: 'generate',
      style: project.background_style || 'anime',
      character_style: project.background_style || 'anime',
      background_style: project.background_style || 'anime',
      width: resolution.width,
      height: resolution.height,
      steps: 30,
      files: []
    };
  }

  /**
   * Convert resolution string to dimensions
   */
  private static getResolutionDimensions(resolution: string): { width: number; height: number } {
    const resolutions: Record<string, { width: number; height: number }> = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '1440p': { width: 2560, height: 1440 },
      '2160p': { width: 3840, height: 2160 }
    };
    return resolutions[resolution] || resolutions['1080p'];
  }

  /**
   * Download JSON as file
   */
  static downloadJSON(project: ProjectWithFullData, filename?: string): void {
    const json = this.buildVideoServiceJSON(project);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${this.sanitizeFilename(project.name)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Sanitize filename for download
   */
  private static sanitizeFilename(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Copy JSON to clipboard
   */
  static async copyToClipboard(project: ProjectWithFullData): Promise<void> {
    const json = this.buildVideoServiceJSON(project);
    const jsonString = JSON.stringify(json, null, 2);
    await navigator.clipboard.writeText(jsonString);
  }
}
