/**
 * API service for connecting to Django backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Token storage
let accessToken: string | null = null;
let refreshToken: string | null = null;

export interface User {
  id: number;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone?: string;
  maersk_entity: string;
  home_country: string;
  is_sales_role: boolean;
  days_allowed: number;
  days_used: number;
  days_remaining: number;
  profile_completed?: boolean;
  profile_consent_given?: boolean;
}

export interface LoginResponse {
  message: string;
  email: string;
  debug_code?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ComplianceAssessment {
  outcome: 'approved' | 'rejected' | 'escalated';
  reason: string;
  rules: Array<{
    name: string;
    passed: boolean;
    reason: string;
    severity: string;
  }>;
}

export interface RemoteWorkRequest {
  id: string;
  reference_number: string;
  status: string;
  destination_country: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  created_at: string;
}

export interface ChatResponse {
  session_id: string;
  text: string;
  decision?: {
    outcome?: string;
    reason?: string;
  };
}

// Helper for making authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  // Handle 401 by clearing tokens
  if (response.status === 401) {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  return response;
}

// Initialize tokens from localStorage
export function initAuth(): User | null {
  accessToken = localStorage.getItem('accessToken');
  refreshToken = localStorage.getItem('refreshToken');
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
}

// Auth endpoints
export async function login(email: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.email?.[0] || error.detail || 'Login failed');
  }

  return response.json();
}

export async function verifyOTP(email: string, code: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Verification failed');
  }

  const data: AuthResponse = await response.json();

  // Store tokens
  accessToken = data.access;
  refreshToken = data.refresh;
  localStorage.setItem('accessToken', data.access);
  localStorage.setItem('refreshToken', data.refresh);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
}

export async function logout(): Promise<void> {
  try {
    await fetchWithAuth('/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
  } finally {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}

// User endpoints
export async function getCurrentUser(): Promise<User> {
  const response = await fetchWithAuth('/users/me/');
  if (!response.ok) throw new Error('Failed to get user');
  return response.json();
}

export async function getDaysRemaining(): Promise<{ used: number; allowed: number; remaining: number }> {
  const response = await fetchWithAuth('/users/me/days-remaining/');
  if (!response.ok) throw new Error('Failed to get days remaining');
  return response.json();
}

// Compliance endpoints
export async function assessCompliance(data: {
  has_right_to_work: boolean;
  is_sales_role: boolean;
  duration_days: number;
  home_country: string;
  destination_country: string;
}): Promise<ComplianceAssessment> {
  const response = await fetchWithAuth('/compliance/assess/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Compliance assessment failed');
  return response.json();
}

// Request endpoints
export async function getRequests(): Promise<RemoteWorkRequest[]> {
  const response = await fetchWithAuth('/requests/');
  if (!response.ok) throw new Error('Failed to get requests');
  const data = await response.json();
  return data.results || data;
}

export async function createRequest(data: {
  request_type?: string;
  maersk_entity: string;
  home_country: string;
  destination_country: string;
  start_date: string;
  end_date: string;
  has_right_to_work: boolean;
  is_sales_role: boolean;
}): Promise<RemoteWorkRequest> {
  const response = await fetchWithAuth('/requests/', {
    method: 'POST',
    body: JSON.stringify({
      request_type: 'short_term',
      ...data,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create request');
  }
  return response.json();
}

// AI Chat endpoints
export async function sendChatMessage(message: string, sessionId?: string): Promise<ChatResponse> {
  const response = await fetchWithAuth('/ai/chat/', {
    method: 'POST',
    body: JSON.stringify({
      message,
      session_id: sessionId,
    }),
  });
  if (!response.ok) throw new Error('Chat failed');
  return response.json();
}

export async function createChatSession(): Promise<{ session_id: string }> {
  const response = await fetchWithAuth('/ai/chat/sessions/', {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to create chat session');
  return response.json();
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!accessToken;
}

// ============================================
// SIRW Wizard API Endpoints
// ============================================

export interface SIRWSubmissionData {
  destination_country: string;
  start_date: string;
  end_date: string;
  has_right_to_work: boolean;
  confirmed_role_eligible: boolean;
  manager_first_name: string;
  manager_middle_name?: string;
  manager_last_name: string;
  manager_email: string;
  is_exception_request?: boolean;
  exception_reason?: string;
}

export interface SIRWSubmissionResponse {
  reference_number: string;
  status: string;
  outcome: 'approved' | 'rejected' | 'pending';
  message: string;
  days_used_this_year: number;
  days_remaining: number;
  request: RemoteWorkRequest;
}

export interface AnnualBalanceResponse {
  year: number;
  days_allowed: number;
  days_used: number;
  days_remaining: number;
  pending_days: number;
  requests_this_year: RemoteWorkRequest[];
}

export interface DateOverlapResponse {
  has_overlap: boolean;
  nearby_requests: RemoteWorkRequest[];
  combined_days: number;
  warning: string | null;
}

/**
 * Submit a SIRW request from the wizard.
 */
export async function submitSIRWRequest(data: SIRWSubmissionData): Promise<SIRWSubmissionResponse> {
  const response = await fetchWithAuth('/requests/sirw/submit/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    // Handle validation errors
    if (typeof error === 'object') {
      const messages = Object.entries(error)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('; ');
      throw new Error(messages || 'Failed to submit SIRW request');
    }
    throw new Error(error.detail || 'Failed to submit SIRW request');
  }
  
  return response.json();
}

/**
 * Get the user's annual SIRW day balance.
 */
export async function getSIRWAnnualBalance(): Promise<AnnualBalanceResponse> {
  const response = await fetchWithAuth('/requests/sirw/balance/');
  if (!response.ok) throw new Error('Failed to get annual balance');
  return response.json();
}

/**
 * Check if proposed dates overlap with existing requests.
 */
export async function checkDateOverlap(startDate: string, endDate: string): Promise<DateOverlapResponse> {
  const response = await fetchWithAuth('/requests/sirw/check-overlap/', {
    method: 'POST',
    body: JSON.stringify({
      start_date: startDate,
      end_date: endDate,
    }),
  });
  if (!response.ok) throw new Error('Failed to check date overlap');
  return response.json();
}

/**
 * Update user profile with SIRW details.
 */
export async function updateUserProfile(data: {
  phone?: string;
  middle_name?: string;
  home_country?: string;
  profile_consent_given?: boolean;
}): Promise<User> {
  const response = await fetchWithAuth('/users/me/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update profile');
  
  const updatedUser = await response.json();
  // Update local storage
  localStorage.setItem('user', JSON.stringify(updatedUser));
  return updatedUser;
}
