import axios from 'axios';
import { LoginCredentials, RegisterCredentials, AuthResponse, User } from '@/types/auth/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', credentials);
      // Backend returns { access_token, token_type, user }
      // Map to frontend format { token, user }
      const { access_token, user } = response.data;
      return {
        token: access_token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
        }
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.response?.data?.error || 'Login failed');
    }
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/signup', credentials);
      // Backend returns { access_token, token_type, user }
      // Map to frontend format { token, user }
      const { access_token, user } = response.data;
      return {
        token: access_token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
        }
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.response?.data?.error || 'Registration failed');
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/auth/me');
      // Backend returns user object directly
      const userData = response.data;
      return {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        createdAt: userData.created_at,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.response?.data?.error || 'Failed to get user');
    }
  },

  logout() {
    localStorage.removeItem('auth_token');
  }
};

export { api };