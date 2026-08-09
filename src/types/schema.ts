export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  createdAt: string;
}

export type DifficultyTier = 'easy' | 'medium' | 'hard';

export type MathTopic = 'fractions' | 'ratios' | 'geometry' | 'decimals';

export interface Question {
  id: string;
  subject: string; // e.g. 'Mathematics'
  topic: MathTopic;
  difficulty: DifficultyTier;
  questionText: string;
  questionTextHindi: string;     // Hindi question for display
  questionTextHindiAudio?: string; // Hinglish phonetic fallback for English TTS engines
  options: string[];
  optionsHindi?: string[];
  correctAnswerIndex: number;
  explanation: string;
  explanationHindi: string;
}

export interface Attempt {
  id: string;
  studentId: string;
  questionId: string;
  topic: MathTopic;
  difficulty: DifficultyTier;
  isCorrect: boolean;
  selectedAnswerIndex: number;
  responseTimeMs: number; // For speed/engagement metrics
  timestamp: number; // Epoch milliseconds
  synced?: boolean; // Offline-first queue tracking flag
}

export interface StudentProgress {
  id: string; // `${studentId}_${topic}`
  studentId: string;
  topic: MathTopic;
  currentTier: DifficultyTier;
  rollingHistory: boolean[]; // Last N boolean attempt outcomes (e.g. [true, true, false])
  rollingAccuracy: number; // Percentage 0-100%
  totalAttempts: number;
  correctCount: number;
  streakCount: number;
  badges: string[];
  lastUpdated: number;
}
