# Voice Generator Service

This is the audio generation service that uses ChatTTS to convert text to speech.

## Architecture

```
Frontend (React) → PHP Backend → Voice Service (Python/ChatTTS)
     :5173            :8000             :9966
```

## Setup

### Option 1: Automated Setup
```bash
cd service
python setup.py
```

### Option 2: Manual Installation (Windows)
```batch
# Run the batch file
install.bat
```

### Option 3: Manual Installation (Step by Step)
```bash
# Core dependencies
pip install fastapi uvicorn python-multipart pydantic requests python-dotenv numpy

# Audio processing (may need system dependencies)
pip install librosa soundfile

# PyTorch (CPU version - modify for GPU)
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# ChatTTS
pip install ChatTTS
# OR from GitHub if PyPI fails:
# pip install git+https://github.com/2noise/ChatTTS.git

# Create directories
mkdir uploads
```

### Option 4: Minimal Installation (if full requirements fail)
```bash
pip install -r requirements-minimal.txt
pip install ChatTTS
```

## Start the Service
```bash
python main.py
```

## API Endpoints

- `GET /health` - Service health check
- `POST /generate` - Generate audio from text
- `POST /generate/script` - Generate audio for entire script
- `GET /generate/{id}` - Get generation status
- `GET /audio/{filename}` - Serve audio files

## Configuration

Edit `.env` file:
```
SERVICE_PORT=9966
SERVICE_HOST=0.0.0.0
CORS_ORIGIN=http://localhost:8000
UPLOAD_DIR=uploads
MAX_AUDIO_LENGTH=30
DEVICE=auto  # auto, cpu, cuda, mps
```

## Features

- ✅ Text-to-speech using ChatTTS
- ✅ Voice parameter control (speed, pitch, temperature)
- ✅ Script-based audio generation
- ✅ Background processing
- ✅ Audio file serving
- ✅ Health monitoring

## Dependencies

- **FastAPI**: Web framework
- **ChatTTS**: Voice synthesis
- **PyTorch**: ML framework
- **soundfile**: Audio processing

## Troubleshooting

**Service won't start:**
- Check if port 9966 is available
- Verify Python version (3.8+)
- Install missing dependencies

**ChatTTS not loading:**
- Ensure GPU drivers are installed (if using CUDA)
- Try setting `DEVICE=cpu` in `.env`
- Check available memory

**Audio generation fails:**
- Verify input text is not empty
- Check voice parameters are valid
- Monitor service logs