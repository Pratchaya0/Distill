export interface TranscriptSegment {
  start: number; // seconds
  end: number;
  text: string;
}

export interface ActionItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Recording {
  id?: number;
  title: string;
  duration: number; // seconds
  audioBlob: Blob;
  transcript?: TranscriptSegment[];
  summary?: string;
  actionItems?: ActionItem[];
  mindMap?: string;
  tags: string[];
  isFavorite: boolean;
  templateId?: string;
  language: 'th' | 'en'; // transcription + AI output language
  createdAt: Date;
}

export interface Note {
  id?: number;
  recordingId: number;
  timestamp: number; // seconds into the recording
  content: string; // rich text (HTML)
  images: Blob[]; // stored as Blobs in IndexedDB (consistent with audioBlob)
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  tags: string[];
  isBuiltIn?: boolean; // built-ins shown read-only; custom ones are editable
}

export type RecorderState = 'idle' | 'recording' | 'processing' | 'saved';
export type CaptureMode = 'mic' | 'screen';
export type Language = 'th' | 'en';
