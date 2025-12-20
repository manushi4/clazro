/**
 * Auth Store - Global authentication state management
 * 
 * Manages user session, authentication state, and role information
 * using Zustand for state management.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Role = 'student' | 'parent' | 'teacher' | 'admin' | 'super_admin';

type User = {
  id: string;
  email?: string;
  phone?: string;
  created_at?: string;
  [key: string]: any;
};

type Session = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  [key: string]: any;
};

type AuthState = {
  // State
  user: User | null;
  session: Session | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setRole: (role: Role | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, session: Session, role: Role) => void;
  logout: () => void;
  reset: () => void;
};

const initialState = {
  user: null,
  session: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setSession: (session) =>
        set({
          session,
          isAuthenticated: !!session,
        }),

      setRole: (role) =>
        set({ role }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      login: (user, session, role) =>
        set({
          user,
          session,
          role,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          ...initialState,
          isLoading: false,
        }),

      reset: () =>
        set(initialState),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
