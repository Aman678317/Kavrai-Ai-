import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  StudioUser,
  StudioRole,
  Permission,
  ROLE_PERMISSIONS,
  STUDIO_PERSONAS,
} from '../types/auth';

interface AuthContextType {
  user: StudioUser | null;
  role: StudioRole | null;
  isAuthenticated: boolean;
  token: string | null;
  availablePersonas: StudioUser[];
  switchPersona: (roleOrId: StudioRole | string) => void;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'kavrai_auth_session';

let memoryAuthStore: StudioUser | null = null;

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function getStoredUser(): StudioUser {
  if (hasLocalStorage()) {
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Fallback
    }
  }
  return memoryAuthStore || STUDIO_PERSONAS[0];
}

function persistUser(user: StudioUser | null): void {
  memoryAuthStore = user;
  if (hasLocalStorage()) {
    try {
      if (user) {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // Fallback
    }
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StudioUser | null>(() => getStoredUser());

  useEffect(() => {
    persistUser(user);
  }, [user]);

  const switchPersona = (roleOrId: StudioRole | string) => {
    const target = STUDIO_PERSONAS.find(
      (p) => p.role === roleOrId || p.id === roleOrId
    );
    if (target) {
      setUser(target);
    }
  };

  const login = async (email: string, _password?: string): Promise<boolean> => {
    const matched = STUDIO_PERSONAS.find(
      (p) => p.email.toLowerCase() === email.toLowerCase().trim()
    );
    if (matched) {
      setUser(matched);
      return true;
    }
    // Create new custom user session if not in pre-seeded personas
    const newUser: StudioUser = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      role: 'DIRECTOR',
      title: 'Studio Creative Lead',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
      studio: 'Independent Production Stage',
      token: `jwt-custom-auth-token-${Date.now()}`,
    };
    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user || !user.role) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        token: user?.token || null,
        availablePersonas: STUDIO_PERSONAS,
        switchPersona,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
