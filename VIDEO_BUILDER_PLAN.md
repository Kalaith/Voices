# Video Generator JSON Builder - Project Plan

## Architecture Overview

### Frontend: React + TypeScript
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand or React Context
- **UI Library**: Material-UI or Tailwind CSS + shadcn/ui
- **Form Management**: React Hook Form + Zod validation
- **API Client**: Axios or Fetch API

### Backend: PHP
- **Version**: PHP 8.1+
- **Framework**: Slim Framework or plain PHP with routing
- **Database**: MySQL/MariaDB for storing projects
- **File Storage**: Local filesystem for JSON files
- **API Style**: RESTful JSON API

---

## Database Schema

```sql
-- projects table
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    json_data LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- characters table (optional, for reusable characters)
CREATE TABLE characters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100),
    appearance TEXT,
    voice_settings JSON,
    portrait_settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Frontend Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   ├── project/
│   │   ├── ProjectInfo.tsx              # Title, description, output directory
│   │   ├── ProjectList.tsx              # List saved projects
│   │   └── ProjectCard.tsx              # Project preview card
│   ├── characters/
│   │   ├── CharacterList.tsx            # List of characters in project
│   │   ├── CharacterForm.tsx            # Add/Edit character
│   │   ├── CharacterCard.tsx            # Display character info
│   │   ├── VoiceSettings.tsx            # Voice configuration UI
│   │   └── PortraitSettings.tsx         # Portrait position/size settings
│   ├── scenes/
│   │   ├── SceneList.tsx                # List of scenes with drag-drop reorder
│   │   ├── SceneForm.tsx                # Add/Edit scene
│   │   ├── SceneCard.tsx                # Scene preview
│   │   ├── DialogueEditor.tsx           # Edit dialogue lines
│   │   └── DialogueLine.tsx             # Single dialogue line component
│   ├── config/
│   │   ├── VideoSettings.tsx            # FPS, duration, visual novel mode
│   │   ├── AudioSettings.tsx            # Audio engine, multi-voice
│   │   └── ImageSettings.tsx            # Generation mode, style, dimensions
│   ├── preview/
│   │   ├── JsonPreview.tsx              # Show formatted JSON
│   │   └── JsonDiff.tsx                 # Compare versions
│   └── common/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Textarea.tsx
│       └── FormField.tsx
├── types/
│   ├── project.types.ts                 # TypeScript interfaces matching JSON schema
│   ├── character.types.ts
│   ├── scene.types.ts
│   └── api.types.ts
├── hooks/
│   ├── useProject.ts                    # Project CRUD operations
│   ├── useCharacters.ts                 # Character management
│   ├── useScenes.ts                     # Scene management
│   └── useValidation.ts                 # Form validation
├── services/
│   ├── api.ts                           # API client configuration
│   ├── projectService.ts                # Project API calls
│   └── validationService.ts             # JSON schema validation
├── store/
│   ├── projectStore.ts                  # Global state management
│   └── uiStore.ts                       # UI state (modals, loading, etc)
├── utils/
│   ├── jsonBuilder.ts                   # Build JSON from form data
│   ├── jsonValidator.ts                 # Validate JSON structure
│   └── downloadHelper.ts                # Download JSON file
├── pages/
│   ├── HomePage.tsx                     # Project list/dashboard
│   ├── ProjectEditorPage.tsx            # Main editor (tabbed interface)
│   └── NewProjectPage.tsx               # Create new project wizard
└── App.tsx
```

---

## TypeScript Interfaces

```typescript
// types/project.types.ts
interface Project {
  project: ProjectInfo;
  output_directory: string;
  characters: Record<string, Character>;
  video: VideoConfig;
  script: ScriptConfig;
  audio: AudioConfig;
  images: ImageConfig;
}

interface ProjectInfo {
  title: string;
  description: string;
}

interface Character {
  name: string;
  role: string;
  description: string;
  voice: VoiceConfig;
  appearance: string;
  portrait: PortraitConfig;
}

interface VoiceConfig {
  engine: string;
  voice_id: string;
  speed: number;
  exaggeration: number;
  cfg_weight: number;
}

interface PortraitConfig {
  position: 'left' | 'right' | 'none';
  size: 'small' | 'medium' | 'large';
  file: string;
}

interface Scene {
  scene_number: number;
  background_description: string;
  characters_present: string[];
  dialogue: DialogueLine[];
  duration: number;
}

interface DialogueLine {
  character: string;
  text: string;
}

interface VideoConfig {
  scene_duration: number;
  fps: number;
  total_duration: number;
  visual_novel_mode: boolean;
  character_display: boolean;
}

interface ScriptConfig {
  generation_mode: 'predefined' | 'ai_generated';
  prompt?: string;
  max_length?: number;
  temperature?: number;
  top_p?: number;
  scenes: Scene[];
}

interface AudioConfig {
  enabled: boolean;
  engine: string;
  multi_voice_enabled: boolean;
  default_engine: string;
  character_voice_mapping: Record<string, VoiceConfig>;
  fallback_voice_parameters: Partial<VoiceConfig>;
}

interface ImageConfig {
  generation_mode: 'generate' | 'predefined';
  style: string;
  character_style: string;
  background_style: string;
  width: number;
  height: number;
  steps: number;
  files: string[];
}
```

---

## Backend PHP Structure

```
backend/
├── public/
│   └── index.php                        # Entry point
├── src/
│   ├── Controllers/
│   │   ├── ProjectController.php        # CRUD for projects
│   │   ├── CharacterController.php      # Character presets
│   │   └── ValidationController.php     # Validate JSON
│   ├── Models/
│   │   ├── Project.php
│   │   └── Character.php
│   ├── Services/
│   │   ├── JsonBuilder.php              # Build JSON from request
│   │   ├── JsonValidator.php            # Validate structure
│   │   └── FileStorage.php              # Save/load JSON files
│   ├── Middleware/
│   │   ├── CorsMiddleware.php           # CORS headers
│   │   └── AuthMiddleware.php           # Optional: API authentication
│   └── Database/
│       ├── Connection.php
│       └── migrations/
│           └── 001_create_tables.sql
├── config/
│   ├── database.php
│   └── app.php
├── storage/
│   └── projects/                        # Generated JSON files
└── composer.json
```

---

## API Endpoints

### Projects
```
GET    /api/projects              # List all projects
GET    /api/projects/{id}         # Get project by ID
POST   /api/projects              # Create new project
PUT    /api/projects/{id}         # Update project
DELETE /api/projects/{id}         # Delete project
GET    /api/projects/{id}/json    # Download JSON file
POST   /api/projects/{id}/clone   # Clone project
```

### Characters (Optional - Reusable presets)
```
GET    /api/characters            # List character presets
POST   /api/characters            # Create character preset
PUT    /api/characters/{id}       # Update character preset
DELETE /api/characters/{id}       # Delete character preset
```

### Validation
```
POST   /api/validate              # Validate JSON structure
```

---

## UI Flow

### 1. Dashboard/Home Page
- Display list of saved projects (cards with thumbnails)
- Search/filter projects
- "New Project" button → New Project Wizard
- Click project → Open editor

### 2. New Project Wizard (Multi-step)
**Step 1: Project Info**
- Title, description, output directory

**Step 2: Characters**
- Add characters with voice/portrait settings
- Import from presets library

**Step 3: Scenes**
- Add scenes with dialogue
- Drag-drop to reorder

**Step 4: Configuration**
- Video, audio, image settings

**Step 5: Review & Save**
- JSON preview
- Save to database

### 3. Project Editor (Tabbed Interface)
**Tab 1: Overview**
- Project info (title, description)
- Quick stats (# scenes, # characters)
- Actions (export, clone, delete)

**Tab 2: Characters**
- Character cards in grid
- Add/Edit/Delete characters
- Test voice settings (preview)

**Tab 3: Scenes**
- Scene list with drag-drop reorder
- Expand/collapse scene details
- Dialogue editor with character selector
- Add/Edit/Delete scenes

**Tab 4: Configuration**
- Video settings (FPS, duration, mode)
- Audio settings (engine, multi-voice)
- Image settings (style, dimensions)

**Tab 5: Preview & Export**
- Live JSON preview with syntax highlighting
- Download JSON button
- Copy to clipboard
- Validation status/errors

---

## Key Features

### Character Management
- **Voice Preview**: Test voice settings before saving
- **Portrait Upload**: Upload custom portraits or use generated
- **Reusable Presets**: Save characters to library for reuse

### Scene Editor
- **Drag-Drop Reordering**: Change scene order easily
- **Character Selector**: Dropdown showing only characters in scene
- **Word Count**: Show estimated duration per dialogue
- **Duplicate Scene**: Quick copy for similar scenes

### Dialogue Editor
- **Inline Editing**: Edit dialogue in place
- **Character Avatar**: Show character portrait next to dialogue
- **Add Line**: Quick add between existing lines
- **Reorder Lines**: Drag-drop dialogue order

### Validation
- **Real-time Validation**: Validate as user types
- **Error Highlighting**: Show which fields have errors
- **Required Fields**: Mark required fields clearly
- **Schema Validation**: Validate against JSON schema

### Export Options
- **Download JSON**: Save to local file
- **Copy to Clipboard**: Copy JSON text
- **Send to API**: Trigger video generation (future)
- **Version History**: Save versions in database

---

## Development Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Setup React + TypeScript + Vite project
- [ ] Setup PHP backend with database
- [ ] Create API endpoints for projects CRUD
- [ ] Create TypeScript interfaces
- [ ] Basic layout components

### Phase 2: Project Management (Week 2)
- [ ] Project list page
- [ ] Create/Edit project form
- [ ] Save/Load projects from database
- [ ] JSON preview component

### Phase 3: Character Builder (Week 3)
- [ ] Character form component
- [ ] Voice settings UI
- [ ] Portrait settings UI
- [ ] Character list with CRUD

### Phase 4: Scene Editor (Week 4)
- [ ] Scene list with drag-drop
- [ ] Scene form component
- [ ] Dialogue editor
- [ ] Character presence selector

### Phase 5: Configuration (Week 5)
- [ ] Video settings form
- [ ] Audio settings form
- [ ] Image settings form
- [ ] Settings validation

### Phase 6: Polish & Features (Week 6)
- [ ] JSON validation with error messages
- [ ] Export functionality
- [ ] Clone projects
- [ ] Search/filter
- [ ] Responsive design
- [ ] Dark mode

---

## Technology Stack Details

### Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.3",
    "zustand": "^4.4.7",
    "axios": "^1.6.2",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "react-syntax-highlighter": "^15.5.0",
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

### Backend Dependencies (composer.json)
```json
{
  "require": {
    "php": ">=8.1",
    "slim/slim": "^4.12",
    "slim/psr7": "^1.6",
    "php-di/php-di": "^7.0",
    "vlucas/phpdotenv": "^5.5"
  }
}
```

---

## File Organization in Output

The system will generate JSON files compatible with the video generator's expected structure:

```
GeneratedVideos/
├── project_name/
│   ├── temp_audio/              # Individual character audio clips
│   ├── characters/              # Character portrait images
│   ├── temp_video/              # Individual scene videos
│   ├── scene_N_audio.wav        # Final scene audio
│   ├── scene_N_bg.png           # Background images
│   └── Final_Video.mp4          # Final video output
```

---

## Additional Considerations

### Security
- Validate all user input
- Sanitize JSON before saving
- Implement CSRF protection
- Rate limit API endpoints
- Validate file uploads (portraits)

### Performance
- Lazy load large project lists
- Debounce auto-save
- Optimize JSON preview rendering
- Cache character presets

### User Experience
- Auto-save drafts
- Undo/Redo functionality
- Keyboard shortcuts
- Loading states
- Error boundaries
- Toast notifications

### Testing
- Unit tests for JSON builder
- Integration tests for API
- E2E tests for critical flows
- Validation schema tests
