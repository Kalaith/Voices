"""
Character Profile Management Service for video generation.
Handles character creation, consistency, voice mapping, and LoRA training.
"""

import asyncio
import json
import os
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from pathlib import Path

from ..models.character import (
    Character, CharacterExpression, VoiceProfile, LoRAModel,
    EmotionType, CharacterRole
)
from ..utils.kobold_client import KoboldAIClient
from .database_service import DatabaseService


class CharacterManager:
    """Service for managing character profiles and consistency."""
    
    def __init__(
        self, 
        db_service: Optional[DatabaseService] = None,
        kobold_client: Optional[KoboldAIClient] = None,
        character_assets_path: str = "H:/Claude/voices/assets/characters"
    ):
        """Initialize character manager."""
        self.db_service = db_service or DatabaseService()
        self.kobold_client = kobold_client
        self.character_assets_path = Path(character_assets_path)
        
        # Ensure character directories exist
        self.portraits_path = self.character_assets_path / "portraits"
        self.expressions_path = self.character_assets_path / "expressions"
        self.lora_models_path = self.character_assets_path / "lora_models"
        
        for path in [self.portraits_path, self.expressions_path, self.lora_models_path]:
            path.mkdir(parents=True, exist_ok=True)
    
    async def create_character_from_description(
        self, 
        description: str, 
        genre: str = "fantasy",
        voice_id: Optional[int] = None
    ) -> Character:
        """Create a character profile from a text description."""
        
        if self.kobold_client:
            # Use KoboldAI to generate detailed profile
            character, session = await self.kobold_client.generate_character_profile(description, genre)
            
            # Save generation session
            if hasattr(self.db_service, 'save_generation_session'):
                await self.db_service.save_generation_session(session)
        else:
            # Create basic character manually
            character = Character(
                name="New Character",
                description=description,
                personality_traits=["friendly", "curious"],
                speaking_style="casual",
                visual_description=description
            )
        
        # Assign voice if provided
        if voice_id:
            character.voice_profile_id = voice_id
        
        # Save character to database
        character_id = await self.db_service.save_character(character)
        character.id = character_id
        
        # Create default expressions
        await self.create_default_expressions(character)
        
        return character
    
    async def create_default_expressions(self, character: Character) -> List[CharacterExpression]:
        """Create default emotional expressions for a character."""
        if not character.id:
            raise ValueError("Character must be saved to database first")
        
        default_emotions = {
            EmotionType.NEUTRAL: "neutral expression, calm face, looking forward",
            EmotionType.HAPPY: "happy expression, bright smile, cheerful eyes",
            EmotionType.SAD: "sad expression, downcast eyes, slight frown",
            EmotionType.ANGRY: "angry expression, furrowed brow, intense gaze",
            EmotionType.SURPRISED: "surprised expression, wide eyes, slightly open mouth",
            EmotionType.CONFUSED: "confused expression, tilted head, questioning look",
            EmotionType.EXCITED: "excited expression, energetic smile, bright eyes",
            EmotionType.WORRIED: "worried expression, concerned eyes, slight frown",
            EmotionType.DETERMINED: "determined expression, focused eyes, firm jaw",
            EmotionType.SHY: "shy expression, blushing cheeks, looking away slightly"
        }
        
        expressions = []
        
        # Add character-specific styling to expressions
        character_style = character.visual_description or "anime style character"
        
        async with self.db_service:
            for emotion, base_prompt in default_emotions.items():
                # Combine character description with emotion
                full_prompt = f"{character_style}, {base_prompt}"
                
                expression = CharacterExpression(
                    character_id=character.id,
                    emotion=emotion,
                    expression_prompt=full_prompt
                )
                
                # Save expression to database
                await self._save_character_expression(expression)
                expressions.append(expression)
                
                # Update character emotion mapping
                character.emotion_mapping[emotion.value] = full_prompt
        
        # Update character with emotion mapping
        await self.db_service.save_character(character)
        
        return expressions
    
    async def create_voice_profile(
        self,
        character: Character,
        base_voice_id: int,
        emotion_adjustments: Optional[Dict[str, Dict[str, float]]] = None
    ) -> VoiceProfile:
        """Create voice profile for character consistency."""
        
        # Analyze personality for voice characteristics
        voice_traits = self._analyze_personality_for_voice(character.personality_traits)
        
        # Default voice configuration
        base_config = {
            "speed": voice_traits.get("speed", 1.0),
            "pitch": voice_traits.get("pitch", 1.0),
            "temperature": voice_traits.get("temperature", 0.7),
            "emotion_baseline": voice_traits.get("emotion", "neutral")
        }
        
        # Default emotion adjustments if not provided
        if not emotion_adjustments:
            emotion_adjustments = self._get_default_emotion_adjustments(character.personality_traits)
        
        voice_profile = VoiceProfile(
            character_id=character.id,
            voice_id=base_voice_id,
            voice_config=base_config,
            emotion_adjustments=emotion_adjustments
        )
        
        # Save to database
        await self._save_voice_profile(voice_profile)
        
        # Update character with voice association
        character.voice_profile_id = base_voice_id
        await self.db_service.save_character(character)
        
        return voice_profile
    
    async def ensure_character_consistency(
        self,
        character: Character,
        scene_prompts: List[str]
    ) -> Dict[str, str]:
        """Ensure character visual consistency across scenes."""
        
        # Get or create LoRA model for character
        lora_model = await self.get_or_create_lora_model(character)
        
        consistent_prompts = {}
        
        for scene_prompt in scene_prompts:
            # Add character-specific consistency markers
            consistent_prompt = self._add_consistency_markers(
                scene_prompt, character, lora_model
            )
            consistent_prompts[scene_prompt] = consistent_prompt
        
        return consistent_prompts
    
    async def get_or_create_lora_model(self, character: Character) -> Optional[LoRAModel]:
        """Get existing LoRA model or create new one for character."""
        if not character.id:
            return None
        
        # Check if LoRA model exists
        existing_lora = await self._get_character_lora_model(character.id)
        
        if existing_lora and existing_lora.is_ready:
            return existing_lora
        
        # Create new LoRA model entry
        trigger_word = f"{character.name.lower().replace(' ', '_')}_character"
        model_name = f"{character.name.replace(' ', '_')}_LoRA"
        model_path = str(self.lora_models_path / f"{model_name}.safetensors")
        
        lora_model = LoRAModel(
            character_id=character.id,
            model_name=model_name,
            model_path=model_path,
            trigger_word=trigger_word,
            training_status="pending",
            training_config={
                "base_model": "stable-diffusion-xl-base-1.0",
                "resolution": 1024,
                "batch_size": 1,
                "learning_rate": 1e-4,
                "max_train_steps": 1000,
                "network_dim": 32,
                "network_alpha": 32
            }
        )
        
        # Save to database
        lora_id = await self.db_service.save_lora_model(lora_model)
        lora_model.id = lora_id
        
        return lora_model
    
    async def update_character_relationships(
        self,
        character_id: int,
        relationships: Dict[str, str]
    ) -> bool:
        """Update character relationships with other characters."""
        
        character = await self.db_service.get_character(character_id)
        if not character:
            return False
        
        character.relationships.update(relationships)
        await self.db_service.save_character(character)
        
        return True
    
    async def generate_character_interactions(
        self,
        character1: Character,
        character2: Character,
        scene_context: str
    ) -> str:
        """Generate natural interactions between two characters."""
        
        if not self.kobold_client:
            return f"{character1.name} and {character2.name} interact in the scene."
        
        # Get relationship context
        relationship = character1.relationships.get(character2.name, "acquaintances")
        
        interaction_prompt = f"""Generate a natural interaction between these characters:

Character 1: {character1.name}
- Personality: {character1.get_personality_summary()}
- Speaking Style: {character1.speaking_style}

Character 2: {character2.name}
- Personality: {character2.get_personality_summary()}
- Speaking Style: {character2.speaking_style}

Relationship: {relationship}
Scene Context: {scene_context}

Generate a short dialogue exchange that shows their relationship and personalities:

Interaction:"""
        
        interaction_text, generation_time = await self.kobold_client.generate_text(
            interaction_prompt,
            self.kobold_client.DIALOGUE_CONFIG
        )
        
        return interaction_text
    
    async def validate_character_consistency(
        self,
        character: Character,
        generated_content: List[str]
    ) -> Tuple[bool, List[str]]:
        """Validate character consistency across generated content."""
        
        inconsistencies = []
        
        # Check personality consistency
        personality_summary = character.get_personality_summary().lower()
        personality_words = set(personality_summary.split())
        
        for content in generated_content:
            content_lower = content.lower()
            
            # Check for contradictory personality traits
            contradictions = {
                "friendly": ["hostile", "rude", "mean"],
                "shy": ["outgoing", "bold", "confident"],
                "brave": ["cowardly", "afraid", "scared"],
                "calm": ["angry", "furious", "rage"]
            }
            
            for trait in character.personality_traits:
                trait_lower = trait.lower()
                if trait_lower in contradictions:
                    for contradiction in contradictions[trait_lower]:
                        if contradiction in content_lower:
                            inconsistencies.append(
                                f"Character is described as {trait} but content suggests {contradiction}"
                            )
        
        # Check speaking style consistency
        if character.speaking_style:
            style_lower = character.speaking_style.lower()
            if "formal" in style_lower:
                informal_markers = ["gonna", "wanna", "ain't", "dunno"]
                for marker in informal_markers:
                    for content in generated_content:
                        if marker in content.lower():
                            inconsistencies.append(
                                f"Character has formal speaking style but uses informal language: '{marker}'"
                            )
        
        is_consistent = len(inconsistencies) == 0
        
        return is_consistent, inconsistencies
    
    async def get_character_statistics(self, character_id: int) -> Dict[str, Any]:
        """Get statistics and usage data for a character."""
        
        character = await self.db_service.get_character(character_id)
        if not character:
            return {}
        
        # This would query the database for usage statistics
        # For now, return basic info
        return {
            "character_id": character_id,
            "name": character.name,
            "personality_trait_count": len(character.personality_traits),
            "has_voice_profile": character.voice_profile_id is not None,
            "has_lora_model": character.lora_model_path is not None,
            "expression_count": len(character.emotion_mapping),
            "relationship_count": len(character.relationships)
        }
    
    def _analyze_personality_for_voice(self, personality_traits: List[str]) -> Dict[str, float]:
        """Analyze personality traits to determine voice characteristics."""
        
        voice_traits = {
            "speed": 1.0,
            "pitch": 1.0,
            "temperature": 0.7,
            "emotion": "neutral"
        }
        
        trait_adjustments = {
            # Speed adjustments
            "energetic": {"speed": 1.2},
            "calm": {"speed": 0.9},
            "excited": {"speed": 1.3},
            "relaxed": {"speed": 0.8},
            
            # Pitch adjustments
            "cheerful": {"pitch": 1.1},
            "serious": {"pitch": 0.9},
            "young": {"pitch": 1.15},
            "mature": {"pitch": 0.85},
            
            # Temperature adjustments
            "dramatic": {"temperature": 0.9},
            "monotone": {"temperature": 0.5},
            "expressive": {"temperature": 0.8}
        }
        
        for trait in personality_traits:
            trait_lower = trait.lower()
            if trait_lower in trait_adjustments:
                adjustments = trait_adjustments[trait_lower]
                for key, value in adjustments.items():
                    if key in voice_traits:
                        voice_traits[key] = value
        
        return voice_traits
    
    def _get_default_emotion_adjustments(self, personality_traits: List[str]) -> Dict[str, Dict[str, float]]:
        """Get default emotion adjustments based on personality."""
        
        base_adjustments = {
            "happy": {"speed": 1.1, "pitch": 1.1},
            "sad": {"speed": 0.8, "pitch": 0.9},
            "angry": {"speed": 1.2, "pitch": 0.9, "temperature": 0.9},
            "excited": {"speed": 1.3, "pitch": 1.2},
            "worried": {"speed": 0.9, "pitch": 1.0},
            "neutral": {"speed": 1.0, "pitch": 1.0}
        }
        
        # Modify based on personality
        if "dramatic" in personality_traits:
            for emotion in base_adjustments:
                base_adjustments[emotion]["temperature"] = 0.9
        
        if "shy" in personality_traits:
            for emotion in base_adjustments:
                base_adjustments[emotion]["speed"] *= 0.9
        
        return base_adjustments
    
    def _add_consistency_markers(
        self, 
        scene_prompt: str, 
        character: Character, 
        lora_model: Optional[LoRAModel]
    ) -> str:
        """Add character consistency markers to scene prompt."""
        
        consistency_elements = []
        
        # Add character description
        if character.visual_description:
            consistency_elements.append(character.visual_description)
        
        # Add LoRA trigger if available
        if lora_model and lora_model.is_ready:
            lora_trigger = f"<lora:{lora_model.trigger_word}:0.8>"
            consistency_elements.append(lora_trigger)
        
        # Combine with scene prompt
        if consistency_elements:
            character_prompt = ", ".join(consistency_elements)
            return f"{scene_prompt}, {character_prompt}"
        
        return scene_prompt
    
    async def _save_character_expression(self, expression: CharacterExpression) -> int:
        """Save character expression to database."""
        # This would interact with the database to save expressions
        # For now, we'll simulate the database operation
        return 1  # Placeholder return
    
    async def _save_voice_profile(self, voice_profile: VoiceProfile) -> int:
        """Save voice profile to database."""
        # This would interact with the database to save voice profiles
        # For now, we'll simulate the database operation
        return 1  # Placeholder return
    
    async def _get_character_lora_model(self, character_id: int) -> Optional[LoRAModel]:
        """Get LoRA model for character from database."""
        # This would query the database for existing LoRA models
        # For now, return None to indicate no existing model
        return None