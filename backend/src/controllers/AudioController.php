<?php

namespace VoiceGenerator\Controllers;

use VoiceGenerator\Models\AudioGeneration;
use VoiceGenerator\Services\AudioGenerationService;
use Exception;

class AudioController {
    private $audioModel;
    private $audioService;

    public function __construct() {
        $this->audioModel = new AudioGeneration();
        $this->audioService = new AudioGenerationService();
    }

    public function getAll(): void {
        try {
            header('Content-Type: application/json');
            
            $generations = $this->audioModel->all();
            echo json_encode([
                'success' => true,
                'data' => $generations->toArray()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch audio generations'
            ]);
        }
    }

    public function getById($id): void {
        try {
            header('Content-Type: application/json');
            
            $generation = $this->audioModel->find($id);
            if (!$generation) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Audio generation not found'
                ]);
                return;
            }

            echo json_encode([
                'success' => true,
                'data' => $generation->toArray()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch audio generation'
            ]);
        }
    }

    public function getByScriptId($scriptId): void {
        try {
            header('Content-Type: application/json');
            
            $generations = $this->audioModel->where('script_id', $scriptId)->get();
            echo json_encode([
                'success' => true,
                'data' => $generations->toArray()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch audio generations for script'
            ]);
        }
    }

    public function create(): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['script_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Script ID is required'
                ]);
                return;
            }

            $generation = $this->audioService->createGeneration($input['script_id']);
            
            header('Content-Type: application/json');
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => $generation
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to create audio generation'
            ]);
        }
    }

    public function generateSimple(): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['text']) || !isset($input['voice'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Text and voice parameters are required'
                ]);
                return;
            }

            $result = $this->audioService->generateSimple($input['text'], $input['voice']);
            
            header('Content-Type: application/json');
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => $result
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to generate audio: ' . $e->getMessage()
            ]);
        }
    }

    public function updateStatus($id): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            $generation = $this->audioModel->find($id);
            if (!$generation) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Audio generation not found'
                ]);
                return;
            }

            if (isset($input['status'])) {
                $generation->status = $input['status'];
            }
            if (isset($input['audio_file'])) {
                $generation->audio_file = $input['audio_file'];
            }
            if (isset($input['error_message'])) {
                $generation->error_message = $input['error_message'];
            }
            
            $generation->save();
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'data' => $generation->toArray()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to update audio generation'
            ]);
        }
    }

    public function delete($id): void {
        try {
            $generation = $this->audioModel->find($id);
            if (!$generation) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Audio generation not found'
                ]);
                return;
            }

            $generation->delete();
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Audio generation deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to delete audio generation'
            ]);
        }
    }
}