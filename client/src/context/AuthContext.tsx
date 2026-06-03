import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'executive';
  avatar?: string;
  phone?: string;
  status: 'active' | 'inactive';
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ resetToken?: string; message: string }>;
  resetPassword: (data: any) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load user session and theme settings on mount
  useEffect(() => {
    // Theme initial state
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Verify Session
    const token = localStorage.getItem('token');
    if (token) {
      api.get<{ user: User }>('/api/auth/me')
        .then((res) => {
          setUser(res.user);
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.post<{ token: string; user: User }>('/api/auth/login', credentials);
    localStorage.setItem('token', res.token);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await api.post<{ token: string; user: User }>('/api/auth/register', data);
    localStorage.setItem('token', res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    return api.post<{ resetToken?: string; message: string }>('/api/auth/forgot-password', { email });
  };

  const resetPassword = async (data: any) => {
    await api.post('/api/auth/reset-password', data);
  };

  const updateProfile = async (data: any) => {
    const res = await api.put<{ user: User }>('/api/users/me', data);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      theme,
      toggleTheme,
      login,
      register,
      logout,
      forgotPassword,
      resetPassword,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
