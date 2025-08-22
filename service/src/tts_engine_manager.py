import logging
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum

from src.tts_engine_base import TTSEngine
from src.chatts_engine import ChatTTSEngine  
from src.chatterbox_engine import ChatterboxEngine
from models.audio_models import Voice

logger = logging.getLogger(__name__)

class TTSEngineType(Enum):
    CHATTS = "chatts"
    CHATTERBOX = "chatterbox"

class TTSEngineManager:
    """Manager for multiple TTS engines"""
    
    def __init__(self):
        self.engines: Dict[str, TTSEngine] = {}
        self.current_engine: Optional[str] = None
        self._initialize_engines()
    
    def _initialize_engines(self):
        """Initialize all available TTS engines"""
        logger.info("Initializing TTS engines...")
        
        # Initialize ChatTTS engine
        try:
            chatts_engine = ChatTTSEngine()
            if chatts_engine.initialize():
                self.engines[TTSEngineType.CHATTS.value] = chatts_engine
                logger.info("ChatTTS engine initialized successfully")
                
                # Set as default if no current engine
                if not self.current_engine:
                    self.current_engine = TTSEngineType.CHATTS.value
            else:
                logger.warning("Failed to initialize ChatTTS engine")
        except Exception as e:
            logger.error(f"Error initializing ChatTTS engine: {e}")
        
        # Initialize Chatterbox engine
        try:
            chatterbox_engine = ChatterboxEngine()
            if chatterbox_engine.initialize():
                self.engines[TTSEngineType.CHATTERBOX.value] = chatterbox_engine
                logger.info("Chatterbox engine initialized successfully")
                
                # Set as default if no current engine (fallback)
                if not self.current_engine:
                    self.current_engine = TTSEngineType.CHATTERBOX.value
            else:
                logger.warning("Failed to initialize Chatterbox engine")
        except Exception as e:
            logger.error(f"Error initializing Chatterbox engine: {e}")
        
        if not self.engines:
            logger.error("No TTS engines available!")
        else:
            logger.info(f"Initialized {len(self.engines)} TTS engines: {list(self.engines.keys())}")
            logger.info(f"Current engine: {self.current_engine}")
    
    def get_available_engines(self) -> List[str]:
        """Get list of available engine names"""
        return list(self.engines.keys())
    
    def get_current_engine(self) -> Optional[str]:
        """Get current active engine name"""
        return self.current_engine
    
    def set_current_engine(self, engine_name: str) -> bool:
        """Set the current active engine"""
        if engine_name in self.engines:
            self.current_engine = engine_name
            logger.info(f"Switched to TTS engine: {engine_name}")
            return True
        else:
            logger.error(f"Engine {engine_name} not available. Available: {list(self.engines.keys())}")
            return False
    
    def get_engine_info(self, engine_name: Optional[str] = None) -> Dict[str, Any]:
        """Get information about a specific engine or all engines"""
        if engine_name:
            if engine_name in self.engines:
                return self.engines[engine_name].get_engine_info()
            else:
                return {"error": f"Engine {engine_name} not found"}
        else:
            return {
                "engines": {name: engine.get_engine_info() for name, engine in self.engines.items()},
                "current_engine": self.current_engine
            }
    
    def get_engine_health(self, engine_name: Optional[str] = None) -> Dict[str, Any]:
        """Get health status for engines"""
        if engine_name:
            if engine_name in self.engines:
                return self.engines[engine_name].get_health_status()
            else:
                return {"error": f"Engine {engine_name} not found"}
        else:
            return {
                engine_name: engine.get_health_status() 
                for engine_name, engine in self.engines.items()
            }
    
    def generate_audio(
        self, 
        text: str, 
        voice: Voice, 
        engine_name: Optional[str] = None
    ) -> Tuple[Optional[str], Optional[str]]:
        """Generate audio using specified or current engine"""
        target_engine = engine_name or self.current_engine
        
        if not target_engine:
            return None, "No TTS engine available"
        
        if target_engine not in self.engines:
            return None, f"TTS engine '{target_engine}' not available"
        
        engine = self.engines[target_engine]
        logger.info(f"Generating audio with engine: {target_engine}")
        
        return engine.generate_audio(text, voice)
    
    def generate_script_audio(
        self,
        script_lines: List[Tuple[str, Voice]],
        combine: bool = True,
        engine_name: Optional[str] = None
    ) -> Tuple[Optional[List[str]], Optional[str]]:
        """Generate script audio using specified or current engine"""
        target_engine = engine_name or self.current_engine
        
        if not target_engine:
            return None, "No TTS engine available"
        
        if target_engine not in self.engines:
            return None, f"TTS engine '{target_engine}' not available"
        
        engine = self.engines[target_engine]
        logger.info(f"Generating script audio with engine: {target_engine}")
        
        return engine.generate_script_audio(script_lines, combine)
    
    def get_supported_parameters(self, engine_name: Optional[str] = None) -> List[str]:
        """Get supported parameters for an engine"""
        target_engine = engine_name or self.current_engine
        
        if not target_engine or target_engine not in self.engines:
            return []
        
        return self.engines[target_engine].get_supported_parameters()
    
    def cleanup_engine(self, engine_name: str):
        """Cleanup a specific engine"""
        if engine_name in self.engines:
            self.engines[engine_name].cleanup()
            logger.info(f"Cleaned up engine: {engine_name}")
    
    def cleanup_all(self):
        """Cleanup all engines"""
        for engine_name, engine in self.engines.items():
            try:
                engine.cleanup()
                logger.info(f"Cleaned up engine: {engine_name}")
            except Exception as e:
                logger.error(f"Error cleaning up engine {engine_name}: {e}")
        
        self.engines.clear()
        self.current_engine = None
        logger.info("All TTS engines cleaned up")

# Global TTS engine manager instance
tts_manager = TTSEngineManager()