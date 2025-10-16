import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, SignupCredentials } from '../types';
import { authService } from '../services/api/auth';
import { storage } from '../services/storage';

interface SelectedExam {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  selectedExam: SelectedExam | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setSelectedExam: (exam: SelectedExam | null) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await storage.getToken();
      if (token) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      await storage.clearAll();
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

  const logout = async () => {
    await authService.logout();
    setUser(null);
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