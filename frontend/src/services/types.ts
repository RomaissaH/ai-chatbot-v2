/**
 * Type definitions for the API
 */

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface UserProfile {
  ai_summary?: string;
  preferred_model?: string;
  preferred_language: 'en' | 'ar';
  created_at: string;
  updated_at: string;
}

export interface UserProfileResponse {
  user: User;
  profile: UserProfile;
}

export interface AIModel {
  name: string;
  provider: string;
  display_name: string;
  is_available: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model_used?: string;
  tokens_used?: number;
  created_at: string;
}

export interface Chat {
  id: string;
  title?: string;
  model_type: string;
  language: 'en' | 'ar';
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: {
    content: string;
    role: string;
    created_at: string;
  };
}

export interface ChatListResponse {
  chats: Chat[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface PromptRequest {
  chat_id: string;
  content: string;
  model_type?: string;
  language?: 'en' | 'ar';
}

export interface PromptResponse {
  reply: string;
  chat_id: string;
  model_used: string;
  tokens_used: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name?: string;
  last_name?: string;
}

export interface APIError {
  message: string;
  status?: number;
}
