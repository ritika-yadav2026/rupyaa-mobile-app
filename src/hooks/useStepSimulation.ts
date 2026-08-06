import type { SimulatedStepState } from '@/src/store/useDevSimulationStore';
import { useDevSimulationStore } from '@/src/store/useDevSimulationStore';

export interface UseStepSimulationResult {
  isSimulating: boolean;
  simulatedState: SimulatedStepState;
}

const NO_SIMULATION: UseStepSimulationResult = {
  isSimulating: false,
  simulatedState: null,
};

/**
 * Returns the current dev simulation state for the step.
 * In production builds, always returns { isSimulating: false, simulatedState: null }.
 * Steps that opt in call this at the top and early-return with loading/success/error UI when isSimulating is true.
 */
export function useStepSimulation(): UseStepSimulationResult {
  const simulatedState = useDevSimulationStore((s) => s.simulatedState);
  if (!__DEV__) {
    return NO_SIMULATION;
  }
  return {
    isSimulating: simulatedState !== null,
    simulatedState: simulatedState ?? null,
  };
}
