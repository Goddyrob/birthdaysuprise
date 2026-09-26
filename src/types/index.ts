export interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  date?: string;
  rotation?: number;
  x?: number; // percentage in space
  y?: number;
  z?: number;
  scale?: number;
}

export interface AppConfig {
  recipientName: string;
  senderName: string;
  mainPhoto: string;
  polaroidText: string;
  passcode: string;
  cakeHeading: string;
  cakeCelebrationText: string;
  letterTitle: string;
  letterGreeting: string;
  letterBody: string[];
  letterClosing: string;
  galleryPhotos: PhotoItem[];
  customAudioUrl?: string;
  musicTitle?: string;
}

export interface ShareResult {
  url: string;
  copied: boolean;
}

export type SceneType = 'landing' | 'lamp' | 'cake' | 'letter' | 'space';
