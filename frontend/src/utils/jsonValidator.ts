import { VideoServiceProject } from '../types/videoServiceSchema';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates a VideoServiceProject JSON against the schema requirements
 */
export class JsonValidator {
  /**
   * Validate a complete project JSON
   */
  static validate(json: VideoServiceProject): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate project info
    this.validateProjectInfo(json, errors, warnings);

    // Validate output directory
    this.validateOutputDirectory(json, errors, warnings);

    // Validate characters
    this.validateCharacters(json, errors, warnings);

    // Validate video config
    this.validateVideoConfig(json, errors, warnings);

    // Validate script config
    this.validateScriptConfig(json, errors, warnings);

    // Validate audio config
    this.validateAudioConfig(json, errors, warnings);

    // Validate image config
    this.validateImageConfig(json, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static validateProjectInfo(
    json: VideoServiceProject,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (!json.project) {
      errors.push({
        field: 'project',
        message: 'Project info is required',
        severity: 'error'
      });
      return;
    }

    if (!json.project.title || json.project.title.trim() === '') {
      errors.push({
        field: 'project.title',
        message: 'Project title is required',
        severity: 'error'
      });
    }

    if (!json.project.description || json.project.description.trim() === '') {
      warnings.push({
        field: 'project.description',
        message: 'Project description is recommended',
        severity: 'warning'
      });
    }
  }

  private static validateOutputDirectory(
    json: VideoServiceProject,
    errors: ValidationError[],
    _warnings: ValidationError[]
  ): void {
    if (!json.output_directory || json.output_directory.trim() === '') {
      errors.push({
        field: 'output_directory',
        message: 'Output directory is required',
        severity: 'error'
      });
    }
  }

  private static validateCharacters(
    json: VideoServiceProject,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (!json.characters || Object.keys(json.characters).length === 0) {
      warnings.push({
        field: 'characters',
        message: 'No characters defined',
        severity: 'warning'
      });
      return;
    }

    Object.entries(json.characters).forEach(([key, character]) => {
      if (!character.name || character.name.trim() === '') {
        errors.push({
          field: `characters.${key}.name`,
          message: `Character name is required for ${key}`,
          severity: 'error'
        });
      }

      if (!character.voice || !character.voice.engine) {
        errors.push({
          field: `characters.${key}.voice.engine`,
          message: `Voice engine is required for character ${key}`,
          severity: 'error'
        });
      }

      if (!character.portrait || !character.portrait.file) {
        warnings.push({
          field: `characters.${key}.portrait.file`,
          message: `Portrait file is recommended for character ${key}`,
          severity: 'warning'
        });
      }
    });
  }

  private static validateVideoConfig(
    json: VideoServiceProject,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (!json.video) {
      errors.push({
        field: 'video',
        message: 'Video configuration is required',
        severity: 'error'
      });
      return;
    }

    if (!json.video.fps || json.video.fps <= 0) {
      errors.push({
        field: 'video.fps',
        message: 'FPS must be greater than 0',
        severity: 'error'
      });
    }

    if (json.video.fps && (json.video.fps < 24 || json.video.fps > 60)) {
      warnings.push({
        field: 'video.fps',
        message: 'FPS should typically be between 24 and 60',
        severity: 'warning'
      });
    }

    if (!json.video.scene_duration || json.video.scene_duration <= 0) {
      errors.push({
        field: 'video.scene_duration',
        message: 'Scene duration must be greater than 0',
        severity: 'error'
      });
    }
  }

  private static validateScriptConfig(
    json: VideoServiceProject,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (!json.script) {
      errors.push({
        field: 'script',
        message: 'Script configuration is required',
        severity: 'error'
      });
      return;
    }

    if (!json.script.generation_mode) {
      errors.push({
        field: 'script.generation_mode',
        message: 'Script generation mode is required',
        severity: 'error'
      });
    }

    if (!json.script.scenes || json.script.scenes.length === 0) {
      errors.push({
        field: 'script.scenes',
        message: 'At least one scene is required',
        severity: 'error'
      });
      return;
    }

    json.script.scenes.forEach((scene, index) => {
      if (!scene.background_description || scene.background_description.trim() === '') {
        warnings.push({
          field: `script.scenes[${index}].background_description`,
          message: `Background description is recommended for scene ${index + 1}`,
          severity: 'warning'
        });
      }

      if (!scene.dialogue || scene.dialogue.length === 0) {
        warnings.push({
          field: `script.scenes[${index}].dialogue`,
          message: `Scene ${index + 1} has no dialogue`,
          severity: 'warning'
        });
      }

      scene.dialogue?.forEach((line, lineIndex) => {
        if (!line.character || line.character.trim() === '') {
          warnings.push({
            field: `script.scenes[${index}].dialogue[${lineIndex}].character`,
            message: `Dialogue line ${lineIndex + 1} in scene ${index + 1} has no character`,
            severity: 'warning'
          });
        }

        if (!line.text || line.text.trim() === '') {
          errors.push({
            field: `script.scenes[${index}].dialogue[${lineIndex}].text`,
            message: `Dialogue line ${lineIndex + 1} in scene ${index + 1} has no text`,
            severity: 'error'
          });
        }
      });
    });
  }

  private static validateAudioConfig(
    json: VideoServiceProject,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (!json.audio) {
      errors.push({
        field: 'audio',
        message: 'Audio configuration is required',
        severity: 'error'
      });
      return;
    }

    if (!json.audio.engine) {
      errors.push({
        field: 'audio.engine',
        message: 'Audio engine is required',
        severity: 'error'
      });
    }

    if (json.audio.multi_voice_enabled && (!json.audio.character_voice_mapping || Object.keys(json.audio.character_voice_mapping).length === 0)) {
      warnings.push({
        field: 'audio.character_voice_mapping',
        message: 'Multi-voice enabled but no character voice mappings defined',
        severity: 'warning'
      });
    }
  }

  private static validateImageConfig(
    json: VideoServiceProject,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (!json.images) {
      errors.push({
        field: 'images',
        message: 'Image configuration is required',
        severity: 'error'
      });
      return;
    }

    if (!json.images.generation_mode) {
      errors.push({
        field: 'images.generation_mode',
        message: 'Image generation mode is required',
        severity: 'error'
      });
    }

    if (!json.images.width || !json.images.height) {
      errors.push({
        field: 'images.dimensions',
        message: 'Image width and height are required',
        severity: 'error'
      });
    }

    if (json.images.width && json.images.height) {
      if (json.images.width < 640 || json.images.height < 480) {
        warnings.push({
          field: 'images.dimensions',
          message: 'Image dimensions are quite small, may result in low quality',
          severity: 'warning'
        });
      }
    }

    if (json.images.generation_mode === 'predefined' && (!json.images.files || json.images.files.length === 0)) {
      warnings.push({
        field: 'images.files',
        message: 'Predefined mode selected but no image files specified',
        severity: 'warning'
      });
    }
  }

  /**
   * Get a summary of validation results
   */
  static getSummary(result: ValidationResult): string {
    const errorCount = result.errors.length;
    const warningCount = result.warnings.length;

    if (errorCount === 0 && warningCount === 0) {
      return 'Valid - No issues found';
    }

    const parts: string[] = [];
    if (errorCount > 0) {
      parts.push(`${errorCount} error${errorCount > 1 ? 's' : ''}`);
    }
    if (warningCount > 0) {
      parts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`);
    }

    return parts.join(', ');
  }
}
