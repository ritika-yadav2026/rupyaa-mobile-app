import { apiClient } from '@/src/services/api/apiClient';
import { API_ENDPOINTS } from '@/src/config/api';
import type { ApiResponse } from '@/src/types/api';
import type {
  CreditReportData,
  CreditScorePullRequest,
  CreditScorePullResponse,
} from '@/src/types/creditScore';

function isEnvelope(value: unknown): value is Partial<CreditScorePullResponse> & { reportAvailable: boolean } {
  return typeof value === 'object' && value !== null &&
    typeof (value as { reportAvailable?: unknown }).reportAvailable === 'boolean';
}

export async function pullGromoEquifaxReport(
  payload: CreditScorePullRequest
): Promise<ApiResponse<CreditScorePullResponse>> {
  const response = await apiClient.withoutApiVersion.post<unknown>(
    API_ENDPOINTS.external.gromoEquifaxPull,
    payload
  );
  if (!response.success) return response as ApiResponse<CreditScorePullResponse>;

  const raw = response.data;
  const topLevel = response as ApiResponse<unknown> & { reportAvailable?: boolean; pdfUrl?: string };
  let normalized: CreditScorePullResponse;
  if (isEnvelope(raw)) {
    normalized = {
      success: true,
      reportAvailable: raw.reportAvailable,
      message: raw.message ?? 'Bureau report fetched successfully',
      pdfUrl: raw.pdfUrl ?? '',
      data: raw.data ?? null,
    };
  } else {
    const report = raw && typeof raw === 'object' && 'creditScore' in raw
      ? raw as CreditReportData
      : null;
    normalized = {
      success: true,
      reportAvailable: topLevel.reportAvailable ?? report !== null,
      message: 'Bureau report fetched successfully',
      pdfUrl: topLevel.pdfUrl ?? '',
      data: report,
    };
  }
  return { ...response, data: normalized } as ApiResponse<CreditScorePullResponse>;
}
