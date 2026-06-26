'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, api } from '@/services/api';

export type UserRole = 'super_admin' | 'branch_admin' | 'teacher' | 'student' | 'parent';

export interface Permission {
  module: string;
  actions: ('view' | 'create' | 'edit' | 'delete' | 'manage')[];
}

export interface User {
  _id?: string;
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  branch?: { _id: string; name: string; code: string; city?: string };
  permissions: Permission[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (module: string, action: string) => boolean;
  canAccess: (module: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) { setIsLoading(false); return; }

    try {
      const { data } = await authApi.me();
      const u = data.data;
      setUser({ ...u, id: u._id || u.id });
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;

      if (status === 401 && code === 'TOKEN_EXPIRED') {
        // Try to refresh
        try {
          const { data: refreshData } = await authApi.refresh();
          const newToken = refreshData.data.accessToken;
          localStorage.setItem('accessToken', newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          // Retry me
          const { data: retryData } = await authApi.me();
          const u = retryData.data;
          setUser({ ...u, id: u._id || u.id });
          return;
        } catch {
          // refresh also failed
        }
      }
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    const token = data.data.accessToken;
    localStorage.setItem('accessToken', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const u = data.data.user;
    setUser({ ...u, id: u._id || u.id });
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* silent */ }
    finally {
      localStorage.removeItem('accessToken');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'branch_admin') return true;
    const perm = user.permissions?.find(p => p.module === module || p.module === '*');
    return !!(perm?.actions.includes(action as any) || perm?.actions.includes('manage'));
  };

  const canAccess = (module: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'branch_admin') return true;
    return !!user.permissions?.some(p => p.module === module || p.module === '*');
  };

  const refreshUser = async () => { await loadUser(); };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading,
      login, logout, hasPermission, canAccess, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
