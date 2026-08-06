import { useQuery } from '@tanstack/react-query';
import { externalService, type AdhaarImageResponse } from '../external/externalService';
import { REACT_QUERY_KEYS } from '@/src/constants/data';

/**
 * Fetch Aadhaar image from backend API.
 * Returns undefined on error to allow fallback behavior.
 */
export const fetchAdhaarImage = async (): Promise<AdhaarImageResponse | undefined> => {
  try {
    const response = await externalService.getAdhaarImage();
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch Aadhaar image');
    }
    if (!response.data?.success) {
      throw new Error('Aadhaar image response not successful');
    }
    return response.data;
  } catch (error) {
    console.error('[fetchAdhaarImage] Error fetching Aadhaar image:', error);
    return undefined;
  }
};

/**
 * React Query hook to fetch Aadhaar image from backend.
 */
export function useAdhaarImage(enabled = true) {
  return useQuery({
    queryKey: REACT_QUERY_KEYS.ADHAAR_IMAGE,
    queryFn: fetchAdhaarImage,
    enabled,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
