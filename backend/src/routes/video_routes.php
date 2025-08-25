<?php

// Video Generation API Routes
// This file contains all the new routes for video generation functionality

require_once dirname(__DIR__) . '/controllers/CharacterController.php';
require_once dirname(__DIR__) . '/controllers/VideoProjectController.php';
require_once dirname(__DIR__) . '/controllers/ScriptControllerExtensions.php';

// Initialize controllers
$characterController = new CharacterController();
$videoProjectController = new VideoProjectController();
$scriptExtensions = new ScriptControllerExtensions();

// Character management routes
$router->post('/api/characters', [$characterController, 'createCharacter']);
$router->get('/api/characters', [$characterController, 'getCharacters']);
$router->get('/api/characters/{id}', [$characterController, 'getCharacter']);
$router->put('/api/characters/{id}', [$characterController, 'updateCharacter']);
$router->delete('/api/characters/{id}', [$characterController, 'deleteCharacter']);

// Character expressions
$router->get('/api/characters/{id}/expressions', [$characterController, 'getCharacterExpressions']);
$router->post('/api/characters/{id}/expressions', [$characterController, 'updateCharacterExpression']);

// Video project routes
$router->post('/api/video/projects', [$videoProjectController, 'createProject']);
$router->get('/api/video/projects', [$videoProjectController, 'getProjects']);
$router->get('/api/video/projects/{id}', [$videoProjectController, 'getProject']);
$router->get('/api/video/projects/{id}/details', [$videoProjectController, 'getProjectWithScript']);
$router->put('/api/video/projects/{id}', [$videoProjectController, 'updateProject']);
$router->delete('/api/video/projects/{id}', [$videoProjectController, 'deleteProject']);
$router->get('/api/video/projects/{id}/stats', [$videoProjectController, 'getProjectStats']);

// Enhanced script routes
$router->get('/api/scripts/{id}/video-data', [$scriptExtensions, 'getScriptWithVideoData']);
$router->put('/api/script-lines/{id}', [$scriptExtensions, 'updateScriptLine']);
$router->post('/api/script-lines/batch-update', [$scriptExtensions, 'batchUpdateScriptLines']);
$router->get('/api/scripts/{id}/readiness', [$scriptExtensions, 'getScriptReadiness']);
$router->post('/api/scripts/{id}/auto-generate-scenes', [$scriptExtensions, 'autoGenerateSceneData']);

// Handle OPTIONS requests for CORS
$router->options('/api/characters', function() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(200);
});

$router->options('/api/characters/{id}', function() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(200);
});

$router->options('/api/video/projects', function() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(200);
});

$router->options('/api/video/projects/{id}', function() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(200);
});

$router->options('/api/script-lines/{id}', function() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(200);
});

$router->options('/api/scripts/{id}/video-data', function() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(200);
});