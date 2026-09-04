import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pullGromoEquifaxReport } from './gromoEquifaxService';
import { EXISTING_GROMO_EQUIFAX_REPORT_QUERY_KEY } from './useExistingGromoEquifaxReport';
import { getApiErrorDisplayMessage } from '@/src/utils/common-helper';
import type { CreditScorePullRequest, CreditScorePullResponse } from '@/src/types/creditScore';

export function useGromoEquifaxPull() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreditScorePullRequest): Promise<CreditScorePullResponse> => {
      const response = await pullGromoEquifaxReport(payload);
      if (!response.success) {
        throw new Error(getApiErrorDisplayMessage(response.error) || 'Failed to fetch credit score. Please try again.');
      }
      if (!response.data) throw new Error('Failed to fetch credit score. Please try again.');
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(
        EXISTING_GROMO_EQUIFAX_REPORT_QUERY_KEY,
        result.reportAvailable && result.data ? result : null
      );
    },
  });
}
