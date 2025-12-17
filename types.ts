export interface Option {
  id: string;
  label: string;
  icon?: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
}

export interface Answer {
  questionId: string;
  optionId: string;
  optionLabel: string;
}

export interface AlternativePet {
  name: string;
  reason: string;
}

export interface CareGuide {
  diet: string;
  grooming: string;
  exercise: string;
  health: string;
  training: string;
  dailySchedule: string;
}

export interface PetRecommendation {
  name: string;
  englishName: string;
  species: string;
  description: string;
  matchReason: string;
  careLevel: string;
  exerciseNeeds: string;
  estimatedCost: string;
  alternatives: AlternativePet[];
  careGuide: CareGuide;
}

export interface RecommendationResponse {
  recommendations: PetRecommendation[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ApiSettings {
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
}

export type AppState = 'welcome' | 'questionnaire' | 'processing' | 'results' | 'refining' | 'settings' | 'error';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}