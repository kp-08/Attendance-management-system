import { api, API_ENDPOINTS } from '../config/api';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  /**
   * Login user
   * FastAPI endpoint should return: { user: User, token: string, message: string }
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
    
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    // Store user data
    if (response.user) {
      localStorage.setItem('currentUser', JSON.stringify(response.user));
    }
    
    return response;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      await api.post(API_ENDPOINTS.LOGOUT, {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    }
  },

  /**
   * Change password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<any> => {
    return await api.post(API_ENDPOINTS.CHANGE_PASSWORD, data);
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },

  /**
   * Get auth token
   */
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },
};
