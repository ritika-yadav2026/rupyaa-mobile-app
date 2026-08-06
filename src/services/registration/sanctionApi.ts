import { apiClient } from '@/src/services/api/apiClient';
import { API_ENDPOINTS } from '@/src/config/api';
import type { ApiResponse } from '@/src/types/api';
import { isApiResponse } from '@/src/types/api';
import type { GeoLocationEsign } from '@/src/services/location/geoLocation';

// ---------------------
// Request / response types
// ---------------------

export interface InitiateSanctionDoqfyRequest {
  geoLocationEsign?: string;
}

export interface GenerateAgreementResponse {
  message: string;
  pdfKey: string;
  status: boolean;
}

export interface ImportGoogleContactsResponse {
  message: string;
  pdfKey?: string;
  status: boolean;
}

export interface InitiateSanctionDoqfyResponse {
  success: boolean;
  email: string;
  message: string;
  invitationLink: string;
}

export interface EsignStatusResponse {
  status: string;
  [key: string]: unknown;
}

const GENERIC_API_ERROR: ApiResponse<never> = {
  success: false,
  error: {
    message: 'Something went wrong. Please try again.',
    code: 'UNKNOWN_ERROR',
  },
};

// ---------------------
// API calls
// ---------------------

/**
 * Generate loan agreement and get PDF URL (POST /loans/generate-agreement-automatic).
 * Returns pdfKey URL to open in WebView. Never throws.
 */
export async function generateAgreementAutomatic(): Promise<
  ApiResponse<GenerateAgreementResponse>
> {
  try {
    const response = await apiClient.post<GenerateAgreementResponse>(
      API_ENDPOINTS.loans.generateAgreementAutomatic
    );
    if (!isApiResponse(response)) {
      return GENERIC_API_ERROR;
    }
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Request failed';
    return {
      success: false,
      error: {
        message,
        code: 'NETWORK_ERROR',
      },
    };
  }
}

/**
 * Import Google contacts using OAuth access token (POST /auth/contacts/import-google).
 * Backend may also prepare agreement artifacts. Never throws.
 */
export async function importGoogleContacts(
  accessToken: string
): Promise<ApiResponse<ImportGoogleContactsResponse>> {
  try {
    const response = await apiClient.post<ImportGoogleContactsResponse>(
      API_ENDPOINTS.auth.importGoogleContacts,
      {
        access_token: accessToken,
      }
    );
    if (!isApiResponse(response)) {
      return GENERIC_API_ERROR;
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return {
      success: false,
      error: {
        message,
        code: 'NETWORK_ERROR',
      },
    };
  }
}

/**
 * Initiate e-sign via Doqfy (POST /sanction/initiate-sanction-doqfy).
 * Sends geoLocationEsign (latitude/longitude strings). Returns invitationLink to open in WebView. Never throws.
 */
export async function initiateSanctionDoqfy(
  geoLocationEsign: GeoLocationEsign
): Promise<ApiResponse<InitiateSanctionDoqfyResponse>> {
  try {
    const body: InitiateSanctionDoqfyRequest = {
      geoLocationEsign: `${geoLocationEsign?.latitude},${geoLocationEsign?.longitude}`,
    };
    const response = await apiClient.post<InitiateSanctionDoqfyResponse>(
      API_ENDPOINTS.sanction.initiateDoqfy,
      body
    );
    if (!isApiResponse(response)) {
      return GENERIC_API_ERROR;
    }
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Request failed';
    return {
      success: false,
      error: {
        message,
        code: 'NETWORK_ERROR',
      },
    };
  }
}

/**
 * Get e-sign status (GET /sanction/esign-status/).
 * Used for polling until status is 'Completed' or max attempts reached. Never throws.
 */
export async function getEsignStatus(): Promise<ApiResponse<EsignStatusResponse>> {
  try {
    const response = await apiClient.get<EsignStatusResponse>(
      API_ENDPOINTS.sanction.esignStatus
    );
    if (!isApiResponse(response)) {
      return GENERIC_API_ERROR;
    }
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Request failed';
    return {
      success: false,
      error: {
        message,
        code: 'NETWORK_ERROR',
      },
    };
  }
}
