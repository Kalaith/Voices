import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_PORT = int(os.getenv("SERVICE_PORT", 9966))
SERVICE_HOST = os.getenv("SERVICE_HOST", "0.0.0.0")
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:8000")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_AUDIO_LENGTH = int(os.getenv("MAX_AUDIO_LENGTH", 30))
DEVICE = os.getenv("DEVICE", "auto")

# ChatTTS Configuration
CHATTS_CONFIG = {
    "compile": False,
    "device": DEVICE,
    "logger_level": "INFO"
}

# Audio Configuration
AUDIO_CONFIG = {
    "sample_rate": 24000,
    "format": "wav",
    "quality": "high"
}