import type { ApiError } from '@/src/types/api';
import { errorHandler, getApiErrorDisplayMessage } from '@/src/utils/common-helper';

const PHONE_PREFIX_RE = /^(\d{10})\s+(.+)$/;

/** Prefix log lines with client event time (phone stays first for pool validation). */
export function withLogPoolEventTimestamp(line: string, at: Date = new Date()): string {
  const trimmed = line.trim();
  const match = trimmed.match(PHONE_PREFIX_RE);
  if (!match) {
    return trimmed;
  }
  return `${match[1]} [${at.toISOString()}] ${match[2]}`;
}

/** Compact API error text for log pool lines (status, code, nested details message). */
export const formatLogPoolApiError = (
  error?: ApiError['error'] | { message?: string; code?: string; details?: unknown },
  status?: number
): string => {
  const detailMessage = error ? getApiErrorDisplayMessage(error).trim() : '';
  const fallbackMessage = error?.message?.trim() ?? '';
  const primary = detailMessage || fallbackMessage;
  const code = error?.code?.trim();

  const parts: string[] = [];
  if (primary) {
    parts.push(primary);
  }
  if (status !== undefined && status > 0) {
    parts.push(`HTTP ${status}`);
  }
  if (code) {
    parts.push(`code=${code}`);
  }

  if (parts.length === 0) {
    return 'Unknown error';
  }
  return parts.join(' | ');
};

/** Error text from caught exceptions for log pool lines. */
export const formatLogPoolUnknownError = (error: unknown): string => {
  if (error instanceof Error) {
    const namePrefix =
      error.name && error.name !== 'Error' ? `${error.name}: ` : '';
    return `${namePrefix}${error.message}`;
  }
  return errorHandler(error);
};

/** Simple log line formats for the client logs pool. */
export const logPoolMessages = {
  verifyOtpBody: (phoneNumber: string, body: Record<string, unknown>): string =>
    `${phoneNumber} Verify OTP body: ${JSON.stringify(body)}`,
  credeauSyncStarted: (phoneNumber: string): string =>
    `${phoneNumber} Credeau sync started`,
  sentOtpRequest: (phoneNumber: string): string =>
    `${phoneNumber} Sent OTP Request`,
  sentOtpRequestError: (phoneNumber: string, error: string): string =>
    `${phoneNumber} Sent OTP Request Error: ${error}`,
  otpVerified: (phoneNumber: string): string =>
    `${phoneNumber} OTP Verified`,
  otpVerifyError: (phoneNumber: string, error: string): string =>
    `${phoneNumber} OTP Verified Error: ${error}`,
  softpullInitiated: (phoneNumber: string): string =>
    `${phoneNumber} Softpull initiated`,
  softpullError: (phoneNumber: string, error: string): string =>
    `${phoneNumber} Softpull Error: ${error}`,
  credeauSyncCreated: (phoneNumber: string): string =>
    `${phoneNumber} Credeau sync created`,
  credeauSyncError: (phoneNumber: string, error: string): string =>
    `${phoneNumber} Credeau sync Error: ${error}`,
  credeauSyncFinished: (phoneNumber: string): string =>
    `${phoneNumber} Credeau sync finished`,
  journeyEntered: (phoneNumber: string): string =>
    `${phoneNumber} Journey entered`,
  journeyNavigated: (
    phoneNumber: string,
    phase: string,
    substepId: string,
    source: string
  ): string =>
    `${phoneNumber} Journey navigated: ${phase}/${substepId} (${source})`,
  journeySubstepEntered: (
    phoneNumber: string,
    phase: string,
    substepId: string
  ): string => `${phoneNumber} Journey substep entered: ${phase}/${substepId}`,
  journeyStageSynced: (phoneNumber: string, stage: string): string =>
    `${phoneNumber} Journey stage synced: ${stage}`,
  journeyStageRedirect: (
    phoneNumber: string,
    expectedStage: string,
    backendStage: string
  ): string =>
    `${phoneNumber} Journey stage redirect: ${expectedStage} -> ${backendStage}`,
  journeyError: (phoneNumber: string, context: string, error: string): string =>
    `${phoneNumber} Journey ${context} error: ${error}`,
  appError: (phoneNumber: string, context: string, error: string): string =>
    `${phoneNumber} App error [${context}]: ${error}`,
  sessionCleared: (phoneNumber: string, method: string, path: string): string =>
    `${phoneNumber} Session cleared: ${method} ${path}`,
  installReferrerCaptured: (phoneNumber: string, referrer: string, installVersion: string): string =>
    `${phoneNumber} Install referrer captured: ${referrer} (v${installVersion})`,
  installReferrerFromCache: (phoneNumber: string, referrer: string, installVersion: string): string =>
    `${phoneNumber} Install referrer from cache: ${referrer} (v${installVersion})`,
  installReferrerError: (phoneNumber: string, error: string): string =>
    `${phoneNumber} Install referrer error: ${error}`,
  adjustAttributionCaptured: (
    phoneNumber: string,
    fields: {
      network: string;
      campaign: string;
      adgroup: string;
      creative: string;
      trackerToken: string;
    }
  ): string =>
    `${phoneNumber} Adjust attribution captured: network=${fields.network} campaign=${fields.campaign} adgroup=${fields.adgroup} creative=${fields.creative} tracker=${fields.trackerToken}`,
  adjustAttributionSentToOtp: (
    phoneNumber: string,
    params: Record<string, string> | undefined
  ): string =>
    params
      ? `${phoneNumber} Adjust attribution sent to OTP verify: ${Object.entries(params)
          .map(([key, value]) => `${key}=${value}`)
          .join(' ')}`
      : `${phoneNumber} Adjust attribution sent to OTP verify: none`,
  adjustAttributionError: (phoneNumber: string, error: string): string =>
    `${phoneNumber} Adjust attribution error: ${error}`,
  journeyStepSubmitted: (phoneNumber: string, stepId: string): string =>
    `${phoneNumber} Journey step submitted: ${stepId}`,
  journeyIneligibilityShown: (phoneNumber: string): string =>
    `${phoneNumber} Journey ineligibility shown`,
  journeyOfferModalOpened: (phoneNumber: string, variant: string): string =>
    `${phoneNumber} Journey offer modal opened: ${variant}`,
  journeyOfferCheckOffers: (phoneNumber: string): string =>
    `${phoneNumber} Journey offer modal: check offers`,
  journeyStopped: (phoneNumber: string, reason: string): string =>
    `${phoneNumber} Journey stopped: ${reason}`,
  softpullEligibilityRejected: (phoneNumber: string, failureType: string): string =>
    `${phoneNumber} Softpull eligibility rejected: ${failureType}`,
  softpullEligibilityApproved: (phoneNumber: string): string =>
    `${phoneNumber} Softpull eligibility approved`,
  softpullOfferFound: (phoneNumber: string, variant: string): string =>
    `${phoneNumber} Softpull offer found: ${variant}`,
  softpullNoOfferBankStatement: (phoneNumber: string): string =>
    `${phoneNumber} Softpull no offer: bank statement route`,
  journeyApplyLoanStarted: (phoneNumber: string): string =>
    `${phoneNumber} Apply loan started`,
  journeyApplyLoanFinished: (phoneNumber: string, hasOffer: boolean): string =>
    `${phoneNumber} Apply loan finished: hasOffer=${hasOffer}`,
  journeyBankStatementProcessed: (phoneNumber: string, hasOffer: boolean): string =>
    `${phoneNumber} Bank statement processed: hasOffer=${hasOffer}`,
  hyperKycResultReceived: (phoneNumber: string, status: string, code?: string): string =>
    `${phoneNumber} HyperKYC result received: status=${status}${code ? ` code=${code}` : ''}`,
};
