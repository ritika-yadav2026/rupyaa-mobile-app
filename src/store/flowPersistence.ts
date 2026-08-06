import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, type PersistOptions } from 'zustand/middleware';
import {
  FLOW_PHASES,
  getMainStepLabels,
  getPhaseByIndex,
  getSubstepCount,
} from '@/src/config/flowSteps';
import type { FlowPhase } from '@/src/config/flowSteps';
import { buildProgressStateFromPosition } from '@/src/utils/flowProgress';

const FLOW_STORAGE_KEY = '@fatafat/flow-state';

type PersistedCheckpoint = {
  phase: FlowPhase;
  substepId: string;
  timestamp: number;
};

type FlowStateForPersistence = {
  phaseIndex: number;
  substepIndex: number;
  applicationCompleted: boolean;
  currentStep: number;
  steps: readonly { id: string; label: string }[];
  passedSubsteps: Record<string, boolean>;
  passedPhases: Record<FlowPhase, boolean>;
  lastCheckpoint: PersistedCheckpoint | null;
};

export type PersistedFlowSnapshot = Pick<
  FlowStateForPersistence,
  'phaseIndex' | 'substepIndex' | 'applicationCompleted' | 'passedSubsteps' | 'passedPhases' | 'lastCheckpoint'
>;

type PersistedFlowState = Pick<
  FlowStateForPersistence,
  'phaseIndex' | 'substepIndex' | 'applicationCompleted' | 'currentStep' | 'steps' | 'passedSubsteps' | 'passedPhases' | 'lastCheckpoint'
>;

function getDefaultPersistedState(): PersistedFlowState {
  return {
    phaseIndex: 0,
    substepIndex: 0,
    applicationCompleted: false,
    currentStep: 0,
    steps: getMainStepLabels(),
    passedSubsteps: {} as Record<string, boolean>,
    passedPhases: {
      register: false,
      offer: false,
      kyc: false,
      disbursal: false,
    } as Record<FlowPhase, boolean>,
    lastCheckpoint: null,
  };
}

export function clampFlowPosition(phaseIndex: number, substepIndex: number): {
  phaseIndex: number;
  substepIndex: number;
  phase: FlowPhase;
  totalSubsteps: number;
} {
  const safePhaseIndex = Math.max(0, Math.min(phaseIndex, FLOW_PHASES.length - 1));
  const phase = getPhaseByIndex(safePhaseIndex);
  const totalSubsteps = getSubstepCount(phase);
  // Guard against out-of-range substep index to avoid skipping phases.
  const maxSubstepIndex = Math.max(totalSubsteps - 1, 0);
  const safeSubstepIndex = Math.max(0, Math.min(substepIndex, maxSubstepIndex));
  return { phaseIndex: safePhaseIndex, substepIndex: safeSubstepIndex, phase, totalSubsteps };
}

/** Migrate from old store format (registerSubStep, kycSubStep, etc.) to new (phaseIndex, substepIndex) */
export function migrateFromLegacy(state: unknown): PersistedFlowState {
  const legacy = state as {
    currentStep?: number;
    registerSubStep?: number;
    offerSubStep?: number;
    kycSubStep?: number;
    disbursalSubStep?: number;
    applicationCompleted?: boolean;
  };

  if (!legacy || typeof legacy.currentStep !== 'number') {
    return getDefaultPersistedState();
  }
  
  // Old flow: register(0), offer(1), kyc(2), disbursal(3)
  // New flow keeps same phase order; only offer substep structure changed over time.
  const phaseIndex = Math.max(0, Math.min(legacy.currentStep, FLOW_PHASES.length - 1));
  const phase = getPhaseByIndex(phaseIndex);
  let substepIndex = 0;
  
  if (phase === 'register') {
    // Legacy register flows had up to 6 substeps. Final clamp below adjusts to current total.
    substepIndex = Math.max(0, Math.min(legacy.registerSubStep ?? 0, 5));
  } else if (phase === 'offer') {
    // Legacy offer phase had: bank-connect(0), offer-loading(1), approved-offer(2)
    // Current offer phase has: bank-connect(0), approved-offer(1)
    const oldOfferSubstep = legacy.offerSubStep ?? 0;
    substepIndex = oldOfferSubstep <= 0 ? 0 : 1;
  } else if (phase === 'kyc') {
    substepIndex = Math.max(0, Math.min(legacy.kycSubStep ?? 0, 3));
  } else if (phase === 'disbursal') {
    substepIndex = Math.max(0, Math.min(legacy.disbursalSubStep ?? 0, 2));
  }
  
  const total = getSubstepCount(phase);
  return {
    phaseIndex,
    substepIndex: Math.min(substepIndex, total - 1),
    applicationCompleted: legacy.applicationCompleted ?? false,
    currentStep: phaseIndex,
    steps: getMainStepLabels(),
    passedSubsteps: {} as Record<string, boolean>,
    passedPhases: {
      register: false,
      offer: false,
      kyc: false,
      disbursal: false,
    } as Record<FlowPhase, boolean>,
    lastCheckpoint: null,
  };
}

function selectPersistedState<S extends FlowStateForPersistence>(state: S): PersistedFlowSnapshot {
  // Only persist the parts needed to restore flow position and completion state.
  // Everything else should derive from this on rehydrate.
  return {
    phaseIndex: state.phaseIndex,
    substepIndex: state.substepIndex,
    applicationCompleted: state.applicationCompleted,
    passedSubsteps: state.passedSubsteps,
    passedPhases: state.passedPhases,
    lastCheckpoint: state.lastCheckpoint,
  };
}

function mergePersistedState<S extends FlowStateForPersistence>(persisted: unknown, current: S): S {
  // When loading persisted data, clamp indices to valid ranges and rebuild
  // derived progress flags to avoid invalid states after config changes.
  const p = persisted as {
    phaseIndex?: number;
    substepIndex?: number;
    applicationCompleted?: boolean;
    lastCheckpoint?: PersistedCheckpoint | null;
  };
  const rawPhaseIndex = p?.phaseIndex ?? current.phaseIndex;
  const rawSubstepIndex = p?.substepIndex ?? current.substepIndex;
  const safe = clampFlowPosition(rawPhaseIndex, rawSubstepIndex);
  const progress = buildProgressStateFromPosition(safe.phaseIndex, safe.substepIndex);
  return {
    ...current,
    ...p,
    phaseIndex: progress.phaseIndex,
    substepIndex: progress.substepIndex,
    applicationCompleted: p?.applicationCompleted ?? current.applicationCompleted,
    passedSubsteps: progress.passedSubsteps,
    passedPhases: progress.passedPhases,
    currentStep: progress.phaseIndex,
    steps: getMainStepLabels(),
    lastCheckpoint: p?.lastCheckpoint ?? current.lastCheckpoint ?? null,
  };
}

export function createFlowPersistConfig<S extends FlowStateForPersistence>(): PersistOptions<
  S,
  PersistedFlowSnapshot
> {
  return {
    name: FLOW_STORAGE_KEY,
    storage: createJSONStorage<PersistedFlowSnapshot>(() => AsyncStorage),
    partialize: selectPersistedState,
    merge: mergePersistedState,
    migrate: migrateFromLegacy,
    version: 4,
  };
}
