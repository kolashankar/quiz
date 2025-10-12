import { apiClient } from './api-client';
import { API_ENDPOINTS } from '../constants/api';
import { AuthResponse, LoginCredentials, SignupCredentials, User } from '../types';
import { storage } from './storage';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH_LOGIN, credentials);
    const data = response.data;
    
    // Store token and user data
    storage.setToken(data.access_token);
    storage.setUserData(data.user);
    
    return data;
  },

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH_SIGNUP, credentials);
    const data = response.data;
    
    // Store token and user data
    storage.setToken(data.access_token);
    storage.setUserData(data.user);
    
    return data;
  },

  async forgotPassword(email: string): Promise<{ message: string; reset_code?: string }> {
    const response = await apiClient.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
    return response.data;
  },

  async resetPassword(email: string, reset_code: string, new_password: string): Promise<{ message: string }> {
    const response = await apiClient.post(API_ENDPOINTS.RESET_PASSWORD, {
      email,
      reset_code,
      new_password,
    });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get(API_ENDPOINTS.AUTH_ME);
    return response.data;
  },

  async updateProfile(data: { name?: string; email?: string; avatar?: string }): Promise<User> {
    const response = await apiClient.put(API_ENDPOINTS.PROFILE_UPDATE, data);
    return response.data;
  },

  logout(): void {
    storage.clearAll();
  },
};
