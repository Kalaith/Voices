"""
Video Assembly Engine for compositing visual novel scenes.
Handles scene composition, transitions, UI overlays, and final video export.
"""

import asyncio
import subprocess
import json
import os
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Union
from datetime import datetime
from dataclasses import dataclass

from ..models.character import DialogueLine, Scene, Character, CharacterPosition, EmotionType
from .database_service import DatabaseService


@dataclass
class VideoClip:
    """Represents a video clip with metadata."""
    path: str
    duration: float
    width: int
    height: int
    start_time: float = 0.0
    audio_path: Optional[str] = None
    

@dataclass
class CompositionLayer:
    """Represents a layer in video composition."""
    type: str  # 'background', 'character', 'ui', 'text'
    content_path: str
    position: Tuple[int, int] = (0, 0)
    scale: float = 1.0
    opacity: float = 1.0
    z_index: int = 0
    start_time: float = 0.0
    duration: Optional[float] = None


class VideoAssemblyEngine:
    """Engine for assembling final visual novel videos."""
    
    def __init__(
        self,
        output_path: str = "H:/Claude/voices/assets/videos",
        temp_path: str = "H:/Claude/voices/video-service/temp",
        db_service: Optional[DatabaseService] = None
    ):
        """Initialize video assembly engine."""
        self.output_path = Path(output_path)
        self.temp_path = Path(temp_path)
        self.db_service = db_service or DatabaseService()
        
        # Ensure directories exist
        for path in [self.output_path, self.temp_path]:
            path.mkdir(parents=True, exist_ok=True)
        
        # Video composition settings
        self.video_settings = {
            "720p": {"width": 1280, "height": 720, "bitrate": "2500k"},
            "1080p": {"width": 1920, "height": 1080, "bitrate": "5000k"},
            "1440p": {"width": 2560, "height": 1440, "bitrate": "8000k"},
            "2160p": {"width": 3840, "height": 2160, "bitrate": "15000k"}
        }
        
        # UI styling for visual novel elements
        self.ui_styles = {
            "dialogue_box": {
                "width": 1600,
                "height": 300,
                "position": (160, 680),  # Bottom center for 1080p
                "background_color": "rgba(0,0,0,0.8)",
                "border_radius": 20,
                "padding": 40
            },
            "character_name": {
                "font_size": 32,
                "font_color": "white",
                "font_weight": "bold",
                "position": (200, 700)
            },
            "dialogue_text": {
                "font_size": 28,
                "font_color": "white",
                "line_height": 40,
                "position": (200, 750),
                "max_width": 1520
            }
        }
    
    async def compose_scene(
        self,
        scene: Scene,
        background_path: str,
        character_animations: Dict[str, str],
        audio_clips: Dict[str, str],
        script_lines: List[DialogueLine],
        resolution: str = "1080p"
    ) -> VideoClip:
        """Compose a complete scene with all elements."""
        
        # Get video settings
        video_config = self.video_settings.get(resolution, self.video_settings["1080p"])
        
        # Calculate scene duration
        scene_duration = sum(line.estimated_duration for line in script_lines)
        
        # Create composition layers
        layers = []
        
        # Background layer
        background_layer = CompositionLayer(
            type="background",
            content_path=background_path,
            z_index=0,
            duration=scene_duration
        )
        layers.append(background_layer)
        
        # Character layers
        for char_name, animation_path in character_animations.items():
            if animation_path and Path(animation_path).exists():
                # Determine character position
                position = self._get_character_screen_position(char_name, scene)
                
                char_layer = CompositionLayer(
                    type="character",
                    content_path=animation_path,
                    position=position,
                    z_index=1,
                    duration=scene_duration
                )
                layers.append(char_layer)
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        scene_filename = f"scene_{scene.id}_{timestamp}.mp4"
        scene_output_path = self.temp_path / scene_filename
        
        # Compose scene video
        success = await self._compose_layers(
            layers=layers,
            output_path=str(scene_output_path),
            duration=scene_duration,
            video_config=video_config
        )
        
        if success and scene_output_path.exists():
            # Add dialogue UI overlay
            final_scene_path = await self._add_dialogue_overlay(
                video_path=str(scene_output_path),
                script_lines=script_lines,
                video_config=video_config
            )
            
            # Add audio track
            if audio_clips:
                final_scene_path = await self._add_scene_audio(
                    video_path=final_scene_path,
                    audio_clips=audio_clips,
                    script_lines=script_lines
                )
            
            return VideoClip(
                path=final_scene_path,
                duration=scene_duration,
                width=video_config["width"],
                height=video_config["height"]
            )
        
        raise Exception(f"Failed to compose scene: {scene.id}")
    
    async def create_video_from_scenes(
        self,
        scenes: List[VideoClip],
        output_filename: str,
        resolution: str = "1080p",
        include_transitions: bool = True
    ) -> str:
        """Create final video from composed scenes."""
        
        if not scenes:
            raise ValueError("No scenes provided for video creation")
        
        # Generate final output path
        final_output_path = self.output_path / output_filename
        
        # Create temporary file list for ffmpeg concat
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            scene_list_path = f.name
            for scene in scenes:
                f.write(f"file '{scene.path}'\n")
        
        try:
            if include_transitions:
                # Create video with transitions between scenes
                final_path = await self._create_video_with_transitions(
                    scenes=scenes,
                    output_path=str(final_output_path),
                    resolution=resolution
                )
            else:
                # Simple concatenation
                final_path = await self._concatenate_scenes(
                    scene_list_path=scene_list_path,
                    output_path=str(final_output_path),
                    resolution=resolution
                )
            
            return final_path
            
        finally:
            # Cleanup temporary file
            try:
                os.unlink(scene_list_path)
            except:
                pass
    
    async def add_ui_elements(
        self,
        video_path: str,
        ui_elements: Dict[str, Any]
    ) -> str:
        """Add UI elements like title cards, credits, etc."""
        
        input_path = Path(video_path)
        ui_filename = f"ui_{input_path.stem}.mp4"
        ui_output_path = input_path.parent / ui_filename
        
        # Build ffmpeg filter chain for UI elements
        filters = []
        
        if "title" in ui_elements:
            title_text = ui_elements["title"]
            title_filter = f"drawtext=text='{title_text}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=100:enable='between(t,0,3)'"
            filters.append(title_filter)
        
        if "credits" in ui_elements:
            credits = ui_elements["credits"]
            credits_filter = f"drawtext=text='{credits}':fontsize=24:fontcolor=white:x=(w-text_w)/2:y=h-100:enable='gte(t,t-5)'"
            filters.append(credits_filter)
        
        if filters:
            filter_complex = ",".join(filters)
            
            ffmpeg_command = [
                "ffmpeg", "-y",
                "-i", video_path,
                "-vf", filter_complex,
                "-c:a", "copy",
                str(ui_output_path)
            ]
            
            try:
                process = await asyncio.create_subprocess_exec(
                    *ffmpeg_command,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                await process.communicate()
                
                if process.returncode == 0 and ui_output_path.exists():
                    return str(ui_output_path)
                
            except Exception as e:
                print(f"UI elements addition failed: {e}")
        
        return video_path  # Return original if UI addition fails
    
    async def export_video(
        self,
        video_path: str,
        export_formats: List[str] = ["mp4"],
        quality_presets: List[str] = ["high"]
    ) -> Dict[str, List[str]]:
        """Export video in multiple formats and qualities."""
        
        input_path = Path(video_path)
        if not input_path.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        export_results = {}
        
        quality_settings = {
            "high": {"crf": 18, "preset": "slow"},
            "medium": {"crf": 23, "preset": "medium"},
            "low": {"crf": 28, "preset": "fast"}
        }
        
        for fmt in export_formats:
            export_results[fmt] = []
            
            for quality in quality_presets:
                if quality not in quality_settings:
                    continue
                
                settings = quality_settings[quality]
                export_filename = f"{input_path.stem}_{quality}.{fmt}"
                export_path = input_path.parent / export_filename
                
                # Export command
                export_command = [
                    "ffmpeg", "-y",
                    "-i", str(input_path),
                    "-c:v", "libx264",
                    "-preset", settings["preset"],
                    "-crf", str(settings["crf"]),
                    "-c:a", "aac",
                    "-b:a", "128k",
                    str(export_path)
                ]
                
                try:
                    process = await asyncio.create_subprocess_exec(
                        *export_command,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    
                    await process.communicate()
                    
                    if process.returncode == 0 and export_path.exists():
                        export_results[fmt].append(str(export_path))
                    
                except Exception as e:
                    print(f"Export failed for {quality} {fmt}: {e}")
        
        return export_results
    
    def _get_character_screen_position(
        self,
        character_name: str,
        scene: Scene
    ) -> Tuple[int, int]:
        """Get screen position for character based on scene layout."""
        
        position = scene.get_character_position(character_name)
        
        # Convert logical positions to screen coordinates (1080p reference)
        position_map = {
            CharacterPosition.LEFT: (200, 150),
            CharacterPosition.CENTER: (760, 150),
            CharacterPosition.RIGHT: (1320, 150)
        }
        
        return position_map.get(position, position_map[CharacterPosition.CENTER])
    
    async def _compose_layers(
        self,
        layers: List[CompositionLayer],
        output_path: str,
        duration: float,
        video_config: Dict[str, Any]
    ) -> bool:
        """Compose multiple layers into single video."""
        
        # Sort layers by z_index
        sorted_layers = sorted(layers, key=lambda x: x.z_index)
        
        # Build ffmpeg filter complex
        inputs = []
        filter_parts = []
        
        for i, layer in enumerate(sorted_layers):
            inputs.extend(["-i", layer.content_path])
            
            if layer.type == "background":
                # Scale background to fit
                filter_parts.append(f"[{i}:v]scale={video_config['width']}:{video_config['height']}[bg{i}]")
            elif layer.type == "character":
                # Position and scale character
                x, y = layer.position
                scale_filter = f"scale=iw*{layer.scale}:ih*{layer.scale}" if layer.scale != 1.0 else ""
                position_filter = f"overlay={x}:{y}"
                
                if scale_filter:
                    filter_parts.append(f"[{i}:v]{scale_filter}[char{i}]")
                    filter_parts.append(f"[bg0][char{i}]{position_filter}[comp{i}]")
                else:
                    filter_parts.append(f"[bg0][{i}:v]{position_filter}[comp{i}]")
        
        # Create final composition
        filter_complex = ";".join(filter_parts)
        
        ffmpeg_command = [
            "ffmpeg", "-y",
            *inputs,
            "-filter_complex", filter_complex,
            "-t", str(duration),
            "-c:v", "libx264",
            "-r", "24",
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
            print(f"Layer composition failed: {e}")
            return False
    
    async def _add_dialogue_overlay(
        self,
        video_path: str,
        script_lines: List[DialogueLine],
        video_config: Dict[str, Any]
    ) -> str:
        """Add dialogue UI overlay to video."""
        
        input_path = Path(video_path)
        dialogue_filename = f"dialogue_{input_path.stem}.mp4"
        dialogue_output_path = input_path.parent / dialogue_filename
        
        # Build dialogue overlay filters
        dialogue_filters = []
        current_time = 0.0
        
        for line in script_lines:
            if not line.content.strip():
                continue
            
            start_time = current_time
            end_time = current_time + line.estimated_duration
            
            # Escape text for ffmpeg
            escaped_text = line.content.replace("'", "\\'").replace(":", "\\:")
            
            # Character name (if not narration)
            if line.character_name and not line.is_narration:
                name_filter = f"drawtext=text='{line.character_name}':fontsize=32:fontcolor=yellow:x=200:y=700:enable='between(t,{start_time},{end_time})'"
                dialogue_filters.append(name_filter)
                
                # Dialogue text
                text_y = 750
            else:
                # Narration text (centered, no name)
                text_y = 725
            
            text_filter = f"drawtext=text='{escaped_text}':fontsize=28:fontcolor=white:x=200:y={text_y}:fontfile='arial.ttf':enable='between(t,{start_time},{end_time})'"
            dialogue_filters.append(text_filter)
            
            current_time = end_time
        
        # Add dialogue box background
        box_filter = "drawbox=x=160:y=680:w=1600:h=300:color=black@0.8:t=fill"
        dialogue_filters.insert(0, box_filter)
        
        if dialogue_filters:
            filter_complex = ",".join(dialogue_filters)
            
            ffmpeg_command = [
                "ffmpeg", "-y",
                "-i", video_path,
                "-vf", filter_complex,
                "-c:a", "copy" if Path(video_path).suffix != ".mp4" else "aac",
                str(dialogue_output_path)
            ]
            
            try:
                process = await asyncio.create_subprocess_exec(
                    *ffmpeg_command,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                await process.communicate()
                
                if process.returncode == 0 and dialogue_output_path.exists():
                    return str(dialogue_output_path)
                
            except Exception as e:
                print(f"Dialogue overlay addition failed: {e}")
        
        return video_path
    
    async def _add_scene_audio(
        self,
        video_path: str,
        audio_clips: Dict[str, str],
        script_lines: List[DialogueLine]
    ) -> str:
        """Add synchronized audio to scene video."""
        
        input_path = Path(video_path)
        audio_filename = f"audio_{input_path.stem}.mp4"
        audio_output_path = input_path.parent / audio_filename
        
        # Create audio timeline
        audio_inputs = []
        audio_filters = []
        current_time = 0.0
        
        for i, line in enumerate(script_lines):
            if line.character_name and line.character_name in audio_clips:
                audio_file = audio_clips[line.character_name]
                if Path(audio_file).exists():
                    audio_inputs.extend(["-i", audio_file])
                    
                    # Add audio at specific time
                    audio_filters.append(f"[{i+1}:a]adelay={int(current_time*1000)}|{int(current_time*1000)}[a{i}]")
            
            current_time += line.estimated_duration
        
        if audio_inputs and audio_filters:
            # Mix all audio tracks
            audio_filters.append(f"[0:a]{''.join(f'[a{i}]' for i in range(len(audio_filters)))}amix=inputs={len(audio_filters)+1}[audio]")
            
            ffmpeg_command = [
                "ffmpeg", "-y",
                "-i", video_path,
                *audio_inputs,
                "-filter_complex", ";".join(audio_filters),
                "-map", "0:v",
                "-map", "[audio]",
                "-c:v", "copy",
                "-c:a", "aac",
                str(audio_output_path)
            ]
            
            try:
                process = await asyncio.create_subprocess_exec(
                    *ffmpeg_command,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                await process.communicate()
                
                if process.returncode == 0 and audio_output_path.exists():
                    return str(audio_output_path)
                
            except Exception as e:
                print(f"Audio addition failed: {e}")
        
        return video_path
    
    async def _create_video_with_transitions(
        self,
        scenes: List[VideoClip],
        output_path: str,
        resolution: str
    ) -> str:
        """Create video with smooth transitions between scenes."""
        
        transition_duration = 1.0  # seconds
        
        # For now, use simple concatenation - transitions can be added later
        return await self._concatenate_scenes(
            scenes=scenes,
            output_path=output_path,
            resolution=resolution
        )
    
    async def _concatenate_scenes(
        self,
        scenes: Optional[List[VideoClip]] = None,
        scene_list_path: Optional[str] = None,
        output_path: str = "",
        resolution: str = "1080p"
    ) -> str:
        """Concatenate scenes into final video."""
        
        video_config = self.video_settings.get(resolution, self.video_settings["1080p"])
        
        if scene_list_path:
            # Use file list
            ffmpeg_command = [
                "ffmpeg", "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", scene_list_path,
                "-c", "copy",
                output_path
            ]
        else:
            # Direct concatenation
            inputs = []
            for scene in scenes:
                inputs.extend(["-i", scene.path])
            
            filter_parts = []
            for i in range(len(scenes)):
                filter_parts.append(f"[{i}:v][{i}:a]")
            
            filter_complex = f"{''.join(filter_parts)}concat=n={len(scenes)}:v=1:a=1[outv][outa]"
            
            ffmpeg_command = [
                "ffmpeg", "-y",
                *inputs,
                "-filter_complex", filter_complex,
                "-map", "[outv]",
                "-map", "[outa]",
                "-c:v", "libx264",
                "-c:a", "aac",
                output_path
            ]
        
        try:
            process = await asyncio.create_subprocess_exec(
                *ffmpeg_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0 and Path(output_path).exists():
                return output_path
            else:
                error_msg = stderr.decode() if stderr else "Unknown error"
                raise Exception(f"Video concatenation failed: {error_msg}")
                
        except Exception as e:
            print(f"Scene concatenation failed: {e}")
            raise
    
    async def cleanup_temp_files(self, keep_recent_hours: int = 1) -> int:
        """Clean up temporary video files."""
        cutoff_time = datetime.now().timestamp() - (keep_recent_hours * 3600)
        cleaned_count = 0
        
        for temp_file in self.temp_path.glob("*"):
            if temp_file.is_file() and temp_file.stat().st_mtime < cutoff_time:
                try:
                    temp_file.unlink()
                    cleaned_count += 1
                except Exception as e:
                    print(f"Failed to delete {temp_file}: {e}")
        
        return cleaned_count