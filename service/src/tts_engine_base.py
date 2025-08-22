from abc import ABC, abstractmethod
from typing import Optional, List, Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)

class TTSEngine(ABC):
    """Abstract base class for TTS engines"""
    
    def __init__(self, engine_name: str):
        self.engine_name = engine_name
        self.is_loaded = False
        
    @abstractmethod
    def initialize(self) -> bool:
        """Initialize the TTS engine. Returns True if successful."""
        pass
    
    @abstractmethod
    def generate_audio(self, text: str, voice: Any) -> Tuple[Optional[str], Optional[str]]:
        """
        Generate audio from text using specified voice.
        Returns: (filename, error_message)
        """
        pass
    
    @abstractmethod
    def generate_script_audio(
        self, 
        script_lines: List[Tuple[str, Any]], 
        combine: bool = True
    ) -> Tuple[Optional[List[str]], Optional[str]]:
        """
        Generate audio for multiple script lines.
        Returns: (audio_files, error_message)
        """
        pass
    
    @abstractmethod
    def get_health_status(self) -> Dict[str, Any]:
        """Get engine health status"""
        pass
    
    @abstractmethod
    def get_supported_parameters(self) -> List[str]:
        """Get list of supported voice parameters for this engine"""
        pass
    
    def get_engine_info(self) -> Dict[str, Any]:
        """Get engine information"""
        return {
            "name": self.engine_name,
            "loaded": self.is_loaded,
            "supported_parameters": self.get_supported_parameters()
        }
    
    def cleanup(self):
        """Cleanup resources if needed"""
        pass