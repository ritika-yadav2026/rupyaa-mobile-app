import { useQuery } from '@tanstack/react-query';
import { externalService, HyperKycAccessTokenResponse } from '../external/externalService';
import { REACT_QUERY_KEYS } from '@/src/constants/data';

/**
 * Fetch HyperKYC access token from backend API and sync with flow store.
 * Used by startup tasks and can be called directly.
 * Throws on error to allow UI handling and retries.
 */
export const fetchHyperKycAccessToken = async (): Promise<HyperKycAccessTokenResponse> => {
  try {
    const response = await externalService.getHyperKycAccessToken();
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch HyperKYC access token');
    }
    return response.data;
  } catch (error) {
    console.error('[fetchHyperKycAccessToken] Error fetching HyperKYC access token:', error);
    throw error;
  }
};


/**
 * React Query hook to fetch and sync HyperKYC access token from backend.
 * Automatically syncs with flow store when data is fetched.
 */
export function useHyperKycAccessToken(enabled = true) {
  return useQuery({
    queryKey: REACT_QUERY_KEYS.HYPERKYC_ACCESS_TOKEN,
    queryFn: fetchHyperKycAccessToken,
    enabled,
    staleTime: 0, 
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
