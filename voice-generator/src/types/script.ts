export interface Speaker {
  id: string;
  name: string;
  voiceId: string;
  color: string;
}

export interface ScriptLine {
  id: string;
  speakerId: string;
  text: string;
  duration?: number;
}

export interface Script {
  id: string;
  name: string;
  speakers: Speaker[];
  lines: ScriptLine[];
}