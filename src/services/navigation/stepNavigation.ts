import { devConfig } from '@/src/config/dev';
import {
  findFlowPositionBySubstepId,
  getSubstepIndexById,
  type FlowPhase,
} from '@/src/config/flowSteps';
import { logJourneyNavigated } from '@/src/services/logging/logPoolJourney';
import { consoleLogDev } from '@/src/utils/common-helper';

type GoToFn = (phase: FlowPhase, substepIndex: number) => void;

type NavigateToPhaseSubstepParams = {
  goTo: GoToFn;
  phase: FlowPhase;
  substepId: string;
  source: string;
};

type NavigateToSubstepIdParams = {
  goTo: GoToFn;
  substepId: string;
  source: string;
};

function logStepNavigation(
  source: string,
  phase: FlowPhase,
  substepId: string,
  substepIndex: number
) {
  if (!devConfig.enableDebugLogs) return;
  consoleLogDev(
    `[stepNavigate] ${source} -> ${phase}:${substepId} (substepIndex=${substepIndex})`
  );
}

/**
 * Single source of truth for phase + substep-id based navigation.
 * Use this instead of hardcoded numeric indices to keep flow navigation debuggable.
 */
export function navigateToPhaseSubstep({
  goTo,
  phase,
  substepId,
  source,
}: NavigateToPhaseSubstepParams): boolean {
  const substepIndex = getSubstepIndexById(phase, substepId);
  if (substepIndex < 0) {
    if (devConfig.enableDebugLogs) {
      consoleLogDev(
        `[stepNavigate] ${source} failed: "${substepId}" not found in phase "${phase}"`
      );
    }
    return false;
  }

  logStepNavigation(source, phase, substepId, substepIndex);
  logJourneyNavigated(phase, substepId, source);
  goTo(phase, substepIndex);
  return true;
}

/**
 * Single source of truth for substep-id only navigation across all phases.
 * Useful when entry points pass a substep id and phase is unknown.
 */
export function navigateToSubstepId({
  goTo,
  substepId,
  source,
}: NavigateToSubstepIdParams): boolean {
  const match = findFlowPositionBySubstepId(substepId);
  if (!match) {
    if (devConfig.enableDebugLogs) {
      console.warn(`[stepNavigate] ${source} failed: substep "${substepId}" not found`);
    }
    return false;
  }

  logStepNavigation(source, match.phase, substepId, match.substepIndex);
  logJourneyNavigated(match.phase, substepId, source);
  goTo(match.phase, match.substepIndex);
  return true;
}

/**
 * Whether to skip calling fetchUserStage after this step.
 * Skip when:
 * - employment-type: does not change backend stage
 * - employment-details: fetches and applies user stage before navigating to soft-pull
 * - bank-connect: stage sync handled internally
 * - enach: stage sync already performed by handleRegistrationStepSuccess before onNext;
 *   a redundant fetchUserStage can race and bounce the user back from EsignStep
 *   (triggering generateAgreementAutomatic while user is still on EnachStep)
 */
export function shouldSkipUserStageSync(phase: FlowPhase, substepId: string | undefined): boolean {
  if (!substepId) return false;

  return (
    (phase === 'register' && substepId === 'employment-type') ||
    (phase === 'register' && substepId === 'employment-details') ||
    (phase === 'offer' && substepId === 'bank-connect') ||
    (phase === 'disbursal' && substepId === 'enach')
  );
}
