"""
KoboldAI Script Generation Service for visual novel video creation.
"""

import asyncio
import json
import hashlib
from typing import Dict, List, Optional, Tuple
from datetime import datetime

from ..models.character import (
    Character, DialogueLine, Scene, StoryProject, GenerationSession, 
    SceneTemplate, EmotionType, CharacterPosition
)
from ..utils.kobold_client import KoboldAIClient, KoboldConfig
from .database_service import DatabaseService


class KoboldAIScriptGenerationService:
    """Service for generating scripts using KoboldAI for visual novels."""
    
    def __init__(self, kobold_url: str = "http://127.0.0.1:5000", db_service: Optional[DatabaseService] = None):
        """Initialize the script generation service."""
        self.kobold_url = kobold_url
        self.db_service = db_service or DatabaseService()
        self.client = None
        
    async def __aenter__(self):
        """Async context manager entry."""
        self.client = KoboldAIClient(self.kobold_url)
        await self.client.__aenter__()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.client:
            await self.client.__aexit__(exc_type, exc_val, exc_tb)
    
    async def check_availability(self) -> bool:
        """Check if KoboldAI service is available."""
        if not self.client:
            self.client = KoboldAIClient(self.kobold_url)
            await self.client.__aenter__()
        
        return await self.client.check_status()
    
    async def create_story_project(
        self, 
        title: str,
        premise: str,
        genre: str = "fantasy",
        tone: str = "dramatic",
        character_descriptions: Optional[List[str]] = None,
        target_length: int = 1000
    ) -> StoryProject:
        """Create a new story project with KoboldAI-generated content."""
        
        if not await self.check_availability():
            raise Exception("KoboldAI server is not available. Please ensure it's running on " + self.kobold_url)
        
        # Generate characters if not provided
        characters = []
        if character_descriptions:
            for desc in character_descriptions:
                character, session = await self.client.generate_character_profile(desc, genre)
                characters.append(character)
                # Save generation session to database
                if self.db_service:
                    await self.db_service.save_generation_session(session)
        else:
            # Generate default character set for the genre
            default_chars = self._get_default_characters_for_genre(genre)
            for char_desc in default_chars:
                character, session = await self.client.generate_character_profile(char_desc, genre)
                characters.append(character)
                if self.db_service:
                    await self.db_service.save_generation_session(session)
        
        # Generate story outline
        outline_text, outline_session = await self.client.generate_story_outline(premise, genre, characters)
        
        # Create story project
        story_project = StoryProject(
            title=title,
            genre=genre,
            theme=premise,
            tone=tone,
            target_length=target_length,
            generation_prompt=premise,
            story_outline=outline_text,
            characters=characters,
            status="draft"
        )
        
        # Save to database
        if self.db_service:
            project_id = await self.db_service.save_story_project(story_project)
            story_project.id = project_id
            outline_session.story_project_id = project_id
            await self.db_service.save_generation_session(outline_session)
        
        return story_project
    
    async def generate_scene_script(
        self,
        story_project: StoryProject,
        scene_description: str,
        characters_in_scene: List[str],
        scene_template: Optional[SceneTemplate] = None
    ) -> Tuple[List[DialogueLine], Scene, List[GenerationSession]]:
        """Generate a complete script for a scene."""
        
        if not await self.check_availability():
            raise Exception("KoboldAI server is not available")
        
        sessions = []
        
        # Get character objects for the scene
        scene_characters = []
        for char_name in characters_in_scene:
            character = story_project.get_character_by_name(char_name)
            if character:
                scene_characters.append(character)
        
        # Create scene object
        scene = Scene(
            id=self._generate_scene_id(scene_description),
            description=scene_description,
            characters_present=characters_in_scene
        )
        
        # Apply scene template if provided
        if scene_template:
            scene = scene_template.apply_to_scene(scene, characters_in_scene)
        
        # Generate detailed scene description
        detailed_description, scene_session = await self.client.expand_scene_description(
            scene_description, scene_characters, "visual novel"
        )
        scene.background_prompt = detailed_description
        sessions.append(scene_session)
        
        # Generate dialogue for the scene
        dialogue_text, dialogue_session = await self.client.generate_dialogue(
            scene_description, scene_characters, story_project.story_outline[:200]
        )
        sessions.append(dialogue_session)
        
        # Parse dialogue into script lines
        script_lines = self._parse_dialogue_to_script_lines(dialogue_text, scene, scene_characters)
        
        # Save sessions to database
        if self.db_service and story_project.id:
            for session in sessions:
                session.story_project_id = story_project.id
                await self.db_service.save_generation_session(session)
        
        return script_lines, scene, sessions
    
    async def expand_character_dialogue(
        self,
        character: Character,
        scene_context: str,
        existing_dialogue: List[str],
        emotional_state: str = "neutral"
    ) -> Tuple[str, GenerationSession]:
        """Generate additional dialogue for a specific character."""
        
        context_with_existing = f"{scene_context}\n\nExisting dialogue:\n" + "\n".join(existing_dialogue[-3:])
        
        return await self.client.suggest_character_actions(
            character, context_with_existing, emotional_state
        )
    
    async def generate_full_script_from_outline(
        self,
        story_project: StoryProject,
        scenes_to_generate: Optional[List[str]] = None
    ) -> Tuple[List[DialogueLine], List[Scene], List[GenerationSession]]:
        """Generate a complete script from a story outline."""
        
        if not story_project.story_outline:
            raise ValueError("Story project must have an outline to generate script")
        
        # Extract scenes from outline if not specified
        if not scenes_to_generate:
            scenes_to_generate = self._extract_scenes_from_outline(story_project.story_outline)
        
        all_script_lines = []
        all_scenes = []
        all_sessions = []
        
        line_order = 0
        
        for scene_desc in scenes_to_generate:
            # Determine which characters should be in this scene
            characters_in_scene = self._determine_scene_characters(scene_desc, story_project.characters)
            
            # Generate scene script
            script_lines, scene, sessions = await self.generate_scene_script(
                story_project, scene_desc, characters_in_scene
            )
            
            # Update line orders
            for line in script_lines:
                line.line_order = line_order
                line_order += 1
            
            all_script_lines.extend(script_lines)
            all_scenes.append(scene)
            all_sessions.extend(sessions)
        
        return all_script_lines, all_scenes, all_sessions
    
    async def refine_character_consistency(
        self,
        story_project: StoryProject,
        character_name: str,
        inconsistencies: List[str]
    ) -> Tuple[Character, GenerationSession]:
        """Refine character consistency based on detected inconsistencies."""
        
        character = story_project.get_character_by_name(character_name)
        if not character:
            raise ValueError(f"Character {character_name} not found in story project")
        
        consistency_prompt = f"""Character: {character.name}
Current personality: {character.get_personality_summary()}
Background: {character.background_story}
Speaking style: {character.speaking_style}

Detected inconsistencies:
{chr(10).join(f"- {inc}" for inc in inconsistencies)}

Please provide refined character details that resolve these inconsistencies while maintaining the core character identity:

Refined Character:"""
        
        generated_text, generation_time = await self.client.generate_text(
            consistency_prompt,
            KoboldConfig(temperature=0.6, max_length=400)
        )
        
        # Update character based on generated refinements
        refined_character = self._apply_character_refinements(character, generated_text)
        
        session = GenerationSession(
            story_project_id=story_project.id or 0,
            session_type="character_refinement",
            input_prompt=consistency_prompt,
            generated_content=generated_text,
            generation_config={"temperature": 0.6, "max_length": 400},
            generation_time_ms=generation_time
        )
        
        if self.db_service and story_project.id:
            await self.db_service.save_generation_session(session)
        
        return refined_character, session
    
    def _get_default_characters_for_genre(self, genre: str) -> List[str]:
        """Get default character descriptions for different genres."""
        defaults = {
            "fantasy": [
                "A brave young hero with a mysterious past and strong moral compass",
                "A wise mentor figure with magical knowledge and protective nature",
                "A complex antagonist with understandable motivations"
            ],
            "romance": [
                "A charming protagonist with hidden vulnerabilities and romantic ideals",
                "An intriguing love interest with contrasting personality and mysterious background",
                "A supportive best friend who provides advice and comic relief"
            ],
            "sci-fi": [
                "A brilliant scientist or engineer with curiosity about the unknown",
                "A pragmatic military or security officer with strong leadership skills",
                "An AI or alien character with unique perspective on humanity"
            ],
            "mystery": [
                "A perceptive detective or investigator with keen observation skills",
                "A suspicious character with hidden connections to the case",
                "A knowledgeable local who provides crucial information"
            ]
        }
        
        return defaults.get(genre, defaults["fantasy"])
    
    def _generate_scene_id(self, description: str) -> str:
        """Generate a unique scene ID from description."""
        return hashlib.md5(description.encode()).hexdigest()[:8]
    
    def _extract_scenes_from_outline(self, outline: str) -> List[str]:
        """Extract scene descriptions from a story outline."""
        lines = outline.split('\n')
        scenes = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Look for scene markers
            if any(marker in line.lower() for marker in ['scene', 'chapter', 'act', '-']):
                if len(line) > 10 and not line.startswith('#'):  # Avoid headers
                    # Clean up the scene description
                    scene_desc = line
                    for prefix in ['Scene:', 'Chapter:', 'Act:', '-', '*']:
                        scene_desc = scene_desc.strip().lstrip(prefix).strip()
                    
                    if scene_desc and len(scene_desc) > 5:
                        scenes.append(scene_desc)
        
        # If no clear scenes found, split outline into paragraphs
        if not scenes:
            paragraphs = [p.strip() for p in outline.split('\n\n') if p.strip()]
            scenes = [p[:200] + "..." if len(p) > 200 else p for p in paragraphs[:5]]
        
        return scenes[:10]  # Limit to 10 scenes maximum
    
    def _determine_scene_characters(self, scene_description: str, all_characters: List[Character]) -> List[str]:
        """Determine which characters should appear in a scene."""
        scene_lower = scene_description.lower()
        characters_in_scene = []
        
        # Check if character names are mentioned in scene
        for character in all_characters:
            if character.name.lower() in scene_lower:
                characters_in_scene.append(character.name)
        
        # If no characters found, include main characters
        if not characters_in_scene:
            main_chars = all_characters[:2]  # Take first 2 characters as main
            characters_in_scene = [char.name for char in main_chars]
        
        # Always include narrator if available
        narrator = next((c.name for c in all_characters if 'narrator' in c.name.lower()), None)
        if narrator and narrator not in characters_in_scene:
            characters_in_scene.insert(0, narrator)
        
        return characters_in_scene[:3]  # Limit to 3 characters per scene
    
    def _parse_dialogue_to_script_lines(
        self,
        dialogue_text: str,
        scene: Scene,
        characters: List[Character]
    ) -> List[DialogueLine]:
        """Parse generated dialogue text into structured script lines."""
        lines = dialogue_text.split('\n')
        script_lines = []
        line_order = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Parse character dialogue (Character: dialogue)
            if ':' in line and not line.startswith('*') and not line.startswith('['):
                parts = line.split(':', 1)
                char_name = parts[0].strip()
                content = parts[1].strip()
                
                # Find matching character
                character = None
                for char in characters:
                    if char_name.lower() in char.name.lower() or char.name.lower() in char_name.lower():
                        character = char
                        break
                
                # Determine emotion from content
                emotion = self._detect_emotion_from_content(content)
                
                # Determine character position
                position = scene.get_character_position(character.name if character else char_name)
                
                script_line = DialogueLine(
                    line_order=line_order,
                    content=content,
                    scene_id=scene.id,
                    character_name=character.name if character else char_name,
                    character_emotion=emotion,
                    background_prompt=scene.background_prompt,
                    character_position=position
                )
                
                script_lines.append(script_line)
                line_order += 1
            
            # Parse narration (lines without character names or with stage directions)
            elif line and not line.startswith('*'):
                script_line = DialogueLine(
                    line_order=line_order,
                    content=line,
                    scene_id=scene.id,
                    character_name=None,  # Narration
                    character_emotion=EmotionType.NEUTRAL,
                    background_prompt=scene.background_prompt,
                    character_position=CharacterPosition.CENTER
                )
                
                script_lines.append(script_line)
                line_order += 1
        
        return script_lines
    
    def _detect_emotion_from_content(self, content: str) -> EmotionType:
        """Detect emotion from dialogue content."""
        content_lower = content.lower()
        
        # Emotional indicators
        emotions = {
            EmotionType.HAPPY: ['happy', 'joy', 'smile', 'laugh', 'excited', 'wonderful', 'great'],
            EmotionType.SAD: ['sad', 'cry', 'tear', 'sorrow', 'depressed', 'miserable'],
            EmotionType.ANGRY: ['angry', 'mad', 'furious', 'rage', 'hate', 'damn'],
            EmotionType.SURPRISED: ['what', 'wow', 'oh', 'really', 'amazing', 'incredible'],
            EmotionType.WORRIED: ['worry', 'concern', 'afraid', 'scared', 'nervous', 'anxious'],
            EmotionType.CONFUSED: ['confused', 'don\'t understand', 'what do you mean', 'huh'],
            EmotionType.EXCITED: ['excited', 'can\'t wait', 'amazing', 'awesome', 'incredible'],
            EmotionType.DETERMINED: ['will', 'must', 'determined', 'won\'t give up', 'definitely']
        }
        
        for emotion, keywords in emotions.items():
            if any(keyword in content_lower for keyword in keywords):
                return emotion
        
        # Check punctuation
        if content.endswith('!'):
            return EmotionType.EXCITED
        elif content.endswith('?'):
            return EmotionType.CONFUSED
        
        return EmotionType.NEUTRAL
    
    def _apply_character_refinements(self, character: Character, refinement_text: str) -> Character:
        """Apply character refinements from generated text."""
        # This is a simplified implementation
        # In production, you'd want more sophisticated parsing
        
        refined = Character(
            id=character.id,
            name=character.name,
            description=character.description,
            personality_traits=character.personality_traits.copy(),
            background_story=character.background_story,
            speaking_style=character.speaking_style,
            visual_description=character.visual_description,
            voice_profile_id=character.voice_profile_id,
            emotion_mapping=character.emotion_mapping.copy(),
            relationships=character.relationships.copy(),
            lora_model_path=character.lora_model_path
        )
        
        # Look for updated personality traits
        if "personality:" in refinement_text.lower():
            personality_section = refinement_text.lower().split("personality:")[1].split("\n")[0]
            new_traits = [t.strip() for t in personality_section.split(",") if t.strip()]
            if new_traits:
                refined.personality_traits = new_traits
        
        # Look for updated speaking style
        if "speaking:" in refinement_text.lower():
            speaking_section = refinement_text.lower().split("speaking:")[1].split("\n")[0]
            if speaking_section.strip():
                refined.speaking_style = speaking_section.strip()
        
        return refined