import { devConfig } from '@/src/config/dev';
import { devLog } from '@/src/utils';
import { retryWithBackoff } from '@/src/utils/retryWithBackoff';
import { userService } from './userService';
import { useFlowStore } from '@/src/store/useFlowStore';
import { useCurrentOfferStore } from '@/src/store/useCurrentOfferStore';
import { offerService } from '@/src/services/offer';
import type { UserStage } from '@/src/config/userStages';
import type { GetUserStageResult } from '@/src/types/user';
import type { ApiResponse } from '@/src/types/api';
import { isCurrentOfferSuccess } from '@/src/types/offer';
import {
  logJourneyApplyLoanFinished,
  logJourneyApplyLoanStarted,
  logJourneyStageSynced,
  logJourneyStopped,
  pushLoanJourneyApiError,
  pushLoanJourneyUnknownError,
} from '@/src/services/logging/logPoolJourney';

const SYNC_MAX_RETRIES = 3;
const SYNC_BASE_DELAY_MS = 1000;
const CURRENT_OFFER_FETCH_DEDUP_WINDOW_MS = 1500;
/** While backend reports retryStage=true it is still resolving the stage — keep polling. */
const RETRY_STAGE_POLL_INTERVAL_MS = 1000;
const RETRY_STAGE_POLL_MAX_MS = 30000;

/**
 * Calls GET user-stage repeatedly while the backend reports `retryStage: true`
 * (stage not resolved yet), up to RETRY_STAGE_POLL_MAX_MS, then returns the last response.
 */
export async function getUserStageUntilResolved(): Promise<ApiResponse<GetUserStageResult>> {
  const deadline = Date.now() + RETRY_STAGE_POLL_MAX_MS;
  while (true) {
    const response = await userService.getUserStage();
    if (!response.success || response.data?.retryStage !== true || Date.now() >= deadline) {
      return response;
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_STAGE_POLL_INTERVAL_MS));
  }
}

let currentOfferFetchInFlight: Promise<void> | null = null;
let lastCurrentOfferFetchedAt = 0;
let userStageFetchInFlight: Promise<GetUserStageResult | undefined> | null = null;


export function applyUserStageResultToStore(data: GetUserStageResult | undefined): void {
  const setShowDashboard = useFlowStore.getState().setShowDashboard;

  setShowDashboard(data?.showDashboard === true);
}


/**
 * Call GET /offer/current-offer, store result, and set journeyStoppedReason when no offer/404.
 * Use whenever user stage is BANK_STATEMENT (e.g. from fetchUserStage or when on bank-connect step).
 */
export const fetchCurrentOfferForBankStatement = async (
  options: { force?: boolean } = {}
): Promise<void> => {
  const { force = false } = options;
  const now = Date.now();
  const hasCachedOfferResponse = useCurrentOfferStore.getState().lastResponse != null;
  // Always share an active request. `force` bypasses only the completed-response
  // dedupe window; overlapping requests could resolve out of order and restore a stale flag.
  if (currentOfferFetchInFlight) {
    return currentOfferFetchInFlight;
  }
  if (
    !force &&
    hasCachedOfferResponse &&
    now - lastCurrentOfferFetchedAt < CURRENT_OFFER_FETCH_DEDUP_WINDOW_MS
  ) {
    return;
  }

  const run = async () => {
    const offerResponse = await offerService.getCurrentOffer();
    useCurrentOfferStore.getState().setLastResponse(offerResponse);

    const hasOffer =
      offerResponse.success &&
      offerResponse.data != null &&
      isCurrentOfferSuccess(offerResponse.data);

    if (!hasOffer) {
      const message =
        offerResponse.success &&
        offerResponse.data != null &&
        typeof (offerResponse.data as { message?: string }).message === 'string'
          ? (offerResponse.data as { message: string }).message
          : 'No offer available at the moment.';
      useFlowStore.getState().setJourneyStoppedReason(message);
      if (!offerResponse.success) {
        pushLoanJourneyApiError(
          'bank statement current offer',
          offerResponse.error,
          offerResponse.status
        );
      }
      logJourneyStopped(message);
    } else {
      useFlowStore.getState().setJourneyStoppedReason(null);
    }

    lastCurrentOfferFetchedAt = Date.now();

    if (devConfig.enableDebugLogs) {
      console.log(
        '[fetchCurrentOfferForBankStatement] Fetched current offer:',
        hasOffer ? 'success' : 'no-offer-or-error'
      );
    }
  };

  currentOfferFetchInFlight = run().finally(() => {
    currentOfferFetchInFlight = null;
  });

  return currentOfferFetchInFlight;
};

export interface ApplyLoanAndFetchOfferResult {
  hasOffer: boolean;
  /** When apply-loan returns retry (e.g. retryMethod) with a message, use this for user-facing text. */
  retryMessage?: string;
  retryMethod?: string;
}

function getApplyLoanRetryMethod(
  response: Awaited<ReturnType<typeof userService.applyLoan>>
): string | undefined {
  const payload = response.success ? response.data : response.error?.details;
  if (!payload || typeof payload !== 'object') return undefined;

  const retryMethod = (payload as { retryMethod?: unknown }).retryMethod;
  return typeof retryMethod === 'string' && retryMethod.trim().length > 0
    ? retryMethod.trim().toUpperCase()
    : undefined;
}

/**
 * Extracts user-facing message from apply-loan response (success or error).
 * When backend returns 4xx, body is in error.details; when 2xx with retry, body is in data.
 */
function getApplyLoanRetryMessage(response: Awaited<ReturnType<typeof userService.applyLoan>>): string | undefined {
  if (response.success && response.data) {
    const msg = response.data.message;
    if (typeof msg === 'string' && msg.trim().length > 0) return msg.trim();
  }
  if (!response.success && response.error?.details && typeof response.error.details === 'object') {
    const details = response.error.details as { message?: unknown };
    const msg = details.message;
    if (typeof msg === 'string' && msg.trim().length > 0) return msg.trim();
  }
  if (!response.success && response.error?.message) {
    const msg = response.error.message;
    if (typeof msg === 'string' && msg.trim().length > 0) return msg.trim();
  }
  return undefined;
}

/** True when apply-loan indicates retry (no offer created) — do not call current-offer. */
function isApplyLoanRetryOrError(response: Awaited<ReturnType<typeof userService.applyLoan>>): boolean {
  if (!response.success) return true;
  const data = response.data as { retryMethod?: string } | undefined;
  return data?.retryMethod != null && String(data.retryMethod).trim().length > 0;
}

/**
 * Call POST /loans/apply-loan; fetch current offer only when apply-loan succeeded (no retry/error).
 * When apply-loan returns retry or error with a message, that message is returned for UI and current-offer is skipped.
 */
export async function applyLoanAndFetchOffer(): Promise<ApplyLoanAndFetchOfferResult> {
  logJourneyApplyLoanStarted();
  try {
    const response = await userService.applyLoan();
    const apiMessage = getApplyLoanRetryMessage(response);
    const retryMethod = getApplyLoanRetryMethod(response);

    if (isApplyLoanRetryOrError(response)) {
      const retryError = response.success
        ? { message: apiMessage ?? 'Apply loan retry', code: 'APPLY_LOAN_RETRY' }
        : response.error;
      pushLoanJourneyApiError('apply loan', retryError, response.status);
      return { hasOffer: false, retryMessage: apiMessage, retryMethod };
    }

    await fetchCurrentOfferForBankStatement({ force: true });
    const offerResponse = useCurrentOfferStore.getState().lastResponse;
    const hasOffer =
      offerResponse?.success === true &&
      offerResponse.data != null &&
      isCurrentOfferSuccess(offerResponse.data);

    if (!hasOffer && offerResponse && !offerResponse.success) {
      pushLoanJourneyApiError('current offer after apply loan', offerResponse.error, offerResponse.status);
    }

    logJourneyApplyLoanFinished(hasOffer);
    return {
      hasOffer,
      retryMessage: hasOffer ? undefined : apiMessage,
    };
  } catch (error) {
    pushLoanJourneyUnknownError('apply loan', error);
    throw error;
  }
}

/**
 * Fetch user stage from backend API and sync with flow store.
 * Uses retry with exponential backoff on network failure.
 * When stage is OFFERINGS, also calls GET /offer/current-offer.
 * Skips both requests while an existing offer is being improved in Bank Connect.
 * Returns undefined on error to allow graceful degradation.
 */
const runFetchUserStage = async (): Promise<GetUserStageResult | undefined> => {

  useFlowStore.getState().setStageSyncStatus('loading');
  try {
    const response = await retryWithBackoff(
      () => getUserStageUntilResolved(),
      {
        maxRetries: SYNC_MAX_RETRIES,
        baseDelayMs: SYNC_BASE_DELAY_MS,
        onRetry: (attempt, maxRetries, delayMs) => devLog.syncRetry(attempt, maxRetries, delayMs),
      }
    );
    useFlowStore.getState().setStageSyncStatus('idle');
    if (!response.success) {
      pushLoanJourneyApiError('get user stage', response.error, response.status);
      if (devConfig.enableDebugLogs) {
        console.warn('[fetchUserStage] API call failed:', response.error?.message);
      }
      return undefined;
    }

    // Sync flow store with backend stage (skip when dev toolbar "Next step" was used so we don't revert)
    if (response.data?.stage) {
      const stage = response.data.stage as UserStage;
      const skipSync = typeof __DEV__ !== 'undefined' && __DEV__ && useFlowStore.getState().skipNextUserStageSync;
      if (skipSync) {
        useFlowStore.getState().setSkipNextUserStageSync(false);
        if (devConfig.enableDebugLogs) {
          console.log('[fetchUserStage] Skipped sync (dev toolbar advance)');
        }
      } else {
        useFlowStore.getState().syncFromUserStage(
          stage,
          response.data?.sectionsCompleted,
          response.data?.context
        );
        logJourneyStageSynced(stage);
        if (devConfig.enableDebugLogs) {
          console.log(`[fetchUserStage] Synced flow store with backend stage: ${stage}`);
        }

      }
    }
    applyUserStageResultToStore(response.data);

    return response.data;
  } catch (error) {
    useFlowStore.getState().setStageSyncStatus('error');
    pushLoanJourneyUnknownError('get user stage', error);
    devLog.syncError(SYNC_MAX_RETRIES + 1, error);
    if (devConfig.enableDebugLogs) {
      console.error('[fetchUserStage] Error fetching user stage:', error);
    }
    return undefined;
  }
};

export const fetchUserStage = (): Promise<GetUserStageResult | undefined> => {
  if (userStageFetchInFlight) {
    return userStageFetchInFlight;
  }

  userStageFetchInFlight = runFetchUserStage().finally(() => {
    userStageFetchInFlight = null;
  });

  return userStageFetchInFlight;
};
