import { create } from 'zustand';

export interface AuthUser {
  id: number | string;
  username: string;
  role: string;
  name?: string;
  email?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const getInitialState = () => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  if (!token || !storedUser) {
    return { token: null, user: null };
  }

  try {
    const user = JSON.parse(storedUser) as AuthUser;
    return { token, user };
  } catch (error) {
    console.error('Failed to parse stored user session:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { token: null, user: null };
  }
};

const initialState = getInitialState();

export const useAuthStore = create<AuthState>((set) => ({
  token: initialState.token,
  user: initialState.user,
  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));
