-- Story Management and KoboldAI Integration Tables
-- Migration 006: Add comprehensive story and character management

-- Extend character_profiles table with additional fields for consistency
ALTER TABLE character_profiles 
ADD COLUMN personality_traits JSON AFTER description,
ADD COLUMN background_story TEXT AFTER personality_traits,
ADD COLUMN speaking_style TEXT AFTER background_story,
ADD COLUMN visual_description TEXT AFTER speaking_style,
ADD COLUMN emotion_mapping JSON AFTER visual_description,
ADD COLUMN relationships JSON AFTER emotion_mapping,
ADD COLUMN lora_model_path VARCHAR(500) AFTER relationships,
ADD COLUMN lora_trigger_word VARCHAR(100) AFTER lora_model_path;

-- Create story projects table for KoboldAI integration
CREATE TABLE story_projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    genre VARCHAR(50),
    theme TEXT,
    setting_description TEXT,
    tone VARCHAR(50),
    target_length INT DEFAULT 1000,
    llm_model VARCHAR(100) DEFAULT 'kobold-local',
    generation_prompt TEXT,
    story_outline TEXT,
    status ENUM('draft', 'generating', 'completed', 'failed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_story_status (status),
    INDEX idx_story_genre (genre)
);

-- Create generated scripts table to track LLM-generated content
CREATE TABLE generated_scripts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_project_id INT,
    script_id INT,
    generation_method ENUM('llm_generated', 'user_created', 'mixed') DEFAULT 'llm_generated',
    llm_prompt TEXT,
    generation_metadata JSON,
    quality_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_project_id) REFERENCES story_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE,
    INDEX idx_generation_method (generation_method),
    INDEX idx_quality_score (quality_score)
);

-- Create character LoRA models table for consistency tracking
CREATE TABLE character_lora_models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    model_name VARCHAR(200) NOT NULL,
    model_path VARCHAR(500) NOT NULL,
    trigger_word VARCHAR(100) NOT NULL,
    training_images_count INT DEFAULT 0,
    model_version VARCHAR(20) DEFAULT '1.0',
    training_status ENUM('pending', 'training', 'completed', 'failed') DEFAULT 'pending',
    training_config JSON,
    validation_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES character_profiles(id) ON DELETE CASCADE,
    INDEX idx_character_lora (character_id),
    INDEX idx_training_status (training_status),
    UNIQUE KEY unique_character_model (character_id, model_name)
);

-- Extend video_projects table with story project relationship
ALTER TABLE video_projects 
ADD COLUMN story_project_id INT AFTER script_id,
ADD COLUMN character_style_consistency BOOLEAN DEFAULT TRUE AFTER background_style,
ADD COLUMN generation_metadata JSON AFTER progress,
ADD FOREIGN KEY (story_project_id) REFERENCES story_projects(id) ON DELETE SET NULL;

-- Create KoboldAI generation sessions table for tracking
CREATE TABLE kobold_generation_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_project_id INT,
    session_type ENUM('story_outline', 'dialogue', 'scene_description', 'character_action') NOT NULL,
    input_prompt TEXT NOT NULL,
    generated_content TEXT,
    generation_config JSON,
    model_info JSON,
    generation_time_ms INT,
    quality_rating INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_project_id) REFERENCES story_projects(id) ON DELETE CASCADE,
    INDEX idx_session_type (session_type),
    INDEX idx_generation_time (generation_time_ms),
    INDEX idx_quality (quality_rating)
);

-- Create scene templates table for reusable scene patterns
CREATE TABLE scene_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    scene_type VARCHAR(50),
    template_prompt TEXT,
    background_style VARCHAR(100),
    character_positions JSON,
    default_emotions JSON,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_scene_type (scene_type),
    INDEX idx_usage (usage_count)
);

-- Create character voice mappings for consistency
CREATE TABLE character_voice_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    voice_id INT NOT NULL,
    voice_config JSON,
    emotion_adjustments JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES character_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (voice_id) REFERENCES voices(id) ON DELETE CASCADE,
    UNIQUE KEY unique_character_voice (character_id, voice_id)
);

-- Create story character assignments table
CREATE TABLE story_characters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_project_id INT NOT NULL,
    character_id INT NOT NULL,
    role VARCHAR(50) DEFAULT 'supporting',
    importance_level INT DEFAULT 5,
    first_appearance_scene VARCHAR(50),
    character_arc TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_project_id) REFERENCES story_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES character_profiles(id) ON DELETE CASCADE,
    INDEX idx_story_character (story_project_id, character_id),
    INDEX idx_character_role (role),
    UNIQUE KEY unique_story_character (story_project_id, character_id)
);

-- Insert default scene templates
INSERT INTO scene_templates (name, description, scene_type, template_prompt, background_style, character_positions, default_emotions) VALUES
('Dialogue Scene', 'Two characters having a conversation', 'dialogue', 'Two characters talking in {setting}', 'anime', '{"character1": "left", "character2": "right"}', '{"default": "neutral"}'),
('Monologue Scene', 'Single character speaking or thinking', 'monologue', 'Character {character_name} {action} in {setting}', 'anime', '{"character1": "center"}', '{"default": "contemplative"}'),
('Action Scene', 'Dynamic scene with movement or conflict', 'action', 'Action scene in {setting} with {characters}', 'anime', '{"multiple": "varied"}', '{"default": "determined"}'),
('Romance Scene', 'Intimate or romantic interaction', 'romance', 'Romantic scene between {characters} in {setting}', 'anime', '{"character1": "left", "character2": "right"}', '{"default": "happy"}'),
('Dramatic Scene', 'Emotional or dramatic moment', 'dramatic', 'Dramatic moment with {characters} in {setting}', 'anime', '{"focus": "center"}', '{"default": "sad"}');

-- Insert default character emotions if not exists
INSERT IGNORE INTO character_expressions (character_id, emotion, expression_prompt) 
SELECT cp.id, emotion, expression_prompt 
FROM character_profiles cp
CROSS JOIN (
    SELECT 'neutral' as emotion, 'neutral expression, calm face' as expression_prompt UNION ALL
    SELECT 'happy', 'happy expression, bright smile' UNION ALL
    SELECT 'sad', 'sad expression, downcast eyes' UNION ALL
    SELECT 'angry', 'angry expression, furrowed brow' UNION ALL
    SELECT 'surprised', 'surprised expression, wide eyes' UNION ALL
    SELECT 'confused', 'confused expression, tilted head' UNION ALL
    SELECT 'excited', 'excited expression, energetic' UNION ALL
    SELECT 'worried', 'worried expression, concerned look' UNION ALL
    SELECT 'determined', 'determined expression, focused eyes' UNION ALL
    SELECT 'shy', 'shy expression, blushing cheeks'
) emotions
WHERE cp.id > 0;

-- Create comprehensive view for story projects with statistics
CREATE OR REPLACE VIEW story_projects_with_stats AS
SELECT 
    sp.*,
    COUNT(DISTINCT sc.character_id) as character_count,
    COUNT(DISTINCT gs.id) as generated_scripts_count,
    AVG(gs.quality_score) as avg_quality_score,
    COUNT(DISTINCT kg.id) as generation_sessions_count,
    AVG(kg.generation_time_ms) as avg_generation_time_ms
FROM story_projects sp
LEFT JOIN story_characters sc ON sp.id = sc.story_project_id
LEFT JOIN generated_scripts gs ON sp.id = gs.story_project_id
LEFT JOIN kobold_generation_sessions kg ON sp.id = kg.story_project_id
GROUP BY sp.id;

-- Create view for characters with full details
CREATE OR REPLACE VIEW characters_with_details AS
SELECT 
    cp.*,
    v.name as voice_name,
    v.parameters as voice_parameters,
    clm.model_name as lora_model_name,
    clm.trigger_word as lora_trigger,
    clm.training_status as lora_status,
    COUNT(DISTINCT ce.id) as expression_count,
    COUNT(DISTINCT sc.story_project_id) as story_appearances
FROM character_profiles cp
LEFT JOIN voices v ON cp.voice_profile_id = v.id
LEFT JOIN character_lora_models clm ON cp.id = clm.character_id
LEFT JOIN character_expressions ce ON cp.id = ce.character_id
LEFT JOIN story_characters sc ON cp.id = sc.character_id
GROUP BY cp.id;

-- Add indexes for better performance
CREATE INDEX idx_character_personality ON character_profiles((CAST(personality_traits AS CHAR(255))));
CREATE INDEX idx_story_genre_tone ON story_projects(genre, tone);
CREATE INDEX idx_generation_sessions_time ON kobold_generation_sessions(created_at, generation_time_ms);

-- Add constraints for data validation
ALTER TABLE story_projects 
ADD CONSTRAINT chk_target_length CHECK (target_length > 0 AND target_length <= 50000),
ADD CONSTRAINT chk_tone CHECK (tone IN ('casual', 'formal', 'dramatic', 'comedic', 'romantic', 'dark', 'adventurous', 'mysterious', 'uplifting'));

ALTER TABLE character_lora_models
ADD CONSTRAINT chk_training_images_count CHECK (training_images_count >= 0);

ALTER TABLE kobold_generation_sessions
ADD CONSTRAINT chk_quality_rating CHECK (quality_rating IS NULL OR (quality_rating >= 1 AND quality_rating <= 5));

-- Success message
SELECT 'Story management and KoboldAI integration tables created successfully!' as message;