import { useQuery } from '@tanstack/react-query';
import { userService } from './userService';
import type { GetContactDetailsResponse } from '@/src/types/kyc';
import { REACT_QUERY_KEYS } from '@/src/constants/data';

type UseUserContactDetailsOptions = {
  enabled?: boolean;
};

/**
 * React Query hook to fetch user contact details from backend (GET /user/get-contact-details).
 */
export function useUserContactDetails(options?: UseUserContactDetailsOptions) {
  const enabled = options?.enabled ?? true;

  const query = useQuery({
    queryKey: REACT_QUERY_KEYS.USER_CONTACT_DETAILS,
    queryFn: async (): Promise<GetContactDetailsResponse> => {
      const response = await userService.getContactDetails();
      if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to fetch contact details');
      }
      return response.data ?? {};
    },
    enabled,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  return query;
}
