# Voice Generator Video Enhancement Implementation

## Overview
This document focuses on the immediate frontend and backend changes needed to extend the existing voice generator into a visual novel video creation system. This phase excludes LLM script generation and LoRA character training to focus on core video functionality.

## Phase 1: Enhanced Script Management

### Database Schema Changes

```sql
-- Enhanced script_lines table
ALTER TABLE script_lines ADD COLUMN scene_id VARCHAR(50);
ALTER TABLE script_lines ADD COLUMN character_name VARCHAR(100);
ALTER TABLE script_lines ADD COLUMN character_emotion VARCHAR(50) DEFAULT 'neutral';
ALTER TABLE script_lines ADD COLUMN background_prompt TEXT;
ALTER TABLE script_lines ADD COLUMN character_position ENUM('left', 'right', 'center') DEFAULT 'center';

-- Basic character profiles (without LoRA complexity)
CREATE TABLE character_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    voice_profile_id INT,
    base_portrait_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (voice_profile_id) REFERENCES voices(id),
    INDEX idx_character_name (name)
);

-- Video projects
CREATE TABLE video_projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    script_id INT,
    resolution VARCHAR(20) DEFAULT '1080p',
    background_style VARCHAR(100) DEFAULT 'anime',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (script_id) REFERENCES scripts(id)
);

-- Background cache for reuse
CREATE TABLE generated_backgrounds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scene_prompt TEXT,
    style VARCHAR(100),
    image_path VARCHAR(500),
    prompt_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prompt_hash (prompt_hash),
    INDEX idx_style (style)
);
```

### Backend API Extensions (PHP)

#### New Controllers

**CharacterController.php**
```php
<?php
class CharacterController {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    public function createCharacter($data) {
        $stmt = $this->db->prepare("
            INSERT INTO character_profiles (name, description, voice_profile_id, base_portrait_url) 
            VALUES (?, ?, ?, ?)
        ");
        return $stmt->execute([
            $data['name'],
            $data['description'],
            $data['voice_profile_id'] ?? null,
            $data['base_portrait_url'] ?? null
        ]);
    }
    
    public function getCharacters() {
        $stmt = $this->db->query("
            SELECT cp.*, v.name as voice_name 
            FROM character_profiles cp 
            LEFT JOIN voices v ON cp.voice_profile_id = v.id
            ORDER BY cp.name
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getCharacter($id) {
        $stmt = $this->db->prepare("
            SELECT cp.*, v.name as voice_name 
            FROM character_profiles cp 
            LEFT JOIN voices v ON cp.voice_profile_id = v.id
            WHERE cp.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function updateCharacter($id, $data) {
        $stmt = $this->db->prepare("
            UPDATE character_profiles 
            SET name = ?, description = ?, voice_profile_id = ?, base_portrait_url = ?
            WHERE id = ?
        ");
        return $stmt->execute([
            $data['name'],
            $data['description'],
            $data['voice_profile_id'] ?? null,
            $data['base_portrait_url'] ?? null,
            $id
        ]);
    }
}
```

**VideoProjectController.php**
```php
<?php
class VideoProjectController {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    public function createProject($data) {
        $stmt = $this->db->prepare("
            INSERT INTO video_projects (name, script_id, resolution, background_style) 
            VALUES (?, ?, ?, ?)
        ");
        return $stmt->execute([
            $data['name'],
            $data['script_id'],
            $data['resolution'] ?? '1080p',
            $data['background_style'] ?? 'anime'
        ]);
    }
    
    public function getProjects() {
        $stmt = $this->db->query("
            SELECT vp.*, s.title as script_title 
            FROM video_projects vp 
            LEFT JOIN scripts s ON vp.script_id = s.id
            ORDER BY vp.created_at DESC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getProjectWithScript($id) {
        // Get project details
        $stmt = $this->db->prepare("
            SELECT vp.*, s.title as script_title, s.description as script_description
            FROM video_projects vp 
            LEFT JOIN scripts s ON vp.script_id = s.id
            WHERE vp.id = ?
        ");
        $stmt->execute([$id]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($project) {
            // Get script lines with character and scene info
            $stmt = $this->db->prepare("
                SELECT sl.*, cp.name as character_display_name, cp.base_portrait_url
                FROM script_lines sl
                LEFT JOIN character_profiles cp ON sl.character_name = cp.name
                WHERE sl.script_id = ?
                ORDER BY sl.line_order
            ");
            $stmt->execute([$project['script_id']]);
            $project['script_lines'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        return $project;
    }
}
```

#### Enhanced ScriptController.php
```php
// Add to existing ScriptController.php
public function updateScriptLine($id, $data) {
    $stmt = $this->db->prepare("
        UPDATE script_lines 
        SET content = ?, scene_id = ?, character_name = ?, character_emotion = ?, 
            background_prompt = ?, character_position = ?
        WHERE id = ?
    ");
    return $stmt->execute([
        $data['content'],
        $data['scene_id'] ?? null,
        $data['character_name'] ?? null,
        $data['character_emotion'] ?? 'neutral',
        $data['background_prompt'] ?? null,
        $data['character_position'] ?? 'center',
        $id
    ]);
}

public function getScriptWithVideoData($id) {
    // Get script
    $script = $this->getScript($id);
    
    if ($script) {
        // Get enhanced script lines
        $stmt = $this->db->prepare("
            SELECT sl.*, cp.name as character_display_name, cp.base_portrait_url,
                   cp.voice_profile_id
            FROM script_lines sl
            LEFT JOIN character_profiles cp ON sl.character_name = cp.name
            WHERE sl.script_id = ?
            ORDER BY sl.line_order
        ");
        $stmt->execute([$id]);
        $script['lines'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get unique scenes
        $stmt = $this->db->prepare("
            SELECT DISTINCT scene_id, background_prompt
            FROM script_lines 
            WHERE script_id = ? AND scene_id IS NOT NULL
            ORDER BY MIN(line_order)
        ");
        $stmt->execute([$id]);
        $script['scenes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    return $script;
}
```

#### New API Routes (add to Router.php)
```php
// Character management
$router->post('/api/characters', [new CharacterController($db), 'createCharacter']);
$router->get('/api/characters', [new CharacterController($db), 'getCharacters']);
$router->get('/api/characters/{id}', [new CharacterController($db), 'getCharacter']);
$router->put('/api/characters/{id}', [new CharacterController($db), 'updateCharacter']);

// Video projects
$router->post('/api/video/projects', [new VideoProjectController($db), 'createProject']);
$router->get('/api/video/projects', [new VideoProjectController($db), 'getProjects']);
$router->get('/api/video/projects/{id}', [new VideoProjectController($db), 'getProjectWithScript']);

// Enhanced scripts
$router->get('/api/scripts/{id}/video-data', [new ScriptController($db), 'getScriptWithVideoData']);
$router->put('/api/script-lines/{id}', [new ScriptController($db), 'updateScriptLine']);
```

## Phase 2: Frontend Extensions (React/TypeScript)

### New Types

**types/character.ts**
```typescript
export interface Character {
  id: number;
  name: string;
  description: string;
  voice_profile_id?: number;
  voice_name?: string;
  base_portrait_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCharacterRequest {
  name: string;
  description: string;
  voice_profile_id?: number;
  base_portrait_url?: string;
}
```

**types/video.ts**
```typescript
export interface VideoProject {
  id: number;
  name: string;
  script_id: number;
  script_title?: string;
  script_description?: string;
  resolution: string;
  background_style: string;
  created_at: string;
  script_lines?: VideoScriptLine[];
}

export interface VideoScriptLine {
  id: number;
  script_id: number;
  content: string;
  line_order: number;
  scene_id?: string;
  character_name?: string;
  character_display_name?: string;
  character_emotion: string;
  background_prompt?: string;
  character_position: 'left' | 'right' | 'center';
  base_portrait_url?: string;
  voice_profile_id?: number;
}

export interface Scene {
  scene_id: string;
  background_prompt?: string;
}

export interface CreateVideoProjectRequest {
  name: string;
  script_id: number;
  resolution?: string;
  background_style?: string;
}
```

### New Components

**components/CharacterManager.tsx**
```typescript
import React, { useState, useEffect } from 'react';
import { Character, CreateCharacterRequest } from '../types/character';
import { Voice } from '../types/voice';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface CharacterManagerProps {
  onCharacterSelect?: (character: Character) => void;
}

export const CharacterManager: React.FC<CharacterManagerProps> = ({ onCharacterSelect }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCharacter, setNewCharacter] = useState<CreateCharacterRequest>({
    name: '',
    description: '',
    voice_profile_id: undefined,
    base_portrait_url: ''
  });

  useEffect(() => {
    fetchCharacters();
    fetchVoices();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/characters');
      const data = await response.json();
      setCharacters(data);
    } catch (error) {
      console.error('Failed to fetch characters:', error);
    }
  };

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/voices');
      const data = await response.json();
      setVoices(data);
    } catch (error) {
      console.error('Failed to fetch voices:', error);
    }
  };

  const handleCreateCharacter = async () => {
    if (!newCharacter.name.trim()) return;

    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCharacter)
      });

      if (response.ok) {
        setIsCreating(false);
        setNewCharacter({ name: '', description: '', voice_profile_id: undefined, base_portrait_url: '' });
        fetchCharacters();
      }
    } catch (error) {
      console.error('Failed to create character:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Character Manager</h2>
        <Button onClick={() => setIsCreating(true)}>Add Character</Button>
      </div>

      {isCreating && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Create New Character</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newCharacter.name}
                onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                placeholder="Character name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full p-2 border rounded"
                rows={3}
                value={newCharacter.description}
                onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
                placeholder="Character description and personality"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Voice</label>
              <select
                className="w-full p-2 border rounded"
                value={newCharacter.voice_profile_id || ''}
                onChange={(e) => setNewCharacter({ 
                  ...newCharacter, 
                  voice_profile_id: e.target.value ? parseInt(e.target.value) : undefined 
                })}
              >
                <option value="">Select a voice...</option>
                {voices.map(voice => (
                  <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Portrait URL (optional)</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newCharacter.base_portrait_url}
                onChange={(e) => setNewCharacter({ ...newCharacter, base_portrait_url: e.target.value })}
                placeholder="https://example.com/portrait.jpg"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateCharacter}>Create Character</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map(character => (
          <Card key={character.id} className="p-4 cursor-pointer hover:bg-gray-50" 
                onClick={() => onCharacterSelect?.(character)}>
            <div className="flex items-start gap-3">
              {character.base_portrait_url && (
                <img 
                  src={character.base_portrait_url} 
                  alt={character.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-medium">{character.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{character.description}</p>
                {character.voice_name && (
                  <p className="text-xs text-blue-600 mt-1">Voice: {character.voice_name}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

**components/VideoScriptEditor.tsx**
```typescript
import React, { useState, useEffect } from 'react';
import { VideoScriptLine, Character, Scene } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface VideoScriptEditorProps {
  scriptId: number;
  onScriptChange?: (lines: VideoScriptLine[]) => void;
}

export const VideoScriptEditor: React.FC<VideoScriptEditorProps> = ({ scriptId, onScriptChange }) => {
  const [scriptLines, setScriptLines] = useState<VideoScriptLine[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  useEffect(() => {
    fetchScriptData();
    fetchCharacters();
  }, [scriptId]);

  const fetchScriptData = async () => {
    try {
      const response = await fetch(`/api/scripts/${scriptId}/video-data`);
      const data = await response.json();
      setScriptLines(data.lines || []);
      setScenes(data.scenes || []);
      onScriptChange?.(data.lines || []);
    } catch (error) {
      console.error('Failed to fetch script data:', error);
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/characters');
      const data = await response.json();
      setCharacters(data);
    } catch (error) {
      console.error('Failed to fetch characters:', error);
    }
  };

  const updateScriptLine = async (lineId: number, updates: Partial<VideoScriptLine>) => {
    try {
      const response = await fetch(`/api/script-lines/${lineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        setScriptLines(prev => 
          prev.map(line => 
            line.id === lineId ? { ...line, ...updates } : line
          )
        );
      }
    } catch (error) {
      console.error('Failed to update script line:', error);
    }
  };

  const generateBackgroundPrompt = (sceneId: string) => {
    const sceneLines = scriptLines.filter(line => line.scene_id === sceneId);
    if (sceneLines.length > 0) {
      const firstLine = sceneLines[0];
      const prompt = `anime style background, ${sceneId.replace(/_/g, ' ')}, detailed environment, high quality`;
      return prompt;
    }
    return '';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Video Script Editor</h2>
      
      {/* Scene Overview */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-2">Scenes Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {scenes.map(scene => (
            <div key={scene.scene_id} className="p-2 bg-gray-50 rounded text-sm">
              <div className="font-medium">{scene.scene_id.replace(/_/g, ' ')}</div>
              {scene.background_prompt && (
                <div className="text-gray-600 text-xs mt-1 line-clamp-2">
                  {scene.background_prompt}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Script Lines */}
      <div className="space-y-2">
        {scriptLines.map((line, index) => (
          <Card key={line.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="text-sm text-gray-500 w-8">{index + 1}</div>
              
              <div className="flex-1 space-y-3">
                {/* Main content */}
                <div>
                  <textarea
                    className="w-full p-2 border rounded text-sm"
                    value={line.content}
                    onChange={(e) => updateScriptLine(line.id, { content: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* Video metadata */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <label className="block text-xs font-medium mb-1">Scene ID</label>
                    <input
                      type="text"
                      className="w-full p-1 border rounded text-xs"
                      value={line.scene_id || ''}
                      onChange={(e) => updateScriptLine(line.id, { scene_id: e.target.value })}
                      placeholder="scene_1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Character</label>
                    <select
                      className="w-full p-1 border rounded text-xs"
                      value={line.character_name || ''}
                      onChange={(e) => updateScriptLine(line.id, { character_name: e.target.value })}
                    >
                      <option value="">Select character...</option>
                      {characters.map(char => (
                        <option key={char.id} value={char.name}>{char.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Emotion</label>
                    <select
                      className="w-full p-1 border rounded text-xs"
                      value={line.character_emotion}
                      onChange={(e) => updateScriptLine(line.id, { character_emotion: e.target.value })}
                    >
                      <option value="neutral">Neutral</option>
                      <option value="happy">Happy</option>
                      <option value="sad">Sad</option>
                      <option value="angry">Angry</option>
                      <option value="surprised">Surprised</option>
                      <option value="confused">Confused</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Position</label>
                    <select
                      className="w-full p-1 border rounded text-xs"
                      value={line.character_position}
                      onChange={(e) => updateScriptLine(line.id, { character_position: e.target.value as any })}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>

                {/* Background prompt */}
                {line.scene_id && (
                  <div>
                    <label className="block text-xs font-medium mb-1">Background Prompt</label>
                    <input
                      type="text"
                      className="w-full p-1 border rounded text-xs"
                      value={line.background_prompt || ''}
                      onChange={(e) => updateScriptLine(line.id, { background_prompt: e.target.value })}
                      placeholder={`Background description for ${line.scene_id}`}
                    />
                    {!line.background_prompt && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-1 text-xs"
                        onClick={() => updateScriptLine(line.id, { background_prompt: generateBackgroundPrompt(line.scene_id!) })}
                      >
                        Generate Background Prompt
                      </Button>
                    )}
                  </div>
                )}

                {/* Character preview */}
                {line.character_name && line.base_portrait_url && (
                  <div className="flex items-center gap-2 text-xs">
                    <img 
                      src={line.base_portrait_url} 
                      alt={line.character_name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-gray-600">{line.character_display_name || line.character_name}</span>
                    <span className="text-blue-600">• {line.character_emotion}</span>
                    <span className="text-green-600">• {line.character_position}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

**components/VideoProjectCreator.tsx**
```typescript
import React, { useState, useEffect } from 'react';
import { Script } from '../types/script';
import { VideoProject, CreateVideoProjectRequest } from '../types/video';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface VideoProjectCreatorProps {
  onProjectCreated?: (project: VideoProject) => void;
}

export const VideoProjectCreator: React.FC<VideoProjectCreatorProps> = ({ onProjectCreated }) => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState<CreateVideoProjectRequest>({
    name: '',
    script_id: 0,
    resolution: '1080p',
    background_style: 'anime'
  });

  useEffect(() => {
    fetchScripts();
    fetchProjects();
  }, []);

  const fetchScripts = async () => {
    try {
      const response = await fetch('/api/scripts');
      const data = await response.json();
      setScripts(data);
    } catch (error) {
      console.error('Failed to fetch scripts:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/video/projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !newProject.script_id) return;

    try {
      const response = await fetch('/api/video/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });

      if (response.ok) {
        const project = await response.json();
        setIsCreating(false);
        setNewProject({ name: '', script_id: 0, resolution: '1080p', background_style: 'anime' });
        fetchProjects();
        onProjectCreated?.(project);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Video Projects</h2>
        <Button onClick={() => setIsCreating(true)}>New Project</Button>
      </div>

      {isCreating && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Create Video Project</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="My Visual Novel Project"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Script</label>
              <select
                className="w-full p-2 border rounded"
                value={newProject.script_id || ''}
                onChange={(e) => setNewProject({ ...newProject, script_id: parseInt(e.target.value) })}
              >
                <option value="">Select a script...</option>
                {scripts.map(script => (
                  <option key={script.id} value={script.id}>{script.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Resolution</label>
                <select
                  className="w-full p-2 border rounded"
                  value={newProject.resolution}
                  onChange={(e) => setNewProject({ ...newProject, resolution: e.target.value })}
                >
                  <option value="720p">720p (1280x720)</option>
                  <option value="1080p">1080p (1920x1080)</option>
                  <option value="1440p">1440p (2560x1440)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Background Style</label>
                <select
                  className="w-full p-2 border rounded"
                  value={newProject.background_style}
                  onChange={(e) => setNewProject({ ...newProject, background_style: e.target.value })}
                >
                  <option value="anime">Anime Style</option>
                  <option value="realistic">Realistic</option>
                  <option value="fantasy">Fantasy</option>
                  <option value="modern">Modern</option>
                  <option value="historical">Historical</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateProject}>Create Project</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <Card key={project.id} className="p-4 cursor-pointer hover:bg-gray-50">
            <h3 className="font-medium">{project.name}</h3>
            <p className="text-sm text-gray-600">{project.script_title}</p>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {project.resolution}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                {project.background_style}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Created {new Date(project.created_at).toLocaleDateString()}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

### New Pages

**pages/VideoManagerPage.tsx**
```typescript
import React, { useState } from 'react';
import { CharacterManager } from '../components/CharacterManager';
import { VideoProjectCreator } from '../components/VideoProjectCreator';
import { VideoScriptEditor } from '../components/VideoScriptEditor';

export const VideoManagerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'characters' | 'editor'>('projects');
  const [selectedScriptId, setSelectedScriptId] = useState<number | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Video Manager</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'projects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'characters'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Characters
          </button>
          {selectedScriptId && (
            <button
              onClick={() => setActiveTab('editor')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'editor'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Script Editor
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'projects' && (
          <VideoProjectCreator 
            onProjectCreated={(project) => {
              setSelectedScriptId(project.script_id);
              setActiveTab('editor');
            }}
          />
        )}
        
        {activeTab === 'characters' && (
          <CharacterManager />
        )}
        
        {activeTab === 'editor' && selectedScriptId && (
          <VideoScriptEditor scriptId={selectedScriptId} />
        )}
      </div>
    </div>
  );
};
```

## Integration with Existing App

### Update App.tsx routing
```typescript
// Add to existing routes
import { VideoManagerPage } from './pages/VideoManagerPage';

// In your routing setup:
<Route path="/video" component={VideoManagerPage} />
```

### Update main navigation
```typescript
// Add to navigation menu
<Link to="/video" className="nav-link">
  Video Manager
</Link>
```

## Implementation Timeline

### Week 1: Backend Infrastructure
- Database schema updates
- New PHP controllers and models
- API endpoint implementation
- Testing with existing voice system

### Week 2: Frontend Components
- Character management components
- Video script editor interface
- Project creation and management
- Integration with existing UI components

### Week 3: Integration & Testing
- Connect frontend to backend APIs
- Test script editing workflow
- Character-voice assignment testing
- Video project management testing

## Next Phase: Background Generation

After this foundation is complete, the next phase would integrate with your existing ComfyUI PowerShell scripts to generate backgrounds based on the scene prompts, but that's outside the scope of this focused implementation.

## Benefits of This Approach

1. **Builds on Existing Infrastructure** - Uses your current voice generation system
2. **No External Dependencies** - No LLM or LoRA complexity
3. **Immediate Value** - Enhanced script management for better organization
4. **Foundation for Future Features** - Sets up the database and UI structure for video generation
5. **Testable Components** - Each component can be tested independently

This implementation provides the groundwork for visual novel video creation while keeping complexity manageable and building incrementally on your existing system.