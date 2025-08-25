"""
Video Generation Service API
FastAPI application providing endpoints for video generation services.
"""

import asyncio
import uvicorn
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import os
from pathlib import Path

# Import our services
from src.services.kobold_script_generation import KoboldAIScriptGenerationService
from src.services.character_manager import CharacterManager
from src.services.background_generation import BackgroundGenerationService
from src.services.character_consistency import CharacterConsistencyEngine
from src.services.database_service import DatabaseService
from src.models.character import Character, StoryProject, EmotionType


# Initialize FastAPI app
app = FastAPI(
    title="Voices Video Generation API",
    description="Backend API for visual novel video generation with KoboldAI integration",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests/responses
class CreateStoryProjectRequest(BaseModel):
    title: str
    premise: str
    genre: str = "fantasy"
    tone: str = "dramatic"
    character_descriptions: Optional[List[str]] = None
    target_length: int = 1000

class CreateCharacterRequest(BaseModel):
    description: str
    genre: str = "fantasy"
    voice_id: Optional[int] = None

class GenerateSceneRequest(BaseModel):
    story_project_id: int
    scene_description: str
    characters_in_scene: List[str]

class GenerateBackgroundRequest(BaseModel):
    scene_prompt: str
    style: str = "anime"
    width: int = 1920
    height: int = 1080

class TrainLoRARequest(BaseModel):
    character_id: int
    reference_images: List[str]
    training_config: Optional[Dict[str, Any]] = None

class GenerateCharacterExpressionRequest(BaseModel):
    character_id: int
    emotion: str
    scene_context: Optional[str] = None


# Initialize services (will be done on startup)
kobold_service = None
character_manager = None
background_service = None
consistency_engine = None
db_service = None


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    global kobold_service, character_manager, background_service, consistency_engine, db_service
    
    # Initialize database service
    db_service = DatabaseService()
    
    # Initialize other services
    kobold_service = KoboldAIScriptGenerationService(db_service=db_service)
    character_manager = CharacterManager(db_service=db_service)
    background_service = BackgroundGenerationService(db_service=db_service)
    consistency_engine = CharacterConsistencyEngine(db_service=db_service)
    
    print("Video generation services initialized successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    if db_service:
        await db_service.disconnect()


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "video-generation-api"}


# KoboldAI Status endpoint
@app.get("/api/kobold/status")
async def check_kobold_status():
    """Check KoboldAI server status."""
    try:
        async with kobold_service:
            is_available = await kobold_service.check_availability()
            return {"available": is_available, "url": kobold_service.kobold_url}
    except Exception as e:
        return {"available": False, "error": str(e)}


# Story Project Management
@app.post("/api/stories/create")
async def create_story_project(request: CreateStoryProjectRequest):
    """Create a new story project with KoboldAI-generated content."""
    try:
        async with kobold_service:
            story_project = await kobold_service.create_story_project(
                title=request.title,
                premise=request.premise,
                genre=request.genre,
                tone=request.tone,
                character_descriptions=request.character_descriptions,
                target_length=request.target_length
            )
            
            return {
                "id": story_project.id,
                "title": story_project.title,
                "genre": story_project.genre,
                "status": story_project.status,
                "character_count": len(story_project.characters),
                "story_outline": story_project.story_outline[:500] + "..." if len(story_project.story_outline) > 500 else story_project.story_outline
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stories/{project_id}")
async def get_story_project(project_id: int):
    """Get story project details."""
    try:
        story_project = await db_service.get_story_project(project_id)
        if not story_project:
            raise HTTPException(status_code=404, detail="Story project not found")
        
        return {
            "id": story_project.id,
            "title": story_project.title,
            "genre": story_project.genre,
            "theme": story_project.theme,
            "tone": story_project.tone,
            "status": story_project.status,
            "story_outline": story_project.story_outline,
            "characters": [
                {
                    "id": char.id,
                    "name": char.name,
                    "description": char.description,
                    "personality_traits": char.personality_traits
                } for char in story_project.characters
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/stories/{project_id}/generate-scene")
async def generate_scene_script(project_id: int, request: GenerateSceneRequest):
    """Generate script for a specific scene."""
    try:
        story_project = await db_service.get_story_project(project_id)
        if not story_project:
            raise HTTPException(status_code=404, detail="Story project not found")
        
        async with kobold_service:
            script_lines, scene, sessions = await kobold_service.generate_scene_script(
                story_project=story_project,
                scene_description=request.scene_description,
                characters_in_scene=request.characters_in_scene
            )
            
            return {
                "scene": {
                    "id": scene.id,
                    "description": scene.description,
                    "background_prompt": scene.background_prompt,
                    "characters_present": scene.characters_present
                },
                "script_lines": [
                    {
                        "line_order": line.line_order,
                        "content": line.content,
                        "character_name": line.character_name,
                        "character_emotion": line.character_emotion.value if line.character_emotion else "neutral",
                        "estimated_duration": line.estimated_duration
                    } for line in script_lines
                ],
                "generation_sessions": len(sessions)
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Character Management
@app.post("/api/characters/create")
async def create_character(request: CreateCharacterRequest):
    """Create a character profile from description."""
    try:
        character = await character_manager.create_character_from_description(
            description=request.description,
            genre=request.genre,
            voice_id=request.voice_id
        )
        
        return {
            "id": character.id,
            "name": character.name,
            "description": character.description,
            "personality_traits": character.personality_traits,
            "visual_description": character.visual_description,
            "voice_profile_id": character.voice_profile_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/characters/{character_id}")
async def get_character(character_id: int):
    """Get character profile."""
    try:
        character = await db_service.get_character(character_id)
        if not character:
            raise HTTPException(status_code=404, detail="Character not found")
        
        return {
            "id": character.id,
            "name": character.name,
            "description": character.description,
            "personality_traits": character.personality_traits,
            "background_story": character.background_story,
            "speaking_style": character.speaking_style,
            "visual_description": character.visual_description,
            "voice_profile_id": character.voice_profile_id,
            "emotion_mapping": character.emotion_mapping,
            "relationships": character.relationships
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/characters/{character_id}/statistics")
async def get_character_statistics(character_id: int):
    """Get character usage statistics."""
    try:
        stats = await character_manager.get_character_statistics(character_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/characters/{character_id}/generate-expression")
async def generate_character_expression(character_id: int, request: GenerateCharacterExpressionRequest):
    """Generate character expression prompt."""
    try:
        character = await db_service.get_character(character_id)
        if not character:
            raise HTTPException(status_code=404, detail="Character not found")
        
        try:
            emotion = EmotionType(request.emotion)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid emotion: {request.emotion}")
        
        expression_prompt = await consistency_engine.generate_character_expression(
            character=character,
            emotion=emotion,
            scene_context=request.scene_context
        )
        
        return {
            "character_id": character_id,
            "emotion": request.emotion,
            "expression_prompt": expression_prompt
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Background Generation
@app.post("/api/backgrounds/generate")
async def generate_background(request: GenerateBackgroundRequest):
    """Generate scene background."""
    try:
        background_path = await background_service.generate_scene_background(
            scene_prompt=request.scene_prompt,
            style=request.style,
            width=request.width,
            height=request.height
        )
        
        return {
            "scene_prompt": request.scene_prompt,
            "style": request.style,
            "background_path": background_path,
            "width": request.width,
            "height": request.height
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/backgrounds/batch-generate")
async def batch_generate_backgrounds(
    scene_prompts: List[str],
    style: str = "anime",
    width: int = 1920,
    height: int = 1080
):
    """Generate multiple backgrounds in batch."""
    try:
        background_paths = await background_service.batch_generate_backgrounds(
            scene_prompts=scene_prompts,
            style=style,
            width=width,
            height=height
        )
        
        return {
            "generated_backgrounds": background_paths,
            "total_generated": len([p for p in background_paths.values() if p]),
            "failed_count": len([p for p in background_paths.values() if not p])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/backgrounds/styles")
async def get_background_styles():
    """Get available background styles."""
    return {
        "styles": list(background_service.get_style_presets().keys()),
        "style_details": background_service.get_style_presets()
    }


# Character Consistency
@app.post("/api/characters/{character_id}/train-lora")
async def train_character_lora(character_id: int, request: TrainLoRARequest, background_tasks: BackgroundTasks):
    """Start LoRA training for character consistency."""
    try:
        character = await db_service.get_character(character_id)
        if not character:
            raise HTTPException(status_code=404, detail="Character not found")
        
        # Start training in background
        background_tasks.add_task(
            _train_lora_background,
            character,
            request.reference_images,
            request.training_config
        )
        
        return {
            "character_id": character_id,
            "status": "training_started",
            "message": "LoRA training started in background"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/characters/{character_id}/lora-status")
async def get_lora_training_status(character_id: int):
    """Get LoRA training status for character."""
    try:
        lora_model = await consistency_engine._get_existing_lora_model(character_id)
        
        if not lora_model:
            return {
                "character_id": character_id,
                "has_lora_model": False,
                "training_status": "not_started"
            }
        
        return {
            "character_id": character_id,
            "has_lora_model": True,
            "model_name": lora_model.model_name,
            "training_status": lora_model.training_status,
            "validation_score": lora_model.validation_score,
            "model_ready": lora_model.is_ready
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/characters/{character_id}/ensure-consistency")
async def ensure_character_consistency(character_id: int, scene_prompts: List[str]):
    """Ensure character consistency across scene prompts."""
    try:
        character = await db_service.get_character(character_id)
        if not character:
            raise HTTPException(status_code=404, detail="Character not found")
        
        consistent_prompts, lora_model = await consistency_engine.ensure_character_consistency(
            character=character,
            scene_prompts=scene_prompts
        )
        
        return {
            "character_id": character_id,
            "consistent_prompts": consistent_prompts,
            "lora_model": {
                "name": lora_model.model_name if lora_model else None,
                "ready": lora_model.is_ready if lora_model else False
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Utility functions
async def _train_lora_background(character: Character, reference_images: List[str], training_config: Optional[Dict[str, Any]]):
    """Background task for LoRA training."""
    try:
        await consistency_engine.train_character_lora(
            character=character,
            reference_images=reference_images,
            training_config=training_config
        )
    except Exception as e:
        print(f"Background LoRA training failed: {e}")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )