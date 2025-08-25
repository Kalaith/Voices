"""
Character Consistency Engine with LoRA Training Support.
Ensures visual consistency of characters across different scenes and generations.
"""

import asyncio
import json
import shutil
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Union
from datetime import datetime
from dataclasses import asdict
import hashlib
import logging

from ..models.character import Character, LoRAModel, CharacterExpression, EmotionType
from .database_service import DatabaseService


class CharacterConsistencyEngine:
    """Engine for maintaining character visual consistency through LoRA training and prompt management."""
    
    def __init__(
        self,
        lora_training_path: str = "H:/Claude/voices/video-service/lora_training",
        db_service: Optional[DatabaseService] = None
    ):
        """Initialize character consistency engine."""
        self.lora_training_path = Path(lora_training_path)
        self.db_service = db_service or DatabaseService()
        
        # Set up directory structure
        self.training_configs_path = self.lora_training_path / "configs"
        self.datasets_path = self.lora_training_path / "datasets"
        self.models_path = self.lora_training_path / "trained_models"
        self.temp_path = self.lora_training_path / "temp"
        
        for path in [self.training_configs_path, self.datasets_path, self.models_path, self.temp_path]:
            path.mkdir(parents=True, exist_ok=True)
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Default LoRA training configuration
        self.default_lora_config = {
            "base_model": "stabilityai/stable-diffusion-xl-base-1.0",
            "resolution": 1024,
            "batch_size": 1,
            "learning_rate": 1e-4,
            "max_train_steps": 1000,
            "save_every_n_epochs": 100,
            "mixed_precision": "fp16",
            "gradient_checkpointing": True,
            "network_dim": 32,
            "network_alpha": 32,
            "network_module": "networks.lora",
            "lr_scheduler": "cosine_with_restarts",
            "optimizer_type": "AdamW8bit"
        }
    
    async def ensure_character_consistency(
        self,
        character: Character,
        scene_prompts: List[str],
        force_retrain: bool = False
    ) -> Tuple[Dict[str, str], LoRAModel]:
        """Ensure character consistency across multiple scene prompts."""
        
        if not character.id:
            raise ValueError("Character must have an ID (be saved to database)")
        
        # Get or create LoRA model for character
        lora_model = await self.get_or_create_lora_model(character, force_retrain)
        
        # Apply consistency to all scene prompts
        consistent_prompts = {}
        for scene_prompt in scene_prompts:
            consistent_prompt = self._apply_character_consistency(scene_prompt, character, lora_model)
            consistent_prompts[scene_prompt] = consistent_prompt
        
        return consistent_prompts, lora_model
    
    async def get_or_create_lora_model(
        self,
        character: Character,
        force_retrain: bool = False
    ) -> LoRAModel:
        """Get existing LoRA model or create a new one for character."""
        
        # Check for existing model
        existing_model = await self._get_existing_lora_model(character.id)
        
        if existing_model and existing_model.is_ready and not force_retrain:
            return existing_model
        
        # Generate reference images for training
        reference_images = await self._generate_reference_images(character)
        
        if len(reference_images) < 5:
            raise ValueError(f"Need at least 5 reference images for LoRA training, got {len(reference_images)}")
        
        # Create new LoRA model
        lora_model = LoRAModel(
            character_id=character.id,
            model_name=f"{character.name.replace(' ', '_')}_LoRA",
            trigger_word=f"{character.name.lower().replace(' ', '_')}_character",
            training_images_count=len(reference_images),
            training_config=self.default_lora_config.copy(),
            training_status="pending"
        )
        
        # Generate unique model path
        model_filename = f"{lora_model.model_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.safetensors"
        lora_model.model_path = str(self.models_path / model_filename)
        
        # Save to database
        lora_id = await self.db_service.save_lora_model(lora_model)
        lora_model.id = lora_id
        
        # Start training process
        await self._train_lora_model(lora_model, character, reference_images)
        
        return lora_model
    
    async def train_character_lora(
        self,
        character: Character,
        reference_images: List[str],
        training_config: Optional[Dict[str, Any]] = None
    ) -> LoRAModel:
        """Train a LoRA model for character consistency."""
        
        if len(reference_images) < 5:
            raise ValueError("Need at least 5 reference images for training")
        
        # Validate reference images exist
        valid_images = []
        for img_path in reference_images:
            if Path(img_path).exists():
                valid_images.append(img_path)
            else:
                self.logger.warning(f"Reference image not found: {img_path}")
        
        if len(valid_images) < 5:
            raise ValueError(f"Only {len(valid_images)} valid reference images found")
        
        # Use provided config or default
        config = training_config or self.default_lora_config.copy()
        
        # Create LoRA model record
        lora_model = LoRAModel(
            character_id=character.id,
            model_name=f"{character.name.replace(' ', '_')}_LoRA",
            trigger_word=f"{character.name.lower().replace(' ', '_')}_character",
            training_images_count=len(valid_images),
            training_config=config,
            training_status="training"
        )
        
        # Generate paths
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        model_filename = f"{lora_model.model_name}_{timestamp}.safetensors"
        lora_model.model_path = str(self.models_path / model_filename)
        
        # Save to database
        lora_id = await self.db_service.save_lora_model(lora_model)
        lora_model.id = lora_id
        
        # Prepare training dataset
        dataset_path = await self._prepare_training_dataset(lora_model, character, valid_images)
        
        # Create training configuration file
        config_path = await self._create_training_config(lora_model, dataset_path)
        
        # Execute training
        success = await self._execute_lora_training(lora_model, config_path)
        
        # Update model status
        if success:
            lora_model.training_status = "completed"
            validation_score = await self._validate_lora_model(lora_model, character)
            lora_model.validation_score = validation_score
        else:
            lora_model.training_status = "failed"
        
        # Update database
        await self.db_service.save_lora_model(lora_model)
        
        return lora_model
    
    async def generate_character_expression(
        self,
        character: Character,
        emotion: EmotionType,
        scene_context: Optional[str] = None
    ) -> str:
        """Generate character portrait with specific emotion and context."""
        
        # Get LoRA model for consistency
        lora_model = await self._get_existing_lora_model(character.id)
        
        # Base prompt from character description
        base_prompt = character.visual_description or f"portrait of {character.name}"
        
        # Add emotion modifier
        emotion_prompt = character.get_emotion_prompt(emotion)
        
        # Combine prompts
        full_prompt = f"{base_prompt}, {emotion_prompt}"
        
        # Add scene context if provided
        if scene_context:
            full_prompt += f", {scene_context}"
        
        # Add LoRA consistency if available
        if lora_model and lora_model.is_ready:
            lora_trigger = f"<lora:{lora_model.trigger_word}:0.8>"
            full_prompt = f"{full_prompt}, {lora_trigger}"
        
        return full_prompt
    
    async def validate_character_consistency(
        self,
        character: Character,
        generated_images: List[str]
    ) -> Tuple[float, List[str]]:
        """Validate consistency across multiple generated images of a character."""
        
        if len(generated_images) < 2:
            return 1.0, []  # Perfect score if only one image
        
        # This is a simplified validation - in production you'd use computer vision
        # to analyze facial features, clothing, hair color, etc.
        
        consistency_issues = []
        consistency_score = 1.0
        
        # Basic validation based on file existence and character description
        existing_images = [img for img in generated_images if Path(img).exists()]
        
        if len(existing_images) < len(generated_images):
            missing_count = len(generated_images) - len(existing_images)
            consistency_issues.append(f"{missing_count} generated images are missing")
            consistency_score -= 0.1 * missing_count
        
        # Check if character has LoRA model
        lora_model = await self._get_existing_lora_model(character.id)
        if not lora_model or not lora_model.is_ready:
            consistency_issues.append("Character lacks trained LoRA model for consistency")
            consistency_score -= 0.2
        
        # Ensure score doesn't go below 0
        consistency_score = max(0.0, consistency_score)
        
        return consistency_score, consistency_issues
    
    async def update_character_visual_description(
        self,
        character: Character,
        new_description: str,
        retrain_lora: bool = True
    ) -> Character:
        """Update character visual description and optionally retrain LoRA."""
        
        character.visual_description = new_description
        
        # Save updated character
        await self.db_service.save_character(character)
        
        # Retrain LoRA model if requested
        if retrain_lora and character.id:
            await self.get_or_create_lora_model(character, force_retrain=True)
        
        return character
    
    def _apply_character_consistency(
        self,
        scene_prompt: str,
        character: Character,
        lora_model: Optional[LoRAModel]
    ) -> str:
        """Apply character consistency markers to a scene prompt."""
        
        consistency_elements = []
        
        # Add character description
        if character.visual_description:
            consistency_elements.append(character.visual_description)
        
        # Add LoRA trigger if available
        if lora_model and lora_model.is_ready:
            lora_trigger = f"<lora:{lora_model.trigger_word}:0.8>"
            consistency_elements.append(lora_trigger)
        
        # Add character name for prompt consistency
        if character.name:
            consistency_elements.append(f"character named {character.name}")
        
        # Combine with scene prompt
        if consistency_elements:
            character_prompt = ", ".join(consistency_elements)
            return f"{scene_prompt}, featuring {character_prompt}"
        
        return scene_prompt
    
    async def _get_existing_lora_model(self, character_id: int) -> Optional[LoRAModel]:
        """Get existing LoRA model for character."""
        async with self.db_service:
            cursor = self.db_service.connection.cursor(dictionary=True)
            query = """
                SELECT * FROM character_lora_models 
                WHERE character_id = %s AND training_status = 'completed'
                ORDER BY created_at DESC LIMIT 1
            """
            cursor.execute(query, (character_id,))
            result = cursor.fetchone()
            cursor.close()
            
            if result:
                return LoRAModel(
                    id=result['id'],
                    character_id=result['character_id'],
                    model_name=result['model_name'],
                    model_path=result['model_path'],
                    trigger_word=result['trigger_word'],
                    training_images_count=result['training_images_count'],
                    model_version=result['model_version'],
                    training_status=result['training_status'],
                    training_config=json.loads(result['training_config']) if result['training_config'] else {},
                    validation_score=result['validation_score']
                )
        
        return None
    
    async def _generate_reference_images(self, character: Character, count: int = 10) -> List[str]:
        """Generate reference images for LoRA training."""
        
        reference_images = []
        
        # Create variations of character description
        base_description = character.visual_description or f"portrait of {character.name}"
        
        variations = [
            f"{base_description}, front view",
            f"{base_description}, side view", 
            f"{base_description}, three quarter view",
            f"{base_description}, smiling",
            f"{base_description}, serious expression",
            f"{base_description}, upper body shot",
            f"{base_description}, close-up portrait",
            f"{base_description}, neutral background",
            f"{base_description}, different lighting",
            f"{base_description}, high quality detailed"
        ]
        
        # This is a placeholder - in production you'd generate actual images
        # using your image generation service
        for i, variation in enumerate(variations[:count]):
            placeholder_path = self.temp_path / f"ref_{character.id}_{i}.png" 
            reference_images.append(str(placeholder_path))
        
        return reference_images
    
    async def _prepare_training_dataset(
        self,
        lora_model: LoRAModel,
        character: Character,
        reference_images: List[str]
    ) -> str:
        """Prepare training dataset for LoRA training."""
        
        dataset_dir = self.datasets_path / f"character_{character.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        dataset_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy reference images to dataset directory
        for i, img_path in enumerate(reference_images):
            if Path(img_path).exists():
                new_name = f"{lora_model.trigger_word}_{i:03d}.png"
                destination = dataset_dir / new_name
                shutil.copy2(img_path, destination)
                
                # Create caption file
                caption_file = destination.with_suffix('.txt')
                caption = f"{lora_model.trigger_word}, {character.visual_description}"
                caption_file.write_text(caption, encoding='utf-8')
        
        return str(dataset_dir)
    
    async def _create_training_config(self, lora_model: LoRAModel, dataset_path: str) -> str:
        """Create training configuration file for LoRA training."""
        
        config_filename = f"config_{lora_model.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.toml"
        config_path = self.training_configs_path / config_filename
        
        # TOML configuration for Kohya scripts
        config_content = f"""
[model]
pretrained_model_name_or_path = "{lora_model.training_config['base_model']}"
v2 = false
v_parameterization = false

[dataset]
train_data_dir = "{dataset_path}"
resolution = {lora_model.training_config['resolution']}
batch_size = {lora_model.training_config['batch_size']}

[training]
max_train_steps = {lora_model.training_config['max_train_steps']}
learning_rate = {lora_model.training_config['learning_rate']}
lr_scheduler = "{lora_model.training_config.get('lr_scheduler', 'cosine_with_restarts')}"
optimizer_type = "{lora_model.training_config.get('optimizer_type', 'AdamW8bit')}"

[network]
network_module = "{lora_model.training_config.get('network_module', 'networks.lora')}"
network_dim = {lora_model.training_config['network_dim']}
network_alpha = {lora_model.training_config['network_alpha']}

[output]
output_dir = "{self.models_path}"
output_name = "{Path(lora_model.model_path).stem}"
save_every_n_epochs = {lora_model.training_config.get('save_every_n_epochs', 100)}

[misc]
mixed_precision = "{lora_model.training_config.get('mixed_precision', 'fp16')}"
gradient_checkpointing = {str(lora_model.training_config.get('gradient_checkpointing', True)).lower()}
"""
        
        config_path.write_text(config_content, encoding='utf-8')
        return str(config_path)
    
    async def _execute_lora_training(self, lora_model: LoRAModel, config_path: str) -> bool:
        """Execute LoRA training process."""
        
        # This is a placeholder for the actual training execution
        # In production, you'd call Kohya trainer or similar LoRA training script
        
        self.logger.info(f"Starting LoRA training for {lora_model.model_name}")
        
        try:
            # Simulate training time
            await asyncio.sleep(2)  # Replace with actual training call
            
            # Create placeholder model file
            model_path = Path(lora_model.model_path)
            model_path.write_text("# Placeholder LoRA model file", encoding='utf-8')
            
            self.logger.info(f"LoRA training completed: {lora_model.model_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"LoRA training failed: {e}")
            return False
    
    async def _validate_lora_model(self, lora_model: LoRAModel, character: Character) -> float:
        """Validate trained LoRA model quality."""
        
        # This is a placeholder validation - in production you'd generate test images
        # and evaluate consistency using computer vision metrics
        
        if Path(lora_model.model_path).exists():
            # Basic validation: file exists and has reasonable size
            file_size = Path(lora_model.model_path).stat().st_size
            if file_size > 1000:  # At least 1KB (placeholder check)
                return 0.85  # Good quality score
            else:
                return 0.3   # Poor quality
        
        return 0.0  # No model file