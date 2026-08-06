import { apiClient } from '@/src/services/api/apiClient';
import { API_ENDPOINTS, GROMO_EQUIFAX_API_KEY } from '@/src/config/api';
import type { ApiResponse } from '@/src/types/api';
import type { CreditScorePullRequest, CreditScorePullResponse } from '@/src/types/creditScore';

/**
 * Pulls an Equifax credit report via the Gromo/WeCredit partner route.
 * Authenticated with a static partner `api-key` header (in addition to the normal session auth).
 */
export const pullGromoEquifaxReport = async (
  payload: CreditScorePullRequest
): Promise<ApiResponse<CreditScorePullResponse>> => {
  return apiClient.withoutApiVersion.post<CreditScorePullResponse>(
    API_ENDPOINTS.external.gromoEquifaxPull,
    payload,
    { headers: { 'api-key': GROMO_EQUIFAX_API_KEY } }
  );
};
