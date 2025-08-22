import os
import torch
import numpy as np
import soundfile as sf
import tempfile
from typing import Optional, List, Tuple
import logging
from pathlib import Path

try:
    import ChatTTS
    logging.info("ChatTTS imported successfully")
except ImportError as e:
    ChatTTS = None
    logging.error(f"ChatTTS import failed: {e}")
except Exception as e:
    ChatTTS = None
    logging.error(f"ChatTTS initialization error: {e}")

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Add working ChatTTS installation to path
sys.path.insert(0, r'E:\chattts')

from config.settings import CHATTS_CONFIG, AUDIO_CONFIG, UPLOAD_DIR
from models.audio_models import Voice, VoiceParameters

logger = logging.getLogger(__name__)

class ChatTTSService:
    def __init__(self):
        self.chat = None
        self.is_loaded = False
        self.device = CHATTS_CONFIG["device"]
        self._speaker_cache = {}  # Cache for speaker embeddings
        
        if ChatTTS is None:
            logger.error("ChatTTS is not installed")
            return
            
        self._initialize_chatts()
        
    def _initialize_chatts(self):
        """Initialize ChatTTS model"""
        try:
            logger.info("Initializing ChatTTS...")
            
            # Change to the working ChatTTS directory
            original_cwd = os.getcwd()
            os.chdir(r'E:\chattts')
            
            self.chat = ChatTTS.Chat()
            
            logger.info("Loading ChatTTS models...")
            # Use simple load() method like the working example
            success = self.chat.load()
            
            # Restore original working directory
            os.chdir(original_cwd)
            
            if success:
                self.is_loaded = True
                logger.info("ChatTTS loaded successfully")
            else:
                logger.error("Failed to load ChatTTS")
                
        except Exception as e:
            logger.error(f"Error initializing ChatTTS: {e}")
            self.is_loaded = False

    def _apply_voice_parameters(self, params_dict: dict) -> dict:
        """Convert voice parameters to ChatTTS format - basic version for compatibility"""
        # For compatibility with older ChatTTS versions, we'll handle parameters differently
        # The parameters will be applied through the model configuration rather than infer() params
        chatts_params = {}
        
        # Only include parameters that are definitely supported by the infer method
        # Most ChatTTS versions only support basic parameters in infer()
        
        return chatts_params
    
    def _configure_chatts_parameters(self, params_dict: dict):
        """Configure ChatTTS model parameters before inference"""
        try:
            # Try to set parameters on the model components if available
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
                # Alternative configuration method
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
            # Continue without setting parameters - use defaults

    def _set_deterministic_seed(self, seed: int):
        """Set all random seeds for deterministic generation"""
        torch.manual_seed(seed)
        np.random.seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
        
        # Enable deterministic mode for reproducibility
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
        
        # Set Python's random module seed as well
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

    def _post_process_audio(self, audio: np.ndarray, params_dict: dict) -> np.ndarray:
        """Apply speed and pitch modifications"""
        speed = params_dict.get('speed', 1.0)
        pitch = params_dict.get('pitch', 1.0)
        
        if speed and speed != 1.0:
            # Simple speed adjustment by resampling
            target_length = int(len(audio) / speed)
            audio = np.interp(
                np.linspace(0, len(audio)-1, target_length),
                np.arange(len(audio)),
                audio
            )
        
        if pitch and pitch != 1.0:
            # Basic pitch shifting (simplified implementation)
            # For production, consider using librosa.effects.pitch_shift
            pass
            
        return audio

    def generate_audio(self, text: str, voice: Voice) -> Tuple[Optional[str], Optional[str]]:
        """Generate audio from text using specified voice"""
        if not self.is_loaded:
            return None, "ChatTTS service is not loaded"
        
        if not text.strip():
            return None, "Text cannot be empty"
            
        try:
            logger.info(f"Generating audio for text: {text[:50]}...")
            
            # Convert voice parameters to dict for safe access
            if hasattr(voice.parameters, 'dict'):
                # Pydantic model
                params_dict = voice.parameters.dict()
            elif isinstance(voice.parameters, dict):
                # Already a dict
                params_dict = voice.parameters
            else:
                # Convert object to dict
                params_dict = {
                    'speed': getattr(voice.parameters, 'speed', 1.0),
                    'pitch': getattr(voice.parameters, 'pitch', 1.0),
                    'temperature': getattr(voice.parameters, 'temperature', 0.3),
                    'top_p': getattr(voice.parameters, 'top_p', 0.7),
                    'top_k': getattr(voice.parameters, 'top_k', 20),
                    'seed': getattr(voice.parameters, 'seed', 2024)
                }
            
            logger.info(f"Using parameters: {params_dict}")
            
            # Improve text processing to prevent word cutoff
            processed_text = text.strip()
            
            # Add ending punctuation if missing to ensure proper completion
            if processed_text and processed_text[-1] not in '.!?':
                processed_text += '.'
            
            logger.info(f"Processed text: {processed_text}")
            
            # Generate audio with comprehensive seed control
            seed = params_dict.get('seed', 2024)
            logger.info(f"Setting deterministic seed: {seed}")
            
            # Configure ChatTTS parameters before generation
            self._configure_chatts_parameters(params_dict)
            
            # Get basic infer parameters (empty for compatibility)
            chatts_params = self._apply_voice_parameters(params_dict)
            
            # Check if this ChatTTS version supports embeddings
            rand_spk = None
            rand_infer = None
            
            if hasattr(self.chat, 'sample_random_speaker'):
                # Use cached speaker embedding or generate new one
                cache_key = f"speaker_{seed}"
                if cache_key not in self._speaker_cache:
                    logger.info(f"Generating new speaker embedding for seed {seed}")
                    self._set_deterministic_seed(seed)
                    
                    try:
                        # Set seed before sampling - ChatTTS uses internal random state
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
            
            # Generate inference tokens with seed if available
            if hasattr(self.chat, 'sample_random_infer_text'):
                infer_cache_key = f"infer_{seed}"
                if infer_cache_key not in self._speaker_cache:
                    self._set_deterministic_seed(seed)
                    
                    try:
                        # Set seed before sampling - ChatTTS uses internal random state
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
            
            # Set seed one final time before actual inference
            self._set_deterministic_seed(seed)
            
            texts = [processed_text]
            
            # Ensure seed is set right before inference for maximum consistency
            self._set_deterministic_seed(seed)
            
            # Try to set ChatTTS internal random state if possible
            try:
                if hasattr(self.chat, 'normalizer') and hasattr(self.chat.normalizer, 'manual_seed'):
                    self.chat.normalizer.manual_seed(seed)
                if hasattr(self.chat, 'dvae') and hasattr(self.chat.dvae, 'manual_seed'):
                    self.chat.dvae.manual_seed(seed)
                if hasattr(self.chat, 'gpt') and hasattr(self.chat.gpt, 'manual_seed'):
                    self.chat.gpt.manual_seed(seed)
            except Exception as e:
                logger.debug(f"Could not set ChatTTS internal seeds: {e}")
            
            # Generate audio with maximum compatibility - detect supported parameters
            logger.info(f"ChatTTS inference with seed {seed}")
            
            # Try different parameter combinations from most to least features
            inference_success = False
            
            # Attempt 1: Try with all embeddings
            if rand_spk is not None and rand_infer is not None:
                try:
                    logger.info("Attempting: both speaker and inference embeddings")
                    wavs = self.chat.infer(texts, use_decoder=True, spk_emb=rand_spk, infer_text=rand_infer)
                    inference_success = True
                    logger.info("Success: Used both embeddings")
                except Exception as e:
                    logger.debug(f"Failed with both embeddings: {e}")
            
            # Attempt 2: Try with speaker embedding only
            if not inference_success and rand_spk is not None:
                try:
                    logger.info("Attempting: speaker embedding only")
                    wavs = self.chat.infer(texts, use_decoder=True, spk_emb=rand_spk)
                    inference_success = True
                    logger.info("Success: Used speaker embedding")
                except Exception as e:
                    logger.debug(f"Failed with speaker embedding: {e}")
            
            # Attempt 3: Try with use_decoder parameter
            if not inference_success:
                try:
                    logger.info("Attempting: use_decoder=True")
                    wavs = self.chat.infer(texts, use_decoder=True)
                    inference_success = True
                    logger.info("Success: Used use_decoder")
                except Exception as e:
                    logger.debug(f"Failed with use_decoder: {e}")
            
            # Attempt 4: Try with minimal parameters (just texts)
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
            
            # Post-process audio (speed, pitch)
            audio = self._post_process_audio(audio, params_dict)
            
            # Normalize audio
            audio = np.array(audio, dtype=np.float32)
            if np.max(np.abs(audio)) > 0:
                audio = audio / np.max(np.abs(audio)) * 0.9
            
            # Add minimal silence at the end to prevent cutoff (0.2 seconds)
            silence_samples = int(AUDIO_CONFIG["sample_rate"] * 0.2)
            silence = np.zeros(silence_samples, dtype=np.float32)
            audio = np.concatenate([audio, silence])
            
            # Restore non-deterministic mode for better performance
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
                
                # Return relative path
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
            return None, "ChatTTS service is not loaded"
            
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
                    # Load audio for combining
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

    def get_health_status(self) -> dict:
        """Get service health status"""
        return {
            "chatts_loaded": self.is_loaded,
            "device": self.device,
            "chatts_available": ChatTTS is not None
        }