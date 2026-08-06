import { API_ENDPOINTS } from '@/src/config/api';
import { REACT_QUERY_KEYS } from '@/src/constants/data';
import { apiClient } from '@/src/services/api/apiClient';
import type { ApiResponse } from '@/src/types/api';
import { useQuery } from '@tanstack/react-query';

export type DigilockerInitiateRequest = {
  aadhaarNumber?: string;
};

export type DigilockerInitiateResponse = {
  verification_id: string;
  reference_id: number;
  url: string;
  status: string;
  document_requested: string[];
  user_flow: string;
  redirect_url: string;
};

export type DigilockerStatusResponse = {
  message: string;
  status: boolean;
  isAuthenticated: boolean;
  isAadhaarLinkedNumberVerified: boolean;
  shouldProceedWithFetch: boolean;
  bypassReason: string;
};

export async function initiateDigilocker(
  _payload: DigilockerInitiateRequest
): Promise<ApiResponse<DigilockerInitiateResponse>> {
  return apiClient.post<DigilockerInitiateResponse>(
    API_ENDPOINTS.external.digilockerInitiate,
    {
      // aadhaar_number: _payload.aadhaarNumber,
      aadhaar_number: ''
    }
  );
}

async function getDigilockerStatus(): Promise<ApiResponse<DigilockerStatusResponse>> {
  try {
    const response = await apiClient.post<DigilockerStatusResponse>(
      API_ENDPOINTS.external.digilockerStatus
    );
    return response;
  } catch (error) {
    // Network or unexpected failures should not block the user from restarting KYC.
    console.error('[getDigilockerStatus] Error fetching Aadhaar status:', error);
    return { success: false, error: { message: 'Failed to fetch Aadhaar status', code: 'AADHAAR_STATUS_FAILED' } };
  }
}

export function useDigilockerStatus(enabled = false) {
  return useQuery({
    queryKey: REACT_QUERY_KEYS.DIGILOCKER_STATUS,
    queryFn: getDigilockerStatus,
    staleTime: 0,
    enabled,
  });
}
