export interface Voice {
  id: string;
  name: string;
  description?: string;
  speed?: number;
  pitch?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  seed?: number;
  batch_size?: number;
  // Chatterbox-specific parameters
  exaggeration?: number;
  cfg_weight?: number;
  created_at?: string;
  updated_at?: string;
}