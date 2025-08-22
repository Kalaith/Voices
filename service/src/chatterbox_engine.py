import os
import tempfile
import numpy as np
import soundfile as sf
import logging
from typing import Optional, List, Tuple, Dict, Any
from pathlib import Path

try:
    from chatterbox.tts import ChatterboxTTS
    logging.info("Chatterbox TTS imported successfully")
    CHATTERBOX_AVAILABLE = True
except ImportError as e:
    ChatterboxTTS = None
    logging.error(f"Chatterbox TTS import failed: {e}")
    CHATTERBOX_AVAILABLE = False
except Exception as e:
    ChatterboxTTS = None
    logging.error(f"Chatterbox TTS initialization error: {e}")
    CHATTERBOX_AVAILABLE = False

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import AUDIO_CONFIG, UPLOAD_DIR
from models.audio_models import Voice
from src.tts_engine_base import TTSEngine

logger = logging.getLogger(__name__)

class ChatterboxEngine(TTSEngine):
    """Chatterbox TTS Engine Implementation"""
    
    def __init__(self):
        super().__init__("chatterbox")
        self.model = None
        self.device = "cuda" if self._is_cuda_available() else "cpu"
        
    def _is_cuda_available(self) -> bool:
        """Check if CUDA is available"""
        try:
            import torch
            return torch.cuda.is_available()
        except ImportError:
            return False
    
    def initialize(self) -> bool:
        """Initialize the Chatterbox TTS model"""
        if not CHATTERBOX_AVAILABLE:
            logger.error("Chatterbox TTS is not available")
            return False
            
        try:
            logger.info("Initializing Chatterbox TTS...")
            self.model = ChatterboxTTS.from_pretrained(device=self.device)
            self.is_loaded = True
            logger.info("Chatterbox TTS loaded successfully")
            return True
        except Exception as e:
            logger.error(f"Error initializing Chatterbox TTS: {e}")
            self.is_loaded = False
            return False
    
    def _apply_voice_parameters(self, params_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Convert voice parameters to Chatterbox format"""
        chatterbox_params = {}
        
        # Only include parameters that Chatterbox actually supports
        # Based on the error, Chatterbox doesn't support 'speed' parameter
        
        # Chatterbox-specific parameters only
        if 'exaggeration' in params_dict and params_dict['exaggeration'] is not None:
            chatterbox_params['exaggeration'] = params_dict['exaggeration']
            
        if 'cfg_weight' in params_dict and params_dict['cfg_weight'] is not None:
            chatterbox_params['cfg_weight'] = params_dict['cfg_weight']
            
        # Batch size for generation optimization
        if 'batch_size' in params_dict and params_dict['batch_size'] is not None:
            chatterbox_params['batch_size'] = params_dict['batch_size']
        
        # Note: Chatterbox doesn't support speed, temperature, etc. from our testing
        # We'll apply post-processing for speed instead
        
        return chatterbox_params
    
    def generate_audio(self, text: str, voice: Voice) -> Tuple[Optional[str], Optional[str]]:
        """Generate audio from text using Chatterbox"""
        if not self.is_loaded:
            return None, "Chatterbox engine is not loaded"
        
        if not text.strip():
            return None, "Text cannot be empty"
            
        try:
            logger.info(f"Generating audio with Chatterbox for text: {text[:50]}...")
            
            # Convert voice parameters to dict for safe access
            if hasattr(voice.parameters, 'dict'):
                params_dict = voice.parameters.dict()
            elif isinstance(voice.parameters, dict):
                params_dict = voice.parameters
            else:
                params_dict = {
                    'speed': getattr(voice.parameters, 'speed', 1.0),
                    'temperature': getattr(voice.parameters, 'temperature', 0.3),
                    'exaggeration': getattr(voice.parameters, 'exaggeration', 0.5),
                    'cfg_weight': getattr(voice.parameters, 'cfg_weight', 0.5),
                    'batch_size': getattr(voice.parameters, 'batch_size', 1),
                }
            
            logger.info(f"Using parameters: {params_dict}")
            
            # Process text
            processed_text = text.strip()
            if processed_text and processed_text[-1] not in '.!?':
                processed_text += '.'
            
            # Apply voice parameters
            chatterbox_params = self._apply_voice_parameters(params_dict)
            
            # Generate audio with Chatterbox
            logger.info("Generating audio with Chatterbox...")
            logger.info(f"Chatterbox parameters: {chatterbox_params}")
            
            try:
                wav = self.model.generate(processed_text, **chatterbox_params)
            except Exception as e:
                logger.error(f"Chatterbox generation failed with parameters {chatterbox_params}: {e}")
                # Try with minimal parameters
                logger.info("Retrying with minimal parameters...")
                try:
                    wav = self.model.generate(processed_text)
                except Exception as e2:
                    logger.error(f"Chatterbox generation failed even with minimal parameters: {e2}")
                    return None, f"Chatterbox generation failed: {str(e2)}"
            
            if wav is None:
                return None, "Failed to generate audio - wav is None"
            
            # Convert to numpy array if needed
            if hasattr(wav, 'cpu'):
                wav = wav.cpu().numpy()
            elif hasattr(wav, 'numpy'):
                wav = wav.numpy()
            
            audio = np.array(wav, dtype=np.float32)
            
            # Safety check
            if audio.size == 0:
                return None, "Failed to generate audio - empty audio array"
            
            # Handle multi-dimensional audio (stereo, batch, etc.)
            logger.info(f"Audio shape from Chatterbox: {audio.shape}")
            
            # Convert to mono if stereo/multi-channel
            if len(audio.shape) == 2:
                if audio.shape[0] == 1:  # (1, samples) - batch dimension
                    audio = audio[0]
                elif audio.shape[1] == 1:  # (samples, 1) - channel dimension
                    audio = audio[:, 0]
                else:  # (channels, samples) or (samples, channels)
                    # Take first channel or average channels
                    if audio.shape[0] < audio.shape[1]:  # (channels, samples)
                        audio = audio[0]  # Take first channel
                    else:  # (samples, channels)
                        audio = np.mean(audio, axis=1)  # Average channels
            elif len(audio.shape) > 2:
                # Flatten to 1D, taking the first element along extra dimensions
                audio = audio.flatten()
            
            # Ensure we have a 1D array
            audio = audio.flatten()
            
            logger.info(f"Audio shape after processing: {audio.shape}")
            
            # Apply speed adjustment (post-processing since Chatterbox doesn't support it)
            speed = params_dict.get('speed', 1.0)
            if speed and speed != 1.0:
                # Simple speed adjustment by resampling
                target_length = int(len(audio) / speed)
                if target_length > 0:
                    audio = np.interp(
                        np.linspace(0, len(audio)-1, target_length),
                        np.arange(len(audio)),
                        audio
                    )
            
            # Normalize audio
            if np.max(np.abs(audio)) > 0:
                audio = audio / np.max(np.abs(audio)) * 0.9
            
            # Add minimal silence at the end (0.2 seconds)
            silence_samples = int(AUDIO_CONFIG["sample_rate"] * 0.2)
            silence = np.zeros(silence_samples, dtype=np.float32)
            
            # Ensure both arrays are 1D before concatenation
            audio = audio.flatten()
            silence = silence.flatten()
            
            logger.info(f"Final audio shape: {audio.shape}, silence shape: {silence.shape}")
            audio = np.concatenate([audio, silence])
            
            # Save to file
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            
            with tempfile.NamedTemporaryFile(
                delete=False, 
                suffix=f".{AUDIO_CONFIG['format']}", 
                dir=UPLOAD_DIR
            ) as temp_file:
                sf.write(
                    temp_file.name, 
                    audio, 
                    AUDIO_CONFIG["sample_rate"]
                )
                
                filename = os.path.basename(temp_file.name)
                return filename, None
                
        except Exception as e:
            import traceback
            logger.error(f"Error generating audio with Chatterbox: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return None, str(e)
    
    def generate_script_audio(
        self, 
        script_lines: List[Tuple[str, Voice]], 
        combine: bool = True
    ) -> Tuple[Optional[List[str]], Optional[str]]:
        """Generate audio for multiple script lines"""
        if not self.is_loaded:
            return None, "Chatterbox engine is not loaded"
            
        audio_files = []
        combined_audio = []
        
        try:
            for i, (text, voice) in enumerate(script_lines):
                logger.info(f"Generating audio for line {i+1}/{len(script_lines)}")
                
                filename, error = self.generate_audio(text, voice)
                if error:
                    return None, f"Error on line {i+1}: {error}"
                    
                audio_files.append(filename)
                
                if combine:
                    audio_path = os.path.join(UPLOAD_DIR, filename)
                    audio_data, _ = sf.read(audio_path)
                    combined_audio.append(audio_data)
            
            if combine and combined_audio:
                # Combine all audio segments
                full_audio = np.concatenate(combined_audio)
                
                # Save combined audio
                with tempfile.NamedTemporaryFile(
                    delete=False, 
                    suffix=f".{AUDIO_CONFIG['format']}", 
                    dir=UPLOAD_DIR
                ) as temp_file:
                    sf.write(
                        temp_file.name, 
                        full_audio, 
                        AUDIO_CONFIG["sample_rate"]
                    )
                    
                    combined_filename = os.path.basename(temp_file.name)
                    return [combined_filename], None
            
            return audio_files, None
            
        except Exception as e:
            logger.error(f"Error generating script audio: {e}")
            return None, str(e)
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get Chatterbox engine health status"""
        return {
            "engine": self.engine_name,
            "loaded": self.is_loaded,
            "available": CHATTERBOX_AVAILABLE,
            "device": self.device,
            "model_loaded": self.model is not None
        }
    
    def get_supported_parameters(self) -> List[str]:
        """Get list of supported voice parameters"""
        return [
            "speed",        # Post-processed (not native)
            "exaggeration", # Native Chatterbox parameter
            "cfg_weight",   # Native Chatterbox parameter
            "batch_size"    # Native Chatterbox parameter
        ]
    
    def cleanup(self):
        """Cleanup Chatterbox resources"""
        if self.model:
            del self.model
            self.model = None
        self.is_loaded = False
        logger.info("Chatterbox engine cleaned up")