-- Add enhanced video configuration fields to video_projects table

ALTER TABLE video_projects
ADD COLUMN fps INT DEFAULT 30 AFTER resolution,
ADD COLUMN scene_duration DECIMAL(5,2) DEFAULT 5.0 AFTER fps,
ADD COLUMN total_duration DECIMAL(8,2) AFTER scene_duration,
ADD COLUMN visual_novel_mode BOOLEAN DEFAULT TRUE AFTER total_duration,
ADD COLUMN character_display BOOLEAN DEFAULT TRUE AFTER visual_novel_mode,
ADD COLUMN image_config JSON AFTER character_display,
ADD COLUMN script_generation_config JSON AFTER image_config;

-- Add constraints
ALTER TABLE video_projects
ADD CONSTRAINT chk_fps_range
CHECK (fps >= 1 AND fps <= 120);

ALTER TABLE video_projects
ADD CONSTRAINT chk_scene_duration_positive
CHECK (scene_duration > 0);

-- Add comments
ALTER TABLE video_projects
MODIFY COLUMN fps INT DEFAULT 30 COMMENT 'Frames per second for video output',
MODIFY COLUMN scene_duration DECIMAL(5,2) DEFAULT 5.0 COMMENT 'Default duration per scene in seconds',
MODIFY COLUMN total_duration DECIMAL(8,2) COMMENT 'Total video duration in seconds',
MODIFY COLUMN visual_novel_mode BOOLEAN DEFAULT TRUE COMMENT 'Enable visual novel style presentation',
MODIFY COLUMN character_display BOOLEAN DEFAULT TRUE COMMENT 'Display character portraits',
MODIFY COLUMN image_config JSON COMMENT 'Image generation configuration (style, dimensions, etc)',
MODIFY COLUMN script_generation_config JSON COMMENT 'AI script generation settings';

-- Success message
SELECT 'Video configuration fields added successfully!' as message;
