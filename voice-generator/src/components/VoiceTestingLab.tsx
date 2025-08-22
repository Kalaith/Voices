import React, { useState } from 'react';
import { Voice } from '../types/voice';
import { useVoiceTest } from '../hooks/useVoiceTest';
import { Button } from './ui/Button';

interface VoiceTestingLabProps {
  voices: Voice[];
}

export const VoiceTestingLab: React.FC<VoiceTestingLabProps> = ({ voices }) => {
  const { testVoice, stopVoice, getTestState } = useVoiceTest();
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(voices[0] || null);
  const [testText, setTestText] = useState('Hello, this is a test of my voice with different effects.');

  // ChatTTS Prosody & Control Tokens (organized by category)
  const dialogueMarkers = [
    // Expressive Effects
    { label: 'Laugh', marker: '[laugh]', example: 'That was funny [laugh]', category: 'Expression' },
    { label: 'Light Laugh', marker: '[laugh_0]', example: 'Hehe [laugh_0]', category: 'Expression' },
    { label: 'Medium Laugh', marker: '[laugh_1]', example: 'Haha [laugh_1]', category: 'Expression' },
    { label: 'Strong Laugh', marker: '[laugh_2]', example: 'HAHA [laugh_2]', category: 'Expression' },

    // Break / Pause Tokens
    { label: 'Short Break', marker: '[break_0]', example: 'Hello [break_0] there', category: 'Breaks' },
    { label: 'Medium Break', marker: '[break_3]', example: 'Wait [break_3] for me', category: 'Breaks' },
    { label: 'Long Break', marker: '[break_7]', example: 'Think [break_7] carefully', category: 'Breaks' },
    { label: 'UV Break', marker: '[uv_break]', example: 'This has [uv_break] a break', category: 'Breaks' },
    { label: 'V Break', marker: '[v_break]', example: 'Voice [v_break] break here', category: 'Breaks' },
    { label: 'L Break', marker: '[lbreak]', example: 'Line [lbreak] break', category: 'Breaks' },
    { label: 'LL Break', marker: '[llbreak]', example: 'Long [llbreak] break', category: 'Breaks' },

    // Oral Articulation Styles
    { label: 'Casual Style', marker: '[oral_0]', example: '[oral_0] Hey there', category: 'Oral Style' },
    { label: 'Clear Style', marker: '[oral_2]', example: '[oral_2] Listen carefully', category: 'Oral Style' },
    { label: 'Relaxed Style', marker: '[oral_5]', example: '[oral_5] Take it easy', category: 'Oral Style' },
    { label: 'Expressive Style', marker: '[oral_9]', example: '[oral_9] Amazing news!', category: 'Oral Style' },

    // Speech Speed Modifiers
    { label: 'Very Slow', marker: '[speed_0]', example: '[speed_0] Very slow speech', category: 'Speed' },
    { label: 'Slow', marker: '[speed_2]', example: '[speed_2] Slow speech', category: 'Speed' },
    { label: 'Normal', marker: '[speed_5]', example: '[speed_5] Normal speed', category: 'Speed' },
    { label: 'Fast', marker: '[speed_7]', example: '[speed_7] Fast speech', category: 'Speed' },
    { label: 'Very Fast', marker: '[speed_9]', example: '[speed_9] Very fast speech', category: 'Speed' },

    // Style Modifiers
    { label: 'Music Style', marker: '[music]', example: '[music] Musical delivery', category: 'Style' },
    { label: 'Pure Voice', marker: '[pure]', example: '[pure] Pure vocal style', category: 'Style' },

    // Segment Markers
    { label: 'Start Segment', marker: '[Stts]', example: '[Stts] Beginning of speech', category: 'Segments' },
    { label: 'End Segment', marker: '[Etts]', example: 'End of speech [Etts]', category: 'Segments' },
  ];

  const presetTexts = [
    'Hello, welcome to our voice testing laboratory!',
    'This is a test of different vocal expressions and emotions.',
    'I love testing new voices [laugh] it\'s so much fun!',
    'Let me pause here [break_3] and continue with the sentence.',
    '[speed_2] Sometimes I speak slowly, [speed_7] sometimes I speak fast.',
    '[oral_0] Hey there, how are you doing today?',
    'That was hilarious [laugh_1] absolutely hilarious!',
    '[pure] This is pure voice mode speaking clearly.',
    'Wait for it [break_7] here comes the surprise!',
    '[oral_5] Just relaxing and taking it easy today.',
    'Short pause [break_0] medium pause [break_3] long pause [break_7]',
    'Light laugh [laugh_0] normal laugh [laugh] strong laugh [laugh_2]',
  ];

  const handleVoiceTest = () => {
    if (selectedVoice && testText.trim()) {
      testVoice(selectedVoice, testText);
    }
  };

  const handleStop = () => {
    if (selectedVoice) {
      stopVoice(selectedVoice.id);
    }
  };

  const insertMarker = (marker: string) => {
    const textarea = document.getElementById('test-text') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = testText.substring(0, start) + marker + testText.substring(end);
      setTestText(newText);
      // Set cursor position after the inserted marker
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + marker.length;
        textarea.focus();
      }, 0);
    }
  };

  const testState = selectedVoice ? getTestState(selectedVoice.id) : { isGenerating: false, isPlaying: false, error: null };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Voice Testing Lab</h2>
        <p className="text-gray-600">Test individual lines and experiment with dialogue markers and vocal effects</p>
      </div>

      {/* Voice Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Voice
        </label>
        <select
          value={selectedVoice?.id || ''}
          onChange={(e) => {
            const voice = voices.find(v => v.id === e.target.value);
            setSelectedVoice(voice || null);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Select a voice for testing"
        >
          {voices.length === 0 ? (
            <option value="">No voices available</option>
          ) : (
            voices.map(voice => (
              <option key={voice.id} value={voice.id}>
                {voice.name} - {voice.description || 'No description'}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Text Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Text
        </label>
        <textarea
          id="test-text"
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Enter text to test with different dialogue markers..."
          aria-label="Text to test with the selected voice"
          aria-describedby="char-count"
        />
        
        {/* Character count */}
        <div id="char-count" className="mt-1 text-xs text-gray-500" role="status">
          {testText.length} characters
        </div>
      </div>

      {/* Dialogue Markers */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">ChatTTS Prosody & Control Tokens</h3>
        <p className="text-sm text-gray-600 mb-4">
          Click any marker to insert it at your cursor position. These are real ChatTTS tokens:
        </p>
        
        {/* Organize by categories */}
        {['Expression', 'Breaks', 'Speed', 'Oral Style', 'Style', 'Segments'].map((category) => {
          const categoryMarkers = dialogueMarkers.filter(marker => marker.category === category);
          if (categoryMarkers.length === 0) return null;
          
          return (
            <div key={category} className="mb-4">
              <h4 className="text-md font-medium text-gray-800 mb-2">{category}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {categoryMarkers.map((item) => (
                  <Button
                    key={item.label}
                    variant="secondary"
                    size="sm"
                    onClick={() => insertMarker(item.marker)}
                    className="text-left h-auto py-2"
                    ariaLabel={`Insert ${item.label} marker: ${item.marker}. Example: ${item.example}`}
                  >
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.marker}</div>
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preset Texts */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Preset Test Texts</h3>
        <div className="grid gap-2">
          {presetTexts.map((preset, index) => (
            <Button
              key={index}
              variant="secondary"
              size="sm"
              onClick={() => setTestText(preset)}
              className="text-left h-auto py-2 bg-blue-50 hover:bg-blue-100 text-blue-900"
              ariaLabel={`Use preset text: ${preset}`}
            >
              {preset}
            </Button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {testState.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {testState.error}
        </div>
      )}

      {/* Test Controls */}
      <div className="flex gap-3">
        <Button
          variant={testState.isPlaying ? 'danger' : 'success'}
          onClick={testState.isPlaying ? handleStop : handleVoiceTest}
          disabled={testState.isGenerating || !selectedVoice || !testText.trim()}
          isLoading={testState.isGenerating}
          className="flex-1 py-3 flex items-center justify-center gap-2 font-medium"
          ariaLabel={testState.isPlaying ? 'Stop voice playback' : 'Test the selected voice with current text'}
        >
          {testState.isGenerating ? (
            'Generating Audio...'
          ) : testState.isPlaying ? (
            <>
              <span>⏹️</span>
              <span>Stop Playback</span>
            </>
          ) : (
            <>
              <span>▶️</span>
              <span>Test Voice</span>
            </>
          )}
        </Button>
      </div>

      {/* Tips */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg" role="region" aria-labelledby="tips-heading">
        <h4 id="tips-heading" className="font-medium text-blue-900 mb-2">💡 ChatTTS Token Testing Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1" role="list">
          <li role="listitem">• <strong>Breaks</strong>: Use [break_0] to [break_7] for increasingly longer pauses</li>
          <li role="listitem">• <strong>Laughter</strong>: [laugh_0] = light, [laugh_1] = medium, [laugh_2] = strong</li>
          <li role="listitem">• <strong>Speed</strong>: [speed_0] = very slow, [speed_5] = normal, [speed_9] = very fast</li>
          <li role="listitem">• <strong>Oral Styles</strong>: [oral_0] = casual, [oral_5] = relaxed, [oral_9] = expressive</li>
          <li role="listitem">• <strong>Styles</strong>: [pure] for clean voice, [music] for musical delivery</li>
          <li role="listitem">• <strong>Segments</strong>: [Stts] at start, [Etts] at end for proper segmentation</li>
          <li role="listitem">• Combine tokens for rich expression: "[speed_2] Hello [break_3] [laugh_1] how are you?"</li>
        </ul>
      </div>
    </div>
  );
};