# Voice Script Generator

A React-based web application for creating custom voices and generating audio from multi-speaker scripts using ChatTTS.

## Features

- **Custom Voice Creation**: Create voices with customizable parameters (speed, pitch, temperature, top_p, top_k)
- **Multi-Speaker Script Editor**: Write scripts with multiple speakers, each using different voices
- **Audio Generation**: Generate audio from scripts using ChatTTS integration
- **Audio Playback**: Built-in audio player with playback controls and download functionality
- **Responsive Design**: Clean, modern UI built with TailwindCSS

## Prerequisites

- Node.js (v16 or higher)
- ChatTTS service running locally (default: http://localhost:9966)

## Installation

1. Clone or navigate to the project directory:
   ```bash
   cd voice-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the displayed local URL (typically `http://localhost:5173`)

## Usage

### 1. Create Custom Voices

- Click the "Create Voice" button in the left sidebar
- Enter a name and optional description
- Adjust voice parameters using the sliders:
  - **Speed**: Controls speaking rate (0.5-2.0)
  - **Pitch**: Controls voice pitch (0.5-2.0)
  - **Temperature**: Controls randomness in generation (0.1-1.0)
  - **Top P**: Controls nucleus sampling (0.1-1.0)
  - **Top K**: Controls top-k sampling (1-50)

### 2. Create Scripts

- Click "New Script" to create a new script
- Add speakers by selecting a voice and entering a speaker name
- Each speaker gets a unique color for easy identification

### 3. Write Script Lines

- Click "Add Line" to add dialogue
- Select the speaker for each line
- Enter the dialogue text
- Lines are numbered automatically

### 4. Generate Audio

- Click "Generate Audio" when your script is complete
- The application will generate audio for each line sequentially
- Progress is shown during generation
- Generated audio will appear in the audio player below

### 5. Audio Playback

- Use the built-in player to listen to generated audio
- Controls include play/pause, seek, and download
- Download audio files for external use

## ChatTTS Integration

The application expects a ChatTTS service running on `http://localhost:9966` with the following endpoints:

- `GET /health` - Health check endpoint
- `POST /generate` - Audio generation endpoint

### Expected API Format

```typescript
// POST /generate
{
  "text": "Hello world",
  "temperature": 0.3,
  "top_p": 0.7,
  "top_k": 20,
  "speed": 1.0,
  "pitch": 1.0
}

// Response: Audio blob
```

## Project Structure

```
src/
├── components/
│   ├── AudioPlayer.tsx     # Audio playback component
│   ├── ScriptEditor.tsx    # Script editing interface
│   └── VoiceCreator.tsx    # Voice creation modal
├── services/
│   └── chatTTSService.ts   # ChatTTS API integration
├── styles/
│   └── globals.css         # Custom styles
├── types.ts                # TypeScript definitions
├── App.tsx                 # Main application
└── main.tsx               # Application entry point
```

## Development

Built with:
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server with Tailwind integration
- **TailwindCSS** - Utility-first CSS framework
- **ChatTTS** - Text-to-speech generation

## Troubleshooting

**ChatTTS Connection Issues:**
- Ensure ChatTTS service is running on `http://localhost:9966`
- Check the connection status indicator in the app header
- Use the "Retry Connection" button to test connectivity

**Audio Generation Fails:**
- Verify all script lines have text content
- Check that speakers are assigned to voices
- Ensure ChatTTS service is responding correctly

**Audio Playback Issues:**
- Modern browsers may require user interaction before playing audio
- Check browser console for any audio-related errors
