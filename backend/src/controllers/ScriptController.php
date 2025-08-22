<?php

namespace VoiceGenerator\Controllers;

use VoiceGenerator\Models\Script;
use Exception;

class ScriptController {
    private $scriptModel;

    public function __construct() {
        $this->scriptModel = new Script();
    }

    public function getAll(): void {
        try {
            $scripts = $this->scriptModel->getAll();
            $this->jsonResponse($scripts);
        } catch (Exception $e) {
            $this->errorResponse('Failed to fetch scripts', 500);
        }
    }

    public function getById(string $id): void {
        try {
            $script = $this->scriptModel->getById($id);
            if (!$script) {
                $this->errorResponse('Script not found', 404);
                return;
            }
            $this->jsonResponse($script);
        } catch (Exception $e) {
            $this->errorResponse('Failed to fetch script', 500);
        }
    }

    public function create(): void {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['name'])) {
                $this->errorResponse('Script name is required', 400);
                return;
            }

            $id = $this->scriptModel->create($data);
            $script = $this->scriptModel->getById($id);
            
            $this->jsonResponse($script, 201);
        } catch (Exception $e) {
            $this->errorResponse('Failed to create script', 500);
        }
    }

    public function update(string $id): void {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $success = $this->scriptModel->update($id, $data);
            if (!$success) {
                $this->errorResponse('Script not found', 404);
                return;
            }

            $script = $this->scriptModel->getById($id);
            $this->jsonResponse($script);
        } catch (Exception $e) {
            $this->errorResponse('Failed to update script', 500);
        }
    }

    public function delete(string $id): void {
        try {
            $success = $this->scriptModel->delete($id);
            if (!$success) {
                $this->errorResponse('Script not found', 404);
                return;
            }
            
            $this->jsonResponse(['message' => 'Script deleted successfully']);
        } catch (Exception $e) {
            $this->errorResponse('Failed to delete script', 500);
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