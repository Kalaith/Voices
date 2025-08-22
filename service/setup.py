#!/usr/bin/env python3
"""
Setup script for Voice Generator Service
"""

import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements"""
    print("Installing Python requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install full requirements: {e}")
        print("Trying minimal requirements...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements-minimal.txt"])
            print("✅ Minimal requirements installed successfully")
            print("⚠️  Audio processing libraries may be missing - install manually if needed")
            return True
        except subprocess.CalledProcessError as e2:
            print(f"❌ Failed to install minimal requirements: {e2}")
            return False
    return True

def install_chatts():
    """Install ChatTTS from GitHub"""
    print("Installing ChatTTS...")
    try:
        # First try PyPI installation
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "ChatTTS"])
            print("✅ ChatTTS installed from PyPI")
            return True
        except subprocess.CalledProcessError:
            print("PyPI installation failed, trying GitHub...")
        
        # Fallback to GitHub installation
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", 
            "git+https://github.com/2noise/ChatTTS.git"
        ])
        print("✅ ChatTTS installed from GitHub")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install ChatTTS: {e}")
        print("You can try installing manually with:")
        print("pip install ChatTTS")
        print("or")
        print("pip install git+https://github.com/2noise/ChatTTS.git")
        return False
    return True

def create_directories():
    """Create necessary directories"""
    print("Creating directories...")
    os.makedirs("uploads", exist_ok=True)
    print("✅ Directories created")

def main():
    print("🚀 Setting up Voice Generator Service...")
    
    if not install_requirements():
        sys.exit(1)
    
    if not install_chatts():
        print("⚠️  ChatTTS installation failed, but service can still run")
        print("   (it will show as unhealthy until ChatTTS is installed)")
    
    create_directories()
    
    print("\n✅ Setup complete!")
    print("\nTo start the service:")
    print("  python main.py")
    print("\nThe service will run on http://localhost:9966")

if __name__ == "__main__":
    main()