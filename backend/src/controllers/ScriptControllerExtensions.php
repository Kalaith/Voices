<?php

require_once dirname(__DIR__) . '/config/Database.php';

/**
 * Extensions to the ScriptController for video generation functionality
 * This file adds video-specific methods to work with the existing ScriptController
 */
class ScriptControllerExtensions {
    private $db;
    
    public function __construct($database = null) {
        $this->db = $database ?? (new Database())->getConnection();
    }
    
    /**
     * Get script with enhanced video data including character and scene information
     */
    public function getScriptWithVideoData($id) {
        header('Content-Type: application/json');
        
        try {
            // First get the basic script info
            $stmt = $this->db->prepare("SELECT * FROM scripts WHERE id = ?");
            $stmt->execute([$id]);
            $script = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$script) {
                http_response_code(404);
                echo json_encode(['error' => 'Script not found']);
                return;
            }
            
            // Get enhanced script lines with character and voice information
            $stmt = $this->db->prepare("
                SELECT 
                    sl.*,
                    cp.name as character_display_name,
                    cp.description as character_description,
                    cp.base_portrait_url,
                    cp.voice_profile_id,
                    v.name as voice_name,
                    v.parameters as voice_parameters
                FROM script_lines sl
                LEFT JOIN character_profiles cp ON sl.character_name = cp.name
                LEFT JOIN voices v ON cp.voice_profile_id = v.id
                WHERE sl.script_id = ?
                ORDER BY sl.line_order
            ");
            $stmt->execute([$id]);
            $script['lines'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get unique scenes with background prompts
            $stmt = $this->db->prepare("
                SELECT 
                    scene_id, 
                    background_prompt,
                    COUNT(*) as line_count,
                    GROUP_CONCAT(DISTINCT character_name) as characters_in_scene
                FROM script_lines 
                WHERE script_id = ? AND scene_id IS NOT NULL AND scene_id != ''
                GROUP BY scene_id, background_prompt
                ORDER BY MIN(line_order)
            ");
            $stmt->execute([$id]);
            $scenes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($scenes as &$scene) {
                $scene['line_count'] = (int)$scene['line_count'];
                $scene['characters_in_scene'] = $scene['characters_in_scene'] ? explode(',', $scene['characters_in_scene']) : [];
            }
            $script['scenes'] = $scenes;
            
            // Get character usage statistics
            $stmt = $this->db->prepare("
                SELECT 
                    sl.character_name,
                    cp.name as character_display_name,
                    cp.base_portrait_url,
                    cp.voice_profile_id,
                    v.name as voice_name,
                    COUNT(sl.id) as line_count,
                    COUNT(DISTINCT sl.scene_id) as scene_count
                FROM script_lines sl
                LEFT JOIN character_profiles cp ON sl.character_name = cp.name
                LEFT JOIN voices v ON cp.voice_profile_id = v.id
                WHERE sl.script_id = ? AND sl.character_name IS NOT NULL AND sl.character_name != ''
                GROUP BY sl.character_name
                ORDER BY line_count DESC
            ");
            $stmt->execute([$id]);
            $characters = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($characters as &$character) {
                $character['line_count'] = (int)$character['line_count'];
                $character['scene_count'] = (int)$character['scene_count'];
            }
            $script['characters'] = $characters;
            
            // Add script statistics
            $script['stats'] = [
                'total_lines' => count($script['lines']),
                'total_scenes' => count($script['scenes']),
                'total_characters' => count($script['characters']),
                'lines_with_characters' => count(array_filter($script['lines'], fn($line) => !empty($line['character_name']))),
                'lines_with_backgrounds' => count(array_filter($script['lines'], fn($line) => !empty($line['background_prompt']))),
                'avg_line_length' => count($script['lines']) > 0 ? array_sum(array_map(fn($line) => strlen($line['content']), $script['lines'])) / count($script['lines']) : 0
            ];
            
            echo json_encode($script);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    /**
     * Update a specific script line with video metadata
     */
    public function updateScriptLine($lineId) {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Check if script line exists
            $checkStmt = $this->db->prepare("SELECT id, script_id FROM script_lines WHERE id = ?");
            $checkStmt->execute([$lineId]);
            $existingLine = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$existingLine) {
                http_response_code(404);
                echo json_encode(['error' => 'Script line not found']);
                return;
            }
            
            // Build update query dynamically based on provided fields
            $updateFields = [];
            $updateValues = [];
            
            if (isset($input['content'])) {
                $updateFields[] = 'content = ?';
                $updateValues[] = $input['content'];
            }
            
            if (isset($input['scene_id'])) {
                $updateFields[] = 'scene_id = ?';
                $updateValues[] = $input['scene_id'] ?: null;
            }
            
            if (isset($input['character_name'])) {
                // Validate character exists if provided
                if (!empty($input['character_name'])) {
                    $charStmt = $this->db->prepare("SELECT id FROM character_profiles WHERE name = ?");
                    $charStmt->execute([$input['character_name']]);
                    if (!$charStmt->fetch()) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Character not found: ' . $input['character_name']]);
                        return;
                    }
                }
                $updateFields[] = 'character_name = ?';
                $updateValues[] = $input['character_name'] ?: null;
            }
            
            if (isset($input['character_emotion'])) {
                $validEmotions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'confused', 'excited', 'worried', 'determined', 'shy'];
                if (!in_array($input['character_emotion'], $validEmotions)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid emotion. Must be one of: ' . implode(', ', $validEmotions)]);
                    return;
                }
                $updateFields[] = 'character_emotion = ?';
                $updateValues[] = $input['character_emotion'];
            }
            
            if (isset($input['background_prompt'])) {
                $updateFields[] = 'background_prompt = ?';
                $updateValues[] = $input['background_prompt'] ?: null;
            }
            
            if (isset($input['character_position'])) {
                $validPositions = ['left', 'right', 'center'];
                if (!in_array($input['character_position'], $validPositions)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid character position. Must be one of: ' . implode(', ', $validPositions)]);
                    return;
                }
                $updateFields[] = 'character_position = ?';
                $updateValues[] = $input['character_position'];
            }
            
            if (empty($updateFields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No valid fields provided for update']);
                return;
            }
            
            $updateValues[] = $lineId; // Add line ID for WHERE clause
            $sql = "UPDATE script_lines SET " . implode(', ', $updateFields) . " WHERE id = ?";
            
            $stmt = $this->db->prepare($sql);
            $success = $stmt->execute($updateValues);
            
            if ($success) {
                // Return updated line with character info
                $stmt = $this->db->prepare("
                    SELECT 
                        sl.*,
                        cp.name as character_display_name,
                        cp.base_portrait_url,
                        cp.voice_profile_id,
                        v.name as voice_name
                    FROM script_lines sl
                    LEFT JOIN character_profiles cp ON sl.character_name = cp.name
                    LEFT JOIN voices v ON cp.voice_profile_id = v.id
                    WHERE sl.id = ?
                ");
                $stmt->execute([$lineId]);
                $updatedLine = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode($updatedLine);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update script line']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    /**
     * Batch update multiple script lines
     */
    public function batchUpdateScriptLines() {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['updates']) || !is_array($input['updates'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Updates array is required']);
                return;
            }
            
            $this->db->beginTransaction();
            $updatedLines = [];
            
            foreach ($input['updates'] as $update) {
                if (!isset($update['line_id'])) {
                    continue;
                }
                
                $lineId = $update['line_id'];
                unset($update['line_id']);
                
                // Use existing updateScriptLine logic for each line
                $this->updateSingleLine($lineId, $update);
                
                // Get updated line info
                $stmt = $this->db->prepare("
                    SELECT 
                        sl.*,
                        cp.name as character_display_name,
                        cp.base_portrait_url,
                        cp.voice_profile_id,
                        v.name as voice_name
                    FROM script_lines sl
                    LEFT JOIN character_profiles cp ON sl.character_name = cp.name
                    LEFT JOIN voices v ON cp.voice_profile_id = v.id
                    WHERE sl.id = ?
                ");
                $stmt->execute([$lineId]);
                $updatedLine = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($updatedLine) {
                    $updatedLines[] = $updatedLine;
                }
            }
            
            $this->db->commit();
            echo json_encode(['updated_lines' => $updatedLines, 'count' => count($updatedLines)]);
            
        } catch (Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    /**
     * Get script readiness score for video generation
     */
    public function getScriptReadiness($scriptId) {
        header('Content-Type: application/json');
        
        try {
            // Check if script exists
            $stmt = $this->db->prepare("SELECT id FROM scripts WHERE id = ?");
            $stmt->execute([$scriptId]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'Script not found']);
                return;
            }
            
            // Get readiness statistics
            $stmt = $this->db->prepare("
                SELECT 
                    COUNT(*) as total_lines,
                    COUNT(CASE WHEN character_name IS NOT NULL AND character_name != '' THEN 1 END) as lines_with_characters,
                    COUNT(CASE WHEN background_prompt IS NOT NULL AND background_prompt != '' THEN 1 END) as lines_with_backgrounds,
                    COUNT(CASE WHEN scene_id IS NOT NULL AND scene_id != '' THEN 1 END) as lines_with_scenes,
                    COUNT(DISTINCT scene_id) as unique_scenes,
                    COUNT(DISTINCT character_name) as unique_characters
                FROM script_lines 
                WHERE script_id = ?
            ");
            $stmt->execute([$scriptId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Convert to integers
            foreach ($stats as $key => $value) {
                $stats[$key] = (int)$value;
            }
            
            // Calculate readiness score
            $readinessScore = 0;
            if ($stats['total_lines'] > 0) {
                $characterScore = ($stats['lines_with_characters'] / $stats['total_lines']) * 30;
                $backgroundScore = ($stats['lines_with_backgrounds'] / $stats['total_lines']) * 30;
                $sceneScore = ($stats['lines_with_scenes'] / $stats['total_lines']) * 25;
                $diversityScore = min(($stats['unique_characters'] * 3), 15); // Max 15 points for character diversity
                
                $readinessScore = round($characterScore + $backgroundScore + $sceneScore + $diversityScore);
            }
            
            $result = [
                'script_id' => (int)$scriptId,
                'readiness_score' => $readinessScore,
                'statistics' => $stats,
                'recommendations' => []
            ];
            
            // Add recommendations
            if ($stats['lines_with_characters'] < $stats['total_lines']) {
                $result['recommendations'][] = 'Assign characters to more dialogue lines';
            }
            if ($stats['lines_with_backgrounds'] < $stats['total_lines'] * 0.8) {
                $result['recommendations'][] = 'Add background prompts to more scenes';
            }
            if ($stats['unique_scenes'] < 3) {
                $result['recommendations'][] = 'Consider dividing content into more distinct scenes';
            }
            if ($stats['unique_characters'] < 2) {
                $result['recommendations'][] = 'Add more character diversity to improve engagement';
            }
            
            echo json_encode($result);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    /**
     * Auto-generate scene IDs and background prompts for a script
     */
    public function autoGenerateSceneData($scriptId) {
        header('Content-Type: application/json');
        
        try {
            // Check if script exists
            $stmt = $this->db->prepare("SELECT id, title FROM scripts WHERE id = ?");
            $stmt->execute([$scriptId]);
            $script = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$script) {
                http_response_code(404);
                echo json_encode(['error' => 'Script not found']);
                return;
            }
            
            // Get all script lines
            $stmt = $this->db->prepare("
                SELECT id, content, line_order 
                FROM script_lines 
                WHERE script_id = ? 
                ORDER BY line_order
            ");
            $stmt->execute([$scriptId]);
            $lines = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($lines)) {
                http_response_code(400);
                echo json_encode(['error' => 'No script lines found']);
                return;
            }
            
            $this->db->beginTransaction();
            $updatedCount = 0;
            $currentScene = 1;
            $linesPerScene = max(1, ceil(count($lines) / 5)); // Aim for ~5 scenes
            
            foreach ($lines as $index => $line) {
                $sceneNumber = ceil(($index + 1) / $linesPerScene);
                $sceneId = "scene_" . $sceneNumber;
                
                // Generate basic background prompt based on content
                $backgroundPrompt = $this->generateBackgroundPrompt($line['content'], $sceneId);
                
                $updateStmt = $this->db->prepare("
                    UPDATE script_lines 
                    SET scene_id = ?, background_prompt = ? 
                    WHERE id = ? AND (scene_id IS NULL OR scene_id = '')
                ");
                
                if ($updateStmt->execute([$sceneId, $backgroundPrompt, $line['id']])) {
                    $updatedCount++;
                }
            }
            
            $this->db->commit();
            
            echo json_encode([
                'message' => 'Scene data generated successfully',
                'updated_lines' => $updatedCount,
                'total_lines' => count($lines),
                'scenes_created' => ceil(count($lines) / $linesPerScene)
            ]);
            
        } catch (Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    private function updateSingleLine($lineId, $data) {
        $updateFields = [];
        $updateValues = [];
        
        foreach (['content', 'scene_id', 'character_name', 'character_emotion', 'background_prompt', 'character_position'] as $field) {
            if (isset($data[$field])) {
                $updateFields[] = $field . ' = ?';
                $updateValues[] = $data[$field] ?: null;
            }
        }
        
        if (!empty($updateFields)) {
            $updateValues[] = $lineId;
            $sql = "UPDATE script_lines SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($updateValues);
        }
    }
    
    private function generateBackgroundPrompt($content, $sceneId) {
        // Simple background prompt generation based on content analysis
        $content = strtolower($content);
        
        if (strpos($content, 'forest') !== false || strpos($content, 'tree') !== false) {
            return "anime style forest background, lush green trees, natural lighting";
        } elseif (strpos($content, 'city') !== false || strpos($content, 'street') !== false) {
            return "anime style city background, urban environment, detailed buildings";
        } elseif (strpos($content, 'home') !== false || strpos($content, 'house') !== false || strpos($content, 'room') !== false) {
            return "anime style interior background, cozy room, warm lighting";
        } elseif (strpos($content, 'school') !== false || strpos($content, 'classroom') !== false) {
            return "anime style school background, classroom setting, bright lighting";
        } elseif (strpos($content, 'night') !== false || strpos($content, 'dark') !== false) {
            return "anime style night background, starry sky, moonlight";
        } elseif (strpos($content, 'beach') !== false || strpos($content, 'ocean') !== false) {
            return "anime style beach background, ocean waves, sunny day";
        } else {
            return "anime style background, detailed environment, " . str_replace('_', ' ', $sceneId);
        }
    }
}