import { useQuery } from '@tanstack/react-query';
import { consoleLogDev, getApiErrorDisplayMessage } from '@/src/utils/common-helper';
import { getCanCancelLoan, normalizeLoanIdForCancellation, parseCanCancelLoan } from './loanCancellationApi';

type UseCanCancelLoanOptions = {
  loanId: string | null | undefined;
  enabled?: boolean;
};

function canCancelLoanQueryKey(loanId: string) {
  return ['loans', 'can-cancel-loan', loanId] as const;
}

/**
 * GET /loans/:loanId/cancel-eligibility — whether loan cancellation is allowed.
 * Requires loanId; missing/invalid/error → false (fail closed, hide notice).
 */
export function useCanCancelLoan(options: UseCanCancelLoanOptions) {
  const normalizedId = normalizeLoanIdForCancellation(options.loanId);
  const enabled = (options.enabled ?? true) && normalizedId != null;

  return useQuery({
    queryKey: normalizedId != null ? canCancelLoanQueryKey(normalizedId) : ['loans', 'can-cancel-loan', 'none'],
    queryFn: async (): Promise<boolean> => {
      if (!normalizedId) {
        return false;
      }
      const response = await getCanCancelLoan(normalizedId);
      if (!response.success) {
        consoleLogDev('[useCanCancelLoan] request failed', {
          loanId: normalizedId,
          code: response.error?.code,
          message: getApiErrorDisplayMessage(response.error),
        });
        return false;
      }
      return parseCanCancelLoan(response.data);
    },
    enabled,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
