import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { BankStatementSuccessPayload } from '@/src/types/webview';
import type { UploadBankStatementRequest } from '@/src/services/user/userService';
import {
  fetchTempUrlFromApiAndStore,
  userService,
} from '@/src/services/user/userService';
import {
  applyLoanAndFetchOffer,
  fetchCurrentOfferForBankStatement,
  fetchUserStage,
} from '@/src/services/user/useUserStage';
import {
  logJourneyBankStatementProcessed,
  logJourneyOfferModalOpened,
  pushLoanJourneyApiError,
  pushLoanJourneyUnknownError,
} from '@/src/services/logging/logPoolJourney';
import { useFlowStore } from '@/src/store/useFlowStore';
import { useCurrentOfferStore } from '@/src/store/useCurrentOfferStore';
import {
  getOfferLoanStatus,
  isCurrentOfferSuccess,
  type OfferLoanStatus,
} from '@/src/types/offer';
import {
  type BankConnectAttemptState,
  type BankConnectAttemptsLeft,
  type BankConnectFlowScenario,
  getBankConnectPollingConfig,
  resolveAaAttemptsLeft,
  resolveBankConnectAttemptState,
  resolveManualUploadAttemptsLeft,
} from './bankConnectStepHelpers';
import {
  BANK_CONNECT_STATUS_MESSAGES,
  resolveBankConnectChecklist,
  resolveProcessedMessage,
} from './bankConnectContinueMessages';
import { devLog } from '@/src/utils';
import {
  getBankStatementKeyReadiness,
  useBankStatementStatus,
  type BankStatementStatusEvent,
  type BankStatementStatusSource,
  type NormalizedBankStatementStatus,
} from './useBankStatementStatus';
import {
  pickBankStatementPdf,
  type BankStatementFile,
} from './filePicker';
import { navigateToPhaseSubstep } from '@/src/services/navigation/stepNavigation';
import type { ApiResponse } from '@/src/types/api';
import type { GetUserBankStatementStatusResult } from '@/src/types/user';
import { consoleLogDev, getApiErrorDisplayMessage } from '@/src/utils/common-helper';

/** Status payload facts used to decide whether processed can enter offer handling. */
export type StatusApiFlags = {
  callApplyLoan: boolean;
  hasCompleteBankStatementKey: boolean;
  canRetryByAttempts: boolean;
};

export type BankConnectView =
  | 'mobile'
  | 'upload-idle'
  | 'upload-progress'
  | 'upload-success'
  | 'bank-statement-pending';

export type BankConnectResolvedView = BankConnectView;

type ConnectBankVariables = {
  phoneNumber: string;
  requestId: number;
};

type ConnectBankResult = {
  tempUrl: string;
  requestId: number;
};

type UploadStatementVariables = {
  file: BankStatementFile;
  confidentialCode: string;
  requestId: number;
};

type UseBankConnectStepControllerParams = {
  onNext: () => void;
};

const BANK_CONNECT_ERROR = 'Unable to initiate bank connect. Upload manually.';
const BANK_STATEMENT_UPLOAD_ERROR =
  'Unable to upload bank statement. Please try again.';
const BANK_STATEMENT_TIMEOUT_MESSAGE =
  'Request timed out. Please try again.'; // Shown when upload times out; do not ask for password.

type PdfPasswordErrorKind = 'required' | 'invalid';

/** Thrown when upload times out; show message but do NOT open PDF password modal. */
class UploadTimeoutError extends Error {
  override name = 'UPLOAD_TIMEOUT';
}

/** Thrown when upload API indicates a PDF password is required/invalid; opens PDF password modal. */
class PdfPasswordRequiredError extends Error {
  override name = 'PDF_PASSWORD_REQUIRED';
  readonly kind: PdfPasswordErrorKind;

  constructor(kind: PdfPasswordErrorKind, message?: string) {
    const fallbackMessage =
      kind === 'invalid' ? 'Incorrect password for PDF. Please try again.' : '';
    // For `required`, keep message empty: this is a prompt state, not a wrong-password state.
    super(message ?? fallbackMessage);
    this.kind = kind;
  }
}

const isTruthyFlag = (value: unknown): boolean =>
  value === true || value === 'true';

const hasPasswordInvalidFlag = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    isTruthyFlag(record.passwordInvalid) ||
    isTruthyFlag(record.password_invalid) ||
    isTruthyFlag(record.isPasswordInvalid)
  );
};

const hasPasswordRequiredFlag = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    isTruthyFlag(record.passwordRequired) ||
    isTruthyFlag(record.password_required) ||
    isTruthyFlag(record.isPasswordRequired)
  );
};

function resolvePdfPasswordErrorKind(
  response: ApiResponse<unknown>
): PdfPasswordErrorKind | null {
  if (!response || response.success === true) return null;
  const err = response.error as Record<string, unknown> | undefined;
  if (!err) return null;

  const details = err.details;
  const errorDetails = err.errorDetails;

  if (
    hasPasswordInvalidFlag(err) ||
    hasPasswordInvalidFlag(details) ||
    hasPasswordInvalidFlag(errorDetails)
  ) {
    return 'invalid';
  }

  if (
    hasPasswordRequiredFlag(err) ||
    hasPasswordRequiredFlag(details) ||
    hasPasswordRequiredFlag(errorDetails)
  ) {
    return 'required';
  }

  return null;
}

async function getBankConnectTempUrl(phoneNumber: string): Promise<string> {
  const response = await fetchTempUrlFromApiAndStore({ phoneNumber });
  const resolvedTempUrl = response?.tempUrl ?? response?.url;

  if (!resolvedTempUrl) {
    throw new Error(response?.message ?? BANK_CONNECT_ERROR);
  }

  return resolvedTempUrl;
}

function buildUploadPayload(
  file: BankStatementFile,
  confidentialCode: string
): UploadBankStatementRequest {
  return {
    file: {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    },
    confidentialCode,
  };
}

const PROCESSED_CALL_APPLY_LOAN_POLL_MAX_MS = 20000;  // 20 seconds
const PROCESSED_CALL_APPLY_LOAN_POLL_INTERVAL_MS = 2500;
const INITIAL_ATTEMPTS_LEFT: BankConnectAttemptsLeft = {
  aaAttemptsLeft: null,
  manualUploadAttemptsLeft: null,
};

/**
 * Calls the current-offer API, persists the result to the store, and returns
 * whether a valid offer was received.
 * Extracted as a standalone helper so the controller callback stays small.
 */
async function fetchOfferAndCheckHasOffer(): Promise<boolean> {
  // BSA just completed, so the cached offer and showUpdateButton may both be stale.
  await fetchCurrentOfferForBankStatement({ force: true });
  const offerResponse = useCurrentOfferStore.getState().lastResponse;
  return (
    offerResponse?.success === true &&
    offerResponse.data != null &&
    isCurrentOfferSuccess(offerResponse.data)
  );
}

export function useBankConnectStepController({
  onNext,
}: UseBankConnectStepControllerParams) {
  // ═══════════════════════════════════════
  //  STATE
  // ═══════════════════════════════════════

  const [view, setView] = useState<BankConnectView>('mobile');
  const [mobile, setMobile] = useState('');
  const [tempUrl, setTempUrl] = useState<string | null>(null);
  const [isWebViewOpen, setIsWebViewOpen] = useState(false);
  const [isResolvingWebViewStatus, setIsResolvingWebViewStatus] = useState(false);
  const [fetchErrorMessage, setFetchErrorMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [selectedStatementFile, setSelectedStatementFile] =
    useState<BankStatementFile | null>(null);
  const [isPickingStatementFile, setIsPickingStatementFile] = useState(false);
  const [showPdfPasswordModal, setShowPdfPasswordModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    BANK_CONNECT_STATUS_MESSAGES.processing
  );
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const [isProcessedResultResolved, setIsProcessedResultResolved] =
    useState(false);
  const [isInitialStatusLoading, setIsInitialStatusLoading] = useState(true);
  const [attemptState, setAttemptState] =
    useState<BankConnectAttemptState>('aa-only');
  const [attemptsLeft, setAttemptsLeft] =
    useState<BankConnectAttemptsLeft>(INITIAL_ATTEMPTS_LEFT);
  const attemptsLeftRef = useRef<BankConnectAttemptsLeft>(INITIAL_ATTEMPTS_LEFT);
  const initialStatusResolvedRef = useRef(false);

  // null = backend hasn't returned attempts yet = assume AA is available (fresh start)
  const isAaEnabled =
    attemptsLeft.aaAttemptsLeft == null || attemptsLeft.aaAttemptsLeft > 0;
  const flowScenario: BankConnectFlowScenario = isAaEnabled
    ? 'aa-flow'
    : 'manual-upload';
  const pollingConfig = getBankConnectPollingConfig(flowScenario);

  const cameFromOfferings = useFlowStore((s) => s.cameFromOfferings);
  const setCameFromOfferings = useFlowStore((s) => s.setCameFromOfferings);
  const goTo = useFlowStore((s) => s.goTo);
  const lastOfferResponse = useCurrentOfferStore((s) => s.lastResponse);

  const didAdvanceRef = useRef(false);
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeConnectRequestIdRef = useRef(0);
  const activeUploadRequestIdRef = useRef(0);
  const webViewSuccessHandledRef = useRef(false);
  const webViewClosePollIdRef = useRef(0);
  const verifiedModalShownRef = useRef(false);
  const processedMessageResolvedRef = useRef(false);
  /** Prevent overlapping processed handlers from firing duplicate apply-loan calls. */
  const processedHandlingInFlightRef = useRef(false);
  /** Stop auto apply-loan retries after first failure until status exits "processed". */
  const processedApplyLoanFailedRef = useRef(false);
  const processedApplyLoanFailureMessageRef = useRef<string | null>(null);
  /** Set by effect below so onStatusProcessed can advance on offer without ordering dependency. */
  const showSuccessAndAdvanceRef = useRef<() => void>(() => {});
  /** Status callbacks are declared before the polling hook; these refs bridge to its latest commands. */
  const stopStatusPollingRef = useRef<(reason?: string) => void>(() => {});
  const startStatusPollingRef = useRef<(intervalMs: number) => void>(() => {});
  const pollUntilCallApplyLoanRef = useRef<
    (maxWaitMs: number, intervalMs: number) => Promise<boolean>
  >(async () => false);
  const refreshStatusRef = useRef<
    () => Promise<ApiResponse<GetUserBankStatementStatusResult> | undefined>
  >(async () => undefined);

  const clearNextTimer = useCallback(() => {
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
    }
    nextTimerRef.current = null;
  }, []);

  const clearUploadInterval = useCallback(() => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
    }
    uploadIntervalRef.current = null;
  }, []);

  // ═══════════════════════════════════════
  //  CONTROLLER -> STATUS HOOK COMMANDS
  // ═══════════════════════════════════════

  /** Pending = go to entry view. Use ref for latest attempt counts to avoid stale closure. */
  const goToEntryView = useCallback(() => {
    stopStatusPollingRef.current('go-to-entry-view');

    const aaLeft = attemptsLeftRef.current.aaAttemptsLeft;
    const aaStillAvailable = aaLeft == null || aaLeft > 0;
    const targetView =
      aaStillAvailable && flowScenario !== 'manual-upload'
        ? 'mobile'
        : 'upload-idle';
    setView(targetView);
  }, [flowScenario]);

  const goToAaEntryView = useCallback(() => {
    stopStatusPollingRef.current('go-to-aa-entry-view');
    setView('mobile');
  }, []);

  /** Poll until processed contains both json and bsaReport, or another stop status arrives. */
  const startPolling = useCallback(() => {
    devLog.stepMessage(
      'bank-connect',
      'controller.startApprovedPolling',
      `intervalMs=${pollingConfig.intervalMs}`
    );
    processedMessageResolvedRef.current = false;
    setIsProcessedResultResolved(false);
    // Close synchronously so a cached Verified offer cannot flash before the polling effect runs.
    useFlowStore.getState().setShowOfferStatusModal(false);
    setPollingTimedOut(false);
    setStatusMessage(BANK_CONNECT_STATUS_MESSAGES.processing);
    setView('bank-statement-pending');
    startStatusPollingRef.current(pollingConfig.intervalMs);
  }, [pollingConfig.intervalMs]);

  const stopPolling = useCallback(() => {
    devLog.stepMessage(
      'bank-connect',
      'controller.stopApprovedPolling',
      'forwarding stop command to useBankStatementStatus'
    );
    stopStatusPollingRef.current('controller-status-handler');
  }, []);

  const resetBankStatementUiState = useCallback(() => {
    clearUploadInterval();
    setUploadProgress(0);
    setFetchErrorMessage('');
    setIsWebViewOpen(false);
    processedMessageResolvedRef.current = false;
    setIsProcessedResultResolved(false);
  }, [clearUploadInterval]);

  const markInitialStatusResolved = useCallback(() => {
    if (initialStatusResolvedRef.current) return;
    initialStatusResolvedRef.current = true;
    setIsInitialStatusLoading(false);
  }, []);

  const resetProcessedApplyLoanGuard = useCallback(() => {
    processedApplyLoanFailedRef.current = false;
    processedApplyLoanFailureMessageRef.current = null;
  }, []);

  /**
   * Backend may skip attempts fields on some responses; keep last known values
   * so manual-upload eligibility does not flicker between polls.
   * When exhausted, call fetchUserStage so backend can move user to pending/next stage.
   */
  const syncAttemptsFromStatusResponse = useCallback(
    (
      payload: GetUserBankStatementStatusResult | undefined
    ): BankConnectAttemptState => {
      const aaAttemptsLeft = resolveAaAttemptsLeft(payload);
      const manualUploadAttemptsLeft = resolveManualUploadAttemptsLeft(payload);
      const mergedAttempts: BankConnectAttemptsLeft = {
        aaAttemptsLeft: aaAttemptsLeft ?? attemptsLeftRef.current.aaAttemptsLeft,
        manualUploadAttemptsLeft:
          manualUploadAttemptsLeft ?? attemptsLeftRef.current.manualUploadAttemptsLeft,
      };

      attemptsLeftRef.current = mergedAttempts;
      setAttemptsLeft(mergedAttempts);

      const nextAttemptState = resolveBankConnectAttemptState(mergedAttempts);
      setAttemptState(nextAttemptState);
      if (nextAttemptState === 'exhausted') {
        void fetchUserStage();
      }
      return nextAttemptState;
    },
    []
  );

  // ═══════════════════════════════════════
  //  STATUS HANDLERS (pending/approved/processed/rejected)
  // ═══════════════════════════════════════

  /** Processed: show checklist, then fetch offer. If bankStatementKey already has data, use apiFlags.callApplyLoan; else poll up to 20s for callApplyLoan. */
  const onStatusProcessed = useCallback(
    async (
      apiFlags?: StatusApiFlags,
      source?: BankStatementStatusSource
    ) => {
      stopPolling();
      const shouldResolveInitialLoading = source === 'step-entry';
      let acquiredProcessedHandlerLock = false;
      try {
        if (processedMessageResolvedRef.current) return;
        if (processedHandlingInFlightRef.current) return;
        if (processedApplyLoanFailedRef.current) {
          const retryMessage =
            processedApplyLoanFailureMessageRef.current ??
            BANK_CONNECT_STATUS_MESSAGES.noOfferRetryBankStatement;
          setStatusMessage(retryMessage);
          setFetchErrorMessage(retryMessage);
          goToEntryView();
          return;
        }

        processedHandlingInFlightRef.current = true;
        acquiredProcessedHandlerLock = true;

        const hasCompleteBankStatementKey =
          apiFlags?.hasCompleteBankStatementKey === true;
        const callApplyLoan = hasCompleteBankStatementKey
          ? (apiFlags?.callApplyLoan === true)
          : await pollUntilCallApplyLoanRef.current(
            PROCESSED_CALL_APPLY_LOAN_POLL_MAX_MS,
            PROCESSED_CALL_APPLY_LOAN_POLL_INTERVAL_MS
          );

        setStatusMessage(BANK_CONNECT_STATUS_MESSAGES.processingStatement);
        setView('bank-statement-pending');

        const applyResult = callApplyLoan
          ? await applyLoanAndFetchOffer()
          : { hasOffer: await fetchOfferAndCheckHasOffer(), retryMessage: undefined as string | undefined };
        const hasOffer = applyResult.hasOffer;
        const applyLoanRetryMessage = applyResult.retryMessage;
        const shouldRetryAa =
          source === 'manual-upload-success' &&
          applyResult.retryMethod === 'AA_RETRY';

        if (processedMessageResolvedRef.current) return;
        processedMessageResolvedRef.current = true;
        setIsProcessedResultResolved(true);

        const lastResponse = useCurrentOfferStore.getState().lastResponse;
        const offerLoanStatus = getOfferLoanStatus(
          lastResponse?.success ? lastResponse.data : undefined
        );

        if (!hasOffer) {
          // apply-loan did not produce an OFFERED offer — re-fetch to get current attempt counts.
          // syncAttemptsFromStatusResponse handles 'exhausted' by calling fetchUserStage.
          const retryMessage =
            applyLoanRetryMessage ?? BANK_CONNECT_STATUS_MESSAGES.noOfferRetryBankStatement;
          if (callApplyLoan) {
            processedApplyLoanFailedRef.current = true;
            processedApplyLoanFailureMessageRef.current = retryMessage;
          }
          setStatusMessage(retryMessage);
          // Show apply-loan message in ErrorContainer on mobile/upload-idle (both use fetchErrorMessage).
          setFetchErrorMessage(retryMessage);
          // Reset prefilled file so user starts fresh on retry.
          setSelectedStatementFile(null);
          setUploadedFileName(null);

          const freshStatus = await refreshStatusRef.current();
          let freshAttemptState: BankConnectAttemptState | null = null;
          if (freshStatus?.success && freshStatus.data) {
            freshAttemptState = syncAttemptsFromStatusResponse(freshStatus.data);
          }
          if (shouldRetryAa) {
            goToAaEntryView();
            return;
          }
          if (freshAttemptState != null && freshAttemptState !== 'exhausted') {
            goToEntryView();
            return;
          }
          // exhausted or status fetch failed — fall through to show resolved message below
        }

        setStatusMessage(
          resolveProcessedMessage({
            hasOffer,
            cameFromOfferings,
            offerLoanStatus,
          })
        );
        logJourneyBankStatementProcessed(hasOffer);

        // Only advance when we have a verified offer. Pending/rejected must stay on bank-statement-pending.
        // When offerLoanStatus is undefined (old API / no loanId), treat as Verified for backwards compat.
        const isOfferVerified =
          offerLoanStatus === 'Verified' ||
          (offerLoanStatus === undefined && hasOffer);
        if (hasOffer && isOfferVerified) {
          resetProcessedApplyLoanGuard();
          showSuccessAndAdvanceRef.current();
        }
      } finally {
        if (acquiredProcessedHandlerLock) {
          processedHandlingInFlightRef.current = false;
        }
        if (shouldResolveInitialLoading) {
          markInitialStatusResolved();
        }
      }
    },
    [
      cameFromOfferings,
      goToAaEntryView,
      goToEntryView,
      markInitialStatusResolved,
      resetProcessedApplyLoanGuard,
      stopPolling,
      syncAttemptsFromStatusResponse,
    ]
  );

  const onStatusRejected = useCallback(
    (source: BankStatementStatusSource) => {
      // Use goToEntryView (not upload-idle only) so AA + manual both show when attempts allow (syncAttemptsFromStatusResponse already ran).
      goToEntryView();
      // step-entry = first load (e.g. resume from Home). Skip alarming copy; show it once user is active in-flow (other sources).
      setFetchErrorMessage(
        source === 'step-entry' ? '' : BANK_CONNECT_STATUS_MESSAGES.rejected
      );
    },
    [goToEntryView]
  );

  /** Approved and incomplete processed statuses stay in polling until both BSA artifacts exist. */
  const onStatusNeedsPolling = useCallback(() => {
    startPolling();
  }, [startPolling]);

  const handleStatusChange = useCallback(
    (
      status: NormalizedBankStatementStatus,
      source: BankStatementStatusSource,
      apiFlags?: StatusApiFlags
    ) => {
      if (status !== 'processed') {
        resetProcessedApplyLoanGuard();
      }
      resetBankStatementUiState();

      switch (status) {
        case 'pending':
        case 'in-progress':
          if (source === 'manual-upload-success') {
            setView('bank-statement-pending');
            break;
          }
          // in-progress: backend fetch may be stuck; let user run account aggregation / upload again (no polling).
          goToEntryView();
          break;
        case 'approved':
          onStatusNeedsPolling();
          break;
        case 'processed':
          if (apiFlags?.hasCompleteBankStatementKey !== true) {
            // Processed is intermediate until both bankStatementKey.json and bsaReport exist.
            // Keep the hook-owned polling loop active; do not enter offer handling yet.
            devLog.stepMessage(
              'bank-connect',
              'controller.processedWaitingForArtifacts',
              'bankStatementKey is missing json or bsaReport; continuing polling'
            );
            onStatusNeedsPolling();
            break;
          }
          void onStatusProcessed(apiFlags, source);
          return;
        case 'rejected':
          onStatusRejected(source);
          break;
        default:
          stopPolling();
          break;
      }
      if (source === 'step-entry') {
        markInitialStatusResolved();
      }
    },
    [
      goToEntryView,
      markInitialStatusResolved,
      onStatusNeedsPolling,
      onStatusProcessed,
      onStatusRejected,
      resetProcessedApplyLoanGuard,
      resetBankStatementUiState,
      stopPolling,
    ]
  );

  const onStatusFetched = useCallback(
    ({ source, status, response }: BankStatementStatusEvent) => {
 
      if (!response?.success || !response?.data) {
        if (source === 'step-entry') {
          markInitialStatusResolved();
        }
        return;
      }

      const nextAttemptState = syncAttemptsFromStatusResponse(response.data);
      const bankStatementKeyReadiness = getBankStatementKeyReadiness(response.data);

      const apiFlags: StatusApiFlags = {
        callApplyLoan: response.data?.callApplyLoan === true,
        hasCompleteBankStatementKey: bankStatementKeyReadiness.isComplete,
        canRetryByAttempts:
          nextAttemptState === 'aa-with-manual' ||
          nextAttemptState === 'manual-only',
      };

      handleStatusChange(status, source, apiFlags);
    },
    [
      handleStatusChange,
      markInitialStatusResolved,
      syncAttemptsFromStatusResponse,
    ]
  );

  /**
   * BSA status flow boundary:
   * 1. This controller starts a fetch/poll using one of the commands below.
   * 2. useBankStatementStatus calls the API, normalizes the response, and updates React Query.
   * 3. The hook invokes onStatusFetched for user-flow responses.
   * 4. onStatusFetched derives API flags, then handleStatusChange routes to a status handler.
   * 5. Status handlers update only UI, offer, and navigation state in this controller.
   */
  const {
    refetchWithSource,
    refreshStatus,
    pollUntilResolved,
    pollUntilCallApplyLoan,
    startApprovedPolling,
    stopPolling: stopStatusPolling,
    bankStatementStatus,
    bankStatementResponse,
    isPolling,
  } = useBankStatementStatus({
    onStatusResolved: onStatusFetched,
  });

  // Handlers above are declared before the hook. These refs forward them to the latest hook commands.
  stopStatusPollingRef.current = stopStatusPolling;
  startStatusPollingRef.current = (intervalMs) => {
    startApprovedPolling({ intervalMs });
  };
  pollUntilCallApplyLoanRef.current = (maxWaitMs, intervalMs) =>
    pollUntilCallApplyLoan({ maxWaitMs, intervalMs });
  refreshStatusRef.current = async () => (await refreshStatus()).response;

  const bankStatementKeyReadiness = getBankStatementKeyReadiness(
    bankStatementResponse?.success ? bankStatementResponse.data : undefined
  );

  // Cached status -> controller command: only approved starts the long-running poll.
  // In-progress deliberately stays on the entry screen so the user can retry BSA.
  useEffect(() => {
    if (bankStatementStatus === 'approved' && view !== 'bank-statement-pending') {
      startPolling();
    }
  }, [bankStatementStatus, startPolling, view]);

  const startUploadProgress = useCallback(() => {
    clearUploadInterval();
    setUploadProgress(10);

    uploadIntervalRef.current = setInterval(() => {
      setUploadProgress((value) => {
        if (value >= 90) return 90;
        return value + 10;
      });
    }, 250);
  }, [clearUploadInterval]);

  const advanceOnce = useCallback(() => {
    if (didAdvanceRef.current) return;
    didAdvanceRef.current = true;
    setCameFromOfferings(false);
    clearNextTimer();
    clearUploadInterval();
    onNext();
  }, [clearNextTimer, clearUploadInterval, onNext, setCameFromOfferings]);

  const handleProcessedBankStatement = useCallback(() => {
    stopPolling();
    clearNextTimer();
    nextTimerRef.current = setTimeout(() => {
      advanceOnce();
    }, 2000);
  }, [advanceOnce, clearNextTimer, stopPolling]);

  useEffect(() => {
    showSuccessAndAdvanceRef.current = handleProcessedBankStatement;
  }, [handleProcessedBankStatement]);

  useEffect(() => {
    return () => {
      webViewClosePollIdRef.current += 1;
      activeUploadRequestIdRef.current += 1;
      clearNextTimer();
      clearUploadInterval();
      stopStatusPollingRef.current('bank-connect-unmount');
    };
  }, [clearNextTimer, clearUploadInterval]);

  useEffect(() => {
    devLog.stepMessage(
      'bank-connect',
      'controller.stepEntry',
      'requesting initial bank statement status'
    );
    void refetchWithSource('step-entry').catch(() => {
      markInitialStatusResolved();
    });
  }, [markInitialStatusResolved, refetchWithSource]);

  // When AA attempts exhausted but manual upload still available, show upload view.
  useEffect(() => {
    if (attemptState === 'manual-only' && view === 'mobile') {
      setView('upload-idle');
    }
  }, [attemptState, view]);

  // ═══════════════════════════════════════
  //  BANK CONNECT (AA WebView Flow)
  // ═══════════════════════════════════════

  const connectBankMutation = useMutation({
    mutationFn: async ({
      phoneNumber,
      requestId,
    }: ConnectBankVariables): Promise<ConnectBankResult> => {
      const resolvedTempUrl = await getBankConnectTempUrl(phoneNumber);
      return {
        tempUrl: resolvedTempUrl,
        requestId,
      };
    },
    onMutate: () => {
      webViewClosePollIdRef.current += 1;
      setFetchErrorMessage('');
      setTempUrl(null);
      setIsWebViewOpen(false);
      setIsResolvingWebViewStatus(false);
      webViewSuccessHandledRef.current = false;
    },
    onSuccess: ({ tempUrl: resolvedTempUrl, requestId }) => {
      if (requestId !== activeConnectRequestIdRef.current) return;
      setTempUrl(resolvedTempUrl);
      setView('mobile');
      webViewSuccessHandledRef.current = false;
      setIsWebViewOpen(true);
    },
    onError: (error, variables) => {
      if (variables.requestId !== activeConnectRequestIdRef.current) return;
      pushLoanJourneyUnknownError('bank connect aa temp url', error);
      setFetchErrorMessage(error instanceof Error ? error.message : BANK_CONNECT_ERROR);
      setView('upload-idle');
    },
  });

  // ═══════════════════════════════════════
  //  MANUAL UPLOAD
  // ═══════════════════════════════════════

  const uploadBankStatementMutation = useMutation({
    mutationFn: async ({
      file,
      confidentialCode,
    }: UploadStatementVariables) => {
      const response = await userService.uploadBankStatement(
        buildUploadPayload(file, confidentialCode)
      );

      if (!response.success) {
        const errorCode = (response.error as { code?: string } | undefined)?.code;
        const pdfPasswordErrorKind = resolvePdfPasswordErrorKind(response);
        const displayMessage =
          getApiErrorDisplayMessage(response.error) || BANK_STATEMENT_UPLOAD_ERROR;

        pushLoanJourneyApiError(
          'bank connect statement upload',
          response.error,
          response.status
        );

        if (__DEV__) {
          consoleLogDev('[BankConnectStep] uploadBankStatement failed', {
            success: response.success,
            status: response.status,
            errorCode,
            errorMessage: response.error?.message,
            errorDetails: response.error?.details,
            displayMessage,
            pdfPasswordErrorKind,
          });
        }

        // Timeout: show specific message, do NOT ask for password.
        if (errorCode === 'TIMEOUT') {
          throw new UploadTimeoutError(BANK_STATEMENT_TIMEOUT_MESSAGE);
        }

        // Password required/invalid: open password modal.
        if (pdfPasswordErrorKind != null) {
          throw new PdfPasswordRequiredError(
            pdfPasswordErrorKind,
            pdfPasswordErrorKind === 'invalid' ? displayMessage : undefined
          );
        }

        throw new Error(displayMessage);
      }

      return response.data;
    },
    onMutate: () => {
      setFetchErrorMessage('');
      setView('upload-progress');
      startUploadProgress();
    },
    onSuccess: (_responseData, variables) => {
      if (variables.requestId !== activeUploadRequestIdRef.current) return;
      clearUploadInterval();
      setUploadProgress(100);
      setUploadedFileName(variables.file.name);
      resetProcessedApplyLoanGuard();
      // Show verifying/processing UI immediately so there is no dead gap before apply-loan.
      processedMessageResolvedRef.current = false;
      setIsProcessedResultResolved(false);
      setStatusMessage(BANK_CONNECT_STATUS_MESSAGES.processingStatement);
      setView('bank-statement-pending');
  
      void (async () => {
        const result = await pollUntilResolved({
          label: 'manual-upload',
          source: 'manual-upload-success',
          isCancelled: () =>
            variables.requestId !== activeUploadRequestIdRef.current,
        });
        if (
          variables.requestId === activeUploadRequestIdRef.current &&
          (result.outcome === 'timed-out' || result.outcome === 'failed')
        ) {
          goToEntryView();
        }
      })();
    },
    onError: (error, variables) => {
      if (variables.requestId !== activeUploadRequestIdRef.current) return;
      clearUploadInterval();
      setUploadProgress(0);

      const errorMessage =
        error instanceof Error ? error.message : BANK_STATEMENT_UPLOAD_ERROR;

      // Only open PDF password modal for password-related errors (required/invalid).
      // Timeout and other errors: show message inline, no password prompt.
      const isPasswordError = error instanceof PdfPasswordRequiredError;
      const shouldHideModalError =
        isPasswordError && error.kind === 'required';
      const displayMessage = shouldHideModalError ? '' : errorMessage;

      if (__DEV__) {
        consoleLogDev('[BankConnectStep] uploadBankStatement onError', {
          errorMessage,
          isPasswordError,
          shouldHideModalError,
        });
      }

      setFetchErrorMessage(displayMessage);
      if (isPasswordError) {
        setShowPdfPasswordModal(true);
      } else {
        // Reset previously selected file so the user starts fresh after a failed upload.
        setSelectedStatementFile(null);
        setUploadedFileName(null);
      }
      setView('upload-idle');
    },
  });

  const handleFetchBankDetails = useCallback(() => {
    if (mobile.length !== 10 || connectBankMutation.isPending) return;

    activeConnectRequestIdRef.current += 1;

    connectBankMutation.mutate({
      phoneNumber: mobile,
      requestId: activeConnectRequestIdRef.current,
    });
  }, [connectBankMutation, mobile]);

  const handleCancelFetching = useCallback(() => {
    activeConnectRequestIdRef.current += 1;
    connectBankMutation.reset();
    setFetchErrorMessage('');
    setView('mobile');
  }, [connectBankMutation]);

  const handlePickStatementFile = useCallback(() => {
    if (isPickingStatementFile || uploadBankStatementMutation.isPending) return;

    setFetchErrorMessage('');
    setIsPickingStatementFile(true);

    void (async () => {
      try {
        const selectedFile = await pickBankStatementPdf();
        if (!selectedFile) return;

        setSelectedStatementFile(selectedFile);
        setUploadedFileName(null);
      } catch (error) {
        setFetchErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to select PDF statement. Please try again.'
        );
      } finally {
        setIsPickingStatementFile(false);
      }
    })();
  }, [isPickingStatementFile, uploadBankStatementMutation.isPending]);

  /** First upload attempt is without password; API can return passwordRequired/passwordInvalid to open modal. */
  const handleUploadPress = useCallback(() => {
    if (!selectedStatementFile || uploadBankStatementMutation.isPending) return;

    activeUploadRequestIdRef.current += 1;
    uploadBankStatementMutation.mutate({
      file: selectedStatementFile,
      confidentialCode: '',
      requestId: activeUploadRequestIdRef.current,
    });
  }, [selectedStatementFile, uploadBankStatementMutation]);

  /** Retry upload with PDF password after API requested/validated the PDF password. */
  const onPdfPasswordSubmit = useCallback(
    (password: string) => {
      if (!selectedStatementFile || uploadBankStatementMutation.isPending) return;
      setShowPdfPasswordModal(false);
      activeUploadRequestIdRef.current += 1;
      uploadBankStatementMutation.mutate({
        file: selectedStatementFile,
        confidentialCode: password.trim(),
        requestId: activeUploadRequestIdRef.current,
      });
    },
    [selectedStatementFile, uploadBankStatementMutation]
  );

  const onClosePdfPasswordModal = useCallback(() => {
    setShowPdfPasswordModal(false);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFetchErrorMessage('');
    setSelectedStatementFile(null);
    setUploadedFileName(null);
    setUploadProgress(0);
    clearUploadInterval();
    setShowPdfPasswordModal(false);
    setView('upload-idle');
  }, [clearUploadInterval]);

  const handleCancelUpload = useCallback(() => {
    activeUploadRequestIdRef.current += 1;
    uploadBankStatementMutation.reset();
    clearUploadInterval();
    setUploadProgress(0);
    setView('upload-idle');
  }, [clearUploadInterval, uploadBankStatementMutation]);

  const setShowOfferStatusModal = useFlowStore((s) => s.setShowOfferStatusModal);

  // ═══════════════════════════════════════
  //  OFFER / NAVIGATION
  // ═══════════════════════════════════════

  const hasOfferFromApi =
    lastOfferResponse?.success === true &&
    lastOfferResponse.data != null &&
    isCurrentOfferSuccess(lastOfferResponse.data);

  const offerLoanStatus: OfferLoanStatus | undefined = getOfferLoanStatus(
    lastOfferResponse?.success ? lastOfferResponse.data : undefined
  );

  /** Open OfferStatusModal (rendered by LoanWizard). User taps "Check Offers" there to go to ApprovedOfferStep. */
  const showOfferStatusModal = useCallback(() => {
    setCameFromOfferings(false);
    setFetchErrorMessage('');
    setIsWebViewOpen(false);
    // When offer exists but loanId.status is missing/unrecognised, default to Verified.
    const variant: 'Verified' | 'Pending' | 'Rejected' =
      offerLoanStatus === 'Pending' ? 'Pending'
        : offerLoanStatus === 'rejected' ? 'Rejected'
          : 'Verified';
    consoleLogDev('[BankConnectStep] Opening OfferStatusModal; variant:', variant);
    logJourneyOfferModalOpened(variant);
    setShowOfferStatusModal(true, variant);
  }, [setCameFromOfferings, setShowOfferStatusModal, offerLoanStatus]);

  const handleContinueWithExistingOffer = useCallback(() => {

    // This is an intentional exit from offer improvement, so future OFFERINGS syncs may navigate.
    setCameFromOfferings(false);
    const shouldSyncUserStageOnLatestOfferCta =
      bankStatementStatus === 'approved' || bankStatementStatus === 'processed';
    if (shouldSyncUserStageOnLatestOfferCta) {
      void fetchUserStage();
    }
    devLog.stepMessage(
      'bank-connect',
      'controller.existingOfferNavigation',
      'navigating from Bank Connect to Approved Offer'
    );
    consoleLogDev('[BankConnectStep] Continue with existing offer -> navigating directly to ApprovedOfferStep');
    navigateToPhaseSubstep({
      goTo,
      phase: 'offer',
      substepId: 'approved-offer',
      source: 'BankConnectStep',
    });
  }, [
    bankStatementKeyReadiness.hasBsaReport,
    bankStatementKeyReadiness.hasJson,
    bankStatementKeyReadiness.isComplete,
    bankStatementStatus,
    goTo,
    isPolling,
    setCameFromOfferings,
    view,
  ]);

  const handleBackToExistingOffer = useCallback(() => {
    showOfferStatusModal();
  }, [showOfferStatusModal]);

  const handleWebViewBankStatementSuccess = useCallback(
    (_payload: BankStatementSuccessPayload) => {
      // Always close the modal immediately when success callback is received.
      setIsWebViewOpen(false);

      if (webViewSuccessHandledRef.current) return;
      webViewSuccessHandledRef.current = true;

      setIsResolvingWebViewStatus(true);
      webViewClosePollIdRef.current += 1;
      const pollId = webViewClosePollIdRef.current;

      // AA success -> hook bounded poll -> onStatusFetched -> handleStatusChange.
      void (async () => {
        try {
          await pollUntilResolved({
            label: 'aa-webview-success',
            source: 'webview-success',
            isCancelled: () => webViewClosePollIdRef.current !== pollId,
          });
        } finally {
          if (webViewClosePollIdRef.current === pollId) {
            setIsResolvingWebViewStatus(false);
          }
        }
      })();
    },
    [pollUntilResolved]
  );

  const goToMobileView = useCallback(() => {
    setView('mobile');
  }, []);

  /** Check briefly for an asynchronous status update after the AA webview closes. */
  const closeWebView = useCallback(() => {
    setIsWebViewOpen(false);
    webViewSuccessHandledRef.current = false;
    setIsResolvingWebViewStatus(true);
    webViewClosePollIdRef.current += 1;
    const pollId = webViewClosePollIdRef.current;
    devLog.stepMessage(
      'bank-connect',
      'controller.webviewClosePoll',
      'starting bounded status polling after webview close'
    );
    // AA close -> hook bounded poll -> onStatusFetched -> handleStatusChange.
    void (async () => {
      try {
        await pollUntilResolved({
          label: 'aa-webview-close',
          source: 'webview-close',
          isCancelled: () => webViewClosePollIdRef.current !== pollId,
        });
      } finally {
        if (webViewClosePollIdRef.current === pollId) {
          setIsResolvingWebViewStatus(false);
        }
      }
    })();
  }, [pollUntilResolved]);

  /** Retry fetching bank statement by restarting polling */
  const handleRetryFetchBankStatement = useCallback(() => {
    setPollingTimedOut(false);
    setFetchErrorMessage('');
    setStatusMessage(BANK_CONNECT_STATUS_MESSAGES.processing);
    setView('bank-statement-pending');
    startApprovedPolling({ intervalMs: pollingConfig.intervalMs });
  }, [pollingConfig.intervalMs, startApprovedPolling]);

  /** Redo AA - go back to mobile view to reconnect bank */
  const handleRedoAccountAggregation = useCallback(() => {
    setPollingTimedOut(false);
    setFetchErrorMessage('');
    setView('mobile');
    setMobile('');
    setTempUrl(null);
    setIsWebViewOpen(false);
    setIsResolvingWebViewStatus(false);
    // Reset webview success handler to allow new connection
    webViewSuccessHandledRef.current = false;
  }, []);

  /** Switch to manual upload view when user has 1 AA attempt left (from pending view). */
  const handleGoToManualUpload = useCallback(() => {
    stopPolling();
    setPollingTimedOut(false);
    setFetchErrorMessage('');
    clearUploadInterval();
    setUploadProgress(0);
    setSelectedStatementFile(null);
    setUploadedFileName(null);
    setView('upload-idle');
  }, [clearUploadInterval, stopPolling]);

  // ═══════════════════════════════════════
  //  DERIVED STATE + RETURN
  // ═══════════════════════════════════════

  const resolvedView: BankConnectResolvedView = view;

  const shouldShowOfferingRetryAction =
    cameFromOfferings && fetchErrorMessage.trim().length > 0;

  // Hide the existing-offer exit during processing; using it would unmount this step and
  // stop polling before bankStatementKey contains both json and bsaReport.
  const shouldShowOfferingContinueAction =
    cameFromOfferings &&
    !(
      view === 'bank-statement-pending' &&
      (isPolling || !bankStatementKeyReadiness.isComplete)
    );

  const shouldShowOfferReadyAction =
    hasOfferFromApi &&
    !connectBankMutation.isPending &&
    !uploadBankStatementMutation.isPending;

  const isTimedOut =
    view === 'bank-statement-pending' &&
    !isPolling &&
    statusMessage === BANK_CONNECT_STATUS_MESSAGES.timedOut;

  const bankConnectChecklistItems = resolveBankConnectChecklist({
    bankStatementStatus,
    offerLoanStatus,
    isTimedOut,
  });


  const showUnderReviewOverlay =
    !isPolling &&
    isProcessedResultResolved &&
    bankStatementKeyReadiness.isComplete &&
    bankStatementStatus === 'processed' &&
    offerLoanStatus === 'Pending';

  useEffect(() => {
    if (!isPolling) return;

    // OFFER IMPROVEMENT POLLING GUARD:
    // The cached existing offer may already be Verified, but it is not the improved result.
    // Keep OfferStatusModal closed until status polling finishes with json + bsaReport.
    setShowOfferStatusModal(false);
  }, [isPolling, setShowOfferStatusModal]);

  useEffect(() => {
    // Polling stops before the refreshed offer request settles. Wait for the processed
    // handler too, otherwise the cached existing offer can flash as a false success.
    if (
      isPolling ||
      !bankStatementKeyReadiness.isComplete ||
      !isProcessedResultResolved
    ) {
      return;
    }
    if (offerLoanStatus !== 'Verified') return;
    if (bankStatementStatus !== 'processed') return;
    if (verifiedModalShownRef.current) return;
    verifiedModalShownRef.current = true;
    consoleLogDev('[BankConnectStep] Verified offer from current-offer API (processed) -> opening OfferStatusModal');
    setShowOfferStatusModal(true, 'Verified');
  }, [
    bankStatementKeyReadiness.isComplete,
    bankStatementStatus,
    isProcessedResultResolved,
    isPolling,
    offerLoanStatus,
    setShowOfferStatusModal,
  ]);

  return {
    attemptState,
    attemptsLeft,
    isAaEnabled,
    cameFromOfferings,
    fetchErrorMessage,
    handleCancelFetching,
    handleCancelUpload,
    handleBackToExistingOffer,
    handleContinueWithExistingOffer,
    handleFetchBankDetails,
    handleGoToManualUpload,
    handlePickStatementFile,
    handleRemoveFile,
    handleUploadPress,
    handleWebViewBankStatementSuccess,
    handleRetryFetchBankStatement,
    handleRedoAccountAggregation,
    isConnectPending: connectBankMutation.isPending,
    isInitialStatusLoading,
    isPolling,
    isPickingStatementFile,
    isUploadPending: uploadBankStatementMutation.isPending,
    isWebViewOpen,
    isResolvingWebViewStatus,
    mobile,
    offerLoanStatus,
    statusMessage,
    bankStatementStatus,
    bankConnectChecklistItems,
    resolvedView,
    selectedStatementFileName: selectedStatementFile?.name ?? null,
    setMobile,
    shouldShowOfferReadyAction,
    shouldShowOfferingContinueAction,
    shouldShowOfferingRetryAction,
    tempUrl,
    uploadProgress,
    uploadedFileName,
    closeWebView,
    goToMobileView,
    pollingTimedOut,
    showUnderReviewOverlay,
    showPdfPasswordModal,
    onPdfPasswordSubmit,
    onClosePdfPasswordModal,
  };
}
