"""
Video Generation Service Initialization Script
Sets up directory structure, checks dependencies, and initializes the service.
"""

import os
import sys
import subprocess
from pathlib import Path
import mysql.connector
from mysql.connector import Error
import requests
import asyncio


class VideoServiceInitializer:
    """Initializes the video generation service environment."""
    
    def __init__(self):
        self.base_path = Path(__file__).parent
        self.project_root = self.base_path.parent
        self.assets_path = self.project_root / "assets"
        
        # Required directories
        self.required_dirs = [
            self.assets_path / "backgrounds",
            self.assets_path / "characters" / "portraits", 
            self.assets_path / "characters" / "expressions",
            self.assets_path / "characters" / "lora_models",
            self.assets_path / "animations",
            self.assets_path / "videos",
            self.base_path / "lora_training" / "configs",
            self.base_path / "lora_training" / "datasets",
            self.base_path / "lora_training" / "trained_models",
            self.base_path / "temp"
        ]
    
    def run_initialization(self):
        """Run complete initialization process."""
        print("🎬 Initializing Voices Video Generation Service...")
        print("=" * 60)
        
        try:
            self.check_python_version()
            self.create_directories()
            self.check_system_dependencies()
            self.check_database_connection()
            self.run_database_migrations()
            self.check_kobold_ai()
            self.check_comfyui()
            self.install_python_dependencies()
            self.create_environment_file()
            
            print("\n✅ Initialization completed successfully!")
            print("\nNext steps:")
            print("1. Start KoboldAI server: python aiserver.py --model <model_name> --port 5000")
            print("2. Start video service: python main.py")
            print("3. Access API docs at: http://localhost:8001/docs")
            
        except Exception as e:
            print(f"\n❌ Initialization failed: {e}")
            sys.exit(1)
    
    def check_python_version(self):
        """Check Python version compatibility."""
        print("🐍 Checking Python version...")
        
        version = sys.version_info
        if version < (3, 8):
            raise Exception(f"Python 3.8+ required, found {version.major}.{version.minor}")
        
        print(f"   ✓ Python {version.major}.{version.minor}.{version.micro}")
    
    def create_directories(self):
        """Create required directory structure."""
        print("📁 Creating directory structure...")
        
        for directory in self.required_dirs:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"   ✓ {directory}")
    
    def check_system_dependencies(self):
        """Check system-level dependencies."""
        print("🔧 Checking system dependencies...")
        
        dependencies = {
            "ffmpeg": "ffmpeg -version",
            "ffprobe": "ffprobe -version"
        }
        
        for dep, check_cmd in dependencies.items():
            try:
                result = subprocess.run(
                    check_cmd.split(),
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                if result.returncode == 0:
                    print(f"   ✓ {dep}")
                else:
                    print(f"   ⚠️  {dep} not found or not working properly")
            except (subprocess.TimeoutExpired, FileNotFoundError):
                print(f"   ❌ {dep} not found")
                print(f"      Please install {dep} and ensure it's in your PATH")
    
    def check_database_connection(self):
        """Check MySQL database connection."""
        print("🗄️  Checking database connection...")
        
        try:
            connection = mysql.connector.connect(
                host='localhost',
                database='voices',
                user='root',
                password=''
            )
            
            if connection.is_connected():
                print("   ✓ Database connection successful")
                
                # Check if required tables exist
                cursor = connection.cursor()
                cursor.execute("SHOW TABLES LIKE 'character_profiles'")
                if cursor.fetchone():
                    print("   ✓ Video generation tables found")
                else:
                    print("   ⚠️  Video generation tables not found - migrations needed")
                
                cursor.close()
                connection.close()
                
        except Error as e:
            print(f"   ❌ Database connection failed: {e}")
            print("      Please ensure MySQL is running and 'voices' database exists")
    
    def run_database_migrations(self):
        """Run database migrations."""
        print("🔄 Running database migrations...")
        
        migration_file = self.project_root / "backend" / "database" / "migrations" / "006_create_story_management_tables.sql"
        
        if migration_file.exists():
            try:
                connection = mysql.connector.connect(
                    host='localhost',
                    database='voices',
                    user='root',
                    password=''
                )
                
                cursor = connection.cursor()
                
                # Read and execute migration
                with open(migration_file, 'r', encoding='utf-8') as f:
                    migration_sql = f.read()
                
                # Split by semicolons and execute each statement
                statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip()]
                
                for statement in statements:
                    if statement and not statement.startswith('--'):
                        try:
                            cursor.execute(statement)
                        except Error as e:
                            if "already exists" not in str(e).lower():
                                print(f"   ⚠️  Migration warning: {e}")
                
                connection.commit()
                cursor.close()
                connection.close()
                
                print("   ✓ Database migrations completed")
                
            except Error as e:
                print(f"   ❌ Migration failed: {e}")
        else:
            print("   ⚠️  Migration file not found")
    
    def check_kobold_ai(self):
        """Check KoboldAI availability."""
        print("🤖 Checking KoboldAI...")
        
        kobold_path = self.project_root.parent / "KoboldAI-Client"
        
        if kobold_path.exists():
            print(f"   ✓ KoboldAI found at {kobold_path}")
        else:
            print("   ⚠️  KoboldAI not found")
            print("      Please clone KoboldAI-Client to the parent directory")
            print("      git clone https://github.com/KoboldAI/KoboldAI-Client.git")
        
        # Check if server is running
        try:
            response = requests.get("http://127.0.0.1:5000/api/v1/info/version", timeout=3)
            if response.status_code == 200:
                print("   ✓ KoboldAI server is running")
            else:
                print("   ⚠️  KoboldAI server is not responding properly")
        except requests.RequestException:
            print("   ⚠️  KoboldAI server is not running")
            print("      Start with: python aiserver.py --model <model_name> --port 5000")
    
    def check_comfyui(self):
        """Check ComfyUI integration."""
        print("🎨 Checking ComfyUI integration...")
        
        comfyui_script = self.project_root / "comfyui-generate.ps1"
        
        if comfyui_script.exists():
            print("   ✓ ComfyUI PowerShell script found")
        else:
            print("   ⚠️  ComfyUI PowerShell script not found")
            print(f"      Expected at: {comfyui_script}")
    
    def install_python_dependencies(self):
        """Install Python dependencies."""
        print("📦 Installing Python dependencies...")
        
        requirements_file = self.base_path / "requirements.txt"
        
        if requirements_file.exists():
            try:
                result = subprocess.run(
                    [sys.executable, "-m", "pip", "install", "-r", str(requirements_file)],
                    capture_output=True,
                    text=True
                )
                
                if result.returncode == 0:
                    print("   ✓ Dependencies installed successfully")
                else:
                    print(f"   ❌ Dependency installation failed: {result.stderr}")
                    
            except Exception as e:
                print(f"   ❌ Error installing dependencies: {e}")
        else:
            print("   ❌ requirements.txt not found")
    
    def create_environment_file(self):
        """Create .env file if it doesn't exist."""
        print("⚙️  Creating environment configuration...")
        
        env_file = self.base_path / ".env"
        
        if not env_file.exists():
            env_content = f"""# Database Configuration
DATABASE_HOST=localhost
DATABASE_NAME=voices
DATABASE_USER=root
DATABASE_PASSWORD=

# KoboldAI Configuration
KOBOLD_URL=http://127.0.0.1:5000

# Paths Configuration
ASSETS_PATH={self.assets_path}
COMFYUI_SCRIPT={self.project_root}/comfyui-generate.ps1

# Service Configuration
API_HOST=0.0.0.0
API_PORT=8001
LOG_LEVEL=INFO

# Optional: InfiniteTalk Configuration
INFINITETALK_PATH={self.base_path}/infinitetalk
"""
            
            env_file.write_text(env_content, encoding='utf-8')
            print("   ✓ Environment file created")
        else:
            print("   ✓ Environment file already exists")


def main():
    """Main initialization function."""
    initializer = VideoServiceInitializer()
    initializer.run_initialization()


if __name__ == "__main__":
    main()