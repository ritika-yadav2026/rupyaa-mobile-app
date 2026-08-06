import { userService } from '@/src/services/user/userService';
import { fetchCurrentOfferForBankStatement } from '@/src/services/user/useUserStage';
import { useCurrentOfferStore } from '@/src/store/useCurrentOfferStore';
import { useFlowStore } from '@/src/store/useFlowStore';
import { isCurrentOfferSuccess, getOfferLoanStatus, CurrentOfferOffer, getOfferLoanSubStatus } from '@/src/types/offer';
import { devConfig } from '@/src/config/dev';
import { logBureauPolicyResponseApp } from '@/src/services/analytics';
import type { ApiResponse } from '@/src/types/api';
import type { UserEligibilityExperianResponse } from '@/src/types/user';
import { consoleLogDev } from '@/src/utils/common-helper';
import {
  logPool,
  logPoolMessages,
  formatLogPoolApiError,
  formatLogPoolUnknownError,
  resolveLogPoolPhoneNumber,
} from '@/src/services/logging';
import {
  logJourneyOfferModalOpened,
  logJourneyStopped,
  pushLoanJourneyLog,
} from '@/src/services/logging/logPoolJourney';
import { BuildBureauPolicyAnalyticsPayloadParams, BureauPolicyAnalyticsPayload, EligibilityErrorResolver, SoftPullFlowError, SoftPullFlowResult } from '@/src/types/loans';
import {
  getEligibilityErrorDetails,
  getPayloadForBureauPolicyResponse,
  resolveNoOfferMessage,
  resolveOfferStatusModalVariant,
} from '@/src/utils/loan-helpers';

const DEFAULT_REJECTED_ERROR_MESSAGE = 'Unfortunately, you are not eligible at this time.';
const DEFAULT_RETRYABLE_ERROR_MESSAGE = 'Unable to verify eligibility. Please try again.'
const toNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const buildBureauPolicyAnalyticsPayload = ({
  eligibilityData,
  offerPayload,
  isReloan,
}: BuildBureauPolicyAnalyticsPayloadParams): BureauPolicyAnalyticsPayload => ({
  status: eligibilityData?.status,
  decile: eligibilityData?.decile,
  declaredSalary: eligibilityData?.salary,
  empType: eligibilityData?.empType,
  offerAmount: typeof offerPayload?.offerAmount === 'number' ? offerPayload.offerAmount : undefined,
  applicationType: isReloan ?'reloan':'fresh',
});

const getEligibilityDataMessage = (
  response: ApiResponse<UserEligibilityExperianResponse>
): string | undefined => {
  if (!response.success) return undefined;
  return toNonEmptyString(response.data?.message);
};

const getEligibilityErrorMessage = (
  response: ApiResponse<UserEligibilityExperianResponse>
): string | undefined => {
  if (response.success) return undefined;
  const details = response.error?.details;
  const detailsMessage =
    details && typeof details === 'object'
      ? toNonEmptyString((details as { message?: unknown }).message)
      : undefined;
  return detailsMessage ?? toNonEmptyString(response.error?.message);
};

/**
 * Check if eligibility response indicates rejection.
 * Rejection means user is not eligible and we should NOT retry.
 */
function isEligibilityRejected(response: ApiResponse<UserEligibilityExperianResponse>): boolean {
  if (!response.success) {
    // API call failed - this is NOT a rejection, it's a network/server error
    return false;
  }

  const data = response.data;
  if (!data) return false;

  // Check explicit rejection indicators
  if (data.isEligible === false) {
    return true;
  }

  if (toNonEmptyString(data.status)?.toLowerCase() === 'rejected') {
    return true;
  }

  if (data.success === false) {
    return true;
  }

  return false;
}

/**
 * Check if eligibility response indicates approval/success.
 * Success means user is eligible to proceed to offer check.
 */
function isEligibilityApproved(response: ApiResponse<UserEligibilityExperianResponse>): boolean {
  if (!response.success) {
    return false;
  }

  const data = response.data;
  if (!data) return false;

  // Check explicit approval indicators
  // If status exists and is not rejected, and success is true, consider it approved
  if (data.success === true) {
    return true;
  }

  // If status is 'approved' or 'success' or similar
  const status = toNonEmptyString(data.status)?.toLowerCase();
  if (status) {
    if (status === 'approved' || status === 'success' || status === 'eligible') {
      return true;
    }
  }

  return false;
}


const ELIGIBILITY_ERROR_RESOLVERS: readonly EligibilityErrorResolver[] = [
  {
    type: 'ELIGIBILITY_REJECTED',
    canRetry: false,
    matches: isEligibilityRejected,
    resolveMessage: getEligibilityDataMessage,
    fallbackMessage: DEFAULT_REJECTED_ERROR_MESSAGE,
  },
  {
    type: 'ELIGIBILITY_CHECK_FAILED',
    canRetry: true,
    matches: (response) => !isEligibilityApproved(response),
    resolveMessage: (response) =>
      getEligibilityDataMessage(response) ?? getEligibilityErrorMessage(response),
    fallbackMessage: DEFAULT_RETRYABLE_ERROR_MESSAGE,
  },
];

const resolveEligibilityFailure = (
  response: ApiResponse<UserEligibilityExperianResponse>
): SoftPullFlowError | null => {
  for (const resolver of ELIGIBILITY_ERROR_RESOLVERS) {
    if (!resolver.matches(response)) continue;
    return {
      type: resolver.type,
      canRetry: resolver.canRetry,
      message: resolver.resolveMessage(response) ?? resolver.fallbackMessage,
    };
  }
  return null;
};

const createUnexpectedSoftPullError = (): SoftPullFlowError => ({
  type: 'UNEXPECTED',
  message: DEFAULT_RETRYABLE_ERROR_MESSAGE,
  canRetry: true,
});

/**
 * SOFT_PULL flow: eligibility check and offer retrieval. get-user-stage is not called here;
 * it is called once when user taps "Check Offers" in OfferStatusModal (see LoanWizard).
 *
 * Flow logic:
 * 1. Call GET /user/get-user-eligibility-experian
 * 2. If rejected: return error and stop
 * 3. If approved: call GET /offer/current-offer only (no get-user-stage)
 * 4. If offer exists: show OfferStatusModal, return nextAction = 'offer'
 * 5. If no offer: return nextAction = 'bank-statement'
 *
 * @returns Result indicating success/failure and next navigation action
 */
export async function executeSoftPullFlow(): Promise<SoftPullFlowResult> {
  try {
    const phoneNumber = await resolveLogPoolPhoneNumber();

    const pushSoftpullError = (error: string): void => {
      if (!phoneNumber) {
        return;
      }
      logPool.push(logPoolMessages.softpullError(phoneNumber, error));
    };

    if (phoneNumber) {
      logPool.push(logPoolMessages.softpullInitiated(phoneNumber));
    }

    // STEP 1: Check eligibility via Experian
    if (devConfig.enableDebugLogs) {
      consoleLogDev('[executeSoftPullFlow] Starting eligibility check...');
    }

    const eligibilityResponse = await userService.getUserEligibilityExperian();

    if (!eligibilityResponse.success) {
      pushSoftpullError(
        formatLogPoolApiError(eligibilityResponse.error, eligibilityResponse.status)
      );
    }

    // debugger;

    // STEP 2: Check eligibility before doing anything else.
    // Stage sync is skipped for ineligible users — no point syncing a blocked journey.
    const eligibilityFailure = resolveEligibilityFailure(eligibilityResponse);
    consoleLogDev('[executeSoftPullFlow] eligibilityFailure', eligibilityFailure);
    if (eligibilityFailure) {
      const eligibilityDataError = getEligibilityErrorDetails(eligibilityResponse);

      // Build the analytics payload for the bureau policy response
      const payload = getPayloadForBureauPolicyResponse(eligibilityDataError as Partial<UserEligibilityExperianResponse>);

      consoleLogDev('[executeSoftPullFlow] payload', payload);
      // Fire-and-forget: analytics should never block the user journey.
      void logBureauPolicyResponseApp(
        payload
      ).catch(() => undefined);
      // Detect explicit isEligible: false from the API so SoftPullStep can
      // route to IneligibilityModal rather than the inline retry error container.

      if (phoneNumber) {
        pushLoanJourneyLog((p) =>
          logPoolMessages.softpullEligibilityRejected(p, eligibilityFailure.type)
        );
      }

      if (devConfig.enableDebugLogs) {
        consoleLogDev(
          '[executeSoftPullFlow] Eligibility check failed:',
          eligibilityFailure.type,
          eligibilityFailure.message,
        );
      }

      return {
        success: false,
        error: { ...eligibilityFailure },
      };
    }

    if (phoneNumber) {
      logPool.push(logPoolMessages.softpullEligibilityApproved(phoneNumber));
    }

    // STEP 3: Eligibility approved — fetch current offer only. Do not call get-user-stage here;
    // it is called when user taps "Check Offers" in OfferStatusModal (see LoanWizard).
    if (devConfig.enableDebugLogs) {
      consoleLogDev('[executeSoftPullFlow] Eligibility approved, fetching current offer...');
    }

    // Keep /offer/current writes behind the shared fetch helper. This prevents this
    // flow and ApprovedOfferStep from maintaining competing cached flag values.
    await fetchCurrentOfferForBankStatement({ force: true });
    const offerResponse = useCurrentOfferStore.getState().lastResponse;

    if (!offerResponse) {
      return {
        success: false,
        error: {
          type: 'UNEXPECTED',
          message: 'Unable to fetch current offer.',
          canRetry: true,
        },
      };
    }

    if (!offerResponse.success) {
      pushSoftpullError(
        formatLogPoolApiError(offerResponse.error, offerResponse.status)
      );
    }

    // STEP 5: Determine if offer exists and derive loan status for modal
    const hasOffer =
      offerResponse.success &&
      offerResponse.data != null &&
      isCurrentOfferSuccess(offerResponse.data);

    const offerData = offerResponse.success ? offerResponse.data : null;
    const offerLoanStatus = getOfferLoanStatus(offerData);
    const isReloan = getOfferLoanSubStatus(offerData);
    const offerPayload = offerData && isCurrentOfferSuccess(offerData) ? offerData.offer : null;
    const loanIdRaw = offerPayload?.loanId ?? null;

    const eligibilityData = eligibilityResponse.success ? eligibilityResponse.data : undefined;


    // Fire-and-forget: analytics should never block the user journey.
    void logBureauPolicyResponseApp(
      buildBureauPolicyAnalyticsPayload({
        eligibilityData,
        offerPayload: offerPayload as CurrentOfferOffer,
        isReloan,
      })
    ).catch(() => undefined);

    const loanIdStatus =
      loanIdRaw && typeof loanIdRaw === 'object' && 'status' in loanIdRaw
        ? (loanIdRaw as { status?: string }).status
        : undefined;
    consoleLogDev('[executeSoftPullFlow] Offer resolution:', {
      hasOffer,
      offerLoanStatus,
      loanIdType: loanIdRaw == null ? 'null' : typeof loanIdRaw,
      loanIdStatus,
    });

    if (hasOffer) {
      // STEP 6: Offer exists — show OfferStatusModal. fetchUserStage() may have synced to OFFERINGS
      // (approved-offer), which unmounts SoftPullStep so the step's callback never runs. Opening the
      // modal here ensures it shows; we do not call goTo() to avoid re-mounting SoftPullStep and
      // triggering an infinite API loop (eligibility + get-user-stage + current-offer).
      // When loanId.status is missing/unrecognised, default to Verified — having an offer means it's approved.
      const resolvedVariant = resolveOfferStatusModalVariant(offerLoanStatus);
      consoleLogDev('[executeSoftPullFlow] Offer found, opening OfferStatusModal (nextAction: offer, variant:', resolvedVariant, ', offerLoanStatus:', offerLoanStatus, ')');
      useFlowStore.getState().setJourneyStoppedReason(null);
      useFlowStore.getState().setShowOfferStatusModal(true, resolvedVariant);
      if (phoneNumber) {
        logPool.push(logPoolMessages.softpullOfferFound(phoneNumber, resolvedVariant));
        logJourneyOfferModalOpened(resolvedVariant);
      }

      return {
        success: true,
        nextAction: 'offer',
      };
    }

    // STEP 7: No offer - navigate to bank statement form
    if (devConfig.enableDebugLogs) {
      consoleLogDev('[executeSoftPullFlow] No offer available, navigating to bank statement');
    }

    // Set journey stopped reason for bank statement step to display
    const noOfferMessage = resolveNoOfferMessage(offerResponse);

    useFlowStore.getState().setJourneyStoppedReason(noOfferMessage);
    if (phoneNumber) {
      logPool.push(logPoolMessages.softpullNoOfferBankStatement(phoneNumber));
      logJourneyStopped(noOfferMessage);
    }

    return {
      success: true,
      nextAction: 'bank-statement',
    };
  } catch (error) {
    const unexpectedError = createUnexpectedSoftPullError();
    const phoneNumber = await resolveLogPoolPhoneNumber();
    if (phoneNumber) {
      logPool.push(
        logPoolMessages.softpullError(phoneNumber, formatLogPoolUnknownError(error))
      );
    }
    if (devConfig.enableDebugLogs) {
      consoleLogDev('[executeSoftPullFlow] Unexpected failure in soft pull flow:', error);
    }
    return {
      success: false,
      error: unexpectedError,
    };
  }
}
