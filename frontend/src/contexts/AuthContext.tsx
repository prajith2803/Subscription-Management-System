import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser } from '../types';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: any) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      setUser(res.user);
      toast.success('Logged in successfully');
      if (res.user.role === 'CUSTOMER') {
        window.location.href = '/portal';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      await authApi.register(data);
      toast.success('Registration successful! Please login.');
      window.location.href = '/login';
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      toast.success('Logged out');
      window.location.href = '/login';
    } catch (err) {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

