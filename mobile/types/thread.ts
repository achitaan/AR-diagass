export type DepthLevel = 'skin' | 'muscle' | 'deep';

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

export interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  depth: DepthLevel;
  color: string;
  width: number;
}

export interface Thread {
  id: string;
  title: string;
  emoji: string;
  lastMessage: string;
  lastUpdated: number;
  messages: Message[];
  drawings: DrawingStroke[];
}
