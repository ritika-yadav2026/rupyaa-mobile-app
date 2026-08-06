import { API_ENDPOINTS } from '@/src/config/api';
import { apiClient } from '@/src/services/api/apiClient';
import type { LogBatchPayload, LogBatchResponse, LogPushResult } from '@/src/types/logging';
import { getOrCreateDeviceId } from '@/src/utils/deviceId-helper';
import { consoleLogDev } from '@/src/utils/consoleLogDev';

const isValidLogLine = (line: string): boolean => line.trim().length > 0;

/**
 * Upload a batch of client log lines to POST /app/logs (or mock when useMockApi is on).
 * Requires auth token when user is logged in.
 */
export async function pushLogsToServer(logs: string[]): Promise<LogPushResult> {
  if (logs.length === 0) {
    return { success: true };
  }

  const validLogs = logs.filter(isValidLogLine);
  if (validLogs.length === 0) {
    return {
      success: false,
      errorCode: 'INVALID_LOG_BATCH',
      errorMessage: 'No valid log lines in batch',
    };
  }

  const sessionId = await getOrCreateDeviceId();
  const payload: LogBatchPayload = {
    sessionId,
    logs: validLogs,
  };

  consoleLogDev('[logPool] calling API', {
    method: 'POST',
    path: API_ENDPOINTS.app.logs,
    sessionId: payload.sessionId,
    logs: payload.logs,
  });

  try {
    const response = await apiClient.post<LogBatchResponse>(
      API_ENDPOINTS.app.logs,
      payload
    );

    if (!response.success) {
      return {
        success: false,
        errorCode: response.error?.code,
        errorMessage: response.error?.message,
        status: response.status,
      };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Log batch upload failed';
    return {
      success: false,
      errorCode: 'LOG_BATCH_UPLOAD_FAILED',
      errorMessage: message,
    };
  }
}
