import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '../services/api';
import { toast } from 'sonner';

export type UserRole = 'super_admin' | 'branch_admin' | 'teacher' | 'student' | 'parent';

export interface Permission {
  module: string;
  actions: ('view' | 'create' | 'edit' | 'delete' | 'manage')[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branch?: { _id: string; name: string; code: string };
  avatar?: string;
  isOwner?: boolean;
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
    const token = localStorage.getItem('accessToken');
    if (!token) { setIsLoading(false); return; }
    try {
      const { data } = await authApi.me();
      setUser({ ...data.data, id: data.data._id });
    } catch {
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser({ ...data.data.user, id: data.data.user.id });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // silent
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    // super_admin and branch_admin get wildcard
    if (user.role === 'super_admin') return true;
    const perm = user.permissions?.find(p => p.module === module || p.module === '*');
    return perm?.actions.includes(action as any) || perm?.actions.includes('manage') || false;
  };

  const canAccess = (module: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return user.permissions?.some(p => p.module === module || p.module === '*') || false;
  };

  const refreshUser = async () => { await loadUser(); };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading,
      login, logout, hasPermission, canAccess, refreshUser
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
