<?php
declare(strict_types=1);

namespace App\Actions;

use App\External\AudioGenerationRepository;
use App\Models\AudioGeneration;

final class UpdateAudioGenerationAction
{
    public function __construct(
        private readonly AudioGenerationRepository $audioRepository
    ) {}

    public function execute(string $id, string $status, array $data = []): AudioGeneration
    {
        if (empty($id) || empty($status)) {
            throw new \InvalidArgumentException('ID and status are required');
        }

        $audioGeneration = $this->audioRepository->findById($id);
        if (!$audioGeneration) {
            throw new \RuntimeException('Audio generation not found');
        }

        $success = $this->audioRepository->updateStatus($id, $status, $data);
        if (!$success) {
            throw new \RuntimeException('Failed to update audio generation');
        }

        return $this->audioRepository->findById($id);
    }
}