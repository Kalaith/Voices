<?php
declare(strict_types=1);

namespace App\Actions;

use App\External\AudioGenerationRepository;
use App\Models\AudioGeneration;

final class GetAudioGenerationAction
{
    public function __construct(
        private readonly AudioGenerationRepository $audioRepository
    ) {}

    public function getAll(): array
    {
        return $this->audioRepository->findAll();
    }

    public function getById(string $id): ?AudioGeneration
    {
        if (empty($id)) {
            throw new \InvalidArgumentException('ID is required');
        }

        return $this->audioRepository->findById($id);
    }

    public function getByScriptId(string $scriptId): array
    {
        if (empty($scriptId)) {
            throw new \InvalidArgumentException('Script ID is required');
        }

        return $this->audioRepository->findByScriptId($scriptId);
    }
}