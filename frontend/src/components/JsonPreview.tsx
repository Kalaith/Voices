import React, { useState, useEffect } from 'react';
import { VideoServiceProject } from '../types/videoServiceSchema';
import { ValidationResult, JsonValidator } from '../utils/jsonValidator';
import { Button } from './ui/Button';

interface JsonPreviewProps {
  json: VideoServiceProject;
  onDownload?: () => void;
  onCopy?: () => void;
  showActions?: boolean;
}

export const JsonPreview: React.FC<JsonPreviewProps> = ({
  json,
  onDownload,
  onCopy,
  showActions = true
}) => {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const result = JsonValidator.validate(json);
    setValidation(result);
  }, [json]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      {validation && (
        <div className={`p-4 rounded-md border ${
          validation.valid
            ? 'bg-green-50 border-green-200'
            : validation.errors.length > 0
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-semibold ${
              validation.valid
                ? 'text-green-800'
                : validation.errors.length > 0
                ? 'text-red-800'
                : 'text-yellow-800'
            }`}>
              {validation.valid ? '✓ Valid JSON' : '⚠ Validation Issues'}
            </h3>
            <span className={`text-sm ${
              validation.valid
                ? 'text-green-600'
                : validation.errors.length > 0
                ? 'text-red-600'
                : 'text-yellow-600'
            }`}>
              {JsonValidator.getSummary(validation)}
            </span>
          </div>

          {/* Errors */}
          {validation.errors.length > 0 && (
            <div className="space-y-1 mb-2">
              <h4 className="text-sm font-medium text-red-800">Errors:</h4>
              {validation.errors.map((error, idx) => (
                <div key={idx} className="text-sm text-red-700">
                  <span className="font-mono text-xs">{error.field}</span>: {error.message}
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-yellow-800">Warnings:</h4>
              {validation.warnings.map((warning, idx) => (
                <div key={idx} className="text-sm text-yellow-700">
                  <span className="font-mono text-xs">{warning.field}</span>: {warning.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-3">
          <Button onClick={handleCopy} variant="outline">
            {copied ? '✓ Copied!' : 'Copy to Clipboard'}
          </Button>
          {onDownload && (
            <Button onClick={onDownload}>
              Download JSON
            </Button>
          )}
        </div>
      )}

      {/* JSON Display */}
      <div className="relative">
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto max-h-[600px] overflow-y-auto">
          <code className="text-sm font-mono">
            {JSON.stringify(json, null, 2)}
          </code>
        </pre>
      </div>
    </div>
  );
};

interface JsonPreviewModalProps {
  json: VideoServiceProject;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

export const JsonPreviewModal: React.FC<JsonPreviewModalProps> = ({
  json,
  projectName,
  isOpen,
  onClose,
  onDownload
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">JSON Preview: {projectName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <JsonPreview
            json={json}
            onDownload={onDownload}
            showActions={true}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
