-- Initialize the voices database
CREATE DATABASE IF NOT EXISTS voices;
USE voices;

-- Run migrations in order
SOURCE ./migrations/001_create_voices_table.sql;
SOURCE ./migrations/002_create_scripts_table.sql;
SOURCE ./migrations/003_create_speakers_table.sql;
SOURCE ./migrations/004_create_script_lines_table.sql;
SOURCE ./migrations/005_create_audio_generations_table.sql;

-- Insert sample data
INSERT INTO voices (id, name, description, speed, pitch, temperature, top_p, top_k) VALUES 
('voice-1', 'Natural Female', 'A natural sounding female voice', 1.0, 1.0, 0.7, 0.9, 50),
('voice-2', 'Natural Male', 'A natural sounding male voice', 1.0, 1.0, 0.7, 0.9, 50),
('voice-3', 'Energetic', 'An energetic and upbeat voice', 1.1, 1.1, 0.8, 0.95, 40);