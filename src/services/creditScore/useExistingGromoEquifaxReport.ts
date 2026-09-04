import { useQuery } from '@tanstack/react-query';
import { pullGromoEquifaxReport } from './gromoEquifaxService';
import type { CreditScorePullResponse } from '@/src/types/creditScore';

export const EXISTING_GROMO_EQUIFAX_REPORT_QUERY_KEY = [
  'credit-score', 'gromo-equifax', 'existing',
] as const;

export function useExistingGromoEquifaxReport() {
  return useQuery<CreditScorePullResponse | null>({
    queryKey: EXISTING_GROMO_EQUIFAX_REPORT_QUERY_KEY,
    queryFn: async () => {
      const response = await pullGromoEquifaxReport({ checkOnly: true });
      return response.success && response.data?.reportAvailable && response.data.data
        ? response.data
        : null;
    },
    staleTime: 0,
    retry: false,
    refetchOnMount: 'always',
  });
}
