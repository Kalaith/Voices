# Visual Novel Video Generation Implementation Plan

## Overview
This plan outlines the implementation of full video generation capabilities for the Voices project, creating visual novel-style videos with animated portraits, backgrounds, and synchronized speech.

## Architecture Components

### 1. Video Generation Pipeline
```
LLM Script Generation → Character Profile Management → Background Generation → Portrait Animation → Audio Sync → Video Assembly
```

### 2. System Components

#### A. KoboldAI Script Generation Service
- **Local KoboldAI API integration** for story and dialogue generation
- **Character-driven narrative creation** with personality consistency
- **Scene and dialogue generation** from prompts or outlines
- **Genre and style templates** (romance, fantasy, sci-fi, etc.)
- **Interactive story branching** and user input integration
- **Novel writing mode** for long-form story generation
- **Adventure mode** for interactive dialogue scenarios

#### B. Character Profile Management System
- **Character creation wizard** with detailed personality traits
- **Visual consistency engine** using LoRA training and embeddings
- **Voice profile assignment** and consistency tracking
- **Character relationship mapping** and interaction dynamics
- **Emotion/expression libraries** per character

#### C. Enhanced Script Management
- **Multi-speaker script parser** with character assignments
- **Scene descriptions** for background generation
- **Character emotion/expression markers**
- **Timing and pacing controls**
- **Auto-generated scripts** from LLM integration

#### D. Background Generation Service  
- **Stable Diffusion integration** via existing PowerShell scripts
- **Location/scene/item image generation**
- **Background caching and optimization**
- **Style consistency across scenes**

#### E. Portrait Animation Service
- **InfiniteTalk integration** for lip-sync animation
- **Character portrait generation and caching**
- **Left/right positioning for dialogue**
- **Expression and emotion animation**

#### F. Video Assembly Engine
- **Scene composition** with layered elements
- **Audio-visual synchronization**
- **Transition effects between scenes**
- **Export in multiple formats/resolutions**

## Implementation Phases

### Phase 0: LLM Script Generation & Character System
**Duration: 2-3 weeks**

1. **KoboldAI Integration Service**
   ```python
   class KoboldAIScriptGenerationService:
       def __init__(self, kobold_url: str = "http://127.0.0.1:5000"):
           self.api_url = f"{kobold_url}/api"
           self.client = httpx.AsyncClient()
           
       async def generate_story_outline(self, prompt: str, genre: str, characters: List[Character]) -> StoryOutline:
           # Use novel writing mode for story outlines
           
       async def generate_dialogue(self, scene: Scene, characters: List[Character]) -> List[DialogueLine]:
           # Use adventure/chatbot mode for character dialogue
           
       async def expand_scene(self, scene_summary: str, characters: List[Character]) -> DetailedScene:
           # Use novel mode for detailed scene descriptions
           
       async def suggest_character_actions(self, character: Character, context: str) -> List[Action]:
           # Generate character-appropriate actions based on personality
           
       async def generate_with_context(self, prompt: str, max_length: int = 200, temperature: float = 0.7) -> str:
           # Core KoboldAI generation function
   ```

2. **Character Profile System**
   ```python
   class Character:
       name: str
       personality_traits: List[str]
       background_story: str
       speaking_style: str
       voice_profile_id: str
       visual_description: str
       relationships: Dict[str, str]
       emotion_mapping: Dict[str, str]
       
   class CharacterManager:
       def create_character_profile(self, description: str) -> Character
       def generate_character_lora(self, character: Character) -> str
       def ensure_visual_consistency(self, character: Character, scene_prompt: str) -> str
       def map_voice_to_character(self, character: Character, voice_id: str) -> bool
   ```

3. **Character Consistency Engine**
   - **LoRA Training Pipeline** for character visual consistency
   - **Embedding-based character recognition** in generated images
   - **Character prompt templates** with consistent style markers
   - **Voice-character association tracking**

### Phase 1: Enhanced Script Management
**Duration: 1-2 weeks**

1. **Enhanced Script Data Model**
   - Extend `script_lines` table with scene/character metadata
   - Add fields: `scene_description`, `character_emotion`, `background_prompt`, `character_position`
   - Add `character_profiles` and `story_projects` tables

2. **Script Editor UI Updates**
   - Visual novel script editor interface
   - Scene breakdown view
   - Character assignment dropdown
   - LLM-assisted script generation interface
   - Character profile editor

3. **Script Validation & Parsing**
   - Multi-speaker validation
   - Scene transition detection
   - Character consistency checking
   - LLM-generated content integration

### Phase 2: Background Generation Integration
**Duration: 1-2 weeks**

1. **Background Generation Service**
   ```python
   class BackgroundGenerationService:
       def generate_scene_background(self, prompt: str, style: str) -> str
       def batch_generate_backgrounds(self, scenes: List[Scene]) -> Dict[str, str]
       def optimize_for_video(self, image_path: str) -> str
   ```

2. **PowerShell Integration Layer**
   - Wrapper service for ComfyUI calls
   - Batch processing for multiple scenes
   - Image optimization and format standardization

3. **Background Cache Management**
   - Scene-based caching system
   - Background reuse for similar scenes
   - Storage optimization

### Phase 3: Portrait Animation System
**Duration: 2-3 weeks**

1. **InfiniteTalk Integration**
   ```python
   class PortraitAnimationService:
       def generate_character_portrait(self, character: str, style: str) -> str
       def animate_speech(self, portrait: str, audio: str, emotion: str) -> str
       def create_idle_animation(self, portrait: str) -> str
   ```

2. **Character Management**
   - Character portrait library
   - Emotion/expression mapping
   - Consistent character appearance across scenes

3. **Animation Pipeline**
   - Audio-driven lip-sync via InfiniteTalk
   - Emotion-based facial expressions
   - Idle animations for non-speaking characters

### Phase 4: Video Assembly Engine
**Duration: 2-3 weeks**

1. **Scene Composition System**
   ```python
   class VideoAssemblyEngine:
       def compose_scene(self, background: str, characters: List[AnimatedPortrait], audio: str) -> VideoClip
       def add_ui_elements(self, scene: VideoClip, text: str) -> VideoClip
       def create_transitions(self, scenes: List[VideoClip]) -> VideoClip
   ```

2. **Visual Novel UI Overlay**
   - Text box rendering with styled text
   - Character name displays
   - Dialogue progression indicators

3. **Video Export Pipeline**
   - Multiple resolution support (720p, 1080p, 4K)
   - Format options (MP4, WebM, MOV)
   - Compression and optimization

### Phase 5: Frontend Integration
**Duration: 1-2 weeks**

1. **Video Generation Interface**
   - Video project creation and management
   - Real-time preview capabilities
   - Progress tracking for long generations

2. **Asset Management UI**
   - Background library browser
   - Character portrait manager
   - Generated video gallery

## Technical Implementation Details

### Database Schema Extensions

```sql
-- Enhanced script_lines table
ALTER TABLE script_lines ADD COLUMN scene_id VARCHAR(50);
ALTER TABLE script_lines ADD COLUMN character_name VARCHAR(100);
ALTER TABLE script_lines ADD COLUMN character_emotion VARCHAR(50);
ALTER TABLE script_lines ADD COLUMN background_prompt TEXT;
ALTER TABLE script_lines ADD COLUMN character_position ENUM('left', 'right', 'center');

-- Character management tables
CREATE TABLE character_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    personality_traits JSON,
    background_story TEXT,
    speaking_style TEXT,
    visual_description TEXT,
    voice_profile_id INT,
    lora_model_path VARCHAR(500),
    base_portrait_path VARCHAR(500),
    emotion_mapping JSON,
    relationships JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (voice_profile_id) REFERENCES voices(id),
    INDEX idx_character_name (name)
);

CREATE TABLE character_expressions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT,
    emotion VARCHAR(50),
    expression_prompt TEXT,
    image_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES character_profiles(id),
    INDEX idx_character_emotion (character_id, emotion)
);

-- Story and script generation tables
CREATE TABLE story_projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    genre VARCHAR(50),
    theme TEXT,
    setting TEXT,
    tone VARCHAR(50),
    target_length INT,
    llm_model VARCHAR(50),
    generation_prompt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE generated_scripts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_project_id INT,
    script_id INT,
    generation_method ENUM('llm_generated', 'user_created', 'mixed'),
    llm_prompt TEXT,
    generation_metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_project_id) REFERENCES story_projects(id),
    FOREIGN KEY (script_id) REFERENCES scripts(id)
);

-- Video project tables
CREATE TABLE video_projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    story_project_id INT,
    script_id INT,
    style_preset VARCHAR(100),
    resolution VARCHAR(20) DEFAULT '1080p',
    character_style_consistency BOOLEAN DEFAULT TRUE,
    background_style VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_project_id) REFERENCES story_projects(id),
    FOREIGN KEY (script_id) REFERENCES scripts(id)
);

CREATE TABLE generated_backgrounds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scene_prompt TEXT,
    style_prompt TEXT,
    image_path VARCHAR(500),
    style VARCHAR(100),
    prompt_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prompt_hash (prompt_hash),
    INDEX idx_style (style)
);

CREATE TABLE character_lora_models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT,
    model_name VARCHAR(200),
    model_path VARCHAR(500),
    trigger_word VARCHAR(100),
    training_images_count INT,
    model_version VARCHAR(20),
    training_status ENUM('pending', 'training', 'completed', 'failed'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES character_profiles(id),
    INDEX idx_character_lora (character_id)
);
```

### API Endpoints

```php
// KoboldAI Script Generation
POST /api/kobold/generate-story - Generate story outline from prompt
POST /api/kobold/generate-dialogue - Generate dialogue for scene
POST /api/kobold/expand-scene - Expand scene description
POST /api/kobold/suggest-actions - Suggest character actions
GET /api/kobold/status - Check KoboldAI server status

// Story Project Management
POST /api/stories/create - Create new story project
GET /api/stories/{id} - Get story project details
PUT /api/stories/{id} - Update story project
POST /api/stories/{id}/generate-script - Generate script from story

// Character Profile Management
POST /api/characters/create - Create character profile
GET /api/characters - List all characters
GET /api/characters/{id} - Get character profile
PUT /api/characters/{id} - Update character profile
DELETE /api/characters/{id} - Delete character profile
POST /api/characters/{id}/generate-portrait - Generate base portrait
POST /api/characters/{id}/train-lora - Start LoRA model training
GET /api/characters/{id}/expressions - Get character expressions
POST /api/characters/{id}/expressions - Add character expression

// Video generation endpoints
POST /api/video/projects - Create video project
GET /api/video/projects/{id} - Get video project
POST /api/video/generate - Start video generation
GET /api/video/status/{id} - Check generation status

// Background generation
POST /api/backgrounds/generate - Generate scene background
GET /api/backgrounds/cache - List cached backgrounds
POST /api/backgrounds/batch-generate - Generate multiple backgrounds

// Character animation and consistency
POST /api/characters/{id}/animate - Generate character animation
POST /api/characters/{id}/ensure-consistency - Ensure visual consistency
GET /api/characters/{id}/lora-status - Check LoRA training status
```

### Service Architecture

```python
# KoboldAI Script Generation Service
class KoboldAIScriptGenerationService:
    def __init__(self, kobold_url: str = "http://127.0.0.1:5000"):
        self.api_url = f"{kobold_url}/api"
        self.client = httpx.AsyncClient()
        self.character_manager = CharacterManager()
        
    async def check_kobold_status(self) -> bool:
        """Check if KoboldAI server is running and accessible"""
        try:
            response = await self.client.get(f"{self.api_url}/v1/info/version")
            return response.status_code == 200
        except:
            return False
    
    async def generate_story_outline(self, prompt: str, genre: str, characters: List[Character]) -> StoryOutline:
        character_descriptions = [f"{c.name}: {c.personality_traits}, {c.background_story}" for c in characters]
        generation_prompt = f"""Write a {genre} story outline with these characters:
{chr(10).join(character_descriptions)}

Story premise: {prompt}

Generate a structured outline with scenes and character interactions:"""
        
        response = await self._generate_text(generation_prompt, max_length=500, temperature=0.8)
        return self._parse_story_outline(response, characters)
        
    async def generate_dialogue(self, scene: Scene, characters: List[Character]) -> List[DialogueLine]:
        """Generate character dialogue using adventure/chatbot mode"""
        character_info = {c.name: f"Personality: {', '.join(c.personality_traits)}. Speaking style: {c.speaking_style}" for c in characters}
        
        dialogue_prompt = f"""Scene: {scene.description}
Characters present: {', '.join([c.name for c in characters])}

Character information:
{chr(10).join([f"{name}: {info}" for name, info in character_info.items()])}

Generate natural dialogue for this scene:"""
        
        response = await self._generate_text(dialogue_prompt, max_length=300, temperature=0.9)
        return self._parse_dialogue(response, characters)
        
    async def expand_scene_description(self, summary: str, characters: List[Character]) -> DetailedScene:
        """Generate detailed scene descriptions using novel writing mode"""
        prompt = f"""Expand this scene summary into a detailed description suitable for a visual novel:

Summary: {summary}
Characters: {', '.join([c.name for c in characters])}

Include:
- Detailed setting and background description
- Character positions and actions
- Mood and atmosphere
- Visual elements for scene composition

Detailed scene:"""
        
        response = await self._generate_text(prompt, max_length=400, temperature=0.7)
        return self._parse_scene_description(response)
    
    async def _generate_text(self, prompt: str, max_length: int = 200, temperature: float = 0.7) -> str:
        """Core KoboldAI text generation function"""
        payload = {
            "prompt": prompt,
            "max_length": max_length,
            "temperature": temperature,
            "top_p": 0.9,
            "rep_pen": 1.1,
            "rep_pen_range": 1024,
            "rep_pen_slope": 0.9,
            "sampler_order": [6, 0, 1, 2, 3, 4, 5]
        }
        
        response = await self.client.post(f"{self.api_url}/v1/generate", json=payload)
        response.raise_for_status()
        result = response.json()
        
        return result.get("results", [{}])[0].get("text", "").strip()

# Character Consistency Management
class CharacterConsistencyEngine:
    def __init__(self):
        self.lora_trainer = LoRATrainer()
        self.embedding_manager = EmbeddingManager()
        
    async def create_character_lora(self, character: Character, reference_images: List[str]) -> str:
        """Train a LoRA model for consistent character generation"""
        training_config = {
            "base_model": "stable-diffusion-xl-base-1.0",
            "images": reference_images,
            "trigger_word": f"{character.name.lower()}_character",
            "steps": 1000,
            "learning_rate": 1e-4
        }
        return await self.lora_trainer.train_lora(training_config)
    
    async def ensure_visual_consistency(self, character: Character, scene_prompt: str) -> str:
        """Add character-specific prompts and LoRA triggers for consistency"""
        lora_trigger = f"<lora:{character.name.lower()}_character:0.8>"
        character_prompt = f"{character.visual_description}, {lora_trigger}"
        return f"{scene_prompt}, {character_prompt}"
    
    async def generate_character_expression(self, character: Character, emotion: str) -> str:
        """Generate character portrait with specific emotion"""
        base_prompt = character.visual_description
        emotion_modifier = character.emotion_mapping.get(emotion, emotion)
        lora_trigger = f"<lora:{character.name.lower()}_character:0.8>"
        return f"{base_prompt}, {emotion_modifier}, {lora_trigger}"

# Enhanced Character Manager
class CharacterManager:
    def __init__(self):
        self.consistency_engine = CharacterConsistencyEngine()
        self.voice_manager = VoiceManager()
        
    async def create_character_profile(self, description: str) -> Character:
        """Create comprehensive character profile from description"""
        # Use LLM to extract personality traits, background, etc.
        
    async def generate_base_portrait(self, character: Character) -> str:
        """Generate base character portrait for LoRA training"""
        
    async def map_voice_to_character(self, character: Character, voice_settings: VoiceSettings):
        """Associate and fine-tune voice for character consistency"""

# Main video generation service with enhanced features
class VideoGenerationService:
    def __init__(self):
        self.kobold_service = KoboldAIScriptGenerationService()
        self.character_manager = CharacterManager()
        self.background_service = BackgroundGenerationService()
        self.animation_service = PortraitAnimationService()
        self.assembly_engine = VideoAssemblyEngine()
        self.tts_service = TTSService()
    
    async def generate_video_from_prompt(self, story_prompt: str, characters: List[Character]) -> str:
        # 0. Check KoboldAI availability
        if not await self.kobold_service.check_kobold_status():
            raise Exception("KoboldAI server is not running on http://127.0.0.1:5000")
        
        # 1. Generate story outline and script
        story_outline = await self.kobold_service.generate_story_outline(story_prompt, characters)
        script = await self.kobold_service.generate_full_script(story_outline, characters)
        
        # 2. Ensure character consistency
        for character in characters:
            if not character.lora_model_path:
                await self.character_manager.create_character_lora(character)
        
        # 3. Generate audio with character-specific voices
        audio_clips = await self.generate_audio_for_script(script, characters)
        
        # 4. Generate backgrounds with consistent style
        backgrounds = await self.background_service.generate_scene_backgrounds(script.scenes)
        
        # 5. Generate character animations with consistency
        animations = await self.animation_service.create_character_animations(
            characters, audio_clips, script.scenes
        )
        
        # 6. Assemble final video
        video_path = await self.assembly_engine.create_video(
            backgrounds, animations, audio_clips, script
        )
        
        return video_path
```

### Integration with Existing Services

1. **TTS Engine Reuse**
   - Leverage existing ChatTTS/Chatterbox integration
   - Enhanced voice assignment per character
   - Emotional speech generation

2. **PowerShell Script Integration**
   - Wrap existing ComfyUI scripts in Python service calls
   - Batch processing optimization
   - Error handling and retry logic

3. **Frontend Component Reuse**
   - Extend existing script editor components
   - Reuse voice library and testing interfaces
   - Add video-specific UI components

## Dependencies and Requirements

### New Python Dependencies
```txt
# KoboldAI Integration
httpx>=0.24.0
aiohttp>=3.8.0

# Character Consistency & LoRA Training
diffusers>=0.21.0
transformers>=4.30.0
accelerate>=0.20.0
peft>=0.7.0  # For LoRA training
kohya-ss-scripts  # LoRA training utilities

# Video processing
moviepy>=1.0.3
opencv-python>=4.8.0
Pillow>=10.0.0

# InfiniteTalk integration (clone repository)
torch>=2.4.1
torchaudio>=2.4.1
xformers>=0.0.28
librosa>=0.10.0
soundfile>=0.12.0

# Image generation and processing
compel>=2.0.0  # Prompt weighting
controlnet-aux>=0.0.6
insightface>=0.7.3  # Face analysis for consistency
```

### System Requirements
```
# For KoboldAI
- Python 3.8+
- KoboldAI-Client running locally on port 5000
- Model files (varies by model size - 4GB to 30GB+)
- 8GB+ RAM for smaller models, 32GB+ for larger models

# For InfiniteTalk
- Python 3.10+
- CUDA 11.8+ (for GPU acceleration)
- 16GB+ RAM (32GB+ recommended for 720p)
- 50GB+ storage for models and cache

# For Stable Diffusion (existing ComfyUI setup)
- ComfyUI with SDXL models
- 8GB+ VRAM for image generation
```

### File Structure Extensions
```
voices/
├── video-service/              # New video generation service
│   ├── src/
│   │   ├── services/
│   │   │   ├── kobold_script_generation.py
│   │   │   ├── character_manager.py
│   │   │   ├── character_consistency.py
│   │   │   ├── background_generation.py
│   │   │   ├── portrait_animation.py
│   │   │   ├── lora_trainer.py
│   │   │   └── video_assembly.py
│   │   ├── models/
│   │   │   ├── character.py
│   │   │   ├── story_project.py
│   │   │   ├── video_project.py
│   │   │   └── animation_models.py
│   │   └── utils/
│   │       ├── infinitetalk_wrapper.py
│   │       ├── comfyui_integration.py
│   │       ├── kobold_client.py
│   │       └── image_utils.py
│   ├── infinitetalk/          # InfiniteTalk submodule
│   ├── lora_training/         # LoRA training scripts and configs
│   │   ├── configs/
│   │   ├── datasets/
│   │   └── trained_models/
│   ├── requirements.txt
│   └── main.py
├── voice-generator/           # Enhanced frontend
│   └── src/
│       ├── components/
│       │   ├── StoryCreator.tsx
│       │   ├── CharacterCreator.tsx
│       │   ├── CharacterManager.tsx
│       │   ├── ScriptGenerator.tsx
│       │   ├── VideoProjectCreator.tsx
│       │   ├── SceneEditor.tsx
│       │   ├── ConsistencyChecker.tsx
│       │   └── VideoPreview.tsx
│       └── types/
│           ├── character.ts
│           ├── story.ts
│           └── video.ts
└── assets/                    # Generated assets
    ├── stories/
    ├── characters/
    │   ├── portraits/
    │   ├── expressions/
    │   └── lora_models/
    ├── backgrounds/
    ├── animations/
    └── videos/
```

## Performance Considerations

### Optimization Strategies
1. **Background Caching** - Reuse similar scene backgrounds
2. **Character Portrait Reuse** - Cache base portraits per character
3. **Parallel Processing** - Generate backgrounds and audio simultaneously  
4. **Progressive Generation** - Show preview as scenes complete
5. **Quality Tiers** - Support draft/preview/final quality modes

### Hardware Scaling
- **Single GPU Setup**: Sequential generation, 720p max
- **Multi-GPU Setup**: Parallel background/animation generation
- **CPU-Only Fallback**: Reduced quality, longer generation times

## Testing Strategy

### Unit Tests
- Script parsing and validation
- Background generation service
- Character animation pipeline
- Video assembly functions

### Integration Tests  
- End-to-end video generation
- Audio-visual synchronization
- File format compatibility
- Performance benchmarking

### User Acceptance Testing
- Visual novel style accuracy
- Audio quality and sync
- UI/UX workflows
- Export format compatibility

## Risk Assessment & Mitigation

### Technical Risks
1. **InfiniteTalk Integration Complexity**
   - *Mitigation*: Start with basic integration, expand features iteratively
   
2. **Video Generation Performance**
   - *Mitigation*: Implement quality tiers and progress indicators
   
3. **Storage Requirements**
   - *Mitigation*: Asset cleanup policies and compression options

### User Experience Risks
1. **Long Generation Times**
   - *Mitigation*: Progress tracking, preview modes, background processing
   
2. **Complex Configuration**
   - *Mitigation*: Smart defaults, template systems, guided workflows

## Success Metrics

### Technical Metrics
- Video generation completion rate > 95%
- Average generation time < 5 minutes per minute of video
- Audio-visual sync accuracy > 98%
- System uptime > 99%

### User Experience Metrics
- User workflow completion rate > 80%
- Time from script to video < 30 minutes
- User satisfaction score > 4.0/5.0
- Feature adoption rate > 60%

## Character Consistency Deep Dive

### LoRA Training Pipeline
```python
class LoRATrainer:
    def __init__(self):
        self.kohya_trainer = KohyaTrainer()
        self.dataset_processor = DatasetProcessor()
        
    async def train_character_lora(self, character: Character, reference_images: List[str]):
        # 1. Process and validate reference images
        processed_images = await self.dataset_processor.prepare_training_data(
            reference_images, 
            character.name,
            min_images=10,
            max_resolution=1024
        )
        
        # 2. Generate captions for training images
        captions = await self.generate_training_captions(character, processed_images)
        
        # 3. Configure training parameters
        config = {
            "model_name": f"{character.name.lower()}_character_lora",
            "base_model": "stable-diffusion-xl-base-1.0",
            "resolution": 1024,
            "batch_size": 1,
            "learning_rate": 1e-4,
            "max_train_steps": 1000,
            "save_every_n_epochs": 100,
            "mixed_precision": "fp16",
            "gradient_checkpointing": True,
            "network_dim": 32,
            "network_alpha": 32
        }
        
        # 4. Start training
        model_path = await self.kohya_trainer.train_lora(config, processed_images, captions)
        
        # 5. Validate trained model
        test_results = await self.validate_lora_model(model_path, character)
        
        return model_path, test_results
```

### Voice-Character Consistency
```python
class VoiceCharacterMapper:
    def __init__(self):
        self.tts_service = TTSService()
        self.voice_analyzer = VoiceAnalyzer()
        
    async def create_character_voice_profile(self, character: Character, base_voice_id: str):
        # 1. Analyze character personality for voice traits
        voice_traits = self.analyze_personality_for_voice(character.personality_traits)
        
        # 2. Adjust TTS parameters based on character
        voice_config = {
            "base_voice_id": base_voice_id,
            "speed": voice_traits.get("speed", 1.0),
            "pitch": voice_traits.get("pitch", 1.0),
            "emotion_baseline": voice_traits.get("emotion", "neutral"),
            "speaking_style": character.speaking_style
        }
        
        # 3. Generate test samples and validate consistency
        test_lines = [
            "Hello, my name is {character.name}.",
            character.background_story[:100] + "...",
            "I'm feeling quite excited about this!"
        ]
        
        samples = []
        for line in test_lines:
            audio = await self.tts_service.generate_audio(
                line.format(character=character), 
                voice_config
            )
            samples.append(audio)
            
        # 4. Store voice profile
        voice_profile = VoiceProfile(
            character_id=character.id,
            voice_config=voice_config,
            test_samples=samples
        )
        
        return voice_profile
```

## Timeline Summary

**Total Estimated Duration: 12-16 weeks**

- Phase 0 (LLM & Character System): 3 weeks
- Phase 1 (Enhanced Script Management): 2 weeks
- Phase 2 (Background Generation): 2 weeks  
- Phase 3 (Portrait Animation): 3 weeks
- Phase 4 (Video Assembly): 3 weeks
- Phase 5 (Frontend Integration): 3 weeks

## KoboldAI Integration Details

### KoboldAI Setup Requirements
1. **Install KoboldAI-Client**
   ```bash
   git clone https://github.com/KoboldAI/KoboldAI-Client.git
   cd KoboldAI-Client
   pip install -r requirements.txt
   ```

2. **Launch KoboldAI Server**
   ```bash
   python aiserver.py --model <model_name> --port 5000
   # Example with a 7B model:
   python aiserver.py --model pygmalion-7b --port 5000
   ```

3. **Verify API Access**
   - Server runs on: `http://127.0.0.1:5000`
   - API endpoint: `http://127.0.0.1:5000/api`
   - Interactive docs: `http://127.0.0.1:5000/api` in browser

### Recommended Models for Visual Novel Generation
- **Story Generation**: Pygmalion-7B, NovelAI models, or LLaMA-based story models
- **Dialogue Generation**: Character.AI style models, Pygmalion variants
- **Scene Description**: Novel-trained models with descriptive capabilities

### KoboldAI Configuration for Visual Novels
```python
# Optimal settings for different generation types
STORY_GENERATION_CONFIG = {
    "temperature": 0.8,
    "top_p": 0.9,
    "rep_pen": 1.1,
    "rep_pen_range": 1024,
    "max_length": 500
}

DIALOGUE_GENERATION_CONFIG = {
    "temperature": 0.9,
    "top_p": 0.85,
    "rep_pen": 1.15,
    "rep_pen_range": 512,
    "max_length": 300
}

SCENE_DESCRIPTION_CONFIG = {
    "temperature": 0.7,
    "top_p": 0.9,
    "rep_pen": 1.05,
    "rep_pen_range": 1024,
    "max_length": 400
}
```

## Next Steps

1. **Environment Setup**
   - Set up KoboldAI-Client with appropriate model
   - Set up InfiniteTalk development environment
   - Test ComfyUI integration with existing setup
   - Create development branch for video features

2. **KoboldAI Integration Testing**
   - Test basic text generation functionality
   - Validate character consistency in generated dialogue
   - Test story outline generation capabilities
   - Benchmark generation speed and quality

3. **Proof of Concept**
   - Create minimal working example with 1 character, 1 scene
   - Integrate KoboldAI → Character Generation → Voice → Video pipeline
   - Validate InfiniteTalk integration
   - Test end-to-end pipeline with short script

4. **Iterative Development**
   - Implement phases in order
   - Regular testing and user feedback
   - Performance optimization throughout

This plan provides a comprehensive roadmap for extending the Voices project into full video generation capabilities while leveraging existing infrastructure and maintaining system reliability.