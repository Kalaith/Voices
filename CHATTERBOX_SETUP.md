# Chatterbox TTS Setup Guide

This guide explains how to set up the Chatterbox TTS engine alongside the existing ChatTTS engine.

## Overview

The system now supports multiple TTS engines:
- **ChatTTS**: Conversational text-to-speech with natural voices
- **Chatterbox**: Zero-shot TTS with emotion control and voice conversion

## Prerequisites

- Python 3.8 or higher
- CUDA-compatible GPU (recommended for best performance)
- Existing ChatTTS installation (if you want to use both engines)

## Installation Steps

### 1. Install Chatterbox TTS

```bash
# Navigate to your service directory
cd service/

# Install Chatterbox TTS
pip install chatterbox-tts

# Or install from requirements
pip install -r requirements.txt
```

### 2. Update Service Configuration

The service will automatically detect and initialize both engines. No additional configuration is needed.

### 3. Verify Installation

Start the service:

```bash
cd service/
python main.py
```

Check the engine status:

```bash
curl http://localhost:9966/engines
```

Expected response:
```json
{
  "available_engines": ["chatts", "chatterbox"],
  "current_engine": "chatts",
  "engines_info": {
    "chatts": {
      "name": "chatts",
      "loaded": true,
      "supported_parameters": ["speed", "pitch", "temperature", "top_p", "top_k", "seed"]
    },
    "chatterbox": {
      "name": "chatterbox", 
      "loaded": true,
      "supported_parameters": ["speed", "temperature", "exaggeration", "cfg_weight"]
    }
  },
  "engines_health": {
    "chatts": {
      "engine": "chatts",
      "loaded": true,
      "available": true,
      "device": "cuda"
    },
    "chatterbox": {
      "engine": "chatterbox",
      "loaded": true,
      "available": true,
      "device": "cuda"
    }
  }
}
```

## Usage

### Frontend Engine Selection

1. Open the web interface
2. In the header, you'll see a "TTS Engine" selector
3. Choose between "ChatTTS" and "Chatterbox"
4. The selection applies to all new audio generations

### Voice Parameters

When creating voices, you now have access to engine-specific parameters:

**ChatTTS Parameters:**
- Speed (0.5-2.0)
- Pitch (0.5-2.0)
- Temperature (0.1-1.0)
- Top P (0.1-1.0)
- Top K (1-50)
- Seed (for consistency)

**Chatterbox Parameters:**
- Speed (0.5-2.0)
- Temperature (0.1-1.0)
- Exaggeration (0.0-1.0) - Controls emotion intensity
- CFG Weight (0.0-1.0) - Controls generation fidelity

### API Usage

Generate audio with specific engine:

```bash
curl -X POST http://localhost:9966/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "voice": {
      "id": "test-voice",
      "name": "Test Voice",
      "parameters": {
        "speed": 1.0,
        "temperature": 0.3,
        "exaggeration": 0.5,
        "cfg_weight": 0.5
      }
    },
    "engine": "chatterbox"
  }'
```

Switch default engine:

```bash
curl -X POST http://localhost:9966/engines/select \
  -H "Content-Type: application/json" \
  -d '{"engine_name": "chatterbox"}'
```

## Troubleshooting

### Chatterbox Not Loading

If Chatterbox fails to initialize:

1. Check if it's installed:
   ```bash
   python -c "import chatterbox.tts; print('Chatterbox installed successfully')"
   ```

2. Check CUDA availability:
   ```bash
   python -c "import torch; print('CUDA available:', torch.cuda.is_available())"
   ```

3. Check service logs for detailed error messages

### Performance Optimization

- **GPU Memory**: Chatterbox requires significant GPU memory. If you encounter OOM errors, try:
  - Running only one engine at a time
  - Reducing batch sizes
  - Using CPU mode (slower but less memory)

- **Loading Time**: First initialization may take several minutes as models are downloaded

### Engine Fallback

If one engine fails to load, the system will continue with available engines. Check the `/engines` endpoint to see which engines are ready.

## Advanced Configuration

### Custom Model Paths

You can specify custom model paths by modifying the engine initialization in:
- `service/src/chatterbox_engine.py`
- `service/src/chatts_engine.py`

### Resource Management

To optimize resource usage:

1. **Memory Management**: Engines are loaded on-demand and cached
2. **Cleanup**: Call `/engines/{engine_name}/cleanup` to free resources
3. **Health Monitoring**: Use `/engines` endpoint for monitoring

## Development

### Adding New Engines

To add support for additional TTS engines:

1. Create a new engine class inheriting from `TTSEngine`
2. Implement all required methods
3. Add to `TTSEngineManager` initialization
4. Update frontend engine selector

### Testing

Run the test suite:

```bash
cd service/
python -m pytest tests/
```

## Support

For issues specific to:
- **Chatterbox TTS**: https://github.com/resemble-ai/chatterbox
- **ChatTTS**: Your existing ChatTTS support channels
- **Integration Issues**: Check service logs and API responses