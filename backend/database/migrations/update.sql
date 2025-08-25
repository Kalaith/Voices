-- Video Generator Enhancement Database Updates
-- Run this script to add video generation capabilities to the existing voices database

-- Add video-related columns to existing script_lines table
ALTER TABLE script_lines 
ADD COLUMN scene_id VARCHAR(50) AFTER content,
ADD COLUMN character_name VARCHAR(100) AFTER scene_id,
ADD COLUMN character_emotion VARCHAR(50) DEFAULT 'neutral' AFTER character_name,
ADD COLUMN background_prompt TEXT AFTER character_emotion,
ADD COLUMN character_position ENUM('left', 'right', 'center') DEFAULT 'center' AFTER background_prompt;

-- Create indexes for better performance
CREATE INDEX idx_script_lines_scene_id ON script_lines(scene_id);
CREATE INDEX idx_script_lines_character_name ON script_lines(character_name);

-- Create character profiles table
CREATE TABLE character_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    voice_profile_id INT,
    base_portrait_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (voice_profile_id) REFERENCES voices(id) ON DELETE SET NULL,
    INDEX idx_character_name (name),
    INDEX idx_character_voice (voice_profile_id)
);

-- Create video projects table
CREATE TABLE video_projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    script_id INT,
    resolution VARCHAR(20) DEFAULT '1080p',
    background_style VARCHAR(100) DEFAULT 'anime',
    status ENUM('draft', 'generating', 'completed', 'failed') DEFAULT 'draft',
    progress INT DEFAULT 0,
    output_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE,
    INDEX idx_video_script (script_id),
    INDEX idx_video_status (status)
);

-- Create background cache table for reusing generated backgrounds
CREATE TABLE generated_backgrounds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scene_prompt TEXT NOT NULL,
    style VARCHAR(100) NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    prompt_hash VARCHAR(64) NOT NULL,
    width INT DEFAULT 1920,
    height INT DEFAULT 1080,
    generation_params JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prompt_hash (prompt_hash),
    INDEX idx_style (style),
    INDEX idx_dimensions (width, height),
    UNIQUE KEY unique_prompt_style_size (prompt_hash, style, width, height)
);

-- Create character expressions table for different emotions
CREATE TABLE character_expressions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    emotion VARCHAR(50) NOT NULL,
    expression_prompt TEXT,
    image_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES character_profiles(id) ON DELETE CASCADE,
    INDEX idx_character_emotion (character_id, emotion),
    UNIQUE KEY unique_character_emotion (character_id, emotion)
);

-- Create video generation queue table for background processing
CREATE TABLE video_generation_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_project_id INT NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    progress INT DEFAULT 0,
    current_step VARCHAR(100),
    error_message TEXT,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (video_project_id) REFERENCES video_projects(id) ON DELETE CASCADE,
    INDEX idx_queue_status (status),
    INDEX idx_queue_project (video_project_id)
);

-- Insert default character emotions if they don't exist
INSERT IGNORE INTO character_expressions (character_id, emotion, expression_prompt) VALUES
(1, 'neutral', 'neutral expression, calm face'),
(1, 'happy', 'happy expression, smiling'),
(1, 'sad', 'sad expression, downcast eyes'),
(1, 'angry', 'angry expression, furrowed brow'),
(1, 'surprised', 'surprised expression, wide eyes'),
(1, 'confused', 'confused expression, tilted head');

-- Add sample character profiles (optional - remove if not needed)
INSERT IGNORE INTO character_profiles (name, description, voice_profile_id) VALUES
('Narrator', 'The story narrator providing scene descriptions and context', NULL),
('Main Character', 'The protagonist of the story', (SELECT id FROM voices LIMIT 1));

-- Create view for script lines with character information
CREATE OR REPLACE VIEW script_lines_with_characters AS
SELECT 
    sl.*,
    cp.name as character_display_name,
    cp.description as character_description,
    cp.base_portrait_url,
    cp.voice_profile_id,
    v.name as voice_name,
    v.parameters as voice_parameters
FROM script_lines sl
LEFT JOIN character_profiles cp ON sl.character_name = cp.name
LEFT JOIN voices v ON cp.voice_profile_id = v.id;

-- Create view for video projects with script information
CREATE OR REPLACE VIEW video_projects_with_details AS
SELECT 
    vp.*,
    s.title as script_title,
    s.description as script_description,
    COUNT(sl.id) as total_lines,
    COUNT(DISTINCT sl.scene_id) as total_scenes,
    COUNT(DISTINCT sl.character_name) as total_characters
FROM video_projects vp
LEFT JOIN scripts s ON vp.script_id = s.id
LEFT JOIN script_lines sl ON s.id = sl.script_id
GROUP BY vp.id, s.id;

-- Add constraints to ensure data integrity
ALTER TABLE script_lines 
ADD CONSTRAINT chk_character_emotion 
CHECK (character_emotion IN ('neutral', 'happy', 'sad', 'angry', 'surprised', 'confused', 'excited', 'worried', 'determined', 'shy'));

ALTER TABLE video_projects
ADD CONSTRAINT chk_resolution 
CHECK (resolution IN ('720p', '1080p', '1440p', '2160p'));

ALTER TABLE video_projects
ADD CONSTRAINT chk_background_style
CHECK (background_style IN ('anime', 'realistic', 'fantasy', 'modern', 'historical', 'cyberpunk', 'medieval', 'sci-fi'));

ALTER TABLE video_projects
ADD CONSTRAINT chk_progress_range
CHECK (progress >= 0 AND progress <= 100);

-- Create triggers to update timestamps
DELIMITER //

CREATE TRIGGER update_character_profiles_timestamp
    BEFORE UPDATE ON character_profiles
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_video_projects_timestamp
    BEFORE UPDATE ON video_projects
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

DELIMITER ;

-- Add comments to tables for documentation
ALTER TABLE character_profiles COMMENT = 'Character profiles for video generation with voice associations';
ALTER TABLE video_projects COMMENT = 'Video generation projects linking scripts to output parameters';
ALTER TABLE generated_backgrounds COMMENT = 'Cache of generated background images to avoid regeneration';
ALTER TABLE character_expressions COMMENT = 'Character-specific expressions for different emotions';
ALTER TABLE video_generation_queue COMMENT = 'Background processing queue for video generation tasks';

-- Success message
SELECT 'Database update completed successfully! New tables and columns added for video generation.' as message;