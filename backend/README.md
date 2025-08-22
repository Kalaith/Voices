# Voice Generator Backend

PHP backend API for the Voice Generator application.

## Setup

1. Install dependencies:
```bash
composer install
```

2. Setup database:
```bash
# Create database and run migrations
mysql -u root -p < database/init.sql
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Start the server:
```bash
composer start
# Or: php -S localhost:8000 -t public/
```

## API Endpoints

### Voices
- `GET /api/voices` - Get all voices
- `GET /api/voices/{id}` - Get voice by ID
- `POST /api/voices` - Create new voice
- `PUT /api/voices/{id}` - Update voice
- `DELETE /api/voices/{id}` - Delete voice

### Scripts
- `GET /api/scripts` - Get all scripts
- `GET /api/scripts/{id}` - Get script by ID
- `POST /api/scripts` - Create new script
- `PUT /api/scripts/{id}` - Update script
- `DELETE /api/scripts/{id}` - Delete script

### Audio Generation
- `GET /api/audio` - Get all audio generations
- `GET /api/audio/{id}` - Get audio generation by ID
- `GET /api/audio/script/{scriptId}` - Get audio generations for script
- `POST /api/audio` - Start new audio generation
- `PUT /api/audio/{id}/status` - Update generation status
- `DELETE /api/audio/{id}` - Delete audio generation

### Health Check
- `GET /api/health` - API health status

## Database Schema

The backend uses MySQL with the following tables:
- `voices` - Voice configurations and parameters
- `scripts` - Script metadata
- `speakers` - Speakers within scripts
- `script_lines` - Individual lines of dialogue
- `audio_generations` - Audio generation jobs and status