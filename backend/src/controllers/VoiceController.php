<?php

namespace VoiceGenerator\Controllers;

use VoiceGenerator\Models\Voice;
use Exception;

class VoiceController {
    private $voiceModel;

    public function __construct() {
        $this->voiceModel = new Voice();
    }

    public function getAll(): void {
        try {
            $voices = $this->voiceModel->getAll();
            $this->jsonResponse($voices);
        } catch (Exception $e) {
            $this->errorResponse('Failed to fetch voices', 500);
        }
    }

    public function getById(string $id): void {
        try {
            $voice = $this->voiceModel->getById($id);
            if (!$voice) {
                $this->errorResponse('Voice not found', 404);
                return;
            }
            $this->jsonResponse($voice);
        } catch (Exception $e) {
            $this->errorResponse('Failed to fetch voice', 500);
        }
    }

    public function create(): void {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['name'])) {
                $this->errorResponse('Voice name is required', 400);
                return;
            }

            $data['id'] = $data['id'] ?? uniqid('voice_');
            $id = $this->voiceModel->create($data);
            $voice = $this->voiceModel->getById($id);
            
            $this->jsonResponse($voice, 201);
        } catch (Exception $e) {
            $this->errorResponse('Failed to create voice', 500);
        }
    }

    public function update(string $id): void {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $success = $this->voiceModel->update($id, $data);
            if (!$success) {
                $this->errorResponse('Voice not found or no changes made', 404);
                return;
            }

            $voice = $this->voiceModel->getById($id);
            $this->jsonResponse($voice);
        } catch (Exception $e) {
            $this->errorResponse('Failed to update voice', 500);
        }
    }

    public function delete(string $id): void {
        try {
            $success = $this->voiceModel->delete($id);
            if (!$success) {
                $this->errorResponse('Voice not found', 404);
                return;
            }
            
            $this->jsonResponse(['message' => 'Voice deleted successfully']);
        } catch (Exception $e) {
            $this->errorResponse('Failed to delete voice', 500);
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