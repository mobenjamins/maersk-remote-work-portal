export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  SELECTION = 'SELECTION',
  CHAT = 'CHAT', // Now represents the Smart Wizard
  FORM = 'FORM',
  HR_DASHBOARD = 'HR_DASHBOARD',
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

export interface RequestData {
  firstName: string;
  lastName: string;
  homeCountry: string;
  managerName: string;
  managerEmail: string;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  rightToWork: boolean;
  complianceConfirmed: boolean;
}