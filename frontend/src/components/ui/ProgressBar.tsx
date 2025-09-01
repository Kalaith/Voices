import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  indeterminate?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  size = 'md',
  variant = 'default',
  indeterminate = false
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variants = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">
              {label}
            </span>
          )}
          {showPercentage && !indeterminate && (
            <span className="text-sm text-gray-600">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${sizes[size]} transition-all duration-300 rounded-full ${variants[variant]} ${
            indeterminate ? 'animate-pulse' : ''
          }`}
          style={{
            width: indeterminate ? '100%' : `${clampedProgress}%`,
            animation: indeterminate ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : undefined
          }}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : clampedProgress}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-label={label || 'Progress'}
        />
      </div>
    </div>
  );
};