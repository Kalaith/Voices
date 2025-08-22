import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean | null;
  onRetryConnection: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  onRetryConnection,
}) => {
  return (
    <div className="flex items-center gap-4 mt-4">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-600">
          ChatTTS: {isConnected === null ? 'Checking...' : isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      {!isConnected && (
        <button
          onClick={onRetryConnection}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
};