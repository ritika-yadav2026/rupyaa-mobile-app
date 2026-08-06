import { useQuery } from '@tanstack/react-query';
import { loanService } from './loanService';
import { getApiErrorDisplayMessage } from '@/src/utils/common-helper';
import type { GetAllUserLoansResponse } from '@/src/types/loans';
import { REACT_QUERY_KEYS } from '@/src/constants/data';

type UseAllUserLoansOptions = {
  enabled?: boolean;
};

/**
 * React Query hook to fetch all user loans from backend (GET /loans/get-all-user-loans).
 * Handles loading, error states, and automatic retries.
 * Formats error messages for user-friendly display.
 */
export function useAllUserLoans(options?: UseAllUserLoansOptions) {
  const enabled = options?.enabled ?? true;

  const query = useQuery({
    queryKey: REACT_QUERY_KEYS.ALL_USER_LOANS,
    queryFn: async (): Promise<GetAllUserLoansResponse> => {
      const response = await loanService.getAllUserLoans();
      if (!response.success) {
        // Format error message using utility for user-friendly display
        const errorMessage = getApiErrorDisplayMessage(response.error) || 'Failed to fetch user loans. Please try again.';
        throw new Error(errorMessage);
      }
      return response.data as GetAllUserLoansResponse;
    },
    enabled,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return query;
}
