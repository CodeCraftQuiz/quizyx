
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum QuizDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export enum QuestionType {
  SINGLE = 'single',
  MULTI = 'multi'
}

export interface User {
  _id: string;
  username: string;
  email: string;
  avatarUrl: string; // New field
  role: UserRole;
  history: Result[];
  lastUsernameChange?: string; // ISO Date string
  token?: string;
  winstreak: number;
  maxWinstreak: number;
  friends: string[]; 
  friendRequests: string[];
}

export interface Question {
  _id?: string;
  content: string;
  answers: string[];
  correctAnswers: number[]; 
  type: QuestionType;
}

// Added 'money_drop' to QuizType to match usage in QuizRoom and fix type comparison errors
export type QuizType = 'standard' | 'exam' | 'infinity' | 'duel' | 'millionaire' | 'money_drop';

export interface Quiz {
  _id: string;
  title: string;
  description?: string;
  difficulty: QuizDifficulty;
  type: QuizType;
  questions: Question[];
  timeLimit?: number; 
  author?: string;
}

export interface Result {
  _id?: string;
  quizId: string;
  quizType?: QuizType;
  userId: string;
  score: number;
  maxScore: number;
  date: string;
  timeSpent: number;
  quizTitle?: string;
  username?: string;
  userWinstreak?: number;
}

export enum AdTriggerType {
  ON_LOGIN = 'onLogin',
  ON_QUIZ_START = 'onQuizStart',
  ON_QUIZ_END = 'onQuizEnd',
  ON_PROFILE_VIEW = 'onProfileView',
  ON_SOCIAL_VIEW = 'onSocialView'
}

export enum AdLocation {
  HOME_TOP = 'home_top',
  QUIZ_SIDEBAR = 'quiz_sidebar',
  POPUP = 'popup',
  FULLSCREEN = 'fullscreen'
}

export interface Advertisement {
  _id: string;
  title: string;
  content: string;
  location: AdLocation;
  triggerType: AdTriggerType;
  triggerValue?: number;
  priority: number;
  active: boolean;
}

export interface UserSummary {
    _id: string;
    username: string;
    avatarUrl: string; // New field
    winstreak: number;
}