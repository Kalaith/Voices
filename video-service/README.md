# Voices Video Generation Service

A comprehensive Python backend service for generating visual novel-style videos with AI-powered script generation, character consistency, and automated video assembly.

## Features

### 🤖 KoboldAI Script Generation
- **Story Project Management**: Create and manage story projects with AI-generated content
- **Character-Driven Narratives**: Generate dialogue and scenes based on character personalities
- **Multiple Generation Modes**: Story outlines, dialogue, scene descriptions, and character actions
- **Quality Tracking**: Monitor generation quality and consistency across sessions

### 👥 Character Profile Management
- **Comprehensive Character Profiles**: Personality traits, background stories, speaking styles
- **Voice-Character Mapping**: Consistent voice assignments with emotion adjustments
- **Relationship Tracking**: Character interactions and relationship dynamics
- **Expression Libraries**: Emotional expressions for each character

### 🎨 Visual Consistency Engine
- **LoRA Training Pipeline**: Train character-specific LoRA models for visual consistency
- **Character Consistency**: Ensure characters look the same across all scenes
- **Expression Generation**: Generate character portraits with specific emotions
- **Visual Validation**: Validate consistency across generated images

### 🖼️ Background Generation
- **ComfyUI Integration**: Generate scene backgrounds using existing ComfyUI setup
- **Style Presets**: Multiple art styles (anime, realistic, fantasy, cyberpunk, etc.)
- **Background Caching**: Avoid regenerating similar backgrounds
- **Batch Processing**: Generate multiple backgrounds efficiently

### 🎭 Portrait Animation
- **InfiniteTalk Integration**: Lip-sync animation for character dialogue
- **Emotion Transitions**: Smooth transitions between character emotions
- **Idle Animations**: Subtle animations for non-speaking characters
- **Multiple Quality Presets**: Fast, standard, and high-quality animation modes

### 🎬 Video Assembly Engine
- **Scene Composition**: Layer backgrounds, characters, and UI elements
- **Dialogue UI**: Visual novel-style dialogue boxes and character names
- **Audio Synchronization**: Sync character animations with generated speech
- **Multiple Export Formats**: Various resolutions and quality settings
- **Transition Effects**: Smooth transitions between scenes

## Architecture

```
video-service/
├── src/
│   ├── services/
│   │   ├── kobold_script_generation.py    # KoboldAI integration
│   │   ├── character_manager.py           # Character management
│   │   ├── character_consistency.py       # LoRA training & consistency
│   │   ├── background_generation.py       # Background generation
│   │   ├── portrait_animation.py          # Character animation
│   │   ├── video_assembly.py             # Video composition
│   │   └── database_service.py           # Database operations
│   ├── models/
│   │   └── character.py                  # Data models
│   └── utils/
│       └── kobold_client.py              # KoboldAI client
├── main.py                               # FastAPI application
├── requirements.txt                      # Python dependencies
└── README.md                            # This file
```

## Installation

### 1. Prerequisites

#### System Requirements
- Python 3.8+
- FFmpeg (for video processing)
- MySQL/MariaDB (shared with PHP backend)
- 8GB+ RAM (16GB+ recommended for LoRA training)
- GPU with 8GB+ VRAM (recommended for image generation)

#### KoboldAI Setup
```bash
# Clone and setup KoboldAI
git clone https://github.com/KoboldAI/KoboldAI-Client.git
cd KoboldAI-Client
pip install -r requirements.txt

# Launch KoboldAI server (example with 7B model)
python aiserver.py --model pygmalion-7b --port 5000
```

#### InfiniteTalk Setup (Optional)
```bash
# Clone InfiniteTalk for portrait animation
git clone https://github.com/Zz-ww/InfiniteTalk-beta.git video-service/infinitetalk
cd video-service/infinitetalk
pip install -r requirements.txt
```

### 2. Install Video Service

```bash
# Navigate to video service directory
cd video-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install in development mode
pip install -e .
```

### 3. Database Setup

```bash
# Run database migrations (from project root)
mysql -u root -p voices < backend/database/migrations/006_create_story_management_tables.sql
```

### 4. Configuration

Create a `.env` file in the video-service directory:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_NAME=voices
DATABASE_USER=root
DATABASE_PASSWORD=

# KoboldAI Configuration
KOBOLD_URL=http://127.0.0.1:5000

# Paths Configuration
ASSETS_PATH=H:/Claude/voices/assets
COMFYUI_SCRIPT=H:/Claude/voices/comfyui-generate.ps1

# Service Configuration
API_HOST=0.0.0.0
API_PORT=8001
LOG_LEVEL=INFO
```

## Usage

### Start the Service

```bash
# Start the FastAPI server
python main.py

# Or use uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

The API will be available at `http://localhost:8001`

### API Documentation

Once running, visit:
- **Interactive API Docs**: `http://localhost:8001/docs`
- **ReDoc Documentation**: `http://localhost:8001/redoc`

### Key API Endpoints

#### Story Management
- `POST /api/stories/create` - Create new story project
- `GET /api/stories/{id}` - Get story project details
- `POST /api/stories/{id}/generate-scene` - Generate scene script

#### Character Management
- `POST /api/characters/create` - Create character profile
- `GET /api/characters/{id}` - Get character details
- `POST /api/characters/{id}/generate-expression` - Generate character expression

#### Background Generation
- `POST /api/backgrounds/generate` - Generate single background
- `POST /api/backgrounds/batch-generate` - Generate multiple backgrounds
- `GET /api/backgrounds/styles` - Get available styles

#### Character Consistency
- `POST /api/characters/{id}/train-lora` - Start LoRA training
- `GET /api/characters/{id}/lora-status` - Check training status
- `POST /api/characters/{id}/ensure-consistency` - Apply consistency

### Example Workflow

1. **Check KoboldAI Status**
```bash
curl http://localhost:8001/api/kobold/status
```

2. **Create Story Project**
```bash
curl -X POST http://localhost:8001/api/stories/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fantasy Adventure",
    "premise": "A young mage discovers ancient magic",
    "genre": "fantasy",
    "character_descriptions": [
      "A curious young mage with determination",
      "A wise old wizard mentor"
    ]
  }'
```

3. **Generate Scene**
```bash
curl -X POST http://localhost:8001/api/stories/1/generate-scene \
  -H "Content-Type: application/json" \
  -d '{
    "story_project_id": 1,
    "scene_description": "The mage meets the wizard in his tower",
    "characters_in_scene": ["Young Mage", "Wizard Mentor"]
  }'
```

4. **Generate Background**
```bash
curl -X POST http://localhost:8001/api/backgrounds/generate \
  -H "Content-Type: application/json" \
  -d '{
    "scene_prompt": "ancient wizard tower interior, magical books, crystal orb",
    "style": "fantasy"
  }'
```

## Development

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests/
```

### Code Quality
```bash
# Format code
black src/

# Lint code
flake8 src/
```

### Adding New Services

1. Create service file in `src/services/`
2. Add corresponding data models in `src/models/`
3. Add API endpoints in `main.py`
4. Update database schema if needed
5. Add tests in `tests/`

## Integration with Frontend

The video service integrates with the existing React frontend through the PHP backend API. New endpoints can be added to the PHP controllers to proxy requests to this Python service.

Example PHP integration:
```php
// In VideoProjectController.php
public function generateWithAI($projectId) {
    $pythonServiceUrl = 'http://localhost:8001';
    $response = file_get_contents("$pythonServiceUrl/api/stories/$projectId/generate-scene");
    return json_decode($response, true);
}
```

## Performance Considerations

### Memory Usage
- **KoboldAI**: 8-32GB RAM depending on model size
- **LoRA Training**: 8-16GB VRAM for training
- **Video Assembly**: 4-8GB RAM for processing

### Optimization Tips
1. **Background Caching**: Reuse similar scene backgrounds
2. **Character Portrait Reuse**: Cache base portraits per character
3. **Parallel Processing**: Generate backgrounds and audio simultaneously
4. **Progressive Quality**: Support draft/preview/final quality modes

### Scaling
- **Single GPU Setup**: Sequential generation, 720p max recommended
- **Multi-GPU Setup**: Parallel background/animation generation
- **CPU-Only Fallback**: Reduced quality, longer generation times

## Troubleshooting

### Common Issues

1. **KoboldAI Connection Failed**
   - Ensure KoboldAI server is running on port 5000
   - Check firewall settings
   - Verify model is loaded correctly

2. **ComfyUI Background Generation Failed**
   - Check ComfyUI PowerShell script path
   - Ensure ComfyUI is properly installed
   - Verify GPU memory availability

3. **Database Connection Error**
   - Verify MySQL service is running
   - Check database credentials in configuration
   - Ensure database migrations are applied

4. **LoRA Training Failed**
   - Check GPU memory availability
   - Verify training images exist and are valid
   - Ensure sufficient disk space for models

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=DEBUG` in your `.env` file or:

```bash
python main.py --log-level debug
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **KoboldAI Team** for the excellent text generation framework
- **InfiniteTalk** for portrait animation capabilities
- **ComfyUI** for stable diffusion integration
- **FastAPI** for the robust API framework