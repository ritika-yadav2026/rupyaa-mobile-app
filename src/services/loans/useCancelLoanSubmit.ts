import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '@/src/constants/data';
import { getApiErrorDisplayMessage } from '@/src/utils/common-helper';
import {
  normalizeLoanIdForCancellation,
  parseSubmitCancelLoan,
  submitCancelLoan,
} from './loanCancellationApi';

export interface UseCancelLoanSubmitResult {
  submitError: string | null;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
  reset: () => void;
}

/**
 * Submits POST /loans/:loanId/cancel and invalidates dependent queries.
 * Caller decides what to do on success (e.g. transition to a success step).
 *
 * Guards against:
 * - missing/invalid loan id (friendly inline error)
 * - duplicate submits (isSubmitting flag)
 * - stale error state on retry (cleared at start of each submit)
 */
export function useCancelLoanSubmit(
  onSubmitSuccess: () => void,
  loanId: string | null | undefined
): UseCancelLoanSubmitResult {
  const queryClient = useQueryClient();
  const normalizedLoanId = normalizeLoanIdForCancellation(loanId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = useCallback(() => {
    setSubmitError(null);
    setIsSubmitting(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) {
      return;
    }
    if (!normalizedLoanId) {
      // Defensive: caller should not open the modal without a loan id, but
      // surface a user-friendly message instead of silently failing.
      setSubmitError('Could not find your loan. Please try again later.');
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const response = await submitCancelLoan(normalizedLoanId);
      if (!response.success) {
        setSubmitError(
          getApiErrorDisplayMessage(response.error) ||
            'Could not cancel your loan. Please try again.'
        );
        return;
      }
      if (!parseSubmitCancelLoan(response.data)) {
        setSubmitError('Could not cancel your loan. Please try again.');
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['loans', 'can-cancel-loan'] }),
        queryClient.invalidateQueries({ queryKey: REACT_QUERY_KEYS.EXISTING_ACTIVE_LOAN }),
      ]);
      onSubmitSuccess();
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, normalizedLoanId, onSubmitSuccess, queryClient]);

  return {
    submitError,
    isSubmitting,
    handleSubmit,
    reset,
  };
}
