<?php
declare(strict_types=1);

namespace VoiceGenerator\External;

use VoiceGenerator\Models\AudioGeneration;

final class AudioGenerationRepository
{
    public function findById(string $id): ?AudioGeneration
    {
        return AudioGeneration::find($id);
    }

    public function findAll(): array
    {
        return AudioGeneration::all()->toArray();
    }

    public function findByScriptId(string $scriptId): array
    {
        return AudioGeneration::where('script_id', $scriptId)->get()->toArray();
    }

    public function create(AudioGeneration $audioGeneration): AudioGeneration
    {
        $audioGeneration->save();
        return $audioGeneration;
    }

    public function updateStatus(string $id, string $status, array $data = []): bool
    {
        $audioGeneration = $this->findById($id);
        if (!$audioGeneration) {
            return false;
        }

        $audioGeneration->status = $status;
        
        // Update additional fields from data array
        foreach ($data as $key => $value) {
            if (property_exists($audioGeneration, $key)) {
                $audioGeneration->$key = $value;
            }
        }

        return $audioGeneration->save();
    }

    public function delete(string $id): bool
    {
        $audioGeneration = $this->findById($id);
        if (!$audioGeneration) {
            return false;
        }

        return $audioGeneration->delete();
    }
}