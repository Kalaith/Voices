"""
Portrait Animation Service with InfiniteTalk Integration.
Handles character portrait animation with lip-sync for dialogue.
"""

import asyncio
import subprocess
import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime

from ..models.character import Character, EmotionType, CharacterPosition
from .database_service import DatabaseService


class PortraitAnimationService:
    """Service for generating character portrait animations with lip-sync."""
    
    def __init__(
        self,
        infinitetalk_path: str = "H:/Claude/voices/video-service/infinitetalk",
        animations_path: str = "H:/Claude/voices/assets/animations",
        db_service: Optional[DatabaseService] = None
    ):
        """Initialize portrait animation service."""
        self.infinitetalk_path = Path(infinitetalk_path)
        self.animations_path = Path(animations_path)
        self.db_service = db_service or DatabaseService()
        
        # Ensure animations directory exists
        self.animations_path.mkdir(parents=True, exist_ok=True)
        
        # Animation configurations
        self.animation_presets = {
            "standard": {
                "fps": 24,
                "duration_padding": 0.5,  # Extra seconds before/after speech
                "idle_animation": True,
                "blink_frequency": 3.0  # Blinks per second
            },
            "high_quality": {
                "fps": 30,
                "duration_padding": 0.8,
                "idle_animation": True,
                "blink_frequency": 2.5,
                "enhanced_expressions": True
            },
            "fast": {
                "fps": 20,
                "duration_padding": 0.2,
                "idle_animation": False,
                "blink_frequency": 4.0
            }
        }
    
    async def animate_character_speech(
        self,
        character: Character,
        audio_path: str,
        portrait_image: str,
        emotion: EmotionType = EmotionType.NEUTRAL,
        animation_preset: str = "standard"
    ) -> str:
        """Generate character portrait animation with lip-sync for speech."""
        
        if not Path(audio_path).exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        if not Path(portrait_image).exists():
            raise FileNotFoundError(f"Portrait image not found: {portrait_image}")
        
        # Get animation configuration
        config = self.animation_presets.get(animation_preset, self.animation_presets["standard"])
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        animation_filename = f"anim_{character.id}_{emotion.value}_{timestamp}.mp4"
        animation_path = self.animations_path / animation_filename
        
        # Check if InfiniteTalk is available
        if not self._check_infinitetalk_availability():
            # Fallback to static animation
            return await self._create_static_animation(
                portrait_image, audio_path, str(animation_path), config
            )
        
        # Generate animation with InfiniteTalk
        success = await self._generate_infinitetalk_animation(
            character=character,
            portrait_image=portrait_image,
            audio_path=audio_path,
            output_path=str(animation_path),
            emotion=emotion,
            config=config
        )
        
        if success and animation_path.exists():
            return str(animation_path)
        
        # Fallback to static if InfiniteTalk fails
        return await self._create_static_animation(
            portrait_image, audio_path, str(animation_path), config
        )
    
    async def generate_idle_animation(
        self,
        character: Character,
        portrait_image: str,
        duration: float = 5.0,
        emotion: EmotionType = EmotionType.NEUTRAL
    ) -> str:
        """Generate idle animation for non-speaking character."""
        
        if not Path(portrait_image).exists():
            raise FileNotFoundError(f"Portrait image not found: {portrait_image}")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        idle_filename = f"idle_{character.id}_{emotion.value}_{timestamp}.mp4"
        idle_path = self.animations_path / idle_filename
        
        # Create simple idle animation with breathing and blinking
        success = await self._create_idle_animation(
            portrait_image=portrait_image,
            output_path=str(idle_path),
            duration=duration,
            emotion=emotion
        )
        
        if success and idle_path.exists():
            return str(idle_path)
        
        raise Exception("Failed to generate idle animation")
    
    async def batch_animate_dialogue(
        self,
        character_dialogue_pairs: List[Tuple[Character, str, str]],  # (character, audio_path, portrait)
        animation_preset: str = "standard"
    ) -> Dict[str, str]:
        """Generate animations for multiple character dialogue pairs."""
        
        results = {}
        
        # Process animations with limited concurrency to avoid resource exhaustion
        semaphore = asyncio.Semaphore(2)
        
        async def animate_single(character: Character, audio_path: str, portrait: str) -> Tuple[str, str]:
            async with semaphore:
                try:
                    animation_path = await self.animate_character_speech(
                        character=character,
                        audio_path=audio_path,
                        portrait_image=portrait,
                        animation_preset=animation_preset
                    )
                    return audio_path, animation_path
                except Exception as e:
                    print(f"Failed to animate {character.name}: {e}")
                    return audio_path, ""
        
        # Execute all animations
        tasks = [
            animate_single(char, audio, portrait) 
            for char, audio, portrait in character_dialogue_pairs
        ]
        
        animation_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        for result in animation_results:
            if isinstance(result, tuple) and len(result) == 2:
                audio_path, animation_path = result
                results[audio_path] = animation_path
            elif isinstance(result, Exception):
                print(f"Animation error: {result}")
        
        return results
    
    async def create_expression_animation(
        self,
        character: Character,
        base_portrait: str,
        start_emotion: EmotionType,
        end_emotion: EmotionType,
        transition_duration: float = 1.0
    ) -> str:
        """Create animation transitioning between emotions."""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        transition_filename = f"transition_{character.id}_{start_emotion.value}_{end_emotion.value}_{timestamp}.mp4"
        transition_path = self.animations_path / transition_filename
        
        # Create emotion transition animation
        success = await self._create_emotion_transition(
            base_portrait=base_portrait,
            start_emotion=start_emotion,
            end_emotion=end_emotion,
            output_path=str(transition_path),
            duration=transition_duration
        )
        
        if success and transition_path.exists():
            return str(transition_path)
        
        raise Exception("Failed to create emotion transition animation")
    
    async def optimize_animation_for_video(
        self,
        animation_path: str,
        target_resolution: Tuple[int, int] = (1920, 1080),
        target_fps: int = 24
    ) -> str:
        """Optimize animation for final video composition."""
        
        input_path = Path(animation_path)
        if not input_path.exists():
            raise FileNotFoundError(f"Animation not found: {animation_path}")
        
        optimized_filename = f"opt_{input_path.stem}.mp4"
        optimized_path = input_path.parent / optimized_filename
        
        # Use ffmpeg to optimize animation
        ffmpeg_command = [
            "ffmpeg", "-y",  # Overwrite output
            "-i", str(input_path),
            "-vf", f"scale={target_resolution[0]}:{target_resolution[1]}:force_original_aspect_ratio=decrease,pad={target_resolution[0]}:{target_resolution[1]}:(ow-iw)/2:(oh-ih)/2",
            "-r", str(target_fps),
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "23",
            str(optimized_path)
        ]
        
        try:
            process = await asyncio.create_subprocess_exec(
                *ffmpeg_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0 and optimized_path.exists():
                return str(optimized_path)
            else:
                print(f"Animation optimization failed: {stderr.decode() if stderr else 'Unknown error'}")
                return animation_path  # Return original if optimization fails
                
        except Exception as e:
            print(f"Animation optimization error: {e}")
            return animation_path
    
    def _check_infinitetalk_availability(self) -> bool:
        """Check if InfiniteTalk is available."""
        # Check if InfiniteTalk directory exists and has required files
        infinitetalk_main = self.infinitetalk_path / "main.py"
        return infinitetalk_main.exists()
    
    async def _generate_infinitetalk_animation(
        self,
        character: Character,
        portrait_image: str,
        audio_path: str,
        output_path: str,
        emotion: EmotionType,
        config: Dict[str, Any]
    ) -> bool:
        """Generate animation using InfiniteTalk."""
        
        # Prepare InfiniteTalk command
        infinitetalk_command = [
            "python", str(self.infinitetalk_path / "main.py"),
            "--input_image", portrait_image,
            "--input_audio", audio_path,
            "--output", output_path,
            "--fps", str(config["fps"]),
            "--emotion", emotion.value
        ]
        
        try:
            # Execute InfiniteTalk
            process = await asyncio.create_subprocess_exec(
                *infinitetalk_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.infinitetalk_path
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                return True
            else:
                error_message = stderr.decode() if stderr else "Unknown error"
                print(f"InfiniteTalk animation failed: {error_message}")
                return False
                
        except Exception as e:
            print(f"Error executing InfiniteTalk: {e}")
            return False
    
    async def _create_static_animation(
        self,
        portrait_image: str,
        audio_path: str,
        output_path: str,
        config: Dict[str, Any]
    ) -> str:
        """Create static animation as fallback when InfiniteTalk is unavailable."""
        
        # Get audio duration
        audio_duration = await self._get_audio_duration(audio_path)
        total_duration = audio_duration + (config["duration_padding"] * 2)
        
        # Create simple video with portrait and audio
        ffmpeg_command = [
            "ffmpeg", "-y",
            "-loop", "1", "-i", portrait_image,
            "-i", audio_path,
            "-t", str(total_duration),
            "-c:v", "libx264",
            "-r", str(config["fps"]),
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            output_path
        ]
        
        try:
            process = await asyncio.create_subprocess_exec(
                *ffmpeg_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            await process.communicate()
            
            if process.returncode == 0:
                return output_path
            else:
                raise Exception("Failed to create static animation")
                
        except Exception as e:
            print(f"Static animation creation failed: {e}")
            raise
    
    async def _create_idle_animation(
        self,
        portrait_image: str,
        output_path: str,
        duration: float,
        emotion: EmotionType
    ) -> bool:
        """Create idle animation with subtle movement."""
        
        # Create simple idle animation with slight scaling for "breathing" effect
        ffmpeg_command = [
            "ffmpeg", "-y",
            "-loop", "1", "-i", portrait_image,
            "-t", str(duration),
            "-vf", "scale=1920:1080,zoompan=z='min(zoom+0.0015,1.5)':x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):d=1:s=1920x1080",
            "-r", "24",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            output_path
        ]
        
        try:
            process = await asyncio.create_subprocess_exec(
                *ffmpeg_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            return process.returncode == 0
            
        except Exception as e:
            print(f"Idle animation creation failed: {e}")
            return False
    
    async def _create_emotion_transition(
        self,
        base_portrait: str,
        start_emotion: EmotionType,
        end_emotion: EmotionType,
        output_path: str,
        duration: float
    ) -> bool:
        """Create emotion transition animation."""
        
        # For now, create a simple crossfade between two emotional states
        # In production, you might generate different emotional expressions
        
        ffmpeg_command = [
            "ffmpeg", "-y",
            "-loop", "1", "-i", base_portrait,  # Same image for both states for now
            "-loop", "1", "-i", base_portrait,
            "-filter_complex", f"[0:v][1:v]blend=all_expr='A*(1-T/{duration})+B*T/{duration}':shortest=1",
            "-t", str(duration),
            "-r", "24",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            output_path
        ]
        
        try:
            process = await asyncio.create_subprocess_exec(
                *ffmpeg_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            return process.returncode == 0
            
        except Exception as e:
            print(f"Emotion transition creation failed: {e}")
            return False
    
    async def _get_audio_duration(self, audio_path: str) -> float:
        """Get duration of audio file in seconds."""
        
        ffprobe_command = [
            "ffprobe", "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "csv=p=0",
            audio_path
        ]
        
        try:
            process = await asyncio.create_subprocess_exec(
                *ffprobe_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                duration_str = stdout.decode().strip()
                return float(duration_str)
            else:
                return 5.0  # Default duration if probe fails
                
        except Exception as e:
            print(f"Audio duration probe failed: {e}")
            return 5.0
    
    def get_animation_presets(self) -> Dict[str, Dict[str, Any]]:
        """Get available animation presets."""
        return self.animation_presets.copy()
    
    async def cleanup_old_animations(self, days_old: int = 3) -> int:
        """Clean up old animation files."""
        cutoff_time = datetime.now().timestamp() - (days_old * 24 * 3600)
        cleaned_count = 0
        
        for animation_file in self.animations_path.glob("*.mp4"):
            if animation_file.stat().st_mtime < cutoff_time:
                try:
                    animation_file.unlink()
                    cleaned_count += 1
                except Exception as e:
                    print(f"Failed to delete {animation_file}: {e}")
        
        return cleaned_count