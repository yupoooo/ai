export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface GeneratedImage {
  id: string;
  url: string; // Base64 data URL
  prompt: string;
  type: 'creation' | 'edit';
  timestamp: number;
  originalImage?: string; // For edits
}

export interface GenerationConfig {
  aspectRatio: AspectRatio;
}

export type AppMode = 'create' | 'edit';