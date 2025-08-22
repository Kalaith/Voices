# Voice Generator Setup Guide

This application consists of three components:

## 1. Frontend (React/TypeScript)
- **Port**: 5173
- **Purpose**: User interface
- **Command**: `npm run dev`

## 2. PHP Backend API
- **Port**: 8000
- **Purpose**: Database operations (voices, scripts, audio generation jobs)
- **Command**: `php -S localhost:8000 -t public/`
- **Database**: MySQL (voices database)

## 3. Voice Generation Service (Python/ChatTTS)
- **Port**: 9966
- **Purpose**: Actual voice synthesis/audio generation
- **Command**: `python main.py`
- **Framework**: FastAPI + ChatTTS

## Quick Start

1. **Database Setup**:
   ```bash
   cd backend
   mysql -u root -p < database/init.sql
   ```

2. **Install Dependencies**:
   ```bash
   # PHP Backend
   cd backend
   composer install
   
   # Python Service
   cd ../service
   python setup.py
   
   # Frontend
   cd ../voice-generator
   npm install
   ```

3. **Start All Services**:
   ```bash
   # Terminal 1: Voice Service
   cd service
   python main.py
   
   # Terminal 2: PHP Backend  
   cd backend
   php -S localhost:8000 -t public/
   
   # Terminal 3: Frontend
   cd voice-generator
   npm run dev
   ```

## Component Communication Flow

```
User → Frontend (5173) → PHP Backend (8000) → Voice Service (9966) → ChatTTS
```

1. **Frontend**: Manages UI and sends requests to PHP backend
2. **PHP Backend**: Handles data persistence and forwards generation requests to service
3. **Voice Service**: Processes audio generation using ChatTTS

## Features

✅ **Voice Management**: Create, edit, delete custom voices
✅ **Script Management**: Multi-speaker dialogue scripts  
✅ **Audio Generation**: Convert scripts to audio using ChatTTS
✅ **Background Processing**: Non-blocking audio generation
✅ **Database Persistence**: All data stored in MySQL
✅ **Real-time Status**: Track generation progress

## API Architecture

### PHP Backend (`/api/`)
- `/voices` - Voice CRUD operations
- `/scripts` - Script CRUD operations  
- `/audio` - Audio generation jobs
- `/service/health` - Check service status

### Voice Service (`/`)
- `/health` - Service health check
- `/generate` - Single text-to-speech
- `/generate/script` - Full script processing
- `/audio/{file}` - Serve generated audio