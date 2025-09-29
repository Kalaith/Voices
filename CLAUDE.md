# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

The Voice Generator is a comprehensive multi-engine text-to-speech (TTS) platform supporting ChatTTS and Chatterbox engines. It features custom voice creation, script management, video production capabilities, and a complete voice library system. The project follows a multi-service architecture with React frontend, PHP backend, and Python TTS services.

## Development Commands

### Frontend (React/TypeScript)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Development server (runs on :5173)
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting and formatting
npm run lint
npm run lint:fix
npm run format
npm run format:check

# Testing
npm run test          # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run with coverage
npm run test:ui       # Run with UI

# Full CI pipeline
npm run ci            # lint + type-check + format-check + test + build
npm run ci:quick      # lint + type-check + format-check
```

### Backend (PHP)
```bash
# Navigate to backend directory
cd backend

# Install dependencies
composer install

# Start development server (runs on :8000)
composer start
# OR: php -S localhost:8000 -t public/

# Run tests
composer test

# Code style checking and fixing
composer cs-check
composer cs-fix
```

### Python TTS Service
```bash
# Navigate to service directory
cd service

# Install dependencies
pip install -r requirements.txt

# Start service (runs on :9966)
python main.py

# Install minimal dependencies only
pip install -r requirements-minimal.txt
```

### Video Service (Python)
```bash
# Navigate to video-service directory
cd video-service

# Install dependencies (includes AI/ML packages)
pip install -r requirements.txt

# Start video processing service
python main.py
```

## High-Level Architecture

### Multi-Service Architecture
The application consists of four main services:

1. **Frontend** (React/TypeScript) - Port 5173
   - Main user interface
   - Voice library management
   - Script editing and management
   - Video project creation
   - Real-time TTS testing

2. **Backend** (PHP/Slim) - Port 8000
   - REST API for data management
   - Voice and script CRUD operations
   - Audio generation coordination
   - File upload handling

3. **TTS Service** (Python/FastAPI) - Port 9966
   - ChatTTS and Chatterbox engine integration
   - Audio generation and processing
   - Engine parameter management
   - Health monitoring

4. **Video Service** (Python/FastAPI)
   - Video assembly and processing
   - KoboldAI integration for story generation
   - Character consistency and LoRA training
   - Visual novel scene composition

### Technology Stack Standards

**Frontend:**
- React 19+ with TypeScript 5.8+
- Vite 7+ for build tooling
- Tailwind CSS 4+ for styling
- Zustand for state management
- Modern React patterns (functional components, hooks)

**Backend:**
- PHP 8.1+ with Slim Framework 4
- Actions pattern for business logic (mandatory)
- Repository pattern for data access
- PSR-12 coding standards
- Eloquent ORM for database operations

**Python Services:**
- FastAPI for async web framework
- Pydantic for data validation
- Multi-engine TTS support (ChatTTS, Chatterbox)
- ML/AI libraries for video processing

## Project Structure

```
voices/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   └── *.tsx        # Feature-specific components
│   │   ├── pages/           # Page-level components
│   │   ├── stores/          # Zustand state management
│   │   ├── types/           # TypeScript definitions
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility libraries
│   │   └── utils/           # Helper functions
│   ├── package.json         # Contains all required scripts
│   ├── vite.config.ts       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS config
│   └── tsconfig.json        # TypeScript config (references)
├── backend/                 # PHP REST API
│   ├── src/
│   │   ├── Actions/         # Business logic (mandatory pattern)
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── services/        # Complex business operations
│   │   ├── models/          # Eloquent models
│   │   ├── External/        # Repository pattern
│   │   ├── routes/          # API routing
│   │   ├── Middleware/      # HTTP middleware
│   │   └── Utils/           # Helper utilities
│   ├── public/              # Web root
│   ├── composer.json        # PHP dependencies and scripts
│   └── data/                # JSON data storage
├── service/                 # Python TTS service
│   ├── src/                 # Engine implementations
│   │   ├── api.py          # FastAPI application
│   │   ├── chatts_engine.py # ChatTTS implementation
│   │   └── chatterbox_engine.py # Chatterbox implementation
│   ├── config/              # Service configuration
│   ├── models/              # Pydantic models
│   ├── requirements.txt     # Python dependencies
│   └── main.py              # FastAPI entry point
├── video-service/           # Video processing service
│   ├── requirements.txt     # AI/ML dependencies
│   └── main.py              # Video service entry point
└── README.md                # Comprehensive setup guide
```

## Key Frontend Components

### Core Components
- **TTSEngineSelector**: Engine switching with persistence
- **VoiceCreator/VoiceEditor**: Voice parameter management
- **CharacterManager**: Character and voice library management
- **ScriptEditor/EnhancedScriptEditor**: Multi-speaker script editing
- **VideoScriptEditor**: Video project script management
- **VoiceTestingLab**: Real-time voice testing interface

### State Management (Zustand)
- **gameStore.ts**: Main application state with persistence
- State persisted to localStorage for voice configurations
- Actions pattern for state mutations

### Page Structure
- **VoiceLibraryPage**: Voice management interface
- **ScriptManagerPage**: Script CRUD operations
- **VoiceGeneratorPage**: Audio generation interface
- **VoiceTestingLabPage**: Voice testing environment
- **VideoManagerPage**: Video project management

## Backend Architecture Patterns

### Actions Pattern (Mandatory)
Business logic is implemented in Action classes:
- `CreateAudioGenerationAction`
- `DeleteAudioGenerationAction`
- `GetAudioGenerationAction`
- `UpdateAudioGenerationAction`

### Controller Structure
Controllers are thin HTTP handlers that delegate to Actions:
- `AudioController` - Audio generation endpoints
- `VoiceController` - Voice CRUD operations
- `ScriptController` - Script management
- `CharacterController` - Character management
- `VideoProjectController` - Video project operations

### Services
- `AudioGenerationService` - Complex audio processing logic

## API Architecture

### Backend Endpoints (Port 8000)
```
GET    /api/voices           # List all voices
POST   /api/voices           # Create voice
PUT    /api/voices/{id}      # Update voice
DELETE /api/voices/{id}      # Delete voice

GET    /api/scripts          # List scripts
POST   /api/scripts          # Create script
PUT    /api/scripts/{id}     # Update script
DELETE /api/scripts/{id}     # Delete script

POST   /api/generate         # Generate audio
GET    /api/audio            # List generations
GET    /api/health           # API health check
```

### TTS Service Endpoints (Port 9966)
```
GET    /engines              # List available engines
POST   /engines/select       # Select TTS engine
POST   /generate             # Generate TTS audio
GET    /health               # Service health check
```

## Environment Configuration

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SERVICE_BASE_URL=http://localhost:9966
```

### Backend (.env)
```env
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
```

### Services (.env)
```env
HOST=localhost
PORT=9966
CORS_ORIGINS=["http://localhost:5173"]
```

## Development Workflow

1. **Start all services** (each in separate terminal):
   ```bash
   # Terminal 1: Frontend
   cd frontend && npm run dev

   # Terminal 2: Backend
   cd backend && composer start

   # Terminal 3: TTS Service
   cd service && python main.py
   ```

2. **Development patterns**:
   - Frontend: Hot reload development
   - Backend: Restart server for changes
   - Service: Restart Python service for changes

3. **Testing workflow**:
   - Use built-in voice testing features
   - Frontend: `npm run ci` for full validation
   - Backend: `composer test` for PHP tests

## Voice Parameters and Engines

### Universal Parameters
- Speed: 0.1-3.0 (playback speed)
- Pitch: 0.1-3.0 (voice pitch)
- Temperature: 0.1-1.0 (creativity/randomness)
- Top-P: 0.1-1.0 (nucleus sampling)
- Top-K: 1-100 (top-k sampling)
- Seed: Integer for reproducible results
- Batch Size: 1-10 (performance vs memory)

### Chatterbox-Specific
- Exaggeration: 0.0-1.0 (emotion control)
- CFG Weight: 0.0-1.0 (classifier-free guidance)

## Code Quality Standards

### TypeScript Standards
- Strict mode enabled, no `any` types
- Functional components with proper typing
- Custom hooks for reusable logic
- Proper error handling and loading states

### PHP Standards
- PSR-12 compliance mandatory
- Actions pattern for business logic
- Repository pattern for data access
- Proper error handling and validation

### Python Standards
- FastAPI with Pydantic models
- Async/await patterns
- Proper error handling and logging
- Engine abstraction for TTS systems

## Common Issues and Solutions

### Port Conflicts
```bash
# Find and kill processes
netstat -ano | findstr :5173
taskkill /F /PID <process_id>
```

### TTS Engine Issues
- Check Python dependencies installation
- Verify CUDA availability for GPU acceleration
- Monitor service logs for processing status

### Build Issues
```bash
# Frontend: Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Backend: Clear Composer cache
composer clear-cache
composer install
```

## Important Notes

- **Multi-service coordination**: All services must be running for full functionality
- **State persistence**: Voice configurations persist in browser localStorage
- **Engine switching**: TTS engine selection affects available parameters
- **Video features**: Requires additional AI/ML dependencies in video-service
- **Database**: Backend uses both JSON file storage and MySQL depending on feature