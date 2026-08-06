import { create } from 'zustand';
import { tokenStorage } from '@/src/services/auth/tokenStorage';
import { resetPushTokenDedupeState } from '@/src/utils/notifications/pushTokenDedupeState';
import { consoleLogDev } from '../utils/consoleLogDev';

export type AuthStatus = 'idle' | 'ready';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  hydrate: () => Promise<void>;
  setAccessToken: (token: string) => Promise<void>;
  setTokens: (accessToken: string, refreshToken?: string) => Promise<void>;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  status: 'idle',
  isAuthenticated: false,
  hydrate: async () => {
    //TODO: Remove this after testing
    const accessToken = await tokenStorage.getAccessToken();
    const refreshToken = await tokenStorage.getRefreshToken();
    // const token = "asdfasd";
    consoleLogDev("Token", accessToken);
    set({
      accessToken,
      refreshToken,
      status: 'ready',
      isAuthenticated: !!accessToken,
    });
  },

  setAccessToken: async (token) => {
    await tokenStorage.setAccessToken(token);
    set({ accessToken: token, isAuthenticated: true });
  },

  setTokens: async (accessToken, refreshToken) => {
    await tokenStorage.setAccessToken(accessToken);
    if (refreshToken) {
      await tokenStorage.setRefreshToken(refreshToken);
    }
    set({
      accessToken,
      refreshToken: refreshToken ?? null,
      isAuthenticated: true,
    });
  },

  clearSession: async () => {
    await tokenStorage.clearAll();
    resetPushTokenDedupeState();
    set({ accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));

export const selectIsAuthenticated = (state: AuthState) =>
  state.status === 'ready' && state.isAuthenticated;
