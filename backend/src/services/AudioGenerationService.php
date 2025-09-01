<?php

namespace VoiceGenerator\Services;

use VoiceGenerator\Models\AudioGeneration;
use VoiceGenerator\Models\Script;
use VoiceGenerator\Models\Voice;

class AudioGenerationService {
    private $serviceBaseUrl;

    public function __construct() {
        $this->serviceBaseUrl = 'http://localhost:9966';
    }

    public function generateScriptAudio(string $scriptId): array {
        try {
            // Get script data
            $script = Script::find($scriptId);
            if (!$script) {
                throw new \Exception("Script not found");
            }

            // Get all voices
            $voices = Voice::all();

            // Create audio generation record
            $audioGenerationId = uniqid('audio_');
            $audioGeneration = AudioGeneration::create([
                'id' => $audioGenerationId,
                'script_id' => $scriptId,
                'status' => 'pending'
            ]);

            // Send request to service
            $response = $this->callService('/generate/script', [
                'script' => $script->toArray(),
                'voices' => $voices->toArray(),
                'combine_audio' => true
            ]);

            if (isset($response['error'])) {
                $audioGeneration->update([
                    'status' => 'error',
                    'error_message' => $response['error']
                ]);
                return ['error' => $response['error']];
            }

            // Update status to generating
            $audioGeneration->update(['status' => 'generating']);

            // Return generation info
            return [
                'id' => $audioGenerationId,
                'service_id' => $response['id'] ?? null,
                'status' => 'generating'
            ];

        } catch (\Exception $e) {
            if (isset($audioGeneration)) {
                $audioGeneration->update([
                    'status' => 'error',
                    'error_message' => $e->getMessage()
                ]);
            }
            return ['error' => $e->getMessage()];
        }
    }

    public function generateSimpleAudio(string $text, array $voice): array {
        try {
            // Increase PHP execution time limit for long generations
            set_time_limit(600); // 10 minutes
            
            // Format voice data for Python service - it expects nested parameters structure
            $formattedVoice = [
                'id' => $voice['id'] ?? 'default',
                'name' => $voice['name'] ?? 'Default Voice',
                'parameters' => [
                    'speed' => $voice['speed'] ?? 1.0,
                    'pitch' => $voice['pitch'] ?? 1.0,
                    'temperature' => $voice['temperature'] ?? 0.3,
                    'top_p' => $voice['top_p'] ?? 0.7,
                    'top_k' => $voice['top_k'] ?? 50,
                ]
            ];
            
            $response = $this->callService('/generate', [
                'text' => $text,
                'voice' => $formattedVoice
            ]);

            if (isset($response['error'])) {
                return ['error' => $response['error']];
            }

            // Poll for completion if we got a generation ID
            if (isset($response['id'])) {
                $maxAttempts = 600; // 10 minutes max wait (600 seconds)
                $attempts = 0;
                
                while ($attempts < $maxAttempts) {
                    sleep(1);
                    $status = $this->getGenerationStatus($response['id']);
                    
                    if (isset($status['status'])) {
                        if ($status['status'] === 'completed') {
                            return [
                                'audio_url' => $status['audio_url'] ?? null,
                                'status' => 'completed'
                            ];
                        } elseif ($status['status'] === 'error') {
                            return ['error' => $status['error'] ?? 'Generation failed'];
                        }
                    }
                    
                    $attempts++;
                }
                
                return ['error' => 'Generation timed out'];
            }

            return $response;

        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }

    public function getGenerationStatus(string $serviceId): ?array {
        try {
            return $this->callService("/generate/{$serviceId}", null, 'GET');
        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }

    public function generateSimple(string $text, array $voice): array {
        return $this->generateSimpleAudio($text, $voice);
    }

    public function createGeneration(string $scriptId): array {
        return $this->generateScriptAudio($scriptId);
    }

    public function checkServiceHealth(): array {
        try {
            $response = $this->callService('/health', null, 'GET');
            return [
                'available' => true,
                'status' => $response['status'] ?? 'unknown',
                'chatts_loaded' => $response['chatts_loaded'] ?? false
            ];
        } catch (Exception $e) {
            return [
                'available' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    private function callService(string $endpoint, ?array $data = null, string $method = 'POST'): array {
        $url = $this->serviceBaseUrl . $endpoint;
        
        $curl = curl_init();
        
        $curlOptions = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 60, // Increased from 30 to 60 seconds for individual requests
            CURLOPT_CONNECTTIMEOUT => 10, // 10 seconds to establish connection
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json'
            ]
        ];

        if ($method === 'POST' && $data !== null) {
            $curlOptions[CURLOPT_POST] = true;
            $curlOptions[CURLOPT_POSTFIELDS] = json_encode($data);
        } elseif ($method === 'GET') {
            $curlOptions[CURLOPT_HTTPGET] = true;
        }

        curl_setopt_array($curl, $curlOptions);
        
        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        
        curl_close($curl);
        
        if ($error) {
            throw new \Exception("Service communication error: {$error}");
        }
        
        if ($httpCode >= 400) {
            throw new \Exception("Service error: HTTP {$httpCode}");
        }
        
        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception("Invalid JSON response from service");
        }
        
        return $decoded;
    }
}