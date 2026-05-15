// Authentication Hook
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Member } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
  isAuthenticated: boolean;
  member: Member | null;
  accessToken: string | null;
  refreshToken: string | null;
  rememberMe: boolean;
  login: (phone: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  updateMember: (member: Partial<Member>) => void;
  refreshAuth: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

// Helper to get storage based on rememberMe preference
const getStorage = (rememberMe: boolean) => {
  return rememberMe ? localStorage : sessionStorage;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      member: null,
      accessToken: null,
      refreshToken: null,
      rememberMe: true, // Default to true for backward compatibility
      
      login: async (phone: string, password: string, rememberMe: boolean = true) => {
        try {
          const response = await api.auth.login(phone, password);
          
          // Store rememberMe preference
          const storage = getStorage(rememberMe);
          const otherStorage = rememberMe ? sessionStorage : localStorage;
          
          // Clear tokens from the other storage type
          otherStorage.removeItem('accessToken');
          otherStorage.removeItem('refreshToken');
          otherStorage.removeItem('auth-storage');
          
          // Store tokens in appropriate storage
          storage.setItem('accessToken', response.accessToken);
          storage.setItem('refreshToken', response.refreshToken);
          
          set({
            isAuthenticated: true,
            member: response.member,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            rememberMe: rememberMe,
          });
        } catch (error) {
          // Clear any existing auth state on login failure
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          set({
            isAuthenticated: false,
            member: null,
            accessToken: null,
            refreshToken: null,
          });
          throw error;
        }
      },
      
      logout: () => {
        // Clear all auth data from both storages
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        set({
          isAuthenticated: false,
          member: null,
          accessToken: null,
          refreshToken: null,
          rememberMe: true,
        });
      },
      
      updateMember: (memberUpdate) => {
        set((state) => ({
          member: state.member ? { ...state.member, ...memberUpdate } : null,
        }));
      },
      
      refreshAuth: async () => {
        const { refreshToken, rememberMe } = get();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        try {
          const response = await api.auth.refresh(refreshToken);
          
          // Store in appropriate storage based on rememberMe
          const storage = getStorage(rememberMe);
          storage.setItem('accessToken', response.accessToken);
          storage.setItem('refreshToken', response.refreshToken);
          
          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          });
        } catch (error) {
          // If refresh fails, logout
          get().logout();
          throw error;
        }
      },
      
      initializeAuth: async () => {
        const state = get();
        // Check if we have tokens in either storage
        const localToken = localStorage.getItem('accessToken');
        const sessionToken = sessionStorage.getItem('accessToken');
        const token = localToken || sessionToken;
        
        if (token && !state.isAuthenticated) {
          // We have a token, try to validate it by fetching profile
          try {
            const member = await api.client.getMe();
            const rememberMe = !!localToken; // If token is in localStorage, rememberMe was true
            
            set({
              isAuthenticated: true,
              member: member,
              accessToken: token,
              refreshToken: rememberMe ? localStorage.getItem('refreshToken') : sessionStorage.getItem('refreshToken'),
              rememberMe: rememberMe,
            });
          } catch (error: any) {
            // Token is invalid (401 or other error), clear everything
            // Don't redirect here, let the API client handle it
            if (error?.message === 'Unauthorized' || error?.silent) {
              get().logout();
            } else {
              // For other errors, still clear auth to be safe
              get().logout();
            }
          }
        } else if (!token && state.isAuthenticated) {
          // No token but state says authenticated - clear state
          set({
            isAuthenticated: false,
            member: null,
            accessToken: null,
            refreshToken: null,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        // Use localStorage for persist, but we'll handle tokens separately
        return localStorage;
      }),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        member: state.member,
        rememberMe: state.rememberMe,
        // Don't persist tokens here, we handle them manually
      }),
    }
  )
);
