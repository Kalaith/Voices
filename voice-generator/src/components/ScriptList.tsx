import React from 'react';
import { Script } from '../types/script';

interface ScriptListProps {
  scripts: Script[];
  currentScript: Script | null;
  onScriptSelect: (script: Script) => void;
  onCreateScript: () => void;
}

export const ScriptList: React.FC<ScriptListProps> = ({
  scripts,
  currentScript,
  onScriptSelect,
  onCreateScript,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Scripts</h2>
        <button
          onClick={onCreateScript}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          New Script
        </button>
      </div>
      
      <div className="space-y-2">
        {scripts.map((script) => (
          <button
            key={script.id}
            onClick={() => onScriptSelect(script)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              currentScript?.id === script.id
                ? 'bg-blue-100 border-blue-300 border'
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <div className="font-medium">{script.name}</div>
            <div className="text-sm text-gray-600">
              {script.speakers.length} speakers, {script.lines.length} lines
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};