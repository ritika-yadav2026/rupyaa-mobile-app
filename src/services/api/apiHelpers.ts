import { apiConfig, apiHeaders } from '@/src/config/api';
import { devConfig } from '@/src/config/dev';
import { addApiDebugEntry } from '@/src/services/devDebug/apiDebugStore';
import { useAuthStore } from '@/src/store/useAuthStore';
import type { ApiResponse } from '@/src/types/api';
import { isApiResponse } from '@/src/types/api';
import { devLog } from '@/src/utils/devLogger';
import { canMockRequest, mockApiRequest } from './mockApi';
import { getOrCreateDeviceId } from '@/src/utils/deviceId-helper';
import { getCachedGeoLocationString } from '@/src/services/location/geoLocation';
import { UserEligibilityExperianResponse } from '@/src/types/user';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const getAccessToken = async () => useAuthStore.getState().accessToken;

/**
 * Determine if mock should be skipped for a given path.
 * Only skip external URLs (http/https) which should always use real API.
 * When useMockApi is true, all internal paths should use mocks.
 */
const shouldSkipMock = (path: string) => {
  // External URLs should always use real API
  if (path.startsWith('http://') || path.startsWith('https://')) return true;
  // When mock API is enabled, don't skip any internal paths
  return false;
};

type BuildUrlOptions = {
  skipApiVersion?: boolean;
};

const stripApiVersion = (baseUrl: string) => baseUrl.replace(/\/api\/v\d+$/i, '');

export const buildUrl = (path: string, options: BuildUrlOptions = {}) => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalizedBase = apiConfig.baseUrl?.replace(/\/$/, '');
  const base = options.skipApiVersion ? stripApiVersion(normalizedBase) : normalizedBase;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
};

export const parseResponseBody = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const withStatus = <T>(payload: ApiResponse<T>, status?: number): ApiResponse<T> => ({
  ...payload,
  status: status ?? payload.status,
});

const recordDebug = (
  method: ApiMethod,
  path: string,
  ok: boolean,
  response: ApiResponse<unknown> | unknown,
  status?: number,
  durationMs?: number
) => {
  if (!devConfig.enableApiDebug) return;
  const sanitized = devLog.sanitizeApiPayload(response);
  addApiDebugEntry({
    method,
    path,
    status,
    durationMs,
    ok,
    response: sanitized,
  });
};

/**
 * Handle mock API request flow.
 * Returns ApiResponse if mock should be used, null otherwise.
 */
export const handleMockRequest = async <T>(
  method: ApiMethod,
  path: string,
  body: unknown,
  requestKey: string
): Promise<ApiResponse<T> | null> => {
  if (!apiConfig.useMockApi || shouldSkipMock(path)) return null;

  if (!canMockRequest(method, path)) {
    const response: ApiResponse<T> = {
      success: false,
      error: {
        message: `No mock available for ${requestKey}`,
        code: 'MOCK_NOT_FOUND',
      },
    };
    devLog.apiResponseOnce(requestKey, response);
    recordDebug(method, path, false, response);
    return response;
  }

  const mockResponse = await mockApiRequest<T>({ method, path, body });
  const result = withStatus(mockResponse, mockResponse.status ?? 200);
  devLog.apiResponseOnce(requestKey, result);
  recordDebug(method, path, result.success, result, result.status);
  return result;
};

/**
 * Build request headers including auth token if not skipped.
 */
export const buildRequestHeaders = async (
  baseHeaders: Record<string, string> | undefined,
  skipAuth: boolean
): Promise<Record<string, string>> => {
  const [deviceId, geoLocationStr] = await Promise.all([
    getOrCreateDeviceId(),
    getCachedGeoLocationString(),
  ]);
  const headers: Record<string, string> = {
    'X-Device-Id': deviceId,
    'X-Geo-Location': geoLocationStr,
    ...apiHeaders.getCommon(),
    ...(baseHeaders ?? {}),
  };

  if (devConfig.enableDebugLogs) {
    console.log('[API] buildRequestHeaders X-Geo-Location ->', geoLocationStr);
  }

  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) {
      headers.Authorization = `${token}`;
    }
  }

  return headers;
};

/**
 * Create abort controller with timeout and external signal support.
 */
export const createAbortController = (timeoutMs: number, externalSignal?: AbortSignal) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort());
  }

  return { controller, timeoutId };
};

/**
 * Transform raw response into standardized ApiResponse format.
 */
export const transformResponse = <T>(rawBody: unknown, response: Response): ApiResponse<T> => {
  const status = response.status;

  if (isApiResponse(rawBody)) {
    return withStatus(rawBody as ApiResponse<T>, status);
  }

  if (response.ok) {
    return {
      success: true,
      data: rawBody as T,
      status,
    };
  }

  return {
    success: false,
    error: {
      message: response.statusText || 'Request failed',
      details: rawBody,
    },
    status,
  };
};

/**
 * Create error response from caught exception.
 */
export const createErrorResponse = <T>(error: unknown): ApiResponse<T> => {
  const isAbortError =
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'AbortError';

  const message = isAbortError
    ? 'Request timed out'
    : error instanceof Error
      ? error.message
      : 'Request failed';

  return {
    success: false,
    error: {
      message,
      code: isAbortError ? 'TIMEOUT' : 'NETWORK_ERROR',
    },
  };
};

export const recordApiDebug = recordDebug;


export const checkEligibilityStatue = (eligibility: UserEligibilityExperianResponse): string | boolean => {
  if (eligibility.status) {
    return eligibility.status?.toLowerCase?.() ?? '';
  }
  return true;
}
