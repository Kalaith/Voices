<?php

namespace VoiceGenerator\Controllers;

use VoiceGenerator\Services\AudioGenerationService;
use Exception;

class ServiceController {
    private $audioService;

    public function __construct() {
        $this->audioService = new AudioGenerationService();
    }

    public function healthCheck(): void {
        try {
            $health = $this->audioService->checkServiceHealth();
            $this->jsonResponse($health);
        } catch (Exception $e) {
            $this->errorResponse('Failed to check service health', 500);
        }
    }

    public function getGenerationStatus(string $serviceId): void {
        try {
            $status = $this->audioService->getGenerationStatus($serviceId);
            
            if (isset($status['error'])) {
                $this->errorResponse($status['error'], 500);
                return;
            }
            
            $this->jsonResponse($status);
        } catch (Exception $e) {
            $this->errorResponse('Failed to get generation status', 500);
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