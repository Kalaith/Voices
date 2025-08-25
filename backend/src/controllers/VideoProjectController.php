<?php

require_once dirname(__DIR__) . '/config/Database.php';

class VideoProjectController {
    private $db;
    
    public function __construct($database = null) {
        $this->db = $database ?? (new Database())->getConnection();
    }
    
    public function createProject() {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($input['name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Project name is required']);
                return;
            }
            
            if (empty($input['script_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Script ID is required']);
                return;
            }
            
            // Validate script exists
            $scriptStmt = $this->db->prepare("SELECT id FROM scripts WHERE id = ?");
            $scriptStmt->execute([$input['script_id']]);
            if (!$scriptStmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'Script not found']);
                return;
            }
            
            // Validate resolution format
            $validResolutions = ['720p', '1080p', '1440p', '2160p'];
            $resolution = $input['resolution'] ?? '1080p';
            if (!in_array($resolution, $validResolutions)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid resolution. Must be one of: ' . implode(', ', $validResolutions)]);
                return;
            }
            
            // Validate background style
            $validStyles = ['anime', 'realistic', 'fantasy', 'modern', 'historical', 'cyberpunk', 'medieval', 'sci-fi'];
            $backgroundStyle = $input['background_style'] ?? 'anime';
            if (!in_array($backgroundStyle, $validStyles)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid background style. Must be one of: ' . implode(', ', $validStyles)]);
                return;
            }
            
            $stmt = $this->db->prepare("
                INSERT INTO video_projects (name, script_id, resolution, background_style) 
                VALUES (?, ?, ?, ?)
            ");
            
            $success = $stmt->execute([
                $input['name'],
                $input['script_id'],
                $resolution,
                $backgroundStyle
            ]);
            
            if ($success) {
                $projectId = $this->db->lastInsertId();
                $project = $this->getProjectById($projectId);
                http_response_code(201);
                echo json_encode($project);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create video project']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    public function getProjects() {
        header('Content-Type: application/json');
        
        try {
            $stmt = $this->db->query("
                SELECT 
                    vp.*,
                    s.title as script_title,
                    s.description as script_description,
                    COUNT(sl.id) as total_lines,
                    COUNT(DISTINCT sl.scene_id) as total_scenes,
                    COUNT(DISTINCT sl.character_name) as total_characters
                FROM video_projects vp 
                LEFT JOIN scripts s ON vp.script_id = s.id
                LEFT JOIN script_lines sl ON s.id = sl.script_id
                GROUP BY vp.id, s.id
                ORDER BY vp.created_at DESC
            ");
            
            $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Convert counts to integers
            foreach ($projects as &$project) {
                $project['total_lines'] = (int)$project['total_lines'];
                $project['total_scenes'] = (int)$project['total_scenes'];
                $project['total_characters'] = (int)$project['total_characters'];
                $project['progress'] = (int)$project['progress'];
            }
            
            echo json_encode($projects);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    public function getProject($id) {
        header('Content-Type: application/json');
        
        try {
            $project = $this->getProjectById($id);
            
            if ($project) {
                echo json_encode($project);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Video project not found']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    public function getProjectWithScript($id) {
        header('Content-Type: application/json');
        
        try {
            // Get project details
            $project = $this->getProjectById($id);
            
            if (!$project) {
                http_response_code(404);
                echo json_encode(['error' => 'Video project not found']);
                return;
            }
            
            // Get script lines with character and scene info
            $stmt = $this->db->prepare("
                SELECT 
                    sl.*,
                    cp.name as character_display_name, 
                    cp.base_portrait_url,
                    cp.description as character_description,
                    cp.voice_profile_id,
                    v.name as voice_name
                FROM script_lines sl
                LEFT JOIN character_profiles cp ON sl.character_name = cp.name
                LEFT JOIN voices v ON cp.voice_profile_id = v.id
                WHERE sl.script_id = ?
                ORDER BY sl.line_order
            ");
            $stmt->execute([$project['script_id']]);
            $project['script_lines'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get unique scenes
            $sceneStmt = $this->db->prepare("
                SELECT DISTINCT scene_id, background_prompt, COUNT(*) as line_count
                FROM script_lines 
                WHERE script_id = ? AND scene_id IS NOT NULL
                GROUP BY scene_id, background_prompt
                ORDER BY MIN(line_order)
            ");
            $sceneStmt->execute([$project['script_id']]);
            $project['scenes'] = $sceneStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get unique characters
            $charStmt = $this->db->prepare("
                SELECT DISTINCT 
                    sl.character_name,
                    cp.name as character_display_name,
                    cp.base_portrait_url,
                    cp.voice_profile_id,
                    v.name as voice_name,
                    COUNT(sl.id) as line_count
                FROM script_lines sl
                LEFT JOIN character_profiles cp ON sl.character_name = cp.name
                LEFT JOIN voices v ON cp.voice_profile_id = v.id
                WHERE sl.script_id = ? AND sl.character_name IS NOT NULL
                GROUP BY sl.character_name
                ORDER BY line_count DESC
            ");
            $charStmt->execute([$project['script_id']]);
            $project['characters'] = $charStmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode($project);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    public function updateProject($id) {
        header('Content-Type: application/json');
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Check if project exists
            if (!$this->getProjectById($id)) {
                http_response_code(404);
                echo json_encode(['error' => 'Video project not found']);
                return;
            }
            
            $updateFields = [];
            $updateValues = [];
            
            // Build dynamic update query based on provided fields
            if (isset($input['name'])) {
                if (empty($input['name'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Project name cannot be empty']);
                    return;
                }
                $updateFields[] = 'name = ?';
                $updateValues[] = $input['name'];
            }
            
            if (isset($input['resolution'])) {
                $validResolutions = ['720p', '1080p', '1440p', '2160p'];
                if (!in_array($input['resolution'], $validResolutions)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid resolution']);
                    return;
                }
                $updateFields[] = 'resolution = ?';
                $updateValues[] = $input['resolution'];
            }
            
            if (isset($input['background_style'])) {
                $validStyles = ['anime', 'realistic', 'fantasy', 'modern', 'historical', 'cyberpunk', 'medieval', 'sci-fi'];
                if (!in_array($input['background_style'], $validStyles)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid background style']);
                    return;
                }
                $updateFields[] = 'background_style = ?';
                $updateValues[] = $input['background_style'];
            }
            
            if (isset($input['status'])) {
                $validStatuses = ['draft', 'generating', 'completed', 'failed'];
                if (!in_array($input['status'], $validStatuses)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid status']);
                    return;
                }
                $updateFields[] = 'status = ?';
                $updateValues[] = $input['status'];
            }
            
            if (isset($input['progress'])) {
                $progress = (int)$input['progress'];
                if ($progress < 0 || $progress > 100) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Progress must be between 0 and 100']);
                    return;
                }
                $updateFields[] = 'progress = ?';
                $updateValues[] = $progress;
            }
            
            if (isset($input['output_path'])) {
                $updateFields[] = 'output_path = ?';
                $updateValues[] = $input['output_path'];
            }
            
            if (empty($updateFields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No valid fields provided for update']);
                return;
            }
            
            $updateValues[] = $id; // Add ID for WHERE clause
            $sql = "UPDATE video_projects SET " . implode(', ', $updateFields) . " WHERE id = ?";
            
            $stmt = $this->db->prepare($sql);
            $success = $stmt->execute($updateValues);
            
            if ($success) {
                $project = $this->getProjectById($id);
                echo json_encode($project);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update video project']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    public function deleteProject($id) {
        header('Content-Type: application/json');
        
        try {
            // Check if project exists
            $project = $this->getProjectById($id);
            if (!$project) {
                http_response_code(404);
                echo json_encode(['error' => 'Video project not found']);
                return;
            }
            
            // Delete associated files if they exist
            if (!empty($project['output_path']) && file_exists($project['output_path'])) {
                unlink($project['output_path']);
            }
            
            $stmt = $this->db->prepare("DELETE FROM video_projects WHERE id = ?");
            $success = $stmt->execute([$id]);
            
            if ($success) {
                echo json_encode(['message' => 'Video project deleted successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete video project']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    public function getProjectStats($id) {
        header('Content-Type: application/json');
        
        try {
            // Check if project exists
            if (!$this->getProjectById($id)) {
                http_response_code(404);
                echo json_encode(['error' => 'Video project not found']);
                return;
            }
            
            $stmt = $this->db->prepare("
                SELECT 
                    COUNT(sl.id) as total_lines,
                    COUNT(DISTINCT sl.scene_id) as total_scenes,
                    COUNT(DISTINCT sl.character_name) as total_characters,
                    COUNT(CASE WHEN sl.background_prompt IS NOT NULL AND sl.background_prompt != '' THEN 1 END) as lines_with_backgrounds,
                    COUNT(CASE WHEN sl.character_name IS NOT NULL AND sl.character_name != '' THEN 1 END) as lines_with_characters,
                    AVG(LENGTH(sl.content)) as avg_line_length
                FROM video_projects vp
                LEFT JOIN scripts s ON vp.script_id = s.id  
                LEFT JOIN script_lines sl ON s.id = sl.script_id
                WHERE vp.id = ?
            ");
            $stmt->execute([$id]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Convert to appropriate types
            $stats['total_lines'] = (int)$stats['total_lines'];
            $stats['total_scenes'] = (int)$stats['total_scenes'];
            $stats['total_characters'] = (int)$stats['total_characters'];
            $stats['lines_with_backgrounds'] = (int)$stats['lines_with_backgrounds'];
            $stats['lines_with_characters'] = (int)$stats['lines_with_characters'];
            $stats['avg_line_length'] = round((float)$stats['avg_line_length'], 2);
            
            // Calculate readiness percentage
            $readinessScore = 0;
            if ($stats['total_lines'] > 0) {
                $backgroundsReady = ($stats['lines_with_backgrounds'] / $stats['total_lines']) * 40;
                $charactersReady = ($stats['lines_with_characters'] / $stats['total_lines']) * 40;
                $hasScenes = $stats['total_scenes'] > 0 ? 20 : 0;
                $readinessScore = round($backgroundsReady + $charactersReady + $hasScenes);
            }
            
            $stats['readiness_score'] = $readinessScore;
            
            echo json_encode($stats);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
    
    private function getProjectById($id) {
        $stmt = $this->db->prepare("
            SELECT 
                vp.*,
                s.title as script_title,
                s.description as script_description
            FROM video_projects vp 
            LEFT JOIN scripts s ON vp.script_id = s.id
            WHERE vp.id = ?
        ");
        $stmt->execute([$id]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($project) {
            $project['progress'] = (int)$project['progress'];
        }
        
        return $project;
    }
}