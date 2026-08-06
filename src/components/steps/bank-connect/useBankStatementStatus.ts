import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/src/services/user/userService';
import type { ApiResponse } from '@/src/types/api';
import type { GetUserBankStatementStatusResult } from '@/src/types/user';
import { devLog } from '@/src/utils';
import { REACT_QUERY_KEYS } from '@/src/constants/data';
import { MIN_TERMINAL_STATUS_DELAY_MS } from './bankConnectContinueMessages';
import {
  pushLoanJourneyUnknownError,
} from '@/src/services/logging/logPoolJourney';

const DEFAULT_STATUS_RESOLUTION_MAX_WAIT_MS = 60000;
const DEFAULT_STATUS_RESOLUTION_INTERVAL_MS = 1000;

function logPolling(event: string, details: string): void {
  devLog.stepMessage('bank-connect', `bsaPolling.${event}`, details);
}

export type NormalizedBankStatementStatus =
  | 'pending'
  | 'in-progress'
  | 'approved'
  | 'processed'
  | 'unknown'
  | 'rejected';

export type BankStatementStatusSource =
  | 'step-entry'
  | 'webview-success'
  | 'webview-close'
  | 'manual-upload-success'
  | 'pending-poll'
  | 'processed-readiness'
  | 'attempt-refresh';

export interface BankStatementStatusEvent {
  source: BankStatementStatusSource;
  status: NormalizedBankStatementStatus;
  response: ApiResponse<GetUserBankStatementStatusResult>;
}

export interface UseBankStatementStatusOptions {
  onStatusResolved?: (event: BankStatementStatusEvent) => void;
}

function fetchBankStatementStatus(): Promise<
  ApiResponse<GetUserBankStatementStatusResult>
> {
  return userService.getUserBankStatementStatus();
}

/**
 * Normalizes raw API status into a stable union for the app.
 * Handles backend variants (e.g. "Aprroved", "IN_PROGRESS").
 */
export function normalizeBankStatementStatus(
  payload: GetUserBankStatementStatusResult | undefined
): NormalizedBankStatementStatus {
  const rawStatus = payload?.bankStatementStatus ?? payload?.status;
  if (typeof rawStatus !== 'string' || rawStatus.trim().length === 0) {
    return 'unknown';
  }

  const normalized = rawStatus.trim().toUpperCase().replace(/[\s_-]+/g, '');
  if (normalized === 'PENDING') return 'pending';
  if (normalized === 'INPROGRESS') return 'in-progress';
  if (normalized === 'APPROVED' || normalized === 'APRROVED') return 'approved';
  if (normalized === 'PROCESSED') return 'processed';
  if (normalized === 'REJECTED') return 'rejected';

  return 'unknown';
}

export function isPendingLikeBankStatementStatus(
  status: NormalizedBankStatementStatus
): boolean {
  return status === 'pending' || status === 'in-progress';
}

export type BankStatementStatusRefetchResult = {
  status: NormalizedBankStatementStatus;
  response: ApiResponse<GetUserBankStatementStatusResult> | undefined;
};

export type BankStatementResolutionPollResult =
  | { outcome: 'resolved'; status: NormalizedBankStatementStatus }
  | { outcome: 'timed-out' | 'cancelled' }
  | { outcome: 'failed'; error: unknown };

type PollBankStatementResolutionOptions = {
  label: string;
  source: Extract<
    BankStatementStatusSource,
    'webview-success' | 'webview-close' | 'manual-upload-success'
  >;
  isCancelled?: () => boolean;
  maxWaitMs?: number;
  intervalMs?: number;
};

type StartApprovedPollingOptions = {
  intervalMs: number;
};

type PollUntilCallApplyLoanOptions = {
  maxWaitMs: number;
  intervalMs: number;
};

type FetchStatusOptions = {
  notify?: boolean;
  delayTerminal?: boolean;
};

export type BankStatementKeyReadiness = {
  hasJson: boolean;
  hasBsaReport: boolean;
  isComplete: boolean;
};

/** Processed is complete only after both backend-generated BSA artifacts are available. */
export function getBankStatementKeyReadiness(
  payload: GetUserBankStatementStatusResult | undefined
): BankStatementKeyReadiness {
  const hasJson = Boolean(payload?.bankStatementKey?.json);
  const hasBsaReport = Boolean(payload?.bankStatementKey?.bsaReport);
  return {
    hasJson,
    hasBsaReport,
    isComplete: hasJson && hasBsaReport,
  };
}

/** Approved is the only state owned by the long-running status loop. */
function shouldStopPolling(
  status: NormalizedBankStatementStatus,
  response: ApiResponse<GetUserBankStatementStatusResult> | undefined
): boolean {
  if (status === 'approved') return false;
  const readiness = getBankStatementKeyReadiness(
    response?.success ? response.data : undefined
  );
  if (status === 'processed' && !readiness.isComplete) return false;
  return true;
}

export interface UseBankStatementStatusResult {
  /** Current normalized status from the last successful fetch. Use for read-only UI. */
  bankStatementStatus: NormalizedBankStatementStatus | undefined;
  /** Raw API response. Use when you need full payload (e.g. message, callApplyLoan). */
  bankStatementResponse: ApiResponse<GetUserBankStatementStatusResult> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  isPolling: boolean;
  /**
   * Fetches status and notifies onStatusResolved with the given source.
   * Returns status and response so callers can check terminal status and bankStatementKey.
   */
  refetchWithSource: (
    source: BankStatementStatusSource
  ) => Promise<BankStatementStatusRefetchResult>;
  refreshStatus: () => Promise<BankStatementStatusRefetchResult>;
  pollUntilResolved: (
    options: PollBankStatementResolutionOptions
  ) => Promise<BankStatementResolutionPollResult>;
  startApprovedPolling: (options: StartApprovedPollingOptions) => void;
  stopPolling: (reason?: string) => void;
  pollUntilCallApplyLoan: (
    options: PollUntilCallApplyLoanOptions
  ) => Promise<boolean>;
}

/**
 * Fetches and exposes bank statement status via React Query.
 * Status is only fetched when refetchWithSource is called (e.g. step-entry, pending-poll).
 * Use bankStatementStatus for conditional UI; use bankStatementResponse when you need the full API shape.
 */
function isTerminalStatus(
  status: NormalizedBankStatementStatus,
  payload: GetUserBankStatementStatusResult | undefined
): boolean {
  if (status === 'rejected') return true;
  if (status !== 'processed') return false;
  return getBankStatementKeyReadiness(payload).isComplete;
}

export function useBankStatementStatus(
  options: UseBankStatementStatusOptions = {}
): UseBankStatementStatusResult {
  const { onStatusResolved } = options;
  const queryClient = useQueryClient();
  // Poll loops read the latest handler without restarting when the controller re-renders.
  const onStatusResolvedRef = useRef(onStatusResolved);
  const approvedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const approvedRunIdRef = useRef(0);
  const approvedInFlightRef = useRef(false);
  const approvedActiveRef = useRef(false);
  const activePollCountRef = useRef(0);
  const mountedRef = useRef(true);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    onStatusResolvedRef.current = onStatusResolved;
  }, [onStatusResolved]);

  const query = useQuery({
    queryKey: REACT_QUERY_KEYS.BANK_STATEMENT_STATUS,
    queryFn: fetchBankStatementStatus,
    enabled: false,
    staleTime: 0,
  });

  const bankStatementResponse = query.data;
  const bankStatementStatus =
    bankStatementResponse && bankStatementResponse.success
      ? normalizeBankStatementStatus(bankStatementResponse.data)
      : undefined;

  const setPollActive = useCallback((active: boolean) => {
    activePollCountRef.current = Math.max(
      0,
      activePollCountRef.current + (active ? 1 : -1)
    );
    if (mountedRef.current) {
      setIsPolling(activePollCountRef.current > 0);
    }
  }, []);

  /** Every status read passes here so normalization and cache updates cannot diverge. */
  const fetchWithSource = useCallback(
    async (
      source: BankStatementStatusSource,
      fetchOptions: FetchStatusOptions = {}
    ): Promise<BankStatementStatusRefetchResult> => {
      const startedAt = Date.now();
      const response = await fetchBankStatementStatus();
      const status =
        response && response.success
          ? normalizeBankStatementStatus(response.data)
          : 'unknown';

      logPolling(
        'fetchResult',
        `source=${source}, status=${status}, success=${response.success}, elapsedMs=${Date.now() - startedAt}`
      );

      const elapsed = Date.now() - startedAt;
      // Skip delay for manual-upload-success so we proceed to apply-loan as soon as status is ready.
      const shouldDelayTerminal =
        fetchOptions.delayTerminal !== false &&
        source !== 'step-entry' &&
        source !== 'manual-upload-success' &&
        isTerminalStatus(status, response.success ? response.data : undefined) &&
        elapsed < MIN_TERMINAL_STATUS_DELAY_MS;
      if (shouldDelayTerminal) {
        const delayMs = MIN_TERMINAL_STATUS_DELAY_MS - elapsed;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      // All status reads, including internal readiness checks, update one client snapshot.
      queryClient.setQueryData(REACT_QUERY_KEYS.BANK_STATEMENT_STATUS, response);

      if (response && fetchOptions.notify !== false) {
        logPolling('notifyController', `source=${source}, status=${status}`);
        onStatusResolvedRef.current?.({
          source,
          status,
          response,
        });
      }

      return { status, response };
    },
    [queryClient]
  );

  const refetchWithSource = useCallback(
    (source: BankStatementStatusSource) => fetchWithSource(source),
    [fetchWithSource]
  );

  const refreshStatus = useCallback(
    () =>
      fetchWithSource('attempt-refresh', {
        notify: false,
        delayTerminal: false,
      }),
    [fetchWithSource]
  );

  const stopPolling = useCallback((reason = 'controller-request') => {
    logPolling(
      'approvedStop',
      `reason=${reason}, active=${approvedActiveRef.current}`
    );
    approvedRunIdRef.current += 1;
    if (approvedTimerRef.current) {
      clearTimeout(approvedTimerRef.current);
      approvedTimerRef.current = null;
    }
    approvedInFlightRef.current = false;
    if (approvedActiveRef.current) {
      approvedActiveRef.current = false;
      setPollActive(false);
    }
  }, [setPollActive]);

  const startApprovedPolling = useCallback(
    ({ intervalMs }: StartApprovedPollingOptions) => {
      if (approvedTimerRef.current || approvedInFlightRef.current) {
        logPolling('approvedStartSkipped', 'reason=already-running');
        return;
      }

      const runId = approvedRunIdRef.current + 1;
      approvedRunIdRef.current = runId;
      approvedActiveRef.current = true;
      setPollActive(true);
      logPolling('approvedStart', `runId=${runId}, intervalMs=${intervalMs}`);

      const tick = async () => {
        if (approvedRunIdRef.current !== runId || approvedInFlightRef.current) {
          logPolling('approvedTickSkipped', `runId=${runId}, reason=stale-or-in-flight`);
          return;
        }
        approvedInFlightRef.current = true;
        try {
          const result = await fetchWithSource('pending-poll');
          const readiness = getBankStatementKeyReadiness(
            result.response?.success ? result.response.data : undefined
          );
          logPolling(
            'approvedTickResult',
            `runId=${runId}, status=${result.status}, hasJson=${readiness.hasJson}, hasBsaReport=${readiness.hasBsaReport}, isComplete=${readiness.isComplete}`
          );
          if (
            approvedRunIdRef.current !== runId ||
            shouldStopPolling(result.status, result.response)
          ) {
            stopPolling(
              `status=${result.status}, bankStatementKeyComplete=${readiness.isComplete}`
            );
            return;
          }
        } finally {
          approvedInFlightRef.current = false;
        }

        // Schedule after the request settles instead of using setInterval, preventing overlap.
        if (approvedRunIdRef.current === runId) {
          logPolling('approvedNextTick', `runId=${runId}, delayMs=${intervalMs}`);
          approvedTimerRef.current = setTimeout(() => {
            approvedTimerRef.current = null;
            void tick();
          }, intervalMs);
        }
      };

      void tick();
    },
    [fetchWithSource, setPollActive, stopPolling]
  );

  const pollUntilResolved = useCallback(
    async ({
      label,
      source,
      isCancelled = () => false,
      maxWaitMs = DEFAULT_STATUS_RESOLUTION_MAX_WAIT_MS,
      intervalMs = DEFAULT_STATUS_RESOLUTION_INTERVAL_MS,
    }: PollBankStatementResolutionOptions): Promise<BankStatementResolutionPollResult> => {
      const startedAt = Date.now();
      const deadline = startedAt + maxWaitMs;
      let attempt = 0;
      const logPoll = (event: string, details: string) =>
        logPolling(`resolution.${label}.${event}`, details);

      setPollActive(true);
      logPoll('start', `maxWaitMs=${maxWaitMs}, intervalMs=${intervalMs}`);
      try {
        while (mountedRef.current && !isCancelled()) {
          if (Date.now() >= deadline) {
            logPoll('outcome', `timed-out, attempts=${attempt}`);
            pushLoanJourneyUnknownError(
              'bank connect status poll',
              new Error(`timed-out label=${label} attempts=${attempt}`)
            );
            return { outcome: 'timed-out' };
          }
          attempt += 1;
          const { status } = await fetchWithSource(source);
          logPoll('attempt', `count=${attempt}, source=${source}, status=${status}`);
          if (status === 'unknown') {
            logPoll('outcome', `failed, reason=unknown-status, attempts=${attempt}`);
            pushLoanJourneyUnknownError(
              'bank connect status poll',
              new Error(`unknown-status label=${label} attempts=${attempt}`)
            );
            return {
              outcome: 'failed',
              error: new Error('Bank statement status could not be resolved'),
            };
          }
          if (!isPendingLikeBankStatementStatus(status)) {
            logPoll('outcome', `resolved, status=${status}, attempts=${attempt}`);
            return { outcome: 'resolved', status };
          }

          const remainingMs = deadline - Date.now();
          if (remainingMs <= 0) {
            logPoll('outcome', `timed-out, attempts=${attempt}`);
            pushLoanJourneyUnknownError(
              'bank connect status poll',
              new Error(`timed-out label=${label} attempts=${attempt}`)
            );
            return { outcome: 'timed-out' };
          }
          const nextAttemptAt = startedAt + attempt * intervalMs;
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              Math.min(Math.max(0, nextAttemptAt - Date.now()), remainingMs)
            )
          );
        }
        logPoll('outcome', `cancelled, attempts=${attempt}`);
        return { outcome: 'cancelled' };
      } catch (error) {
        logPoll('outcome', `failed, reason=request-error, attempts=${attempt}`);
        pushLoanJourneyUnknownError('bank connect status poll', error);
        return { outcome: 'failed', error };
      } finally {
        logPoll('stop', `attempts=${attempt}, elapsedMs=${Date.now() - startedAt}`);
        setPollActive(false);
      }
    },
    [fetchWithSource, setPollActive]
  );

  const pollUntilCallApplyLoan = useCallback(
    async ({ maxWaitMs, intervalMs }: PollUntilCallApplyLoanOptions) => {
      const deadline = Date.now() + maxWaitMs;
      let attempt = 0;
      setPollActive(true);
      logPolling(
        'callApplyLoan.start',
        `maxWaitMs=${maxWaitMs}, intervalMs=${intervalMs}`
      );
      try {
        while (mountedRef.current && Date.now() < deadline) {
          attempt += 1;
          const { response } = await fetchWithSource('processed-readiness', {
            // This is readiness polling inside the processed handler; notifying would recurse.
            notify: false,
            delayTerminal: false,
          });
          const isReady =
            response?.success === true && response.data?.callApplyLoan === true;
          logPolling(
            'callApplyLoan.attempt',
            `count=${attempt}, ready=${isReady}`
          );
          if (isReady) {
            logPolling('callApplyLoan.outcome', `ready, attempts=${attempt}`);
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
        logPolling('callApplyLoan.outcome', `timed-out-or-cancelled, attempts=${attempt}`);
        return false;
      } finally {
        setPollActive(false);
      }
    },
    [fetchWithSource, setPollActive]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      approvedRunIdRef.current += 1;
      if (approvedTimerRef.current) clearTimeout(approvedTimerRef.current);
    };
  }, []);

  return {
    bankStatementStatus,
    bankStatementResponse,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error instanceof Error ? query.error : null,
    isPolling,
    refetchWithSource,
    refreshStatus,
    pollUntilResolved,
    startApprovedPolling,
    stopPolling,
    pollUntilCallApplyLoan,
  };
}
