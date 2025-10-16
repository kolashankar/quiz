import { apiClient } from '../client';
import { API_ENDPOINTS } from '../../../constants/api';
import { AuthResponse, LoginCredentials, SignupCredentials, User } from '../../../types';
import { storage } from '../../storage';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH_LOGIN, credentials);
    const data = response.data;
    
    // Store token and user data
    await storage.setToken(data.access_token);
    await storage.setUserData(data.user);
    
    return data;
  },

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH_SIGNUP, credentials);
    const data = response.data;
    
    // Store token and user data
    await storage.setToken(data.access_token);
    await storage.setUserData(data.user);
    
    return data;
  },

  async getCurrentUser(): Promise<User> {
    try {
      // Try to get profile with extended info first
      const response = await apiClient.get(API_ENDPOINTS.USER_PROFILE);
      return response.data;
    } catch (error) {
      // Fallback to basic auth/me endpoint
      const response = await apiClient.get(API_ENDPOINTS.AUTH_ME);
      return response.data;
    }
  },

  async updateProfile(data: { name?: string; email?: string; avatar?: string }): Promise<User> {
    const response = await apiClient.put(API_ENDPOINTS.USER_PROFILE, data);
    await storage.setUserData(response.data);
    return response.data;
  },

  async selectExam(examId: string): Promise<{ success: boolean; exam_name: string }> {
    const response = await apiClient.put(API_ENDPOINTS.USER_SELECT_EXAM, { exam_id: examId });
    return response.data;
  },

  async logout(): Promise<void> {
    await storage.clearAll();
  },
};