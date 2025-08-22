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
            $generations = $this->audioModel->getAll();
            $this->jsonResponse($generations);
        } catch (Exception $e) {
            $this->errorResponse('Failed to fetch audio generations', 500);
        }
    }

    public function getById(string $id): void {
        try {
            $generation = $this->audioModel->getById($id);
            if (!$generation) {
                $this->errorResponse('Audio generation not found', 404);
                return;
            }
            $this->jsonResponse($generation);
        } catch (Exception $e) {
            $this->errorResponse('Failed to fetch audio generation', 500);
        }
    }

    public function getByScriptId(string $scriptId): void {
        try {
            $generations = $this->audioModel->getByScriptId($scriptId);
            $this->jsonResponse($generations);
        } catch (Exception $e) {
            $this->errorResponse('Failed to fetch audio generations', 500);
        }
    }

    public function create(): void {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['scriptId'])) {
                $this->errorResponse('Script ID is required', 400);
                return;
            }

            $result = $this->audioService->generateScriptAudio($data['scriptId']);
            
            if (isset($result['error'])) {
                $this->errorResponse($result['error'], 500);
                return;
            }
            
            $this->jsonResponse($result, 201);
        } catch (Exception $e) {
            $this->errorResponse('Failed to start audio generation', 500);
        }
    }

    public function generateSimple(): void {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['text']) || !isset($data['voice'])) {
                $this->errorResponse('Text and voice are required', 400);
                return;
            }

            $result = $this->audioService->generateSimpleAudio($data['text'], $data['voice']);
            
            if (isset($result['error'])) {
                $this->errorResponse($result['error'], 500);
                return;
            }
            
            $this->jsonResponse($result, 201);
        } catch (Exception $e) {
            $this->errorResponse('Failed to generate audio', 500);
        }
    }

    public function updateStatus(string $id): void {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['status'])) {
                $this->errorResponse('Status is required', 400);
                return;
            }

            $success = $this->audioModel->updateStatus($id, $data['status'], $data);
            if (!$success) {
                $this->errorResponse('Audio generation not found', 404);
                return;
            }

            $generation = $this->audioModel->getById($id);
            $this->jsonResponse($generation);
        } catch (Exception $e) {
            $this->errorResponse('Failed to update audio generation', 500);
        }
    }

    public function delete(string $id): void {
        try {
            $success = $this->audioModel->delete($id);
            if (!$success) {
                $this->errorResponse('Audio generation not found', 404);
                return;
            }
            
            $this->jsonResponse(['message' => 'Audio generation deleted successfully']);
        } catch (Exception $e) {
            $this->errorResponse('Failed to delete audio generation', 500);
        }
    }

    private function jsonResponse($data, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
    }

    private function errorResponse(string $message, int $status = 400): void {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode(['error' => $message]);
    }
}