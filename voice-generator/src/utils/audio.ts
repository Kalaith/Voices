export const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const downloadAudio = (audioUrl: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = audioUrl;
  link.download = `${filename}.wav`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};