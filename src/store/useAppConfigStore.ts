import { create } from 'zustand';
import type { ExternalAppConfigData, ProviderToggle } from '@/src/types/app-config';

export type AppConfigStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AppConfigState {
  /** Raw config payload from the backend */
  config: ExternalAppConfigData | null;
  status: AppConfigStatus;
  /** From GET /external/encryption-status (public API). null until fetched. */
  encryptionEnabled: boolean | null;

  setConfig: (data: ExternalAppConfigData) => void;
  setStatus: (status: AppConfigStatus) => void;
  setEncryptionEnabled: (value: boolean) => void;
  reset: () => void;

  /**
   * Returns the currently-enabled provider name for a given provider group
   * (e.g. "faceKycProvider" → "hyperverge").
   * Falls back to `undefined` when no provider is enabled or the group is missing.
   */
  getActiveProvider: (group: keyof ExternalAppConfigData) => string | undefined;

  /** Shorthand boolean flag reader (e.g. "googleAuth") */
  getFlag: (key: keyof ExternalAppConfigData) => boolean;
}

/**
 * Resolves the first enabled key inside a ProviderToggle map.
 */
const resolveActive = (toggle: ProviderToggle): string | undefined =>
  Object.keys(toggle).find((k) => toggle[k] === true);

export const useAppConfigStore = create<AppConfigState>((set, get) => ({
  config: null,
  status: 'idle',
  encryptionEnabled: null,

  setConfig: (data) => set({ config: data, status: 'ready' }),
  setStatus: (status) => set({ status }),
  setEncryptionEnabled: (value) => set({ encryptionEnabled: value }),
  reset: () => set({ config: null, status: 'idle', encryptionEnabled: null }),

  getActiveProvider: (group) => {
    const value = get().config?.[group];
    if (!value || typeof value !== 'object') return undefined;
    return resolveActive(value as ProviderToggle);
  },

  getFlag: (key) => {
    const value = get().config?.[key];
    return value === true;
  },
}));
