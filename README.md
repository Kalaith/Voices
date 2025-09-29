# Voices - Voice Management Web Application

A voice and audio management system for organizing, storing, and managing voice content and audio files.

## 🏗️ Architecture

This is a web application consisting of:

- **Frontend**: React/TypeScript application with Vite
- **Backend**: PHP REST API for data management

```
voices/
├── frontend/           # React frontend
├── backend/           # PHP API server
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (for frontend)
- **PHP** 8.0+ with extensions: `curl`, `json`, `mbstring`
- **Git**

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voices
   ```

2. **Start the services** (run each in a separate terminal):

   **Frontend (Terminal 1):**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Runs on http://localhost:5173
   ```

   **Backend (Terminal 2):**
   ```bash
   cd backend
   composer install
   composer run start
   # Runs on http://localhost:8000
   ```

3. **Open the application**
   - Navigate to `http://localhost:5173` in your browser

## 🎯 Features

### 🎤 Voice Management
- Voice library with search and filtering
- Voice configuration storage and retrieval
- Import/Export voice settings
- Voice parameter organization

### 📝 Audio Content Management
- Audio file upload and organization
- Playback controls and preview
- Metadata management
- Content categorization

### 🔧 Web Interface
- Responsive design for desktop and mobile
- Dark/light theme support
- Real-time updates and progress tracking
- User-friendly audio management interface

## 🛠️ Technical Details

### Frontend (React/TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI**: Tailwind CSS with custom components
- **State Management**: React hooks and context
- **Features**: Hot reload, TypeScript checking, responsive design

**Key Components:**
- `VoiceLibrary`: Voice management interface
- `AudioPlayer`: Audio playback controls
- `FileUpload`: File management system
- `Dashboard`: Main application interface

### Backend (PHP)
- **Framework**: Slim Framework with PSR standards
- **Database**: File-based storage (JSON)
- **API**: RESTful endpoints with proper HTTP methods
- **Features**: CORS support, error handling, file uploads

**Key Services:**
- Voice CRUD operations
- Audio file management
- User session handling
- File upload processing

## 📁 Project Structure

```
voices/
├── frontend/                # Frontend React App
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                # PHP Backend
│   ├── public/             # Web root
│   ├── src/                # PHP source code
│   │   ├── Controllers/    # API controllers
│   │   ├── Services/       # Business logic
│   │   ├── Models/         # Data models
│   │   └── Actions/        # Action handlers
│   └── data/               # JSON data storage
└── README.md
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:8000
```

**Backend (.env)**
```env
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
```

## 🔄 Development Workflow

1. **Start both services** in development mode
2. **Frontend development**: Hot reload at `:5173`
3. **Backend changes**: Restart PHP server if needed
4. **Testing**: Use built-in interface features

## 📊 API Endpoints

### Backend (PHP) - Port 8000
- `GET /api/voices` - List all voices
- `POST /api/voices` - Create new voice
- `PUT /api/voices/{id}` - Update voice
- `DELETE /api/voices/{id}` - Delete voice
- `POST /api/upload` - Upload audio files
- `GET /api/files` - List uploaded files

## 🚨 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find and kill process using port
netstat -ano | findstr :5173
taskkill /F /PID <process_id>
```

**Frontend Build Errors**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**PHP Backend Issues**
```bash
# Check PHP version
php --version

# Install dependencies
cd backend && composer install
```

## 🔗 Related Projects

### VideoGeneration Project
For AI-powered video creation capabilities, see the separate [VideoGeneration](H:\VideoGeneration\README.md) project which includes:

- **AI Script Generation** (KoboldAI)
- **Background Generation** (ComfyUI)
- **Voice Synthesis** (TTS Service)
- **Video Assembly** (FFmpeg)

The VideoGeneration project can be used independently or integrated with this web application for complete video production workflows.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.
