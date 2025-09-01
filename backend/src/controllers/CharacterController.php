<?php

require_once __DIR__ . '/../config/Database.php';
use VoiceGenerator\Config\Database;

class CharacterController {
    private $db;
    
    public function __construct($database = null) {
        $this->db = $database ?? Database::getInstance()->getConnection();
    }
    
    public function createCharacter() {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($input['name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Character name is required']);
                return;
            }
            
            // Check if character name already exists
            $checkStmt = $this->db->prepare("SELECT id FROM character_profiles WHERE name = ?");
            $checkStmt->execute([$input['name']]);
            if ($checkStmt->fetch()) {
                http_response_code(409);
                echo json_encode(['error' => 'Character name already exists']);
                return;
            }
            
            $stmt = $this->db->prepare("
                INSERT INTO character_profiles (name, description, voice_profile_id, base_portrait_url) 
                VALUES (?, ?, ?, ?)
            ");
            
            $success = $stmt->execute([
                $input['name'],
                $input['description'] ?? '',
                !empty($input['voice_profile_id']) ? $input['voice_profile_id'] : null,
                $input['base_portrait_url'] ?? null
            ]);
            
            if ($success) {
                $characterId = $this->db->lastInsertId();
                
                // Create default expressions for the character
                $this->createDefaultExpressions($characterId);
                
                // Return the created character
                $character = $this->getCharacterById($characterId);
                http_response_code(201);
                echo json_encode($character);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create character']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    public function getCharacters() {
        header('Content-Type: application/json');
        
        try {
            $stmt = $this->db->query("
                SELECT cp.*, v.name as voice_name, v.parameters as voice_parameters
                FROM character_profiles cp 
                LEFT JOIN voices v ON cp.voice_profile_id = v.id
                ORDER BY cp.name
            ");
            
            $characters = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Add expression counts
            foreach ($characters as &$character) {
                $exprStmt = $this->db->prepare("
                    SELECT COUNT(*) as expression_count 
                    FROM character_expressions 
                    WHERE character_id = ?
                ");
                $exprStmt->execute([$character['id']]);
                $character['expression_count'] = (int)$exprStmt->fetchColumn();
            }
            
            echo json_encode($characters);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    public function getCharacter($id) {
        header('Content-Type: application/json');
        
        try {
            $character = $this->getCharacterById($id);
            
            if ($character) {
                echo json_encode($character);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Character not found']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    public function updateCharacter($id) {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Check if character exists
            if (!$this->getCharacterById($id)) {
                http_response_code(404);
                echo json_encode(['error' => 'Character not found']);
                return;
            }
            
            // Validate required fields
            if (empty($input['name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Character name is required']);
                return;
            }
            
            // Check if new name conflicts with existing character (excluding current)
            $checkStmt = $this->db->prepare("SELECT id FROM character_profiles WHERE name = ? AND id != ?");
            $checkStmt->execute([$input['name'], $id]);
            if ($checkStmt->fetch()) {
                http_response_code(409);
                echo json_encode(['error' => 'Character name already exists']);
                return;
            }
            
            $stmt = $this->db->prepare("
                UPDATE character_profiles 
                SET name = ?, description = ?, voice_profile_id = ?, base_portrait_url = ?
                WHERE id = ?
            ");
            
            $success = $stmt->execute([
                $input['name'],
                $input['description'] ?? '',
                !empty($input['voice_profile_id']) ? $input['voice_profile_id'] : null,
                $input['base_portrait_url'] ?? null,
                $id
            ]);
            
            if ($success) {
                $character = $this->getCharacterById($id);
                echo json_encode($character);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update character']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    public function deleteCharacter($id) {
        header('Content-Type: application/json');
        
        try {
            // Check if character exists
            if (!$this->getCharacterById($id)) {
                http_response_code(404);
                echo json_encode(['error' => 'Character not found']);
                return;
            }
            
            // Check if character is used in any scripts
            $usageStmt = $this->db->prepare("
                SELECT COUNT(*) as usage_count 
                FROM script_lines 
                WHERE character_name = (SELECT name FROM character_profiles WHERE id = ?)
            ");
            $usageStmt->execute([$id]);
            $usageCount = (int)$usageStmt->fetchColumn();
            
            if ($usageCount > 0) {
                http_response_code(409);
                echo json_encode([
                    'error' => 'Cannot delete character - it is used in ' . $usageCount . ' script lines',
                    'usage_count' => $usageCount
                ]);
                return;
            }
            
            $stmt = $this->db->prepare("DELETE FROM character_profiles WHERE id = ?");
            $success = $stmt->execute([$id]);
            
            if ($success) {
                echo json_encode(['message' => 'Character deleted successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete character']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    public function getCharacterExpressions($id) {
        header('Content-Type: application/json');
        
        try {
            // Check if character exists
            if (!$this->getCharacterById($id)) {
                http_response_code(404);
                echo json_encode(['error' => 'Character not found']);
                return;
            }
            
            $stmt = $this->db->prepare("
                SELECT * FROM character_expressions 
                WHERE character_id = ? 
                ORDER BY emotion
            ");
            $stmt->execute([$id]);
            $expressions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode($expressions);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    public function updateCharacterExpression($id) {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Check if character exists
            if (!$this->getCharacterById($id)) {
                http_response_code(404);
                echo json_encode(['error' => 'Character not found']);
                return;
            }
            
            if (empty($input['emotion'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Emotion is required']);
                return;
            }
            
            $stmt = $this->db->prepare("
                INSERT INTO character_expressions (character_id, emotion, expression_prompt, image_path)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                expression_prompt = VALUES(expression_prompt),
                image_path = VALUES(image_path)
            ");
            
            $success = $stmt->execute([
                $id,
                $input['emotion'],
                $input['expression_prompt'] ?? '',
                $input['image_path'] ?? null
            ]);
            
            if ($success) {
                // Return updated expression
                $exprStmt = $this->db->prepare("
                    SELECT * FROM character_expressions 
                    WHERE character_id = ? AND emotion = ?
                ");
                $exprStmt->execute([$id, $input['emotion']]);
                $expression = $exprStmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode($expression);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update expression']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    private function getCharacterById($id) {
        $stmt = $this->db->prepare("
            SELECT cp.*, v.name as voice_name, v.parameters as voice_parameters
            FROM character_profiles cp 
            LEFT JOIN voices v ON cp.voice_profile_id = v.id
            WHERE cp.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    private function createDefaultExpressions($characterId) {
        $defaultExpressions = [
            'neutral' => 'neutral expression, calm face',
            'happy' => 'happy expression, smiling',
            'sad' => 'sad expression, downcast eyes',
            'angry' => 'angry expression, furrowed brow',
            'surprised' => 'surprised expression, wide eyes',
            'confused' => 'confused expression, tilted head'
        ];
        
        $stmt = $this->db->prepare("
            INSERT INTO character_expressions (character_id, emotion, expression_prompt)
            VALUES (?, ?, ?)
        ");
        
        foreach ($defaultExpressions as $emotion => $prompt) {
            $stmt->execute([$characterId, $emotion, $prompt]);
        }
    }
}