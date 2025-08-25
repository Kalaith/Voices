<?php
declare(strict_types=1);

namespace App\Actions;

use App\External\AudioGenerationRepository;

final class DeleteAudioGenerationAction
{
    public function __construct(
        private readonly AudioGenerationRepository $audioRepository
    ) {}

    public function execute(string $id): bool
    {
        if (empty($id)) {
            throw new \InvalidArgumentException('ID is required');
        }

        $audioGeneration = $this->audioRepository->findById($id);
        if (!$audioGeneration) {
            throw new \RuntimeException('Audio generation not found');
        }

        return $this->audioRepository->delete($id);
    }
}