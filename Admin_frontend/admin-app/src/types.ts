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
  decision_reason: string;
  created_at: string;
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
