# Voice Generator - Multi-Engine TTS Platform

A comprehensive text-to-speech (TTS) platform that supports multiple TTS engines including ChatTTS and Chatterbox, with custom voice creation, script management, and voice library features.

## 🏗️ Architecture

This is a multi-service application consisting of:

- **Frontend**: React/TypeScript application with Vite
- **Backend**: PHP REST API for data management
- **Service**: Python FastAPI service for TTS processing

```
voices/
├── voice-generator/     # React frontend (:5173)
├── backend/            # PHP API server (:8000)
├── service/           # Python TTS service (:9966)
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (for frontend)
- **PHP** 8.0+ with extensions: `curl`, `json`, `mbstring`
- **Python** 3.8+ with pip
- **Git**

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voices
   ```

2. **Start all services** (run each in a separate terminal):

   **Frontend (Terminal 1):**
   ```bash
   cd voice-generator
   npm install
   npm run dev
   # Runs on http://localhost:5173
   ```

   **Backend (Terminal 2):**
   ```bash
   cd backend
   php -S localhost:8000 -t public
   # Runs on http://localhost:8000
   ```

   **Python Service (Terminal 3):**
   ```bash
   cd service
   pip install -r requirements.txt
   python main.py
   # Runs on http://localhost:9966
   ```

3. **Open the application**
   - Navigate to `http://localhost:5173` in your browser

## 🎯 Features

### 🎤 Multi-Engine TTS Support
- **ChatTTS**: Conversational text-to-speech with natural voices
- **Chatterbox**: Zero-shot TTS with emotion control and voice conversion
- Engine selection with local storage persistence

### 🎨 Voice Creation & Management
- Create custom voices with adjustable parameters:
  - Speed, Pitch, Temperature
  - Top-P, Top-K sampling
  - Seed for consistent generation
  - Batch size for performance optimization
  - Chatterbox-specific: Exaggeration, CFG Weight
- Voice library with search and filtering
- Import/Export voice configurations

### 📝 Script Management
- Multi-speaker script support
- Real-time voice testing
- Batch audio generation
- Script templates and presets

### 🔧 Advanced Features
- Voice parameter fine-tuning
- Audio preview and testing
- Background processing with progress tracking
- Error handling and retry mechanisms
- Responsive UI with dark/light theme support

## 🛠️ Technical Details

### Frontend (React/TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI**: Tailwind CSS with custom components
- **State Management**: React hooks and context
- **Features**: Hot reload, TypeScript checking, responsive design

**Key Components:**
- `TTSEngineSelector`: Engine switching with persistence
- `VoiceCreator/VoiceEditor`: Voice parameter management
- `ScriptEditor`: Multi-speaker script editing
- `VoiceLibrary`: Voice management interface

### Backend (PHP)
- **Framework**: Pure PHP with routing
- **Database**: File-based storage (JSON)
- **API**: RESTful endpoints
- **Features**: CORS support, error handling, file uploads

**Key Services:**
- `AudioGenerationService`: Handles TTS requests with timeout management
- Voice CRUD operations
- Script management
- File upload handling

### Service (Python/FastAPI)
- **Framework**: FastAPI with async support
- **TTS Engines**: ChatTTS, Chatterbox integration
- **Audio Processing**: soundfile, numpy
- **Features**: Background tasks, health monitoring, parameter validation

**Key Features:**
- Engine abstraction layer
- Parameter conversion and validation
- Audio post-processing (speed adjustment, normalization)
- Comprehensive error handling and logging

## 📁 Project Structure

```
voices/
├── voice-generator/          # Frontend React App
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── types/           # TypeScript definitions
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # PHP Backend
│   ├── public/              # Web root
│   ├── src/                 # PHP source code
│   │   ├── controllers/     # API controllers
│   │   ├── services/        # Business logic
│   │   └── models/          # Data models
│   └── data/                # JSON data storage
├── service/                 # Python TTS Service
│   ├── src/                 # TTS engine implementations
│   ├── models/              # Pydantic models
│   ├── config/              # Configuration
│   └── main.py              # FastAPI app
└── README.md
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SERVICE_BASE_URL=http://localhost:9966
```

**Backend (.env)**
```env
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
```

**Service (.env)**
```env
HOST=localhost
PORT=9966
CORS_ORIGINS=["http://localhost:5173"]
```

## 🎵 Voice Parameters

### Universal Parameters
- **Speed**: 0.1-3.0 (playback speed)
- **Pitch**: 0.1-3.0 (voice pitch)
- **Temperature**: 0.1-1.0 (creativity/randomness)
- **Top-P**: 0.1-1.0 (nucleus sampling)
- **Top-K**: 1-100 (top-k sampling)
- **Seed**: Integer for reproducible results
- **Batch Size**: 1-10 (generation performance vs memory)

### Chatterbox-Specific
- **Exaggeration**: 0.0-1.0 (emotion control)
- **CFG Weight**: 0.0-1.0 (classifier-free guidance)

## 🚨 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find and kill process using port
netstat -ano | findstr :5173
taskkill /F /PID <process_id>
```

**TTS Engine Not Loading**
- Check Python dependencies: `pip install -r requirements.txt`
- Verify CUDA availability for GPU acceleration
- Check service logs for specific error messages

**Audio Generation Timeout**
- Increase PHP timeout settings in backend
- Check network connectivity between services
- Monitor service logs for processing status

**Frontend Build Errors**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Performance Optimization

**For Faster Audio Generation:**
- Increase batch_size parameter (uses more memory)
- Use GPU acceleration when available
- Consider engine-specific optimizations

**For Lower Memory Usage:**
- Decrease batch_size to 1
- Use CPU-only mode
- Close unused browser tabs

## 🔄 Development Workflow

1. **Start all services** in development mode
2. **Frontend development**: Hot reload at `:5173`
3. **Backend changes**: Restart PHP server
4. **Service changes**: Restart Python service
5. **Testing**: Use built-in voice testing features

## 📊 API Endpoints

### Backend (PHP) - Port 8000
- `GET /api/voices` - List all voices
- `POST /api/voices` - Create new voice
- `PUT /api/voices/{id}` - Update voice
- `DELETE /api/voices/{id}` - Delete voice
- `POST /api/generate` - Generate audio

### Service (Python) - Port 9966
- `GET /engines` - List available TTS engines
- `POST /engines/select` - Select TTS engine
- `POST /generate` - Generate TTS audio
- `GET /health` - Service health check

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **ChatTTS**: Advanced conversational TTS
- **Chatterbox**: Zero-shot voice conversion
- **React**: Frontend framework
- **FastAPI**: Python web framework
- **Tailwind CSS**: Utility-first CSS framework