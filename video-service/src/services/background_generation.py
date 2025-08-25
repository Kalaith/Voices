"""
Background Generation Service for visual novel videos.
Integrates with ComfyUI for scene background generation and caching.
"""

import asyncio
import subprocess
import json
import hashlib
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime

from .database_service import DatabaseService


class BackgroundGenerationService:
    """Service for generating and caching scene backgrounds using ComfyUI."""
    
    def __init__(
        self,
        comfyui_script_path: str = "H:/Claude/voices/comfyui-generate.ps1",
        backgrounds_path: str = "H:/Claude/voices/assets/backgrounds",
        db_service: Optional[DatabaseService] = None
    ):
        """Initialize background generation service."""
        self.comfyui_script_path = Path(comfyui_script_path)
        self.backgrounds_path = Path(backgrounds_path)
        self.db_service = db_service or DatabaseService()
        
        # Ensure backgrounds directory exists
        self.backgrounds_path.mkdir(parents=True, exist_ok=True)
        
        # Default style configurations
        self.style_presets = {
            "anime": {
                "style_prompt": "anime style, detailed background, vibrant colors, studio ghibli inspired",
                "negative_prompt": "photorealistic, 3d render, low quality, blurry",
                "cfg_scale": 7.0,
                "steps": 28
            },
            "realistic": {
                "style_prompt": "photorealistic, high quality, detailed environment, professional photography",
                "negative_prompt": "anime, cartoon, low quality, blurry",
                "cfg_scale": 6.0,
                "steps": 30
            },
            "fantasy": {
                "style_prompt": "fantasy art, magical environment, ethereal lighting, concept art style",
                "negative_prompt": "modern, contemporary, low quality",
                "cfg_scale": 7.5,
                "steps": 32
            },
            "cyberpunk": {
                "style_prompt": "cyberpunk, neon lighting, futuristic cityscape, high tech atmosphere",
                "negative_prompt": "medieval, natural, low quality",
                "cfg_scale": 8.0,
                "steps": 30
            },
            "historical": {
                "style_prompt": "historical setting, period accurate, detailed architecture",
                "negative_prompt": "modern, futuristic, low quality",
                "cfg_scale": 6.5,
                "steps": 28
            }
        }
    
    async def generate_scene_background(
        self,
        scene_prompt: str,
        style: str = "anime",
        width: int = 1920,
        height: int = 1080,
        force_regenerate: bool = False
    ) -> str:
        """Generate a background image for a scene."""
        
        # Generate cache key
        cache_key = self._generate_cache_key(scene_prompt, style, width, height)
        
        # Check cache first
        if not force_regenerate:
            cached_path = await self._get_cached_background(cache_key)
            if cached_path and os.path.exists(cached_path):
                return cached_path
        
        # Get style configuration
        style_config = self.style_presets.get(style, self.style_presets["anime"])
        
        # Prepare full prompt
        full_prompt = f"{scene_prompt}, {style_config['style_prompt']}"
        negative_prompt = style_config['negative_prompt']
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"bg_{cache_key}_{timestamp}.png"
        output_path = self.backgrounds_path / filename
        
        # Generate image using ComfyUI
        success = await self._generate_with_comfyui(
            prompt=full_prompt,
            negative_prompt=negative_prompt,
            output_path=str(output_path),
            width=width,
            height=height,
            cfg_scale=style_config['cfg_scale'],
            steps=style_config['steps']
        )
        
        if success and output_path.exists():
            # Cache the result
            await self._cache_background(
                scene_prompt=scene_prompt,
                style=style,
                image_path=str(output_path),
                prompt_hash=cache_key,
                width=width,
                height=height,
                generation_params={
                    "full_prompt": full_prompt,
                    "negative_prompt": negative_prompt,
                    "cfg_scale": style_config['cfg_scale'],
                    "steps": style_config['steps']
                }
            )
            return str(output_path)
        
        raise Exception(f"Failed to generate background for scene: {scene_prompt}")
    
    async def batch_generate_backgrounds(
        self,
        scene_prompts: List[str],
        style: str = "anime",
        width: int = 1920,
        height: int = 1080,
        max_concurrent: int = 2
    ) -> Dict[str, str]:
        """Generate multiple backgrounds in parallel with concurrency limit."""
        
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def generate_single(prompt: str) -> Tuple[str, str]:
            async with semaphore:
                try:
                    path = await self.generate_scene_background(prompt, style, width, height)
                    return prompt, path
                except Exception as e:
                    print(f"Failed to generate background for '{prompt}': {e}")
                    return prompt, ""
        
        # Execute all generations
        tasks = [generate_single(prompt) for prompt in scene_prompts]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        background_paths = {}
        for result in results:
            if isinstance(result, tuple) and len(result) == 2:
                prompt, path = result
                background_paths[prompt] = path
            elif isinstance(result, Exception):
                print(f"Background generation error: {result}")
        
        return background_paths
    
    async def optimize_background_for_video(
        self,
        background_path: str,
        target_width: int = 1920,
        target_height: int = 1080
    ) -> str:
        """Optimize background image for video composition."""
        
        input_path = Path(background_path)
        if not input_path.exists():
            raise FileNotFoundError(f"Background image not found: {background_path}")
        
        # Create optimized filename
        optimized_filename = f"optimized_{input_path.stem}.png"
        optimized_path = input_path.parent / optimized_filename
        
        # Use PowerShell to optimize image (placeholder implementation)
        # In production, you might use PIL, OpenCV, or ffmpeg
        optimization_script = f"""
        # Load and resize image for video composition
        Add-Type -AssemblyName System.Drawing
        $image = [System.Drawing.Image]::FromFile('{input_path}')
        $bitmap = New-Object System.Drawing.Bitmap($image, {target_width}, {target_height})
        $bitmap.Save('{optimized_path}', [System.Drawing.Imaging.ImageFormat]::Png)
        $image.Dispose()
        $bitmap.Dispose()
        """
        
        try:
            process = await asyncio.create_subprocess_exec(
                "powershell", "-Command", optimization_script,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0 and optimized_path.exists():
                return str(optimized_path)
            else:
                print(f"Image optimization failed: {stderr.decode() if stderr else 'Unknown error'}")
                return background_path  # Return original if optimization fails
                
        except Exception as e:
            print(f"Image optimization error: {e}")
            return background_path
    
    async def get_background_variants(
        self,
        scene_prompt: str,
        base_style: str = "anime",
        variant_count: int = 3
    ) -> List[str]:
        """Generate multiple variants of the same scene background."""
        
        style_variants = []
        base_config = self.style_presets.get(base_style, self.style_presets["anime"])
        
        # Create variations by adjusting generation parameters
        for i in range(variant_count):
            variant_config = base_config.copy()
            
            # Vary CFG scale and steps slightly
            variant_config['cfg_scale'] = base_config['cfg_scale'] + (i * 0.5 - 1.0)
            variant_config['steps'] = base_config['steps'] + (i * 2 - 2)
            
            # Add variation keywords
            variation_keywords = [
                "detailed, intricate",
                "atmospheric, moody", 
                "bright, colorful"
            ]
            
            variant_prompt = f"{scene_prompt}, {base_config['style_prompt']}, {variation_keywords[i % 3]}"
            
            try:
                # Generate variant
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"variant_{i}_{timestamp}.png"
                output_path = self.backgrounds_path / filename
                
                success = await self._generate_with_comfyui(
                    prompt=variant_prompt,
                    negative_prompt=variant_config['negative_prompt'],
                    output_path=str(output_path),
                    cfg_scale=variant_config['cfg_scale'],
                    steps=int(variant_config['steps'])
                )
                
                if success and output_path.exists():
                    style_variants.append(str(output_path))
                    
            except Exception as e:
                print(f"Failed to generate variant {i}: {e}")
        
        return style_variants
    
    async def cleanup_old_backgrounds(self, days_old: int = 7) -> int:
        """Clean up background images older than specified days."""
        
        cutoff_time = datetime.now().timestamp() - (days_old * 24 * 3600)
        cleaned_count = 0
        
        for image_file in self.backgrounds_path.glob("*.png"):
            if image_file.stat().st_mtime < cutoff_time:
                try:
                    image_file.unlink()
                    cleaned_count += 1
                except Exception as e:
                    print(f"Failed to delete {image_file}: {e}")
        
        # Clean up database entries for deleted files
        async with self.db_service:
            # This would remove database entries for non-existent files
            pass
        
        return cleaned_count
    
    def _generate_cache_key(self, prompt: str, style: str, width: int, height: int) -> str:
        """Generate cache key for background."""
        combined = f"{prompt}|{style}|{width}x{height}"
        return hashlib.md5(combined.encode()).hexdigest()[:16]
    
    async def _get_cached_background(self, cache_key: str) -> Optional[str]:
        """Check if background is cached."""
        async with self.db_service:
            cursor = self.db_service.connection.cursor(dictionary=True)
            query = "SELECT image_path FROM generated_backgrounds WHERE prompt_hash = %s"
            cursor.execute(query, (cache_key,))
            result = cursor.fetchone()
            cursor.close()
            
            if result:
                return result['image_path']
            return None
    
    async def _cache_background(
        self,
        scene_prompt: str,
        style: str,
        image_path: str,
        prompt_hash: str,
        width: int,
        height: int,
        generation_params: Dict[str, Any]
    ) -> bool:
        """Cache background in database."""
        try:
            async with self.db_service:
                cursor = self.db_service.connection.cursor()
                query = """
                    INSERT INTO generated_backgrounds
                    (scene_prompt, style, image_path, prompt_hash, width, height, generation_params)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                    image_path = VALUES(image_path),
                    generation_params = VALUES(generation_params)
                """
                values = (
                    scene_prompt,
                    style,
                    image_path,
                    prompt_hash,
                    width,
                    height,
                    json.dumps(generation_params)
                )
                cursor.execute(query, values)
                cursor.close()
                return True
        except Exception as e:
            print(f"Failed to cache background: {e}")
            return False
    
    async def _generate_with_comfyui(
        self,
        prompt: str,
        negative_prompt: str,
        output_path: str,
        width: int = 1920,
        height: int = 1080,
        cfg_scale: float = 7.0,
        steps: int = 28
    ) -> bool:
        """Generate image using ComfyUI PowerShell script."""
        
        if not self.comfyui_script_path.exists():
            raise FileNotFoundError(f"ComfyUI script not found: {self.comfyui_script_path}")
        
        # Prepare PowerShell command
        ps_command = [
            "powershell",
            "-ExecutionPolicy", "Bypass",
            "-File", str(self.comfyui_script_path),
            "-Prompt", f'"{prompt}"',
            "-NegativePrompt", f'"{negative_prompt}"',
            "-OutputPath", f'"{output_path}"',
            "-Width", str(width),
            "-Height", str(height),
            "-CFGScale", str(cfg_scale),
            "-Steps", str(steps)
        ]
        
        try:
            # Execute ComfyUI generation
            process = await asyncio.create_subprocess_exec(
                *ps_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.comfyui_script_path.parent
            )
            
            stdout, stderr = await process.communicate()
            
            # Check if generation was successful
            if process.returncode == 0:
                return True
            else:
                error_message = stderr.decode() if stderr else "Unknown error"
                print(f"ComfyUI generation failed: {error_message}")
                return False
                
        except Exception as e:
            print(f"Error executing ComfyUI script: {e}")
            return False
    
    def get_style_presets(self) -> Dict[str, Dict[str, Any]]:
        """Get available style presets."""
        return self.style_presets.copy()
    
    def add_custom_style(self, name: str, config: Dict[str, Any]) -> bool:
        """Add a custom style preset."""
        required_keys = ['style_prompt', 'negative_prompt', 'cfg_scale', 'steps']
        
        if all(key in config for key in required_keys):
            self.style_presets[name] = config
            return True
        return False
    
    async def get_generation_statistics(self) -> Dict[str, Any]:
        """Get background generation statistics."""
        async with self.db_service:
            cursor = self.db_service.connection.cursor(dictionary=True)
            
            stats_query = """
                SELECT 
                    COUNT(*) as total_backgrounds,
                    COUNT(DISTINCT style) as unique_styles,
                    AVG(width) as avg_width,
                    AVG(height) as avg_height,
                    style,
                    COUNT(*) as style_count
                FROM generated_backgrounds 
                GROUP BY style
                ORDER BY style_count DESC
            """
            
            cursor.execute(stats_query)
            style_stats = cursor.fetchall()
            
            # Get total count
            cursor.execute("SELECT COUNT(*) as total FROM generated_backgrounds")
            total_result = cursor.fetchone()
            
            cursor.close()
            
            return {
                "total_backgrounds": total_result['total'] if total_result else 0,
                "style_statistics": style_stats,
                "available_styles": list(self.style_presets.keys())
            }