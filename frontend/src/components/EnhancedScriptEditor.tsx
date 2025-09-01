import React, { useState } from 'react';
import { Script, Speaker, ScriptLine } from '../types/script';
import { Voice } from '../types/voice';
import { SPEAKER_COLORS } from '../utils/constants';

interface EnhancedScriptEditorProps {
  script: Script;
  voices: Voice[];
  onScriptUpdate: (script: Script) => void;
  onGenerateAudio: (script: Script) => void;
}

interface NewLine {
  speakerId: string;
  text: string;
}

export const EnhancedScriptEditor: React.FC<EnhancedScriptEditorProps> = ({
  script,
  voices,
  onScriptUpdate,
  onGenerateAudio
}) => {
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState(voices[0]?.id || '');
  const [newLine, setNewLine] = useState<NewLine>({
    speakerId: script.speakers[0]?.id || '',
    text: ''
  });
  const [isAddingLine, setIsAddingLine] = useState(false);

  // ChatTTS tokens for easy insertion
  const chattsTokens = [
    { label: 'Laugh', token: '[laugh]', category: 'Expression' },
    { label: 'Light Laugh', token: '[laugh_0]', category: 'Expression' },
    { label: 'Strong Laugh', token: '[laugh_2]', category: 'Expression' },
    { label: 'Short Break', token: '[break_0]', category: 'Breaks' },
    { label: 'Medium Break', token: '[break_3]', category: 'Breaks' },
    { label: 'Long Break', token: '[break_7]', category: 'Breaks' },
    { label: 'Slow Speech', token: '[speed_2]', category: 'Speed' },
    { label: 'Fast Speech', token: '[speed_7]', category: 'Speed' },
    { label: 'Casual Style', token: '[oral_0]', category: 'Style' },
    { label: 'Pure Voice', token: '[pure]', category: 'Style' },
  ];

  const addSpeaker = () => {
    if (!newSpeakerName.trim() || !selectedVoiceId) return;

    const newSpeaker: Speaker = {
      id: crypto.randomUUID(),
      name: newSpeakerName.trim(),
      voiceId: selectedVoiceId,
      color: SPEAKER_COLORS[script.speakers.length % SPEAKER_COLORS.length],
    };

    onScriptUpdate({
      ...script,
      speakers: [...script.speakers, newSpeaker],
    });

    setNewSpeakerName('');
  };

  const removeSpeaker = (speakerId: string) => {
    onScriptUpdate({
      ...script,
      speakers: script.speakers.filter(s => s.id !== speakerId),
      lines: script.lines.filter(line => line.speakerId !== speakerId),
    });
  };

  const addLineToScript = () => {
    if (!newLine.speakerId || !newLine.text.trim()) return;

    const scriptLine: ScriptLine = {
      id: crypto.randomUUID(),
      speakerId: newLine.speakerId,
      text: newLine.text.trim(),
    };

    onScriptUpdate({
      ...script,
      lines: [...script.lines, scriptLine],
    });

    // Reset form
    setNewLine({
      speakerId: script.speakers[0]?.id || '',
      text: ''
    });
    setIsAddingLine(false);
  };

  const updateLine = (lineId: string, updates: Partial<ScriptLine>) => {
    onScriptUpdate({
      ...script,
      lines: script.lines.map(line =>
        line.id === lineId ? { ...line, ...updates } : line
      ),
    });
  };

  const removeLine = (lineId: string) => {
    onScriptUpdate({
      ...script,
      lines: script.lines.filter(line => line.id !== lineId),
    });
  };

  const insertTokenInNewLine = (token: string) => {
    const textarea = document.getElementById('new-line-text') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = newLine.text.substring(0, start) + token + newLine.text.substring(end);
      setNewLine(prev => ({ ...prev, text: newText }));
      // Set cursor position after the inserted token
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + token.length;
        textarea.focus();
      }, 0);
    }
  };

  const insertTokenInExistingLine = (lineId: string, token: string) => {
    const textarea = document.getElementById(`line-text-${lineId}`) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const line = script.lines.find(l => l.id === lineId);
      if (line) {
        const newText = line.text.substring(0, start) + token + line.text.substring(end);
        updateLine(lineId, { text: newText });
        // Set cursor position after the inserted token
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + token.length;
          textarea.focus();
        }, 0);
      }
    }
  };

  const getSpeakerById = (speakerId: string) =>
    script.speakers.find(s => s.id === speakerId);

  const getVoiceById = (voiceId: string) =>
    voices.find(v => v.id === voiceId);

  return (
    <div className="space-y-8">
      {/* Script Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Script Name
        </label>
        <input
          type="text"
          value={script.name}
          onChange={(e) => onScriptUpdate({ ...script, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter script name"
        />
      </div>

      {/* Speakers Section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Speakers</h3>
        
        {/* Existing Speakers */}
        <div className="flex flex-wrap gap-3 mb-6">
          {script.speakers.map((speaker) => {
            const voice = getVoiceById(speaker.voiceId);
            return (
              <div
                key={speaker.id}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm"
                style={{ backgroundColor: speaker.color }}
              >
                <span className="font-medium">{speaker.name}</span>
                <span className="text-xs opacity-75">({voice?.name || 'Unknown Voice'})</span>
                <button
                  onClick={() => removeSpeaker(speaker.id)}
                  className="ml-1 text-white hover:text-red-200"
                  title="Remove speaker"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        {/* Add New Speaker */}
        <div className="flex gap-3">
          <input
            type="text"
            value={newSpeakerName}
            onChange={(e) => setNewSpeakerName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Speaker name"
          />
          <select
            value={selectedVoiceId}
            onChange={(e) => setSelectedVoiceId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {voices.map(voice => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
          <button
            onClick={addSpeaker}
            disabled={!newSpeakerName.trim() || !selectedVoiceId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add Speaker
          </button>
        </div>
      </div>

      {/* Script Lines Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Script Lines</h3>
          {script.speakers.length > 0 && (
            <button
              onClick={() => setIsAddingLine(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <span>+</span>
              Add Line
            </button>
          )}
        </div>

        {/* Add New Line Form */}
        {isAddingLine && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
            <h4 className="font-medium text-blue-900 mb-3">Add New Line</h4>
            
            {/* Speaker Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Speaker</label>
              <select
                value={newLine.speakerId}
                onChange={(e) => setNewLine(prev => ({ ...prev, speakerId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {script.speakers.map(speaker => (
                  <option key={speaker.id} value={speaker.id}>
                    {speaker.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Text Input */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Line Text</label>
              <textarea
                id="new-line-text"
                value={newLine.text}
                onChange={(e) => setNewLine(prev => ({ ...prev, text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter the line text... Use ChatTTS tokens below for expression!"
              />
            </div>

            {/* ChatTTS Tokens */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">ChatTTS Tokens (click to insert)</label>
              <div className="flex flex-wrap gap-1">
                {chattsTokens.map((item) => (
                  <button
                    key={item.token}
                    type="button"
                    onClick={() => insertTokenInNewLine(item.token)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    title={`${item.category}: ${item.token}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={addLineToScript}
                disabled={!newLine.speakerId || !newLine.text.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Line
              </button>
              <button
                onClick={() => {
                  setIsAddingLine(false);
                  setNewLine({ speakerId: script.speakers[0]?.id || '', text: '' });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Existing Lines */}
        <div className="space-y-3">
          {script.lines.map((line, index) => {
            const speaker = getSpeakerById(line.speakerId);
            return (
              <div key={line.id} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <div
                    className="px-3 py-1 rounded-full text-white text-sm font-medium flex-shrink-0"
                    style={{ backgroundColor: speaker?.color || '#666' }}
                  >
                    {speaker?.name || 'Unknown'}
                  </div>
                  <div className="flex-1">
                    <textarea
                      id={`line-text-${line.id}`}
                      value={line.text}
                      onChange={(e) => updateLine(line.id, { text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Enter line text..."
                    />
                    {/* Quick tokens for existing lines */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {chattsTokens.slice(0, 5).map((item) => (
                        <button
                          key={item.token}
                          type="button"
                          onClick={() => insertTokenInExistingLine(line.id, item.token)}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          title={item.label}
                        >
                          {item.token}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => removeLine(line.id)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                    title="Remove line"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {script.lines.length === 0 && !isAddingLine && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>No lines yet. Add speakers first, then add your first line!</p>
          </div>
        )}
      </div>

      {/* Generate Audio Button */}
      {script.lines.length > 0 && (
        <div className="pt-6 border-t border-gray-200">
          <button
            onClick={() => onGenerateAudio(script)}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <span>🎵</span>
            Generate Audio for Full Script
          </button>
        </div>
      )}
    </div>
  );
};