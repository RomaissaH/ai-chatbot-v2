/**
 * Auth API service functions
 */
import { api } from './api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  UserProfileResponse,
} from './types';

/**
 * Login user
 */
export const loginUser = async (
  credentials: LoginRequest
): Promise<LoginResponse> => {
  const response = await api.post('/auth/login/', credentials);
  return response.data;
};

/**
 * Register new user
 */
export const registerUser = async (
  userData: RegisterRequest
): Promise<{ message: string }> => {
  const response = await api.post('/auth/register/', userData);
  return response.data;
};

/**
 * Logout user
 */
export const logoutUser = async (): Promise<void> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (refreshToken) {
    await api.post('/auth/logout/', { refresh_token: refreshToken });
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (): Promise<UserProfileResponse> => {
  const response = await api.get('/auth/profile/');
  return response.data;
};
