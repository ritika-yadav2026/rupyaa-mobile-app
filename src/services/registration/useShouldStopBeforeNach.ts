import { useQuery } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '@/src/constants/data';
import { consoleLogDev, getApiErrorDisplayMessage } from '@/src/utils/common-helper';
import { getShouldStopBeforeNach } from './mandateApi';

type UseShouldStopBeforeNachOptions = {
  enabled?: boolean;
};

/** GET /mandates/should-stop-before-nach returns `{ shouldStop: boolean }`. Missing/invalid → block (fail closed). */
function readShouldStopFlag(data: unknown): boolean {
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    const v = (data as Record<string, unknown>).shouldStop;
    if (typeof v === 'boolean') {
      return v;
    }
  }
  return true;
}

/**
 * Fetches mandate pre-check (GET /mandates/should-stop-before-nach) for ENACH/e-sign gating.
 */
export function useShouldStopBeforeNach(options?: UseShouldStopBeforeNachOptions) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: REACT_QUERY_KEYS.SHOULD_STOP_BEFORE_NACH,
    queryFn: async (): Promise<boolean> => {
      const response = await getShouldStopBeforeNach();
      if (!response.success) {
        const errorMessage =
          getApiErrorDisplayMessage(response.error) ||
          'Could not verify mandate eligibility. Please try again.';
        consoleLogDev('[useShouldStopBeforeNach] request failed', {
          code: response.error?.code,
          message: response.error?.message,
        });
        return false;
      }
      consoleLogDev('[useShouldStopBeforeNach] response.data (raw)', response.data);
      const shouldBlock = readShouldStopFlag(response.data);
      consoleLogDev('[useShouldStopBeforeNach] shouldStop → block ENACH/e-sign', shouldBlock);
      return shouldBlock;
    },
    enabled,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
