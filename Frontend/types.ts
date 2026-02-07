export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  SELECTION = 'SELECTION',
  CHAT = 'CHAT',
  FORM = 'FORM',
  SUCCESS = 'SUCCESS'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export interface UserSession {
  email: string;
  isAuthenticated: boolean;
}