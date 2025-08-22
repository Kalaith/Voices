export interface AudioGeneration {
  id: string;
  scriptId: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  audioUrl?: string;
  error?: string;
}