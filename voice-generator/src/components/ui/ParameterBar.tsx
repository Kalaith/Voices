import React from 'react';
import { formatParameterValue, getParameterColor } from '../../lib/utils';

interface ParameterBarProps {
  label: string;
  value: number;
  maxValue?: number;
  showValue?: boolean;
  size?: 'sm' | 'md';
}

export const ParameterBar: React.FC<ParameterBarProps> = ({
  label,
  value,
  maxValue = 2,
  showValue = true,
  size = 'md'
}) => {
  const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
  const colorClass = getParameterColor(label.toLowerCase().replace(' ', '_'), value);
  const formattedValue = formatParameterValue(label.toLowerCase().replace(' ', '_'), value);
  
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className={`font-medium text-gray-700 ${textSize}`}>
          {label}
        </span>
        {showValue && (
          <span className={`text-gray-600 ${textSize}`}>
            {formattedValue} ({value})
          </span>
        )}
      </div>
      <div className="relative">
        <div className={`w-full bg-gray-200 rounded-full ${barHeight}`}>
          <div
            className={`${barHeight} rounded-full transition-all duration-300 ${colorClass}`}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemax={maxValue}
            aria-label={`${label}: ${formattedValue}`}
          />
        </div>
        {/* Tick marks for reference */}
        <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center pointer-events-none">
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <div
              key={tick}
              className="w-0.5 h-full bg-gray-400 opacity-30"
              style={{ marginLeft: tick === 0 ? '0' : '-1px' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};