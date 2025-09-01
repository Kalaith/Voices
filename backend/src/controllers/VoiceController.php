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
            header('Content-Type: application/json');
            
            $voices = Voice::all();
            echo json_encode([
                'success' => true,
                'data' => $voices->toArray()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch voices'
            ]);
        }
    }

    public function getById(string $id): void {
        try {
            header('Content-Type: application/json');
            
            $voice = Voice::find($id);
            if (!$voice) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Voice not found'
                ]);
                return;
            }

            echo json_encode([
                'success' => true,
                'data' => $voice->toArray()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch voice'
            ]);
        }
    }

    public function create(): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['name'])) {
                http_response_code(400);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'Voice name is required'
                ]);
                return;
            }

            $input['id'] = $input['id'] ?? uniqid('voice_');
            $voice = Voice::create($input);
            
            header('Content-Type: application/json');
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => $voice->toArray()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error' => 'Failed to create voice'
            ]);
        }
    }

    public function update(string $id): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            $voice = Voice::find($id);
            if (!$voice) {
                http_response_code(404);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'Voice not found'
                ]);
                return;
            }

            $voice->update($input);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'data' => $voice->fresh()->toArray()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error' => 'Failed to update voice'
            ]);
        }
    }

    public function delete(string $id): void {
        try {
            $voice = Voice::find($id);
            if (!$voice) {
                http_response_code(404);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'Voice not found'
                ]);
                return;
            }

            $voice->delete();
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Voice deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error' => 'Failed to delete voice'
            ]);
        }
    }
}