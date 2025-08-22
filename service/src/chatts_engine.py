import os
import torch
import numpy as np
import soundfile as sf
import tempfile
from typing import Optional, List, Tuple, Dict, Any
import logging
from pathlib import Path

try:
    import ChatTTS
    logging.info("ChatTTS imported successfully")
    CHATTS_AVAILABLE = True
except ImportError as e:
    ChatTTS = None
    logging.error(f"ChatTTS import failed: {e}")
    CHATTS_AVAILABLE = False
except Exception as e:
    ChatTTS = None
    logging.error(f"ChatTTS initialization error: {e}")
    CHATTS_AVAILABLE = False

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Add working ChatTTS installation to path
sys.path.insert(0, r'E:\chattts')

from config.settings import CHATTS_CONFIG, AUDIO_CONFIG, UPLOAD_DIR
from models.audio_models import Voice
from src.tts_engine_base import TTSEngine

logger = logging.getLogger(__name__)

class ChatTTSEngine(TTSEngine):
    """ChatTTS Engine Implementation"""
    
    def __init__(self):
        super().__init__("chatts")
        self.chat = None
        self.device = CHATTS_CONFIG["device"]
        self._speaker_cache = {}
        
    def initialize(self) -> bool:
        """Initialize ChatTTS model"""
        if not CHATTS_AVAILABLE:
            logger.error("ChatTTS is not available")
            return False
            
        try:
            logger.info("Initializing ChatTTS...")
            
            # Change to the working ChatTTS directory
            original_cwd = os.getcwd()
            os.chdir(r'E:\chattts')
            
            self.chat = ChatTTS.Chat()
            
            logger.info("Loading ChatTTS models...")
            success = self.chat.load()
            
            # Restore original working directory
            os.chdir(original_cwd)
            
            if success:
                self.is_loaded = True
                logger.info("ChatTTS loaded successfully")
                return True
            else:
                logger.error("Failed to load ChatTTS")
                return False
                
        except Exception as e:
            logger.error(f"Error initializing ChatTTS: {e}")
            self.is_loaded = False
            return False
    
    def _apply_voice_parameters(self, params_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Convert voice parameters to ChatTTS format"""
        chatts_params = {}
        return chatts_params
    
    def _configure_chatts_parameters(self, params_dict: Dict[str, Any]):
        """Configure ChatTTS model parameters before inference"""
        try:
            if hasattr(self.chat, 'gpt') and hasattr(self.chat.gpt, 'generation_config'):
                config = self.chat.gpt.generation_config
                
                if 'temperature' in params_dict and params_dict['temperature'] is not None:
                    config.temperature = params_dict['temperature']
                    logger.info(f"Set temperature: {params_dict['temperature']}")
                
                if 'top_p' in params_dict and params_dict['top_p'] is not None:
                    config.top_p = params_dict['top_p']
                    logger.info(f"Set top_p: {params_dict['top_p']}")
                
                if 'top_k' in params_dict and params_dict['top_k'] is not None:
                    config.top_k = params_dict['top_k']
                    logger.info(f"Set top_k: {params_dict['top_k']}")
                    
            elif hasattr(self.chat, 'config'):
                config = self.chat.config
                
                if 'temperature' in params_dict and params_dict['temperature'] is not None:
                    config.temperature = params_dict['temperature']
                
                if 'top_p' in params_dict and params_dict['top_p'] is not None:
                    config.top_p = params_dict['top_p']
                
                if 'top_k' in params_dict and params_dict['top_k'] is not None:
                    config.top_k = params_dict['top_k']
                    
            else:
                logger.warning("Could not find ChatTTS configuration to set parameters")
                
        except Exception as e:
            logger.warning(f"Could not configure ChatTTS parameters: {e}")

    def _set_deterministic_seed(self, seed: int):
        """Set all random seeds for deterministic generation"""
        torch.manual_seed(seed)
        np.random.seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
        
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
        
        import random
        random.seed(seed)
    
    def _restore_non_deterministic(self):
        """Restore non-deterministic mode after generation"""
        torch.backends.cudnn.deterministic = False
        torch.backends.cudnn.benchmark = True
    
    def clear_speaker_cache(self):
        """Clear cached speaker embeddings"""
        self._speaker_cache.clear()
        logger.info("Speaker cache cleared")

    def _post_process_audio(self, audio: np.ndarray, params_dict: Dict[str, Any]) -> np.ndarray:
        """Apply speed and pitch modifications"""
        speed = params_dict.get('speed', 1.0)
        pitch = params_dict.get('pitch', 1.0)
        
        if speed and speed != 1.0:
            target_length = int(len(audio) / speed)
            audio = np.interp(
                np.linspace(0, len(audio)-1, target_length),
                np.arange(len(audio)),
                audio
            )
        
        if pitch and pitch != 1.0:
            pass
            
        return audio

    def generate_audio(self, text: str, voice: Voice) -> Tuple[Optional[str], Optional[str]]:
        """Generate audio from text using specified voice"""
        if not self.is_loaded:
            return None, "ChatTTS engine is not loaded"
        
        if not text.strip():
            return None, "Text cannot be empty"
            
        try:
            logger.info(f"Generating audio for text: {text[:50]}...")
            
            # Convert voice parameters to dict for safe access
            if hasattr(voice.parameters, 'dict'):
                params_dict = voice.parameters.dict()
            elif isinstance(voice.parameters, dict):
                params_dict = voice.parameters
            else:
                params_dict = {
                    'speed': getattr(voice.parameters, 'speed', 1.0),
                    'pitch': getattr(voice.parameters, 'pitch', 1.0),
                    'temperature': getattr(voice.parameters, 'temperature', 0.3),
                    'top_p': getattr(voice.parameters, 'top_p', 0.7),
                    'top_k': getattr(voice.parameters, 'top_k', 20),
                    'seed': getattr(voice.parameters, 'seed', 2024)
                }
            
            logger.info(f"Using parameters: {params_dict}")
            
            # Process text
            processed_text = text.strip()
            if processed_text and processed_text[-1] not in '.!?':
                processed_text += '.'
            
            logger.info(f"Processed text: {processed_text}")
            
            # Generate audio with comprehensive seed control
            seed = params_dict.get('seed', 2024)
            logger.info(f"Setting deterministic seed: {seed}")
            
            self._configure_chatts_parameters(params_dict)
            chatts_params = self._apply_voice_parameters(params_dict)
            
            # Handle speaker embeddings
            rand_spk = None
            rand_infer = None
            
            if hasattr(self.chat, 'sample_random_speaker'):
                cache_key = f"speaker_{seed}"
                if cache_key not in self._speaker_cache:
                    logger.info(f"Generating new speaker embedding for seed {seed}")
                    self._set_deterministic_seed(seed)
                    
                    try:
                        rand_spk = self.chat.sample_random_speaker()
                        self._speaker_cache[cache_key] = rand_spk
                        logger.info("Generated new speaker embedding")
                    except Exception as e:
                        logger.warning(f"Could not generate speaker embedding: {e}")
                        self._speaker_cache[cache_key] = None
                else:
                    logger.info(f"Using cached speaker embedding for seed {seed}")
                
                rand_spk = self._speaker_cache[cache_key]
            else:
                logger.info("Speaker embeddings not supported in this ChatTTS version")
            
            if hasattr(self.chat, 'sample_random_infer_text'):
                infer_cache_key = f"infer_{seed}"
                if infer_cache_key not in self._speaker_cache:
                    self._set_deterministic_seed(seed)
                    
                    try:
                        rand_infer = self.chat.sample_random_infer_text()
                        self._speaker_cache[infer_cache_key] = rand_infer
                        logger.info("Generated new inference text embedding")
                    except Exception as e:
                        logger.warning(f"Could not generate inference text embedding: {e}")
                        self._speaker_cache[infer_cache_key] = None
                else:
                    rand_infer = self._speaker_cache[infer_cache_key]
                    logger.info("Using cached inference text embedding")
            else:
                logger.info("Inference text embeddings not supported in this ChatTTS version")
            
            self._set_deterministic_seed(seed)
            
            texts = [processed_text]
            
            # Try ChatTTS internal random state setting
            try:
                if hasattr(self.chat, 'normalizer') and hasattr(self.chat.normalizer, 'manual_seed'):
                    self.chat.normalizer.manual_seed(seed)
                if hasattr(self.chat, 'dvae') and hasattr(self.chat.dvae, 'manual_seed'):
                    self.chat.dvae.manual_seed(seed)
                if hasattr(self.chat, 'gpt') and hasattr(self.chat.gpt, 'manual_seed'):
                    self.chat.gpt.manual_seed(seed)
            except Exception as e:
                logger.debug(f"Could not set ChatTTS internal seeds: {e}")
            
            # Generate audio with fallback attempts
            logger.info(f"ChatTTS inference with seed {seed}")
            inference_success = False
            
            # Multiple attempts with different parameter combinations
            if rand_spk is not None and rand_infer is not None:
                try:
                    logger.info("Attempting: both speaker and inference embeddings")
                    wavs = self.chat.infer(texts, use_decoder=True, spk_emb=rand_spk, infer_text=rand_infer)
                    inference_success = True
                    logger.info("Success: Used both embeddings")
                except Exception as e:
                    logger.debug(f"Failed with both embeddings: {e}")
            
            if not inference_success and rand_spk is not None:
                try:
                    logger.info("Attempting: speaker embedding only")
                    wavs = self.chat.infer(texts, use_decoder=True, spk_emb=rand_spk)
                    inference_success = True
                    logger.info("Success: Used speaker embedding")
                except Exception as e:
                    logger.debug(f"Failed with speaker embedding: {e}")
            
            if not inference_success:
                try:
                    logger.info("Attempting: use_decoder=True")
                    wavs = self.chat.infer(texts, use_decoder=True)
                    inference_success = True
                    logger.info("Success: Used use_decoder")
                except Exception as e:
                    logger.debug(f"Failed with use_decoder: {e}")
            
            if not inference_success:
                try:
                    logger.info("Attempting: minimal parameters (texts only)")
                    wavs = self.chat.infer(texts)
                    inference_success = True
                    logger.info("Success: Used minimal parameters")
                except Exception as e:
                    logger.error(f"Failed with minimal parameters: {e}")
                    return None, f"ChatTTS inference failed: {e}"
            
            if not wavs or len(wavs) == 0:
                return None, "Failed to generate audio"
                
            audio = wavs[0]
            
            # Post-process audio
            audio = self._post_process_audio(audio, params_dict)
            
            # Normalize audio
            audio = np.array(audio, dtype=np.float32)
            if np.max(np.abs(audio)) > 0:
                audio = audio / np.max(np.abs(audio)) * 0.9
            
            # Add minimal silence at the end
            silence_samples = int(AUDIO_CONFIG["sample_rate"] * 0.2)
            silence = np.zeros(silence_samples, dtype=np.float32)
            audio = np.concatenate([audio, silence])
            
            self._restore_non_deterministic()
            
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
            logger.error(f"Error generating audio: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return None, str(e)

    def generate_script_audio(
        self, 
        script_lines: List[Tuple[str, Voice]], 
        combine: bool = True
    ) -> Tuple[Optional[List[str]], Optional[str]]:
        """Generate audio for multiple script lines"""
        if not self.is_loaded:
            return None, "ChatTTS engine is not loaded"
            
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
        """Get service health status"""
        return {
            "engine": self.engine_name,
            "loaded": self.is_loaded,
            "available": CHATTS_AVAILABLE,
            "device": self.device,
            "model_loaded": self.chat is not None
        }
    
    def get_supported_parameters(self) -> List[str]:
        """Get list of supported voice parameters"""
        return [
            "speed",
            "pitch", 
            "temperature",
            "top_p",
            "top_k",
            "seed"
        ]
    
    def cleanup(self):
        """Cleanup resources"""
        self.clear_speaker_cache()
        if self.chat:
            del self.chat
            self.chat = None
        self.is_loaded = False
        logger.info("ChatTTS engine cleaned up")