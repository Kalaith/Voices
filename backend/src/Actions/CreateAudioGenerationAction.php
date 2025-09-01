<?php
declare(strict_types=1);

namespace VoiceGenerator\Actions;

use VoiceGenerator\External\AudioGenerationRepository;
use VoiceGenerator\Models\AudioGeneration;
use VoiceGenerator\Services\AudioGenerationService;

final class CreateAudioGenerationAction
{
    public function __construct(
        private readonly AudioGenerationRepository $audioRepository,
        private readonly AudioGenerationService $audioService
    ) {}

    public function execute(string $scriptId): array
    {
        if (empty($scriptId)) {
            throw new \InvalidArgumentException('Script ID is required');
        }

        $result = $this->audioService->generateScriptAudio($scriptId);
        
        if (isset($result['error'])) {
            throw new \RuntimeException($result['error']);
        }
        
        return $result;
    }

    public function executeSimple(string $text, string $voice): array
    {
        if (empty($text) || empty($voice)) {
            throw new \InvalidArgumentException('Text and voice are required');
        }

        $result = $this->audioService->generateSimpleAudio($text, $voice);
        
        if (isset($result['error'])) {
            throw new \RuntimeException($result['error']);
        }
        
        return $result;
    }
}