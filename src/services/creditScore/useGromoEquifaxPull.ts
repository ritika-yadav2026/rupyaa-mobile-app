import { useMutation } from '@tanstack/react-query';
import { pullGromoEquifaxReport } from './gromoEquifaxService';
import { getApiErrorDisplayMessage } from '@/src/utils/common-helper';
import type { CreditScorePullRequest, CreditScorePullResponse } from '@/src/types/creditScore';

export function useGromoEquifaxPull() {
  return useMutation({
    mutationFn: async (
      payload: CreditScorePullRequest
    ): Promise<CreditScorePullResponse | undefined> => {
      const response = await pullGromoEquifaxReport(payload);
      if (!response.success) {
        const message =
          getApiErrorDisplayMessage(response.error) ||
          'Failed to fetch credit score. Please try again.';
        throw new Error(message);
      }
      return response.data;
    },
  });
}
