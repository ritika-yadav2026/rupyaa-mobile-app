import { API_ENDPOINTS } from '@/src/config/api';
import { apiClient } from '@/src/services/api/apiClient';
import type { ApiResponse } from '@/src/types/api';
import { isApiResponse } from '@/src/types/api';
import type { GetExistingActiveLoanResponse } from '@/src/types/loans';

export interface CanCancelLoanResponse {
  canCancel: boolean;
}

export interface SubmitCancelLoanResponse {
  success: boolean;
  message?: string;
}

const GENERIC_API_ERROR: ApiResponse<never> = {
  success: false,
  error: {
    message: 'Something went wrong. Please try again.',
    code: 'UNKNOWN_ERROR',
  },
};

const INVALID_LOAN_ID_ERROR: ApiResponse<never> = {
  success: false,
  error: {
    message: 'Could not find your loan. Please try again later.',
    code: 'INVALID_LOAN_ID',
  },
};

export function normalizeLoanIdForCancellation(loanId: string | null | undefined): string | null {
  const trimmed = loanId?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

/** Loan id from GET /loans/active (`useGetExistingActiveLoan`). */
export function getLoanIdFromActiveLoanResponse(
  data: GetExistingActiveLoanResponse | null | undefined
): string | null {
  if (data?.loan == null) {
    return null;
  }
  return normalizeLoanIdForCancellation(data.loan._id);
}

/** Cancel eligibility from GET /loans/active `canCancel` field (fail closed when missing). */
export function getCanCancelFromActiveLoanResponse(
  data: GetExistingActiveLoanResponse | null | undefined
): boolean {
  // API may return boolean or string; parse defensively without widening the DTO type.
  const value: unknown = data?.canCancel;
  if (value === true) {
    return true;
  }
  if (typeof value === 'string' && value.trim().toLowerCase() === 'true') {
    return true;
  }
  return false;
}

function buildLoanPath(template: string, loanId: string): string {
  return template.replace(':loanId', encodeURIComponent(loanId));
}

function readCanCancelFlag(data: unknown): boolean {
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    const value = (data as Record<string, unknown>).canCancel;
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return false;
}

function readCancelSuccessFlag(data: unknown): boolean {
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    if (typeof record.success === 'boolean') {
      return record.success;
    }
    // Legacy shape support
    if (typeof record.cancelled === 'boolean') {
      return record.cancelled;
    }
  }
  return false;
}

/** Validates API payload; fail closed when shape is unexpected. */
export function parseCanCancelLoan(data: unknown): boolean {
  return readCanCancelFlag(data);
}

/** True when POST /loans/:loanId/cancel body reports success. */
export function parseSubmitCancelLoan(data: unknown): boolean {
  return readCancelSuccessFlag(data);
}

/**
 * GET /loans/:loanId/cancel-eligibility
 */
export async function getCanCancelLoan(
  loanId: string
): Promise<ApiResponse<CanCancelLoanResponse>> {
  const normalizedId = normalizeLoanIdForCancellation(loanId);
  if (!normalizedId) {
    return { success: true, data: { canCancel: false } };
  }

  try {
    const response = await apiClient.get<CanCancelLoanResponse>(
      buildLoanPath(API_ENDPOINTS.loans.cancelEligibility, normalizedId)
    );
    if (!isApiResponse(response)) {
      return { success: true, data: { canCancel: false } };
    }
    if (!response.success) {
      return { success: true, data: { canCancel: false } };
    }
    return {
      success: true,
      data: { canCancel: parseCanCancelLoan(response.data) },
    };
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
 * POST /loans/:loanId/cancel
 */
export async function submitCancelLoan(
  loanId: string
): Promise<ApiResponse<SubmitCancelLoanResponse>> {
  const normalizedId = normalizeLoanIdForCancellation(loanId);
  if (!normalizedId) {
    return INVALID_LOAN_ID_ERROR;
  }

  try {
    const response = await apiClient.post<SubmitCancelLoanResponse>(
      buildLoanPath(API_ENDPOINTS.loans.cancelLoan, normalizedId),
      {}
    );
    if (!isApiResponse(response)) {
      return GENERIC_API_ERROR;
    }
    if (!response.success) {
      return response;
    }
    const body = response.data;
    const isCancelled = parseSubmitCancelLoan(body);
    if (!isCancelled) {
      return GENERIC_API_ERROR;
    }
    return {
      success: true,
      data:
        body !== null && typeof body === 'object' && !Array.isArray(body)
          ? (body as SubmitCancelLoanResponse)
          : { success: true },
    };
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
