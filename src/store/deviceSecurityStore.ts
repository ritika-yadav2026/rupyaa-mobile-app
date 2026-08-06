import { create } from 'zustand';

import type { SecurityThreatId } from '@/src/types/deviceSecurity';

export interface DeviceSecurityState {
  isCompromised: boolean;
  lastThreat: SecurityThreatId | null;
  blockingThreats: SecurityThreatId[];
  markCompromised: (threat: SecurityThreatId) => void;
  addBlockingThreat: (threat: SecurityThreatId) => void;
  resetSecurityState: () => void;
}

export const useDeviceSecurityStore = create<DeviceSecurityState>((set) => ({
  isCompromised: false,
  lastThreat: null,
  blockingThreats: [],
  markCompromised: (threat) =>
    set((state) => ({
      isCompromised: true,
      lastThreat: threat,
      blockingThreats: state.blockingThreats.includes(threat)
        ? state.blockingThreats
        : [...state.blockingThreats, threat],
    })),
  addBlockingThreat: (threat) =>
    set((state) => {
      if (state.blockingThreats.includes(threat)) {
        return state;
      }
      return {
        blockingThreats: [...state.blockingThreats, threat],
        lastThreat: threat,
      };
    }),
  resetSecurityState: () =>
    set({
      isCompromised: false,
      lastThreat: null,
      blockingThreats: [],
    }),
}));

export const selectIsLoanJourneyBlocked = (state: DeviceSecurityState): boolean =>
  state.blockingThreats.length > 0;
