/**
 * API service for admin portal - connecting to Django backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  home_country: string;
  is_admin: boolean;
  is_sales_role: boolean;
  days_allowed: number;
  days_used: number;
  days_remaining: number;
  created_at: string;
}

export interface AdminRequest {
  id: string;
  user_email: string;
  user_name: string;
  destination_country: string;
  home_country: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  status: string;
  decision_status?: string;
  flags?: string[];
  decision_reason: string;
  created_at: string;
  is_exception_request?: boolean;
  exception_reason?: string;
}

export interface AdminAnalytics {
  total_requests: number;
  approved_requests: number;
  rejected_requests: number;
  escalated_requests: number;
  total_users: number;
  approval_rate: number;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

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
export async function login(email: string) {
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

export async function verifyOTP(email: string, code: string, rememberMe: boolean = false): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, remember_me: rememberMe }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Verification failed');
  }

  const data: AuthResponse = await response.json();

  // Check if user is admin
  if (!data.user.is_admin) {
    throw new Error('Access denied: Admin privileges required');
  }

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

// Admin Analytics endpoints
export async function getAdminDashboard(): Promise<AdminAnalytics> {
  const response = await fetchWithAuth('/admin/dashboard/');
  if (!response.ok) throw new Error('Failed to get dashboard data');
  return response.json();
}

// Admin Requests endpoints
export async function getAdminRequests(filters?: {
  status?: string;
  country?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  decision_status?: string;
}): Promise<AdminRequest[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.decision_status) params.append('decision_status', filters.decision_status);
  if (filters?.country) params.append('country', filters.country);
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  if (filters?.search) params.append('search', filters.search);

  const url = `/admin/requests/${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetchWithAuth(url);
  if (!response.ok) throw new Error('Failed to get requests');
  const data = await response.json();
  return data.results || data;
}

export async function getAdminRequest(id: string): Promise<AdminRequest> {
  const response = await fetchWithAuth(`/admin/requests/${id}/`);
  if (!response.ok) throw new Error('Failed to get request');
  return response.json();
}

// Admin Users endpoints
export async function getAdminUsers(filters?: {
  search?: string;
}): Promise<AdminUser[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);

  const url = `/admin/users/${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetchWithAuth(url);
  if (!response.ok) throw new Error('Failed to get users');
  const data = await response.json();
  return data.results || data;
}

export async function getAdminUser(id: number): Promise<AdminUser> {
  const response = await fetchWithAuth(`/admin/users/${id}/`);
  if (!response.ok) throw new Error('Failed to get user');
  return response.json();
}

// Policy documents
export interface PolicyDocument {
  id: string;
  doc_type: 'policy' | 'faq';
  file: string;
  version: number;
  status: 'draft' | 'published';
  notes?: string;
  uploaded_by_email: string;
  uploaded_at: string;
}

export async function listPolicyDocuments(docType?: 'policy' | 'faq'): Promise<PolicyDocument[]> {
  const params = docType ? `?doc_type=${docType}` : '';
  const response = await fetchWithAuth(`/admin/policies/${params}`);
  if (!response.ok) throw new Error('Failed to fetch policy documents');
  const data = await response.json();
  return data.results || data;
}

export async function uploadPolicyDocument(docType: 'policy' | 'faq', file: File, notes?: string): Promise<PolicyDocument> {
  const formData = new FormData();
  formData.append('doc_type', docType);
  formData.append('file', file);
  if (notes) formData.append('notes', notes);

  const headers: HeadersInit = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const response = await fetch(`${API_BASE_URL}/admin/policies/`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to upload document');
  return response.json();
}

export async function publishPolicyDocument(id: string): Promise<PolicyDocument> {
  const response = await fetchWithAuth(`/admin/policies/${id}/publish/`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to publish document');
  return response.json();
}

// Mira questions
export interface MiraQuestion {
  id: string;
  user_email: string;
  question_text: string;
  answer_text: string;
  context_country: string;
  linked_policy_section: string;
  answered: boolean;
  created_at: string;
}

export async function listMiraQuestions(): Promise<MiraQuestion[]> {
  const response = await fetchWithAuth('/admin/mira-questions/');
  if (!response.ok) throw new Error('Failed to fetch Mira questions');
  const data = await response.json();
  return data.results || data;
}

// Request comments
export interface RequestComment {
  id: string;
  request: string;
  author_email: string;
  body: string;
  created_at: string;
}

export async function listRequestComments(requestId: string): Promise<RequestComment[]> {
  const response = await fetchWithAuth(`/admin/request-comments/?request=${requestId}`);
  if (!response.ok) throw new Error('Failed to fetch comments');
  const data = await response.json();
  return data.results || data;
}

export async function addRequestComment(requestId: string, body: string): Promise<RequestComment> {
  const response = await fetchWithAuth('/admin/request-comments/', {
    method: 'POST',
    body: JSON.stringify({ request: requestId, body }),
  });
  if (!response.ok) throw new Error('Failed to add comment');
  return response.json();
}

export function isAuthenticated(): boolean {
  return !!accessToken;
}

export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
}
