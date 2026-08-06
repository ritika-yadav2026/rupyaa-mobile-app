import { API_ENDPOINTS } from '@/src/config/api';
import { apiClient } from '@/src/services/api/apiClient';
import type { ApiResponse } from '@/src/types/api';
import { isApiResponse } from '@/src/types/api';
import type { LoanNocResponse, ParsedLoanNocResult } from '@/src/types/loans';

const GENERIC_API_ERROR: ApiResponse<never> = {
  success: false,
  error: {
    message: 'Something went wrong. Please try again.',
    code: 'UNKNOWN_ERROR',
  },
};

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeLoanId(loanId: string): string | null {
  const trimmedId = loanId?.trim();
  return trimmedId && trimmedId.length > 0 ? trimmedId : null;
}

/**
 * Extracts openable URL and user message from NOC API payload.
 * Supports `url`, `pdfKey` (when absolute http/https), and `message`.
 */
export function parseLoanNocResult(data: unknown): ParsedLoanNocResult | null {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  const record = data as Record<string, unknown>;
  const url = readNonEmptyString(record.url);
  const pdfKey = readNonEmptyString(record.pdfKey);
  const message = readNonEmptyString(record.message);

  const pdfKeyAsUrl =
    pdfKey && (pdfKey.startsWith('http://') || pdfKey.startsWith('https://'))
      ? pdfKey
      : null;

  const openUrl = url ?? pdfKeyAsUrl;
  if (!openUrl && !message) {
    return null;
  }

  return { openUrl, message };
}

/**
 * Request No Objection Certificate for a fully paid loan (POST /user/noc-request).
 * Never throws; returns ApiResponse for caller handling.
 */
export async function requestLoanNoc(
  loanId: string
): Promise<ApiResponse<LoanNocResponse>> {
  const trimmedId = normalizeLoanId(loanId);
  if (!trimmedId) {
    return {
      success: false,
      error: {
        message: 'Invalid loan. Please try again.',
        code: 'INVALID_LOAN_ID',
      },
    };
  }

  try {
    const response = await apiClient.post<LoanNocResponse>(
      API_ENDPOINTS.user.requestNoc,
      { loanId: trimmedId }
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
