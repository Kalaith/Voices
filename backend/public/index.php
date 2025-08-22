<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use VoiceGenerator\Config\Router;
use VoiceGenerator\Controllers\VoiceController;
use VoiceGenerator\Controllers\ScriptController;
use VoiceGenerator\Controllers\AudioController;
use VoiceGenerator\Controllers\ServiceController;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Enhanced CORS support for multiple frontend ports
$allowedOrigins = [
    $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173',
    'http://localhost:3000',  // React default
    'http://localhost:5173',  // Vite default  
    'http://localhost:5174',  // Vite alternative
    'http://localhost:8080',  // Vue/other
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174', 
    'http://127.0.0.1:8080'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:5173');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    header('Content-Length: 0');
    exit();
}

$router = new Router();

$voiceController = new VoiceController();
$scriptController = new ScriptController();
$audioController = new AudioController();
$serviceController = new ServiceController();

$router->get('/api/voices', function() use ($voiceController) { $voiceController->getAll(); });
$router->get('/api/voices/{id}', function($id) use ($voiceController) { $voiceController->getById($id); });
$router->post('/api/voices', function() use ($voiceController) { $voiceController->create(); });
$router->put('/api/voices/{id}', function($id) use ($voiceController) { $voiceController->update($id); });
$router->delete('/api/voices/{id}', function($id) use ($voiceController) { $voiceController->delete($id); });

$router->get('/api/scripts', function() use ($scriptController) { $scriptController->getAll(); });
$router->get('/api/scripts/{id}', function($id) use ($scriptController) { $scriptController->getById($id); });
$router->post('/api/scripts', function() use ($scriptController) { $scriptController->create(); });
$router->put('/api/scripts/{id}', function($id) use ($scriptController) { $scriptController->update($id); });
$router->delete('/api/scripts/{id}', function($id) use ($scriptController) { $scriptController->delete($id); });

$router->get('/api/audio', function() use ($audioController) { $audioController->getAll(); });
$router->get('/api/audio/{id}', function($id) use ($audioController) { $audioController->getById($id); });
$router->get('/api/audio/script/{scriptId}', function($scriptId) use ($audioController) { $audioController->getByScriptId($scriptId); });
$router->post('/api/audio', function() use ($audioController) { $audioController->create(); });
$router->post('/api/audio/generate', function() use ($audioController) { $audioController->generateSimple(); });
$router->put('/api/audio/{id}/status', function($id) use ($audioController) { $audioController->updateStatus($id); });
$router->delete('/api/audio/{id}', function($id) use ($audioController) { $audioController->delete($id); });

$router->get('/api/service/health', function() use ($serviceController) { $serviceController->healthCheck(); });
$router->get('/api/service/status/{serviceId}', function($serviceId) use ($serviceController) { $serviceController->getGenerationStatus($serviceId); });

// Proxy audio files from voice service
$router->get('/audio/{filename}', function($filename) {
    $serviceUrl = "http://localhost:9966/audio/{$filename}";
    
    // Get file from voice service
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $serviceUrl,
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_HEADER => false,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 10
    ]);
    
    // Set appropriate headers
    header('Content-Type: audio/wav');
    header('Content-Disposition: inline; filename="' . basename($filename) . '"');
    
    $result = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    if ($httpCode !== 200) {
        http_response_code(404);
        echo json_encode(['error' => 'Audio file not found']);
    }
});

$router->get('/api/health', function() {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'ok', 'timestamp' => time()]);
});

try {
    $router->handle();
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Internal server error']);
}