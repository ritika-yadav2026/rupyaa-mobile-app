export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
  status?: number;
};

export type ApiError = {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
  status?: number;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isApiSuccess = (value: unknown): value is ApiSuccess<unknown> => {
  if (!isRecord(value)) return false;
  return value.success === true && 'data' in value;
};

export const isApiError = (value: unknown): value is ApiError => {
  if (!isRecord(value)) return false;
  if (value.success !== false) return false;
  const error = value.error;
  return isRecord(error) && typeof error.message === 'string';
};

export const isApiResponse = (value: unknown): value is ApiResponse<unknown> =>
  isApiSuccess(value) || isApiError(value);
