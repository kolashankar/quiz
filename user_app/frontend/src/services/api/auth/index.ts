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
    const response = await apiClient.get(API_ENDPOINTS.AUTH_ME);
    return response.data;
  },

  async logout(): Promise<void> {
    await storage.clearAll();
  },
};