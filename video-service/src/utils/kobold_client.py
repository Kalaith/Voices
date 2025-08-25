"""
KoboldAI API Client for story and script generation.
"""

import asyncio
import httpx
import json
import time
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from ..models.character import Character, StoryProject, GenerationSession


@dataclass
class KoboldConfig:
    """Configuration for KoboldAI generation."""
    temperature: float = 0.7
    top_p: float = 0.9
    top_k: int = 50
    rep_pen: float = 1.1
    rep_pen_range: int = 1024
    rep_pen_slope: float = 0.9
    max_length: int = 200
    sampler_order: List[int] = None
    
    def __post_init__(self):
        if self.sampler_order is None:
            self.sampler_order = [6, 0, 1, 2, 3, 4, 5]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API calls."""
        return {
            "temperature": self.temperature,
            "top_p": self.top_p,
            "top_k": self.top_k,
            "rep_pen": self.rep_pen,
            "rep_pen_range": self.rep_pen_range,
            "rep_pen_slope": self.rep_pen_slope,
            "max_length": self.max_length,
            "sampler_order": self.sampler_order
        }


class KoboldAIClient:
    """Client for interacting with KoboldAI API."""
    
    # Optimized configs for different generation types
    STORY_CONFIG = KoboldConfig(
        temperature=0.8,
        top_p=0.9,
        rep_pen=1.1,
        rep_pen_range=1024,
        max_length=500
    )
    
    DIALOGUE_CONFIG = KoboldConfig(
        temperature=0.9,
        top_p=0.85,
        rep_pen=1.15,
        rep_pen_range=512,
        max_length=300
    )
    
    SCENE_CONFIG = KoboldConfig(
        temperature=0.7,
        top_p=0.9,
        rep_pen=1.05,
        rep_pen_range=1024,
        max_length=400
    )
    
    def __init__(self, kobold_url: str = "http://127.0.0.1:5000"):
        """Initialize KoboldAI client."""
        self.api_url = f"{kobold_url}/api"
        self.client = httpx.AsyncClient(timeout=120.0)  # 2 minute timeout
        self.model_info = {}
        
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.client.aclose()
    
    async def check_status(self) -> bool:
        """Check if KoboldAI server is running and accessible."""
        try:
            response = await self.client.get(f"{self.api_url}/v1/info/version")
            if response.status_code == 200:
                version_info = response.json()
                self.model_info = await self.get_model_info()
                return True
            return False
        except Exception as e:
            print(f"KoboldAI connection error: {e}")
            return False
    
    async def get_model_info(self) -> Dict[str, Any]:
        """Get current model information."""
        try:
            response = await self.client.get(f"{self.api_url}/v1/model")
            if response.status_code == 200:
                return response.json()
            return {}
        except Exception:
            return {}
    
    async def generate_text(
        self, 
        prompt: str, 
        config: Optional[KoboldConfig] = None
    ) -> tuple[str, int]:
        """
        Generate text using KoboldAI.
        
        Returns:
            Tuple of (generated_text, generation_time_ms)
        """
        if config is None:
            config = KoboldConfig()
        
        payload = {
            "prompt": prompt,
            **config.to_dict()
        }
        
        start_time = time.time()
        
        try:
            response = await self.client.post(f"{self.api_url}/v1/generate", json=payload)
            response.raise_for_status()
            
            generation_time_ms = int((time.time() - start_time) * 1000)
            result = response.json()
            
            generated_text = ""
            if "results" in result and len(result["results"]) > 0:
                generated_text = result["results"][0].get("text", "").strip()
            
            return generated_text, generation_time_ms
            
        except httpx.HTTPStatusError as e:
            raise Exception(f"KoboldAI API error: {e.response.status_code} - {e.response.text}")
        except Exception as e:
            raise Exception(f"KoboldAI generation failed: {e}")
    
    async def generate_story_outline(
        self, 
        prompt: str, 
        genre: str, 
        characters: List[Character]
    ) -> tuple[str, GenerationSession]:
        """Generate a story outline using KoboldAI."""
        character_descriptions = []
        for char in characters:
            desc = f"{char.name}: {char.get_personality_summary()}"
            if char.background_story:
                desc += f". {char.background_story[:100]}..."
            character_descriptions.append(desc)
        
        generation_prompt = f"""Create a {genre} story outline with these characters:
{chr(10).join(character_descriptions)}

Story premise: {prompt}

Generate a structured outline with:
- Main plot points
- Character interactions  
- Scene descriptions
- Dramatic moments

Story Outline:"""
        
        generated_text, generation_time = await self.generate_text(
            generation_prompt, 
            self.STORY_CONFIG
        )
        
        session = GenerationSession(
            session_type="story_outline",
            input_prompt=generation_prompt,
            generated_content=generated_text,
            generation_config=self.STORY_CONFIG.to_dict(),
            model_info=self.model_info,
            generation_time_ms=generation_time
        )
        
        return generated_text, session
    
    async def generate_dialogue(
        self, 
        scene_description: str, 
        characters: List[Character],
        context: str = ""
    ) -> tuple[str, GenerationSession]:
        """Generate dialogue for a scene."""
        character_info = {}
        for char in characters:
            info_parts = []
            if char.personality_traits:
                info_parts.append(f"Personality: {', '.join(char.personality_traits[:3])}")
            if char.speaking_style:
                info_parts.append(f"Speaking style: {char.speaking_style}")
            character_info[char.name] = ". ".join(info_parts)
        
        character_list = "\n".join([
            f"{name}: {info}" for name, info in character_info.items()
        ])
        
        dialogue_prompt = f"""Scene: {scene_description}
Characters present: {', '.join([c.name for c in characters])}

Character Information:
{character_list}

{f"Context: {context}" if context else ""}

Generate natural dialogue for this scene with character names:

Dialogue:"""
        
        generated_text, generation_time = await self.generate_text(
            dialogue_prompt,
            self.DIALOGUE_CONFIG
        )
        
        session = GenerationSession(
            session_type="dialogue",
            input_prompt=dialogue_prompt,
            generated_content=generated_text,
            generation_config=self.DIALOGUE_CONFIG.to_dict(),
            model_info=self.model_info,
            generation_time_ms=generation_time
        )
        
        return generated_text, session
    
    async def expand_scene_description(
        self, 
        summary: str, 
        characters: List[Character],
        style: str = "visual novel"
    ) -> tuple[str, GenerationSession]:
        """Generate detailed scene descriptions."""
        scene_prompt = f"""Expand this scene summary into a detailed description suitable for a {style}:

Scene Summary: {summary}
Characters: {', '.join([c.name for c in characters])}

Include:
- Detailed setting and background description
- Character positions and actions  
- Mood and atmosphere
- Visual elements for scene composition
- Lighting and color palette suggestions

Detailed Scene Description:"""
        
        generated_text, generation_time = await self.generate_text(
            scene_prompt,
            self.SCENE_CONFIG
        )
        
        session = GenerationSession(
            session_type="scene_description",
            input_prompt=scene_prompt,
            generated_content=generated_text,
            generation_config=self.SCENE_CONFIG.to_dict(),
            model_info=self.model_info,
            generation_time_ms=generation_time
        )
        
        return generated_text, session
    
    async def suggest_character_actions(
        self, 
        character: Character, 
        scene_context: str,
        emotional_state: str = "neutral"
    ) -> tuple[str, GenerationSession]:
        """Generate character-appropriate actions."""
        action_prompt = f"""Character: {character.name}
Personality: {character.get_personality_summary()}
Background: {character.background_story[:200] if character.background_story else "Unknown background"}
Current emotional state: {emotional_state}

Scene context: {scene_context}

Based on {character.name}'s personality and the current situation, suggest 3-5 appropriate actions or responses they might take:

Character Actions:"""
        
        generated_text, generation_time = await self.generate_text(
            action_prompt,
            KoboldConfig(temperature=0.8, max_length=250)
        )
        
        session = GenerationSession(
            session_type="character_action",
            input_prompt=action_prompt,
            generated_content=generated_text,
            generation_config={"temperature": 0.8, "max_length": 250},
            model_info=self.model_info,
            generation_time_ms=generation_time
        )
        
        return generated_text, session
    
    async def generate_character_profile(
        self, 
        character_description: str, 
        genre: str = "fantasy"
    ) -> tuple[Character, GenerationSession]:
        """Generate a complete character profile from a description."""
        profile_prompt = f"""Create a detailed character profile for a {genre} story:

Basic Description: {character_description}

Generate:
- Full name
- Personality traits (5-7 key traits)
- Background story (2-3 sentences)
- Speaking style and manner
- Physical appearance description
- Key relationships or connections
- Character motivations

Character Profile:"""
        
        generated_text, generation_time = await self.generate_text(
            profile_prompt,
            KoboldConfig(temperature=0.7, max_length=600)
        )
        
        # Parse the generated text into Character object
        character = self._parse_character_profile(generated_text, character_description)
        
        session = GenerationSession(
            session_type="character_profile",
            input_prompt=profile_prompt,
            generated_content=generated_text,
            generation_config={"temperature": 0.7, "max_length": 600},
            model_info=self.model_info,
            generation_time_ms=generation_time
        )
        
        return character, session
    
    def _parse_character_profile(self, generated_text: str, original_desc: str) -> Character:
        """Parse generated character profile text into Character object."""
        # This is a simplified parser - in production, you'd want more robust parsing
        lines = generated_text.split('\n')
        
        character = Character(
            description=original_desc,
            personality_traits=[],
            background_story="",
            speaking_style="",
            visual_description=""
        )
        
        current_section = None
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if "name:" in line.lower():
                character.name = line.split(":", 1)[1].strip()
            elif "personality" in line.lower() and ":" in line:
                current_section = "personality"
            elif "background" in line.lower() and ":" in line:
                current_section = "background"
            elif "speaking" in line.lower() and ":" in line:
                current_section = "speaking"
            elif "appearance" in line.lower() and ":" in line:
                current_section = "appearance"
            elif current_section == "personality" and line:
                # Extract personality traits
                if ":" in line:
                    traits = line.split(":", 1)[1].strip()
                else:
                    traits = line
                character.personality_traits.extend([
                    t.strip() for t in traits.split(",") if t.strip()
                ])
            elif current_section == "background" and line:
                if character.background_story:
                    character.background_story += " " + line
                else:
                    character.background_story = line.split(":", 1)[-1].strip()
            elif current_section == "speaking" and line:
                if character.speaking_style:
                    character.speaking_style += " " + line
                else:
                    character.speaking_style = line.split(":", 1)[-1].strip()
            elif current_section == "appearance" and line:
                if character.visual_description:
                    character.visual_description += " " + line
                else:
                    character.visual_description = line.split(":", 1)[-1].strip()
        
        # Ensure we have at least a name
        if not character.name:
            character.name = "Generated Character"
        
        return character


# Utility functions for common generation patterns
async def quick_story_generation(
    premise: str,
    genre: str = "fantasy",
    character_count: int = 2,
    kobold_url: str = "http://127.0.0.1:5000"
) -> tuple[StoryProject, List[GenerationSession]]:
    """Quickly generate a story project with characters and outline."""
    
    async with KoboldAIClient(kobold_url) as client:
        if not await client.check_status():
            raise Exception("KoboldAI server is not available")
        
        sessions = []
        
        # Generate main characters
        characters = []
        for i in range(character_count):
            character_desc = f"Character {i+1} for {genre} story: {premise}"
            character, session = await client.generate_character_profile(character_desc, genre)
            characters.append(character)
            sessions.append(session)
        
        # Generate story outline
        outline_text, outline_session = await client.generate_story_outline(premise, genre, characters)
        sessions.append(outline_session)
        
        # Create story project
        story_project = StoryProject(
            title=f"Generated {genre.title()} Story",
            genre=genre,
            theme=premise,
            generation_prompt=premise,
            story_outline=outline_text,
            characters=characters
        )
        
        return story_project, sessions