#!/usr/bin/env python3
"""
Voice Generator Service
Main entry point for the ChatTTS audio generation service
"""

import sys
import os

# Add the service directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    try:
        import uvicorn
        from src.api import app
        from config.settings import SERVICE_HOST, SERVICE_PORT
        
        print(f"Starting Voice Generator Service on {SERVICE_HOST}:{SERVICE_PORT}")
        print("Dependencies check passed!")
        
        uvicorn.run(
            app,
            host=SERVICE_HOST,
            port=SERVICE_PORT,
            reload=False,
            timeout_keep_alive=300,  # 5 minutes keep-alive
            timeout_graceful_shutdown=30  # 30 seconds for graceful shutdown
        )
    except Exception as e:
        print(f"Failed to start service: {e}")
        print("Make sure all dependencies are installed:")
        print("pip install fastapi uvicorn soundfile ChatTTS")
        sys.exit(1)