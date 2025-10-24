import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiService, LoginRequest, LoginResponse } from '../lib/api';

interface User {
  username: string;
  tenant: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = () => {
      if (ApiService.isAuthenticated()) {
        // You could decode JWT token to get user info
        // For now, we'll set a basic user object
        setUser({ username: 'admin@demo', tenant: 'demo' });
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response: LoginResponse = await ApiService.login(credentials);

        // For now, we'll extract basic info from the username
        setUser({
            username: credentials.username,
            tenant: 'demo' // This could be extracted from JWT token
        });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    ApiService.logout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}