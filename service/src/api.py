import os
import time
import uuid
from typing import List
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import logging

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.tts_engine_manager import tts_manager
from config.settings import SERVICE_HOST, SERVICE_PORT, CORS_ORIGIN, UPLOAD_DIR
from models.audio_models import (
    AudioGenerationRequest,
    ScriptAudioGenerationRequest, 
    AudioGenerationResponse,
    AudioGenerationStatus,
    HealthResponse,
    Voice,
    Script,
    EngineSelectionRequest,
    EngineInfoResponse
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Voice Generator Service", version="1.0.0")

# CORS middleware - Allow multiple frontend ports
allowed_origins = [
    CORS_ORIGIN,
    "http://localhost:3000",  # React default
    "http://localhost:5173",  # Vite default
    "http://localhost:5174",  # Vite alternative
    "http://localhost:8080",  # Vue/other
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173", 
    "http://127.0.0.1:5174",
    "http://127.0.0.1:8080"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for audio serving
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/audio", StaticFiles(directory=UPLOAD_DIR), name="audio")

# TTS Engine Manager is initialized automatically
# chatts_service = ChatTTSService()  # Now handled by tts_manager

# In-memory storage for generation status (in production, use database)
generations = {}

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    health_statuses = tts_manager.get_engine_health()
    current_engine = tts_manager.get_current_engine()
    
    # Check if any engine is loaded
    any_loaded = any(status.get("loaded", False) for status in health_statuses.values())
    
    # Get current engine status for legacy compatibility
    current_status = {}
    if current_engine and current_engine in health_statuses:
        current_status = health_statuses[current_engine]
    
    return HealthResponse(
        status="ok" if any_loaded else "error",
        chatts_loaded=current_status.get("loaded", False),
        device=current_status.get("device", "unknown"),
        timestamp=time.time()
    )

@app.post("/generate", response_model=AudioGenerationResponse)
async def generate_audio(request: AudioGenerationRequest, background_tasks: BackgroundTasks):
    """Generate audio from text"""
    generation_id = str(uuid.uuid4())
    
    # Initialize generation record
    generations[generation_id] = AudioGenerationResponse(
        id=generation_id,
        status=AudioGenerationStatus.PENDING
    )
    
    # Start generation in background
    background_tasks.add_task(
        _generate_audio_task,
        generation_id,
        request.text,
        request.voice,
        request.engine if hasattr(request, 'engine') else None
    )
    
    return generations[generation_id]

@app.post("/generate/script", response_model=AudioGenerationResponse)
async def generate_script_audio(request: ScriptAudioGenerationRequest, background_tasks: BackgroundTasks):
    """Generate audio for entire script"""
    generation_id = str(uuid.uuid4())
    
    # Initialize generation record
    generations[generation_id] = AudioGenerationResponse(
        id=generation_id,
        status=AudioGenerationStatus.PENDING
    )
    
    # Start generation in background
    background_tasks.add_task(
        _generate_script_audio_task,
        generation_id,
        request.script,
        request.voices,
        request.combine_audio,
        request.engine if hasattr(request, 'engine') else None
    )
    
    return generations[generation_id]

@app.get("/generate/{generation_id}", response_model=AudioGenerationResponse)
async def get_generation_status(generation_id: str):
    """Get generation status"""
    if generation_id not in generations:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    generation = generations[generation_id]
    
    # Log status for debugging
    if generation.status == AudioGenerationStatus.GENERATING:
        logger.info(f"Generation {generation_id} still in progress")
    elif generation.status == AudioGenerationStatus.ERROR:
        logger.error(f"Generation {generation_id} failed: {generation.error}")
    
    return generation

@app.get("/audio/{filename}")
async def get_audio_file(filename: str):
    """Serve audio files"""
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(
        file_path,
        media_type="audio/wav",
        filename=filename
    )

@app.get("/engines", response_model=EngineInfoResponse)
async def get_engines():
    """Get available TTS engines and their info"""
    engines_info = tts_manager.get_engine_info()
    health_info = tts_manager.get_engine_health()
    
    return EngineInfoResponse(
        available_engines=tts_manager.get_available_engines(),
        current_engine=tts_manager.get_current_engine(),
        engines_info=engines_info.get("engines", {}),
        engines_health=health_info
    )

@app.post("/engines/select")
async def select_engine(request: EngineSelectionRequest):
    """Select the active TTS engine"""
    success = tts_manager.set_current_engine(request.engine_name)
    
    if not success:
        raise HTTPException(
            status_code=400, 
            detail=f"Engine '{request.engine_name}' not available. Available: {tts_manager.get_available_engines()}"
        )
    
    return {
        "success": True,
        "current_engine": tts_manager.get_current_engine(),
        "message": f"Switched to engine: {request.engine_name}"
    }

@app.get("/engines/{engine_name}/parameters")
async def get_engine_parameters(engine_name: str):
    """Get supported parameters for a specific engine"""
    if engine_name not in tts_manager.get_available_engines():
        raise HTTPException(status_code=404, detail=f"Engine '{engine_name}' not found")
    
    return {
        "engine": engine_name,
        "supported_parameters": tts_manager.get_supported_parameters(engine_name)
    }

async def _generate_audio_task(generation_id: str, text: str, voice: Voice, engine_name: str = None):
    """Background task for audio generation"""
    try:
        logger.info(f"Starting audio generation task {generation_id} with engine {engine_name}")
        logger.info(f"Text: '{text[:100]}{'...' if len(text) > 100 else ''}'")
        logger.info(f"Voice: {voice.name if hasattr(voice, 'name') else 'Unknown'}")
        generations[generation_id].status = AudioGenerationStatus.GENERATING
        
        # Ensure voice parameters are properly typed
        if isinstance(voice.parameters, dict):
            from models.audio_models import VoiceParameters
            voice.parameters = VoiceParameters(**voice.parameters)
        
        logger.info(f"Calling TTS manager for generation {generation_id}")
        filename, error = tts_manager.generate_audio(text, voice, engine_name)
        
        if error:
            logger.error(f"Generation {generation_id} failed: {error}")
            generations[generation_id].status = AudioGenerationStatus.ERROR
            generations[generation_id].error = error
        else:
            logger.info(f"Generation {generation_id} completed successfully: {filename}")
            generations[generation_id].status = AudioGenerationStatus.COMPLETED
            generations[generation_id].audio_url = f"/audio/{filename}"
            
    except Exception as e:
        import traceback
        logger.error(f"Error in generation task {generation_id}: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        generations[generation_id].status = AudioGenerationStatus.ERROR
        generations[generation_id].error = str(e)

async def _generate_script_audio_task(
    generation_id: str, 
    script: Script, 
    voices: List[Voice], 
    combine_audio: bool,
    engine_name: str = None
):
    """Background task for script audio generation"""
    try:
        generations[generation_id].status = AudioGenerationStatus.GENERATING
        
        # Create voice lookup
        voice_map = {voice.id: voice for voice in voices}
        speaker_voice_map = {}
        
        # Map speakers to voices
        for speaker in script.speakers:
            if speaker.voice_id in voice_map:
                speaker_voice_map[speaker.id] = voice_map[speaker.voice_id]
        
        # Prepare script lines with voices
        script_lines = []
        for line in script.lines:
            if line.speaker_id in speaker_voice_map and line.text.strip():
                script_lines.append((line.text, speaker_voice_map[line.speaker_id]))
        
        if not script_lines:
            generations[generation_id].status = AudioGenerationStatus.ERROR
            generations[generation_id].error = "No valid script lines with voices found"
            return
        
        # Generate audio
        audio_files, error = tts_manager.generate_script_audio(
            script_lines, 
            combine=combine_audio,
            engine_name=engine_name
        )
        
        if error:
            generations[generation_id].status = AudioGenerationStatus.ERROR
            generations[generation_id].error = error
        else:
            generations[generation_id].status = AudioGenerationStatus.COMPLETED
            # Return first file (combined or first segment)
            if audio_files:
                generations[generation_id].audio_url = f"/audio/{audio_files[0]}"
            
    except Exception as e:
        logger.error(f"Error in script generation task: {e}")
        generations[generation_id].status = AudioGenerationStatus.ERROR
        generations[generation_id].error = str(e)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "service.src.api:app",
        host=SERVICE_HOST,
        port=SERVICE_PORT,
        reload=True
    )