export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  FORM = 'FORM',
  SUCCESS = 'SUCCESS'
}

export interface RequestFormData {
  firstName: string;
  lastName: string;
  homeCountry: string;
  managerName: string;
  managerEmail: string;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  rightToWork: boolean;
  noRestrictedRoles: boolean;
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
