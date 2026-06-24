import React, { createContext, useContext, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  email: string | null;
  role: string | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, email: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    email: null,
    role: null,
  });

  const login = async (token: string, email: string, role: string) => {
    await SecureStore.setItemAsync('auth_token', token);
    setState({ token, email, role });
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    setState({ token: null, email: null, role: null });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
