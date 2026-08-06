import type { FlowPhase } from '@/src/config/flowSteps';
import { FLOW_CONFIG, FLOW_PHASES } from '@/src/config/flowSteps';
import type { ApiError } from '@/src/types/api';
import { useFlowStore } from '@/src/store/useFlowStore';
import {
  formatLogPoolApiError,
  formatLogPoolUnknownError,
  logPoolMessages,
} from './logPoolMessages';
import { logPool } from './logPoolService';
import { resolveLogPoolPhoneNumber } from './logPoolPhone';

/** Current loan journey substep id from flow store (for step submit logs). */
export function getCurrentJourneySubstepId(): string {
  const { phaseIndex, substepIndex } = useFlowStore.getState();
  const safePhaseIndex = Math.max(0, Math.min(phaseIndex, FLOW_PHASES.length - 1));
  const phase = FLOW_PHASES[safePhaseIndex];
  const substeps = FLOW_CONFIG[phase].substeps;
  const safeSubstepIndex = Math.max(0, Math.min(substepIndex, Math.max(substeps.length - 1, 0)));
  return substeps[safeSubstepIndex]?.id ?? 'unknown';
}

/** Fire-and-forget: resolve phone and push a journey log line. */
export function pushLoanJourneyLog(buildLine: (phoneNumber: string) => string): void {
  void (async () => {
    const phoneNumber = await resolveLogPoolPhoneNumber();
    if (!phoneNumber) {
      return;
    }
    logPool.push(buildLine(phoneNumber));
  })();
}

export function pushLoanJourneyApiError(
  context: string,
  error?: ApiError['error'],
  status?: number
): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.journeyError(
      phoneNumber,
      context,
      formatLogPoolApiError(error, status)
    )
  );
}

export function pushLoanJourneyUnknownError(context: string, error: unknown): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.journeyError(
      phoneNumber,
      context,
      formatLogPoolUnknownError(error)
    )
  );
}

/** Non-journey errors (startup, global handler, fire-and-forget). Fire-and-forget phone resolve. */
export function pushAppError(context: string, error: unknown): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.appError(
      phoneNumber,
      context,
      formatLogPoolUnknownError(error)
    )
  );
}

/** Log Play Install Referrer events (captured fresh, served from cache, or failed). */
export function pushInstallReferrerCaptured(referrer: string, installVersion: string): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.installReferrerCaptured(phoneNumber, referrer, installVersion)
  );
}

export function pushInstallReferrerFromCache(referrer: string, installVersion: string): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.installReferrerFromCache(phoneNumber, referrer, installVersion)
  );
}

export function pushInstallReferrerError(error: unknown): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.installReferrerError(phoneNumber, formatLogPoolUnknownError(error))
  );
}

/** Log Adjust SDK attribution resolution (network/campaign/tracker captured, or failed). */
export function pushAdjustAttributionCaptured(fields: {
  network: string;
  campaign: string;
  adgroup: string;
  creative: string;
  trackerToken: string;
}): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.adjustAttributionCaptured(phoneNumber, fields)
  );
}

export function pushAdjustAttributionError(error: unknown): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.adjustAttributionError(phoneNumber, formatLogPoolUnknownError(error))
  );
}

/** Log 401-driven session clear with the API method/path that triggered it. */
export function pushSessionCleared(method: string, path: string): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.sessionCleared(phoneNumber, method, path)
  );
}

export function logJourneyEntered(): void {
  pushLoanJourneyLog((phoneNumber) => logPoolMessages.journeyEntered(phoneNumber));
}

export function logJourneyNavigated(
  phase: FlowPhase,
  substepId: string,
  source: string
): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.journeyNavigated(phoneNumber, phase, substepId, source)
  );
}

export function logJourneySubstepEntered(phase: FlowPhase, substepId: string): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.journeySubstepEntered(phoneNumber, phase, substepId)
  );
}

export function logJourneyStageSynced(stage: string): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.journeyStageSynced(phoneNumber, stage)
  );
}

export function logJourneyStageRedirect(
  expectedStage: string,
  backendStage: string
): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.journeyStageRedirect(phoneNumber, expectedStage, backendStage)
  );
}

export function logJourneyStepSubmitted(stepId: string): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.journeyStepSubmitted(phoneNumber, stepId)
  );
}

export function logJourneyStepSubmitApiError(
  stepId: string,
  error?: ApiError['error'],
  status?: number
): void {
  pushLoanJourneyApiError(`step submit (${stepId})`, error, status);
}

export function logJourneyStepSubmitUnknownError(stepId: string, error: unknown): void {
  pushLoanJourneyUnknownError(`step submit (${stepId})`, error);
}

export function logJourneyIneligibilityShown(): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.journeyIneligibilityShown(phoneNumber)
  );
}

export function logJourneyOfferModalOpened(variant: string): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.journeyOfferModalOpened(phoneNumber, variant)
  );
}

export function logJourneyOfferCheckOffers(): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.journeyOfferCheckOffers(phoneNumber)
  );
}

export function logJourneyStopped(reason: string): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.journeyStopped(phoneNumber, reason)
  );
}

export function logJourneyApplyLoanStarted(): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.journeyApplyLoanStarted(phoneNumber)
  );
}

export function logJourneyApplyLoanFinished(hasOffer: boolean): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.journeyApplyLoanFinished(phoneNumber, hasOffer)
  );
}

export function logJourneyBankStatementProcessed(hasOffer: boolean): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.journeyBankStatementProcessed(phoneNumber, hasOffer)
  );
}

export function logHyperKycResult(status: string, code?: string): void {
  pushLoanJourneyLog((phoneNumber) =>
    logPoolMessages.hyperKycResultReceived(phoneNumber, status, code)
  );
}
