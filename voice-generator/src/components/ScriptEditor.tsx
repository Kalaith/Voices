import React, { useState } from 'react';
import { Script, Speaker, ScriptLine } from '../types/script';
import { Voice } from '../types/voice';
import { SPEAKER_COLORS } from '../utils/constants';

interface ScriptEditorProps {
  script: Script;
  voices: Voice[];
  onScriptUpdate: (script: Script) => void;
  onGenerateAudio: (script: Script) => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script,
  voices,
  onScriptUpdate,
  onGenerateAudio
}) => {
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState(voices[0]?.id || '');

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

  const addLine = () => {
    if (script.speakers.length === 0) return;

    const newLine: ScriptLine = {
      id: crypto.randomUUID(),
      speakerId: script.speakers[0].id,
      text: '',
    };

    onScriptUpdate({
      ...script,
      lines: [...script.lines, newLine],
    });
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

  const getSpeakerById = (speakerId: string) =>
    script.speakers.find(s => s.id === speakerId);

  const getVoiceById = (voiceId: string) =>
    voices.find(v => v.id === voiceId);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Script Editor</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Speakers</h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {script.speakers.map((speaker) => {
              const voice = getVoiceById(speaker.voiceId);
              return (
                <div
                  key={speaker.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: speaker.color }}
                >
                  <span>{speaker.name}</span>
                  <span className="text-xs opacity-75">({voice?.name})</span>
                  <button
                    onClick={() => removeSpeaker(speaker.id)}
                    className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSpeakerName}
              onChange={(e) => setNewSpeakerName(e.target.value)}
              placeholder="Speaker name"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
            />
            <select
              value={selectedVoiceId}
              onChange={(e) => setSelectedVoiceId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
            <button
              onClick={addSpeaker}
              disabled={!newSpeakerName.trim() || !selectedVoiceId || voices.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Speaker
            </button>
          </div>
          
          {voices.length === 0 && (
            <p className="text-sm text-red-600 mt-2">Please create at least one voice before adding speakers.</p>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Script Lines</h3>
            <button
              onClick={addLine}
              disabled={script.speakers.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Line
            </button>
          </div>

          {script.speakers.length === 0 && (
            <p className="text-sm text-gray-600 mb-4">Add speakers to start writing your script.</p>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {script.lines.map((line, index) => {
              const speaker = getSpeakerById(line.speakerId);
              return (
                <div key={line.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 text-sm text-gray-500 font-mono w-8">
                    {index + 1}
                  </div>
                  
                  <select
                    value={line.speakerId}
                    onChange={(e) => updateLine(line.id, { speakerId: e.target.value })}
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    {script.speakers.map((speaker) => (
                      <option key={speaker.id} value={speaker.id}>
                        {speaker.name}
                      </option>
                    ))}
                  </select>

                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-2"
                    style={{ backgroundColor: speaker?.color || '#gray' }}
                  />

                  <textarea
                    value={line.text}
                    onChange={(e) => updateLine(line.id, { text: e.target.value })}
                    placeholder="Enter dialogue..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />

                  <button
                    onClick={() => removeLine(line.id)}
                    className="flex-shrink-0 text-red-600 hover:text-red-800 p-1"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => onGenerateAudio(script)}
            disabled={script.lines.length === 0 || script.lines.some(line => !line.text.trim())}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
          >
            Generate Audio
          </button>
        </div>
      </div>
    </div>
  );
};