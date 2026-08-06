import { create } from 'zustand';

/**
 * Dev-only: simulated UI state for the current step.
 * Used to force a step into loading/success/error for quick UI verification.
 * Not persisted; in-memory only.
 */
export type SimulatedStepState = 'loading' | 'success' | 'error' | null;

export interface DevSimulationState {
  simulatedState: SimulatedStepState;
  setSimulatedState: (state: SimulatedStepState) => void;
  clearSimulation: () => void;
}

export const useDevSimulationStore = create<DevSimulationState>((set) => ({
  simulatedState: null,
  setSimulatedState: (state) => set({ simulatedState: state }),
  clearSimulation: () => set({ simulatedState: null }),
}));
