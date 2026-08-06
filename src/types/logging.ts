export interface LogBatchPayload {
  sessionId: string;
  logs: string[];
}

export interface LogBatchResponse {
  success?: boolean;
  message?: string;
}

export interface LogPushResult {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  status?: number;
}
