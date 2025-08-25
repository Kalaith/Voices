"""
Database service for video generation backend.
Connects to the same MySQL database as the PHP backend.
"""

import asyncio
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
import mysql.connector
from mysql.connector import Error

from ..models.character import (
    Character, StoryProject, GenerationSession, DialogueLine, 
    Scene, LoRAModel, CharacterExpression, VoiceProfile
)


class DatabaseService:
    """Service for database operations."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize database service with connection config."""
        self.config = config or {
            'host': 'localhost',
            'database': 'voices',
            'user': 'root',
            'password': '',
            'charset': 'utf8mb4',
            'autocommit': True
        }
        self.connection = None
    
    async def connect(self):
        """Establish database connection."""
        try:
            self.connection = mysql.connector.connect(**self.config)
            return self.connection.is_connected()
        except Error as e:
            print(f"Database connection error: {e}")
            return False
    
    async def disconnect(self):
        """Close database connection."""
        if self.connection and self.connection.is_connected():
            self.connection.close()
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.disconnect()
    
    def _ensure_connection(self):
        """Ensure database connection is active."""
        if not self.connection or not self.connection.is_connected():
            self.connection = mysql.connector.connect(**self.config)
    
    async def save_story_project(self, project: StoryProject) -> int:
        """Save story project to database."""
        self._ensure_connection()
        
        cursor = self.connection.cursor()
        try:
            query = """
                INSERT INTO story_projects 
                (title, genre, theme, setting_description, tone, target_length, 
                 llm_model, generation_prompt, story_outline, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                project.title,
                project.genre,
                project.theme,
                project.setting_description,
                project.tone,
                project.target_length,
                project.llm_model,
                project.generation_prompt,
                project.story_outline,
                project.status
            )
            
            cursor.execute(query, values)
            project_id = cursor.lastrowid
            
            # Save associated characters
            for character in project.characters:
                character_id = await self.save_character(character)
                # Link character to story
                link_query = """
                    INSERT INTO story_characters (story_project_id, character_id, role)
                    VALUES (%s, %s, %s)
                """
                cursor.execute(link_query, (project_id, character_id, "main"))
            
            return project_id
            
        except Error as e:
            print(f"Error saving story project: {e}")
            raise
        finally:
            cursor.close()
    
    async def get_story_project(self, project_id: int) -> Optional[StoryProject]:
        """Get story project by ID."""
        self._ensure_connection()
        
        cursor = self.connection.cursor(dictionary=True)
        try:
            # Get project
            query = "SELECT * FROM story_projects WHERE id = %s"
            cursor.execute(query, (project_id,))
            project_data = cursor.fetchone()
            
            if not project_data:
                return None
            
            # Get associated characters
            char_query = """
                SELECT cp.* FROM character_profiles cp
                JOIN story_characters sc ON cp.id = sc.character_id
                WHERE sc.story_project_id = %s
            """
            cursor.execute(char_query, (project_id,))
            character_data = cursor.fetchall()
            
            characters = []
            for char_data in character_data:
                character = self._character_from_db(char_data)
                characters.append(character)
            
            project = StoryProject(
                id=project_data['id'],
                title=project_data['title'],
                genre=project_data['genre'] or "",
                theme=project_data['theme'] or "",
                setting_description=project_data['setting_description'] or "",
                tone=project_data['tone'] or "",
                target_length=project_data['target_length'],
                llm_model=project_data['llm_model'],
                generation_prompt=project_data['generation_prompt'] or "",
                story_outline=project_data['story_outline'] or "",
                status=project_data['status'],
                characters=characters
            )
            
            return project
            
        except Error as e:
            print(f"Error getting story project: {e}")
            return None
        finally:
            cursor.close()
    
    async def save_character(self, character: Character) -> int:
        """Save character to database."""
        self._ensure_connection()
        
        cursor = self.connection.cursor()
        try:
            if character.id:
                # Update existing character
                query = """
                    UPDATE character_profiles SET
                    name = %s, description = %s, personality_traits = %s,
                    background_story = %s, speaking_style = %s, visual_description = %s,
                    voice_profile_id = %s, base_portrait_url = %s, emotion_mapping = %s,
                    relationships = %s, lora_model_path = %s, lora_trigger_word = %s
                    WHERE id = %s
                """
                values = (
                    character.name,
                    character.description,
                    json.dumps(character.personality_traits),
                    character.background_story,
                    character.speaking_style,
                    character.visual_description,
                    character.voice_profile_id,
                    character.base_portrait_url,
                    json.dumps(character.emotion_mapping),
                    json.dumps(character.relationships),
                    character.lora_model_path,
                    character.lora_trigger_word,
                    character.id
                )
                cursor.execute(query, values)
                return character.id
            else:
                # Insert new character
                query = """
                    INSERT INTO character_profiles 
                    (name, description, personality_traits, background_story, speaking_style,
                     visual_description, voice_profile_id, base_portrait_url, emotion_mapping,
                     relationships, lora_model_path, lora_trigger_word)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                values = (
                    character.name,
                    character.description,
                    json.dumps(character.personality_traits),
                    character.background_story,
                    character.speaking_style,
                    character.visual_description,
                    character.voice_profile_id,
                    character.base_portrait_url,
                    json.dumps(character.emotion_mapping),
                    json.dumps(character.relationships),
                    character.lora_model_path,
                    character.lora_trigger_word
                )
                cursor.execute(query, values)
                return cursor.lastrowid
                
        except Error as e:
            print(f"Error saving character: {e}")
            raise
        finally:
            cursor.close()
    
    async def get_character(self, character_id: int) -> Optional[Character]:
        """Get character by ID."""
        self._ensure_connection()
        
        cursor = self.connection.cursor(dictionary=True)
        try:
            query = "SELECT * FROM character_profiles WHERE id = %s"
            cursor.execute(query, (character_id,))
            char_data = cursor.fetchone()
            
            if not char_data:
                return None
            
            return self._character_from_db(char_data)
            
        except Error as e:
            print(f"Error getting character: {e}")
            return None
        finally:
            cursor.close()
    
    async def save_generation_session(self, session: GenerationSession) -> int:
        """Save generation session to database."""
        self._ensure_connection()
        
        cursor = self.connection.cursor()
        try:
            query = """
                INSERT INTO kobold_generation_sessions
                (story_project_id, session_type, input_prompt, generated_content,
                 generation_config, model_info, generation_time_ms, quality_rating)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                session.story_project_id,
                session.session_type,
                session.input_prompt,
                session.generated_content,
                json.dumps(session.generation_config),
                json.dumps(session.model_info),
                session.generation_time_ms,
                session.quality_rating
            )
            
            cursor.execute(query, values)
            return cursor.lastrowid
            
        except Error as e:
            print(f"Error saving generation session: {e}")
            raise
        finally:
            cursor.close()
    
    async def save_script_lines(self, script_lines: List[DialogueLine], script_id: int) -> bool:
        """Save script lines to database."""
        self._ensure_connection()
        
        cursor = self.connection.cursor()
        try:
            # Clear existing script lines for this script
            cursor.execute("DELETE FROM script_lines WHERE script_id = %s", (script_id,))
            
            # Insert new script lines
            query = """
                INSERT INTO script_lines
                (script_id, line_order, content, scene_id, character_name,
                 character_emotion, background_prompt, character_position)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            for line in script_lines:
                values = (
                    script_id,
                    line.line_order,
                    line.content,
                    line.scene_id,
                    line.character_name,
                    line.character_emotion.value if line.character_emotion else 'neutral',
                    line.background_prompt,
                    line.character_position.value if line.character_position else 'center'
                )
                cursor.execute(query, values)
            
            return True
            
        except Error as e:
            print(f"Error saving script lines: {e}")
            return False
        finally:
            cursor.close()
    
    async def save_lora_model(self, lora_model: LoRAModel) -> int:
        """Save LoRA model information."""
        self._ensure_connection()
        
        cursor = self.connection.cursor()
        try:
            query = """
                INSERT INTO character_lora_models
                (character_id, model_name, model_path, trigger_word,
                 training_images_count, model_version, training_status,
                 training_config, validation_score)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                model_path = VALUES(model_path),
                training_status = VALUES(training_status),
                validation_score = VALUES(validation_score)
            """
            values = (
                lora_model.character_id,
                lora_model.model_name,
                lora_model.model_path,
                lora_model.trigger_word,
                lora_model.training_images_count,
                lora_model.model_version,
                lora_model.training_status,
                json.dumps(lora_model.training_config),
                lora_model.validation_score
            )
            
            cursor.execute(query, values)
            return cursor.lastrowid
            
        except Error as e:
            print(f"Error saving LoRA model: {e}")
            raise
        finally:
            cursor.close()
    
    async def get_characters_by_story(self, story_project_id: int) -> List[Character]:
        """Get all characters associated with a story project."""
        self._ensure_connection()
        
        cursor = self.connection.cursor(dictionary=True)
        try:
            query = """
                SELECT cp.* FROM character_profiles cp
                JOIN story_characters sc ON cp.id = sc.character_id
                WHERE sc.story_project_id = %s
                ORDER BY sc.importance_level DESC
            """
            cursor.execute(query, (story_project_id,))
            character_data = cursor.fetchall()
            
            characters = []
            for char_data in character_data:
                character = self._character_from_db(char_data)
                characters.append(character)
            
            return characters
            
        except Error as e:
            print(f"Error getting characters by story: {e}")
            return []
        finally:
            cursor.close()
    
    async def update_story_project_status(self, project_id: int, status: str) -> bool:
        """Update story project status."""
        self._ensure_connection()
        
        cursor = self.connection.cursor()
        try:
            query = "UPDATE story_projects SET status = %s WHERE id = %s"
            cursor.execute(query, (status, project_id))
            return cursor.rowcount > 0
            
        except Error as e:
            print(f"Error updating story project status: {e}")
            return False
        finally:
            cursor.close()
    
    def _character_from_db(self, char_data: Dict[str, Any]) -> Character:
        """Convert database character data to Character object."""
        personality_traits = []
        if char_data.get('personality_traits'):
            try:
                personality_traits = json.loads(char_data['personality_traits'])
            except (json.JSONDecodeError, TypeError):
                personality_traits = []
        
        emotion_mapping = {}
        if char_data.get('emotion_mapping'):
            try:
                emotion_mapping = json.loads(char_data['emotion_mapping'])
            except (json.JSONDecodeError, TypeError):
                emotion_mapping = {}
        
        relationships = {}
        if char_data.get('relationships'):
            try:
                relationships = json.loads(char_data['relationships'])
            except (json.JSONDecodeError, TypeError):
                relationships = {}
        
        return Character(
            id=char_data['id'],
            name=char_data['name'],
            description=char_data.get('description', ''),
            personality_traits=personality_traits,
            background_story=char_data.get('background_story', ''),
            speaking_style=char_data.get('speaking_style', ''),
            visual_description=char_data.get('visual_description', ''),
            voice_profile_id=char_data.get('voice_profile_id'),
            base_portrait_url=char_data.get('base_portrait_url'),
            emotion_mapping=emotion_mapping,
            relationships=relationships,
            lora_model_path=char_data.get('lora_model_path'),
            lora_trigger_word=char_data.get('lora_trigger_word')
        )