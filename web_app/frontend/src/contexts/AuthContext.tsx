'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, SignupCredentials } from '../types';
import { authService } from '../lib/auth-service';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = storage.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error: any) {
      console.error('Auth check failed:', error);
      // Only clear auth if it's a 401 error (unauthorized)
      if (error?.response?.status === 401) {
        authService.logout();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
  };

  const signup = async (credentials: SignupCredentials) => {
    const response = await authService.signup(credentials);
    setUser(response.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.push('/auth/login');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
