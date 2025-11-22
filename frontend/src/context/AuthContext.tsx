/**
 * Authentication Context
 * Manages global authentication state
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Employer } from '../services/api';

interface AuthContextType {
  employer: Employer | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, employer: Employer) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const loadAuth = async () => {
      // DEMO MODE: Auto-login enabled (auth endpoints disabled)
      console.log('🎭 Demo Mode: Auto-login enabled (auth endpoints disabled)');
      
      // Create a mock employer for demo purposes
      const demoEmployer: Employer = {
        id: 'demo-employer-1',
        email: 'demo@payday.com',
        firstName: 'Demo',
        lastName: 'Employer',
        companyName: 'PayDay Demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const demoToken = 'demo-token-' + Date.now();
      
      // Auto-login for demo
      setToken(demoToken);
      setEmployer(demoEmployer);
      localStorage.setItem('authToken', demoToken);
      
      setIsLoading(false);
    };

    loadAuth();
  }, []);

  const login = (newToken: string, newEmployer: Employer) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    setEmployer(newEmployer);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setEmployer(null);
  };

  const value: AuthContextType = {
    employer,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!token && !!employer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
