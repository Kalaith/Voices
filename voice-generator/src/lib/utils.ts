import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatParameterValue(key: string, value: number): string {
  switch (key) {
    case 'speed':
      if (value < 0.5) return 'Very Slow';
      if (value < 0.8) return 'Slow';
      if (value < 1.2) return 'Normal';
      if (value < 1.5) return 'Fast';
      return 'Very Fast';
    case 'pitch':
      if (value < 0.5) return 'Very Low';
      if (value < 0.8) return 'Low';
      if (value < 1.2) return 'Normal';
      if (value < 1.5) return 'High';
      return 'Very High';
    case 'temperature':
      if (value < 0.3) return 'Conservative';
      if (value < 0.7) return 'Balanced';
      return 'Creative';
    case 'top_p':
      if (value < 0.3) return 'Focused';
      if (value < 0.7) return 'Balanced';
      return 'Diverse';
    default:
      return value.toString();
  }
}

export function getParameterColor(key: string, value: number): string {
  const percentage = Math.min(Math.max(value / (key === 'top_k' ? 100 : 2), 0), 1);
  if (percentage < 0.33) return 'bg-blue-500';
  if (percentage < 0.67) return 'bg-green-500';
  return 'bg-orange-500';
}