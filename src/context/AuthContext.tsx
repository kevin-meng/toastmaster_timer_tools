import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../utils/api';
import type { User } from '../types';

const GUEST_USER: User = {
  id: 0,
  phone: '',
  wechat_openid: '',
  username: '访客用户',
  is_active: true,
};

interface AuthContextType {
  user: User;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  sendSmsCode: (phone: string) => Promise<void>;
  loginWithPhone: (phone: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(GUEST_USER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/users/me');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user', error);
          localStorage.removeItem('token');
        }
      }
      // 无 token 时保持默认访客用户，直接可用
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    const response = await api.get('/users/me');
    setUser(response.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(GUEST_USER);
  };

  const sendSmsCode = async (phone: string) => {
    await api.post('/auth/send-sms-code', { phone });
  };

  const loginWithPhone = async (phone: string, code: string) => {
    const response = await api.post('/auth/login/phone', { phone, code });
    await login(response.data.access_token);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, sendSmsCode, loginWithPhone }}>
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
