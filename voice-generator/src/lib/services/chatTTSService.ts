import { Voice } from '../../types/voice';
import { Script } from '../../types/script';

export interface ChatTTSResponse {
  audio_url: string;
  duration: number;
}

export interface TTSGenerationResponse {
  id: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  audio_url?: string;
  duration?: number;
  error?: string;
}

export interface EngineInfo {
  available_engines: string[];
  current_engine: string | null;
  engines_info: Record<string, any>;
  engines_health: Record<string, any>;
}

class ChatTTSService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:9966') {
    this.baseUrl = baseUrl;
  }

  async generateSpeech(text: string, voice: Voice, engine?: string): Promise<ChatTTSResponse> {
    try {
      // Start generation request
      const generateResponse = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice,
          engine,
        }),
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error(`HTTP error starting generation:`);
        console.error(`  Status: ${generateResponse.status}`);
        console.error(`  Status Text: ${generateResponse.statusText}`);
        console.error(`  Response Body: ${errorText}`);
        console.error(`  Request Body:`, JSON.stringify({ text, voice, engine }));
        throw new Error(`HTTP ${generateResponse.status}: ${generateResponse.statusText} - ${errorText}`);
      }

      const generationData: TTSGenerationResponse = await generateResponse.json();
      
      // Poll for completion
      const result = await this.pollForCompletion(generationData.id);
      
      return {
        audio_url: result.audio_url || '',
        duration: result.duration || 0,
      };
    } catch (error) {
      console.error('Error generating speech:', error);
      throw new Error('Failed to generate speech');
    }
  }

  async generateSpeechDirect(text: string, voice: Voice, engine?: string): Promise<TTSGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice,
          engine,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating speech:', error);
      throw new Error('Failed to generate speech');
    }
  }

  async pollForCompletion(generationId: string): Promise<TTSGenerationResponse> {
    const maxAttempts = 600; // 10 minutes with 1-second intervals (increased for chatterbox)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.baseUrl}/generate/${generationId}`);
        
        if (!response.ok) {
          // Log more detailed error information
          const errorText = await response.text();
          console.error(`HTTP error polling generation ${generationId}:`);
          console.error(`  Status: ${response.status}`);
          console.error(`  Status Text: ${response.statusText}`);
          console.error(`  Response Body: ${errorText}`);
          console.error(`  Headers:`, Object.fromEntries(response.headers.entries()));
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const result: TTSGenerationResponse = await response.json();
        console.log(`Poll attempt ${attempts + 1}/${maxAttempts}:`, result.status);

        if (result.status === 'completed') {
          console.log('Generation completed successfully');
          return result;
        }

        if (result.status === 'error') {
          console.error('Generation error:', result.error);
          throw new Error(result.error || 'Generation failed');
        }

        // Wait longer for initial attempts (chatterbox takes time to start)
        const waitTime = attempts < 10 ? 2000 : 1000; // 2 seconds for first 10 attempts, then 1 second
        await new Promise(resolve => setTimeout(resolve, waitTime));
        attempts++;
      } catch (error) {
        console.error('Error polling for completion:', error);
        // If it's a fetch error, retry a few times before giving up
        if (attempts < 3) {
          console.log('Retrying due to fetch error...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
          continue;
        }
        throw error;
      }
    }

    throw new Error('Generation timeout - process may still be running on server');
  }

  async generateScriptAudio(
    script: Script, 
    voices: Voice[],
    engine?: string,
    onProgress?: (progress: number, currentLine: number, totalLines: number) => void
  ): Promise<string[]> {
    try {
      // Use the script generation endpoint
      const response = await fetch(`${this.baseUrl}/generate/script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script,
          voices,
          engine,
          combine_audio: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const generationData: TTSGenerationResponse = await response.json();
      
      // Poll for completion with progress updates
      const result = await this.pollForCompletionWithProgress(generationData.id, onProgress);
      
      return result.audio_url ? [result.audio_url] : [];
    } catch (error) {
      console.error('Error generating script audio:', error);
      throw new Error('Failed to generate script audio');
    }
  }

  async pollForCompletionWithProgress(
    generationId: string,
    onProgress?: (progress: number, currentLine: number, totalLines: number) => void
  ): Promise<TTSGenerationResponse> {
    const maxAttempts = 600; // 10 minutes with 1-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.baseUrl}/generate/${generationId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: TTSGenerationResponse = await response.json();

        // Update progress (rough estimation based on time)
        if (onProgress && result.status === 'generating') {
          const progress = Math.min((attempts / maxAttempts) * 100, 90);
          onProgress(progress, attempts, maxAttempts);
        }

        if (result.status === 'completed') {
          if (onProgress) {
            onProgress(100, maxAttempts, maxAttempts);
          }
          return result;
        }

        if (result.status === 'error') {
          throw new Error(result.error || 'Generation failed');
        }

        // Wait 1 second before next poll
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        console.error('Error polling for completion:', error);
        throw error;
      }
    }

    throw new Error('Generation timeout');
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Engine management methods
  async getEngines(): Promise<EngineInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/engines`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching engines:', error);
      throw new Error('Failed to fetch engines');
    }
  }

  async selectEngine(engineName: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/engines/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ engine_name: engineName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error selecting engine:', error);
      throw error;
    }
  }

  async getEngineParameters(engineName: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/engines/${engineName}/parameters`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.supported_parameters || [];
    } catch (error) {
      console.error('Error fetching engine parameters:', error);
      throw new Error('Failed to fetch engine parameters');
    }
  }
}

export const chatTTSService = new ChatTTSService();