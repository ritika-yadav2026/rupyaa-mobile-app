import {
  FLOW_CONFIG,
  FLOW_PHASES,
  getPhaseByIndex,
  getSubstepCount,
  getSubstepIndexById,
} from '@/src/config/flowSteps';
import type { FlowPhase, FlowSubstepId } from '@/src/config/flowSteps';
import type { UserStage } from '@/src/config/userStages';
import { SPECIAL_USER_STAGES, USER_STAGE_GROUPS, UserStagesInBackend } from '@/src/config/userStages';
import type { UserStageSectionsCompleted } from '@/src/types/user';

export interface FlowPosition {
  phaseIndex: number;
  substepIndex: number;
}

export interface FlowProgressState extends FlowPosition {
  passedSubsteps: Record<string, boolean>;
  passedPhases: Record<FlowPhase, boolean>;
}

export interface FlowJourneySummary {
  phase: FlowPhase;
  phaseLabel: string;
  phaseIndex: number;
  substepIndex: number;
  substepId: FlowSubstepId;
  substepLabel: string;
  totalPhases: number;
  totalSubsteps: number;
}

function clampIndex(value: number, maxIndex: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.floor(value), maxIndex));
}

function mapStageIndexToSubstepIndex(
  stageIndex: number,
  stageCount: number,
  substepCount: number
): number {
  if (substepCount <= 1 || stageCount <= 1) return 0;
  const ratio = stageIndex / (stageCount - 1);
  return clampIndex(Math.round(ratio * (substepCount - 1)), substepCount - 1);
}

function getSectionFlag(
  sections: UserStageSectionsCompleted | undefined,
  primaryKey: keyof UserStageSectionsCompleted,
  fallbackKey: keyof UserStageSectionsCompleted
): boolean | undefined {
  if (!sections) return undefined;
  const primaryValue = sections[primaryKey];
  if (typeof primaryValue === 'boolean') return primaryValue;
  const fallbackValue = sections[fallbackKey];
  return typeof fallbackValue === 'boolean' ? fallbackValue : undefined;
}

function resolveFamilyReferenceSubstepIndex(
  sections: UserStageSectionsCompleted | undefined
): number | undefined {
  const familyComplete = getSectionFlag(
    sections,
    'isFamilyComplete',
    'isFamilyReferenceComplete'
  );
  const referenceComplete = getSectionFlag(
    sections,
    'isReferenceComplete',
    'isFamilyReferenceComplete'
  );

  if (familyComplete === false) return 2;
  if (familyComplete === true && referenceComplete === false) return 3;
  return undefined;
}

export function resolveFlowPositionFromUserStage(
  stage: UserStage,
  sectionsCompleted?: UserStageSectionsCompleted
): FlowPosition {
  // console.log('resolveFlowPositionFromUserStage', stage);
  
  // MODE_OF_EMPLOYMENT covers both employment-type (substep 1) and employment-details (substep 2).
  // Always land on employment-type as the entry point for this stage.
  if (stage === UserStagesInBackend.MODE_OF_EMPLOYMENT) {
    return { phaseIndex: 0, substepIndex: 1 };
  }

  // SOFT_PULL maps to the soft-pull substep (substep 3) in register phase.
  // The SoftPullStep will automatically run eligibility check + offer retrieval,
  // then conditionally navigate to either ApprovedOfferStep (offer exists) or BankConnectStep (no offer).
  // See: src/services/registration/softPullFlow.ts for flow logic
  if (stage === UserStagesInBackend.SOFT_PULL) {
    return { phaseIndex: 0, substepIndex: 3 };
  }

  // BANK_STATEMENT maps to bank-connect step in the offer phase (not register phase).
  // Even though it's grouped under register in USER_STAGE_GROUPS, the UI step is in offer phase.
  if (stage === UserStagesInBackend.BANK_STATEMENT) {
    return { phaseIndex: 1, substepIndex: 0 };
  }

  if (stage === UserStagesInBackend.FAMILY_REFERENCE) {
    const familyReferenceSubstep = resolveFamilyReferenceSubstepIndex(sectionsCompleted);
    if (familyReferenceSubstep != null) {
      return { phaseIndex: FLOW_PHASES.indexOf('kyc'), substepIndex: familyReferenceSubstep };
    }
  }

  // BANK_DETAILS always maps to bank-details in KYC phase.
  if (stage === UserStagesInBackend.BANK_DETAILS) {
    return { phaseIndex: 2, substepIndex: 4 };
  }

  // OFFERINGS: user already has an offer — land directly on ApprovedOfferStep to show offer data.
  if (stage === UserStagesInBackend.OFFERINGS) {
    const approvedOfferIndex = getSubstepIndexById('offer', 'approved-offer');
    return { phaseIndex: 1, substepIndex: approvedOfferIndex >= 0 ? approvedOfferIndex : 0 };
  }

  // Disbursal: map backend stages to substeps so Backend ENACH → EnachStep (0), ESIGN → EsignStep (1).
  const disbursalPhaseIndex = FLOW_PHASES.indexOf('disbursal');
  if (stage === UserStagesInBackend.APPLICATION_STATUS) {
    return { phaseIndex: disbursalPhaseIndex, substepIndex: 0 };
  }
  if (stage === UserStagesInBackend.ENACH) {
    // TODO: Moving to EsignStep only for implementation purpose, will be removed later
    return { phaseIndex: disbursalPhaseIndex, substepIndex: 0 };
  }
  if (stage === UserStagesInBackend.ESIGN) {
    return { phaseIndex: disbursalPhaseIndex, substepIndex: 1 };
  }
  if (stage === UserStagesInBackend.WAITING_FOR_DISBURSEMENT) {
    return { phaseIndex: disbursalPhaseIndex, substepIndex: 2 };
  }

  const isSpecial = SPECIAL_USER_STAGES.includes(stage);
  const phase = isSpecial ? 'register' : (FLOW_PHASES.find((p) => USER_STAGE_GROUPS[p].includes(stage)) ?? 'register');
  const stageGroup = USER_STAGE_GROUPS[phase];
  const stageIndex = Math.max(0, stageGroup.indexOf(stage));
  const substepCount = getSubstepCount(phase);
  const substepIndex = mapStageIndexToSubstepIndex(stageIndex, stageGroup.length, substepCount);

  return {
    phaseIndex: FLOW_PHASES.indexOf(phase),
    substepIndex,
  };
}

export function buildProgressStateFromPosition(phaseIndex: number, substepIndex: number): FlowProgressState {
  const safePhaseIndex = clampIndex(phaseIndex, FLOW_PHASES.length - 1);
  const safePhase = FLOW_PHASES[safePhaseIndex];
  const totalSubsteps = getSubstepCount(safePhase);
  const safeSubstepIndex = clampIndex(substepIndex, Math.max(totalSubsteps - 1, 0));

  const passedPhases = FLOW_PHASES.reduce((acc, phase) => {
    acc[phase] = false;
    return acc;
  }, {} as Record<FlowPhase, boolean>);
  const passedSubsteps: Record<string, boolean> = {};

  FLOW_PHASES.forEach((phase, index) => {
    const phaseSubsteps = FLOW_CONFIG[phase].substeps;
    if (index < safePhaseIndex) {
      passedPhases[phase] = true;
      phaseSubsteps.forEach((_, subIndex) => {
        passedSubsteps[`${phase}:${subIndex}`] = true;
      });
      return;
    }

    if (index === safePhaseIndex) {
      phaseSubsteps.forEach((_, subIndex) => {
        if (subIndex < safeSubstepIndex) {
          passedSubsteps[`${phase}:${subIndex}`] = true;
        }
      });
    }
  });

  return {
    phaseIndex: safePhaseIndex,
    substepIndex: safeSubstepIndex,
    passedSubsteps,
    passedPhases,
  };
}

export function getFlowJourneySummary(
  phaseIndex: number,
  substepIndex: number
): FlowJourneySummary {
  const safePhaseIndex = clampIndex(phaseIndex, FLOW_PHASES.length - 1);
  const phase = getPhaseByIndex(safePhaseIndex);
  const phaseConfig = FLOW_CONFIG[phase];
  const totalSubsteps = getSubstepCount(phase);
  const safeSubstepIndex = clampIndex(substepIndex, Math.max(totalSubsteps - 1, 0));
  const substep = phaseConfig.substeps[safeSubstepIndex] ?? phaseConfig.substeps[0];

  return {
    phase,
    phaseLabel: phaseConfig.label,
    phaseIndex: safePhaseIndex,
    substepIndex: safeSubstepIndex,
    substepId: substep.id,
    substepLabel: substep.label,
    totalPhases: FLOW_PHASES.length,
    totalSubsteps,
  };
}
