import React, { useState, useRef } from 'react';
import { Button } from '../ui/Button';

interface PortraitUploaderProps {
  currentPortrait?: string;
  onUpload: (file: File) => Promise<string>;
  onUrlChange?: (url: string) => void;
}

export const PortraitUploader: React.FC<PortraitUploaderProps> = ({
  currentPortrait,
  onUpload,
  onUrlChange
}) => {
  const [preview, setPreview] = useState<string | null>(currentPortrait || null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(currentPortrait || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      const url = await onUpload(file);
      onUrlChange?.(url);
    } catch (err) {
      console.error('Failed to upload portrait:', err);
      alert('Failed to upload portrait');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput) return;
    setPreview(urlInput);
    onUrlChange?.(urlInput);
  };

  const handleRemove = () => {
    setPreview(null);
    setUrlInput('');
    onUrlChange?.('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setMode('upload')}
          className={`px-4 py-2 font-medium transition-colors ${
            mode === 'upload'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setMode('url')}
          className={`px-4 py-2 font-medium transition-colors ${
            mode === 'url'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Use URL
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Portrait preview"
            className="w-full h-64 object-cover rounded-lg border"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Upload Mode */}
      {mode === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? 'Uploading...' : preview ? 'Change Portrait' : 'Upload Portrait'}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: JPG, PNG, WebP (max 5MB)
          </p>
        </div>
      )}

      {/* URL Mode */}
      {mode === 'url' && (
        <div className="space-y-2">
          <input
            type="url"
            placeholder="https://example.com/portrait.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
          <Button onClick={handleUrlSubmit} className="w-full">
            Use This URL
          </Button>
          <p className="text-xs text-gray-500">
            Enter a direct URL to an image
          </p>
        </div>
      )}
    </div>
  );
};
