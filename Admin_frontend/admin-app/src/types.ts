/**
 * TypeScript type definitions for admin portal
 */

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
  decision_source?: string;
  flags?: string[];
  decision_reason: string;
  created_at: string;
  is_exception_request?: boolean;
  exception_reason?: string;
  decision_notified_at?: string;
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

export type RequestStatus = 'approved' | 'rejected' | 'escalated' | 'pending';

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

export interface RequestComment {
  id: string;
  request: string;
  author_email: string;
  body: string;
  created_at: string;
}
